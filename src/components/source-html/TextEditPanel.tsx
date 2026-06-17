"use client";

import { useMemo } from "react";
import { extractTextNodes } from "@/core/source-html/extractText";
import { useSourceHtmlStore } from "@/store/useSourceHtmlStore";

export function TextEditPanel() {
  const slideElements = useSourceHtmlStore((s) => s.slideElements);
  const currentIndex = useSourceHtmlStore((s) => s.currentIndex);
  const updateText = useSourceHtmlStore((s) => s.updateText);

  const slide = slideElements[currentIndex];
  const nodes = useMemo(() => (slide ? extractTextNodes(slide) : []), [slide]);

  if (!slide) return <div className="empty-state">无幻灯片内容。</div>;
  if (nodes.length === 0) return <div className="empty-state">未检测到可编辑文本。</div>;

  return (
    <div className="text-edit-list">
      {nodes.map((node, i) => (
        <div key={i} className="text-edit-row">
          <span className="text-edit-tag" title={node.tag}>
            {node.className ? node.className.split(" ")[0] : node.tag}
          </span>
          <textarea
            className="text-edit-textarea"
            defaultValue={node.text}
            rows={Math.min(4, node.text.split("\n").length + 1)}
            onBlur={(e) => {
              if (e.target.value !== node.text) {
                updateText(currentIndex, node.path, e.target.value);
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}
