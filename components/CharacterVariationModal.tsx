import React from "react";
import { X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Character, ComicConfig } from "../types";
import { CharacterVariationTab } from "./CharacterVariationTab";
import { CharacterViewMode } from "./CharacterAvatarView";

export interface OutfitVariationPreset {
  id: string;
  label: string;
  icon: string;
  badge: string;
  category: "alluring" | "accessories" | "thematic";
  defaultPrompt: string;
  colorPalette?: string[];
}

export const OUTFIT_VARIATION_PRESETS: OutfitVariationPreset[] = [
  // 1. ALLURING & ROMANTIC CATEGORY
  {
    id: "sexy_evening_dress",
    label: "Derin Yırtmaçlı Gece Elbisesi",
    icon: "💃",
    badge: "Çekici Gece",
    category: "alluring",
    defaultPrompt: "Derin bacak yırtmaçlı ve sırt dekolteli kırmızı ipek saten gece elbisesi, zarif topuklu ayakkabılar, narin pırlanta kolye ve şık akşam makyajı.",
    colorPalette: ["#DC2626", "#991B1B", "#FEF08A"]
  },
  {
    id: "lace_silk_lingerie",
    label: "Dantelli İpek Sabahlık / Gecelik",
    icon: "🌹",
    badge: "Romantik / Loş",
    category: "alluring",
    defaultPrompt: "Siyah tül işlemeli zarif ipek gecelik, omuzdan dökülen şeffaf saten sabahlık, çıplak ayaklar ve dağınık romantik saçlar.",
    colorPalette: ["#18181B", "#7F1D1D", "#F472B6"]
  },
  {
    id: "romantic_velvet_corset",
    label: "Kadife Korse & Zarif Etek",
    icon: "🖤",
    badge: "Korse / Gotik",
    category: "alluring",
    defaultPrompt: "Beli saran koyu zümrüt yeşili veya bordo kadife korse, dantel fistolu dökümlü mini etek, dirseğe kadar uzanan tül eldivenler.",
    colorPalette: ["#064E3B", "#022C22", "#FBBF24"]
  },
  {
    id: "unbuttoned_linen_shirt",
    label: "Dökümlü Yarı Açık Keten Gömlek",
    icon: "✨",
    badge: "Salaş / Çekici",
    category: "alluring",
    defaultPrompt: "Üst düğmeleri açık salaş beyaz keten gömlek, rahat dökümlü hafif kumaş pantolon, rahat ve tensel çekim uyandıran samimi ev hali.",
    colorPalette: ["#F8FAFC", "#CBD5E1", "#334155"]
  },
  {
    id: "glamour_swimwear",
    label: "Şık Plaj Mayosu & Pareo",
    icon: "🏖️",
    badge: "Yazlık / Plaj",
    category: "alluring",
    defaultPrompt: "Zarif kesimli koyu lacivert veya altın tokalı siyah şık plaj mayosu, belde dökümlü şeffaf tül pareo ve retro güneş gözlüğü.",
    colorPalette: ["#0F172A", "#F59E0B", "#38BDF8"]
  },

  // 2. ACCESSORIES CATEGORY
  {
    id: "dramatic_red_cape",
    label: "Dalgalanan Kırmızı Pelerin",
    icon: "🦸",
    badge: "Pelerin",
    category: "accessories",
    defaultPrompt: "Omuzlara tutturulmuş, rüzgarda dramatik şekilde arkaya doğru dalgalanan parlak koyu kırmızı kahraman pelerini ve altın zırh broşu.",
    colorPalette: ["#B91C1C", "#EF4444", "#F59E0B"]
  },
  {
    id: "detective_fedora_trench",
    label: "Dedektif Fötr Şapkası & Trençkot",
    icon: "🕵️",
    badge: "Dedektif",
    category: "accessories",
    defaultPrompt: "Gözleri kısmen gölgede bırakan klasik koyu kahverengi fötr dedektif şapkası, yakası kalkık deve tüyü trençkot ve deri eldivenler.",
    colorPalette: ["#78350F", "#451A03", "#D97706"]
  },
  {
    id: "cyber_neon_visor",
    label: "Siber Analiz Vizörü & Gözlük",
    icon: "🥽",
    badge: "Siber Gözlük",
    category: "accessories",
    defaultPrompt: "Tek gözü kaplayan parlayan neon yeşil holografik siber analiz vizörü ve kulak arkasına uzanan ince veri kabloları.",
    colorPalette: ["#10B981", "#064E3B", "#34D399"]
  },
  {
    id: "witch_mystic_hat",
    label: "Geniş Kenarlı Büyücü Şapkası",
    icon: "🧙",
    badge: "Mistik Şapka",
    category: "accessories",
    defaultPrompt: "Sivri tepeli ve geniş kenarlı koyu mor kadife büyücü şapkası, üzerinde parıldayan altın rün simgeleri ve tüy süslemesi.",
    colorPalette: ["#581C87", "#3B0764", "#FACC15"]
  },
  {
    id: "regal_golden_crown",
    label: "Altın Kraliyet Tacı & Kuşak",
    icon: "👑",
    badge: "Kraliyet Tacı",
    category: "accessories",
    defaultPrompt: "Başında yakut ve zümrüt taşlarla süslenmiş görkemli altın kraliyet tacı, omuzdan çapraz inen işlemeli saten tören kuşağı.",
    colorPalette: ["#EAB308", "#CA8A04", "#B91C1C"]
  },

  // 3. THEMATIC & COSTUME CATEGORY
  {
    id: "tactical_combat_armor",
    label: "Taktik Muharebe Zırhı",
    icon: "🛡️",
    badge: "Zırh / Muharebe",
    category: "thematic",
    defaultPrompt: "Ağır karbon fiber modüler hücum yeleği, omuz ve diz korumalıkları, askeri kargo pantolon ve çelik burunlu muharebe botları.",
    colorPalette: ["#1E293B", "#0F172A", "#EAB308"]
  },
  {
    id: "stealth_night_camo",
    label: "Gizli Gece Suikastçı Tulumu",
    icon: "🥷",
    badge: "Gece / Suikastçı",
    category: "thematic",
    defaultPrompt: "Mat siyah esnek taktik suikastçı kamuflajı, yüzü kısmen örten ninja maskesi, teçhizat kemeri ve sessiz tabanlı deri botlar.",
    colorPalette: ["#020617", "#1E293B", "#64748B"]
  },
  {
    id: "formal_black_tuxedo",
    label: "Resmi Smokin & Papyon",
    icon: "👔",
    badge: "Resmi / Smokin",
    category: "thematic",
    defaultPrompt: "Şık siyah saten şal yakalı özel dikim smokin, kolalı beyaz gömlek, ipek siyah papyon, rugan parlak ayakkabılar.",
    colorPalette: ["#000000", "#FFFFFF", "#F59E0B"]
  },
  {
    id: "cyberpunk_neon_street",
    label: "Siberpunk LED Şeritli Ceket",
    icon: "⚡",
    badge: "Siberpunk",
    category: "thematic",
    defaultPrompt: "Parlayan mavi ve pembe neon LED şeritlerle döşenmiş yüksek yakalı siberpunk deri ceket, fütüristik sokak botları ve eldivenler.",
    colorPalette: ["#EC4899", "#06B6D4", "#8B5CF6"]
  },
  {
    id: "battle_damaged_survivor",
    label: "Savaş Hasarlı & Yırtık Giysi",
    icon: "🩸",
    badge: "Savaş Hasarlı",
    category: "thematic",
    defaultPrompt: "Şiddetli çatışmadan çıkmış yanık ve yırtık kıyafet parçaları, toza bulanmış kumaşlar, kan lekeli sargı bezleri ve çiziklerle dolu teçhizat.",
    colorPalette: ["#7F1D1D", "#450A0A", "#78716C"]
  },
  {
    id: "winter_fur_parka",
    label: "Kürklü Kışlık Kalın Parka",
    icon: "🧥",
    badge: "Kışlık Mont",
    category: "thematic",
    defaultPrompt: "Kürklü kapüşonlu kalın su geçirmez dağcı parkası, termal boğazlı kazak, kalın kar eldivenleri ve ağır kar botları.",
    colorPalette: ["#3F3F46", "#71717A", "#E2E8F0"]
  }
];

export const QUICK_ACCESSORY_CHIPS = [
  { label: "Kırmızı Pelerin", text: "omuzlarında dalgalanan kırmızı pelerin" },
  { label: "Dedektif Şapkası", text: "klasik fötr dedektif şapkası" },
  { label: "Siyah Güneş Gözlüğü", text: "siyah havalı güneş gözlüğü" },
  { label: "Dantelli Korse", text: "zarif dantel işlemeli şık korse" },
  { label: "Derin Yırtmaç", text: "derin bacak yırtmaçlı dökümlü saten kumaş" },
  { label: "Deri Ceket", text: "eskitme siyah deri motorcu ceketi" },
  { label: "Siber Vizör", text: "parlayan neon siber analiz vizörü" },
  { label: "Yırtık/Hasarlı", text: "savaşta yırtılmış ve hasar görmüş kumaş parçaları" },
  { label: "Altın Kolye & Küpe", text: "narin parıltılı altın kolye ve sallantılı küpeler" },
  { label: "Taktik Yelek", text: "modüler cepli askeri taktik hücum yeleği" }
];

export interface CharacterVariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  libraryCharacters: Character[];
  config: ComicConfig;
  setConfig: React.Dispatch<React.SetStateAction<ComicConfig>>;
  onRefreshLibrary: () => Promise<void>;
  onPreview: (url: string, name: string, mode?: CharacterViewMode) => void;
  onNavigateToBrowse?: () => void;
}

export const CharacterVariationModal: React.FC<CharacterVariationModalProps> = ({
  isOpen,
  onClose,
  libraryCharacters,
  config,
  setConfig,
  onRefreshLibrary,
  onPreview,
  onNavigateToBrowse = () => {}
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-5xl bg-slate-900 border-2 sm:border-4 border-black shadow-comic-xl flex flex-col max-h-[94vh] overflow-hidden text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-yellow-400 border-b-4 border-black px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-black text-yellow-400 border-2 border-black -rotate-6 shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-xl text-black uppercase tracking-wide">
                Karakter Varyasyon Laboratuvarı
              </h3>
              <p className="text-black/80 text-[11px] sm:text-xs font-mono font-medium hidden sm:block">
                Mevcut karakterlerden yeni kostüm, aksesuar ve 3'lü model varyasyonları üretin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 bg-black hover:bg-red-600 text-white flex items-center justify-center border-2 border-black transition-colors shrink-0"
            title="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
          <CharacterVariationTab
            libraryCharacters={libraryCharacters}
            config={config}
            setConfig={setConfig}
            onRefreshLibrary={onRefreshLibrary}
            onPreview={onPreview}
            onNavigateToBrowse={onNavigateToBrowse}
          />
        </div>
      </div>
    </div>
  );
};
