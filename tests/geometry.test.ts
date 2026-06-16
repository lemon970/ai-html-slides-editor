import { describe, expect, it } from "vitest";
import { moveBounds, resizeBounds } from "@/core/geometry/transform";

describe("geometry transforms", () => {
  it("moves bounds in design coordinates", () => {
    expect(moveBounds({ x: 10, y: 20, w: 100, h: 50 }, { x: 4.4, y: -8.2 })).toEqual({
      x: 14,
      y: 12,
      w: 100,
      h: 50,
    });
  });

  it("resizes from southeast handle", () => {
    expect(resizeBounds({ x: 10, y: 20, w: 100, h: 50 }, "se", { x: 30, y: 15 })).toEqual({
      x: 10,
      y: 20,
      w: 130,
      h: 65,
    });
  });

  it("resizes from northwest handle without going below minimum size", () => {
    expect(
      resizeBounds({ x: 10, y: 20, w: 100, h: 50 }, "nw", { x: 90, y: 40 }, { w: 40, h: 30 }),
    ).toEqual({
      x: 70,
      y: 40,
      w: 40,
      h: 30,
    });
  });
});
