import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Sparkles, Dices, BookOpen, Check, Play, Shuffle, 
  Flame, Heart, Compass, Zap, Swords, Coffee, Skull, ArrowRight, RefreshCw
} from "lucide-react";
import { STORY_TEMPLATES, rollStoryDice, StoryTemplateItem, StoryDiceComponents } from "../lib/storyTemplates";
import { ComicConfig, Character } from "../types";
import { generateId } from "../lib/utils";
import { cn } from "../lib/utils";

interface StoryTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (applied: {
    topic: string;
    intro: string;
    tone: string;
    style: string;
    cast: Character[];
  }) => void;
}

export const StoryTemplatesModal: React.FC<StoryTemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate
}) => {
  const [activeTab, setActiveTab] = useState<"templates" | "dice">("templates");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<StoryTemplateItem | null>(STORY_TEMPLATES[0]);
  
  // Dice state
  const [diceState, setDiceState] = useState<StoryDiceComponents>(() => rollStoryDice());
  const [isRolling, setIsRolling] = useState(false);
  const [rollCount, setRollCount] = useState(0);

  if (!isOpen) return null;

  const genres = [
    { id: "all", label: "Tümü", icon: Sparkles },
    { id: "scifi", label: "Bilim Kurgu", icon: Zap },
    { id: "romance", label: "Romantik", icon: Heart },
    { id: "mystery", label: "Gizem / Noir", icon: Compass },
    { id: "superhero", label: "Süper Kahraman", icon: Flame },
    { id: "manga", label: "Manga / Shonen", icon: Swords },
    { id: "comedy", label: "Komedi", icon: Coffee },
    { id: "horror", label: "Korku", icon: Skull },
  ];

  const filteredTemplates = selectedGenre === "all"
    ? STORY_TEMPLATES
    : STORY_TEMPLATES.filter(t => t.genre === selectedGenre);

  const handleRollDice = () => {
    setIsRolling(true);
    let counter = 0;
    const interval = setInterval(() => {
      setDiceState(rollStoryDice());
      counter++;
      if (counter > 5) {
        clearInterval(interval);
        setIsRolling(false);
        setRollCount(prev => prev + 1);
      }
    }, 80);
  };

  const handleApplyCurrentTemplate = (tmpl: StoryTemplateItem) => {
    const castWithIds: Character[] = tmpl.cast.map(c => ({
      id: `char_${generateId()}`,
      name: c.name,
      description: c.description,
      style: c.style,
      visualManifest: c.visualManifest,
      avatarUrl: c.avatarUrl
    }));

    onApplyTemplate({
      topic: tmpl.title,
      intro: tmpl.intro,
      tone: tmpl.tone,
      style: tmpl.style,
      cast: castWithIds
    });
    onClose();
  };

  const handleApplyDiceStory = () => {
    const generatedTitle = `${diceState.hero.split(" ")[0]} & ${diceState.setting.split(" ")[0]} Efsanesi`;
    const generatedIntro = `${diceState.setting} üzerinde, ${diceState.hero.toLowerCase()} için dönüm noktası... ${diceState.conflict} Fakat kimse farkında değildir: ${diceState.twist}`;
    
    // Create hero character
    const heroName = diceState.hero.split(" ").slice(-1)[0] || "Kahraman";
    const heroChar: Character = {
      id: `char_${generateId()}`,
      name: heroName.charAt(0).toUpperCase() + heroName.slice(1),
      description: `${diceState.hero}. Kararlı, dikkat çekici yüz hatlarına sahip ve ortama uygun giyimli.`,
      style: diceState.suggestedStyle
    };

    onApplyTemplate({
      topic: generatedTitle,
      intro: generatedIntro,
      tone: diceState.tone,
      style: diceState.suggestedStyle,
      cast: [heroChar]
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-5xl h-[90vh] max-h-[820px] bg-slate-900 border-4 border-black shadow-comic flex flex-col overflow-hidden text-white"
      >
        {/* Header */}
        <div className="bg-yellow-400 border-b-4 border-black p-3 sm:p-4 flex items-center justify-between text-black shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black text-yellow-400 border-2 border-black shadow-sm">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-display uppercase tracking-wider text-black flex items-center gap-2">
                Şablon Hikaye Kütüphanesi & Fikir Zarı
              </h2>
              <p className="text-xs font-mono text-black/80 font-bold hidden sm:block">
                Türlere göre hazırlanmış zengin kurgulardan birini seçin ya da zarları atıp benzersiz bir hikaye yaratın!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 bg-black text-white hover:bg-red-600 border-2 border-black transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="bg-slate-950 border-b-2 border-black p-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("templates")}
              className={cn(
                "px-3.5 py-1.5 font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 border-2 border-black transition-all cursor-pointer",
                activeTab === "templates"
                  ? "bg-yellow-400 text-black shadow-comic font-bold"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              )}
            >
              <BookOpen size={16} />
              <span>Hazır Şablonlar ({STORY_TEMPLATES.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("dice")}
              className={cn(
                "px-3.5 py-1.5 font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 border-2 border-black transition-all cursor-pointer",
                activeTab === "dice"
                  ? "bg-indigo-500 text-white shadow-comic font-bold"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              )}
            >
              <Dices size={16} />
              <span>Bana Bir Fikir Ver 🎲 (Zar At)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>✨ Tek tıkla stüdyoya aktarın</span>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === "templates" ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left sidebar: Genre filter & Template list */}
            <div className="w-full md:w-5/12 border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col bg-slate-900/90 overflow-hidden">
              {/* Genre Pills */}
              <div className="p-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {genres.map(g => {
                  const Icon = g.icon;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGenre(g.id)}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-mono border whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer",
                        selectedGenre === g.id
                          ? "bg-yellow-400 text-black font-bold border-black shadow-xs"
                          : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700"
                      )}
                    >
                      <Icon size={12} />
                      <span>{g.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Templates List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {filteredTemplates.map(tmpl => {
                  const isSelected = selectedTemplate?.id === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={cn(
                        "p-3 border-2 transition-all cursor-pointer text-left relative",
                        isSelected
                          ? "bg-slate-800 border-yellow-400 shadow-comic translate-x-1"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-600 hover:bg-slate-800/50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={cn("text-[10px] font-mono px-2 py-0.5 border font-bold flex items-center gap-1", tmpl.badgeColor)}>
                          <span>{tmpl.genreEmoji}</span>
                          <span>{tmpl.genreLabel}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {tmpl.cast.length} Karakter
                        </span>
                      </div>

                      <h4 className="text-sm font-display uppercase tracking-wide text-white group-hover:text-yellow-400">
                        {tmpl.title}
                      </h4>
                      <p className="text-xs font-comic text-slate-300 line-clamp-2 mt-1 leading-snug">
                        {tmpl.tagline}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Detailed Template Inspector */}
            <div className="w-full md:w-7/12 flex-1 flex flex-col bg-slate-950 overflow-y-auto p-4 sm:p-6">
              {selectedTemplate ? (
                <div className="space-y-5">
                  <div className="border-b-2 border-slate-800 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn("text-xs font-mono px-2.5 py-0.5 border font-bold flex items-center gap-1.5", selectedTemplate.badgeColor)}>
                        <span>{selectedTemplate.genreEmoji}</span>
                        <span>{selectedTemplate.genreLabel}</span>
                      </span>
                      <span className="text-xs font-mono text-yellow-400 bg-yellow-400/10 px-2 py-0.5 border border-yellow-400/30">
                        Stil: {selectedTemplate.style}
                      </span>
                      <span className="text-xs font-mono text-purple-400 bg-purple-400/10 px-2 py-0.5 border border-purple-400/30">
                        Ton: {selectedTemplate.tone}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-display uppercase text-yellow-400">
                      {selectedTemplate.title}
                    </h3>
                    <p className="text-sm font-comic text-slate-300 italic mt-1">
                      "{selectedTemplate.tagline}"
                    </p>
                  </div>

                  {/* Intro Section */}
                  <div className="bg-slate-900 border-2 border-black p-3.5 space-y-1.5 shadow-sm">
                    <span className="text-[10px] font-display uppercase text-yellow-400 tracking-wider flex items-center gap-1">
                      <BookOpen size={12} />
                      1. Sayfa Giriş Kurgusu
                    </span>
                    <p className="text-xs sm:text-sm font-comic text-slate-200 leading-relaxed">
                      {selectedTemplate.intro}
                    </p>
                  </div>

                  {/* Cast preview */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-display uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} className="text-yellow-400" />
                      Hazır Karakterler ({selectedTemplate.cast.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedTemplate.cast.map((c, i) => (
                        <div key={i} className="p-2.5 bg-slate-900 border border-slate-700 space-y-1">
                          <span className="text-xs font-display uppercase text-yellow-300 block">
                            👤 {c.name}
                          </span>
                          <p className="text-[11px] font-comic text-slate-300 leading-tight">
                            {c.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plot Hooks */}
                  {selectedTemplate.plotHooks && selectedTemplate.plotHooks.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-display uppercase text-slate-400 tracking-wider">
                        ⚡ Olası Kurgu Dallanmaları:
                      </span>
                      <ul className="text-xs font-comic text-slate-300 space-y-1 pl-1">
                        {selectedTemplate.plotHooks.map((hook, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-yellow-400">▪</span>
                            <span>{hook}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Apply Button */}
                  <div className="pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleApplyCurrentTemplate(selectedTemplate)}
                      className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-display uppercase text-sm sm:text-base font-bold tracking-wider border-3 border-black shadow-comic hover:translate-x-0.5 hover:translate-y-0.5 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check size={18} />
                      <span>Bu Şablonu Hikayeme Aktar & Başla</span>
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 font-comic text-sm">
                  İncelemek için sol taraftan bir şablon seçin.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Dice tab */
          <div className="flex-1 p-4 sm:p-8 flex flex-col items-center justify-between bg-gradient-to-b from-slate-900 via-slate-950 to-black overflow-y-auto">
            <div className="max-w-2xl w-full space-y-6 my-auto text-center">
              <div className="space-y-2">
                <span className="text-xs font-mono px-3 py-1 bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 rounded-full inline-flex items-center gap-1.5">
                  <Dices size={14} className={cn(isRolling && "animate-spin")} />
                  <span>Rastgele Hikaye Jeneratörü</span>
                </span>
                <h3 className="text-2xl sm:text-3xl font-display uppercase tracking-wide text-yellow-400">
                  Zarları At, Hikayeni Keşfet!
                </h3>
                <p className="text-xs sm:text-sm font-comic text-slate-300 max-w-lg mx-auto">
                  Aşağıdaki 4 temel bileşeni zarlarla rastgele birleştirip benzersiz bir çizgi roman kıvılcımı yakalayın.
                </p>
              </div>

              {/* 4 Dice Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {/* Hero card */}
                <div className="p-3.5 bg-slate-900/90 border-2 border-indigo-500/70 shadow-comic-sm">
                  <span className="text-[10px] font-display uppercase text-indigo-400 tracking-wider flex items-center gap-1 mb-1">
                    👤 KAHRAMAN
                  </span>
                  <p className="text-sm font-comic font-bold text-white">
                    {diceState.hero}
                  </p>
                </div>

                {/* Setting card */}
                <div className="p-3.5 bg-slate-900/90 border-2 border-emerald-500/70 shadow-comic-sm">
                  <span className="text-[10px] font-display uppercase text-emerald-400 tracking-wider flex items-center gap-1 mb-1">
                    🏛️ MEKAN & ATMOSFER
                  </span>
                  <p className="text-sm font-comic font-bold text-white">
                    {diceState.setting}
                  </p>
                </div>

                {/* Conflict card */}
                <div className="p-3.5 bg-slate-900/90 border-2 border-amber-500/70 shadow-comic-sm">
                  <span className="text-[10px] font-display uppercase text-amber-400 tracking-wider flex items-center gap-1 mb-1">
                    ⚡ KRİTİK OLAY / ÇATIŞMA
                  </span>
                  <p className="text-sm font-comic font-bold text-white">
                    {diceState.conflict}
                  </p>
                </div>

                {/* Twist card */}
                <div className="p-3.5 bg-slate-900/90 border-2 border-rose-500/70 shadow-comic-sm">
                  <span className="text-[10px] font-display uppercase text-rose-400 tracking-wider flex items-center gap-1 mb-1">
                    🎭 SÜRPRİZ DÖNÜM NOKTASI
                  </span>
                  <p className="text-sm font-comic font-bold text-white">
                    {diceState.twist}
                  </p>
                </div>
              </div>

              {/* Suggested style and tone badge */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300">
                  🎨 Önerilen Stil: <strong className="text-yellow-400">{diceState.suggestedStyle}</strong>
                </span>
                <span className="text-xs font-mono px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300">
                  🎭 Önerilen Ton: <strong className="text-cyan-400">{diceState.tone}</strong>
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRollDice}
                  disabled={isRolling}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-display uppercase text-sm font-bold border-2 border-black shadow-comic flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw size={18} className={cn(isRolling && "animate-spin")} />
                  <span>Tekrar Zar At 🎲</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyDiceStory}
                  className="w-full sm:w-auto px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-display uppercase text-sm font-bold border-2 border-black shadow-comic flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Check size={18} />
                  <span>Bu Kurguyla Başla!</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
