"use client";

import { ChangeEvent, MouseEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { ElementRenderer } from "./ElementRenderer";
import { TransformBox } from "./controls/TransformBox";
import { fileToDataUrl, imageAccept } from "@/core/assets/imageDataUrl";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import type { EditorCommand } from "@/core/commands/editorCommands";
import type { Deck, Slide, SlideElement } from "@/core/schema/deck";
import { sortElements, visibleElements } from "@/core/ops/deckOperations";
import { boundsFromElements, elementBounds, type Bounds } from "@/core/geometry/bounds";
import {
  moveBounds,
  resizeBounds,
  rotationFromPointer,
  scaleBoundsWithinFrame,
  type ResizeHandle,
} from "@/core/geometry/transform";
import { elementIdsForGroup, shouldSelectWholeGroup } from "@/core/selection/groupOperations";
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
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const selectedElementId = useDeckStore((state) => state.selectedElementId);
  const selectedElementIds = useDeckStore((state) => state.selectedElementIds);
  const clipboardElementIds = useDeckStore((state) => state.clipboardElementIds);
  const selectElement = useDeckStore((state) => state.selectElement);
  const selectElements = useDeckStore((state) => state.selectElements);
  const toggleElementSelection = useDeckStore((state) => state.toggleElementSelection);
  const clearSelection = useDeckStore((state) => state.clearSelection);
  const updateElementsById = useDeckStore((state) => state.updateElementsById);
  const executeCommand = useDeckStore((state) => state.executeCommand);
  const addImageElement = useDeckStore((state) => state.addImageElement);
  const addTextElement = useDeckStore((state) => state.addTextElement);
  const addShapeElement = useDeckStore((state) => state.addShapeElement);
  const setError = useDeckStore((state) => state.setError);
  const duplicateSelectedElements = useDeckStore((state) => state.duplicateSelectedElements);
  const deleteSelectedElements = useDeckStore((state) => state.deleteSelectedElements);
  const toggleElementLocked = useDeckStore((state) => state.toggleElementLocked);
  const toggleElementHidden = useDeckStore((state) => state.toggleElementHidden);
  const updateElementById = useDeckStore((state) => state.updateElementById);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [interaction, setInteraction] = useState<InteractionState | null>(null);
  const [previewPatches, setPreviewPatches] = useState<PreviewPatches>({});
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);
  const [scale, setScale] = useState(1);
  const elements = useMemo(() => sortElements(slide.elements), [slide.elements]);
  const renderElements = useMemo(() => visibleElements(elements), [elements]);
  const selectedElement = selectedElementId
    ? elements.find((element) => element.id === selectedElementId)
    : null;
  const selectedElementVisible = Boolean(selectedElement && !selectedElement.hidden);
  const selectedElements = useMemo(
    () => renderElements.filter((element) => selectedElementIds.includes(element.id)),
    [renderElements, selectedElementIds],
  );
  const selectedFrame = useMemo(() => boundsFromElements(selectedElements), [selectedElements]);
  const previewSelectedFrame = useMemo(
    () =>
      boundsFromElements(
        selectedElements.map((element) => withPreviewPatch(element, previewPatches[element.id])),
      ),
    [previewPatches, selectedElements],
  );
  const canTransformSingleElement = selectedElementIds.length === 1 && !selectedElement?.locked;
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

  useEffect(() => {
    setEditingElementId(null);
  }, [slide.id]);

  function commitTextEdit(elementId: string, value: string) {
    updateElementById(slide.id, elementId, { content: value });
    setEditingElementId(null);
  }

  function handleElementDoubleClick(element: SlideElement) {
    if (element.locked || element.type !== "text") return;
    selectElement(element.id);
    setInteraction(null);
    setPreviewPatches({});
    setEditingElementId(element.id);
  }

  function handleElementPointerDown(event: PointerEvent<HTMLDivElement>, element: SlideElement) {
    if (mode !== "editable" || element.locked) {
      return;
    }

    event.stopPropagation();
    if (event.altKey) {
      selectNextElementAtPoint(event, element);
      return;
    }

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

    if (shouldSelectWholeGroup(element) && element.groupId) {
      const groupElementIds = elementIdsForGroup(elements, element.groupId);
      const groupElements = elements.filter((item) => groupElementIds.includes(item.id));
      selectElements(groupElementIds);
      setPreviewPatches({});
      setInteraction({
        mode: "multi-move",
        startClientX: event.clientX,
        startClientY: event.clientY,
        startBoundsById: selectedBoundsById(groupElements),
      });
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

  function runCommand(command: EditorCommand) {
    executeCommand(command);
    setContextMenu(null);
  }

  function handleElementContextMenu(event: MouseEvent<HTMLDivElement>, element: SlideElement) {
    if (mode !== "editable") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const elementIds = selectedElementIds.includes(element.id) ? selectedElementIds : [element.id];
    if (!selectedElementIds.includes(element.id)) {
      selectElement(element.id);
    }

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: "复制",
          onSelect: () => runCommand({ type: "copy-elements", elementIds }),
        },
        {
          label: "快速复制",
          onSelect: () => runCommand({ type: "duplicate-elements", elementIds }),
        },
        {
          label: "删除",
          onSelect: () => runCommand({ type: "delete-elements", elementIds }),
        },
        {
          label: element.locked ? "解锁" : "锁定",
          onSelect: () => runCommand({ type: "toggle-locked", elementIds }),
        },
        {
          label: element.hidden ? "显示" : "隐藏",
          onSelect: () => runCommand({ type: "toggle-hidden", elementIds }),
        },
        {
          label: "置顶",
          onSelect: () => runCommand({ type: "move-layer", elementIds, action: "bring-to-front" }),
        },
        {
          label: "上移一层",
          onSelect: () => runCommand({ type: "move-layer", elementIds, action: "bring-forward" }),
        },
        {
          label: "下移一层",
          onSelect: () => runCommand({ type: "move-layer", elementIds, action: "send-backward" }),
        },
        {
          label: "置底",
          onSelect: () => runCommand({ type: "move-layer", elementIds, action: "send-to-back" }),
        },
      ],
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
        event.shiftKey,
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
      selectElements(elementIdsInMarquee(renderElements, interaction.currentBounds));
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

  function handleCanvasContextMenu(event: MouseEvent<HTMLDivElement>) {
    if (mode !== "editable") {
      return;
    }

    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: "粘贴",
          disabled: clipboardElementIds.length === 0,
          onSelect: () => runCommand({ type: "paste-elements" }),
        },
        {
          label: "新建文本",
          onSelect: () => { addTextElement(); setContextMenu(null); },
        },
        {
          label: "新建矩形",
          onSelect: () => { addShapeElement("rect"); setContextMenu(null); },
        },
        {
          label: "新建椭圆",
          onSelect: () => { addShapeElement("ellipse"); setContextMenu(null); },
        },
        {
          label: "导入图片",
          onSelect: () => { imageInputRef.current?.click(); setContextMenu(null); },
        },
      ],
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

  function selectNextElementAtPoint(
    event: PointerEvent<HTMLDivElement>,
    currentElement: SlideElement,
  ) {
    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }

    const candidates = [...renderElements]
      .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
      .filter((element) => {
        const bounds = elementBounds(element);
        return (
          point.x >= bounds.x &&
          point.x <= bounds.x + bounds.w &&
          point.y >= bounds.y &&
          point.y <= bounds.y + bounds.h
        );
      });
    if (candidates.length === 0) {
      return;
    }

    const currentIndex = candidates.findIndex((element) => element.id === currentElement.id);
    const nextElement = candidates[(currentIndex + 1) % candidates.length] ?? candidates[0];
    selectElement(nextElement.id);
    setPreviewPatches({});
    setInteraction(null);
  }

  function handleHideSelected() {
    if (!selectedElementId || selectedElementIds.length !== 1) {
      return;
    }

    toggleElementHidden(selectedElementId);
  }

  function handleToggleLockSelected() {
    if (!selectedElementId || selectedElementIds.length !== 1) {
      return;
    }

    toggleElementLocked(selectedElementId);
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
      onContextMenu={handleCanvasContextMenu}
    >
      <div
        className="slide-coordinate-space"
        style={{
          width: deckSize.width,
          height: deckSize.height,
          transform: `scale(${scale})`,
        }}
      >
        {renderElements.map((element) => {
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
              onContextMenu={handleElementContextMenu}
              onDoubleClick={handleElementDoubleClick}
            />
          );
        })}
        {mode === "editable" && editingElementId ? (() => {
          const el = elements.find((e) => e.id === editingElementId);
          return el && el.type === "text" ? (
            <TextEditOverlay
              element={el}
              onCommit={(value) => commitTextEdit(editingElementId, value)}
            />
          ) : null;
        })() : null}
        {mode === "editable" && selectedElement && selectedElementVisible && canTransformSingleElement ? (
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
        {mode === "editable" && previewSelectedFrame ? (
          <div
            className="selection-action-bar"
            style={{
              left: Math.max(8, previewSelectedFrame.x),
              top: Math.max(8, previewSelectedFrame.y - 46),
            }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button type="button" onClick={duplicateSelectedElements}>
              复制
            </button>
            <button type="button" onClick={deleteSelectedElements}>
              删除
            </button>
            {selectedElementIds.length === 1 ? (
              <>
                <button type="button" onClick={handleToggleLockSelected}>
                  {selectedElement?.locked ? "解锁" : "锁定"}
                </button>
                <button type="button" onClick={handleHideSelected}>
                  隐藏
                </button>
              </>
            ) : null}
            <span>Alt+点击选择下层</span>
          </div>
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
      {mode === "editable" && contextMenu ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
      <input
        ref={imageInputRef}
        type="file"
        accept={imageAccept}
        aria-label="选择图片文件"
        tabIndex={-1}
        className="visually-hidden"
        onChange={async (event: ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          try {
            addImageElement(await fileToDataUrl(file), file.name);
          } catch {
            setError("导入图片失败。");
          }
        }}
      />
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

function TextEditOverlay({
  element,
  onCommit,
}: {
  element: Extract<SlideElement, { type: "text" }>;
  onCommit: (value: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <textarea
      ref={ref}
      defaultValue={element.content}
      style={{
        position: "absolute",
        left: element.x,
        top: element.y,
        width: element.w,
        height: element.h,
        transform: `rotate(${element.rotation ?? 0}deg)`,
        transformOrigin: "center center",
        fontFamily: element.style.fontFamily,
        fontSize: element.style.fontSize,
        fontWeight: element.style.fontWeight as never,
        fontStyle: element.style.fontStyle,
        color: element.style.color,
        lineHeight: element.style.lineHeight,
        letterSpacing: element.style.letterSpacing,
        textAlign: element.style.textAlign as never,
        background: element.style.background ?? "transparent",
        padding: element.style.padding,
        borderRadius: element.style.borderRadius,
        whiteSpace: "pre-wrap",
        outline: "2px solid #0891b2",
        resize: "none",
        border: "none",
        overflow: "hidden",
        zIndex: 9000,
        cursor: "text",
        boxSizing: "border-box",
      }}
      onBlur={(e) => onCommit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onCommit(e.currentTarget.value);
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
    />
  );
}
