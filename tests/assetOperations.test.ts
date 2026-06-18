import { describe, expect, it } from "vitest";
import { demoDeck } from "@/data/demoDeck";
import { addImageAsset, getAsset, replaceImageWithAsset } from "@/core/ops/assetOperations";

describe("asset operations", () => {
  it("adds image assets without duplicating ids", () => {
    const asset = {
      id: "asset-1",
      type: "image" as const,
      name: "image.png",
      src: "data:image/png;base64,abc",
    };

    const once = addImageAsset(demoDeck, asset);
    const twice = addImageAsset(once, asset);

    expect(once.assets).toEqual([asset]);
    expect(twice.assets).toHaveLength(1);
    expect(getAsset(twice, "asset-1")).toEqual(asset);
  });

  it("replaces an image src through an asset while keeping layout", () => {
    const asset = {
      id: "asset-2",
      type: "image" as const,
      name: "replacement.png",
      src: "data:image/png;base64,new",
    };
    const deck = addImageAsset(structuredClone(demoDeck), asset);

    const next = replaceImageWithAsset(deck, "slide-1", "cover-image", asset);
    const image = next.slides[0].elements.find((element) => element.id === "cover-image");

    expect(image).toMatchObject({
      type: "image",
      src: asset.src,
      assetId: asset.id,
      x: 910,
      y: 166,
      w: 560,
      h: 420,
    });
  });
});
