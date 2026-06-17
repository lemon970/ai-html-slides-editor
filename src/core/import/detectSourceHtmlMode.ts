export function detectEditorMode(html: string): "json" | "source-html" | "unknown" {
  if (html.includes("__DECK_JSON__") || html.includes("data-deck")) return "json";
  if (html.includes("__goTo") || /class=["'][^"']*\bslide\b/.test(html)) return "source-html";
  return "unknown";
}
