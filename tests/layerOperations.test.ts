import { describe, expect, it } from "vitest";
import { demoDeck } from "@/data/demoDeck";
import { getElement } from "@/core/ops/deckOperations";
import { moveElementsInLayerOrder } from "@/core/ops/layerOperations";

describe("layer operations", () => {
  it("brings an element to front", () => {
    const nextDeck = moveElementsInLayerOrder(demoDeck, "slide-1", ["cover-pill"], "bring-to-front");

    const zValues = nextDeck.slides[0].elements.map((element) => element.zIndex ?? 0);
    expect(getElement(nextDeck, "slide-1", "cover-pill")?.zIndex).toBe(Math.max(...zValues));
  });

  it("sends an element to back", () => {
    const nextDeck = moveElementsInLayerOrder(demoDeck, "slide-1", ["cover-image"], "send-to-back");

    const zValues = nextDeck.slides[0].elements.map((element) => element.zIndex ?? 0);
    expect(getElement(nextDeck, "slide-1", "cover-image")?.zIndex).toBe(Math.min(...zValues));
  });

  it("moves an element forward by one layer", () => {
    const base = structuredClone(demoDeck);
    base.slides[0].elements = base.slides[0].elements.map((element, index) => ({
      ...element,
      zIndex: index,
    }));
    const before = getElement(base, "slide-1", "cover-subtitle")?.zIndex;

    const nextDeck = moveElementsInLayerOrder(base, "slide-1", ["cover-subtitle"], "bring-forward");

    expect(getElement(nextDeck, "slide-1", "cover-subtitle")?.zIndex).toBe((before ?? 0) + 1);
  });

  it("moves a multi-selection as one block", () => {
    const base = structuredClone(demoDeck);
    base.slides[0].elements = base.slides[0].elements.map((element, index) => ({
      ...element,
      zIndex: index,
    }));

    const nextDeck = moveElementsInLayerOrder(
      base,
      "slide-1",
      ["cover-title", "cover-subtitle"],
      "bring-to-front",
    );

    expect(getElement(nextDeck, "slide-1", "cover-title")?.zIndex).toBe(3);
    expect(getElement(nextDeck, "slide-1", "cover-subtitle")?.zIndex).toBe(4);
  });

  it("does not move locked selected elements", () => {
    const base = structuredClone(demoDeck);
    const element = base.slides[0].elements.find((item) => item.id === "cover-pill");
    if (!element) {
      throw new Error("Expected cover-pill.");
    }
    element.locked = true;
    const before = element.zIndex;

    const nextDeck = moveElementsInLayerOrder(base, "slide-1", ["cover-pill"], "bring-to-front");

    expect(getElement(nextDeck, "slide-1", "cover-pill")?.zIndex).toBe(before);
  });
});
