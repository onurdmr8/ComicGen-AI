import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateId = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (e) {
    // Fallback to manual generation
  }
  
  return 'id-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
};

export function normalizeTurkish(text: string): string {
  if (!text) return "";
  return text
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .trim();
}

export function isNameMatch(nameA?: string, nameB?: string): boolean {
  if (!nameA || !nameB) return false;
  const a = normalizeTurkish(nameA);
  const b = normalizeTurkish(nameB);
  if (a === b) return true;
  if (a.length >= 3 && b.length >= 3) {
    if (a.includes(b) || b.includes(a)) return true;
  }
  return false;
}

export function isCharacterMentioned(charName: string, text: string): boolean {
  if (!charName || !text) return false;
  const rawChar = charName.trim().toLowerCase();
  const rawText = text.toLowerCase();
  if (rawText.includes(rawChar)) return true;

  const normChar = normalizeTurkish(charName);
  const normText = normalizeTurkish(text);
  if (normText.includes(normChar)) return true;

  return false;
}

export interface PositionSlot {
  id: string;
  label: string;
  enLabel: string;
  row: number;
  col: number;
  tag: string;
}

export const POSITION_SLOTS: PositionSlot[] = [
  { id: "sol-on", label: "Sol Ön Plan", enLabel: "Left foreground, dramatic primary focus", row: 2, col: 0, tag: "Ön Sol" },
  { id: "merkez-on", label: "Ön Merkez", enLabel: "Center foreground, hero close-up focal point", row: 2, col: 1, tag: "Ön Merkez" },
  { id: "sag-on", label: "Sağ Ön Plan", enLabel: "Right foreground, dynamic profile framing", row: 2, col: 2, tag: "Ön Sağ" },
  { id: "sol-orta", label: "Sol Kadraj", enLabel: "Left mid-ground, standing ready", row: 1, col: 0, tag: "Orta Sol" },
  { id: "merkez", label: "Merkez Odak", enLabel: "Center mid-ground, balanced primary focal subject", row: 1, col: 1, tag: "Tam Merkez" },
  { id: "sag-orta", label: "Sağ Kadraj", enLabel: "Right mid-ground, reacting attentively", row: 1, col: 2, tag: "Orta Sağ" },
  { id: "sol-arka", label: "Sol Arka Plan", enLabel: "Background left silhouette overlooking scene", row: 0, col: 0, tag: "Arka Sol" },
  { id: "merkez-arka", label: "Derin Merkez", enLabel: "Deep background center, distant vista presence", row: 0, col: 1, tag: "Arka Merkez" },
  { id: "sag-arka", label: "Sağ Arka Plan", enLabel: "Background right perspective anchor", row: 0, col: 2, tag: "Arka Sağ" },
];

export interface PosePreset {
  id: string;
  label: string;
  enDesc: string;
  category: "sitting" | "standing" | "action" | "interaction" | "dramatic" | "sensual";
}

export const POSE_PRESETS: PosePreset[] = [
  { id: "sitting_desk", label: "Masa Başında Oturma / Çalışma", enDesc: "sitting attentively behind a wooden desk leaning forward", category: "sitting" },
  { id: "sitting_cafe", label: "Kafe Masasında Rahat Oturma", enDesc: "sitting casually on a cafe chair holding a warm ceramic coffee cup", category: "sitting" },
  { id: "standing_heroic", label: "Ayakta Kararlı / Kahraman Duruşu", enDesc: "standing tall in bold heroic stance with confident posture", category: "standing" },
  { id: "standing_casual", label: "Ayakta Rahat Duruş", enDesc: "standing relaxed with one hand in pocket observing surroundings", category: "standing" },
  { id: "running_sprint", label: "Hızlı Koşma / Kaçış", enDesc: "sprinting dynamically across the scene in full kinetic motion", category: "action" },
  { id: "action_ready", label: "Dövüş / Mücadeleye Hazır Duruş", enDesc: "braced in athletic low-center combat ready stance with raised fists", category: "action" },
  { id: "confronting_pointing", label: "Hesap Sorma / Parmağıyla İşaret", enDesc: "pointing an accusing finger forward in dramatic confrontation", category: "interaction" },
  { id: "looking_back_shock", label: "Arkaya Dönüp Bakma / İrkilme", enDesc: "turning head sharply over shoulder with startled gaze", category: "dramatic" },
  { id: "embracing_hug", label: "Sarılma / Romantik Yakınlaşma", enDesc: "embracing the other character closely with tender touch", category: "interaction" },
  { id: "whispering_secret", label: "Fısıldama / Yakın Konuşma", enDesc: "leaning in close to whisper a secret into the other character's ear", category: "interaction" },
  { id: "defensive_crouch", label: "Siper Alma / Savunma", enDesc: "ducking behind cover in defensive crouch shielding from impact", category: "action" },
  { id: "kneeling_injured", label: "Diz Çökme / Yaralı / Yorgun", enDesc: "kneeling on one knee clutching arm with exhausted breathing", category: "dramatic" },
  // PG-17 / Intimate & Sensual Presets
  { id: "intimate_embrace", label: "🔥 Tutkulu Sarılma / Tensel Çekim (PG-17)", enDesc: "in deep passionate intimate embrace, bodies pressed close, tender hand in hair and waist, magnetic romantic heat", category: "sensual" },
  { id: "deep_kiss", label: "💋 Tutkulu Öpücük / Dudak Dudağa (PG-17)", enDesc: "locked in a deep breathless kiss, eyes closed with intense passion, intimate close-up framing", category: "sensual" },
  { id: "bed_recline", label: "🛏️ Yatakta Uzanmış / Çekici Duruş (PG-17)", enDesc: "reclining gracefully on bed draped in soft luxurious silk sheets, alluring silhouette, candlelit romantic ambiance", category: "sensual" },
  { id: "undone_collar", label: "👔 Yaka Açık / Baştan Çıkarıcı (PG-17)", enDesc: "loosening collar with unbuttoned silk shirt, exposed neckline, alluring relaxed posture, seductive gaze", category: "sensual" },
  { id: "seductive_look", label: "✨ Cilveli / Baştan Çıkarıcı Bakış (PG-17)", enDesc: "looking back over shoulder with a sultry bedroom gaze and alluring silhouette curve", category: "sensual" },
  { id: "whispering_neck", label: "🌹 Boyna Fısıldama / Tensel Temas (PG-17)", enDesc: "whispering softly against the other character's neck, hand gently resting on hip, electric romantic tension", category: "sensual" }
];

export interface EmotionPreset {
  id: string;
  label: string;
  enDesc: string;
}

export const EMOTION_PRESETS: EmotionPreset[] = [
  { id: "determined", label: "Kararlı & Odaklanmış", enDesc: "determined focused expression with clenched jaw and sharp piercing gaze" },
  { id: "shocked", label: "Şok & Ani Şaşkınlık", enDesc: "shocked stunned expression with wide eyes and parted lips" },
  { id: "happy_smile", label: "Mutlu & Gülümseyen", enDesc: "warm genuine smile with relaxed joyful face" },
  { id: "angry_furious", label: "Öfkeli & Tehditkar", enDesc: "furious glaring eyes, knitted furrowed eyebrows, and intense anger" },
  { id: "romantic_tender", label: "Duygusal & Aşık", enDesc: "soft tender gaze, gentle affectionate expression, subtle blush" },
  { id: "sad_grief", label: "Üzgün & Hüzünlü", enDesc: "sorrowful mournful expression with glistening emotional eyes" },
  { id: "worried_tense", label: "Endişeli & Gergin", enDesc: "anxious troubled expression, vigilant uneasy eyes" },
  { id: "smug_confident", label: "Alaycı / Kendinden Emin", enDesc: "smug confident smirk with knowing raised eyebrow" },
  // PG-17 / Sensual Emotions
  { id: "seductive_sultry", label: "🔥 Şehvetli & Baştan Çıkarıcı (PG-17)", enDesc: "seductive sultry expression, heavy-lidded alluring bedroom eyes, subtle parting of lips with intense magnetic attraction" },
  { id: "flushed_passion", label: "😳 Kızarmış & Büyülenmiş (PG-17)", enDesc: "deeply flushed red cheeks, breathless enamored expression, rapid breathing, electric romantic tension" },
  { id: "smoldering_desire", label: "🫦 Ateşli & Tutkulu Bakış (PG-17)", enDesc: "smoldering passionate gaze, intense longing, eyes locked with magnetic desire and deep affection" }
];

