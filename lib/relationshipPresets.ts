import { Character, CharacterRelationship, RelationshipType } from "../types";
import { generateId } from "./utils";

export interface RelationshipArchetype {
  type: RelationshipType;
  label: string;
  icon: string;
  badge: string;
  colorClass: string;
  defaultTension: number;
  description: string;
  defaultSubtext: string;
  bodyLanguageDirective: string;
  dialogueDirective: string;
}

export const RELATIONSHIP_ARCHETYPES: RelationshipArchetype[] = [
  {
    type: "passionate_lovers",
    label: "Tutkulu Aşıklar",
    icon: "💖",
    badge: "Yüksek Tutku & Çekim",
    colorClass: "text-rose-400 bg-rose-950/60 border-rose-500/70",
    defaultTension: 90,
    description: "Birbirine derin bir aşkla bağlı iki karakter. Aralarında karşı konulamaz bir tensel çekim, dokunma arzusu ve koruma içgüdüsü vardır.",
    defaultSubtext: "Nefes nefese yakınlaşma, tutkulu bakışlar, yumuşak ses tonu ve tensel elektriklenme.",
    bodyLanguageDirective: "Intense lingering eye contact, drawn close together, gentle touches on waist/arms/cheeks, soft flushed expressions, protective proximity",
    dialogueDirective: "Passionate, intimate, emotionally vulnerable, whispering closeness, genuine romantic warmth and playful banter"
  },
  {
    type: "secret_crush",
    label: "Gizli / Platonik Aşk",
    icon: "💌",
    badge: "Utangaç & Çekingen",
    colorClass: "text-pink-400 bg-pink-950/60 border-pink-500/70",
    defaultTension: 75,
    description: "Bir karakterin diğerine gizlice derin hayranlık ve aşk beslemesi. İtiraf edilemeyen duygular, kalp çarpıntısı ve yana kaçırılan bakışlar.",
    defaultSubtext: "Yanak kızarması, kekeleme veya göz göze gelince heyecanla başını çevirme.",
    bodyLanguageDirective: "Furtive stolen glances, rosy blushing cheeks, fidgeting hands, slightly awkward proximity, averted eyes when caught looking",
    dialogueDirective: "Earnest, slightly flustered, caring and eager to please, hidden emotional subtext beneath ordinary words"
  },
  {
    type: "enemies_to_lovers",
    label: "Düşmandan Aşka (Enemies to Lovers)",
    icon: "⚔️",
    badge: "Çatışmalı Tansiyon",
    colorClass: "text-amber-400 bg-amber-950/60 border-amber-500/70",
    defaultTension: 95,
    description: "Dışarıdan zıt kutuplar veya düşman gibi görünen ancak birbirine karşı koyamadıkları ateşli bir çekim ve tansiyon yaşayan ikili.",
    defaultSubtext: "Sert laf sokmaların ardında gizlenen yoğun elektriklenme ve fiziksel yakınlaşma.",
    bodyLanguageDirective: "Challenging close proximity, chin-up defiance, locked gazes, hands poised defensively yet drawn inwards, charged sexual and emotional tension",
    dialogueDirective: "Sharp razor-sharp witticisms, sarcastic teasing masks deep mutual obsession, provocative banter that crackles with heat"
  },
  {
    type: "mortal_enemies",
    label: "Ezeli Düşmanlar",
    icon: "⚡",
    badge: "Ölümcül Kin",
    colorClass: "text-red-400 bg-red-950/60 border-red-500/70",
    defaultTension: 85,
    description: "Geçmişte yaşanan bir ihanet veya zıt ideolojiler sebebiyle birbirini yok etmeye yeminli ölümcül hasımlar.",
    defaultSubtext: "Soğuk kanlı bakışlar, sımsıkı sıkılmış yumruklar ve her an patlamaya hazır bir tehdit.",
    bodyLanguageDirective: "Aggressive dominant stance, clenched fists, sharp narrowing eyes, calculated distance, predatory posturing",
    dialogueDirective: "Cold, cutting, menacing, cynical, zero trust, uncompromising confrontation"
  },
  {
    type: "rivals_with_respect",
    label: "Saygılı Rakipler",
    icon: "🥊",
    badge: "Kıran Kırana Rekabet",
    colorClass: "text-orange-400 bg-orange-950/60 border-orange-500/70",
    defaultTension: 70,
    description: "Birbirinin gücünü takdir eden ancak asla geri adım atmayan, birbirini zirveye taşıyan rekabetçi dostlar.",
    defaultSubtext: "Gülümseyerek meydan okuma, 'Seni yeneceğim' enerjisi ve gizli takdir.",
    bodyLanguageDirective: "Athletic confident stance, smirking challenging smiles, raised eyebrows, eager competitive energy",
    dialogueDirective: "Bold challenge, teasing rivalry, mutual professional respect wrapped in fierce boasting"
  },
  {
    type: "unbreakable_allies",
    label: "Sarsılmaz Dostlar / Yoldaşlar",
    icon: "🤝",
    badge: "Kardeşçe Sadakat",
    colorClass: "text-emerald-400 bg-emerald-950/60 border-emerald-500/70",
    defaultTension: 40,
    description: "Sırt sırta savaşıp ölümden dönmüş, birbirine gözü kapalı güvenen kadim dostlar.",
    defaultSubtext: "Sözsüz anlaşma, omuza dostça yumruk, koşulsuz arka çıkma.",
    bodyLanguageDirective: "Relaxed open posture, standing back-to-back, reassuring shoulder claps, synchronized confident movement",
    dialogueDirective: "Easygoing camaraderie, shared inside jokes, instant mutual understanding without needing lengthy explanations"
  },
  {
    type: "forbidden_attraction",
    label: "Yasak Çekim",
    icon: "🕯️",
    badge: "Tehlikeli & İmkansız",
    colorClass: "text-purple-400 bg-purple-950/60 border-purple-500/70",
    defaultTension: 92,
    description: "Kurallar, sırlar, aileler veya konumları gereği bir araya gelmesi yasak olan ancak birbirlerine karşı koyamayan iki kalp.",
    defaultSubtext: "Gizli buluşmalar, kaçamak dokunuşlar, pişmanlıkla karışık doyumsuz arzu.",
    bodyLanguageDirective: "Hesitant magnetic approaches, fingers hovering inches apart before pulling away, lingering longing glances in public, sudden intimate closeness in shadows",
    dialogueDirective: "Guarded words with double meanings, hushed warnings, conflicted confessions of irresistible longing"
  },
  {
    type: "mentor_student",
    label: "Usta & Çırak",
    icon: "📜",
    badge: "Bilgelik & Saygı",
    colorClass: "text-cyan-400 bg-cyan-950/60 border-cyan-500/70",
    defaultTension: 50,
    description: "Biri diğerine yol gösteren, diğeri ise saygıyla öğrenen rehberlik ilişkisi.",
    defaultSubtext: "Sert ama koruyucu öğütler, onay alma isteği.",
    bodyLanguageDirective: "Patient watchful posture from mentor, attentive deferential stance from student, hands gesturing to guide or instruct",
    dialogueDirective: "Wise cryptic guidance, challenging questions, eager explanations and respectful acknowledgments"
  },
  {
    type: "custom",
    label: "Özel Dinamik",
    icon: "✨",
    badge: "Özel Kurgu",
    colorClass: "text-yellow-400 bg-yellow-950/60 border-yellow-500/70",
    defaultTension: 60,
    description: "Kullanıcı tarafından özel olarak kurgulanan özgün karakter ilişkisi ve dinamikler.",
    defaultSubtext: "Karakterlerin özel geçmişine göre şekillenen iletişim.",
    bodyLanguageDirective: "Contextual expressive body language reflecting the custom relationship dynamic",
    dialogueDirective: "Tailored character voice expressing the unique personal history between the two"
  }
];

export function getRelationshipPreset(type: RelationshipType): RelationshipArchetype {
  const found = RELATIONSHIP_ARCHETYPES.find(a => a.type === type);
  return found || RELATIONSHIP_ARCHETYPES[0];
}

export function findRelationshipBetween(
  relationships: CharacterRelationship[] | undefined,
  charAIdOrName: string,
  charBIdOrName: string
): CharacterRelationship | undefined {
  if (!relationships || !charAIdOrName || !charBIdOrName) return undefined;
  const aNorm = charAIdOrName.toLowerCase();
  const bNorm = charBIdOrName.toLowerCase();

  return relationships.find(rel => {
    const sId = rel.sourceCharId.toLowerCase();
    const sName = rel.sourceCharName.toLowerCase();
    const tId = rel.targetCharId.toLowerCase();
    const tName = rel.targetCharName.toLowerCase();

    const forwardMatch = (sId === aNorm || sName === aNorm) && (tId === bNorm || tName === bNorm);
    const backwardMatch = (sId === bNorm || sName === bNorm) && (tId === aNorm || tName === aNorm);

    return forwardMatch || (rel.isReciprocal && backwardMatch);
  });
}

export function formatRelationshipForPrompt(rel: CharacterRelationship): string {
  const archetype = getRelationshipPreset(rel.type);
  const details: string[] = [
    `Archetype: ${archetype.label} (${rel.type})`,
    `Tension/Chemistry Level: ${rel.tensionLevel}/100`,
    `Body Language Directives: ${archetype.bodyLanguageDirective}`,
    `Dialogue Subtext Directives: ${rel.dialogueSubtext || archetype.dialogueDirective}`
  ];
  if (rel.description) {
    details.push(`Backstory/Dynamics: "${rel.description}"`);
  }

  return `- [RELATIONSHIP: ${rel.sourceCharName} <-> ${rel.targetCharName}]: ${details.join(" | ")}`;
}

export function generateRandomRelationship(charA: Character, charB: Character): CharacterRelationship {
  const archetypes = RELATIONSHIP_ARCHETYPES.filter(a => a.type !== "custom");
  const randomArch = archetypes[Math.floor(Math.random() * archetypes.length)];

  return {
    id: `rel-${generateId()}`,
    sourceCharId: charA.id,
    sourceCharName: charA.name,
    targetCharId: charB.id,
    targetCharName: charB.name,
    type: randomArch.type,
    typeLabel: randomArch.label,
    tensionLevel: randomArch.defaultTension,
    description: randomArch.description,
    dialogueSubtext: randomArch.defaultSubtext,
    isReciprocal: true
  };
}
