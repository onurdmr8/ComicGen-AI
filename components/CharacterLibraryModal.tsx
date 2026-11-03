import React, { useState } from "react";
import { 
  Library, Search, Plus, Trash2, Check, User, Sparkles, 
  X, RotateCcw, Eye, ShieldCheck, Tag, Layers, BookOpen, Shirt
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Character, CharacterOutfit, ComicConfig } from "../types";
import { 
  deleteCharacterFromLibrary, 
  saveCharacterToLibrary, 
  seedSampleCharacters 
} from "../lib/storage";
import { generateId, cn } from "../lib/utils";
import { getCharacterActiveOutfit } from "../lib/outfitPresets";
import { CharacterAvatarView, CharacterViewMode } from "./CharacterAvatarView";
import { CharacterPreviewModal } from "./CharacterPreviewModal";
import { CharacterVariationTab } from "./CharacterVariationTab";
import { CharacterStyleSheetModal } from "./CharacterStyleSheetModal";
import { CharacterOutfitModal } from "./CharacterOutfitModal";

interface CharacterLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ComicConfig;
  setConfig: React.Dispatch<React.SetStateAction<ComicConfig>>;
  libraryCharacters: Character[];
  onRefreshLibrary: () => Promise<void>;
  onPreviewAvatar?: (url: string) => void;
}

export const CharacterLibraryModal: React.FC<CharacterLibraryModalProps> = ({
  isOpen,
  onClose,
  config,
  setConfig,
  libraryCharacters,
  onRefreshLibrary,
  onPreviewAvatar
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"browse" | "create" | "variation">("browse");
  const [globalViewMode, setGlobalViewMode] = useState<CharacterViewMode>("all");
  const [previewChar, setPreviewChar] = useState<{ url: string; name: string; mode?: CharacterViewMode } | null>(null);
  const [selectedStyleSheetChar, setSelectedStyleSheetChar] = useState<Character | null>(null);
  const [selectedOutfitChar, setSelectedOutfitChar] = useState<Character | null>(null);

  // Create form inside library
  const [newCharName, setNewCharName] = useState("");
  const [newCharDesc, setNewCharDesc] = useState("");
  const [newCharStyle, setNewCharStyle] = useState("Standart Çizgi Roman");
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  if (!isOpen) return null;

  const handleSaveStyleSheet = async (updatedChar: Character) => {
    // 1. Save to library storage
    await saveCharacterToLibrary(updatedChar);
    await onRefreshLibrary();

    // 2. If present in active cast, update cast state too
    setConfig(prev => ({
      ...prev,
      cast: prev.cast.map(c => (c.id === updatedChar.id || c.name.toLowerCase() === updatedChar.name.toLowerCase()) ? updatedChar : c)
    }));
  };

  const handleSaveOutfit = async (updatedChar: Character, newOutfit: CharacterOutfit) => {
    // 1. Save to library storage
    await saveCharacterToLibrary(updatedChar);
    await onRefreshLibrary();

    // 2. If present in active cast, update cast state too
    setConfig(prev => ({
      ...prev,
      cast: prev.cast.map(c => (c.id === updatedChar.id || c.name.toLowerCase() === updatedChar.name.toLowerCase()) ? updatedChar : c)
    }));
  };

  const handleAddToCast = (char: Character) => {
    if (config.cast.length >= 10) return;
    if (config.cast.some(c => c.id === char.id || c.name.toLowerCase() === char.name.toLowerCase())) {
      return;
    }
    setConfig(prev => ({
      ...prev,
      cast: [...prev.cast, { ...char, id: char.id || generateId() }]
    }));
  };

  const handleRemoveFromCast = (charId: string, charName: string) => {
    setConfig(prev => ({
      ...prev,
      cast: prev.cast.filter(c => c.id !== charId && c.name.toLowerCase() !== charName.toLowerCase())
    }));
  };

  const handleDeleteFromLibrary = async (charId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteCharacterFromLibrary(charId);
    await onRefreshLibrary();
  };

  const handleCreateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;
    setIsSavingCustom(true);
    try {
      const newChar: Character = {
        id: generateId(),
        name: newCharName.trim(),
        description: newCharDesc.trim() || "Özel Karakter",
        style: newCharStyle,
        createdAt: Date.now()
      };
      await saveCharacterToLibrary(newChar);
      await onRefreshLibrary();
      setNewCharName("");
      setNewCharDesc("");
      setActiveTab("browse");
    } finally {
      setIsSavingCustom(false);
    }
  };

  const handleLoadSamples = async () => {
    await seedSampleCharacters();
    await onRefreshLibrary();
  };

  const filtered = libraryCharacters.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.visualManifest && c.visualManifest.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (selectedTag === "all") return true;
    return c.tags?.includes(selectedTag) || c.style?.toLowerCase().includes(selectedTag.toLowerCase());
  });

  const isCastFull = config.cast.length >= 10;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#0f172a] text-white border-4 border-black shadow-comic-xl flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-yellow-400 p-3 sm:p-4 border-b-4 border-black flex items-center justify-between text-black flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-black text-yellow-400 border-2 border-black">
                <Library size={22} />
              </div>
              <div>
                <h2 className="font-display text-lg sm:text-2xl uppercase tracking-tight -skew-x-3">
                  Karakter Kütüphanesi
                </h2>
                <p className="text-xs font-comic font-medium text-slate-800">
                  Daha önce tasarladığın veya hazır karakterleri yeni hikayelerine ekle
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 bg-black text-yellow-300 px-3 py-1 text-xs font-mono font-bold border-2 border-black">
                <span>Kadro:</span>
                <span className={cn(isCastFull ? "text-red-400" : "text-yellow-300")}>
                  {config.cast.length}/10
                </span>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 bg-black text-white hover:bg-red-600 hover:rotate-90 transition-all border-2 border-black"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Sub Navigation Bar with View Mode Toggle */}
          <div className="bg-slate-900 border-b-2 border-black px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab("browse")}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-display uppercase tracking-wider border-2 border-black transition-all",
                  activeTab === "browse" 
                    ? "bg-yellow-400 text-black shadow-comic" 
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                )}
              >
                Karakterler ({libraryCharacters.length})
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-display uppercase tracking-wider border-2 border-black transition-all flex items-center gap-1",
                  activeTab === "create" 
                    ? "bg-yellow-400 text-black shadow-comic" 
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                )}
              >
                <Plus size={14} /> Yeni Ekle
              </button>
              <button
                onClick={() => setActiveTab("variation")}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-display uppercase tracking-wider border-2 border-black transition-all flex items-center gap-1.5",
                  activeTab === "variation" 
                    ? "bg-amber-400 text-black shadow-comic font-bold" 
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                )}
              >
                <Sparkles size={14} className={activeTab === "variation" ? "text-black fill-black" : "text-yellow-400"} /> Karakter Varyasyonu
              </button>

              {/* Character View Mode Toggle */}
              {activeTab === "browse" && libraryCharacters.length > 0 && (
                <div className="flex items-center gap-1 bg-black p-1 border-2 border-slate-700 ml-1">
                  <span className="text-[10px] font-mono text-yellow-300 uppercase px-1 hidden lg:inline font-bold">
                    Görünüm:
                  </span>
                  {(
                    [
                      { id: "all", label: "Tümü (3'lü)" },
                      { id: "front", label: "Ön" },
                      { id: "back", label: "Arka" },
                      { id: "portrait", label: "Portre" },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setGlobalViewMode(mode.id)}
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-mono uppercase font-bold transition-all border border-black",
                        globalViewMode === mode.id
                          ? "bg-yellow-400 text-black shadow-inner"
                          : "bg-slate-900 text-slate-400 hover:text-white"
                      )}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {activeTab === "browse" && (
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Karakter veya özellik ara..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border-2 border-black text-xs font-comic focus:border-yellow-400 outline-none"
                />
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === "browse" ? (
              <>
                {/* Active Cast Pill Indicators on Top */}
                <div className="bg-slate-900/90 border-2 border-slate-700 p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs uppercase text-yellow-400">Aktif Kadro:</span>
                    <span className="text-[11px] font-mono text-slate-400 bg-black px-2 py-0.5 border border-slate-700">
                      {config.cast.length} / 10 Karakter
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {config.cast.map((c, castIdx) => (
                      <span 
                        key={`cast-item-${c.id || c.name || castIdx}-${castIdx}`} 
                        className="bg-yellow-400 text-black text-[10px] font-display uppercase px-2 py-0.5 border border-black flex items-center gap-1"
                      >
                        {c.name}
                        <button 
                          onClick={() => handleRemoveFromCast(c.id, c.name)}
                          className="hover:text-red-700 ml-0.5"
                          title="Kadrodan Çıkar"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    {config.cast.length === 0 && (
                      <span className="text-[11px] font-comic text-slate-500 italic">
                        Kadroda henüz karakter yok. Aşağıdan kütüphanedeki karakterleri kadroya ekleyin.
                      </span>
                    )}
                  </div>
                </div>

                {/* Character Cards Grid */}
                {filtered.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {filtered.map((char, charIdx) => {
                      const isInCast = config.cast.some(
                        c => c.id === char.id || c.name.toLowerCase() === char.name.toLowerCase()
                      );

                      return (
                        <div 
                          key={`lib-char-card-${char.id || char.name || charIdx}-${charIdx}`}
                          className={cn(
                            "bg-slate-800/90 border-2 border-black p-3 flex flex-col justify-between gap-3 transition-all relative group",
                            isInCast ? "ring-2 ring-yellow-400 bg-slate-800" : "hover:border-slate-500"
                          )}
                        >
                          <div className="flex flex-col sm:flex-row gap-3">
                            {/* Avatar Thumbnail with View Mode Toggle */}
                            <div className="w-full sm:w-32 flex-shrink-0">
                              <CharacterAvatarView
                                key={`${char.id || 'modal-char'}-${globalViewMode}`}
                                avatarUrl={char.avatarUrl}
                                name={char.name}
                                initialMode={globalViewMode}
                                showToggleBar={true}
                                compactToggle={true}
                                aspectRatio="wide"
                                onPreview={(url, mode) => {
                                  if (onPreviewAvatar) onPreviewAvatar(url);
                                  setPreviewChar({ url, name: char.name, mode });
                                }}
                              />
                            </div>

                            {/* Character Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="font-display text-base text-yellow-400 uppercase tracking-tight truncate">
                                    {char.name}
                                  </h3>
                                  <button
                                    onClick={(e) => handleDeleteFromLibrary(char.id, e)}
                                    className="text-slate-500 hover:text-red-400 p-1 opacity-60 group-hover:opacity-100 transition-opacity"
                                    title="Kütüphaneden Sil"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>

                                <p className="text-xs font-comic text-slate-300 line-clamp-3 mt-1">
                                  {char.description}
                                </p>
                              </div>

                              {char.style && (
                                <span className="inline-block self-start mt-2 text-[9px] font-mono uppercase bg-slate-950 text-slate-400 px-1.5 py-0.5 border border-slate-700">
                                  {char.style}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Footer / Action */}
                          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setSelectedStyleSheetChar(char)}
                                className={cn(
                                  "flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase font-bold border transition-all shadow-sm",
                                  char.styleSheet
                                    ? "bg-yellow-400 text-black border-black hover:bg-yellow-300"
                                    : "bg-slate-900 text-slate-300 border-slate-700 hover:border-yellow-400 hover:text-yellow-400"
                                )}
                                title="Karakter Görsel Kılavuzunu Aç / Düzenle"
                              >
                                <BookOpen size={11} />
                                <span>{char.styleSheet ? "Kılavuz" : "+Kılavuz"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedOutfitChar(char)}
                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase font-bold border border-purple-500 bg-purple-950/80 text-purple-200 hover:bg-purple-900 hover:text-white transition-all shadow-sm"
                                title="Kıyafetini Değiştir / Gardırop"
                              >
                                <Shirt size={11} />
                                <span>{getCharacterActiveOutfit(char).icon} {getCharacterActiveOutfit(char).badge || getCharacterActiveOutfit(char).name}</span>
                              </button>
                              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                                {char.createdAt ? new Date(char.createdAt).toLocaleDateString("tr-TR") : "Kayıtlı"}
                              </span>
                            </div>

                            {isInCast ? (
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-yellow-400 text-black font-display text-xs uppercase flex items-center gap-1 border border-black">
                                  <Check size={13} /> Kadroda
                                </span>
                                <button
                                  onClick={() => handleRemoveFromCast(char.id, char.name)}
                                  className="text-[11px] font-display uppercase text-red-400 hover:underline px-1"
                                >
                                  Çıkar
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddToCast(char)}
                                disabled={isCastFull}
                                className={cn(
                                  "px-3.5 py-1.5 font-display text-xs uppercase tracking-wider border-2 border-black transition-all flex items-center gap-1.5",
                                  isCastFull
                                    ? "bg-slate-700 text-slate-500 cursor-not-allowed border-slate-600"
                                    : "bg-yellow-400 text-black hover:bg-yellow-300 shadow-comic active:scale-95"
                                )}
                              >
                                <Plus size={14} />
                                {isCastFull ? "Kadro Dolu (10/10)" : "Kadroya Ekle"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 border-2 border-dashed border-slate-700 p-6 text-center space-y-4">
                    <Library size={40} className="mx-auto text-slate-600" />
                    <div>
                      <h4 className="font-display text-lg uppercase text-slate-300">
                        {searchQuery ? "Aramaya uygun karakter bulunamadı" : "Kütüphaneniz Henüz Boş"}
                      </h4>
                      <p className="text-xs font-comic text-slate-400 max-w-md mx-auto mt-1">
                        {searchQuery 
                          ? "Farklı bir arama terimi deneyebilir veya yeni bir karakter ekleyebilirsiniz."
                          : "Oluşturduğunuz karakterler otomatik olarak burada arşivlenir. Dilerseniz hazır örnek karakterleri yükleyebilirsiniz."}
                      </p>
                    </div>
                    <div className="flex justify-center gap-3 pt-2">
                      <button
                        onClick={handleLoadSamples}
                        className="px-4 py-2 bg-yellow-400 text-black font-display text-xs uppercase border-2 border-black shadow-comic hover:bg-yellow-300 flex items-center gap-1.5"
                      >
                        <Sparkles size={14} /> Örnek Karakterleri Yükle
                      </button>
                      <button
                        onClick={() => setActiveTab("create")}
                        className="px-4 py-2 bg-slate-800 text-white font-display text-xs uppercase border-2 border-black hover:bg-slate-700 flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Yeni Karakter Ekle
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : activeTab === "variation" ? (
              /* AI Character Variation Laboratory Tab */
              <CharacterVariationTab
                libraryCharacters={libraryCharacters}
                config={config}
                setConfig={setConfig}
                onRefreshLibrary={onRefreshLibrary}
                onPreview={(url, name, mode) => setPreviewChar({ url, name, mode })}
                onNavigateToBrowse={() => setActiveTab("browse")}
              />
            ) : (
              /* Create Character Form Inside Library */
              <form onSubmit={handleCreateAndSave} className="max-w-xl mx-auto bg-slate-900 border-2 border-black p-5 space-y-4 shadow-comic">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-display text-base uppercase text-yellow-400 flex items-center gap-2">
                    <Plus size={16} /> Kütüphaneye Yeni Karakter Kaydet
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("browse")}
                    className="text-xs font-comic text-slate-400 hover:text-white"
                  >
                    ← Listeye Dön
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-display uppercase text-slate-300">Karakter Adı</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Kaptan Yıldız, Gölge Ajanı"
                    value={newCharName}
                    onChange={e => setNewCharName(e.target.value)}
                    className="w-full bg-slate-950 border-2 border-black p-2.5 text-xs font-comic focus:border-yellow-400 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-display uppercase text-slate-300">Görsel Özellikler & Kıyafet</label>
                  <textarea
                    rows={4}
                    placeholder="Örn: Sarı saçlı, yeşil pelerinli, sibernetik sol kolu olan, siyah zırhlı..."
                    value={newCharDesc}
                    onChange={e => setNewCharDesc(e.target.value)}
                    className="w-full bg-slate-950 border-2 border-black p-2.5 text-xs font-comic focus:border-yellow-400 outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-display uppercase text-slate-300">Çizim Stili</label>
                  <div className="w-full bg-slate-950 border-2 border-black p-2 text-xs font-comic text-yellow-400">
                    Standart Çizgi Roman
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("browse")}
                    className="px-4 py-2 bg-slate-800 text-slate-300 font-display text-xs uppercase border-2 border-black"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={!newCharName.trim() || isSavingCustom}
                    className="px-5 py-2 bg-yellow-400 text-black font-display text-xs uppercase border-2 border-black shadow-comic hover:bg-yellow-300 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check size={14} /> Kütüphaneye Kaydet
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-950 p-3 sm:p-4 border-t-4 border-black flex items-center justify-between flex-shrink-0">
            <div className="text-xs font-comic text-slate-400">
              Maksimum 10 karakteri aynı hikaye kadrosuna ekleyebilirsiniz.
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-yellow-400 text-black font-display text-xs sm:text-sm uppercase border-2 border-black shadow-comic hover:bg-yellow-300"
            >
              Tamamla
            </button>
          </div>
        </motion.div>
      </div>

      {/* Character Multi-Angle Preview Modal */}
      <CharacterPreviewModal
        isOpen={Boolean(previewChar)}
        onClose={() => setPreviewChar(null)}
        imageUrl={previewChar?.url || null}
        characterName={previewChar?.name}
        initialMode={previewChar?.mode || globalViewMode}
      />

      {/* Character Style Sheet Modal */}
      {selectedStyleSheetChar && (
        <CharacterStyleSheetModal
          isOpen={Boolean(selectedStyleSheetChar)}
          onClose={() => setSelectedStyleSheetChar(null)}
          character={selectedStyleSheetChar}
          artStyle={config.style}
          onSave={handleSaveStyleSheet}
        />
      )}

      {/* Character Outfit & Wardrobe Modal */}
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
    </AnimatePresence>
  );
};
