# 下一轮迭代目标计划书：实用性与易用性增强

日期：2026-06-16

关联文档：

- `docs/ai-html-slides-editor-research.md`
- `docs/mvp-implementation-roadmap.md`
- `docs/refinement-system-roadmap.md`
- `docs/next-iteration-intelligent-expansion.md`

## 1. 当前状态

项目已经完成第三轮基础画布能力的第一批建设：

- 支持多选。
- 支持框选。
- 支持多元素整体移动和缩放。
- 支持 flat `groupId` 组合 / 取消组合。
- 支持点击组内元素后整组选中。
- 支持基础文本、图片、形状、背景、样式编辑。
- 支持保存 JSON、导入受约束 HTML、导出单文件 HTML。

当前短板不再是“能不能编辑”，而是“能不能顺手地持续编辑一整套 slides”。下一轮要优先解决日常使用中最频繁、最影响效率的问题。

## 2. 本轮定位

本轮定位：

> 把编辑器从“基础可编辑”推进到“个人日常可用”：用户可以更快找到元素、更快复制和调整内容、更少依赖右侧表单，并能更可靠地保存、打开和导出自己的项目。

本轮不追求大而全，不做 AI，不做桌面 EXE，不做复杂模板市场。重点是让现有编辑链路更完整、更顺手。

## 3. 设计原则

- 常用操作优先：删除、复制、粘贴、微调、锁定、隐藏、调层级，要比新奇功能优先。
- 可见状态优先：用户需要知道当前选中了什么、哪些元素被锁定、哪些隐藏、导出是否有问题。
- 本地可靠优先：保存、打开、导出要比复杂媒体和动画更早稳定。
- 小步提交：每个功能都要能单独测试、单独提交、单独回退。
- 不接 AI：继续保持纯本地人工编辑工具路线。

## 4. 本轮不做

- AI API 接入。
- 自然语言编辑。
- 云端素材库。
- 协同编辑。
- 完整 PPTX 导入导出。
- 复杂动画时间轴。
- EXE 打包。
- 嵌套 group。
- 在线账号、登录、权限系统。

## 5. 本轮核心目标

### 目标 1：让复杂页面更容易管理

需要实现：

- 图层面板。
- 元素名称显示和重命名。
- 锁定 / 解锁。
- 隐藏 / 显示。
- 层级上移 / 下移 / 置顶 / 置底。
- 点击图层选中元素或整组。

验收标准：

- 用户能通过图层面板找到任意元素。
- 锁定元素不能被画布拖动、缩放、删除。
- 隐藏元素不出现在画布，但仍能在图层面板中恢复。
- 图层顺序调整后，画布显示层级和导出 HTML 一致。

### 目标 2：补齐基础编辑效率

需要实现：

- Delete 删除。
- Ctrl/Cmd + C 复制。
- Ctrl/Cmd + V 粘贴。
- Ctrl/Cmd + D 快速复制并偏移。
- Arrow 微调位置。
- Shift + Arrow 大步移动。
- Ctrl/Cmd + G 组合。
- Ctrl/Cmd + Shift + G 取消组合。
- Esc 取消选择。
- 右键菜单：复制、删除、组合、取消组合、置顶、置底、锁定。

验收标准：

- 常见编辑操作不需要频繁移动鼠标到工具栏。
- 复制粘贴后的元素保持样式和大小，并自动选中新副本。
- 多选元素复制粘贴后仍保持相对位置。
- 快捷键不影响正在编辑文本时的输入。

### 目标 3：让用户能从零创建内容

需要实现：

- 左侧面板 tab 化：Pages / Elements / Assets。
- Elements 面板插入基础元素：标题、正文、图片占位、矩形、圆形、线条、标签、卡片。
- 插入后自动选中。
- 新元素默认样式可用，不需要用户立刻调大量参数。
- 页面操作：新建空白页、复制当前页、删除当前页。

验收标准：

- 用户可以从空白 deck 创建基本页面。
- 插入元素的位置合理，不遮挡当前主要内容。
- 页面复制后元素 id 不冲突。
- 删除页面时至少保留一页。

### 目标 4：强化本地项目保存和恢复

需要实现：

- 打开本地 JSON。
- 保存当前 deck 为 JSON。
- 增加本地草稿自动保存，存入 `localStorage`。
- 启动时如存在草稿，提示恢复。
- 显示当前保存状态：未保存 / 已保存 / 有草稿。

验收标准：

- 浏览器刷新后，用户不必立刻丢失编辑内容。
- JSON 保存后重新打开，页面、元素、组合、样式保持一致。
- 草稿恢复不覆盖用户主动导入的文件。
- 选择状态不写入 deck 文件。

### 目标 5：提升导出可靠性

需要实现：

- 导出前检查面板。
- 检查文本溢出。
- 检查隐藏元素数量。
- 检查外链图片或空图片。
- 检查 Data URL 资源体积过大。
- 检查字体可能缺失。
- 导出 HTML 前显示问题列表和严重级别。

验收标准：

- 导出前用户知道哪些问题会影响展示。
- 严重问题可阻止导出或要求二次确认。
- 导出 HTML 后重新导入，主要结构保持一致。

### 目标 6：补齐画布舒适度

需要实现：

- 页面缩放控制：缩小、放大、适应窗口、100%。
- 画布居中和滚动体验优化。
- 对齐参考线。
- 吸附到画布中心、边缘、其他元素边缘。
- Alt 临时关闭吸附。
- 顶部状态栏显示当前缩放、选中数量、画布尺寸。

验收标准：

- 大屏和小屏都能稳定编辑。
- 拖动元素时能靠参考线快速对齐。
- 缩放不会导致选择框和鼠标位置错位。

## 6. 推荐优先级

### Phase A：实用编辑闭环

本阶段优先级最高。

- 图层面板。
- 锁定 / 隐藏。
- 删除、复制、粘贴、快速复制。
- 键盘微调。
- 页面复制 / 删除。

原因：

- 这些是日常编辑频率最高的能力。
- 做完后，用户可以真正开始维护一套多页 slides。

### Phase B：创建内容入口

- 左侧 tab 面板。
- Elements 插入基础元素。
- 新建空白页。
- 图片占位元素。
- 基础卡片 preset。

原因：

- 当前工具更偏“编辑已有内容”，本阶段让它具备从零创建内容的能力。

### Phase C：本地项目可靠性

- 打开 JSON。
- 保存 JSON。
- 自动草稿。
- 恢复草稿提示。
- 保存状态提示。

原因：

- 个人可部署工具必须先保证不会轻易丢内容。
- 这也是未来桌面 EXE 的基础。

### Phase D：导出前检查和舒适度

- 导出检查面板。
- 文本溢出检测汇总。
- 资源体积提示。
- 缩放控制。
- 参考线和吸附。

原因：

- 这些能力直接影响最终交付质量。
- 可以减少“导出后才发现问题”的反复。

## 7. 数据结构调整建议

### Element 增强字段

```ts
type BaseElement = {
  id: string;
  name?: string;
  groupId?: string;
  locked?: boolean;
  hidden?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  zIndex?: number;
};
```

说明：

- `name` 用于图层面板显示和用户重命名。
- `hidden` 用于图层隐藏，不删除数据。
- `locked` 已有，下一轮需要让所有编辑操作统一尊重它。

### ClipboardState

运行态，不写入 `deck.json`。

```ts
type ClipboardState = {
  elements: SlideElement[];
  sourceSlideId: string;
};
```

### DraftMetadata

可以存在 localStorage，不一定写入正式 deck。

```ts
type DraftMetadata = {
  deckId: string;
  title: string;
  savedAt: string;
  slideCount: number;
};
```

### ExportIssue

```ts
type ExportIssue = {
  id: string;
  level: "error" | "warning" | "info";
  slideId: string;
  elementId?: string;
  message: string;
  fixHint?: string;
};
```

## 8. 任务拆分

### Task 1：实现图层面板基础版

**Description:** 在右侧属性面板旁或左侧新增 Layers 面板，显示当前 slide 的元素列表。

**Acceptance criteria:**

- [ ] 显示当前 slide 所有元素。
- [ ] 显示元素类型、名称、锁定状态、隐藏状态。
- [ ] 点击图层可选中元素。
- [ ] 组内元素在列表中有视觉归属。

**Verification:**

- [ ] 单元测试图层排序函数。
- [ ] 浏览器验证点击图层选中元素。
- [ ] `pnpm test`。

**Dependencies:** 已完成多选和 groupId。

**Estimated scope:** Medium。

### Task 2：实现锁定和隐藏

**Description:** 图层面板支持锁定 / 解锁、隐藏 / 显示。

**Acceptance criteria:**

- [ ] 锁定元素不能被画布拖动、缩放、删除。
- [ ] 隐藏元素不显示在画布。
- [ ] 隐藏元素仍显示在图层面板。
- [ ] 导出 HTML 不渲染隐藏元素，或明确按配置决定是否导出隐藏元素。

**Verification:**

- [ ] 单元测试 locked / hidden 过滤规则。
- [ ] 浏览器验证锁定和隐藏行为。
- [ ] 导出 HTML 检查隐藏元素处理。

**Dependencies:** Task 1。

**Estimated scope:** Medium。

### Task 3：实现删除和复制粘贴

**Description:** 支持删除当前选中元素、复制选中元素、粘贴为新元素。

**Acceptance criteria:**

- [ ] Delete 删除选中元素。
- [ ] Ctrl/Cmd + C 复制选中元素。
- [ ] Ctrl/Cmd + V 粘贴元素，并自动选中新元素。
- [ ] Ctrl/Cmd + D 快速复制并偏移。
- [ ] 多选复制粘贴保持相对位置。
- [ ] group 复制后生成新的 groupId。

**Verification:**

- [ ] 单元测试 duplicate operations。
- [ ] 浏览器验证单选、多选、组复制。
- [ ] `pnpm test`。

**Dependencies:** Task 1 可并行，基础选择状态已完成。

**Estimated scope:** Medium。

### Task 4：实现键盘微调和基础快捷键

**Description:** 补齐常用快捷键，提高排版效率。

**Acceptance criteria:**

- [ ] Arrow 微调 1px。
- [ ] Shift + Arrow 微调 10px。
- [ ] Esc 清空选择。
- [ ] Ctrl/Cmd + G 组合。
- [ ] Ctrl/Cmd + Shift + G 取消组合。
- [ ] 文本编辑输入时不触发画布快捷键。

**Verification:**

- [ ] 浏览器验证快捷键。
- [ ] 单元测试快捷键处理函数。

**Dependencies:** Task 3 可并行。

**Estimated scope:** Small。

### Task 5：实现页面复制、删除和新建

**Description:** 让用户能管理 slide 页面，而不是只能编辑已有页面。

**Acceptance criteria:**

- [ ] 可新建空白页。
- [ ] 可复制当前页。
- [ ] 可删除当前页。
- [ ] 删除时至少保留一页。
- [ ] 复制页后 slide id 和 element id 不冲突。

**Verification:**

- [ ] 单元测试 page operations。
- [ ] 浏览器验证左侧缩略图更新。

**Dependencies:** None。

**Estimated scope:** Medium。

### Task 6：左侧面板 tab 化

**Description:** 把左侧从单一 Pages 列表升级为 Pages / Elements / Assets。

**Acceptance criteria:**

- [ ] Pages tab 保留缩略图列表。
- [ ] Elements tab 显示基础元素。
- [ ] Assets tab 预留图片资源列表。
- [ ] tab 切换不影响当前选择。

**Verification:**

- [ ] 浏览器验证 tab 切换和页面切换。

**Dependencies:** Task 5。

**Estimated scope:** Medium。

### Task 7：实现基础元素插入

**Description:** 从 Elements 面板插入常用元素。

**Acceptance criteria:**

- [ ] 可插入标题。
- [ ] 可插入正文。
- [ ] 可插入矩形、圆形、线条。
- [ ] 可插入图片占位。
- [ ] 可插入卡片 preset。
- [ ] 插入后自动选中。

**Verification:**

- [ ] 单元测试 addElement operation。
- [ ] 浏览器验证插入后可编辑。

**Dependencies:** Task 6。

**Estimated scope:** Medium。

### Task 8：实现打开 JSON

**Description:** 在工具栏支持导入本项目保存的 `deck.json`。

**Acceptance criteria:**

- [ ] 可选择 `.json` 文件。
- [ ] schema 校验失败时显示错误。
- [ ] 打开成功后更新当前 deck。
- [ ] selection/history 重置。

**Verification:**

- [ ] 单元测试 parse/load JSON。
- [ ] 浏览器验证保存后再打开。

**Dependencies:** None。

**Estimated scope:** Small。

### Task 9：实现本地草稿自动保存

**Description:** 编辑过程中自动保存到 localStorage，并支持恢复。

**Acceptance criteria:**

- [ ] deck 变更后自动写入 localStorage。
- [ ] 启动时检测草稿。
- [ ] 用户可选择恢复或忽略。
- [ ] 导入新文件时不被旧草稿覆盖。

**Verification:**

- [ ] 单元测试 draft storage 工具。
- [ ] 浏览器刷新后验证恢复提示。

**Dependencies:** Task 8。

**Estimated scope:** Medium。

### Task 10：实现导出前检查

**Description:** 导出 HTML 前展示问题列表。

**Acceptance criteria:**

- [ ] 检查文本溢出。
- [ ] 检查空图片或外链图片。
- [ ] 检查隐藏元素数量。
- [ ] 检查资源体积。
- [ ] 用户可继续导出或取消。

**Verification:**

- [ ] 单元测试 export issue collectors。
- [ ] 浏览器验证导出前弹窗。

**Dependencies:** Task 2、Task 8。

**Estimated scope:** Medium。

### Task 11：实现缩放控制

**Description:** 在画布区域加入缩放 UI 和适应窗口。

**Acceptance criteria:**

- [ ] 支持放大、缩小。
- [ ] 支持 100%。
- [ ] 支持适应窗口。
- [ ] 显示当前缩放比例。
- [ ] 选择框、拖动、框选在缩放下仍准确。

**Verification:**

- [ ] 浏览器验证不同缩放比例下选择和拖动。

**Dependencies:** 已完成基础画布坐标缩放。

**Estimated scope:** Medium。

### Task 12：实现右键菜单

**Description:** 在画布元素上提供常用操作右键菜单。

**Acceptance criteria:**

- [ ] 右键元素显示菜单。
- [ ] 支持复制、删除、组合、取消组合、置顶、置底、锁定。
- [ ] 点击空白处关闭菜单。
- [ ] 菜单不超出视口。

**Verification:**

- [ ] 浏览器验证右键菜单各项操作。

**Dependencies:** Task 2、Task 3、Task 4。

**Estimated scope:** Medium。

### Task 13：实现基础对齐和吸附

**Description:** 拖动时提供参考线和吸附。

**Acceptance criteria:**

- [ ] 吸附到画布中心线。
- [ ] 吸附到画布边缘。
- [ ] 吸附到其他元素边缘和中心。
- [ ] 显示参考线。
- [ ] Alt 临时关闭吸附。

**Verification:**

- [ ] 单元测试 snap 计算。
- [ ] 浏览器验证拖动手感。

**Dependencies:** Task 11。

**Estimated scope:** Medium。

## 9. 推荐开发顺序

推荐下一轮按以下顺序推进：

1. Task 1：图层面板基础版。
2. Task 2：锁定和隐藏。
3. Task 3：删除和复制粘贴。
4. Task 4：键盘微调和基础快捷键。
5. Task 5：页面复制、删除和新建。
6. Task 6：左侧面板 tab 化。
7. Task 7：基础元素插入。
8. Task 8：打开 JSON。
9. Task 9：本地草稿自动保存。
10. Task 10：导出前检查。
11. Task 11：缩放控制。
12. Task 12：右键菜单。
13. Task 13：对齐和吸附。

第一批建议只做 Task 1-4。完成后，编辑器的日常操作效率会明显提升。

## 10. 分阶段验收

### Checkpoint A：编辑效率

- [ ] 图层面板可用。
- [ ] 锁定 / 隐藏可用。
- [ ] 删除 / 复制 / 粘贴可用。
- [ ] 基础快捷键可用。
- [ ] `pnpm test` 通过。
- [ ] `pnpm build` 通过。

### Checkpoint B：创建能力

- [ ] 可新建、复制、删除页面。
- [ ] 左侧面板 tab 可用。
- [ ] 可插入基础元素。
- [ ] 插入元素可继续编辑。

### Checkpoint C：本地可靠性

- [ ] 可打开 JSON。
- [ ] 自动草稿可恢复。
- [ ] 保存状态可见。
- [ ] 导出前检查可用。

### Checkpoint D：舒适度

- [ ] 缩放控制可用。
- [ ] 右键菜单可用。
- [ ] 对齐参考线和吸附可用。

## 11. 风险和处理

| 风险 | 影响 | 处理 |
| --- | --- | --- |
| 快捷键影响文本输入 | 文本编辑体验变差 | 统一判断 activeElement，输入框内不触发画布快捷键 |
| 图层面板和画布状态不同步 | 用户误操作 | 所有选择状态仍走统一 store |
| 复制组时 id 冲突 | 数据损坏或导出异常 | 复制时统一生成新 element id 和 groupId |
| localStorage 草稿覆盖用户文件 | 数据丢失 | 导入文件时只提示，不自动覆盖 |
| 隐藏元素导出策略不清 | 导出结果不符合预期 | 本轮明确隐藏元素默认不导出，后续再加选项 |
| 右键菜单功能过多 | UI 复杂 | 只放最高频操作，其他操作放图层面板或属性面板 |

## 12. 下一步建议

下一步先实现 Task 1-4：

- 图层面板。
- 锁定 / 隐藏。
- 删除 / 复制 / 粘贴。
- 键盘微调和组合快捷键。

这四项完成后，工具会从“能编辑”进一步变成“顺手编辑”。之后再做页面管理、元素插入和本地项目可靠性。
