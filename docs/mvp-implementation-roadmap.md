# AI HTML Slides Editor MVP 实现路径

日期：2026-06-15

关联调研文档：`docs/ai-html-slides-editor-research.md`

## 1. MVP 目标

从当前空项目工作区开始，搭建一个可运行的 AI HTML Slides 可视化编辑器 MVP。

MVP 验收标准：

- 可以打开一个本地 demo deck。
- 左侧显示 slide 缩略图。
- 点击 slide 可以切换当前页。
- 中间显示当前 slide。
- 可以点击选择元素。
- 可以编辑文本。
- 可以拖动元素。
- 可以修改字号、颜色、背景。
- 可以保存为 JSON。
- 可以导出为单文件 HTML。

## 2. 实现原则

- 当前项目以 `deck.json` 为主数据模型，HTML 是渲染和导出结果。
- MVP 只完整支持受约束 HTML / JSON deck，不承诺任意 HTML 高保真可编辑。
- 先完成无 AI 接入的人工编辑能力，再预留 AI operation 接口。
- 不在工作区根目录堆放临时文件。源码进入 `src/`，文档进入 `docs/`，静态资源进入 `public/`，测试进入 `tests/` 或源码同级测试文件。
- 不生成 PPTX、不做动画时间轴、不做复杂富文本和任意 HTML 导入。

## 3. 推荐最终目录结构

```txt
.
├─ docs/
│  ├─ ai-html-slides-editor-research.md
│  └─ mvp-implementation-roadmap.md
├─ public/
│  └─ demo-assets/
├─ src/
│  ├─ app/
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  └─ editor/
│  │     ├─ AppShell.tsx
│  │     ├─ SlideNavigator.tsx
│  │     ├─ SlideViewport.tsx
│  │     ├─ SlideCanvas.tsx
│  │     ├─ ElementRenderer.tsx
│  │     ├─ SelectionFrame.tsx
│  │     ├─ PropertyPanel.tsx
│  │     └─ Toolbar.tsx
│  ├─ core/
│  │  ├─ schema/
│  │  │  ├─ deck.ts
│  │  │  └─ validators.ts
│  │  ├─ render/
│  │  │  └─ renderDeckHtml.ts
│  │  ├─ import/
│  │  │  └─ parseConstrainedHtml.ts
│  │  ├─ export/
│  │  │  ├─ downloadJson.ts
│  │  │  └─ downloadHtml.ts
│  │  └─ ops/
│  │     ├─ deckOperations.ts
│  │     └─ history.ts
│  ├─ data/
│  │  └─ demoDeck.ts
│  ├─ store/
│  │  └─ useDeckStore.ts
│  └─ styles/
│     └─ editor.css
├─ tests/
│  ├─ schema.test.ts
│  ├─ renderDeckHtml.test.ts
│  └─ parseConstrainedHtml.test.ts
├─ package.json
├─ next.config.ts
├─ tsconfig.json
├─ vitest.config.ts
└─ .gitignore
```

说明：

- 当前工作区已有 `docs/`，后续直接在根目录初始化 Next.js 项目，不再创建嵌套项目文件夹。
- 如果使用脚手架不方便在非空目录运行，可以手动添加 `package.json`、`src/`、配置文件，保持目录清晰。
- `node_modules/`、`.next/`、`coverage/`、导出样例等都应写入 `.gitignore`。

## 4. 依赖建议

MVP 依赖：

```bash
pnpm add next react react-dom zod zustand nanoid file-saver
pnpm add -D typescript @types/react @types/react-dom @types/node vitest jsdom
```

拖动能力有两条路线：

- 第一版可先手写 pointer drag，只实现元素移动，减少依赖和复杂度。
- 第二步再接入 `react-moveable`，补缩放、旋转、辅助线。

如果直接做拖拽、缩放、旋转，增加：

```bash
pnpm add react-moveable
```

HTML 导入清洗后续增加：

```bash
pnpm add dompurify
pnpm add -D @types/dompurify
```

## 5. 依赖关系图

```txt
项目初始化
  -> Deck schema / validator
    -> demoDeck
      -> deck store / operations
        -> JSON slide canvas 渲染
          -> 三栏编辑器 UI
            -> slide 切换
            -> 元素选择
            -> 文本与样式编辑
            -> 拖动元素
              -> 保存 JSON
              -> 导出 HTML
                -> 受约束 HTML 导入
                  -> 回归测试与验收
```

## 6. 阶段划分

### Phase 0：项目初始化

目标：让项目能启动、能测试、目录清楚。

### Phase 1：数据模型和渲染核心

目标：先让 JSON deck 能被校验、渲染、导出。

### Phase 2：编辑器基本界面

目标：完成三栏 UI、slide 切换、当前页渲染。

### Phase 3：元素编辑能力

目标：完成选择、文本编辑、样式编辑、拖动。

### Phase 4：保存与导出

目标：保存 JSON、导出单文件 HTML。

### Phase 5：受约束 HTML 导入

目标：导入符合规范的 HTML 并转回 JSON。

### Phase 6：验收和清理

目标：完成自动化测试、手动验收、文档补充。

## 7. 具体任务

## Task 1：初始化 Next.js + TypeScript 项目

**Description:**
在当前工作区根目录建立可运行的 Next.js / React / TypeScript 项目。保留已有 `docs/`，不要新建嵌套项目目录。

**Acceptance criteria:**

- [ ] 根目录存在 `package.json`、`tsconfig.json`、`next.config.ts`。
- [ ] 存在 `src/app/page.tsx` 和 `src/app/layout.tsx`。
- [ ] `pnpm dev` 可以启动本地页面。
- [ ] `.gitignore` 覆盖 `node_modules/`、`.next/`、`coverage/`、临时导出文件。

**Verification:**

- [ ] 运行 `pnpm install`。
- [ ] 运行 `pnpm dev`。
- [ ] 浏览器打开本地地址能看到占位页面。

**Dependencies:** None

**Files likely touched:**

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `.gitignore`
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`

**Estimated scope:** Medium

## Task 2：建立基础样式和三栏布局壳

**Description:**
实现编辑器基础页面结构：左侧 slide 列表，中间画布区域，右侧属性面板。此阶段只放占位内容。

**Acceptance criteria:**

- [ ] 页面分为左、中、右三栏。
- [ ] 左侧固定宽度，右侧固定宽度，中间自适应。
- [ ] 中间区域有 16:9 画布容器占位。
- [ ] 页面高度为视口高度，不出现无意义整页滚动。

**Verification:**

- [ ] 运行 `pnpm dev` 后手动查看布局。
- [ ] 调整浏览器宽度，三栏不重叠。

**Dependencies:** Task 1

**Files likely touched:**

- `src/app/page.tsx`
- `src/components/editor/AppShell.tsx`
- `src/components/editor/SlideNavigator.tsx`
- `src/components/editor/SlideViewport.tsx`
- `src/components/editor/PropertyPanel.tsx`
- `src/styles/editor.css`

**Estimated scope:** Medium

## Task 3：定义 Deck schema 和 TypeScript 类型

**Description:**
定义 MVP 所需的 Deck、Slide、Element 类型，并用 Zod 做运行时校验。先支持 `text`、`image`、`shape` 三类元素。

**Acceptance criteria:**

- [ ] `Deck` 包含 `version`、`id`、`title`、`size`、`theme`、`slides`。
- [ ] `Slide` 包含 `id`、`background`、`elements`。
- [ ] `Element` 支持 `text`、`image`、`shape`。
- [ ] Zod schema 能校验合法 demo deck，能拒绝缺少关键字段的数据。

**Verification:**

- [ ] 添加并运行 `schema.test.ts`。
- [ ] `pnpm test` 通过。

**Dependencies:** Task 1

**Files likely touched:**

- `src/core/schema/deck.ts`
- `src/core/schema/validators.ts`
- `tests/schema.test.ts`

**Estimated scope:** Small

## Task 4：创建 demoDeck

**Description:**
创建 3 页本地 demo deck，覆盖标题文本、正文文本、图片、基础形状和不同背景。

**Acceptance criteria:**

- [ ] demo deck 至少 3 页。
- [ ] 每页至少 2 个元素。
- [ ] 至少包含一个图片元素。
- [ ] demo deck 通过 Zod 校验。

**Verification:**

- [ ] `schema.test.ts` 引入 `demoDeck` 并校验通过。

**Dependencies:** Task 3

**Files likely touched:**

- `src/data/demoDeck.ts`
- `public/demo-assets/`
- `tests/schema.test.ts`

**Estimated scope:** Small

## Task 5：实现 deck store 和基础 operations

**Description:**
用 Zustand 建立编辑器状态，封装 slide 切换、元素选择、元素更新等基础操作。

**Acceptance criteria:**

- [ ] store 持有 `deck`、`currentSlideId`、`selectedElementId`。
- [ ] 支持 `selectSlide`、`selectElement`、`updateElement`。
- [ ] `updateElement` 不直接改原对象，保持不可变更新。

**Verification:**

- [ ] 添加 `deckOperations` 单元测试，验证更新元素不会影响其他 slide。
- [ ] 手动查看页面状态能响应当前 slide 变化。

**Dependencies:** Task 3, Task 4

**Files likely touched:**

- `src/store/useDeckStore.ts`
- `src/core/ops/deckOperations.ts`
- `tests/deckOperations.test.ts`

**Estimated scope:** Medium

## Task 6：实现 JSON -> React canvas 渲染

**Description:**
先不使用 iframe，直接在 React 中把当前 slide 的 JSON 渲染为 16:9 DOM canvas。每个元素输出 `data-element-id`，为后续选择和拖动做基础。

**Acceptance criteria:**

- [ ] 当前 slide 背景正确显示。
- [ ] text 元素按 `x/y/w/h/style/content` 显示。
- [ ] image 元素按 `src/x/y/w/h` 显示。
- [ ] shape 元素至少支持矩形。
- [ ] 元素使用绝对定位，坐标基于 1600x900 设计稿。

**Verification:**

- [ ] 手动查看 demoDeck 三页都能正常渲染。
- [ ] 浏览器缩放时画布等比缩放，元素位置不漂移。

**Dependencies:** Task 5

**Files likely touched:**

- `src/components/editor/SlideCanvas.tsx`
- `src/components/editor/ElementRenderer.tsx`
- `src/components/editor/SlideViewport.tsx`
- `src/styles/editor.css`

**Estimated scope:** Medium

## Task 7：实现左侧 slide 缩略图和切换

**Description:**
左侧展示所有 slide 的缩略图。MVP 可复用同一套 `SlideCanvas` 缩小渲染，不做截图。

**Acceptance criteria:**

- [ ] 左侧显示所有 slide。
- [ ] 当前 slide 有明确选中态。
- [ ] 点击缩略图切换当前页。
- [ ] 缩略图不触发元素编辑操作。

**Verification:**

- [ ] 手动点击 3 页缩略图，中央画布同步切换。

**Dependencies:** Task 6

**Files likely touched:**

- `src/components/editor/SlideNavigator.tsx`
- `src/components/editor/SlideCanvas.tsx`
- `src/styles/editor.css`

**Estimated scope:** Small

## Task 8：实现元素点击选择

**Description:**
点击画布中的元素，更新 `selectedElementId`，并显示选择框。点击空白区域取消选择。

**Acceptance criteria:**

- [ ] 点击元素可以选中。
- [ ] 选中元素显示边框。
- [ ] 点击空白区域取消选择。
- [ ] 左侧缩略图中的元素不可被选中。

**Verification:**

- [ ] 手动选择 text、image、shape 元素。
- [ ] 切换 slide 后选中态合理清空或切到当前 slide 的有效元素。

**Dependencies:** Task 6, Task 7

**Files likely touched:**

- `src/components/editor/SlideCanvas.tsx`
- `src/components/editor/SelectionFrame.tsx`
- `src/store/useDeckStore.ts`

**Estimated scope:** Small

## Task 9：实现右侧属性面板基础编辑

**Description:**
右侧属性面板根据选中元素类型显示可编辑字段。MVP 先支持文本内容、字号、颜色、背景。

**Acceptance criteria:**

- [ ] 未选中元素时显示空状态。
- [ ] 选中文本元素时可编辑 `content`、`fontSize`、`color`、`background`。
- [ ] 修改后中央画布实时更新。
- [ ] 非文本元素至少可编辑背景或填充色。

**Verification:**

- [ ] 手动修改标题文本，画布实时变化。
- [ ] 手动修改字号、颜色、背景，画布实时变化。

**Dependencies:** Task 8

**Files likely touched:**

- `src/components/editor/PropertyPanel.tsx`
- `src/core/ops/deckOperations.ts`
- `src/store/useDeckStore.ts`

**Estimated scope:** Medium

## Task 10：实现元素拖动

**Description:**
先实现 pointer-based 拖动，拖动结束后更新元素 `x/y`。坐标需要按当前画布缩放比例反算回 1600x900 设计坐标。

**Acceptance criteria:**

- [ ] 选中元素后可以拖动。
- [ ] 拖动过程中元素跟随指针。
- [ ] 拖动结束后 JSON 中的 `x/y` 更新。
- [ ] 拖动不会让元素因缩放比例产生明显偏移。

**Verification:**

- [ ] 手动拖动文本、图片、形状。
- [ ] 切换 slide 再切回来，元素位置保持。

**Dependencies:** Task 8

**Files likely touched:**

- `src/components/editor/SlideCanvas.tsx`
- `src/components/editor/SelectionFrame.tsx`
- `src/core/ops/deckOperations.ts`
- `src/store/useDeckStore.ts`

**Estimated scope:** Medium

## Task 11：保存 JSON

**Description:**
实现“保存 JSON”按钮，将当前 deck 下载为格式化 JSON 文件。

**Acceptance criteria:**

- [ ] 工具栏存在保存 JSON 按钮。
- [ ] 点击后下载 `deck.json`。
- [ ] 下载内容包含用户当前修改。
- [ ] 下载内容可再次通过 schema 校验。

**Verification:**

- [ ] 修改一个文本和一个位置后下载 JSON。
- [ ] 检查文件中对应字段已更新。

**Dependencies:** Task 9, Task 10

**Files likely touched:**

- `src/components/editor/Toolbar.tsx`
- `src/core/export/downloadJson.ts`
- `src/components/editor/AppShell.tsx`

**Estimated scope:** Small

## Task 12：实现 JSON -> 单文件 HTML renderer

**Description:**
实现确定性的 HTML 导出函数。导出的 HTML 应包含所有 slide 和元素，内联 CSS，并保留 `window.__DECK_JSON__` 方便再次导入。

**Acceptance criteria:**

- [ ] `renderDeckHtml(deck)` 返回完整 HTML 字符串。
- [ ] HTML 包含 `data-deck`、`data-slide`、`data-element`。
- [ ] HTML 中内联基础 CSS。
- [ ] HTML 中包含 `window.__DECK_JSON__`。
- [ ] 特殊字符被正确转义，避免破坏 HTML。

**Verification:**

- [ ] 添加 `renderDeckHtml.test.ts`。
- [ ] 手动把导出的 HTML 保存后用浏览器打开，能看到 slides。

**Dependencies:** Task 3, Task 4

**Files likely touched:**

- `src/core/render/renderDeckHtml.ts`
- `tests/renderDeckHtml.test.ts`

**Estimated scope:** Medium

## Task 13：导出单文件 HTML

**Description:**
把 `renderDeckHtml(deck)` 接到工具栏按钮，用户点击后下载 `.html` 文件。

**Acceptance criteria:**

- [ ] 工具栏存在导出 HTML 按钮。
- [ ] 点击后下载 HTML 文件。
- [ ] 下载文件能独立打开。
- [ ] 修改后的文本、颜色、位置都反映在导出 HTML 中。

**Verification:**

- [ ] 手动修改 demo deck。
- [ ] 导出 HTML。
- [ ] 浏览器打开导出文件确认视觉和当前编辑器一致。

**Dependencies:** Task 11, Task 12

**Files likely touched:**

- `src/components/editor/Toolbar.tsx`
- `src/core/export/downloadHtml.ts`
- `src/components/editor/AppShell.tsx`

**Estimated scope:** Small

## Task 14：实现受约束 HTML 导入

**Description:**
实现 `parseConstrainedHtml(html)`，读取符合规范的 HTML，转换为 `Deck`。优先支持本项目导出的 HTML 和手写的受约束 HTML。

**Acceptance criteria:**

- [ ] 能读取 `window.__DECK_JSON__` 并直接恢复 deck。
- [ ] 如果没有 `window.__DECK_JSON__`，能解析 `[data-deck]`、`[data-slide]`、`[data-element]`。
- [ ] 能解析 text、image、shape 基础元素。
- [ ] 不符合规范时返回明确错误。

**Verification:**

- [ ] 添加 `parseConstrainedHtml.test.ts`。
- [ ] 用本项目导出的 HTML 再导入，JSON 结构基本一致。

**Dependencies:** Task 12

**Files likely touched:**

- `src/core/import/parseConstrainedHtml.ts`
- `tests/parseConstrainedHtml.test.ts`

**Estimated scope:** Medium

## Task 15：添加导入 HTML UI

**Description:**
在工具栏添加导入 HTML 按钮，用户选择本地 HTML 文件后解析并替换当前 deck。

**Acceptance criteria:**

- [ ] 工具栏存在导入 HTML 按钮。
- [ ] 选择合法 HTML 后当前 deck 替换成功。
- [ ] 选择非法 HTML 时显示错误，不破坏当前 deck。
- [ ] 导入后可继续编辑、保存 JSON、导出 HTML。

**Verification:**

- [ ] 导出当前 HTML。
- [ ] 刷新页面。
- [ ] 导入刚才的 HTML。
- [ ] 确认内容恢复并可继续编辑。

**Dependencies:** Task 14

**Files likely touched:**

- `src/components/editor/Toolbar.tsx`
- `src/store/useDeckStore.ts`
- `src/components/editor/AppShell.tsx`

**Estimated scope:** Medium

## Task 16：补充基础历史记录

**Description:**
实现轻量 undo/redo。MVP 可以存 deck 快照，不必一开始实现精细 operation history。快照数量限制为 50。

**Acceptance criteria:**

- [ ] 修改文本后可以撤销和重做。
- [ ] 拖动元素后可以撤销和重做。
- [ ] 切换 slide 不进入历史记录。
- [ ] 历史记录最多保留 50 步。

**Verification:**

- [ ] 手动修改文本、拖动元素，测试撤销重做。

**Dependencies:** Task 9, Task 10

**Files likely touched:**

- `src/core/ops/history.ts`
- `src/store/useDeckStore.ts`
- `src/components/editor/Toolbar.tsx`

**Estimated scope:** Medium

## Task 17：MVP 验收测试与清理

**Description:**
按验收标准完整走一遍，从启动到编辑、保存、导出、导入，修复明显问题并清理工作区。

**Acceptance criteria:**

- [ ] 所有自动化测试通过。
- [ ] `pnpm build` 通过。
- [ ] MVP 验收标准全部满足。
- [ ] 工作区没有临时导出文件、截图、无用样例散落在根目录。

**Verification:**

- [ ] 运行 `pnpm test`。
- [ ] 运行 `pnpm build`。
- [ ] 手动执行完整 MVP 流程。
- [ ] 检查 `git status`，确认只有预期源码、文档和配置变化。

**Dependencies:** Task 1-16

**Files likely touched:**

- 视问题而定。

**Estimated scope:** Medium

## 8. 检查点

### Checkpoint A：项目可运行

完成 Task 1-2 后检查：

- [ ] `pnpm dev` 可启动。
- [ ] 三栏布局可见。
- [ ] 工作区结构清楚。

### Checkpoint B：数据和渲染打通

完成 Task 3-7 后检查：

- [ ] demoDeck 通过 schema 校验。
- [ ] 当前 slide 能渲染。
- [ ] 缩略图能切页。

### Checkpoint C：人工编辑可用

完成 Task 8-10 后检查：

- [ ] 可以选择元素。
- [ ] 可以编辑文本和基础样式。
- [ ] 可以拖动元素。

### Checkpoint D：保存与导出可用

完成 Task 11-13 后检查：

- [ ] 能下载 JSON。
- [ ] 能导出单文件 HTML。
- [ ] 导出的 HTML 能独立打开。

### Checkpoint E：导入闭环

完成 Task 14-15 后检查：

- [ ] 本项目导出的 HTML 能再次导入。
- [ ] 导入后仍可编辑和导出。

### Checkpoint F：MVP 完成

完成 Task 16-17 后检查：

- [ ] undo/redo 可用。
- [ ] 测试通过。
- [ ] build 通过。
- [ ] 验收标准全部完成。

## 9. 不进入 MVP 的内容

- 任意 HTML 高保真结构化导入。
- Slidev / reveal.js / Marp 全量解析。
- PPTX 导入。
- PPTX 可编辑导出。
- 字体嵌入。
- 视频、音频、iframe 媒体编辑。
- 动画时间轴。
- 母版和主题系统。
- AI 对话和模型接入。
- 协同编辑。
- 云端保存。

## 10. 为下一步实现预留的接口

### Agent 生成规范

后续可新增：

```txt
docs/constrained-html-spec.md
docs/deck-json-schema.md
examples/demo-deck.json
examples/demo-deck.html
```

但 MVP 第一轮不急着做这些文件，避免文档多于代码。等 schema 稳定后再补。

### AI operations

后续 AI 不直接修改 HTML，而是调用 operations：

```ts
type DeckOperation =
  | { type: "updateElement"; slideId: string; elementId: string; patch: Partial<SlideElement> }
  | { type: "addElement"; slideId: string; element: SlideElement }
  | { type: "deleteElement"; slideId: string; elementId: string }
  | { type: "duplicateElement"; slideId: string; elementId: string };
```

MVP 中的 `deckOperations.ts` 应按这个方向设计，便于后续接入 AI。

### PPTX 导出

后续可以从 JSON 映射到 PptxGenJS：

- text -> `slide.addText`
- image -> `slide.addImage`
- shape -> `slide.addShape`
- complex html -> 截图作为图片

MVP 不实现，但 schema 中应避免使用完全无法映射的表达。

## 11. 风险和处理方式

| 风险 | 影响 | 处理 |
| --- | --- | --- |
| 一开始追求任意 HTML 导入 | 实现失控，MVP 延期 | 只支持受约束 HTML 和本项目导出 HTML |
| iframe 编辑坐标复杂 | 选择和拖动不稳定 | MVP 先用 React DOM canvas，iframe 预览后置 |
| 过早引入富文本 | schema 和 UI 膨胀 | MVP 文本框只支持纯文本和基础样式 |
| 过早做 PPTX | 转换细节拖慢主线 | 只预留 schema 映射，不实现 |
| 导出 HTML 与编辑器视觉不一致 | 用户不信任工具 | 共用同一套 renderer 或共享样式常量 |
| 文件散乱 | 后续难维护 | 所有文档进 `docs/`，源码进 `src/`，资源进 `public/` |

## 12. 第一轮实现建议

第一轮实现只做到 Checkpoint C：

1. 初始化项目。
2. 三栏布局。
3. schema + demoDeck。
4. React DOM canvas 渲染。
5. slide 切换。
6. 元素选择。
7. 属性面板编辑。
8. 元素拖动。

完成后再做保存和导出。这样可以尽早验证最关键的问题：这个结构是否真的能提供类似 PPT 的人工编辑体验。

## 13. 完成后的最低可演示流程

1. 运行 `pnpm dev`。
2. 打开本地页面。
3. 左侧点击第 2 页。
4. 中间点击标题。
5. 右侧修改标题文本、字号、颜色。
6. 拖动标题到新位置。
7. 点击保存 JSON。
8. 点击导出 HTML。
9. 打开导出的 HTML，确认视觉结果一致。

这个流程跑通后，MVP 的主链路成立。
