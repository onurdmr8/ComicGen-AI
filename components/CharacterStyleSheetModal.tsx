import React, { useState, useEffect } from "react";
import { 
  X, Sparkles, Copy, Check, Save, RotateCcw, ShieldCheck, 
  Palette, User, Shirt, Swords, BookOpen, Layers, Loader2, Plus, Trash2, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Character, CharacterStyleSheet } from "../types";
import { DEFAULT_OUTFIT_PRESETS } from "../lib/outfitPresets";
import { 
  generateCharacterStyleSheet, 
  compileCharacterReferencePrompt 
} from "../services/geminiService";
import { cn } from "../lib/utils";
import { CharacterAvatarView, CharacterViewMode } from "./CharacterAvatarView";

interface CharacterStyleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  artStyle: string;
  onSave: (updatedCharacter: Character) => Promise<void> | void;
}

export const CharacterStyleSheetModal: React.FC<CharacterStyleSheetModalProps> = ({
  isOpen,
  onClose,
  character,
  artStyle,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "physical" | "outfit" | "accessories" | "palette">("overview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [avatarViewMode, setAvatarViewMode] = useState<CharacterViewMode>("all");
  const [newColorInput, setNewColorInput] = useState("");

  // Local style sheet state
  const [physicalTraits, setPhysicalTraits] = useState(character.styleSheet?.physicalTraits || character.description || "");
  const [outfit, setOutfit] = useState(character.styleSheet?.outfit || "Özel çizgi roman kostümü");
  const [accessories, setAccessories] = useState(character.styleSheet?.accessories || "İkonik eşyalar ve nişanlar");
  const [colorPalette, setColorPalette] = useState<string[]>(
    character.styleSheet?.colorPalette || ["#1E293B", "#EAB308", "#0F172A"]
  );
  const [referencePrompt, setReferencePrompt] = useState(
    character.styleSheet?.referencePrompt || 
    compileCharacterReferencePrompt(character.name, {
      physicalTraits: character.styleSheet?.physicalTraits || character.description,
      outfit: character.styleSheet?.outfit,
      accessories: character.styleSheet?.accessories,
      colorPalette: character.styleSheet?.colorPalette
    }, character.visualManifest || character.description)
  );
  const [autoInject, setAutoInject] = useState(character.styleSheet?.autoInject !== false);

  // Sync state whenever open character changes
  useEffect(() => {
    if (isOpen && character) {
      const sheet = character.styleSheet;
      setPhysicalTraits(sheet?.physicalTraits || character.description || "");
      setOutfit(sheet?.outfit || "Özel çizgi roman kostümü");
      setAccessories(sheet?.accessories || "İkonik eşyalar ve nişanlar");
      setColorPalette(sheet?.colorPalette || ["#1E293B", "#EAB308", "#0F172A"]);
      setAutoInject(sheet?.autoInject !== false);

      if (sheet?.referencePrompt) {
        setReferencePrompt(sheet.referencePrompt);
      } else {
        const compiled = compileCharacterReferencePrompt(character.name, {
          physicalTraits: character.description,
          outfit: "Özel çizgi roman kostümü",
          accessories: "İkonik aksesuarlar",
          colorPalette: ["#1E293B", "#EAB308"]
        }, character.visualManifest || character.description);
        setReferencePrompt(compiled);
      }
    }
  }, [isOpen, character]);

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    if (!referencePrompt) return;
    navigator.clipboard.writeText(referencePrompt);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleRecompilePrompt = () => {
    const compiled = compileCharacterReferencePrompt(character.name, {
      physicalTraits,
      outfit,
      accessories,
      colorPalette
    }, character.description);
    setReferencePrompt(compiled);
  };

  const handleAiGenerate = async () => {
    setIsGenerating(true);
    try {
      const generatedSheet = await generateCharacterStyleSheet(
        character.name,
        character.description,
        artStyle
      );
      setPhysicalTraits(generatedSheet.physicalTraits);
      setOutfit(generatedSheet.outfit);
      setAccessories(generatedSheet.accessories);
      if (generatedSheet.colorPalette && generatedSheet.colorPalette.length > 0) {
        setColorPalette(generatedSheet.colorPalette);
      }
      setReferencePrompt(generatedSheet.referencePrompt);
      setAutoInject(true);
    } catch (e) {
      console.error("Style sheet generation error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddColor = () => {
    if (!newColorInput.trim()) return;
    if (!colorPalette.includes(newColorInput.trim())) {
      setColorPalette(prev => [...prev, newColorInput.trim()]);
    }
    setNewColorInput("");
  };

  const handleRemoveColor = (col: string) => {
    setColorPalette(prev => prev.filter(c => c !== col));
  };

  const handleSaveAndApply = () => {
    const updatedStyleSheet: CharacterStyleSheet = {
      physicalTraits: physicalTraits.trim(),
      outfit: outfit.trim(),
      accessories: accessories.trim(),
      colorPalette,
      referencePrompt: referencePrompt.trim() || compileCharacterReferencePrompt(character.name, { physicalTraits, outfit, accessories, colorPalette }),
      autoInject,
      lastUpdated: Date.now()
    };

    const updatedChar: Character = {
      ...character,
      styleSheet: updatedStyleSheet,
      visualManifest: updatedStyleSheet.referencePrompt
    };

    onSave(updatedChar);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="bg-slate-900 border-4 border-black shadow-comic-2xl w-full max-w-4xl text-white my-auto overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-yellow-400 border-b-4 border-black p-3 sm:p-4 flex items-center justify-between text-black relative">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-2 bg-black text-yellow-400 border-2 border-black -skew-x-6 flex-shrink-0">
                <BookOpen size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-black text-white font-bold">
                    Görsel Kılavuz (Style Sheet)
                  </span>
                  <span className="text-[10px] font-mono text-black font-semibold truncate hidden sm:inline">
                    Stil: {artStyle}
                  </span>
                </div>
                <h3 className="font-display text-lg sm:text-2xl uppercase tracking-tight truncate -skew-x-3 mt-0.5">
                  {character.name}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 bg-black text-white hover:bg-red-600 border-2 border-black transition-all shadow-comic active:scale-95 flex-shrink-0 ml-2"
              title="Kapat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Action & Auto-Inject Bar */}
          <div className="bg-slate-950 border-b-2 border-black px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAutoInject(!autoInject)}
                className={cn(
                  "flex items-center gap-2 px-2.5 py-1 text-xs font-mono font-bold uppercase transition-all border-2 border-black shadow-comic",
                  autoInject ? "bg-emerald-500 text-black" : "bg-slate-800 text-slate-400"
                )}
              >
                <ShieldCheck size={14} />
                <span>{autoInject ? "Panellere Otomatik Ekle: Açık" : "Otomatik Ekle: Pasif"}</span>
              </button>
              <span className="text-[11px] text-slate-400 font-comic hidden md:inline">
                {autoInject 
                  ? "Bu karakterin geçtiği tüm karelere görsel kılavuz referans promptu kilitlenir." 
                  : "Referans prompt panellere otomatik eklenmez."}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAiGenerate}
                disabled={isGenerating}
                className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-display uppercase tracking-wider text-xs border-2 border-black shadow-comic transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                <span>AI ile Kılavuzu Yenile</span>
              </button>
              <button
                onClick={handleCopyPrompt}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-400 font-mono text-xs border-2 border-black transition-all flex items-center gap-1"
                title="Referans Promptu Kopyala"
              >
                {hasCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{hasCopied ? "Kopyalandı" : "Kopyala"}</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-slate-900 border-b-2 border-black px-2 sm:px-4 flex gap-1 sm:gap-2 overflow-x-auto py-1.5 scrollbar-none">
            {[
              { id: "overview", label: "Referans Prompt", icon: Layers },
              { id: "physical", label: "Fiziksel Özellikler", icon: User },
              { id: "outfit", label: "Kıyafet & Kostüm", icon: Shirt },
              { id: "accessories", label: "Aksesuarlar & Detaylar", icon: Swords },
              { id: "palette", label: "Renk Paleti", icon: Palette },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-display uppercase tracking-wider transition-all border-2 whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-yellow-400 text-black border-black shadow-comic font-bold"
                      : "bg-slate-950 text-slate-400 border-black/40 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Modal Body */}
          <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-4">
            {/* Overview / Reference Prompt Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left: Avatar turnaround sheet */}
                <div className="lg:col-span-4 bg-slate-950 p-3 border-2 border-black space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-yellow-300 font-bold uppercase">
                    <span>Model Sayfası</span>
                    <span className="text-[10px] text-slate-400">3-Açılı Görünüm</span>
                  </div>

                  <div className="w-full">
                    <CharacterAvatarView
                      avatarUrl={character.avatarUrl}
                      name={character.name}
                      initialMode={avatarViewMode}
                      showToggleBar={true}
                      compactToggle={false}
                      aspectRatio="square"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-comic italic text-center pt-1">
                    Ön, arka ve portre açıları panel çizimlerinde doğrudan model benzerliği çıpası olarak kullanılır.
                  </p>
                </div>

                {/* Right: Compiled Reference Prompt */}
                <div className="lg:col-span-8 bg-slate-950 p-3.5 border-2 border-black flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-display uppercase text-yellow-400">
                        <Layers size={14} />
                        <span>Kilitlenmiş Referans Promptu (Master Continuity Token)</span>
                      </div>
                      <button
                        onClick={handleRecompilePrompt}
                        className="text-[10px] font-mono text-slate-400 hover:text-yellow-300 flex items-center gap-1 uppercase"
                        title="Fiziksel, kıyafet ve aksesuar sekmelerindeki verilerle yeniden derle"
                      >
                        <RotateCcw size={11} />
                        <span>Sekmelerden Derle</span>
                      </button>
                    </div>

                    <textarea
                      value={referencePrompt}
                      onChange={(e) => setReferencePrompt(e.target.value)}
                      className="w-full h-36 bg-slate-900 border-2 border-black p-2.5 text-xs font-mono text-slate-200 focus:border-yellow-400 outline-none resize-none leading-relaxed"
                      placeholder="[CHARACTER STYLE SHEET - NAME]: Hair, Face, Outfit, Gear..."
                    />
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                      <span>Bu metin, sahne kurgusu üretilirken her ilgili panelin görsel istemine eklenir.</span>
                      <span>{referencePrompt.length} karakter</span>
                    </div>
                  </div>

                  {/* Summary pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] font-comic">
                    <div className="bg-slate-900 p-2 border border-slate-800">
                      <span className="text-yellow-400 font-bold block mb-0.5">👤 Saç & Yüz:</span>
                      <span className="text-slate-300 line-clamp-2">{physicalTraits || "Belirtilmedi"}</span>
                    </div>
                    <div className="bg-slate-900 p-2 border border-slate-800">
                      <span className="text-yellow-400 font-bold block mb-0.5">🥋 İmza Kıyafet:</span>
                      <span className="text-slate-300 line-clamp-2">{outfit || "Belirtilmedi"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Physical Traits Tab */}
            {activeTab === "physical" && (
              <div className="space-y-3 bg-slate-950 p-4 border-2 border-black">
                <div className="flex items-center gap-2 text-yellow-400 text-xs font-display uppercase">
                  <User size={15} />
                  <span>Karakterin Fiziksel ve Anatomik Özellikleri</span>
                </div>
                <p className="text-xs text-slate-400 font-comic">
                  Saç rengi, kesimi, ön/arka silüeti, göz rengi ve şekli, ten rengi, boy ve vücut yapısını detaylandırın.
                </p>
                <textarea
                  value={physicalTraits}
                  onChange={(e) => {
                    setPhysicalTraits(e.target.value);
                  }}
                  className="w-full h-36 bg-slate-900 border-2 border-black p-3 text-xs font-comic text-white focus:border-yellow-400 outline-none resize-none"
                  placeholder="Örn: Atletik ve kaslı yapı, siyah dalgalı kısa saçlar, sol yanakta hafif çizik, koyu kahverengi delici gözler, belirgin çene hattı..."
                />
              </div>
            )}

            {/* Outfit & Costume Tab */}
            {activeTab === "outfit" && (
              <div className="space-y-3 bg-slate-950 p-4 border-2 border-black">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-yellow-400 text-xs font-display uppercase">
                    <Shirt size={15} />
                    <span>İmza Kostüm ve Kıyafet Detayları</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Hızlı Seçenekler:
                  </span>
                </div>
                
                {/* Quick Outfit Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {DEFAULT_OUTFIT_PRESETS.slice(0, 6).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setOutfit(preset.description)}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-yellow-400 hover:text-black text-slate-300 text-[10px] font-mono border border-slate-700 transition-all flex items-center gap-1"
                      title={preset.description}
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-slate-400 font-comic">
                  Üst giyim (ceket, gömlek, zırh, yaka, kumaş türü), alt giyim (pantolon, etek, kemer), ayakkabı ve renkleri tanımlayın.
                </p>
                <textarea
                  value={outfit}
                  onChange={(e) => {
                    setOutfit(e.target.value);
                  }}
                  className="w-full h-36 bg-slate-900 border-2 border-black p-3 text-xs font-comic text-white focus:border-yellow-400 outline-none resize-none"
                  placeholder="Örn: Gece mavisi taktik bomber deri ceket, gümüş fermuarlar, antrasit kargo pantolon, siyah çelik burunlu botlar..."
                />
              </div>
            )}

            {/* Accessories & Marks Tab */}
            {activeTab === "accessories" && (
              <div className="space-y-3 bg-slate-950 p-4 border-2 border-black">
                <div className="flex items-center gap-2 text-yellow-400 text-xs font-display uppercase">
                  <Swords size={15} />
                  <span>Özel Aksesuarlar, Nişanlar ve Eşyalar</span>
                </div>
                <p className="text-xs text-slate-400 font-comic">
                  Yara izleri, dövmeler, pelerin, kolyeler, vizör, özel amblemler veya imza silah/araçlar.
                </p>
                <textarea
                  value={accessories}
                  onChange={(e) => {
                    setAccessories(e.target.value);
                  }}
                  className="w-full h-36 bg-slate-900 border-2 border-black p-3 text-xs font-comic text-white focus:border-yellow-400 outline-none resize-none"
                  placeholder="Örn: Gümüş künye kolye, parmaksız deri eldivenler, sırtında ikili katanalar..."
                />
              </div>
            )}

            {/* Color Palette Tab */}
            {activeTab === "palette" && (
              <div className="space-y-4 bg-slate-950 p-4 border-2 border-black">
                <div className="flex items-center gap-2 text-yellow-400 text-xs font-display uppercase">
                  <Palette size={15} />
                  <span>Karakter İmza Renk Paleti</span>
                </div>
                <p className="text-xs text-slate-400 font-comic">
                  Panellerde karakterin kostüm ve ışıklandırma uyumunu sabitleyen ana renk tonları.
                </p>

                <div className="flex flex-wrap gap-2.5">
                  {colorPalette.map((color, idx) => {
                    // Extract hex if formatted like "#1E293B (Navy)"
                    const hexMatch = color.match(/#[0-9A-Fa-f]{6}/);
                    const hexColor = hexMatch ? hexMatch[0] : "#334155";

                    return (
                      <div
                        key={`char-palette-${color}-${idx}`}
                        className="flex items-center gap-2 bg-slate-900 border-2 border-black p-2 shadow-comic"
                      >
                        <div 
                          className="w-5 h-5 rounded border border-white/20 shadow-inner flex-shrink-0"
                          style={{ backgroundColor: hexColor }}
                        />
                        <span className="text-xs font-mono font-bold text-slate-200">{color}</span>
                        <button
                          onClick={() => handleRemoveColor(color)}
                          className="text-slate-500 hover:text-red-400 p-0.5 ml-1 transition-colors"
                          title="Rengi Sil"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800 max-w-md">
                  <input
                    type="text"
                    value={newColorInput}
                    onChange={(e) => setNewColorInput(e.target.value)}
                    placeholder="Örn: #DC2626 (Kızıl Kırmızı)"
                    className="flex-1 bg-slate-900 border-2 border-black px-2.5 py-1.5 text-xs font-mono text-white focus:border-yellow-400 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddColor();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddColor}
                    className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-display uppercase text-xs border-2 border-black shadow-comic flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>Ekle</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-950 border-t-4 border-black p-3 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Info size={14} className="text-yellow-400 hidden sm:inline" />
              <span className="hidden sm:inline">Kaydedildiğinde tüm panellerdeki karakter referansları güncellenir.</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-display uppercase tracking-wider text-xs border-2 border-black transition-all"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSaveAndApply}
                className="px-4 sm:px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-display uppercase tracking-wider text-xs border-2 border-black shadow-comic transition-all flex items-center gap-1.5 active:scale-95 font-bold"
              >
                <Save size={14} />
                <span>Kaydet & Panellere Uygula</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
