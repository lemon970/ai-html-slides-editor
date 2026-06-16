import { describe, expect, it } from "vitest";
import { boundsFromElements } from "@/core/geometry/bounds";
import { moveBounds, resizeBounds, scaleBoundsWithinFrame } from "@/core/geometry/transform";
import type { SlideElement } from "@/core/schema/deck";

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

  it("builds one bounding box from multiple elements", () => {
    const elements: SlideElement[] = [
      { id: "a", type: "shape", x: 10, y: 20, w: 100, h: 40, shape: "rect", style: {} },
      { id: "b", type: "shape", x: 140, y: 5, w: 30, h: 60, shape: "rect", style: {} },
    ];

    expect(boundsFromElements(elements)).toEqual({ x: 10, y: 5, w: 160, h: 60 });
  });

  it("scales element bounds inside a resized group frame", () => {
    expect(
      scaleBoundsWithinFrame(
        { x: 20, y: 30, w: 40, h: 20 },
        { x: 10, y: 20, w: 100, h: 50 },
        { x: 20, y: 40, w: 200, h: 100 },
      ),
    ).toEqual({ x: 40, y: 60, w: 80, h: 40 });
  });
});
