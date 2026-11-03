import React, { useState, useEffect } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink, Trash2, ShieldCheck, Loader2, X, Zap, Sparkles, Flame } from "lucide-react";
import { 
  getUserApiKey, 
  setUserApiKey, 
  removeUserApiKey, 
  testAndValidateApiKey,
  getTogetherApiKey,
  setTogetherApiKey,
  removeTogetherApiKey,
  testAndValidateTogetherApiKey,
  getFalApiKey,
  setFalApiKey,
  removeFalApiKey,
  testAndValidateFalApiKey,
  getPollinationsApiKey,
  setPollinationsApiKey,
  removePollinationsApiKey,
  testAndValidatePollinationsApiKey,
  getPollinationsModel,
  setPollinationsModel
} from "../services/geminiService";
import { POLLINATIONS_MODELS } from "../types";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyChange?: (hasKey: boolean) => void;
  onModelChange?: (model: string) => void;
  initialTab?: "fal" | "together" | "gemini" | "pollinations";
  onSelectFreeFlux?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ 
  isOpen, 
  onClose, 
  onKeyChange, 
  onModelChange,
  initialTab = "pollinations",
  onSelectFreeFlux
}) => {
  const [activeTab, setActiveTab] = useState<"fal" | "together" | "gemini" | "pollinations">(initialTab);
  
  // Pollinations.ai State
  const [pollinationsKeyInput, setPollinationsKeyInput] = useState("");
  const [pollinationsModel, setPollinationsModelLocal] = useState<string>("flux");
  const [showPollinationsKey, setShowPollinationsKey] = useState(false);
  const [isValidatingPollinations, setIsValidatingPollinations] = useState(false);
  const [pollinationsStatus, setPollinationsStatus] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [savedPollinationsKey, setSavedPollinationsKey] = useState("");

  // fal.ai State
  const [falKeyInput, setFalKeyInput] = useState("");
  const [showFalKey, setShowFalKey] = useState(false);
  const [isValidatingFal, setIsValidatingFal] = useState(false);
  const [falStatus, setFalStatus] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [savedFalKey, setSavedFalKey] = useState("");

  // Together AI State
  const [togetherKeyInput, setTogetherKeyInput] = useState("");
  const [showTogetherKey, setShowTogetherKey] = useState(false);
  const [isValidatingTogether, setIsValidatingTogether] = useState(false);
  const [togetherStatus, setTogetherStatus] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [savedTogetherKey, setSavedTogetherKey] = useState("");

  // Gemini State
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isValidatingGemini, setIsValidatingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [savedGeminiKey, setSavedGeminiKey] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      const curPollinations = getPollinationsApiKey();
      setSavedPollinationsKey(curPollinations);
      setPollinationsKeyInput(curPollinations);
      setPollinationsStatus(null);
      setPollinationsModelLocal(getPollinationsModel());

      const curFal = getFalApiKey();
      setSavedFalKey(curFal);
      setFalKeyInput(curFal);
      setFalStatus(null);

      const curTogether = getTogetherApiKey();
      setSavedTogetherKey(curTogether);
      setTogetherKeyInput(curTogether);
      setTogetherStatus(null);

      const curGemini = getUserApiKey();
      setSavedGeminiKey(curGemini);
      setGeminiKeyInput(curGemini);
      setGeminiStatus(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Pollinations Handlers
  const handleTestPollinationsKey = async () => {
    const key = pollinationsKeyInput.trim();
    setIsValidatingPollinations(true);
    setPollinationsStatus({ type: "info", text: "Pollinations.ai sunucularına bağlanılıyor..." });

    try {
      const res = await testAndValidatePollinationsApiKey(key);
      if (res.valid) {
        setPollinationsStatus({ type: "success", text: res.message || "Tebrikler! Pollinations.ai Gen API bağlandı." });
      } else {
        setPollinationsStatus({ type: "error", text: res.message || "Pollinations.ai anahtarı doğrulanamadı." });
      }
    } catch (e: any) {
      setPollinationsStatus({ type: "error", text: e?.message || "Bağlantı testi başarısız oldu." });
    } finally {
      setIsValidatingPollinations(false);
    }
  };

  const handleSavePollinations = () => {
    const key = pollinationsKeyInput.trim();
    setPollinationsApiKey(key);
    setSavedPollinationsKey(key);
    setPollinationsStatus({ 
      type: "success", 
      text: key 
        ? "Pollinations.ai API Anahtarınız kaydedildi! Öncelikli üretim aktif." 
        : "Varsayılan %100 Ücretsiz Mod aktif!" 
    });
    onKeyChange?.(Boolean(key));
  };

  const handleRemovePollinations = () => {
    removePollinationsApiKey();
    setSavedPollinationsKey("");
    setPollinationsKeyInput("");
    setPollinationsStatus({ type: "info", text: "Pollinations.ai özel anahtarı kaldırıldı. Varsayılan %100 Ücretsiz mod devrede." });
    onKeyChange?.(false);
  };

  // fal.ai Handlers
  const handleTestFalKey = async () => {
    const key = falKeyInput.trim();
    if (!key) {
      setFalStatus({ type: "error", text: "Lütfen önce test edilecek bir fal.ai API anahtarı girin." });
      return;
    }
    setIsValidatingFal(true);
    setFalStatus({ type: "info", text: "fal.ai sunucularına bağlanılıyor..." });

    try {
      const res = await testAndValidateFalApiKey(key);
      if (res.valid) {
        setFalStatus({ type: "success", text: res.message || "Tebrikler! fal.ai bağlandı. FLUX.1 modelleri hazır!" });
      } else {
        setFalStatus({ type: "error", text: res.message || "fal.ai anahtarı doğrulanamadı." });
      }
    } catch (e: any) {
      setFalStatus({ type: "error", text: e?.message || "Bağlantı testi başarısız oldu." });
    } finally {
      setIsValidatingFal(false);
    }
  };

  const handleSaveFal = () => {
    const key = falKeyInput.trim();
    if (!key) {
      setFalStatus({ type: "error", text: "Boş fal.ai anahtarı kaydedilemez." });
      return;
    }
    setFalApiKey(key);
    setSavedFalKey(key);
    setFalStatus({ type: "success", text: "fal.ai Anahtarınız kaydedildi! FLUX.1 [schnell] ve [dev] aktif." });
    onKeyChange?.(true);
  };

  const handleRemoveFal = () => {
    removeFalApiKey();
    setSavedFalKey("");
    setFalKeyInput("");
    setFalStatus({ type: "info", text: "fal.ai API anahtarı kaldırıldı." });
    onKeyChange?.(false);
  };

  // Together AI Handlers
  const handleTestTogetherKey = async () => {
    const key = togetherKeyInput.trim();
    if (!key) {
      setTogetherStatus({ type: "error", text: "Lütfen önce test edilecek bir Together AI API anahtarı girin." });
      return;
    }
    setIsValidatingTogether(true);
    setTogetherStatus({ type: "info", text: "Together AI sunucularına bağlanılıyor..." });

    try {
      const res = await testAndValidateTogetherApiKey(key);
      if (res.valid) {
        setTogetherStatus({ type: "success", text: res.message || "Tebrikler! Together AI bağlandı. FLUX.1 modelleri hazır!" });
      } else {
        setTogetherStatus({ type: "error", text: res.message || "Together AI anahtarı doğrulanamadı." });
      }
    } catch (e: any) {
      setTogetherStatus({ type: "error", text: e?.message || "Bağlantı testi başarısız oldu." });
    } finally {
      setIsValidatingTogether(false);
    }
  };

  const handleSaveTogether = () => {
    const key = togetherKeyInput.trim();
    if (!key) {
      setTogetherStatus({ type: "error", text: "Boş Together AI anahtarı kaydedilemez." });
      return;
    }
    setTogetherApiKey(key);
    setSavedTogetherKey(key);
    setTogetherStatus({ type: "success", text: "Together AI Anahtarınız kaydedildi! FLUX.1 [dev] ve [schnell] aktif." });
    onKeyChange?.(true);
  };

  const handleRemoveTogether = () => {
    removeTogetherApiKey();
    setSavedTogetherKey("");
    setTogetherKeyInput("");
    setTogetherStatus({ type: "info", text: "Together AI API anahtarı kaldırıldı." });
    onKeyChange?.(false);
  };

  // Gemini Handlers
  const handleTestGeminiKey = async () => {
    const key = geminiKeyInput.trim();
    if (!key) {
      setGeminiStatus({ type: "error", text: "Lütfen önce test edilecek bir Gemini API anahtarı girin." });
      return;
    }
    setIsValidatingGemini(true);
    setGeminiStatus({ type: "info", text: "API anahtarı Google Gemini sunucularında test ediliyor..." });

    try {
      const res = await testAndValidateApiKey(key);
      if (res.valid) {
        setGeminiStatus({ type: "success", text: res.message || "Tebrikler! Gemini API anahtarı başarıyla doğrulandı." });
      } else {
        setGeminiStatus({ type: "error", text: res.message || "Gemini API anahtarı doğrulanamadı." });
      }
    } catch (e: any) {
      setGeminiStatus({ type: "error", text: e?.message || "Bağlantı testi başarısız oldu." });
    } finally {
      setIsValidatingGemini(false);
    }
  };

  const handleSaveGemini = () => {
    const key = geminiKeyInput.trim();
    if (!key) {
      setGeminiStatus({ type: "error", text: "Boş API anahtarı kaydedilemez." });
      return;
    }
    setUserApiKey(key);
    setSavedGeminiKey(key);
    setGeminiStatus({ type: "success", text: "Gemini API Anahtarınız kaydedildi! Kişisel kotanızla çalışacaksınız." });
    onKeyChange?.(true);
  };

  const handleRemoveGemini = () => {
    removeUserApiKey();
    setSavedGeminiKey("");
    setGeminiKeyInput("");
    setGeminiStatus({ type: "info", text: "Özel Gemini API anahtarı kaldırıldı." });
    onKeyChange?.(false);
  };

  return (
    <div className="fixed inset-0 z-[230] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div 
        className="bg-white border-4 border-black shadow-comic-xl max-w-xl w-full p-4 sm:p-6 relative max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b-2 border-black mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-yellow-400 border-2 border-black flex items-center justify-center shadow-comic">
              <KeyRound className="text-black" size={18} />
            </div>
            <div>
              <h3 className="font-display text-lg sm:text-2xl uppercase tracking-wider text-black leading-tight">
                Görsel Motorları & API Anahtarları
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-600 font-mono">
                Pollinations (0 TL / Gen API), fal.ai, Together AI & Gemini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 border-2 border-black transition-colors cursor-pointer"
            title="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-2 border-black bg-slate-100 p-1 gap-1 mb-4 shadow-comic-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab("pollinations")}
            className={`flex-1 py-2 px-2 font-display text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "pollinations"
                ? "bg-black text-emerald-400 shadow-xs font-bold"
                : "text-slate-600 hover:text-black hover:bg-slate-200"
            }`}
          >
            <Zap size={14} className={activeTab === "pollinations" ? "text-emerald-400 fill-emerald-400" : ""} />
            <span>Pollinations</span>
            <span className="text-[9px] font-mono px-1 py-0.2 bg-emerald-400 text-black font-black uppercase">
              0 TL
            </span>
            {savedPollinationsKey && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
          </button>

          <button
            onClick={() => setActiveTab("fal")}
            className={`flex-1 py-2 px-2 font-display text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "fal"
                ? "bg-black text-yellow-300 shadow-xs font-bold"
                : "text-slate-600 hover:text-black hover:bg-slate-200"
            }`}
          >
            <Flame size={14} className={activeTab === "fal" ? "text-orange-400 fill-orange-400" : ""} />
            <span>fal.ai</span>
            {savedFalKey && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
          </button>

          <button
            onClick={() => setActiveTab("together")}
            className={`flex-1 py-2 px-2 font-display text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "together"
                ? "bg-black text-yellow-300 shadow-xs font-bold"
                : "text-slate-600 hover:text-black hover:bg-slate-200"
            }`}
          >
            <Zap size={14} className={activeTab === "together" ? "text-yellow-400 fill-yellow-400" : ""} />
            <span>Together</span>
            {savedTogetherKey && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
          </button>

          <button
            onClick={() => setActiveTab("gemini")}
            className={`flex-1 py-2 px-2 font-display text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "gemini"
                ? "bg-black text-yellow-300 shadow-xs font-bold"
                : "text-slate-600 hover:text-black hover:bg-slate-200"
            }`}
          >
            <Sparkles size={14} className={activeTab === "gemini" ? "text-yellow-400 fill-yellow-400" : ""} />
            <span>Gemini</span>
            {savedGeminiKey && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
          </button>
        </div>

        {/* TAB 0: POLLINATIONS.AI (GEN API & FLUX) */}
        {activeTab === "pollinations" && (
          <div className="space-y-4">
            {/* Status Indicator */}
            <div className="p-3 border-2 border-black shadow-comic text-xs">
              {savedPollinationsKey ? (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 -m-3 p-3">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold font-display uppercase tracking-wide">Pollinations Gen API Aktif (Öncelikli FLUX):</span>
                    <p className="text-[11px] font-mono text-emerald-700">
                      {savedPollinationsKey.substring(0, 8)}••••••••••••••••••••{savedPollinationsKey.slice(-4)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-950 bg-emerald-50 -m-3 p-3">
                  <Zap size={18} className="text-emerald-600 shrink-0 fill-emerald-500" />
                  <div>
                    <span className="font-bold font-display uppercase tracking-wide">%100 Ücretsiz & Sınırsız Mod Aktif (0 TL)</span>
                    <p className="text-[11px] text-emerald-900">
                      Varsayılan olarak herhangi bir API anahtarı gerekmez. İsteğe bağlı olarak kişisel anahtar tanımlayarak daha yüksek öncelik ve pro hız elde edebilirsiniz.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Pollinations Mod / Model Seçimi - URL Üzerinden Doğrudan Üretim */}
            <div className="space-y-2.5 p-3.5 bg-emerald-50/70 border-2 border-black shadow-comic">
              <div className="flex items-center justify-between">
                <label className="text-xs font-display uppercase tracking-wider text-black font-bold flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-600" />
                  URL ile Doğrudan Üretim (%100 Ücretsiz Mod):
                </label>
                <span className="text-[10px] font-mono font-bold bg-black text-emerald-400 px-2 py-0.5 rounded-xs truncate max-w-[160px]" title={pollinationsModel}>
                  {POLLINATIONS_MODELS.find(m => m.id === pollinationsModel)?.label || pollinationsModel || "FLUX.1 (Standart)"}
                </span>
              </div>
              
              <div className="p-2.5 bg-white border border-emerald-300 rounded text-xs space-y-1">
                <div className="font-bold text-[11px] text-emerald-950 flex items-center gap-1">
                  <span>⚡ En Hızlı & Sıfır Maliyetli Yöntem:</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Herhangi bir kart, bakiye veya API anahtarı gerektirmeden doğrudan şu formatla anında çizim yapar:
                </p>
                <div className="bg-slate-900 text-emerald-300 font-mono text-[10px] p-1.5 rounded select-all break-all border border-slate-700">
                  https://image.pollinations.ai/prompt/[Görsel-Tanımı]?model={pollinationsModel || "flux"}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                {POLLINATIONS_MODELS.map((pMod) => {
                  const isSelected = (pollinationsModel || "flux") === pMod.id;
                  return (
                    <button
                      key={pMod.id}
                      type="button"
                      onClick={() => {
                        setPollinationsModel(pMod.id);
                        setPollinationsModelLocal(pMod.id);
                        onModelChange?.(pMod.id);
                      }}
                      className={`p-2 border-2 text-left transition-all rounded-xs flex flex-col justify-between group cursor-pointer ${
                        isSelected
                          ? "bg-black text-emerald-300 border-black shadow-comic-xs ring-1 ring-emerald-400"
                          : "bg-white border-slate-300 text-slate-700 hover:border-black hover:bg-slate-50"
                      }`}
                      title={`${pMod.name} (${pMod.id})`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="font-bold text-[11px] truncate flex items-center gap-1">
                          <span>{pMod.icon}</span>
                          <span className="truncate">{pMod.label}</span>
                        </span>
                        <span className={`text-[7.5px] font-mono px-1 py-0.2 rounded uppercase font-black shrink-0 ${
                          isSelected ? "bg-emerald-400 text-black" : "bg-slate-200 text-slate-700"
                        }`}>
                          {pMod.badge}
                        </span>
                      </div>
                      <span className={`text-[9px] leading-tight mt-1 line-clamp-1 ${
                        isSelected ? "text-emerald-200/80" : "text-slate-500"
                      }`}>
                        {pMod.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Area */}
            <div className="space-y-2">
              <label className="block text-xs font-display uppercase tracking-wider text-slate-800">
                Pollinations API Anahtarınız (Opsiyonel - sk_... veya pk_...):
              </label>
              <div className="relative">
                <input
                  type={showPollinationsKey ? "text" : "password"}
                  value={pollinationsKeyInput}
                  onChange={(e) => setPollinationsKeyInput(e.target.value)}
                  placeholder="sk_... veya pk_... (Boş bırakırsanız ücretsiz çalışır)"
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border-2 border-black text-xs sm:text-sm font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPollinationsKey(!showPollinationsKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-black p-1 cursor-pointer"
                  title={showPollinationsKey ? "Gizle" : "Göster"}
                >
                  {showPollinationsKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Feedback Message */}
              {pollinationsStatus && (
                <div className={`p-2.5 text-xs border-2 border-black shadow-comic flex items-start gap-2 ${
                  pollinationsStatus.type === "success" ? "bg-green-100 text-green-900" :
                  pollinationsStatus.type === "error" ? "bg-red-100 text-red-900" :
                  "bg-blue-100 text-blue-900"
                }`}>
                  {pollinationsStatus.type === "success" && <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-green-700" />}
                  {pollinationsStatus.type === "error" && <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-700" />}
                  {pollinationsStatus.type === "info" && <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin text-blue-700" />}
                  <span className="leading-snug">{pollinationsStatus.text}</span>
                </div>
              )}

              {/* Buttons Row */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestPollinationsKey}
                  disabled={isValidatingPollinations}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border-2 border-black shadow-comic text-[11px] sm:text-xs font-display uppercase tracking-wider font-bold active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isValidatingPollinations ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                  Test Et
                </button>

                <button
                  type="button"
                  onClick={handleSavePollinations}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-comic text-[11px] sm:text-xs font-display uppercase tracking-wider font-bold active:scale-95 transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                >
                  <CheckCircle2 size={13} />
                  Kaydet & Kullan
                </button>

                {savedPollinationsKey && (
                  <button
                    type="button"
                    onClick={handleRemovePollinations}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-black shadow-comic text-[11px] sm:text-xs font-display uppercase tracking-wider font-bold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Kayıtlı anahtarı sil"
                  >
                    <Trash2 size={13} />
                    Kaldır
                  </button>
                )}
              </div>
            </div>

            {/* Quick Guide */}
            <div className="p-3.5 bg-slate-50 border-2 border-black shadow-comic space-y-2 text-xs">
              <div className="flex items-center justify-between font-display text-xs sm:text-sm uppercase font-bold text-black border-b border-slate-300 pb-1.5">
                <span>Pollinations Gen API Anahtarı Nasıl Alınır?</span>
                <span className="bg-emerald-400 text-black px-1.5 py-0.5 text-[10px] rounded-xs font-mono">Opsiyonel</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
                <li>
                  <strong>Pollinations Keys</strong> sayfasına gidin:{" "}
                  <a
                    href="https://enter.pollinations.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline font-bold inline-flex items-center gap-0.5"
                  >
                    enter.pollinations.ai/keys <ExternalLink size={11} />
                  </a>
                </li>
                <li>GitHub veya Google ile giriş yapın ve <strong>"Create Key"</strong> butonuna basın.</li>
                <li>Oluşturulan <code>sk_...</code> anahtarını yukarıdaki kutucuğa yapıştırın (Daha yüksek hız ve öncelik sağlar).</li>
              </ol>
            </div>

            {/* 0 TL Direct Button */}
            {onSelectFreeFlux && (
              <button
                type="button"
                onClick={() => {
                  onSelectFreeFlux();
                  onClose();
                }}
                className="w-full py-2.5 px-3 bg-emerald-400 hover:bg-emerald-300 text-black font-display font-black text-xs uppercase border-2 border-black shadow-comic-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Zap size={14} className="fill-black" />
                <span>Kart / Anahtar Olmadan %100 Ücretsiz FLUX'ı Seç</span>
              </button>
            )}
          </div>
        )}

        {/* TAB 1: FAL.AI (FLUX.1) */}
        {activeTab === "fal" && (
          <div className="space-y-4">
            {/* Status Indicator */}
            <div className="p-3 border-2 border-black shadow-comic text-xs">
              {savedFalKey ? (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 -m-3 p-3">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold font-display uppercase tracking-wide">fal.ai Aktif (FLUX.1 Dev/Schnell):</span>
                    <p className="text-[11px] font-mono text-emerald-700">
                      {savedFalKey.substring(0, 8)}••••••••••••••••••••{savedFalKey.slice(-4)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-950 bg-orange-50 -m-3 p-3">
                  <Flame size={18} className="text-orange-600 shrink-0" />
                  <div>
                    <span className="font-bold font-display uppercase tracking-wide">Yıldırım Hızında FLUX.1 (~1 Saniye)</span>
                    <p className="text-[11px] text-orange-900">
                      fal.ai anahtarınızı girerek FLUX.1 [schnell] ile 1 saniyede ultra net 2D çizgi roman kareleri çizebilirsiniz.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="space-y-2">
              <label className="block text-xs font-display uppercase tracking-wider text-slate-800">
                fal.ai API Anahtarınız (Key ID:Secret veya Token):
              </label>
              <div className="relative">
                <input
                  type={showFalKey ? "text" : "password"}
                  value={falKeyInput}
                  onChange={(e) => setFalKeyInput(e.target.value)}
                  placeholder="fal_key veya Key id:secret..."
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border-2 border-black text-xs sm:text-sm font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  type="button"
                  onClick={() => setShowFalKey(!showFalKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-black p-1 cursor-pointer"
                  title={showFalKey ? "Gizle" : "Göster"}
                >
                  {showFalKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Feedback Message */}
              {falStatus && (
                <div className={`p-2.5 text-xs border-2 border-black shadow-comic flex items-start gap-2 ${
                  falStatus.type === "success" ? "bg-green-100 text-green-900" :
                  falStatus.type === "error" ? "bg-red-100 text-red-900" :
                  "bg-blue-100 text-blue-900"
                }`}>
                  {falStatus.type === "success" && <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-green-700" />}
                  {falStatus.type === "error" && <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-700" />}
                  {falStatus.type === "info" && <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin text-blue-700" />}
                  <span className="leading-snug">{falStatus.text}</span>
                </div>
              )}

              {/* Buttons Row */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestFalKey}
                  disabled={isValidatingFal || !falKeyInput.trim()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border-2 border-black shadow-comic text-[11px] sm:text-xs font-display uppercase tracking-wider font-bold active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isValidatingFal ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                  Test Et & Bağlan
                </button>

                <button
                  type="button"
                  onClick={handleSaveFal}
                  disabled={!falKeyInput.trim()}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-comic text-[11px] sm:text-xs font-display uppercase tracking-wider font-bold active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 ml-auto cursor-pointer"
                >
                  <CheckCircle2 size={13} />
                  Kaydet & Aktifleştir
                </button>

                {savedFalKey && (
                  <button
                    type="button"
                    onClick={handleRemoveFal}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-black shadow-comic text-[11px] sm:text-xs font-display uppercase tracking-wider font-bold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Kayıtlı anahtarı sil"
                  >
                    <Trash2 size={13} />
                    Kaldır
                  </button>
                )}
              </div>
            </div>

            {/* fal.ai Guide */}
            <div className="p-3.5 bg-slate-50 border-2 border-black shadow-comic space-y-2 text-xs">
              <div className="flex items-center justify-between font-display text-xs sm:text-sm uppercase font-bold text-black border-b border-slate-300 pb-1.5">
                <span>fal.ai Anahtarı Nasıl Alınır?</span>
                <span className="bg-orange-400 text-black px-1.5 py-0.5 text-[10px] rounded-xs font-mono font-bold">Ultra Hızlı FLUX</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
                <li>
                  <strong>fal.ai</strong> adresine gidin:{" "}
                  <a
                    href="https://fal.ai/dashboard/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline font-bold inline-flex items-center gap-0.5"
                  >
                    fal.ai/dashboard/keys <ExternalLink size={11} />
                  </a>
                </li>
                <li>GitHub veya Google ile saniyeler içinde giriş yapın.</li>
                <li><strong>"Add Key"</strong> butonuna basıp anahtarınızı kopyalayın ve yukarıdaki alana yapıştırın.</li>
              </ol>
            </div>

            {/* 0 TL Alternative */}
            {onSelectFreeFlux && (
              <button
                type="button"
                onClick={() => {
                  onSelectFreeFlux();
                  onClose();
                }}
                className="w-full py-2.5 px-3 bg-emerald-400 hover:bg-emerald-300 text-black font-display font-black text-xs uppercase border-2 border-black shadow-comic-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Zap size={14} className="fill-black" />
                <span>Kart ve Üye Olmadan 0 TL: %100 Ücretsiz FLUX'a Dön</span>
              </button>
            )}
          </div>
        )}

        {/* TAB 2: TOGETHER AI (FLUX.1) */}
        {activeTab === "together" && (
          <div className="space-y-4">
            {/* Status Indicator */}
            <div className="p-3 border-2 border-black shadow-comic text-xs">
              {savedTogetherKey ? (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 -m-3 p-3">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold font-display uppercase tracking-wide">Together AI Aktif (FLUX.1 Dev/Schnell):</span>
                    <p className="text-[11px] font-mono text-emerald-700">
                      {savedTogetherKey.substring(0, 8)}••••••••••••••••••••{savedTogetherKey.slice(-4)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-indigo-900 bg-indigo-50 -m-3 p-3">
                  <Zap size={18} className="text-indigo-600 shrink-0" />
                  <div>
                    <span className="font-bold font-display uppercase tracking-wide">Together AI FLUX Modelleri</span>
                    <p className="text-[11px] text-indigo-800">
                      Together AI anahtarınız varsa FLUX.1 [dev] ve [schnell] modellerini doğrudan çalıştırabilirsiniz.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="space-y-2">
              <label className="block text-xs font-display uppercase tracking-wider text-slate-800">
                Together AI API Anahtarı:
              </label>
              <div className="relative">
                <input
                  type={showTogetherKey ? "text" : "password"}
                  value={togetherKeyInput}
                  onChange={(e) => setTogetherKeyInput(e.target.value)}
                  placeholder="together-api-key..."
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border-2 border-black text-xs sm:text-sm font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  type="button"
                  onClick={() => setShowTogetherKey(!showTogetherKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-black p-1 cursor-pointer"
                  title={showTogetherKey ? "Gizle" : "Göster"}
                >
                  {showTogetherKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Feedback Message */}
              {togetherStatus && (
                <div className={`p-2.5 text-xs border-2 border-black shadow-comic flex items-start gap-2 ${
                  togetherStatus.type === "success" ? "bg-green-100 text-green-900" :
                  togetherStatus.type === "error" ? "bg-red-100 text-red-900" :
                  "bg-blue-100 text-blue-900"
                }`}>
                  {togetherStatus.type === "success" && <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-green-700" />}
                  {togetherStatus.type === "error" && <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-700" />}
                  {togetherStatus.type === "info" && <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin text-blue-700" />}
                  <span className="leading-snug">{togetherStatus.text}</span>
                </div>
              )}

              {/* Buttons Row */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestTogetherKey}
                  disabled={isValidatingTogether || !togetherKeyInput.trim()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border-2 border-black shadow-comic text-[11px] sm:text-xs font-display uppercase tracking-wider font-bold active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isValidatingTogether ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                  Test Et & Bağlan
                </button>

                <button
                  type="button"
                  onClick={handleSaveTogether}
                  disabled={!togetherKeyInput.trim()}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-comic text-[11px] sm:text-xs font-display uppercase tracking-wider font-bold active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 ml-auto cursor-pointer"
                >
                  <CheckCircle2 size={13} />
                  Kaydet & Aktifleştir
                </button>

                {savedTogetherKey && (
                  <button
                    type="button"
                    onClick={handleRemoveTogether}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-black shadow-comic text-[11px] sm:text-xs font-display uppercase tracking-wider font-bold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Kayıtlı anahtarı sil"
                  >
                    <Trash2 size={13} />
                    Kaldır
                  </button>
                )}
              </div>
            </div>

            {/* Payment Warning & Free Alternative */}
            <div className="p-3 bg-amber-50 border-2 border-amber-500/70 text-xs space-y-2 shadow-comic-xs">
              <div className="flex items-start gap-2 text-amber-950 font-bold">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <span>Kart Bilgisi veya Ödeme Girmek İstemiyor Musunuz?</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Together AI sizden kart veya ödeme istiyorsa <strong>kesinlikle kart girmeyin</strong>! Sitemizde hiçbir kart ve ücret istemeyen <strong>%100 Ücretsiz FLUX</strong> motoru mevcuttur.
              </p>
              {onSelectFreeFlux && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectFreeFlux();
                    onClose();
                  }}
                  className="w-full py-2.5 px-3 bg-emerald-400 hover:bg-emerald-300 text-black font-display font-black text-xs uppercase border-2 border-black shadow-comic-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Zap size={14} className="fill-black" />
                  <span>Kredi Kartsız & 0 TL: %100 Ücretsiz FLUX'a Geç</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: GOOGLE GEMINI */}
        {activeTab === "gemini" && (
          <div className="space-y-4">
            {/* Status Indicator Banner */}
            <div className="p-3 border-2 border-black shadow-comic text-xs font-sans">
              {savedGeminiKey ? (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 -m-3 p-3">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold font-display uppercase tracking-wide">Kişisel Gemini Anahtarınız Aktif:</span>
                    <p className="text-[11px] font-mono text-emerald-700">
                      {savedGeminiKey.substring(0, 8)}••••••••••••••••••••{savedGeminiKey.slice(-4)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-900 bg-amber-50 -m-3 p-3">
                  <AlertCircle size={18} className="text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold font-display uppercase tracking-wide">Özel Gemini Anahtarı Tanımlı Değil</span>
                    <p className="text-[11px] text-amber-800">
                      Google AI Studio anahtarınızı girerek senaryo motorunu ve Imagen 3 çizimlerini kendi kotanızla çalıştırabilirsiniz.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="space-y-2">
              <label className="block text-xs font-display uppercase tracking-wider text-slate-800">
                Google Gemini API Anahtarınız:
              </label>
              <div className="relative">
                <input
                  type={showGeminiKey ? "text" : "password"}
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border-2 border-black text-xs sm:text-sm font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-black p-1 cursor-pointer"
                  title={showGeminiKey ? "Gizle" : "Göster"}
                >
                  {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Feedback Message */}
              {geminiStatus && (
                <div className={`p-2.5 text-xs border-2 border-black shadow-comic flex items-start gap-2 ${
                  geminiStatus.type === "success" ? "bg-green-100 text-green-900" :
                  geminiStatus.type === "error" ? "bg-red-100 text-red-900" :
                  "bg-blue-100 text-blue-900"
                }`}>
                  {geminiStatus.type === "success" && <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-green-700" />}
                  {geminiStatus.type === "error" && <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-700" />}
                  {geminiStatus.type === "info" && <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin text-blue-700" />}
                  <span className="leading-snug">{geminiStatus.text}</span>
                </div>
              )}

              {/* Buttons Row */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestGeminiKey}
                  disabled={isValidatingGemini || !geminiKeyInput.trim()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border-2 border-black shadow-comic text-[11px] sm:text-xs font-display uppercase tracking-wider font-bold active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isValidatingGemini ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
                  Test Et
                </button>

                <button
                  type="button"
                  onClick={handleSaveGemini}
                  disabled={!geminiKeyInput.trim()}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-comic text-[11px] sm:text-xs font-display uppercase tracking-wider font-bold active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 ml-auto cursor-pointer"
                >
                  <CheckCircle2 size={13} />
                  Kaydet & Kullan
                </button>

                {savedGeminiKey && (
                  <button
                    type="button"
                    onClick={handleRemoveGemini}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 border-2 border-black shadow-comic text-[11px] sm:text-xs font-display uppercase tracking-wider font-bold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Kayıtlı anahtarı sil"
                  >
                    <Trash2 size={13} />
                    Kaldır
                  </button>
                )}
              </div>
            </div>

            {/* Free API Key Guide */}
            <div className="p-3.5 bg-slate-50 border-2 border-black shadow-comic space-y-2 text-xs">
              <div className="flex items-center justify-between font-display text-xs sm:text-sm uppercase font-bold text-black border-b border-slate-300 pb-1.5">
                <span>Ücretsiz Gemini API Anahtarı Nasıl Alınır?</span>
                <span className="bg-yellow-400 text-black px-1.5 py-0.5 text-[10px] rounded-xs font-mono">30 Saniye</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
                <li>
                  <strong>Google AI Studio</strong> sitesine gidin:{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline font-bold inline-flex items-center gap-0.5"
                  >
                    aistudio.google.com/apikey <ExternalLink size={11} />
                  </a>
                </li>
                <li>Google hesabınızla giriş yapıp <strong>"Create API Key"</strong> butonuna basın.</li>
                <li>Oluşturulan anahtarı kopyalayıp yukarıdaki kutuya yapıştırın.</li>
              </ol>
            </div>

            {/* 0 TL Alternative */}
            {onSelectFreeFlux && (
              <button
                type="button"
                onClick={() => {
                  onSelectFreeFlux();
                  onClose();
                }}
                className="w-full py-2.5 px-3 bg-emerald-400 hover:bg-emerald-300 text-black font-display font-black text-xs uppercase border-2 border-black shadow-comic-xs flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Zap size={14} className="fill-black" />
                <span>API Anahtarsız & 0 TL: %100 Ücretsiz FLUX'a Dön</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
