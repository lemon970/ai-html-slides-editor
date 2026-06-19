"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import { demoDeck } from "@/data/demoDeck";
import type { Deck, Slide, SlideBackground, SlideElement, SlideTransition } from "@/core/schema/deck";
import {
  executeEditorCommand,
  primaryElementIdForCommand,
  type EditorCommand,
} from "@/core/commands/editorCommands";
import type { AlignAxis } from "@/core/ops/alignOperations";
import { saveDraft, clearDraft } from "@/core/persistence/draft";
import {
  addSlide as addSlideOp,
  duplicateSlide as duplicateSlideOp,
  deleteSlide as deleteSlideOp,
  moveSlide as moveSlideOp,
  getElement,
  getSlide,
  replaceDeck,
  updateElement,
  updateElements,
} from "@/core/ops/deckOperations";
import { updateSlideBackground, updateSlideNotes, updateSlideTransition } from "@/core/ops/slideOperations";
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
  appMode: "idle" | "json" | "source-html";
  showGrid: boolean;
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
  executeCommand: (command: EditorCommand) => void;
  toggleElementLocked: (elementId: string) => void;
  toggleElementHidden: (elementId: string) => void;
  renameElementById: (elementId: string, name: string) => void;
  deleteSelectedElements: () => void;
  copySelectedElements: () => void;
  pasteElements: () => void;
  duplicateSelectedElements: () => void;
  nudgeSelectedElements: (delta: { x: number; y: number }) => void;
  moveSelectedElementsLayer: (action: Extract<EditorCommand, { type: "move-layer" }>["action"]) => void;
  moveElementsLayer: (
    elementIds: string[],
    action: Extract<EditorCommand, { type: "move-layer" }>["action"],
  ) => void;
  addImageElement: (src: string, name?: string, mimeType?: string) => void;
  insertImageAsset: (assetId: string) => void;
  replaceSelectedImageWithAsset: (assetId: string) => void;
  addTextElement: () => void;
  addShapeElement: (shape?: "rect" | "ellipse") => void;
  addCodeElement: (language?: string) => void;
  groupSelectedElements: () => void;
  ungroupSelectedElements: () => void;
  updateCurrentSlideBackground: (background: SlideBackground) => void;
  updateCurrentSlideNotes: (notes: string) => void;
  updateCurrentSlideTransition: (transition: SlideTransition | undefined) => void;
  alignSelectedElements: (axis: AlignAxis) => void;
  distributeSelectedElements: (axis: "horizontal" | "vertical") => void;
  addSlide: (afterId?: string) => void;
  duplicateSlide: (slideId: string) => void;
  deleteSlide: (slideId: string) => void;
  moveSlide: (slideId: string, toIndex: number) => void;
  loadDeck: (deck: Deck) => void;
  setAppMode: (mode: "idle" | "json" | "source-html") => void;
  toggleGrid: () => void;
  undo: () => void;
  redo: () => void;
  setError: (error: string | null) => void;
};

export const useDeckStore = create<DeckStore>()((set, get) => ({
  appMode: "idle",
  showGrid: false,
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
  executeCommand: (command) => {
    const state = get();
    const result = executeEditorCommand(
      {
        deck: state.deck,
        currentSlideId: state.currentSlideId,
        selectedElementIds: state.selectedElementIds,
        clipboardElementIds: state.clipboardElementIds,
      },
      command,
      {
        elementId: () => `el-${nanoid(8)}`,
        groupId: () => `group-${nanoid(8)}`,
        assetId: () => `asset-${nanoid(8)}`,
      },
    );

    const nextState = {
      deck: result.deck,
      selectedElementIds: result.selectedElementIds,
      selectedElementId: primaryElementIdForCommand(result),
      clipboardElementIds: result.clipboardElementIds,
      error: null,
    };

    if (!result.changed) {
      set(nextState);
      return;
    }

    set({
      ...nextState,
      history: pushHistory(state.history, state.deck),
    });
  },
  toggleElementLocked: (elementId) => {
    get().executeCommand({ type: "toggle-locked", elementIds: [elementId] });
  },
  toggleElementHidden: (elementId) => {
    get().executeCommand({ type: "toggle-hidden", elementIds: [elementId] });
  },
  renameElementById: (elementId, name) => {
    get().executeCommand({ type: "rename-element", elementId, name });
  },
  deleteSelectedElements: () => {
    get().executeCommand({
      type: "delete-elements",
      elementIds: get().selectedElementIds,
    });
  },
  copySelectedElements: () => {
    get().executeCommand({
      type: "copy-elements",
      elementIds: get().selectedElementIds,
    });
  },
  pasteElements: () => {
    get().executeCommand({ type: "paste-elements" });
  },
  duplicateSelectedElements: () => {
    get().executeCommand({
      type: "duplicate-elements",
      elementIds: get().selectedElementIds,
    });
  },
  nudgeSelectedElements: (delta) => {
    get().executeCommand({
      type: "nudge-elements",
      elementIds: get().selectedElementIds,
      delta,
    });
  },
  moveSelectedElementsLayer: (action) => {
    get().moveElementsLayer(get().selectedElementIds, action);
  },
  moveElementsLayer: (elementIds, action) => {
    get().executeCommand({ type: "move-layer", elementIds, action });
  },
  addImageElement: (src, name, mimeType) => {
    get().executeCommand({ type: "add-image-element", src, name, mimeType });
  },
  addTextElement: () => {
    get().executeCommand({ type: "add-text-element" });
  },
  addShapeElement: (shape) => {
    get().executeCommand({ type: "add-shape-element", shape });
  },
  addCodeElement: (language = "typescript") => {
    get().executeCommand({
      type: "add-html-element",
      html: "// 在此输入代码\nfunction hello() {\n  return \"Hello, World!\";\n}",
      language,
      theme: "dark",
    });
  },
  insertImageAsset: (assetId: string) => {
    get().executeCommand({ type: "insert-image-asset", assetId });
  },
  replaceSelectedImageWithAsset: (assetId: string) => {
    const state = get();
    const elementId = state.selectedElementIds[0];
    if (!elementId) return;
    get().executeCommand({ type: "replace-image-with-asset", elementId, assetId });
  },
  groupSelectedElements: () => {
    get().executeCommand({
      type: "group-elements",
      elementIds: get().selectedElementIds,
    });
  },
  ungroupSelectedElements: () => {
    get().executeCommand({
      type: "ungroup-elements",
      elementIds: get().selectedElementIds,
    });
  },
  alignSelectedElements: (axis) => {
    const state = get();
    get().executeCommand({
      type: "align-elements",
      elementIds: state.selectedElementIds,
      axis,
      canvasSize: state.deck.size,
    });
  },
  distributeSelectedElements: (axis) => {
    get().executeCommand({
      type: "distribute-elements",
      elementIds: get().selectedElementIds,
      axis,
    });
  },
  updateCurrentSlideBackground: (background) => {
    const state = get();
    const nextDeck = updateSlideBackground(state.deck, state.currentSlideId, background);
    set({ deck: nextDeck, history: pushHistory(state.history, state.deck), error: null });
  },
  updateCurrentSlideNotes: (notes) => {
    const state = get();
    set({ deck: updateSlideNotes(state.deck, state.currentSlideId, notes), history: pushHistory(state.history, state.deck), error: null });
  },
  updateCurrentSlideTransition: (transition) => {
    const state = get();
    set({ deck: updateSlideTransition(state.deck, state.currentSlideId, transition), history: pushHistory(state.history, state.deck), error: null });
  },
  addSlide: (afterId) => {
    const state = get();
    const refSlide = state.deck.slides.find((s) => s.id === (afterId ?? state.currentSlideId));
    const newSlide: Slide = {
      id: `slide-${nanoid(8)}`,
      background: refSlide?.background ?? { type: "solid", color: "#ffffff" },
      elements: [],
    };
    const nextDeck = addSlideOp(state.deck, newSlide, afterId ?? state.currentSlideId);
    set({
      deck: nextDeck,
      currentSlideId: newSlide.id,
      selectedElementId: null,
      selectedElementIds: [],
      history: pushHistory(state.history, state.deck),
    });
  },
  duplicateSlide: (slideId) => {
    const state = get();
    const source = state.deck.slides.find((s) => s.id === slideId);
    if (!source) return;
    const newSlide: Slide = {
      ...structuredClone(source),
      id: `slide-${nanoid(8)}`,
      elements: source.elements.map((el) => ({ ...structuredClone(el), id: `el-${nanoid(8)}` })),
    };
    const nextDeck = duplicateSlideOp(state.deck, slideId, newSlide);
    set({
      deck: nextDeck,
      currentSlideId: newSlide.id,
      selectedElementId: null,
      selectedElementIds: [],
      history: pushHistory(state.history, state.deck),
    });
  },
  deleteSlide: (slideId) => {
    const state = get();
    if (state.deck.slides.length <= 1) return;
    const result = deleteSlideOp(state.deck, slideId);
    set({
      deck: result.deck,
      currentSlideId: result.newCurrentId,
      selectedElementId: null,
      selectedElementIds: [],
      history: pushHistory(state.history, state.deck),
    });
  },
  moveSlide: (slideId, toIndex) => {
    const state = get();
    const nextDeck = moveSlideOp(state.deck, slideId, toIndex);
    if (nextDeck === state.deck) return;
    set({ deck: nextDeck, history: pushHistory(state.history, state.deck) });
  },
  loadDeck: (deck) => {
    clearDraft();
    set({
      appMode: "json",
      deck: replaceDeck(deck),
      currentSlideId: deck.slides[0]?.id ?? "",
      selectedElementId: null,
      selectedElementIds: [],
      clipboardElementIds: [],
      history: { past: [], future: [] },
      error: null,
    });
  },
  setAppMode: (mode) => set({ appMode: mode }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
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

// Auto-save draft on deck change (debounced)
let draftTimer: ReturnType<typeof setTimeout> | null = null;
useDeckStore.subscribe((state, prev) => {
  if (state.deck === prev.deck || state.appMode !== "json") return;
  if (draftTimer) clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    saveDraft(state.deck, state.currentSlideId);
  }, 1000);
});
