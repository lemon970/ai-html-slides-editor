# 第七轮迭代计划：Snap吸附 + 代码块元素 + PNG/PDF导出 + Mode Bridge

日期：2026-06-17  
分支基准：`codex/practical-usability-task-1-4`（第六轮收尾后合入 main）

---

## 一、定位

第六轮让编辑器进入"日常可用"状态：对齐分布、草稿安全、全屏演示均已就绪。

第七轮目标是**拉近与 Canva/Figma 的体验差距**，解决四个方向：

| 方向 | 问题 | 解法 |
|---|---|---|
| A — 画布精度 | 手拖仍然凌乱，缺少视觉引导 | Snap 吸附 + 参考线 + 网格 |
| B — 内容表达 | 只有文字/图片/矩形，代码无法优雅呈现 | 代码块元素（含语法高亮） |
| D — 输出闭环 | 只能导出 HTML，无法导出图片/文档 | PNG 截图 + PDF 导出 |
| F — Mode Bridge | Source HTML → JSON 路径需要手动粘贴提示词 | 自动填充提示词 + 一键复制含HTML正文 |

AI 原生操作（直接调 LLM API）留到第八轮，本轮不做。

---

## 二、方向 A — Snap 吸附与网格

### A1 元素间吸附

拖动元素时，当元素的边缘或中心线与**其他元素**或**画布边缘/中线**距离 ≤ 6px（设计像素），自动吸附并显示参考线。

吸附点：
- 左/右/中 × 上/下/中，共 9 个吸附锚点（每个元素）
- 画布：左边缘、水平中线、右边缘；上边缘、垂直中线、下边缘

参考线：吸附时在画布上叠加一条 1px 彩色线（颜色 `#3b82f6`），松手后消失。

### A2 网格

工具栏加"网格 ⊞"切换按钮，默认关。  
开启时在画布背景绘制点阵网格（间距 16px，颜色半透明灰）。  
网格**仅视觉**，不影响 schema；Snap 吸附在网格开启时附加网格点吸附（16px 倍数）。

### A3 实现策略

Snap 发生在 `SlideViewport` 的 `onMouseMove` drag 路径中（当前坐标修正阶段）。

关键接口：

```ts
// src/core/geometry/snap.ts（新建）
snapPosition(
  dragging: { x: number; y: number; w: number; h: number },
  others: SlideElement[],
  canvasSize: { width: number; height: number },
  threshold: number,      // 默认 6
  gridSize: number | null // null = 不吸附网格
): { x: number; y: number; guides: SnapGuide[] }

type SnapGuide = { axis: "x" | "y"; position: number }
```

`guides` 传给 `SlideViewport` state，通过 SVG overlay 渲染参考线（覆盖在画布上方，`pointer-events:none`）。

### 文件改动

- `src/core/geometry/snap.ts`（新建）— 纯函数，无副作用
- `src/components/editor/SlideViewport.tsx` — 拖拽路径接入 `snapPosition`，渲染 SVG 参考线 overlay
- `src/components/editor/Toolbar.tsx` — 网格切换按钮（state 放 `SlideViewport` 或全局 UI store）
- `src/styles/editor.css` — 网格背景 CSS（`background-image: radial-gradient(...)`）

### 验收标准

- 拖动元素靠近另一元素右边缘时，吸附并显示竖向蓝线，松手后消失
- 开启网格后，画布出现点阵；拖动元素时 x/y 吸附到 16px 倍数
- Snap 不影响对齐按钮、分布按钮的逻辑（纯 UI 层修正）

---

## 三、方向 B — 代码块元素

### B1 新元素类型 `code`

schema 已有 `html` 类型，但 `code` 语义更清晰，且需要独立渲染逻辑。  
考虑到最小侵入性，用**扩展 `html` 元素**实现：在 `HtmlElement` 上增加可选 `codeConfig` 字段。

```ts
// deck.ts 扩展
export const htmlElementSchema = baseElementSchema.extend({
  type: z.literal("html"),
  html: z.string(),
  editable: z.literal(false).optional(),
  codeConfig: z.object({
    language: z.string().default("plaintext"),
    theme: z.enum(["dark", "light"]).default("dark"),
  }).optional(),
});
```

`html` 字段存原始代码文本（非高亮 HTML）；渲染时由 `renderElement` 调用高亮。

### B2 语法高亮方案

使用 [shiki](https://shiki.style/) v1（`@shikijs/core` 按需加载，bundle size 可控）：
- SSR 友好，输出纯 HTML + CSS，无 runtime
- 按需加载语言 grammar（只打包 js/ts/python/bash/json/html，约 120KB gz）

高亮在 `renderElement` 中同步调用（shiki v1 支持同步 API via `createHighlighterCore`）。

工具栏"+ 代码块"按钮：弹出小 popover 选语言，插入默认尺寸（w=800 h=400）的 html element。

### B3 代码编辑

双击代码块 → 弹出全宽 `<textarea>` 模态框编辑原始代码，确认后更新 `html` 字段并重新高亮。  
（不需要在画布上 inline 编辑，避免与现有文本 inline 编辑逻辑冲突）

### 文件改动

- `src/core/schema/deck.ts` — `htmlElementSchema` 增加 `codeConfig`
- `src/core/render/renderElement.ts`（或现有渲染路径）— 检测 `codeConfig` 后调 shiki 高亮
- `src/components/editor/SlideCanvas.tsx` — 双击 html element 打开代码编辑模态框
- `src/components/editor/CodeEditModal.tsx`（新建）— textarea + 语言选择下拉
- `src/components/editor/Toolbar.tsx` — "+ 代码块"按钮
- `package.json` — 新增 `shiki` 依赖

### 验收标准

- 工具栏点"+ 代码块"，画布插入一个深色背景的代码块（示例代码）
- 双击代码块，弹出编辑模态框，修改代码后确认，画布实时更新高亮
- 导出 HTML 后，代码块保留语法高亮色彩
- 导出 JSON 后重新导入，代码块还原

---

## 四、方向 D — PNG/PDF 导出

### D1 技术选型

| 方案 | 优点 | 缺点 |
|---|---|---|
| `html2canvas` | 纯浏览器，无依赖 | 与自定义 CSS 兼容差（transform/clip-path） |
| `dom-to-image-more` | 比 html2canvas 更新，支持更多 CSS | 仍有兼容问题 |
| Playwright headless（服务端） | 完美还原 | 需要后端 |
| **OffscreenCanvas + 手动绘制** | 精确，但工作量大 | 不适合通用方案 |

**选型**：`html2canvas`（`html2canvas-pro` fork，修复了部分 CSS 问题）+ `jsPDF`。  
已知限制：transform/rotate 元素可能有偏差；在 README 中注明。

### D2 PNG 导出（每页截图）

导出流程：
1. 工具栏"导出 PNG"按钮（下拉菜单：当前页 / 全部页）
2. 对选中 slide，创建一个 `visibility:hidden` 的 1:1 尺寸 DOM（1600×900），填充 slide 内容
3. `html2canvas(el, { scale: 2 })` → `canvas.toBlob()` → `downloadBlob()`
4. 全部页时批量循环，打包 zip（用 `JSZip`）下载

### D3 PDF 导出

流程同 PNG，每页 canvas → `jsPDF.addImage()` → 最终 `.pdf` 下载。  
纸张：16:9 宽屏（297×167mm，A4横向裁切），每页一张 slide。

### D4 导出进度

批量导出时显示进度（`正在导出 3/12...`），用简单 `useState` 管理，不需要 worker。

### 文件改动

- `src/core/export/exportPng.ts`（新建）— `exportSlideAsPng(slide, deckSize)`
- `src/core/export/exportPdf.ts`（新建）— `exportDeckAsPdf(deck)`
- `src/components/editor/Toolbar.tsx` — 导出下拉菜单（含 HTML / JSON / PNG / PDF）
- `package.json` — `html2canvas-pro`, `jspdf`, `jszip`

### 验收标准

- 点"导出当前页 PNG"，下载 1600×900 px（@2x = 3200×1800）的 PNG
- 点"导出全部 PDF"，下载多页 PDF，每页对应一张 slide
- 有代码块的 slide，高亮色彩在 PNG 中保留

---

## 五、方向 F — Mode Bridge 深化

### F1 当前状态

Source HTML 模式检测到"格式不匹配"时，弹出对话框显示转换提示词。  
用户需要：复制提示词 → 去 AI → 粘贴 → 贴回 HTML → 重新导入。步骤繁琐。

### F2 改进：一键复制 含HTML 的完整提示

当前弹窗只复制提示词模板，用户还要手动把 HTML 内容粘贴进去。

改进：弹窗里"复制提示词"按钮改为**"复制提示词 + HTML"**——自动把 `pending.html` 拼接在提示词后面，一次复制，直接粘给 AI。

```
{PROMPT_TO_JSON_SCHEMA}

---
以下是需要转换的 HTML 文件：

{pending.html}
```

### F3 Source HTML 升级入口优化

Source HTML 编辑器顶栏，当前有"升级为 JSON 编辑"按钮（弹出转换提示词）。  
改进：同样升级为"复制提示词+HTML"一键复制，减少操作步骤。

### F4 JSON → Source HTML 预览

从 JSON 编辑器导出 HTML 后，可以选择"在 Source HTML 模式预览"——  
直接把当前 deck 渲染为 HTML，切换到 Source HTML 模式查看最终效果（不离开应用）。

### 文件改动

- `src/components/ImportLanding.tsx` — `copyConvert` 函数改为拼接 HTML
- `src/components/source-html/SourceHtmlShell.tsx` — 升级按钮同步修改
- `src/components/editor/Toolbar.tsx` — 新增"在 Source HTML 中预览"按钮（调 `renderDeckHtml` + `loadSource`）

### 验收标准

- 导入非标准 HTML → 弹窗 → 点"复制提示词+HTML" → 粘贴板含完整提示词和 HTML 内容
- Source HTML 模式"升级"按钮点击后，粘贴板内容同上
- JSON 编辑器工具栏"Source HTML 预览"，切换后显示当前 deck 的渲染效果

---

## 六、任务顺序与依赖

```
Task 1：snap.ts 纯函数（独立）
Task 2：SlideViewport 接入 Snap + SVG 参考线（依赖 Task 1）
Task 3：网格切换 UI（依赖 Task 2）

Task 4：deck.ts 扩展 codeConfig（独立）
Task 5：shiki 渲染 + 现有渲染路径接入（依赖 Task 4）
Task 6：CodeEditModal + 双击交互（依赖 Task 4）
Task 7：工具栏"+ 代码块"按钮（依赖 Task 6）

Task 8：exportPng.ts（独立）
Task 9：exportPdf.ts（依赖 Task 8）
Task 10：Toolbar 导出下拉菜单（依赖 Task 8/9）

Task 11：ImportLanding copyConvert 升级（独立）
Task 12：SourceHtmlShell 同步修改（独立）
Task 13：Toolbar "Source HTML 预览"按钮（独立）
```

并行分组：
- **组 1**：Task 1/4/8/11 可同时开始
- **组 2**：Task 2/5/9/12 依赖组 1 对应任务
- **组 3**：Task 3/6/10/13 依赖组 2

---

## 七、不做（本轮）

- AI 原生操作（直接调 LLM）— 留第八轮
- 演讲者备注（schema 已有 `notes` 字段，UI 留下轮）
- 视频/iframe 元素
- 实时协作
- 元素动画

---

## 八、与长期路线的关系

```
轮次 6（完成）：对齐 + 数据安全 + 播放  →  日常可用
轮次 7（本轮）：Snap + 代码块 + PNG/PDF + Mode Bridge  →  接近 Canva 体验
轮次 8：演讲者备注 + 幻灯片转场动画 + AI 原生操作  →  内容创作完整闭环
轮次 9：桌面化 / Tauri 打包  →  EXE 分发
```
