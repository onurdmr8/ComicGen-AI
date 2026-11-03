import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Eye, ZoomIn, Sparkles, ChevronLeft, ChevronRight, Layers, User } from "lucide-react";
import { cn } from "../lib/utils";
import { CharacterViewMode } from "./CharacterAvatarView";

interface CharacterPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  characterName?: string;
  initialMode?: CharacterViewMode;
}

export const CharacterPreviewModal: React.FC<CharacterPreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  characterName = "Karakter Model Kartı",
  initialMode = "all",
}) => {
  const [viewMode, setViewMode] = useState<CharacterViewMode>(initialMode);

  useEffect(() => {
    if (isOpen) {
      setViewMode(initialMode || "all");
    }
  }, [isOpen, initialMode]);

  if (!isOpen || !imageUrl) return null;

  const getTransform = () => {
    switch (viewMode) {
      case "front":
        return "translateX(0%)";
      case "back":
        return "translateX(-33.3333%)";
      case "portrait":
        return "translateX(-66.6666%)";
      case "all":
      default:
        return "translateX(0%)";
    }
  };

  const views: { id: CharacterViewMode; title: string; subtitle: string; iconLabel: string }[] = [
    { 
      id: "all", 
      title: "Tümü (3 Açı)", 
      subtitle: "Ön, Arka ve Göğüs Altı Portre Genel Bakış",
      iconLabel: "3'lü Genel Görünüm"
    },
    { 
      id: "front", 
      title: "1. Ön Görünüm", 
      subtitle: "Tam Boy Önden Duruş, Kostüm ve Aksesuarlar",
      iconLabel: "Ön Boydan"
    },
    { 
      id: "back", 
      title: "2. Arka Görünüm", 
      subtitle: "Tam Boy Arkadan Duruş, Sırt ve Saç Detayı",
      iconLabel: "Arka Boydan"
    },
    { 
      id: "portrait", 
      title: "3. Portre (Göğüs Altı)", 
      subtitle: "Göğüs Altına Kadar Üst Beden, Yüz Hatları, Mimikler ve Kostüm Yakası",
      iconLabel: "Portre (Göğüs Altı)"
    },
  ];

  const currentViewObj = views.find(v => v.id === viewMode) || views[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-3 sm:p-6 backdrop-blur-md"
        onClick={onClose}
      >
        <div 
          className="relative max-w-4xl w-full flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0.92, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 15 }}
            className="bg-white p-3 sm:p-4 border-x-[8px] sm:border-x-[12px] border-y-[4px] border-black shadow-comic-xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-yellow-400 py-2.5 px-3 sm:px-4 border-b-4 border-black mb-3 flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display text-lg sm:text-2xl text-black uppercase tracking-tight">
                  {characterName}
                </span>
                <span className="bg-black text-yellow-300 text-[10px] sm:text-xs font-mono font-bold px-2.5 py-0.5 uppercase tracking-wider border border-black">
                  Görünüm: {currentViewObj.title}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-black hover:rotate-90 transition-transform p-1"
                title="Kapat"
              >
                <X size={24} />
              </button>
            </div>

            {/* Character View Mode Toggle Switcher Tabs */}
            <div className="mb-3 bg-slate-900 border-4 border-black p-1.5 grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 shadow-comic">
              {views.map((v) => {
                const isActive = viewMode === v.id;
                return (
                  <button
                    key={`top-preview-view-${v.id}`}
                    type="button"
                    onClick={() => setViewMode(v.id)}
                    className={cn(
                      "py-2 px-2 flex flex-col items-center justify-center font-display uppercase tracking-tight transition-all border-2 border-black",
                      isActive
                        ? "bg-yellow-400 text-black font-bold shadow-comic scale-[1.02]"
                        : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                    )}
                  >
                    <span className="text-xs sm:text-sm font-bold flex items-center gap-1">
                      {v.title}
                    </span>
                    <span className={cn(
                      "text-[8px] sm:text-[9px] font-mono tracking-tighter truncate max-w-full",
                      isActive ? "text-slate-900" : "text-slate-400"
                    )}>
                      {v.iconLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Main Stage / Image Viewer */}
            <div className="relative bg-black border-4 border-black overflow-hidden flex items-center justify-center min-h-[260px] sm:min-h-[380px] max-h-[55vh]">
              {viewMode === "all" ? (
                <img
                  src={imageUrl}
                  alt={characterName}
                  className="w-full h-full object-contain max-h-[55vh] transition-all"
                />
              ) : (
                <div className="w-full h-full overflow-hidden relative flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt={`${characterName} - ${currentViewObj.title}`}
                    className="w-[300%] max-w-none h-auto object-cover transition-transform duration-300 ease-out"
                    style={{ transform: getTransform() }}
                  />
                </div>
              )}

              {/* Angle Tag Indicator Pill */}
              <div className="absolute top-3 left-3 bg-black/90 text-yellow-300 border-2 border-yellow-400 px-3 py-1 text-xs font-mono font-bold uppercase shadow-comic tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-yellow-400" />
                <span>{currentViewObj.title}</span>
              </div>
            </div>

            {/* Footer description bar */}
            <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-800 bg-slate-100 p-2.5 border-2 border-black flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-black uppercase">Detay:</span>
                <span className="text-slate-700 font-comic text-xs">{currentViewObj.subtitle}</span>
              </div>
              <div className="flex gap-2">
                {views.map(v => (
                  <button
                    key={`footer-preview-view-${v.id}`}
                    onClick={() => setViewMode(v.id)}
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 border border-black uppercase transition-all",
                      viewMode === v.id ? "bg-black text-yellow-400" : "bg-white text-black hover:bg-yellow-200"
                    )}
                  >
                    {v.iconLabel}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
