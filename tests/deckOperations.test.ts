import { describe, expect, it } from "vitest";
import { demoDeck } from "@/data/demoDeck";
import { getElement, updateElement } from "@/core/ops/deckOperations";

describe("deck operations", () => {
  it("updates one element without mutating other slides", () => {
    const nextDeck = updateElement(demoDeck, "slide-1", "cover-title", {
      content: "Updated title",
      style: { fontSize: 80 },
    });

    const nextTitle = getElement(nextDeck, "slide-1", "cover-title");
    const originalTitle = getElement(demoDeck, "slide-1", "cover-title");

    expect(nextTitle?.type).toBe("text");
    if (nextTitle?.type === "text") {
      expect(nextTitle.content).toBe("Updated title");
      expect(nextTitle.style.fontSize).toBe(80);
    }
    expect(originalTitle).not.toBe(nextTitle);
    expect(demoDeck.slides[1]).toBe(nextDeck.slides[1]);
  });
});
