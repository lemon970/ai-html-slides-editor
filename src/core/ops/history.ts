import type { Deck } from "@/core/schema/deck";

export const MAX_HISTORY_LENGTH = 50;

export type DeckHistory = {
  past: Deck[];
  future: Deck[];
};

export function pushHistory(history: DeckHistory, current: Deck): DeckHistory {
  const past = [...history.past, current].slice(-MAX_HISTORY_LENGTH);
  return { past, future: [] };
}

export function undoHistory(history: DeckHistory, current: Deck) {
  const previous = history.past.at(-1);
  if (!previous) {
    return null;
  }

  return {
    deck: previous,
    history: {
      past: history.past.slice(0, -1),
      future: [current, ...history.future].slice(0, MAX_HISTORY_LENGTH),
    },
  };
}

export function redoHistory(history: DeckHistory, current: Deck) {
  const next = history.future[0];
  if (!next) {
    return null;
  }

  return {
    deck: next,
    history: {
      past: [...history.past, current].slice(-MAX_HISTORY_LENGTH),
      future: history.future.slice(1),
    },
  };
}
