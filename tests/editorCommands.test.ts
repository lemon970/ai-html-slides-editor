import { describe, expect, it } from "vitest";
import { demoDeck } from "@/data/demoDeck";
import {
  executeEditorCommand,
  primaryElementIdForCommand,
  type EditorCommandState,
} from "@/core/commands/editorCommands";
import { getElement } from "@/core/ops/deckOperations";

function state(overrides: Partial<EditorCommandState> = {}): EditorCommandState {
  return {
    deck: structuredClone(demoDeck),
    currentSlideId: "slide-1",
    selectedElementIds: [],
    clipboardElementIds: [],
    ...overrides,
  };
}

const factories = {
  elementId: () => "generated-element",
  groupId: () => "generated-group",
  assetId: () => "generated-asset",
};

describe("editor commands", () => {
  it("copies and pastes elements through one command path", () => {
    const copied = executeEditorCommand(
      state({ selectedElementIds: ["cover-title"] }),
      { type: "copy-elements", elementIds: ["cover-title"] },
      factories,
    );
    const pasted = executeEditorCommand(copied, { type: "paste-elements" }, factories);

    expect(copied.changed).toBe(false);
    expect(copied.clipboardElementIds).toEqual(["cover-title"]);
    expect(pasted.changed).toBe(true);
    expect(pasted.selectedElementIds).toEqual(["generated-element"]);
    expect(getElement(pasted.deck, "slide-1", "generated-element")).toMatchObject({
      id: "generated-element",
      x: getElement(demoDeck, "slide-1", "cover-title")!.x + 24,
    });
  });

  it("does not delete locked elements", () => {
    const base = state();
    const locked = base.deck.slides[0].elements.find((element) => element.id === "cover-title");
    if (!locked) {
      throw new Error("Expected cover-title.");
    }
    locked.locked = true;

    const result = executeEditorCommand(
      base,
      { type: "delete-elements", elementIds: ["cover-title", "cover-subtitle"] },
      factories,
    );

    expect(getElement(result.deck, "slide-1", "cover-title")).toBeTruthy();
    expect(getElement(result.deck, "slide-1", "cover-subtitle")).toBeUndefined();
    expect(result.selectedElementIds).toEqual([]);
  });

  it("hides selected elements and removes them from selection", () => {
    const result = executeEditorCommand(
      state({ selectedElementIds: ["cover-title", "cover-subtitle"] }),
      { type: "toggle-hidden", elementIds: ["cover-title"] },
      factories,
    );

    expect(getElement(result.deck, "slide-1", "cover-title")?.hidden).toBe(true);
    expect(result.selectedElementIds).toEqual(["cover-subtitle"]);
  });

  it("groups and ungroups selected elements", () => {
    const grouped = executeEditorCommand(
      state({ selectedElementIds: ["cover-title", "cover-subtitle"] }),
      { type: "group-elements", elementIds: ["cover-title", "cover-subtitle"] },
      factories,
    );

    expect(getElement(grouped.deck, "slide-1", "cover-title")?.groupId).toBe("generated-group");
    const ungrouped = executeEditorCommand(
      grouped,
      { type: "ungroup-elements", elementIds: ["cover-title", "cover-subtitle"] },
      factories,
    );
    expect(getElement(ungrouped.deck, "slide-1", "cover-title")?.groupId).toBeUndefined();
  });

  it("moves layer order and keeps selection", () => {
    const result = executeEditorCommand(
      state({ selectedElementIds: ["cover-pill"] }),
      { type: "move-layer", elementIds: ["cover-pill"], action: "bring-to-front" },
      factories,
    );
    const zValues = result.deck.slides[0].elements.map((element) => element.zIndex ?? 0);

    expect(getElement(result.deck, "slide-1", "cover-pill")?.zIndex).toBe(Math.max(...zValues));
    expect(result.selectedElementIds).toEqual(["cover-pill"]);
  });

  it("renames unlocked elements", () => {
    const result = executeEditorCommand(
      state(),
      { type: "rename-element", elementId: "cover-title", name: "封面标题" },
      factories,
    );

    expect(getElement(result.deck, "slide-1", "cover-title")?.name).toBe("封面标题");
  });

  it("adds an image element", () => {
    const result = executeEditorCommand(
      state(),
      { type: "add-image-element", src: "data:image/png;base64,abc", name: "image.png" },
      factories,
    );

    expect(getElement(result.deck, "slide-1", "generated-element")).toMatchObject({
      type: "image",
      src: "data:image/png;base64,abc",
      assetId: "generated-asset",
      name: "image.png",
    });
    expect(result.deck.assets?.[0]).toMatchObject({
      id: "generated-asset",
      type: "image",
      name: "image.png",
      src: "data:image/png;base64,abc",
    });
    expect(primaryElementIdForCommand(result)).toBe("generated-element");
  });

  it("inserts and replaces images from existing assets", () => {
    const base = state();
    base.deck.assets = [{
      id: "asset-existing",
      type: "image",
      name: "existing.png",
      src: "data:image/png;base64,existing",
    }];

    const inserted = executeEditorCommand(
      base,
      { type: "insert-image-asset", assetId: "asset-existing" },
      factories,
    );
    const replaced = executeEditorCommand(
      inserted,
      { type: "replace-image-with-asset", elementId: "cover-image", assetId: "asset-existing" },
      factories,
    );

    expect(getElement(inserted.deck, "slide-1", "generated-element")).toMatchObject({
      type: "image",
      assetId: "asset-existing",
    });
    expect(getElement(replaced.deck, "slide-1", "cover-image")).toMatchObject({
      type: "image",
      assetId: "asset-existing",
      src: "data:image/png;base64,existing",
      x: 910,
      y: 166,
    });
  });
});
