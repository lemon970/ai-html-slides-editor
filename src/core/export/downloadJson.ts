import type { Deck } from "@/core/schema/deck";

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

export function downloadJson(deck: Deck) {
  const blob = new Blob([JSON.stringify(deck, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  downloadBlob(blob, "deck.json");
}
