"use client";

import { create } from "zustand";
import { demoDeck } from "@/data/demoDeck";
import type { Deck, SlideBackground, SlideElement } from "@/core/schema/deck";
import { getElement, getSlide, replaceDeck, updateElement } from "@/core/ops/deckOperations";
import { updateSlideBackground } from "@/core/ops/slideOperations";
import type { DeckHistory } from "@/core/ops/history";
import { pushHistory, redoHistory, undoHistory } from "@/core/ops/history";

type ElementPatch = Partial<SlideElement> & {
  style?: Record<string, unknown>;
};

type DeckStore = {
  deck: Deck;
  currentSlideId: string;
  selectedElementId: string | null;
  history: DeckHistory;
  error: string | null;
  selectSlide: (slideId: string) => void;
  selectElement: (elementId: string | null) => void;
  updateSelectedElement: (patch: ElementPatch) => void;
  updateElementById: (slideId: string, elementId: string, patch: ElementPatch) => void;
  updateCurrentSlideBackground: (background: SlideBackground) => void;
  loadDeck: (deck: Deck) => void;
  undo: () => void;
  redo: () => void;
  setError: (error: string | null) => void;
};

export const useDeckStore = create<DeckStore>()((set, get) => ({
  deck: demoDeck,
  currentSlideId: demoDeck.slides[0].id,
  selectedElementId: null,
  history: { past: [], future: [] },
  error: null,
  selectSlide: (slideId) => {
    const slide = getSlide(get().deck, slideId);
    if (!slide) {
      return;
    }

    set({
      currentSlideId: slideId,
      selectedElementId: null,
      error: null,
    });
  },
  selectElement: (elementId) => set({ selectedElementId: elementId }),
  updateSelectedElement: (patch) => {
    const { currentSlideId, selectedElementId } = get();
    if (!selectedElementId) {
      return;
    }
    get().updateElementById(currentSlideId, selectedElementId, patch);
  },
  updateElementById: (slideId, elementId, patch) => {
    const state = get();
    const element = getElement(state.deck, slideId, elementId);
    if (!element || element.locked) {
      return;
    }

    const nextDeck = updateElement(state.deck, slideId, elementId, patch);
    set({
      deck: nextDeck,
      history: pushHistory(state.history, state.deck),
      error: null,
    });
  },
  updateCurrentSlideBackground: (background) => {
    const state = get();
    const nextDeck = updateSlideBackground(state.deck, state.currentSlideId, background);
    set({
      deck: nextDeck,
      history: pushHistory(state.history, state.deck),
      error: null,
    });
  },
  loadDeck: (deck) =>
    set({
      deck: replaceDeck(deck),
      currentSlideId: deck.slides[0]?.id ?? "",
      selectedElementId: null,
      history: { past: [], future: [] },
      error: null,
    }),
  undo: () => {
    const state = get();
    const result = undoHistory(state.history, state.deck);
    if (!result) {
      return;
    }
    set({
      deck: result.deck,
      history: result.history,
      selectedElementId: null,
    });
  },
  redo: () => {
    const state = get();
    const result = redoHistory(state.history, state.deck);
    if (!result) {
      return;
    }
    set({
      deck: result.deck,
      history: result.history,
      selectedElementId: null,
    });
  },
  setError: (error) => set({ error }),
}));
