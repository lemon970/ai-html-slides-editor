"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import { demoDeck } from "@/data/demoDeck";
import type { Deck, SlideBackground, SlideElement } from "@/core/schema/deck";
import {
  deleteElements,
  duplicateElements,
  getElement,
  getSlide,
  groupElements,
  nudgeElements,
  replaceDeck,
  ungroupElements,
  updateElement,
  updateElements,
} from "@/core/ops/deckOperations";
import { selectedGroupId } from "@/core/selection/groupOperations";
import { updateSlideBackground } from "@/core/ops/slideOperations";
import type { DeckHistory } from "@/core/ops/history";
import { pushHistory, redoHistory, undoHistory } from "@/core/ops/history";
import {
  normalizeSelection,
  primarySelectedId,
  selectOnly,
  toggleSelection,
} from "@/core/selection/selectionOperations";

type ElementPatch = Partial<SlideElement> & {
  style?: Record<string, unknown>;
};

type DeckStore = {
  deck: Deck;
  currentSlideId: string;
  selectedElementId: string | null;
  selectedElementIds: string[];
  clipboardElementIds: string[];
  history: DeckHistory;
  error: string | null;
  selectSlide: (slideId: string) => void;
  selectElement: (elementId: string | null) => void;
  selectElements: (elementIds: string[]) => void;
  toggleElementSelection: (elementId: string) => void;
  clearSelection: () => void;
  updateSelectedElement: (patch: ElementPatch) => void;
  updateElementById: (slideId: string, elementId: string, patch: ElementPatch) => void;
  updateElementsById: (
    slideId: string,
    patchesByElementId: Record<string, ElementPatch>,
  ) => void;
  toggleElementLocked: (elementId: string) => void;
  toggleElementHidden: (elementId: string) => void;
  deleteSelectedElements: () => void;
  copySelectedElements: () => void;
  pasteElements: () => void;
  duplicateSelectedElements: () => void;
  nudgeSelectedElements: (delta: { x: number; y: number }) => void;
  groupSelectedElements: () => void;
  ungroupSelectedElements: () => void;
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
  selectedElementIds: [],
  clipboardElementIds: [],
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
      selectedElementIds: [],
      error: null,
    });
  },
  selectElement: (elementId) => {
    const selectedElementIds = selectOnly(elementId);
    set({
      selectedElementId: primarySelectedId(selectedElementIds),
      selectedElementIds,
    });
  },
  selectElements: (elementIds) => {
    const selectedElementIds = normalizeSelection(elementIds);
    set({
      selectedElementId: primarySelectedId(selectedElementIds),
      selectedElementIds,
    });
  },
  toggleElementSelection: (elementId) => {
    const selectedElementIds = toggleSelection(get().selectedElementIds, elementId);
    set({
      selectedElementId: primarySelectedId(selectedElementIds),
      selectedElementIds,
    });
  },
  clearSelection: () => set({ selectedElementId: null, selectedElementIds: [] }),
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
  updateElementsById: (slideId, patchesByElementId) => {
    const state = get();
    const unlockedPatches = Object.fromEntries(
      Object.entries(patchesByElementId).filter(([elementId]) => {
        const element = getElement(state.deck, slideId, elementId);
        return element && !element.locked;
      }),
    );

    if (Object.keys(unlockedPatches).length === 0) {
      return;
    }

    const nextDeck = updateElements(state.deck, slideId, unlockedPatches);
    set({
      deck: nextDeck,
      history: pushHistory(state.history, state.deck),
      error: null,
    });
  },
  toggleElementLocked: (elementId) => {
    const state = get();
    const element = getElement(state.deck, state.currentSlideId, elementId);
    if (!element) {
      return;
    }

    const nextDeck = updateElement(state.deck, state.currentSlideId, elementId, {
      locked: !element.locked,
    });
    set({
      deck: nextDeck,
      history: pushHistory(state.history, state.deck),
      error: null,
    });
  },
  toggleElementHidden: (elementId) => {
    const state = get();
    const element = getElement(state.deck, state.currentSlideId, elementId);
    if (!element) {
      return;
    }

    const nextDeck = updateElement(state.deck, state.currentSlideId, elementId, {
      hidden: !element.hidden,
    });
    const selectedElementIds = element.hidden
      ? state.selectedElementIds
      : state.selectedElementIds.filter((id) => id !== elementId);
    set({
      deck: nextDeck,
      history: pushHistory(state.history, state.deck),
      selectedElementIds,
      selectedElementId: primarySelectedId(selectedElementIds),
      error: null,
    });
  },
  deleteSelectedElements: () => {
    const state = get();
    if (state.selectedElementIds.length === 0) {
      return;
    }

    const nextDeck = deleteElements(state.deck, state.currentSlideId, state.selectedElementIds);
    if (nextDeck === state.deck) {
      return;
    }

    set({
      deck: nextDeck,
      history: pushHistory(state.history, state.deck),
      selectedElementId: null,
      selectedElementIds: [],
      error: null,
    });
  },
  copySelectedElements: () => {
    const state = get();
    const slide = getSlide(state.deck, state.currentSlideId);
    if (!slide || state.selectedElementIds.length === 0) {
      return;
    }

    const copyableIds = state.selectedElementIds.filter((id) => {
      const element = slide.elements.find((item) => item.id === id);
      return element && !element.locked;
    });

    set({ clipboardElementIds: copyableIds });
  },
  pasteElements: () => {
    const state = get();
    if (state.clipboardElementIds.length === 0) {
      return;
    }

    const result = duplicateElements(state.deck, state.currentSlideId, state.clipboardElementIds, {
      idFactory: () => `el-${nanoid(8)}`,
      groupIdFactory: () => `group-${nanoid(8)}`,
      offset: { x: 24, y: 24 },
    });
    if (result.duplicatedElementIds.length === 0) {
      return;
    }

    set({
      deck: result.deck,
      history: pushHistory(state.history, state.deck),
      selectedElementIds: result.duplicatedElementIds,
      selectedElementId: primarySelectedId(result.duplicatedElementIds),
      clipboardElementIds: result.duplicatedElementIds,
      error: null,
    });
  },
  duplicateSelectedElements: () => {
    get().copySelectedElements();
    get().pasteElements();
  },
  nudgeSelectedElements: (delta) => {
    const state = get();
    if (state.selectedElementIds.length === 0) {
      return;
    }

    const nextDeck = nudgeElements(state.deck, state.currentSlideId, state.selectedElementIds, delta);
    if (nextDeck === state.deck) {
      return;
    }

    set({
      deck: nextDeck,
      history: pushHistory(state.history, state.deck),
      error: null,
    });
  },
  groupSelectedElements: () => {
    const state = get();
    if (state.selectedElementIds.length < 2) {
      return;
    }

    const groupId = `group-${Date.now().toString(36)}`;
    const nextDeck = groupElements(
      state.deck,
      state.currentSlideId,
      state.selectedElementIds,
      groupId,
    );
    set({
      deck: nextDeck,
      history: pushHistory(state.history, state.deck),
      selectedElementIds: state.selectedElementIds,
      selectedElementId: state.selectedElementId,
      error: null,
    });
  },
  ungroupSelectedElements: () => {
    const state = get();
    const slide = getSlide(state.deck, state.currentSlideId);
    if (!slide) {
      return;
    }

    const groupId = selectedGroupId(slide.elements, state.selectedElementIds);
    if (!groupId) {
      return;
    }

    const nextDeck = ungroupElements(state.deck, state.currentSlideId, groupId);
    set({
      deck: nextDeck,
      history: pushHistory(state.history, state.deck),
      selectedElementIds: state.selectedElementIds,
      selectedElementId: state.selectedElementId,
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
      selectedElementIds: [],
      clipboardElementIds: [],
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
      selectedElementIds: [],
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
      selectedElementIds: [],
    });
  },
  setError: (error) => set({ error }),
}));
