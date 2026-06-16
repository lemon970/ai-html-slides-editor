import { describe, expect, it } from "vitest";
import { editorShortcutFromKey, isEditableTarget } from "@/core/keyboard/editorShortcuts";

describe("editor shortcuts", () => {
  it("maps arrow keys to 1px nudges", () => {
    expect(editorShortcutFromKey({ key: "ArrowLeft" })).toEqual({
      type: "nudge",
      delta: { x: -1, y: 0 },
    });
    expect(editorShortcutFromKey({ key: "ArrowDown" })).toEqual({
      type: "nudge",
      delta: { x: 0, y: 1 },
    });
  });

  it("maps shift arrow keys to 10px nudges", () => {
    expect(editorShortcutFromKey({ key: "ArrowRight", shiftKey: true })).toEqual({
      type: "nudge",
      delta: { x: 10, y: 0 },
    });
  });

  it("maps editing commands", () => {
    expect(editorShortcutFromKey({ key: "Delete" })).toEqual({ type: "delete" });
    expect(editorShortcutFromKey({ key: "c", ctrlKey: true })).toEqual({ type: "copy" });
    expect(editorShortcutFromKey({ key: "v", metaKey: true })).toEqual({ type: "paste" });
    expect(editorShortcutFromKey({ key: "d", ctrlKey: true })).toEqual({ type: "duplicate" });
    expect(editorShortcutFromKey({ key: "g", ctrlKey: true })).toEqual({ type: "group" });
    expect(editorShortcutFromKey({ key: "g", ctrlKey: true, shiftKey: true })).toEqual({
      type: "ungroup",
    });
  });

  it("detects editable targets", () => {
    expect(isEditableTarget(document.createElement("input"))).toBe(true);
    expect(isEditableTarget(document.createElement("textarea"))).toBe(true);
    expect(isEditableTarget(document.createElement("button"))).toBe(false);
  });
});
