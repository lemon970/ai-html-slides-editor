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

  it("groups and ungroups the selected elements", () => {
    useDeckStore.getState().selectElements(["cover-title", "cover-subtitle"]);
    useDeckStore.getState().groupSelectedElements();

    const groupedDeck = useDeckStore.getState().deck;
    const groupedTitle = groupedDeck.slides[0].elements.find((element) => element.id === "cover-title");
    const groupedSubtitle = groupedDeck.slides[0].elements.find(
      (element) => element.id === "cover-subtitle",
    );

    expect(groupedTitle?.groupId).toBeTruthy();
    expect(groupedSubtitle?.groupId).toBe(groupedTitle?.groupId);

    useDeckStore.getState().ungroupSelectedElements();
    const ungroupedDeck = useDeckStore.getState().deck;
    expect(
      ungroupedDeck.slides[0].elements.find((element) => element.id === "cover-title")?.groupId,
    ).toBeUndefined();
    expect(
      ungroupedDeck.slides[0].elements.find((element) => element.id === "cover-subtitle")
      ?.groupId,
    ).toBeUndefined();
  });

  it("toggles locked and hidden element state", () => {
    useDeckStore.getState().toggleElementLocked("cover-title");
    expect(
      useDeckStore
        .getState()
        .deck.slides[0].elements.find((element) => element.id === "cover-title")?.locked,
    ).toBe(true);

    useDeckStore.getState().selectElement("cover-title");
    useDeckStore.getState().toggleElementHidden("cover-title");

    const hiddenTitle = useDeckStore
      .getState()
      .deck.slides[0].elements.find((element) => element.id === "cover-title");
    expect(hiddenTitle?.hidden).toBe(true);
    expect(useDeckStore.getState().selectedElementIds).toEqual([]);
  });

  it("deletes selected unlocked elements and keeps locked elements", () => {
    useDeckStore.getState().toggleElementLocked("cover-title");
    useDeckStore.getState().selectElements(["cover-title", "cover-subtitle"]);
    useDeckStore.getState().deleteSelectedElements();

    const elements = useDeckStore.getState().deck.slides[0].elements;
    expect(elements.some((element) => element.id === "cover-title")).toBe(true);
    expect(elements.some((element) => element.id === "cover-subtitle")).toBe(false);
    expect(useDeckStore.getState().selectedElementIds).toEqual([]);
  });

  it("copies, pastes, and selects duplicated elements", () => {
    useDeckStore.getState().selectElements(["cover-title", "cover-subtitle"]);
    useDeckStore.getState().copySelectedElements();
    useDeckStore.getState().pasteElements();

    const state = useDeckStore.getState();
    expect(state.selectedElementIds).toHaveLength(2);
    expect(state.selectedElementIds).not.toContain("cover-title");
    expect(state.deck.slides[0].elements).toHaveLength(demoDeck.slides[0].elements.length + 2);
  });

  it("nudges selected elements while ignoring locked elements", () => {
    const originalTitle = demoDeck.slides[0].elements.find((element) => element.id === "cover-title");
    const originalSubtitle = demoDeck.slides[0].elements.find(
      (element) => element.id === "cover-subtitle",
    );
    if (!originalTitle || !originalSubtitle) {
      throw new Error("Expected demo elements.");
    }

    useDeckStore.getState().toggleElementLocked("cover-title");
    useDeckStore.getState().selectElements(["cover-title", "cover-subtitle"]);
    useDeckStore.getState().nudgeSelectedElements({ x: 10, y: 1 });

    const elements = useDeckStore.getState().deck.slides[0].elements;
    expect(elements.find((element) => element.id === "cover-title")).toMatchObject({
      x: originalTitle.x,
      y: originalTitle.y,
    });
    expect(elements.find((element) => element.id === "cover-subtitle")).toMatchObject({
      x: originalSubtitle.x + 10,
      y: originalSubtitle.y + 1,
    });
  });

  it("adds an imported image element to the current slide and selects it", () => {
    useDeckStore.getState().addImageElement("data:image/png;base64,abc", "cover.png");

    const state = useDeckStore.getState();
    const image = state.deck.slides[0].elements.find(
      (element) => element.id === state.selectedElementId,
    );

    expect(image).toMatchObject({
      type: "image",
      src: "data:image/png;base64,abc",
      name: "cover.png",
      objectFit: "cover",
    });
    expect(state.selectedElementIds).toEqual([state.selectedElementId]);
  });
});
