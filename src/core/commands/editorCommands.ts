import type { Deck, DeckAsset, SlideElement } from "@/core/schema/deck";
import {
  deleteElements,
  duplicateElements,
  getElement,
  getSlide,
  groupElements,
  nudgeElements,
  ungroupElements,
  updateElement,
  updateElements,
} from "@/core/ops/deckOperations";
import { moveElementsInLayerOrder, type LayerMoveAction } from "@/core/ops/layerOperations";
import { selectedGroupId } from "@/core/selection/groupOperations";
import { primarySelectedId } from "@/core/selection/selectionOperations";
import { alignElements, distributeElements, type AlignAxis } from "@/core/ops/alignOperations";
import { addImageAsset, getAsset, replaceImageWithAsset } from "@/core/ops/assetOperations";

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
  | { type: "add-image-element"; src: string; name?: string; mimeType?: string }
  | { type: "insert-image-asset"; assetId: string }
  | { type: "replace-image-with-asset"; elementId: string; assetId: string }
  | { type: "add-text-element" }
  | { type: "add-shape-element"; shape?: "rect" | "ellipse" }
  | { type: "add-html-element"; html: string; language?: string; theme?: "dark" | "light" }
  | { type: "align-elements"; elementIds: string[]; axis: AlignAxis; canvasSize: { width: number; height: number } }
  | { type: "distribute-elements"; elementIds: string[]; axis: "horizontal" | "vertical" };

export type EditorCommandState = {
  deck: Deck;
  currentSlideId: string;
  selectedElementIds: string[];
  clipboardElementIds: string[];
};

export type EditorCommandFactories = {
  elementId: () => string;
  groupId: () => string;
  assetId: () => string;
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
  assetId?: string,
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
    assetId,
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

  const slide = getSlide(state.deck, state.currentSlideId);
  if (!slide) {
    return { ...state, changed: false };
  }

  const maxZ = Math.max(...slide.elements.map((e) => e.zIndex ?? 0), 0);
  const cx = Math.round(state.deck.size.width / 2);
  const cy = Math.round(state.deck.size.height / 2);

  if (command.type === "add-image-element") {
    const asset: DeckAsset = {
      id: factories.assetId(),
      type: "image",
      name: command.name || "导入图片",
      src: command.src,
      mimeType: command.mimeType,
      createdAt: new Date().toISOString(),
    };
    const deckWithAsset = addImageAsset(state.deck, asset);
    const element = createImageElement(
      deckWithAsset,
      state.currentSlideId,
      factories.elementId(),
      command.src,
      command.name,
      asset.id,
    );
    if (!element) {
      return { ...state, changed: false };
    }
    return appendElement({ ...state, deck: deckWithAsset }, element);
  }

  if (command.type === "insert-image-asset") {
    const asset = getAsset(state.deck, command.assetId);
    if (!asset) {
      return { ...state, changed: false };
    }
    const element = createImageElement(
      state.deck,
      state.currentSlideId,
      factories.elementId(),
      asset.src,
      asset.name,
      asset.id,
    );
    if (!element) {
      return { ...state, changed: false };
    }
    return appendElement(state, element);
  }

  if (command.type === "replace-image-with-asset") {
    const asset = getAsset(state.deck, command.assetId);
    if (!asset) {
      return { ...state, changed: false };
    }
    const nextDeck = replaceImageWithAsset(
      state.deck,
      state.currentSlideId,
      command.elementId,
      asset,
    );
    return nextDeck === state.deck
      ? { ...state, changed: false }
      : { ...state, deck: nextDeck, changed: true };
  }

  if (command.type === "add-text-element") {
    const element: SlideElement = {
      id: factories.elementId(),
      name: "文本",
      type: "text",
      content: "双击编辑文本",
      x: cx - 200,
      y: cy - 40,
      w: 400,
      h: 80,
      zIndex: maxZ + 1,
      style: { fontSize: 24, color: "#0f172a" },
    };
    return appendElement(state, element);
  }

  if (command.type === "add-shape-element") {
    const element: SlideElement = {
      id: factories.elementId(),
      name: command.shape === "ellipse" ? "椭圆" : "矩形",
      type: "shape",
      shape: command.shape ?? "rect",
      x: cx - 100,
      y: cy - 60,
      w: 200,
      h: 120,
      zIndex: maxZ + 1,
      style: { fill: "#3b82f6", borderRadius: 8 },
    };
    return appendElement(state, element);
  }

  if (command.type === "add-html-element") {
    const element: SlideElement = {
      id: factories.elementId(),
      name: "代码块",
      type: "html",
      html: command.html,
      x: cx - 400,
      y: cy - 200,
      w: 800,
      h: 400,
      zIndex: maxZ + 1,
      codeConfig: { language: command.language ?? "plaintext", theme: command.theme ?? "dark" },
    };
    return appendElement(state, element);
  }

  if (command.type === "align-elements") {
    const slideForAlign = getSlide(state.deck, state.currentSlideId);
    if (!slideForAlign) return { ...state, changed: false };
    const patches = alignElements(slideForAlign.elements, command.elementIds, command.axis, command.canvasSize);
    if (Object.keys(patches).length === 0) return { ...state, changed: false };
    const nextDeck = updateElements(state.deck, state.currentSlideId, patches);
    return { ...state, deck: nextDeck, changed: true };
  }

  if (command.type === "distribute-elements") {
    const slideForDist = getSlide(state.deck, state.currentSlideId);
    if (!slideForDist) return { ...state, changed: false };
    const patches = distributeElements(slideForDist.elements, command.elementIds, command.axis);
    if (Object.keys(patches).length === 0) return { ...state, changed: false };
    const nextDeck = updateElements(state.deck, state.currentSlideId, patches);
    return { ...state, deck: nextDeck, changed: true };
  }

  return { ...state, changed: false };
}

function appendElement(state: EditorCommandState, element: SlideElement): EditorCommandResult {
  return {
    ...state,
    deck: {
      ...state.deck,
      slides: state.deck.slides.map((slide) =>
        slide.id === state.currentSlideId
          ? { ...slide, elements: [...slide.elements, element] }
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
