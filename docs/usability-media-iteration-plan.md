# 新一轮迭代计划书：编辑逻辑收口与媒体能力增强

日期：2026-06-16

关联文档：

- `docs/editor-gap-backlog.md`
- `docs/practical-usability-iteration-plan.md`
- `docs/refinement-system-roadmap.md`
- `docs/next-iteration-intelligent-expansion.md`

## 1. 本轮定位

本轮目标：

> 把现有编辑能力从“功能可用”整理成“逻辑一致、容易扩展、能维护一整套 slides 的工具”，并引入媒体资源库第一版。

本轮不以增加大量视觉效果为主，而是优先补三类能力：

- 操作逻辑收口：工具栏、快捷键、图层面板、画布浮动操作条、后续右键菜单都走统一 command。
- 编辑体验补全：右键菜单、层级调整、页面管理。
- 内容能力扩展：媒体资源库第一版，支持图片复用和替换。

## 2. 当前问题

当前项目已经能编辑元素，但功能入口开始分散：

- 删除、复制、粘贴、隐藏、锁定、组合等逻辑分散在 store、toolbar、keyboard、canvas、layers 中。
- 右键菜单还没有完整实现，很多高频操作只能通过工具栏、快捷键或浮动条完成。
- 图层面板能选择、隐藏、锁定，但不能调整层级、重命名、拖拽排序。
- 页面管理能力不足，用户不能新建、复制、删除和排序页面。
- 图片导入已经可用，但缺少媒体资源库，无法在多页复用。
- 资源、页面和命令没有清晰边界，后续功能继续增加会让 store 和组件变大。

## 3. 设计原则

- 先收口，再扩展：先统一 command，再挂接右键、图层和快捷键。
- 每个任务可单独验证：每个 task 都要能测试、构建、手动验证。
- 不引入 AI：本轮仍然是纯本地人工编辑工具。
- 不做复杂素材市场：媒体资源库先解决本地图片复用，不做云端资源。
- 不做复杂动画：动画、播放模式、PPTX 后置。
- 不破坏现有 schema：新增字段尽量向后兼容。

## 4. 本轮不做

- AI 接入。
- EXE 打包。
- PPTX 导入 / 导出。
- 云端素材库。
- 多人协作。
- 富文本局部样式。
- 视频 / 音频完整编辑。
- 复杂动画时间轴。
- 模板市场。
- 自动枚举全部本机字体。

## 5. 推荐技术方向

### 5.1 Command 层

新增统一命令层，例如：

```ts
type EditorCommand =
  | { type: "delete-elements"; elementIds: string[] }
  | { type: "duplicate-elements"; elementIds: string[] }
  | { type: "toggle-hidden"; elementIds: string[] }
  | { type: "toggle-locked"; elementIds: string[] }
  | { type: "bring-forward"; elementIds: string[] }
  | { type: "send-backward"; elementIds: string[] }
  | { type: "add-slide" }
  | { type: "duplicate-slide"; slideId: string }
  | { type: "delete-slide"; slideId: string }
  | { type: "add-asset"; file: File }
  | { type: "insert-asset"; assetId: string };
```

命令层负责：

- 统一更新 deck。
- 统一写入 history。
- 统一更新 selection。
- 统一处理 locked / hidden 规则。
- 统一生成 id。
- 统一供 toolbar、keyboard、context menu、layers 调用。

### 5.2 Page operations

新增页面操作模块，避免页面管理逻辑直接写进 store：

- `addSlide`
- `duplicateSlide`
- `deleteSlide`
- `renameSlide`
- `moveSlide`

### 5.3 Layer operations

新增图层操作模块：

- `bringToFront`
- `sendToBack`
- `bringForward`
- `sendBackward`
- `renameElement`
- `setElementZIndex`

### 5.4 Asset manager

新增资产数据结构，先服务图片：

```ts
type DeckAsset = {
  id: string;
  type: "image";
  name: string;
  src: string;
  mimeType?: string;
  width?: number;
  height?: number;
  createdAt?: string;
};
```

图片元素可以继续直接存 `src`，但新导入图片同时进入 `deck.assets`。后续可逐步改成 `assetId + src fallback`。

## 6. 数据结构建议

### Deck 增强

```ts
type Deck = {
  version: "0.1";
  id: string;
  title: string;
  size: DeckSize;
  theme: Theme;
  slides: Slide[];
  assets?: DeckAsset[];
  metadata?: DeckMetadata;
};
```

### Slide 增强

```ts
type Slide = {
  id: string;
  name?: string;
  background: SlideBackground;
  elements: SlideElement[];
  notes?: string;
};
```

当前 `name` 已存在，可以直接用于页面重命名。

### Element 增强

当前已经有：

- `name`
- `locked`
- `hidden`
- `groupId`
- `zIndex`

本轮继续使用这些字段，不新增复杂嵌套 group。

### ImageElement 增强

```ts
type ImageElement = {
  type: "image";
  src: string;
  assetId?: string;
  objectFit?: "cover" | "contain" | "fill";
  objectPosition?: "center" | "top" | "bottom" | "left" | "right";
};
```

`assetId` 可选，保证旧 JSON 仍能打开。

## 7. MVP 范围

本轮建议完成以下内容：

1. Command 层第一版。
2. 右键菜单第一版。
3. 图层层级管理。
4. 页面管理第一版。
5. 媒体资源库第一版。
6. 图片替换和复用。
7. 必要测试和文档更新。

## 8. 任务拆分

### Task 1：Command 层第一版

**Description:** 新增统一命令执行层，把已有删除、复制、粘贴、隐藏、锁定、组合、取消组合、微调等操作迁移到统一入口。

**Acceptance criteria:**

- [ ] toolbar、keyboard、floating action bar 调用同一套 command。
- [ ] command 内统一处理 history。
- [ ] command 内统一处理 selection。
- [ ] locked 元素不会被删除、移动、缩放或批量修改。
- [ ] 现有用户行为保持不变。

**Verification:**

- [ ] 单元测试 command reducer / executor。
- [ ] `pnpm test`。
- [ ] `pnpm build`。
- [ ] 浏览器验证删除、复制、隐藏、锁定、组合、取消组合。

**Dependencies:** None。

**Files likely touched:**

- `src/core/commands/editorCommands.ts`
- `src/store/useDeckStore.ts`
- `src/components/editor/AppShell.tsx`
- `src/components/editor/Toolbar.tsx`
- `src/components/editor/SlideCanvas.tsx`
- `tests/editorCommands.test.ts`

**Estimated scope:** Medium。

### Task 2：Layer operations

**Description:** 新增图层层级操作，支持置顶、置底、上移一层、下移一层，并保证画布和导出 HTML 的显示顺序一致。

**Acceptance criteria:**

- [ ] 单个元素可置顶 / 置底。
- [ ] 单个元素可上移一层 / 下移一层。
- [ ] 多选元素可批量调整层级。
- [ ] 层级调整后图层面板顺序同步。
- [ ] 导出 HTML 的 `z-index` 正确。

**Verification:**

- [ ] 单元测试 layer operations。
- [ ] `pnpm test`。
- [ ] 浏览器验证元素遮挡顺序变化。
- [ ] 导出 HTML 后检查 `z-index`。

**Dependencies:** Task 1。

**Files likely touched:**

- `src/core/ops/layerOperations.ts`
- `src/core/commands/editorCommands.ts`
- `src/components/editor/LayersPanel.tsx`
- `src/core/render/renderDeckHtml.ts`
- `tests/layerOperations.test.ts`

**Estimated scope:** Medium。

### Task 3：右键菜单第一版

**Description:** 在画布和图层面板加入右键菜单，承载高频编辑操作。

**Acceptance criteria:**

- [ ] 右键元素显示元素菜单。
- [ ] 右键空白画布显示画布菜单。
- [ ] 菜单支持复制、删除、锁定、隐藏、置顶、置底、上移、下移。
- [ ] 多选时菜单作用于选中元素。
- [ ] 点击空白处或按 Esc 关闭菜单。
- [ ] 菜单不会超出视口。

**Verification:**

- [ ] 浏览器验证画布右键。
- [ ] 浏览器验证图层右键。
- [ ] `pnpm test`。
- [ ] `pnpm build`。

**Dependencies:** Task 1、Task 2。

**Files likely touched:**

- `src/components/editor/ContextMenu.tsx`
- `src/components/editor/SlideCanvas.tsx`
- `src/components/editor/LayersPanel.tsx`
- `src/store/useDeckStore.ts`
- `src/styles/editor.css`

**Estimated scope:** Medium。

### Task 4：图层面板增强

**Description:** 增强图层面板，让用户能在复杂页面中稳定管理元素。

**Acceptance criteria:**

- [ ] 图层可重命名。
- [ ] 图层显示 zIndex。
- [ ] 图层按钮支持置顶、置底、上移、下移。
- [ ] 支持多选图层后组合。
- [ ] 隐藏元素可以从图层中恢复。
- [ ] 锁定元素仍可在图层中解锁。

**Verification:**

- [ ] 浏览器验证重命名。
- [ ] 浏览器验证层级调整。
- [ ] 浏览器验证隐藏恢复、锁定恢复。
- [ ] `pnpm test`。

**Dependencies:** Task 2。

**Files likely touched:**

- `src/components/editor/LayersPanel.tsx`
- `src/core/ops/layerOperations.ts`
- `src/core/commands/editorCommands.ts`
- `src/styles/editor.css`

**Estimated scope:** Medium。

### Task 5：Page operations

**Description:** 新增页面操作模块，支持新建、复制、删除、重命名和排序。

**Acceptance criteria:**

- [ ] 可新建空白页。
- [ ] 可复制当前页。
- [ ] 可删除当前页。
- [ ] 删除时至少保留一页。
- [ ] 可重命名页面。
- [ ] 页面复制后 slide id 和 element id 不冲突。
- [ ] 页面顺序变化后左侧缩略图和导出 HTML 顺序一致。

**Verification:**

- [ ] 单元测试 page operations。
- [ ] 浏览器验证新建、复制、删除、重命名。
- [ ] `pnpm test`。
- [ ] `pnpm build`。

**Dependencies:** Task 1。

**Files likely touched:**

- `src/core/ops/pageOperations.ts`
- `src/core/commands/editorCommands.ts`
- `src/components/editor/SlideNavigator.tsx`
- `src/store/useDeckStore.ts`
- `tests/pageOperations.test.ts`

**Estimated scope:** Medium。

### Task 6：左侧面板 tab 化

**Description:** 把左侧从单一页面缩略图升级为 Pages / Elements / Media 三个 tab。

**Acceptance criteria:**

- [ ] Pages tab 保留现有缩略图。
- [ ] Elements tab 显示标题、正文、矩形、圆形、线条、图片占位。
- [ ] Media tab 显示已导入图片资源。
- [ ] tab 切换不影响当前选中元素。
- [ ] 面板全部中文化。

**Verification:**

- [ ] 浏览器验证 tab 切换。
- [ ] 浏览器验证当前页选择不丢失。
- [ ] `pnpm build`。

**Dependencies:** Task 5、Task 7。

**Files likely touched:**

- `src/components/editor/LeftSidebar.tsx`
- `src/components/editor/SlideNavigator.tsx`
- `src/components/editor/ElementsPanel.tsx`
- `src/components/editor/MediaPanel.tsx`
- `src/styles/editor.css`

**Estimated scope:** Medium。

### Task 7：媒体资源库第一版

**Description:** 将导入图片从“直接创建元素”升级为“进入资源库，并可插入当前页”。

**Acceptance criteria:**

- [ ] `deck.assets` 可保存图片资源。
- [ ] 导入图片后显示在 Media 面板。
- [ ] 可从 Media 面板插入图片到当前页。
- [ ] 同一图片可插入到多页。
- [ ] 图片元素可保留 `assetId`。
- [ ] 保存 JSON 后资源仍可恢复。

**Verification:**

- [ ] 单元测试 asset operations。
- [ ] 浏览器验证导入图片、插入图片、切页后再次插入。
- [ ] 保存 JSON 后检查 assets 字段。
- [ ] `pnpm test`。
- [ ] `pnpm build`。

**Dependencies:** Task 6。

**Files likely touched:**

- `src/core/ops/assetOperations.ts`
- `src/core/schema/deck.ts`
- `src/core/commands/editorCommands.ts`
- `src/components/editor/MediaPanel.tsx`
- `src/store/useDeckStore.ts`
- `tests/assetOperations.test.ts`

**Estimated scope:** Medium。

### Task 8：图片复用与替换

**Description:** 让资源库图片可以替换当前选中图片，并保留原图片元素的位置、尺寸和样式。

**Acceptance criteria:**

- [ ] 选中图片元素时，可从 Media 面板执行“替换图片”。
- [ ] 替换后保留 x/y/w/h/rotation/zIndex/style。
- [ ] 替换后更新 src 和 assetId。
- [ ] 非图片元素不能执行替换。
- [ ] 图片适应方式继续可编辑。

**Verification:**

- [ ] 单元测试 replace image operation。
- [ ] 浏览器验证替换图片。
- [ ] `pnpm test`。
- [ ] `pnpm build`。

**Dependencies:** Task 7。

**Files likely touched:**

- `src/core/ops/assetOperations.ts`
- `src/core/commands/editorCommands.ts`
- `src/components/editor/MediaPanel.tsx`
- `src/components/editor/inspectors/FillSection.tsx`
- `tests/assetOperations.test.ts`

**Estimated scope:** Small-Medium。

### Task 9：基础元素插入

**Description:** 从 Elements 面板插入常用基础元素，让用户能从空白页开始搭建内容。

**Acceptance criteria:**

- [ ] 可插入标题。
- [ ] 可插入正文。
- [ ] 可插入矩形。
- [ ] 可插入圆形。
- [ ] 可插入线条。
- [ ] 可插入图片占位。
- [ ] 插入后自动选中。
- [ ] 新元素默认样式合理。

**Verification:**

- [ ] 单元测试 add element operation。
- [ ] 浏览器验证每种元素可插入、可编辑、可导出。
- [ ] `pnpm test`。
- [ ] `pnpm build`。

**Dependencies:** Task 6。

**Files likely touched:**

- `src/core/ops/elementFactory.ts`
- `src/core/commands/editorCommands.ts`
- `src/components/editor/ElementsPanel.tsx`
- `tests/elementFactory.test.ts`

**Estimated scope:** Medium。

## 9. 推荐开发顺序

建议按以下顺序实施：

1. Task 1：Command 层第一版。
2. Task 2：Layer operations。
3. Task 3：右键菜单第一版。
4. Task 4：图层面板增强。
5. Task 5：Page operations。
6. Task 6：左侧面板 tab 化。
7. Task 7：媒体资源库第一版。
8. Task 8：图片复用与替换。
9. Task 9：基础元素插入。

第一批建议只做 Task 1-4。完成后，现有功能入口会明显统一，复杂页面编辑会更顺手。

第二批再做 Task 5-9，进入页面管理、媒体资源和内容创建。

## 10. 分阶段验收

### Checkpoint A：编辑逻辑收口

- [ ] Command 层可用。
- [ ] 现有 toolbar / keyboard / floating action bar 行为不变。
- [ ] 删除、复制、隐藏、锁定、组合等操作有统一测试。
- [ ] `pnpm test` 通过。
- [ ] `pnpm build` 通过。

### Checkpoint B：右键与图层

- [ ] 右键菜单可用。
- [ ] 图层可重命名。
- [ ] 图层可调整层级。
- [ ] 画布显示顺序、图层顺序、导出 HTML 顺序一致。

### Checkpoint C：页面管理

- [ ] 可新建、复制、删除页面。
- [ ] 可重命名页面。
- [ ] 页面顺序可调整。
- [ ] 页面复制后 id 不冲突。

### Checkpoint D：媒体和创建

- [ ] 左侧面板 tab 可用。
- [ ] 媒体资源库可用。
- [ ] 图片可复用、可替换。
- [ ] 基础元素可插入。
- [ ] 保存 JSON 后资源和元素能恢复。

## 11. 风险和处理

| 风险 | 影响 | 处理 |
| --- | --- | --- |
| Command 层改动影响现有功能 | 快捷键、工具栏行为回退 | 先迁移一个命令并测试，再逐步迁移 |
| Store 继续膨胀 | 后续维护困难 | command、page、layer、asset 分模块 |
| zIndex 调整规则混乱 | 画布和导出不一致 | 所有层级操作只改 zIndex，并单测排序 |
| 右键菜单与浏览器默认菜单冲突 | 操作不稳定 | 只在画布和图层区域 preventDefault |
| 页面复制 id 冲突 | JSON 损坏 | page operations 中统一生成 slide id 和 element id |
| assets 导致 JSON 变大 | 保存文件过大 | 本轮先接受 Data URL，后续桌面版再做资源文件夹 |
| 图片 assetId 和 src 双轨 | 数据同步复杂 | 本轮明确 `src` 是渲染主路径，`assetId` 是复用引用 |
| 左侧面板 tab 改动影响缩略图 | 页面切换回退 | 保留 SlideNavigator 内部逻辑，外层包 tab |

## 12. 本轮完成后的状态

完成本轮后，项目应具备：

- 一套统一的编辑命令入口。
- 完整右键菜单。
- 更可控的图层层级管理。
- 基础页面管理能力。
- 媒体资源库第一版。
- 图片资源复用和替换能力。
- 从空白页插入基础内容的入口。

此时工具会从“能编辑 AI 生成的 HTML slides”进一步接近“个人可长期使用的本地演示文稿编辑器”。

## 13. 后续延伸

本轮之后再考虑：

- 打开 JSON 和自动草稿。
- 导出前检查。
- 对齐、分布、参考线、吸附。
- PNG / PDF 导出。
- 播放模式。
- 基础动画字段。
- 桌面 EXE 技术选型。

