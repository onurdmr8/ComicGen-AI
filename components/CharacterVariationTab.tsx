import React, { useState, useEffect } from "react";
import { 
  Sparkles, ArrowRight, Check, Plus, Loader2, RefreshCw, 
  Layers, User, AlertCircle, Wand2, ShieldCheck, Eye, Shirt, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Character, CharacterOutfit, CharacterStyleSheet, ComicConfig } from "../types";
import { generateCharacterVariation, compileCharacterReferencePrompt } from "../services/geminiService";
import { saveCharacterToLibrary } from "../lib/storage";
import { generateId, cn } from "../lib/utils";
import { CharacterAvatarView, CharacterViewMode } from "./CharacterAvatarView";
import { OUTFIT_VARIATION_PRESETS, QUICK_ACCESSORY_CHIPS, OutfitVariationPreset } from "./CharacterVariationModal";

interface CharacterVariationTabProps {
  libraryCharacters: Character[];
  config: ComicConfig;
  setConfig: React.Dispatch<React.SetStateAction<ComicConfig>>;
  onRefreshLibrary: () => Promise<void>;
  onPreview: (url: string, name: string, mode?: CharacterViewMode) => void;
  onNavigateToBrowse: () => void;
}

export const CharacterVariationTab: React.FC<CharacterVariationTabProps> = ({
  libraryCharacters,
  config,
  setConfig,
  onRefreshLibrary,
  onPreview,
  onNavigateToBrowse
}) => {
  const [selectedBaseCharId, setSelectedBaseCharId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "alluring" | "accessories" | "thematic">("all");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("sexy_evening_dress");
  const [customPrompt, setCustomPrompt] = useState<string>(OUTFIT_VARIATION_PRESETS[0].defaultPrompt);
  const [variationStyle, setVariationStyle] = useState<string>("Standart Çizgi Roman");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isApplyingToCast, setIsApplyingToCast] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Result state
  const [generatedChar, setGeneratedChar] = useState<Character | null>(null);
  const [baseCharSnapshot, setBaseCharSnapshot] = useState<Character | null>(null);
  const [isAddedToCast, setIsAddedToCast] = useState<boolean>(false);

  // Default selection
  useEffect(() => {
    if (libraryCharacters.length > 0 && !selectedBaseCharId) {
      setSelectedBaseCharId(libraryCharacters[0].id);
    }
  }, [libraryCharacters, selectedBaseCharId]);

  const selectedBaseChar = libraryCharacters.find(c => c.id === selectedBaseCharId) || libraryCharacters[0];

  const filteredPresets = selectedCategory === "all"
    ? OUTFIT_VARIATION_PRESETS
    : OUTFIT_VARIATION_PRESETS.filter(p => p.category === selectedCategory);

  const handleSelectPreset = (preset: OutfitVariationPreset) => {
    setSelectedPresetId(preset.id);
    setCustomPrompt(preset.defaultPrompt);
  };

  const handleAppendModifier = (text: string) => {
    setCustomPrompt(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return text;
      if (trimmed.endsWith(".")) {
        return `${trimmed.slice(0, -1)}, ${text.toLowerCase()}.`;
      }
      return `${trimmed}, ${text.toLowerCase()}`;
    });
  };

  const handleGenerateVariation = async () => {
    if (!selectedBaseChar) {
      setErrorMsg("Lütfen önce varyasyonu oluşturulacak bir karakter seçin.");
      return;
    }
    if (!customPrompt.trim()) {
      setErrorMsg("Lütfen varyasyon için bir açıklama veya prompt girin.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedChar(null);
    setIsAddedToCast(false);
    setBaseCharSnapshot(selectedBaseChar);

    try {
      const presetObj = OUTFIT_VARIATION_PRESETS.find(p => p.id === selectedPresetId);
      const variationTypeName = presetObj?.label || "Kıyafet & Aksesuar Varyasyonu";

      const result = await generateCharacterVariation(
        selectedBaseChar,
        variationTypeName,
        customPrompt.trim(),
        variationStyle,
        Boolean(config.usePaidApi),
        config.imageProvider || "pollinations_flux"
      );

      const newCharacter: Character = {
        id: generateId(),
        name: result.newName,
        description: result.newDescription,
        visualManifest: result.newVisualManifest,
        avatarUrl: result.avatarUrl,
        style: variationStyle,
        tags: ["Varyasyon", presetObj?.badge || "Kıyafet", selectedBaseChar.name],
        createdAt: Date.now()
      };

      // Automatically save to character library
      await saveCharacterToLibrary(newCharacter);
      await onRefreshLibrary();

      setGeneratedChar(newCharacter);
      setSuccessToast(`"${newCharacter.name}" varyasyon kartı başarıyla üretildi!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error("Variation generation failed:", err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429")) {
        setErrorMsg("API kota sınırına ulaşıldı. Lütfen kısa bir süre bekleyip tekrar deneyin.");
      } else {
        setErrorMsg("Varyasyon oluşturulurken bir hata meydana geldi. Lütfen tekrar deneyin.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickApplyToActiveOutfit = async () => {
    if (!selectedBaseChar || !customPrompt.trim()) return;

    setIsApplyingToCast(true);
    try {
      const presetObj = OUTFIT_VARIATION_PRESETS.find(p => p.id === selectedPresetId);
      const outfitName = presetObj?.label || "Özel Kıyafet & Aksesuar";
      const outfitBadge = presetObj?.badge || "Varyasyon";
      const outfitIcon = presetObj?.icon || "✨";
      const palette = presetObj?.colorPalette || ["#1E293B", "#EAB308"];

      const newOutfit: CharacterOutfit = {
        id: `outfit_${generateId()}`,
        name: outfitName,
        description: customPrompt.trim(),
        badge: outfitBadge,
        icon: outfitIcon,
        colorPalette: palette
      };

      const existingOutfits = selectedBaseChar.outfits && selectedBaseChar.outfits.length > 0
        ? [...selectedBaseChar.outfits]
        : [];

      const updatedOutfits = [newOutfit, ...existingOutfits.filter(o => o.name !== outfitName)];

      const prevSheet: Partial<CharacterStyleSheet> = selectedBaseChar.styleSheet || {
        physicalTraits: selectedBaseChar.description,
        accessories: "İkonik aksesuarlar",
        colorPalette: palette,
        autoInject: true
      };

      const updatedSheet: CharacterStyleSheet = {
        physicalTraits: prevSheet.physicalTraits || selectedBaseChar.description,
        outfit: customPrompt.trim(),
        accessories: prevSheet.accessories || "İkonik aksesuarlar",
        colorPalette: palette,
        referencePrompt: compileCharacterReferencePrompt(selectedBaseChar.name, {
          physicalTraits: prevSheet.physicalTraits || selectedBaseChar.description,
          outfit: customPrompt.trim(),
          accessories: prevSheet.accessories || "İkonik aksesuarlar",
          colorPalette: palette
        }, selectedBaseChar.description),
        autoInject: true,
        lastUpdated: Date.now()
      };

      const updatedCharacter: Character = {
        ...selectedBaseChar,
        outfits: updatedOutfits,
        activeOutfitId: newOutfit.id,
        styleSheet: updatedSheet,
        visualManifest: updatedSheet.referencePrompt
      };

      await saveCharacterToLibrary(updatedCharacter);
      await onRefreshLibrary();

      setConfig(prev => ({
        ...prev,
        cast: prev.cast.map(c => 
          (c.id === updatedCharacter.id || c.name.toLowerCase() === updatedCharacter.name.toLowerCase())
            ? updatedCharacter
            : c
        )
      }));

      setSuccessToast(`"${selectedBaseChar.name}" için "${outfitName}" aktif kıyafet olarak atandı!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err) {
      console.error("Failed to apply outfit:", err);
      setErrorMsg("Kıyafet atanırken bir sorun oluştu.");
    } finally {
      setIsApplyingToCast(false);
    }
  };

  const handleAddToCast = (char: Character) => {
    if (config.cast.length >= 10) return;
    if (config.cast.some(c => c.id === char.id || c.name.toLowerCase() === char.name.toLowerCase())) {
      setIsAddedToCast(true);
      return;
    }
    setConfig(prev => ({
      ...prev,
      cast: [...prev.cast, { ...char, id: char.id || generateId() }]
    }));
    setIsAddedToCast(true);
    setSuccessToast(`"${char.name}" kadroya eklendi!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  if (libraryCharacters.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-slate-900 border-2 border-dashed border-slate-700 max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto bg-yellow-400/10 border-2 border-yellow-400 flex items-center justify-center text-yellow-400">
          <Sparkles size={30} />
        </div>
        <div>
          <h3 className="font-display text-lg uppercase text-yellow-400">Kütüphanede Karakter Bulunamadı</h3>
          <p className="text-xs font-comic text-slate-300 mt-1 max-w-md mx-auto">
            Varyasyon (yaşlı, çocuk, fütüristik, fantezi vb.) oluşturabilmek için öncelikle kütüphanenizde en az bir temel karakter bulunmalıdır.
          </p>
        </div>
        <button
          onClick={onNavigateToBrowse}
          className="px-4 py-2 bg-yellow-400 text-black font-display text-xs uppercase border-2 border-black shadow-comic hover:bg-yellow-300"
        >
          Karakter Kütüphanesine Git
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-4">
      {/* Banner / Headline */}
      <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border-2 border-yellow-400/40 p-3 sm:p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-yellow-400 text-black border-2 border-black shadow-comic">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-display text-sm sm:text-base uppercase text-yellow-400 tracking-tight">
              Yapay Zeka Karakter Varyasyonu Laboratuvarı
            </h3>
            <p className="text-xs font-comic text-slate-300">
              Mevcut bir karakteri seçerek onun kırmızı pelerin, dedektif şapkası, gecelik, iç çamaşırı, sexy elbise vb. varyasyon model kartını (Ön, Arka, Portre) üretin veya hemen aktif kıyafetine atayın.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase bg-black text-yellow-400 px-2.5 py-1 border border-yellow-400/40 font-bold">
          3'LÜ MODEL SAYFASI DESTEKLİ
        </span>
      </div>

      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-yellow-400 text-black border-2 border-black p-2.5 shadow-comic text-xs font-display uppercase tracking-wide flex items-center gap-2"
          >
            <Check size={16} className="text-black stroke-[3]" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Base Character Selection & Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border-2 border-black p-3.5 space-y-3 shadow-comic">
            <div className="flex items-center justify-between">
              <label className="text-xs font-display uppercase text-yellow-400 flex items-center gap-1.5">
                <User size={14} /> 1. Temel Karakteri Seçin
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {libraryCharacters.length} Karakter Mevcut
              </span>
            </div>

            {/* Quick Character Picker Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
              {libraryCharacters.map((char, charIdx) => {
                const isSelected = char.id === selectedBaseChar?.id;
                return (
                  <button
                    key={`var-char-${char.id || char.name || charIdx}-${charIdx}`}
                    onClick={() => {
                      setSelectedBaseCharId(char.id);
                      setGeneratedChar(null);
                    }}
                    className={cn(
                      "flex-shrink-0 w-24 p-1.5 text-left border-2 transition-all group flex flex-col items-center gap-1",
                      isSelected
                        ? "border-yellow-400 bg-yellow-400/15 shadow-comic scale-105"
                        : "border-black bg-slate-950 hover:border-slate-500 opacity-75 hover:opacity-100"
                    )}
                  >
                    <div className="w-full h-14 bg-black border border-black overflow-hidden relative">
                      {char.avatarUrl ? (
                        <img 
                          src={char.avatarUrl} 
                          alt={char.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <User size={16} />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-0.5 right-0.5 bg-yellow-400 text-black p-0.5 rounded-none">
                          <Check size={10} className="stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="font-display text-[10px] uppercase truncate w-full text-center text-slate-200 group-hover:text-yellow-400">
                      {char.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Base Character Detailed Card */}
            {selectedBaseChar && (
              <div className="border-2 border-black bg-black/50 p-3 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-yellow-300 font-bold uppercase">
                    Seçili Karakter Detayları
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {selectedBaseChar.style || "Comic"}
                  </span>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="w-28 flex-shrink-0">
                    <CharacterAvatarView
                      avatarUrl={selectedBaseChar.avatarUrl}
                      name={selectedBaseChar.name}
                      initialMode="all"
                      showToggleBar={true}
                      compactToggle={true}
                      aspectRatio="wide"
                      onPreview={(url, mode) => onPreview(url, selectedBaseChar.name, mode)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display text-sm text-yellow-400 uppercase tracking-tight truncate">
                      {selectedBaseChar.name}
                    </h4>
                    <p className="text-[11px] text-slate-300 font-comic line-clamp-3 mt-1 leading-relaxed">
                      {selectedBaseChar.description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Variation Settings & Prompt Entry (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border-2 border-black p-4 space-y-4 shadow-comic">
            {/* Step 2: Preset Themes with Categories */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-display uppercase text-yellow-400 flex items-center gap-1.5">
                  <Wand2 size={14} /> 2. Kıyafet veya Aksesuar Teması Seçin
                </label>
                <span className="text-[10px] font-mono text-slate-400 font-normal">
                  Örn: İpek Çarşaf, Buharlı Duş, Açık Sırt, Kırmızı Pelerin, Dedektif
                </span>
              </div>

              {/* Category Filter */}
              <div className="flex bg-slate-950 border-2 border-black p-1 gap-1">
                {[
                  { id: "all", label: "Tümü" },
                  { id: "alluring", label: "🔥 Çekici & Sansüre Yakın" },
                  { id: "accessories", label: "🦸 Pelerin & Aksesuarlar" },
                  { id: "thematic", label: "⚔️ Tematik & Zırh" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id as any)}
                    className={cn(
                      "flex-1 py-1 px-2 font-display text-[10px] uppercase transition-all",
                      selectedCategory === tab.id
                        ? "bg-yellow-400 text-black font-bold shadow-comic"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1 no-scrollbar">
                {filteredPresets.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={cn(
                        "p-2.5 text-left border-2 transition-all flex flex-col justify-between gap-1",
                        isSelected
                          ? "bg-yellow-400 text-black border-black shadow-comic font-bold translate-x-0.5 translate-y-0.5"
                          : "bg-slate-950 text-slate-300 border-black hover:border-yellow-400 hover:text-white"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-lg">{preset.icon}</span>
                        <span className={cn(
                          "text-[8px] font-mono uppercase px-1 py-0.5 border",
                          isSelected ? "bg-black text-yellow-300 border-black" : "bg-slate-900 text-slate-400 border-slate-700"
                        )}>
                          {preset.badge}
                        </span>
                      </div>
                      <span className="font-display text-[11px] uppercase tracking-tight mt-1 truncate">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Accessory & Outfit Chips */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-yellow-400 uppercase font-bold flex items-center gap-1">
                  <Zap size={11} /> Hızlı Aksesuar & Kıyafet Çipleri:
                </span>
                <span className="text-[9px] font-mono text-slate-400">Tek tıkla ekler</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {QUICK_ACCESSORY_CHIPS.map((chip, chipIdx) => (
                  <button
                    key={`tab-chip-${chipIdx}`}
                    type="button"
                    onClick={() => handleAppendModifier(chip.text)}
                    className="text-[10px] font-mono bg-slate-950 hover:bg-yellow-400 hover:text-black text-slate-300 px-2 py-0.5 border border-slate-700 transition-colors shadow-xs active:scale-95"
                  >
                    + {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Prompt Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-display uppercase text-yellow-400 flex items-center gap-1.5">
                  <Sparkles size={14} /> 3. Varyasyon Promptu & Özellikler
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  İstediğiniz gibi düzenleyebilirsiniz
                </span>
              </div>

              <textarea
                rows={3}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Örn: Kırmızı pelerinli, dedektif şapkalı, dantelli iç çamaşırlı veya derin yırtmaçlı sexy gece elbiseli..."
                className="w-full bg-slate-950 border-2 border-black p-2.5 text-xs font-comic text-white focus:border-yellow-400 outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Action Buttons: 2 Modes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleGenerateVariation}
                disabled={isGenerating || !selectedBaseChar || !customPrompt.trim()}
                className={cn(
                  "w-full py-2.5 px-3 font-display text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-black shadow-comic transition-all",
                  isGenerating
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                    : "bg-yellow-400 hover:bg-yellow-300 text-black active:translate-x-0.5 active:translate-y-0.5 font-bold"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-black" /> Varyasyon Çiziliyor...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> 3'lü Model Çiz
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleQuickApplyToActiveOutfit}
                disabled={isApplyingToCast || !selectedBaseChar || !customPrompt.trim()}
                className={cn(
                  "w-full py-2.5 px-3 font-display text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-black shadow-comic transition-all",
                  isApplyingToCast
                    ? "bg-slate-700 text-slate-400"
                    : "bg-purple-600 hover:bg-purple-500 text-white active:translate-x-0.5 active:translate-y-0.5 font-bold"
                )}
                title="Çizim beklemeden, karakterin panellerde bu kıyafetle çizilmesini sağlar"
              >
                {isApplyingToCast ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" /> Atanıyor...
                  </>
                ) : (
                  <>
                    <Shirt size={16} /> Aktif Kıyafete Ata
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 bg-red-950/80 border-2 border-red-500 text-red-200 text-xs font-comic flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generated Result Showcase & Comparison (Side by Side) */}
      <AnimatePresence>
        {generatedChar && baseCharSnapshot && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900 border-4 border-yellow-400 p-4 sm:p-5 shadow-comic-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b-2 border-black pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-400 text-black border border-black">
                  <Check size={18} className="stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-display text-base sm:text-lg uppercase text-yellow-400">
                    Yeni Varyasyon Başarıyla Oluşturuldu & Kütüphaneye Eklendi!
                  </h4>
                  <p className="text-xs font-comic text-slate-300">
                    Ön, Arka ve Portre görünümlerini inceleyebilir, hemen hikaye kadronuza ekleyebilirsiniz.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddToCast(generatedChar)}
                  disabled={isAddedToCast || config.cast.length >= 10}
                  className={cn(
                    "px-4 py-2 font-display text-xs uppercase border-2 border-black shadow-comic flex items-center gap-1.5 transition-all",
                    isAddedToCast
                      ? "bg-green-600 text-white cursor-default"
                      : "bg-yellow-400 text-black hover:bg-yellow-300"
                  )}
                >
                  {isAddedToCast ? (
                    <><Check size={14} /> Kadroya Eklendi</>
                  ) : (
                    <><Plus size={14} /> Kadroya Ekle</>
                  )}
                </button>

                <button
                  onClick={() => onPreview(generatedChar.avatarUrl || "", generatedChar.name, "all")}
                  className="px-3 py-2 bg-slate-800 text-white font-display text-xs uppercase border-2 border-black hover:bg-slate-700 flex items-center gap-1.5"
                >
                  <Eye size={14} /> Tam Ekran Önizle
                </button>
              </div>
            </div>

            {/* Side-by-Side Comparison Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Left: Original Character */}
              <div className="bg-black/60 border-2 border-slate-700 p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                    Orijinal Karakter
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Temel Model
                  </span>
                </div>
                <CharacterAvatarView
                  avatarUrl={baseCharSnapshot.avatarUrl}
                  name={baseCharSnapshot.name}
                  initialMode="all"
                  showToggleBar={true}
                  compactToggle={false}
                  aspectRatio="wide"
                  onPreview={(url, mode) => onPreview(url, baseCharSnapshot.name, mode)}
                />
                <div>
                  <h5 className="font-display text-xs uppercase text-slate-200 truncate">
                    {baseCharSnapshot.name}
                  </h5>
                  <p className="text-[11px] text-slate-400 font-comic line-clamp-2 mt-0.5">
                    {baseCharSnapshot.description}
                  </p>
                </div>
              </div>

              {/* Right: New Variation */}
              <div className="bg-yellow-400/10 border-2 border-yellow-400 p-3 space-y-2 relative">
                <div className="flex items-center justify-between border-b border-yellow-400/30 pb-1.5">
                  <span className="text-[10px] font-mono text-yellow-400 uppercase font-bold flex items-center gap-1">
                    <Sparkles size={12} /> Yeni Varyasyon
                  </span>
                  <span className="text-[10px] font-mono bg-yellow-400 text-black px-1.5 font-bold uppercase">
                    Model Kartı
                  </span>
                </div>
                <CharacterAvatarView
                  avatarUrl={generatedChar.avatarUrl}
                  name={generatedChar.name}
                  initialMode="all"
                  showToggleBar={true}
                  compactToggle={false}
                  aspectRatio="wide"
                  onPreview={(url, mode) => onPreview(url, generatedChar.name, mode)}
                />
                <div>
                  <h5 className="font-display text-xs uppercase text-yellow-400 truncate">
                    {generatedChar.name}
                  </h5>
                  <p className="text-[11px] text-slate-300 font-comic line-clamp-2 mt-0.5">
                    {generatedChar.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
