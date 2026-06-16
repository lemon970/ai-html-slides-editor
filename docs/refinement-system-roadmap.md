# 第二阶段精细化系统实现计划

日期：2026-06-16

当前状态：已实现第二阶段核心闭环，包括对象 resize / rotate、文本精细样式、背景编辑、图片替换、基础图层对齐、HTML 导出导入一致性和浏览器主流程验收。

关联文档：

- `docs/ai-html-slides-editor-research.md`
- `docs/mvp-implementation-roadmap.md`

## 1. 阶段目标

第二阶段目标不是继续堆零散控件，而是把 MVP 从“能编辑”推进到“可精细编辑、可稳定导出、可继续扩展”的编辑系统。

最终体验参考 Canva / 可画：左侧管理页面与素材，中间进行直接操控，右侧或上下文面板做精细属性编辑。第二阶段不复刻完整 Canva，而是先搭出它最关键的编辑底座：对象级 transform、背景编辑、图片替换、字体排版、图层对齐和导出一致性。

本阶段完成后，编辑器应具备：

- 文本框可调整大小，文字不再因为固定高度被遮挡。
- 元素具备统一的选择、拖动、缩放、旋转基础设施。
- slide 背景支持纯色、渐变、图片。
- 属性面板支持更完整的字体、字号、行高、字重、对齐、间距、边框、阴影等样式。
- 图片、文本、形状和背景的编辑能力走同一套 schema / operation / renderer。
- 导出的 HTML 与编辑器视觉保持一致。
- 导入本项目导出的 HTML 后，精细样式能回到 JSON。

## 2. 当前实现限制

基于当前源码，主要限制如下：

- `SlideCanvas.tsx` 只有 pointer drag，没有 resize / rotate 控制点。
- `PropertyPanel.tsx` 只支持文本内容、字号、颜色、背景，缺少字体族、字重、行高、对齐、宽高、边框、阴影、透明度等。
- `deck.ts` 的 `Slide.background` 目前只支持 `{ type: "solid", color }`，不能表达背景图。
- `renderDeckHtml.ts` 只渲染纯色 slide 背景，不能稳定导出背景图和更复杂样式。
- 文本元素使用固定 `w/h`，且当前 UI 无法调整 `h`，文字较多时会被裁切。
- `parseConstrainedHtml.ts` 只做基础样式回读，后续需要跟随 schema 扩展。

## 3. 实现原则

- 先扩 schema，再扩 operations，再扩 UI，最后扩 import/export。
- 所有用户编辑都写回 JSON，不直接把 DOM 当数据源。
- 不把第二阶段做成“全部 PPT 功能”；本阶段只解决精细编辑基础能力。
- 优先实现受控能力，不承诺任意 HTML 的反向解析。
- 每个任务都要有测试或浏览器验收，不只看静态页面。
- 尽量复用现有文件结构，不新增无关目录。

## 4. 第二阶段推荐目录调整

保留现有结构，新增少量 focused 模块：

```txt
src/
  components/
    editor/
      controls/
        TransformBox.tsx
        ResizeHandle.tsx
        RotationHandle.tsx
      inspectors/
        LayoutSection.tsx
        TextSection.tsx
        FillSection.tsx
        BorderSection.tsx
        ShadowSection.tsx
        BackgroundSection.tsx
  core/
    geometry/
      bounds.ts
      transform.ts
    style/
      css.ts
      fonts.ts
    assets/
      imageDataUrl.ts
    ops/
      slideOperations.ts
```

说明：

- `controls/` 放画布控制点。
- `inspectors/` 放右侧属性面板分区。
- `geometry/` 放坐标换算、resize 计算、旋转计算。
- `style/` 放 JSON 样式到 CSS 的转换。
- `assets/` 放图片导入、Data URL 转换等工具。
- `slideOperations.ts` 放 slide 背景修改等操作。

## 5. 数据结构升级

### 5.1 Slide background

把当前 `background` 从只支持纯色扩展为 discriminated union：

```ts
type SlideBackground =
  | { type: "solid"; color: string }
  | { type: "gradient"; from: string; to: string; angle: number }
  | {
      type: "image";
      src: string;
      fit: "cover" | "contain" | "fill";
      position: "center" | "top" | "bottom" | "left" | "right";
      overlay?: string;
    };
```

MVP 数据仍兼容 `{ type: "solid", color }`。

### 5.2 Element layout

元素 layout 继续使用 `x/y/w/h/rotation`，第二阶段新增：

```ts
type ElementLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  zIndex?: number;
  minW?: number;
  minH?: number;
};
```

`minW/minH` 可选，用于避免文本框被缩到不可用。

### 5.3 Text style

扩展文本样式：

```ts
type TextStyle = {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | "normal" | "bold";
  fontStyle?: "normal" | "italic";
  color?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  verticalAlign?: "top" | "middle" | "bottom";
  background?: string;
  padding?: number;
  borderRadius?: number;
  shadow?: string;
  overflow?: "visible" | "hidden" | "fit";
};
```

本阶段默认 `overflow: "fit"`：文本内容变化时可自动提示或调整高度，避免静默遮挡。

## 6. 阶段划分

### Phase 1：Schema 与渲染基础

目标：让 JSON 能表达第二阶段需要的精细样式。

### Phase 2：统一 Transform 系统

目标：用一个可复用控制层处理选择、拖动、缩放、旋转。

### Phase 3：文本框精细编辑

目标：解决文本遮挡，补齐字体和排版控件。

### Phase 4：背景图与资产编辑

目标：支持 slide 背景图、图片替换、Data URL 导入。

### Phase 5：导入导出一致性

目标：HTML 导出和再导入保持主要样式一致。

### Phase 6：验收、回归和文档

目标：完成测试、浏览器验收和第二阶段文档同步。

## 7. 具体任务

## Task 1：升级 schema 并保持旧 demo 兼容

**Description:** 扩展 `deck.ts` 中的 background、layout、text style、image style、shape style schema。保持现有 demoDeck 不需要大改即可通过校验。

**Acceptance criteria:**

- [ ] `Slide.background` 支持 solid、gradient、image。
- [ ] 文本样式支持 fontFamily、fontSize、fontWeight、fontStyle、lineHeight、letterSpacing、textAlign、verticalAlign、padding、shadow、overflow。
- [ ] 元素 layout 支持 minW、minH。
- [ ] 旧 demoDeck 校验通过。

**Verification:**

- [ ] `pnpm test` 通过。
- [ ] 新增 schema 测试覆盖背景图和文本扩展样式。

**Dependencies:** None

**Files likely touched:**

- `src/core/schema/deck.ts`
- `tests/schema.test.ts`

**Estimated scope:** Small

## Task 2：抽出样式到 CSS 转换工具

**Description:** 当前编辑器渲染和 HTML 导出分别拼样式，后续容易不一致。新增 `style/css.ts`，统一将 JSON style 转为 React style 和 HTML style string。

**Acceptance criteria:**

- [ ] 文本、图片、形状、背景的 CSS 转换有独立函数。
- [ ] `ElementRenderer.tsx` 和 `renderDeckHtml.ts` 不再各自重复拼同一批样式。
- [ ] 特殊字符和空值处理稳定。

**Verification:**

- [ ] 新增 `css.test.ts`。
- [ ] `renderDeckHtml.test.ts` 继续通过。

**Dependencies:** Task 1

**Files likely touched:**

- `src/core/style/css.ts`
- `src/components/editor/ElementRenderer.tsx`
- `src/core/render/renderDeckHtml.ts`
- `tests/css.test.ts`
- `tests/renderDeckHtml.test.ts`

**Estimated scope:** Medium

## Task 3：建立几何计算工具

**Description:** 把坐标缩放、拖动、resize、rotation 计算从组件中抽出，避免后续控制点逻辑堆在 `SlideCanvas.tsx`。

**Acceptance criteria:**

- [ ] `bounds.ts` 支持计算元素边界、限制最小尺寸、限制画布范围。
- [ ] `transform.ts` 支持从 pointer delta 计算 move/resize/rotate 结果。
- [ ] 所有计算基于 1600x900 设计坐标，不依赖 DOM 缩放。

**Verification:**

- [ ] 新增几何单元测试。
- [ ] 覆盖不同缩放比例下的拖动和 resize。

**Dependencies:** Task 1

**Files likely touched:**

- `src/core/geometry/bounds.ts`
- `src/core/geometry/transform.ts`
- `tests/geometry.test.ts`

**Estimated scope:** Medium

## Task 4：重构 SlideCanvas 的交互状态

**Description:** 把当前单一 drag state 改成通用 transform state，支持 move、resize、rotate 三种模式。

**Acceptance criteria:**

- [ ] `SlideCanvas.tsx` 不直接保存大量拖拽细节。
- [ ] 支持 `interactionMode: "move" | "resize" | "rotate"`。
- [ ] move 行为不回退。
- [ ] 缩略图仍不可编辑。

**Verification:**

- [ ] 浏览器手动验证拖动仍可用。
- [ ] `pnpm test` 和 `pnpm build` 通过。

**Dependencies:** Task 3

**Files likely touched:**

- `src/components/editor/SlideCanvas.tsx`
- `src/components/editor/ElementRenderer.tsx`
- `src/core/geometry/transform.ts`

**Estimated scope:** Medium

## Task 5：实现 TransformBox 和 resize handles

**Description:** 新增选中框控制层，提供 8 个缩放控制点。文本、图片、形状都通过同一套控制点调整 `w/h`。

**Acceptance criteria:**

- [ ] 选中元素显示外框和 8 个 resize handles。
- [ ] 拖动角点可同时调整宽高。
- [ ] 拖动边点可单独调整宽或高。
- [ ] resize 后 JSON 中 `w/h/x/y` 正确更新。
- [ ] 文本框 resize 后文字不再被固定高度遮挡。

**Verification:**

- [ ] 浏览器手动验证 text、image、shape resize。
- [ ] 切换 slide 后位置和尺寸保持。
- [ ] 导出 HTML 后尺寸一致。

**Dependencies:** Task 4

**Files likely touched:**

- `src/components/editor/controls/TransformBox.tsx`
- `src/components/editor/controls/ResizeHandle.tsx`
- `src/components/editor/SlideCanvas.tsx`
- `src/styles/editor.css`

**Estimated scope:** Medium

## Task 6：实现文本溢出检测和一键适配

**Description:** 文本内容超过元素高度时，UI 要明确提示，并提供“适应内容高度”按钮。不要静默裁切。

**Acceptance criteria:**

- [ ] 选中文本元素时能检测 `scrollHeight > clientHeight`。
- [ ] 属性面板显示文本溢出提示。
- [ ] 点击“适应内容高度”后更新元素 `h`。
- [ ] 可选择 `overflow: visible | hidden | fit`。

**Verification:**

- [ ] 手动输入长文本，看到溢出提示。
- [ ] 点击适配高度，文字完整显示。

**Dependencies:** Task 5

**Files likely touched:**

- `src/components/editor/SlideCanvas.tsx`
- `src/components/editor/PropertyPanel.tsx`
- `src/core/ops/deckOperations.ts`

**Estimated scope:** Medium

## Task 7：拆分属性面板为 Inspector Sections

**Description:** 当前 `PropertyPanel.tsx` 会随着控件增加迅速膨胀。拆成多个 section，按元素类型组合。

**Acceptance criteria:**

- [ ] `PropertyPanel.tsx` 只负责查找选中对象和组合 section。
- [ ] `LayoutSection` 管理 x/y/w/h/rotation/opacity。
- [ ] `TextSection` 管理字体和文本排版。
- [ ] `FillSection` 管理填充、背景色。
- [ ] `BorderSection` 管理边框和圆角。
- [ ] `ShadowSection` 管理阴影。

**Verification:**

- [ ] 手动选择不同元素，面板显示对应 section。
- [ ] 修改各 section 控件后画布实时更新。

**Dependencies:** Task 1, Task 5

**Files likely touched:**

- `src/components/editor/PropertyPanel.tsx`
- `src/components/editor/inspectors/LayoutSection.tsx`
- `src/components/editor/inspectors/TextSection.tsx`
- `src/components/editor/inspectors/FillSection.tsx`
- `src/components/editor/inspectors/BorderSection.tsx`
- `src/components/editor/inspectors/ShadowSection.tsx`

**Estimated scope:** Medium

## Task 8：补齐字体和排版控件

**Description:** 给文本元素增加字体族、字号、字重、斜体、行高、字距、对齐、内边距等控件。

**Acceptance criteria:**

- [ ] 可选择字体族。
- [ ] 可输入字号。
- [ ] 可选择 normal / bold / 100-900 字重。
- [ ] 可切换 italic。
- [ ] 可调整 lineHeight、letterSpacing、padding。
- [ ] 可切换 left / center / right / justify。

**Verification:**

- [ ] 浏览器手动验证每项样式变化。
- [ ] 导出 HTML 后样式存在。
- [ ] 再导入后主要样式能恢复。

**Dependencies:** Task 7

**Files likely touched:**

- `src/components/editor/inspectors/TextSection.tsx`
- `src/core/style/fonts.ts`
- `src/core/render/renderDeckHtml.ts`
- `src/core/import/parseConstrainedHtml.ts`

**Estimated scope:** Medium

## Task 9：实现 slide 背景编辑 section

**Description:** 未选中元素时，属性面板显示当前 slide 属性，支持编辑背景色、背景渐变和背景图。

**Acceptance criteria:**

- [ ] 未选中元素时显示 slide 属性，而不是只显示空状态。
- [ ] 可切换背景类型：solid / gradient / image。
- [ ] solid 可改颜色。
- [ ] gradient 可改 from/to/angle。
- [ ] image 可输入图片 URL 或选择本地图片。
- [ ] 背景图支持 cover / contain / fill。

**Verification:**

- [ ] 手动设置背景图，画布立即更新。
- [ ] 保存 JSON 后包含背景图配置。
- [ ] 导出 HTML 后背景图显示。

**Dependencies:** Task 1, Task 7

**Files likely touched:**

- `src/components/editor/PropertyPanel.tsx`
- `src/components/editor/inspectors/BackgroundSection.tsx`
- `src/core/ops/slideOperations.ts`
- `src/store/useDeckStore.ts`
- `src/components/editor/SlideCanvas.tsx`

**Estimated scope:** Medium

## Task 10：实现本地图片导入为 Data URL

**Description:** 背景图和图片元素都需要支持本地文件选择。MVP 可以把图片转成 Data URL，保证导出的单文件 HTML 可独立打开。

**Acceptance criteria:**

- [ ] 图片元素可选择本地文件替换。
- [ ] slide 背景图可选择本地文件。
- [ ] 图片被转换为 Data URL 并写入 JSON。
- [ ] 文件类型限制为常见图片格式。
- [ ] 大文件给出提示，避免 JSON 过大但不强行中断。

**Verification:**

- [ ] 手动替换图片元素。
- [ ] 手动设置背景图。
- [ ] 导出 HTML 后离线打开仍显示图片。

**Dependencies:** Task 9

**Files likely touched:**

- `src/core/assets/imageDataUrl.ts`
- `src/components/editor/inspectors/BackgroundSection.tsx`
- `src/components/editor/inspectors/FillSection.tsx`
- `src/components/editor/PropertyPanel.tsx`

**Estimated scope:** Medium

## Task 11：扩展 HTML 导出 renderer

**Description:** 导出 HTML 必须覆盖第二阶段新增能力，包括背景图、渐变、字体、文本排版、边框、阴影、opacity、rotation、resize 后尺寸。

**Acceptance criteria:**

- [ ] slide 背景 solid / gradient / image 都能导出。
- [ ] 文本新增样式全部进入 HTML。
- [ ] 图片元素 objectFit、圆角、阴影保持。
- [ ] shape 边框、圆角、阴影保持。
- [ ] 导出的 `window.__DECK_JSON__` 包含完整 JSON。

**Verification:**

- [ ] `renderDeckHtml.test.ts` 覆盖新增样式。
- [ ] 浏览器打开导出 HTML，视觉与编辑器一致。

**Dependencies:** Task 2, Task 8, Task 9

**Files likely touched:**

- `src/core/render/renderDeckHtml.ts`
- `src/core/style/css.ts`
- `tests/renderDeckHtml.test.ts`

**Estimated scope:** Medium

## Task 12：扩展受约束 HTML 导入

**Description:** 本项目导出的 HTML 应能尽量恢复第二阶段样式。优先读取 `window.__DECK_JSON__`，无 JSON 时再解析 DOM style。

**Acceptance criteria:**

- [ ] 带 `window.__DECK_JSON__` 的导出 HTML 可完整恢复。
- [ ] 无 JSON 的受约束 HTML 可解析背景 solid / image。
- [ ] 可解析文本基础样式。
- [ ] 解析失败时错误信息明确，不破坏当前 deck。

**Verification:**

- [ ] `parseConstrainedHtml.test.ts` 覆盖背景图和文本样式。
- [ ] 手动导出再导入，主要视觉不丢失。

**Dependencies:** Task 11

**Files likely touched:**

- `src/core/import/parseConstrainedHtml.ts`
- `tests/parseConstrainedHtml.test.ts`

**Estimated scope:** Medium

## Task 13：完善 undo / redo 粒度

**Description:** resize、背景编辑、图片替换、文本样式编辑都要进入历史记录，但拖动过程中的中间态不要刷爆历史。

**Acceptance criteria:**

- [ ] resize 结束后记录一次历史。
- [ ] move 结束后记录一次历史。
- [ ] 文本输入可按 debounce 或 blur 合并历史。
- [ ] 背景图替换可撤销。
- [ ] 样式修改可撤销。

**Verification:**

- [ ] 手动测试 move、resize、文本、背景图、样式的撤销重做。

**Dependencies:** Task 5, Task 9, Task 10

**Files likely touched:**

- `src/store/useDeckStore.ts`
- `src/core/ops/history.ts`
- `src/core/ops/deckOperations.ts`
- `src/core/ops/slideOperations.ts`

**Estimated scope:** Medium

## Task 14：增加对齐和图层基础能力

**Description:** 精细编辑需要基本的图层和对齐能力。本阶段先做按钮级能力，不做复杂参考线。

**Acceptance criteria:**

- [ ] 可将元素置顶、置底、上移一层、下移一层。
- [ ] 可水平居中、垂直居中到 slide。
- [ ] 可左对齐、右对齐、顶对齐、底对齐到 slide。
- [ ] 操作进入历史记录。

**Verification:**

- [ ] 手动选择元素测试图层变化。
- [ ] 导出 HTML 后 zIndex 顺序正确。

**Dependencies:** Task 5, Task 7

**Files likely touched:**

- `src/components/editor/Toolbar.tsx`
- `src/components/editor/inspectors/LayoutSection.tsx`
- `src/core/ops/deckOperations.ts`

**Estimated scope:** Medium

## Task 15：浏览器验收脚本和手动验收清单

**Description:** 第二阶段交互更复杂，需要固定验收流程。可先不引入完整 E2E 框架，但要有清单和必要的 Playwright 手动步骤记录。

**Acceptance criteria:**

- [ ] 文档中列出第二阶段验收流程。
- [ ] 至少覆盖 resize、背景图、字体、导出、再导入。
- [ ] 控制台无业务错误。
- [ ] 生产 build 通过。

**Verification:**

- [ ] `pnpm test`
- [ ] `pnpm exec tsc --noEmit`
- [ ] `pnpm build`
- [ ] 浏览器手动验收通过。

**Dependencies:** Task 1-14

**Files likely touched:**

- `docs/refinement-system-roadmap.md`
- `README.md`
- 可选：`tests/`

**Estimated scope:** Small

## 8. 检查点

### Checkpoint A：Schema 与 renderer 可扩展

完成 Task 1-3 后检查：

- [ ] 新 schema 能表达背景图和更完整文本样式。
- [ ] 样式转换工具存在。
- [ ] 几何计算工具测试通过。

### Checkpoint B：Transform 基础可用

完成 Task 4-6 后检查：

- [ ] 拖动没有回退。
- [ ] resize 可用。
- [ ] 文本溢出可检测和修复。

### Checkpoint C：精细属性面板可用

完成 Task 7-10 后检查：

- [ ] 面板已分 section。
- [ ] 文本细节样式可编辑。
- [ ] slide 背景图可编辑。
- [ ] 本地图片可导入。

### Checkpoint D：导入导出闭环

完成 Task 11-13 后检查：

- [ ] 导出 HTML 与编辑器视觉一致。
- [ ] 导出 HTML 再导入后主要结构和样式保留。
- [ ] undo / redo 覆盖新增操作。

### Checkpoint E：第二阶段完成

完成 Task 14-15 后检查：

- [ ] 图层和对齐基础能力可用。
- [ ] 自动化测试通过。
- [ ] 生产构建通过。
- [ ] 浏览器验收通过。

## 9. 不进入第二阶段的内容

- 任意 HTML 高保真导入。
- PPTX 导入 / 导出。
- 动画时间轴。
- 多元素框选和组合。
- 协同编辑。
- 云端资产库。
- 字体文件内嵌管理。
- AI 对话接入。
- 复杂参考线和智能吸附系统。

这些可以进入第三阶段。第二阶段先把“单元素精细编辑”和“slide 背景编辑”做稳。

## 10. 第二阶段验收流程

最低演示流程：

1. 启动 `pnpm dev`。
2. 打开 demo deck。
3. 选择第一页标题文本。
4. 拖动 resize handle，把文本框高度变大。
5. 输入更长文本，确认文字不被遮挡。
6. 修改字体族、字号、字重、行高、对齐。
7. 点击空白处，进入 slide 属性。
8. 设置背景图，并切换 cover / contain。
9. 选择图片元素，替换为本地图片。
10. 导出 HTML。
11. 浏览器打开导出的 HTML，确认视觉一致。
12. 回到编辑器，导入刚才的 HTML。
13. 确认背景、文本样式、元素尺寸仍保留。
14. 测试 undo / redo。

## 11. 推荐实施顺序

推荐第一轮只做到 Checkpoint B：

1. Schema 升级。
2. CSS 转换工具。
3. 几何工具。
4. Transform state 重构。
5. Resize handles。
6. 文本溢出检测和适配。

原因：用户当前最影响使用的问题是文本框尺寸和遮挡。先把 transform 基础设施做稳，后面的背景图、字体细节、导出导入才不会继续堆临时逻辑。

第二轮做 Checkpoint C 和 D：

1. 属性面板拆分。
2. 字体排版控件。
3. 背景图编辑。
4. 本地图片 Data URL。
5. HTML 导出导入扩展。

第三轮做 Checkpoint E：

1. 图层和对齐基础能力。
2. 全量验收。
3. README 和 roadmap 状态更新。

## 12. 风险与处理

| 风险 | 影响 | 处理 |
| --- | --- | --- |
| resize 和 drag 逻辑耦合 | 后续旋转、缩放难维护 | 先抽 `geometry/transform.ts` |
| 文本自动适配高度导致布局跳动 | 用户难以精细控制 | 默认提示溢出，用户点击后适配 |
| 背景图 Data URL 过大 | JSON 和 HTML 文件膨胀 | 大文件提示，后续再做资产管理 |
| 属性面板继续膨胀 | 后续功能难加 | 先拆 section |
| 导出和编辑器视觉不一致 | 用户无法信任结果 | 抽统一 CSS 转换工具 |
| 导入解析过度承诺 | 实现失控 | 优先恢复 `window.__DECK_JSON__` |

## 13. 完成定义

第二阶段完成必须同时满足：

- 文本框可 resize，长文本不再被不可见裁切。
- slide 背景图可编辑。
- 字体和排版细节可编辑。
- HTML 导出包含第二阶段新增样式。
- 导出 HTML 可再次导入。
- undo / redo 覆盖新增编辑动作。
- `pnpm test`、`pnpm exec tsc --noEmit`、`pnpm build` 全部通过。
- 浏览器手动验收清单通过。
