import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Character, CharacterRelationship, RelationshipType } from "../types";
import { 
  X, Heart, Sparkles, Plus, Trash2, Sliders, MessageCircle, 
  Flame, Check, ArrowRightLeft, ShieldAlert, Dices, Users
} from "lucide-react";
import { 
  RELATIONSHIP_ARCHETYPES, 
  getRelationshipPreset, 
  generateRandomRelationship 
} from "../lib/relationshipPresets";
import { generateId, cn } from "../lib/utils";

interface CharacterRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  cast: Character[];
  relationships: CharacterRelationship[];
  onSaveRelationships: (relationships: CharacterRelationship[]) => void;
}

export const CharacterRelationshipModal: React.FC<CharacterRelationshipModalProps> = ({
  isOpen,
  onClose,
  cast,
  relationships,
  onSaveRelationships
}) => {
  const [localRelationships, setLocalRelationships] = useState<CharacterRelationship[]>(() => relationships || []);
  const [editingRelId, setEditingRelId] = useState<string | null>(null);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen) {
      setLocalRelationships(relationships || []);
    }
  }, [isOpen, relationships]);

  if (!isOpen) return null;

  const handleAddNewRelationship = () => {
    if (cast.length < 2) return;
    const charA = cast[0];
    const charB = cast[1];

    const newRel: CharacterRelationship = {
      id: `rel-${generateId()}`,
      sourceCharId: charA.id,
      sourceCharName: charA.name,
      targetCharId: charB.id,
      targetCharName: charB.name,
      type: "passionate_lovers",
      typeLabel: "Tutkulu Aşıklar",
      tensionLevel: 85,
      description: "Aralarında yoğun bir tensel çekim ve derin duygusal bağ var.",
      dialogueSubtext: "Nefes nefese yakınlaşma, fısıltılı sıcak ton ve korumacı içgüdü.",
      isReciprocal: true
    };

    setLocalRelationships(prev => [...prev, newRel]);
    setEditingRelId(newRel.id);
  };

  const handleGenerateRandomAll = () => {
    if (cast.length < 2) return;
    const generated: CharacterRelationship[] = [];

    // Pair sequential characters or key characters
    for (let i = 0; i < cast.length - 1; i++) {
      generated.push(generateRandomRelationship(cast[i], cast[i + 1]));
    }
    // If 3+ characters, also add link between first and last for triangle/dynamic tension
    if (cast.length >= 3) {
      generated.push(generateRandomRelationship(cast[0], cast[cast.length - 1]));
    }

    setLocalRelationships(generated);
  };

  const handleUpdateRelationship = (id: string, updates: Partial<CharacterRelationship>) => {
    setLocalRelationships(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, ...updates };
      if (updates.type) {
        const preset = getRelationshipPreset(updates.type);
        updated.typeLabel = preset.label;
      }
      return updated;
    }));
  };

  const handleDeleteRelationship = (id: string) => {
    setLocalRelationships(prev => prev.filter(r => r.id !== id));
  };

  const handleSaveAndClose = () => {
    onSaveRelationships(localRelationships);
    onClose();
  };

  const getTensionColor = (level: number) => {
    if (level >= 85) return "text-rose-400 bg-rose-950/80 border-rose-500";
    if (level >= 65) return "text-amber-400 bg-amber-950/80 border-amber-500";
    if (level >= 45) return "text-yellow-400 bg-yellow-950/80 border-yellow-500";
    return "text-blue-400 bg-blue-950/80 border-blue-500";
  };

  const getTensionBadge = (level: number) => {
    if (level >= 90) return "🔥 Volkanik / Zirve Tutku";
    if (level >= 75) return "⚡ Yüksek Elektriklenme";
    if (level >= 50) return "✨ Belirgin Dinamik";
    return "🍃 Dingin / Sakin";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border-4 border-black shadow-comic-xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-3.5 sm:p-5 bg-gradient-to-r from-rose-950 via-slate-950 to-slate-900 border-b-4 border-black flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-600/30 border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-md flex-shrink-0">
              <Heart size={22} className="fill-rose-500/40" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-xl font-display text-white uppercase tracking-wider">
                  Karakter Kimya & Tansiyon Barometresi
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-900/80 text-rose-200 border border-rose-500/60 rounded uppercase font-bold">
                  {localRelationships.length} İlişki
                </span>
              </div>
              <p className="text-xs text-slate-300 font-comic">
                Karakterler arasındaki aşk, düşmanlık, gizli çekim veya rekabeti belirleyin; hikaye ve sahneler buna göre şekillensin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white border-2 border-black transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-3 bg-slate-950 border-b-2 border-black flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddNewRelationship}
              disabled={cast.length < 2}
              className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-display text-xs uppercase font-bold border-2 border-black shadow-comic flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={14} /> + Yeni İlişki Ekle
            </button>
            <button
              type="button"
              onClick={handleGenerateRandomAll}
              disabled={cast.length < 2}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-display text-xs uppercase font-bold border-2 border-black shadow-comic flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              title="Karakterler için otomatik eğlenceli ve çatışmalı dinamikler kurar"
            >
              <Dices size={14} /> 🎲 Rastgele Kimya Kur
            </button>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {cast.length < 2 ? "⚠️ En az 2 karakter gereklidir" : `Toplam ${cast.length} karakter`}
          </span>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {cast.length < 2 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-800 bg-slate-950/50">
              <Users size={36} className="mx-auto text-slate-600 mb-2" />
              <h4 className="font-display text-sm uppercase text-slate-300 mb-1">
                Yetersiz Karakter Sayısı
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Karakterler arası kimya ve romantik/düşmanca tansiyon kurmak için sol menüdeki Karakterler sekmesinden en az 2 karakter oluşturmalısınız.
              </p>
            </div>
          ) : localRelationships.length === 0 ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-800 bg-slate-950/50">
              <Heart size={36} className="mx-auto text-rose-500/50 mb-2" />
              <h4 className="font-display text-sm uppercase text-slate-300 mb-1">
                Henüz Tanımlanmış İlişki Yok
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                Karakterlerinizin sahnelerde birbirine nasıl davrandığını (tutkulu aşıklar, gizli flört, ezeli düşmanlar) belirlemek için yukarıdaki butonları kullanın.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={handleAddNewRelationship}
                  className="px-3 py-1.5 bg-yellow-400 text-black font-display text-xs uppercase font-bold border-2 border-black shadow-comic flex items-center gap-1.5"
                >
                  <Plus size={14} /> İlk İlişkiyi Tanımla
                </button>
                <button
                  type="button"
                  onClick={handleGenerateRandomAll}
                  className="px-3 py-1.5 bg-purple-700 text-white font-display text-xs uppercase font-bold border-2 border-black shadow-comic flex items-center gap-1.5"
                >
                  <Dices size={14} /> Otomatik Kimya Kur
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {localRelationships.map((rel, idx) => {
                const charA = cast.find(c => c.id === rel.sourceCharId || c.name === rel.sourceCharName) || cast[0];
                const charB = cast.find(c => c.id === rel.targetCharId || c.name === rel.targetCharName) || cast[1] || cast[0];
                const archetype = getRelationshipPreset(rel.type);
                const isEditing = editingRelId === rel.id;

                return (
                  <div 
                    key={rel.id}
                    className="p-3.5 sm:p-4 bg-slate-950 border-2 border-black shadow-comic space-y-3 transition-all"
                  >
                    {/* Character Pair Header */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Char A Selector */}
                        <select
                          value={rel.sourceCharId}
                          onChange={(e) => {
                            const found = cast.find(c => c.id === e.target.value);
                            handleUpdateRelationship(rel.id, {
                              sourceCharId: e.target.value,
                              sourceCharName: found?.name || rel.sourceCharName
                            });
                          }}
                          className="bg-slate-900 border-2 border-black px-2 py-1 text-xs font-bold font-comic text-yellow-300 outline-none cursor-pointer"
                        >
                          {cast.map(c => (
                            <option key={`opt-a-${c.id}`} value={c.id}>{c.name}</option>
                          ))}
                        </select>

                        {/* Interactive Connection Icon */}
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs">
                          <span className="text-base">{archetype.icon}</span>
                          <ArrowRightLeft size={12} className={rel.isReciprocal ? "text-emerald-400" : "text-amber-400"} />
                        </div>

                        {/* Char B Selector */}
                        <select
                          value={rel.targetCharId}
                          onChange={(e) => {
                            const found = cast.find(c => c.id === e.target.value);
                            handleUpdateRelationship(rel.id, {
                              targetCharId: e.target.value,
                              targetCharName: found?.name || rel.targetCharName
                            });
                          }}
                          className="bg-slate-900 border-2 border-black px-2 py-1 text-xs font-bold font-comic text-yellow-300 outline-none cursor-pointer"
                        >
                          {cast.map(c => (
                            <option key={`opt-b-${c.id}`} value={c.id}>{c.name}</option>
                          ))}
                        </select>

                        {/* Archetype Badge */}
                        <span className={cn(
                          "text-[10px] font-mono font-bold px-2 py-0.5 border rounded uppercase flex items-center gap-1",
                          archetype.colorClass
                        )}>
                          <span>{archetype.icon}</span>
                          <span>{archetype.label}</span>
                        </span>
                      </div>

                      {/* Delete & Toggle reciprocal */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateRelationship(rel.id, { isReciprocal: !rel.isReciprocal })}
                          className={cn(
                            "px-2 py-0.5 text-[9px] font-mono border rounded uppercase cursor-pointer transition-colors",
                            rel.isReciprocal 
                              ? "bg-emerald-950 text-emerald-300 border-emerald-500/60" 
                              : "bg-slate-900 text-slate-400 border-slate-700"
                          )}
                          title={rel.isReciprocal ? "İki taraf da aynı duyguları paylaşıyor (Karşılıklı)" : "Tek taraflı bağ"}
                        >
                          {rel.isReciprocal ? "✓ Karşılıklı" : "Tek Taraflı"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRelationship(rel.id)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-900 cursor-pointer transition-colors"
                          title="Bu ilişkiyi sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Archetype Quick Selector Chips */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block">
                        İlişki Arketipi Seçin:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {RELATIONSHIP_ARCHETYPES.map(arch => (
                          <button
                            key={arch.type}
                            type="button"
                            onClick={() => handleUpdateRelationship(rel.id, { 
                              type: arch.type,
                              typeLabel: arch.label,
                              tensionLevel: arch.defaultTension,
                              dialogueSubtext: arch.defaultSubtext
                            })}
                            className={cn(
                              "px-2 py-1 text-[10px] font-comic border rounded-xs transition-all flex items-center gap-1 cursor-pointer",
                              rel.type === arch.type
                                ? "bg-yellow-400 text-black border-black font-bold shadow-xs scale-102"
                                : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600"
                            )}
                          >
                            <span>{arch.icon}</span>
                            <span>{arch.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tension Barometer Slider */}
                    <div className="p-2.5 bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-bold text-slate-200 uppercase flex items-center gap-1.5">
                          <Flame size={13} className="text-rose-500 fill-rose-500" /> Tansiyon & Kimya Barometresi:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-[10px] font-mono px-2 py-0.5 border rounded uppercase font-bold",
                            getTensionColor(rel.tensionLevel)
                          )}>
                            %{rel.tensionLevel} &bull; {getTensionBadge(rel.tensionLevel)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-slate-500">%0</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={rel.tensionLevel}
                          onChange={(e) => handleUpdateRelationship(rel.id, { tensionLevel: Number(e.target.value) })}
                          className="flex-1 accent-rose-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-rose-400 font-bold">%100</span>
                      </div>
                    </div>

                    {/* Dialogue & Subtext Guidance */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                          <MessageCircle size={11} /> Konuşma & Alt Metin Tarzı:
                        </label>
                        <input
                          type="text"
                          value={rel.dialogueSubtext || ""}
                          onChange={(e) => handleUpdateRelationship(rel.id, { dialogueSubtext: e.target.value })}
                          placeholder="Örn: Nefes nefese yakınlaşma, alaycı ama korumacı"
                          className="w-full bg-slate-900 border border-slate-700 p-2 text-xs font-comic text-slate-100 placeholder-slate-600 focus:border-yellow-400 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                          <Sliders size={11} /> İlişki Geçmişi ve Dinamikler:
                        </label>
                        <input
                          type="text"
                          value={rel.description || ""}
                          onChange={(e) => handleUpdateRelationship(rel.id, { description: e.target.value })}
                          placeholder="Örn: Eski bir sır aralarındaki çekimi tehlikeli kılıyor"
                          className="w-full bg-slate-900 border border-slate-700 p-2 text-xs font-comic text-slate-100 placeholder-slate-600 focus:border-yellow-400 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t-2 border-black flex items-center justify-between gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-display text-xs uppercase border-2 border-black cursor-pointer"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-display text-xs uppercase font-bold border-2 border-black shadow-comic flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Check size={14} /> Kimya Matrisini Kaydet ({localRelationships.length})
          </button>
        </div>

      </div>
    </div>
  );
};
