import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Trash2, User, Play, Loader2, Sparkles, X, ChevronLeft, Zap, 
  Palette, Ghost, Info, Swords, Menu, Info as InfoIcon, RotateCcw,
  CreditCard, ShieldCheck, Check, Library, BookmarkPlus, BookmarkCheck, Search, Users, ExternalLink,
  MapPin, Compass, BookOpen, Brain, ShieldAlert, Sun, Lock, Layers, GitBranch, FileText, Shirt, Flame, Eye, EyeOff, Camera, Heart,
  KeyRound, UploadCloud, Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Character, CharacterOutfit, ComicConfig, GeneratorStatus, LocationItem, NarrativeContinuityMemory, POLLINATIONS_MODELS, COMIC_ART_STYLES } from "../types";
import { generateCharacterAvatar, generateCharacterFromImage, generateVisualManifest, generateCharacterStyleSheet, compileCharacterReferencePrompt, COLOR_PALETTES, LIGHTING_MOODS, setPollinationsModel, detectLocationsFromStory } from "../services/geminiService";
import { generateId, cn } from "../lib/utils";
import { DEFAULT_OUTFIT_PRESETS, getCharacterActiveOutfit } from "../lib/outfitPresets";
import { 
  saveCharacterToLibrary, 
  getLibraryCharacters, 
  deleteCharacterFromLibrary, 
  seedSampleCharacters,
  saveLocationToLibrary
} from "../lib/storage";
import { CharacterLibraryModal } from "./CharacterLibraryModal";
import { LocationLibraryModal } from "./LocationLibraryModal";
import { CharacterAvatarView, CharacterViewMode } from "./CharacterAvatarView";
import { CharacterPreviewModal } from "./CharacterPreviewModal";
import { CharacterStyleSheetModal } from "./CharacterStyleSheetModal";
import { CharacterOutfitModal } from "./CharacterOutfitModal";
import { NarrativeMemoryModal } from "./NarrativeMemoryModal";

interface SidebarProps {
  config: ComicConfig;
  setConfig: React.Dispatch<React.SetStateAction<ComicConfig>>;
  onGenerate: () => void;
  onAutoFill: () => void;
  status: GeneratorStatus;
  isOpen: boolean;
  onToggle: () => void;
  isAutoFilling?: boolean;
  onReset?: () => void;
  hasActiveProject?: boolean;
  pageCount?: number;
  onAnalyzeContinuity?: () => Promise<void>;
  isAnalyzingContinuity?: boolean;
  onOpenMemoryModal?: () => void;
  onOpenFlowModal?: () => void;
  onOpenPdfModal?: () => void;
  onOpenStoriesModal?: () => void;
  savedStoriesCount?: number;
  onOpenApiKeyModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  config,
  setConfig,
  onGenerate,
  onAutoFill,
  status,
  isOpen,
  onToggle,
  isAutoFilling = false,
  onReset,
  hasActiveProject = false,
  pageCount = 0,
  onAnalyzeContinuity,
  isAnalyzingContinuity = false,
  onOpenMemoryModal,
  onOpenFlowModal,
  onOpenPdfModal,
  onOpenStoriesModal,
  savedStoriesCount = 0,
  onOpenApiKeyModal,
}) => {
  const [activeTab, setActiveTab] = useState<"story" | "memory" | "cast" | "locations" | "style">("story");
  const [castSubTab, setCastSubTab] = useState<"cast" | "library">("cast");
  const [castViewMode, setCastViewMode] = useState<CharacterViewMode>("all");
  const [newCharName, setNewCharName] = useState("");
  const [newCharDesc, setNewCharDesc] = useState("");
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [previewCharInfo, setPreviewCharInfo] = useState<{ url: string; name: string; mode?: CharacterViewMode } | null>(null);

  // Image-to-Character states
  const [characterCreationMode, setCharacterCreationMode] = useState<"text" | "image">("text");
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [imageCharName, setImageCharName] = useState("");
  const [imageCharPrompt, setImageCharPrompt] = useState("");
  const [isGeneratingFromImage, setIsGeneratingFromImage] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  
  // Character Library states
  const [libraryCharacters, setLibraryCharacters] = useState<Character[]>([]);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isLocationLibraryOpen, setIsLocationLibraryOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [selectedStyleSheetChar, setSelectedStyleSheetChar] = useState<Character | null>(null);
  const [selectedOutfitChar, setSelectedOutfitChar] = useState<Character | null>(null);
  const [librarySearchQuery, setLibrarySearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshLibrary = async () => {
    try {
      const list = await getLibraryCharacters();
      setLibraryCharacters(list);
    } catch (e) {
      console.warn("Failed to load library characters:", e);
    }
  };

  useEffect(() => {
    refreshLibrary();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleSaveStyleSheet = async (updatedChar: Character) => {
    // 1. Update in active cast
    setConfig(prev => ({
      ...prev,
      cast: prev.cast.map(c => c.id === updatedChar.id ? updatedChar : c)
    }));

    // 2. Save to library
    await saveCharacterToLibrary(updatedChar);
    await refreshLibrary();
    showToast(`"${updatedChar.name}" Görsel Kılavuzu güncellendi ve kilitlendi!`);
  };

  const handleSaveOutfit = async (updatedChar: Character, newOutfit: CharacterOutfit) => {
    // 1. Update in active cast
    setConfig(prev => ({
      ...prev,
      cast: prev.cast.map(c => c.id === updatedChar.id ? updatedChar : c)
    }));

    // 2. Save to library
    await saveCharacterToLibrary(updatedChar);
    await refreshLibrary();
    showToast(`👗 ${updatedChar.name} için "${newOutfit.name}" kıyafeti seçildi!`);
  };

  const handleQuickSwitchOutfit = async (char: Character, presetOutfit: CharacterOutfit, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const prevSheet = char.styleSheet || {
      physicalTraits: char.description,
      accessories: "İkonik eşyalar ve nişanlar",
      colorPalette: presetOutfit.colorPalette || ["#1E293B", "#EAB308"],
      autoInject: true
    };

    const updatedSheet = {
      physicalTraits: prevSheet.physicalTraits || char.description,
      outfit: presetOutfit.description,
      accessories: prevSheet.accessories || "İkonik aksesuarlar",
      colorPalette: presetOutfit.colorPalette || prevSheet.colorPalette || ["#1E293B", "#EAB308"],
      referencePrompt: compileCharacterReferencePrompt(char.name, {
        physicalTraits: prevSheet.physicalTraits || char.description,
        outfit: presetOutfit.description,
        accessories: prevSheet.accessories || "İkonik aksesuarlar",
        colorPalette: presetOutfit.colorPalette || prevSheet.colorPalette
      }, char.description),
      autoInject: prevSheet.autoInject !== false,
      lastUpdated: Date.now()
    };

    const updatedChar: Character = {
      ...char,
      activeOutfitId: presetOutfit.id,
      styleSheet: updatedSheet,
      visualManifest: updatedSheet.referencePrompt
    };

    setConfig(prev => ({
      ...prev,
      cast: prev.cast.map(c => c.id === char.id ? updatedChar : c)
    }));

    await saveCharacterToLibrary(updatedChar);
    await refreshLibrary();
    showToast(`👗 ${char.name} kıyafeti "${presetOutfit.name}" olarak değiştirildi!`);
  };

  const handleToggleLocationInProject = (loc: LocationItem) => {
    const currentLocs = config.locations || [];
    const exists = currentLocs.some(l => l.id === loc.id || l.name.toLowerCase() === loc.name.toLowerCase());
    if (exists) {
      setConfig(prev => ({
        ...prev,
        locations: (prev.locations || []).filter(l => l.id !== loc.id && l.name.toLowerCase() !== loc.name.toLowerCase())
      }));
      showToast(`"${loc.name}" hikaye mekanlarından çıkarıldı.`);
    } else {
      setConfig(prev => ({
        ...prev,
        locations: [...(prev.locations || []), loc]
      }));
      showToast(`"${loc.name}" hikaye mekanlarına eklendi!`);
    }
  };

  const [isScanningLocations, setIsScanningLocations] = useState(false);

  const handleScanLocationsFromStory = async () => {
    const combinedStory = `${config.topic || ""} ${config.intro || ""}`.trim();
    if (!combinedStory || combinedStory.length < 5) {
      showToast("Lütfen önce bir hikaye konusu veya giriş sahnesi yazın.");
      return;
    }

    setIsScanningLocations(true);
    try {
      const detected = await detectLocationsFromStory(combinedStory, config.locations || []);
      if (!detected || detected.length === 0) {
        showToast("Hikayede yeni bir mekan tespit edilemedi.");
        return;
      }

      let updatedLocations = [...(config.locations || [])];
      const newlyAdded: string[] = [];

      for (const d of detected) {
        const exists = updatedLocations.some(
          l => l.name.trim().toLowerCase() === d.name.trim().toLowerCase() ||
               l.name.trim().toLowerCase().includes(d.name.trim().toLowerCase()) ||
               d.name.trim().toLowerCase().includes(l.name.trim().toLowerCase())
        );
        if (!exists) {
          const newLoc: LocationItem = {
            id: `loc_${generateId()}`,
            name: d.name,
            type: d.type || "interior",
            description: d.description,
            visualManifest: d.visualManifest,
            tags: ["Otomatik Tespit", "Hikaye Mekanı"],
            createdAt: Date.now()
          };
          updatedLocations.push(newLoc);
          await saveLocationToLibrary(newLoc);
          newlyAdded.push(d.name);
        }
      }

      if (newlyAdded.length > 0) {
        setConfig(prev => ({ ...prev, locations: updatedLocations }));
        showToast(`🏛️ ${newlyAdded.length} yeni mekan tespit edildi ve eklendi: ${newlyAdded.join(", ")}`);
      } else {
        showToast("Tespit edilen mekanlar zaten hikayenizde mevcut.");
      }
    } catch (err: any) {
      console.warn("Mekan tarama hatası:", err);
      showToast("Mekan taranırken bir hata oluştu.");
    } finally {
      setIsScanningLocations(false);
    }
  };

  const handleAddCharacter = async () => {
    if (!newCharName.trim()) return;
    if (config.cast.length >= 10) {
      showToast("Kadro sınırı (10 karakter) doldu!");
      return;
    }

    setIsGeneratingAvatar(true);
    try {
        const visualManifest = await generateVisualManifest(newCharName, newCharDesc, config.style);
        const styleSheet = await generateCharacterStyleSheet(newCharName, newCharDesc, config.style);
        const avatarUrl = await generateCharacterAvatar(
          newCharName, 
          styleSheet.referencePrompt || visualManifest, 
          config.style, 
          Boolean(config.usePaidApi),
          config.imageProvider || "pollinations_flux"
        );
        
        const newChar: Character = {
            id: generateId(),
            name: newCharName.trim(),
            description: newCharDesc.trim() || "Gizemli Görünüm",
            visualManifest: visualManifest,
            styleSheet: styleSheet,
            avatarUrl: avatarUrl,
            style: config.style,
            createdAt: Date.now()
        };

        setConfig((prev) => ({ ...prev, cast: [...prev.cast, newChar] }));
        await saveCharacterToLibrary(newChar);
        await refreshLibrary();
        setNewCharName("");
        setNewCharDesc("");
        showToast(`${newChar.name} Görsel Kılavuzuyla kadroya eklendi!`);
    } catch (e) {
        console.error("Avatar error", e);
        const newChar: Character = {
            id: generateId(),
            name: newCharName.trim(),
            description: newCharDesc.trim() || "Gizemli Görünüm",
            style: config.style,
            createdAt: Date.now()
        };
        setConfig((prev) => ({ ...prev, cast: [...prev.cast, newChar] }));
        await saveCharacterToLibrary(newChar);
        await refreshLibrary();
        setNewCharName("");
        setNewCharDesc("");
        showToast(`${newChar.name} kadroya eklendi!`);
    } finally {
        setIsGeneratingAvatar(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Lütfen geçerli bir görsel dosyası seçin!");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUploadedImageBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateCharacterFromImage = async () => {
    if (!uploadedImageBase64) {
      showToast("Lütfen önce bir fotoğraf yükleyin!");
      return;
    }
    if (config.cast.length >= 10) {
      showToast("Kadro sınırı (10 karakter) doldu!");
      return;
    }

    setIsGeneratingFromImage(true);
    try {
      showToast("Fotoğraf analiz ediliyor ve temaya uyarlanıyor...");
      const newChar = await generateCharacterFromImage(
        uploadedImageBase64,
        imageCharName.trim() || undefined,
        imageCharPrompt.trim() || undefined,
        config.style,
        config.topic,
        Boolean(config.usePaidApi),
        config.imageProvider || "pollinations_flux",
        config.pollinationsModel
      );

      setConfig(prev => ({ ...prev, cast: [...prev.cast, newChar] }));
      await saveCharacterToLibrary(newChar);
      await refreshLibrary();
      setUploadedImageBase64(null);
      setImageCharName("");
      setImageCharPrompt("");
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
      showToast(`✨ ${newChar.name} fotoğraftan başarıyla üretildi ve kadroya eklendi!`);
    } catch (err: any) {
      console.error("Image to character error:", err);
      showToast("Görselden karakter üretilirken bir hata oluştu.");
    } finally {
      setIsGeneratingFromImage(false);
    }
  };

  const handleRemoveCharacter = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      cast: prev.cast.filter((c) => c.id !== id),
    }));
  };

  const handleSaveToLibrary = async (char: Character) => {
    await saveCharacterToLibrary({
      ...char,
      style: char.style || config.style,
      createdAt: char.createdAt || Date.now()
    });
    await refreshLibrary();
    showToast(`${char.name} kütüphaneye kaydedildi!`);
  };

  const handleAddFromLibraryToCast = (char: Character) => {
    if (config.cast.length >= 10) {
      showToast("Kadro sınırı (10 karakter) doldu!");
      return;
    }
    const alreadyInCast = config.cast.some(
      c => c.id === char.id || c.name.toLowerCase() === char.name.toLowerCase()
    );
    if (alreadyInCast) {
      showToast(`${char.name} zaten kadroda!`);
      return;
    }
    setConfig(prev => ({
      ...prev,
      cast: [...prev.cast, { ...char, id: char.id || generateId() }]
    }));
    showToast(`${char.name} kadroya eklendi!`);
  };

  const handleDeleteFromLibraryDirect = async (id: string, name: string) => {
    await deleteCharacterFromLibrary(id);
    await refreshLibrary();
    showToast(`${name} kütüphaneden silindi.`);
  };

  const isCharInLibrary = (char: Character) => {
    return libraryCharacters.some(
      l => l.id === char.id || l.name.toLowerCase() === char.name.toLowerCase()
    );
  };

  const isLoading = status !== GeneratorStatus.IDLE && status !== GeneratorStatus.COMPLETE && status !== GeneratorStatus.ERROR;

  const tabs = [
    { id: "story", label: "Kurgu", icon: InfoIcon },
    { id: "memory", label: `Hafıza (${(config.storyMemory?.memories || []).filter(m => m.isActive).length})`, icon: Brain },
    { id: "cast", label: `Kadro (${config.cast.length}/10)`, icon: Ghost },
    { id: "locations", label: `Mekan (${(config.locations || []).length})`, icon: MapPin },
    { id: "style", label: "Stil", icon: Palette },
  ];

  return (
    <>
      <motion.aside 
        initial={false}
        animate={{ 
          width: isOpen ? (typeof window !== 'undefined' && window.innerWidth < 380 ? "100vw" : 320) : 0,
          borderRightWidth: isOpen ? 4 : 0
        }}
        className={cn(
          "fixed inset-y-0 left-0 z-40 h-full bg-[#1e293b] text-white flex flex-col border-r-black overflow-hidden max-w-full"
        )}
      >
        <div className="flex flex-col h-full w-full sm:w-[320px] max-w-full overflow-hidden"> 
            {/* Header */}
            {/* Header */}
            <div className="p-3 flex items-center justify-between flex-shrink-0 bg-yellow-400 border-b-4 border-black">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-display text-black uppercase tracking-tight flex items-center gap-1.5 -skew-x-6">
                        <Zap className="fill-black" size={22} />
                        ComicGen
                    </h1>
                    <span className="text-[9px] font-mono font-black bg-black text-yellow-300 px-1.5 py-0.5 border border-black uppercase tracking-wider">
                      STUDIO
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {onOpenApiKeyModal && (
                    <button
                      type="button"
                      onClick={onOpenApiKeyModal}
                      className="p-1.5 px-2 bg-yellow-400 text-black hover:bg-yellow-300 transition-colors border-2 border-black flex items-center gap-1 font-display text-xs cursor-pointer shadow-comic-xs active:scale-95 font-black"
                      title="Together AI & Google Gemini API Anahtarlarını Yönet"
                    >
                      <KeyRound size={12} className="stroke-[2.5]" />
                      <span className="uppercase text-[10px] tracking-wide">API</span>
                    </button>
                  )}
                  {hasActiveProject && onReset && (
                    <button
                      onClick={onReset}
                      className="p-1.5 px-2 bg-slate-900 text-yellow-400 hover:bg-red-600 hover:text-white transition-colors border-2 border-black flex items-center gap-1 font-display text-xs cursor-pointer shadow-comic-xs active:scale-95"
                      title="Mevcut çizgi romanı sıfırla ve yeni başlat"
                    >
                      <RotateCcw size={13} />
                      <span className="uppercase text-[10px]">Yeni</span>
                    </button>
                  )}
                  <button 
                      onClick={onToggle}
                      className="p-1.5 px-2 bg-black text-white hover:bg-slate-800 transition-colors border-2 border-black flex items-center gap-1 font-display text-xs cursor-pointer shadow-comic-xs active:scale-95"
                      title="Menüyü Kapat"
                  >
                      <ChevronLeft size={16} />
                      <span className="sm:hidden uppercase font-bold">Kapat</span>
                  </button>
                </div>
            </div>

            {/* Navigation Rail for Tabs */}
            <div className="flex border-b-4 border-black bg-slate-900 h-14">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex-1 flex flex-col items-center justify-center gap-0.5 transition-all relative overflow-hidden",
                            activeTab === tab.id ? "bg-white text-black" : "text-slate-400 hover:bg-slate-800"
                        )}
                    >
                        <tab.icon size={16} />
                        <span className="font-display text-[10px] uppercase tracking-widest">{tab.label}</span>
                        {activeTab === tab.id && (
                           <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-red-600" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-halftone">
                <AnimatePresence mode="wait">
                    {activeTab === "story" && (
                        <motion.div 
                            key="story"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={onOpenStoriesModal}
                                    className="py-2.5 px-2 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black shadow-comic hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-display uppercase tracking-wider text-[11px] font-bold flex items-center justify-center gap-1.5"
                                    title="Tüm kayıtlı hikayelerinizi görüntüleyin, yeni hikaye başlatın veya eski hikayeleri açın"
                                >
                                    <BookOpen size={14} />
                                    <span>Hikayelerim</span>
                                    {savedStoriesCount > 0 && (
                                        <span className="bg-black text-yellow-300 text-[10px] px-1.5 py-0.2 rounded-xs font-mono font-bold">
                                            {savedStoriesCount}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={onAutoFill}
                                    disabled={isAutoFilling || isLoading}
                                    className="py-2.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white border-2 border-black shadow-comic hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 font-display uppercase tracking-wider text-[11px] flex items-center justify-center gap-1.5"
                                >
                                    {isAutoFilling ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    <span>Rastgele</span>
                                </button>
                            </div>

                            <section className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-display uppercase text-yellow-400 flex items-center gap-2">
                                        <Play size={12} /> Ana Konu
                                    </label>
                                     <input
                                        type="text"
                                        className="w-full bg-slate-900 border-2 border-black p-3 text-base sm:text-sm font-comic focus:border-yellow-400 outline-none shadow-inner"
                                        placeholder="Örn: Yağmurlu Bir Günde İlk Aşk İtirafı"
                                        value={config.topic}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setConfig((prev) => {
                                                const isRom = /\b(aşk|aşık|sevgi|sevgili|romantik|romantizm|romance|flört|öpüş|öpücük|kiss|date|buluşma|tutku|tutkulu|sensual|kafe)\b/i.test(val);
                                                return {
                                                    ...prev,
                                                    topic: val,
                                                    tone: isRom && (!prev.tone || prev.tone.toLowerCase().includes("action")) ? "Romance" : prev.tone
                                                };
                                            });
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-display uppercase text-yellow-400 flex items-center gap-2">
                                        <Menu size={12} /> Giriş Metni
                                    </label>
                                    <textarea
                                        className="w-full bg-slate-900 border-2 border-black p-3 text-base sm:text-sm font-comic focus:border-yellow-400 outline-none resize-none h-32 shadow-inner"
                                        placeholder="Hikayenin başlangıcını buraya yaz..."
                                        value={config.intro}
                                        onChange={(e) => setConfig((prev) => ({ ...prev, intro: e.target.value }))}
                                    />
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-1.5 border border-emerald-800/60">
                                        <Check size={12} className="shrink-0 text-emerald-400" />
                                        <span>Kıyafet Sadakati: Hikayede özellikle kıyafet değişimi yazılmadıkça karakterler standart kıyafetleriyle çizilir.</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-display uppercase text-yellow-400 flex items-center gap-2">
                                        <Info size={12} /> Tür & Hikaye Tonu
                                    </label>
                                    <div className="flex flex-wrap gap-1 mb-1.5">
                                        {[
                                            { label: "🔥 Erotik & Romantik (PG-17)", tone: "Sensual Romance & Passion (PG-17)", icon: "🔥" },
                                            { label: "Romantizm & Aşk", tone: "Romance", icon: "💌" },
                                            { label: "Gündelik & Kafe", tone: "Slice of Life", icon: "☕" },
                                            { label: "Romantik Komedi", tone: "Rom-Com", icon: "🌸" },
                                            { label: "Duygusal & Dram", tone: "Drama", icon: "🌧️" },
                                            { label: "Aksiyon", tone: "Action", icon: "⚡" },
                                            { label: "Gizem", tone: "Mystery", icon: "🕵️" },
                                            { label: "Bilim Kurgu", tone: "Sci-Fi", icon: "🚀" }
                                        ].map((t) => {
                                            const isSelected = (config.tone || "").toLowerCase().includes(t.tone.toLowerCase()) || 
                                                               (config.tone || "").toLowerCase().includes(t.label.toLowerCase());
                                            return (
                                                <button
                                                    key={t.tone}
                                                    type="button"
                                                    onClick={() => setConfig((prev) => ({ ...prev, tone: t.tone }))}
                                                    className={cn(
                                                        "px-2 py-1 text-[10px] font-mono border transition-all flex items-center gap-1",
                                                        isSelected
                                                            ? "bg-yellow-400 text-black border-black font-bold shadow-xs"
                                                            : "bg-slate-900 text-slate-300 border-slate-700 hover:border-yellow-400 hover:text-white"
                                                    )}
                                                >
                                                    <span>{t.icon}</span>
                                                    <span>{t.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-900 border-2 border-black p-2.5 text-base sm:text-xs font-comic focus:border-yellow-400 outline-none shadow-inner"
                                        placeholder="Örn: Romance, Slice of Life, Sıcak ve Samimi"
                                        value={config.tone || ""}
                                        onChange={(e) => setConfig((prev) => ({ ...prev, tone: e.target.value }))}
                                    />
                                    {((config.tone || "").toLowerCase().includes("romance") || (config.topic || "").toLowerCase().includes("aşk") || (config.topic || "").toLowerCase().includes("romant")) && (
                                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-pink-300 bg-pink-950/40 px-2 py-1.5 border border-pink-800/60 mt-1">
                                            <Heart size={12} className="shrink-0 text-pink-400" />
                                            <span>Aşk & Romantizm Koruması: Dövüş/kavga çizimleri tamamen engellenir; sahne duygusal yakınlaşma, romantik bakışlar ve samimi anlara odaklanır.</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content Rating: PG-18 vs PG-17 vs PG-13 */}
                                <div className="bg-slate-900 border-2 border-black p-3 space-y-3 shadow-comic">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-display uppercase text-yellow-400 flex items-center gap-1.5">
                                            <Flame size={14} className="text-red-500 fill-red-500" /> İçerik Sınırı & Yaş Derecesi
                                        </label>
                                        <span className={cn(
                                            "text-[9px] font-mono px-1.5 py-0.5 border font-bold uppercase",
                                            config.contentRating === "pg18"
                                                ? "bg-red-900 text-yellow-300 border-red-500"
                                                : config.contentRating === "pg17"
                                                ? "bg-red-950 text-red-300 border-red-500/60"
                                                : "bg-blue-950 text-blue-300 border-blue-500/60"
                                        )}>
                                            {config.contentRating === "pg18" ? "🔞 PG-18 AKTİF" : config.contentRating === "pg17" ? "🔥 PG-17 AKTİF" : "🛡️ PG-13 STANDART"}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {/* PG-18 */}
                                        <button
                                            type="button"
                                            onClick={() => setConfig(prev => ({ ...prev, contentRating: "pg18" }))}
                                            className={cn(
                                                "p-2 border-2 text-left transition-all relative font-comic rounded-xs cursor-pointer",
                                                config.contentRating === "pg18"
                                                    ? "bg-red-950/80 border-red-500 text-white shadow-xs ring-1 ring-red-400/50"
                                                    : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-display text-[11px] sm:text-xs uppercase text-red-400 font-bold flex items-center gap-1">
                                                    🔞 PG-18
                                                </span>
                                                {config.contentRating === "pg18" && <Check size={13} className="text-red-400" />}
                                            </div>
                                            <p className="text-[9px] text-slate-300 mt-1 leading-tight">
                                                En yüksek tensel tutku ve erotizm. AI güvenliğini aşan silüet ve loş açılar + otomatik blur kalkanı.
                                            </p>
                                        </button>

                                        {/* PG-17 */}
                                        <button
                                            type="button"
                                            onClick={() => setConfig(prev => ({ ...prev, contentRating: "pg17" }))}
                                            className={cn(
                                                "p-2 border-2 text-left transition-all relative font-comic rounded-xs cursor-pointer",
                                                config.contentRating === "pg17"
                                                    ? "bg-red-950/40 border-red-500 text-white shadow-xs"
                                                    : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-display text-[11px] sm:text-xs uppercase text-red-400 font-bold flex items-center gap-1">
                                                    🔥 PG-17
                                                </span>
                                                {config.contentRating === "pg17" && <Check size={13} className="text-red-400" />}
                                            </div>
                                            <p className="text-[9px] text-slate-300 mt-1 leading-tight">
                                                Saten çarşaflar, tensel elektriklenme, baştan çıkarıcı bakışlar ve tutkulu sarılma.
                                             </p>
                                        </button>

                                        {/* PG-13 */}
                                        <button
                                            type="button"
                                            onClick={() => setConfig(prev => ({ ...prev, contentRating: "pg13" }))}
                                            className={cn(
                                                "p-2 border-2 text-left transition-all relative font-comic rounded-xs cursor-pointer",
                                                config.contentRating === "pg13"
                                                    ? "bg-blue-950/40 border-blue-400 text-white shadow-xs"
                                                    : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-display text-[11px] sm:text-xs uppercase text-blue-300 font-bold">
                                                    🛡️ PG-13
                                                </span>
                                                {config.contentRating === "pg13" && <Check size={13} className="text-blue-400" />}
                                            </div>
                                            <p className="text-[9px] text-slate-300 mt-1 leading-tight">
                                                Aile dostu klasik macera, süper kahraman ve günlük hikaye standardı.
                                            </p>
                                        </button>
                                    </div>

                                    {/* Blur Shield & Camera Angle preferences for Mature content */}
                                    {config.contentRating !== "pg13" && (
                                        <div className="pt-2 border-t border-slate-800 space-y-2.5">
                                            {/* Blur Toggle */}
                                            <div 
                                                onClick={() => setConfig(prev => ({ ...prev, blurMatureContent: prev.blurMatureContent === false ? true : false }))}
                                                className="flex items-center justify-between p-2 bg-slate-950 border border-slate-700 hover:border-slate-500 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("p-1 rounded text-white", config.blurMatureContent !== false ? "bg-red-600" : "bg-slate-700")}>
                                                        {config.blurMatureContent !== false ? <EyeOff size={13} /> : <Eye size={13} />}
                                                    </div>
                                                    <div>
                                                        <div className="text-[11px] font-bold text-white flex items-center gap-1.5 font-display uppercase">
                                                            <span>🔞 18+ Görselleri Blurlu Başlat</span>
                                                            <span className="text-[9px] text-yellow-400 font-mono">Tıkla-Gör Kalkanı</span>
                                                        </div>
                                                        <p className="text-[9px] text-slate-400 leading-tight">
                                                            Hassas/yetişkin paneller buzlu cam filtresiyle korunur, tıklanınca açılır.
                                                        </p>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={config.blurMatureContent !== false} 
                                                    onChange={() => {}} 
                                                    className="accent-red-500 w-4 h-4 cursor-pointer pointer-events-none"
                                                />
                                            </div>

                                            {/* Automatic AI Director & Concealment Info */}
                                            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xs space-y-1">
                                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-yellow-400 font-display uppercase">
                                                    <span>✨ Otomatik Akıllı Çizim</span>
                                                </div>
                                                <p className="text-[10px] text-slate-300 leading-tight font-comic">
                                                    Açı seçmekle uğraşmayın. Siz sadece hikayeyi yazın; çıplaklığı estetik örten saten çarşaflar, buhar, loş silüetler ve sinematik kamera açıları sahnenize göre otomatik çizilir.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-display uppercase text-yellow-400 flex items-center gap-2">
                                        <Info size={12} /> Anlatıcı Tarzı
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-900 border-2 border-black p-3 text-base sm:text-sm font-comic focus:border-yellow-400 outline-none shadow-inner"
                                        placeholder="Örn: Alaycı ve Hızlı"
                                        value={config.narratorVoice}
                                        onChange={(e) => setConfig((prev) => ({ ...prev, narratorVoice: e.target.value }))}
                                    />
                                </div>

                                {/* Sayfa Devamlılığı & Mantık Hafızası Card */}
                                <div className="bg-slate-800 border-4 border-black p-4 space-y-3 shadow-comic relative overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-yellow-400 text-black border border-black shadow-sm">
                                                <Brain size={16} />
                                            </div>
                                            <div>
                                                <h3 className="font-display text-xs uppercase text-white tracking-wider">
                                                    Mantık Hafızası
                                                </h3>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    Sahne & Olay Devamlılığı
                                                </span>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "text-[9px] font-mono px-1.5 py-0.5 border font-bold uppercase",
                                            config.storyMemory?.enabled !== false
                                                ? "bg-emerald-950 text-emerald-300 border-emerald-500/50"
                                                : "bg-slate-900 text-slate-400 border-slate-700"
                                        )}>
                                            {config.storyMemory?.enabled !== false ? "AKTİF" : "KAPALI"}
                                        </span>
                                    </div>

                                    <p className="text-[11px] text-slate-300 font-comic leading-tight">
                                        Karakterlerin yaralanmaları, kaybettikleri eşyalar veya mekan hasarları hafızaya kaydedilip sonraki sayfalara aktarılır.
                                    </p>

                                    {config.storyMemory?.memories && config.storyMemory.memories.length > 0 && (
                                        <div className="bg-slate-900/90 border border-slate-700 p-2 space-y-1 max-h-24 overflow-y-auto">
                                            <div className="text-[10px] font-mono text-yellow-400 flex items-center justify-between">
                                                <span>Aktif Olaylar:</span>
                                                <span>{config.storyMemory.memories.filter(m => m.isActive).length} kayıt</span>
                                            </div>
                                            {config.storyMemory.memories.slice(0, 3).map((m, idx) => (
                                                <div key={`preview-mem-${m.id || idx}-${idx}`} className="text-[10px] text-slate-300 truncate flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full flex-shrink-0" />
                                                    <span className="truncate">{m.characterName ? `${m.characterName}: ` : ""}{m.description}</span>
                                                </div>
                                            ))}
                                            {config.storyMemory.memories.length > 3 && (
                                                <div className="text-[9px] text-slate-400 font-mono text-center">
                                                    +{config.storyMemory.memories.length - 3} olay daha...
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setIsMemoryModalOpen(true)}
                                        className="w-full py-2 bg-gradient-to-r from-purple-900/80 to-indigo-900/80 hover:from-purple-800 hover:to-indigo-800 text-yellow-300 border-2 border-black font-display text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-comic transition-all"
                                    >
                                        <Brain size={14} className="text-yellow-400" />
                                        <span>Olay Hafızasını Yönet ({config.storyMemory?.memories?.length || 0})</span>
                                    </button>
                                </div>

                                {hasActiveProject && onOpenPdfModal && (
                                    <div className="pt-2 border-t border-slate-800">
                                        <button
                                            type="button"
                                            onClick={onOpenPdfModal}
                                            className="w-full py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white border-2 border-black shadow-comic font-display text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            <FileText size={15} className="text-yellow-300" />
                                            <span>Full Seri PDF Çıktısı Al</span>
                                        </button>
                                    </div>
                                )}

                                {hasActiveProject && onReset && (
                                    <div className="pt-2 border-t border-slate-800">
                                        <button
                                            type="button"
                                            onClick={onReset}
                                            className="w-full py-2.5 bg-slate-900 hover:bg-red-950/70 text-slate-300 hover:text-red-400 border-2 border-slate-800 hover:border-red-600 font-display text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            <RotateCcw size={13} />
                                            Yeni Hikaye Başlat (Sıfırla)
                                        </button>
                                    </div>
                                )}
                            </section>
                        </motion.div>
                    )}

                    {activeTab === "memory" && (
                        <motion.div 
                            key="memory"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <section className="space-y-4">
                                <div className="flex items-center justify-between border-b-2 border-black pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 bg-yellow-400 text-black border border-black shadow-xs">
                                            <Brain size={16} />
                                        </div>
                                        <h2 className="font-display text-sm uppercase text-white tracking-wider">
                                            Mantık & Olay Hafızası
                                        </h2>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsMemoryModalOpen(true)}
                                        className="text-[10px] bg-yellow-400 hover:bg-yellow-300 text-black px-2 py-1 font-display uppercase border border-black shadow-xs flex items-center gap-1 font-bold"
                                    >
                                        <Plus size={12} />
                                        <span>Genişlet</span>
                                    </button>
                                </div>

                                <div className="bg-slate-800 border-2 border-black p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-display uppercase text-slate-300">Devamlılık Motoru</span>
                                        <button
                                            type="button"
                                            onClick={() => setConfig(prev => ({
                                                ...prev,
                                                storyMemory: {
                                                    enabled: !(prev.storyMemory?.enabled !== false),
                                                    autoExtract: prev.storyMemory?.autoExtract !== false,
                                                    memories: prev.storyMemory?.memories || [],
                                                    plotSummary: prev.storyMemory?.plotSummary || ""
                                                }
                                            }))}
                                            className={cn(
                                                "text-[10px] font-mono px-2 py-0.5 border font-bold uppercase",
                                                config.storyMemory?.enabled !== false
                                                    ? "bg-emerald-600 text-white border-black"
                                                    : "bg-slate-900 text-slate-400 border-slate-700"
                                            )}
                                        >
                                            {config.storyMemory?.enabled !== false ? "AÇIK" : "KAPALI"}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-tight">
                                        Karakterlerin yaralanmaları, kaybettikleri eşyalar veya mekan hasarları yapay zeka tarafından sonraki sayfalara aktarılır.
                                    </p>
                                </div>

                                {config.storyMemory?.plotSummary && (
                                    <div className="bg-slate-900 border border-slate-800 p-2.5 space-y-1">
                                        <span className="text-[10px] font-display uppercase text-yellow-400">Kümülatif Özet</span>
                                        <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                                            {config.storyMemory.plotSummary}
                                        </p>
                                    </div>
                                )}

                                {/* Memory items list */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-display uppercase text-slate-300">
                                            Kayıtlı Durumlar ({config.storyMemory?.memories?.length || 0})
                                        </span>
                                        <span className="text-[10px] font-mono text-yellow-400">
                                            {(config.storyMemory?.memories || []).filter(m => m.isActive).length} Aktif
                                        </span>
                                    </div>

                                    {(!config.storyMemory?.memories || config.storyMemory.memories.length === 0) ? (
                                        <div className="p-4 border-2 border-dashed border-slate-700 bg-slate-900/50 text-center space-y-2">
                                            <p className="text-[11px] text-slate-400">Henüz kayıtlı bir olay hafızası yok.</p>
                                            <button
                                                type="button"
                                                onClick={() => setIsMemoryModalOpen(true)}
                                                className="px-3 py-1.5 bg-yellow-400 text-black text-xs font-display uppercase border border-black shadow-comic"
                                            >
                                                Olay Ekle / Sayfaları Tara
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                                            {config.storyMemory.memories.map((item, itemIdx) => (
                                                <div 
                                                    key={`sidebar-mem-${item.id || itemIdx}-${itemIdx}`}
                                                    className={cn(
                                                        "p-2.5 border-2 border-black space-y-1 transition-all",
                                                        item.isActive ? "bg-slate-800 shadow-comic" : "bg-slate-900/60 opacity-60"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between gap-1">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {item.characterName && (
                                                                <span className="bg-yellow-400 text-black text-[9px] font-display uppercase px-1 py-0.2 border border-black font-bold">
                                                                    {item.characterName}
                                                                </span>
                                                            )}
                                                            <span className="text-[9px] font-mono px-1 py-0.2 bg-slate-900 text-slate-300 border border-slate-700 uppercase">
                                                                {item.category === "injury" ? "Yaralanma" : item.category === "item_lost" ? "Kayıp Eşya" : item.category === "item_gained" ? "Kazanılan" : item.category === "environment_damage" ? "Mekan Hasarı" : "Özel"}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setConfig(prev => ({
                                                                    ...prev,
                                                                    storyMemory: {
                                                                        enabled: prev.storyMemory?.enabled ?? true,
                                                                        autoExtract: prev.storyMemory?.autoExtract ?? true,
                                                                        plotSummary: prev.storyMemory?.plotSummary || "",
                                                                        memories: (prev.storyMemory?.memories || []).map(m => m.id === item.id ? { ...m, isActive: !m.isActive } : m)
                                                                    }
                                                                }));
                                                            }}
                                                            className={cn(
                                                                "text-[9px] font-mono px-1.5 py-0.5 border uppercase font-bold",
                                                                item.isActive ? "bg-emerald-950 text-emerald-300 border-emerald-500/60" : "bg-slate-950 text-slate-400 border-slate-700"
                                                            )}
                                                        >
                                                            {item.isActive ? "Aktif" : "Pasif"}
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-white font-medium leading-snug">
                                                        {item.description}
                                                    </p>
                                                    <p className="text-[10px] text-yellow-300 font-mono">
                                                        Görsel: {item.visualImpact}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {onOpenFlowModal && (
                                        <button
                                            type="button"
                                            onClick={onOpenFlowModal}
                                            className="w-full py-2.5 bg-gradient-to-r from-blue-900 to-cyan-950 hover:from-blue-800 hover:to-cyan-900 text-cyan-300 font-display text-xs uppercase tracking-wider border-2 border-black shadow-comic flex items-center justify-center gap-1.5 transition-all active:scale-95"
                                        >
                                            <GitBranch size={14} className="text-yellow-400" />
                                            <span>Olay Çizelgesi Görselleştirici (D3)</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setIsMemoryModalOpen(true)}
                                        className="w-full py-2.5 bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 text-yellow-300 font-display text-xs uppercase tracking-wider border-2 border-black shadow-comic flex items-center justify-center gap-1.5"
                                    >
                                        <Brain size={14} className="text-yellow-400" />
                                        <span>Tüm Hafızayı Yönet / Düzenle</span>
                                    </button>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {activeTab === "style" && (
                        <motion.div 
                            key="style"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-8"
                        >
                           <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-display uppercase text-yellow-400 flex items-center gap-1.5">
                                            <Sparkles size={14} className="text-yellow-400" /> Çizim & Sanat Tarzı
                                        </label>
                                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-yellow-400 text-black font-bold uppercase tracking-wider border border-black">
                                            {COMIC_ART_STYLES.find(s => s.id === config.style || s.name === config.style)?.badge || "Marvel Realizm"}
                                        </span>
                                    </div>

                                    {/* Aktif Stil Vurgu Kutusu */}
                                    <div className="p-3 bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/80 border-2 border-red-500 shadow-comic flex items-start gap-2.5">
                                        <span className="text-xl shrink-0">⚡</span>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-display text-xs uppercase text-yellow-300 font-bold tracking-wider">
                                                    {COMIC_ART_STYLES.find(s => s.id === config.style || s.name === config.style)?.name || "Marvel Çizgi Roman & Realizm (Önerilen)"}
                                                </span>
                                            </div>
                                            <p className="text-[10.5px] text-slate-200 font-comic leading-relaxed">
                                                {COMIC_ART_STYLES.find(s => s.id === config.style || s.name === config.style)?.description || "Modern Marvel çizgi roman mürekkebi ve gerçekçi anatomi harmanı (Alex Ross, Gabriele Dell'Otto & Adi Granov tarzı). Doğal yüzler, sinematik ışık ve doku derinliği."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stil Seçenekleri Grid */}
                                    <div className="grid grid-cols-1 gap-2 pt-1">
                                        {COMIC_ART_STYLES.map((cStyle) => {
                                            const isSelected = (config.style === cStyle.id || config.style === cStyle.name) || (!config.style && cStyle.id === "marvel_realistic");
                                            return (
                                                <button
                                                    key={cStyle.id}
                                                    type="button"
                                                    onClick={() => setConfig(prev => ({ ...prev, style: cStyle.name }))}
                                                    className={cn(
                                                        "p-2.5 border-2 text-left transition-all relative font-comic rounded-xs cursor-pointer",
                                                        isSelected
                                                            ? "bg-red-950/80 border-red-400 text-white shadow-comic ring-1 ring-red-400/60"
                                                            : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-sm">{cStyle.icon}</span>
                                                            <span className={cn(
                                                                "font-display text-xs uppercase",
                                                                isSelected ? "text-yellow-400 font-bold" : "text-slate-300"
                                                            )}>
                                                                {cStyle.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={cn(
                                                                "text-[8px] font-mono px-1 py-0.2 rounded font-black uppercase",
                                                                isSelected ? "bg-yellow-400 text-black" : "bg-slate-800 text-slate-400"
                                                            )}>
                                                                {cStyle.badge}
                                                            </span>
                                                            {isSelected && <Check size={13} className="text-yellow-400 shrink-0" />}
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-slate-300 mt-1 leading-snug">
                                                        {cStyle.description}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Görsel Üretim Motoru: Together AI vs FLUX vs Hibrit vs Gemini */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-display uppercase text-yellow-400 flex items-center gap-1.5">
                                                <Zap size={14} className="text-yellow-400" /> Görsel Üretim Motoru
                                            </label>
                                            <span className={cn(
                                                "text-[9px] font-mono px-1.5 py-0.5 border uppercase font-bold",
                                                (config.imageProvider === "fal_flux")
                                                    ? "bg-orange-500 text-black border-black"
                                                    : (config.imageProvider === "together_flux")
                                                    ? "bg-purple-600 text-white border-black"
                                                    : (config.imageProvider === "gemini")
                                                    ? "bg-amber-400 text-black border-black" 
                                                    : (config.imageProvider === "auto")
                                                    ? "bg-blue-500 text-white border-black"
                                                    : "bg-emerald-500 text-black border-black"
                                            )}>
                                                {config.imageProvider === "fal_flux"
                                                    ? "FAL.AI FLUX"
                                                    : config.imageProvider === "together_flux"
                                                    ? "TOGETHER FLUX"
                                                    : config.imageProvider === "gemini" 
                                                    ? "GEMINI IMAGEN" 
                                                    : config.imageProvider === "auto" 
                                                    ? "HİBRİT (GEMINI+FLUX)" 
                                                    : "%100 ÜCRETSİZ FLUX"}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2">
                                            {/* 1. fal.ai FLUX */}
                                            <button
                                                type="button"
                                                onClick={() => setConfig(prev => ({ 
                                                    ...prev, 
                                                    imageProvider: "fal_flux",
                                                    usePaidApi: false,
                                                    renderQuality: prev.renderQuality === "Paid_Pro" ? "High" : prev.renderQuality 
                                                }))}
                                                className={cn(
                                                    "p-2.5 border-2 text-left transition-all relative font-comic",
                                                    config.imageProvider === "fal_flux"
                                                        ? "bg-orange-950/60 border-orange-400 text-white shadow-comic ring-1 ring-orange-400/50" 
                                                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-display text-xs uppercase text-orange-300">
                                                            fal.ai (FLUX.1 Schnell & Dev)
                                                        </span>
                                                        <span className="text-[9px] font-mono px-1.5 py-0.2 bg-orange-500 text-black font-black uppercase">
                                                            ~1 Sn Yıldırım Hızı
                                                        </span>
                                                    </div>
                                                    {config.imageProvider === "fal_flux" && (
                                                        <Check size={14} className="text-orange-400 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-300 mt-1 leading-tight">
                                                    fal.ai altyapısıyla 1 saniyede ultra hızlı FLUX.1 çizimleri. Geliştirici dostu, sıraya takılmaz.
                                                </p>
                                            </button>

                                            {/* 2. Together AI FLUX */}
                                            <button
                                                type="button"
                                                onClick={() => setConfig(prev => ({ 
                                                    ...prev, 
                                                    imageProvider: "together_flux",
                                                    usePaidApi: false,
                                                    renderQuality: prev.renderQuality === "Paid_Pro" ? "High" : prev.renderQuality 
                                                }))}
                                                className={cn(
                                                    "p-2.5 border-2 text-left transition-all relative font-comic",
                                                    config.imageProvider === "together_flux"
                                                        ? "bg-purple-950/60 border-purple-400 text-white shadow-comic ring-1 ring-purple-400/50" 
                                                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-display text-xs uppercase text-purple-300">
                                                            Together AI (FLUX.1 Dev & Schnell)
                                                        </span>
                                                        <span className="text-[9px] font-mono px-1.5 py-0.2 bg-purple-500 text-white font-black uppercase">
                                                            1.5 Sn & Ultra Kalite
                                                        </span>
                                                    </div>
                                                    {config.imageProvider === "together_flux" && (
                                                        <Check size={14} className="text-purple-400 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-300 mt-1 leading-tight">
                                                    Black Forest Labs'in resmi FLUX.1 modelleri. Ücretsiz 5$ Together AI kredisiyle sıraya takılmadan ultra hızlı ve detaylı çizim.
                                                </p>
                                            </button>

                                            {/* 2. Pollinations FLUX */}
                                            <button
                                                type="button"
                                                onClick={() => setConfig(prev => ({ 
                                                    ...prev, 
                                                    imageProvider: "pollinations_flux",
                                                    usePaidApi: false,
                                                    renderQuality: prev.renderQuality === "Paid_Pro" ? "High" : prev.renderQuality 
                                                }))}
                                                className={cn(
                                                    "p-2.5 border-2 text-left transition-all relative font-comic",
                                                    (!config.imageProvider || config.imageProvider === "pollinations_flux")
                                                        ? "bg-emerald-950/60 border-emerald-400 text-white shadow-comic ring-1 ring-emerald-400/50" 
                                                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-display text-xs uppercase text-emerald-300">
                                                            %100 Ücretsiz FLUX (Pollinations)
                                                        </span>
                                                        <span className="text-[9px] font-mono px-1.5 py-0.2 bg-emerald-500 text-black font-black uppercase">
                                                            0 TL & Sınırsız
                                                        </span>
                                                    </div>
                                                    {(!config.imageProvider || config.imageProvider === "pollinations_flux") && (
                                                        <Check size={14} className="text-emerald-400 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-300 mt-1 leading-tight">
                                                    Sıfır maliyet, API anahtarı veya kota tükenme derdi yok. Hızlı ve sınırsız 2D çizgi roman panelleri üretir.
                                                </p>
                                            </button>

                                            {/* Pollinations Mod / Model Seçimi (Pollinations veya Auto seçiliyken görünür) */}
                                            {(!config.imageProvider || config.imageProvider === "pollinations_flux" || config.imageProvider === "auto") && (
                                                <div className="p-2.5 bg-slate-950/90 border-2 border-emerald-500/50 rounded-sm shadow-inner space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-display uppercase tracking-wider text-emerald-300 flex items-center gap-1.5 font-bold">
                                                            <Sparkles size={12} className="text-emerald-400 shrink-0" />
                                                            Ücretsiz URL Modeli (image.pollinations.ai):
                                                        </span>
                                                        <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-950 px-1.5 py-0.5 border border-emerald-800 rounded truncate max-w-[130px]" title={config.pollinationsModel || "flux"}>
                                                            {POLLINATIONS_MODELS.find(m => m.id === (config.pollinationsModel || "flux"))?.label || config.pollinationsModel || "FLUX.1 (Standart)"}
                                                        </span>
                                                    </div>
                                                    <div className="text-[9px] text-slate-400 font-mono bg-slate-900/80 px-2 py-1 rounded border border-slate-800 truncate">
                                                        🔗 <span className="text-emerald-300">image.pollinations.ai/prompt/</span>...
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                                                        {POLLINATIONS_MODELS.map((pMod) => {
                                                            const isSelected = (config.pollinationsModel || "flux") === pMod.id;
                                                            return (
                                                                <button
                                                                    key={pMod.id}
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setConfig(prev => ({ ...prev, pollinationsModel: pMod.id }));
                                                                        setPollinationsModel(pMod.id);
                                                                    }}
                                                                    className={cn(
                                                                        "p-1.5 border text-left transition-all rounded-xs flex flex-col justify-between group cursor-pointer",
                                                                        isSelected
                                                                            ? "bg-emerald-900/80 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-400"
                                                                            : "bg-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                                                                    )}
                                                                    title={`${pMod.name} (${pMod.id}) - ${pMod.description}`}
                                                                >
                                                                    <div className="flex items-center justify-between gap-1 w-full">
                                                                        <span className="font-bold text-[10.5px] truncate flex items-center gap-1">
                                                                            <span>{pMod.icon}</span>
                                                                            <span className="truncate">{pMod.label}</span>
                                                                        </span>
                                                                        <span className={cn(
                                                                            "text-[7.5px] font-mono px-1 py-0.2 rounded uppercase font-black shrink-0",
                                                                            isSelected ? "bg-emerald-400 text-black" : "bg-slate-800 text-slate-400 group-hover:text-slate-300"
                                                                        )}>
                                                                            {pMod.badge}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[8.5px] text-slate-400 leading-tight mt-1 line-clamp-1 group-hover:text-slate-300">
                                                                        {pMod.description}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 3. Hybrid Auto */}
                                            <button
                                                type="button"
                                                onClick={() => setConfig(prev => ({ 
                                                    ...prev, 
                                                    imageProvider: "auto",
                                                    usePaidApi: false,
                                                    renderQuality: prev.renderQuality === "Paid_Pro" ? "High" : prev.renderQuality 
                                                }))}
                                                className={cn(
                                                    "p-2.5 border-2 text-left transition-all relative font-comic",
                                                    config.imageProvider === "auto" 
                                                        ? "bg-blue-950/60 border-blue-400 text-white shadow-comic ring-1 ring-blue-400/50" 
                                                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-display text-xs uppercase text-blue-300">
                                                            Otomatik Hibrit (Akıllı Seçim)
                                                        </span>
                                                        <span className="text-[9px] font-mono px-1.5 py-0.2 bg-blue-500 text-white font-black uppercase">
                                                            Akıllı Yedekli
                                                        </span>
                                                    </div>
                                                    {config.imageProvider === "auto" && (
                                                        <Check size={14} className="text-blue-400 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-300 mt-1 leading-tight">
                                                    Together AI veya Gemini anahtarınız varsa öncelikli olarak onları kullanır; yoksa ücretsiz FLUX'a geçer.
                                                </p>
                                            </button>

                                            {/* 4. Gemini Imagen Pro */}
                                            <button
                                                type="button"
                                                onClick={() => setConfig(prev => ({ 
                                                    ...prev, 
                                                    imageProvider: "gemini",
                                                    usePaidApi: true,
                                                    renderQuality: "Ultra"
                                                }))}
                                                className={cn(
                                                    "p-2.5 border-2 text-left transition-all relative font-comic",
                                                    config.imageProvider === "gemini" 
                                                        ? "bg-amber-950/60 border-yellow-400 text-white shadow-comic ring-1 ring-yellow-400/50" 
                                                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-display text-xs uppercase text-yellow-400">
                                                            Google Gemini Imagen (Pro API)
                                                        </span>
                                                        <span className="text-[9px] font-mono px-1.5 py-0.2 bg-amber-400 text-black font-black uppercase">
                                                            API Kotası
                                                        </span>
                                                    </div>
                                                    {config.imageProvider === "gemini" && (
                                                        <Check size={14} className="text-yellow-400 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-300 mt-1 leading-tight">
                                                    Doğrudan Google AI Studio Imagen 3 motoru. Gemini API kotanızı veya faturalandırmanızı kullanır.
                                                </p>
                                            </button>
                                        </div>

                                        {/* API Key Modal Button */}
                                        {onOpenApiKeyModal && (
                                            <button
                                                type="button"
                                                onClick={onOpenApiKeyModal}
                                                className="w-full mt-2.5 py-2 px-3 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-300 hover:from-yellow-300 hover:to-amber-200 text-black font-display font-black text-xs uppercase border-2 border-black shadow-comic-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
                                            >
                                                <KeyRound size={14} className="stroke-[2.5]" />
                                                <span>🔑 API Anahtarlarını Yönet (Pollinations / fal.ai / Together / Gemini)</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-display uppercase text-yellow-400">Görüntü Kalitesi</label>
                                        <div className="flex bg-slate-900 border-2 border-black p-1">
                                            {(["Standard", "High", "Ultra"] as const).map(q => (
                                                <button
                                                    key={q}
                                                    onClick={() => setConfig(prev => ({ ...prev, renderQuality: q }))}
                                                    className={cn(
                                                        "flex-1 py-2 font-display text-[10px] uppercase transition-all",
                                                        config.renderQuality === q 
                                                            ? (config.usePaidApi ? "bg-yellow-400 text-black font-bold" : "bg-red-600 text-white")
                                                            : "text-slate-500 hover:text-white"
                                                    )}
                                                >
                                                    {q} {q === "Ultra" && config.usePaidApi ? "(2K HQ)" : ""}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Color Palette Lock */}
                                    <div className="space-y-2 pt-2 border-t border-slate-700">
                                        <label className="text-xs font-display uppercase text-yellow-400 flex items-center gap-1.5">
                                            <Palette size={14} className="text-yellow-400" /> Renk Paleti Kilidi (Palette Lock)
                                        </label>
                                        <p className="text-[10px] text-slate-400 leading-tight">
                                            Tüm sayfa ve panellerde aynı renk tonlarının kullanılmasını zorunlu kılar.
                                        </p>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {Object.entries(COLOR_PALETTES).map(([key, val]) => {
                                                const isSelected = (config.colorPalette || "dynamic") === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setConfig(prev => ({ ...prev, colorPalette: key as any }))}
                                                        className={cn(
                                                            "p-2 border text-left flex items-center justify-between transition-all",
                                                            isSelected 
                                                                ? "bg-slate-800 border-yellow-400 text-white shadow-xs" 
                                                                : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="flex items-center gap-0.5 flex-shrink-0">
                                                                {val.swatches.map((swatch, idx) => (
                                                                    <span 
                                                                        key={`palette-${key}-swatch-${idx}`} 
                                                                        className="w-2.5 h-2.5 rounded-full border border-black/50" 
                                                                        style={{ backgroundColor: swatch }} 
                                                                    />
                                                                ))}
                                                            </div>
                                                            <span className="text-[11px] font-display uppercase truncate">{val.label}</span>
                                                        </div>
                                                        {isSelected && <Check size={12} className="text-yellow-400 flex-shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Lighting Atmosphere */}
                                    <div className="space-y-2 pt-2 border-t border-slate-700">
                                        <label className="text-xs font-display uppercase text-yellow-400 flex items-center gap-1.5">
                                            <Sun size={14} className="text-yellow-400" /> Işık & Atmosfer Uyumu
                                        </label>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {Object.entries(LIGHTING_MOODS).map(([key, val]) => {
                                                const isSelected = (config.lightingMood || "cinematic_contrast") === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setConfig(prev => ({ ...prev, lightingMood: key as any }))}
                                                        className={cn(
                                                            "px-2.5 py-2 border text-left flex items-center justify-between transition-all",
                                                            isSelected 
                                                                ? "bg-slate-800 border-yellow-400 text-white shadow-xs" 
                                                                : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                                                        )}
                                                    >
                                                        <span className="text-[11px] font-display uppercase">{val.label}</span>
                                                        {isSelected && <Check size={12} className="text-yellow-400 flex-shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Ultra Strict Consistency & Technique Lock */}
                                    <div className="pt-2 border-t border-slate-700 space-y-2">
                                        <div className="bg-slate-900 border-2 border-yellow-400/60 p-2.5 flex items-center justify-between gap-2 shadow-xs">
                                            <div className="flex items-center gap-2">
                                                <Lock size={15} className="text-yellow-400 flex-shrink-0" />
                                                <div>
                                                    <p className="text-[11px] font-display uppercase text-white flex items-center gap-1.5">
                                                        <span>Sabit Çizim Tekniği & Karakter Kilidi</span>
                                                    </p>
                                                    <p className="text-[9px] text-slate-300 mt-0.5">
                                                        Tüm sayfalarda aynı çizgi kalınlığı (0.75pt ink), 2D cel-shading ve yüz oranlarını sabitler. 3D veya suluboya kaymalarını engeller.
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setConfig(prev => ({ ...prev, consistencyLock: !(prev.consistencyLock !== false) }))}
                                                className={cn(
                                                    "text-[10px] font-mono px-2.5 py-1.5 border-2 font-bold uppercase flex-shrink-0 transition-all",
                                                    config.consistencyLock !== false
                                                        ? "bg-emerald-500 text-black border-black shadow-comic"
                                                        : "bg-slate-800 text-slate-400 border-slate-600"
                                                )}
                                            >
                                                {config.consistencyLock !== false ? "SABİT (AÇIK)" : "KAPALI"}
                                            </button>
                                        </div>
                                    </div>

                                    {config.usePaidApi ? (
                                        <div className="p-3 bg-amber-950/40 border-2 border-yellow-400/80 rounded-none flex items-start gap-2">
                                            <ShieldCheck className="text-yellow-400 flex-shrink-0 mt-0.5" size={16} />
                                            <div className="space-y-1">
                                                <p className="font-display text-[10px] text-yellow-300 uppercase tracking-widest flex items-center gap-1">
                                                    ÜCRETLİ PRO MOD AKTİF
                                                </p>
                                                <p className="font-comic text-[10px] text-slate-300 leading-normal">
                                                    Görseller en yüksek kaliteli modelle (Imagen 3 / Flash HQ) ve 2K çözünürlükte oluşturulur. İstekler Google Cloud hesabınıza yansır (Sayfa başı ortalama ~0.03$). İstediğiniz an tek tıkla &quot;Ücretsiz Mod&quot;a dönebilirsiniz.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-indigo-950/40 border-2 border-indigo-500 rounded-none flex items-start gap-2">
                                            <Sparkles className="text-indigo-400 flex-shrink-0 mt-0.5" size={14} />
                                            <div className="space-y-1">
                                                <p className="font-display text-[10px] text-indigo-300 uppercase tracking-widest">SÜPER ÇÖZÜNÜRLÜK (ÜCRETSİZ MOD)</p>
                                                <p className="font-comic text-[10px] text-slate-300 leading-normal">
                                                    Özel yapay zeka prompt artırıcı (Super Resolution Engine) devrede. Çizimleriniz hiçbir ekstra ücret olmadan çok daha zengin sanatsal detaylarla çizilecektir.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                           </div>
                        </motion.div>
                    )}

                    {activeTab === "cast" && (
                        <motion.div 
                            key="cast"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {/* Cast Sub-navigation */}
                            <div className="flex bg-slate-900 border-2 border-black p-1 gap-1">
                                <button
                                    onClick={() => setCastSubTab("cast")}
                                    className={cn(
                                        "flex-1 py-1.5 px-2 font-display text-xs uppercase flex items-center justify-center gap-1.5 transition-all",
                                        castSubTab === "cast"
                                            ? "bg-yellow-400 text-black font-bold shadow-comic"
                                            : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <Users size={13} />
                                    <span>Kadro ({config.cast.length}/10)</span>
                                </button>
                                <button
                                    onClick={() => setCastSubTab("library")}
                                    className={cn(
                                        "flex-1 py-1.5 px-2 font-display text-xs uppercase flex items-center justify-center gap-1.5 transition-all",
                                        castSubTab === "library"
                                            ? "bg-yellow-400 text-black font-bold shadow-comic"
                                            : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <Library size={13} />
                                    <span>Kütüphane ({libraryCharacters.length})</span>
                                </button>
                            </div>

                            {/* Toast feedback */}
                            {toastMessage && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-yellow-400 text-black text-xs font-display uppercase px-3 py-1.5 border-2 border-black shadow-comic text-center"
                                >
                                    {toastMessage}
                                </motion.div>
                            )}

                            {castSubTab === "cast" ? (
                                <>
                                    {/* Create Character Card */}
                                    <div className="bg-slate-800 border-4 border-black p-4 space-y-3 shadow-comic">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-display text-sm uppercase text-white flex items-center gap-2">
                                                <Plus size={16} className="text-yellow-400" /> Karakter Tasarla
                                            </h3>
                                            <span className={cn(
                                                "text-[10px] font-mono font-bold px-1.5 py-0.5 border border-black",
                                                config.cast.length >= 10 ? "bg-red-600 text-white" : "bg-black text-yellow-300"
                                            )}>
                                                {config.cast.length}/10
                                            </span>
                                        </div>

                                        {/* Hidden File Input for Image Upload */}
                                        <input 
                                            type="file"
                                            ref={imageFileInputRef}
                                            onChange={handleImageFileChange}
                                            accept="image/png,image/jpeg,image/webp,image/jpg"
                                            className="hidden"
                                        />

                                        {/* Creation Mode Switcher: Text vs Image */}
                                        <div className="grid grid-cols-2 gap-1 bg-black border-2 border-black p-1 shadow-inner">
                                            <button
                                                type="button"
                                                onClick={() => setCharacterCreationMode("text")}
                                                className={cn(
                                                    "py-1 text-[11px] font-display uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-black",
                                                    characterCreationMode === "text"
                                                        ? "bg-yellow-400 text-black shadow-inner"
                                                        : "bg-slate-900 text-slate-400 hover:text-white"
                                                )}
                                            >
                                                <Sparkles size={12} /> Metinle
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCharacterCreationMode("image")}
                                                className={cn(
                                                    "py-1 text-[11px] font-display uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-black relative",
                                                    characterCreationMode === "image"
                                                        ? "bg-yellow-400 text-black shadow-inner"
                                                        : "bg-slate-900 text-slate-400 hover:text-white"
                                                )}
                                            >
                                                <Camera size={12} /> Görselden
                                                <span className="text-[8px] bg-red-600 text-white px-1 py-0.2 font-mono uppercase font-bold">YENİ</span>
                                            </button>
                                        </div>

                                        {characterCreationMode === "text" ? (
                                            <div className="space-y-2.5">
                                                <input
                                                    type="text"
                                                    placeholder="Karakter İsmi"
                                                    className="w-full bg-slate-900 border-2 border-black p-2 text-xs font-comic focus:border-yellow-400 outline-none"
                                                    value={newCharName}
                                                    onChange={(e) => setNewCharName(e.target.value)}
                                                />
                                                <textarea
                                                    placeholder="Fiziksel özellikler, saç, kıyafet (Ön ve arka boydan görünüm ile yakın portresi otomatik çizilir)..."
                                                    className="w-full bg-slate-900 border-2 border-black p-2 text-xs font-comic focus:border-yellow-400 outline-none h-18 resize-none"
                                                    value={newCharDesc}
                                                    onChange={(e) => setNewCharDesc(e.target.value)}
                                                />
                                                <div className="flex items-center gap-1.5 text-[10px] text-yellow-300 font-mono bg-yellow-400/10 px-2 py-1.5 border border-yellow-400/30">
                                                    <Sparkles size={12} className="text-yellow-400 flex-shrink-0" />
                                                    <span>Model sayfası karakteri Ön Görünüm, Arka Görünüm ve Yakın Portre olarak üretir.</span>
                                                </div>

                                                <div className="grid grid-cols-1 gap-2 pt-1">
                                                    <button
                                                        onClick={handleAddCharacter}
                                                        disabled={!newCharName.trim() || isGeneratingAvatar || config.cast.length >= 10}
                                                        className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-display uppercase tracking-wider py-2 border-2 border-black shadow-comic transition-all disabled:opacity-50 text-xs"
                                                    >
                                                        {isGeneratingAvatar ? (
                                                            <Loader2 size={14} className="animate-spin mx-auto" />
                                                        ) : (
                                                            config.cast.length >= 10 ? "Kadro Dolu (Maks. 10)" : "3'lü Model Çıkar (Ön / Arka / Portre)"
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Image-to-Character Mode */
                                            <div className="space-y-2.5">
                                                {!uploadedImageBase64 ? (
                                                    <div 
                                                        onClick={() => imageFileInputRef.current?.click()}
                                                        className="border-2 border-dashed border-yellow-400/60 hover:border-yellow-400 bg-slate-950 p-4 text-center cursor-pointer transition-all hover:bg-slate-900 group"
                                                    >
                                                        <UploadCloud size={24} className="mx-auto text-yellow-400 group-hover:scale-110 transition-transform mb-1.5" />
                                                        <div className="text-xs font-display text-white uppercase">Fotoğraf Yükle (Yüz / Portre)</div>
                                                        <div className="text-[10px] font-comic text-slate-400 mt-0.5">
                                                            PNG, JPG, WEBP • Yüzün net göründüğü bir fotoğraf seçin
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-slate-950 border-2 border-black p-2.5 flex items-center gap-3">
                                                        <img 
                                                            src={uploadedImageBase64} 
                                                            alt="Yüklenen Görsel" 
                                                            className="w-14 h-14 object-cover border-2 border-yellow-400 rounded-sm flex-shrink-0" 
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-display text-white uppercase flex items-center gap-1.5 truncate">
                                                                <Check size={12} className="text-green-400" /> Referans Fotoğraf Hazır
                                                            </div>
                                                            <div className="text-[10px] font-comic text-slate-400">
                                                                Yapay zeka bu yüze sadık kalarak çizecek
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={() => {
                                                                    setUploadedImageBase64(null);
                                                                    if (imageFileInputRef.current) imageFileInputRef.current.value = "";
                                                                }}
                                                                className="text-[10px] text-red-400 hover:text-red-300 font-mono underline mt-0.5 block"
                                                            >
                                                                Fotoğrafı Değiştir
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <input
                                                    type="text"
                                                    placeholder="Karakter İsmi (İsteğe bağlı, boşsa otomatik)"
                                                    className="w-full bg-slate-900 border-2 border-black p-2 text-xs font-comic focus:border-yellow-400 outline-none"
                                                    value={imageCharName}
                                                    onChange={(e) => setImageCharName(e.target.value)}
                                                />
                                                <textarea
                                                    placeholder="Karakter Teması / Rolü (İsteğe bağlı: Örn. Marvel kahramanı yap, siyah deri zırh giydir, dedektif ceketi ver)..."
                                                    className="w-full bg-slate-900 border-2 border-black p-2 text-xs font-comic focus:border-yellow-400 outline-none h-16 resize-none"
                                                    value={imageCharPrompt}
                                                    onChange={(e) => setImageCharPrompt(e.target.value)}
                                                />

                                                <div className="flex items-center gap-1.5 text-[10px] text-yellow-300 font-mono bg-yellow-400/10 px-2 py-1.5 border border-yellow-400/30">
                                                    <Camera size={12} className="text-yellow-400 flex-shrink-0" />
                                                    <span>Yüz hatları fotoğraftan korunur ve temaya uygun 3'lü model kartı oluşturulur.</span>
                                                </div>

                                                <div className="grid grid-cols-1 gap-2 pt-1">
                                                    <button
                                                        onClick={handleCreateCharacterFromImage}
                                                        disabled={!uploadedImageBase64 || isGeneratingFromImage || config.cast.length >= 10}
                                                        className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-display uppercase tracking-wider py-2 border-2 border-black shadow-comic transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-1.5"
                                                    >
                                                        {isGeneratingFromImage ? (
                                                            <>
                                                                <Loader2 size={14} className="animate-spin" />
                                                                <span>Karaktere Dönüştürülüyor...</span>
                                                            </>
                                                        ) : (
                                                            config.cast.length >= 10 ? "Kadro Dolu (Maks. 10)" : "📸 Görseli Karaktere Dönüştür"
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => setIsLibraryModalOpen(true)}
                                            className="w-full bg-slate-900 hover:bg-slate-700 text-yellow-400 font-display uppercase tracking-wider py-1.5 border-2 border-black transition-all text-[11px] flex items-center justify-center gap-1.5"
                                        >
                                            <Library size={13} /> Kütüphaneden Karakter Seç
                                        </button>
                                    </div>

                                    {/* Active Cast List with View Switcher */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs font-display uppercase text-slate-400 px-1 flex-wrap gap-1">
                                            <span>Hikayedeki Karakterler</span>
                                            <span className="font-mono text-yellow-400">{config.cast.length} / 10</span>
                                        </div>

                                        {/* Character View Mode Switcher for Active Cast */}
                                        {config.cast.length > 0 && (
                                            <div className="bg-black border-2 border-black p-1 flex items-center justify-between gap-1 shadow-comic">
                                                <span className="text-[9px] font-mono text-yellow-300 font-bold uppercase px-1">
                                                    Görünüm Modu:
                                                </span>
                                                <div className="flex gap-0.5 flex-1 justify-end">
                                                    {(
                                                        [
                                                            { id: "all", label: "Tümü" },
                                                            { id: "front", label: "Ön" },
                                                            { id: "back", label: "Arka" },
                                                            { id: "portrait", label: "Portre" },
                                                        ] as const
                                                    ).map((mode) => (
                                                        <button
                                                            key={mode.id}
                                                            onClick={() => setCastViewMode(mode.id)}
                                                            className={cn(
                                                                "px-2 py-0.5 text-[9px] font-mono uppercase font-bold transition-all border border-black",
                                                                castViewMode === mode.id
                                                                    ? "bg-yellow-400 text-black shadow-inner"
                                                                    : "bg-slate-900 text-slate-400 hover:text-white"
                                                            )}
                                                            title={`${mode.label} Görünümü`}
                                                        >
                                                            {mode.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {config.cast.map((char, charIdx) => {
                                            const inLib = isCharInLibrary(char);
                                            const activeOutfit = getCharacterActiveOutfit(char);

                                            return (
                                                <motion.div
                                                    layout
                                                    key={`sidebar-cast-${char.id || char.name || charIdx}-${charIdx}`}
                                                    className="flex flex-col bg-white/5 p-2.5 border-2 border-black shadow-comic-hover relative group overflow-hidden"
                                                >
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                                                        {/* Avatar View with angle toggler */}
                                                        <div className="w-full sm:w-28 flex-shrink-0">
                                                            <CharacterAvatarView
                                                                key={`sidebar-avatar-${char.id || char.name || charIdx}-${charIdx}-${castViewMode}`}
                                                                avatarUrl={char.avatarUrl}
                                                                name={char.name}
                                                                initialMode={castViewMode}
                                                                showToggleBar={true}
                                                                compactToggle={true}
                                                                aspectRatio="wide"
                                                                onPreview={(url, mode) => setPreviewCharInfo({ url, name: char.name, mode })}
                                                            />
                                                        </div>

                                                        <div className="flex-1 min-w-0 pr-12">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <h4 className="font-display text-xs sm:text-sm text-yellow-400 uppercase tracking-tighter truncate">
                                                                    {char.name}
                                                                </h4>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedStyleSheetChar(char)}
                                                                    className={cn(
                                                                        "flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold border transition-all shadow-sm",
                                                                        char.styleSheet
                                                                            ? "bg-yellow-400 text-black border-black hover:bg-yellow-300"
                                                                            : "bg-slate-800 text-slate-300 border-slate-700 hover:border-yellow-400 hover:text-yellow-400"
                                                                    )}
                                                                    title="Karakter Görsel Kılavuzunu (Style Sheet) Aç / Düzenle"
                                                                >
                                                                    <BookOpen size={10} />
                                                                    <span>{char.styleSheet ? "Kılavuz" : "+Kılavuz"}</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedOutfitChar(char)}
                                                                    className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold border border-purple-500/80 bg-purple-950/80 text-purple-200 hover:bg-purple-900 hover:text-white transition-all shadow-sm"
                                                                    title="Karakter Kıyafetini Değiştir / Gardırop"
                                                                >
                                                                    <Shirt size={10} />
                                                                    <span className="truncate max-w-[85px]">{activeOutfit.icon || "👕"} {activeOutfit.badge || activeOutfit.name}</span>
                                                                </button>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 font-comic italic line-clamp-2 mt-0.5">
                                                                {char.description}
                                                            </p>
                                                        </div>

                                                        <div className="absolute top-2 right-2 flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleSaveToLibrary(char)}
                                                                className={cn(
                                                                    "p-1 transition-colors",
                                                                    inLib ? "text-yellow-400 hover:text-yellow-300" : "text-slate-500 hover:text-yellow-400"
                                                                )}
                                                                title={inLib ? "Kütüphanede Kayıtlı (Yeniden Kaydet)" : "Kütüphaneye Kaydet"}
                                                            >
                                                                {inLib ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveCharacter(char.id)}
                                                                className="p-1 text-slate-500 hover:text-red-500 transition-colors"
                                                                title="Kadrodan Çıkar"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Quick 1-Click Outfit Switcher Bar */}
                                                    <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center gap-1 flex-wrap">
                                                        <span className="text-[8px] font-mono uppercase text-slate-400 flex items-center gap-0.5">
                                                            <Shirt size={9} /> Kıyafet:
                                                        </span>
                                                        {DEFAULT_OUTFIT_PRESETS.slice(0, 4).map((preset) => {
                                                            const isPresetActive = activeOutfit.id === preset.id || (activeOutfit.name === preset.name && !char.activeOutfitId);
                                                            return (
                                                                <button
                                                                    key={`quick-outfit-${char.id || char.name}-${preset.id}`}
                                                                    type="button"
                                                                    onClick={(e) => handleQuickSwitchOutfit(char, preset, e)}
                                                                    className={cn(
                                                                        "px-1.5 py-0.5 text-[8px] font-mono border transition-all flex items-center gap-0.5",
                                                                        isPresetActive
                                                                            ? "bg-purple-600 text-white border-purple-300 font-bold shadow-sm"
                                                                            : "bg-slate-900/90 text-slate-300 border-slate-700 hover:border-purple-400 hover:text-white"
                                                                    )}
                                                                    title={preset.description}
                                                                >
                                                                    <span>{preset.icon}</span>
                                                                    <span className="truncate max-w-[55px]">{preset.badge || preset.name}</span>
                                                                </button>
                                                            );
                                                        })}
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedOutfitChar(char)}
                                                            className="px-1.5 py-0.5 text-[8px] font-mono text-yellow-400 hover:text-yellow-300 uppercase hover:underline ml-auto flex items-center gap-0.5"
                                                            title="Gardıroptan seç veya özel kıyafet tasarla"
                                                        >
                                                            <span>+Tüm Gardırop</span>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}

                                        {config.cast.length === 0 && (
                                            <div className="text-center py-6 border-2 border-dashed border-slate-700 p-4">
                                                <p className="text-xs font-comic text-slate-400">
                                                    Henüz karakter eklenmedi. Yukarıdan tasarlayabilir veya kütüphaneden seçebilirsiniz.
                                                </p>
                                                <button
                                                    onClick={() => setCastSubTab("library")}
                                                    className="mt-2 text-xs font-display uppercase text-yellow-400 hover:underline"
                                                >
                                                    Kütüphaneye Göz At →
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* Library Subtab */
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="relative flex-1">
                                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="text"
                                                placeholder="Kütüphanede ara..."
                                                value={librarySearchQuery}
                                                onChange={(e) => setLibrarySearchQuery(e.target.value)}
                                                className="w-full pl-7 pr-2 py-1.5 bg-slate-900 border-2 border-black text-xs font-comic focus:border-yellow-400 outline-none"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setIsLibraryModalOpen(true)}
                                            className="px-2 py-1.5 bg-yellow-400 text-black font-display text-[11px] uppercase border-2 border-black shadow-comic flex items-center gap-1 hover:bg-yellow-300"
                                            title="Tam Ekran Kütüphane"
                                        >
                                            <ExternalLink size={12} /> Genişlet
                                        </button>
                                    </div>

                                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                                        {libraryCharacters
                                            .filter(c => 
                                                c.name.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                                                c.description.toLowerCase().includes(librarySearchQuery.toLowerCase())
                                            )
                                            .map((char, libIdx) => {
                                                const isInCast = config.cast.some(
                                                    c => c.id === char.id || c.name.toLowerCase() === char.name.toLowerCase()
                                                );

                                                return (
                                                    <div
                                                        key={`sidebar-lib-${char.id || char.name || libIdx}-${libIdx}`}
                                                        className={cn(
                                                            "p-2.5 border-2 border-black bg-slate-800/80 flex items-center justify-between gap-2 transition-all",
                                                            isInCast ? "ring-1 ring-yellow-400 bg-slate-800" : ""
                                                        )}
                                                    >
                                                        <div className="w-16 flex-shrink-0">
                                                            <CharacterAvatarView 
                                                                key={`lib-avatar-${char.id || char.name || libIdx}-${libIdx}-${castViewMode}`}
                                                                avatarUrl={char.avatarUrl} 
                                                                name={char.name} 
                                                                initialMode={castViewMode}
                                                                showToggleBar={false}
                                                                aspectRatio="wide"
                                                                onPreview={(url, mode) => setPreviewCharInfo({ url, name: char.name, mode })}
                                                            />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <h5 className="font-display text-xs text-yellow-400 uppercase truncate">
                                                                    {char.name}
                                                                </h5>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedOutfitChar(char)}
                                                                    className="flex items-center gap-1 px-1.5 py-0.2 text-[8px] font-mono uppercase bg-purple-950 text-purple-200 border border-purple-600 hover:bg-purple-900 transition-all"
                                                                    title="Kıyafeti Değiştir"
                                                                >
                                                                    <Shirt size={9} />
                                                                    <span>{getCharacterActiveOutfit(char).icon} {getCharacterActiveOutfit(char).badge || getCharacterActiveOutfit(char).name}</span>
                                                                </button>
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 font-comic line-clamp-1">
                                                                {char.description}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            {isInCast ? (
                                                                <span className="text-[10px] font-display uppercase bg-yellow-400 text-black px-2 py-1 border border-black flex items-center gap-1">
                                                                    <Check size={11} /> Kadroda
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleAddFromLibraryToCast(char)}
                                                                    disabled={config.cast.length >= 10}
                                                                    className="px-2 py-1 bg-yellow-400 hover:bg-yellow-300 text-black font-display text-[10px] uppercase border border-black shadow-comic disabled:opacity-50 flex items-center gap-1"
                                                                >
                                                                    <Plus size={11} /> Ekle
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDeleteFromLibraryDirect(char.id, char.name)}
                                                                className="text-slate-500 hover:text-red-400 p-1"
                                                                title="Kütüphaneden Sil"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                        {libraryCharacters.length === 0 && (
                                            <div className="text-center py-6 border border-dashed border-slate-700 p-3 space-y-2">
                                                <p className="text-xs text-slate-400 font-comic">Kütüphane boş.</p>
                                                <button
                                                    onClick={async () => {
                                                        await seedSampleCharacters();
                                                        await refreshLibrary();
                                                    }}
                                                    className="px-3 py-1 bg-yellow-400 text-black font-display text-[10px] uppercase border border-black"
                                                >
                                                    Örnek Karakterleri Yükle
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === "locations" && (
                        <motion.div 
                            key="locations"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            <div className="bg-slate-800 border-4 border-black p-4 space-y-3.5 shadow-comic">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-display text-sm uppercase text-white flex items-center gap-2">
                                        <MapPin size={16} className="text-amber-400" /> Mekan & İkonik Eşyalar
                                    </h3>
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 border border-black bg-amber-400 text-black">
                                        {(config.locations || []).length} Aktif
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 font-comic">
                                    Hikayedeki sahnelerin, arka planların ve özel nesnelerin paneller arası görsel tutarlılığını sağlar.
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setIsLocationLibraryOpen(true)}
                                        className="bg-amber-500 hover:bg-amber-400 text-black font-display uppercase tracking-wider py-2.5 px-2 border-2 border-black shadow-comic transition-all text-xs flex items-center justify-center gap-1.5"
                                    >
                                        <Compass size={14} />
                                        Kütüphane
                                    </button>
                                    <button
                                        onClick={handleScanLocationsFromStory}
                                        disabled={isScanningLocations}
                                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-display uppercase tracking-wider py-2.5 px-2 border-2 border-black shadow-comic transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                                        title="Hikaye konusu ve girişini tarayarak yeni mekanları tespit eder ve projeye ekler"
                                    >
                                        {isScanningLocations ? (
                                            <Loader2 size={14} className="animate-spin text-white" />
                                        ) : (
                                            <Sparkles size={14} className="text-cyan-200" />
                                        )}
                                        {isScanningLocations ? "Taranıyor..." : "Mekan Tara"}
                                    </button>
                                </div>
                                <div className="bg-slate-900/90 border border-slate-700/80 p-2.5 rounded text-[11px] text-slate-300 flex items-start gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mt-0.5 flex-shrink-0" />
                                    <span className="leading-tight">
                                        <strong className="text-emerald-400">Otomatik Algılama Aktif:</strong> Hikaye yazıldığında veya üretildiğinde mekanlar otomatik algılanıp buraya eklenir ve panellere yansıtılır.
                                    </span>
                                </div>
                            </div>

                            {/* Active Locations List */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-xs font-display uppercase text-slate-400 px-1">
                                    <span>Hikayedeki Aktif Mekanlar</span>
                                    <span className="font-mono text-amber-400">{(config.locations || []).length}</span>
                                </div>

                                {(config.locations || []).map((loc, locIdx) => (
                                    <div
                                        key={`sidebar-loc-${loc.id || loc.name || locIdx}-${locIdx}`}
                                        className="p-3 border-2 border-black bg-slate-800/90 flex items-center justify-between gap-2.5 shadow-comic-hover"
                                    >
                                        <div className="w-12 h-12 bg-slate-900 border border-slate-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                            {loc.imageUrl ? (
                                                <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <MapPin size={18} className="text-amber-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <h5 className="font-display text-xs text-amber-300 uppercase truncate">
                                                    {loc.name}
                                                </h5>
                                                <span className="text-[9px] px-1 py-0.2 bg-black text-slate-300 font-mono">
                                                    {loc.type}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-comic line-clamp-1 mt-0.5">
                                                {loc.description}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleToggleLocationInProject(loc)}
                                            className="text-slate-500 hover:text-red-400 p-1"
                                            title="Hikayeden Çıkar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}

                                {(!config.locations || config.locations.length === 0) && (
                                    <div className="text-center py-6 border-2 border-dashed border-slate-700 p-4 space-y-2">
                                        <MapPin size={24} className="mx-auto text-slate-600" />
                                        <p className="text-xs font-comic text-slate-400">
                                            Henüz aktif mekan eklenmedi. Kütüphaneden mekan seçebilir veya yeni tasarlayabilirsiniz.
                                        </p>
                                        <button
                                            onClick={() => setIsLocationLibraryOpen(true)}
                                            className="mt-1 text-xs font-display uppercase text-amber-400 hover:underline inline-flex items-center gap-1"
                                        >
                                            Mekan Seç / Tasarla →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Master Action Button */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-t-4 border-black flex-shrink-0 shadow-2xl relative">
                {/* Engine status indicator */}
                <div className="flex items-center justify-between text-[10px] font-mono mb-2 px-1">
                    <span className="text-slate-300 flex items-center gap-1.5 font-bold tracking-tight">
                        <Zap size={12} className={cn(
                            config.imageProvider === "together_flux" ? "text-purple-400 fill-purple-400" :
                            config.imageProvider === "gemini" ? "text-amber-400 fill-amber-400" :
                            config.imageProvider === "auto" ? "text-blue-400 fill-blue-400" : "text-emerald-400 fill-emerald-400"
                        )} />
                        {config.imageProvider === "together_flux" ? "TOGETHER FLUX" :
                         config.imageProvider === "gemini" ? "GEMINI PRO" :
                         config.imageProvider === "auto" ? "HİBRİT MOTOR" : "ÜCRETSİZ FLUX"}
                    </span>
                    <span className="text-yellow-400 font-bold tracking-wider bg-black/40 px-1.5 py-0.5 border border-black/60">
                        4 KARE
                    </span>
                </div>

                <button
                    onClick={onGenerate}
                    disabled={isLoading || !config.topic || !config.intro}
                    className={cn(
                        "w-full py-3.5 rounded-none font-display text-xl uppercase tracking-wider flex items-center justify-center gap-2 border-3 border-black transition-all group relative overflow-hidden",
                        isLoading 
                            ? "bg-slate-700 text-slate-400 cursor-wait shadow-comic" 
                            : !config.topic || !config.intro
                                ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-75 shadow-none"
                                : "bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-comic hover:shadow-comic-glow-red active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
                    )}
                >
                    {/* Animated shine sweep on ready state */}
                    {!isLoading && config.topic && config.intro && (
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    )}

                    {isLoading ? (
                        <><Loader2 size={20} className="animate-spin text-amber-300" /> <span className="tracking-normal text-lg">Kareler Çiziliyor...</span></>
                    ) : (
                        <>
                            <Play size={18} className="fill-white group-hover:scale-110 transition-transform" /> 
                            <span className="drop-shadow-sm font-black">Sayfayı Üret!</span>
                            <Sparkles size={16} className="text-yellow-200 animate-pulse" />
                        </>
                    )}
                </button>

                {(!config.topic || !config.intro) && !isLoading && (
                    <p className="text-[10px] text-amber-400/90 font-comic text-center mt-2 flex items-center justify-center gap-1 font-medium">
                        <Info size={11} /> Konu ve Hikaye girildiğinde aktifleşir
                    </p>
                )}
            </div>
        </div>
      </motion.aside>

      {/* Character Multi-Angle Preview Modal */}
      <CharacterPreviewModal
        isOpen={Boolean(previewCharInfo)}
        onClose={() => setPreviewCharInfo(null)}
        imageUrl={previewCharInfo?.url || null}
        characterName={previewCharInfo?.name}
        initialMode={previewCharInfo?.mode || castViewMode}
      />

      {/* Character Library Fullscreen Modal */}
      <CharacterLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        config={config}
        setConfig={setConfig}
        libraryCharacters={libraryCharacters}
        onRefreshLibrary={refreshLibrary}
        onPreviewAvatar={(url) => setPreviewCharInfo({ url, name: "Karakter Modeli", mode: castViewMode })}
      />

      {/* Character Style Sheet (Görsel Kılavuz) Modal */}
      {selectedStyleSheetChar && (
        <CharacterStyleSheetModal
          isOpen={Boolean(selectedStyleSheetChar)}
          onClose={() => setSelectedStyleSheetChar(null)}
          character={selectedStyleSheetChar}
          artStyle={config.style}
          onSave={handleSaveStyleSheet}
        />
      )}

      {/* Character Outfit & Wardrobe (Kıyafet Değiştirici) Modal */}
      {selectedOutfitChar && (
        <CharacterOutfitModal
          isOpen={Boolean(selectedOutfitChar)}
          onClose={() => setSelectedOutfitChar(null)}
          character={selectedOutfitChar}
          artStyle={config.style}
          usePaidApi={Boolean(config.usePaidApi)}
          imageProvider={config.imageProvider || "pollinations_flux"}
          onSaveOutfit={handleSaveOutfit}
        />
      )}

      {/* Location & Prop Library Modal */}
      <LocationLibraryModal
        isOpen={isLocationLibraryOpen}
        onClose={() => setIsLocationLibraryOpen(false)}
        activeLocations={config.locations || []}
        onSelectLocation={handleToggleLocationInProject}
        currentStyle={config.style}
        usePaidApi={Boolean(config.usePaidApi)}
        imageProvider={config.imageProvider || "pollinations_flux"}
      />

      {/* Narrative Continuity & Scene Cohesion (Olay Hafızası) Modal */}
      <NarrativeMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memory={config.storyMemory}
        cast={config.cast}
        currentPageCount={pageCount}
        onSave={(updatedMemory) => setConfig(prev => ({ ...prev, storyMemory: updatedMemory }))}
        onAnalyzeContinuity={onAnalyzeContinuity}
        isAnalyzing={isAnalyzingContinuity}
      />
    </>
  );
};
