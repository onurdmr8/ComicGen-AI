import { LocationItem } from "../types";

export const SAMPLE_LOCATIONS: LocationItem[] = [
  {
    id: "loc-neo-istanbul",
    name: "Neo-İstanbul Çatıları",
    type: "location",
    description: "2099 yılı Siberpunk İstanbul silüeti; neon ışıklı minareler, holografik reklam panoları, yağmurlu ıslak çatılar ve gökyüzünde süzülen uçan taksiler.",
    visualManifest: "Neo-Istanbul cyberpunk rooftop skyline at night. Holographic neon signs reflecting on wet reflective asphalt, hovering flying vehicles in background, futuristic sci-fi architecture blended with iconic historical silhouette, blue and magenta neon rim lighting, light rain mist.",
    style: "Cyberpunk",
    tags: ["Siberpunk", "Şehir", "Gece", "Yağmur"],
    createdAt: Date.now() - 500000
  },
  {
    id: "loc-wizard-tower",
    name: "Kadim Büyücü Kulesi",
    type: "interior",
    description: "Yüksek mermer sütunlar, spiral dev kütüphane rafları, havada süzülen parlayan antik parşömenler ve ortada dönen mor runik yıldız haritası küresi.",
    visualManifest: "High fantasy grand wizard study interior. Massive spiral bookshelves reaching ancient vaulted stone ceiling, floating glowing grimoires and spell scrolls, giant glowing purple astrolabe/celestial sphere in the center, warm candlelight and mystical arcane particles in air.",
    style: "Classic Comic Book",
    tags: ["Fantezi", "Kütüphane", "Büyü", "İç Mekan"],
    createdAt: Date.now() - 400000
  },
  {
    id: "loc-wasteland-bunker",
    name: "Kıyamet Sonrası Yeraltı Sığınağı",
    type: "interior",
    description: "Ağır çelik hidrolik kapılar, yanıp sönen acil durum sarı lambaları, paslanmış buhar boruları, konsollar ve derme çatma yaşam alanı.",
    visualManifest: "Post-apocalyptic underground military bunker. Heavy bolted blast doors, flashing industrial hazard yellow warning lights, rusted pipes with steam leaks, CRT green terminal monitors, gritty worn survival equipment.",
    style: "Classic Comic Book",
    tags: ["Kıyamet Sonrası", "Sığınak", "Endüstriyel", "Pas"],
    createdAt: Date.now() - 300000
  },
  {
    id: "loc-shadow-alley",
    name: "Gölge Şehri Arka Sokağı",
    type: "location",
    description: "Tek bir sarı sokak lambasının aydınlattığı sisli, dumanlı arka sokak; yangın merdivenleri, tuğla duvarlar ve gizemli gölgeler.",
    visualManifest: "Classic film noir wet narrow brick back alley at midnight. Single flickering warm street lamp casting long sharp shadows, iron fire escapes on red brick walls, rising steam from manholes, high contrast chiaroscuro lighting.",
    style: "Noir",
    tags: ["Noir", "Sokak", "Gizem", "Gece"],
    createdAt: Date.now() - 200000
  },
  {
    id: "loc-starship-bridge",
    name: "Yıldız Gemisi Komuta Köprüsü",
    type: "interior",
    description: "Derin uzaya ve nebula bulutlarına bakan dev panoramik cam, holografik taktik masası, mavi ve beyaz LED aydınlatmalı fütüristik mürettebat istasyonları.",
    visualManifest: "Futuristic starship command bridge. Massive panoramic viewport looking into a colorful cosmic nebula and stars, central holographic tactical battle map, sleek white and carbon fiber consoles with cyan LED lighting.",
    style: "Classic Comic Book",
    tags: ["Uzay", "Bilim Kurgu", "Gemi", "Hologram"],
    createdAt: Date.now() - 100000
  },
  {
    id: "loc-cozy-book-cafe",
    name: "Nostaljik Ahşap Kitap Kafe",
    type: "interior",
    description: "Sıcak ahşap raflarla dolu, sarı Edison ampulleriyle aydınlatılan, cam kenarında yağmuru izleyen masaları olan huzurlu bir kitap-kafe.",
    visualManifest: "Cozy artisanal book cafe interior. Floor-to-ceiling rustic wooden bookshelves loaded with books, warm amber pendant Edison lights, steaming espresso machine, rain streaking down large glass window, plants on wooden tables, inviting quiet ambiance.",
    style: "Slice of Life (Gündelik Webtoon)",
    tags: ["Kafe", "Kitap", "Huzur", "Romantik", "İç Mekan"],
    createdAt: Date.now() - 80000
  },
  {
    id: "loc-sunset-seaside-walk",
    name: "Gün Batımı Sahil & Çınar Yolu",
    type: "location",
    description: "Altın sarısı gün batımının denize vurduğu, çınar ağaçlarıyla çevrili nostaljik sahil yürüyüş yolu ve ahşap banklar.",
    visualManifest: "Romantic seaside promenade at golden hour sunset. Warm peach and gold sunlight glistening across calm ocean waves, silhouette of leafy plane trees along cobblestone path, classic wooden park benches, soft romantic sea breeze.",
    style: "Shojo & Romance Manga",
    tags: ["Sahil", "Gün Batımı", "Romantik", "Dış Mekan", "Huzur"],
    createdAt: Date.now() - 60000
  },
  {
    id: "prop-quantum-blade",
    name: "Plazma Titreşim Kılıcı",
    type: "prop",
    description: "Karakterlerin kullandığı parlayan mavi enerji hatlarına sahip, katlanabilir yüksek teknolojili katana ve kın teçhizatı.",
    visualManifest: "High-tech futuristic plasma vibration blade katana. Sleek matte black titanium hilt, glowing electric cyan energy edge, energy emitter coil details, sci-fi scabbard with battery indicator.",
    style: "Cyberpunk",
    tags: ["Silah", "Plazma", "Kılıç", "Teçhizat"],
    createdAt: Date.now() - 50000
  }
];
