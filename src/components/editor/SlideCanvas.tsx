"use client";

import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { ElementRenderer } from "./ElementRenderer";
import { TransformBox } from "./controls/TransformBox";
import type { Deck, Slide, SlideElement } from "@/core/schema/deck";
import { sortElements } from "@/core/ops/deckOperations";
import { boundsFromElements, elementBounds, type Bounds } from "@/core/geometry/bounds";
import {
  moveBounds,
  resizeBounds,
  rotationFromPointer,
  scaleBoundsWithinFrame,
  type ResizeHandle,
} from "@/core/geometry/transform";
import { elementIdsInMarquee } from "@/core/selection/selectionOperations";
import { slideBackgroundReactStyle } from "@/core/style/css";
import { useDeckStore } from "@/store/useDeckStore";

type SlideCanvasProps = {
  slide: Slide;
  deckSize: Deck["size"];
  mode: "editable" | "thumbnail";
};

type DragState = {
  mode: "move";
  elementId: string;
  startClientX: number;
  startClientY: number;
  startBounds: ReturnType<typeof elementBounds>;
};

type ResizeState = {
  mode: "resize";
  elementId: string;
  handle: ResizeHandle;
  startClientX: number;
  startClientY: number;
  startBounds: ReturnType<typeof elementBounds>;
  minW: number;
  minH: number;
};

type RotateState = {
  mode: "rotate";
  elementId: string;
  center: { x: number; y: number };
};

type MultiMoveState = {
  mode: "multi-move";
  startClientX: number;
  startClientY: number;
  startBoundsById: Record<string, Bounds>;
};

type MultiResizeState = {
  mode: "multi-resize";
  handle: ResizeHandle;
  startClientX: number;
  startClientY: number;
  startFrame: Bounds;
  startBoundsById: Record<string, Bounds>;
};

type MarqueeState = {
  mode: "marquee";
  startPoint: { x: number; y: number };
  currentBounds: Bounds;
};

type InteractionState =
  | DragState
  | ResizeState
  | RotateState
  | MultiMoveState
  | MultiResizeState
  | MarqueeState;

type PreviewPatches = Record<string, Partial<SlideElement>>;

function withPreviewPatch(element: SlideElement, patch: Partial<SlideElement> | undefined) {
  return patch ? ({ ...element, ...patch } as SlideElement) : element;
}

export function SlideCanvas({ slide, deckSize, mode }: SlideCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const selectedElementId = useDeckStore((state) => state.selectedElementId);
  const selectedElementIds = useDeckStore((state) => state.selectedElementIds);
  const selectElement = useDeckStore((state) => state.selectElement);
  const selectElements = useDeckStore((state) => state.selectElements);
  const toggleElementSelection = useDeckStore((state) => state.toggleElementSelection);
  const clearSelection = useDeckStore((state) => state.clearSelection);
  const updateElementsById = useDeckStore((state) => state.updateElementsById);
  const [interaction, setInteraction] = useState<InteractionState | null>(null);
  const [previewPatches, setPreviewPatches] = useState<PreviewPatches>({});
  const [scale, setScale] = useState(1);
  const elements = useMemo(() => sortElements(slide.elements), [slide.elements]);
  const selectedElement = selectedElementId
    ? elements.find((element) => element.id === selectedElementId)
    : null;
  const selectedElements = useMemo(
    () => elements.filter((element) => selectedElementIds.includes(element.id)),
    [elements, selectedElementIds],
  );
  const selectedFrame = useMemo(() => boundsFromElements(selectedElements), [selectedElements]);
  const previewSelectedFrame = useMemo(
    () =>
      boundsFromElements(
        selectedElements.map((element) => withPreviewPatch(element, previewPatches[element.id])),
      ),
    [previewPatches, selectedElements],
  );
  const canTransformSingleElement = selectedElementIds.length === 1;
  const activeElementInteraction =
    interaction?.mode === "move" || interaction?.mode === "resize" || interaction?.mode === "rotate"
      ? interaction
      : null;

  useEffect(() => {
    const node = canvasRef.current;
    if (!node) {
      return;
    }

    const updateScale = () => {
      const rect = node.getBoundingClientRect();
      setScale(rect.width / deckSize.width);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, [deckSize.width]);

  function handleElementPointerDown(event: PointerEvent<HTMLDivElement>, element: SlideElement) {
    if (mode !== "editable" || element.locked) {
      return;
    }

    event.stopPropagation();
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      toggleElementSelection(element.id);
      setPreviewPatches({});
      setInteraction(null);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    if (selectedElementIds.length > 1 && selectedElementIds.includes(element.id)) {
      startMultiMove(event);
      return;
    }

    selectElement(element.id);
    setPreviewPatches({});
    setInteraction({
      mode: "move",
      elementId: element.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startBounds: elementBounds(element),
    });
  }

  function handleResizePointerDown(
    event: PointerEvent<HTMLButtonElement>,
    handle: ResizeHandle,
  ) {
    if (!selectedElement || mode !== "editable") {
      return;
    }

    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (selectedFrame && selectedElementIds.length > 1) {
      setInteraction({
        mode: "multi-resize",
        handle,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startFrame: selectedFrame,
        startBoundsById: selectedBoundsById(selectedElements),
      });
      setPreviewPatches({});
      return;
    }

    setInteraction({
      mode: "resize",
      elementId: selectedElement.id,
      handle,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startBounds: elementBounds(selectedElement),
      minW: selectedElement.minW ?? 48,
      minH: selectedElement.minH ?? (selectedElement.type === "text" ? 36 : 48),
    });
    setPreviewPatches({});
  }

  function handleRotatePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!selectedElement || mode !== "editable") {
      return;
    }

    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setInteraction({
      mode: "rotate",
      elementId: selectedElement.id,
      center: {
        x: selectedElement.x + selectedElement.w / 2,
        y: selectedElement.y + selectedElement.h / 2,
      },
    });
    setPreviewPatches({});
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!interaction || mode !== "editable") {
      return;
    }

    if (interaction.mode === "marquee") {
      const currentPoint = getCanvasPoint(event);
      if (!currentPoint) {
        return;
      }

      setInteraction({
        ...interaction,
        currentBounds: normalizeMarqueeBounds(interaction.startPoint, currentPoint),
      });
      return;
    }

    if (interaction.mode === "move") {
      const next = moveBounds(interaction.startBounds, {
        x: (event.clientX - interaction.startClientX) / scale,
        y: (event.clientY - interaction.startClientY) / scale,
      });
      setPreviewPatches({ [interaction.elementId]: next });
      return;
    }

    if (interaction.mode === "multi-move") {
      const delta = {
        x: (event.clientX - interaction.startClientX) / scale,
        y: (event.clientY - interaction.startClientY) / scale,
      };
      setPreviewPatches(
        Object.fromEntries(
          Object.entries(interaction.startBoundsById).map(([elementId, bounds]) => [
            elementId,
            moveBounds(bounds, delta),
          ]),
        ),
      );
      return;
    }

    if (interaction.mode === "resize") {
      const next = resizeBounds(
        interaction.startBounds,
        interaction.handle,
        {
          x: (event.clientX - interaction.startClientX) / scale,
          y: (event.clientY - interaction.startClientY) / scale,
        },
        { w: interaction.minW, h: interaction.minH },
      );
      setPreviewPatches({ [interaction.elementId]: next });
      return;
    }

    if (interaction.mode === "multi-resize") {
      const nextFrame = resizeBounds(interaction.startFrame, interaction.handle, {
        x: (event.clientX - interaction.startClientX) / scale,
        y: (event.clientY - interaction.startClientY) / scale,
      });
      setPreviewPatches(
        Object.fromEntries(
          Object.entries(interaction.startBoundsById).map(([elementId, bounds]) => [
            elementId,
            scaleBoundsWithinFrame(bounds, interaction.startFrame, nextFrame),
          ]),
        ),
      );
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    setPreviewPatches({
      [interaction.elementId]: {
        rotation: rotationFromPointer(interaction.center, {
          x: (event.clientX - rect.left) / scale,
          y: (event.clientY - rect.top) / scale,
        }),
      },
    });
  }

  function commitInteraction() {
    if (interaction?.mode === "marquee") {
      selectElements(elementIdsInMarquee(elements, interaction.currentBounds));
      setInteraction(null);
      setPreviewPatches({});
      return;
    }

    if (!interaction || Object.keys(previewPatches).length === 0) {
      setInteraction(null);
      setPreviewPatches({});
      return;
    }

    updateElementsById(slide.id, previewPatches);
    setInteraction(null);
    setPreviewPatches({});
  }

  function getCanvasPoint(event: PointerEvent<HTMLDivElement>) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }

    return {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale,
    };
  }

  function handleCanvasPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (mode !== "editable" || event.button !== 0) {
      return;
    }

    const startPoint = getCanvasPoint(event);
    if (!startPoint) {
      clearSelection();
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setPreviewPatches({});
    setInteraction({
      mode: "marquee",
      startPoint,
      currentBounds: { ...startPoint, w: 0, h: 0 },
    });
  }

  function startMultiMove(event: PointerEvent<HTMLElement>) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setPreviewPatches({});
    setInteraction({
      mode: "multi-move",
      startClientX: event.clientX,
      startClientY: event.clientY,
      startBoundsById: selectedBoundsById(selectedElements),
    });
  }

  return (
    <div
      ref={canvasRef}
      className={`slide-canvas ${mode === "thumbnail" ? "is-thumbnail" : ""}`}
      style={{
        aspectRatio: `${deckSize.width} / ${deckSize.height}`,
        ...slideBackgroundReactStyle(slide.background),
      }}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={commitInteraction}
      onPointerCancel={commitInteraction}
    >
      <div
        className="slide-coordinate-space"
        style={{
          width: deckSize.width,
          height: deckSize.height,
          transform: `scale(${scale})`,
        }}
      >
        {elements.map((element) => {
          const isInteracting = activeElementInteraction?.elementId === element.id;
          const adjustedElement =
            mode === "editable" && (isInteracting || previewPatches[element.id])
              ? withPreviewPatch(element, previewPatches[element.id])
              : element;

          return (
            <ElementRenderer
              key={element.id}
              element={adjustedElement}
              mode={mode}
              selected={mode === "editable" && selectedElementIds.includes(element.id)}
              onPointerDown={handleElementPointerDown}
            />
          );
        })}
        {mode === "editable" && selectedElement && canTransformSingleElement ? (
          <TransformBox
            element={
              activeElementInteraction?.elementId === selectedElement.id
                ? withPreviewPatch(selectedElement, previewPatches[selectedElement.id])
                : selectedElement
            }
            onMovePointerDown={(event) => handleElementPointerDown(event, selectedElement)}
            onResizePointerDown={handleResizePointerDown}
            onRotatePointerDown={handleRotatePointerDown}
          />
        ) : null}
        {mode === "editable" && selectedElementIds.length > 1 && previewSelectedFrame ? (
          <TransformBox
            element={previewSelectedFrame}
            onMovePointerDown={startMultiMove}
            onResizePointerDown={handleResizePointerDown}
            showRotation={false}
          />
        ) : null}
        {mode === "editable" && interaction?.mode === "marquee" ? (
          <div
            className="selection-marquee"
            style={{
              left: interaction.currentBounds.x,
              top: interaction.currentBounds.y,
              width: interaction.currentBounds.w,
              height: interaction.currentBounds.h,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function selectedBoundsById(elements: SlideElement[]) {
  return Object.fromEntries(elements.map((element) => [element.id, elementBounds(element)]));
}

function normalizeMarqueeBounds(
  startPoint: { x: number; y: number },
  currentPoint: { x: number; y: number },
): Bounds {
  const x = Math.min(startPoint.x, currentPoint.x);
  const y = Math.min(startPoint.y, currentPoint.y);
  return {
    x,
    y,
    w: Math.abs(currentPoint.x - startPoint.x),
    h: Math.abs(currentPoint.y - startPoint.y),
  };
}
