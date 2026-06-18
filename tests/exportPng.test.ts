import { describe, expect, it } from "vitest";
import { demoDeck } from "@/data/demoDeck";
import { assertDeckRasterExportable } from "@/core/export/preflight";
import { canvasToPngBlob } from "@/core/export/exportPng";

describe("raster export preflight", () => {
  it("rejects omitted image data before raster export", () => {
    const deck = structuredClone(demoDeck);
    const image = deck.slides[0].elements.find((element) => element.id === "cover-image");
    if (!image || image.type !== "image") throw new Error("Expected cover image.");
    image.assetStatus = "omitted";

    expect(() => assertDeckRasterExportable(deck)).toThrow("未保存图片数据");
  });

  it("rejects null toBlob results", async () => {
    const canvas = document.createElement("canvas");
    canvas.toBlob = (callback: BlobCallback) => callback(null);

    await expect(canvasToPngBlob(canvas)).rejects.toThrow("没有生成图片数据");
  });
});
