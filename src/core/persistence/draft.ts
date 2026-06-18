import { deckSchema, type Deck } from "@/core/schema/deck";

const DRAFT_KEY = "htmlppts_draft";
const MAX_BYTES = 4 * 1024 * 1024;

export type DraftPayload = {
  deck: Deck;
  currentSlideId: string;
  savedAt: string;
  assetStatus?: "complete" | "omitted";
  omittedAssetCount?: number;
};

export function saveDraft(deck: Deck, currentSlideId: string): void {
  try {
    let payload: DraftPayload = { deck, currentSlideId, savedAt: new Date().toISOString() };
    let serialized = JSON.stringify(payload);

    if (serialized.length > MAX_BYTES) {
      let omittedAssetCount = 0;
      const stripped: Deck = {
        ...deck,
        slides: deck.slides.map((s) => ({
          ...s,
          elements: s.elements.map((el) =>
            el.type === "image"
              ? (omittedAssetCount += 1, { ...el, src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E", assetStatus: "omitted" } as typeof el)
              : el,
          ),
        })),
        assets: deck.assets?.map((asset) => {
          omittedAssetCount += 1;
          return {
            ...asset,
            src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E",
          };
        }),
      };
      payload = {
        deck: stripped,
        currentSlideId,
        savedAt: new Date().toISOString(),
        assetStatus: "omitted",
        omittedAssetCount,
      };
      serialized = JSON.stringify(payload);
    }

    localStorage.setItem(DRAFT_KEY, serialized);
  } catch {
    // quota exceeded or unavailable — silent fail
  }
}

export function loadDraft(): DraftPayload | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as DraftPayload;
    if (!data.deck || !data.savedAt) return null;
    const parsed = deckSchema.safeParse(data.deck);
    if (!parsed.success) return null;
    const age = Date.now() - new Date(data.savedAt).getTime();
    if (age > 24 * 60 * 60 * 1000) {
      clearDraft();
      return null;
    }
    return { ...data, deck: parsed.data };
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
