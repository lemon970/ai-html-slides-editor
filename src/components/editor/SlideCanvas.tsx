"use client";

import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { ElementRenderer } from "./ElementRenderer";
import { TransformBox } from "./controls/TransformBox";
import type { Deck, Slide, SlideElement } from "@/core/schema/deck";
import { sortElements } from "@/core/ops/deckOperations";
import { elementBounds } from "@/core/geometry/bounds";
import {
  moveBounds,
  resizeBounds,
  rotationFromPointer,
  type ResizeHandle,
} from "@/core/geometry/transform";
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

type InteractionState = DragState | ResizeState | RotateState;

function withPreviewPatch(element: SlideElement, patch: Partial<SlideElement> | null) {
  return patch ? ({ ...element, ...patch } as SlideElement) : element;
}

export function SlideCanvas({ slide, deckSize, mode }: SlideCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const selectedElementId = useDeckStore((state) => state.selectedElementId);
  const selectElement = useDeckStore((state) => state.selectElement);
  const updateElementById = useDeckStore((state) => state.updateElementById);
  const [interaction, setInteraction] = useState<InteractionState | null>(null);
  const [previewPatch, setPreviewPatch] = useState<Partial<SlideElement> | null>(null);
  const [scale, setScale] = useState(1);
  const elements = useMemo(() => sortElements(slide.elements), [slide.elements]);
  const selectedElement = selectedElementId
    ? elements.find((element) => element.id === selectedElementId)
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
    event.currentTarget.setPointerCapture(event.pointerId);
    selectElement(element.id);
    setPreviewPatch(null);
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
    setPreviewPatch(null);
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
    setPreviewPatch(null);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!interaction || mode !== "editable") {
      return;
    }

    if (interaction.mode === "move") {
      const next = moveBounds(interaction.startBounds, {
        x: (event.clientX - interaction.startClientX) / scale,
        y: (event.clientY - interaction.startClientY) / scale,
      });
      setPreviewPatch(next);
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
      setPreviewPatch(next);
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    setPreviewPatch({
      rotation: rotationFromPointer(interaction.center, {
        x: (event.clientX - rect.left) / scale,
        y: (event.clientY - rect.top) / scale,
      }),
    });
  }

  function commitInteraction() {
    if (!interaction || !previewPatch) {
      setInteraction(null);
      setPreviewPatch(null);
      return;
    }

    updateElementById(slide.id, interaction.elementId, previewPatch);
    setInteraction(null);
    setPreviewPatch(null);
  }

  return (
    <div
      ref={canvasRef}
      className={`slide-canvas ${mode === "thumbnail" ? "is-thumbnail" : ""}`}
      style={{
        aspectRatio: `${deckSize.width} / ${deckSize.height}`,
        ...slideBackgroundReactStyle(slide.background),
      }}
      onPointerDown={() => {
        if (mode === "editable") {
          selectElement(null);
        }
      }}
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
          const isInteracting = interaction?.elementId === element.id;
          const adjustedElement =
            isInteracting && mode === "editable" ? withPreviewPatch(element, previewPatch) : element;

          return (
            <ElementRenderer
              key={element.id}
              element={adjustedElement}
              mode={mode}
              selected={mode === "editable" && selectedElementId === element.id}
              onPointerDown={handleElementPointerDown}
            />
          );
        })}
        {mode === "editable" && selectedElement ? (
          <TransformBox
            element={
              interaction?.elementId === selectedElement.id
                ? withPreviewPatch(selectedElement, previewPatch)
                : selectedElement
            }
            onMovePointerDown={(event) => handleElementPointerDown(event, selectedElement)}
            onResizePointerDown={handleResizePointerDown}
            onRotatePointerDown={handleRotatePointerDown}
          />
        ) : null}
      </div>
    </div>
  );
}
