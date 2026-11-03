import React, { useState, useMemo } from "react";
import { 
  GitBranch, X, User, MapPin, Flame, Package, Sword, Trash2, 
  Sparkles, Check, Brain, ChevronRight, Shield, RefreshCw, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ComicPage, ComicConfig, NarrativeFlowNode } from "../types";
import { extractNarrativeFlow } from "../lib/narrativeFlowExtractor";
import { NarrativeFlowGraph } from "./NarrativeFlowGraph";
import { cn } from "../lib/utils";

interface NarrativeFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: ComicPage[];
  config: ComicConfig;
  onOpenMemoryModal?: () => void;
}

export const NarrativeFlowModal: React.FC<NarrativeFlowModalProps> = ({
  isOpen,
  onClose,
  pages,
  config,
  onOpenMemoryModal
}) => {
  const [selectedNode, setSelectedNode] = useState<NarrativeFlowNode | null>(null);
  const [selectedCharacterFilter, setSelectedCharacterFilter] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<"all" | "injury" | "items" | "locations">("all");
  const [activeSideTab, setActiveSideTab] = useState<"inspector" | "characters" | "pages">("inspector");

  // Re-extract data on input changes
  const flowData = useMemo(() => {
    return extractNarrativeFlow(pages, config);
  }, [pages, config]);

  // If selected node was set, keep it, otherwise default to the latest dramatic node if available
  const activeNode = useMemo(() => {
    if (selectedNode) {
      const exists = flowData.allNodes.find(n => n.id === selectedNode.id);
      if (exists) return exists;
    }
    // Default to latest node
    if (flowData.allNodes.length > 0) {
      return flowData.allNodes[flowData.allNodes.length - 1];
    }
    return null;
  }, [selectedNode, flowData.allNodes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-7xl h-[92vh] bg-[#0f172a] border-4 border-black shadow-comic flex flex-col overflow-hidden text-white font-sans"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 bg-yellow-400 border-b-4 border-black text-black flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-black text-yellow-400 border-2 border-black shadow-xs -rotate-3">
              <GitBranch size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-2xl uppercase tracking-wide leading-none">
                  Olay Çizelgesi Görselleştirici
                </h2>
                <span className="hidden sm:inline-block px-1.5 py-0.2 bg-black text-yellow-300 font-mono text-[10px] uppercase border border-black font-bold">
                  D3.js Devamlılık Motoru
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-900 font-comic font-medium leading-tight">
                Karakterlerin fiziksel hasar, envanter, mekan ve kurgusal devamlılık akışı
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenMemoryModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMemoryModal();
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-yellow-300 hover:bg-slate-800 text-xs font-display uppercase border-2 border-black shadow-xs transition-transform active:scale-95"
              >
                <Brain size={14} className="text-yellow-400" />
                <span>Olay Hafızası</span>
              </button>
            )}

            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 bg-black text-white hover:bg-red-600 hover:rotate-90 transition-all border-2 border-black"
              aria-label="Kapat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content: Split Layout (Graph on Left, Inspector on Right) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: D3 Interactive Graph Area */}
          <div className="flex-1 h-[55%] lg:h-full flex flex-col overflow-hidden border-b-4 lg:border-b-0 lg:border-r-4 border-black">
            {flowData.allNodes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#0b1120]">
                <Layers size={40} className="text-yellow-400 animate-pulse" />
                <h3 className="font-display text-lg uppercase text-white">Henüz Sayfa veya Panel Üretilmedi</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Yeni bir çizgi roman sayfası ürettiğinizde, D3 Olay Çizelgesi karakterlerin fiziksel değişimlerini ve envanterini anlık olarak haritalayacaktır.
                </p>
              </div>
            ) : (
              <NarrativeFlowGraph
                flowData={flowData}
                selectedNode={activeNode}
                onSelectNode={(node) => {
                  setSelectedNode(node);
                  setActiveSideTab("inspector");
                }}
                selectedCharacterFilter={selectedCharacterFilter}
                onSelectCharacterFilter={setSelectedCharacterFilter}
                selectedCategoryFilter={selectedCategoryFilter}
                onSelectCategoryFilter={setSelectedCategoryFilter}
              />
            )}
          </div>

          {/* Right: Inspector & Details Panel */}
          <div className="w-full lg:w-[380px] h-[45%] lg:h-full bg-slate-900 flex flex-col overflow-hidden flex-shrink-0">
            {/* Inspector Navigation Tabs */}
            <div className="flex border-b-2 border-black bg-slate-950 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveSideTab("inspector")}
                className={cn(
                  "flex-1 py-2 px-2 text-[11px] font-display uppercase tracking-wider transition-all border-r border-slate-800",
                  activeSideTab === "inspector"
                    ? "bg-yellow-400 text-black font-bold"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Panel İnceleyici
              </button>
              <button
                type="button"
                onClick={() => setActiveSideTab("characters")}
                className={cn(
                  "flex-1 py-2 px-2 text-[11px] font-display uppercase tracking-wider transition-all border-r border-slate-800",
                  activeSideTab === "characters"
                    ? "bg-yellow-400 text-black font-bold"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Kadro Durumu ({flowData.characterTimelines.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSideTab("pages")}
                className={cn(
                  "flex-1 py-2 px-2 text-[11px] font-display uppercase tracking-wider transition-all",
                  activeSideTab === "pages"
                    ? "bg-yellow-400 text-black font-bold"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Sayfa Akışı ({flowData.pageSummaries.length})
              </button>
            </div>

            {/* Tab 1: Panel Inspector */}
            {activeSideTab === "inspector" && (
              <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto custom-scrollbar space-y-3.5">
                {activeNode ? (
                  <>
                    {/* Node Header Card */}
                    <div className="p-3 bg-slate-800 border-2 border-black shadow-comic space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {activeNode.characterAvatar ? (
                            <img 
                              src={activeNode.characterAvatar} 
                              alt={activeNode.characterName}
                              className="w-8 h-8 rounded-full border-2 border-black object-cover" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center font-display font-bold border-2 border-black">
                              {activeNode.characterName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-display text-sm uppercase text-yellow-400 leading-none">
                              {activeNode.characterName}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">
                              Sayfa {activeNode.pageNumber} • Panel {activeNode.panelNumber}
                            </span>
                          </div>
                        </div>

                        <span className={cn(
                          "px-2 py-0.5 text-[9px] font-mono uppercase font-bold border",
                          activeNode.conditionSeverity === "danger" 
                            ? "bg-red-500/20 text-red-300 border-red-500/40"
                            : activeNode.conditionSeverity === "warning"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        )}>
                          {activeNode.conditionSeverity === "danger" ? "Kritik Hasar" : activeNode.conditionSeverity === "warning" ? "Dikkat" : "Stabil"}
                        </span>
                      </div>

                      {/* Optional Panel Image Thumbnail */}
                      {activeNode.panelImageUrl && (
                        <div className="relative aspect-video rounded-xs overflow-hidden border-2 border-black">
                          <img 
                            src={activeNode.panelImageUrl} 
                            alt={`Sayfa ${activeNode.pageNumber} Panel ${activeNode.panelNumber}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* Section 1: Karakterin Fiziksel Durumu */}
                    <div className="p-3 bg-slate-800/80 border-2 border-black space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-display uppercase tracking-wide text-red-400">
                        <Flame size={14} className="text-red-400" />
                        <span>Fiziksel Durum & Sağlık</span>
                      </div>
                      <p className="text-xs text-white font-medium bg-slate-950/70 p-2 border border-slate-700">
                        {activeNode.physicalCondition}
                      </p>
                      {activeNode.visualImpact && (
                        <p className="text-[10px] text-yellow-300 font-mono pl-1">
                          Görsel İz: {activeNode.visualImpact}
                        </p>
                      )}
                    </div>

                    {/* Section 2: Elindeki Eşyalar / Envanter */}
                    <div className="p-3 bg-slate-800/80 border-2 border-black space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-display uppercase tracking-wide text-emerald-400">
                          <Package size={14} className="text-emerald-400" />
                          <span>Elindeki Eşyalar / Envanter</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {activeNode.heldItems.length} Eşya
                        </span>
                      </div>

                      {activeNode.heldItems.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {activeNode.heldItems.map((item, idx) => (
                            <span 
                              key={`held-${activeNode.characterId || activeNode.characterName || 'char'}-${idx}-${item}`}
                              className="px-2 py-0.5 bg-emerald-950 text-emerald-200 border border-emerald-500/40 text-[10px] font-mono flex items-center gap-1"
                            >
                              <Sword size={10} className="text-emerald-400" />
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic">Üzerinde özel bir silah/eşya taşımıyor.</p>
                      )}

                      {/* Items gained / lost in this specific panel */}
                      {(activeNode.itemsGained.length > 0 || activeNode.itemsLost.length > 0) && (
                        <div className="pt-1 space-y-1 text-[10px] font-mono border-t border-slate-700">
                          {activeNode.itemsGained.map((g, i) => (
                            <div key={`gained-${activeNode.characterId || activeNode.characterName || 'char'}-${i}-${g}`} className="text-emerald-400 flex items-center gap-1">
                              <span>+ Kuşandı / Kazandı:</span> <strong>{g}</strong>
                            </div>
                          ))}
                          {activeNode.itemsLost.map((l, i) => (
                            <div key={`lost-${activeNode.characterId || activeNode.characterName || 'char'}-${i}-${l}`} className="text-amber-400 flex items-center gap-1">
                              <span>- Kaybetti / Kırıldı:</span> <strong>{l}</strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section 3: Mekan ve Ortam */}
                    <div className="p-3 bg-slate-800/80 border-2 border-black space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-display uppercase tracking-wide text-blue-400">
                          <MapPin size={14} className="text-blue-400" />
                          <span>Bulunduğu Mekan</span>
                        </div>
                        {activeNode.locationChanged && (
                          <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 border border-blue-400/40 text-[9px] font-mono uppercase">
                            Mekan Değişti
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-blue-200 font-semibold bg-slate-950/70 p-2 border border-slate-700">
                        {activeNode.locationName}
                      </p>
                    </div>

                    {/* Section 4: Diyalog & Kurgu Özeti */}
                    <div className="p-3 bg-slate-800/80 border-2 border-black space-y-1.5">
                      <div className="text-xs font-display uppercase tracking-wide text-yellow-400">
                        Panel Diyaloğu & Sahne
                      </div>
                      <div className="text-xs text-slate-200 italic bg-slate-950 p-2.5 border-l-2 border-yellow-400 leading-snug">
                        "{activeNode.dialogueSnippet}"
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-3">
                        {activeNode.actionSummary}
                      </p>
                    </div>

                    {/* Active Memory link if exists */}
                    {activeNode.hasMemoryAlert && (
                      <div className="p-2.5 bg-purple-950/80 border-2 border-purple-500/60 text-purple-200 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-display uppercase text-yellow-300 text-[11px]">
                          <Brain size={13} className="text-yellow-400" />
                          <span>Olay Hafızası Kaydı</span>
                        </div>
                        <p className="text-[11px] text-slate-200">
                          {activeNode.memoryDescription}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-xs italic">
                    Soldaki D3 çizelgesinden bir panel düğümüne tıklayarak detaylı durumu görüntüleyin.
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Cast Summary (All Characters Overview) */}
            {activeSideTab === "characters" && (
              <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto custom-scrollbar space-y-3">
                <div className="text-xs text-slate-400 font-comic">
                  Karakterlerin hikayedeki son güncel fiziksel durumları ve elindeki eşyalar:
                </div>

                {flowData.characterTimelines.map((tl, tlIdx) => (
                  <div 
                    key={`char-timeline-${tl.characterName}-${tlIdx}`}
                    className="p-3 bg-slate-800 border-2 border-black shadow-comic space-y-2 cursor-pointer hover:border-yellow-400 transition-all"
                    onClick={() => {
                      setSelectedCharacterFilter(
                        selectedCharacterFilter === tl.characterName ? null : tl.characterName
                      );
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {tl.characterAvatar ? (
                          <img 
                            src={tl.characterAvatar} 
                            alt={tl.characterName} 
                            className="w-7 h-7 rounded-full border border-black object-cover"
                          />
                        ) : (
                          <div 
                            className="w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-black text-xs border border-black"
                            style={{ backgroundColor: tl.color }}
                          >
                            {tl.characterName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h5 className="font-display text-xs uppercase text-white font-bold">
                            {tl.characterName}
                          </h5>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {tl.nodes.length} Panellerde Yer Aldı
                          </span>
                        </div>
                      </div>

                      <span 
                        className="w-3 h-3 rounded-full border border-black"
                        style={{ backgroundColor: tl.color }}
                        title="Grafik Rengi"
                      />
                    </div>

                    {/* Current Condition */}
                    <div className="text-[11px] flex items-center gap-1.5 text-slate-300">
                      <Flame size={12} className={tl.currentPhysicalState.includes("Yaralı") ? "text-red-400" : "text-emerald-400"} />
                      <span>Durum: <strong>{tl.currentPhysicalState}</strong></span>
                    </div>

                    {/* Inventory */}
                    <div className="text-[11px] flex items-start gap-1.5 text-slate-300">
                      <Package size={12} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-slate-400 text-[10px]">Envanter: </span>
                        {tl.currentInventory.length > 0 ? (
                          <span className="text-emerald-300 font-mono text-[10px]">
                            {tl.currentInventory.join(", ")}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-[10px]">Boş</span>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="text-[11px] flex items-center gap-1.5 text-slate-400">
                      <MapPin size={12} className="text-blue-400" />
                      <span>Son Mekan: <strong className="text-blue-200">{tl.currentLocation}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Pages Timeline Flow */}
            {activeSideTab === "pages" && (
              <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto custom-scrollbar space-y-3">
                <div className="text-xs text-slate-400 font-comic">
                  Sayfa bazında olaylar ve devamlılık kırılmaları:
                </div>

                {flowData.pageSummaries.map((p, pIdx) => (
                  <div 
                    key={`page-summary-${p.pageNumber}-${pIdx}`}
                    className="p-3 bg-slate-800 border-2 border-black shadow-comic space-y-1.5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                      <span className="font-display text-xs uppercase text-yellow-400">
                        Sayfa {p.pageNumber}
                      </span>
                      <span className="text-[10px] font-mono text-blue-300 flex items-center gap-1">
                        <MapPin size={10} /> {p.location}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300">
                      Kadro: <strong>{p.characterNames.join(", ") || "Belirtilmedi"}</strong>
                    </div>

                    {p.injuries.length > 0 && (
                      <div className="text-[10px] text-red-300 font-mono bg-red-950/50 p-1 border-l-2 border-red-500">
                        ⚡ {p.injuries.join(" • ")}
                      </div>
                    )}

                    {p.itemsChanged.length > 0 && (
                      <div className="text-[10px] text-emerald-300 font-mono bg-emerald-950/50 p-1 border-l-2 border-emerald-500">
                        ✦ {p.itemsChanged.join(" • ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-3 bg-slate-950 border-t-2 border-black flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0">
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Yaralanma / Hasar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Eşya Kazanımı
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Mekan Geçişi
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-yellow-400 text-black font-display text-xs uppercase border-2 border-black shadow-comic hover:bg-yellow-300 transition-all active:scale-95"
          >
            Tamam
          </button>
        </div>
      </motion.div>
    </div>
  );
};
