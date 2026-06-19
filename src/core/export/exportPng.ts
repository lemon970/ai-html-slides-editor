import type { Deck, Slide } from "@/core/schema/deck";
import { assertDeckRasterExportable, assertSlideRasterExportable } from "@/core/export/preflight";
import { renderSlideForExport } from "@/core/render/renderDeckHtml";
import { styleToString } from "@/core/style/css";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function slideToCanvas(slide: Slide, deck: Deck): Promise<HTMLCanvasElement> {
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

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("PNG 导出失败：浏览器没有生成图片数据。"));
        return;
      }
      resolve(blob);
    }, "image/png"),
  );
}

export async function exportSlideAsPng(slide: Slide, deck: Deck, filename: string) {
  assertSlideRasterExportable(slide, deck.slides.findIndex((item) => item.id === slide.id));
  const canvas = await slideToCanvas(slide, deck);
  downloadBlob(await canvasToPngBlob(canvas), filename);
}

export async function exportDeckAsPng(
  deck: Deck,
  onProgress?: (current: number, total: number) => void,
) {
  assertDeckRasterExportable(deck);
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (let i = 0; i < deck.slides.length; i++) {
    onProgress?.(i + 1, deck.slides.length);
    const canvas = await slideToCanvas(deck.slides[i], deck);
    const blob = await canvasToPngBlob(canvas);
    zip.file(`slide-${String(i + 1).padStart(2, "0")}.png`, blob);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadBlob(zipBlob, `${deck.title || "slides"}.zip`);
}
