import type { Deck } from "@/core/schema/deck";
import { renderDeckHtml } from "@/core/render/renderDeckHtml";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadHtml(deck: Deck) {
  const blob = new Blob([renderDeckHtml(deck)], {
    type: "text/html;charset=utf-8",
  });
  downloadBlob(blob, "deck.html");
}
