import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ComicPage, ComicConfig } from "../types";

export interface PdfExportProgress {
  currentPage: number;
  totalPages: number;
  currentStep: string;
  percent: number;
}

export interface ExportPdfOptions {
  includeCoverPage?: boolean;
  quality?: "standard" | "high";
  comicTitle?: string;
  authorName?: string;
  onProgress?: (progress: PdfExportProgress) => void;
}

/**
 * Generates and downloads a complete multi-page Comic Book PDF.
 * Captures all comic pages rendered in high resolution, adds an optional stylish comic cover,
 * sets correct A4/Comic aspect ratios, and saves as a single PDF.
 */
export async function exportFullComicPdf(
  pages: ComicPage[],
  config: ComicConfig,
  options: ExportPdfOptions = {}
): Promise<void> {
  if (!pages || pages.length === 0) {
    throw new Error("Dışa aktarılacak çizgi roman sayfası bulunamadı.");
  }

  const {
    includeCoverPage = true,
    quality = "high",
    comicTitle = config.topic || "Yapay Zeka Çizgi Romanı",
    authorName = "Infinite Comic Studio",
    onProgress
  } = options;

  const totalSteps = (includeCoverPage ? 1 : 0) + pages.length;
  let completedSteps = 0;

  const updateProgress = (stepName: string) => {
    completedSteps++;
    const percent = Math.min(Math.round((completedSteps / totalSteps) * 100), 100);
    if (onProgress) {
      onProgress({
        currentPage: completedSteps,
        totalPages: totalSteps,
        currentStep: stepName,
        percent
      });
    }
  };

  // Standard A4 dimensions in mm: 210 x 297 (Portrait)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

  const renderScale = quality === "high" ? 2 : 1.5;

  let isFirstPage = true;

  // Ensure fonts are fully loaded for clean typography rendering
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue if font ready check fails
    }
  }

  // 1. Optional Comic Book Cover Page
  if (includeCoverPage) {
    updateProgress("Kapak Sayfası Hazırlanıyor...");

    // Create a temporary stylish comic cover element
    const coverContainer = document.createElement("div");
    coverContainer.style.position = "fixed";
    coverContainer.style.left = "-9999px";
    coverContainer.style.top = "-9999px";
    coverContainer.style.width = "840px";
    coverContainer.style.height = "1188px"; // approx A4 ratio
    coverContainer.style.backgroundColor = "#090d16";
    coverContainer.style.color = "#ffffff";
    coverContainer.style.fontFamily = "'Bangers', 'Impact', sans-serif";
    coverContainer.style.padding = "36px";
    coverContainer.style.boxSizing = "border-box";
    coverContainer.style.display = "flex";
    coverContainer.style.flexDirection = "column";
    coverContainer.style.justifyContent = "space-between";
    coverContainer.style.border = "12px solid #000000";
    coverContainer.style.outline = "6px solid #facc15";

    // Grab first available panel image or page image for cover art
    const coverImageUrl = pages[0]?.panels?.find(p => p.imageUrl)?.imageUrl || pages[0]?.pageImageUrl;

    const castList = (config.cast || []).map(c => c.name).join(" • ");

    coverContainer.innerHTML = `
      <div style="border-bottom: 6px solid #000; background: #facc15; padding: 18px 24px; color: #000; display: flex; justify-content: space-between; align-items: center; box-shadow: 6px 6px 0px #000;">
        <div style="font-size: 32px; letter-spacing: 2px; text-transform: uppercase;">SPECIAL COLLECTOR'S EDITION</div>
        <div style="font-family: monospace; font-size: 16px; font-weight: bold; background: #000; color: #facc15; padding: 4px 12px;">ISSUE #01 • VOL. 1</div>
      </div>

      <div style="margin: 24px 0; text-align: center;">
        <h1 style="font-size: 64px; line-height: 1; text-transform: uppercase; color: #facc15; margin: 0; -webkit-text-stroke: 3px #000; filter: drop-shadow(6px 6px 0px #dc2626); letter-spacing: 2px;">
          ${comicTitle}
        </h1>
        <div style="margin-top: 12px; font-family: sans-serif; font-size: 16px; color: #cbd5e1; font-style: italic; max-width: 600px; margin-left: auto; margin-right: auto;">
          "${config.intro ? (config.intro.length > 140 ? config.intro.slice(0, 137) + '...' : config.intro) : 'Bilinmeyen diyarların ve cesur kahramanların macerası.'}"
        </div>
      </div>

      <div style="flex: 1; border: 6px solid #000; box-shadow: 8px 8px 0px #000; background: #000; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center;">
        ${coverImageUrl ? `<img src="${coverImageUrl}" style="width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) saturate(1.15);" />` : `<div style="font-size: 40px; color: #facc15;">COMIC COVER ART</div>`}
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.9)); padding: 24px 18px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="color: #facc15; font-size: 20px; text-transform: uppercase;">BAŞROLLERDE:</div>
            <div style="color: #ffffff; font-family: sans-serif; font-size: 14px; font-weight: bold;">${castList || 'Özgün Kahramanlar'}</div>
          </div>
          <div style="background: #dc2626; color: #fff; border: 3px solid #000; font-size: 18px; padding: 6px 14px; -webkit-transform: rotate(-4deg); box-shadow: 4px 4px 0px #000;">
            ${config.style || 'MODERN ÇİZGİ ROMAN'}
          </div>
        </div>
      </div>

      <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center; font-family: monospace; font-size: 13px; color: #94a3b8; border-top: 2px dashed #334155; padding-top: 14px;">
        <div>YAPIM: <strong>${authorName}</strong></div>
        <div>TOPLAM SAYFA: <strong>${pages.length} SAYFA</strong></div>
        <div>TARİH: <strong>${new Date().toLocaleDateString('tr-TR')}</strong></div>
      </div>
    `;

    document.body.appendChild(coverContainer);

    try {
      const coverCanvas = await html2canvas(coverContainer, {
        scale: renderScale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#090d16"
      });

      const coverImgData = coverCanvas.toDataURL("image/jpeg", 0.92);
      pdf.addImage(coverImgData, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
      isFirstPage = false;
    } catch (e) {
      console.warn("Kapak sayfası oluşturulamadı, doğrudan sayfalara geçiliyor:", e);
    } finally {
      document.body.removeChild(coverContainer);
    }
  }

  // 2. Iterate and render each comic page
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const pageNum = i + 1;
    updateProgress(`Sayfa ${pageNum} / ${pages.length} taranıyor...`);

    // Find the DOM element corresponding to this page
    const pageElement = document.getElementById(`comic-page-${page.id}`);
    
    if (pageElement) {
      try {
        const pageCanvas = await html2canvas(pageElement, {
          scale: renderScale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          onclone: (clonedDoc, clonedEl) => {
            // 1. Force exact A4 portrait dimensions on the comic page sheet
            clonedEl.style.width = "840px";
            clonedEl.style.height = "1188px";
            clonedEl.style.minHeight = "1188px";
            clonedEl.style.maxHeight = "1188px";
            clonedEl.style.margin = "0";
            clonedEl.style.boxShadow = "none";
            clonedEl.style.border = "6px solid #000000";
            clonedEl.style.display = "flex";
            clonedEl.style.flexDirection = "column";
            clonedEl.style.boxSizing = "border-box";
            clonedEl.style.transform = "none";
            clonedEl.style.padding = "14px";

            // Expand the inner comic frame to seamlessly fill the A4 vertical space
            const innerFrame = clonedEl.querySelector(".comic-border");
            if (innerFrame) {
              const fEl = innerFrame as HTMLElement;
              fEl.style.display = "flex";
              fEl.style.flexDirection = "column";
              fEl.style.flex = "1";
              fEl.style.height = "100%";
              fEl.style.minHeight = "0";
            }

            const gridContainer = clonedEl.querySelector(".aspect-\\[3\\/4\\]");
            if (gridContainer) {
              const gEl = gridContainer as HTMLElement;
              gEl.style.flex = "1";
              gEl.style.height = "100%";
              gEl.style.aspectRatio = "unset";
              gEl.style.minHeight = "0";
            }

            // 2. Hide all interactive editing/action buttons in the snapshot
            clonedEl.querySelectorAll("button, .group-hover\\/panel, .group-hover\\/page").forEach(btn => {
              (btn as HTMLElement).style.display = "none";
            });

            // 3. Swap all interactive textareas with pristine centered print text
            const textareas = clonedEl.querySelectorAll(".dialogue-input, textarea");
            textareas.forEach((ta: any) => {
              const printDiv = ta.parentElement?.querySelector(".dialogue-print-text");
              if (printDiv) {
                printDiv.classList.remove("hidden");
                printDiv.style.display = "block";
                ta.style.display = "none";
              } else {
                const replacement = clonedDoc.createElement("div");
                replacement.textContent = ta.value;
                replacement.style.width = "100%";
                replacement.style.textAlign = "center";
                replacement.style.fontFamily = '"Comic Neue", cursive, sans-serif';
                replacement.style.fontWeight = "bold";
                replacement.style.fontSize = "13px";
                replacement.style.lineHeight = "1.25";
                replacement.style.color = "#000000";
                replacement.style.textTransform = "uppercase";
                replacement.style.wordBreak = "break-word";
                replacement.style.whiteSpace = "pre-wrap";
                ta.parentElement?.replaceChild(replacement, ta);
              }
            });

            // 4. Hide edit pencil icons
            clonedEl.querySelectorAll(".opacity-0, svg").forEach(icon => {
              const el = icon as HTMLElement;
              if (el.closest(".dialogue-input") || el.closest(".relative")?.querySelector(".dialogue-print-text")) {
                el.style.display = "none";
              }
            });
          }
        });

        const imgData = pageCanvas.toDataURL("image/jpeg", 0.94);

        if (!isFirstPage) {
          pdf.addPage("a4", "portrait");
        } else {
          isFirstPage = false;
        }

        // Edge-to-edge full bleed coverage of the A4 page (covers entire sheet without borders or shrinkage)
        pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
      } catch (err) {
        console.error(`Sayfa ${pageNum} yakalanırken hata oluştu:`, err);
      }
    } else {
      console.warn(`comic-page-${page.id} öğesi DOM'da bulunamadı.`);
    }
  }

  // 3. Save PDF File
  const sanitizedTitle = comicTitle
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "cizgi-roman";

  pdf.save(`${sanitizedTitle}-full-issue.pdf`);
}
