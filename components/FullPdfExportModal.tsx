import React, { useState } from "react";
import { 
  FileText, Download, Check, X, Loader2, Sparkles, 
  Layers, Palette, ShieldCheck, BookOpen, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ComicPage, ComicConfig } from "../types";
import { exportFullComicPdf, PdfExportProgress } from "../lib/pdfExporter";
import { cn } from "../lib/utils";

interface FullPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: ComicPage[];
  config: ComicConfig;
}

export const FullPdfExportModal: React.FC<FullPdfExportModalProps> = ({
  isOpen,
  onClose,
  pages,
  config
}) => {
  const [includeCover, setIncludeCover] = useState(true);
  const [quality, setQuality] = useState<"standard" | "high">("high");
  const [customTitle, setCustomTitle] = useState(config.topic || "Yapay Zeka Çizgi Romanı");
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<PdfExportProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setErrorMsg(null);
    setIsDone(false);
    setProgress({
      currentPage: 0,
      totalPages: (includeCover ? 1 : 0) + pages.length,
      currentStep: "PDF motoru başlatılıyor...",
      percent: 0
    });

    try {
      await exportFullComicPdf(pages, config, {
        includeCoverPage: includeCover,
        quality,
        comicTitle: customTitle,
        onProgress: (p) => {
          setProgress(p);
        }
      });
      setIsDone(true);
      setTimeout(() => {
        setIsExporting(false);
      }, 800);
    } catch (err: any) {
      console.error("PDF dışa aktarma hatası:", err);
      setErrorMsg(err.message || "PDF hazırlanırken beklenmedik bir hata oluştu.");
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg bg-[#0f172a] border-4 border-black shadow-comic text-white font-sans overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 bg-red-600 border-b-4 border-black text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-black text-yellow-400 border-2 border-black -rotate-3 shadow-xs">
              <FileText size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display text-lg sm:text-xl uppercase tracking-wide leading-none">
                Full Çizgi Roman PDF Çıktısı
              </h3>
              <p className="text-[11px] font-mono text-red-100">
                Tüm sayfaları birleştirilmiş, baskıya hazır A4 formatında PDF olarak indir
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={onClose}
            className="p-1 bg-black text-white hover:bg-yellow-400 hover:text-black transition-all border-2 border-black disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Summary Box */}
          <div className="p-3 bg-slate-800 border-2 border-black flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-yellow-400" />
              <div>
                <div className="font-display text-xs uppercase text-white">
                  Dışa Aktarılacak Sayfa Sayısı
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {pages.length} Sayfa ({pages.reduce((acc, p) => acc + (p.panels?.length || 0), 0)} Panel) • A4 Tam Sayfa Kaplama
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-yellow-400 text-black font-display text-xs uppercase font-bold border border-black">
              {pages.length} SAYFA
            </span>
          </div>

          {/* Full Bleed & Aligned Bubbles Note */}
          <div className="p-2 bg-indigo-950/60 border border-indigo-500/40 rounded text-[11px] text-indigo-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
            <span>Kağıdı tam kaplayan kenarsız A4 baskı formatı ve kusursuz ortalanmış konuşma balonları aktif.</span>
          </div>

          {/* Comic Title Input */}
          <div className="space-y-1">
            <label className="block font-display text-xs uppercase text-slate-300">
              Çizgi Roman Başlığı (Kapak & Dosya Adı)
            </label>
            <input
              type="text"
              value={customTitle}
              disabled={isExporting}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Örn: Gölge Şehrin Muhafızı"
              className="w-full bg-slate-950 border-2 border-slate-700 focus:border-yellow-400 text-white p-2 text-xs font-sans outline-none disabled:opacity-50"
            />
          </div>

          {/* Export Options */}
          <div className="space-y-2.5">
            <label className="block font-display text-xs uppercase text-slate-300">
              Çıktı Tercihleri
            </label>

            {/* Include Cover Page Toggle */}
            <label className="flex items-center justify-between p-2.5 bg-slate-900 border-2 border-slate-700 hover:border-slate-500 cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <Palette size={15} className="text-yellow-400" />
                <div>
                  <div className="font-semibold text-white">Özel Koleksiyon Kapağı Ekle</div>
                  <div className="text-[10px] text-slate-400">Başlık, kadro listesi ve kapak görseliyle A4 kapak sayfası oluşturur</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeCover}
                disabled={isExporting}
                onChange={(e) => setIncludeCover(e.target.checked)}
                className="w-4 h-4 accent-yellow-400 rounded-none cursor-pointer"
              />
            </label>

            {/* Quality Selection */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setQuality("high")}
                className={cn(
                  "p-2 border-2 text-left transition-all",
                  quality === "high"
                    ? "bg-slate-800 border-yellow-400 text-white shadow-xs"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                )}
              >
                <div className="font-display uppercase text-[11px] text-yellow-400">Yüksek Çözünürlük (2x)</div>
                <div className="text-[10px] text-slate-400">Net çizgiler & baskı kalitesi (Önerilen)</div>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => setQuality("standard")}
                className={cn(
                  "p-2 border-2 text-left transition-all",
                  quality === "standard"
                    ? "bg-slate-800 border-yellow-400 text-white shadow-xs"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                )}
              >
                <div className="font-display uppercase text-[11px] text-slate-300">Standart Hızlı (1.5x)</div>
                <div className="text-[10px] text-slate-400">Daha küçük dosya boyutu & hızlı çıktı</div>
              </button>
            </div>
          </div>

          {/* Progress Bar (Visible while exporting) */}
          {isExporting && progress && (
            <div className="p-3 bg-slate-950 border-2 border-yellow-400 space-y-2">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-yellow-400 flex items-center gap-1.5">
                  <Loader2 size={13} className="animate-spin" /> {progress.currentStep}
                </span>
                <span className="text-white font-bold">{progress.percent}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 border border-slate-700 overflow-hidden">
                <div 
                  className="bg-yellow-400 h-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {isDone && (
            <div className="p-2.5 bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
              <Check size={16} className="text-emerald-400 flex-shrink-0" />
              <span>PDF başarıyla oluşturuldu ve cihazınıza indirildi!</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 bg-red-950/80 border-2 border-red-500 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t-2 border-black flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={isExporting}
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-display text-xs uppercase border-2 border-black shadow-xs disabled:opacity-50"
          >
            Vazgeç
          </button>

          <button
            type="button"
            disabled={isExporting || pages.length === 0}
            onClick={handleStartExport}
            className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-display text-xs uppercase border-2 border-black shadow-comic flex items-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
          >
            {isExporting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>PDF Hazırlanıyor...</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Full PDF İndir (Tüm Seri)</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
