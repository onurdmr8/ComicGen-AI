import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, BookOpen, Plus, Play, Trash2, Copy, Download, Upload, 
  Search, Clock, Sparkles, Check, Edit3, AlertTriangle, Layers,
  ChevronRight, ArrowRight, User, Book, Heart
} from "lucide-react";
import { SavedStory, ComicConfig, ComicPage } from "../types";
import { 
  getAllSavedStories, 
  saveStoryToLibrary, 
  deleteStoryFromLibrary, 
  duplicateStory, 
  renameStory,
  exportStoryAsJson,
  importStoryFromJson
} from "../lib/storage";
import { cn } from "../lib/utils";

interface SavedStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStoryId: string | null;
  currentConfig: ComicConfig;
  currentPages: ComicPage[];
  onLoadStory: (story: SavedStory) => void;
  onNewStory: () => void;
}

export const SavedStoriesModal: React.FC<SavedStoriesModalProps> = ({
  isOpen,
  onClose,
  currentStoryId,
  currentConfig,
  currentPages,
  onLoadStory,
  onNewStory,
}) => {
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [storyToDelete, setStoryToDelete] = useState<SavedStory | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const loadStoriesList = async () => {
    setIsLoading(true);
    try {
      const list = await getAllSavedStories();
      setStories(list);
    } catch (e) {
      console.error("Hikayeleri yükleme hatası:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStoriesList();
    }
  }, [isOpen]);

  const handleStartRename = (story: SavedStory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStoryId(story.id);
    setEditTitleValue(story.title || story.config.topic || "İsimsiz Hikaye");
  };

  const handleSaveRename = async (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editTitleValue.trim()) return;
    try {
      await renameStory(id, editTitleValue.trim());
      await loadStoriesList();
      setEditingStoryId(null);
      showToast("Hikaye başlığı güncellendi!");
    } catch (err) {
      console.error("Yeniden adlandırma hatası:", err);
    }
  };

  const handleDuplicate = async (story: SavedStory, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const dup = await duplicateStory(story.id);
      if (dup) {
        await loadStoriesList();
        showToast(`"${dup.title}" kopyası oluşturuldu!`);
      }
    } catch (err) {
      console.error("Kopyalama hatası:", err);
    }
  };

  const handleDelete = async () => {
    if (!storyToDelete) return;
    try {
      await deleteStoryFromLibrary(storyToDelete.id);
      setStoryToDelete(null);
      await loadStoriesList();
      showToast("Hikaye kütüphaneden silindi.");
    } catch (err) {
      console.error("Silme hatası:", err);
    }
  };

  const handleExport = (story: SavedStory, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const jsonStr = exportStoryAsJson(story);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const cleanName = (story.title || "hikaye").toLowerCase().replace(/[^a-z0-9]/gi, "_");
      a.download = `cizgi-roman-${cleanName}.json`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Hikaye JSON yedeği indirildi!");
    } catch (err) {
      console.error("Dışa aktarma hatası:", err);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const imported = await importStoryFromJson(text);
        await loadStoriesList();
        showToast(`"${imported.title}" başarıyla içe aktarıldı!`);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err: any) {
        alert("Dosya okunamadı: " + (err.message || "Geçersiz dosya formatı"));
      }
    };
    reader.readAsText(file);
  };

  const handleSelectStory = (story: SavedStory) => {
    onLoadStory(story);
    onClose();
  };

  const handleSaveCurrentActive = async () => {
    const hasData = currentPages.length > 0 || currentConfig.topic.trim().length > 0 || currentConfig.cast.length > 0;
    if (!hasData) {
      showToast("Kaydedilecek aktif bir hikaye bulunamadı.");
      return;
    }

    const storyTitle = currentConfig.topic || (currentPages[0]?.panels[0]?.dialogue?.substring(0, 30)) || "İsimsiz Hikaye";
    const targetId = currentStoryId || `story-${Date.now()}`;
    const cover = currentPages[0]?.pageImageUrl || currentPages[0]?.panels.find(p => p.imageUrl)?.imageUrl;

    const newStory: SavedStory = {
      id: targetId,
      title: storyTitle,
      topic: currentConfig.topic,
      intro: currentConfig.intro,
      coverImageUrl: cover,
      pageCount: currentPages.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      config: currentConfig,
      pages: currentPages,
    };

    await saveStoryToLibrary(newStory);
    await loadStoriesList();
    showToast(`"${storyTitle}" kaydedildi!`);
  };

  const filteredStories = stories.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = (s.title || "").toLowerCase().includes(q);
    const matchTopic = (s.topic || s.config.topic || "").toLowerCase().includes(q);
    const matchTone = (s.config.tone || "").toLowerCase().includes(q);
    const matchStyle = (s.config.style || "").toLowerCase().includes(q);
    const matchCast = s.config.cast?.some(c => c.name.toLowerCase().includes(q));
    return matchTitle || matchTopic || matchTone || matchStyle || matchCast;
  });

  const formatDate = (ts: number) => {
    if (!ts) return "Bilinmeyen Tarih";
    const d = new Date(ts);
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-5xl max-h-[90vh] bg-slate-900 border-4 border-black shadow-comic flex flex-col overflow-hidden text-white"
      >
        {/* Modal Header */}
        <div className="bg-yellow-400 border-b-4 border-black p-3 sm:p-4 flex items-center justify-between text-black flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black text-yellow-400 border-2 border-black shadow-sm">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-display uppercase tracking-wider text-black">
                Kayıtlı Hikayeler Kütüphanesi
              </h2>
              <p className="text-xs font-mono text-black/80 font-bold">
                Tüm Çizgi Roman Projelerinizi Yönetin, Açın veya Yeni Bir Hikayeye Başlayın
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 bg-black text-white hover:bg-red-600 border-2 border-black transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-800 border-b-2 border-black p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Hikaye başlığı, karakter, tür veya stil ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border-2 border-black pl-9 pr-3 py-2 text-xs sm:text-sm font-comic text-white focus:border-yellow-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Save active story button */}
            <button
              onClick={handleSaveCurrentActive}
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-black px-3 py-2 text-xs font-display uppercase shadow-comic flex items-center gap-1.5 active:scale-95 transition-all"
              title="Şu an açık olan hikayeyi kütüphaneye kaydet"
            >
              <Check size={14} />
              <span>Mevcutu Kaydet</span>
            </button>

            {/* Import JSON button */}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".json" 
              onChange={handleImportFile} 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-700 hover:bg-slate-600 text-white border-2 border-black px-3 py-2 text-xs font-display uppercase shadow-comic flex items-center gap-1.5 active:scale-95 transition-all"
              title="Bilgisayarınızdan .json çizgi roman yedeği yükleyin"
            >
              <Upload size={14} />
              <span className="hidden sm:inline">İçe Aktar</span>
            </button>

            {/* Start Brand New Story */}
            <button
              onClick={() => {
                onNewStory();
                onClose();
              }}
              className="bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black px-3.5 py-2 text-xs font-display uppercase shadow-comic flex items-center gap-1.5 font-bold active:scale-95 transition-all"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>Yeni Hikaye Başlat</span>
            </button>
          </div>
        </div>

        {/* Stories Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-950">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-display text-sm uppercase tracking-wider">Kütüphane Taranıyor...</p>
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-slate-800 border-4 border-black flex items-center justify-center mb-4 shadow-comic">
                <Book size={36} className="text-yellow-400" />
              </div>
              <h3 className="text-xl font-display uppercase text-white mb-2">
                {searchQuery ? "Aramaya Uygun Hikaye Bulunamadı" : "Henüz Kayıtlı Hikaye Yok"}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm font-comic max-w-md mb-6">
                {searchQuery 
                  ? "Farklı anahtar kelimeler deneyin veya aramayı temizleyin." 
                  : "Mevcut hikayenizi kaydedebilir veya sıfırdan yepyeni bir maceraya başlayabilirsiniz."}
              </p>
              <button
                onClick={() => {
                  onNewStory();
                  onClose();
                }}
                className="bg-yellow-400 text-black border-2 border-black px-5 py-2.5 font-display text-sm uppercase shadow-comic font-bold hover:bg-yellow-300"
              >
                İlk Hikayeni Başlat
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredStories.map((story) => {
                const isActive = currentStoryId === story.id;
                const isEditing = editingStoryId === story.id;
                const charCount = story.config.cast?.length || 0;
                const pageCount = story.pages?.length || 0;
                const coverImage = story.coverImageUrl || story.pages?.[0]?.pageImageUrl || story.pages?.[0]?.panels?.find(p => p.imageUrl)?.imageUrl;

                return (
                  <motion.div
                    key={story.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "bg-slate-900 border-4 border-black flex flex-col justify-between overflow-hidden shadow-comic transition-all group relative",
                      isActive ? "ring-2 ring-yellow-400 border-yellow-400" : "hover:border-slate-500"
                    )}
                  >
                    {/* Active Ribbon */}
                    {isActive && (
                      <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-black font-display text-[10px] font-bold px-2 py-0.5 border border-black shadow-sm uppercase tracking-wider flex items-center gap-1">
                        <Check size={12} /> Aktif Açık
                      </div>
                    )}

                    {/* Story Cover Preview */}
                    <div 
                      onClick={() => handleSelectStory(story)}
                      className="relative w-full aspect-[16/10] bg-slate-950 overflow-hidden cursor-pointer border-b-2 border-black group-hover:opacity-95 transition-opacity"
                    >
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={story.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-halftone bg-slate-900 text-slate-500">
                          <BookOpen size={36} className="mb-2 text-yellow-400/60" />
                          <span className="font-display text-[11px] uppercase tracking-wider text-slate-400">
                            {pageCount > 0 ? `${pageCount} Sayfalık Taslak` : "Yeni Başlanan Kurgu"}
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                      {/* Floating Badges */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono">
                        <span className="bg-black/90 text-yellow-400 px-2 py-0.5 border border-black font-bold uppercase">
                          📖 {pageCount} Sayfa
                        </span>
                        <span className="bg-black/90 text-cyan-300 px-2 py-0.5 border border-black font-bold">
                          👥 {charCount} Karakter
                        </span>
                      </div>
                    </div>

                    {/* Story Body Details */}
                    <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        {/* Title & Rename */}
                        {isEditing ? (
                          <form onSubmit={(e) => handleSaveRename(story.id, e)} className="flex items-center gap-1 mb-2">
                            <input
                              type="text"
                              autoFocus
                              value={editTitleValue}
                              onChange={(e) => setEditTitleValue(e.target.value)}
                              className="w-full bg-black border border-yellow-400 px-2 py-1 text-xs font-display text-white outline-none"
                            />
                            <button
                              type="submit"
                              className="bg-yellow-400 text-black p-1 border border-black hover:bg-yellow-300"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStoryId(null)}
                              className="bg-slate-700 text-white p-1 border border-black"
                            >
                              <X size={14} />
                            </button>
                          </form>
                        ) : (
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h4 
                              onClick={() => handleSelectStory(story)}
                              className="font-display text-sm sm:text-base text-white uppercase tracking-tight line-clamp-1 cursor-pointer hover:text-yellow-400 transition-colors"
                              title={story.title || story.config.topic}
                            >
                              {story.title || story.config.topic || "İsimsiz Hikaye"}
                            </h4>
                            <button
                              onClick={(e) => handleStartRename(story, e)}
                              className="text-slate-400 hover:text-yellow-400 p-1 flex-shrink-0"
                              title="Hikaye başlığını değiştir"
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        )}

                        {/* Tone & Style Tags */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {story.config.tone && (
                            <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-1.5 py-0.5 border border-slate-700">
                              ⚡ {story.config.tone}
                            </span>
                          )}
                          {story.config.style && (
                            <span className="bg-slate-800 text-yellow-300 text-[10px] font-mono px-1.5 py-0.5 border border-slate-700">
                              🎨 {story.config.style}
                            </span>
                          )}
                        </div>

                        {/* Story Premise / Intro Snippet */}
                        <p className="text-xs font-comic text-slate-400 line-clamp-2 leading-relaxed">
                          {story.intro || story.config.intro || story.topic || "Açıklama belirtilmedi."}
                        </p>
                      </div>

                      {/* Cast Avatars Preview */}
                      {story.config.cast && story.config.cast.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                          <span className="text-[10px] text-slate-400 font-mono">Kadro:</span>
                          <div className="flex items-center -space-x-1.5 overflow-hidden">
                            {story.config.cast.slice(0, 5).map((char, cIdx) => (
                              <div
                                key={char.id || cIdx}
                                className="w-6 h-6 rounded-full border border-black bg-slate-800 overflow-hidden flex items-center justify-center text-[10px] font-bold text-yellow-400 flex-shrink-0"
                                title={char.name}
                              >
                                {char.avatarUrl ? (
                                  <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{char.name[0]}</span>
                                )}
                              </div>
                            ))}
                          </div>
                          {story.config.cast.length > 5 && (
                            <span className="text-[9px] text-slate-500 font-mono">+{story.config.cast.length - 5}</span>
                          )}
                        </div>
                      )}

                      {/* Timestamp & Actions */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock size={11} />
                          <span>{formatDate(story.updatedAt || story.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Duplicate */}
                          <button
                            onClick={(e) => handleDuplicate(story, e)}
                            className="p-1 hover:text-yellow-400 hover:bg-slate-800 rounded-xs transition-colors"
                            title="Hikayeyi çoğalt (Kopya kurgu oluştur)"
                          >
                            <Copy size={13} />
                          </button>

                          {/* Export JSON */}
                          <button
                            onClick={(e) => handleExport(story, e)}
                            className="p-1 hover:text-cyan-400 hover:bg-slate-800 rounded-xs transition-colors"
                            title="Yedeğini JSON olarak indir"
                          >
                            <Download size={13} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStoryToDelete(story);
                            }}
                            className="p-1 hover:text-red-400 hover:bg-slate-800 rounded-xs transition-colors"
                            title="Kütüphaneden sil"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Load & Continue Button */}
                      <button
                        onClick={() => handleSelectStory(story)}
                        className={cn(
                          "w-full py-2 px-3 border-2 border-black font-display text-xs uppercase shadow-comic flex items-center justify-center gap-1.5 transition-all font-bold active:scale-95",
                          isActive
                            ? "bg-yellow-400 hover:bg-yellow-300 text-black"
                            : "bg-slate-800 hover:bg-yellow-400 hover:text-black text-white"
                        )}
                      >
                        <Play size={13} className="fill-current" />
                        <span>{isActive ? "Çalışmaya Devam Et" : "Hikayeyi Aç"}</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {storyToDelete && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 border-4 border-black p-5 max-w-md w-full shadow-comic text-white"
              >
                <div className="flex items-center gap-3 text-red-400 mb-3">
                  <AlertTriangle size={28} />
                  <h3 className="font-display text-lg uppercase tracking-wide text-white">
                    Hikaye Silinsin mi?
                  </h3>
                </div>
                <p className="text-sm font-comic text-slate-300 mb-5 leading-relaxed">
                  <strong className="text-yellow-400">"{storyToDelete.title || storyToDelete.config.topic}"</strong> adlı hikaye ve içindeki {storyToDelete.pages.length} sayfalık çizim kalıcı olarak silinecektir.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setStoryToDelete(null)}
                    className="px-4 py-2 bg-slate-800 border-2 border-black font-display text-xs uppercase hover:bg-slate-700"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white border-2 border-black font-display text-xs uppercase font-bold hover:bg-red-500 shadow-comic"
                  >
                    Evet, Sil
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="absolute bottom-6 right-6 bg-yellow-400 text-black font-display text-xs font-bold uppercase px-4 py-2.5 border-2 border-black shadow-comic z-60 flex items-center gap-2"
            >
              <Check size={16} />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
