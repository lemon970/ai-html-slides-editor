import type { Deck, Slide, SlideElement } from "@/core/schema/deck";
import { sortElements, visibleElements } from "@/core/ops/deckOperations";
import { slideBackgroundHtmlStyle, textHtmlStyle } from "@/core/style/css";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function styleToString(style: Record<string, string | number | undefined>) {
  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
}

function baseElementStyle(element: SlideElement) {
  return {
    position: "absolute",
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.w}px`,
    height: `${element.h}px`,
    opacity: element.opacity ?? 1,
    "z-index": element.zIndex ?? 0,
    transform: `rotate(${element.rotation ?? 0}deg)`,
    "transform-origin": "center center",
  };
}

function renderElement(element: SlideElement) {
  const dataAttrs = `data-element data-element-id="${escapeHtml(element.id)}" data-type="${element.type}"`;

  if (element.type === "text") {
    const style = styleToString(textHtmlStyle(element));

    return `<div ${dataAttrs} style="${style}">${escapeHtml(element.content)}</div>`;
  }

  if (element.type === "image") {
    const style = styleToString({
      ...baseElementStyle(element),
      background: element.style.background,
      "border-radius": element.style.borderRadius
        ? `${element.style.borderRadius}px`
        : undefined,
      "box-shadow": element.style.shadow,
      overflow: "hidden",
    });

    return `<div ${dataAttrs} style="${style}"><img src="${escapeHtml(element.src)}" alt="${escapeHtml(element.alt ?? "")}" style="width:100%;height:100%;object-fit:${element.objectFit ?? "cover"};display:block;" /></div>`;
  }

  if (element.type === "shape") {
    const style = styleToString({
      ...baseElementStyle(element),
      background: element.style.fill,
      border: element.style.stroke
        ? `${element.style.strokeWidth ?? 1}px solid ${element.style.stroke}`
        : undefined,
      "border-radius":
        element.shape === "ellipse"
          ? "9999px"
          : element.style.borderRadius
            ? `${element.style.borderRadius}px`
            : undefined,
      "box-shadow": element.style.shadow,
    });

    return `<div ${dataAttrs} data-shape="${element.shape}" style="${style}"></div>`;
  }

  const style = styleToString(baseElementStyle(element));
  return `<div ${dataAttrs} style="${style}">${element.html}</div>`;
}

function renderSlide(slide: Slide, index: number) {
  const elements = sortElements(visibleElements(slide.elements)).map(renderElement).join("\n");
  return `<section class="slide" data-slide id="${escapeHtml(slide.id)}" data-slide-index="${index}" style="${styleToString(slideBackgroundHtmlStyle(slide.background))}">${elements}</section>`;
}

export function renderDeckHtml(deck: Deck) {
  const slides = deck.slides.map(renderSlide).join("\n");
  const deckJson = JSON.stringify(deck).replaceAll("<", "\\u003c");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(deck.title)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #111827; font-family: ${deck.theme.fontFamily}; }
    .deck[data-deck] { width: 100vw; min-height: 100vh; display: grid; place-items: center; gap: 48px; padding: 48px; }
    .slide[data-slide] { position: relative; width: ${deck.size.width}px; height: ${deck.size.height}px; overflow: hidden; flex: 0 0 auto; box-shadow: 0 30px 90px rgba(0,0,0,.28); }
    @media (max-width: 1700px) {
      .slide[data-slide] { width: min(94vw, ${deck.size.width}px); height: auto; aspect-ratio: ${deck.size.width} / ${deck.size.height}; }
      .slide[data-slide] > [data-element] { transform-origin: top left; }
    }
    img { max-width: 100%; }
  </style>
</head>
<body>
  <main class="deck" data-deck data-version="${deck.version}" style="--deck-width:${deck.size.width};--deck-height:${deck.size.height};">
${slides}
  </main>
  <script>
    window.__DECK_JSON__ = ${deckJson};
  </script>
</body>
</html>`;
}
