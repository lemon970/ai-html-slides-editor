"use client";

import { PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { ElementRenderer } from "./ElementRenderer";
import type { Deck, Slide, SlideElement } from "@/core/schema/deck";
import { sortElements } from "@/core/ops/deckOperations";
import { useDeckStore } from "@/store/useDeckStore";

type SlideCanvasProps = {
  slide: Slide;
  deckSize: Deck["size"];
  mode: "editable" | "thumbnail";
};

type DragState = {
  elementId: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
};

export function SlideCanvas({ slide, deckSize, mode }: SlideCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const selectedElementId = useDeckStore((state) => state.selectedElementId);
  const selectElement = useDeckStore((state) => state.selectElement);
  const updateElementById = useDeckStore((state) => state.updateElementById);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const elements = useMemo(() => sortElements(slide.elements), [slide.elements]);

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
    setDragOffset({ x: 0, y: 0 });
    setDragState({
      elementId: element.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: element.x,
      startY: element.y,
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragState || mode !== "editable") {
      return;
    }

    setDragOffset({
      x: (event.clientX - dragState.startClientX) / scale,
      y: (event.clientY - dragState.startClientY) / scale,
    });
  }

  function commitDrag() {
    if (!dragState) {
      return;
    }

    const x = Math.round(dragState.startX + dragOffset.x);
    const y = Math.round(dragState.startY + dragOffset.y);
    updateElementById(slide.id, dragState.elementId, { x, y });
    setDragState(null);
    setDragOffset({ x: 0, y: 0 });
  }

  return (
    <div
      ref={canvasRef}
      className={`slide-canvas ${mode === "thumbnail" ? "is-thumbnail" : ""}`}
      style={{
        aspectRatio: `${deckSize.width} / ${deckSize.height}`,
        background: slide.background.color,
      }}
      onPointerDown={() => {
        if (mode === "editable") {
          selectElement(null);
        }
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={commitDrag}
      onPointerCancel={commitDrag}
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
          const isDragging = dragState?.elementId === element.id;
          const adjustedElement =
            isDragging && mode === "editable"
              ? {
                  ...element,
                  x: dragState.startX + dragOffset.x,
                  y: dragState.startY + dragOffset.y,
                }
              : element;

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
      </div>
    </div>
  );
}
