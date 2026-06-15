import { validateDeck } from "@/core/schema/validators";
import type { Deck, SlideElement } from "@/core/schema/deck";

function readNumber(style: CSSStyleDeclaration, property: string, fallback = 0) {
  const value = style.getPropertyValue(property);
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readJsonFromScript(html: string): Deck | null {
  const match = html.match(/window\.__DECK_JSON__\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/);
  if (!match) {
    return null;
  }

  return validateDeck(JSON.parse(match[1]));
}

function readFontWeight(value: string) {
  if (value === "bold" || value === "normal") {
    return value;
  }

  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function elementFromNode(node: HTMLElement): SlideElement {
  const type = node.dataset.type;
  const style = node.style;
  const base = {
    id: node.dataset.elementId || node.id,
    x: readNumber(style, "left"),
    y: readNumber(style, "top"),
    w: readNumber(style, "width", 100),
    h: readNumber(style, "height", 100),
    zIndex: readNumber(style, "z-index"),
    opacity: readNumber(style, "opacity", 1),
    rotation: 0,
  };

  if (!base.id) {
    throw new Error("Element is missing data-element-id.");
  }

  if (type === "text") {
    return {
      ...base,
      type: "text",
      content: node.textContent ?? "",
      style: {
        fontFamily: style.fontFamily || undefined,
        fontSize: readNumber(style, "font-size", 24),
        fontWeight: readFontWeight(style.fontWeight),
        color: style.color || undefined,
        lineHeight: Number.parseFloat(style.lineHeight) || undefined,
        textAlign: (style.textAlign as "left" | "center" | "right") || undefined,
        background: style.background || undefined,
        padding: readNumber(style, "padding"),
        borderRadius: readNumber(style, "border-radius"),
        shadow: style.boxShadow || undefined,
      },
    };
  }

  if (type === "image") {
    const img = node.querySelector("img");
    return {
      ...base,
      type: "image",
      src: img?.getAttribute("src") ?? "",
      alt: img?.getAttribute("alt") ?? "",
      objectFit:
        img?.style.objectFit === "contain" || img?.style.objectFit === "fill"
          ? img.style.objectFit
          : "cover",
      style: {
        borderRadius: readNumber(style, "border-radius"),
        shadow: style.boxShadow || undefined,
        background: style.background || undefined,
      },
    };
  }

  if (type === "shape") {
    return {
      ...base,
      type: "shape",
      shape: node.dataset.shape === "ellipse" ? "ellipse" : "rect",
      style: {
        fill: style.background || undefined,
        borderRadius: readNumber(style, "border-radius"),
        shadow: style.boxShadow || undefined,
      },
    };
  }

  return {
    ...base,
    type: "html",
    html: node.innerHTML,
    editable: false,
  };
}

export function parseConstrainedHtml(html: string): Deck {
  const embedded = readJsonFromScript(html);
  if (embedded) {
    return embedded;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const deckNode = doc.querySelector<HTMLElement>("[data-deck]");
  if (!deckNode) {
    throw new Error("No [data-deck] root found.");
  }

  const slideNodes = [...deckNode.querySelectorAll<HTMLElement>("[data-slide]")];
  if (slideNodes.length === 0) {
    throw new Error("No [data-slide] nodes found.");
  }

  return validateDeck({
    version: "0.1",
    id: deckNode.id || "imported-deck",
    title: doc.title || "Imported deck",
    size: {
      width: Number.parseFloat(deckNode.style.getPropertyValue("--deck-width")) || 1600,
      height: Number.parseFloat(deckNode.style.getPropertyValue("--deck-height")) || 900,
    },
    theme: {
      fontFamily: "Inter, system-ui, sans-serif",
      accentColor: "#2563eb",
    },
    slides: slideNodes.map((slideNode, index) => ({
      id: slideNode.id || `slide-${index + 1}`,
      name: slideNode.getAttribute("aria-label") || `Slide ${index + 1}`,
      background: {
        type: "solid",
        color: slideNode.style.background || "#ffffff",
      },
      elements: [...slideNode.querySelectorAll<HTMLElement>("[data-element]")].map(
        elementFromNode,
      ),
    })),
  });
}
