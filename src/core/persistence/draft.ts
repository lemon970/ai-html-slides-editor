import { deckSchema, type Deck } from "@/core/schema/deck";
import { idbGet, idbPut, idbDelete } from "./idb";

const DRAFT_KEY = "htmlppts_draft";
const TTL_MS = 24 * 60 * 60 * 1000;

export type DraftPayload = {
  deck: Deck;
  currentSlideId: string;
  savedAt: string;
};

export async function saveDraft(deck: Deck, currentSlideId: string): Promise<void> {
  const payload: DraftPayload = { deck, currentSlideId, savedAt: new Date().toISOString() };
  try {
    await idbPut(DRAFT_KEY, payload);
  } catch {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(payload)); } catch { /* ignore */ }
  }
}

export async function loadDraft(): Promise<DraftPayload | null> {
  let data: DraftPayload | undefined;

  try { data = (await idbGet(DRAFT_KEY)) as DraftPayload | undefined; } catch { /* IDB unavailable */ }

  if (!data) {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        data = JSON.parse(raw) as DraftPayload;
        try { await idbPut(DRAFT_KEY, data); localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      } catch { /* parse error */ }
    }
  }

  if (!data?.deck || !data.savedAt) return null;
  if (Date.now() - new Date(data.savedAt).getTime() > TTL_MS) { await clearDraft(); return null; }
  const parsed = deckSchema.safeParse(data.deck);
  if (!parsed.success) return null;
  return { ...data, deck: parsed.data };
}

export async function clearDraft(): Promise<void> {
  try { await idbDelete(DRAFT_KEY); } catch { /* ignore */ }
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}
