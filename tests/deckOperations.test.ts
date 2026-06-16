import { describe, expect, it } from "vitest";
import { demoDeck } from "@/data/demoDeck";
import {
  getElement,
  groupElements,
  ungroupElements,
  updateElement,
  updateElements,
} from "@/core/ops/deckOperations";

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

  it("updates multiple elements on one slide", () => {
    const nextDeck = updateElements(demoDeck, "slide-1", {
      "cover-title": { x: 120, y: 140 },
      "cover-subtitle": { x: 130, y: 260 },
    });

    expect(getElement(nextDeck, "slide-1", "cover-title")).toMatchObject({ x: 120, y: 140 });
    expect(getElement(nextDeck, "slide-1", "cover-subtitle")).toMatchObject({ x: 130, y: 260 });
    expect(demoDeck.slides[1]).toBe(nextDeck.slides[1]);
  });

  it("groups and ungroups elements with a flat group id", () => {
    const grouped = groupElements(demoDeck, "slide-1", ["cover-title", "cover-subtitle"], "group-1");

    expect(getElement(grouped, "slide-1", "cover-title")).toMatchObject({ groupId: "group-1" });
    expect(getElement(grouped, "slide-1", "cover-subtitle")).toMatchObject({
      groupId: "group-1",
    });

    const ungrouped = ungroupElements(grouped, "slide-1", "group-1");
    expect(getElement(ungrouped, "slide-1", "cover-title")?.groupId).toBeUndefined();
    expect(getElement(ungrouped, "slide-1", "cover-subtitle")?.groupId).toBeUndefined();
  });
});
