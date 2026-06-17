import type { Deck } from "@/core/schema/deck";
import { renderSlideForExport } from "@/core/render/renderDeckHtml";
import { styleToString } from "@/core/style/css";

async function slideToCanvas(slide: Parameters<typeof renderSlideForExport>[0], deck: Deck) {
  const html2canvas = (await import("html2canvas")).default;
  const { innerHtml, backgroundStyle } = renderSlideForExport(slide);

  const container = document.createElement("div");
  container.style.cssText = [
    `position:fixed;left:-9999px;top:-9999px`,
    `width:${deck.size.width}px;height:${deck.size.height}px`,
    `overflow:hidden;font-family:${deck.theme.fontFamily}`,
    styleToString(backgroundStyle),
  ].join(";");
  container.innerHTML = innerHtml;
  document.body.appendChild(container);

  try {
    return await html2canvas(container, {
      scale: 2,
      useCORS: true,
      width: deck.size.width,
      height: deck.size.height,
      logging: false,
    });
  } finally {
    document.body.removeChild(container);
  }
}

export async function exportDeckAsPdf(
  deck: Deck,
  onProgress?: (current: number, total: number) => void,
) {
  const jsPDF = (await import("jspdf")).default;
  const pw = deck.size.width;
  const ph = deck.size.height;
  // Use deck's native aspect ratio as PDF page size (points, 1pt ≈ 1px for simplicity)
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [pw, ph] });

  for (let i = 0; i < deck.slides.length; i++) {
    onProgress?.(i + 1, deck.slides.length);
    if (i > 0) pdf.addPage([pw, ph], "landscape");
    const canvas = await slideToCanvas(deck.slides[i], deck);
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    pdf.addImage(imgData, "JPEG", 0, 0, pw, ph);
  }

  pdf.save(`${deck.title || "slides"}.pdf`);
}
