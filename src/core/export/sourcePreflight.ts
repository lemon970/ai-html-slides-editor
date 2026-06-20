import { applyPatches, type Patch } from "@/core/patches/patches";
import { detectSlides } from "@/core/annotation/uidAnnotation";

export type PreflightLevel = "error" | "warning" | "info";
export type PreflightItem = { level: PreflightLevel; message: string };
export type PreflightResult = { items: PreflightItem[]; hasError: boolean; hasWarning: boolean; html: string };

export function runPreflight(sourceHtml: string, patches: Patch[]): PreflightResult {
  const { html, stale } = applyPatches(sourceHtml, patches);
  const items: PreflightItem[] = [];

  // Stale patches
  for (const s of stale)
    items.push({ level: "error", message: `修改未能应用 (${s.id}): ${s.reason}` });

  // Export cleanliness
  if (html.includes("data-eid")) items.push({ level: "error", message: "导出 HTML 含 data-eid 属性" });
  if (html.includes("data-editor-injected")) items.push({ level: "error", message: "导出 HTML 含编辑器注入脚本" });
  if (html.includes("__editMode")) items.push({ level: "error", message: "导出 HTML 含编辑器标记" });

  // Image risks — use DOMParser + getAttribute to get raw src values
  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    let hasDataImg = false;
    doc.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") ?? "";
      if (src.startsWith("blob:"))
        items.push({ level: "error", message: `图片使用 blob: URL，导出后将失效: ${src.slice(0, 40)}` });
      else if (src.startsWith("data:"))
        hasDataImg = true;
      else if (/^https?:\/\//i.test(src))
        items.push({ level: "warning", message: `外链图片依赖网络: ${src.slice(0, 60)}${src.length > 60 ? "…" : ""}` });
    });
    if (hasDataImg) items.push({ level: "info", message: "包含嵌入图片（data URL），文件体积可能较大" });
  }

  // Slide structure
  if (typeof DOMParser !== "undefined") {
    const srcDoc = new DOMParser().parseFromString(sourceHtml, "text/html");
    if (detectSlides(srcDoc).length === 0)
      items.push({ level: "warning", message: "未识别到 slide 结构，可导出但无法保证页面导航/缩略图" });
  }

  return {
    items,
    hasError: items.some((i) => i.level === "error"),
    hasWarning: items.some((i) => i.level === "warning"),
    html,
  };
}
