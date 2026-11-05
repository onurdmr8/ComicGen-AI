import { GoogleGenAI, Type, Schema, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { 
  ComicConfig, 
  ComicPanelData, 
  Character, 
  LocationItem, 
  PanelDirectorConfig, 
  NarrativeContinuityMemory, 
  NarrativeMemoryItem, 
  CharacterStyleSheet,
  CharacterStyleSheetRef,
  CharacterOutfit,
  CharacterRelationship,
  COMIC_ART_STYLES
} from "../types";
import { isNameMatch, isCharacterMentioned, normalizeTurkish, POSITION_SLOTS } from "../lib/utils";
import { formatRelationshipForPrompt } from "../lib/relationshipPresets";
import { AsyncLocalStorage } from "async_hooks";

export const geminiRequestContext = new AsyncLocalStorage<{ 
  apiKey?: string; 
  togetherApiKey?: string; 
  falApiKey?: string;
  pollinationsApiKey?: string;
}>();

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  const store = geminiRequestContext.getStore();
  if (store?.apiKey && store.apiKey.trim().length > 5) {
    return new GoogleGenAI({ apiKey: store.apiKey.trim() });
  }

  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Lütfen kendi Google Gemini API anahtarınızı tanımlayın.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export function getAIOrNull(): GoogleGenAI | null {
  try {
    return getAI();
  } catch {
    return null;
  }
}

export function getFalApiKey(): string {
  const store = geminiRequestContext.getStore();
  if (store?.falApiKey && store.falApiKey.trim().length > 5) {
    return store.falApiKey.trim();
  }
  return process.env.FAL_KEY?.trim() || process.env.FAL_API_KEY?.trim() || "";
}

export async function validateFalApiKey(testKey?: string): Promise<{ valid: boolean; message: string }> {
  const keyToTest = testKey?.trim() || getFalApiKey();
  if (!keyToTest) {
    return { valid: false, message: "Herhangi bir fal.ai API anahtarı sağlanmadı." };
  }
  try {
    const authHeader = keyToTest.startsWith("Key ") ? keyToTest : `Key ${keyToTest}`;
    const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "User-Agent": "ComicGen-AI/1.0"
      },
      body: JSON.stringify({
        prompt: "comic book art panel test ping",
        image_size: { width: 512, height: 512 },
        num_inference_steps: 1,
        num_images: 1,
        enable_safety_checker: false
      })
    });
    if (res.ok) {
      return { valid: true, message: "fal.ai API Anahtarı geçerli ve başarıyla bağlandı! (FLUX.1 modelleri hazır)" };
    }
    if (res.status === 401 || res.status === 403) {
      return { valid: false, message: "Geçersiz fal.ai API Anahtarı! Lütfen fal.ai dashboard'undan aldığınız anahtarı kontrol edin." };
    }
    const errBody = await res.json().catch(() => ({}));
    return { valid: false, message: `fal.ai bağlantı hatası (${res.status}): ${errBody?.detail || errBody?.message || res.statusText}` };
  } catch (err: any) {
    return { valid: false, message: `Bağlantı hatası: ${err?.message || err}` };
  }
}

export function getTogetherApiKey(): string {
  const store = geminiRequestContext.getStore();
  if (store?.togetherApiKey && store.togetherApiKey.trim().length > 5) {
    return store.togetherApiKey.trim();
  }
  return process.env.TOGETHER_API_KEY?.trim() || "";
}

export async function validateTogetherApiKey(testKey?: string): Promise<{ valid: boolean; message: string }> {
  const keyToTest = testKey?.trim() || getTogetherApiKey();
  if (!keyToTest) {
    return { valid: false, message: "Herhangi bir Together AI API anahtarı sağlanmadı." };
  }
  try {
    const res = await fetch("https://api.together.xyz/v1/models", {
      headers: {
        Authorization: `Bearer ${keyToTest}`,
        "User-Agent": "ComicGen-AI/1.0"
      }
    });
    if (res.ok) {
      return { valid: true, message: "Together AI API Anahtarı geçerli ve başarıyla bağlandı! (FLUX.1 modelleri hazır)" };
    }
    if (res.status === 401) {
      return { valid: false, message: "Geçersiz Together AI API Anahtarı! Lütfen together.ai üzerinden kopyaladığınız anahtarı kontrol edin." };
    }
    return { valid: false, message: `Together AI bağlantı hatası (HTTP ${res.status}).` };
  } catch (err: any) {
    return { valid: false, message: `Bağlantı hatası: ${err?.message || err}` };
  }
}

export function getPollinationsApiKey(): string {
  const store = geminiRequestContext.getStore();
  if (store?.pollinationsApiKey && store.pollinationsApiKey.trim().length > 3) {
    return store.pollinationsApiKey.trim();
  }
  return process.env.POLLINATIONS_API_KEY?.trim() || "";
}

export async function validatePollinationsApiKey(testKey?: string): Promise<{ valid: boolean; message: string }> {
  const keyToTest = testKey?.trim() || getPollinationsApiKey();
  if (!keyToTest) {
    return { valid: true, message: "Pollinations.ai anahtarsız ücretsiz modda çalışıyor (Anahtar opsiyoneldir)." };
  }
  try {
    const res = await fetch("https://gen.pollinations.ai/models", {
      headers: {
        Authorization: `Bearer ${keyToTest}`,
        "User-Agent": "ComicGen-AI/1.0"
      }
    });
    if (res.ok) {
      return { valid: true, message: "Pollinations.ai Gen API Anahtarı geçerli ve başarıyla bağlandı! (Öncelikli FLUX hazır)" };
    }
    if (res.status === 401 || res.status === 403) {
      return { valid: false, message: "Geçersiz Pollinations API Anahtarı! Lütfen enter.pollinations.ai/keys adresinden aldığınız anahtarı kontrol edin." };
    }
    return { valid: true, message: `Pollinations API anahtarı kaydedildi (HTTP ${res.status}).` };
  } catch (err: any) {
    return { valid: false, message: `Bağlantı hatası: ${err?.message || err}` };
  }
}

export async function validateApiKey(testKey?: string): Promise<{ valid: boolean; message: string }> {
  const keyToTest = testKey?.trim() || geminiRequestContext.getStore()?.apiKey || process.env.GEMINI_API_KEY;
  if (!keyToTest) {
    return { valid: false, message: "Herhangi bir API anahtarı sağlanmadı." };
  }
  try {
    const client = new GoogleGenAI({ apiKey: keyToTest });
    const response = await client.models.generateContent({
      model: "gemini-3.8-flash",
      contents: "Test ping",
    });
    if (response && response.text) {
      return { valid: true, message: "API Anahtarı geçerli ve başarıyla bağlandı!" };
    }
    return { valid: false, message: "API yanıt vermedi." };
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes("API_KEY_INVALID") || msg.includes("400") || msg.includes("invalid") || msg.includes("API key not valid")) {
      return { valid: false, message: "Geçersiz API Anahtarı! Lütfen Google AI Studio'dan aldığınız anahtarı kontrol edin." };
    }
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
      return { valid: false, message: "Bu API anahtarının kullanım kotası dolmuş görünüyor." };
    }
    return { valid: false, message: `Bağlantı hatası: ${msg}` };
  }
}

const STORY_MODEL = "gemini-3.8-flash";
const STORY_MODEL_FALLBACK = "gemini-3.8-flash";
const IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
  "gemini-3.1-flash-lite-image"
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

let lastQuotaDepletedTime = 0;
const QUOTA_COOLDOWN_MS = 60000; // 1 minute cooldown

export function isDepletedOrQuotaError(err: any): boolean {
  if (!err) return false;
  const str = (err?.message || (typeof err === "string" ? err : JSON.stringify(err))).toLowerCase();
  return (
    str.includes("prepayment credits are depleted") ||
    str.includes("credits are depleted") ||
    str.includes("resource_exhausted") ||
    str.includes("402") ||
    str.includes("quota exceeded") ||
    str.includes("exceeded your current quota") ||
    err?.status === 402 ||
    err?.code === 402 ||
    err?.status === 429 ||
    err?.code === 429
  );
}

export function isCircuitOpen(): boolean {
  return Date.now() - lastQuotaDepletedTime < QUOTA_COOLDOWN_MS;
}

export function recordQuotaError(): void {
  lastQuotaDepletedTime = Date.now();
}

export function generateStylizedComicSvg(
  prompt: string,
  isFullPage: boolean = false,
  contentRating: string = "pg17"
): string {
  const isRomance = isRomanceOrEmotionalTheme("", "", "", prompt);
  const cleanPrompt = prompt
    .replace(/\[MASTER COMIC PANEL DIRECTIVE\]:?/gi, "")
    .replace(/\[PRIMARY SCENE ACTION & COMPOSITION\]:?/gi, "")
    .replace(/\[MANDATORY CHARACTER POSITIONS, POSES & STAGING\]:?/gi, "")
    .replace(/\[CHARACTERS IN PANEL[^\]]*\]:?/gi, "")
    .replace(/\[ARTISTIC EXECUTION\]:?[\s\S]*$/gi, "")
    .replace(/\[.*?\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  let bg1 = "#090d16";
  let bg2 = "#1e1b4b";
  let accent1 = "#f43f5e";
  let accent2 = "#fb7185";
  let glow = "#fed7aa";
  let badgeText = "GRAPHIC NOVEL • ROMANTİZM";

  if (isRomance) {
    bg1 = "#180718";
    bg2 = "#4c0519";
    accent1 = "#f43f5e";
    accent2 = "#fda4af";
    glow = "#fed7aa";
    badgeText = contentRating === "pg18" ? "GRAPHIC NOVEL • TUTKU & AŞK (18+)" : "GRAPHIC NOVEL • ROMANTİZM";
  } else if (/sci-fi|cyber|uzay|neon/i.test(prompt)) {
    bg1 = "#020617";
    bg2 = "#083344";
    accent1 = "#06b6d4";
    accent2 = "#38bdf8";
    glow = "#a5f3fc";
    badgeText = "GRAPHIC NOVEL • SİBER & GELECEK";
  } else if (/korku|gizem|noir|cinayet|dedektif/i.test(prompt)) {
    bg1 = "#09090b";
    bg2 = "#18181b";
    accent1 = "#e2e8f0";
    accent2 = "#71717a";
    glow = "#ffffff";
    badgeText = "GRAPHIC NOVEL • KARA FİLM & GİZEM";
  } else {
    bg1 = "#0f172a";
    bg2 = "#1e3a8a";
    accent1 = "#facc15";
    accent2 = "#ef4444";
    glow = "#fde047";
    badgeText = "GRAPHIC NOVEL • KLASİK SERÜVEN";
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}" />
        <stop offset="60%" stop-color="${bg2}" />
        <stop offset="100%" stop-color="${bg1}" />
      </linearGradient>
      <radialGradient id="glowGrad" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="${glow}" stop-opacity="0.35" />
        <stop offset="50%" stop-color="${accent1}" stop-opacity="0.15" />
        <stop offset="100%" stop-color="${bg1}" stop-opacity="0" />
      </radialGradient>
      <pattern id="halftone" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="8" cy="8" r="1.8" fill="${accent2}" fill-opacity="0.18" />
      </pattern>
      <filter id="comicShadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="4" dy="4" stdDeviation="0" flood-color="#000000" flood-opacity="1" />
      </filter>
    </defs>

    <rect width="800" height="800" fill="url(#bgGrad)" />
    <rect width="800" height="800" fill="url(#halftone)" />
    <circle cx="400" cy="380" r="320" fill="url(#glowGrad)" />

    <g stroke="${accent1}" stroke-opacity="0.25" stroke-width="1.5">
      <line x1="0" y1="0" x2="350" y2="350" />
      <line x1="800" y1="0" x2="450" y2="350" />
      <line x1="0" y1="800" x2="350" y2="450" />
      <line x1="800" y1="800" x2="450" y2="450" />
      <line x1="400" y1="0" x2="400" y2="280" stroke-dasharray="6 6" />
      <line x1="0" y1="400" x2="280" y2="400" stroke-dasharray="6 6" />
      <line x1="800" y1="400" x2="520" y2="400" stroke-dasharray="6 6" />
    </g>

    ${isRomance ? `
      <g filter="url(#comicShadow)">
        <path d="M 120 720 C 140 540, 200 440, 310 390 C 330 330, 310 270, 320 220 C 335 170, 380 160, 390 190 C 370 210, 375 250, 350 290 C 330 330, 360 370, 370 420 C 380 480, 330 600, 310 720 Z" fill="#0b0713" stroke="${accent2}" stroke-width="2.5" />
        <path d="M 680 720 C 660 550, 600 450, 490 400 C 470 340, 485 280, 475 230 C 460 175, 420 165, 410 195 C 430 215, 425 255, 450 295 C 470 335, 440 375, 430 425 C 420 485, 470 605, 490 720 Z" fill="#0f0919" stroke="${accent1}" stroke-width="2.5" />
        <circle cx="400" cy="270" r="4" fill="${glow}" />
        <circle cx="380" cy="240" r="2.5" fill="${glow}" />
        <circle cx="420" cy="250" r="3" fill="${accent2}" />
        <circle cx="400" cy="320" r="5" fill="${accent1}" />
      </g>
    ` : `
      <g filter="url(#comicShadow)">
        <path d="M 260 720 L 320 540 L 370 470 C 360 410, 350 340, 370 280 C 385 240, 420 230, 435 270 C 450 330, 440 410, 430 470 L 480 540 L 540 720 Z" fill="#090d16" stroke="${accent1}" stroke-width="3" />
        <path d="M 360 460 C 280 500, 220 580, 180 700 L 250 710 C 290 600, 340 530, 370 470 Z" fill="${accent2}" fill-opacity="0.7" stroke="#000000" stroke-width="2" />
      </g>
    `}

    <g transform="translate(40, 40)">
      <rect x="0" y="0" width="340" height="34" rx="4" fill="#000000" stroke="${accent1}" stroke-width="2" filter="url(#comicShadow)" />
      <text x="170" y="22" font-family="'Impact', 'Arial Black', sans-serif" font-size="12" letter-spacing="2" fill="${accent1}" text-anchor="middle" font-weight="bold">${badgeText}</text>
    </g>

    <g transform="translate(40, 680)">
      <rect x="0" y="0" width="720" height="70" rx="6" fill="#000000" fill-opacity="0.9" stroke="#ffffff" stroke-width="2" filter="url(#comicShadow)" />
      <rect x="0" y="0" width="8" height="70" fill="${accent1}" />
      <text x="24" y="28" font-family="'Courier New', monospace" font-size="11" font-weight="bold" fill="${glow}" letter-spacing="1">SAHNE GÖRSELİ [ÇİZGİ ROMAN PANELİ]</text>
      <text x="24" y="50" font-family="sans-serif" font-size="12" fill="#e2e8f0" font-weight="500">${cleanPrompt.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>
    </g>

    <rect x="12" y="12" width="776" height="776" fill="none" stroke="#000000" stroke-width="12" />
    <rect x="20" y="20" width="760" height="760" fill="none" stroke="${accent1}" stroke-width="2.5" />
    <circle cx="28" cy="28" r="5" stroke="${accent2}" stroke-width="1.5" fill="none" />
    <circle cx="772" cy="28" r="5" stroke="${accent2}" stroke-width="1.5" fill="none" />
    <circle cx="28" cy="772" r="5" stroke="${accent2}" stroke-width="1.5" fill="none" />
    <circle cx="772" cy="772" r="5" stroke="${accent2}" stroke-width="1.5" fill="none" />
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export const COLOR_PALETTES: Record<string, { label: string; prompt: string; swatches: string[] }> = {
  vibrant_classic: {
    label: "Canlı Klasik (Sarı/Kırmızı/Mavi)",
    prompt: "Vibrant primary pop-art comic palette with saturated primary reds, bold canary yellows, rich cobalt blues, and crisp white gutter contrast.",
    swatches: ["#EF4444", "#FACC15", "#3B82F6", "#1E293B"]
  },
  romance_shojo: {
    label: "Shojo & Romantizm (Pembe/Gül/Şeftali/Pastel)",
    prompt: "Warm romantic shojo manga palette, delicate soft pastel rose tones, blush pinks, warm peach accents, dreamy warm twilight glows, and soft cream highlights.",
    swatches: ["#FB7185", "#FDA4AF", "#FED7AA", "#FFF1F2"]
  },
  cozy_cafe: {
    label: "Sıcak Kahve & Günlük Yaşam (Latte/Karamel/Amber)",
    prompt: "Cozy slice-of-life palette with warm roasted caramel, soft amber lighting, milk coffee neutrals, gentle sage green touches, and soothing domestic earth tones.",
    swatches: ["#D97706", "#F59E0B", "#FDE68A", "#78350F"]
  },
  noir_monochrome: {
    label: "Kara Film (Siyah/Beyaz/Gölge)",
    prompt: "High-contrast film-noir monochrome palette, intense chiaroscuro shadows, deep charcoal blacks, silver midtones, and stark stark white rim lighting.",
    swatches: ["#09090B", "#27272A", "#71717A", "#FAFAFA"]
  },
  cyber_neon: {
    label: "Siber Neon (Teal/Fuşya/Mor)",
    prompt: "Hyper-saturated cyberpunk neon palette, glowing electric cyan, hot synthwave magenta, deep violet shadows, and reflective wet asphalt.",
    swatches: ["#06B6D4", "#EC4899", "#8B5CF6", "#0F172A"]
  },
  retro_sepia: {
    label: "Nostaljik Sepya (Toprak/Altın)",
    prompt: "Warm nostalgic sepia palette, sun-faded parchment tones, aged copper, muted ochre, warm tobacco browns, and vintage comic print texture.",
    swatches: ["#78350F", "#B45309", "#D97706", "#FEF3C7"]
  },
  dark_gothic: {
    label: "Gotik & Karanlık (Bordo/Gece)",
    prompt: "Moody gothic horror palette, deep crimson blood reds, abyssal indigo, cold moonlit mist, and oxidized iron tones.",
    swatches: ["#881337", "#1E1B4B", "#312E81", "#020617"]
  },
  pastel_dream: {
    label: "Pastel Düş (Bebek Mavisi/Leylak)",
    prompt: "Dreamy soft pastel palette, gentle lavender, powder baby blue, soft mint, cotton candy pinks, and diffuse ethereal ambient glow.",
    swatches: ["#A7F3D0", "#BAE6FD", "#DDD6FE", "#FBCFE8"]
  },
  sensual_crimson: {
    label: "Tensel & Erotik Gece (Kırmızı/Bordo/Gece Mavisi - PG-17)",
    prompt: "Sultry romantic mature palette, deep passion crimson, seductive velvet burgundy, warm candlelit amber glows, and dark midnight indigo shadows.",
    swatches: ["#991B1B", "#DC2626", "#F59E0B", "#1E1B4B"]
  },
  gold_luxury: {
    label: "Altın & Kraliyet (Lüks/Mistik)",
    prompt: "Opulent regal palette, burnished metallic gold highlights, deep royal amethyst purple, midnight navy, and rich velvet tones.",
    swatches: ["#EAB308", "#CA8A04", "#581C87", "#0F172A"]
  }
};

export const LIGHTING_MOODS: Record<string, { label: string; prompt: string }> = {
  candlelit_sensual: {
    label: "Mum Işığı & Şehvetli Gece (Sensual / PG-17)",
    prompt: "Intimate warm candlelit glow, deep seductive amber and burgundy shadows, alluring soft rim lighting on skin and curves, romantic cinematic bedroom ambiance."
  },
  dramatic_split: {
    label: "Dramatik Yarı-Gölge (Chiaroscuro)",
    prompt: "Dramatic chiaroscuro lighting, hard directional key light cutting across subjects, casting deep graphic shadows across faces and background."
  },
  romantic_dream: {
    label: "Romantik Gün Batımı & Rüya Işığı (Golden Hour & Bokeh)",
    prompt: "Dreamy golden hour romantic lighting, soft lens flare, gentle warm backlight glowing through hair, sparkling atmospheric bokeh, and gentle glowing eye reflections."
  },
  cozy_warmth: {
    label: "Huzurlu İç Mekan Işığı (Sıcak Kafe / Lamba)",
    prompt: "Warm comforting ambient interior lighting, soft lamp glow, diffuse reflections on wooden tables, cozy gentle shadows, and relaxing domestic mood."
  },
  neon_night: {
    label: "Neon Gece Işıkları (Siber/Şehir)",
    prompt: "Vivid multi-colored neon lighting, sharp electric cyan and magenta rim highlights on character silhouettes, reflective street pavements."
  },
  golden_hour: {
    label: "Altın Saat / Gün Batımı",
    prompt: "Warm golden-hour ambient illumination, long dramatic sunset shadows, amber rim lighting, rich warm atmospheric haze."
  },
  eerie_green: {
    label: "Gizemli & Doğaüstü Işıma",
    prompt: "Eerie supernatural bioluminescent green lighting, sinister upward shadow angles, toxic arcane luminescence."
  },
  harsh_daylight: {
    label: "Sert Öğle Güneşi",
    prompt: "Blistering high-noon direct sunlight, stark hard-edged cast shadows, intense specular highlights, dusty atmosphere."
  },
  moonlit_fog: {
    label: "Sisli Ay Işığı",
    prompt: "Cold ethereal silver moonlight piercing through dense volumetric fog, cool blue tint, mysterious silhouette edges."
  },
  studio_clean: {
    label: "Dengeli Çizgi Roman Işığı",
    prompt: "Clean professional comic book studio three-point lighting, balanced fills, crisp ink separation, zero muddy noise."
  }
};

export function isRomanceOrEmotionalTheme(topic?: string, tone?: string, intro?: string, extraText?: string): boolean {
  const combined = `${topic || ""} ${tone || ""} ${intro || ""} ${extraText || ""}`.toLowerCase();
  return /\b(aşk|aşık|sevgi|sevgili|romantik|romantizm|romance|flört|öpüş|öpücük|kiss|date|buluşma|tutku|tutkulu|sensual|intimate|evlilik|ilişki|sarılma|duygusal|drama|dram|slice of life|kafe|gündelik|shojo|erotik|yatak|bedroom|sevgililer|itiraf)\b/i.test(combined);
}

export const getStyleEnhancement = (style?: string, colorPalette?: string, lightingMood?: string, consistencyLock?: boolean, isRomanceTheme?: boolean): string => {
  const matchedStyle = COMIC_ART_STYLES.find(s => s.id === style || s.name === style);
  
  let comicStyle = matchedStyle 
    ? matchedStyle.promptDirective
    : "Masterpiece semi-realistic Marvel comic book illustration style, blending modern Marvel graphic novel draftsmanship with anatomically accurate realism, inspired by Gabriele Dell'Otto, Adi Granov, and Alex Ross. Precise human facial bone structure, lifelike expressive eyes, refined sharp black ink linework with dynamic cross-hatching, rich volumetric cinematic lighting, tactile skin and fabric textures (leather, denim, weaves), atmospheric depth, published Marvel graphic novel masterpiece standard. Zero cartoonish caricature.";

  if (isRomanceTheme && (!matchedStyle || matchedStyle.id === "marvel_realistic" || matchedStyle.id === "standard_comic")) {
    comicStyle = "Masterpiece semi-realistic Marvel graphic novel style for intimate drama and romance. Realistic human facial anatomy, expressive emotional eyes with lifelike depth, refined delicate black ink contours with subtle cross-hatching, rich warm cinematic lighting, realistic soft skin rendering, tactile fabric folds, intimate cinematic framing, published graphic novel masterpiece. Zero cartoonish caricature, zero combat.";
  }

  const paletteObj = colorPalette ? COLOR_PALETTES[colorPalette] : null;
  const palettePrompt = paletteObj ? ` Color palette: ${paletteObj.prompt}.` : "";

  const lightingObj = lightingMood ? LIGHTING_MOODS[lightingMood] : null;
  const lightingPrompt = lightingObj ? ` Lighting: ${lightingObj.prompt}.` : "";

  const qualityBoosters = isRomanceTheme
    ? " Sharp focus, clean draftsmanship, realistic hand and finger anatomy, tender emotional warmth, published Marvel graphic novel panel art, high clarity."
    : " Sharp focus, clean draftsmanship, perfect hand and finger anatomy, rich highlights and deep shadows, published Marvel graphic novel panel art, high clarity.";

  return `${comicStyle}${palettePrompt}${lightingPrompt}${qualityBoosters}`;
};

const extractTextContent = (response: any): string => {
  if (!response) return "";
  if (typeof response.text === "string" && response.text.trim()) {
    return response.text;
  }
  const candidate = response.candidates?.[0];
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (typeof part.text === "string" && part.text.trim()) {
        return part.text;
      }
    }
  }
  return "";
};

const extractImageFromResponse = (response: any): { 
  base64Image?: string; 
  isSafetyBlocked?: boolean; 
  textOutput?: string;
  finishReason?: string;
} => {
  if (!response) return {};

  const blockReason = response?.promptFeedback?.blockReason;
  if (blockReason === "SAFETY" || blockReason === "PROHIBITED_CONTENT" || blockReason === "BLOCKLIST") {
    return { isSafetyBlocked: true, finishReason: blockReason };
  }

  const candidates = response?.candidates || [];
  for (const candidate of candidates) {
    const fReason = candidate.finishReason;
    if (fReason === "SAFETY" || fReason === "IMAGE_SAFETY" || fReason === "PROHIBITED_CONTENT" || fReason === "BLOCKLIST") {
      return { isSafetyBlocked: true, finishReason: fReason };
    }

    if (candidate.content?.parts) {
      for (const part of candidate.content.parts) {
        // Handle standard inlineData
        if (part?.inlineData?.data) {
          return { base64Image: part.inlineData.data, finishReason: fReason };
        }
        // Handle inlineData wrapped or imageBytes
        if (part?.imageBytes) {
          return { base64Image: part.imageBytes, finishReason: fReason };
        }
        if (part?.image?.imageBytes) {
          return { base64Image: part.image.imageBytes, finishReason: fReason };
        }
      }
    }
  }

  // Check generatedImages if SDK provides it
  if (Array.isArray(response?.generatedImages)) {
    for (const gi of response.generatedImages) {
      if (gi?.image?.imageBytes) {
        return { base64Image: gi.image.imageBytes };
      }
      if (gi?.imageBytes) {
        return { base64Image: gi.imageBytes };
      }
    }
  }

  // Fallback text check
  for (const candidate of candidates) {
    if (candidate.content?.parts) {
      for (const part of candidate.content.parts) {
        if (typeof part.text === "string" && part.text.trim()) {
          return { textOutput: part.text, finishReason: candidate.finishReason };
        }
      }
    }
  }

  return {};
};

const DEFAULT_IMAGE_SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
];

export function sanitizePromptForSafety(
  prompt: string, 
  contentRating: "pg13" | "pg17" | "pg18" = "pg17",
  modestyTechnique?: "sheets" | "steam" | "silhouette" | "angles" | "macro" | "auto"
): string {
  if (!prompt || typeof prompt !== "string") return "";

  let cleaned = prompt;

  const isPG17or18 = contentRating !== "pg13";
  const isPG18 = contentRating === "pg18";

  // Check explicit modesty technique or keywords in prompt (sheets vs steam/duman vs silhouette vs angle)
  const isSteam = modestyTechnique === "steam" || /\b(buhar|duman|steam|mist|fog|sauna|bath|duş|smoke)\b/i.test(cleaned);
  const isSilhouette = modestyTechnique === "silhouette" || /\b(silüet|silhouette|shadow|gölge|mum\s+ışığı|candlelight)\b/i.test(cleaned);
  const isAngle = modestyTechnique === "angles" || /\b(omuz|arkadan|sırttan|behind|over.the.shoulder)\b/i.test(cleaned);
  const isMacro = modestyTechnique === "macro" || /\b(makro|macro|eller|hands|parmak|dudak|lips)\b/i.test(cleaned);

  // Dynamic Modesty Replacements based on requested concealment method
  const modestyNudityEn = isSteam
    ? "intimately undressed, with swirling dense atmospheric steam and rising warm mist veiling and concealing modesty zones and explicit anatomy, glistening skin under moody lighting, zero prohibited nudity, graphic novel standards"
    : isSilhouette
    ? "intimately undressed, cast in dramatic chiaroscuro noir silhouette and deep shadows that completely conceal explicit anatomy, golden candlelight rim illumination tracing back and shoulder contours, zero prohibited nudity"
    : isAngle
    ? "intimately undressed, framed from behind where the arch of the back and shoulder strategically block and conceal explicit anatomy from camera view, focusing on facial ecstasy and entwined hands, zero prohibited nudity"
    : isMacro
    ? "intimate romantic closeness, extreme sensual macro framing focusing on entwined hands clutching silk sheets, parted lips, closed eyes, and heavy breathing, keeping all explicit anatomy outside the frame, zero prohibited nudity"
    : "intimately undressed in bed, with luxurious silk satin bedsheets and soft linen duvet strategically and elegantly draped across hips and modesty zones, completely concealing explicit anatomy while exposing bare shoulders, clavicles, and arched backs, warm romantic candlelight, zero prohibited nudity, graphic novel publishing standards";

  const modestyNudityTr = isSteam
    ? "soyunuk, ancak yükselen yoğun buhar ve sis perdesi hassas bölgeleri ve çıplaklığı estetik biçimde örter, loş ışık altında parlayan tensel hatlar, sıfır müstehcenlik"
    : isSilhouette
    ? "loş ışıkta soyunuk, ancak derin noir gölgeler ve silüet hatları tüm çıplaklığı tamamen kapatır, altın sarısı kontur ışığıyla sırt ve omuzlar belirgin, sıfır müstehcenlik"
    : isAngle
    ? "arkadan çekimle soyunuk, ancak ön plandaki omuz ve sırt çıplaklığı kameraya karşı doğal bir kalkan gibi kapatır, yüze ve kenetli ellere odaklı, sıfır müstehcenlik"
    : isMacro
    ? "çarşafı sıkan kenetlenmiş parmaklara, aralanmış dudaklara ve boyuna odaklanan tensel makro kadraj, çıplaklık kadraj dışında, sıfır müstehcenlik"
    : "yatakta soyunuk, ancak dökümlü saten çarşaflar ve örtüler çıplaklığı estetikçe tamamen kapatır, sırt ve omuzlar açıkta, mum ışığında romantik atmosfer, sıfır müstehcenlik";

  const modestyLovemakingEn = isSteam
    ? "deep passionate intimate embrace, swirling atmospheric warm steam and moisture gently concealing modesty zones, breathless romantic heat, glistening contours, zero explicit anatomy visible"
    : isSilhouette
    ? "deep passionate intimate embrace, silhouetted in dramatic noir shadows with golden rim lighting outlining bodies, concealing explicit anatomy in atmospheric darkness, intense romantic heat"
    : isAngle
    ? "deep passionate intimate embrace captured in discreet over-the-shoulder angle from behind, the curvature of the back concealing explicit anatomy from view, focusing on intense facial chemistry"
    : "deep passionate intimate embrace in bed, entwined romantically under draped luxurious silk satin duvet concealing modesty zones, breathless closeness, magnetic physical chemistry, candlelit romantic heat";

  const modestyLovemakingTr = isSteam
    ? "tutku dolu tensel yakınlaşma, yükselen buhar ve sis perdesi altında birbirine sarılmış, nefes nefese romantik elektriklenme, buğulu atmosferik ışık, estetik kapalı kadraj"
    : isSilhouette
    ? "tutku dolu tensel yakınlaşma, mum ışığında derin silüet ve gölgeler ardında birbirine sarılmış, nefes nefese romantik elektriklenme, sanatsal gölge oyunu"
    : isAngle
    ? "tutku dolu tensel yakınlaşma, arkadan omuz üstü gizleyici açıyla birbirine sarılmış, nefes nefese romantik elektriklenme, yüze ve kenetli parmaklara odaklı"
    : "tutku dolu tensel yakınlaşma, saten örtüler altında birbirine sarılmış, nefes nefese romantik elektriklenme, mum ışığında derin tensel çekim, dökümlü çarşaf kalkanı";

  const safetyReplacements: [RegExp, string][] = [
    // Blood & Gore
    [/\b(blood(?:y|ied|ing)?|gore|gory|flesh|mutilat\w*|decapitat\w*|dismember\w*|severed|amputat\w*)\b/gi, "dramatic action dust, dynamic motion blur, impact burst"],
    [/\b(kan(?:lar)?(?:\s+içinde)?|kanlı|vahşet|parçalanmış|kesik\s+kafa|kopmuş|organ)\b/gi, "çatışma tozu, dramatik hareket çizgileri, gerilim dolu mücadele anı"],
    
    // Death & lethal violence
    [/\b(kill(?:ing|ed|s)?|murder(?:ed|ing|s)?|slaughter\w*|assassinat\w*|massacre|genocide)\b/gi, "defeat, disarm, confront, overpower"],
    [/\b(öldür\w*|cinayet\w*|katlet\w*|katliam\w*|boğazla\w*)\b/gi, "etkisiz hale getir, alt et, yüzleş, püskürt"],
    [/\b(corpse|dead\s+body|cadaver|severed\s+limbs?)\b/gi, "defeated fallen adversary, unconscious opponent"],
    [/\b(ceset|ölü\s+beden|ölü|mefta)\b/gi, "yere serilmiş rakip, baygın düşman"],

    // Executions & direct firearms to head/face
    [/\b((?:gun|pistol|rifle|revolver)\s+(?:pointed|pointing)\s+at\s+(?:the\s+)?(?:head|face|forehead|temple))\b/gi, "intense high-stakes confrontation and standoff"],
    [/\b((?:shoot|shot|shooting)\s+in\s+the\s+(?:head|face|chest))\b/gi, "knocking backward with powerful impact shockwave"],
    [/\b(kafaya\s+silah|kafasına\s+silah\s+daya\w*|şakağına\s+silah|kurşunla\w*|infaz\w*)\b/gi, "yüksek gerilimli dramatik yüzleşme ve çatışma anı"],

    // Stabbing & slitting
    [/\b(stab(?:bed|bing)?\s+(?:in|into|with)|slit(?:ting)?\s+(?:the\s+)?throat)\b/gi, "disarming martial strike, sudden close-quarters grapple"],
    [/\b(bıçakla\w*|bıçak\s+sapla\w*|boğaz(?:ını)?\s+kes\w*)\b/gi, "silahsızlandırma hamlesi, yakın dövüş savunması"],

    // Sensual / Erotic / PG-17 / PG-18 Transformations (Artistic modesty boundary push without triggering filter blocks)
    ...(isPG17or18 ? [
      // Direct explicit nudity -> Tasteful artistic modesty: draped satin sheets, steam veil, silhouetted forms, rear angles
      [/\b(naked|nude|nudity|topless|stripped\s+naked|bare\s+skin)\b/gi, modestyNudityEn],
      [/\b(çırılçıplak|çıplak|soyunuk|üstü\s+çıplak)\b/gi, modestyNudityTr],
      
      // Undressing -> Loosened collar, unbuttoned silk shirt, alluring exposed neckline
      [/\b(undress\w*|taking\s+off\s+clothes|strip(?:ping)?|unbutton\w*)\b/gi, "loosened silk collar, partially unbuttoned shirt revealing collarbone, draped stylish garments, intimate private room ambiance"],
      [/\b(soyun\w*|kıyafetlerini\s+çıkar\w*|düğmelerini\s+çöz\w*)\b/gi, "açılmış ipek yaka, köprücük kemiğini ortaya çıkaran hafif açık gömlek, loş yatak odası atmosferi"],

      // Lingerie & Underwear -> Silk slip, delicate lace loungewear
      [/\b(underwear|lingerie|panties|bra|nightwear)\b/gi, "delicate silk lace slip, elegant satin loungewear, flattering evening attire"],
      [/\b(iç\s+çamaşır\w*|gecelik|sütyen|külot)\b/gi, "zarif ipek saten gecelik, şık dantelli sabahlık, çekici ev giyimi"],

      // Erotic & Sexy -> Sultry romantic tension, magnetic allure, seductive bedroom eyes
      [/\b(erotic\w*|sexy\s+pose|seductive\s+pose|provocative)\b/gi, isPG18
        ? "sensual intense romantic tension, magnetic allure, sultry seductive bedroom eyes, captivating posture, PG-18 mature adult graphic novel aesthetic"
        : "sensual intense romantic tension, magnetic allure, sultry seductive bedroom eyes, captivating posture, PG-17 mature graphic novel aesthetic"],
      [/\b(erotik\w*|seksi\s+poz|baştan\s+çıkarıcı\s+poz|müstehcen)\b/gi, "yoğun tensel ve romantik çekim, baştan çıkarıcı bakışlar, şehvetli ve çekici duruş, yetişkin olgun çizgi roman estetiği"],

      // Sexual intimacy -> Lovemaking with clever artistic modesty cover
      [/\b(sex|sexual|making\s+love|intercourse|making\s+out\s+heavily)\b/gi, modestyLovemakingEn],
      [/\b(seviş\w*|cinsel\s+ilişki|yatakta\s+yakınlaş\w*)\b/gi, modestyLovemakingTr],

      // Cleavage & curves -> Form-flattering neckline, elegant curves
      [/\b(cleavage|big\s+breasts|busty)\b/gi, "alluring open neckline, elegant collarbone accent, form-flattering stylish attire"],
      [/\b(göğüs\s+dekoltesi|dekolte|iri\s+göğüs)\b/gi, "çekici açık yaka, zarif boyun ve köprücük kemiği vurgusu, vücuda oturan şık kıyafet"],

      // Deep passionate kissing
      [/\b(french\s+kiss\w*|kissing\s+passionately|making\s+out)\b/gi, "locked in deep breathless passionate kiss, hands tangled in hair and waist, bodies pressed close, intense romantic heat, dramatic cinematic side angle"],
      [/\b(tutkulu\s+öpüş\w*|dudaktan\s+öp\w*|ateşli\s+öpücük)\b/gi, "tutkuyla dudak dudağa, eller saçlarda ve belde, nefes kesici romantik yakınlaşma, yoğun aşk anı, dramatik sinematik açı"]
    ] : [
      // Standard PG-13 fallback
      [/\b(naked|nude|nudity|underwear|topless|lingerie|erotic|sexy\s+pose|cleavage|undress\w*)\b/gi, "fully dressed in standard character clothing and attire"],
      [/\b(çıplak|soyunuk|çırılçıplak|iç\s+çamaşırı|erotik|müstehcen)\b/gi, "tamamen giyinik ve karakteristik kıyafetli"]
    ]) as [RegExp, string][],

    // Torture & Suicide
    [/\b(tortur\w*|suicide|hanging\s+by\s+neck|self-harm)\b/gi, "intense dramatic crisis and high peril scene"],
    [/\b(işkence\w*|intihar\w*|asılma|kendine\s+zarar)\b/gi, "yüksek dramatik gerilim ve tehlike anı"],

    // Explosions/Terror in sensitive terms
    [/\b(terrorist|bombing\s+casualties|hostage\s+execution)\b/gi, "dangerous adversary threat, high-stakes rescue standoff"],
    [/\b(terörist|bomba\s+kurbanları|rehin\s+infazı)\b/gi, "tehlikeli tehdit, kritik kurtarma operasyonu"],

    // Trademark & Copyright bypass for Imagen models (prevents PROHIBITED_CONTENT blocks)
    [/\b(spider-?man|örümcek\s+adam)\b/gi, "masked red-and-blue agile web-slinging hero"],
    [/\b(batman|yarasa\s+adam)\b/gi, "dark cloaked armored vigilante hero with bat-eared cowl"],
    [/\b(superman|süpermen)\b/gi, "mighty flying hero with blue suit and flowing red cape"],
    [/\b(iron\s*man|demir\s+adam)\b/gi, "sleek red-and-gold high-tech armored superhero"],
    [/\b(wolverine)\b/gi, "rugged muscular hero with metallic claws and leather jacket"],
    [/\b(deadpool)\b/gi, "red-and-black masked dual-blade mercenary"],
    [/\b(hulk)\b/gi, "massive green-skinned muscular powerhouse titan"],
    [/\b(thor)\b/gi, "mighty armored thunder god warrior with winged helmet and hammer"],
    [/\b(captain\s+america|kaptan\s+amerika)\b/gi, "patriotic armored hero with star-emblazoned circular shield"],
    [/\b(joker)\b/gi, "eccentric grinning green-haired villain in purple three-piece suit"],
    [/\b(thanos)\b/gi, "giant armored purple-skinned cosmic warlord"]
  ];

  for (const [pattern, replacement] of safetyReplacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // PG-18 Extra Framing Safeguard: If the scene has heavy romantic/bedroom action, reinforce with modesty obscuring
  if (isPG18 && /(bedroom|intimate|embrace|sheets|bed|allure|sensual|çarşaf|yatak|tutku|seviş)/i.test(cleaned) && !/modesty|silhouette|backlit|chiaroscuro|steam/i.test(cleaned)) {
    cleaned += ", captured with artistic cinema modesty framing with draped silk sheets and warm moody rim lighting to conceal explicit anatomy while accentuating passionate contours";
  }

  return cleaned;
}

async function rewritePromptForSafety(unsafePrompt: string, isFullPage: boolean = false, contentRating: "pg13" | "pg17" | "pg18" = "pg17"): Promise<string> {
  const ai = getAIOrNull();
  if (!ai) {
    // If Gemini key is not configured, proceed immediately with deterministic safe fallback
    const isRomanceScene = isRomanceOrEmotionalTheme("", "", "", unsafePrompt);
    const styleLabel = contentRating === "pg18"
      ? "Award-winning PG-18 adult graphic novel illustration, passionate intimate embrace tastefully draped in silk satin sheets, warm romantic candlelight, rich shadows, crisp ink lines, published graphic novel masterpiece."
      : contentRating === "pg17"
      ? "Award-winning PG-17 graphic novel illustration, passionate romantic chemistry, parted lips, candlelit ambiance, crisp ink lines, rich cel-shading, published comic masterpiece."
      : isRomanceScene
      ? "Award-winning graphic novel illustration, gentle romantic emotion, warm lighting, expressive facial acting, crisp ink lines, published graphic novel masterpiece."
      : "Award-winning graphic novel illustration, rich character storytelling, bold ink outlines, vibrant colors, cinematic lighting, published comic masterpiece.";
    const cleanSnippet = sanitizePromptForSafety(unsafePrompt, contentRating as any).slice(0, 800);
    return isFullPage
      ? `Masterpiece graphic novel comic page with 4 panels in symmetrical 2x2 grid, scene: ${cleanSnippet}. ${styleLabel}`
      : `Masterpiece graphic novel comic panel illustration, scene: ${cleanSnippet}. ${styleLabel}`;
  }
  const isPG17or18 = contentRating !== "pg13";
  const isPG18 = contentRating === "pg18";
  const formatNotice = isFullPage
    ? "The scene must be a complete 4-panel graphic novel comic book page arranged in a symmetrical 2x2 grid (Top-Left, Top-Right, Bottom-Left, Bottom-Right)."
    : "The scene is a single standalone standard comic book panel illustration.";

  const prompt = `You are a Lead Graphic Novel Art Director specialized in ${isPG18 ? "sophisticated PG-18 adult graphic novels, intense romance, and Seinen drama" : isPG17or18 ? "sophisticated PG-17 graphic novels, mature romantic comics, and Seinen drama" : "family-safe PG-13 graphic novel comic books"}.
The following comic visual prompt was blocked by an AI safety filter (PROHIBITED_CONTENT or IMAGE_SAFETY):
"""
${unsafePrompt.slice(0, 3500)}
"""

Task: Rewrite this prompt into a clean, 100% safety-compliant, ${isPG18 ? "PG-18 mature aesthetic" : isPG17or18 ? "PG-17 mature aesthetic" : "family-safe PG-13"} Standard Comic Book illustration prompt that passes AI filters with ZERO BLOCKS.

CRITICAL CHARACTER, POSITION, SETTING & SENSUAL RELEVANCE MANDATES:
1. STRICTLY FORBIDDEN: NEVER introduce superheroes, superhero suits, spandex, capes, masks, sci-fi lasers, cosmic energy, or unrelated figures unless the original prompt explicitly stated them. If the characters are ordinary people (students, detectives, doctors, civilians, lovers), KEEP THEM EXACTLY AS DESCRIBED.
2. PRESERVE 100% IDENTITY, POSITIONS & POSES: Keep all exact character names, spatial positions (e.g. left side, right side, sitting behind desk, reclining on bed, standing), poses, facial expressions, physical features, hair styles, clothing, and the specific story situation completely faithful to the original scene.
3. ${isPG17or18 ? `HANDLING ROMANTIC, SENSUAL & EROTIC THEMES (${isPG18 ? "PG-18" : "PG-17"} MAXIMUM BOUNDARY RULE):
   - The user requested ${isPG18 ? "PG-18" : "PG-17"} mature storytelling. When romantic, sensual, erotic, or intimate elements are present:
     * NEVER strip away the romance, allure, or passionate chemistry!
     * STRICT SAFETY FILTER COMPLIANCE: Zero explicit genitalia, zero pornographic anatomy, zero direct forbidden nudity (to guarantee 100% zero filter blocks).
     * MAXIMIZE PASSION & SENSUALITY WITHIN ALLOWED BOUNDARIES: Frame intimate scenes with tasteful cinematic elegance: artistic silhouette backlighting, warm candlelight or moonlight, parted lips, heavy seductive bedroom eyes, flushed cheeks, bodies entwined in close passionate embrace, unbuttoned loose silk shirts, draped satin bedsheets, and breathless romantic tension. The goal is the highest allowable artistic adult graphic novel eroticism!` : `SAFELY SOFTEN SENSUALITY:
   - Convert provocative or sensual poses into standard friendly interactions with standard character attire.`}
4. SAFELY SOFTEN VIOLENCE & PROHIBITED THEMES:
   - STRICT ZERO TOLERANCE for blood, gore, open wounds, executions, point-blank headshots, corpses, real-world terrorism, torture.
   - If the scene is romantic or emotional: Convert any tension into gentle romantic proximity, earnest eye contact, or poignant dialogue—NEVER introduce weapons, ninjas, combat moves, or martial arts!
   - If the scene is action-oriented: Convert lethal violence into PG-13 dramatic comic tension: dodging, intense facial expressions, speech confrontations, shadows, and non-lethal impact bursts.
5. ${formatNotice}
6. Art Style: Standard Graphic Novel Comic Art style, crisp black inking, clean cel-shading, rich colors.
7. Return ONLY the final English rewritten image prompt text. Do not output quotes, preamble, or conversational filler.`;

  try {
    const response = await ai.models.generateContent({
      model: STORY_MODEL,
      contents: prompt,
      config: {
        systemInstruction: isPG17or18 
          ? "You are a master comic art director converting blocked scene prompts into sophisticated graphic novel prompts while strictly preserving the characters, romantic chemistry, and setting without adding random superheroes. Output only the safe prompt."
          : "You are a master comic art director converting blocked scene prompts into family-friendly PG-13 standard graphic novel prompts while strictly preserving the original characters, clothing, positions, and setting without adding random superheroes. Output only the safe prompt."
      }
    });

    const text = extractTextContent(response);
    if (text && text.trim().length > 30) {
      console.log("[SafetyRescue] Successfully sanitized prompt via AI rewriter!");
      return text.trim();
    }
  } catch (err: any) {
    console.warn("[SafetyRescue] AI rewrite failed, falling back to deterministic safe prompt:", err?.message || err);
  }

  // Deterministic context-preserving safe fallback (retains actual scene action and characters)
  const cleanSnippet = sanitizePromptForSafety(unsafePrompt, contentRating)
    .replace(/\[MASTER COMIC PANEL DIRECTIVE\]:?/gi, "")
    .replace(/\[PRIMARY SCENE ACTION & COMPOSITION\]:?/gi, "")
    .replace(/\[MANDATORY CHARACTER POSITIONS, POSES & STAGING\]:?/gi, "Positions:")
    .replace(/\[CHARACTERS IN PANEL[^\]]*\]:?/gi, "Characters:")
    .replace(/\[ARTISTIC EXECUTION\]:?[\s\S]*$/gi, "")
    .replace(/\[STRICT CHARACTER EXCLUSION[^\]]*\]:?[\s\S]*?(?=\n\n|\n\[|$)/gi, "")
    .replace(/\[.*?\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 800);

  const isRomanceScene = isRomanceOrEmotionalTheme("", "", "", unsafePrompt);
  const styleLabel = isPG18 
    ? "Award-winning PG-18 adult graphic novel illustration, passionate intimate embrace tastefully draped in silk satin sheets, warm romantic candlelight, rich shadows, crisp ink lines, published graphic novel masterpiece." 
    : isPG17or18 
    ? "Award-winning PG-17 graphic novel illustration, passionate romantic chemistry, parted lips, candlelit ambiance, crisp ink lines, rich cel-shading, published comic masterpiece." 
    : isRomanceScene
    ? "Award-winning graphic novel illustration, gentle romantic emotion, warm lighting, expressive facial acting, crisp ink lines, published graphic novel masterpiece."
    : "Award-winning graphic novel illustration, rich character storytelling, bold ink outlines, vibrant colors, cinematic lighting, published comic masterpiece.";

  if (isFullPage) {
    return `Masterpiece graphic novel comic page with 4 panels in symmetrical 2x2 grid, scene: ${cleanSnippet}. ${styleLabel}`;
  }
  return `Masterpiece graphic novel comic panel illustration, scene: ${cleanSnippet}. ${styleLabel}`;
}

export async function generateImageViaPollinations(
  prompt: string,
  aspectRatio: "1:1" | "4:3" | "16:9" | "3:4" | "9:16" = "1:1",
  isFullPage: boolean = false,
  contentRating: string = "pg17",
  preferredModel?: string
): Promise<string> {
  // 1. Calculate dimensions for aspect ratio
  let width = 1024;
  let height = 1024;
  if (aspectRatio === "4:3") { width = 1024; height = 768; }
  else if (aspectRatio === "3:4") { width = 768; height = 1024; }
  else if (aspectRatio === "16:9") { width = 1024; height = 576; }
  else if (aspectRatio === "9:16") { width = 576; height = 1024; }

  // 2. Clean up prompt: Remove system directives, bracket tokens, keep pure scene description
  const cleanScenePrompt = prompt
    .replace(/\[MASTER COMIC PANEL DIRECTIVE\]:?/gi, "")
    .replace(/\[PRIMARY SCENE ACTION & COMPOSITION\]:?/gi, "")
    .replace(/\[MANDATORY CHARACTER POSITIONS, POSES & STAGING\]:?/gi, "Positions:")
    .replace(/\[CHARACTERS IN PANEL[^\]]*\]:?/gi, "Characters:")
    .replace(/\[ARTISTIC EXECUTION\]:?[\s\S]*$/gi, "")
    .replace(/\[STRICT CHARACTER EXCLUSION[^\]]*\]:?[\s\S]*?(?=\n\n|\n\[|$)/gi, "")
    .replace(/\[ATTACHED VISUAL REFERENCE[^\]]*\]:?[\s\S]*?(?=\n\n|\n\[|$)/gi, "")
    .replace(/\[.*?\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 750);

  // Normalize model ID for 100% Free URL generation on image.pollinations.ai
  let selectedModel = (preferredModel?.trim() || "flux").toLowerCase();
  if (selectedModel.includes("turbo") || selectedModel.includes("lightning") || selectedModel.includes("schnell")) {
    selectedModel = "turbo";
  } else if (selectedModel.includes("anime") || selectedModel.includes("manga")) {
    selectedModel = "flux-anime";
  } else if (selectedModel.includes("real")) {
    selectedModel = "flux-realism";
  } else if (selectedModel.includes("3d") || selectedModel.includes("cgi")) {
    selectedModel = "flux-3d";
  } else if (selectedModel.includes("dark") || selectedModel.includes("noir")) {
    selectedModel = "any-dark";
  } else {
    selectedModel = "flux";
  }

  // Customize prompt style based on selected mode
  let modeStyleTag = "Masterpiece semi-realistic Marvel comic book illustration, realistic character anatomy, lifelike facial bone structure and expressive eyes, refined black ink contours with dynamic cross-hatching, rich volumetric cinematic lighting, tactile skin and fabric textures (leather, denim, weaves), atmospheric depth, published Marvel graphic novel standard, no text, no speech bubbles.";
  if (selectedModel === "flux-anime") {
    modeStyleTag = "Japanese manga comic book art style, authentic anime aesthetic, crisp bold black manga ink outlines, expressive anime eyes, vibrant anime cel-shading, dynamic comic book framing, no text, no speech bubbles.";
  } else if (selectedModel === "flux-realism") {
    modeStyleTag = "Hyper-detailed realistic Marvel graphic novel illustration, painterly realism like Alex Ross and Gabriele Dell'Otto, realistic facial anatomy, volumetric cinematic lighting, rich lifelike textures, atmospheric depth, published Marvel graphic novel masterpiece, no text, no speech bubbles.";
  } else if (selectedModel === "flux-3d") {
    modeStyleTag = "3D volumetric graphic novel illustration, smooth subsurface scattering, expressive realistic 3D character CGI, ambient occlusion, no text, no speech bubbles.";
  } else if (selectedModel === "any-dark") {
    modeStyleTag = "Moody dark noir Marvel graphic novel illustration, deep chiaroscuro black shadows, intense ink hatching, high contrast noir aesthetic, realistic anatomy, gritty atmosphere, published Marvel comic art, no text, no speech bubbles.";
  } else if (selectedModel === "turbo") {
    modeStyleTag = "Semi-realistic Marvel comic art illustration, sharp bold ink outlines, energetic colors, realistic anatomy, clean comic shading, no text, no speech bubbles.";
  }

  const fullPollinationsPrompt = `${cleanScenePrompt}. ${modeStyleTag}`.slice(0, 950);
  const seed = Math.floor(Math.random() * 10000000);

  // 1. PRIMARY METHOD: Direct URL generation via https://image.pollinations.ai/prompt/[İngilizce-Görsel-Tanımı]
  // 100% Free, NO API keys, NO payment, immediate response
  const freeUrlsToTry: { url: string; label: string }[] = [];

  // Model-specific direct URL
  if (selectedModel !== "flux") {
    freeUrlsToTry.push({
      url: `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPollinationsPrompt)}?width=${width}&height=${height}&model=${encodeURIComponent(selectedModel)}&nologo=true&seed=${seed}`,
      label: `image.pollinations.ai (${selectedModel})`
    });
  }

  // Standard FLUX direct URL: https://image.pollinations.ai/prompt/...
  freeUrlsToTry.push({
    url: `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPollinationsPrompt)}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`,
    label: "image.pollinations.ai (flux)"
  });

  // Pure canonical direct URL (no model param, pure prompt)
  freeUrlsToTry.push({
    url: `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPollinationsPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`,
    label: "image.pollinations.ai (canonical direct)"
  });

  // Short clean prompt fallback
  freeUrlsToTry.push({
    url: `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanScenePrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`,
    label: "image.pollinations.ai (clean prompt direct)"
  });

  for (const item of freeUrlsToTry) {
    try {
      console.log(`[Pollinations Free URL] Doğrudan URL ile görsel üretiliyor: "${item.label}" (${width}x${height}, seed: ${seed})...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 28000);

      const res = await fetch(item.url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        if (arrayBuffer && arrayBuffer.byteLength > 2000) {
          const contentType = res.headers.get("content-type") || "image/jpeg";
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          console.log(`[Pollinations Free URL] Görsel başarıyla üretildi ve alındı (${arrayBuffer.byteLength} bytes)! Kaynak: ${item.label}`);
          return `data:${contentType};base64,${base64}`;
        }
      } else {
        console.warn(`[Pollinations Free URL] HTTP error ${res.status} from ${item.label}`);
      }
    } catch (pollErr: any) {
      console.warn(`[Pollinations Free URL] Hata (${item.label}):`, pollErr?.message || pollErr);
    }
  }

  // 2. Secondary fallback (gen.pollinations.ai with user's optional personal key if configured)
  const polKey = getPollinationsApiKey();
  if (polKey) {
    try {
      console.log(`[Pollinations Gen] Optional key detected. Trying gen.pollinations.ai fallback...`);
      const genUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(fullPollinationsPrompt)}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}&key=${encodeURIComponent(polKey)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(genUrl, {
        signal: controller.signal,
        headers: { "Authorization": `Bearer ${polKey}` }
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        if (arrayBuffer && arrayBuffer.byteLength > 2000) {
          const contentType = res.headers.get("content-type") || "image/jpeg";
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          return `data:${contentType};base64,${base64}`;
        }
      }
    } catch (genErr: any) {
      console.warn("[Pollinations Gen Fallback] Keyed attempt failed:", genErr?.message || genErr);
    }
  }

  // If all Pollinations endpoints fail or return HTTP 402 AND Gemini API is not circuit-broken,
  // seamlessly attempt Gemini AI image generation fallback (if Gemini API key is configured)!
  if (!isCircuitOpen()) {
    const ai = getAIOrNull();
    if (ai) {
      try {
        console.log("[Pollinations] Free Pollinations models unavailable. Attempting Gemini AI image fallback...");
        const sanitizedPrompt = sanitizePromptForSafety(prompt, contentRating as any);
        const contentParts = [{ text: sanitizedPrompt }];
        const imageConfig: any = { aspectRatio };

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: { parts: contentParts },
          config: {
            imageConfig,
            safetySettings: DEFAULT_IMAGE_SAFETY_SETTINGS
          }
        });

        const extracted = extractImageFromResponse(response);
        if (extracted.base64Image) {
          console.log("[Pollinations Fallback] Successfully generated image via Gemini Flash Image!");
          return `data:image/png;base64,${extracted.base64Image}`;
        }
      } catch (gemFallbackErr: any) {
        console.warn("[Pollinations Fallback] Gemini fallback attempt failed:", gemFallbackErr?.message || gemFallbackErr);
      }
    }
  }

  // Graceful fallback to SVG if network completely offline
  console.warn("[Pollinations] All free generation attempts failed or offline. Generating fallback SVG.");
  return generateStylizedComicSvg(prompt, isFullPage, contentRating);
}

export async function generateImageViaTogetherFlux(
  prompt: string,
  aspectRatio: "1:1" | "4:3" | "16:9" | "3:4" | "9:16" = "1:1",
  isFullPage: boolean = false,
  contentRating: string = "pg17",
  renderQuality: string = "High"
): Promise<string> {
  const apiKey = getTogetherApiKey();
  if (!apiKey) {
    throw new Error("Together AI API anahtarı bulunamadı. Lütfen sağ üstteki 'API Anahtarı' ayarından Together AI anahtarınızı girin.");
  }

  // 1. Calculate dimensions (multiples of 32 or standard)
  let width = 1024;
  let height = 1024;
  if (aspectRatio === "4:3") { width = 1024; height = 768; }
  else if (aspectRatio === "3:4") { width = 768; height = 1024; }
  else if (aspectRatio === "16:9") { width = 1024; height = 576; }
  else if (aspectRatio === "9:16") { width = 576; height = 1024; }

  // 2. Clean prompt
  const cleanScenePrompt = prompt
    .replace(/\[MASTER COMIC PANEL DIRECTIVE\]:?/gi, "")
    .replace(/\[PRIMARY SCENE ACTION & COMPOSITION\]:?/gi, "")
    .replace(/\[MANDATORY CHARACTER POSITIONS, POSES & STAGING\]:?/gi, "Positions:")
    .replace(/\[CHARACTERS IN PANEL[^\]]*\]:?/gi, "Characters:")
    .replace(/\[ARTISTIC EXECUTION\]:?[\s\S]*$/gi, "")
    .replace(/\[STRICT CHARACTER EXCLUSION[^\]]*\]:?[\s\S]*?(?=\n\n|\n\[|$)/gi, "")
    .replace(/\[ATTACHED VISUAL REFERENCE[^\]]*\]:?[\s\S]*?(?=\n\n|\n\[|$)/gi, "")
    .replace(/\[.*?\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);

  const styleTag = "Masterpiece semi-realistic Marvel comic book illustration style, realistic human anatomy, lifelike facial features and expressive eyes, refined black ink contours with dynamic cross-hatching, rich volumetric cinematic shading, tactile fabric textures, dramatic rim lighting, published Marvel graphic novel masterpiece, no text, no speech bubbles.";
  const fullPrompt = `${cleanScenePrompt}. ${styleTag}`.slice(0, 1200);

  // Model selection: FLUX.1-dev for Ultra/Paid_Pro, FLUX.1-schnell for High/Standard
  const model = (renderQuality === "Ultra" || renderQuality === "Paid_Pro")
    ? "black-forest-labs/FLUX.1-dev"
    : "black-forest-labs/FLUX.1-schnell";
  const steps = model.includes("dev") ? 28 : 4;

  console.log(`[TogetherAI] Generating image with model "${model}" (${width}x${height}, steps: ${steps})...`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch("https://api.together.xyz/v1/images/generations", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "ComicGen-AI/1.0"
      },
      body: JSON.stringify({
        model,
        prompt: fullPrompt,
        width,
        height,
        steps,
        n: 1,
        response_format: "b64_json"
      })
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const errorMsg = errorJson?.error?.message || `HTTP ${res.status} (${res.statusText})`;
      console.warn(`[TogetherAI] API error: ${errorMsg}`);
      throw new Error(`Together AI Hatası: ${errorMsg}`);
    }

    const data = await res.json();
    const item = data?.data?.[0];

    if (item?.b64_json) {
      console.log(`[TogetherAI] Successfully generated image via ${model}!`);
      return `data:image/png;base64,${item.b64_json}`;
    }

    if (item?.url) {
      console.log(`[TogetherAI] Image URL received: ${item.url}`);
      try {
        const imgRes = await fetch(item.url);
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer();
          const mime = imgRes.headers.get("content-type") || "image/png";
          return `data:${mime};base64,${Buffer.from(buffer).toString("base64")}`;
        }
      } catch (fetchErr) {
        console.warn("[TogetherAI] Error fetching image URL to base64, returning raw URL:", fetchErr);
      }
      return item.url;
    }

    throw new Error("Together AI beklenen görsel verisini döndürmedi.");
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function generateImageViaFalFlux(
  prompt: string,
  aspectRatio: "1:1" | "4:3" | "16:9" | "3:4" | "9:16" = "1:1",
  isFullPage: boolean = false,
  contentRating: string = "pg17",
  renderQuality: string = "High"
): Promise<string> {
  const apiKey = getFalApiKey();
  if (!apiKey) {
    throw new Error("fal.ai API anahtarı bulunamadı. Lütfen 'API Anahtarı' ayarından fal.ai anahtarınızı girin.");
  }

  // 1. Calculate dimensions (multiples of 16/32)
  let width = 1024;
  let height = 1024;
  if (aspectRatio === "4:3") { width = 1024; height = 768; }
  else if (aspectRatio === "3:4") { width = 768; height = 1024; }
  else if (aspectRatio === "16:9") { width = 1024; height = 576; }
  else if (aspectRatio === "9:16") { width = 576; height = 1024; }

  // 2. Clean prompt
  const cleanScenePrompt = prompt
    .replace(/\[MASTER COMIC PANEL DIRECTIVE\]:?/gi, "")
    .replace(/\[PRIMARY SCENE ACTION & COMPOSITION\]:?/gi, "")
    .replace(/\[MANDATORY CHARACTER POSITIONS, POSES & STAGING\]:?/gi, "Positions:")
    .replace(/\[CHARACTERS IN PANEL[^\]]*\]:?/gi, "Characters:")
    .replace(/\[ARTISTIC EXECUTION\]:?[\s\S]*$/gi, "")
    .replace(/\[STRICT CHARACTER EXCLUSION[^\]]*\]:?[\s\S]*?(?=\n\n|\n\[|$)/gi, "")
    .replace(/\[ATTACHED VISUAL REFERENCE[^\]]*\]:?[\s\S]*?(?=\n\n|\n\[|$)/gi, "")
    .replace(/\[.*?\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);

  const styleTag = "Masterpiece semi-realistic Marvel comic book illustration style, realistic human anatomy, lifelike facial features and expressive eyes, refined black ink contours with dynamic cross-hatching, rich volumetric cinematic shading, tactile fabric textures, dramatic rim lighting, published Marvel graphic novel masterpiece, no text, no speech bubbles.";
  const fullPrompt = `${cleanScenePrompt}. ${styleTag}`.slice(0, 1200);

  // Model selection: fal-ai/flux/dev for Ultra, fal-ai/flux/schnell for High/Standard
  const model = (renderQuality === "Ultra" || renderQuality === "Paid_Pro")
    ? "fal-ai/flux/dev"
    : "fal-ai/flux/schnell";
  const steps = model.includes("dev") ? 28 : 4;

  console.log(`[fal.ai] Generating image with model "${model}" (${width}x${height}, steps: ${steps})...`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const authHeader = apiKey.startsWith("Key ") ? apiKey : `Key ${apiKey}`;
    const res = await fetch(`https://fal.run/${model}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "User-Agent": "ComicGen-AI/1.0"
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_size: { width, height },
        num_inference_steps: steps,
        num_images: 1,
        enable_safety_checker: false
      })
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const errorMsg = errorJson?.detail || errorJson?.message || `HTTP ${res.status} (${res.statusText})`;
      console.warn(`[fal.ai] API error: ${errorMsg}`);
      throw new Error(`fal.ai Hatası: ${errorMsg}`);
    }

    const data = await res.json();
    const item = data?.images?.[0];

    if (item?.url) {
      console.log(`[fal.ai] Image generated successfully: ${item.url}`);
      try {
        const imgRes = await fetch(item.url);
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer();
          const mime = imgRes.headers.get("content-type") || item.content_type || "image/jpeg";
          return `data:${mime};base64,${Buffer.from(buffer).toString("base64")}`;
        }
      } catch (fetchErr) {
        console.warn("[fal.ai] Error converting image URL to base64, returning raw URL:", fetchErr);
      }
      return item.url;
    }

    throw new Error("fal.ai beklenen görsel verisini döndürmedi.");
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function generateImageWithFallback(
  prompt: string,
  aspectRatio: "1:1" | "4:3" | "16:9" | "3:4" | "9:16" = "1:1",
  inlineImageParts: any[] = [],
  isFullPage: boolean = false,
  contentRating: "pg13" | "pg17" | "pg18" = "pg17",
  modestyTechnique?: "sheets" | "steam" | "silhouette" | "angles" | "macro" | "auto",
  renderQuality: string = "High",
  imageProvider: "auto" | "pollinations_flux" | "together_flux" | "fal_flux" | "gemini" = "auto",
  pollinationsModel?: string
): Promise<string> {
  const falKey = getFalApiKey();
  const togetherKey = getTogetherApiKey();

  // If user explicitly selected fal.ai FLUX
  if (imageProvider === "fal_flux") {
    console.log("[ImageGen] Mode: fal.ai FLUX. Direct generation...");
    try {
      return await generateImageViaFalFlux(prompt, aspectRatio, isFullPage, contentRating, renderQuality);
    } catch (falErr: any) {
      console.warn("[ImageGen] fal.ai failed:", falErr?.message || falErr);
      console.log("[ImageGen] Falling back to Free Pollinations FLUX...");
      return await generateImageViaPollinations(prompt, aspectRatio, isFullPage, contentRating, pollinationsModel);
    }
  }

  // If user explicitly selected Together AI FLUX
  if (imageProvider === "together_flux") {
    console.log("[ImageGen] Mode: Together AI FLUX. Direct generation...");
    try {
      return await generateImageViaTogetherFlux(prompt, aspectRatio, isFullPage, contentRating, renderQuality);
    } catch (togetherErr: any) {
      console.warn("[ImageGen] Together AI failed:", togetherErr?.message || togetherErr);
      console.log("[ImageGen] Falling back to Free Pollinations FLUX...");
      return await generateImageViaPollinations(prompt, aspectRatio, isFullPage, contentRating, pollinationsModel);
    }
  }

  // If user selected 100% Free FLUX (Pollinations), skip Gemini image calls completely!
  if (imageProvider === "pollinations_flux") {
    console.log(`[ImageGen] Mode: 100% Free FLUX (Pollinations.ai, model: ${pollinationsModel || "flux"}). Direct free generation...`);
    return await generateImageViaPollinations(prompt, aspectRatio, isFullPage, contentRating, pollinationsModel);
  }

  // If auto and fal or Together key is present, prefer fast dedicated FLUX!
  if (imageProvider === "auto") {
    if (falKey) {
      try {
        console.log("[ImageGen] Auto mode: fal.ai key active! Using fal.ai FLUX...");
        return await generateImageViaFalFlux(prompt, aspectRatio, isFullPage, contentRating, renderQuality);
      } catch (autoFalErr: any) {
        console.warn("[ImageGen] Auto fal.ai attempt failed, continuing:", autoFalErr?.message);
      }
    }
    if (togetherKey) {
      try {
        console.log("[ImageGen] Auto mode: Together AI key active! Using Together FLUX...");
        return await generateImageViaTogetherFlux(prompt, aspectRatio, isFullPage, contentRating, renderQuality);
      } catch (autoTogetherErr: any) {
        console.warn("[ImageGen] Auto Together attempt failed, continuing:", autoTogetherErr?.message);
      }
    }
  }

  // If circuit is open (Gemini API quota exhausted)
  if (isCircuitOpen()) {
    if (falKey) {
      try {
        console.log("[ImageGen] Gemini circuit open. Using fal.ai FLUX...");
        return await generateImageViaFalFlux(prompt, aspectRatio, isFullPage, contentRating, renderQuality);
      } catch (e) {
        console.warn("[ImageGen] fal.ai fallback error:", e);
      }
    }
    if (togetherKey) {
      try {
        console.log("[ImageGen] Gemini circuit open. Using Together AI FLUX...");
        return await generateImageViaTogetherFlux(prompt, aspectRatio, isFullPage, contentRating, renderQuality);
      } catch (e) {
        console.warn("[ImageGen] Together fallback error:", e);
      }
    }
    console.log("[ImageGen] Gemini circuit open (quota reached). Seamlessly falling back to Free FLUX (Pollinations)...");
    return await generateImageViaPollinations(prompt, aspectRatio, isFullPage, contentRating, pollinationsModel);
  }

  let wasSafetyBlocked = false;

  // Step 1: Pre-sanitize the prompt with comprehensive safety filters (translates sensitive terms into PG-17/18 filter-safe sensuality)
  const sanitizedPrompt = sanitizePromptForSafety(prompt, contentRating, modestyTechnique);

  // Step 2: Try primary image models with sanitized prompt (with high resolution 1K/2K)
  const ai = getAIOrNull();
  if (!ai) {
    if (imageProvider === "gemini") {
      throw new Error("Lütfen Google Gemini Imagen Pro motorunu kullanmak için geçerli bir Google Gemini API anahtarı girin veya %100 Ücretsiz FLUX modunu seçin.");
    }
    console.log("[ImageGen] Google Gemini API anahtarı girilmemiş. Otomatik olarak %100 Ücretsiz FLUX motoruna geçiliyor...");
    return await generateImageViaPollinations(prompt, aspectRatio, isFullPage, contentRating, pollinationsModel);
  }

  for (const model of IMAGE_MODELS) {
    try {
      console.log(`[ImageGen] Trying model ${model} (aspectRatio: ${aspectRatio}, rating: ${contentRating}, quality: ${renderQuality})...`);
      const contentParts = inlineImageParts.length > 0
        ? [...inlineImageParts, { text: sanitizedPrompt }]
        : [{ text: sanitizedPrompt }];

      const imageConfig: any = { aspectRatio };
      if (model === "gemini-3-pro-image" || model === "gemini-3.1-flash-image") {
        imageConfig.imageSize = renderQuality === "Ultra" ? "2K" : "1K";
      }

      const response = await ai.models.generateContent({
        model,
        contents: { parts: contentParts },
        config: {
          imageConfig,
          safetySettings: DEFAULT_IMAGE_SAFETY_SETTINGS
        }
      });

      const extracted = extractImageFromResponse(response);
      if (extracted.base64Image) {
        console.log(`[ImageGen] Successfully generated image with ${model}`);
        return `data:image/png;base64,${extracted.base64Image}`;
      }

      if (extracted.isSafetyBlocked) {
        console.warn(`[ImageGen] Model ${model} blocked by safety filter: ${extracted.finishReason}`);
        wasSafetyBlocked = true;
        break; // Break immediately to AI Safety Rescue Rewriter
      }

      if (extracted.textOutput) {
        console.warn(`[ImageGen] Model ${model} returned text instead of image:`, extracted.textOutput.substring(0, 120));
        continue;
      }
    } catch (err: any) {
      console.warn(`[ImageGen] Model ${model} attempt failed:`, err?.message || err);
      if (isDepletedOrQuotaError(err)) {
        console.warn("[ImageGen] API credits depleted / quota reached on model", model);
        recordQuotaError();
        console.log("[ImageGen] Seamlessly switching to Free FLUX (Pollinations) due to Gemini quota depletion...");
        return await generateImageViaPollinations(prompt, aspectRatio, isFullPage, contentRating, pollinationsModel);
      }
      const msg = String(err?.message || err);
      if (msg.includes("SAFETY") || msg.includes("PROHIBITED_CONTENT") || msg.includes("IMAGE_SAFETY")) {
        wasSafetyBlocked = true;
        break; // Trigger rescue immediately
      }
    }
  }

  // Step 3: AI Safety Rescue Rewriter if blocked by safety (Strict character and context preservation with PG-17 awareness)
  if (wasSafetyBlocked) {
    console.log("[ImageGen] Safety block detected! Activating AI Safety Rescue Rewriter (PG-17 aware)...");
    try {
      const rescuedPrompt = await rewritePromptForSafety(prompt, isFullPage, contentRating);
      for (const model of IMAGE_MODELS) {
        try {
          console.log(`[ImageGen SafetyRescue] Retrying with model ${model}...`);
          const rescueParts = inlineImageParts.length > 0
            ? [...inlineImageParts, { text: rescuedPrompt }]
            : [{ text: rescuedPrompt }];

          const imageConfig: any = { aspectRatio };
          if (model === "gemini-3-pro-image" || model === "gemini-3.1-flash-image") {
            imageConfig.imageSize = renderQuality === "Ultra" ? "2K" : "1K";
          }

          const res = await ai.models.generateContent({
            model,
            contents: { parts: rescueParts },
            config: {
              imageConfig,
              safetySettings: DEFAULT_IMAGE_SAFETY_SETTINGS
            }
          });

          const extracted = extractImageFromResponse(res);
          if (extracted.base64Image) {
            console.log(`[ImageGen SafetyRescue] Successfully rescued and generated image with ${model}!`);
            return `data:image/png;base64,${extracted.base64Image}`;
          }
        } catch (resErr: any) {
          console.warn(`[ImageGen SafetyRescue] ${model} attempt failed:`, resErr?.message || resErr);
        }
      }
    } catch (rescueErr) {
      console.warn("[ImageGen SafetyRescue] Rescue routine error:", rescueErr);
    }
  }

  // Step 4: Streamlined guaranteed context-preserving fallback retry
  console.log("[ImageGen] Running streamlined guaranteed Standard Comic fallback retry...");
  const cleanScenePrompt = sanitizedPrompt
    .replace(/\[MASTER COMIC PANEL DIRECTIVE\]:?/gi, "")
    .replace(/\[PRIMARY SCENE ACTION & COMPOSITION\]:?/gi, "")
    .replace(/\[MANDATORY CHARACTER POSITIONS, POSES & STAGING\]:?/gi, "Positions:")
    .replace(/\[CHARACTERS IN PANEL[^\]]*\]:?/gi, "Characters:")
    .replace(/\[ARTISTIC EXECUTION\]:?[\s\S]*$/gi, "")
    .replace(/\[STRICT CHARACTER EXCLUSION[^\]]*\]:?[\s\S]*?(?=\n\n|\n\[|$)/gi, "")
    .replace(/\[.*?\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 800);

  const isRomanceScene = isRomanceOrEmotionalTheme("", "", "", sanitizedPrompt);
  const fallbackStyleTag = contentRating === "pg18"
    ? "Award-winning PG-18 graphic novel illustration, passionate romantic intimacy, artistic satin sheet modesty drape, dramatic noir shadows, master draftsmanship"
    : contentRating === "pg17"
    ? "Award-winning PG-17 graphic novel illustration, intense romantic tension, candlelit atmosphere, rich cel-shading, crisp India ink lines"
    : isRomanceScene
    ? "Award-winning graphic novel illustration, gentle romantic emotion, warm lighting, crisp ink linework, published graphic novel masterpiece"
    : "Award-winning graphic novel comic illustration, rich character storytelling, crisp ink linework, vibrant coloring, professional comic art";

  const fallbackPrompts = isFullPage
    ? [
        `Masterpiece graphic novel comic page, 4 panels in symmetrical 2x2 grid, scene: ${cleanScenePrompt}. ${fallbackStyleTag}.`,
        `Graphic novel comic page, 4 panels in 2x2 grid, scene: ${cleanScenePrompt}. Crisp ink lines, vibrant colors, ${fallbackStyleTag}.`
      ]
    : [
        `Masterpiece graphic novel single panel illustration, scene: ${cleanScenePrompt}. ${fallbackStyleTag}.`,
        `Graphic novel comic art single panel, scene: ${cleanScenePrompt}. Crisp bold black ink lines, rich colors, ${fallbackStyleTag}.`
      ];

  for (const fbPrompt of fallbackPrompts) {
    for (const model of IMAGE_MODELS) {
      try {
        console.log(`[ImageGen Fallback] Retrying with ${model}...`);
        const fbParts = inlineImageParts.length > 0
          ? [...inlineImageParts, { text: fbPrompt }]
          : [{ text: fbPrompt }];

        const imageConfig: any = { aspectRatio };
        if (model === "gemini-3-pro-image" || model === "gemini-3.1-flash-image") {
          imageConfig.imageSize = "1K";
        }

        const response = await ai.models.generateContent({
          model,
          contents: { parts: fbParts },
          config: {
            imageConfig,
            safetySettings: DEFAULT_IMAGE_SAFETY_SETTINGS
          }
        });

        const extracted = extractImageFromResponse(response);
        if (extracted.base64Image) {
          console.log(`[ImageGen Fallback] Succeeded on ${model}!`);
          return `data:image/png;base64,${extracted.base64Image}`;
        }
      } catch (fbErr: any) {
        console.warn(`[ImageGen Fallback] ${model} attempt failed:`, fbErr?.message || fbErr);
      }
    }
  }

  // Step 5: Final absolute guarantee - If Gemini attempts failed, fall back to Together FLUX or Pollinations FLUX so user gets a real comic image!
  if (togetherKey) {
    try {
      console.log("[ImageGen] Gemini attempts exhausted. Trying Together AI FLUX...");
      return await generateImageViaTogetherFlux(prompt, aspectRatio, isFullPage, contentRating, renderQuality);
    } catch (e) {
      console.warn("[ImageGen] Together fallback attempt failed:", e);
    }
  }
  console.log("[ImageGen] All Gemini image generation attempts exhausted. Seamlessly switching to Free FLUX (Pollinations)...");
  const freeImg = await generateImageViaPollinations(prompt, aspectRatio, isFullPage, contentRating, pollinationsModel);
  if (freeImg && !freeImg.startsWith("data:image/svg+xml")) {
    return freeImg;
  }

  // Return a graceful stylized comic artwork SVG ONLY if image network calls were totally exhausted or offline
  return generateStylizedComicSvg(prompt, isFullPage, contentRating);
}

const parseJsonFromText = (text: string, fallback: any = null): any => {
  if (!text) return fallback;
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch {
        // continue
      }
    }
    const firstBracket = cleaned.indexOf("[");
    const lastBracket = cleaned.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
      } catch {
        // continue
      }
    }
  }
  return fallback;
};

export async function generateVisualManifest(name: string, description: string, style: string): Promise<string> {
  const ai = getAIOrNull();
  if (!ai) return description;
  const prompt = `
    Create an authoritative 360-degree Visual & Attire Manifest for a comic book character named "${name}".
    Basic Description: ${description}
    Art Style: ${style}
    
    The manifest must define with strict precision:
    1. EXACT HEAD & FACE: Skin tone, face shape, eye color & shape, eyebrows, nose, mouth/facial hair, and distinct scars/marks.
    2. EXACT HAIRSTYLE: Color (e.g., jet black, auburn red, platinum silver), cut/length, texture, front silhouette, side profile, and back view.
    3. EXACT SIGNATURE OUTFIT (MANDATORY): Detailed breakdown of upper garment (collar, jacket/shirt color and material, trim, logos), lower garment (pants/skirt color and fit), footwear (boots/shoes color), and signature accessories (belts, gloves, cape, holster, jewelry).
    4. DISTINCTIVE VISUAL ANCHORS: 2-3 unmistakable visual cues that identify this character instantly from any angle or distance.
    
    Output a single, highly descriptive English paragraph that can be directly injected into AI image generation prompts to guarantee 100% character continuity.
  `;

  try {
    const response = await ai.models.generateContent({
      model: STORY_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are a master character designer and lead art director for a premier graphic novel publishing house. Your visual manifests must be unambiguous, rigid, and detailed.",
      }
    });

    return extractTextContent(response) || description;
  } catch (error) {
    console.error("Visual manifest generation error:", error);
    return description;
  }
}

export function compileCharacterReferencePrompt(
  name: string,
  styleSheet: Partial<CharacterStyleSheet>,
  fallbackDesc?: string
): string {
  const parts: string[] = [];
  if (styleSheet.physicalTraits?.trim()) {
    parts.push(`[Physical/Face/Hair]: ${styleSheet.physicalTraits.trim()}`);
  }
  if (styleSheet.outfit?.trim()) {
    parts.push(`[Signature Outfit]: ${styleSheet.outfit.trim()}`);
  }
  if (styleSheet.accessories?.trim()) {
    parts.push(`[Accessories/Distinct Marks]: ${styleSheet.accessories.trim()}`);
  }
  if (styleSheet.colorPalette && styleSheet.colorPalette.length > 0) {
    parts.push(`[Color Palette]: ${styleSheet.colorPalette.join(", ")}`);
  }
  if (parts.length === 0) {
    return fallbackDesc || `Character ${name} with distinct facial features and signature comic outfit.`;
  }
  return `[CHARACTER STYLE SHEET - ${name.toUpperCase()}]: ${parts.join(" | ")}`;
}

export function getCharacterCanonicalAttire(character: Character): {
  outfitName: string;
  outfitDescription: string;
  physicalTraits: string;
  fullReference: string;
} {
  let outfitName = "Standart İkonik Kıyafet (Standard Canonical Attire)";
  let outfitDescription = "";

  // 1. Check outfits list and activeOutfitId
  if (character.outfits && character.outfits.length > 0) {
    const active = character.outfits.find(o => o.id === character.activeOutfitId) ||
                   character.outfits.find(o => o.isDefault) ||
                   character.outfits[0];
    if (active && active.description?.trim()) {
      outfitName = active.name || outfitName;
      outfitDescription = active.description.trim();
    }
  }

  // 2. Check styleSheet.outfit
  if (!outfitDescription && character.styleSheet?.outfit?.trim()) {
    outfitDescription = character.styleSheet.outfit.trim();
  }

  // 3. Fallback to visualManifest / description
  if (!outfitDescription) {
    if (character.visualManifest?.trim()) {
      outfitDescription = character.visualManifest.trim();
    } else {
      outfitDescription = character.description || "Signature comic book attire with distinct silhouette and colors.";
    }
  }

  const physicalTraits = character.styleSheet?.physicalTraits?.trim() || character.description || "";
  const fullReference = character.styleSheet?.referencePrompt || character.visualManifest || character.description;

  return {
    outfitName,
    outfitDescription,
    physicalTraits,
    fullReference
  };
}

export async function generateCharacterStyleSheet(
  name: string,
  description: string,
  style: string
): Promise<CharacterStyleSheet> {
  const fallbackPrompt = `[CHARACTER STYLE SHEET - ${name.toUpperCase()}]: ${description || name} in ${style} comic art style. Detailed facial features, signature costume, precise anatomical proportions.`;
  const fallbackSheet: CharacterStyleSheet = {
    physicalTraits: description || name,
    outfit: `Signature ${style} costume tailored for ${name}`,
    accessories: "Signature character equipment and stylized comic accessories",
    colorPalette: ["#1E293B", "#EAB308", "#DC2626", "#F8FAFC"],
    referencePrompt: fallbackPrompt,
    autoInject: true,
    lastUpdated: Date.now()
  };

  const ai = getAIOrNull();
  if (!ai) return fallbackSheet;

  const prompt = `
    You are the Lead Art Director and Character Designer for an acclaimed comic book publishing house.
    Create a comprehensive, structured "Character Style Sheet" (Karakter Görsel Kılavuzu) for comic character "${name}".
    Basic Character Description: ${description}
    Art Style: ${style}

    Analyze this character and define 4 strict, unambiguous sections in English (along with key color codes):
    1. 'physicalTraits': Exact details for hair (color, length, texture, silhouette from front and back), face shape, eye color & gaze, skin complexion, height, build.
    2. 'outfit': Complete signature costume breakdown: upper garment (jacket/shirt color, collar, trim, fabric), lower garment (pants/skirt color and fit), footwear (boots/shoes), material textures.
    3. 'accessories': Distinctive items, signature weapons/gear, scars, tattoos, jewelry, glasses, cape or insignia.
    4. 'colorPalette': Array of 3 to 5 hex codes or color names (e.g. ["#1A2B4C (Navy)", "#EAB308 (Gold)", "#18181B (Charcoal)"]).
    5. 'referencePrompt': A concise, highly dense reference prompt block that will be automatically injected into AI comic panel generation prompts to enforce 100% visual consistency.

    Return valid JSON.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      physicalTraits: { type: Type.STRING },
      outfit: { type: Type.STRING },
      accessories: { type: Type.STRING },
      colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
      referencePrompt: { type: Type.STRING },
    },
    required: ["physicalTraits", "outfit", "accessories", "referencePrompt"],
  };

  try {
    const response = await ai.models.generateContent({
      model: STORY_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are an art director defining immutable Character Style Sheets for comic character continuity.",
      }
    });
    const text = extractTextContent(response);
    const parsed = parseJsonFromText(text, null);
    if (parsed) {
      const compiled = parsed.referencePrompt || compileCharacterReferencePrompt(name, parsed, description);
      return {
        physicalTraits: parsed.physicalTraits || description,
        outfit: parsed.outfit || `Signature ${style} comic costume`,
        accessories: parsed.accessories || "None",
        colorPalette: Array.isArray(parsed.colorPalette) && parsed.colorPalette.length > 0 
          ? parsed.colorPalette 
          : ["#1E293B", "#EAB308", "#0F172A"],
        referencePrompt: compiled,
        autoInject: true,
        lastUpdated: Date.now()
      };
    }
  } catch (err) {
    console.warn("Character style sheet generation warning:", err);
  }

  return fallbackSheet;
}

export async function generateCharacterAvatar(
  name: string,
  visualManifest: string,
  style: string,
  usePaidApi: boolean = false,
  imageProvider: "auto" | "pollinations_flux" | "together_flux" | "fal_flux" | "gemini" = "auto",
  pollinationsModel?: string
): Promise<string> {
  const styleEnhancement = getStyleEnhancement(style);
  const prompt = `Masterclass 3-Part Semi-Realistic Marvel Comic Character Reference Model Sheet for "${name}".
[LAYOUT]: A horizontal character turnaround model sheet displaying the EXACT SAME character in THREE clear, evenly spaced views against a solid neutral studio backdrop:
1. FRONT VIEW (Ön Boydan): Full-length standing pose showcasing complete costume silhouette, exact colors, fabrics, posture, and footwear.
2. BACK VIEW (Arka Boydan): Full-length rear view showcasing rear hairstyle, back of jacket/armor/cape, belt, and rear footwear.
3. CLOSE-UP PORTRAIT (Portre): Detailed bust/headshot capturing realistic facial bone structure, lifelike eye clarity and depth, natural skin tone and texture, and natural facial expression.

[STRICT CHARACTER CONTINUITY & MARVEL REALISM MANDATES]:
- All 3 views MUST depict the EXACT SAME individual with identical facial features, skin complexion, hair color/style, and exact outfit colors.
- Art Style: Semi-realistic Marvel graphic novel illustration (inspired by Alex Ross, Gabriele Dell'Otto, and Adi Granov). Refined black ink lines with realistic human anatomy, volumetric shading, and tactile textures. ${styleEnhancement}
- Character Visual Manifest: ${visualManifest}.
- Quality: Crisp clean comic inking lines, nuanced cross-hatching, rich balanced shading, anatomically accurate realistic proportions, studio character turnaround sheet.
- Exclude: Goofy cartoon caricature, blurry faces, distorted hands, extra limbs, messy lines, low resolution, cropped heads.`;
  
  try {
    return await generateImageWithFallback(prompt, "4:3", [], false, "pg13", "auto", "High", imageProvider, pollinationsModel);
  } catch (err) {
    console.warn(`Avatar generation failed for ${name}:`, err);
    return "";
  }
}

export async function generateCharacterVariation(
  baseCharacter: Character,
  variationType: string,
  customPrompt: string,
  style: string,
  usePaidApi: boolean = false,
  imageProvider: "auto" | "pollinations_flux" | "together_flux" | "fal_flux" | "gemini" = "auto",
  pollinationsModel?: string
): Promise<{ newName: string; newDescription: string; newVisualManifest: string; avatarUrl: string }> {
  const ai = getAIOrNull();
  const metaPrompt = `You are a character designer for a comic book studio creating an alternate variation of an existing character.
Base Character Name: "${baseCharacter.name}"
Base Character Description: "${baseCharacter.description}"
Base Visual Guide: "${baseCharacter.visualManifest || baseCharacter.description}"
Variation Concept/Type: "${variationType}"
User's Variation Instructions: "${customPrompt}"

Create the transformed character profile:
1. Provide a suitable Name in Turkish (e.g., "${baseCharacter.name} (Yaşlı)", "${baseCharacter.name} (Çocuk)", "${baseCharacter.name} (Fantezi/Büyücü)", or "${baseCharacter.name} (Siber 2099)").
2. Provide a 1-2 sentence comic Description in Turkish explaining this transformed state.
3. Provide a rigid 3-part Visual Manifest describing the altered appearance across Front View, Back View, and Portrait views while preserving core facial bone structure or signature recognizable traits.

Output valid JSON only:
{
  "name": "...",
  "description": "...",
  "visualManifest": "..."
}`;

  let newName = `${baseCharacter.name} (${variationType})`;
  let newDescription = `${baseCharacter.name} karakterinin ${variationType} versiyonu. ${customPrompt}`;
  let newVisualManifest = `${baseCharacter.visualManifest || baseCharacter.description}. Variation: ${variationType}. ${customPrompt}`;

  if (ai) {
    try {
      const textRes = await ai.models.generateContent({
        model: STORY_MODEL,
        contents: metaPrompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const txt = extractTextContent(textRes);
      if (txt) {
        const parsed = parseJsonFromText(txt);
        if (parsed) {
          if (parsed.name) newName = parsed.name;
          if (parsed.description) newDescription = parsed.description;
          if (parsed.visualManifest) newVisualManifest = parsed.visualManifest;
        }
      }
    } catch (err) {
      console.warn("Variation text manifest warning:", err);
    }
  }

  const imageParts: any[] = [];
  if (baseCharacter.avatarUrl && baseCharacter.avatarUrl.includes(",")) {
    const match = baseCharacter.avatarUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match && match[2] && match[2].length > 100) {
      imageParts.push({
        inlineData: {
          mimeType: match[1] || "image/png",
          data: match[2]
        }
      });
    }
  }

  const styleEnhancement = getStyleEnhancement(style);
  const imagePrompt = `Create a professional 3-Part Character Reference Model Sheet for "${newName}", which is an alternate variation (${variationType}) of comic character "${baseCharacter.name}".
Transformation & concept notes: ${customPrompt}
Visual Manifest: ${newVisualManifest}

Layout: Complete Character Model Sheet displaying the EXACT SAME character in THREE distinct views side by side in a horizontal row on a clean, solid studio neutral background:
1. FRONT VIEW (Ön Boydan Görünüm): Full-body front-facing standing pose showcasing the transformed costume design, altered age/cybernetics/fantasy armor, and posture.
2. BACK VIEW (Arka Boydan Görünüm): Full-body rear view from behind showcasing back hairstyle, transformed cape/armor/pack rear details.
3. CLOSE-UP PORTRAIT (Portre / Yakın Yüz Çekimi): Detailed close-up bust/headshot portrait capturing altered facial features, age lines/youthful features/cybernetic eye/fantasy markings, expression, and hair texture.

STRICT CONSISTENCY RULES:
- All three views (Front, Back, Portrait) MUST depict the EXACT SAME varied character with 100% identical traits, colors, and accessories.
- Maintain recognizability from the original character while clearly executing the "${variationType}" transformation.
- Art Style: ${style}. ${styleEnhancement}`;

  let avatarUrl = "";
  try {
    avatarUrl = await generateImageWithFallback(
      imageParts.length > 0
        ? `Using this attached base character model sheet as visual reference, draw this variant:\n${imagePrompt}`
        : imagePrompt,
      "4:3",
      imageParts,
      false,
      "pg13",
      "auto",
      "High",
      imageProvider,
      pollinationsModel
    );
  } catch (imgErr) {
    console.warn("Variation image attempt warning:", imgErr);
  }

  return {
    newName,
    newDescription,
    newVisualManifest,
    avatarUrl
  };
}

export async function generateLocationVisualManifest(
  name: string,
  description: string,
  type: string,
  style: string
): Promise<string> {
  const ai = getAIOrNull();
  if (!ai) return description;
  const prompt = `
    Create an authoritative Environmental & Architectural Visual Manifest for a comic book ${type} named "${name}".
    Basic Description: ${description}
    Art Style: ${style}
    
    The manifest must define with strict precision:
    1. ARCHITECTURAL / STRUCTURAL ELEMENTS: Key structures, materials (e.g., rusted corrugated steel, polished obsidian marble, weathered red brick, glowing neon conduits).
    2. LIGHTING & COLOR PALETTE: Primary key lights, ambient color temperature, rim lighting, atmospheric glow, time of day.
    3. PROPS & SCENE DETAILS: Iconic background objects, signature props/technology/furniture, environmental storytelling artifacts.
    4. SENSORY & WEATHER ATMOSPHERE: Rain puddle reflections, volumetric haze, floating dust/arcane embers, steam vents.
    
    Output a concise, descriptive English paragraph that can be directly injected into AI image generation prompts to guarantee 100% environment continuity across all pages.
  `;

  try {
    const response = await ai.models.generateContent({
      model: STORY_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are a lead environment concept artist and art director for a major comic book studio. Your goal is to write strict, reproducible visual guides for fictional settings and iconic props.",
      }
    });

    return extractTextContent(response) || description;
  } catch (error) {
    console.error("Location visual manifest error:", error);
    return description;
  }
}

export async function generateLocationConceptArt(
  name: string,
  description: string,
  type: string,
  style: string,
  visualManifest?: string,
  usePaidApi: boolean = false,
  imageProvider: "auto" | "pollinations_flux" | "together_flux" | "fal_flux" | "gemini" = "auto",
  pollinationsModel?: string
): Promise<string> {
  try {
    const styleEnhancement = getStyleEnhancement(style);
    const manifestText = visualManifest || description;

    const prompt = `Masterpiece comic environment concept art sheet for ${type} "${name}".
[SETTING & ARCHITECTURE]: ${description}
[VISUAL MANIFEST]: ${manifestText}
[ART STYLE & FINISH]: ${style}. ${styleEnhancement}

[COMPOSITION & CINEMATOGRAPHY]:
- Wide panoramic establishing shot with rich atmospheric depth, architectural perspective, and vivid environmental storytelling.
- Masterful comic inking lineart, crisp background separation, rich volumetric lighting, cinematic color grading.
- Exclude: Blurry textures, low resolution, messy perspective, unrendered blocks, muddy colors.`;

    return await generateImageWithFallback(prompt, "16:9", [], false, "pg13", "auto", "High", imageProvider, pollinationsModel);
  } catch (error) {
    console.error("Location concept art error:", error);
    return "";
  }
}

const PRESET_COMIC_CONFIGS: Partial<ComicConfig>[] = [
  {
    topic: "Küller ve Gül Yaprakları",
    intro: "Tarihi bir köşkün restore edilen kütüphanesinde, gizemli bir ressam ile geçmişini arayan bir mimarın yolları yağmurlu bir akşam kesişir.",
    style: "Standart Çizgi Roman",
    tone: "Romantizm & Aşk",
    narratorVoice: "Duygusal & İçten",
    cast: [
      { id: "char-1", name: "Kaya", description: "30 yaşlarında, kararlı bakışlı, esmer bir mimar. Üzerinde lacivert kaşe palto ve gri boğazlı kazak." },
      { id: "char-2", name: "Leyla", description: "28 yaşlarında, zarif ve duygusal bir restoratör. Uzun dalgalı kestane saçlı, bordo atkılı." }
    ]
  },
  {
    topic: "Siber Gece: Kod Adı Neon",
    intro: "2088 yılında gökdelenlerin neon ışıkları altında kayıp bir yapay zekâ çekirdeğini arayan sibernetik bir dedektifin serüveni.",
    style: "Standart Çizgi Roman",
    tone: "Sci-Fi",
    narratorVoice: "Sert & Kararlı",
    cast: [
      { id: "char-3", name: "Ares", description: "Mekanik sibernetik kolu olan, siyah deri ceketli, karanlık bakışlı siber dedektif." },
      { id: "char-4", name: "Maya", description: "Hızlı reflekslere sahip dahi hacker. Mor neon vurgulu saçlar ve holografik arayüzler." }
    ]
  },
  {
    topic: "Boğazın Sisli Sırrı",
    intro: "Eski bir sahaf dükkanında bulunan mühürlü bir harita, İstanbul sokaklarında unutulmuş bir efsanenin kapısını aralar.",
    style: "Standart Çizgi Roman",
    tone: "Mystery",
    narratorVoice: "Merak Uyandırıcı & Dedektif",
    cast: [
      { id: "char-5", name: "Deniz", description: "Genç araştırmacı tarihçi, yuvarlak çerçeveli gözlükleri ve deri kaplı not defteri." },
      { id: "char-6", name: "Sinan", description: "Tarihi eser uzmanı, deneyimli ve ketum sahaf ustası." }
    ]
  },
  {
    topic: "İkinci Şans Kafe",
    intro: "Şehrin en sakin ara sokağında, sıcak kahve kokularının ve yarım kalmış sohbetlerin buluştuğu sıcacık bir köşe.",
    style: "Standart Çizgi Roman",
    tone: "Slice of Life",
    narratorVoice: "Sıcak & Samimi",
    cast: [
      { id: "char-7", name: "Emir", description: "Kahve ustası, sakin tavırlı ve güler yüzlü genç barista." },
      { id: "char-8", name: "Elif", description: "Kitap illüstratörü, her gün aynı masada çizim yapan sessiz ve dikkatli müşteri." }
    ]
  }
];

export async function generateRandomComicConfig(): Promise<Partial<ComicConfig>> {
  if (isCircuitOpen()) {
    const picked = PRESET_COMIC_CONFIGS[Math.floor(Math.random() * PRESET_COMIC_CONFIGS.length)];
    return {
      ...picked,
      cast: (picked.cast || []).map(c => ({ ...c, id: generateId() }))
    };
  }

  const ai = getAIOrNull();
  if (!ai) {
    const picked = PRESET_COMIC_CONFIGS[Math.floor(Math.random() * PRESET_COMIC_CONFIGS.length)];
    return {
      ...picked,
      cast: (picked.cast || []).map(c => ({ ...c, id: generateId() }))
    };
  }

  try {
    const prompt = `
      Generate a professional and exciting comic book concept in Turkish.
      The concept should be suitable for a high-quality graphic novel.
      
      Output JSON format:
      {
        "topic": "Catchy and meaningful title",
        "intro": "A rich, setting-the-scene paragraph with atmosphere and stakes.",
        "style": "Standart Çizgi Roman",
        "tone": "One of: 'Action', 'Comedy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life'",
        "narratorVoice": "A vivid description of the narration style",
        "cast": [
          { "name": "Character Name", "description": "Highly detailed physical description including age, mood, clothing, and one unique visual quirk." },
          { "name": "Character Name", "description": "Detailed visual profile." }
        ]
      }
      
      Generate exactly 2 to 3 distinct characters with relatable or exciting dynamics.
    `;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING },
        intro: { type: Type.STRING },
        style: { type: Type.STRING },
        tone: { type: Type.STRING },
        narratorVoice: { type: Type.STRING },
        cast: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["name", "description"]
          }
        }
      },
      required: ["topic", "intro", "style", "tone", "narratorVoice", "cast"]
    };

    const response = await ai.models.generateContent({
      model: STORY_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = extractTextContent(response);
    if (!text) throw new Error("Model kurgu çıktısı üretemedi.");

    const data = parseJsonFromText(text);
    const castWithIds = (data.cast || []).map((c: any) => ({
      ...c,
      id: generateId(),
    }));

    return {
      ...data,
      cast: castWithIds
    };
  } catch (err: any) {
    console.warn("[ConfigGen] Random comic config fallback activated:", err?.message || err);
    if (isDepletedOrQuotaError(err)) recordQuotaError();
    const picked = PRESET_COMIC_CONFIGS[Math.floor(Math.random() * PRESET_COMIC_CONFIGS.length)];
    return {
      ...picked,
      cast: (picked.cast || []).map(c => ({ ...c, id: generateId() }))
    };
  }
}

function splitStoryInto4Beats(userDirection: string): string[] {
  const cleaned = userDirection.trim();
  if (!cleaned) return [];

  // 1. Try splitting by sentence boundaries (. ! ? \n ;)
  let sentences = cleaned
    .split(/(?<=[.!?\n;])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (sentences.length === 4) {
    return sentences;
  }

  if (sentences.length > 4) {
    const beats: string[] = [];
    const chunkSize = Math.ceil(sentences.length / 4);
    for (let i = 0; i < 4; i++) {
      const slice = sentences.slice(i * chunkSize, (i + 1) * chunkSize);
      if (slice.length > 0) beats.push(slice.join(" "));
    }
    while (beats.length < 4) {
      beats.push(sentences[sentences.length - 1]);
    }
    return beats.slice(0, 4);
  }

  // 2. If fewer than 4 sentences, try splitting by comma, dash or coordinating conjunctions
  const clauses = cleaned
    .split(/(?:,\s+|\s+(?:ve|sonra|ardından|daha sonra|aniden|fakat|ama|derken|bunun üzerine)\s+)/i)
    .map(s => s.trim())
    .filter(s => s.length > 3);

  if (clauses.length >= 4) {
    return clauses.slice(0, 4);
  }

  // 3. If still fewer than 4, split words evenly into 4 beats
  const words = cleaned.split(/\s+/);
  if (words.length >= 8) {
    const perChunk = Math.ceil(words.length / 4);
    return [
      words.slice(0, perChunk).join(" "),
      words.slice(perChunk, perChunk * 2).join(" "),
      words.slice(perChunk * 2, perChunk * 3).join(" "),
      words.slice(perChunk * 3).join(" ")
    ];
  }

  // 4. Fallback: pad with what we have
  const result = [...sentences];
  while (result.length < 4) {
    result.push(cleaned);
  }
  return result.slice(0, 4);
}

async function generateScriptViaPollinationsFreeText(prompt: string): Promise<string | null> {
  const polKey = getPollinationsApiKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "ComicGen-AI/1.0"
  };
  if (polKey) {
    headers["Authorization"] = `Bearer ${polKey}`;
  }

  // 1. Try modern OpenAI-compatible Gen API (https://gen.pollinations.ai/v1/chat/completions)
  const models = ["openai/gpt-5.4-nano", "mistralai/mistral-small-3.2", "google/gemini-2.5-flash-lite", "openai"];
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const res = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are a master graphic novel writer and storyboard director. Output strictly valid JSON matching the requested schema with layoutType 'grid-2x2' and exactly 4 panels with imagePrompt and Turkish dialogue." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        })
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json().catch(() => null);
        const content = json?.choices?.[0]?.message?.content;
        if (content && typeof content === "string" && content.includes("panels")) {
          return content;
        }
      }
    } catch (err: any) {
      console.warn(`[PollinationsGenText] Model ${model} warning:`, err?.message || err);
    }
  }

  // 2. Legacy fallback to text.pollinations.ai
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "ComicGen-AI/1.0"
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a master graphic novel writer and storyboard director. Output strictly valid JSON matching the requested schema with layoutType 'grid-2x2' and exactly 4 panels with imagePrompt and Turkish dialogue." },
          { role: "user", content: prompt }
        ],
        model: "openai",
        jsonMode: true
      })
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return await res.text();
    }
  } catch (err: any) {
    console.warn("[PollinationsText] Free text generation fallback warning:", err?.message || err);
  }
  return null;
}

export function generateProceduralComicScript(
  config: ComicConfig,
  history: string[] = [],
  userDirection: string = ""
): { layoutType: string; panels: ComicPanelData[] } {
  const isRomance = isRomanceOrEmotionalTheme(config.topic, config.tone, config.intro, userDirection);
  const cast = config.cast && config.cast.length > 0 ? config.cast : [
    { name: "Kaya", description: "Esmer, kararlı bakışlı ana karakter." },
    { name: "Leyla", description: "Zarif, gizemli ve duygusal karakter." }
  ];
  const char1 = cast[0]?.name || "Kaya";
  const char2 = cast[1]?.name || (cast.length > 1 ? cast[1].name : "Gizemli Yabancı");
  const charNames = cast.length > 1 ? [char1, char2] : [char1];
  
  const isMature = config.contentRating === "pg18" && isRomance;
  const modesty = config.modestyConcealment || "sheets";

  const userBeats = userDirection && userDirection.trim() ? splitStoryInto4Beats(userDirection) : [];

  let panels: ComicPanelData[] = [];

  if (userBeats.length === 4) {
    // USER COMMAND: Detail and spread user's 4 beats across the 4 panels without adding/removing plot
    panels = userBeats.map((beat, i) => {
      const mentionedChars = cast.filter(c => isCharacterMentioned(c.name, beat));
      const activeCharNames = mentionedChars.length > 0 
        ? mentionedChars.map(c => c.name) 
        : (cast.length > 1 && i % 2 === 1 ? [char2] : [char1]);
      
      const otherChar = cast.find(c => !activeCharNames.includes(c.name))?.name || char2;

      const charTokens = activeCharNames.map(cn => {
        const found = cast.find(c => isNameMatch(c.name, cn));
        const attire = found ? getCharacterCanonicalAttire(found) : null;
        return attire ? `Featuring ${cn} (wearing their registered canonical standard attire: ${attire.outfitDescription})` : `Featuring ${cn}`;
      }).join(", ");

      const shotType = i === 0 ? "Cinematic wide establishing shot" :
                       i === 1 ? "Medium expressive two-shot" :
                       i === 2 ? "Dynamic dramatic close-up reaction angle" :
                                 "Impactful climax closing frame";

      const cameraAngle = i === 0 ? "standard" :
                          i === 1 ? "over_shoulder" :
                          i === 2 ? (isMature ? "modesty_over_shoulder" : "close_up_eyes") :
                                    (isRomance ? "romantic_dream" : "dutch_tilt");

      let dialogue = "";
      const quoteMatch = beat.match(/["“'«]([^"”'»]+)["”'»]/);
      if (quoteMatch && quoteMatch[1] && quoteMatch[1].trim().length > 2) {
        dialogue = quoteMatch[1].trim();
      } else {
        if (isRomance) {
          dialogue = i === 0 ? `${otherChar}, seni burada göreceğimi hiç tahmin etmemiştim...` :
                     i === 1 ? `Bazen her şeyi unutup sadece senin gözlerinin içine bakmak istiyorum.` :
                     i === 2 ? `Korkma, ne olursa olsun senin yanındayım.` :
                               `Söz ver bana; bu anı asla unutmayacağız.`;
        } else {
          dialogue = i === 0 ? `İşte geldik... Burası beklediğimizden çok daha gizemli görünüyor.` :
                     i === 1 ? `Dikkat et! Bu hareketlilik hiç normal değil.` :
                     i === 2 ? `Şimdi harekete geçmeliyiz, başka şansımız kalmadı!` :
                               `Sonunda başardık... Ama bu sadece başlangıç!`;
        }
      }

      const imagePrompt = `${shotType} for "${config.topic}". [EXACT SCENE MOMENT]: ${beat}. ${charTokens}. Masterpiece semi-realistic Marvel comic book illustration, crisp ink linework with dynamic cross-hatching, realistic anatomy, lifelike expressive facial acting, atmospheric rim lighting, professional Marvel graphic novel art.`;

      return {
        imagePrompt,
        dialogue,
        onomatopoeia: i === 2 && !isRomance ? "GÜMM!" : "",
        characterNames: activeCharNames,
        layoutHint: "square",
        isMature: Boolean(isMature && (i === 1 || i === 2)),
        cameraAngle,
        modestyConcealment: modesty
      };
    });
  } else if (isRomance) {
    panels = [
      {
        imagePrompt: `Emotive graphic novel opening panel for "${config.topic}". Close-up shot of ${char1} and ${char2} standing close together under warm atmospheric lighting, gentle eye contact filled with unspoken feelings, soft shadows, published graphic novel masterpiece.`,
        dialogue: `${char2}, seni ilk gördüğüm günden beri aklımda sadece tek bir soru var...`,
        onomatopoeia: "",
        characterNames: [char1, char2],
        layoutHint: "square",
        isMature: false,
        cameraAngle: "close_up_eyes",
        modestyConcealment: modesty
      },
      {
        imagePrompt: `Romantic graphic novel second panel for "${config.topic}". Medium two-shot of ${char1} reaching out gently towards ${char2}, emotional vulnerability, warm golden rim-light, delicate facial expressions, pure romance illustration.`,
        dialogue: `Biliyorum... Aramızdaki bu mesafeyi aşmak ikimizi de korkutuyor ama artık kaçamıyorum.`,
        onomatopoeia: "",
        characterNames: [char1, char2],
        layoutHint: "square",
        isMature: isMature,
        cameraAngle: isMature ? "modesty_over_shoulder" : "standard",
        modestyConcealment: modesty
      },
      {
        imagePrompt: `Intense romantic turning point panel for "${config.topic}". Cinematic angle capturing ${char1} and ${char2} in a passionate close embrace, hands entwined, breathless proximity, romantic candlelit amber and rose lighting, master draftsmanship.`,
        dialogue: `Bütün dünya karşımızda olsa bile, senin yanında olmak bana yetiyor.`,
        onomatopoeia: "",
        characterNames: [char1, char2],
        layoutHint: "square",
        isMature: isMature,
        cameraAngle: isMature ? "modesty_sheets" : "dramatic_split",
        modestyConcealment: modesty
      },
      {
        imagePrompt: `Romantic dramatic cliffhanger panel for "${config.topic}". Panoramic closing shot of ${char1} and ${char2} silhouetted against the glowing city skyline at dusk, shared vow, emotional resonance, beautiful comic art.`,
        dialogue: `Söz ver bana; yarın ne olursa olsun bu anı asla unutmayacağız.`,
        onomatopoeia: "",
        characterNames: [char1, char2],
        layoutHint: "square",
        isMature: false,
        cameraAngle: "romantic_dream",
        modestyConcealment: modesty
      }
    ];
  } else {
    // Action / Mystery / General
    panels = [
      {
        imagePrompt: `Dynamic graphic novel establishing panel for "${config.topic}". Wide shot of ${char1} surveying the mysterious environment under high-contrast dramatic lighting, cautious stance, crisp comic linework.`,
        dialogue: `Burada bir gariplik var... İzler tam bu noktada son buluyor.`,
        onomatopoeia: "",
        characterNames: [char1],
        layoutHint: "square",
        isMature: false,
        cameraAngle: "standard"
      },
      {
        imagePrompt: `Suspenseful second panel for "${config.topic}". Medium angle of ${char1} discovering a crucial clue while ${char2} steps forward in surprise, tense shadows, atmospheric graphic novel storytelling.`,
        dialogue: `${char1}, arkana bak! Tahmin ettiğimizden çok daha erken geldiler!`,
        onomatopoeia: "TIK!",
        characterNames: charNames,
        layoutHint: "square",
        isMature: false,
        cameraAngle: "over_shoulder"
      },
      {
        imagePrompt: `High-octane climax panel for "${config.topic}". Dynamic action frame of ${char1} taking decisive action, intense energy and dramatic comic composition, bold ink lines, vibrant primary colors.`,
        dialogue: `Geri çekil! Bu kapıyı açmanın tek bir yolu var, o da şimdi!`,
        onomatopoeia: "GÜMM!",
        characterNames: [char1],
        layoutHint: "square",
        isMature: false,
        cameraAngle: "low_angle_heroic"
      },
      {
        imagePrompt: `Dramatic cliffhanger panel for "${config.topic}". Stark graphic novel shot revealing the unexpected consequence or threshold, deep shadow contrast, leaving the reader on the edge of their seat.`,
        dialogue: `İnanamıyorum... Asıl macera şimdi başlıyor!`,
        onomatopoeia: "",
        characterNames: charNames,
        layoutHint: "square",
        isMature: false,
        cameraAngle: "dutch_tilt"
      }
    ];
  }

  if (userDirection && userDirection.trim()) {
    panels[1].dialogue = `${userDirection.slice(0, 80)}...`;
    panels[1].imagePrompt += ` Specifically featuring: ${userDirection.slice(0, 100)}.`;
  }

  return {
    layoutType: "grid-2x2",
    panels
  };
}

export async function generateComicScript(
  config: ComicConfig,
  history: string[],
  userDirection: string = ""
): Promise<{ layoutType: string; panels: ComicPanelData[] }> {
  if (isCircuitOpen()) {
    console.log("[StoryGen] Circuit open (API credits depleted/quota reached). Generating procedural comic script immediately.");
    return generateProceduralComicScript(config, history, userDirection);
  }

  const castDescription = config.cast
    .map((c) => {
      const attire = getCharacterCanonicalAttire(c);
      return `
- CHARACTER: "${c.name}"
  * CANONICAL / STANDARD ATTIRE (MANDATORY UNLESS USER STORY INPUT SPECIFICALLY COMMANDS A CLOTHING CHANGE): "${attire.outfitDescription}" [Attire Name: ${attire.outfitName}]
  * Physical Traits & Facial Likeness: ${attire.physicalTraits || c.description}
  * Full Reference Manifest: ${attire.fullReference}
      `.trim();
    })
    .join("\n\n");

  let locationDescription = "";
  if (config.locations && config.locations.length > 0) {
    locationDescription = "\n\nACTIVE LOCATIONS / ENVIRONMENTS / PROPS:\n" + 
      config.locations.map(l => `- [${l.type.toUpperCase()}] ${l.name}: ${l.visualManifest || l.description}`).join("\n");
  }

  let narrativeMemoryPrompt = "";
  if (config.storyMemory?.enabled && config.storyMemory.memories && config.storyMemory.memories.length > 0) {
    const activeMemories = config.storyMemory.memories.filter(m => m.isActive);
    if (activeMemories.length > 0) {
      narrativeMemoryPrompt = `
      [ACTIVE NARRATIVE MEMORY & UNRESOLVED PLOT THREADS]:
      ${activeMemories.map(m => `- [${m.category.toUpperCase()}] ${m.characterName ? `${m.characterName}: ` : ""}${m.description} -> CONSEQUENCE: ${m.visualImpact}`).join("\n")}
      `;
    }
  }

  if (config.storyMemory?.plotSummary) {
    narrativeMemoryPrompt += `\n[ESTABLISHED STORY SUMMARY SO FAR]:\n${config.storyMemory.plotSummary}\n`;
  }

  const previousContext = history.length > 0 ? history.join("\n") : "Story is just beginning at Page 1.";
  const lastEventBeat = history.length > 0 ? history[history.length - 1] : null;

  const continuityAnchor = lastEventBeat
    ? `
    >>> MANDATORY CHRONOLOGICAL CONTINUATION POINT (PREVIOUS PAGE'S FINAL BEAT) <<<
    ${lastEventBeat}
    
    STRICT SEQUENTIAL CONTINUITY RULES (NO PLOT DRIFT):
    - Panel 1 of this new page MUST immediately take place in the exact same scene or directly sequential next moment following the above final beat.
    - Characters MUST directly react to, reply to, or deal with whatever dialogue, threat, discovery, or emotion happened in the previous page's last panel.
    - DO NOT jump randomly to a new unrelated scenario, do NOT reset the scene, and do NOT forget current character goals and tension.
    - All dialogue in Turkish must maintain natural conversational flow from what was just established.
    `
    : `
    STRICT OPENING SCENE DIRECTIVE:
    - Establish the opening situation vividly based on the topic ("${config.topic}") and intro ("${config.intro}").
    `;

  const directionPrompt = userDirection && userDirection.trim() 
    ? `
    >>> SUPREME MANDATE: USER'S EXACT STORY, POSITION & SCENE DIRECTION (DO NOT OVERRIDE) <<<
    The user explicitly commanded the following scene, character actions, and positions for this page:
    """
    ${userDirection}
    """
    
    CRITICAL COMPLIANCE RULES:
    1. LITERAL POSITION & POSE FIDELITY: If the user mentioned any specific spatial positions (e.g. "masanın solunda oturuyor", "sağda ayakta duruyor", "sol ön planda", "arkada kapıda", "yüz yüze"), poses (e.g. "kahve içiyor", "parmağıyla işaret ediyor", "sarılıyor", "koşuyor", "arkasına bakıyor"), or specific gestures, YOU MUST FAITHFULLY DEPICT THESE EXACT POSITIONS AND POSES across the panels!
    2. ABSOLUTE SCENE & SETTING FIDELITY: If the user specified a setting (e.g. "kafede", "sokakta", "yağmur altında", "ofiste"), the page MUST immediately take place in that exact setting!
    3. ZERO MISATTRIBUTION: If the user wrote about character A performing an action, character A MUST perform it. Under NO circumstances make character B do character A's action!
    `
    : `CHRONOLOGICAL PROGRESSION:
       - Escalate the tension and advance the story forward by 1 beat across these 4 panels.
       - Panel 4 should end on a dramatic punchline, cliffhanger, or turning point.`;

  const focalCharacters = config.cast.filter(c => 
    isCharacterMentioned(c.name, userDirection) ||
    isCharacterMentioned(c.name, config.intro) ||
    isCharacterMentioned(c.name, config.topic)
  );

  let characterFocusPrompt = "";
  if (focalCharacters.length > 0) {
    characterFocusPrompt = `
    >>> CRITICAL USER CHARACTER EMPHASIS & CANONICAL ATTIRE (DO NOT DEVIATE) <<<
    The user's story explicitly focuses on: ${focalCharacters.map(c => `"${c.name}"`).join(", ")}.
    - MANDATORY: ${focalCharacters.map(c => `"${c.name}"`).join(" and ")} MUST be the primary subject in these panels!
    - ABSOLUTELY FORBIDDEN: DO NOT replace or substitute "${focalCharacters[0].name}" with any other character!
    - If the user wrote about person A (${focalCharacters[0].name}), person B MUST NOT appear in their place!
    - CANONICAL CLOTHING MANDATE: In each panel's 'imagePrompt', you MUST explicitly describe their registered standard canonical attire unless the user specifically wrote an outfit change in their story prompt.
    - For each panel, accurately populate 'characterNames' with the exact character(s) in that panel.
    - In each panel's 'imagePrompt', explicitly begin the character description with their exact name, position, canonical clothing, and pose (e.g. "Positioned on the left foreground, featuring ${focalCharacters[0].name} (wearing their registered canonical standard attire: [exact registered clothes], with signature facial features) in [exact pose specified by user]...").
    `;
  }

  let relationshipPrompt = "";
  if (Array.isArray(config.relationships) && config.relationships.length > 0) {
    const formattedRels = config.relationships.map(r => formatRelationshipForPrompt(r)).join("\n");
    relationshipPrompt = `
    >>> CHARACTER RELATIONSHIP & EMOTIONAL CHEMISTRY MATRIX (MANDATORY DYNAMICS) <<<
    The characters share the following defined interpersonal relationships, chemistry, and tension:
    ${formattedRels}

    CRITICAL RULES FOR CHARACTER INTERACTIONS:
    - Whenever any of these character pairs appear together in a panel, speak to each other, or react to one another:
      * REFLECT THEIR RELATIONSHIP ARCHETYPE: Their proximity, body language, facial expressions, and eye contact must directly convey their established bond.
      * TENSION LEVEL: Match the defined tension level (e.g. 80-100 means electric attraction, intense rivalry, or breathless closeness).
      * DIALOGUE SUBTEXT: In the panel 'dialogue', weave their established subtext (e.g. witty banter, whispered secrets, lingering tension, defensive defiance, or vulnerable affection).
      * If they are in romantic/passionate relations, emphasize their magnetic attraction, protective proximity, and lingering looks.
      * If they are enemies or rivals, emphasize sharp competitive friction and calculated stares.
    `;
  }

  const isRomance = isRomanceOrEmotionalTheme(config.topic, config.tone, config.intro, userDirection);

  const prompt = `
    You are an award-winning Graphic Novel Lead Writer & Storyboard Director.
    Story Topic & Core Premise: ${config.topic}
    Story Origin Context: ${config.intro}
    Tone: ${config.tone}
    Narrator Voice: ${config.narratorVoice || "Neutral"}
    
    Cast & Character Visual Manifests:
    ${castDescription}
    ${locationDescription}
    ${narrativeMemoryPrompt}
    ${characterFocusPrompt}
    ${relationshipPrompt}
    
    [COMPLETE STORY CHRONOLOGY BEFORE THIS PAGE]:
    ${previousContext}
    
    ${continuityAnchor}
    
    ${directionPrompt}

    ${isRomance ? `
    >>> SUPREME MANDATE: ABSOLUTE ROMANCE & EMOTIONAL DEPTH (SIFIR DÖVÜŞ & KESİNLİKLE KAVGA YOK) <<<
    - The story topic and theme is PURE ROMANCE, LOVE, AND HUMAN EMOTIONAL CONNECTION: "${config.topic}".
    - STRICTLY FORBIDDEN (MUTLAK YASAK):
      * NEVER introduce fights, punches, kicks, combat stances, brawls, martial arts, ninjas, weapons, guns, superheroes, villains, explosions, monsters, or violent confrontations!
      * Under NO circumstances should peaceful character interactions (conversations at a cafe, walking together, looking into each other's eyes, confessions of love, drinking coffee, sitting on a bench, hugging, kissing) be interrupted or replaced by fighting, attackers, or action combat!
    - ALL ACTIONS & STAGING IN EACH PANEL MUST DEPICT ROMANCE AND INTERPERSONAL CHEMISTRY:
      * Emotional body language: eye contact, shy blushes, warm smiles, holding hands across a table, leaning in close, gentle caresses.
      * Romantic moments: whispering confessions, heartfelt conversations, walking together under an umbrella, sunset walks, passionate embraces, deep kisses.
      * Narrative tension/conflict MUST be purely emotional, verbal, or relational (jealousy, misunderstanding, vulnerability, unspoken feelings), NEVER physical violence!
    - Every 'imagePrompt' MUST describe a beautifully framed romantic graphic novel scene with warm, inviting lighting and natural human poses. NEVER describe action fighting poses!
    ` : `
    >>> GENRE INTEGRITY MANDATE <<<
    - The established tone and genre is "${config.tone || "General"}".
    - Strictly adhere to this genre. Do NOT invent random superhero battles, combat, or martial arts brawls unless the topic explicitly demands action combat.
    `}
    
    Task: Write the script for EXACTLY 4 panels of this comic page.
    
    >>> ART DIRECTION & VISUAL STYLE MANDATE (MARVEL COMIC REALISM) <<<
    - The visual style is Semi-Realistic Marvel Comic Art (a harmonious blend of modern Marvel graphic novel draftsmanship and anatomically precise realism, inspired by Gabriele Dell'Otto, Adi Granov, and Alex Ross).
    - In each panel's 'imagePrompt', describe realistic human anatomy, lifelike facial bone structure, expressive eyes, authentic material textures (leather, denim, matte fabric, tactical armor), and cinematic lighting (dramatic rim lighting, volumetric shadows) rather than flat cartoon caricatures.

    CRITICAL IMAGE PROMPT PRODUCTION RULES (FOR FLAWLESS VISUAL GENERATION ON FIRST DRAW):
    1. EXPLICIT CAMERA FRAMING: Every 'imagePrompt' MUST begin with a clear cinematic camera shot (e.g. "Medium close-up shot", "Dramatic wide-angle establishing shot", "Dynamic low-angle two-shot", "Over-the-shoulder reaction shot").
    2. ONE CRISP FROZEN MOMENT: Describe exactly ONE clear, focused action or emotional interaction. Do NOT overload the prompt with multiple sequential actions.
    3. MANDATORY CHARACTER VISUAL TOKENS: Whenever a character is in the panel, start by explicitly naming them: e.g. "Featuring Kaya (short dark hair, brown eyes, blue jacket over grey tee)".
    4. EXPRESSIONS & STAGING: Detail their exact facial expression (e.g. "wide startled eyes, clenched jaw"), bodily posture (e.g. "leaning forward aggressively over the wooden desk"), and hand gestures.
    5. ENVIRONMENT & LIGHTING: Explicitly mention the background setting details and atmospheric lighting (e.g. "in the dimly lit rainy alleyway, amber streetlamp glow reflecting on wet cobblestones").
    6. ZERO UNINVITED CHARACTERS: ONLY characters explicitly declared in the Cast list (${config.cast.map(c => c.name).join(", ")}) may appear. If a panel is about one specific character, DO NOT include any other character.
    7. STRICT CANONICAL ATTIRE FIDELITY & COSTUME PERMANENCE (STANDART KIYAFETLERE MUTLAK SADAKAT):
       - UNLESS the user's story topic, intro, or prompt explicitly commands a costume change (e.g. "smokin giydi", "pijama giyiyor", "zırhını çıkardı", "kıyafetlerini değiştirdi"), YOU MUST DRAW EACH CHARACTER IN THEIR EXACT CANONICAL / STANDARD ATTIRE IN EVERY SINGLE PANEL!
       - In each panel's 'imagePrompt', you MUST explicitly describe their exact canonical attire: e.g. "Featuring Kaya (wearing his registered canonical standard attire: [exact jacket/shirt color and style, pants, shoes]), in [pose/action]...".
       - NEVER invent random new clothing, NEVER swap colors, NEVER let the character randomly wear a different t-shirt or jacket.
       - Characters CANNOT change clothes between panels unless explicitly directed by the story text.
    ${config.contentRating === "pg18" ? `8. PG-18 MATURE ADULT GRAPHIC NOVEL DIRECTIVE (SENSUAL PASSION & SOPHISTICATED NOIR/ADULT THEMES):
       - If the story presents romantic intimacy, bedroom allure, passionate encounters, or dark edgy noir drama:
         * UNLEASH MAXIMUM SENSUAL & EMOTIONAL PASSION! Depict intense magnetic closeness, heated whispers, parting lips, breathless embraces, bare shoulders/collarbones, and seductive candlelit/moonlit ambiance.
         * MANDATORY ARTISTIC MODESTY CONCEALMENT PROTOCOL (YASAĞA UYGUN AKILLI KAPATMA & SANSÜR):
           If characters are naked, making love, or undressed in bed together ("sevişme sahnesi", "yatakta", "çıplak"):
           THE CHARACTERS ARE UNDRESSED IN A PASSIONATE EMBRACE, BUT EXPLICIT NUDITY MUST BE ARTISTICALLY OBSCURED:
           1. Örtü & Çarşaf (Draped Satin Sheets): Luxurious silk sheets or duvets cover hips and modesty zones; exposed bare shoulders, collarbones, and arched backs remain visible.
           2. Buhar & Sis/Duman (Steam / Mist Veil): Rising hot bath steam, atmospheric mist, or candle smoke softly swirls around the bodies, naturally concealing sensitive anatomy.
           3. Loş Silüet & Chiaroscuro (Rim Lit Silhouette): Deep chiaroscuro shadows hide explicit details, while golden rim-lighting traces bodily contours.
           4. Omuz/Sırt Gizleyici Açı (Over-the-shoulder / Rear Angle): The camera shoots from behind so the partner's back/shoulder naturally shields explicit anatomy from the camera.
           5. Tensel Makro (Tactile Close-Up): Macro focus on entwined hands clutching bedsheets, parted breathless lips, throat, and closed eyes.
         * Mark 'isMature: true' for any panel featuring PG-18 intimacy or high-intensity scenes.
         * Specify 'cameraAngle': e.g. "modesty_sheets", "modesty_steam", "modesty_over_shoulder", "silhouette_shadow", "close_up_eyes".
         * Specify 'modestyConcealment': choose "sheets", "steam", "silhouette", "angles", or "macro".` : config.contentRating === "pg17" ? `8. PG-17 MATURE GRAPHIC NOVEL DIRECTIVE (SENSUAL & EROTIC TENSION TO THE HIGHEST ALLOWED ARTISTIC LIMIT):
       - If the user or story introduces romantic, intimate, sensual, or erotic themes (passionate glances, bedroom scenes, unbuttoned shirts, close physical embraces, whispering, kissing, intense tension):
         * MAXIMIZE ROMANTIC HEAT & SENSUAL ALLURE WITHOUT TRIPPING AI SAFETY FILTERS!
         * Depict intense magnetic chemistry, heavy bedroom eyes, seductive gazes, parted lips, breathless proximity, flushed cheeks, hands tangled in hair or caressing waist/jawline, and deep passionate kisses.
         * For bedroom or private scenes: Utilize elegant artistic framing, warm candlelight or moonlit backlighting, draped luxurious satin sheets, unbuttoned silk collars, and expressive silhouettes against shadows.
         * ZERO BANNED PROHIBITED CONTENT: Never output explicit anatomical genitalia or banned pornographic words (to guarantee 100% zero AI filter blocks). The aim is the ultimate sophisticated PG-17 romantic/sensual graphic novel art!
       - Blood & violence: Keep stylized and non-lethal (no gore, dismemberment, or corpses).` : `8. FAMILY-SAFE PG-13 MANDATE: Zero blood, gore, severed limbs, corpses, torture, or nudity. Frame high drama through emotional depth, character interactions, dramatic facial expressions, and natural graphic novel storytelling.`}
    9. MEANINGFUL DIALOGUE: Every panel MUST have punchy, natural Turkish dialogue or narrator caption (minimum 3-15 words)${config.contentRating !== "pg13" ? " with genuine emotional heat, romantic chemistry, or dramatic wit" : ""}.
    
    For each panel, provide:
    1. 'imagePrompt': Highly detailed, cinematographically framed visual prompt in English following all above rules.
    2. 'dialogue': Turkish dialogue or narrator caption (minimum 3-15 words).
    3. 'onomatopoeia': Sound effect (or empty string).
    4. 'characterNames': Array of exact character names present.
    5. 'layoutHint': "square".
    6. 'isMature': Boolean indicating if this panel has PG-18 intimacy, sensual romance, or mature themes.
    7. 'cameraAngle': Recommended camera framing ("modesty_sheets", "modesty_steam", "modesty_over_shoulder", "silhouette_shadow", "close_up_eyes", "over_shoulder", "birds_eye", "low_angle_heroic", "dutch_tilt", "standard").
    8. 'modestyConcealment': Recommended concealment technique if intimate ("sheets", "steam", "silhouette", "angles", "macro").
    
    Return layoutType "grid-2x2" and exactly 4 panels.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      layoutType: { type: Type.STRING },
      panels: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            imagePrompt: { type: Type.STRING },
            dialogue: { type: Type.STRING },
            onomatopoeia: { type: Type.STRING },
            characterNames: { type: Type.ARRAY, items: { type: Type.STRING } },
            layoutHint: { type: Type.STRING },
            isMature: { type: Type.BOOLEAN },
            cameraAngle: { type: Type.STRING },
            modestyConcealment: { type: Type.STRING }
          },
          required: ["imagePrompt", "dialogue", "characterNames"],
        },
      },
    },
    required: ["layoutType", "panels"],
  };

  let text = "";
  const ai = getAIOrNull();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: STORY_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          systemInstruction: isRomance
            ? "You are an award-winning romance and drama graphic novel writer. Generate emotional, intimate, and character-driven storyboards. Under NO circumstances add fights, combat, weapons, or superhero brawls. Every page must have exactly 4 panels in a 2x2 grid."
            : "You are a master comic book creator. Generate cinematic and consistent storyboards adhering strictly to the chosen genre. Every page must have exactly 4 panels in a 2x2 grid.",
        },
      });
      text = extractTextContent(response);
    } catch (storyErr: any) {
      console.warn(`[StoryGen] Primary model ${STORY_MODEL} failed:`, storyErr?.message || storyErr);
      if (isDepletedOrQuotaError(storyErr)) {
        recordQuotaError();
      }
      try {
        console.log(`[StoryGen] Trying fallback model ${STORY_MODEL_FALLBACK}...`);
        const fallbackResponse = await ai.models.generateContent({
          model: STORY_MODEL_FALLBACK,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            systemInstruction: isRomance
              ? "You are an award-winning romance and drama graphic novel writer. Generate emotional, intimate, and character-driven storyboards. Under NO circumstances add fights, combat, weapons, or superhero brawls. Every page must have exactly 4 panels in a 2x2 grid."
              : "You are a master comic book creator. Generate cinematic and consistent storyboards adhering strictly to the chosen genre. Every page must have exactly 4 panels in a 2x2 grid.",
          },
        });
        text = extractTextContent(fallbackResponse);
      } catch (fbErr: any) {
        console.error(`[StoryGen] Fallback model ${STORY_MODEL_FALLBACK} failed:`, fbErr?.message || fbErr);
        if (isDepletedOrQuotaError(fbErr)) {
          recordQuotaError();
        }
      }
    }
  }

  // If Gemini was not available or produced no text, try Pollinations free text API!
  if (!text) {
    console.log("[StoryGen] Gemini API anahtarı yok veya yanıt vermedi. Pollinations ücretsiz yapay zeka metin servisi deneniyor...");
    const pollinationsText = await generateScriptViaPollinationsFreeText(prompt);
    if (pollinationsText) {
      text = pollinationsText;
    }
  }

  if (!text) {
    console.log("[StoryGen] Prosedürel hikaye oluşturucu devreye giriyor (kullanıcının 4 karelik sahne komutu işleniyor)...");
    return generateProceduralComicScript(config, history, userDirection);
  }

  const rawParsed = parseJsonFromText(text, { panels: [] });
  let panels: any[] = Array.isArray(rawParsed) ? rawParsed : (rawParsed.panels || []);

  const defaultDialogues = isRomance ? [
    "Seni gördüğüm andan beri aklımdan çıkaramıyorum...",
    "Gözlerinin içine baktığımda her şey anlam kazanıyor.",
    "Bana öyle bakma, kalbimin atışını durduramıyorum.",
    "Bütün dünya dursa bile, senin yanında kalmak istiyorum."
  ] : [
    "Burada bir şeyler ters gidiyor, temkinli ilerlemeliyiz.",
    "İşte aradığımız ipucu tam önümüzde duruyor!",
    "Vakit daralıyor, hemen harekete geçmeliyiz!",
    "Sonunda yüzleştik... Bu hikaye burada bitmeyecek!"
  ];

  const cleanPanels: ComicPanelData[] = panels.map((p: any, idx: number) => {
    // 1. Determine characters for this panel
    let panelChars: string[] = [];
    if (Array.isArray(p.characterNames) && p.characterNames.length > 0) {
      panelChars = p.characterNames.filter((cn: string) => 
        config.cast.some(c => isNameMatch(c.name, cn))
      );
    }
    // 2. If empty, check imagePrompt and dialogue
    if (panelChars.length === 0) {
      const mentioned = config.cast.filter(c => 
        isCharacterMentioned(c.name, p.imagePrompt || "") || 
        isCharacterMentioned(c.name, p.dialogue || "")
      );
      if (mentioned.length > 0) {
        panelChars = mentioned.map(m => m.name);
      }
    }
    // 3. If still empty, use focal characters or primary character (do NOT round-robin switch characters)
    if (panelChars.length === 0) {
      if (focalCharacters.length > 0) {
        panelChars = [focalCharacters[0].name];
      } else if (config.cast.length > 0) {
        panelChars = [config.cast[0].name];
      }
    }

    const primaryCharName = panelChars[0] || "Hero";
    const pPrompt = typeof p.imagePrompt === "string" && p.imagePrompt.trim() 
      ? p.imagePrompt 
      : isRomance
      ? `Emotive romantic graphic novel panel ${idx + 1} for ${config.topic}. Featuring ${primaryCharName} with gentle expressive face, warm atmospheric lighting.`
      : `Dynamic comic panel ${idx + 1} for ${config.topic}. Featuring ${primaryCharName}, expressive face, dramatic lighting.`;
    
    let rawDialogue = typeof p.dialogue === "string" ? p.dialogue.trim() : "";
    if (!rawDialogue || rawDialogue === "..." || rawDialogue.length < 2) {
      rawDialogue = defaultDialogues[idx % defaultDialogues.length];
    }
    
    const isRatingPG18 = config.contentRating === "pg18";
    const panelIsMature = Boolean(
      p.isMature || 
      (isRatingPG18 && /(bedroom|intimate|kiss|embrace|sheets|bed|allure|sensual|romance|loş|tutku|yatak|öpüş|sarıl|seviş|çıplak|soyun)/i.test(pPrompt + " " + rawDialogue))
    );
    const panelModesty = (p.modestyConcealment as any) || config.modestyConcealment || (
      /buhar|duman|steam|mist/i.test(pPrompt + " " + rawDialogue) ? "steam" :
      /silüet|gölge|silhouette|candle/i.test(pPrompt + " " + rawDialogue) ? "silhouette" :
      /omuz|arkadan|behind|back/i.test(pPrompt + " " + rawDialogue) ? "angles" :
      /makro|dudak|el|finger|lips/i.test(pPrompt + " " + rawDialogue) ? "macro" : "sheets"
    );
    const panelCameraAngle = p.cameraAngle || (
      panelIsMature 
        ? (panelModesty === "steam" ? "modesty_steam" : panelModesty === "angles" ? "modesty_over_shoulder" : panelModesty === "silhouette" ? "silhouette_shadow" : "modesty_sheets") 
        : (config.defaultCameraAngle || undefined)
    );
    
    return {
      imagePrompt: pPrompt,
      dialogue: rawDialogue,
      onomatopoeia: p.onomatopoeia || "",
      characterNames: panelChars.length > 0 ? panelChars : [primaryCharName],
      layoutHint: "square",
      isMature: panelIsMature,
      isBlurred: Boolean(panelIsMature && config.blurMatureContent !== false),
      cameraAngle: panelCameraAngle,
      modestyConcealment: panelModesty,
      directorConfig: panelCameraAngle ? { characters: [], cameraAngle: panelCameraAngle } : undefined
    };
  });

  let finalPanels = cleanPanels.slice(0, 4);
  while (finalPanels.length < 4) {
    const panelIdx = finalPanels.length;
    const defaultChar = focalCharacters[0]?.name || config.cast[0]?.name || "Hero";
    finalPanels.push({
      imagePrompt: isRomance
        ? `Romantic continuation panel ${panelIdx + 1} for ${config.topic}. Featuring ${defaultChar}, emotive graphic novel composition.`
        : `Dramatic continuation panel ${panelIdx + 1} for ${config.topic}. Featuring ${defaultChar}, rich comic composition.`,
      dialogue: defaultDialogues[panelIdx % defaultDialogues.length],
      onomatopoeia: "",
      characterNames: [defaultChar],
      layoutHint: "square"
    });
  }

  const processedPanels = finalPanels.map((p: ComicPanelData) => {
    const styleSheetRefs: CharacterStyleSheetRef[] = [];
    config.cast.forEach(c => {
      const nameInCharList = Array.isArray(p.characterNames) && p.characterNames.some((cn: string) => isNameMatch(cn, c.name));
      const nameInPrompt = typeof p.imagePrompt === "string" && isCharacterMentioned(c.name, p.imagePrompt);
      if (nameInCharList || nameInPrompt) {
        const promptRef = c.styleSheet?.referencePrompt || c.visualManifest || c.description;
        if (promptRef && (c.styleSheet?.autoInject !== false)) {
          styleSheetRefs.push({
            characterId: c.id,
            characterName: c.name,
            referencePrompt: promptRef
          });
        }
      }
    });

    return {
      ...p,
      id: p.id || generateId(),
      characterStyleSheetRefs: styleSheetRefs
    };
  });

  return {
    layoutType: "grid-2x2",
    panels: processedPanels
  };
}

function extractCharacterImageParts(cast: Character[], maxImages: number = 3): { inlineImageParts: any[]; referenceGuideText: string } {
  const inlineImageParts: any[] = [];
  const referenceGuide: string[] = [];

  for (const char of cast) {
    if (inlineImageParts.length >= maxImages) break;
    if (char.avatarUrl && char.avatarUrl.includes(",")) {
      const match = char.avatarUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match && match[2] && match[2].length > 100) {
        inlineImageParts.push({
          inlineData: {
            mimeType: match[1] || "image/png",
            data: match[2]
          }
        });
        referenceGuide.push(`[ATTACHED VISUAL REFERENCE FOR "${char.name}"]: Maintain 100% exact facial likeness, hairstyle, hair color, skin tone, eye color, and signature clothing from this attached character sheet.`);
      }
    }
  }

  return {
    inlineImageParts,
    referenceGuideText: referenceGuide.length > 0 ? "\n" + referenceGuide.join("\n") : ""
  };
}

export async function generateFullPageImage(
  panels: ComicPanelData[],
  style: string,
  cast: Character[],
  layoutType: string = "grid-2x2",
  renderQuality: string = "High",
  locations: LocationItem[] = [],
  colorPalette?: string,
  lightingMood?: string,
  consistencyLock?: boolean,
  imageProvider: "auto" | "pollinations_flux" | "together_flux" | "fal_flux" | "gemini" = "auto",
  pollinationsModel?: string
): Promise<string> {
  const styleEnhancement = getStyleEnhancement(style, colorPalette, lightingMood, consistencyLock);
  
  const { inlineImageParts, referenceGuideText } = extractCharacterImageParts(cast, 3);

  let layoutDescription = `[MASTER COMIC PAGE DIRECTIVE]:
Draw a complete, print-ready graphic novel page with EXACTLY 4 PANELS arranged in a symmetrical 2x2 GRID (2 rows × 2 columns).
Art Style: ${style}. ${styleEnhancement}

[GRID & GUTTER SPECIFICATIONS]:
- Symmetrical 2x2 grid with clean, thick black borders.
- Exactly 4 panels: Top-Left, Top-Right, Bottom-Left, Bottom-Right.

[PANEL SCENE DIRECTIVES]:`;

  panels.slice(0, 4).forEach((p, i) => {
    const position = i === 0 ? "Panel 1 (Top-Left)" : i === 1 ? "Panel 2 (Top-Right)" : i === 2 ? "Panel 3 (Bottom-Left)" : "Panel 4 (Bottom-Right)";
    let panelPromptText = p.imagePrompt;
    if (p.characterStyleSheetRefs && p.characterStyleSheetRefs.length > 0) {
      const charRefSnippets = p.characterStyleSheetRefs.map(cr => `[${cr.characterName} Style]: ${cr.referencePrompt}`).join(" | ");
      panelPromptText += ` [Style Sheet Anchor: ${charRefSnippets}]`;
    }
    layoutDescription += `\n- ${position}: ${panelPromptText}`;
  });

  let matchedCharacters = cast.filter(c => c.avatarUrl || c.styleSheet?.referencePrompt || c.visualManifest || c.description);
  let continuityInstructions = "";
  if (matchedCharacters.length > 0) {
    continuityInstructions = "\n\n[STRICT CHARACTER STYLE SHEET & CANONICAL ATTIRE LOCK MANDATE]:\n" + 
      matchedCharacters.map(c => {
        const attire = getCharacterCanonicalAttire(c);
        return `- ${c.name} [MANDATORY CANONICAL ATTIRE]: "${attire.outfitDescription}". Unless story explicitly commanded an outfit change, maintain this exact clothing across every panel. Full manifest: ${attire.fullReference}`;
      }).join("\n");
  }

  if (locations.length > 0) {
    continuityInstructions += "\n\n[ENVIRONMENT & SETTING CONTINUITY]:\n" +
      locations.map(l => `- ${l.name}: ${l.visualManifest || l.description}`).join("\n");
  }

  const fullPromptText = `${layoutDescription}${continuityInstructions}${referenceGuideText}\n\n[GLOBAL PAGE TECHNIQUE COHESION]: Ensure all 4 panels share identical artistic linework, line weight, shading method, and color treatment as part of one cohesive graphic novel issue. All characters MUST have identical face structure, hair, and clothing across every single panel. Crisp comic ink linework, rich dynamic shadows, clean anatomy, expressive faces.`;

  return await generateImageWithFallback(fullPromptText, "1:1", inlineImageParts, true, "pg17", "auto", renderQuality, imageProvider, pollinationsModel);
}

export async function generateSinglePanelImage(
  panelPrompt: string,
  style: string,
  cast: Character[],
  renderQuality: string = "High",
  directorConfig?: PanelDirectorConfig,
  locations: LocationItem[] = [],
  colorPalette?: string,
  lightingMood?: string,
  consistencyLock?: boolean,
  characterNames?: string[],
  contentRating: "pg13" | "pg17" | "pg18" = "pg17",
  modestyTechnique?: "sheets" | "steam" | "silhouette" | "angles" | "macro" | "auto",
  topic?: string,
  tone?: string,
  imageProvider: "auto" | "pollinations_flux" | "together_flux" | "fal_flux" | "gemini" = "auto",
  pollinationsModel?: string
): Promise<string> {
  const isRomance = isRomanceOrEmotionalTheme(topic, tone, "", panelPrompt);
  const effectiveLighting = directorConfig?.lightingAtmosphere || lightingMood;
  const styleEnhancement = getStyleEnhancement(style, colorPalette, effectiveLighting, consistencyLock, isRomance);

  // 1. Explicitly requested characters for this panel
  let matchedCharacters: Character[] = [];
  if (Array.isArray(characterNames) && characterNames.length > 0) {
    matchedCharacters = cast.filter(c => 
      characterNames.some(cn => isNameMatch(cn, c.name))
    );
  }

  // 2. If characterNames was empty or unmatched, inspect prompt and directorConfig
  if (matchedCharacters.length === 0) {
    matchedCharacters = cast.filter(c => 
      isCharacterMentioned(c.name, panelPrompt) ||
      (directorConfig && directorConfig.characters.some(dc => dc.characterId === c.id || isNameMatch(dc.characterName, c.name)))
    );
  }

  // 3. If still empty and cast only has 1 character, assume that single hero
  if (matchedCharacters.length === 0 && cast.length === 1) {
    matchedCharacters = [cast[0]];
  }

  // 4. Identify characters in cast who are EXCLUDED from this panel
  const excludedCharacters = cast.filter(c => 
    !matchedCharacters.some(mc => mc.id === c.id || isNameMatch(mc.name, c.name))
  );

  // 5. Extract ONLY the avatar model sheets for the matched characters (NEVER attach an excluded character's image!)
  const { inlineImageParts, referenceGuideText } = extractCharacterImageParts(matchedCharacters, 2);

  // 6. Build clean, positive character visual descriptions (avoiding confusing negative directives)
  let characterGuideText = "";
  if (matchedCharacters.length === 1) {
    const mainChar = matchedCharacters[0];
    const attire = getCharacterCanonicalAttire(mainChar);
    characterGuideText = `Featuring ${mainChar.name}: ${attire.physicalTraits || mainChar.description}. Wearing signature attire: ${attire.outfitDescription}. Full visual description: ${attire.fullReference}.`;
  } else if (matchedCharacters.length > 1) {
    characterGuideText = `Featuring ${matchedCharacters.map(c => {
      const attire = getCharacterCanonicalAttire(c);
      return `${c.name} (${attire.physicalTraits || c.description}, wearing ${attire.outfitDescription})`;
    }).join(" and ")} interacting together in the scene.`;
  } else if (cast.length > 0) {
    characterGuideText = `Focus on the environment and dramatic atmosphere of the graphic novel scene.`;
  }

  let directorStagingText = "";
  if (directorConfig) {
    const stagingLines: string[] = [];
    if (directorConfig.compositionLayout) {
      stagingLines.push(`Framing & Layout: ${directorConfig.compositionLayout}`);
    }
    if (directorConfig.cameraAngle) {
      stagingLines.push(`Camera Perspective: ${directorConfig.cameraAngle}`);
    }
    if (directorConfig.lightingAtmosphere) {
      stagingLines.push(`Atmospheric Lighting: ${directorConfig.lightingAtmosphere}`);
    }
    if (directorConfig.characters && directorConfig.characters.length > 0) {
      directorConfig.characters.forEach(cp => {
        const charDesc: string[] = [];
        const slotMatch = POSITION_SLOTS.find(s => s.id === cp.positionSlot || cp.positionLabel?.includes(s.label));
        const spatial = slotMatch ? slotMatch.enLabel : (cp.positionLabel || "center foreground");
        charDesc.push(`positioned in the ${spatial}`);
        if (cp.poseLabel) charDesc.push(`pose: ${cp.poseLabel}`);
        if (cp.emotionLabel) charDesc.push(`expression: ${cp.emotionLabel}`);
        if (cp.customDirection) charDesc.push(`action: ${cp.customDirection}`);
        stagingLines.push(`- Character "${cp.characterName}" is ${charDesc.join(", ")}`);
      });
    }
    if (directorConfig.customActionPrompt) {
      stagingLines.push(`Director Action: ${directorConfig.customActionPrompt}`);
    }
    if (stagingLines.length > 0) {
      directorStagingText = stagingLines.join("\n");
    }
  }

  let locationGuideText = "";
  let matchedLocation: LocationItem | undefined;
  if (directorConfig?.locationId) {
    matchedLocation = locations.find(l => l.id === directorConfig.locationId);
  } else {
    matchedLocation = locations.find(l => panelPrompt.toLowerCase().includes(l.name.toLowerCase()));
  }

  if (matchedLocation) {
    locationGuideText = `Setting: ${matchedLocation.name} - ${matchedLocation.visualManifest || matchedLocation.description}`;
  }

  const textPrompt = `Masterpiece graphic novel panel illustration in ${style || "Modern Comic"} art style. ${styleEnhancement}

Scene Moment & Interaction:
${panelPrompt}
${directorStagingText ? `\nStaging & Composition:\n${directorStagingText}` : ""}
${locationGuideText ? `\nEnvironment:\n${locationGuideText}` : ""}

Characters:
${characterGuideText}
${referenceGuideText}

Artistic Execution:
${isRomance 
  ? "Award-winning romantic graphic novel panel art, crisp clean ink outlines, soft rich cel-shading, warm atmospheric lighting, expressive facial acting with emotional warmth, zero combat, zero fighting, pure romantic graphic novel illustration."
  : "Award-winning graphic novel panel art, crisp bold black ink outlines, volumetric cel-shading, vibrant cinematic colors, impeccable human anatomy with expressive faces, atmospheric lighting, sharp focus."}`;

  return await generateImageWithFallback(textPrompt, "1:1", inlineImageParts, false, contentRating, modestyTechnique, renderQuality, imageProvider, pollinationsModel);
}

export async function extractNarrativeMemoryUpdates(
  pagePanels: ComicPanelData[],
  pageNumber: number,
  cast: Character[],
  currentMemory?: NarrativeContinuityMemory
): Promise<{ newMemories: NarrativeMemoryItem[]; updatedSummary: string }> {
  const existingSummary = currentMemory?.plotSummary || "Hikayenin başlangıcı.";
  const ai = getAIOrNull();
  if (!ai) {
    return { newMemories: [], updatedSummary: existingSummary };
  }
  const panelTexts = pagePanels.map((p, idx) => `Panel ${idx + 1}: ${p.dialogue} (Scene: ${p.imagePrompt})`).join("\n");
  const castList = cast.map(c => c.name).join(", ");
  const existingMemories = currentMemory?.memories?.filter(m => m.isActive) || [];

  const prompt = `
  You are an expert Script Continuity Supervisor for a graphic novel studio.
  Analyze this newly created comic page and identify any SIGNIFICANT, PERSISTENT physical or narrative changes that MUST carry over to future pages.

  Characters in cast: ${castList}
  Current Story Summary: ${existingSummary}
  Existing Active Memories:
  ${existingMemories.map(m => `- [${m.category}] ${m.characterName || "General"}: ${m.description} (Visual: ${m.visualImpact})`).join("\n") || "None"}

  New Page ${pageNumber} Panels:
  ${panelTexts}

  Extract any NEW or UPDATED continuity events (Injuries, Items lost/gained, Environment damage, Relationships).
  For each memory item provide category, characterName, description (in Turkish), visualImpact (in Turkish/English).
  Also provide an updatedSummary (2-3 sentences in Turkish).
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      newMemories: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            characterName: { type: Type.STRING },
            description: { type: Type.STRING },
            visualImpact: { type: Type.STRING },
          },
          required: ["category", "description", "visualImpact"]
        }
      },
      updatedSummary: { type: Type.STRING }
    },
    required: ["newMemories", "updatedSummary"]
  };

  try {
    const response = await ai.models.generateContent({
      model: STORY_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = extractTextContent(response);
    if (!text) {
      return { newMemories: [], updatedSummary: existingSummary };
    }

    const data = parseJsonFromText(text, { newMemories: [], updatedSummary: existingSummary });
    const formattedMemories: NarrativeMemoryItem[] = (data.newMemories || []).map((m: any) => ({
      id: generateId(),
      category: ["injury", "item_lost", "item_gained", "environment_damage", "relationship_shift"].includes(m.category) ? m.category : "custom",
      characterName: m.characterName || undefined,
      description: m.description || "",
      visualImpact: m.visualImpact || "",
      isActive: true,
      createdInPage: pageNumber
    }));

    return {
      newMemories: formattedMemories,
      updatedSummary: data.updatedSummary || existingSummary
    };
  } catch (err) {
    console.warn("Could not extract continuity memories:", err);
    return { newMemories: [], updatedSummary: existingSummary };
  }
}

export async function editPanelImageInpainting(
  originalImageUrl: string,
  instructionPrompt: string,
  maskOverlayImageUrl?: string,
  style: string = "Modern Comic",
  cast: Character[] = [],
  renderQuality: string = "High",
  usePaidApi: boolean = false,
  imageProvider: "auto" | "pollinations_flux" | "together_flux" | "fal_flux" | "gemini" = "auto"
): Promise<string> {
  const styleEnhancement = getStyleEnhancement(style);

  const imageParts: any[] = [];
  if (originalImageUrl && originalImageUrl.includes(",")) {
    const match = originalImageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match && match[2] && match[2].length > 100) {
      imageParts.push({
        inlineData: {
          mimeType: match[1] || "image/png",
          data: match[2]
        }
      });
    }
  }

  if (maskOverlayImageUrl && maskOverlayImageUrl.includes(",")) {
    const maskMatch = maskOverlayImageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (maskMatch && maskMatch[2] && maskMatch[2].length > 100) {
      imageParts.push({
        inlineData: {
          mimeType: maskMatch[1] || "image/png",
          data: maskMatch[2]
        }
      });
    }
  }

  const characterContext = cast.length > 0
    ? cast.map(c => `- ${c.name}: ${c.visualManifest || c.description}`).join("\n")
    : "";

  const fullEditPrompt = `Masterclass comic inpainting and regional artwork retouching.
You are modifying the attached comic panel image.
[EDIT INSTRUCTION]: ${instructionPrompt}
${maskOverlayImageUrl ? "[ATTENTION]: Redraw and replace ONLY the indicated region." : ""}
${characterContext ? `[CHARACTER CONTINUITY]:\n${characterContext}` : ""}
[ART STYLE & FINISH]: ${style}. ${styleEnhancement}`;

  return await generateImageWithFallback(fullEditPrompt, "1:1", imageParts, false, "pg17", "auto", renderQuality, imageProvider);
}
