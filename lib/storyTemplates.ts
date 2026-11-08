import { Character, LocationItem } from "../types";

export interface StoryTemplateItem {
  id: string;
  genre: "scifi" | "romance" | "mystery" | "superhero" | "manga" | "comedy" | "horror" | "historical";
  genreLabel: string;
  genreEmoji: string;
  badgeColor: string; // e.g. "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
  title: string;
  tagline: string;
  intro: string;
  tone: string;
  style: string;
  cast: Array<Omit<Character, "id">>;
  suggestedLocations?: Array<Omit<LocationItem, "id">>;
  plotHooks: string[];
}

export const STORY_TEMPLATES: StoryTemplateItem[] = [
  // --- BİLİM KURGU & SİBERPUNK ---
  {
    id: "scifi-1",
    genre: "scifi",
    genreLabel: "Siberpunk & Bilim Kurgu",
    genreEmoji: "🚀",
    badgeColor: "bg-cyan-950/80 text-cyan-300 border-cyan-500/60",
    title: "Siber Gece: Kod Adı Neon",
    tagline: "Gökdelenlerin neon ışıkları altında kayıp bir yapay zekâ çekirdeği.",
    intro: "2088 yılında asit yağmurlarının yıkadığı Neo-İstanbul sokaklarında, gizli bir yeraltı laboratuvarından çalınan kuantum çekirdeğin peşine düşülür. Şehrin enerji şebekesi çökmek üzeredir ve zaman daralmaktadır.",
    tone: "Sci-Fi",
    style: "Amerikan Çizgi Romanı",
    cast: [
      {
        name: "Ares",
        description: "Mekanik sibernetik sol kolu olan, siyah deri pardösülü, karanlık ve sert bakışlı tecrübeli siber dedektif. Gözünde mavi holografik hedefleme monoklü var.",
        style: "Amerikan Çizgi Romanı"
      },
      {
        name: "Maya",
        description: "Hızlı reflekslere sahip dahi siber korsan. Mor neon çizgili kısa saçlar, holografik taktik eldivenler ve teknolojik sokak giyimi.",
        style: "Amerikan Çizgi Romanı"
      }
    ],
    plotHooks: [
      "Çalınan çekirdek aniden Ares'in sibernetik koluyla senkronize olur.",
      "Megakoloni dronları sokağı abluka altına alır.",
      "Yeraltı metrosunda yüksek hızlı kovalamaca başlar."
    ]
  },
  {
    id: "scifi-2",
    genre: "scifi",
    genreLabel: "Siberpunk & Bilim Kurgu",
    genreEmoji: "🌌",
    badgeColor: "bg-cyan-950/80 text-cyan-300 border-cyan-500/60",
    title: "Yıldızlararası Kaçakçı: Nebula Çölü",
    tagline: "Terk edilmiş bir maden gezegeninde paha biçilemez bir enerji kristali.",
    intro: "Kozmik bir fırtınanın ortasında kalan hurda gemi 'Yıldız Martısı', tehlikeli uzay korsanlarının kontrolündeki kırmızı tozlu maden kolonisine mecburi iniş yapar. Ancak madenin derinliklerinde uyuyan kadim bir teknoloji uyanmıştır.",
    tone: "Action",
    style: "Modern Comic",
    cast: [
      {
        name: "Kaptan Bora",
        description: "Alaycı gülüşlü, yıpranmış kahverengi pilot montu ve lazer tabancası olan cesur uzay kaptanı.",
        style: "Modern Comic"
      },
      {
        name: "K-09",
        description: "İnsansı düşünme yeteneğine sahip, paslı metalik zırhlı ve sarı optik gözlü vefakar savaş droidi.",
        style: "Modern Comic"
      }
    ],
    plotHooks: [
      "Korsan lideri geminin motorunu rehin alır.",
      "Maden tünellerinde biyomekanik yaratıklar saldırır."
    ]
  },

  // --- ROMANTİZM & DRAM ---
  {
    id: "romance-1",
    genre: "romance",
    genreLabel: "Romantik & Duygusal",
    genreEmoji: "💖",
    badgeColor: "bg-pink-950/80 text-pink-300 border-pink-500/60",
    title: "Yağmurda Yarım Kalan Şemsiye",
    tagline: "İstanbul'un sisli bir vapur iskelesinde beklenmedik bir karşılaşma.",
    intro: "Göz alabildiğine yağan sonbahar yağmurunda Kadıköy vapur iskelesinde birbirine çarpan iki eski dost... Yıllar önce söylenememiş itiraflar ve ıslak sokak lambalarının altında birbirine kenetlenen gözler.",
    tone: "Romance",
    style: "Modern Comic",
    cast: [
      {
        name: "Kaya",
        description: "30 yaşlarında, kararlı fakat hüzünlü bakışlı mimar. Lacivert kaşe palto, gri boğazlı kazak ve omzunda deri mimarlık çantası.",
        style: "Modern Comic"
      },
      {
        name: "Leyla",
        description: "28 yaşlarında, zarif ve duygusal sanat restoratörü. Uzun dalgalı kestane saçlar, bordo örgü atkı ve sıcak gülümseme.",
        style: "Modern Comic"
      }
    ],
    plotHooks: [
      "Vapur seferleri fırtına yüzünden iptal edilir ve geceyi eski bir çay ocağında geçirirler.",
      "Kaya cebindeki yıllar öncesine ait sakladığı tren biletini çıkarır."
    ]
  },
  {
    id: "romance-2",
    genre: "romance",
    genreLabel: "Romantik & Tutku",
    genreEmoji: "🔥",
    badgeColor: "bg-rose-950/80 text-rose-300 border-rose-500/60",
    title: "Çatı Katı Atölyesi: Gece Yarısı Dansı",
    tagline: "Boya lekeli tuvaller, caz tınıları ve bastırılamayan bir aşk.",
    intro: "Şehrin parıldayan gece manzarasına bakan cam tavanlı bir çatı atölyesinde, sergi açılışına saatler kala iki tutkulu sanatçı arasında gerilim ve aşk kıvılcımları tutuşur.",
    tone: "Romance",
    style: "Graphic Novel",
    cast: [
      {
        name: "Emir",
        description: "Karizmatik, dağınık siyah saçlı, kolları sıvanmış beyaz gömlekli heykeltıraş.",
        style: "Graphic Novel"
      },
      {
        name: "Selin",
        description: "Büyüleyici zümrüt gözlü, siyah saten elbiseli, tutkulu ve yetenekli ressam.",
        style: "Graphic Novel"
      }
    ],
    plotHooks: [
      "Işıklar söner ve sadece şöminenin kızıl alevi atölyeyi aydınlatır.",
      "Tuval üzerine birlikte fırça darbesi vururken elleri kenetlenir."
    ]
  },

  // --- GİZEM & DEDEKTİF (NOIR) ---
  {
    id: "mystery-1",
    genre: "mystery",
    genreLabel: "Gizem & Kara Dedektif",
    genreEmoji: "🕵️",
    badgeColor: "bg-amber-950/80 text-amber-300 border-amber-500/60",
    title: "Boğazın Sisli Sırrı: Mühürlü Harita",
    tagline: "Eski bir sahaf dükkanında bulunan şifreli elyazması.",
    intro: "Kapalıçarşı'nın loş labirentlerinde asırlık bir cilt açıldığında içinden düşen mühürlü bir pusula, Osmanlı döneminden kalma unutulmuş bir yeraltı su sarnıcını işaret eder. Ancak bu sırrı arayan tek kişi onlar değildir.",
    tone: "Mystery",
    style: "Noir Çizgi Roman",
    cast: [
      {
        name: "Deniz",
        description: "Genç araştırmacı tarihçi, yuvarlak boynuz çerçeveli gözlükleri, tüvit ceketi ve elinden düşürmediği deri not defteri.",
        style: "Noir Çizgi Roman"
      },
      {
        name: "Sinan",
        description: "Gözü pek, tecrübeli ve ketum sahaf ustası. Ağzında piposu, gri yeleği ve keskin dikkatli gözleri.",
        style: "Noir Çizgi Roman"
      }
    ],
    plotHooks: [
      "Dükkanın vitrin camı bir kurşunla tuzla buz olur.",
      "Sarnıcın kapısında meşale ışığında beliren gölgeler."
    ]
  },

  // --- SÜPER KAHRAMAN & AKSİYON ---
  {
    id: "superhero-1",
    genre: "superhero",
    genreLabel: "Süper Kahraman",
    genreEmoji: "⚡",
    badgeColor: "bg-blue-950/80 text-blue-300 border-blue-500/60",
    title: "Yıldırım Muhafızı: Gökdelen Kuşatması",
    tagline: "Şehri karanlığa gömmek isteyen manyetik güçlere karşı son kalkan.",
    intro: "Metropolün finans merkezindeki en yüksek kule, yerçekimini bükebilen tehlikeli bir mutant çetesi tarafından ele geçirilir. Şehrin elektrik ağını bedeninde toplayan genç kahraman kuleye tırmanmaya başlar.",
    tone: "Action",
    style: "Standart Çizgi Roman",
    cast: [
      {
        name: "Volkan (Yıldırım)",
        description: "Mavi-altın renkli yüksek teknoloji taktik zırh giyen, gözlerinden kıvılcımlar saçılan atletik genç kahraman.",
        style: "Standart Çizgi Roman"
      },
      {
        name: "Sıfır Derece",
        description: "Sivri buz kristalleri üreten, siyah buz zırhlı ve acımasız bakışlı tehlikeli süper kötü.",
        style: "Standart Çizgi Roman"
      }
    ],
    plotHooks: [
      "Kulenin helikopter pistinde elektrik ve buz çarpışması yaşanır.",
      "Asansör boşluğunda rehineler serbest bırakılmayı beklemektedir."
    ]
  },

  // --- MANGA & SHONEN ---
  {
    id: "manga-1",
    genre: "manga",
    genreLabel: "Manga & Shonen",
    genreEmoji: "⚔️",
    badgeColor: "bg-red-950/80 text-red-300 border-red-500/60",
    title: "Alev Kılıcı: Ruhlar Arenası",
    tagline: "Kadim dövüş sanatları ustasının uykudaki ejder mührü.",
    intro: "Kiraz çiçeklerinin döküldüğü sisli bir tapınak avlusunda, turnuvanın final maçı başlamak üzeredir. Genç kılıç ustası, ailesinin onurunu kurtarmak için yasak gölge tekniğini kullanan rakibine karşı kılıcını çeker.",
    tone: "Action",
    style: "Japon Mangası",
    cast: [
      {
        name: "Ren",
        description: "Dikenli siyah saçlı, kırmızı alın bantlı, sırtında alev işlemeli beyaz kimono taşıyan kararlı genç dövüşçü.",
        style: "Japon Mangası"
      },
      {
        name: "Kuro",
        description: "Gözlerinin üzerinde maske olan, çift hançer kullanan, gölgelerden güç alan soğukkanlı suikastçı.",
        style: "Japon Mangası"
      }
    ],
    plotHooks: [
      "Kılıç darbeleriyle avludaki taş fenerler ikiye ayrılır.",
      "Ren'in kılıcı mavi bir ejder aleviyle parlamaya başlar."
    ]
  },

  // --- KOMEDİ & GÜNLÜK HAYAT ---
  {
    id: "comedy-1",
    genre: "comedy",
    genreLabel: "Komedi & Günlük Hayat",
    genreEmoji: "☕",
    badgeColor: "bg-emerald-950/80 text-emerald-300 border-emerald-500/60",
    title: "İkinci Şans Kafe: Ters Giden Siparişler",
    tagline: "Bir fincan kahve, huysuz bir kedi ve komik sakarlıklar zinciri.",
    intro: "Pazartesi sabahı açılan mahalle kafesinde yeni nesil akıllı kahve makinesi kontrolden çıkar ve her yere köpük fışkırtmaya başlar. O sırada dükkana giren gurme bir yemek eleştirmenini sakinleştirme çabası kaosa döner.",
    tone: "Comedy",
    style: "Karikatür / Webcomic",
    cast: [
      {
        name: "Emir",
        description: "Sürekli sakarlık yapan, yeşil önlüklü, güler yüzlü ve panik içindeki genç barista.",
        style: "Karikatür / Webcomic"
      },
      {
        name: "Kedi Paşa",
        description: "Tezgâhta uyuklayan, kravat takmış şişman sarman kedi.",
        style: "Karikatür / Webcomic"
      }
    ],
    plotHooks: [
      "Köpük dağının içinden kahve eleştirmeninin şapkası çıkar.",
      "Tüm müşteriler birlikte köpük savaşına katılır."
    ]
  },

  // --- KORKU & GERİLİM ---
  {
    id: "horror-1",
    genre: "horror",
    genreLabel: "Korku & Doğaüstü",
    genreEmoji: "🕯️",
    badgeColor: "bg-purple-950/80 text-purple-300 border-purple-500/60",
    title: "Gece Nöbeti: Kırmızı Deniz Feneri",
    tagline: "Fırtınalı bir adada denizin dibinden gelen tuhaf fısıltılar.",
    intro: "Kayalık bir adadaki asırlık deniz fenerinde nöbet tutan iki bekçi, sisin içinden yaklaşan eski bir hayalet geminin silüetini fark eder. Işık her döndüğünde kıyıya yaklaşan şey bir gemi değil, sudan çıkan kadim bir gölgedir.",
    tone: "Horror",
    style: "Karanlık Fantastik",
    cast: [
      {
        name: "Recep Kaptan",
        description: "Kır sakallı, sarı yağmurluklu, elinde gaz lambası taşıyan sert mizaçlı yaşlı fener bekçisi.",
        style: "Karanlık Fantastik"
      },
      {
        name: "Yaman",
        description: "Adaya yeni atanan, tedirgin bakışlı ve el feneri titreyen genç stajyer bekçi.",
        style: "Karanlık Fantastik"
      }
    ],
    plotHooks: [
      "Fenerin dev ampulü fırtınada patlar ve zifiri karanlık başlar.",
      "Merdivenlerden tırnak sürtünme sesleri yükselir."
    ]
  }
];

// --- HIZLI ZAR ATMA (DICE GENERATOR) PARÇALARI ---
export interface StoryDiceComponents {
  hero: string;
  setting: string;
  conflict: string;
  twist: string;
  tone: string;
  suggestedStyle: string;
}

export const DICE_HEROES = [
  "Geçmişini hatırlamayan siber dedektif",
  "Tarihi eser kaçakçısı karizmatik hırsız",
  "Asırlık bir laneti çözmeye çalışan genç cadı",
  "Metropolün çatılarında adalet arayan kanunsuz",
  "Zaman makinesini yanlışlıkla çalıştıran çırak saatçi",
  "Eski bir samuray ruhuyla konuşabilen liseli genç",
  "Uzay istasyonundaki tek insan bahçıvan",
  "Yağmurlu bir gecede son müşterisini bekleyen sahaf"
];

export const DICE_SETTINGS = [
  "Neon tabelaların yansıdığı ıslak bir siberpunk arka sokak",
  "Boğaz'ın sisleri altındaki terk edilmiş bir köşk kütüphanesi",
  "Yerçekimi jeneratörleri arızalanmış uzay istasyonu koridoru",
  "Gök gürültülü bir fırtınada uçurum kenarındaki antik tapınak",
  "Gece yarısı İstanbul metrosunun mühürlü sığınağı",
  "Sıcak kahve ve yağmur kokulu loş bir sahaf dükkanı",
  "Büyülü fenerlerin aydınlattığı gizli bir yeraltı pazarı",
  "Şehrin 80. katındaki cam zeminli lüks çatı atölyesi"
];

export const DICE_CONFLICTS = [
  "Cebindeki kadim harita aniden ışık saçmaya ve ısınmaya başlar.",
  "Düşman sendika kapıları kilitleyip binayı kuşatmıştır.",
  "Şehrin tüm saatleri geriye doğru akmaya başlar.",
  "Uzun yıllardır saklanan aşk itirafı beklenmedik bir tehlike anında dökülür.",
  "Mekanik protez kol kontrolden çıkıp gizli bir sinyal almaya başlar.",
  "Tuvallere çizilen her şey birkaç dakika sonra gerçek hayatta belirir.",
  "Gizemli bir yabancı masaya şifreli bir mühürlü zarf bırakıp kaybolur.",
  "Şehrin koruyucu enerji kalkanı tek bir düğmeyle kapanmak üzeredir."
];

export const DICE_TWISTS = [
  "Aslında peşindeki avcı, gelecekteki kendi silüetidir.",
  "Düşman sandığı kişi, çocukluğunda hayatını kurtaran kayıp kardeşidir.",
  "Çalınan nesne bir silah değil, canlı ve minik bir uzaylı yavrusudur.",
  "Bütün bu olaylar aslında durdurmaya çalıştıkları bir simülasyon döngüsüdür.",
  "Güvenebileceği tek müttefikinin aslında karşı tarafın casusu olduğu ortaya çıkar."
];

export function rollStoryDice(): StoryDiceComponents {
  const hero = DICE_HEROES[Math.floor(Math.random() * DICE_HEROES.length)];
  const setting = DICE_SETTINGS[Math.floor(Math.random() * DICE_SETTINGS.length)];
  const conflict = DICE_CONFLICTS[Math.floor(Math.random() * DICE_CONFLICTS.length)];
  const twist = DICE_TWISTS[Math.floor(Math.random() * DICE_TWISTS.length)];
  
  const tones = ["Action", "Sci-Fi", "Mystery", "Romance", "Comedy", "Dark Fantasy"];
  const styles = ["Amerikan Çizgi Romanı", "Modern Comic", "Japon Mangası", "Graphic Novel", "Noir Çizgi Roman"];

  return {
    hero,
    setting,
    conflict,
    twist,
    tone: tones[Math.floor(Math.random() * tones.length)],
    suggestedStyle: styles[Math.floor(Math.random() * styles.length)]
  };
}
