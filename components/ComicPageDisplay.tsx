import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ComicPage, Character, LocationItem, PanelDirectorConfig, ComicPanelData } from "../types";
import { Loader2, Maximize2, RefreshCw, PenTool, Edit3, BookOpen, Sliders, Paintbrush, Trash2, Eye, EyeOff, Flame, Check, X } from "lucide-react";
import { cn } from "../lib/utils";
import { PanelEditorOverlay } from "./PanelEditorOverlay";
import { PanelInpaintModal } from "./PanelInpaintModal";

interface ComicPageDisplayProps {
  id?: string;
  page: ComicPage;
  pageIndex: number;
  cast?: Character[];
  locations?: LocationItem[];
  style?: string;
  renderQuality?: string;
  usePaidApi?: boolean;
  imageProvider?: "auto" | "pollinations_flux" | "gemini";
  onPanelClick: (imageUrl: string) => void;
  onRegeneratePanel: (panelIndex: number) => void;
  onRegenerateFullPage?: (pageId: string) => void;
  onApplyDirector?: (panelIndex: number, config: PanelDirectorConfig) => Promise<void>;
  onUpdateDialogue: (panelIndex: number, newDialogue: string) => void;
  onUpdatePanel?: (panelIndex: number, updatedPanel: Partial<ComicPanelData>) => void;
  onRegenerateSinglePanelWithData?: (panelIndex: number, updatedPanel: Partial<ComicPanelData>) => Promise<void>;
  onDeletePage?: (pageId: string) => void;
  onTogglePanelBlur?: (panelIndex: number) => void;
  onToggleGlobalBlur?: () => void;
  onRegenerateWithAngle?: (panelIndex: number, angleId: string) => void;
}

const PanelDialogueInput: React.FC<{
  initialDialogue: string;
  onUpdate: (val: string) => void;
}> = ({ initialDialogue, onUpdate }) => {
  const [val, setVal] = useState(initialDialogue);

  React.useEffect(() => {
    setVal(initialDialogue);
  }, [initialDialogue]);

  return (
    <textarea
      className="dialogue-input w-full bg-transparent border-none text-[10px] sm:text-xs md:text-sm font-comic leading-snug text-center font-bold text-black uppercase tracking-tight resize-none outline-none focus:bg-yellow-50/80 rounded transition-colors block"
      value={val}
      rows={Math.max(1, Math.min(3, Math.ceil((val?.length || 0) / 30)))}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        if (val !== initialDialogue) {
          onUpdate(val);
        }
      }}
      placeholder="DİYALOG..."
    />
  );
};

export const ComicPageDisplay: React.FC<ComicPageDisplayProps> = ({ 
  id,
  page, 
  pageIndex, 
  cast = [],
  locations = [],
  style = "Modern Comic",
  renderQuality = "High",
  usePaidApi = false,
  imageProvider = "pollinations_flux",
  onPanelClick, 
  onRegeneratePanel,
  onRegenerateFullPage,
  onApplyDirector,
  onUpdateDialogue,
  onUpdatePanel,
  onRegenerateSinglePanelWithData,
  onDeletePage,
  onTogglePanelBlur,
  onToggleGlobalBlur
}) => {
  const [activeEditorPanelIdx, setActiveEditorPanelIdx] = useState<number | null>(null);
  const [activeInpaintPanelIdx, setActiveInpaintPanelIdx] = useState<number | null>(null);

  const isPageLoading = page.panels.some(p => p.isLoading) || !page.pageImageUrl && page.panels.every(p => !p.imageUrl);
  const hasAnyBlurred = page.panels.some(p => p.isBlurred);
  const hasAnyMature = page.panels.some(p => p.isMature);

  const getLayoutClasses = () => {
    return "grid-cols-2 grid-rows-2";
  };

  const getPanelClasses = (_idx: number) => {
    return "relative overflow-hidden group/panel transition-all duration-300";
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-4xl mx-auto print:mb-0"
      >
        <div 
          id={id || `comic-page-${page.id}`}
          className="comic-paper-sheet bg-white p-3 sm:p-5 shadow-comic-2xl border-4 border-black relative group/page"
        >
          {/* Corner Registration Crosshairs for authentic comic print look */}
          <span className="absolute top-1 left-1.5 font-mono text-[9px] text-slate-300 font-bold select-none pointer-events-none">✛</span>
          <span className="absolute top-1 right-1.5 font-mono text-[9px] text-slate-300 font-bold select-none pointer-events-none">✛</span>
          <span className="absolute bottom-1 left-1.5 font-mono text-[9px] text-slate-300 font-bold select-none pointer-events-none">✛</span>
          <span className="absolute bottom-1 right-1.5 font-mono text-[9px] text-slate-300 font-bold select-none pointer-events-none">✛</span>

          {/* Page Top Header - Studio Metadata Look */}
          <div className="absolute -top-10 left-0 right-0 flex justify-between items-end px-2 pointer-events-none">
            <div className="bg-black text-yellow-300 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] -skew-x-6 border-2 border-black shadow-comic-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
              <span>ISSUE #01 • SAYFA {String(pageIndex + 1).padStart(2, '0')}</span>
            </div>
            <div className="text-slate-400 font-mono text-[9px] uppercase tracking-wider flex items-center gap-2">
              <span className="hidden sm:inline">COMICGEN AI ENGINE • FLUX 2D</span>
              <span className="font-bold text-yellow-400">HQ PRINT PROOF</span>
            </div>
          </div>

          <div className="comic-border bg-white overflow-hidden relative">
              {/* The Page Frame Title Banner */}
              <div className="bg-yellow-400 border-b-4 border-black px-3 sm:px-6 py-2.5 sm:py-3.5 flex justify-between items-center relative z-20 flex-wrap gap-2">
                   <div className="flex items-center gap-2 sm:gap-3">
                     <span className="bg-black text-white px-2 py-0.5 font-display text-xs sm:text-sm uppercase tracking-widest -skew-x-6">
                       BÖLÜM {pageIndex + 1}
                     </span>
                     <h4 className="font-display tracking-[0.08em] text-lg sm:text-3xl text-black uppercase -skew-x-6 text-outline">
                        {pageIndex === 0 ? "KÖKEN: UYANIŞ" : pageIndex === 1 ? "GELİŞME: ÇATIŞMA" : pageIndex === 2 ? "DÖNÜM NOKTASI" : "FİNAL: ÇÖZÜM"}
                     </h4>
                   </div>

                   <div className="flex items-center gap-2 flex-wrap">
                     {onToggleGlobalBlur && (hasAnyMature || hasAnyBlurred) && (
                       <button
                         type="button"
                         onClick={(e) => {
                           e.stopPropagation();
                           onToggleGlobalBlur();
                         }}
                         className={cn(
                           "border-2 sm:border-3 border-black px-2.5 sm:px-3 py-1 sm:py-1.5 font-display text-[10px] sm:text-xs uppercase shadow-comic active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer font-bold",
                           hasAnyBlurred
                             ? "bg-red-600 hover:bg-red-500 text-white"
                             : "bg-slate-900 hover:bg-slate-800 text-yellow-300"
                         )}
                         title={hasAnyBlurred ? "Tüm sansürlü/blurlu panelleri aç" : "Tüm +18 panelleri tekrar blurlu kalkanla gizle"}
                       >
                         {hasAnyBlurred ? <Eye size={13} className="text-white" /> : <EyeOff size={13} className="text-yellow-400" />}
                         <span>{hasAnyBlurred ? "🔞 Blur Kalkanını Aç" : "🔞 Sansürle / Blurla"}</span>
                       </button>
                     )}

                     {onRegenerateFullPage && (
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           onRegenerateFullPage(page.id);
                         }}
                         disabled={isPageLoading}
                         className="bg-black hover:bg-slate-900 text-yellow-300 hover:text-yellow-200 border-2 sm:border-3 border-black px-2.5 sm:px-3.5 py-1 sm:py-1.5 font-display text-[10px] sm:text-xs uppercase shadow-comic active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                         title="Tüm sayfa görselini tek tıkla en baştan çiz"
                       >
                         <RefreshCw size={13} className={cn(isPageLoading ? "animate-spin text-yellow-400" : "text-yellow-400")} />
                         <span className="font-bold tracking-wider">Tüm Sayfayı Yeniden Çiz</span>
                       </button>
                     )}
                   </div>
              </div>

              <div className="relative w-full aspect-[3/4] bg-slate-200 bg-halftone">
                  {/* Background Image if full page image was set */}
                  {page.pageImageUrl && (
                      <motion.img
                          initial={{ scale: 1.05, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          src={page.pageImageUrl}
                          alt={`Page ${pageIndex + 1}`}
                          className="absolute inset-0 w-full h-full object-cover z-0 contrast-[1.15] saturate-[1.1]"
                      />
                  )}

                  {/* Panel Overlay */}
                  <div className={cn("absolute inset-0 grid z-10 p-1 sm:p-2 gap-1 sm:gap-2 bg-transparent", getLayoutClasses())}>
                      {page.panels.slice(0, 4).map((panel, idx) => (
                          <motion.div 
                            key={`comic-panel-${page.id || 'p'}-${panel.id || idx}-${idx}`} 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.15 }}
                            className={cn(getPanelClasses(idx), "cursor-pointer")}
                            onClick={() => setActiveEditorPanelIdx(idx)}
                          >
                              {/* Visual Background for specifically generated panel */}
                              {panel.imageUrl && (
                                  <img 
                                    src={panel.imageUrl} 
                                    loading="lazy"
                                    decoding="async"
                                    className={cn(
                                      "absolute inset-0 w-full h-full object-cover -z-0 transition-all duration-500",
                                      panel.isBlurred ? "blur-2xl scale-105 select-none" : ""
                                    )} 
                                    alt="" 
                                  />
                              )}

                              {/* Frosted Glass Blur Shield for PG-18 / Sensitive scenes */}
                              {panel.isBlurred && (
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onTogglePanelBlur?.(idx);
                                    }}
                                    className="absolute inset-0 z-25 flex flex-col items-center justify-center p-2.5 sm:p-4 bg-black/65 backdrop-blur-md text-center pointer-events-auto cursor-pointer select-none group/shield hover:bg-black/55 transition-all"
                                  >
                                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-red-600/30 border border-red-500/80 flex items-center justify-center text-red-400 mb-1.5 shadow-lg group-hover/shield:scale-110 transition-transform">
                                      <EyeOff size={20} />
                                    </div>
                                    <span className="font-display text-[11px] sm:text-xs font-bold text-red-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                      🔞 PG-18 Hassas Sahne
                                    </span>
                                    <p className="text-[9px] sm:text-[10px] text-slate-300 max-w-[190px] mb-2 leading-tight font-comic">
                                      Bu sahne yetişkin/tensel içerik barındırdığı için gizlenmiştir.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onTogglePanelBlur?.(idx);
                                      }}
                                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-display text-[9px] sm:text-[10px] uppercase font-bold border-2 border-black shadow-comic flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                    >
                                      <Eye size={12} /> <span>Görseli Göster (Aç)</span>
                                    </button>
                                  </div>
                              )}
                              
                              {/* Gutter / Panel Frame */}
                              <div className="absolute inset-0 border-2 sm:border-4 border-black pointer-events-none z-10" />

                              {/* Panel Badges (Characters, 18+ Mature, Camera Angle) */}
                              <div className="absolute top-2 left-2 z-30 pointer-events-auto flex flex-col gap-1 items-start">
                                {/* Character Badge */}
                                {(panel.characterNames && panel.characterNames.length > 0) ? (
                                    <div 
                                        className="flex items-center gap-1 bg-black/90 text-yellow-300 border-2 border-black px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-display shadow-comic-sm backdrop-blur-xs cursor-pointer hover:bg-yellow-400 hover:text-black transition-colors"
                                        title="Paneldeki Karakter(ler) - Değiştirmek veya düzenlemek için tıklayın"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveEditorPanelIdx(idx);
                                        }}
                                    >
                                        <span className="text-[11px]">{panel.characterNames.length === 1 ? "👤" : "👥"}</span>
                                        <span className="truncate max-w-[90px] sm:max-w-[140px] uppercase font-bold">
                                            {panel.characterNames.join(", ")}
                                        </span>
                                    </div>
                                ) : (panel.characterStyleSheetRefs && panel.characterStyleSheetRefs.length > 0) ? (
                                    <div 
                                        className="flex items-center gap-1 bg-black/85 text-yellow-300 border border-yellow-400/50 px-1.5 py-0.5 text-[9px] font-mono shadow-sm backdrop-blur-xs"
                                        title="Karakter Görsel Kılavuzu Referans Çıpası Aktif"
                                    >
                                        <BookOpen size={10} className="text-yellow-400 flex-shrink-0" />
                                        <span className="truncate max-w-[90px] sm:max-w-[130px] uppercase font-bold">
                                            {panel.characterStyleSheetRefs.map(r => r.characterName).join(", ")}
                                        </span>
                                    </div>
                                ) : null}

                                {/* 18+ Mature Badge */}
                                {panel.isMature && (
                                    <div 
                                        className="flex items-center gap-1 bg-red-950/90 text-red-300 border border-red-500/80 px-1.5 py-0.5 text-[9px] font-mono shadow-sm backdrop-blur-xs cursor-pointer hover:bg-red-900 transition-colors"
                                        title="PG-18 / Yetişkin Sahne - Sansür blurunu açmak/kapatmak için tıklayın"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onTogglePanelBlur?.(idx);
                                        }}
                                    >
                                        <Flame size={10} className="text-red-400 fill-red-400 flex-shrink-0" />
                                        <span className="font-bold">18+</span>
                                    </div>
                                )}
                              </div>

                              {/* Panel UI Layer */}
                              <div className="absolute inset-0 p-1.5 sm:p-4 flex flex-col z-20 pointer-events-none group-hover/panel:bg-black/10 transition-all">
                                  
                                  {/* Onomatopoeia Overlay (e.g. POW!) */}
                                  {panel.onomatopoeia && (
                                      <motion.div 
                                          initial={{ scale: 0, rotate: -20 }}
                                          animate={{ scale: 1, rotate: 10 }}
                                          className="absolute top-1/4 left-1/4 pointer-events-none"
                                      >
                                          <span className="font-display text-3xl sm:text-6xl text-red-600 text-outline uppercase tracking-tighter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] sm:drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] -skew-x-12">
                                              {panel.onomatopoeia}
                                          </span>
                                      </motion.div>
                                  )}

                                  <div className="mt-auto pointer-events-auto pb-1 sm:pb-1.5">
                                      {/* Dialogue Balloon */}
                                      {panel.dialogue !== undefined && (
                                        <div 
                                          className="relative bg-white border-2 sm:border-3 border-black px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-comic max-w-[94%] sm:max-w-[88%] mx-auto mb-2 sm:mb-2.5"
                                        >
                                            {/* Clean Balloon Tail (Pointing downwards, stays inside panel boundaries) */}
                                            <div 
                                              className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white border-r-2 sm:border-r-3 border-b-2 sm:border-b-3 border-black rotate-45 z-10 pointer-events-none" 
                                            />
                                            
                                            <div className="relative w-full flex items-center justify-center">
                                                {/* Interactive Textarea for in-app typing */}
                                                <PanelDialogueInput
                                                  initialDialogue={panel.dialogue || ""}
                                                  onUpdate={(newVal) => onUpdateDialogue(idx, newVal)}
                                                />

                                                {/* Dedicated Clean Centered DIV for High-Res HTML2Canvas / PDF Capture */}
                                                <div 
                                                  className="dialogue-print-text hidden w-full text-center font-comic font-bold text-black uppercase text-[10px] sm:text-xs md:text-sm leading-snug tracking-tight px-0.5"
                                                  style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                                                >
                                                  {panel.dialogue}
                                                </div>

                                                <div className="absolute -top-1 -right-1 text-slate-400 opacity-0 group-hover/panel:opacity-80 pointer-events-none transition-opacity">
                                                    <Edit3 size={10} />
                                                </div>
                                            </div>
                                        </div>
                                      )}
                                  </div>
                              </div>

                              {/* Sleek Floating Panel Action Dock */}
                              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1 bg-slate-950/90 backdrop-blur-md border-2 border-black shadow-comic flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/panel:opacity-100 transition-all duration-200 z-40 pointer-events-auto">
                                  {/* Blur Toggle Button (Only if mature or blurred) */}
                                  {(panel.isMature || panel.isBlurred) && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onTogglePanelBlur?.(idx); }}
                                        className={cn(
                                          "p-1.5 border border-black transition-all shadow-xs active:scale-95 flex items-center gap-1 font-bold cursor-pointer",
                                          panel.isBlurred ? "bg-red-600 text-white hover:bg-red-500" : "bg-slate-900 text-yellow-400 hover:bg-black"
                                        )}
                                        title={panel.isBlurred ? "Sansür Blurunu Kaldır" : "Görsele 18+ Sansür Bluru Ekle"}
                                    >
                                        {panel.isBlurred ? <Eye size={13} /> : <EyeOff size={13} />}
                                    </button>
                                  )}

                                  {/* Dedicated Panel Editor & Prompt Modification Button */}
                                  <button
                                      onClick={(e) => { e.stopPropagation(); setActiveEditorPanelIdx(idx); }}
                                      className="px-2 py-1 bg-yellow-400 hover:bg-yellow-300 text-black border border-black transition-all shadow-xs active:scale-95 flex items-center gap-1 font-bold cursor-pointer"
                                      title="Paneli Düzenle (Diyalog, Prompt & Karakter)"
                                  >
                                      <Edit3 size={13} />
                                      <span className="text-[10px] font-display uppercase tracking-tight">Düzenle</span>
                                  </button>

                                  {/* Magic Inpaint / Retouch Button */}
                                  <button
                                      onClick={(e) => { e.stopPropagation(); setActiveInpaintPanelIdx(idx); }}
                                      className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white border border-black transition-all shadow-xs active:scale-95 flex items-center gap-1 font-bold cursor-pointer"
                                      title="Sihirli Fırça & Bölgesel Rötuş (Inpainting)"
                                  >
                                      <Paintbrush size={13} />
                                      <span className="text-[10px] font-display uppercase tracking-tight">Rötuş</span>
                                  </button>
                                  
                                  {/* Fast Regenerate Button */}
                                  <button
                                      onClick={(e) => { e.stopPropagation(); onRegeneratePanel(idx); }}
                                      disabled={panel.isLoading}
                                      className="p-1.5 bg-slate-900 text-yellow-400 border border-black hover:bg-yellow-400 hover:text-black transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                                      title="Paneli Hızlıca Yeniden Çiz"
                                  >
                                      <RefreshCw size={13} className={cn(panel.isLoading ? "animate-spin" : "")} />
                                  </button>

                                  {/* Maximize preview */}
                                  <button
                                      onClick={(e) => { e.stopPropagation(); onPanelClick(panel.imageUrl || page.pageImageUrl || ""); }}
                                      className="p-1.5 bg-white hover:bg-slate-100 text-black border border-black transition-all shadow-xs active:scale-95 cursor-pointer"
                                      title="Tam Ekran İncele"
                                  >
                                      <Maximize2 size={13} />
                                  </button>
                              </div>

                              {/* Loading State Overlay */}
                              <AnimatePresence>
                                  {panel.isLoading && (
                                      <motion.div 
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                          className="absolute inset-0 bg-slate-950/80 z-50 flex flex-col items-center justify-center p-2 sm:p-4 backdrop-blur-xs"
                                      >
                                          <Loader2 className="text-yellow-400 animate-spin mb-2 sm:mb-3 w-8 h-8 sm:w-12 sm:h-12" />
                                          <span className="text-white font-display text-xs sm:text-base uppercase tracking-[0.15em] text-center font-bold">Çiziliyor...</span>
                                      </motion.div>
                                  )}
                              </AnimatePresence>
                          </motion.div>
                      ))}
                  </div>
              </div>
          </div>
        </div>
      </motion.div>

      {/* Dedicated Panel Editor Overlay */}
      {activeEditorPanelIdx !== null && page.panels[activeEditorPanelIdx] && (
        <PanelEditorOverlay
          isOpen={activeEditorPanelIdx !== null}
          onClose={() => setActiveEditorPanelIdx(null)}
          pageIndex={pageIndex}
          panelIndex={activeEditorPanelIdx}
          panelData={page.panels[activeEditorPanelIdx]}
          cast={cast}
          locations={locations}
          isRegenerating={page.panels[activeEditorPanelIdx].isLoading || false}
          onSave={(updated) => {
            if (onUpdatePanel) {
              onUpdatePanel(activeEditorPanelIdx, updated);
            } else if (updated.dialogue !== undefined) {
              onUpdateDialogue(activeEditorPanelIdx, updated.dialogue);
            }
          }}
          onRegenerateThisPanel={async (updated) => {
            if (onRegenerateSinglePanelWithData) {
              await onRegenerateSinglePanelWithData(activeEditorPanelIdx, updated);
            } else {
              if (onUpdatePanel) {
                onUpdatePanel(activeEditorPanelIdx, updated);
              }
              onRegeneratePanel(activeEditorPanelIdx);
            }
          }}
          onOpenFullscreen={onPanelClick}
        />
      )}

      {/* Panel Inpainting & Magic Brush Modal */}
      {activeInpaintPanelIdx !== null && page.panels[activeInpaintPanelIdx] && (
        <PanelInpaintModal
          isOpen={activeInpaintPanelIdx !== null}
          onClose={() => setActiveInpaintPanelIdx(null)}
          pageIndex={pageIndex}
          panelIndex={activeInpaintPanelIdx}
          panelData={page.panels[activeInpaintPanelIdx]}
          cast={cast}
          style={style}
          renderQuality={renderQuality}
          usePaidApi={usePaidApi}
          imageProvider={imageProvider}
          onSaveUpdatedImage={(panelIdx, newImageUrl, oldImageUrl) => {
            if (onUpdatePanel) {
              const currentPanel = page.panels[panelIdx];
              const history = currentPanel?.editHistory || [];
              const updatedHistory = oldImageUrl ? [...history, oldImageUrl] : history;
              onUpdatePanel(panelIdx, {
                imageUrl: newImageUrl,
                originalImageUrl: currentPanel?.originalImageUrl || oldImageUrl,
                editHistory: updatedHistory
              });
            }
          }}
        />
      )}
    </>
  );
};
