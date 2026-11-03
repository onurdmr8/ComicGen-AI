import React, { useState, useEffect } from "react";
import { LocationItem, LocationType } from "../types";
import { getLibraryLocations, saveLocationToLibrary, deleteLocationFromLibrary, seedSampleLocations } from "../lib/storage";
import { generateLocationConceptArt, generateLocationVisualManifest } from "../services/geminiService";
import { generateId } from "../lib/utils";
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Layers, 
  X, 
  Eye, 
  Compass, 
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Sword,
  Home,
  Sun
} from "lucide-react";

interface LocationLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLocations: LocationItem[];
  onSelectLocation: (location: LocationItem) => void;
  currentStyle: string;
  usePaidApi: boolean;
  imageProvider?: "auto" | "pollinations_flux" | "gemini";
}

export const LocationLibraryModal: React.FC<LocationLibraryModalProps> = ({
  isOpen,
  onClose,
  activeLocations,
  onSelectLocation,
  currentStyle,
  usePaidApi,
  imageProvider = "pollinations_flux",
}) => {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [activeTab, setActiveTab] = useState<"library" | "create">("library");
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // New location creation state
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<LocationType>("exterior");
  const [newDescription, setNewDescription] = useState("");
  const [newVisualManifest, setNewVisualManifest] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isGeneratingManifest, setIsGeneratingManifest] = useState(false);
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Previewing selected location
  const [previewLocation, setPreviewLocation] = useState<LocationItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLibrary();
    }
  }, [isOpen]);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      let list = await getLibraryLocations();
      if (!list || list.length === 0) {
        list = await seedSampleLocations();
      }
      setLocations(list);
    } catch (err) {
      console.error("Failed to load locations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateManifest = async () => {
    if (!newName.trim() || !newDescription.trim()) {
      setGenerationError("Lütfen mekan/eşya adı ve kısa açıklamasını girin.");
      return;
    }
    setGenerationError(null);
    setIsGeneratingManifest(true);
    try {
      const manifest = await generateLocationVisualManifest(
        newName,
        newDescription,
        newType,
        currentStyle
      );
      setNewVisualManifest(manifest);
    } catch (err: any) {
      setGenerationError("Görsel rehber oluşturulamadı: " + (err?.message || "Bilinmeyen hata"));
    } finally {
      setIsGeneratingManifest(false);
    }
  };

  const handleGenerateConceptArt = async () => {
    if (!newName.trim() || !newDescription.trim()) {
      setGenerationError("Lütfen önce mekan/eşya adı ve açıklamasını girin.");
      return;
    }
    setGenerationError(null);
    setIsGeneratingArt(true);
    try {
      const art = await generateLocationConceptArt(
        newName,
        newDescription,
        newType,
        currentStyle,
        newVisualManifest || undefined,
        usePaidApi,
        imageProvider
      );
      if (art) {
        setNewImageUrl(art);
      } else {
        setGenerationError("Görsel oluşturulamadı. Lütfen tekrar deneyin.");
      }
    } catch (err: any) {
      setGenerationError("Konsept çizimi hatası: " + (err?.message || "Bilinmeyen hata"));
    } finally {
      setIsGeneratingArt(false);
    }
  };

  const handleSaveNewLocation = async () => {
    if (!newName.trim() || !newDescription.trim()) {
      setGenerationError("Lütfen mekan adını ve açıklamasını doldurun.");
      return;
    }

    const loc: LocationItem = {
      id: generateId(),
      name: newName.trim(),
      type: newType,
      description: newDescription.trim(),
      visualManifest: newVisualManifest.trim() || newDescription.trim(),
      imageUrl: newImageUrl || undefined,
      createdAt: Date.now()
    };

    try {
      await saveLocationToLibrary(loc);
      setLocations(prev => [loc, ...prev]);
      setActiveTab("library");
      setPreviewLocation(loc);
      setActionMessage(`"${loc.name}" kütüphaneye başarıyla kaydedildi!`);
      setTimeout(() => setActionMessage(null), 3000);

      // Reset form
      setNewName("");
      setNewDescription("");
      setNewVisualManifest("");
      setNewImageUrl("");
      setGenerationError(null);
    } catch (err: any) {
      setGenerationError("Kaydetme hatası: " + err?.message);
    }
  };

  const handleDeleteLocation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bu mekanı kütüphaneden silmek istediğinize emin misiniz?")) {
      await deleteLocationFromLibrary(id);
      setLocations(prev => prev.filter(l => l.id !== id));
      if (previewLocation?.id === id) {
        setPreviewLocation(null);
      }
    }
  };

  const getTypeBadge = (type: LocationType) => {
    switch (type) {
      case "exterior":
        return { label: "Dış Mekan", icon: Sun, color: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60" };
      case "interior":
        return { label: "İç Mekan", icon: Home, color: "bg-blue-950/60 text-blue-300 border-blue-800/60" };
      case "prop":
        return { label: "İkonik Eşya / Prop", icon: Sword, color: "bg-amber-950/60 text-amber-300 border-amber-800/60" };
      case "vehicle":
        return { label: "Araç / Taşıt", icon: Compass, color: "bg-purple-950/60 text-purple-300 border-purple-800/60" };
      default:
        return { label: "Mekan", icon: MapPin, color: "bg-zinc-800 text-zinc-300 border-zinc-700" };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-lg shadow-orange-950/40">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Mekan ve İkonik Eşya Kütüphanesi
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                  Tutarlılık Modu
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Paneller arası çevre, mekan ve eşya sürekliliğini AI görsel manifestleri ile garanti altına alın.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Status Notification */}
        <div className="px-6 py-2 border-b border-zinc-800/80 bg-zinc-900 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("library")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === "library"
                  ? "bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <Layers className="w-4 h-4" />
              Kayıtlı Mekanlar & Proplar ({locations.length})
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === "create"
                  ? "bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <Plus className="w-4 h-4" />
              Yeni Mekan / Eşya Ekle
            </button>
          </div>

          {actionMessage && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{actionMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-900/60">
          {activeTab === "library" ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Location Cards List */}
              <div className="md:col-span-7 space-y-4">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-12 text-zinc-400 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <span>Mekan kütüphanesi yükleniyor...</span>
                  </div>
                ) : locations.length === 0 ? (
                  <div className="text-center p-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/30">
                    <MapPin className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-400 text-sm">Henüz kayıtlı bir mekan bulunamadı.</p>
                    <button
                      onClick={() => setActiveTab("create")}
                      className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      İlk Mekanı Tasarla
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {locations.map((loc, locIdx) => {
                      const isSelected = activeLocations.some(al => al.id === loc.id || al.name.toLowerCase() === loc.name.toLowerCase());
                      const badge = getTypeBadge(loc.type);
                      const BadgeIcon = badge.icon;
                      const isPreviewing = previewLocation?.id === loc.id;

                      return (
                        <div
                          key={`loc-lib-${loc.id || loc.name || locIdx}-${locIdx}`}
                          onClick={() => setPreviewLocation(loc)}
                          className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                            isPreviewing
                              ? "bg-zinc-800/90 border-amber-500/80 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/50"
                              : "bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80"
                          }`}
                        >
                          {/* Image preview thumbnail */}
                          <div className="w-full h-28 bg-zinc-900 rounded-lg overflow-hidden relative mb-2.5 border border-zinc-800">
                            {loc.imageUrl ? (
                              <img
                                src={loc.imageUrl}
                                alt={loc.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-1 bg-zinc-900/80">
                                <ImageIcon className="w-6 h-6" />
                                <span className="text-[10px]">Konsept Görseli Yok</span>
                              </div>
                            )}
                            
                            {/* Type badge on top left */}
                            <div className="absolute top-2 left-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 font-medium shadow-sm backdrop-blur-md ${badge.color}`}>
                                <BadgeIcon className="w-3 h-3" />
                                {badge.label}
                              </span>
                            </div>

                            {/* Active in Story indicator */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 bg-emerald-500 text-black px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-md">
                                <Check className="w-3 h-3 stroke-[3]" />
                                Hikayede Aktif
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div>
                            <h3 className="font-semibold text-sm text-zinc-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                              {loc.name}
                            </h3>
                            <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                              {loc.description}
                            </p>
                          </div>

                          {/* Action footer */}
                          <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectLocation(loc);
                                setActionMessage(`"${loc.name}" hikaye mekanlarına eklendi.`);
                                setTimeout(() => setActionMessage(null), 2500);
                              }}
                              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                                isSelected
                                  ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800"
                                  : "bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40"
                              }`}
                            >
                              {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              {isSelected ? "Hikayede" : "Hikayeye Ekle"}
                            </button>

                            <button
                              onClick={(e) => handleDeleteLocation(loc.id, e)}
                              className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors"
                              title="Kütüphaneden Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Location Detail & Visual Manifest Preview Panel */}
              <div className="md:col-span-5 bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 flex flex-col h-full sticky top-0">
                {previewLocation ? (
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Concept Image */}
                      <div className="w-full h-44 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 relative mb-4">
                        {previewLocation.imageUrl ? (
                          <img
                            src={previewLocation.imageUrl}
                            alt={previewLocation.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-2">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-xs">Konsept Görseli Henüz Çizilmedi</span>
                          </div>
                        )}
                        <div className="absolute top-2.5 left-2.5">
                          {(() => {
                            const badge = getTypeBadge(previewLocation.type);
                            const BadgeIcon = badge.icon;
                            return (
                              <span className={`text-xs px-2.5 py-0.5 rounded-md border flex items-center gap-1 font-medium shadow-md backdrop-blur-md ${badge.color}`}>
                                <BadgeIcon className="w-3.5 h-3.5" />
                                {badge.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {previewLocation.name}
                      </h3>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                        {previewLocation.description}
                      </p>

                      {/* Visual Manifest / Prompt Guide */}
                      <div className="mt-4 p-3 bg-zinc-900/90 border border-zinc-800 rounded-lg">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Görsel Manifest & Çevre Rehberi:</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-mono bg-zinc-950/60 p-2.5 rounded border border-zinc-900 max-h-36 overflow-y-auto">
                          {previewLocation.visualManifest || previewLocation.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-800/80 flex gap-2">
                      <button
                        onClick={() => {
                          onSelectLocation(previewLocation);
                          setActionMessage(`"${previewLocation.name}" hikaye mekanlarına seçildi.`);
                          setTimeout(() => setActionMessage(null), 2500);
                        }}
                        className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-amber-950/40"
                      >
                        <Check className="w-4 h-4" />
                        Hikayede Bu Mekanı Kullan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 gap-2">
                    <Eye className="w-8 h-8 opacity-40 text-zinc-400" />
                    <p className="text-xs">Sol taraftaki listeden bir mekanı seçerek detaylarını ve AI görsel manifestini inceleyebilirsiniz.</p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Create New Location / Prop Form */
            <div className="max-w-2xl mx-auto bg-zinc-950/50 border border-zinc-800 rounded-xl p-6 space-y-5">
              <div className="border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Yeni Mekan veya İkonik Eşya Oluştur
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Çizgi roman sayfalarınızda tekrar tekrar kullanabileceğiniz tutarlı ortamlar ve nesneler tasarlayın.
                </p>
              </div>

              {generationError && (
                <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>{generationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Mekan / Nesne Adı *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="örn: Kadim Büyücü Kulesi, Siberpunk Gecekondu"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Tür *
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as LocationType)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="exterior">Dış Mekan (Şehir, Doğa, Çatı vb.)</option>
                    <option value="interior">İç Mekan (Oda, Bar, Laboratuvar vb.)</option>
                    <option value="prop">İkonik Eşya / Prop (Kılıç, Parşömen, Çip vb.)</option>
                    <option value="vehicle">Araç / Taşıt (Uzay Gemisi, Motosiklet vb.)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Açıklama & Atmosfer *
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Göz alıcı detaylar: Işıklandırma, renk paleti, yapının mimari tarzı, ikonik nesneler..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* AI Manifest Builder */}
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    AI Görsel Manifest & Mimari Rehber
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateManifest}
                    disabled={isGeneratingManifest || !newName.trim() || !newDescription.trim()}
                    className="text-xs px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-semibold rounded-lg border border-amber-500/40 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isGeneratingManifest ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Rehber Üretiliyor...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Otomatik Manifest Üret
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={newVisualManifest}
                  onChange={(e) => setNewVisualManifest(e.target.value)}
                  placeholder="AI promptlarına eklenecek İngilizce mimari ve atmosfer rehberi (İsteğe bağlı veya otomatik üretilebilir)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Concept Art Preview & Generator */}
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    Konsept Sanat Çizimi (Referans Görsel)
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateConceptArt}
                    disabled={isGeneratingArt || !newName.trim() || !newDescription.trim()}
                    className="text-xs px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {isGeneratingArt ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Çiziliyor...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Konsept Görseli Çiz
                      </>
                    )}
                  </button>
                </div>

                {newImageUrl ? (
                  <div className="relative w-full h-48 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
                    <img src={newImageUrl} alt="Concept Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewImageUrl("")}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white p-1 rounded text-xs transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 italic">
                    Konsept görseli çizdirildiğinde, ileride oluşturulacak tüm çizgi roman sayfalarında bu görsel AI modeline stil ve mekan referansı olarak sunulur.
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("library")}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewLocation}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-lg text-sm transition-all shadow-md shadow-orange-950/40 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Mekanı Kütüphaneye Kaydet
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
