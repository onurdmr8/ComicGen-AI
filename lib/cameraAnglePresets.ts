export interface CameraAnglePreset {
  id: string;
  label: string;
  icon: string;
  category: "pg_safe" | "cinematic" | "dramatic" | "modesty";
  badge: string;
  description: string;
  promptModifier: string;
  isPg18Safe?: boolean;
}

export interface ModestyConcealmentPreset {
  id: "sheets" | "steam" | "silhouette" | "angles" | "macro" | "auto";
  label: string;
  icon: string;
  shortLabel: string;
  badge: string;
  description: string;
  promptModifier: string;
}

export const MODESTY_CONCEALMENT_PRESETS: ModestyConcealmentPreset[] = [
  {
    id: "sheets",
    label: "Saten Çarşaf & Örtü Kalkanı",
    icon: "🛏️",
    shortLabel: "Örtü/Çarşaf",
    badge: "Klasik Yatak Odası",
    description: "Karakterler yatakta çıplaktır fakat dökümlü saten örtüler hassas anatomiyi ve çıplaklığı tamamen örter; çıplak omuzlar, sırt ve çarşaftan sarkan bacaklar görünür.",
    promptModifier: "artistic modesty framing, intimately undressed in bed, strategic draped silk satin bedsheets elegantly covering all explicit anatomy and modesty zones, bare shoulders and sculpted back exposed, entangled under lush linen sheets, warm romantic bedroom candlelight, zero nudity visible, compliant with graphic novel publishing standards"
  },
  {
    id: "steam",
    label: "Buhar & Sis / Duman Perdesi",
    icon: "💨",
    shortLabel: "Buhar/Duman",
    badge: "Gizemli Sansür",
    description: "Yükselen sıcak banyo buharı, atmosferik duman veya nemli sis perdesi; çıplaklığı doğal bir sansür kalkanı gibi örter, gizemli ve tensel bir hava verir.",
    promptModifier: "artistic steam obscuration, heavy swirling atmospheric warm mist and rising dense steam elegantly veiling and concealing explicit anatomy, glistening moist skin under soft moody backlighting, mysterious sensual atmosphere, zero forbidden nudity visible"
  },
  {
    id: "silhouette",
    label: "Mum Işığı & Loş Silüet",
    icon: "🕯️",
    shortLabel: "Loş Silüet",
    badge: "Noir Gölge Kalkanı",
    description: "Mum veya ay ışığına karşı derin chiaroscuro gölge. Karakterlerin tensel beden hatları parıldar fakat çıplak bölgeler kapkaranlık gölgede gizlenir.",
    promptModifier: "intense chiaroscuro silhouette, deep dramatic shadow cast over bodies completely concealing all explicit anatomy, golden candlelight rim illumination tracing passionate back and shoulder contours, sensual noir aesthetic, artistic modesty framing"
  },
  {
    id: "angles",
    label: "Omuz & Sırt Gizleyici Açı",
    icon: "👥",
    shortLabel: "Gizleyici Açı",
    badge: "Açısal Kalkan",
    description: "Karakterin sırtından ve omzunun arkasından çekim. Öndeki karakterin sırtı ve omzu çıplaklığı kameraya karşı kapatır; partnerin tutkulu yüz ifadesine odaklanır.",
    promptModifier: "clever modesty camera positioning from behind, the broad curvature of the foreground partner's back and shoulder strategically blocking and obscuring explicit anatomy from the camera, camera focused on the reacting partner's ecstatic facial expression and tangled fingers"
  },
  {
    id: "macro",
    label: "Tensel Makro (Kenetli Eller & Dudak)",
    icon: "🤝",
    shortLabel: "Tensel Makro",
    badge: "Ayrıntı Odaklı",
    description: "Doğrudan bedeni değil; çarşafı sıkan kenetlenmiş parmakları, boyna gömülen yüzü, aralanmış dudakları ve ter damlalarını göstererek çıplaklığı kadraj dışı bırakır.",
    promptModifier: "sensual extreme macro framing, tightly entwined hands clutching silk bedsheets with white knuckles, parted lips, closed eyes, beads of sweat on collarbone, breathless romantic proximity, explicit anatomy kept entirely outside the camera frame"
  },
  {
    id: "auto",
    label: "Akıllı Hibrit / Otomatik Örtü",
    icon: "🎭",
    shortLabel: "Otomatik",
    badge: "Dinamik Koruma",
    description: "Sahnenin durumuna göre çarşaf örtüsü, loş ışık gölgesi ve açısal gizlemeyi yapay zeka tarafından en uygun şekilde kombine eder.",
    promptModifier: "artistic cinema modesty framing, intimate undressed embrace where explicit anatomy is tastefully concealed through strategically draped satin sheets, deep shadows, and discreet camera angles, maximum sensual heat with zero safety violations"
  }
];

export const CAMERA_ANGLE_PRESETS: CameraAnglePreset[] = [
  {
    id: "modesty_sheets",
    label: "Örtü Kalkanı (Saten Çarşaf)",
    icon: "🛏️",
    category: "modesty",
    badge: "18+ Örtülü Çıplaklık",
    description: "Karakterler yatakta çıplaktır fakat dökümlü saten çarşaflar çıplaklığı estetik biçimde tamamen kapatır; çıplak omuzlar, sırt ve bacaklar görünür.",
    promptModifier: "artistic modesty framing, intimately undressed in bed, strategic draped silk satin bedsheets elegantly covering all explicit anatomy and modesty zones, bare shoulders and sculpted back exposed, entangled under lush linen sheets, warm romantic bedroom candlelight, zero nudity visible, compliant with graphic novel publishing standards",
    isPg18Safe: true
  },
  {
    id: "modesty_steam",
    label: "Buhar & Sis / Duman Perdesi",
    icon: "💨",
    category: "modesty",
    badge: "18+ Duman Sansürü",
    description: "Yükselen sıcak banyo buharı veya atmosferik duman çıplaklığı doğal bir sansür kalkanı gibi örter.",
    promptModifier: "artistic steam obscuration, heavy swirling atmospheric warm mist and rising dense steam elegantly veiling and concealing explicit anatomy, glistening moist skin under soft moody backlighting, mysterious sensual atmosphere, zero forbidden nudity visible",
    isPg18Safe: true
  },
  {
    id: "modesty_over_shoulder",
    label: "Omuz/Sırt Gizleyici Açı",
    icon: "👥",
    category: "modesty",
    badge: "18+ Açısal Kapanma",
    description: "Karakterin arkasından çekim; öndeki sırt ve omuz çıplaklığı kameraya karşı doğal olarak kapatır.",
    promptModifier: "clever modesty camera positioning from behind, the broad curvature of the foreground partner's back and shoulder strategically blocking and obscuring explicit anatomy from the camera, camera focused on the reacting partner's ecstatic facial expression and tangled fingers",
    isPg18Safe: true
  },
  {
    id: "silhouette_shadow",
    label: "Dramatik Silüet & Loş Işık",
    icon: "🕯️",
    category: "pg_safe",
    badge: "18+ Korumalı & Estetik",
    description: "Loş arka ışık, sanatsal gölgeler ve silüet hatları. Açık anatomiyi gizleyerek AI sansür filtresine ASLA takılmadan maksimum tensel, romantik ve dramatik hava katar.",
    promptModifier: "artistic dramatic silhouette, backlit rim lighting, shadowy atmospheric contours, sensual high-contrast chiaroscuro, cinematic shadow play concealing explicit anatomy while capturing supreme romantic tension",
    isPg18Safe: true
  },
  {
    id: "close_up_eyes",
    label: "Yoğun Yakın Plan (Göz & Dudak)",
    icon: "👁️",
    category: "pg_safe",
    badge: "Tensel / Duygusal Makro",
    description: "Tüm beden yerine göz göze elektriklenmeye, aralanmış dudaklara, kenetlenen ellere ve nefes nefese yüz ifadelerine odaklanan büyüleyici yakın çekim.",
    promptModifier: "extreme cinematic close-up macro framing, intense emotional eye contact, parted lips, focused expression of raw passion, breathless intimacy, shallow depth of field with soft blurred background",
    isPg18Safe: true
  },
  {
    id: "over_shoulder",
    label: "Omuz Üstü / Sırttan Çekim (OTS)",
    icon: "🎬",
    category: "cinematic",
    badge: "Sinematik Derinlik",
    description: "Bir karakterin omzu veya arkasından diğerinin yüzüne ve tepkilerine odaklanan, sahneye derinlik katan klasik çizgi roman açısı.",
    promptModifier: "cinematic over-the-shoulder (OTS) shot, dynamic perspective framed past foreground character's shoulder and back, intense focus on the reacting character, layered foreground depth",
    isPg18Safe: true
  },
  {
    id: "birds_eye",
    label: "Kuşbakışı / Yüksek Açı",
    icon: "🦅",
    category: "dramatic",
    badge: "Geniş Perspektif",
    description: "Tepeden yatağa, odaya veya mekana bakan geniş açılı dramatik perspektif. Karakterlerin birbirine sarılışını veya ortamı yukarıdan gösterir.",
    promptModifier: "steep bird's-eye view, dramatic high angle top-down shot looking down from above, overhead composition, expansive atmospheric room framing with elegant spatial geometry",
    isPg18Safe: false
  },
  {
    id: "low_angle_heroic",
    label: "Düşük Açı / Solucan Açısı",
    icon: "⚡",
    category: "dramatic",
    badge: "Güç & Heybet",
    description: "Zeminden yukarıya bakan, karakterleri heybetli, güçlü veya sahneyi domine eden bir havada gösteren dinamik açı.",
    promptModifier: "dramatic dynamic low angle shot looking upwards from floor level, towering dominant silhouettes, heroic scale, striking graphic novel perspective lines",
    isPg18Safe: false
  },
  {
    id: "dutch_tilt",
    label: "Hollanda Açısı (Eğik Kamera)",
    icon: "📐",
    category: "dramatic",
    badge: "Yüksek Tansiyon & Gerilim",
    description: "Ufkun çapraz eğildiği, tehlike, kafa karışıklığı veya baş döndürücü tutku ve heyecanı yansıtan dinamik açı.",
    promptModifier: "dramatic Dutch angle, canted camera horizon tilt, psychological intensity, unstable dynamic energy, bold diagonal graphic novel slant",
    isPg18Safe: false
  },
  {
    id: "back_silhouette_discreet",
    label: "Sırttan Gizleyici Açı",
    icon: "👤",
    category: "pg_safe",
    badge: "18+ Gizemli / Güvenli",
    description: "Karakterin sırtından veya arkasından çekim; öndeki sarılma ve eylemi gizemli tutar, sansürsüz ve zarif bir yetişkin estetiği oluşturur.",
    promptModifier: "framed from behind character's back and shoulders, enigmatic rear perspective, discreet framing, dramatic hair and back contours against soft moody lighting, tasteful composition",
    isPg18Safe: true
  },
  {
    id: "wide_cinematic",
    label: "Geniş Sinematik Mekan Planı",
    icon: "🖼️",
    category: "cinematic",
    badge: "Atmosferik Mekan",
    description: "Karakterlerin tüm çevresini, loş yatak odasını, sokak lambalarını veya odanın genel aurasını kapsayan sinematik geniş plan.",
    promptModifier: "ultra-wide cinematic establishing shot, expansive depth of field, full environment atmosphere, atmospheric ambient lighting surrounding the figures, cinematic graphic novel framing",
    isPg18Safe: false
  }
];

export function getCameraAnglePreset(id?: string): CameraAnglePreset | undefined {
  if (!id) return undefined;
  return CAMERA_ANGLE_PRESETS.find(p => p.id === id);
}

export function getModestyConcealmentPreset(id?: string): ModestyConcealmentPreset | undefined {
  if (!id) return undefined;
  return MODESTY_CONCEALMENT_PRESETS.find(p => p.id === id);
}

export function applyCameraAngleToPrompt(originalPrompt: string, angleId: string): string {
  const preset = getCameraAnglePreset(angleId);
  if (!preset) return originalPrompt;

  // Clean out any previous [CAMERA ANGLE / FRAMING: ...] token
  let cleaned = originalPrompt.replace(/\[CAMERA ANGLE \/ FRAMING:[^\]]+\]/gi, "").trim();

  // Prepend or append clean framing directive
  return `[CAMERA ANGLE / FRAMING: ${preset.label.toUpperCase()} - ${preset.promptModifier}]. ${cleaned}`;
}

export function applyModestyConcealmentToPrompt(originalPrompt: string, techniqueId?: string): string {
  const preset = getModestyConcealmentPreset(techniqueId || "sheets");
  if (!preset) return originalPrompt;

  let cleaned = originalPrompt.replace(/\[ESTETİK ÇIPLAKLIK SANSÜRÜ \/ MODESTY CONCEALMENT:[^\]]+\]/gi, "").trim();
  return `[ESTETİK ÇIPLAKLIK SANSÜRÜ / MODESTY CONCEALMENT: ${preset.label.toUpperCase()} - ${preset.promptModifier}]. ${cleaned}`;
}

