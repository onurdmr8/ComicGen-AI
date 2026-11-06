import { LocationItem, LocationType } from "../types";

export interface DetectedLocation {
  name: string;
  type: LocationType;
  description: string;
  visualManifest: string;
  reason: string;
  matchedKeyword?: string;
}

export interface LocationPatternDefinition {
  regex: RegExp;
  name: string;
  type: LocationType;
  description: string;
  visualManifest: string;
  reasonTr: string;
}

export const LOCATION_PATTERNS: LocationPatternDefinition[] = [
  {
    regex: /\b(vintage\s+kafe|kafe(?:de|sinde|ye)?|kahve\s+d[üu]kkan[ıi]|kahve(?:de)?|bistro(?:da)?|restoran(?:da|ında)?|lokanta(?:da)?|pastane(?:de)?|coffee\s+shop|cozy\s+cafe)\b/i,
    name: "Vintage Kafe & Restoran",
    type: "interior",
    description: "Ahşap masaları, buharlı kahve makineleri ve sarı Edison ampulleriyle nostaljik, samimi bir kafe ortamı.",
    visualManifest: "Cozy vintage artisan coffee shop, rustic reclaimed oak tables, brass espresso machine, warm Edison bulb glow, blackboard menu on exposed brick wall, rain-streaked window reflections.",
    reasonTr: "Hikaye metninde kafe/kahve/restoran mekanı tespit edildi"
  },
  {
    regex: /\b(ara\s+sokak(?:ta)?|karanl[ıi]k\s+sokak|ya[ğg]murlu\s+cadde|ya[ğg]mur(?:da|\s+alt[ıi]nda)?|[şs]emsiye(?:\s+alt[ıi]nda)?|sokak(?:ta|a)?|cadde(?:de|ye)?|kald[ıi]r[ıi]m(?:da)?|gece\s+soka[ğg][ıi]|rainy\s+street|dark\s+alley(?:way)?|neon\s+alley)\b/i,
    name: "Karanlık Yağmurlu Sokak",
    type: "urban",
    description: "Islak parke taşları, sarı sokak lambaları ve neon tabelaların su birikintilerine vuran yansımalarıyla atmosferik şehir sokağı.",
    visualManifest: "Atmospheric cinematic city alleyway in the rain, wet cobblestone reflections, amber streetlamp glow, neon signs reflecting in puddles, steam rising from street grates, gritty noir aesthetic.",
    reasonTr: "Hikaye metninde sokak, cadde veya yağmurlu dış mekan tespit edildi"
  },
  {
    regex: /\b(bar(?:da|[ıi]nda)?|gece\s+kul[üu]b[üu]|pub(?:da)?|meyhane(?:de)?|parti(?:de)?|dans\s+pisti|lounge|nightclub|jazz\s+bar)\b/i,
    name: "Loş Gece Kulübü & Bar",
    type: "interior",
    description: "Koyu renk tezgahlar, renkli neon ışıklar, şişe rafları ve loş gölgelerle dolu hareketli gece mekanı.",
    visualManifest: "Atmospheric dim-lit nightclub lounge bar, polished mahogany counter, glowing shelves of amber bottles, magenta and cyan neon rim lighting, smoky haze, plush velvet booths.",
    reasonTr: "Hikaye metninde bar veya gece kulübü tespit edildi"
  },
  {
    regex: /\b(g[öo]kdelen\s+[çc]at[ıi]s[ıi]|teras(?:ta)?|[çc]at[ıi](?:da|s[ıi]nda)?|balkon(?:da)?|rooftop(?:\s+terrace)?|skyscraper\s+roof)\b/i,
    name: "Gökdelen Çatısı & Teras",
    type: "exterior",
    description: "Şehrin parlayan ışıklarına tepeden bakan, rüzgarlı ve yüksek güvenlik korkuluklu gökdelen çatısı.",
    visualManifest: "High-altitude skyscraper rooftop overlooking glowing sprawling metropolis at dusk, metal exhaust vents, wet perimeter parapet railing, wind-blown mist, cinematic wide urban depth.",
    reasonTr: "Hikaye metninde çatı, teras veya balkon mekanı tespit edildi"
  },
  {
    regex: /\b(sahil(?:de)?|kumsal(?:da)?|plaj(?:da)?|deniz\s+k[ıi]y[ıi]s[ıi]|deniz(?:de)?|g[öo]l\s+kenar[ıi]|orman(?:da)?|a[ğg]a[çc]l[ıi]k|beach|sea|shoreline|forest)\b/i,
    name: "Sisli Sahil & Doğa",
    type: "nature",
    description: "Yoğun ağaçlar, puslu zemin veya dalgaların vurduğu kum taneleriyle doğal açık hava mekanı.",
    visualManifest: "Atmospheric natural landscape, tranquil shoreline with gentle dark water reflections, cool coastal breeze, distant city glow on the horizon.",
    reasonTr: "Hikaye metninde doğa veya sahil mekanı tespit edildi"
  },
  {
    regex: /\b(araba\s+i[çc]i|ara[çc]\s+i[çc]i|otomobil(?:de)?|taksi(?:de)?|araba(?:da)?|limuzin(?:de)?|direksiyon|car\s+interior|moving\s+vehicle)\b/i,
    name: "Lüks Araç İçi / Otomobil",
    type: "vehicle",
    description: "Deri koltuklar, parlayan dijital gösterge paneli ve camlardan akan şehir ışıklarıyla araç içi atmosferi.",
    visualManifest: "Cinematic sports sedan interior at night, dark stitched leather seats, illuminated digital dashboard dials with cyan glow, rain streaks on windshield, passing streetlights casting moving orange flares.",
    reasonTr: "Hikaye metninde araç veya araba içi tespit edildi"
  },
  {
    regex: /\b(ofis(?:te|inde)?|b[üu]ro(?:da)?|toplant[ıi]\s+odas[ıi]|plaza(?:da)?|holding(?:de)?|patron\s+odas[ıi]|g[öo]kdelen\s+ofisi|office|boardroom)\b/i,
    name: "Modern Plaza Ofisi",
    type: "interior",
    description: "Büyük cam bölmeler, modern çalışma masaları, şehir manzarası ve şık ofis aydınlatması.",
    visualManifest: "High-end corporate corner office at twilight, massive panoramic windows overlooking skyscraper glass towers, sleek glass executive desk, ergonomic leather chairs, minimal architectural lighting.",
    reasonTr: "Hikaye metninde ofis veya şirket ortamı tespit edildi"
  },
  {
    regex: /\b(terk\s+edilmi[şs]\s+depo|depo(?:da|sunda)?|sanayi\s+hangar[ıi]|fabrika(?:da)?|hangar(?:da)?|abandoned\s+warehouse|industrial\s+hangar)\b/i,
    name: "Terk Edilmiş Sanayi Deposu",
    type: "interior",
    description: "Kırık pencerelerden süzülen ay ışığı, paslı metal kirişler ve tozlu beton zeminle tekinsiz bir sanayi deposu.",
    visualManifest: "Vast abandoned industrial warehouse, broken skylights with shafts of cool moonlight, rusted iron trusses, dusty cracked concrete floor, discarded wooden crates, moody chiaroscuro shadows.",
    reasonTr: "Hikaye metninde depo veya hangar tespit edildi"
  },
  {
    regex: /\b(hastane(?:de|sinde)?|hastane\s+odas[ıi]|hastane\s+koridoru|klinik(?:te)?|acil\s+servis|hospital\s+room|hospital\s+corridor)\b/i,
    name: "Hastane Odası & Koridoru",
    type: "interior",
    description: "Steril beyaz duvarlar, floresan ışıklar ve medikal ekipmanlarla donatılmış hastane ortamı.",
    visualManifest: "Sterile modern hospital room and corridor, cool fluorescent overhead panel lights, stainless steel IV stands, heart monitor screens with faint green glow, glossy linoleum floors.",
    reasonTr: "Hikaye metninde hastane ortamı tespit edildi"
  },
  {
    regex: /\b(otel(?:de|e)?|otel\s+odas[ıi](?:nda)?|otel\s+s[üu]iti(?:nde)?|l[üu]ks\s+otel|resepsiyon|hotel\s+room|luxury\s+hotel)\b/i,
    name: "Lüks Otel Odası & Süit",
    type: "interior",
    description: "Geniş pencereli, şehir manzaralı lüks otel odası; king-size yatak, saten çarşaflar ve loş abajur aydınlatması.",
    visualManifest: "Upscale modern luxury hotel bedroom with floor-to-ceiling panoramic windows overlooking night city lights, king-size bed with crisp duvet, designer ambient lamp lighting, plush carpet, rich walnut surfaces.",
    reasonTr: "Hikaye metninde otel ortamı tespit edildi"
  },
  {
    regex: /\b(banyo(?:da)?|du[şs](?:ta)?|jakuzi(?:de)?|k[üu]vet(?:te)?|su\s+buhar[ıi]|bathroom|shower|jacuzzi)\b/i,
    name: "Lüks Mermer Banyo & Jakuzi",
    type: "interior",
    description: "Geniş mermer lavabo, cam duşakabin, yükselen sıcak su buharı ve loş sıcak aplik ışıkları.",
    visualManifest: "Opulent modern marble bathroom, spacious walk-in glass shower with rising steam, warm sconce lighting, luxury stone textures, atmospheric chiaroscuro reflections.",
    reasonTr: "Hikaye metninde banyo/duş mekanı tespit edildi"
  },
  {
    regex: /\b(mutfak(?:ta)?|yemek\s+masas[ıi](?:nda)?|mum\s+[ıi][şs][ıi][ğg][ıi]|ak[şs]am\s+yeme[ğg]i|kadeh|şarap\s+kadehi|romantic\s+dinner|dining\s+table)\b/i,
    name: "Romantik Yemek Masası & Salon",
    type: "interior",
    description: "Mum ışıklarıyla aydınlatılmış şık yemek masası, şarap kadehleri ve sıcak romantik iç mekan.",
    visualManifest: "Warm romantic candlelit dining room, sleek modern dining table set with crystal wine glasses and candles, soft dim amber illumination, luxury modern apartment background.",
    reasonTr: "Hikaye metninde yemek masası veya mum ışıklı akşam yemeği tespit edildi"
  },
  {
    regex: /\b(yatak(?:ta|ta\s+uzanırken|ta\s+sarılırken|a)?|yatak\s+odas[ıi](?:nda)?|çarşaf(?:lar)?|koltuk(?:ta\s+sarıl)?|kanepe(?:de\s+uzan)?|daire(?:de|sinde)?|malik[âa]ne(?:de)?|villa(?:da)?|apartman(?:da)?|penthouse|rezidans|bedroom|living\s+room|ev(?:de|inde|e)?)\b/i,
    name: "Lüks Rezidans & Yatak Odası",
    type: "interior",
    description: "Yumuşak saten çarşaflar, geniş king-size yatak, loş abajur aydınlatması ve gece şehir manzaralı lüks daire.",
    visualManifest: "Luxurious modern penthouse suite and master bedroom at night, king-size bed with soft tumbled silk satin sheets, floor-to-ceiling panoramic glass windows overlooking glowing city skyline, warm amber ambient bedside lamps, designer plush carpet, rich interior atmosphere.",
    reasonTr: "Hikaye metninde ev, yatak veya oda ortamı tespit edildi"
  }
];

export function detectLocationsClientRegex(
  text: string,
  existingLocations: LocationItem[] = []
): DetectedLocation[] {
  if (!text || typeof text !== "string") return [];
  const results: DetectedLocation[] = [];

  const isAlreadyPresent = (name: string): boolean => {
    const n = name.trim().toLowerCase();
    const existingMatch = existingLocations.some(el => {
      const en = el.name.trim().toLowerCase();
      return en === n || en.includes(n) || n.includes(en);
    });
    const resultMatch = results.some(r => {
      const rn = r.name.trim().toLowerCase();
      return rn === n || rn.includes(n) || n.includes(rn);
    });
    return existingMatch || resultMatch;
  };

  for (const p of LOCATION_PATTERNS) {
    const match = text.match(p.regex);
    if (match && !isAlreadyPresent(p.name)) {
      results.push({
        name: p.name,
        type: p.type,
        description: p.description,
        visualManifest: p.visualManifest,
        reason: p.reasonTr,
        matchedKeyword: match[0]
      });
    }
  }

  // Dynamic regex for custom venues: "[Kişi/Nitelik] [Mekan] (odasında|salonunda|ofisinde|evinde|kütüphanesinde|bahçesinde|restoranında|dükkanında)"
  const dynamicPattern = /(?:([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:'n[ıi]n|'nin|'nun|'nün)?)\s+)?([A-ZÇĞİÖŞÜa-zçğıöşü]{3,15})\s+(odas[ıi]nda|salonunda|ofisinde|evinde|k[üu]t[üu]phanesinde|bah[çc]esinde|restoran[ıi]nda|d[üu]kkan[ıi]nda)/gi;
  let dynMatch: RegExpExecArray | null;
  while ((dynMatch = dynamicPattern.exec(text)) !== null) {
    const owner = dynMatch[1] ? dynMatch[1].trim() + " " : "";
    const rawDescriptor = dynMatch[2].trim().replace(/^(bir|yeni|büyük|eski|olan|bu|şu|o|ve|ile|için)\s+/i, "").trim();
    if (rawDescriptor.length < 3 || /^(bir|yeni|büyük|eski|olan|bu|şu|o|ve|ile|için)$/i.test(rawDescriptor)) continue;
    const rawType = dynMatch[3].toLowerCase();
    const typeSuffix = rawType.startsWith("oda") ? "Odası"
      : rawType.startsWith("salon") ? "Salonu"
      : rawType.startsWith("ofis") ? "Ofisi"
      : rawType.startsWith("ev") ? "Evi"
      : rawType.startsWith("kütüp") ? "Kütüphanesi"
      : rawType.startsWith("bahçe") ? "Bahçesi"
      : rawType.startsWith("dükkan") ? "Dükkanı"
      : "Restoranı";
    const venueName = `${owner}${rawDescriptor.charAt(0).toUpperCase() + rawDescriptor.slice(1)} ${typeSuffix}`;
    const venueType: LocationType = rawType.startsWith("bahçe") ? "exterior" : "interior";
    if (!isAlreadyPresent(venueName)) {
      results.push({
        name: venueName,
        type: venueType,
        description: `${venueName} için özel tasarlanmış atmosferik mekan.`,
        visualManifest: `Detailed graphic novel setting: ${venueName}, authentic architectural materials, moody atmospheric depth, cinematic lighting accents.`,
        reason: `Hikayedeki "${dynMatch[0]}" ifadesinden tespit edildi`,
        matchedKeyword: dynMatch[0]
      });
    }
  }

  return results;
}

export function getThematicDefaultLocation(topic: string = "", tone: string = "", intro: string = ""): LocationItem {
  const combined = `${topic} ${tone} ${intro}`.toLowerCase();
  const isRomance = /\b(aşk|aşık|sevgi|sevgili|romantik|romantizm|romance|flört|öpüş|öpücük|kiss|date|buluşma|tutku|tutkulu|sensual|intimate|evlilik|ilişki|sarılma|duygusal|shojo|pg-17|pg-18|erotik)\b/i.test(combined);
  const isAction = /\b(aksiyon|savaş|dövüş|kovalamaca|silah|ajan|operasyon|kaçış|patlama|action|fight|gritty|gerilim|suç|cinayet|dedektif|mafya)\b/i.test(combined);
  const isSciFi = /\b(uzay|siberpunk|cyberpunk|bilim\s+kurgu|sci-fi|robot|yapay\s+zeka|fütüristik|uzaylı)\b/i.test(combined);

  if (isRomance) {
    return {
      id: "loc_thematic_romance",
      name: "Lüks Rezidans & Yatak Odası",
      type: "interior",
      description: "Gece parlayan şehir manzaralı lüks çatı katı dairesi, geniş yatak, loş romantik abajur ışıkları ve modern dekorasyon.",
      visualManifest: "Luxurious modern penthouse suite and bedroom at night, floor-to-ceiling panoramic glass windows overlooking glowing city skyline, king-size bed with tumbled silk satin sheets, warm amber ambient bedside lamps, plush velvet sofa, rich interior atmosphere.",
      tags: ["Tematik Mekan", "Romantizm/Aşk"]
    };
  }

  if (isAction) {
    return {
      id: "loc_thematic_action",
      name: "Karanlık Yağmurlu Şehir Sokağı",
      type: "urban",
      description: "Islak asfalt yansımaları, neon tabelalar ve sarı sokak lambalarıyla dolu gece sokağı.",
      visualManifest: "Atmospheric rain-soaked urban city street at night, wet asphalt reflections, glowing neon signs, amber streetlamps, steam rising from grates, dramatic graphic novel noir depth.",
      tags: ["Tematik Mekan", "Aksiyon/Gerilim"]
    };
  }

  if (isSciFi) {
    return {
      id: "loc_thematic_scifi",
      name: "Neo-Gökdelen Çatısı & Şehir",
      type: "exterior",
      description: "Holografik reklam panoları ve parlayan gökdelenlerin üzerinde fütüristik şehir manzarası.",
      visualManifest: "Futuristic cyberpunk skyscraper rooftop terrace at night, towering neon holo-advertisements reflecting in wet glass floor, hovering distant city traffic, moody cyan and magenta volumetric lights.",
      tags: ["Tematik Mekan", "Bilim Kurgu"]
    };
  }

  return {
    id: "loc_thematic_interior",
    name: "Lüks Rezidans & Penthouse",
    type: "interior",
    description: "Geniş pencereli, sıcak ahşap detaylı ve zengin ışıklandırmalı modern iç mekan.",
    visualManifest: "Stylishly furnished modern graphic novel interior room, large window with natural atmospheric lighting, warm textured wooden walls, cinematic environmental storytelling depth.",
    tags: ["Tematik Mekan", "Modern"]
  };
}

export const POPULAR_LOCATION_CHIPS: Array<{
  name: string;
  label: string;
  icon: string;
  type: LocationType;
  description: string;
  visualManifest: string;
}> = [
  {
    name: "Lüks Rezidans & Yatak Odası",
    label: "Lüks Rezidans",
    icon: "🛋️",
    type: "interior",
    description: "Geniş pencereli, şehir manzaralı şık rezidans ve yatak odası.",
    visualManifest: "Luxurious modern penthouse suite and master bedroom at night, king-size bed with soft tumbled silk satin sheets, floor-to-ceiling panoramic glass windows overlooking glowing city skyline, warm amber ambient bedside lamps, designer plush carpet, rich interior atmosphere."
  },
  {
    name: "Vintage Kafe & Restoran",
    label: "Vintage Kafe",
    icon: "☕",
    type: "interior",
    description: "Ahşap masalar, sarı Edison ampulleri ve buharlı kahve makineleriyle nostaljik kafe.",
    visualManifest: "Cozy vintage artisan coffee shop, rustic reclaimed oak tables, brass espresso machine, warm Edison bulb glow, blackboard menu on exposed brick wall, rain-streaked window reflections."
  },
  {
    name: "Karanlık Yağmurlu Sokak",
    label: "Gece Sokağı",
    icon: "🌧️",
    type: "urban",
    description: "Islak parke taşları, sarı sokak lambaları ve neon yansımalarıyla şehir sokağı.",
    visualManifest: "Atmospheric cinematic city alleyway in the rain, wet cobblestone reflections, amber streetlamp glow, neon signs reflecting in puddles, steam rising from street grates, gritty noir aesthetic."
  },
  {
    name: "Loş Gece Kulübü & Bar",
    label: "Bar & Kulüp",
    icon: "🍸",
    type: "interior",
    description: "Koyu renk tezgahlar, renkli neon ışıklar ve loş gölgelerle dolu gece mekanı.",
    visualManifest: "Atmospheric dim-lit nightclub lounge bar, polished mahogany counter, glowing shelves of amber bottles, magenta and cyan neon rim lighting, smoky haze, plush velvet booths."
  },
  {
    name: "Gökdelen Çatısı & Teras",
    label: "Çatı & Teras",
    icon: "🏙️",
    type: "exterior",
    description: "Şehrin parlayan ışıklarına tepeden bakan yüksek gökdelen çatısı.",
    visualManifest: "High-altitude skyscraper rooftop overlooking glowing sprawling metropolis at dusk, metal exhaust vents, wet perimeter parapet railing, wind-blown mist, cinematic wide urban depth."
  },
  {
    name: "Lüks Otel Odası & Süit",
    label: "Otel Odası",
    icon: "🏨",
    type: "interior",
    description: "Şehir manzaralı lüks otel odası, king-size yatak ve abajur aydınlatması.",
    visualManifest: "Upscale modern luxury hotel bedroom with floor-to-ceiling panoramic windows overlooking night city lights, king-size bed with crisp duvet, designer ambient lamp lighting, plush carpet, rich walnut surfaces."
  },
  {
    name: "Sisli Sahil & Kumsal",
    label: "Sahil & Doğa",
    icon: "🌊",
    type: "nature",
    description: "Dalgaların vurduğu kum taneleri ve sakin gece deniz manzarası.",
    visualManifest: "Atmospheric natural landscape, tranquil shoreline with gentle dark water reflections, cool coastal breeze, distant city glow on the horizon."
  },
  {
    name: "Modern Plaza Ofisi",
    label: "Plaza Ofisi",
    icon: "🏢",
    type: "interior",
    description: "Büyük cam bölmeler, şık çalışma masaları ve şehir manzaralı ofis.",
    visualManifest: "High-end corporate corner office at twilight, massive panoramic windows overlooking skyscraper glass towers, sleek glass executive desk, ergonomic leather chairs, minimal architectural lighting."
  }
];
