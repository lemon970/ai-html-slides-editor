import { describe, expect, it } from "vitest";
import {
  elementIdsForGroup,
  selectedGroupId,
  shouldSelectWholeGroup,
} from "@/core/selection/groupOperations";
import type { SlideElement } from "@/core/schema/deck";

const elements: SlideElement[] = [
  { id: "a", type: "shape", x: 0, y: 0, w: 10, h: 10, shape: "rect", groupId: "g1", style: {} },
  { id: "b", type: "shape", x: 20, y: 0, w: 10, h: 10, shape: "rect", groupId: "g1", style: {} },
  { id: "c", type: "shape", x: 40, y: 0, w: 10, h: 10, shape: "rect", style: {} },
];

describe("group operations", () => {
  it("finds all element ids in a flat group", () => {
    expect(elementIdsForGroup(elements, "g1")).toEqual(["a", "b"]);
  });

  it("returns a selected group id only when selection belongs to one group", () => {
    expect(selectedGroupId(elements, ["a", "b"])).toBe("g1");
    expect(selectedGroupId(elements, ["a", "c"])).toBeNull();
  });

  it("detects elements that should select their whole group", () => {
    expect(shouldSelectWholeGroup(elements[0])).toBe(true);
    expect(shouldSelectWholeGroup(elements[2])).toBe(false);
  });
});
