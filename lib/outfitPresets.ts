import { CharacterOutfit } from "../types";

export const DEFAULT_OUTFIT_PRESETS: CharacterOutfit[] = [
  {
    id: "cozy_knitwear",
    name: "Sıcak Kafe / Triko Kazak & Atkı",
    description: "Oversize yumuşak krem rengi örgü triko kazak, sıcak pötikareli yün atkı, rahat fit kumaş pantolon ve açık kahve süet botlar.",
    badge: "Gündelik / Kafe",
    icon: "☕",
    colorPalette: ["#FEF3C7", "#D97706", "#78350F"]
  },
  {
    id: "romantic_date_dress",
    name: "Romantik Randevu / Zarif Elbise",
    description: "Pastel pudra pembesi veya lavanta tonunda dökümlü zarif elbise, ince örme hırka, narin gümüş/inci kolye ve şık babetler.",
    badge: "Romantik Buluşma",
    icon: "🌸",
    colorPalette: ["#F472B6", "#FBCFE8", "#FDF2F8"]
  },
  {
    id: "smart_casual_date",
    name: "Şık Gündelik / Randevu Kombini",
    description: "Açık mavi temiz keten gömlek, bej rengi rahat blazer ceket, koyu füme chino pantolon ve taba rengi deri ayakkabılar.",
    badge: "Şık Gündelik",
    icon: "✨",
    colorPalette: ["#38BDF8", "#E2E8F0", "#334155"]
  },
  {
    id: "student_school_uniform",
    name: "Öğrenci / Kampüs & Okul Tarzı",
    description: "Klasik lacivert kolej ceketi, beyaz yakalı gömlek, ekose desenli alt giyim, omuzda bez çanta ve rahat spor ayakkabılar.",
    badge: "Okul / Kampüs",
    icon: "🎒",
    colorPalette: ["#1E3A8A", "#FFFFFF", "#DC2626"]
  },
  {
    id: "rainy_trench_coat",
    name: "Yağmurlu Gün Trençkotu",
    description: "Şık klasik bej/deve tüyü rengi uzun trençkot, siyah boğazlı kazak, koyu denim pantolon ve su geçirmez zarif çizmeler.",
    badge: "Sonbahar / Yağmur",
    icon: "🧥",
    colorPalette: ["#D97706", "#18181B", "#F59E0B"]
  },
  {
    id: "cozy_pajamas_home",
    name: "Ev Hali / Yumuşak Pijama",
    description: "Pastel renkli yumuşacık salaş ev pijaması, pofuduk ev terlikleri, dağınık ev topuzu ve kupa bardak tutan rahat kollar.",
    badge: "Ev / Dinlenme",
    icon: "🌙",
    colorPalette: ["#E0E7FF", "#C7D2FE", "#F1F5F9"]
  },
  {
    id: "casual_street",
    name: "Gündelik Sokak Stili",
    description: "Koyu renk kapüşonlu svetşört, yıpranmış koyu mavi kot pantolon, rahat spor ayakkabılar ve sade deri bileklik.",
    badge: "Gündelik",
    icon: "👕",
    colorPalette: ["#1E293B", "#3B82F6", "#64748B"]
  },
  {
    id: "tactical_armor",
    name: "Taktik Muharebe Zırhı",
    description: "Ağır karbon fiber taktik zırh, omuz korumalıkları, modüler hücum yeleği, kargo pantolon ve askeri muharebe botları.",
    badge: "Zırh / Muharebe",
    icon: "🛡️",
    colorPalette: ["#0F172A", "#334155", "#EAB308"]
  },
  {
    id: "stealth_camo",
    name: "Gizli Gece Kamuflajı",
    description: "Mat siyah esnek suikastçı tulumu, gece görüş vizörü, susturuculu teçhizat kemeri ve sessiz tabanlı taktik botlar.",
    badge: "Gece / Gizlilik",
    icon: "🕶️",
    colorPalette: ["#020617", "#1E293B", "#10B981"]
  },
  {
    id: "formal_suit",
    name: "Resmi Takım Elbise",
    description: "Şık siyah dar kesim takım elbise, beyaz gömlek, ipek kravat, parlak rugan ayakkabılar ve altın kol düğmeleri.",
    badge: "Resmi / Smokin",
    icon: "👔",
    colorPalette: ["#000000", "#FFFFFF", "#F59E0B"]
  },
  {
    id: "battle_damaged",
    name: "Yırtık & Hasarlı Savaş Giysisi",
    description: "Şiddetli çatışmadan çıkmış yanık ve yırtık zırh parçaları, toza bulanmış kıyafetler, kan lekeli sargı bezleri ve yıpranmış teçhizat.",
    badge: "Savaş Hasarlı",
    icon: "🩸",
    colorPalette: ["#7F1D1D", "#450A0A", "#78716C"]
  },
  {
    id: "cyber_techwear",
    name: "Siberpunk / Neon Teçhizat",
    description: "Işıldayan neon hatlı siberpunk ceket, parlayan LED detaylar, sibernetik kablolar, parmak uçları açık eldivenler ve fütüristik sokak botları.",
    badge: "Siberpunk",
    icon: "⚡",
    colorPalette: ["#EC4899", "#06B6D4", "#8B5CF6"]
  },
  {
    id: "winter_coat",
    name: "Kışlık Kalın Palto",
    description: "Kürklü yakalı kalın yün palto, boğazlı kazak, deri eldivenler, termal kargo pantolon ve ağır kışlık kar botları.",
    badge: "Kışlık",
    icon: "🧥",
    colorPalette: ["#3F3F46", "#71717A", "#E2E8F0"]
  },
  {
    id: "mystic_robe",
    name: "Mistik Büyücü Cübbesi",
    description: "Altın işlemeli ve rünlü koyu mor mistik pelerin, büyücü cübbesi, deri kemer, tılsımlı broş ve işlemeli deri çizmeler.",
    badge: "Fantezi / Mistik",
    icon: "🧙",
    colorPalette: ["#581C87", "#3B0764", "#FACC15"]
  },
  {
    id: "royal_gala",
    name: "Kraliyet / Ziyafet Giysisi",
    description: "Altın sırmalı kırmızı kadife pelerin, işlemeli apoletli ceket, saten pantolon, şövalye kuşağı ve kraliyet madalyaları.",
    badge: "Kraliyet",
    icon: "👑",
    colorPalette: ["#991B1B", "#FEF08A", "#D97706"]
  },
  {
    id: "hazmat_space",
    name: "Uzay / Koruyucu Tulum",
    description: "Yüksek basınçlı beyaz-turuncu uzay tulumu, yansıtmalı kask vizörü, oksijen tüpleri, güvenlik kemeri ve manyetik botlar.",
    badge: "Uzay / Bilimkurgu",
    icon: "🚀",
    colorPalette: ["#F97316", "#F8FAFC", "#0284C7"]
  },
  {
    id: "alluring_evening_gown",
    name: "Gece Daveti / Çekici & Yırtmaçlı Elbise",
    description: "Vücuda oturan derin dekolteli ve yüksek bacak yırtmaçlı zümrüt yeşili veya siyah saten gece elbisesi, zarif topuklu ayakkabılar, pırlanta küpeler ve çekici bir duruş.",
    badge: "Çekici / Gece",
    icon: "💋",
    colorPalette: ["#022C22", "#0F766E", "#FACC15"]
  },
  {
    id: "summer_bikini_beach",
    name: "Yaz & Plaj / Şık İki Parça Bikini",
    description: "Güneşin altında parlayan şık iki parça tasarım bikini, bele bağlanan yarı şeffaf zarif pareo tül, güneş gözlüğü ve güneş yanığı hafif bronz ten.",
    badge: "Plaj / Yazlık",
    icon: "🏖️",
    colorPalette: ["#FB7185", "#38BDF8", "#FEF08A"]
  },
  {
    id: "silk_lounge_robe",
    name: "İpek Sabahlık & Şık Gecelik",
    description: "Dökümlü ve çekici bordo saten ipek sabahlık, dantel detaylı zarif gecelik, omuzları hafifçe açıkta bırakan samimi ve rahat ev hali.",
    badge: "Samimi / Ev",
    icon: "🕯️",
    colorPalette: ["#881337", "#4C0519", "#FDE047"]
  },
  {
    id: "unbuttoned_linen_casual",
    name: "Açık Düğmeli Keten Gömlek & Denim",
    description: "İlk birkaç düğmesi açık dökümlü beyaz keten gömlek, boyun ve köprücük kemiklerini sergileyen rahat kesim, yıkanmış mavi kot pantolon ve çekici karizmatik hava.",
    badge: "Karizmatik / Rahat",
    icon: "✨",
    colorPalette: ["#FFFFFF", "#38BDF8", "#334155"]
  },
  {
    id: "sporty_crop_leggings",
    name: "Fit Spor / Crop Top & Vücut Taytı",
    description: "Kıvrımlı ve atletik fiziği vurgulayan dar kesim sporcu büstiyeri (crop top), yüksek bel toparlayıcı spor tayt, bileklikler ve modern koşu ayakkabıları.",
    badge: "Spor / Fit",
    icon: "⚡",
    colorPalette: ["#09090B", "#F43F5E", "#E2E8F0"]
  },
  {
    id: "red_hero_cape",
    name: "Kırmızı Pelerin & Kahraman Zırhı",
    description: "Omuzlardan asilce dökülen ve rüzgarda dalgalanan gösterişli kırmızı saten pelerin, altın broş tokası, göğsü saran kahraman kostümü ve parıldayan çizmeler.",
    badge: "Kahraman / Pelerin",
    icon: "🦸",
    colorPalette: ["#DC2626", "#FACC15", "#1E293B"]
  },
  {
    id: "detective_fedora",
    name: "Dedektif Şapkası & Trençkot",
    description: "Klasik bej rengi kemerli dedektif trençkotu, yakaları hafifçe kalkık, başa karizmatik şekilde eğik takılmış ikonik fötr şapka (fedora) ve deri eldivenler.",
    badge: "Dedektif / Gizem",
    icon: "🕵️",
    colorPalette: ["#78716C", "#44403C", "#F5F5F4"]
  },
  {
    id: "lace_lingerie_lounge",
    name: "Zarif Dantelli İç Çamaşırı & Loungewear",
    description: "Vücut kıvrımlarını estetik ve çekici biçimde vurgulayan dantel işlemeli şık iç çamaşırı büstiyeri, dökümlü tül detaylı hafif sabahlık ve zarif duruş.",
    badge: "Çekici / Loungewear",
    icon: "👙",
    colorPalette: ["#18181B", "#BE185D", "#FBCFE8"]
  }
];

export function getCharacterActiveOutfit(character: { outfits?: CharacterOutfit[]; activeOutfitId?: string; styleSheet?: { outfit?: string } }): CharacterOutfit {
  if (character.outfits && character.outfits.length > 0) {
    const active = character.outfits.find(o => o.id === character.activeOutfitId);
    if (active) return active;
  }

  // If character has a styleSheet outfit, create dynamic default outfit
  if (character.styleSheet?.outfit?.trim()) {
    return {
      id: "custom_current",
      name: "Mevcut Kostüm",
      description: character.styleSheet.outfit,
      badge: "Aktif",
      icon: "👕"
    };
  }

  return DEFAULT_OUTFIT_PRESETS[0];
}

export function pickOutfitIcon(name: string = "", description: string = ""): string {
  const combined = `${name} ${description}`.toLowerCase();
  if (/smokin|takım|suit|tuxedo|resmi|blazer/i.test(combined)) return "👔";
  if (/elbise|dress|gown|abiye|etek/i.test(combined)) return "👗";
  if (/ceket|jacket|mont|kaban|palto|trençkot|coat|deri\s+ceket/i.test(combined)) return "🧥";
  if (/zırh|armor|yelek|muharebe|taktik/i.test(combined)) return "🛡️";
  if (/kamuflaj|stealth|suikastçı|ninja|maske/i.test(combined)) return "🕶️";
  if (/pijama|gecelik|sabahlık|pajama|sleep/i.test(combined)) return "🌙";
  if (/bikini|mayo|plaj|beach|swim/i.test(combined)) return "🏖️";
  if (/spor|tayt|fitness|crop/i.test(combined)) return "⚡";
  if (/pelerin|cape|kahraman|superhero/i.test(combined)) return "🦸";
  if (/büyücü|cübbe|robe|tılsım/i.test(combined)) return "🧙";
  if (/kraliyet|taç|royal/i.test(combined)) return "👑";
  return "👕";
}
