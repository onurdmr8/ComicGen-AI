import { Character } from "../types";
import { generateId } from "./utils";

export const SAMPLE_CHARACTERS: Character[] = [
  {
    id: "sample-hero-1",
    name: "Kaptan Atlas",
    description: "Mavi-altın süper kahraman zırhı, uçuş pelerini, göğsünde parlayan enerji amblemi ve kararlı bir duruş.",
    visualManifest: "Tall muscular build, athletic heroic proportions. Wears a high-tech metallic navy blue and gold armor suit with glowing cyan chest reactor and a flowing crimson cape. Short styled dark brown hair, sharp jawline, confident heroic expression.",
    styleSheet: {
      physicalTraits: "Athletic muscular build, short styled dark brown hair, sharp chiseled jawline, warm brown eyes, confident heroic posture.",
      outfit: "High-tech metallic navy blue and gold chestplate armor, glowing cyan chest reactor emblem, flowing crimson cape, navy tactical combat pants, gold-plated armored boots.",
      accessories: "Flowing crimson cape with gold clasps, glowing cyan chest reactor core, gold forearm gauntlets.",
      colorPalette: ["#1E3A8A (Navy)", "#F59E0B (Gold)", "#DC2626 (Crimson)", "#06B6D4 (Cyan Glow)"],
      referencePrompt: "[CHARACTER STYLE SHEET - KAPTAN ATLAS]: Muscular athletic heroic build, short dark brown hair, sharp jawline | Metallic navy blue & gold armor suit with cyan chest emblem, crimson cape, navy armored combat pants and boots | Gold arm gauntlets | Palette: Navy Blue (#1E3A8A), Gold (#F59E0B), Crimson (#DC2626)",
      autoInject: true,
      lastUpdated: Date.now()
    },
    style: "Marvel Çizgi Roman Tarzı (Marvel Comics)",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    tags: ["Kahraman", "Bilim Kurgu"]
  },
  {
    id: "sample-hero-2",
    name: "Aria (Gölge Ajanı)",
    description: "Gece siyahı taktik giysi, neon mor siber vizör, sırtında ikili enerji kılıcı olan çevik suikastçı.",
    visualManifest: "Slender athletic agile build. Wears matte black stealth combat suit with glowing neon violet circuit accents, utility belt, tactical gauntlets, and dual back-mounted energy katanas. Sleek silver-white ponytail, luminous violet eyes, sharp focused gaze.",
    styleSheet: {
      physicalTraits: "Slender agile build, sleek silver-white high ponytail, luminous violet eyes, porcelain skin, focused piercing gaze.",
      outfit: "Matte black stealth nanofiber combat bodysuit with glowing neon violet circuit traces, tactical shoulder pads, black combat cargo trousers, silent grip boots.",
      accessories: "Retractable neon violet cyber-visor over eyes, dual crossed energy katanas on back scabbard, utility grenade pouches.",
      colorPalette: ["#09090B (Matte Black)", "#A855F7 (Neon Violet)", "#E2E8F0 (Silver White)"],
      referencePrompt: "[CHARACTER STYLE SHEET - ARIA]: Slender agile build, silver-white high ponytail, luminous violet eyes | Matte black nanofiber combat suit with glowing violet circuits, utility pouches, black combat boots | Dual crossed back-mounted energy katanas | Palette: Matte Black (#09090B), Neon Violet (#A855F7)",
      autoInject: true,
      lastUpdated: Date.now()
    },
    style: "Cyberpunk",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    tags: ["Cyberpunk", "Ajan", "Ninja"]
  },
  {
    id: "sample-hero-3",
    name: "Dr. Kıvılcım (Kivanc)",
    description: "Eksantrik mekanik pirinç gözlükler, deri takviyeli laboratuvar önlüğü ve plazma kıvılcımlı mekanik eldiven.",
    visualManifest: "Tall eccentric inventor with wild dark messy hair. Wears brass steampunk multi-lens goggles on forehead, tailored charcoal waistcoat under a reinforced leather-trimmed lab coat, and a mechanical brass steampunk gauntlet crackling with electrical blue sparks.",
    styleSheet: {
      physicalTraits: "Tall lean frame, wild unruly dark brown hair, expressive arched eyebrows, light stubble beard, energetic inventor grin.",
      outfit: "Reinforced leather-trimmed off-white laboratory trench coat over a charcoal tailored waistcoat, rolled-up cream sleeves, dark brown trousers, sturdy leather work boots.",
      accessories: "Multi-lens brass steampunk goggles worn on forehead, right-arm mechanical brass articulated gauntlet with glowing blue electrical tesla arcs.",
      colorPalette: ["#78350F (Leather Brass)", "#F8FAFC (Lab Coat)", "#1E293B (Charcoal)", "#38BDF8 (Plasma Spark)"],
      referencePrompt: "[CHARACTER STYLE SHEET - DR. KIVILCIM]: Lean frame, wild messy dark hair, lively eyes | Leather-trimmed off-white lab coat over charcoal waistcoat, brown trousers, work boots | Brass steampunk multi-lens forehead goggles, right-arm mechanical brass gauntlet crackling with blue sparks | Palette: Brass (#78350F), White (#F8FAFC), Charcoal (#1E293B)",
      autoInject: true,
      lastUpdated: Date.now()
    },
    style: "Classic Comic Book",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    tags: ["Mucit", "Steampunk", "Dahi"]
  },
  {
    id: "sample-hero-4",
    name: "Siber Samuray (Ren)",
    description: "Geleneksel samuray zırhının karbon fiber ve parlayan turuncu neon hatlarla yeniden tasarlanmış hali.",
    visualManifest: "Imposing warrior physique. Wears modern cybernetic carbon-fiber samurai armor plates with glowing orange LED edges, segmented shoulder pauldrons, stylized Kabuto crest helmet or cyber headband, carrying an energized plasma Katana.",
    styleSheet: {
      physicalTraits: "Broad-shouldered athletic warrior build, jet black topknot samurai hairstyle with shaved sides, sharp angular cheekbones, fierce amber eyes.",
      outfit: "Matte carbon-fiber cybernetic samurai armor with glowing orange LED trim, segmented shoulder sode pauldrons, black armored hakama pants, cybernetic shin guards.",
      accessories: "Stylized cyber headband with holographic clan insignia, glowing orange plasma katana sheath on left hip, armored combat gauntlets.",
      colorPalette: ["#18181B (Carbon Black)", "#F97316 (Neon Orange LED)", "#71717A (Armor Steel)"],
      referencePrompt: "[CHARACTER STYLE SHEET - SIBER SAMURAY]: Broad athletic build, jet black topknot, amber eyes | Carbon-fiber samurai armor with glowing orange LED edges, armored hakama pants, cybernetic shin guards | Orange plasma katana sheath, cyber headband | Palette: Carbon Black (#18181B), Neon Orange (#F97316)",
      autoInject: true,
      lastUpdated: Date.now()
    },
    style: "Manga",
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    tags: ["Manga", "Samuray", "Savaşçı"]
  },
  {
    id: "sample-romance-1",
    name: "Deniz (Kafe İşletmecisi & Yazar)",
    description: "Sıcak gülümsemeli, yumuşak dalgalı kahverengi saçlı, oversize krem rengi örgü kazak ve kahve önlüğü giyen sevecen karakter.",
    visualManifest: "Warm handsome demeanor, soft wavy chestnut brown hair, warm hazel eyes with kind smile crinkles. Wears an oversized cozy cream knit sweater, dark green barista apron with leather straps, dark denim trousers, and carries a steaming coffee mug or vintage notebook.",
    styleSheet: {
      physicalTraits: "Gentle aesthetic, wavy chestnut brown hair with soft fringe, expressive hazel eyes, warm reassuring smile, medium height with relaxed posture.",
      outfit: "Oversized cozy cream-colored knit wool sweater, deep forest green barista apron with tan leather straps, comfortable dark wash denim jeans, tan leather loafers.",
      accessories: "Steaming artisan ceramic coffee mug, brown leather journal tucked under arm, thin silver ring on thumb.",
      colorPalette: ["#FEF3C7 (Warm Cream)", "#14532D (Forest Green)", "#78350F (Warm Brown)", "#D97706 (Amber)"],
      referencePrompt: "[CHARACTER STYLE SHEET - DENIZ]: Gentle posture, wavy chestnut hair, warm hazel eyes | Cozy cream knit sweater under forest green barista apron, dark denim, tan loafers | Ceramic coffee mug & leather notebook | Palette: Warm Cream (#FEF3C7), Forest Green (#14532D), Leather Brown (#78350F)",
      autoInject: true,
      lastUpdated: Date.now()
    },
    style: "Slice of Life (Gündelik Webtoon)",
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    tags: ["Romantik", "Gündelik", "Kafe", "Webtoon"]
  },
  {
    id: "sample-romance-2",
    name: "Elif (Mimar & İllüstratör)",
    description: "Zarif ve enerjik, omuz hizasında parlak koyu saçları, yuvarlak ince çerçeveli gözlükleri ve şık deve tüyü trençkotu olan çizer.",
    visualManifest: "Stylish creative look, shoulder-length straight black hair with airy bangs, round rose-gold glasses, sparkling curious dark brown eyes with soft rosy blush. Wears a classic camel-beige tailored trench coat over a black turtleneck, plaid pleated skirt, and carries an A4 sketchbook.",
    styleSheet: {
      physicalTraits: "Slender elegant posture, shoulder-length glossy black hair with soft bangs, delicate round rose-gold glasses, lively sparkling dark brown eyes, subtle blush on cheeks.",
      outfit: "Classic camel beige long trench coat draped stylishly over a fine-knit black turtleneck sweater, subtle dark grey plaid pleated skirt, sheer tights, polished ankle boots.",
      accessories: "Round rose-gold metal glasses, black leather messenger bag, spiral art sketchbook with drafting pencils.",
      colorPalette: ["#D97706 (Camel Beige)", "#18181B (Black Turtleneck)", "#F472B6 (Soft Blush)", "#94A3B8 (Slate)"],
      referencePrompt: "[CHARACTER STYLE SHEET - ELIF]: Slender posture, shoulder-length black hair with bangs, round rose-gold glasses, rosy blush | Camel beige trench coat over black turtleneck, plaid skirt, ankle boots | Leather messenger bag & sketchbook | Palette: Camel Beige (#D97706), Black (#18181B), Soft Rose (#F472B6)",
      autoInject: true,
      lastUpdated: Date.now()
    },
    style: "Shojo & Romance Manga",
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
    tags: ["Romantik", "Sanatçı", "Shojo", "Şehir"]
  }
];
