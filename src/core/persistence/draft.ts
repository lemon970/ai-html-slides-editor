import type { Deck } from "@/core/schema/deck";

const DRAFT_KEY = "htmlppts_draft";
const MAX_BYTES = 4 * 1024 * 1024;

type DraftPayload = {
  deck: Deck;
  currentSlideId: string;
  savedAt: string;
};

export function saveDraft(deck: Deck, currentSlideId: string): void {
  try {
    let payload: DraftPayload = { deck, currentSlideId, savedAt: new Date().toISOString() };
    let serialized = JSON.stringify(payload);

    if (serialized.length > MAX_BYTES) {
      const stripped: Deck = {
        ...deck,
        slides: deck.slides.map((s) => ({
          ...s,
          elements: s.elements.map((el) =>
            el.type === "image" ? { ...el, src: "[omitted]" } : el,
          ),
        })),
      };
      payload = { deck: stripped, currentSlideId, savedAt: new Date().toISOString() };
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
    const age = Date.now() - new Date(data.savedAt).getTime();
    if (age > 24 * 60 * 60 * 1000) {
      clearDraft();
      return null;
    }
    return data;
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
