import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ComicPanelData, 
  Character, 
  LocationItem, 
  PanelDirectorConfig,
  CharacterPoseSetting 
} from "../types";
import { 
  X, 
  Save, 
  RefreshCw, 
  MessageSquare, 
  Image as ImageIcon, 
  Users, 
  Sparkles, 
  Sliders, 
  Check, 
  Eye, 
  Maximize2,
  AlertCircle,
  Wand2,
  MapPin,
  Move,
  Grid,
  Paintbrush,
  Undo2,
  Clock,
  EyeOff,
  Flame,
  Camera
} from "lucide-react";
import { 
  cn, 
  POSITION_SLOTS, 
  POSE_PRESETS, 
  EMOTION_PRESETS, 
  PositionSlot, 
  PosePreset, 
  EmotionPreset 
} from "../lib/utils";
import { PanelInpaintModal } from "./PanelInpaintModal";

export interface PanelEditorOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  pageIndex: number;
  panelIndex: number;
  panelData: ComicPanelData;
  cast: Character[];
  locations: LocationItem[];
  style?: string;
  renderQuality?: string;
  usePaidApi?: boolean;
  isRegenerating?: boolean;
  onSave: (updatedPanel: Partial<ComicPanelData>) => void;
  onRegenerateThisPanel?: (updatedPanel: Partial<ComicPanelData>) => Promise<void>;
  onOpenFullscreen?: (imageUrl: string) => void;
}

export const COMPOSITION_PRESETS = [
  {
    id: "duo_faceoff",
    title: "İkili Karşılaşma (Sol & Sağ)",
    desc: "İki karakter karşılıklı sol ve sağ kanatta yüzleşir",
    apply: (charIds: string[]) => {
      const positions: Record<string, string> = {};
      if (charIds[0]) positions[charIds[0]] = "sol-on";
      if (charIds[1]) positions[charIds[1]] = "sag-on";
      if (charIds[2]) positions[charIds[2]] = "merkez-arka";
      return positions;
    }
  },
  {
    id: "hero_focus",
    title: "Kahraman Yakın Planı",
    desc: "Ana karakter merkezde, diğerleri arka planda destekler",
    apply: (charIds: string[]) => {
      const positions: Record<string, string> = {};
      if (charIds[0]) positions[charIds[0]] = "merkez-on";
      if (charIds[1]) positions[charIds[1]] = "sol-arka";
      if (charIds[2]) positions[charIds[2]] = "sag-arka";
      return positions;
    }
  },
  {
    id: "over_shoulder",
    title: "Omuz Üstü Bakış (Over-The-Shoulder)",
    desc: "Ön planda arkası dönük figür, odakta karşıdaki karakter",
    apply: (charIds: string[]) => {
      const positions: Record<string, string> = {};
      if (charIds[0]) positions[charIds[0]] = "sol-on";
      if (charIds[1]) positions[charIds[1]] = "sag-orta";
      if (charIds[2]) positions[charIds[2]] = "merkez-arka";
      return positions;
    }
  },
  {
    id: "trio_triangle",
    title: "Üçgen Grup Sahnesi (Trio)",
    desc: "Üç karakter paneli dengeli şekilde doldurur",
    apply: (charIds: string[]) => {
      const positions: Record<string, string> = {};
      if (charIds[0]) positions[charIds[0]] = "merkez-on";
      if (charIds[1]) positions[charIds[1]] = "sol-orta";
      if (charIds[2]) positions[charIds[2]] = "sag-orta";
      return positions;
    }
  }
];

export const SHOT_PROMPT_TAGS = [
  "Dinamik Yakın Çekim (Extreme Close-Up)",
  "Geniş Açı Çevre Planı (Wide Establishing Shot)",
  "Alttan Kahramanca Açı (Low Angle Hero Shot)",
  "Dramatik Ters Işık & Gölge (High Contrast Chiaroscuro)",
  "Hızlı Aksiyon & Hareket Çizgileri (Speed Lines & Kinetic Blur)",
  "Patlama & Toz Duman (Explosion & Debris)",
  "Detaylı Çizgi Roman Mürekkebi (Heavy Comic Inking)"
];

export const PanelEditorOverlay: React.FC<PanelEditorOverlayProps> = ({
  isOpen,
  onClose,
  pageIndex,
  panelIndex,
  panelData,
  cast,
  locations,
  style = "Modern Comic",
  renderQuality = "High",
  usePaidApi = false,
  isRegenerating = false,
  onSave,
  onRegenerateThisPanel,
  onOpenFullscreen
}) => {
  // Inpaint modal state
  const [isInpaintOpen, setIsInpaintOpen] = useState<boolean>(false);

  // Form State
  const [imagePrompt, setImagePrompt] = useState<string>(panelData.imagePrompt || "");
  const [dialogue, setDialogue] = useState<string>(panelData.dialogue || "");
  const [onomatopoeia, setOnomatopoeia] = useState<string>(panelData.onomatopoeia || "");
  const [selectedCharacterNames, setSelectedCharacterNames] = useState<string[]>(() => {
    if (Array.isArray(panelData.characterNames) && panelData.characterNames.length > 0) {
      return panelData.characterNames;
    }
    return cast.slice(0, 2).map(c => c.name);
  });

  // Character Slot Map: characterId -> slotId
  const [characterSlots, setCharacterSlots] = useState<Record<string, string>>(() => {
    const initialSlots: Record<string, string> = {};
    const existingDirectorChars = panelData.directorConfig?.characters || [];

    cast.forEach((c, idx) => {
      const foundInDirector = existingDirectorChars.find(dc => dc.characterId === c.id || dc.characterName === c.name);
      if (foundInDirector?.positionSlot) {
        initialSlots[c.id] = foundInDirector.positionSlot;
      } else {
        const defaultSlotOrder = ["sol-on", "sag-on", "merkez-on", "sol-orta", "sag-orta"];
        initialSlots[c.id] = defaultSlotOrder[idx % defaultSlotOrder.length];
      }
    });

    return initialSlots;
  });

  // Character Poses: characterId -> poseId
  const [characterPoses, setCharacterPoses] = useState<Record<string, string>>(() => {
    const initialPoses: Record<string, string> = {};
    const existingDirectorChars = panelData.directorConfig?.characters || [];
    cast.forEach(c => {
      const found = existingDirectorChars.find(dc => dc.characterId === c.id || dc.characterName === c.name);
      initialPoses[c.id] = found?.poseId || "action_ready";
    });
    return initialPoses;
  });

  // Character Emotions: characterId -> emotionId
  const [characterEmotions, setCharacterEmotions] = useState<Record<string, string>>(() => {
    const initialEmotions: Record<string, string> = {};
    const existingDirectorChars = panelData.directorConfig?.characters || [];
    cast.forEach(c => {
      const found = existingDirectorChars.find(dc => dc.characterId === c.id || dc.characterName === c.name);
      initialEmotions[c.id] = found?.emotionId || "determined";
    });
    return initialEmotions;
  });

  // Character Custom Action: characterId -> customDirection string
  const [characterCustomActions, setCharacterCustomActions] = useState<Record<string, string>>(() => {
    const initialActions: Record<string, string> = {};
    const existingDirectorChars = panelData.directorConfig?.characters || [];
    cast.forEach(c => {
      const found = existingDirectorChars.find(dc => dc.characterId === c.id || dc.characterName === c.name);
      if (found?.customDirection) {
        initialActions[c.id] = found.customDirection;
      }
    });
    return initialActions;
  });

  // Active Tab inside Editor
  const [activeTab, setActiveTab] = useState<"prompt" | "staging" | "characters" | "dialogue">("prompt");
  const [activeCharacterIdForPlacement, setActiveCharacterIdForPlacement] = useState<string>(
    cast[0]?.id || ""
  );
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // PG-18 & Blur & Camera Angle & Modesty Concealment states
  const [isMature, setIsMature] = useState<boolean>(Boolean(panelData.isMature));
  const [isBlurred, setIsBlurred] = useState<boolean>(Boolean(panelData.isBlurred));
  const [selectedAngle, setSelectedAngle] = useState<string | undefined>(panelData.cameraAngle || panelData.directorConfig?.cameraAngle);
  const [selectedModesty, setSelectedModesty] = useState<string | undefined>(panelData.modestyConcealment || "sheets");

  // Mobile View Mode: 'editor' (spacious editor, image collapsed), 'compact' (small preview + editor), 'preview' (large image focus)
  const [mobileViewMode, setMobileViewMode] = useState<"editor" | "compact" | "preview">(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      return "editor";
    }
    return "compact";
  });

  // Sync state when panelData changes
  React.useEffect(() => {
    if (isOpen) {
      setImagePrompt(panelData.imagePrompt || "");
      setDialogue(panelData.dialogue || "");
      setOnomatopoeia(panelData.onomatopoeia || "");
      setIsMature(Boolean(panelData.isMature));
      setIsBlurred(Boolean(panelData.isBlurred));
      setSelectedAngle(panelData.cameraAngle || panelData.directorConfig?.cameraAngle);
      setSelectedModesty(panelData.modestyConcealment || "sheets");
      setSelectedCharacterNames(
        Array.isArray(panelData.characterNames) && panelData.characterNames.length > 0
          ? panelData.characterNames
          : cast.slice(0, 1).map(c => c.name)
      );

      const initialSlots: Record<string, string> = {};
      const initialPoses: Record<string, string> = {};
      const initialEmotions: Record<string, string> = {};
      const initialActions: Record<string, string> = {};
      const existingDirectorChars = panelData.directorConfig?.characters || [];

      cast.forEach((c, idx) => {
        const found = existingDirectorChars.find(dc => dc.characterId === c.id || dc.characterName === c.name);
        if (found?.positionSlot) {
          initialSlots[c.id] = found.positionSlot;
        } else {
          const defaultSlotOrder = ["sol-on", "sag-on", "merkez-on", "sol-orta", "sag-orta"];
          initialSlots[c.id] = defaultSlotOrder[idx % defaultSlotOrder.length];
        }
        initialPoses[c.id] = found?.poseId || "action_ready";
        initialEmotions[c.id] = found?.emotionId || "determined";
        if (found?.customDirection) {
          initialActions[c.id] = found.customDirection;
        }
      });
      setCharacterSlots(initialSlots);
      setCharacterPoses(initialPoses);
      setCharacterEmotions(initialEmotions);
      setCharacterCustomActions(initialActions);
      setSaveSuccessNotice(null);
    }
  }, [isOpen, panelData, cast]);

  if (!isOpen) return null;

  // Selected Characters list objects
  const activeCastMembers = cast.filter(c => 
    selectedCharacterNames.some(name => name.toLowerCase() === c.name.toLowerCase())
  );

  // Excluded characters from this panel
  const excludedCastMembers = cast.filter(c => 
    !selectedCharacterNames.some(name => name.toLowerCase() === c.name.toLowerCase())
  );

  // Set single character as solo focus for this panel
  const handleSetSoloCharacter = (char: Character) => {
    setSelectedCharacterNames([char.name]);
    setSaveSuccessNotice(`Bu panel artık yalnızca "${char.name}" karakteri için ayarlandı.`);
    setTimeout(() => setSaveSuccessNotice(null), 2500);
  };

  // Replace prompt with character focus
  const handleUpdatePromptWithCharacter = (char: Character) => {
    const charDesc = char.styleSheet?.referencePrompt || char.visualManifest || char.description;
    const cleanOld = imagePrompt
      .replace(/Featuring [^,(]+(\([^)]+\))?/gi, "")
      .replace(/Focus on [^,(]+(\([^)]+\))?/gi, "")
      .trim();
    const newPrompt = `Featuring ${char.name} (${charDesc}). ${cleanOld}`.trim();
    setImagePrompt(newPrompt);
    setSelectedCharacterNames([char.name]);
    setSaveSuccessNotice(`Prompt "${char.name}" karakteri ile güncellendi!`);
    setTimeout(() => setSaveSuccessNotice(null), 2500);
  };

  // Build current updated panel payload
  const compileUpdatedPanel = (): Partial<ComicPanelData> => {
    // Build updated director config with exact character positions, poses, and emotions
    const updatedCharacterPoses: CharacterPoseSetting[] = activeCastMembers.map(c => {
      const slotId = characterSlots[c.id] || "merkez-on";
      const slotInfo = POSITION_SLOTS.find(s => s.id === slotId);
      const poseId = characterPoses[c.id] || "action_ready";
      const poseObj = POSE_PRESETS.find(p => p.id === poseId);
      const emotionId = characterEmotions[c.id] || "determined";
      const emotionObj = EMOTION_PRESETS.find(e => e.id === emotionId);
      const customAction = characterCustomActions[c.id] || "";

      return {
        characterId: c.id,
        characterName: c.name,
        emotionId: emotionId,
        emotionLabel: emotionObj ? emotionObj.label : emotionId,
        intensity: "medium",
        poseId: poseId,
        poseLabel: poseObj ? poseObj.label : poseId,
        customDirection: customAction || undefined,
        positionSlot: slotId,
        positionLabel: slotInfo ? `${slotInfo.label} (${slotInfo.enLabel})` : slotId
      };
    });

    const compositionSummary = activeCastMembers
      .map(c => {
        const slot = POSITION_SLOTS.find(s => s.id === characterSlots[c.id]);
        const poseObj = POSE_PRESETS.find(p => p.id === (characterPoses[c.id] || "action_ready"));
        return `${c.name}: ${slot?.label || "Merkez"} (${poseObj?.label || "Hazır"})`;
      })
      .join(", ");

    const updatedDirectorConfig: PanelDirectorConfig = {
      ...(panelData.directorConfig || { characters: [] }),
      characters: updatedCharacterPoses,
      compositionLayout: compositionSummary ? `Staging Layout: ${compositionSummary}` : undefined
    };

    // Construct clean prompt with spatial staging embedded
    let finalPrompt = imagePrompt.trim();
    const stagingNotes = activeCastMembers.map(c => {
      const slot = POSITION_SLOTS.find(s => s.id === characterSlots[c.id]);
      const pose = POSE_PRESETS.find(p => p.id === (characterPoses[c.id] || "action_ready"));
      const emotion = EMOTION_PRESETS.find(e => e.id === (characterEmotions[c.id] || "determined"));
      const custom = characterCustomActions[c.id];
      const details = [
        `positioned in ${slot?.enLabel || "center foreground"}`,
        `in pose: ${pose?.enDesc || "ready"}`,
        `with facial expression: ${emotion?.enDesc || "focused"}`
      ];
      if (custom) details.push(`acting: ${custom}`);
      return `${c.name} (${details.join(", ")})`;
    }).join(" | ");

    if (stagingNotes) {
      const cleanOld = finalPrompt.replace(/\[Spatial Staging:[^\]]*\]/gi, "").trim();
      finalPrompt = `${cleanOld} [Spatial Staging: ${stagingNotes}.]`.trim();
    }

    const updatedStyleSheetRefs = activeCastMembers.map(c => ({
      characterId: c.id,
      characterName: c.name,
      referencePrompt: c.styleSheet?.referencePrompt || c.visualManifest || c.description
    }));

    return {
      imagePrompt: finalPrompt,
      dialogue: dialogue.trim(),
      onomatopoeia: onomatopoeia.trim(),
      characterNames: selectedCharacterNames,
      directorConfig: {
        ...updatedDirectorConfig,
        cameraAngle: selectedAngle || updatedDirectorConfig.cameraAngle
      },
      characterStyleSheetRefs: updatedStyleSheetRefs,
      isMature,
      isBlurred,
      cameraAngle: selectedAngle,
      modestyConcealment: selectedModesty as any
    };
  };

  // 1. Manual Save without re-generation
  const handleSaveWithoutRegenerate = () => {
    const updated = compileUpdatedPanel();
    onSave(updated);
    setSaveSuccessNotice("Panel başarıyla kaydedildi! Tüm çizgi roman korunarak yalnızca bu panel güncellendi.");
    setTimeout(() => {
      setSaveSuccessNotice(null);
      onClose();
    }, 900);
  };

  // 2. Regenerate ONLY this panel
  const handleRegenerateThisPanelClick = async () => {
    const updated = compileUpdatedPanel();
    onSave(updated);
    if (onRegenerateThisPanel) {
      await onRegenerateThisPanel(updated);
    }
  };

  // Toggle character in panel
  const handleToggleCharacter = (charName: string) => {
    setSelectedCharacterNames(prev => {
      const exists = prev.some(n => n.toLowerCase() === charName.toLowerCase());
      if (exists) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter(n => n.toLowerCase() !== charName.toLowerCase());
      } else {
        return [...prev, charName];
      }
    });
  };

  // Assign slot to character
  const handleAssignSlot = (characterId: string, slotId: string) => {
    setCharacterSlots(prev => ({
      ...prev,
      [characterId]: slotId
    }));
  };

  // Apply composition preset
  const handleApplyPreset = (preset: typeof COMPOSITION_PRESETS[0]) => {
    const charIds = activeCastMembers.map(c => c.id);
    const newPositions = preset.apply(charIds);
    setCharacterSlots(prev => ({
      ...prev,
      ...newPositions
    }));
    setSaveSuccessNotice(`"${preset.title}" sahne düzeni uygulandı!`);
    setTimeout(() => setSaveSuccessNotice(null), 2000);
  };

  // Sync positions to image prompt
  const handleSyncPositionsToPrompt = () => {
    const stagingNotes = activeCastMembers.map(c => {
      const slot = POSITION_SLOTS.find(s => s.id === characterSlots[c.id]);
      const pose = POSE_PRESETS.find(p => p.id === (characterPoses[c.id] || "action_ready"));
      const emotion = EMOTION_PRESETS.find(e => e.id === (characterEmotions[c.id] || "determined"));
      const custom = characterCustomActions[c.id];
      const details = [
        `positioned in the ${slot?.enLabel || "center foreground"}`,
        `in pose: ${pose?.enDesc || "ready"}`,
        `with facial expression: ${emotion?.enDesc || "focused"}`
      ];
      if (custom) details.push(`acting: ${custom}`);
      return `${c.name} (${details.join(", ")})`;
    }).join(" | ");

    if (stagingNotes) {
      const cleanPrompt = imagePrompt.replace(/\[Spatial Staging:[^\]]*\]/gi, "").trim();
      const updatedPrompt = `${cleanPrompt} [Spatial Staging: ${stagingNotes}.]`.trim();
      setImagePrompt(updatedPrompt);
      setSaveSuccessNotice("Pozisyonlar, duruşlar ve duygular görsel prompta başarıyla işlendi!");
      setTimeout(() => setSaveSuccessNotice(null), 2500);
    }
  };

  // Append shot tag to prompt
  const handleAppendShotTag = (tag: string) => {
    setImagePrompt(prev => {
      const trimmed = prev.trim();
      if (trimmed.toLowerCase().includes(tag.toLowerCase())) return trimmed;
      return trimmed ? `${trimmed}, ${tag}` : tag;
    });
  };

  // Append character visual guide to prompt
  const handleAppendCharacterGuide = (char: Character) => {
    const guide = char.styleSheet?.referencePrompt || char.visualManifest || char.description;
    if (guide) {
      setImagePrompt(prev => {
        const textToAppend = ` ${char.name} features: ${guide}.`;
        if (prev.includes(guide)) return prev;
        return prev.trim() + textToAppend;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-5xl bg-slate-900 border-2 sm:border-4 border-black shadow-comic-xl flex flex-col h-[98dvh] sm:h-auto sm:max-h-[94vh] overflow-hidden text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-yellow-400 border-b-4 border-black px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-black text-yellow-400 border-2 border-black flex items-center justify-center font-display text-base sm:text-lg -rotate-6 shadow-sm shrink-0">
              P{panelIndex + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-xl text-black uppercase tracking-wide">
                  Panel Editörü
                </h3>
                <span className="bg-black text-white text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider font-bold">
                  S{pageIndex + 1} / P{panelIndex + 1}
                </span>
              </div>
              <p className="text-black/80 text-[11px] sm:text-xs font-mono font-medium hidden sm:block">
                Tüm çizgi romanı bozmadan bu panelin prompt, diyalog ve karakter yerleşimini özelleştirin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 bg-black hover:bg-red-600 text-white flex items-center justify-center border-2 border-black transition-colors shrink-0"
            title="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mobile View Switcher Tabs (Only visible on screens < lg) */}
        <div className="lg:hidden bg-slate-950 px-2 py-1.5 border-b-2 border-black flex items-center justify-between gap-1 flex-shrink-0">
          <div className="flex items-center gap-1 w-full bg-slate-900 p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setMobileViewMode("editor")}
              className={cn(
                "flex-1 py-1.5 px-2 text-[11px] font-display uppercase tracking-wider flex items-center justify-center gap-1 transition-all",
                mobileViewMode === "editor"
                  ? "bg-yellow-400 text-black font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              )}
              title="Yazı ve düzenleme alanını tam ekran yapar"
            >
              <Sliders size={12} />
              <span>Düzenleme (Geniş)</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileViewMode("compact")}
              className={cn(
                "flex-1 py-1.5 px-2 text-[11px] font-display uppercase tracking-wider flex items-center justify-center gap-1 transition-all",
                mobileViewMode === "compact"
                  ? "bg-yellow-400 text-black font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              )}
              title="Küçük görsel ile düzenleme alanını birlikte gösterir"
            >
              <Grid size={12} />
              <span>Kompakt Görsel</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileViewMode("preview")}
              className={cn(
                "flex-1 py-1.5 px-2 text-[11px] font-display uppercase tracking-wider flex items-center justify-center gap-1 transition-all",
                mobileViewMode === "preview"
                  ? "bg-yellow-400 text-black font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              )}
              title="Büyük görsel önizlemesine odaklanır"
            >
              <Eye size={12} />
              <span>Görsel Odak</span>
            </button>
          </div>
        </div>

        {/* Success / Status Banner */}
        <AnimatePresence>
          {saveSuccessNotice && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-500 text-black px-4 py-2 text-xs font-mono font-bold flex items-center gap-2 border-b-2 border-black"
            >
              <Check size={16} />
              <span>{saveSuccessNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content: Split View (Left: Live Panel Preview, Right: Editor Tabs) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0 divide-y lg:divide-y-0 lg:divide-x-4 divide-black">
          
          {/* LEFT: Live Panel Preview Card (5 Cols on desktop, adaptive on mobile) */}
          <div 
            className={cn(
              "lg:col-span-5 bg-slate-950 flex flex-col justify-between overflow-y-auto space-y-3 transition-all",
              mobileViewMode === "editor" ? "hidden lg:flex p-4 sm:p-5" : "flex",
              mobileViewMode === "compact" ? "p-2.5 sm:p-4 max-h-[28vh] sm:max-h-[35vh] lg:max-h-none border-b-2 lg:border-b-0 border-black" : "",
              mobileViewMode === "preview" ? "p-3 sm:p-5 max-h-[60vh] lg:max-h-none border-b-2 lg:border-b-0 border-black" : ""
            )}
          >
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-yellow-400 uppercase flex items-center gap-1.5">
                  <Eye size={14} /> Canlı Panel Görünümü
                </span>
                <div className="flex items-center gap-2">
                  {/* Quick Collapse to Editor Button on Mobile */}
                  <button
                    type="button"
                    onClick={() => setMobileViewMode("editor")}
                    className="lg:hidden text-[10px] font-mono text-yellow-400 hover:underline flex items-center gap-0.5"
                    title="Görseli simge durumuna küçülterek düzenleme alanını büyüt"
                  >
                    <span>Editörü Büyüt</span> &rarr;
                  </button>
                  {panelData.imageUrl && onOpenFullscreen && (
                    <button
                      type="button"
                      onClick={() => onOpenFullscreen(panelData.imageUrl || "")}
                      className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Maximize2 size={12} /> Tam Ekran
                    </button>
                  )}
                </div>
              </div>

              {/* Panel Simulated Frame with Speech Balloon and Placement Markers */}
              <div 
                className={cn(
                  "relative w-full bg-slate-900 border-2 sm:border-4 border-black overflow-hidden shadow-comic group/stage flex items-center justify-center",
                  mobileViewMode === "compact"
                    ? "h-28 sm:h-36 lg:h-auto lg:aspect-square"
                    : "aspect-square"
                )}
              >
                {panelData.imageUrl ? (
                  <img 
                    src={panelData.imageUrl} 
                    alt={`Panel ${panelIndex + 1}`}
                    className={cn(
                      "w-full h-full",
                      mobileViewMode === "compact" ? "object-contain lg:object-cover" : "object-cover"
                    )}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 text-center bg-slate-800/80 bg-halftone">
                    <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-600 mb-1 sm:mb-2" />
                    <span className="text-[11px] sm:text-xs font-mono text-slate-400">Panel henüz çizilmedi veya taslak halinde</span>
                  </div>
                )}
                {/* Onomatopoeia Preview */}
                {onomatopoeia && (
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 pointer-events-none z-30">
                    <span className="font-display text-xl sm:text-3xl text-red-500 text-outline uppercase tracking-tighter drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] -skew-x-12">
                      {onomatopoeia}
                    </span>
                  </div>
                )}

                {/* Dynamic Dialogue Balloon Preview */}
                {dialogue && (
                  <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 z-30 pointer-events-none flex justify-center">
                    <div className="relative bg-white border-2 border-black px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-comic max-w-[94%] sm:max-w-[92%]">
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-black rotate-45" />
                      <p className="font-comic text-[10px] sm:text-xs font-bold text-black uppercase leading-tight text-center line-clamp-2 sm:line-clamp-none">
                        {dialogue}
                      </p>
                    </div>
                  </div>
                )}

                {/* Loading Indicator */}
                {isRegenerating && (
                  <div className="absolute inset-0 bg-black/75 z-40 flex flex-col items-center justify-center gap-2">
                    <RefreshCw size={28} className="text-yellow-400 animate-spin" />
                    <span className="text-xs font-display uppercase text-white tracking-widest">
                      Bu Panel Çiziliyor...
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="bg-slate-900 border-2 border-black p-2 sm:p-3 space-y-1 sm:space-y-2 text-[11px] font-mono">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Paneldeki Karakterler:</span>
                <span className="text-yellow-400 font-bold truncate ml-2">{selectedCharacterNames.join(", ") || "Yok"}</span>
              </div>
            </div>

            {/* Quick Inpaint / Retouch & Restore Actions */}
            <div className="space-y-1.5 sm:space-y-2">
              {panelData.imageUrl && (
                <button
                  type="button"
                  onClick={() => setIsInpaintOpen(true)}
                  className="w-full py-1.5 sm:py-2 px-3 bg-red-600 hover:bg-red-500 text-white border-2 border-black text-[11px] sm:text-xs font-display uppercase font-bold tracking-wider shadow-comic active:scale-95 transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                >
                  <Paintbrush size={14} />
                  <span>Sihirli Fırça & Bölgesel Rötuş</span>
                </button>
              )}

              {/* Restore Previous/Original Drawing Button */}
              {((panelData.editHistory && panelData.editHistory.length > 0) || (panelData.originalImageUrl && panelData.originalImageUrl !== panelData.imageUrl)) && (
                <button
                  type="button"
                  onClick={() => {
                    const history = panelData.editHistory || [];
                    if (history.length > 0) {
                      const prevImg = history[history.length - 1];
                      const updatedHistory = history.slice(0, -1);
                      onSave({
                        imageUrl: prevImg,
                        editHistory: updatedHistory
                      });
                      setSaveSuccessNotice("Önceki çizime başarıyla geri dönüldü!");
                      setTimeout(() => setSaveSuccessNotice(null), 1500);
                    } else if (panelData.originalImageUrl) {
                      onSave({
                        imageUrl: panelData.originalImageUrl
                      });
                      setSaveSuccessNotice("Orijinal çizime geri dönüldü!");
                      setTimeout(() => setSaveSuccessNotice(null), 1500);
                    }
                  }}
                  className="w-full py-1.5 sm:py-2 px-3 bg-slate-800 hover:bg-slate-700 text-yellow-300 border-2 border-black text-[11px] sm:text-xs font-display uppercase font-bold tracking-wider shadow-comic active:scale-95 transition-all flex items-center justify-center gap-1.5 sm:gap-2"
                  title="Tekrar çizdirdiğiniz yeri veya düzenlemeyi bir önceki haline geri getir"
                >
                  <Undo2 size={14} className="text-yellow-400" />
                  <span>Önceki Çizimi Geri Getir ({panelData.editHistory?.length || 1} Geçmiş)</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Main Editor Controls (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col overflow-hidden bg-slate-900">
            
            {/* Mobile Mini-Strip when Image is Collapsed (Only on mobile when in 'editor' mode) */}
            {mobileViewMode === "editor" && (
              <div className="lg:hidden flex items-center justify-between px-3 py-1.5 bg-slate-950 border-b border-black text-xs font-mono flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  {panelData.imageUrl ? (
                    <img 
                      src={panelData.imageUrl} 
                      alt={`P${panelIndex + 1}`} 
                      className="w-7 h-7 rounded object-cover border border-black shrink-0" 
                    />
                  ) : (
                    <div className="w-7 h-7 bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-yellow-400 font-bold shrink-0">
                      P{panelIndex + 1}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-yellow-400 font-bold block text-[11px] truncate">
                      Panel {panelIndex + 1} • <span className="text-slate-300 font-normal">{selectedCharacterNames.join(", ") || "Solo"}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {panelData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setIsInpaintOpen(true)}
                      className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-display uppercase border border-black flex items-center gap-1"
                      title="Sihirli fırça ile bölgesel rötuş yap"
                    >
                      <Paintbrush size={11} /> <span>Rötuş</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMobileViewMode("compact")}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-yellow-400 text-[10px] font-display uppercase border border-slate-700 flex items-center gap-1"
                    title="Görseli göster"
                  >
                    <Eye size={11} /> <span>Görseli Aç</span>
                  </button>
                </div>
              </div>
            )}

            {/* Editor Navigation Tabs */}
            <div className="flex border-b-2 border-black bg-slate-950 p-1 sm:p-1.5 gap-1 sm:gap-1.5 flex-shrink-0 overflow-x-auto no-scrollbar">

              <button
                type="button"
                onClick={() => setActiveTab("prompt")}
                className={cn(
                  "flex-1 shrink-0 py-2 px-2 text-xs font-display uppercase tracking-wider flex items-center justify-center gap-1 border-2 transition-all whitespace-nowrap",
                  activeTab === "prompt"
                    ? "bg-yellow-400 text-black border-black font-bold shadow-comic-sm"
                    : "bg-slate-900 text-slate-400 border-transparent hover:text-white"
                )}
              >
                <ImageIcon size={13} /> <span className="hidden sm:inline">Görsel</span> Prompt
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("staging")}
                className={cn(
                  "flex-1 shrink-0 py-2 px-2 text-xs font-display uppercase tracking-wider flex items-center justify-center gap-1 border-2 transition-all whitespace-nowrap",
                  activeTab === "staging"
                    ? "bg-yellow-400 text-black border-black font-bold shadow-comic-sm"
                    : "bg-slate-900 text-slate-400 border-transparent hover:text-white"
                )}
              >
                <Sliders size={13} /> <span>🎬 Pozisyon</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("characters")}
                className={cn(
                  "flex-1 shrink-0 py-2 px-2 text-xs font-display uppercase tracking-wider flex items-center justify-center gap-1 border-2 transition-all whitespace-nowrap",
                  activeTab === "characters"
                    ? "bg-yellow-400 text-black border-black font-bold shadow-comic-sm"
                    : "bg-slate-900 text-slate-400 border-transparent hover:text-white"
                )}
              >
                <Users size={13} /> <span>Karakterler ({selectedCharacterNames.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("dialogue")}
                className={cn(
                  "flex-1 shrink-0 py-2 px-2 text-xs font-display uppercase tracking-wider flex items-center justify-center gap-1 border-2 transition-all whitespace-nowrap",
                  activeTab === "dialogue"
                    ? "bg-yellow-400 text-black border-black font-bold shadow-comic-sm"
                    : "bg-slate-900 text-slate-400 border-transparent hover:text-white"
                )}
              >
                <MessageSquare size={13} /> <span>Diyalog</span>
              </button>
            </div>

            {/* TAB CONTENTS (Scrollable area) */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 sm:space-y-5">
              {/* TAB 1: IMAGE PROMPT EDITOR */}
              {activeTab === "prompt" && (
                <div className="space-y-4">
                  {/* Quick Character Presence Chips in Prompt Tab */}
                  <div className="p-3 bg-slate-950 border-2 border-black space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-yellow-400 font-bold uppercase flex items-center gap-1.5">
                        <Users size={13} /> Bu Panelin Karakter(ler)i:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab("staging")}
                          className="text-[10px] font-mono text-yellow-400 hover:underline flex items-center gap-0.5"
                        >
                          🎬 Pozisyon & Duruş &rarr;
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("characters")}
                          className="text-[10px] font-mono text-slate-400 hover:text-yellow-400 underline flex items-center gap-0.5"
                        >
                          Karakterler &rarr;
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cast.map(c => {
                        const isPresent = selectedCharacterNames.some(cn => cn.toLowerCase() === c.name.toLowerCase());
                        return (
                          <div key={`prompt-chip-${c.id}`} className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleCharacter(c.name)}
                              className={cn(
                                "px-2.5 py-1 text-xs font-display uppercase border transition-all flex items-center gap-1.5",
                                isPresent
                                  ? "bg-emerald-600 text-white border-black font-bold shadow-xs"
                                  : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500"
                              )}
                              title={isPresent ? `${c.name} sahnede var (Tıklayarak çıkarın)` : `${c.name} sahnede yok (Tıklayarak ekleyin)`}
                            >
                              <span>{isPresent ? "✓" : "+"}</span>
                              <span>{c.name}</span>
                            </button>
                            {isPresent && cast.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleSetSoloCharacter(c)}
                                className="px-1.5 py-1 bg-slate-900 hover:bg-yellow-400 hover:text-black text-slate-400 border border-slate-700 text-[10px] font-mono uppercase"
                                title="Bu sahneyi sadece bu karakterin solo sahnesi yap"
                              >
                                Yalnızca {c.name}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {excludedCastMembers.length > 0 && (
                      <p className="text-[10px] font-mono text-slate-400">
                        🚫 Hariç tutulan (çizilmeyecek): {excludedCastMembers.map(c => c.name).join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                        <ImageIcon size={14} className="text-yellow-400" /> Görsel Çizim Promptu (Image Prompt):
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">
                        {imagePrompt.length} karakter
                      </span>
                    </div>

                    <textarea
                      value={imagePrompt}
                      onChange={e => setImagePrompt(e.target.value)}
                      rows={4}
                      className="w-full p-2.5 sm:p-3 bg-slate-950 border-2 border-black text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition-colors resize-y leading-relaxed"
                      placeholder="Bu panelin sahne detaylarını, kamera açısını ve eylemini tanımlayın..."
                    />
                  </div>

                  {/* Character Reference Anchors */}
                  {activeCastMembers.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-mono text-slate-400 uppercase block">
                        Karakter Görsel Kılavuzunu Enjekte Et (Referans Çıpası):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeCastMembers.map((c, cIdx) => (
                          <button
                            key={`inject-${c.id || c.name || cIdx}-${cIdx}`}
                            type="button"
                            onClick={() => handleAppendCharacterGuide(c)}
                            className="px-2.5 py-1 bg-slate-950 hover:bg-purple-600 hover:text-white text-purple-300 border border-purple-500/40 text-[10px] font-mono transition-colors flex items-center gap-1"
                            title="Karakterin tescilli kıyafet ve yüz manifestini prompta ekler"
                          >
                            <Sparkles size={11} /> + {c.name} Görsel Manifesti
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Comic Shot Tags */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-slate-400 uppercase block">
                      Hızlı Kamera & Atmosfer Etiketleri:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {SHOT_PROMPT_TAGS.map((tag, tIdx) => (
                        <button
                          key={`shot-tag-${tIdx}-${tag.slice(0, 15)}`}
                          type="button"
                          onClick={() => handleAppendShotTag(tag)}
                          className="px-2 py-1 bg-slate-950 hover:bg-yellow-400 hover:text-black text-slate-300 border border-slate-700 text-[10px] font-mono transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PG-18 & Blur Shield Controls */}
                  <div className="p-3 bg-slate-950 border-2 border-red-950/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-red-400 font-bold uppercase flex items-center gap-1.5">
                        <Flame size={14} className="text-red-500 fill-red-500" /> 🔞 PG-18 & Hassas İçerik Filtresi
                      </span>
                      <span className={cn(
                        "text-[9px] font-mono px-1.5 py-0.5 border font-bold uppercase",
                        isMature ? "bg-red-950 text-red-300 border-red-500" : "bg-slate-900 text-slate-400 border-slate-700"
                      )}>
                        {isMature ? "18+ AKTİF" : "STANDART"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label 
                        onClick={() => setIsMature(prev => !prev)}
                        className="flex items-center justify-between p-2 bg-slate-900/90 border border-slate-800 hover:border-slate-600 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Flame size={14} className={isMature ? "text-red-400 fill-red-400" : "text-slate-500"} />
                          <div>
                            <div className="text-[11px] font-bold text-white uppercase font-display">
                              Bu paneli PG-18 / Hassas İçerik olarak işaretle
                            </div>
                            <p className="text-[9px] text-slate-400">
                              Yetişkin romantizmi, yatak veya yoğun tansiyonlu sahne.
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isMature}
                          onChange={() => {}}
                          className="accent-red-500 w-4 h-4 cursor-pointer pointer-events-none"
                        />
                      </label>

                      <label 
                        onClick={() => setIsBlurred(prev => !prev)}
                        className="flex items-center justify-between p-2 bg-slate-900/90 border border-slate-800 hover:border-slate-600 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isBlurred ? <EyeOff size={14} className="text-red-400" /> : <Eye size={14} className="text-slate-500" />}
                          <div>
                            <div className="text-[11px] font-bold text-white uppercase font-display flex items-center gap-1.5">
                              <span>Buzlu Cam (Blur) Sansür Kalkanı</span>
                              <span className="text-[9px] text-yellow-400 font-mono">Tıkla-Gör</span>
                            </div>
                            <p className="text-[9px] text-slate-400">
                              Görsel blurlu olarak gizlenir; kullanıcı üzerine dokunarak açabilir.
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isBlurred}
                          onChange={() => {}}
                          className="accent-red-500 w-4 h-4 cursor-pointer pointer-events-none"
                        />
                      </label>
                    </div>

                    <div className="p-2 bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span className="text-yellow-400">✨</span>
                      <span>Sinematik kamera açıları ve çıplaklığı kapatan saten örtü/buhar efektleri prompta göre otomatik çizilir.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STAGING & DIRECTOR TAB (Pozisyon & Duruş) */}
              {activeTab === "staging" && (
                <div className="space-y-5">
                  {/* Explanatory Help Card */}
                  <div className="p-3 bg-indigo-950/70 border-2 border-indigo-500/60 space-y-1 text-slate-200">
                    <div className="flex items-center gap-2 text-xs font-display uppercase tracking-wider text-yellow-300 font-bold">
                      <Sliders size={15} /> Sahne Yönetmeni: Konum, Duruş & Yüz İfadesi
                    </div>
                    <p className="text-[11px] font-mono leading-relaxed text-slate-300">
                      Karakterlerin kadrajın neresinde duracağını (Sol Ön, Sağ Ön, Merkez), hangi pozisyonda olacağını (Oturma, Ayakta Kararlı, Koşma vb.) ve yüz ifadesini belirleyin.
                    </p>
                  </div>

                  {/* Character Selector for Stage Assignment */}
                  {activeCastMembers.length > 1 && (
                    <div className="p-2.5 bg-slate-950 border-2 border-black space-y-1.5">
                      <span className="text-[11px] font-mono text-slate-400 uppercase block font-bold">
                        Aşağıdaki 3x3 Grid&apos;e Yerleştirilecek Karakteri Seçin:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeCastMembers.map(c => {
                          const isSelectedForPlacement = activeCharacterIdForPlacement === c.id;
                          return (
                            <button
                              key={`placement-char-${c.id}`}
                              type="button"
                              onClick={() => setActiveCharacterIdForPlacement(c.id)}
                              className={cn(
                                "px-3 py-1.5 text-xs font-display uppercase border-2 flex items-center gap-1.5 transition-all font-bold",
                                isSelectedForPlacement
                                  ? "bg-yellow-400 text-black border-black shadow-comic-sm"
                                  : "bg-slate-900 text-slate-300 border-slate-700 hover:text-white"
                              )}
                            >
                              <span>👤</span>
                              <span>{c.name}</span>
                              {isSelectedForPlacement && <Check size={12} className="text-black" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3x3 Interactive Comic Staging Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-bold text-yellow-400 uppercase flex items-center gap-1.5">
                        <Grid size={14} /> 3x3 Çizgi Roman Sahne Izgarası (Spatial Grid)
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">
                        Hücreye tıklayarak aktif karakteri yerleştirin
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-black border-4 border-black p-3 shadow-comic">
                      {/* Row 0: Background */}
                      {POSITION_SLOTS.map(slot => {
                        const charsInSlot = activeCastMembers.filter(c => characterSlots[c.id] === slot.id);
                        const isSlotOccupied = charsInSlot.length > 0;
                        const targetCharId = activeCharacterIdForPlacement || activeCastMembers[0]?.id;

                        return (
                          <button
                            key={`grid-slot-${slot.id}`}
                            type="button"
                            onClick={() => {
                              if (targetCharId) {
                                handleAssignSlot(targetCharId, slot.id);
                                setSaveSuccessNotice(`Karakter ${slot.label} konumuna yerleştirildi.`);
                                setTimeout(() => setSaveSuccessNotice(null), 1500);
                              }
                            }}
                            className={cn(
                              "p-2 min-h-[75px] border-2 transition-all flex flex-col justify-between text-left relative group",
                              isSlotOccupied
                                ? "bg-slate-900 border-yellow-400 shadow-xs"
                                : "bg-slate-950 border-slate-800 hover:border-slate-600 hover:bg-slate-900/60"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">
                                {slot.tag}
                              </span>
                              <span className="text-[8px] font-mono text-slate-600 group-hover:text-yellow-400">
                                {slot.id.includes("on") ? "Ön Plan" : slot.id.includes("orta") ? "Orta" : "Arka"}
                              </span>
                            </div>

                            {/* Characters currently in this slot */}
                            <div className="space-y-1 my-1">
                              {charsInSlot.map(c => (
                                <div
                                  key={`slot-char-${slot.id}-${c.id}`}
                                  className="flex items-center gap-1 bg-yellow-400 text-black px-1.5 py-0.5 text-[10px] font-display uppercase font-bold border border-black truncate shadow-xs"
                                >
                                  <span>👤</span>
                                  <span className="truncate">{c.name}</span>
                                </div>
                              ))}
                              {!isSlotOccupied && (
                                <span className="text-[10px] text-slate-700 italic block">Boş</span>
                              )}
                            </div>

                            <span className="text-[8px] font-mono text-slate-500 truncate block">
                              {slot.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Composition Quick Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-slate-400 uppercase block font-bold">
                      Hızlı Sahne Kompozisyonları:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {COMPOSITION_PRESETS.map(preset => (
                        <button
                          key={`preset-${preset.id}`}
                          type="button"
                          onClick={() => handleApplyPreset(preset)}
                          className="p-2 bg-slate-950 hover:bg-yellow-400 hover:text-black text-slate-300 border border-slate-700 text-left transition-all text-[10px] font-mono"
                          title={preset.desc}
                        >
                          <span className="font-bold block text-white group-hover:text-black">
                            {preset.title}
                          </span>
                          <span className="text-[9px] text-slate-400 block line-clamp-1">
                            {preset.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Pose, Emotion & Action Card per Character */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-yellow-400 uppercase flex items-center gap-1.5">
                        <Users size={14} /> Karakter Duruş ve İfade Ayarları
                      </span>
                    </div>

                    {activeCastMembers.map(c => {
                      const slotId = characterSlots[c.id] || "merkez-on";
                      const currentPoseId = characterPoses[c.id] || "action_ready";
                      const currentEmotionId = characterEmotions[c.id] || "determined";
                      const currentAction = characterCustomActions[c.id] || "";

                      return (
                        <div
                          key={`char-staging-card-${c.id}`}
                          className="p-3.5 bg-slate-950 border-2 border-slate-800 space-y-3"
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              {c.avatarUrl ? (
                                <img
                                  src={c.avatarUrl}
                                  alt={c.name}
                                  className="w-8 h-8 object-cover border border-black rounded"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-slate-800 flex items-center justify-center text-xs font-bold">
                                  {c.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <h4 className="font-display text-xs uppercase text-white font-bold">
                                  {c.name}
                                </h4>
                                <span className="text-[10px] font-mono text-yellow-400">
                                  Konum: {POSITION_SLOTS.find(s => s.id === slotId)?.label || slotId}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setActiveCharacterIdForPlacement(c.id)}
                              className="px-2 py-1 text-[10px] font-mono bg-slate-900 text-slate-300 hover:text-white border border-slate-700"
                            >
                              Izgarada Seç
                            </button>
                          </div>

                          {/* Controls Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {/* 1. Spatial Slot */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                                Kadrajdaki Yeri:
                              </label>
                              <select
                                value={slotId}
                                onChange={e => handleAssignSlot(c.id, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-yellow-300 p-1.5 text-xs font-mono focus:outline-none focus:border-yellow-400"
                              >
                                {POSITION_SLOTS.map(pos => (
                                  <option key={`pos-opt-${pos.id}`} value={pos.id}>
                                    {pos.label} ({pos.tag})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* 2. Pose / Action Preset */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                                Duruş & Eylem:
                              </label>
                              <select
                                value={currentPoseId}
                                onChange={e => {
                                  const val = e.target.value;
                                  setCharacterPoses(prev => ({ ...prev, [c.id]: val }));
                                }}
                                className="w-full bg-slate-900 border border-slate-700 text-yellow-300 p-1.5 text-xs font-mono focus:outline-none focus:border-yellow-400"
                              >
                                {POSE_PRESETS.map(pose => (
                                  <option key={`pose-opt-${pose.id}`} value={pose.id}>
                                    {pose.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* 3. Emotion / Facial Expression */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                                Yüz İfadesi & Duygu:
                              </label>
                              <select
                                value={currentEmotionId}
                                onChange={e => {
                                  const val = e.target.value;
                                  setCharacterEmotions(prev => ({ ...prev, [c.id]: val }));
                                }}
                                className="w-full bg-slate-900 border border-slate-700 text-yellow-300 p-1.5 text-xs font-mono focus:outline-none focus:border-yellow-400"
                              >
                                {EMOTION_PRESETS.map(emo => (
                                  <option key={`emo-opt-${emo.id}`} value={emo.id}>
                                    {emo.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Custom Action Detail Input */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-slate-400 uppercase block">
                              Özel Eylem & Detay Notu (Örn: masadaki evrakları inceliyor, elinde kahve fincanı tutuyor):
                            </label>
                            <input
                              type="text"
                              value={currentAction}
                              onChange={e => {
                                const val = e.target.value;
                                setCharacterCustomActions(prev => ({ ...prev, [c.id]: val }));
                              }}
                              placeholder="Örn: sol elinde sıcak kahve fincanı tutuyor..."
                              className="w-full p-2 bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-yellow-400"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Staging Sync & Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={handleSyncPositionsToPrompt}
                      className="flex-1 py-2.5 px-3 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black text-xs font-display uppercase font-bold tracking-wider shadow-comic active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles size={15} />
                      <span>🎯 Bu Pozisyon & Duruşları Prompta Eşle</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRegenerateThisPanelClick}
                      disabled={isRegenerating}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-black text-xs font-display uppercase font-bold tracking-wider shadow-comic active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isRegenerating ? "animate-spin" : ""} />
                      <span>⚡ Kaydet & Bu Pozisyonlarla Çiz</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: CHARACTERS & STAGING TAB */}
              {activeTab === "characters" && (
                <div className="space-y-4">
                  {/* Explanatory Help Card */}
                  <div className="p-3 bg-purple-950/60 border-2 border-purple-500/50 space-y-1 text-slate-200">
                    <div className="flex items-center gap-2 text-xs font-display uppercase tracking-wider text-yellow-300 font-bold">
                      <Sparkles size={15} /> Karakter & Sahne Birebir Eşleme
                    </div>
                    <p className="text-[11px] font-mono leading-relaxed text-slate-300">
                      Hikayenizde bu sayfa için hangi karakteri anlattıysanız, aşağıdan yalnızca o karakteri seçin. Yanlışlıkla başka bir karakter (örneğin A yerine B) görünüyorsa, B&apos;yi kaldırıp A&apos;yı seçin ve <strong className="text-yellow-300">&quot;Yalnızca Bu Paneli Çiz&quot;</strong> butonuna basın.
                    </p>
                  </div>

                  {/* Character Cards */}
                  <div className="space-y-3">
                    {cast.map(c => {
                      const isPresent = selectedCharacterNames.some(cn => cn.toLowerCase() === c.name.toLowerCase());
                      const slotId = characterSlots[c.id] || "merkez";
                      const slotObj = POSITION_SLOTS.find(s => s.id === slotId);

                      return (
                        <div
                          key={`char-setting-${c.id}`}
                          className={cn(
                            "p-3.5 border-2 transition-all space-y-3",
                            isPresent
                              ? "bg-slate-950 border-emerald-500/80 shadow-comic-sm"
                              : "bg-slate-950/40 border-slate-800 opacity-60 hover:opacity-90"
                          )}
                        >
                          {/* Character Card Header */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {c.avatarUrl ? (
                                <img
                                  src={c.avatarUrl}
                                  alt={c.name}
                                  className="w-11 h-11 object-cover border-2 border-black rounded shadow-xs flex-shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 bg-slate-800 border-2 border-black flex items-center justify-center text-slate-400 font-display text-lg flex-shrink-0">
                                  {c.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-display text-sm uppercase text-white font-bold tracking-wide">
                                    {c.name}
                                  </h4>
                                  <span
                                    className={cn(
                                      "text-[9px] font-mono px-1.5 py-0.5 font-bold uppercase border",
                                      isPresent
                                        ? "bg-emerald-950 text-emerald-300 border-emerald-500"
                                        : "bg-slate-900 text-slate-400 border-slate-700"
                                    )}
                                  >
                                    {isPresent ? "✓ Sahnede Var" : "✕ Sahnede Yok"}
                                  </span>
                                </div>
                                <p className="text-[11px] font-comic text-slate-400 line-clamp-1">
                                  {c.description}
                                </p>
                              </div>
                            </div>

                            {/* Presence Toggle Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleCharacter(c.name)}
                              className={cn(
                                "px-3 py-1.5 text-xs font-display uppercase border-2 transition-all flex items-center gap-1 font-bold",
                                isPresent
                                  ? "bg-red-950 hover:bg-red-900 text-red-300 border-red-700"
                                  : "bg-emerald-700 hover:bg-emerald-600 text-white border-black"
                              )}
                            >
                              {isPresent ? "Sahneden Çıkar" : "+ Sahneye Ekle"}
                            </button>
                          </div>

                          {/* Action Buttons for this Character */}
                          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800/80">
                            <button
                              type="button"
                              onClick={() => handleSetSoloCharacter(c)}
                              className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-black border border-black text-[11px] font-display uppercase font-bold flex items-center gap-1 shadow-xs transition-colors"
                              title="Bu paneli yalnızca bu karakterin solo sahnesi yapar ve diğer tüm karakterleri hariç tutar"
                            >
                              ⭐ Yalnızca {c.name} Sahnesi Yap
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdatePromptWithCharacter(c)}
                              className="px-2.5 py-1 bg-purple-900 hover:bg-purple-800 text-purple-200 border border-purple-500/50 text-[11px] font-mono flex items-center gap-1 transition-colors"
                              title="Prompt metnini bu karakterin görsel manifesti ile baştan hedefler"
                            >
                              ✍️ Promptu {c.name} ile Güncelle
                            </button>

                            {isPresent && (
                              <div className="ml-auto flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveCharacterIdForPlacement(c.id);
                                    setActiveTab("staging");
                                  }}
                                  className="px-2 py-1 bg-indigo-900/80 hover:bg-indigo-700 text-yellow-300 border border-indigo-500/50 text-[10px] font-mono flex items-center gap-1 transition-colors"
                                  title="Bu karakterin duruş, duygu ve konumunu Sahne Yönetmeni'nde ayarla"
                                >
                                  <Sliders size={11} /> 🎬 Duruş & Konumu Ayarla &rarr;
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary & Isolation Notice */}
                  <div className="p-3 bg-slate-950 border-2 border-black space-y-1 font-mono text-xs">
                    <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Check size={14} /> Panelde Çizilecek Karakterler: {activeCastMembers.map(c => c.name).join(", ") || "Belirtilmedi"}
                    </div>
                    {excludedCastMembers.length > 0 && (
                      <div className="text-red-400 flex items-center gap-1.5">
                        <X size={14} /> Kesinlikle Çizilmeyecek (Hariç Tutulacak): {excludedCastMembers.map(c => c.name).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: DIALOGUE & BALLOON EDITOR */}
              {activeTab === "dialogue" && (
                <div className="space-y-4">
                  {/* Dialogue Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-yellow-400" /> Konuşma Balonu Metni:
                    </label>
                    <textarea
                      value={dialogue}
                      onChange={e => setDialogue(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-slate-950 border-2 border-black text-sm font-comic font-bold text-slate-100 placeholder-slate-600 uppercase focus:outline-none focus:border-yellow-400 transition-colors resize-none leading-relaxed"
                      placeholder="DİYALOG METNİ YAZIN..."
                    />
                  </div>

                  {/* Onomatopoeia Sound Effect Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                      <Sparkles size={14} className="text-yellow-400" /> Aksiyon Ses Efekti (Onomatopoeia):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={onomatopoeia}
                        onChange={e => setOnomatopoeia(e.target.value.toUpperCase())}
                        className="flex-1 p-2.5 bg-slate-950 border-2 border-black text-xs font-display uppercase tracking-widest text-red-400 placeholder-slate-600 focus:outline-none focus:border-yellow-400"
                        placeholder="Örn: BAM!, ŞRAK!, GÜÜM!, TIK!"
                      />
                      <button
                        type="button"
                        onClick={() => setOnomatopoeia("")}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border-2 border-black text-xs font-mono"
                      >
                        Temizle
                      </button>
                    </div>

                    {/* Quick Sound Effect chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["BOOM!", "ŞRAAK!", "GÜÜM!", "ÇAT!", "ZIP!", "WHAM!", "KLİK!"].map((eff, effIdx) => (
                        <button
                          key={`eff-${effIdx}-${eff}`}
                          type="button"
                          onClick={() => setOnomatopoeia(eff)}
                          className="px-2 py-0.5 bg-slate-950 hover:bg-red-600 hover:text-white text-red-300 border border-red-500/40 text-[10px] font-display uppercase transition-colors"
                        >
                          {eff}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speaker quick tags */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-mono text-slate-400 uppercase block">
                      Konuşan Karakter İfadesi:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cast.map((c, cIdx) => (
                        <button
                          key={`speaker-${c.id || c.name || cIdx}-${cIdx}`}
                          type="button"
                          onClick={() => {
                            const prefix = `${c.name.toUpperCase()}: `;
                            if (!dialogue.startsWith(prefix)) {
                              setDialogue(`${prefix}${dialogue.replace(/^[A-ZÇĞİÖŞÜa-zçğıöşü\s]+:\s*/, "")}`);
                            }
                          }}
                          className="px-2.5 py-1 bg-slate-950 hover:bg-yellow-400 hover:text-black text-slate-300 border border-slate-700 text-[10px] font-mono transition-colors"
                        >
                          🗣️ {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Action Footer Bar */}
            <div className="p-2.5 sm:p-4 bg-slate-950 border-t-2 border-black flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
                <AlertCircle size={14} className="text-yellow-400 flex-shrink-0" />
                <span className="truncate">
                  Manuel düzenlemeler tüm çizgi romanı sıfırlamadan anında uygulanır.
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-2.5 sm:px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border-2 border-black text-xs font-display uppercase tracking-wider transition-colors text-center"
                >
                  Vazgeç
                </button>

                {/* Primary Button 1: Save Directly without re-generation */}
                <button
                  type="button"
                  onClick={handleSaveWithoutRegenerate}
                  className="flex-2 sm:flex-none px-3 sm:px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black text-xs font-display uppercase font-bold tracking-wider shadow-comic active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  title="Prompt, diyalog ve pozisyonları API çağırmadan anında kaydet"
                >
                  <Save size={15} /> <span>Kaydet</span>
                </button>

                {/* Primary Button 2: Re-generate ONLY this panel with the new parameters */}
                {onRegenerateThisPanel && (
                  <button
                    type="button"
                    onClick={handleRegenerateThisPanelClick}
                    disabled={isRegenerating}
                    className="flex-2 sm:flex-none px-2.5 sm:px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white border-2 border-black text-xs font-display uppercase font-bold tracking-wider shadow-comic active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    title="Yalnızca bu paneli yeni prompt ve pozisyonlarla AI ile yeniden çiz"
                  >
                    <RefreshCw size={14} className={cn(isRegenerating ? "animate-spin" : "")} />
                    <span>Paneli Çiz</span>
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Inpainting Modal Launched from Editor */}
      {isInpaintOpen && panelData && (
        <PanelInpaintModal
          isOpen={isInpaintOpen}
          onClose={() => setIsInpaintOpen(false)}
          pageIndex={pageIndex}
          panelIndex={panelIndex}
          panelData={panelData}
          cast={cast}
          style={style}
          renderQuality={renderQuality}
          usePaidApi={usePaidApi}
          onSaveUpdatedImage={(pIdx, newUrl, oldUrl) => {
            const history = panelData.editHistory || [];
            const updatedHistory = oldUrl ? [...history, oldUrl] : history;
            onSave({
              imageUrl: newUrl,
              originalImageUrl: panelData.originalImageUrl || oldUrl,
              editHistory: updatedHistory
            });
            setIsInpaintOpen(false);
          }}
        />
      )}
    </div>
  );
};
