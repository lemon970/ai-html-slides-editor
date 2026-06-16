import { describe, expect, it } from "vitest";
import { elementIdsInMarquee, normalizeSelection, selectOnly, toggleSelection } from "@/core/selection/selectionOperations";
import type { SlideElement } from "@/core/schema/deck";

const elements: SlideElement[] = [
  {
    id: "a",
    type: "text",
    x: 10,
    y: 10,
    w: 100,
    h: 80,
    content: "A",
    style: {},
  },
  {
    id: "b",
    type: "shape",
    x: 160,
    y: 20,
    w: 80,
    h: 80,
    shape: "rect",
    style: {},
  },
  {
    id: "locked",
    type: "shape",
    x: 20,
    y: 140,
    w: 80,
    h: 80,
    shape: "rect",
    locked: true,
    style: {},
  },
];

describe("selection operations", () => {
  it("selects one element or clears selection", () => {
    expect(selectOnly("a")).toEqual(["a"]);
    expect(selectOnly(null)).toEqual([]);
  });

  it("toggles elements in a multi-selection", () => {
    expect(toggleSelection(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleSelection(["a", "b"], "a")).toEqual(["b"]);
  });

  it("normalizes duplicate selected ids", () => {
    expect(normalizeSelection(["a", "a", "b"])).toEqual(["a", "b"]);
  });

  it("selects unlocked elements intersecting a marquee", () => {
    expect(elementIdsInMarquee(elements, { x: 0, y: 0, w: 180, h: 180 })).toEqual(["a", "b"]);
  });
});
