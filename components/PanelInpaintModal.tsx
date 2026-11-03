import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Wand2, 
  Paintbrush, 
  Eraser, 
  Square, 
  RotateCcw, 
  Trash2, 
  Sparkles, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Eye, 
  EyeOff, 
  Layers, 
  Sliders, 
  Flame, 
  Shield, 
  Zap, 
  Smile, 
  Frown, 
  Sword, 
  Scissors, 
  RefreshCw, 
  History, 
  ArrowLeftRight,
  Info
} from "lucide-react";
import { cn } from "../lib/utils";
import { ComicPanelData, Character } from "../types";
import { editPanelImageInpainting } from "../services/geminiService";

export interface PanelInpaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  panelIndex: number;
  pageIndex: number;
  panelData: ComicPanelData;
  cast: Character[];
  style?: string;
  renderQuality?: string;
  usePaidApi?: boolean;
  imageProvider?: "auto" | "pollinations_flux" | "gemini";
  onSaveUpdatedImage: (panelIndex: number, newImageUrl: string, oldImageUrl?: string) => void;
}

type ToolMode = "brush" | "eraser" | "box";

interface InpaintPreset {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  category: "expression" | "item" | "outfit" | "vfx" | "cleanup";
}

const INPAINT_PRESETS: InpaintPreset[] = [
  // Expression
  { id: "exp_angry", label: "Öfkeli & Hırçın", prompt: "Karakterin yüz ifadesini son derece öfkeli, kaşları çatık ve dişlerini sıkar hale getir", icon: "😡", category: "expression" },
  { id: "exp_shocked", label: "Şaşkın & Şokta", prompt: "Karakterin yüz ifadesini büyük bir şok, gözleri ardına kadar açık ve ağzı şaşkınlıkla aralanmış yap", icon: "😲", category: "expression" },
  { id: "exp_smile", label: "Gülümseyen & Rahat", prompt: "Karakterin yüz ifadesini sıcak ve kendinden emin bir gülümsemeye çevir", icon: "😏", category: "expression" },
  { id: "exp_bruised", label: "Yaralı / Morarmış Yüz", prompt: "Karakterin yüzüne ve yanağına çizgi roman tarzı dramatik savaş yarası, morluk ve küçük kan sızıntısı ekle", icon: "🩸", category: "expression" },
  
  // Items & Weapons
  { id: "item_sword", label: "Parlayan Enerji Kılıcı", prompt: "Karakterin eline parlak mavi/cyan ışık saçan fütüristik bir enerji kılıcı ekle", icon: "⚔️", category: "item" },
  { id: "item_staff", label: "Kadim Büyü Asası", prompt: "Karakterin eline ucu parıldayan kristalli ahşap antik büyücü asası yerleştir", icon: "🪄", category: "item" },
  { id: "item_gun", label: "Taktik Blaster / Silah", prompt: "Karakterin eline siyah metalik detaylı taktik çizgi roman tabancası ekle", icon: "🔫", category: "item" },
  { id: "item_radio", label: "Taktik Telsiz / Kulaklık", prompt: "Karakterin kulağına parlayan ışıklı siber askeri kulaklık ve telsiz yerleştir", icon: "📻", category: "item" },
  { id: "item_relic", label: "Işıldayan Kadim Muska", prompt: "Karakterin boynuna veya eline gizemli altın ve yeşil cevherli antik bir tılsım ekle", icon: "✨", category: "item" },

  // Outfits & Accessories
  { id: "outfit_glasses", label: "Siyah Güneş Gözlüğü", prompt: "Karakterin gözüne havalı, siyah çerçeveli şık bir çizgi roman güneş gözlüğü tak", icon: "🕶️", category: "outfit" },
  { id: "outfit_hud", label: "Siber HUD Vizörü", prompt: "Karakterin sağ gözünün üzerine parlayan neon yeşil holografik siber analiz vizörü ekle", icon: "🥽", category: "outfit" },
  { id: "outfit_cape", label: "Dalgalanan Pelerin", prompt: "Karakterin omuzlarına arkaya doğru rüzgarda dramatik dalgalanan kırmızı kahraman pelerini ekle", icon: "🦸", category: "outfit" },
  { id: "outfit_armor", label: "Ağır Zırh Omuzluğu", prompt: "Karakterin omzuna perçinli, çiziklerle dolu ağır savaş zırhı omuzluğu ekle", icon: "🛡️", category: "outfit" },
  { id: "outfit_torn", label: "Yırtık / Yanmış Kıyafet", prompt: "Bu bölgedeki kıyafeti çatışmadan hasar görmüş, kenarları yanık ve yırtılmış hale getir", icon: "💥", category: "outfit" },

  // Visual Effects & Magic
  { id: "vfx_flames", label: "Alevler & Kıvılcım", prompt: "Bu bölgeye dinamik çizgi roman tarzı yükselen parlak turuncu alevler ve uçuşan kıvılcımlar ekle", icon: "🔥", category: "vfx" },
  { id: "vfx_aura", label: "Enerji Aurası", prompt: "Bu alanın etrafına parıldayan mor ve altın renkli mistik güç aurası ve şok dalgaları çiz", icon: "🔮", category: "vfx" },
  { id: "vfx_lightning", label: "Yıldırım & Elektrik", prompt: "Bu bölgeye çakan mavi elektrik arkları, kıvılcımlar ve enerji deşarjı ekle", icon: "⚡", category: "vfx" },
  { id: "vfx_smoke", label: "Yoğun Duman & Sis", prompt: "Bu bölgeye sahneyi dramatikleştiren koyu gri hacimli patlama dumanı ve sis yerleştir", icon: "💨", category: "vfx" },

  // Content-Aware Cleanup / Removal
  { id: "clean_remove", label: "Nesneyi Sil & Arka Planı Onar", prompt: "İşaretli alandaki nesneyi/detayı tamamen sil ve alanı çevredeki arka plan dokusu ve ışığıyla kusursuz biçimde doldur (Content-aware fill)", icon: "🧹", category: "cleanup" }
];

export const PanelInpaintModal: React.FC<PanelInpaintModalProps> = ({
  isOpen,
  onClose,
  panelIndex,
  pageIndex,
  panelData,
  cast,
  style = "Modern Comic",
  renderQuality = "High",
  usePaidApi = false,
  imageProvider = "pollinations_flux",
  onSaveUpdatedImage
}) => {
  // Canvas References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [tool, setTool] = useState<ToolMode>("brush");
  const [brushSize, setBrushSize] = useState<number>(36);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [instruction, setInstruction] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  // History stack of canvas states for mask undo
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [hasMask, setHasMask] = useState<boolean>(false);
  
  // Generated Result State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>(panelData.imageUrl || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<"slider" | "split" | "after">("slider");
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showMaskOverlay, setShowMaskOverlay] = useState<boolean>(true);

  // Box drag coordinates
  const [boxStart, setBoxStart] = useState<{ x: number; y: number } | null>(null);

  // Synchronize when panel changes
  useEffect(() => {
    if (panelData.imageUrl) {
      setOriginalImageUrl(panelData.imageUrl);
      setGeneratedImageUrl(null);
      setErrorMsg(null);
    }
  }, [panelData.imageUrl]);

  // Initialize Canvas when Modal Opens or Image is Loaded
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set internal resolution
    canvas.width = 1024;
    canvas.height = 1024;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setUndoStack([]);
    setHasMask(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(initCanvas, 150);
    }
  }, [isOpen, initCanvas]);

  // Save current canvas state to undo stack
  const saveStateToUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack(prev => [...prev.slice(-10), currentData]);
  };

  // Undo Last Mask Stroke
  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || undoStack.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const previousData = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    ctx.putImageData(previousData, 0, 0);

    // Check if canvas is completely blank
    checkIfMaskEmpty();
  };

  // Clear Mask
  const handleClearMask = () => {
    saveStateToUndo();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasMask(false);
  };

  const checkIfMaskEmpty = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasPixels = imgData.data.some((val, idx) => idx % 4 === 3 && val > 0);
    setHasMask(hasPixels);
  };

  // Mouse & Touch coordinate calculator relative to canvas internal coordinates
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Start Drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isProcessing) return;
    const { x, y } = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    saveStateToUndo();
    setIsDrawing(true);

    if (tool === "box") {
      setBoxStart({ x, y });
    } else {
      ctx.beginPath();
      ctx.moveTo(x, y);

      if (tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(239, 68, 68, 0.65)"; // Semi-transparent Crimson
        ctx.strokeStyle = "rgba(239, 68, 68, 0.65)";
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
      setHasMask(true);
    }
  };

  // Continue Drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isProcessing) return;
    const { x, y } = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (tool === "box" && boxStart) {
      // For box selection, restore preview
      if (undoStack.length > 0) {
        const lastState = undoStack[undoStack.length - 1];
        ctx.putImageData(lastState, 0, 0);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(239, 68, 68, 0.55)";
      ctx.fillRect(boxStart.x, boxStart.y, x - boxStart.x, y - boxStart.y);
      setHasMask(true);
    } else if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(239, 68, 68, 0.65)";
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      setHasMask(true);
    }
  };

  // End Drawing
  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setBoxStart(null);
    checkIfMaskEmpty();
  };

  // Execute Inpainting
  const handleExecuteInpaint = async () => {
    if (!instruction.trim()) {
      setErrorMsg("Lütfen yapılacak değişikliği açıklayan bir talimat girin veya şablonlardan birini seçin.");
      return;
    }

    if (!originalImageUrl) {
      setErrorMsg("Düzenlenecek panel görseli bulunamadı.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Export mask as overlay image if painted
      let maskDataUrl: string | undefined = undefined;
      const canvas = canvasRef.current;
      if (canvas && hasMask) {
        // Create composite markup image: background + red highlighted region
        const compCanvas = document.createElement("canvas");
        compCanvas.width = 1024;
        compCanvas.height = 1024;
        const compCtx = compCanvas.getContext("2d");
        
        if (compCtx) {
          // Draw base image
          const baseImg = new Image();
          baseImg.crossOrigin = "anonymous";
          await new Promise<void>((resolve) => {
            baseImg.onload = () => {
              compCtx.drawImage(baseImg, 0, 0, 1024, 1024);
              resolve();
            };
            baseImg.onerror = () => resolve();
            baseImg.src = originalImageUrl;
          });

          // Draw the red mask on top
          compCtx.drawImage(canvas, 0, 0);
          maskDataUrl = compCanvas.toDataURL("image/png");
        }
      }

      const resultImage = await editPanelImageInpainting(
        originalImageUrl,
        instruction,
        maskDataUrl,
        style,
        cast,
        renderQuality,
        usePaidApi,
        imageProvider
      );

      if (resultImage) {
        setGeneratedImageUrl(resultImage);
        setCompareMode("slider");
      } else {
        throw new Error("Görsel oluşturulamadı. Lütfen tekrar deneyin.");
      }
    } catch (err: any) {
      console.error("Inpaint execution error:", err);
      setErrorMsg(err?.message || "Rötuş oluşturulurken bir hata meydana geldi.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply Changes & Update Panel
  const handleApplyChanges = () => {
    if (!generatedImageUrl) return;
    onSaveUpdatedImage(panelIndex, generatedImageUrl, originalImageUrl);
    onClose();
  };

  const filteredPresets = activeCategory === "all" 
    ? INPAINT_PRESETS 
    : INPAINT_PRESETS.filter(p => p.category === activeCategory);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl h-[92vh] max-h-[920px] bg-slate-900 border-4 border-black text-white shadow-comic-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-yellow-400 text-black px-4 sm:px-6 py-3 border-b-4 border-black flex items-center justify-between z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black text-yellow-400 border-2 border-black -skew-x-6 shadow-sm">
                <Paintbrush size={20} />
              </div>
              <div>
                <h3 className="font-display text-lg sm:text-2xl uppercase tracking-wider text-outline -skew-x-6">
                  Sihirli Fırça & Bölgesel Rötuş (Inpainting)
                </h3>
                <p className="text-xs font-mono font-bold text-slate-900 hidden sm:block">
                  Sayfa #{pageIndex + 1} / Panel #{panelIndex + 1} • Fırçayla Alanı İşaretle & AI ile Değiştir
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 bg-white text-black border-2 border-black hover:bg-red-500 hover:text-white transition-all shadow-comic"
                title="Kapat"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-950">
            
            {/* Left/Center Column: Canvas & Preview Viewport (7 cols) */}
            <div className="lg:col-span-7 flex flex-col border-b-4 lg:border-b-0 lg:border-r-4 border-black bg-slate-950 overflow-hidden relative">
              
              {/* Canvas Controls Toolbar */}
              <div className="bg-slate-900 border-b-2 border-slate-800 p-2 sm:p-3 flex flex-wrap items-center justify-between gap-2 z-10">
                
                {/* Tool Selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-700 rounded-lg">
                  <button
                    onClick={() => setTool("brush")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-display uppercase tracking-wider flex items-center gap-1.5 transition-all rounded",
                      tool === "brush" ? "bg-red-600 text-white font-bold shadow" : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                    title="Fırça: Alanı kırmızı ile boyayarak işaretle"
                  >
                    <Paintbrush size={14} />
                    <span>Fırça</span>
                  </button>

                  <button
                    onClick={() => setTool("eraser")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-display uppercase tracking-wider flex items-center gap-1.5 transition-all rounded",
                      tool === "eraser" ? "bg-red-600 text-white font-bold shadow" : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                    title="Silgi: Maskelenmiş alanı sil"
                  >
                    <Eraser size={14} />
                    <span>Silgi</span>
                  </button>

                  <button
                    onClick={() => setTool("box")}
                    className={cn(
                      "px-2.5 py-1 text-xs font-display uppercase tracking-wider flex items-center gap-1.5 transition-all rounded",
                      tool === "box" ? "bg-red-600 text-white font-bold shadow" : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                    title="Kutu Seçimi: Dikdörtgen alan çek"
                  >
                    <Square size={14} />
                    <span>Kutu</span>
                  </button>
                </div>

                {/* Brush Size Slider */}
                <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 border border-slate-700 rounded-lg">
                  <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Fırça:</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-20 sm:w-28 accent-red-500 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-yellow-400 w-6 font-bold">{brushSize}px</span>
                </div>

                {/* Mask Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className="p-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none border border-slate-700 rounded"
                    title="Geri Al (Undo)"
                  >
                    <RotateCcw size={14} />
                  </button>

                  <button
                    onClick={handleClearMask}
                    disabled={!hasMask}
                    className="p-1.5 bg-slate-800 text-red-400 hover:text-red-300 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none border border-slate-700 rounded"
                    title="Maskeyi Temizle"
                  >
                    <Trash2 size={14} />
                  </button>

                  <button
                    onClick={() => setShowMaskOverlay(!showMaskOverlay)}
                    className={cn(
                      "p-1.5 border border-slate-700 rounded transition-colors",
                      showMaskOverlay ? "bg-red-950/80 text-red-400" : "bg-slate-800 text-slate-500"
                    )}
                    title={showMaskOverlay ? "Maskeyi Gizle" : "Maskeyi Göster"}
                  >
                    {showMaskOverlay ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>

                  {/* Zoom controls */}
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))}
                    className="p-1.5 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded"
                    title="Yakınlaştır"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
                    className="p-1.5 bg-slate-800 text-slate-300 hover:text-white border border-slate-700 rounded"
                    title="Uzaklaştır"
                  >
                    <ZoomOut size={14} />
                  </button>
                  {zoomLevel !== 1 && (
                    <button
                      onClick={() => setZoomLevel(1)}
                      className="text-[10px] font-mono px-1.5 py-1 bg-slate-800 text-yellow-400 border border-slate-700 rounded"
                    >
                      1x
                    </button>
                  )}
                </div>
              </div>

              {/* Canvas Viewport Area */}
              <div 
                ref={containerRef}
                className="flex-1 flex items-center justify-center p-3 overflow-auto bg-checkerboard relative select-none"
              >
                {/* If Generated Result is Ready, Display Comparison */}
                {generatedImageUrl ? (
                  <div className="relative max-w-full max-h-full aspect-square border-4 border-black shadow-comic-xl flex flex-col items-center">
                    
                    {compareMode === "slider" ? (
                      /* Interactive Before/After Split Slider */
                      <div className="relative w-[340px] sm:w-[460px] md:w-[500px] aspect-square overflow-hidden select-none border-2 border-black">
                        {/* After Image (Full background) */}
                        <img 
                          src={generatedImageUrl} 
                          alt="Yeni Rötuşlu Panel"
                          className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* Before Image (Clipped Left) */}
                        <div 
                          className="absolute inset-0 overflow-hidden"
                          style={{ width: `${sliderPosition}%` }}
                        >
                          <img 
                            src={originalImageUrl} 
                            alt="Orijinal Panel"
                            className="absolute top-0 left-0 w-[340px] sm:w-[460px] md:w-[500px] aspect-square object-cover max-w-none"
                          />
                        </div>

                        {/* Divider Line & Handle */}
                        <div 
                          className="absolute top-0 bottom-0 w-1 bg-yellow-400 shadow-[0_0_8px_rgba(0,0,0,0.8)] cursor-ew-resize z-20 flex items-center justify-center"
                          style={{ left: `${sliderPosition}%` }}
                        >
                          <div className="w-7 h-7 bg-yellow-400 text-black border-2 border-black rounded-full flex items-center justify-center shadow-md">
                            <ArrowLeftRight size={14} />
                          </div>
                        </div>

                        {/* Range Slider for Interaction */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sliderPosition}
                          onChange={(e) => setSliderPosition(Number(e.target.value))}
                          className="absolute inset-0 opacity-0 cursor-ew-resize z-30 w-full h-full"
                        />

                        {/* Labels */}
                        <div className="absolute bottom-2 left-2 z-20 bg-black/80 text-white font-mono text-[10px] px-2 py-0.5 border border-white/20 uppercase font-bold">
                          Önce (Orijinal)
                        </div>
                        <div className="absolute bottom-2 right-2 z-20 bg-yellow-400 text-black font-mono text-[10px] px-2 py-0.5 border border-black uppercase font-bold">
                          Sonra (Rötuş)
                        </div>
                      </div>
                    ) : compareMode === "split" ? (
                      /* Side-by-side or Toggle */
                      <div className="grid grid-cols-2 gap-2 max-w-[520px]">
                        <div className="border-2 border-black relative">
                          <img src={originalImageUrl} alt="Orijinal" className="w-full aspect-square object-cover" />
                          <span className="absolute top-1 left-1 bg-black text-white text-[9px] font-mono px-1">Önce</span>
                        </div>
                        <div className="border-2 border-yellow-400 relative">
                          <img src={generatedImageUrl} alt="Rötuş" className="w-full aspect-square object-cover" />
                          <span className="absolute top-1 left-1 bg-yellow-400 text-black text-[9px] font-mono px-1 font-bold">Sonra</span>
                        </div>
                      </div>
                    ) : (
                      /* After Full */
                      <div className="relative w-[340px] sm:w-[460px] md:w-[500px] aspect-square border-2 border-yellow-400 shadow-md">
                        <img src={generatedImageUrl} alt="Rötuş Sonucu" className="w-full h-full object-cover" />
                        <span className="absolute top-2 right-2 bg-yellow-400 text-black font-display text-xs px-2 py-1 border border-black shadow">
                          YENİ RÖTUŞLANMIŞ PANEL
                        </span>
                      </div>
                    )}

                    {/* View Modes Bar */}
                    <div className="flex items-center gap-2 mt-3 bg-slate-900 px-3 py-1.5 border border-slate-700 rounded-full">
                      <span className="text-[10px] font-mono text-slate-400">Görünüm:</span>
                      <button
                        onClick={() => setCompareMode("slider")}
                        className={cn("px-2 py-0.5 text-xs font-mono rounded", compareMode === "slider" ? "bg-yellow-400 text-black font-bold" : "text-slate-300 hover:text-white")}
                      >
                        Kaydırıcı (Slider)
                      </button>
                      <button
                        onClick={() => setCompareMode("split")}
                        className={cn("px-2 py-0.5 text-xs font-mono rounded", compareMode === "split" ? "bg-yellow-400 text-black font-bold" : "text-slate-300 hover:text-white")}
                      >
                        Yan Yana
                      </button>
                      <button
                        onClick={() => setCompareMode("after")}
                        className={cn("px-2 py-0.5 text-xs font-mono rounded", compareMode === "after" ? "bg-yellow-400 text-black font-bold" : "text-slate-300 hover:text-white")}
                      >
                        Sadece Sonuç
                      </button>
                    </div>

                  </div>
                ) : (
                  /* Interactive Drawing Canvas on top of Original Image */
                  <div 
                    className="relative w-[340px] sm:w-[460px] md:w-[500px] aspect-square border-4 border-black shadow-comic-2xl bg-black overflow-hidden"
                    style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
                  >
                    {/* Underlying Original Panel Image */}
                    {originalImageUrl ? (
                      <img
                        src={originalImageUrl}
                        alt="Panel To Retouch"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-mono text-sm">
                        Görsel Yükleniyor...
                      </div>
                    )}

                    {/* Interactive Mask Canvas Layer */}
                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onTouchStart={handleMouseDown}
                      onTouchMove={handleMouseMove}
                      onTouchEnd={handleMouseUp}
                      className={cn(
                        "absolute inset-0 w-full h-full z-20 touch-none",
                        showMaskOverlay ? "opacity-100" : "opacity-0",
                        tool === "eraser" ? "cursor-crosshair" : "cursor-crosshair"
                      )}
                    />

                    {/* Subtle Info Badge on Canvas */}
                    <div className="absolute top-2 left-2 z-30 pointer-events-none bg-black/80 text-yellow-300 border border-yellow-400/50 px-2 py-1 text-[10px] font-mono shadow-sm flex items-center gap-1.5">
                      <Paintbrush size={12} className="text-red-400" />
                      <span>{hasMask ? "Bölge İşaretlendi" : "Değiştirmek istediğin alanı fırçayla boya"}</span>
                    </div>
                  </div>
                )}

                {/* Loading State Overlay */}
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-slate-950/85 z-50 flex flex-col items-center justify-center p-6 text-center backdrop-blur-xs"
                    >
                      <div className="relative mb-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="w-16 h-16 border-4 border-dashed border-yellow-400 rounded-full"
                        />
                        <Wand2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 animate-pulse" size={24} />
                      </div>
                      <h4 className="font-display text-xl uppercase tracking-wider text-yellow-400 mb-1">
                        Bölgesel Rötuş İşleniyor...
                      </h4>
                      <p className="text-xs text-slate-300 font-mono max-w-sm">
                        İşaretli alan Gemini AI tarafından yeniden çiziliyor ve panelin genel renk ve inking çizgileriyle harmanlanıyor.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>

            {/* Right Column: Prompting, Character Context & Smart Presets (5 cols) */}
            <div className="lg:col-span-5 flex flex-col bg-slate-900 border-slate-800 overflow-y-auto p-4 sm:p-5 space-y-4">
              
              {/* Instruction Text Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-display uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                    <Sparkles size={14} />
                    <span>Rötuş Talimatı (Prompt)</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {instruction.length} karakter
                  </span>
                </div>

                <textarea
                  value={instruction}
                  onChange={(e) => {
                    setInstruction(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Örn: Karakterin eline parlayan mavi alevli bir kılıç ekle / Karakterin yüz ifadesini öfkeli yap / Arka plandaki nesneyi sil..."
                  rows={3}
                  className="w-full bg-slate-950 border-2 border-slate-700 focus:border-yellow-400 text-white p-3 text-xs sm:text-sm font-mono rounded-lg outline-none resize-none transition-colors"
                />

                {/* Character Quick-Mention Chips */}
                {cast.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-mono text-slate-400">Karakter Ekle:</span>
                    {cast.map(c => (
                      <button
                        key={`chip-${c.id}`}
                        onClick={() => {
                          setInstruction(prev => prev ? `${prev} ${c.name}` : `${c.name} için `);
                        }}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-yellow-400 hover:text-black text-slate-300 border border-slate-700 text-[10px] font-mono rounded transition-colors"
                        title={`${c.name} karakterini prompta ekle`}
                      >
                        +{c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div className="p-3 bg-red-950/80 border-2 border-red-500/80 text-red-200 text-xs font-mono rounded flex items-start gap-2">
                  <Info size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Smart Quick Presets Library */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-display uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Wand2 size={13} className="text-purple-400" />
                    <span>Hızlı Rötuş Şablonları</span>
                  </span>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1">
                    {[
                      { id: "all", label: "Tümü" },
                      { id: "expression", label: "Yüz" },
                      { id: "item", label: "Eşya" },
                      { id: "outfit", label: "Giyim" },
                      { id: "vfx", label: "Efekt" },
                      { id: "cleanup", label: "Sil" }
                    ].map(cat => (
                      <button
                        key={`cat-${cat.id}`}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                          "px-2 py-0.5 text-[9px] font-mono uppercase rounded transition-colors",
                          activeCategory === cat.id ? "bg-yellow-400 text-black font-bold" : "text-slate-400 hover:text-white"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {filteredPresets.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setInstruction(preset.prompt);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-yellow-400/60 rounded text-left transition-all flex items-start gap-2 group"
                    >
                      <span className="text-base group-hover:scale-110 transition-transform flex-shrink-0">
                        {preset.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-display uppercase tracking-tight text-slate-200 group-hover:text-yellow-300 truncate">
                          {preset.label}
                        </div>
                        <div className="text-[9px] font-mono text-slate-500 line-clamp-1">
                          {preset.prompt}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-2 border-t-2 border-slate-800 space-y-2">
                
                {/* Generate / Retouch Button */}
                <button
                  onClick={handleExecuteInpaint}
                  disabled={isProcessing || !instruction.trim()}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-display text-sm sm:text-base uppercase tracking-wider border-3 border-black shadow-comic active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Wand2 size={18} className={isProcessing ? "animate-spin" : ""} />
                  <span>
                    {isProcessing ? "Rötuşlanıyor..." : generatedImageUrl ? "Yeni Rötuş Varyasyonu Çiz" : "Sihirli Rötuşu Uygula (Inpaint)"}
                  </span>
                </button>

                {/* If Generated, Show Apply & Revert Controls */}
                {generatedImageUrl && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleApplyChanges}
                      className="py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-display text-xs sm:text-sm uppercase tracking-wider border-2 border-black shadow-comic flex items-center justify-center gap-1.5 font-bold"
                    >
                      <Check size={16} />
                      <span>Değişikliği Kaydet</span>
                    </button>

                    <button
                      onClick={() => setGeneratedImageUrl(null)}
                      className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-display text-xs sm:text-sm uppercase tracking-wider border-2 border-black shadow-comic flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw size={16} />
                      <span>Orijinale Dön</span>
                    </button>
                  </div>
                )}

              </div>

            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
