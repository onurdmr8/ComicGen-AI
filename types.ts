
export interface DetectedOutfitChange {
  characterName: string;
  outfitName: string;
  outfitDescription: string;
  badge?: string;
  icon?: string;
  reason?: string;
}

export interface ComicScriptResult {
  layoutType: string;
  panels: ComicPanelData[];
  detectedOutfitChanges?: DetectedOutfitChange[];
}

export interface CharacterOutfit {
  id: string;
  name: string; // e.g. "Gündelik Sokak", "Taktik Muharebe Zırhı", "Gizli Gece Kamuflajı", "Resmi Takım", "Yırtık / Hasarlı", vb.
  description: string; // Üst giyim, alt giyim, ayakkabı, kumaş, doku ve renkler
  badge?: string; // e.g. "Gündelik", "Zırh", "Kamuflaj", "Özel"
  icon?: string; // Emoji simge (örn: 👕, 🛡️, 🕶️, 👔, 🩸, ⚡, 🧥, 🧙, 👑, 🚀)
  colorPalette?: string[]; // Kıyafete özel renk paleti
  isDefault?: boolean;
}

export interface CharacterStyleSheet {
  physicalTraits: string; // Saç, yüz, ten rengi, göz, boy ve vücut yapısı
  outfit: string;         // Üst giyim, alt giyim, ayakkabı, kumaş ve renkler
  accessories: string;    // Aksesuarlar, yara izleri, dövmeler, semboller ve özel eşyalar
  colorPalette?: string[]; // Ana renk tonları (örn. #1E293B, #EAB308)
  referencePrompt: string; // Otomatik derlenmiş veya özelleştirilmiş kilit referans promptu
  autoInject: boolean;    // Bu karakter panelde yer aldığında referans prompt otomatik enjekte edilsin mi? (varsayılan: true)
  lastUpdated?: number;
}

export interface CharacterStyleSheetRef {
  characterId: string;
  characterName: string;
  referencePrompt: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  visualManifest?: string; // Detailed visual record for consistency (clothes, features)
  styleSheet?: CharacterStyleSheet; // Karakter Görsel Kılavuzu (Character Style Sheet)
  avatarUrl?: string;
  style?: string;
  createdAt?: number;
  tags?: string[];
  outfits?: CharacterOutfit[]; // Karakterin gardırobu / kıyafet listesi
  activeOutfitId?: string;     // Aktif seçili kıyafetin ID'si
}

export type LocationType = "exterior" | "interior" | "prop" | "vehicle" | "location";

export interface LocationItem {
  id: string;
  name: string;
  description: string;
  type: LocationType;
  visualManifest?: string; // Detailed architectural, lighting, palette and environmental guidelines
  imageUrl?: string;
  style?: string;
  createdAt?: number;
  tags?: string[];
}

export interface CharacterPoseSetting {
  characterId: string;
  characterName: string;
  emotionId?: string;
  emotionLabel?: string;
  intensity?: "low" | "medium" | "extreme";
  poseId?: string;
  poseLabel?: string;
  customDirection?: string;
  positionSlot?: string;
  positionLabel?: string;
}

export type RelationshipType = 
  | "passionate_lovers"     // 💖 Tutkulu Aşıklar / Sevgililer
  | "secret_crush"           // 💌 Platonik / Gizli Aşk
  | "enemies_to_lovers"      // ⚔️ Düşmandan Aşka
  | "mortal_enemies"         // ⚡ Ezeli Düşmanlar
  | "rivals_with_respect"    // 🥊 Saygılı Rakipler
  | "unbreakable_allies"     // 🤝 Sarsılmaz Dostlar
  | "mentor_student"         // 📜 Usta & Çırak
  | "forbidden_attraction"   // 🕯️ Yasak Çekim
  | "custom";                // ✨ Özel Dinamik

export interface CharacterRelationship {
  id: string;
  sourceCharId: string;
  sourceCharName: string;
  targetCharId: string;
  targetCharName: string;
  type: RelationshipType;
  typeLabel?: string;
  tensionLevel: number; // 0 - 100 arası tansiyon/kimya seviyesi
  description?: string; // Dinamikler ve geçmiş
  dialogueSubtext?: string; // Konuşma ve alt metin tarzı
  isReciprocal: boolean; // Karşılıklı mı
}

export interface DuoInteractionSetting {
  interactionId: string;
  interactionLabel: string;
  charAId: string;
  charBId: string;
  details?: string;
}

export interface PanelDirectorConfig {
  characters: CharacterPoseSetting[];
  duoInteraction?: DuoInteractionSetting;
  locationId?: string;
  locationName?: string;
  cameraAngle?: string;
  lightingAtmosphere?: string;
  customActionPrompt?: string;
  compositionLayout?: string;
}

export interface ComicPanelData {
  id?: string;
  imagePrompt: string;
  dialogue: string;
  speakerName?: string; // Konuşan karakterin adı veya "Anlatıcı"
  balloonPosition?: "top" | "bottom" | "hidden"; // Balon konumu: Üst, Alt veya Gizli
  balloonStyle?: "speech" | "whisper" | "shout" | "thought" | "narrator"; // Balon tarzı: Konuşma, Fısıltı, Haykırış, Düşünce, Anlatıcı
  balloonTailDirection?: "left" | "center" | "right"; // Balon kuyruk yönü
  characterNames: string[]; // Track who is in the panel
  onomatopoeia?: string; // Action sound effects like "BOOM", "POW"
  layoutHint?: "wide" | "tall" | "square";
  imageUrl?: string;
  originalImageUrl?: string;
  editHistory?: string[]; // Geçmiş çizimler listesi (Geri al / önceki çizime dön için)
  isLoading?: boolean;
  locationName?: string;
  directorConfig?: PanelDirectorConfig;
  characterStyleSheetRefs?: CharacterStyleSheetRef[]; // Karakter Görsel Kılavuzu referans promptları
  isMature?: boolean; // PG-18 / Yetişkin / Yoğun duygusal veya aksiyon sahnesi
  isBlurred?: boolean; // Hassas içerik sansür bluru aktif mi?
  cameraAngle?: string; // Seçilen sinematik kamera açısı kimliği
  modestyConcealment?: "sheets" | "steam" | "silhouette" | "angles" | "macro" | "auto"; // Çıplaklığı estetik örten sansür tekniği (Örtü, Buhar/Sis, Silüet, Gizleyici Açı, vb.)
}

export interface ComicPage {
  id: string;
  panels: ComicPanelData[];
  layoutType: "grid-2x2" | "splash-top" | "splash-bottom" | "vertical-stack";
  pageImageUrl?: string;
}

export interface SavedStory {
  id: string;
  title: string;
  topic: string;
  intro: string;
  coverImageUrl?: string;
  pageCount: number;
  createdAt: number;
  updatedAt: number;
  config: ComicConfig;
  pages: ComicPage[];
  tags?: string[];
}

export interface NarrativeMemoryItem {
  id: string;
  category: "injury" | "item_lost" | "item_gained" | "environment_damage" | "relationship_shift" | "custom";
  characterName?: string;
  description: string; // e.g. "Aras sol kolundan yaralandı, sargı bezi sarılı" veya "Kadim kristal kırıldı, etraf toz duman"
  visualImpact: string; // e.g. "Sol kolunda kan lekeli beyaz sargı bezi görünüyor"
  isActive: boolean;    // Sahnelere dahil edilsin mi?
  createdInPage?: number; // Hangi sayfada gerçekleşti
}

export interface NarrativeContinuityMemory {
  enabled: boolean;
  autoExtract: boolean; // Her yeni sayfa üretildiğinde olay hafızasını otomatik güncelle
  memories: NarrativeMemoryItem[];
  plotSummary: string; // Şimdiye kadar gerçekleşen olayların kümülatif özeti
}

export interface ComicConfig {
  topic: string;
  intro: string;
  cast: Character[];
  locations?: LocationItem[];
  activeLocationId?: string;
  style: string;
  tone: string; // Action, Comedy, Noir, etc.
  narratorVoice?: string;
  renderQuality?: "Standard" | "High" | "Ultra" | "Paid_Pro";
  usePaidApi?: boolean;
  imageProvider?: "pollinations_flux" | "together_flux" | "fal_flux" | "auto" | "gemini"; // Ücretsiz FLUX, Together AI FLUX, fal.ai FLUX, Otomatik Hibrit veya Gemini
  pollinationsModel?: string; // e.g. "flux", "flux-anime", "flux-realism", "flux-3d", "turbo", "any-dark"
  storyMemory?: NarrativeContinuityMemory; // Sayfa Devamlılığı & Mantık Hafızası
  colorPalette?: "dynamic" | "warm_vintage" | "cyber_neon" | "monochrome_noir" | "pastel_anime" | "grimdark_desaturated" | "romance_shojo" | "cozy_cafe" | "sensual_crimson";
  lightingMood?: "cinematic_contrast" | "golden_hour" | "moody_shadows" | "studio_vibrant" | "neon_glow" | "cozy_warmth" | "romantic_dream" | "candlelit_sensual";
  consistencyLock?: boolean; // Karakter ve mekan özelliklerini ultra sıkı tut
  contentRating?: "pg13" | "pg17" | "pg18"; // PG-13 (Aile Dostu), PG-17 (Yetişkin / Romantik Tansiyon) veya PG-18 (Yetişkin / 18+ Tutkulu & Yoğun Sahneler)
  blurMatureContent?: boolean; // PG-18 / Hassas paneller varsayılan olarak blurlu (tıkla-gör kalkanı) gelsin mi?
  defaultCameraAngle?: string; // Tercih edilen varsayılan kamera açısı
  modestyConcealment?: "sheets" | "steam" | "silhouette" | "angles" | "macro" | "auto"; // Yasağa uygun çıplaklığı kapatan estetik sansür tekniği (Örtü, Buhar/Sis, Loş Silüet, vb.)
  relationships?: CharacterRelationship[]; // Karakterler Arası Tansiyon & Kimya Matrisi
}

export interface PollinationsModelOption {
  id: string;
  name: string;
  label: string;
  badge: string;
  description: string;
  icon: string;
  publisher: string;
  urlFormat: string;
}

export const POLLINATIONS_MODELS: PollinationsModelOption[] = [
  {
    id: "flux",
    name: "FLUX.1 (Standart)",
    label: "FLUX.1 (Standart)",
    badge: "%100 Ücretsiz",
    description: "image.pollinations.ai üzerindeki en kaliteli varsayılan 2D çizgi roman motoru.",
    icon: "🎨",
    publisher: "Pollinations / FLUX",
    urlFormat: "https://image.pollinations.ai/prompt/[prompt]?model=flux"
  },
  {
    id: "turbo",
    name: "SDXL Turbo (Süper Hızlı)",
    label: "SDXL Turbo",
    badge: "~1 Sn Hızlı",
    description: "1-2 saniyede anında çizgi roman panelleri ve hızlı taslak üretimi.",
    icon: "⚡",
    publisher: "Pollinations / Turbo",
    urlFormat: "https://image.pollinations.ai/prompt/[prompt]?model=turbo"
  },
  {
    id: "flux-anime",
    name: "Anime & Manga",
    label: "Anime & Manga",
    badge: "Manga & Webtoon",
    description: "Japon mangası, keskin cel-shading ve net anime karakter çizgileri.",
    icon: "🌸",
    publisher: "Pollinations / Anime",
    urlFormat: "https://image.pollinations.ai/prompt/[prompt]?model=flux-anime"
  },
  {
    id: "flux-realism",
    name: "Sinematik Gerçekçi",
    label: "Sinematik Gerçekçi",
    badge: "Ultra Real",
    description: "Yüksek doku detayı, sinematik ışıklandırma ve gerçekçi yüz anatomisi.",
    icon: "📸",
    publisher: "Pollinations / Realism",
    urlFormat: "https://image.pollinations.ai/prompt/[prompt]?model=flux-realism"
  },
  {
    id: "flux-3d",
    name: "3D Animasyon",
    label: "3D Animasyon",
    badge: "Pixar / CGI",
    description: "3D hacimli animasyon ve CGI karakter modelleme stili.",
    icon: "🧊",
    publisher: "Pollinations / 3D",
    urlFormat: "https://image.pollinations.ai/prompt/[prompt]?model=flux-3d"
  },
  {
    id: "any-dark",
    name: "Noir & Dark Gothic",
    label: "Gothic Noir",
    badge: "Gotik & Kara Film",
    description: "Koyu çini mürekkebi, chiaroscuro gölgeler ve dramatik kara roman tarzı.",
    icon: "🌑",
    publisher: "Pollinations / Noir",
    urlFormat: "https://image.pollinations.ai/prompt/[prompt]?model=any-dark"
  }
];

export interface ComicStyleOption {
  id: string;
  name: string;
  label: string;
  badge: string;
  icon: string;
  description: string;
  promptDirective: string;
}

export const COMIC_ART_STYLES: ComicStyleOption[] = [
  {
    id: "marvel_realistic",
    name: "Marvel Çizgi Roman & Realizm (Önerilen)",
    label: "Marvel Realizm",
    badge: "Önerilen & Popüler",
    icon: "⚡",
    description: "Modern Marvel çizgi roman mürekkebi ve gerçekçi anatomi harmanı (Alex Ross, Gabriele Dell'Otto & Adi Granov tarzı). Canlı ama gerçekçi yüzler, sinematik ışık ve detaylı dokular.",
    promptDirective: "Masterpiece semi-realistic Marvel comic book art style, blending modern Marvel graphic novel illustration with anatomically accurate realism, inspired by Gabriele Dell'Otto, Adi Granov, and Alex Ross. Precise human facial bone structure, lifelike expressive eyes, refined sharp black ink linework with dynamic cross-hatching, rich volumetric cinematic lighting, tactile skin and fabric textures (leather, denim, weaves), atmospheric depth, published Marvel graphic novel masterpiece standard. Zero cartoonish caricature, high clarity."
  },
  {
    id: "classic_marvel",
    name: "Klasik Modern Marvel / DC",
    label: "Modern Marvel",
    badge: "Amerikan Çizgi Roman",
    icon: "🦸",
    description: "Jim Lee, Olivier Coipel ve David Finch tarzı dinamik pozlar, keskin konturlar ve canlı süper kahraman renklendirmesi.",
    promptDirective: "Dynamic modern American superhero comic book art style, Jim Lee and Olivier Coipel aesthetic, bold ink brush contours, heroic dynamic anatomy, vibrant saturated comic colors, dramatic action framing, crisp 2D graphic novel illustration."
  },
  {
    id: "cinematic_realism",
    name: "Sinematik Gerçekçi Grafik Roman",
    label: "Sinematik Realizm",
    badge: "Ultra Real",
    icon: "🎬",
    description: "Fotoğrafik gerçekçiliğe yakın film karesi kompozisyonu, detaylı cilt gözenekleri ve sinematik derinlik.",
    promptDirective: "Hyper-detailed cinematic realistic graphic novel style, photographic lighting balance, realistic skin subsurface scattering, dramatic anamorphic lens depth, tactile environmental textures, grounded gritty cinematic drama, master draftsmanship."
  },
  {
    id: "dark_noir_realism",
    name: "Kara Çizgi Roman & Realizm (Dark Noir)",
    label: "Dark Noir",
    badge: "Noir & Gölge",
    icon: "🕵️",
    description: "Frank Miller ve David Mazzucchelli tarzı sert siyah gölgeler, derin chiaroscuro ve gerçekçi suç draması atmosferi.",
    promptDirective: "Gritty dark noir graphic novel illustration style, intense high-contrast chiaroscuro shadows, realistic anatomical proportions, heavy black ink hatching, moody rain-slicked atmosphere, evocative urban crime realism."
  },
  {
    id: "standard_comic",
    name: "Standart Grafik Roman",
    label: "Standart Çizgi Roman",
    badge: "Klasik 2D",
    icon: "🎨",
    description: "Geleneksel temiz 2D çizgi roman illüstrasyonu, düzgün siyah mürekkep hatları ve dengeli cel-shading renklendirme.",
    promptDirective: "Authentic standard graphic novel comic art style, crisp 0.75pt clean black ink contours, clean cel-shaded coloring, balanced comic color palette, expressive character facial acting, professional comic panel storytelling."
  }
];


export enum GeneratorStatus {
  IDLE = 'IDLE',
  GENERATING_STORY = 'GENERATING_STORY',
  GENERATING_IMAGES = 'GENERATING_IMAGES',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export type NarrativeNodeSeverity = "normal" | "warning" | "danger" | "critical";

export interface NarrativeFlowNode {
  id: string;
  pageNumber: number; // 1-indexed
  panelNumber: number; // 1-indexed (1-4)
  characterName: string;
  characterAvatar?: string;
  physicalCondition: string; // e.g. "Zinde", "Yaralı (Sol kol)", "Tükenmiş"
  conditionSeverity: NarrativeNodeSeverity;
  heldItems: string[]; // Current items carried
  itemsGained: string[]; // Items acquired in this step
  itemsLost: string[]; // Items lost or broken in this step
  locationName: string; // Location of this event
  locationChanged: boolean; // Did location change from previous step?
  dialogueSnippet: string;
  actionSummary: string;
  visualImpact?: string;
  panelImageUrl?: string;
  hasMemoryAlert?: boolean;
  memoryCategory?: NarrativeMemoryItem["category"];
  memoryDescription?: string;
}

export interface NarrativeFlowLink {
  id: string;
  sourceId: string;
  targetId: string;
  characterName: string;
  hasInjuryTransition: boolean;
  hasItemTransition: boolean;
  hasLocationTransition: boolean;
}

export interface NarrativeCharacterTimeline {
  characterName: string;
  characterAvatar?: string;
  color: string;
  nodes: NarrativeFlowNode[];
  currentPhysicalState: string;
  currentInventory: string[];
  currentLocation: string;
}

export interface StorySuggestion {
  id: string;
  title: string;
  tagline: string;
  intro: string;
  tone: string;
  genre: string;
  plotHooks: string[];
  suggestedCastHints?: string[];
}

export interface NextEpisodeSuggestion {
  id: string;
  category: "twist" | "action" | "emotion" | "mystery" | "climax" | "choice";
  categoryLabel: string;
  title: string;
  direction: string;
  rationale: string;
}
