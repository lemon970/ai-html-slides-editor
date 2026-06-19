# 第十轮迭代计划：存储升级 + 导出演示完整化 + 基础媒体扩展

日期：2026-06-19  
分支基准：`codex/practical-usability-task-1-4`（commit `374d3ed`）

---

## 一、定位

第九轮补齐了演示与动效主线：动画系统、页面转场、演讲者备注、演示 HUD 全部落地，`pnpm test`（84）/ `tsc` / `build` 全绿。

本轮做三件事：

1. **补 iter-9 遗留 bug**：notes 文本域每击键都入 undo 栈（体验问题）；导出 HTML 无演示导航（闭环断裂）；emphasis 动画导出无触发。
2. **存储层升级**：localStorage → IndexedDB，解除 4MB 上限，为媒体扩展打地基。
3. **基础媒体扩展**：图片裁切（纯 CSS clip-path，零依赖），PPTX 导出预研文档。

视频、音频、字体嵌入仍顺延下轮——字体二进制体积大，宜等 IndexedDB 稳定后再引入资产管理深化。

---

## 二、本轮范围

### A. 遗留 Bug 修复

#### A1 Notes undo 防抖

**问题**：`updateCurrentSlideNotes`（`useDeckStore.ts:322`）每次 onChange 都调用 `pushHistory`，打备注时逐字入栈，ctrl+Z 逐字回撤。

**修复**：属性面板的 notes 文本域改为受控本地 state，**失焦（onBlur）或提交时**才调用 `updateCurrentSlideNotes`。编辑器内实时显示，但 undo 粒度为"一次完整编辑"。

**文件改动**
- `src/components/editor/PropertyPanel.tsx` — notes textarea 改用本地 state + onBlur 提交

#### A2 导出 HTML 内嵌演示模式

**问题**：`renderDeckHtml.ts` 生成垂直滚动布局，导出文件无翻页、无全屏、无键盘导航，演示必须依赖编辑器的 PresentationMode。

**方案**：在导出 HTML 的 `<script>` 区注入一段极简演示脚本（~40 行内联 JS），功能：

- 初始隐藏所有 slide，只显示当前页（`display:flex` 居中覆盖全屏）
- `ArrowRight` / `Space` / `PageDown` 下一页；`ArrowLeft` / `PageUp` 上一页
- `F` 或双击切换全屏（`document.documentElement.requestFullscreen`）
- HUD：页码（`n / total`）+ 进度条，`ESC` 退出演示、恢复滚动布局
- 进入演示模式：URL hash 加 `#present`，刷新可恢复（可选）

演示脚本**与动画触发脚本分开**，复用现有 `[data-anim-entrance]` 机制。

**文件改动**
- `src/core/render/renderDeckHtml.ts` — 注入演示脚本 + 演示 CSS（覆盖层、HUD）

#### A3 Emphasis 动画导出点击触发

**问题**：iter-9 设置了 emphasis 动画，但导出 HTML 无触发机制，用户看不到效果。

**方案**：`renderDeckHtml.ts` 里，有 `animations.emphasis` 的元素加 `data-anim-emphasis` 属性，注入脚本给这些元素绑 click 监听，点击时切换 `is-emphasis` class 播放一次动画（`animationend` 后移除 class）。keyframes 已由 `collectKeyframes` 统一收集，无需额外添加。

**文件改动**
- `src/core/render/renderDeckHtml.ts` — emphasis click 触发脚本 + `data-anim-emphasis` 属性注入

---

### B. IndexedDB 存储层升级

#### B1 现状分析

`src/core/persistence/draft.ts`：localStorage，`MAX_BYTES=4MB`，超限则省略图片并标记 `assetStatus:"omitted"`，24h 过期，schema 校验失败静默丢弃。

上限 4MB 导致：含图片的 deck 草稿极易丢失图片；iter-10 字体/视频资产会直接触顶；`preflight.ts` 阻止导出含 omitted 图片的 deck。

#### B2 设计目标

- **接口向后兼容**：`saveDraft(deck)` / `loadDraft()` / `clearDraft()` 签名不变，调用方无需修改。
- **容量**：IndexedDB 无硬顶（浏览器按磁盘百分比配额，通常 GB 级）。
- **迁移**：首次加载时，若 IndexedDB 无数据但 localStorage 有草稿，自动迁移一次后清除旧草稿。
- **过期**：保留 24h TTL 逻辑（写入时存 `savedAt`，读取时检查）。
- **Fallback**：IndexedDB 操作失败时降级到 localStorage（静默，不中断用户）。

#### B3 实现

新建 `src/core/persistence/idb.ts`：封装 IndexedDB open / get / put / delete，返回 Promise，不对外暴露 IDB 细节。

`src/core/persistence/draft.ts` 改写：
- `saveDraft`：序列化 deck → JSON string，写入 IDB（key: `"draft"`）。不再做 4MB 截断，不再省略图片。`assetStatus:"omitted"` 省略逻辑随之废弃。
- `loadDraft`：从 IDB 读取，检查 TTL，schema parse，失败静默返回 null。
- `clearDraft`：IDB delete。
- 迁移逻辑：`loadDraft` 首次执行时检查 localStorage `"deck-draft"` key，若存在则解析写入 IDB 后删除。

`src/core/export/preflight.ts`：移除 `assetStatus:"omitted"` 的导出阻断逻辑（该场景已不存在）。

#### B4 文件改动

- `src/core/persistence/idb.ts`（新建）— IndexedDB 封装
- `src/core/persistence/draft.ts` — 重写，使用 IDB，移除省略逻辑
- `src/core/export/preflight.ts` — 移除 omitted 阻断
- `tests/draft.test.ts` — 更新/新增测试（jsdom 已支持 fake-indexeddb 或用 mock）

---

### C. 图片裁切

#### C1 方案

纯 CSS `clip-path: inset(top right bottom left round radius)` 实现矩形裁切。存入 `imageElement.style.clip`（新增可选字段）：

```ts
// imageElement style 扩展
clip?: {
  top: number;    // 百分比，0-100
  right: number;
  bottom: number;
  left: number;
}
```

渲染时将 clip 转为 `clip-path: inset(${top}% ${right}% ${bottom}% ${left}%)` 内联样式。

编辑器内裁切 UI：属性面板图片分区增加"裁切"折叠项，四个方向滑块（0–50%）。

导出 HTML 同样输出 `clip-path`，无需额外处理。

#### C2 文件改动

- `src/core/schema/deck.ts` — `imageStyleSchema` 增加 `clip` 可选字段
- `src/core/style/css.ts` — `imageHtmlStyle` 输出 clip-path
- `src/components/editor/SlideCanvas.tsx` / `ElementRenderer.tsx` — 渲染 clip-path
- `src/components/editor/inspectors/`（新建 `ClipSection.tsx` 或并入 `LayoutSection`）
- `tests/renderDeckHtml.test.ts` — 补裁切 round-trip 断言

---

### D. PPTX 导出预研（纯文档）

评估 `pptxgenjs` 作为前端 PPTX 生成方案的可行性：

- 库体积（gzipped）与引入成本。
- 文本/图片/形状的映射完整度。
- 动画导出支持情况（pptx 有自己的动画模型）。
- deck → PPTX 的数据映射草案（哪些字段可映射，哪些需妥协）。
- 结论：本轮值不值得引入，还是留 iter-11。

**文件改动**
- `docs/pptx-export-research.md`（新建）

---

## 三、不做（本轮）

- **不做视频/音频元素**（顺延，待媒体管理模型设计完成）。
- **不做字体资产嵌入**（顺延，字体管理复杂度高）。
- **不做 Tauri/Electron 打包**（D 仍为预研）。
- **不做动画顺序编排时间轴**（顺延）。
- **不做双屏演示**（演示 HUD 单屏够用）。
- **不引入新运行时依赖**（IDB 原生 API，clip-path 原生 CSS，演示脚本内联）。

---

## 四、验收标准

### A1 Notes 防抖

- 在备注框连续输入 10 个字，ctrl+Z 一次回退到输入前状态（不逐字回撤）。
- 失焦后 undo 可撤销本次编辑。

### A2 导出 HTML 演示模式

- 导出 HTML，浏览器打开后按 `ArrowRight` 可翻页，`ArrowLeft` 返回，`F` 全屏。
- HUD 显示 `n / total` 页码。
- `ESC` 退出演示、恢复滚动视图。
- 含入场动画的 deck 导出后，演示翻到该页时动画正常触发。
- 不含演示脚本的旧版导出 HTML（手动构造）打开不报错（向后兼容无关，导出即全量）。

### A3 Emphasis 触发

- 给元素设置 emphasis 动画，导出 HTML 后点击该元素，动画播放一次。
- 再次点击重新播放，不叠加。

### B IndexedDB 存储

- 导入一张 > 500KB 的图片，保存草稿，刷新页面，图片正常恢复（不降级为占位符）。
- 模拟旧 localStorage 草稿存在的场景，首次加载自动迁移，localStorage key 被清除。
- IDB 写入失败时（可 mock）不报错、不中断用户，静默降级。
- `pnpm test` 覆盖 draft load / save / migrate / expire 四个路径。

### C 图片裁切

- 图片元素设置裁切 top=20%，画布和导出 HTML 均呈现上方裁去 20%。
- 裁切参数导出 JSON 后重新导入还原（round-trip）。
- 不设置裁切的图片渲染不受影响。

### 工程

- `pnpm test` 通过。
- `pnpm build` 通过。
- `pnpm exec tsc --noEmit` 通过。

---

## 五、任务顺序与依赖

```
Task 1：A1 Notes 防抖（独立）
Task 2：A3 Emphasis 导出触发（独立，改 renderDeckHtml）
Task 3：A2 导出 HTML 演示模式（独立，改 renderDeckHtml，与 Task 2 同文件串行）
Task 4：B IDB 封装 idb.ts（独立）
Task 5：B draft.ts 重写（依赖 Task 4）
Task 6：B preflight.ts 清理（依赖 Task 5）
Task 7：C clip schema 扩展（独立）
Task 8：C 渲染层 clip-path（依赖 Task 7）
Task 9：C 属性面板裁切 UI（依赖 Task 7）
Task 10：D PPTX 预研文档（独立）
```

并行分组：
- **组 1**：Task 1 / 2 / 4 / 7 / 10 可同时开始
- **组 2**：Task 3（等 Task 2 合并到 renderDeckHtml）/ Task 5 / Task 8 / Task 9
- **组 3**：Task 6（等 Task 5）

建议开发顺序：先做 Task 2 → Task 3（同文件，连续改完），再做 Task 1，再做 Task 4 → 5 → 6，最后 Task 7 → 8 → 9。

---

## 六、风险与缓解

| 风险 | 缓解 |
|---|---|
| jsdom 测试环境不支持真实 IndexedDB | 使用 `fake-indexeddb` 包（仅 devDependency，不进 bundle），或对 `idb.ts` 做 mock | 
| IDB 异步改写让 `saveDraft` 变 async，调用方需改 | `useDeckStore` 里 saveDraft 调用方式改为 `void saveDraft(deck)`，fire-and-forget，不阻塞 UI |
| 导出演示脚本与动画触发脚本合并管理复杂 | 两段脚本各自独立 `<script>`，不合并，职责清晰 |
| clip-path 裁切与 object-fit 组合样式 | clip-path 加在容器 `<div>` 而非 `<img>`，不影响 object-fit |
| preflight 移除 omitted 阻断后旧 deck 兼容 | `assetStatus:"omitted"` 字段不删除 schema，仅移除 preflight 里的阻断判断；旧 deck 加载正常 |

---

## 七、与长期路线的关系

```
轮次 9（完成）：动画系统 + 转场 + 演讲者备注 + 演示增强
轮次 10（本轮）：存储升级 + 导出演示完整化 + 图片裁切  →  基础体验补完
轮次 11：媒体深化（视频/音频/字体），依赖本轮 IDB 稳定  →  资产管理正式化
轮次 12：桌面化 Tauri 打包（依据 iter-9 预研）  →  EXE 分发
轮次 13+：AI API 接入 / PPTX 导出（视 pptx 预研结论）
```

本轮把三个已知痛点（notes bug、导出无法演示、存储上限）集中收口，同时加图片裁切作为媒体能力扩展的首个落地功能。整轮零新运行时依赖（`fake-indexeddb` 仅 dev），不改 API 和数据格式（图片裁切字段全 optional）。
