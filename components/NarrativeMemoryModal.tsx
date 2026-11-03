import React, { useState, useEffect } from "react";
import { 
  Brain, Sparkles, Plus, Trash2, Check, X, ShieldAlert, 
  Flame, Shield, Sword, HeartHandshake, FileText, ToggleLeft, ToggleRight, Edit3, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NarrativeContinuityMemory, NarrativeMemoryItem, Character } from "../types";
import { generateId, cn } from "../lib/utils";

interface NarrativeMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory?: NarrativeContinuityMemory;
  cast: Character[];
  currentPageCount: number;
  onSave: (updatedMemory: NarrativeContinuityMemory) => void;
  onAnalyzeContinuity?: () => Promise<void>;
  isAnalyzing?: boolean;
}

const CATEGORIES: Array<{
  id: NarrativeMemoryItem["category"];
  label: string;
  icon: React.ElementType;
  color: string;
  badgeBg: string;
  example: string;
}> = [
  {
    id: "injury",
    label: "Yaralanma / Fiziksel Hasar",
    icon: Flame,
    color: "text-red-400",
    badgeBg: "bg-red-500/20 text-red-300 border-red-500/40",
    example: "Örn: Sol kolundan yaralandı, sargılı"
  },
  {
    id: "item_lost",
    label: "Kayıp / Kırılan Eşya",
    icon: Trash2,
    color: "text-amber-400",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    example: "Örn: Kılıcını uçuruma düşürdü"
  },
  {
    id: "item_gained",
    label: "Kazanılan / Kuşanılan Eşya",
    icon: Sword,
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    example: "Örn: Gizemli kristal kolyeyi taktı"
  },
  {
    id: "environment_damage",
    label: "Mekan Hasarı / Çevre Yıkımı",
    icon: ShieldAlert,
    color: "text-orange-400",
    badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    example: "Örn: Ana köprü çöktü, her yer moloz"
  },
  {
    id: "relationship_shift",
    label: "İlişki / İttifak Değişimi",
    icon: HeartHandshake,
    color: "text-purple-400",
    badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    example: "Örn: Ortak düşmana karşı geçici barış"
  },
  {
    id: "custom",
    label: "Özel Durum / Olay",
    icon: Shield,
    color: "text-blue-400",
    badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    example: "Örn: Üzerine yağmur yağdı, kıyafetleri sırılsıklam"
  }
];

export const NarrativeMemoryModal: React.FC<NarrativeMemoryModalProps> = ({
  isOpen,
  onClose,
  memory,
  cast,
  currentPageCount,
  onSave,
  onAnalyzeContinuity,
  isAnalyzing = false
}) => {
  const initialMemory: NarrativeContinuityMemory = memory || {
    enabled: true,
    autoExtract: true,
    memories: [],
    plotSummary: ""
  };

  const [enabled, setEnabled] = useState<boolean>(initialMemory.enabled !== false);
  const [autoExtract, setAutoExtract] = useState<boolean>(initialMemory.autoExtract !== false);
  const [plotSummary, setPlotSummary] = useState<string>(initialMemory.plotSummary || "");
  const [memories, setMemories] = useState<NarrativeMemoryItem[]>(initialMemory.memories || []);

  // Sync internal state when modal opens or incoming memory updates
  useEffect(() => {
    if (isOpen && memory) {
      setEnabled(memory.enabled !== false);
      setAutoExtract(memory.autoExtract !== false);
      setPlotSummary(memory.plotSummary || "");
      setMemories(memory.memories || []);
    }
  }, [isOpen, memory]);

  // New item form
  const [newCategory, setNewCategory] = useState<NarrativeMemoryItem["category"]>("injury");
  const [newCharName, setNewCharName] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");
  const [newVisualImpact, setNewVisualImpact] = useState<string>("");

  if (!isOpen) return null;

  const handleAddMemory = () => {
    if (!newDesc.trim()) return;

    const item: NarrativeMemoryItem = {
      id: generateId(),
      category: newCategory,
      characterName: newCharName.trim() || undefined,
      description: newDesc.trim(),
      visualImpact: newVisualImpact.trim() || newDesc.trim(),
      isActive: true,
      createdInPage: currentPageCount
    };

    setMemories(prev => [item, ...prev]);
    setNewDesc("");
    setNewVisualImpact("");
  };

  const handleToggleMemoryActive = (id: string) => {
    setMemories(prev => prev.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m));
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const handleSaveAndClose = () => {
    const updated: NarrativeContinuityMemory = {
      enabled,
      autoExtract,
      plotSummary: plotSummary.trim(),
      memories
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-4xl bg-slate-900 border-4 border-black shadow-comic-xl text-white my-auto overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 p-4 border-b-4 border-black flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-yellow-400 text-black border-2 border-black shadow-comic">
              <Brain size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-display uppercase tracking-wider text-white">
                  Sayfa Devamlılığı & Mantık Hafızası
                </h2>
                <span className="bg-purple-500/30 text-purple-300 text-[10px] font-mono px-2 py-0.5 border border-purple-400/40">
                  Narrative Continuity Engine
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Önceki sayfalarda yaşanan yaralanmalar, kayıp eşyalar ve mekan hasarları sonraki sayfalara birebir aktarılır.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-2 border-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Global Controls Banner */}
        <div className="bg-slate-950 p-3.5 border-b-2 border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Engine Active Toggle */}
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 border-2 font-display uppercase text-xs transition-all",
                enabled 
                  ? "bg-emerald-600 text-white border-black shadow-comic" 
                  : "bg-slate-800 text-slate-400 border-slate-700"
              )}
            >
              {enabled ? <ToggleRight size={18} className="text-emerald-300" /> : <ToggleLeft size={18} />}
              <span>Mantık Hafızası: {enabled ? "Devrede (Açık)" : "Devre Dışı"}</span>
            </button>

            {/* Auto Extract Toggle */}
            <button
              type="button"
              onClick={() => setAutoExtract(!autoExtract)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 border text-xs transition-all",
                autoExtract 
                  ? "bg-purple-900/60 text-purple-200 border-purple-400/50" 
                  : "bg-slate-800 text-slate-400 border-slate-700"
              )}
              title="Her yeni çizgi roman sayfası üretildiğinde olay hafızası yapay zeka tarafından otomatik güncellenir"
            >
              <Sparkles size={14} className={autoExtract ? "text-yellow-400" : ""} />
              <span>Otomatik Olay Tespiti: {autoExtract ? "Açık" : "Kapalı"}</span>
            </button>
          </div>

          {onAnalyzeContinuity && currentPageCount > 0 && (
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={onAnalyzeContinuity}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-display uppercase text-xs border-2 border-black shadow-comic disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>{isAnalyzing ? "Sayfalar Taranıyor..." : "Mevcut Sayfaları Tara"}</span>
            </button>
          )}
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* Plot Summary / Story Recap */}
          <div className="bg-slate-800/80 border-2 border-slate-700 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-display uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                <FileText size={14} />
                <span>Kümülatif Hikaye Özeti & Olay Örgüsü</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Yapay zeka bu özeti yeni sayfalar yazarken temel alır</span>
            </div>
            <textarea
              value={plotSummary}
              onChange={(e) => setPlotSummary(e.target.value)}
              placeholder="Hikayenin şimdiye kadarki genel gidişatı (örn: Kahramanlarımız eski tapınağa girdi, tapınak muhafızları uyandı ve Aras yaralandı...)"
              className="w-full h-20 p-2.5 bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:border-yellow-400 focus:outline-none resize-none font-sans leading-relaxed"
            />
          </div>

          {/* Add New Memory Item Section */}
          <div className="bg-slate-800/90 border-2 border-black p-4 space-y-3.5 shadow-comic">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-display uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Plus size={16} />
                <span>Yeni Olay / Fiziksel Değişim Ekle</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Manuel olarak yeni durum ekleyin</span>
            </div>

            {/* Category Selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = newCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setNewCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-1.5 p-2 text-left border text-[11px] transition-all",
                      isSelected 
                        ? "bg-slate-700 border-yellow-400 text-white shadow-sm" 
                        : "bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-500"
                    )}
                  >
                    <Icon size={14} className={cat.color} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* Optional Character select */}
              <div className="sm:col-span-4">
                <select
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-yellow-400 focus:outline-none"
                >
                  <option value="">Genel / Mekan / Tüm Ekip</option>
                  {cast.map((c, cIdx) => (
                    <option key={`mem-cast-${c.id || c.name || cIdx}-${cIdx}`} value={c.name}>Karakter: {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="sm:col-span-8">
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder={CATEGORIES.find(c => c.id === newCategory)?.example || "Ne oldu? (Olay açıklaması)"}
                  className="w-full p-2 bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-yellow-400 focus:outline-none placeholder-slate-500"
                />
              </div>

              {/* Visual Impact (Prompt Anchor) */}
              <div className="sm:col-span-10">
                <input
                  type="text"
                  value={newVisualImpact}
                  onChange={(e) => setNewVisualImpact(e.target.value)}
                  placeholder="Görsel Yansıma: Çizimlerde nasıl görünmeli? (Örn: Sol kolunda kanlı beyaz sargı bezi, yırtık kumaş)"
                  className="w-full p-2 bg-slate-900 border border-slate-700 text-xs text-yellow-200 focus:border-yellow-400 focus:outline-none placeholder-slate-500 font-mono"
                />
              </div>

              {/* Add Button */}
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddMemory}
                  disabled={!newDesc.trim()}
                  className="w-full h-full min-h-[36px] flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-black font-display uppercase text-xs font-bold border border-black disabled:opacity-40 transition-colors"
                >
                  <Plus size={16} />
                  <span>Ekle</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Memories List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-display uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                <Shield size={14} />
                <span>Kayıtlı Olay & Durum Hafızası ({memories.length})</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {memories.filter(m => m.isActive).length} aktif durum bir sonraki sayfaya aktarılacak
              </span>
            </div>

            {memories.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-800 bg-slate-950/60 text-center space-y-2">
                <Brain size={32} className="mx-auto text-slate-600" />
                <p className="text-xs text-slate-400">Henüz kayıtlı bir olay veya fiziksel değişim yok.</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Sayfalar ürettikçe yapay zeka yaralanmaları ve mekan yıkımlarını otomatik kaydeder veya yukarıdaki formdan hemen kendiniz ekleyebilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {memories.map((item, idx) => {
                  const catConfig = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[5];
                  const Icon = catConfig.icon;

                  return (
                    <motion.div
                      key={`modal-mem-${item.id || idx}-${idx}`}
                      layout
                      className={cn(
                        "p-3 border-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all",
                        item.isActive 
                          ? "bg-slate-800/95 shadow-comic" 
                          : "bg-slate-900/60 opacity-60 border-slate-800"
                      )}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("px-2 py-0.5 text-[10px] font-mono border flex items-center gap-1", catConfig.badgeBg)}>
                            <Icon size={12} />
                            <span>{catConfig.label}</span>
                          </span>

                          {item.characterName && (
                            <span className="bg-yellow-400 text-black px-1.5 py-0.5 text-[10px] font-display uppercase border border-black font-bold">
                              {item.characterName}
                            </span>
                          )}

                          {item.createdInPage && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Sayfa {item.createdInPage}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-200 font-medium">
                          {item.description}
                        </p>

                        <p className="text-[11px] text-yellow-300 font-mono flex items-center gap-1">
                          <span className="text-slate-400 font-sans">Görsel Çıpa:</span>
                          <span>{item.visualImpact}</span>
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleMemoryActive(item.id)}
                          className={cn(
                            "px-2.5 py-1 text-[11px] font-mono uppercase border transition-colors",
                            item.isActive 
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30" 
                              : "bg-slate-700 text-slate-400 border-slate-600 hover:text-white"
                          )}
                        >
                          {item.isActive ? "Aktif" : "Pasif"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMemory(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/40 transition-colors"
                          title="Sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t-4 border-black flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            {memories.filter(m => m.isActive).length} aktif kural sonraki sayfa üretimlerinde promptlara kilitlenecektir.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-display uppercase text-xs border-2 border-black"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-display uppercase text-xs font-bold border-2 border-black shadow-comic flex items-center gap-1.5"
            >
              <Check size={16} />
              <span>Kaydet & Kurguyu Kilitle</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
