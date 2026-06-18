import type { Deck, DeckAsset } from "@/core/schema/deck";
import { updateElement } from "@/core/ops/deckOperations";

export function addImageAsset(deck: Deck, asset: DeckAsset): Deck {
  const assets = deck.assets ?? [];
  if (assets.some((item) => item.id === asset.id)) {
    return deck;
  }

  return {
    ...deck,
    assets: [...assets, asset],
  };
}

export function getAsset(deck: Deck, assetId: string) {
  return deck.assets?.find((asset) => asset.id === assetId) ?? null;
}

export function replaceImageWithAsset(
  deck: Deck,
  slideId: string,
  elementId: string,
  asset: DeckAsset,
): Deck {
  const slide = deck.slides.find((item) => item.id === slideId);
  const element = slide?.elements.find((item) => item.id === elementId);
  if (!element || element.type !== "image" || element.locked) {
    return deck;
  }

  return updateElement(deck, slideId, elementId, {
    src: asset.src,
    assetId: asset.id,
    alt: asset.name,
    name: element.name ?? asset.name,
  });
}
