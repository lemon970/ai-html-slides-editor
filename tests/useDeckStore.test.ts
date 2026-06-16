import { beforeEach, describe, expect, it } from "vitest";
import { demoDeck } from "@/data/demoDeck";
import { useDeckStore } from "@/store/useDeckStore";

describe("useDeckStore selection state", () => {
  beforeEach(() => {
    useDeckStore.getState().loadDeck(demoDeck);
  });

  it("keeps the legacy selectedElementId in sync with single selection", () => {
    useDeckStore.getState().selectElement("cover-title");

    expect(useDeckStore.getState().selectedElementId).toBe("cover-title");
    expect(useDeckStore.getState().selectedElementIds).toEqual(["cover-title"]);
  });

  it("supports multi-selection while keeping a primary selected element", () => {
    useDeckStore.getState().selectElements(["cover-title", "cover-subtitle"]);

    expect(useDeckStore.getState().selectedElementId).toBe("cover-title");
    expect(useDeckStore.getState().selectedElementIds).toEqual(["cover-title", "cover-subtitle"]);
  });

  it("toggles selected elements", () => {
    useDeckStore.getState().selectElement("cover-title");
    useDeckStore.getState().toggleElementSelection("cover-subtitle");
    useDeckStore.getState().toggleElementSelection("cover-title");

    expect(useDeckStore.getState().selectedElementId).toBe("cover-subtitle");
    expect(useDeckStore.getState().selectedElementIds).toEqual(["cover-subtitle"]);
  });
});
