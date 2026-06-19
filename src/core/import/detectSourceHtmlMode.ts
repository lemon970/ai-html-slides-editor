export function detectEditorMode(html: string): "json" | "source-html" | "unknown" {
  if (html.includes("__DECK_JSON__")) return "json";
  if (html.includes("data-deck") && html.includes("data-slide") && html.includes("data-element")) {
    return "json";
  }
  if (
    html.includes("__goTo") ||
    /class=["'][^"']*\bslide\b/.test(html) ||
    html.includes("data-deck") ||
    html.includes("data-slide")
  ) {
    return "source-html";
  }
  return "unknown";
}
