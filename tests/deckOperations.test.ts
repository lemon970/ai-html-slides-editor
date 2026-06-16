import { describe, expect, it } from "vitest";
import { demoDeck } from "@/data/demoDeck";
import {
  deleteElements,
  duplicateElements,
  getElement,
  groupElements,
  layerElements,
  nudgeElements,
  ungroupElements,
  updateElement,
  updateElements,
  visibleElements,
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

  it("orders layer elements from front to back", () => {
    const layers = layerElements([
      { ...demoDeck.slides[0].elements[0], id: "a", zIndex: 1 },
      { ...demoDeck.slides[0].elements[1], id: "b", zIndex: 4 },
      { ...demoDeck.slides[0].elements[2], id: "c", zIndex: 2 },
    ]);

    expect(layers.map((element) => element.id)).toEqual(["b", "c", "a"]);
  });

  it("filters hidden elements for canvas and export rendering", () => {
    const elements = [
      { ...demoDeck.slides[0].elements[0], id: "visible" },
      { ...demoDeck.slides[0].elements[1], id: "hidden", hidden: true },
    ];

    expect(visibleElements(elements).map((element) => element.id)).toEqual(["visible"]);
  });

  it("deletes selected elements while keeping locked elements", () => {
    const deck = structuredClone(demoDeck);
    const lockedElement = deck.slides[0].elements.find((element) => element.id === "cover-title");
    if (!lockedElement) {
      throw new Error("Expected cover title.");
    }
    lockedElement.locked = true;

    const nextDeck = deleteElements(deck, "slide-1", ["cover-title", "cover-subtitle"]);

    expect(getElement(nextDeck, "slide-1", "cover-title")).toBeTruthy();
    expect(getElement(nextDeck, "slide-1", "cover-subtitle")).toBeUndefined();
  });

  it("duplicates selected elements with offset and remapped group ids", () => {
    const grouped = groupElements(demoDeck, "slide-1", ["cover-title", "cover-subtitle"], "group-1");
    const result = duplicateElements(grouped, "slide-1", ["cover-title", "cover-subtitle"], {
      idFactory: (_element, index) => `copy-${index}`,
      groupIdFactory: (groupId) => `${groupId}-copy`,
      offset: { x: 10, y: 12 },
    });

    expect(result.duplicatedElementIds).toEqual(["copy-0", "copy-1"]);
    expect(getElement(result.deck, "slide-1", "copy-0")).toMatchObject({
      x: getElement(grouped, "slide-1", "cover-title")!.x + 10,
      y: getElement(grouped, "slide-1", "cover-title")!.y + 12,
      groupId: "group-1-copy",
      locked: false,
      hidden: false,
    });
    expect(getElement(result.deck, "slide-1", "copy-1")?.groupId).toBe("group-1-copy");
  });

  it("nudges selected unlocked elements", () => {
    const deck = structuredClone(demoDeck);
    const lockedElement = deck.slides[0].elements.find((element) => element.id === "cover-title");
    if (!lockedElement) {
      throw new Error("Expected cover title.");
    }
    lockedElement.locked = true;

    const nextDeck = nudgeElements(deck, "slide-1", ["cover-title", "cover-subtitle"], {
      x: 1,
      y: 10,
    });

    expect(getElement(nextDeck, "slide-1", "cover-title")).toMatchObject({
      x: lockedElement.x,
      y: lockedElement.y,
    });
    expect(getElement(nextDeck, "slide-1", "cover-subtitle")).toMatchObject({
      x: getElement(deck, "slide-1", "cover-subtitle")!.x + 1,
      y: getElement(deck, "slide-1", "cover-subtitle")!.y + 10,
    });
  });
});
