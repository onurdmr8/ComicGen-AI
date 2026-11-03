import React, { useState } from "react";
import { User, ZoomIn, Eye, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

export type CharacterViewMode = "all" | "front" | "back" | "portrait";

interface CharacterAvatarViewProps {
  avatarUrl?: string;
  name: string;
  className?: string;
  initialMode?: CharacterViewMode;
  showToggleBar?: boolean;
  compactToggle?: boolean;
  onPreview?: (url: string, mode?: CharacterViewMode) => void;
  aspectRatio?: "square" | "video" | "wide" | "portrait";
}

export const CharacterAvatarView: React.FC<CharacterAvatarViewProps> = ({
  avatarUrl,
  name,
  className = "",
  initialMode = "all",
  showToggleBar = true,
  compactToggle = false,
  onPreview,
  aspectRatio = "wide"
}) => {
  const [currentMode, setCurrentMode] = useState<CharacterViewMode>(initialMode);

  if (!avatarUrl) {
    return (
      <div className={cn("w-full h-full bg-slate-900 border-2 border-black flex items-center justify-center text-slate-600", className)}>
        <User size={24} />
      </div>
    );
  }

  // Calculate transform for the 3-part horizontal sheet (Front on Left, Back in Middle, Portrait on Right)
  const getTransform = () => {
    switch (currentMode) {
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

  const getModeLabel = () => {
    switch (currentMode) {
      case "front":
        return "ÖN GÖRÜNÜM";
      case "back":
        return "ARKA GÖRÜNÜM";
      case "portrait":
        return "PORTRE (GÖĞÜS ALTI)";
      case "all":
      default:
        return "ÖN • ARKA • PORTRE";
    }
  };

  const views: { id: CharacterViewMode; label: string; shortLabel: string }[] = [
    { id: "all", label: "3'lü", shortLabel: "Tümü" },
    { id: "front", label: "Ön", shortLabel: "Ön" },
    { id: "back", label: "Arka", shortLabel: "Arka" },
    { id: "portrait", label: "Portre (Göğüs Altı)", shortLabel: "Portre" },
  ];

  return (
    <div className={cn("flex flex-col group/avatar-card", className)}>
      {/* Interactive Toggle Pill Bar (if enabled) */}
      {showToggleBar && (
        <div 
          className={cn(
            "flex items-center justify-between bg-black border-2 border-b-0 border-black p-0.5 gap-0.5 z-10",
            compactToggle ? "text-[8px]" : "text-[9px]"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentMode(v.id);
              }}
              className={cn(
                "flex-1 py-0.5 px-1 font-mono uppercase font-bold tracking-tight transition-all rounded-none text-center",
                currentMode === v.id
                  ? "bg-yellow-400 text-black shadow-inner"
                  : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
              )}
              title={`${v.shortLabel} Görünümü`}
            >
              {compactToggle ? v.shortLabel : v.label}
            </button>
          ))}
        </div>
      )}

      {/* Image Viewport */}
      <div 
        className={cn(
          "w-full relative overflow-hidden bg-black border-2 border-black cursor-pointer group/viewport",
          aspectRatio === "square" && "aspect-square",
          aspectRatio === "video" && "aspect-video",
          aspectRatio === "wide" && "aspect-[16/10]",
          aspectRatio === "portrait" && "aspect-[3/4]"
        )}
        onClick={() => onPreview?.(avatarUrl, currentMode)}
        title={`${name} - ${getModeLabel()} (Büyütmek için tıklayın)`}
      >
        {currentMode === "all" ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover/viewport:scale-105"
          />
        ) : (
          <div className="w-full h-full overflow-hidden relative">
            <img
              src={avatarUrl}
              alt={`${name} - ${getModeLabel()}`}
              className="w-[300%] max-w-none h-full object-cover transition-transform duration-300 ease-out"
              style={{ transform: getTransform() }}
            />
          </div>
        )}

        {/* View mode indicator overlay badge */}
        <div className="absolute bottom-0 inset-x-0 bg-black/90 text-yellow-300 text-[8px] font-mono font-bold text-center py-0.5 tracking-tighter border-t border-yellow-400/40 flex items-center justify-center gap-1">
          <Eye size={9} className="text-yellow-400" />
          <span>{getModeLabel()}</span>
        </div>

        {/* Zoom hover cue */}
        <div className="absolute top-1.5 right-1.5 bg-black/80 text-white p-1 opacity-0 group-hover/viewport:opacity-100 transition-opacity border border-black shadow">
          <ZoomIn size={12} className="text-yellow-400" />
        </div>
      </div>
    </div>
  );
};
