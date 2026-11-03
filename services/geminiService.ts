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
  COMIC_ART_STYLES
} from "../types";

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

export const getStyleEnhancement = (
  style?: string, 
  colorPalette?: string, 
  lightingMood?: string, 
  consistencyLock?: boolean
): string => {
  const matchedStyle = COMIC_ART_STYLES.find(s => s.id === style || s.name === style);
  const baseComicStyle = matchedStyle 
    ? matchedStyle.promptDirective
    : "Masterpiece semi-realistic Marvel comic book art style, blending modern Marvel graphic novel illustration with anatomically accurate realism, inspired by Gabriele Dell'Otto, Adi Granov, and Alex Ross. Precise human facial bone structure, lifelike expressive eyes, refined sharp black ink linework with dynamic cross-hatching, rich volumetric cinematic lighting, tactile skin and fabric textures (leather, denim, weaves), atmospheric depth, published Marvel graphic novel masterpiece standard.";

  const paletteObj = colorPalette ? COLOR_PALETTES[colorPalette] : null;
  const palettePrompt = paletteObj ? ` [COLOR PALETTE DIRECTIVE: ${paletteObj.prompt}]` : "";

  const lightingObj = lightingMood ? LIGHTING_MOODS[lightingMood] : null;
  const lightingPrompt = lightingObj ? ` [LIGHTING DIRECTIVE: ${lightingObj.prompt}]` : "";

  const techniqueAnchor = " [FIXED DRAWING TECHNIQUE MANDATE: Strict uniform semi-realistic Marvel Graphic Novel art. Consistent dynamic black ink contours, nuanced cross-hatching, lifelike anatomy, and rich volumetric rendering. Zero medium drift: NEVER switch to flat cartoon, rough sketch, or unstructured oil paint across pages. All panels and pages MUST appear illustrated by the exact same Marvel master artist.]";

  const consistencyPrompt = (consistencyLock !== false) 
    ? " [STRICT CONTINUITY LOCK: Enforce 100% identical face structure, signature hairstyle, exact costume colors, and precise anatomical proportions across every single panel. Zero morphing or costume swap permitted.]"
    : "";

  return `${baseComicStyle}${palettePrompt}${lightingPrompt}${techniqueAnchor}${consistencyPrompt}`;
};

export const buildMasterComicStylePrompt = getStyleEnhancement;


export const compileCharacterReferencePrompt = (
  name: string,
  styleSheet: Partial<CharacterStyleSheet>,
  fallbackDesc?: string
): string => {
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
};

export const parseGeminiError = (error: any): { 
  isQuota: boolean; 
  title: string; 
  message: string;
  retrySeconds?: number;
} => {
  const rawMsg = error?.message || (typeof error === "string" ? error : JSON.stringify(error)) || "";

  const retryMatch = rawMsg.match(/retry in\s+([0-9.]+)\s*s/i);
  const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : undefined;

  const isPrepayment =
    rawMsg.includes("prepayment credits are depleted") ||
    rawMsg.includes("credits are depleted");

  const isInvalidKey =
    rawMsg.includes("API key not valid") ||
    rawMsg.includes("API_KEY_INVALID") ||
    rawMsg.includes("invalid API key");

  if (isInvalidKey) {
    return {
      isQuota: false,
      title: "Geçersiz API Anahtarı",
      message: "Google AI Studio API anahtarı geçersiz veya yetkilendirilmemiş görünüyor. Lütfen AI Studio proje ayarlarından aktif bir API anahtarı seçin."
    };
  }

  const isTokenLimitExceeded = 
    rawMsg.includes("input token limit per minute") ||
    rawMsg.includes("token limit") ||
    rawMsg.includes("tokens per minute") ||
    rawMsg.includes("TPM");

  const isQuota =
    isPrepayment ||
    isTokenLimitExceeded ||
    error?.status === 429 ||
    error?.code === 429 ||
    rawMsg.includes("429") ||
    rawMsg.includes("RESOURCE_EXHAUSTED") ||
    rawMsg.includes("exceeded your current quota") ||
    rawMsg.includes("quota exceeded") ||
    rawMsg.includes("quota") ||
    rawMsg.includes("rate-limit") ||
    rawMsg.includes("rate_limit");

  if (isTokenLimitExceeded) {
    return {
      isQuota: true,
      retrySeconds: retrySeconds || 45,
      title: "Dakikalık Token Sınırı Aşıldı (TPM Exceeded)",
      message: "Bu model için dakikalık girdi token sınırına (Token Per Minute) ulaşıldı. Yaklaşık 30-45 saniye sonra token havuzu yenilenir. 'Şimdi Yeniden Dene' butonuna basarak devam edebilirsiniz."
    };
  }

  const isExceededQuotaPlan =
    rawMsg.includes("exceeded your current quota") ||
    rawMsg.includes("check your plan and billing details") ||
    rawMsg.includes("ai.dev/rate-limit") ||
    rawMsg.includes("ai.google.dev/gemini-api/docs/rate-limits");

  if (isExceededQuotaPlan) {
    return {
      isQuota: true,
      retrySeconds: retrySeconds || 60,
      title: "API Kotası / İstek Sınırı Aşıldı (429)",
      message: "Google AI Studio API dakikalık istek kotasına veya ücretsiz plan sınırına ulaşıldı. Lütfen 30-60 saniye bekleyip tekrar deneyin veya sol menüdeki Çizim/Stil sekmesinden 'Ücretli / Pro API' seçeneğini etkinleştirin."
    };
  }

  if (isPrepayment) {
    return {
      isQuota: true,
      title: "AI Studio Kredi / Bakiye Tükendi",
      message: "Google AI Studio hesabınızın ön ödemeli API kredisi tükenmiş görünüyor. ai.studio/projects üzerinden faturalandırmanızı kontrol edebilirsiniz."
    };
  }

  if (isQuota) {
    let message = "Google Gemini API dakikalık istek/token kotasına (TPM/RPM) ulaşıldı.";
    if (retrySeconds) {
      message = `Dakikalık istek sınırına ulaşıldı. Model yaklaşık ${retrySeconds} saniye sonra tekrar istek kabul edecektir. Lütfen geri sayımı bekleyip 'Şimdi Yeniden Dene' butonuna tıklayın.`;
    } else {
      message = "Dakikalık istek kotası (RPM/TPM) dolmuş olabilir. Lütfen 30-60 saniye bekleyip tekrar deneyin.";
    }

    return {
      isQuota: true,
      retrySeconds: retrySeconds || 45,
      title: "Geçici İstek Sınırı (429)",
      message
    };
  }

  const isSafety =
    rawMsg.includes("PROHIBITED_CONTENT") ||
    rawMsg.includes("IMAGE_SAFETY") ||
    rawMsg.includes("güvenlik filtresi") ||
    rawMsg.includes("güvenlik filtresine takıldı") ||
    rawMsg.includes("SAFETY");

  if (isSafety) {
    return {
      isQuota: false,
      title: "Görsel Güvenlik Filtresi Uyarısı",
      message: "Bu sahne veya panel tarifindeki bazı ifadeler (şiddet, kan, kesici alet vb.) güvenlik filtresine takıldı. Otomatik temizleme sistemi devreye girdi; yine de engelleniyorsa lütfen sahne tarifini daha genel süper kahraman aksiyonuna ('kahramanca hamle', 'enerji kalkanı', 'çarpışma') dönüştürerek tekrar deneyin."
    };
  }

  return {
    isQuota: false,
    title: "Üretim Hatası Oluştu",
    message: rawMsg || "Bilinmeyen bir hata meydana geldi. Lütfen tekrar deneyin."
  };
};

function sanitizeCast(cast: Character[] = []): Character[] {
  return cast.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    visualManifest: c.visualManifest,
    avatarUrl: c.avatarUrl,
    styleSheet: c.styleSheet,
    tags: c.tags,
    outfits: c.outfits,
    activeOutfitId: c.activeOutfitId
  }));
}

function sanitizeLocations(locations: LocationItem[] = []): LocationItem[] {
  return locations.map(l => ({
    id: l.id,
    name: l.name,
    description: l.description,
    type: l.type,
    visualManifest: l.visualManifest
  }));
}

function sanitizeComicConfig(config: ComicConfig): ComicConfig {
  return {
    ...config,
    cast: sanitizeCast(config.cast),
    locations: sanitizeLocations(config.locations)
  };
}

export async function downscaleBase64Image(dataUrl: string, maxDimension = 1024, quality = 0.85): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:image")) return dataUrl;
  if (typeof document === "undefined") return dataUrl;
  if (dataUrl.startsWith("data:image/jpeg") && dataUrl.length < 350000) return dataUrl;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxDimension && height <= maxDimension && dataUrl.length < 350000 && dataUrl.startsWith("data:image/jpeg")) {
          return resolve(dataUrl);
        }
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}

const USER_API_KEY_STORAGE_KEY = "comicgen_user_gemini_api_key";
const USER_TOGETHER_API_KEY_STORAGE_KEY = "comicgen_user_together_api_key";
const USER_FAL_API_KEY_STORAGE_KEY = "comicgen_user_fal_api_key";

export function getUserApiKey(): string {
  try {
    return localStorage.getItem(USER_API_KEY_STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function setUserApiKey(key: string): void {
  try {
    if (key && key.trim()) {
      localStorage.setItem(USER_API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(USER_API_KEY_STORAGE_KEY);
    }
  } catch (e) {
    console.error("Failed to save user API key:", e);
  }
}

export function removeUserApiKey(): void {
  try {
    localStorage.removeItem(USER_API_KEY_STORAGE_KEY);
  } catch {}
}

export async function testAndValidateApiKey(keyToTest?: string): Promise<{ valid: boolean; message: string }> {
  const payload: Record<string, any> = {};
  if (keyToTest) {
    payload.testKey = keyToTest.trim();
  }
  return callBackendApi<{ valid: boolean; message: string }>("validateApiKey", payload);
}

export function getFalApiKey(): string {
  try {
    return localStorage.getItem(USER_FAL_API_KEY_STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function setFalApiKey(key: string): void {
  try {
    if (key && key.trim()) {
      localStorage.setItem(USER_FAL_API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(USER_FAL_API_KEY_STORAGE_KEY);
    }
  } catch (e) {
    console.error("Failed to save user fal.ai API key:", e);
  }
}

export function removeFalApiKey(): void {
  try {
    localStorage.removeItem(USER_FAL_API_KEY_STORAGE_KEY);
  } catch {}
}

export async function testAndValidateFalApiKey(keyToTest?: string): Promise<{ valid: boolean; message: string }> {
  const payload: Record<string, any> = {};
  if (keyToTest) {
    payload.testKey = keyToTest.trim();
  }
  return callBackendApi<{ valid: boolean; message: string }>("validateFalApiKey", payload);
}

export function getTogetherApiKey(): string {
  try {
    return localStorage.getItem(USER_TOGETHER_API_KEY_STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function setTogetherApiKey(key: string): void {
  try {
    if (key && key.trim()) {
      localStorage.setItem(USER_TOGETHER_API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(USER_TOGETHER_API_KEY_STORAGE_KEY);
    }
  } catch (e) {
    console.error("Failed to save user Together API key:", e);
  }
}

export function removeTogetherApiKey(): void {
  try {
    localStorage.removeItem(USER_TOGETHER_API_KEY_STORAGE_KEY);
  } catch {}
}

export async function testAndValidateTogetherApiKey(keyToTest?: string): Promise<{ valid: boolean; message: string }> {
  const payload: Record<string, any> = {};
  if (keyToTest) {
    payload.testKey = keyToTest.trim();
  }
  return callBackendApi<{ valid: boolean; message: string }>("validateTogetherApiKey", payload);
}

const USER_POLLINATIONS_API_KEY_STORAGE_KEY = "comicgen_user_pollinations_api_key";

export function getPollinationsApiKey(): string {
  try {
    return localStorage.getItem(USER_POLLINATIONS_API_KEY_STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function setPollinationsApiKey(key: string): void {
  try {
    if (key && key.trim()) {
      localStorage.setItem(USER_POLLINATIONS_API_KEY_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(USER_POLLINATIONS_API_KEY_STORAGE_KEY);
    }
  } catch (e) {
    console.error("Failed to save user Pollinations API key:", e);
  }
}

export function removePollinationsApiKey(): void {
  try {
    localStorage.removeItem(USER_POLLINATIONS_API_KEY_STORAGE_KEY);
  } catch {}
}

export async function testAndValidatePollinationsApiKey(keyToTest?: string): Promise<{ valid: boolean; message: string }> {
  const payload: Record<string, any> = {};
  if (keyToTest) {
    payload.testKey = keyToTest.trim();
  }
  return callBackendApi<{ valid: boolean; message: string }>("validatePollinationsApiKey", payload);
}

const USER_POLLINATIONS_MODEL_STORAGE_KEY = "comicgen_user_pollinations_model";

export function getPollinationsModel(): string {
  try {
    const saved = localStorage.getItem(USER_POLLINATIONS_MODEL_STORAGE_KEY)?.trim();
    if (saved && ["flux", "turbo", "flux-anime", "flux-realism", "flux-3d", "any-dark"].includes(saved)) {
      return saved;
    }
    return "flux";
  } catch {
    return "flux";
  }
}

export function setPollinationsModel(model: string): void {
  try {
    if (model && model.trim()) {
      localStorage.setItem(USER_POLLINATIONS_MODEL_STORAGE_KEY, model.trim());
    } else {
      localStorage.removeItem(USER_POLLINATIONS_MODEL_STORAGE_KEY);
    }
  } catch (e) {
    console.error("Failed to save Pollinations model:", e);
  }
}

async function callBackendApi<T>(action: string, payload: Record<string, any>, retries: number = 1): Promise<T> {
  try {
    const userApiKey = getUserApiKey();
    const togetherApiKey = getTogetherApiKey();
    const falApiKey = getFalApiKey();
    const pollinationsApiKey = getPollinationsApiKey();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (userApiKey) {
      headers["x-gemini-api-key"] = userApiKey;
    }
    if (togetherApiKey) {
      headers["x-together-api-key"] = togetherApiKey;
    }
    if (falApiKey) {
      headers["x-fal-api-key"] = falApiKey;
    }
    if (pollinationsApiKey) {
      headers["x-pollinations-api-key"] = pollinationsApiKey;
    }

    const response = await fetch(`/api/gemini/${action}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok || !json.success) {
      const errorMsg = json.error || `Sunucu hatası (${response.status}): ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return json.data as T;
  } catch (err: any) {
    // Retry once on transient network or fetch errors
    if (retries > 0 && (err?.name === "TypeError" || err?.message?.includes("Failed to fetch") || err?.message?.includes("network"))) {
      console.warn(`[callBackendApi] Retry action ${action} after transient failure:`, err?.message);
      await new Promise(r => setTimeout(r, 1200));
      return callBackendApi<T>(action, payload, retries - 1);
    }
    throw err;
  }
}

export const generateVisualManifest = async (
  name: string,
  description: string,
  style: string
): Promise<string> => {
  return callBackendApi<string>("generateVisualManifest", { name, description, style });
};

export const generateCharacterStyleSheet = async (
  name: string,
  description: string,
  style: string
): Promise<CharacterStyleSheet> => {
  return callBackendApi<CharacterStyleSheet>("generateCharacterStyleSheet", { name, description, style });
};

export const generateCharacterAvatar = async (
  name: string,
  visualManifest: string,
  style: string,
  usePaidApi: boolean = false,
  imageProvider?: "auto" | "pollinations_flux" | "together_flux" | "fal_flux" | "gemini",
  pollinationsModel?: string
): Promise<string> => {
  const pModel = pollinationsModel || getPollinationsModel();
  const raw = await callBackendApi<string>("generateCharacterAvatar", { name, visualManifest, style, usePaidApi, imageProvider, pollinationsModel: pModel });
  if (raw && raw.startsWith("data:image")) {
    try {
      return await downscaleBase64Image(raw, 512, 0.88);
    } catch {
      return raw;
    }
  }
  return raw;
};

export const generateCharacterVariation = async (
  baseCharacter: Character,
  variationType: string,
  customPrompt: string,
  style: string,
  usePaidApi: boolean = false,
  imageProvider?: "auto" | "pollinations_flux" | "together_flux" | "fal_flux" | "gemini",
  pollinationsModel?: string
): Promise<{ newName: string; newDescription: string; newVisualManifest: string; avatarUrl: string }> => {
  const compressedAvatar = baseCharacter.avatarUrl 
    ? await downscaleBase64Image(baseCharacter.avatarUrl, 512) 
    : undefined;
  const sanitizedChar: Character = {
    ...baseCharacter,
    avatarUrl: compressedAvatar
  };
  const pModel = pollinationsModel || getPollinationsModel();
  return callBackendApi<{ newName: string; newDescription: string; newVisualManifest: string; avatarUrl: string }>(
    "generateCharacterVariation", 
    { baseCharacter: sanitizedChar, variationType, customPrompt, style, usePaidApi, imageProvider, pollinationsModel: pModel }
  );
};

export const generateLocationVisualManifest = async (
  name: string,
  description: string,
  type: string,
  style: string
): Promise<string> => {
  return callBackendApi<string>("generateLocationVisualManifest", { name, description, type, style });
};

export const generateLocationConceptArt = async (
  name: string,
  description: string,
  type: string,
  style: string,
  visualManifest?: string,
  usePaidApi: boolean = false,
  imageProvider?: "auto" | "pollinations_flux" | "together_flux" | "fal_flux" | "gemini",
  pollinationsModel?: string
): Promise<string> => {
  const pModel = pollinationsModel || getPollinationsModel();
  const raw = await callBackendApi<string>("generateLocationConceptArt", { name, description, type, style, visualManifest, usePaidApi, imageProvider, pollinationsModel: pModel });
  if (raw && raw.startsWith("data:image")) {
    try {
      return await downscaleBase64Image(raw, 1024, 0.88);
    } catch {
      return raw;
    }
  }
  return raw;
};

export const generateRandomComicConfig = async (): Promise<Partial<ComicConfig>> => {
  return callBackendApi<Partial<ComicConfig>>("generateRandomComicConfig", {});
};

export const generateComicScript = async (
  config: ComicConfig,
  history: string[],
  userDirection: string = ""
): Promise<{ layoutType: string; panels: ComicPanelData[] }> => {
  return callBackendApi<{ layoutType: string; panels: ComicPanelData[] }>(
    "generateComicScript", 
    { config: sanitizeComicConfig(config), history, userDirection }
  );
};

export const generateFullPageImage = async (
  panels: ComicPanelData[],
  style: string,
  cast: Character[],
  layoutType: string = "grid-2x2",
  renderQuality: string = "High",
  locations: LocationItem[] = [],
  colorPalette?: string,
  lightingMood?: string,
  consistencyLock?: boolean,
  imageProvider?: "auto" | "pollinations_flux" | "together_flux" | "fal_flux" | "gemini",
  pollinationsModel?: string
): Promise<string> => {
  const pModel = pollinationsModel || getPollinationsModel();
  return callBackendApi<string>("generateFullPageImage", {
    panels,
    style,
    cast: sanitizeCast(cast),
    layoutType,
    renderQuality,
    locations: sanitizeLocations(locations),
    colorPalette,
    lightingMood,
    consistencyLock,
    imageProvider,
    pollinationsModel: pModel
  });
};

export const generateSinglePanelImage = async (
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
  imageProvider?: "auto" | "pollinations_flux" | "together_flux" | "fal_flux" | "gemini",
  pollinationsModel?: string
): Promise<string> => {
  const pModel = pollinationsModel || getPollinationsModel();
  const raw = await callBackendApi<string>("generateSinglePanelImage", {
    panelPrompt,
    style,
    cast: sanitizeCast(cast),
    renderQuality,
    directorConfig,
    locations: sanitizeLocations(locations),
    colorPalette,
    lightingMood,
    consistencyLock,
    characterNames,
    contentRating,
    modestyTechnique,
    topic,
    tone,
    imageProvider,
    pollinationsModel: pModel
  });

  if (raw && raw.startsWith("data:image")) {
    try {
      return await downscaleBase64Image(raw, 1024, 0.88);
    } catch {
      return raw;
    }
  }
  return raw;
};

export const extractNarrativeMemoryUpdates = async (
  pagePanels: ComicPanelData[],
  pageNumber: number,
  cast: Character[],
  currentMemory?: NarrativeContinuityMemory
): Promise<{ newMemories: NarrativeMemoryItem[]; updatedSummary: string }> => {
  return callBackendApi<{ newMemories: NarrativeMemoryItem[]; updatedSummary: string }>(
    "extractNarrativeMemoryUpdates", 
    { pagePanels, pageNumber, cast: sanitizeCast(cast), currentMemory }
  );
};

export const editPanelImageInpainting = async (
  originalImageUrl: string,
  instructionPrompt: string,
  maskOverlayImageUrl?: string,
  style: string = "Modern Comic",
  cast: Character[] = [],
  renderQuality: string = "High",
  usePaidApi: boolean = false,
  imageProvider?: "auto" | "pollinations_flux" | "together_flux" | "fal_flux" | "gemini"
): Promise<string> => {
  const compressedOriginal = await downscaleBase64Image(originalImageUrl, 768);
  const compressedMask = maskOverlayImageUrl 
    ? await downscaleBase64Image(maskOverlayImageUrl, 768) 
    : undefined;

  return callBackendApi<string>("editPanelImageInpainting", {
    originalImageUrl: compressedOriginal,
    instructionPrompt,
    maskOverlayImageUrl: compressedMask,
    style,
    cast: sanitizeCast(cast),
    renderQuality,
    usePaidApi,
    imageProvider
  });
};
