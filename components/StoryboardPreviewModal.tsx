import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ComicConfig,
  ComicPanelData,
  ComicScriptResult,
  Character
} from "../types";
import {
  X,
  Sparkles,
  RefreshCw,
  Check,
  MapPin,
  Users,
  Camera,
  MessageSquare,
  Wand2,
  Loader2,
  Palette,
  Film,
  Shirt
} from "lucide-react";
import { cn } from "../lib/utils";
import { CAMERA_ANGLE_PRESETS } from "../lib/cameraAnglePresets";
import { revisePanelPrompt } from "../services/geminiService";

export interface StoryboardPreviewModalProps {
  isOpen: boolean;
  pageNumber: number;
  scriptData: ComicScriptResult | null;
  config: ComicConfig;
  isRewritingScript?: boolean;
  onCancel: () => void;
  onRegenerateScript: () => Promise<void>;
  onApproveAndDraw: (editedScript: ComicScriptResult) => void;
}

/**
 * Resolves the active outfit label for display in storyboard character chips.
 */
function getActiveOutfitLabel(char: Character): string {
  if (char.outfits && char.outfits.length > 0) {
    const active =
      char.outfits.find((o) => o.id === char.activeOutfitId) ||
      char.outfits.find((o) => o.isDefault) ||
      char.outfits[0];
    if (active?.name) return active.name;
  }
  return "Standart Kıyafet";
}

export const StoryboardPreviewModal: React.FC<StoryboardPreviewModalProps> = ({
  isOpen,
  pageNumber,
  scriptData,
  config,
  isRewritingScript = false,
  onCancel,
  onRegenerateScript,
  onApproveAndDraw
}) => {
  const [panels, setPanels] = useState<ComicPanelData[]>([]);
  const [tweakInputs, setTweakInputs] = useState<Record<number, string>>({});
  const [tweakingIdx, setTweakingIdx] = useState<number | null>(null);
  const [tweakNotices, setTweakNotices] = useState<Record<number, string>>({});

  useEffect(() => {
    if (scriptData?.panels) {
      setPanels(scriptData.panels.map((p) => ({ ...p })));
      setTweakInputs({});
      setTweakNotices({});
    }
  }, [scriptData]);

  if (!isOpen || !scriptData) return null;

  const activeLocation = config.locations?.[0] || null;
  const cast = config.cast || [];

  const updatePanelAt = (idx: number, patch: Partial<ComicPanelData>) => {
    setPanels((prev) =>
      prev.map((panel, i) => (i === idx ? { ...panel, ...patch } : panel))
    );
  };

  const toggleCharacterInPanel = (idx: number, charName: string) => {
    const current = panels[idx]?.characterNames || [];
    const exists = current.some(
      (n) => n.toLowerCase() === charName.toLowerCase()
    );
    const next = exists
      ? current.filter((n) => n.toLowerCase() !== charName.toLowerCase())
      : [...current, charName];
    updatePanelAt(idx, { characterNames: next });
  };

  const handleQuickTurkishTweak = async (idx: number) => {
    const instruction = (tweakInputs[idx] || "").trim();
    if (!instruction || tweakingIdx !== null) return;

    const panel = panels[idx];
    if (!panel) return;

    setTweakingIdx(idx);
    try {
      const panelNames = panel.characterNames || [];
      const matchedChars = cast.filter((c) =>
        panelNames.some((pn) => pn.toLowerCase() === c.name.toLowerCase())
      );
      const neighborContext = panels
        .map((p, i) =>
          i !== idx
            ? `Panel ${i + 1} (${p.characterNames?.join(", ") || "Kadro"}): ${p.imagePrompt.slice(0, 110)}`
            : null
        )
        .filter(Boolean)
        .join("\n");

      const res = await revisePanelPrompt({
        currentPrompt: panel.imagePrompt,
        userInstruction: instruction,
        locks: {
          keepLocation: true,
          keepOutfitsAndFaces: true,
          keepStyleAndLighting: true
        },
        panelCharacters: matchedChars.length > 0 ? matchedChars : cast,
        location: activeLocation,
        neighborContext,
        cameraAngle: panel.cameraAngle,
        style: config.style,
        tone: config.tone,
        colorPalette: config.colorPalette,
        lightingMood: config.lightingMood
      });

      updatePanelAt(idx, {
        imagePrompt: res.revisedPrompt,
        cameraAngle: res.detectedCameraAngle || panel.cameraAngle
      });
      setTweakNotices((prev) => ({ ...prev, [idx]: res.summaryTr }));
      setTweakInputs((prev) => ({ ...prev, [idx]: "" }));
    } catch (err) {
      console.error("Storyboard panel düzeltme hatası:", err);
      setTweakNotices((prev) => ({
        ...prev,
        [idx]: "Düzeltme uygulanamadı, promptu elle güncelleyebilirsiniz."
      }));
    } finally {
      setTweakingIdx(null);
    }
  };

  const handleApprove = () => {
    onApproveAndDraw({
      ...scriptData,
      panels
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-5"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-6xl max-h-[94vh] bg-slate-900 border-4 border-black shadow-comic-2xl flex flex-col overflow-hidden text-white"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 text-black p-3 sm:p-4 border-b-4 border-black flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-black text-yellow-300 border-2 border-black shadow-comic-xs">
                <Film size={20} />
              </div>
              <div>
                <h2 className="font-display text-lg sm:text-2xl uppercase tracking-wider font-black leading-none">
                  Storyboard & Yönetmen Onayı • Sayfa #{pageNumber}
                </h2>
                <p className="text-[11px] sm:text-xs font-comic font-bold text-slate-900 mt-0.5">
                  Görseller çizilmeden önce 4 karenin senaryosunu, karakterlerini ve kamera açılarını kontrol edip düzenle.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 bg-black text-white hover:bg-red-600 border-2 border-black transition-colors cursor-pointer"
              title="Kapat (Görsel üretilmez)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Context Bar: Active Location & Outfit Detections */}
          <div className="px-3 sm:px-5 py-2.5 bg-slate-950 border-b-2 border-black flex flex-wrap items-center gap-2 text-xs font-mono flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold">
              <MapPin size={13} />
              Mekan: {activeLocation?.name || "Otomatik Hikaye Mekanı"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/15 text-purple-300 border border-purple-500/40">
              <Palette size={13} />
              Stil: {config.style}
            </span>
            {scriptData.detectedOutfitChanges && scriptData.detectedOutfitChanges.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-bold">
                <Shirt size={13} />
                Kıyafet Değişimi: {scriptData.detectedOutfitChanges.map(o => `${o.characterName} → ${o.outfitName}`).join(", ")}
              </span>
            )}
          </div>

          {/* 4-Panel Scrollable Grid */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-4 bg-slate-900">
            {panels.map((panel, idx) => {
              const panelCharNames = panel.characterNames || [];
              const isTweaking = tweakingIdx === idx;

              return (
                <div
                  key={`sb-panel-${idx}`}
                  className="bg-slate-950 border-3 border-black shadow-comic flex flex-col overflow-hidden"
                >
                  {/* Panel Card Header */}
                  <div className="px-3 py-2 bg-black flex items-center justify-between border-b-2 border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-yellow-400 text-black font-display text-xs font-black uppercase">
                        KARE {idx + 1}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {panelCharNames.length > 0
                          ? panelCharNames.join(", ")
                          : "Karakter seçilmedi"}
                      </span>
                    </div>

                    {/* Camera Angle Selector */}
                    <div className="flex items-center gap-1.5">
                      <Camera size={12} className="text-yellow-400" />
                      <select
                        value={panel.cameraAngle || "standard"}
                        onChange={(e) =>
                          updatePanelAt(idx, {
                            cameraAngle:
                              e.target.value === "standard" ? undefined : e.target.value
                          })
                        }
                        className="bg-slate-900 text-slate-200 border border-slate-700 text-[11px] font-mono px-2 py-0.5 focus:outline-none focus:border-yellow-400"
                      >
                        <option value="standard">Standart Sinematik Açı</option>
                        {CAMERA_ANGLE_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.icon} {preset.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3 space-y-3 flex-1">
                    {/* Character Toggle Chips with Active Outfit Info */}
                    {cast.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                          <Users size={11} className="text-emerald-400" />
                          Bu Karede Kimler Var?
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {cast.map((c) => {
                            const active = panelCharNames.some(
                              (pn) => pn.toLowerCase() === c.name.toLowerCase()
                            );
                            const outfitLabel = getActiveOutfitLabel(c);
                            return (
                              <button
                                key={`sb-${idx}-char-${c.id}`}
                                type="button"
                                onClick={() => toggleCharacterInPanel(idx, c.name)}
                                title={`Aktif Kıyafet: ${outfitLabel}`}
                                className={cn(
                                  "px-2 py-1 text-[11px] font-mono border transition-all flex items-center gap-1 cursor-pointer",
                                  active
                                    ? "bg-emerald-600 text-white border-black font-bold"
                                    : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500"
                                )}
                              >
                                {active ? <Check size={11} /> : <span>+</span>}
                                <span>{c.name}</span>
                                <span className="text-[9px] opacity-75 hidden sm:inline">
                                  ({outfitLabel.split(" ")[0]})
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Dialogue & Sound Effect */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                          <MessageSquare size={11} className="text-yellow-400" />
                          Konuşma Balonu:
                        </label>
                        <input
                          type="text"
                          value={panel.dialogue || ""}
                          onChange={(e) =>
                            updatePanelAt(idx, { dialogue: e.target.value })
                          }
                          placeholder="Karakter diyaloğu..."
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 text-xs font-comic text-white focus:outline-none focus:border-yellow-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 block">
                          Efekt:
                        </label>
                        <input
                          type="text"
                          value={panel.onomatopoeia || ""}
                          onChange={(e) =>
                            updatePanelAt(idx, { onomatopoeia: e.target.value })
                          }
                          placeholder="BUM! / KLİK"
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 text-xs font-display uppercase text-red-400 focus:outline-none focus:border-yellow-400"
                        />
                      </div>
                    </div>

                    {/* Visual Prompt Editor */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
                        <span>Görsel Sahne Planı (AI Prompt):</span>
                        <span className="text-slate-500">{panel.imagePrompt.length} krk</span>
                      </label>
                      <textarea
                        rows={3}
                        value={panel.imagePrompt}
                        onChange={(e) =>
                          updatePanelAt(idx, { imagePrompt: e.target.value })
                        }
                        className="w-full p-2 bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-yellow-400 resize-y leading-relaxed"
                      />
                    </div>

                    {/* Quick Turkish Direction Tweak Bar */}
                    <div className="pt-1 border-t border-slate-800 space-y-1.5">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={tweakInputs[idx] || ""}
                          onChange={(e) =>
                            setTweakInputs((prev) => ({
                              ...prev,
                              [idx]: e.target.value
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleQuickTurkishTweak(idx);
                            }
                          }}
                          placeholder="Türkçe yönetmen notu: 'Yakın çekim olsun, ikisi gülümsesin...'"
                          className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-purple-500/40 text-[11px] font-comic text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuickTurkishTweak(idx)}
                          disabled={isTweaking || !(tweakInputs[idx] || "").trim()}
                          className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white border border-black text-[11px] font-display uppercase font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {isTweaking ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Wand2 size={12} />
                          )}
                          <span>Uygula</span>
                        </button>
                      </div>
                      {tweakNotices[idx] && (
                        <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <Check size={11} /> {tweakNotices[idx]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Action Dock */}
          <div className="p-3 sm:p-4 bg-slate-950 border-t-4 border-black flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-shrink-0">
            <div className="text-[11px] font-mono text-slate-400 hidden md:flex items-center gap-1.5">
              <Sparkles size={14} className="text-yellow-400" />
              <span>
                Burada yaptığınız değişiklikler onayladığınız anda tek seferde çizime dönüştürülür.
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isRewritingScript}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-black font-display text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
              >
                İptal
              </button>

              <button
                type="button"
                onClick={onRegenerateScript}
                disabled={isRewritingScript}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-yellow-300 border-2 border-yellow-400/60 font-display text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                title="Görsel çizmeden alternatif bir 4 karelik senaryo planı üret"
              >
                <RefreshCw
                  size={14}
                  className={cn(isRewritingScript && "animate-spin")}
                />
                <span>
                  {isRewritingScript ? "Senaryo Yazılıyor..." : "Senaryoyu Yeniden Yaz"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isRewritingScript || panels.length === 0}
                className="px-5 sm:px-7 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-display text-sm sm:text-base uppercase font-black tracking-wider border-3 border-black shadow-comic active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Onayla ve 4 Kareyi Çiz!</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
