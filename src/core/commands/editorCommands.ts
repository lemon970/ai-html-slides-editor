import type { Deck, SlideElement } from "@/core/schema/deck";
import {
  deleteElements,
  duplicateElements,
  getElement,
  getSlide,
  groupElements,
  nudgeElements,
  ungroupElements,
  updateElement,
} from "@/core/ops/deckOperations";
import { moveElementsInLayerOrder, type LayerMoveAction } from "@/core/ops/layerOperations";
import { selectedGroupId } from "@/core/selection/groupOperations";
import { primarySelectedId } from "@/core/selection/selectionOperations";

export type EditorCommand =
  | { type: "toggle-hidden"; elementIds: string[] }
  | { type: "toggle-locked"; elementIds: string[] }
  | { type: "delete-elements"; elementIds: string[] }
  | { type: "copy-elements"; elementIds: string[] }
  | { type: "paste-elements" }
  | { type: "duplicate-elements"; elementIds: string[] }
  | { type: "nudge-elements"; elementIds: string[]; delta: { x: number; y: number } }
  | { type: "group-elements"; elementIds: string[] }
  | { type: "ungroup-elements"; elementIds: string[] }
  | { type: "move-layer"; elementIds: string[]; action: LayerMoveAction }
  | { type: "rename-element"; elementId: string; name: string }
  | { type: "add-image-element"; src: string; name?: string };

export type EditorCommandState = {
  deck: Deck;
  currentSlideId: string;
  selectedElementIds: string[];
  clipboardElementIds: string[];
};

export type EditorCommandFactories = {
  elementId: () => string;
  groupId: () => string;
};

export type EditorCommandResult = EditorCommandState & {
  changed: boolean;
};

function selectedState(elementIds: string[]) {
  return {
    selectedElementIds: elementIds,
  };
}

function withoutHiddenSelection(state: EditorCommandState, hiddenElementIds: string[]) {
  const hidden = new Set(hiddenElementIds);
  return state.selectedElementIds.filter((id) => !hidden.has(id));
}

function createImageElement(
  deck: Deck,
  slideId: string,
  id: string,
  src: string,
  name?: string,
): SlideElement | null {
  const slide = getSlide(deck, slideId);
  if (!slide) {
    return null;
  }

  const maxZIndex = Math.max(...slide.elements.map((element) => element.zIndex ?? 0), 0);
  return {
    id,
    name: name || "导入图片",
    type: "image",
    src,
    alt: name || "",
    objectFit: "cover",
    x: Math.round((deck.size.width - 420) / 2),
    y: Math.round((deck.size.height - 260) / 2),
    w: 420,
    h: 260,
    zIndex: maxZIndex + 1,
    style: {
      borderRadius: 0,
    },
  };
}

export function executeEditorCommand(
  state: EditorCommandState,
  command: EditorCommand,
  factories: EditorCommandFactories,
): EditorCommandResult {
  if (command.type === "copy-elements") {
    const slide = getSlide(state.deck, state.currentSlideId);
    const copyableIds = slide
      ? command.elementIds.filter((id) => {
          const element = slide.elements.find((item) => item.id === id);
          return element && !element.locked;
        })
      : [];

    return {
      ...state,
      clipboardElementIds: copyableIds,
      changed: false,
    };
  }

  if (command.type === "paste-elements") {
    const result = duplicateElements(state.deck, state.currentSlideId, state.clipboardElementIds, {
      idFactory: factories.elementId,
      groupIdFactory: factories.groupId,
      offset: { x: 24, y: 24 },
    });

    if (result.duplicatedElementIds.length === 0) {
      return { ...state, changed: false };
    }

    return {
      ...state,
      deck: result.deck,
      clipboardElementIds: result.duplicatedElementIds,
      ...selectedState(result.duplicatedElementIds),
      changed: true,
    };
  }

  if (command.type === "duplicate-elements") {
    const copied = executeEditorCommand(
      state,
      { type: "copy-elements", elementIds: command.elementIds },
      factories,
    );
    return executeEditorCommand(copied, { type: "paste-elements" }, factories);
  }

  if (command.type === "delete-elements") {
    const nextDeck = deleteElements(state.deck, state.currentSlideId, command.elementIds);
    if (nextDeck === state.deck) {
      return { ...state, changed: false };
    }

    return {
      ...state,
      deck: nextDeck,
      ...selectedState([]),
      changed: true,
    };
  }

  if (command.type === "toggle-hidden") {
    const slide = getSlide(state.deck, state.currentSlideId);
    if (!slide) {
      return { ...state, changed: false };
    }

    let nextDeck = state.deck;
    const hiddenNow: string[] = [];
    for (const elementId of command.elementIds) {
      const element = getElement(nextDeck, state.currentSlideId, elementId);
      if (!element) {
        continue;
      }
      const hidden = !element.hidden;
      nextDeck = updateElement(nextDeck, state.currentSlideId, elementId, { hidden });
      if (hidden) {
        hiddenNow.push(elementId);
      }
    }

    if (nextDeck === state.deck) {
      return { ...state, changed: false };
    }

    const selectedElementIds = withoutHiddenSelection(state, hiddenNow);
    return {
      ...state,
      deck: nextDeck,
      ...selectedState(selectedElementIds),
      changed: true,
    };
  }

  if (command.type === "toggle-locked") {
    let nextDeck = state.deck;
    for (const elementId of command.elementIds) {
      const element = getElement(nextDeck, state.currentSlideId, elementId);
      if (!element) {
        continue;
      }
      nextDeck = updateElement(nextDeck, state.currentSlideId, elementId, {
        locked: !element.locked,
      });
    }

    return nextDeck === state.deck
      ? { ...state, changed: false }
      : { ...state, deck: nextDeck, changed: true };
  }

  if (command.type === "nudge-elements") {
    const nextDeck = nudgeElements(
      state.deck,
      state.currentSlideId,
      command.elementIds,
      command.delta,
    );

    return nextDeck === state.deck
      ? { ...state, changed: false }
      : { ...state, deck: nextDeck, changed: true };
  }

  if (command.type === "group-elements") {
    if (command.elementIds.length < 2) {
      return { ...state, changed: false };
    }

    const nextDeck = groupElements(
      state.deck,
      state.currentSlideId,
      command.elementIds,
      factories.groupId(),
    );

    return nextDeck === state.deck
      ? { ...state, changed: false }
      : { ...state, deck: nextDeck, ...selectedState(command.elementIds), changed: true };
  }

  if (command.type === "ungroup-elements") {
    const slide = getSlide(state.deck, state.currentSlideId);
    const groupId = slide ? selectedGroupId(slide.elements, command.elementIds) : null;
    if (!groupId) {
      return { ...state, changed: false };
    }

    const nextDeck = ungroupElements(state.deck, state.currentSlideId, groupId);
    return nextDeck === state.deck
      ? { ...state, changed: false }
      : { ...state, deck: nextDeck, ...selectedState(command.elementIds), changed: true };
  }

  if (command.type === "move-layer") {
    const nextDeck = moveElementsInLayerOrder(
      state.deck,
      state.currentSlideId,
      command.elementIds,
      command.action,
    );

    return nextDeck === state.deck
      ? { ...state, changed: false }
      : { ...state, deck: nextDeck, changed: true };
  }

  if (command.type === "rename-element") {
    const element = getElement(state.deck, state.currentSlideId, command.elementId);
    if (!element || element.locked) {
      return { ...state, changed: false };
    }

    return {
      ...state,
      deck: updateElement(state.deck, state.currentSlideId, command.elementId, {
        name: command.name.trim() || undefined,
      }),
      changed: true,
    };
  }

  const element = createImageElement(
    state.deck,
    state.currentSlideId,
    factories.elementId(),
    command.src,
    command.name,
  );
  if (!element) {
    return { ...state, changed: false };
  }

  return {
    ...state,
    deck: {
      ...state.deck,
      slides: state.deck.slides.map((slide) =>
        slide.id === state.currentSlideId
          ? {
              ...slide,
              elements: [...slide.elements, element],
            }
          : slide,
      ),
    },
    ...selectedState([element.id]),
    changed: true,
  };
}

export function primaryElementIdForCommand(result: Pick<EditorCommandState, "selectedElementIds">) {
  return primarySelectedId(result.selectedElementIds);
}

