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
});
