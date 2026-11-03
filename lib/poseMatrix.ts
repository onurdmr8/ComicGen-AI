export interface EmotionPreset {
  id: string;
  label: string;
  emoji: string;
  category: "heroic" | "intense" | "dramatic" | "comic" | "mystic" | "romance" | "slice_of_life";
  facialDetails: {
    low: string;
    medium: string;
    extreme: string;
  };
  promptModifier: string;
}

export interface CameraPosePreset {
  id: string;
  label: string;
  icon: string;
  angleDescription: string;
  framingPrompt: string;
  bestFor: string;
}

export interface DuoPreset {
  id: string;
  label: string;
  icon: string;
  description: string;
  compositionPrompt: string;
  badge: string;
}

export interface LightingPreset {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

export const EMOTION_PRESETS: EmotionPreset[] = [
  {
    id: "blushing_shy",
    label: "Utangaç & Yanakları Kızarmış",
    emoji: "😳",
    category: "romance",
    facialDetails: {
      low: "hafif yanak kızarması, yana kaçırılan gözler",
      medium: "belirgin pembe yanaklar, çekingen tatlı gülümseme, titreyen kirpikler",
      extreme: "kıpkırmızı olmuş yanaklar ve kulaklar, iki eliyle yüzünü kapatan tatlı panik hali"
    },
    promptModifier: "soft shojo blushing cheeks, flustered shy romantic expression, downcast fluttering eyelashes, sweet tender smile"
  },
  {
    id: "loving_warmth",
    label: "Aşk Dolu & Şefkatli Bakış",
    emoji: "💖",
    category: "romance",
    facialDetails: {
      low: "yumuşak sıcak gözler, huzurlu tebessüm",
      medium: "ışıldayan sevgi dolu gözler, hafif yana eğik baş, içten şefkatli gülümseme",
      extreme: "büyülenmiş aşık bakışlar, gözlerinde parıldayan yıldızlar, derin duygusal yakınlık"
    },
    promptModifier: "deep affectionate loving gaze, gentle warm genuine smile, sparkling emotional eyes, tender intimacy"
  },
  {
    id: "laughing_happy",
    label: "Neşeli Kahkaha & Samimiyet",
    emoji: "😄",
    category: "slice_of_life",
    facialDetails: {
      low: "rahat samimi tebessüm",
      medium: "gözleri kısılarak içten kahkaha atan neşeli yüz, doğal gülen dudaklar",
      extreme: "başını geriye atıp kalpten kahkaha atan mutlu ve tasasız ifade"
    },
    promptModifier: "cheerful joyful laughter, crinkled happy eyes, wide radiant genuine smile, vibrant heartwarming mood"
  },
  {
    id: "flustered_nervous",
    label: "Eli Ayağı Dolaşmış / Heyecanlı",
    emoji: "😅",
    category: "romance",
    facialDetails: {
      low: "hafif heyecanlı tebessüm, ensesini kaşıyan el",
      medium: "şapşalca sırıtan tatlı heyecan, hafif ter damlası, hızla atan kalp mimikleri",
      extreme: "tamamen afallamış tatlı şapşallık, göz bebeklerinde spiraller veya kalp parıltıları"
    },
    promptModifier: "cute flustered nervousness, scratching back of head, sweatdrop reaction, clumsy endearing smile"
  },
  {
    id: "pouting_tsundere",
    label: "Tatlı Trip / Nazlı (Pout)",
    emoji: "😤",
    category: "romance",
    facialDetails: {
      low: "hafif şişirilmiş yanaklar, yana bakan gözler",
      medium: "şişirilmiş sevimli yanaklar (pout), kollar göğüste çapraz, hafif kızarmış yüzle trip atma",
      extreme: "abartılı tatlı küsme pozu, arkasını dönüp yandan kaçamak bakış"
    },
    promptModifier: "adorable cute pouting cheeks, crossed arms, tsundere sidelong blush, pretending to be annoyed"
  },
  {
    id: "cozy_peaceful",
    label: "Huzurlu & Sakin (Cozy)",
    emoji: "☕",
    category: "slice_of_life",
    facialDetails: {
      low: "rahatlamış nötr ifade",
      medium: "ılık kahvesini yudumlarken gözlerini hafifçe kapatıp huzur bulan dingin yüz",
      extreme: "tam bir huzur ve dinginlik, hafif tebessümle pencereden yağan yağmuru izleme"
    },
    promptModifier: "peaceful serene expression, gentle content smile, cozy relaxed atmosphere, mindful calmness"
  },
  {
    id: "determined",
    label: "Kararlı / Kendinden Emin",
    emoji: "🦸",
    category: "heroic",
    facialDetails: {
      low: "kendinden emin bakış, hafif hafif gülümseme",
      medium: "çelik gibi sert kararlı bakışlar, dimdik duruş, odaklanmış gözler",
      extreme: "asla pes etmeyen fırtınalı bakışlar, rüzgarda dalgalanan saçlar, yılmaz ifade"
    },
    promptModifier: "unwavering heroic determination, confident focused fierce eyes, fearless expression"
  },
  {
    id: "shocked",
    label: "Şaşkın / Beklenmedik An",
    emoji: "😲",
    category: "dramatic",
    facialDetails: {
      low: "kalkmış kaşlar, hafif açılmış gözler",
      medium: "faltaşı gibi açılmış şaşkın gözler, aralanmış ağız, şok ifadesi",
      extreme: "şaşkınlıkla tamamen açılmış göz bebekleri, geriye sıçrayan refleks mimikleri"
    },
    promptModifier: "wide-eyed astonishment, stunned gasping facial expression, high shock reaction"
  },
  {
    id: "smug",
    label: "Alaycı / Tatlı Şaka",
    emoji: "😏",
    category: "comic",
    facialDetails: {
      low: "hafif tek taraflı tebessüm",
      medium: "şakacı alaycı gülüş, tek kaşı kalkık eğlenceli bakış",
      extreme: "zaferle göz kırpan neşeli şakacı yüz"
    },
    promptModifier: "smug playful smirk, teasing raised eyebrow, cheeky wink, mischievous amusement"
  },
  {
    id: "sorrowful",
    label: "Kederli / Hüzünlü",
    emoji: "😢",
    category: "dramatic",
    facialDetails: {
      low: "hüzünlü dalgın bakışlar, aşağı inik dudak kenarları",
      medium: "göz pınarlarında biriken yaşlar, eğik baş, derin kalp kırıklığı ifadesi",
      extreme: "yağmur altında gözyaşlarıyla yoğrulmuş hüzünlü sessizlik"
    },
    promptModifier: "deep sorrow and nostalgia, tearful glistening eyes, heartbroken melancholic soft expression"
  },
  {
    id: "furious",
    label: "Öfkeli / Hiddetli",
    emoji: "😡",
    category: "intense",
    facialDetails: {
      low: "hafif çatılmış sert kaşlar, gergin dudaklar",
      medium: "şiddetle çatılmış kaşlar, diş gıcırdatma, alev saçan sert bakışlar",
      extreme: "çılgınca haykıran açık ağız, damarları belirginleşmiş öfkeli yüz"
    },
    promptModifier: "furious enraged facial expression, gritted teeth, piercing aggressive intense eyes"
  }
];

export const CAMERA_POSE_PRESETS: CameraPosePreset[] = [
  {
    id: "romantic_eye_contact",
    label: "Göz Göze Bakışma (Romantik Yakın Plan)",
    icon: "💖",
    angleDescription: "Romantik shojo derinliği, gözlerdeki parıltı ve yumuşak odak",
    framingPrompt: "Cinematic romantic close-up shot focusing on intense emotional eye contact, soft shallow depth of field, delicate sparkling lighting, dreamy shojo manga atmosphere",
    bestFor: "İlk görüşte aşk, duygusal itiraflar ve samimi anlar"
  },
  {
    id: "cafe_table_intimate",
    label: "Kafe Masası Sohbeti (Karşılıklı)",
    icon: "☕",
    angleDescription: "Sıcak bir kahve masasında karşılıklı oturuş ve kupa tutuşu",
    framingPrompt: "Over-the-shoulder medium shot across a warm wooden cafe table, steam rising from coffee mugs, warm ambient bistro lighting, cozy daily conversation",
    bestFor: "Buluşmalar, kahve sohbetleri ve gündelik sırlar"
  },
  {
    id: "umbrella_sharing",
    label: "Yağmurda Şemsiye Paylaşma",
    icon: "☔",
    angleDescription: "Tek bir şemsiye altında yan yana yürüyen iki karakter",
    framingPrompt: "Medium side shot of two characters walking closely sheltered under a single shared transparent umbrella in soft rain, wet reflections on pavement, sweet romantic proximity",
    bestFor: "Klasik yağmurlu gün romantizmi ve yakınlaşma"
  },
  {
    id: "walking_together_sunset",
    label: "Gün Batımında Yan Yana Yürüyüş",
    icon: "🌅",
    angleDescription: "Altın saat ışığında sahil veya sokakta yan yana yürüyüş",
    framingPrompt: "Wide panoramic tracking shot of two characters walking leisurely side-by-side along a tree-lined street or seaside path during warm golden hour sunset, long golden shadows",
    bestFor: "Günün sonu sohbetleri ve huzurlu anlar"
  },
  {
    id: "head_on_shoulder",
    label: "Omuza Yaslanma & Huzur",
    icon: "🌙",
    angleDescription: "Bankta veya otobüste diğerinin omzuna başını koyma",
    framingPrompt: "Intimate gentle two-shot: one character resting their head peacefully on the other's shoulder while sitting on a park bench or night transit, quiet serene intimacy",
    bestFor: "Derin güven ve huzur sahneleri"
  },
  {
    id: "face_macro_closeup",
    label: "Aşırı Yakın Yüz Planı",
    icon: "🔍",
    angleDescription: "Duyguları ve göz parıltılarını öne çıkaran sinematik yakın plan",
    framingPrompt: "Cinematic extreme close-up shot focused tightly on character's eyes and facial micro-expressions, macro comic detail",
    bestFor: "İç monologlar ve heyecan anları"
  },
  {
    id: "hero_low_angle",
    label: "Özgüvenli Alttan Açı",
    icon: "📐",
    angleDescription: "Aşağıdan yukarı bakan etkileyici ve enerjik açı",
    framingPrompt: "Dynamic low-angle perspective looking up at the character, confident posture, sky and city backdrop",
    bestFor: "Karakter tanıtımı ve önemli kararlar"
  },
  {
    id: "birds_eye_despair",
    label: "Kuş Bakışı / Şehir Manzarası",
    icon: "🦅",
    angleDescription: "Tepeden geniş şehir ve mekan kompozisyonu",
    framingPrompt: "High-angle bird's-eye perspective capturing characters within the cozy architectural environment or city square",
    bestFor: "Mekan kurulumu ve genel atmosfer"
  }
];

export const DUO_INTERACTION_PRESETS: DuoPreset[] = [
  {
    id: "romantic_gaze_confession",
    label: "Aşk İtirafı & Göz Göze Kalma",
    icon: "💌",
    badge: "Romantizm",
    description: "Bir karakterin yanakları kızararak kalbindekileri dökmesi, diğerinin büyülenmiş şaşkın bakışı.",
    compositionPrompt: "Intimate romantic confession scene: two characters standing close, one speaking earnestly with blushing rosy cheeks and trembling hands, the other listening wide-eyed with tender amazement, romantic tension."
  },
  {
    id: "sharing_coffee_food",
    label: "Tatlı / İçecek Paylaşma & Kafe",
    icon: "🍰",
    badge: "Gündelik Aşk",
    description: "Bir karakterin çatalıyla tatlı uzatması veya kahvesinden ikram etmesi, neşeli şakalaşma.",
    compositionPrompt: "Sweet cafe moment: one character playfully offering a bite of cake/pastry on a fork towards the other, cheerful blushing laughter across the table, warm bistro atmosphere."
  },
  {
    id: "sheltering_rain_hug",
    label: "Yağmurda / Soğukta Ceket Paylaşma",
    icon: "🧥",
    badge: "Şefkat",
    description: "Üşüyen karaktere ceketini verme veya rüzgardan korumak için sarılma.",
    compositionPrompt: "Heartwarming gesture: one character gently draping their warm coat over the other's cold shoulders, hands lightly touching, soft appreciative smile and warm rosy cheeks."
  },
  {
    id: "hand_holding_touch",
    label: "El Ele Tutuşma / Parmak Teması",
    icon: "🤝",
    badge: "Yakınlık",
    description: "Yürürken ellerin birbirine çarpması ve parmakların kenetlenmesi anı.",
    compositionPrompt: "Delicate close-up of two hands gently brushing together and interlocking fingers while walking, subtle sparks of chemistry, modest tender touch."
  },
  {
    id: "accidental_fall_catch",
    label: "Kazara Çarpışma & Yakalama",
    icon: "💫",
    badge: "Rom-Com",
    description: "Ayağı takılıp düşmek üzere olan karakterin belinden tutulup kucağa yakalanması, ani göz teması.",
    compositionPrompt: "Classic romantic comedy trope: one character trips or stumbles, caught just in time in the other's protective arms, faces inches apart with surprised blushing eye contact."
  },
  {
    id: "playful_teasing",
    label: "Şakalaşma & Tatlı Atışma",
    icon: "😜",
    badge: "Gündelik",
    description: "Birbirine takılan, gülüşen ve neşeyle omuz dürten iki yakın dost / flört.",
    compositionPrompt: "Lively playful banter: one character nudging the other teasingly, bursting into shared giggles, carefree and cheerful friendship chemistry."
  },
  {
    id: "whispered_secret",
    label: "Gizli Fısıltı & Kıkırdama",
    icon: "🤫",
    badge: "Gizli An",
    description: "Kütüphanede veya sınıfta başkaları duymasın diye kulağa fısıldama ve kıkırdama.",
    compositionPrompt: "Cozy library/classroom whisper: one character leaning in close to whisper a secret note in the other's ear, suppressing a playful giggle behind hand."
  },
  {
    id: "clashing_duel",
    label: "Tartışma / Tatlı İnatlaşma",
    icon: "💥",
    badge: "İnatlaşma",
    description: "İki inatçı karakterin burun buruna gelip tatlı bir inatlaşmaya girmesi.",
    compositionPrompt: "Two stubborn characters leaning in face-to-face in a lively verbal argument, puffing cheeks, comedic spark between their foreheads."
  }
];

export const LIGHTING_PRESETS: LightingPreset[] = [
  {
    id: "cozy_cafe_warmth",
    label: "Sıcak Kafe & Akşamüstü Işığı",
    icon: "☕",
    prompt: "Warm golden tungsten interior light, soft amber glow from Edison bulbs, cozy inviting cafe atmosphere with soft shadows."
  },
  {
    id: "romantic_shojo_pastel",
    label: "Romantik Pastel & Işıltılı Rüya",
    icon: "🌸",
    prompt: "Soft dreamy pastel illumination, delicate pink and lavender highlights, ethereal glowing light specks and blooming bokeh."
  },
  {
    id: "dramatic_sunset",
    label: "Kızıl Gün Batımı & Altın Saat",
    icon: "🌅",
    prompt: "Warm golden hour sunset, intense orange-peach sky with golden rim lighting separating characters gently from the background."
  },
  {
    id: "rainy_city_reflections",
    label: "Yağmurlu Şehir & Islak Işıklar",
    icon: "🌧️",
    prompt: "Cool overcast rainy daylight with glossy water puddle reflections, transparent umbrella highlights, soft cozy mood."
  },
  {
    id: "neon_cyber",
    label: "Gece Sokak Lambaları & Şehir",
    icon: "🏮",
    prompt: "Warm yellow street lamp radiance casting soft pools of light on the quiet night sidewalk, nostalgic city mood."
  },
  {
    id: "noir_shadows",
    label: "Noir Gölge & Çizgisel Işık",
    icon: "🕵️",
    prompt: "Hard film-noir high contrast lighting, Venetian blind shadows slicing across faces, deep blacks."
  },
  {
    id: "arcane_magic",
    label: "Büyülü Parıltı & Mor Alev",
    icon: "✨",
    prompt: "Mystical purple and electric blue arcane magic particles swirling in air, casting eerie supernatural glow."
  },
  {
    id: "standard_comic",
    label: "Klasik Çizgi Roman Güneş Işığı",
    icon: "☀️",
    prompt: "Bright clean comic book sunlight, crisp ink outlines, rich primary color values."
  }
];
