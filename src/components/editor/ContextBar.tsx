"use client";

import { selectedGroupId } from "@/core/selection/groupOperations";
import { useDeckStore } from "@/store/useDeckStore";
import type { AlignAxis } from "@/core/ops/alignOperations";

const ALIGN_BTNS: { axis: AlignAxis; label: string; title: string }[] = [
  { axis: "left",    label: "⊢",  title: "左对齐" },
  { axis: "hCenter", label: "⊟",  title: "水平居中" },
  { axis: "right",   label: "⊣",  title: "右对齐" },
  { axis: "top",     label: "⊤",  title: "顶对齐" },
  { axis: "vCenter", label: "⊞",  title: "垂直居中" },
  { axis: "bottom",  label: "⊥",  title: "底对齐" },
];

export function ContextBar() {
  const deck = useDeckStore((s) => s.deck);
  const currentSlideId = useDeckStore((s) => s.currentSlideId);
  const selectedElementIds = useDeckStore((s) => s.selectedElementIds);
  const alignSelectedElements = useDeckStore((s) => s.alignSelectedElements);
  const distributeSelectedElements = useDeckStore((s) => s.distributeSelectedElements);
  const groupSelectedElements = useDeckStore((s) => s.groupSelectedElements);
  const ungroupSelectedElements = useDeckStore((s) => s.ungroupSelectedElements);
  const duplicateSelectedElements = useDeckStore((s) => s.duplicateSelectedElements);
  const deleteSelectedElements = useDeckStore((s) => s.deleteSelectedElements);

  if (selectedElementIds.length === 0) return null;

  const slide = deck.slides.find((s) => s.id === currentSlideId);
  const activeGroupId = slide ? selectedGroupId(slide.elements, selectedElementIds) : null;
  const canDistribute = selectedElementIds.length >= 3;
  const hasMulti = selectedElementIds.length >= 2;

  return (
    <div className="context-bar" role="toolbar" aria-label="排列操作">
      <div className="ctx-group">
        {ALIGN_BTNS.map(({ axis, label, title }) => (
          <button key={axis} type="button" className="ctx-btn" title={title}
            onClick={() => alignSelectedElements(axis)}>{label}</button>
        ))}
        <button type="button" className="ctx-btn" title="水平均匀分布" disabled={!canDistribute}
          onClick={() => distributeSelectedElements("horizontal")}>⇔</button>
        <button type="button" className="ctx-btn" title="垂直均匀分布" disabled={!canDistribute}
          onClick={() => distributeSelectedElements("vertical")}>⇕</button>
      </div>
      <span className="ctx-sep" />
      <div className="ctx-group">
        <button type="button" className="ctx-btn" title="组合" disabled={!hasMulti}
          onClick={groupSelectedElements}>组合</button>
        <button type="button" className="ctx-btn" title="取消组合" disabled={!activeGroupId}
          onClick={ungroupSelectedElements}>拆组</button>
        <button type="button" className="ctx-btn" title="快速复制"
          onClick={duplicateSelectedElements}>复制</button>
        <button type="button" className="ctx-btn ctx-btn-danger" title="删除"
          onClick={deleteSelectedElements}>删除</button>
      </div>
    </div>
  );
}
