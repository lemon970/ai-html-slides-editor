export function detectEditorMode(html: string): "json" | "source-html" {
  if (html.includes("__DECK_JSON__") || html.includes("data-deck")) {
    return "json";
  }
  return "source-html";
}
