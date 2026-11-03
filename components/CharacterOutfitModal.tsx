import React, { useState, useEffect } from "react";
import { 
  X, Sparkles, Check, Plus, Trash2, Shirt, Shield, Eye, 
  Wand2, Loader2, Save, RefreshCw, Palette, Tag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Character, CharacterOutfit, CharacterStyleSheet } from "../types";
import { DEFAULT_OUTFIT_PRESETS, getCharacterActiveOutfit } from "../lib/outfitPresets";
import { compileCharacterReferencePrompt, generateCharacterAvatar } from "../services/geminiService";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { generateId, cn } from "../lib/utils";
import { CharacterAvatarView } from "./CharacterAvatarView";

interface CharacterOutfitModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  artStyle: string;
  usePaidApi?: boolean;
  imageProvider?: "auto" | "pollinations_flux" | "gemini";
  onSaveOutfit: (updatedCharacter: Character, newOutfit: CharacterOutfit) => Promise<void> | void;
}

export const CharacterOutfitModal: React.FC<CharacterOutfitModalProps> = ({
  isOpen,
  onClose,
  character,
  artStyle,
  usePaidApi = false,
  imageProvider = "pollinations_flux",
  onSaveOutfit
}) => {
  const [outfitsList, setOutfitsList] = useState<CharacterOutfit[]>([]);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string>("");
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isRegeneratingAvatar, setIsRegeneratingAvatar] = useState(false);
  
  // Custom Outfit Form State
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customBadge, setCustomBadge] = useState("Özel");
  const [customIcon, setCustomIcon] = useState("👕");
  const [aiPromptIdea, setAiPromptIdea] = useState("");

  const EMOJI_OPTIONS = ["👕", "🛡️", "🕶️", "👔", "🩸", "⚡", "🧥", "🧙", "👑", "🚀", "🥋", "🥷", "🎩", "🦺"];

  // Initialize outfits list from character + default presets
  useEffect(() => {
    if (isOpen && character) {
      const charOutfits = character.outfits && character.outfits.length > 0
        ? [...character.outfits]
        : [...DEFAULT_OUTFIT_PRESETS];

      // Ensure active outfit is properly selected
      const activeOutfit = getCharacterActiveOutfit(character);
      const activeId = character.activeOutfitId || activeOutfit.id || charOutfits[0]?.id;

      // If active outfit is not yet in list (e.g. from custom styleSheet), add it
      if (!charOutfits.some(o => o.id === activeId || o.description === activeOutfit.description)) {
        charOutfits.unshift(activeOutfit);
      }

      setOutfitsList(charOutfits);
      setSelectedOutfitId(activeId);
      setIsCreatingCustom(false);
    }
  }, [isOpen, character]);

  if (!isOpen) return null;

  const currentActiveOutfit = outfitsList.find(o => o.id === selectedOutfitId) || outfitsList[0] || DEFAULT_OUTFIT_PRESETS[0];

  const handleSelectOutfit = (outfit: CharacterOutfit) => {
    setSelectedOutfitId(outfit.id);
  };

  const handleApplyAndSave = async (generateNewAvatar = false) => {
    const targetOutfit = currentActiveOutfit;
    if (!targetOutfit) return;

    // Update styleSheet with new outfit
    const prevSheet: Partial<CharacterStyleSheet> = character.styleSheet || {
      physicalTraits: character.description,
      accessories: "İkonik eşyalar ve nişanlar",
      colorPalette: targetOutfit.colorPalette || ["#1E293B", "#EAB308"],
      autoInject: true
    };

    const updatedSheet: CharacterStyleSheet = {
      physicalTraits: prevSheet.physicalTraits || character.description,
      outfit: targetOutfit.description,
      accessories: prevSheet.accessories || "İkonik aksesuarlar",
      colorPalette: targetOutfit.colorPalette || prevSheet.colorPalette || ["#1E293B", "#EAB308"],
      referencePrompt: compileCharacterReferencePrompt(character.name, {
        physicalTraits: prevSheet.physicalTraits || character.description,
        outfit: targetOutfit.description,
        accessories: prevSheet.accessories || "İkonik aksesuarlar",
        colorPalette: targetOutfit.colorPalette || prevSheet.colorPalette
      }, character.description),
      autoInject: prevSheet.autoInject !== false,
      lastUpdated: Date.now()
    };

    let avatarUrl = character.avatarUrl;

    if (generateNewAvatar) {
      setIsRegeneratingAvatar(true);
      try {
        const promptForAvatar = `${character.name} in ${artStyle} comic style. ${updatedSheet.physicalTraits}. Wearing outfit: ${targetOutfit.description}. ${updatedSheet.accessories}. Multi-angle comic turnaround sheet with front, 3/4, side and back views on clean high-contrast neutral background.`;
        avatarUrl = await generateCharacterAvatar(character.name, promptForAvatar, artStyle, usePaidApi, imageProvider);
      } catch (err) {
        console.error("Failed to regenerate avatar for new outfit:", err);
      } finally {
        setIsRegeneratingAvatar(false);
      }
    }

    const updatedCharacter: Character = {
      ...character,
      outfits: outfitsList,
      activeOutfitId: targetOutfit.id,
      styleSheet: updatedSheet,
      visualManifest: updatedSheet.referencePrompt,
      avatarUrl: avatarUrl || character.avatarUrl
    };

    await onSaveOutfit(updatedCharacter, targetOutfit);
    onClose();
  };

  const handleCreateCustomOutfit = () => {
    if (!customName.trim() || !customDesc.trim()) return;

    const newOutfit: CharacterOutfit = {
      id: `outfit_${generateId()}`,
      name: customName.trim(),
      description: customDesc.trim(),
      badge: customBadge.trim() || "Özel",
      icon: customIcon || "👕",
      colorPalette: ["#1E293B", "#EAB308"]
    };

    setOutfitsList(prev => [newOutfit, ...prev]);
    setSelectedOutfitId(newOutfit.id);
    setIsCreatingCustom(false);
    setCustomName("");
    setCustomDesc("");
    setAiPromptIdea("");
  };

  const handleAiGenerateOutfit = async () => {
    if (!aiPromptIdea.trim()) return;

    setIsAiGenerating(true);
    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });
      
      const prompt = `
        You are a lead costume designer for comic books and graphic novels.
        Character Name: "${character.name}"
        Art Style: "${artStyle}"
        Costume Concept / Theme: "${aiPromptIdea.trim()}"

        Generate a vivid, rich, 1-2 sentence detailed comic attire description in Turkish (and English keywords for AI rendering).
        Include: upper garment, jacket/armor/shirt, lower pants/skirt, shoes/boots, fabric textures, colors, and subtle insignia or trim.
        
        Output format:
        NAME: [Short Turkish Outfit Title, e.g. "Kızıl Korsan Kaptanı Giysisi"]
        BADGE: [1-2 words category, e.g. "Korsan", "Taktik", "Siber"]
        DESC: [Detailed attire description]
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a master comic book costume and apparel designer."
        }
      });

      const text = response.text || "";
      const nameMatch = text.match(/NAME:\s*(.+)/i);
      const badgeMatch = text.match(/BADGE:\s*(.+)/i);
      const descMatch = text.match(/DESC:\s*([\s\S]+)/i);

      if (nameMatch && nameMatch[1]) {
        setCustomName(nameMatch[1].trim());
      } else {
        setCustomName(`${aiPromptIdea.trim()} Kostümü`);
      }

      if (badgeMatch && badgeMatch[1]) {
        setCustomBadge(badgeMatch[1].trim());
      }

      if (descMatch && descMatch[1]) {
        setCustomDesc(descMatch[1].trim());
      } else {
        setCustomDesc(text.replace(/NAME:.*|BADGE:.*|DESC:.*/gi, "").trim() || aiPromptIdea);
      }
    } catch (err) {
      console.error("AI outfit generation error:", err);
      // Fallback
      setCustomName(`${aiPromptIdea.trim()} Kıyafeti`);
      setCustomDesc(`${aiPromptIdea.trim()} temalı, ${artStyle} tarzında detaylı çizgi roman kıyafeti.`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleDeleteOutfit = (outfitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = outfitsList.filter(o => o.id !== outfitId);
    setOutfitsList(filtered);
    if (selectedOutfitId === outfitId) {
      setSelectedOutfitId(filtered[0]?.id || "");
    }
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
                <Shirt size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-black text-white font-bold">
                    Gardırop & Kıyafet Değiştirici
                  </span>
                  <span className="text-[10px] font-mono text-black font-semibold truncate hidden sm:inline">
                    Karakter: {character.name}
                  </span>
                </div>
                <h3 className="font-display text-lg sm:text-2xl uppercase tracking-tight truncate -skew-x-3 mt-0.5">
                  {character.name} - Kıyafet Seçimi
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

          {/* Body Section: Split Layout (Left: Outfits List, Right: Active Outfit & Actions) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 overflow-y-auto">
            
            {/* Left Column: Outfits Grid / Selector (7 cols) */}
            <div className="lg:col-span-7 p-3 sm:p-4 border-b-2 lg:border-b-0 lg:border-r-2 border-black bg-slate-950/80 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-display text-xs sm:text-sm uppercase tracking-wider text-yellow-400">
                    Mevcut Kıyafetler ({outfitsList.length})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-comic">
                    (Birini seçin)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingCustom(!isCreatingCustom)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-display uppercase tracking-wider border-2 border-black transition-all shadow-comic flex items-center gap-1.5",
                    isCreatingCustom 
                      ? "bg-slate-800 text-white" 
                      : "bg-yellow-400 text-black hover:bg-yellow-300"
                  )}
                >
                  <Plus size={13} />
                  <span>{isCreatingCustom ? "Listeye Dön" : "Özel Kıyafet Ekle"}</span>
                </button>
              </div>

              {/* Custom Outfit Creation Form */}
              <AnimatePresence>
                {isCreatingCustom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 bg-slate-900 border-2 border-yellow-400 p-3 shadow-comic overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2.5">
                      <span className="text-xs font-display uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                        <Wand2 size={13} /> Yeni Kıyafet Tasarla
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        AI Destekli
                      </span>
                    </div>

                    {/* AI Prompt Generator Bar */}
                    <div className="mb-3">
                      <label className="block text-[11px] font-mono text-slate-300 mb-1">
                        AI ile Hızlı Kıyafet Fikri Üret:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Örn: Yağmurluklu dedektif montu, parlayan altın gladyatör zırhı..."
                          value={aiPromptIdea}
                          onChange={(e) => setAiPromptIdea(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-slate-950 border-2 border-black text-xs font-comic text-white placeholder-slate-500 focus:border-yellow-400 outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAiGenerateOutfit}
                          disabled={isAiGenerating || !aiPromptIdea.trim()}
                          className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-display uppercase text-[11px] border-2 border-black shadow-comic flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isAiGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          <span>Tasarla</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">
                          Kıyafet Adı:
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: Gece Kamuflajı"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border-2 border-black text-xs font-comic text-white focus:border-yellow-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">
                          Kategori / Etiket:
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: Taktik / Zırh"
                          value={customBadge}
                          onChange={(e) => setCustomBadge(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border-2 border-black text-xs font-comic text-white focus:border-yellow-400 outline-none"
                        />
                      </div>
                    </div>

                    {/* Emoji Icon Picker */}
                    <div className="mb-2.5">
                      <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">
                        Simge:
                      </label>
                      <div className="flex gap-1.5 flex-wrap">
                        {EMOJI_OPTIONS.map(em => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setCustomIcon(em)}
                            className={cn(
                              "w-7 h-7 flex items-center justify-center text-sm border transition-all",
                              customIcon === em ? "bg-yellow-400 border-black scale-110" : "bg-slate-800 border-slate-700 hover:bg-slate-700"
                            )}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-[10px] font-mono uppercase text-slate-300 mb-1">
                        Giyim Detayları (Üst, Alt, Ayakkabı, Renkler):
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Koyu kırmızı deri motorcu ceketi, siyah kargo pantolon, çelik burunlu botlar ve gümüş fermuar detayları..."
                        value={customDesc}
                        onChange={(e) => setCustomDesc(e.target.value)}
                        className="w-full p-2 bg-slate-950 border-2 border-black text-xs font-comic text-white focus:border-yellow-400 outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingCustom(false)}
                        className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-display uppercase border border-slate-700 hover:text-white"
                      >
                        İptal
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateCustomOutfit}
                        disabled={!customName.trim() || !customDesc.trim()}
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-display uppercase font-bold border-2 border-black shadow-comic disabled:opacity-50 flex items-center gap-1"
                      >
                        <Plus size={13} />
                        <span>Gardıroba Ekle</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Outfits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
                {outfitsList.map((outfit) => {
                  const isSelected = outfit.id === selectedOutfitId;
                  const isActiveOnChar = character.activeOutfitId === outfit.id || 
                    (!character.activeOutfitId && outfit.id === DEFAULT_OUTFIT_PRESETS[0].id);

                  return (
                    <div
                      key={outfit.id}
                      onClick={() => handleSelectOutfit(outfit)}
                      className={cn(
                        "p-2.5 border-2 text-left cursor-pointer transition-all relative flex flex-col justify-between group shadow-sm",
                        isSelected
                          ? "bg-yellow-400 text-black border-black shadow-comic font-semibold -translate-y-0.5"
                          : "bg-slate-900/90 text-white border-black/80 hover:border-yellow-400/80 hover:bg-slate-850"
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base">{outfit.icon || "👕"}</span>
                            <span className={cn(
                              "font-display text-xs uppercase truncate",
                              isSelected ? "text-black" : "text-yellow-400"
                            )}>
                              {outfit.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isActiveOnChar && (
                              <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase font-bold bg-emerald-500 text-black border border-black">
                                Giyili
                              </span>
                            )}
                            {outfit.badge && !isActiveOnChar && (
                              <span className={cn(
                                "px-1.5 py-0.5 text-[8px] font-mono uppercase",
                                isSelected ? "bg-black text-white" : "bg-slate-800 text-slate-300"
                              )}>
                                {outfit.badge}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className={cn(
                          "text-[10px] font-comic line-clamp-2 mt-0.5",
                          isSelected ? "text-slate-900" : "text-slate-400"
                        )}>
                          {outfit.description}
                        </p>
                      </div>

                      {/* Delete button for custom added items */}
                      {!DEFAULT_OUTFIT_PRESETS.some(p => p.id === outfit.id) && (
                        <div className="mt-2 pt-1 border-t border-black/20 flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteOutfit(outfit.id, e)}
                            className="text-[9px] font-mono text-red-500 hover:text-red-700 flex items-center gap-0.5"
                            title="Bu kıyafeti sil"
                          >
                            <Trash2 size={10} /> Sil
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Outfit Preview & Apply (5 cols) */}
            <div className="lg:col-span-5 p-3 sm:p-5 bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
                  <span className="text-xs font-mono uppercase text-slate-400">
                    Seçili Kıyafet İncelemesi
                  </span>
                  <span className="text-xs font-mono text-yellow-400 font-bold">
                    {currentActiveOutfit.icon} {currentActiveOutfit.name}
                  </span>
                </div>

                {/* Avatar Preview */}
                <div className="mb-3 bg-slate-950 p-2 border-2 border-black">
                  <div className="text-[10px] font-mono text-slate-400 uppercase mb-1 flex items-center justify-between">
                    <span>Karakter Portresi</span>
                    <span className="text-yellow-400">{character.name}</span>
                  </div>
                  <div className="w-full h-32 flex items-center justify-center overflow-hidden bg-black/40">
                    {character.avatarUrl ? (
                      <img
                        src={character.avatarUrl}
                        alt={character.name}
                        className="h-full w-auto object-contain"
                      />
                    ) : (
                      <div className="text-center p-3 text-slate-500 text-xs font-comic">
                        Avatar görseli bulunmuyor
                      </div>
                    )}
                  </div>
                </div>

                {/* Detail Box */}
                <div className="bg-slate-950 p-3 border-2 border-black space-y-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currentActiveOutfit.icon || "👕"}</span>
                    <div>
                      <h5 className="font-display text-sm text-yellow-400 uppercase">
                        {currentActiveOutfit.name}
                      </h5>
                      {currentActiveOutfit.badge && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 bg-slate-800 text-slate-300">
                          {currentActiveOutfit.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-comic text-slate-300 leading-relaxed italic border-t border-slate-800 pt-2">
                    "{currentActiveOutfit.description}"
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => handleApplyAndSave(false)}
                  disabled={isRegeneratingAvatar}
                  className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-display uppercase tracking-wider text-xs sm:text-sm border-2 border-black shadow-comic flex items-center justify-center gap-2 font-bold transition-all active:translate-x-0.5 active:translate-y-0.5"
                >
                  <Check size={16} />
                  <span>Bu Kıyafeti Giydir ve Kaydet</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyAndSave(true)}
                  disabled={isRegeneratingAvatar}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-yellow-400 font-display uppercase tracking-wider text-xs border-2 border-black shadow-comic flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  title="Bu kıyafeti giydirir ve karakter avatarını AI ile yeni kıyafetiyle yeniden çizer"
                >
                  {isRegeneratingAvatar ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  <span>Kıyafeti Giydir + Yeni Avatar Çiz</span>
                </button>
              </div>

            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
