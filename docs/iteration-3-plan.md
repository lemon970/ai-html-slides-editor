# 第三轮迭代计划：让编辑器真正可用

日期：2026-06-17  
分支基准：`codex/practical-usability-task-1-4`（commit `2e5419b`）

---

## 一、本轮目标

补齐两个让编辑器"看起来像工具、用起来像玩具"的根本缺陷，同时收拾上一轮遗留的 UI 密度问题：

1. **文本画布内联编辑** — 双击文本元素直接在画布上编辑，不再依赖属性面板
2. **幻灯片 CRUD** — 可新建、删除、复制、排序幻灯片
3. **图层面板行密度精简** — 操作按钮改为 hover 时才显示

顺带修复（低成本）：

4. Shift + 拖拽角点等比缩放
5. Tab / Shift+Tab 循环选中元素

---

## 二、验收标准

| 场景 | 期望行为 |
|---|---|
| 双击文本元素 | 进入内联编辑模式，光标聚焦 |
| Escape / 点击画布空白 | 退出编辑，内容写入 store |
| 锁定文本元素双击 | 不进入编辑 |
| 幻灯片导航栏 | 显示"+ 新建"按钮和每页的复制/删除操作 |
| 只剩 1 页 | 删除按钮禁用 |
| 删除当前页 | 自动切换到相邻页 |
| 图层面板 | 操作按钮默认隐藏，鼠标悬停时显示 |
| Shift + 拖拽角点 | 等比缩放 |
| Tab | 在当前页可见且未锁定的元素间循环选中 |

---

## 三、任务详解与工作流

### 任务 1：画布内联文本编辑

#### 1.1 涉及文件

| 文件 | 改动方向 |
|---|---|
| `src/components/editor/SlideCanvas.tsx` | 新增 `editingElementId` state；双击 handler；`TextEditOverlay` 内联组件 |
| `src/components/editor/ElementRenderer.tsx` | 转发 `onDoubleClick` 事件 |
| `src/core/keyboard/editorShortcuts.ts` | 确认 Escape 在编辑态不被全局截获（`isEditableTarget` 已有，需确认 contenteditable 被覆盖） |
| `src/styles/editor.css` | `.text-edit-overlay` 样式 |

#### 1.2 实现步骤

**Step 1** — `SlideCanvas` 新增状态：

```ts
const [editingElementId, setEditingElementId] = useState<string | null>(null);
```

**Step 2** — 双击 handler（挂在 `ElementRenderer` 的 `onDoubleClick` 上，由 `SlideCanvas` 传入）：

```ts
function handleElementDoubleClick(element: SlideElement) {
  if (mode !== "editable" || element.locked || element.type !== "text") return;
  setEditingElementId(element.id);
}
```

**Step 3** — `TextEditOverlay` 组件（定义在 `SlideCanvas.tsx` 内部或单独文件）：

- 绝对定位，位置和尺寸与元素 JSON 数据一致（`left: element.x, top: element.y, width: element.w, height: element.h`）
- `contentEditable` div，初始内容 `element.content`
- 样式与 `ElementRenderer` 文本渲染一致（字号、颜色、对齐、line-height 等），直接复用 `textReactStyle(element)` 并叠加 `outline: none`
- `white-space: pre-wrap` 支持多行
- 挂载时 `ref.current.focus()` + `window.getSelection().selectAllChildren(ref.current)`

**Step 4** — 提交逻辑：

```ts
function commitTextEdit(elementId: string, value: string) {
  executeCommand({ type: "rename-element", elementId, name: "" }); // 不能复用 rename
  // 需要新增 update-text-content command，或直接调用 updateElementById
  updateElementById(currentSlideId, elementId, { content: value });
  setEditingElementId(null);
}
```

> **决策点**：`rename-element` command 只改 `name` 字段。文本内容在 `content` 字段。需要直接调用 `useDeckStore.updateElementById`（已有），不必新增 command 类型。

**Step 5** — 退出时机：

- `onBlur` → `commitTextEdit`
- `onKeyDown` Escape → `commitTextEdit` 并 `event.stopPropagation()`（阻止全局 clear-selection handler）
- 画布 `handleCanvasPointerDown`：若 `editingElementId` 非空，先提交再走原有逻辑

**Step 6** — 在 `SlideCanvas` 渲染区加入 overlay（在 `slide-coordinate-space` 内，z-index 高于 elements）：

```tsx
{mode === "editable" && editingElementId ? (
  <TextEditOverlay
    element={elements.find(e => e.id === editingElementId)!}
    onCommit={(value) => commitTextEdit(editingElementId, value)}
  />
) : null}
```

#### 1.3 边界情况

- 编辑态不触发拖拽：`ElementRenderer` 的 `onPointerDown` 在 `editingElementId === element.id` 时不响应（由 `SlideCanvas` 传 prop 控制）
- 编辑空内容：允许，`trim()` 后若为空字符串则存空串（`ElementRenderer` 的 `elementLabel` 已处理空内容的显示 fallback）
- 切换幻灯片时：`editingElementId` 随 `currentSlideId` 变化而重置（`useEffect` 监听 `currentSlideId`）

---

### 任务 2：幻灯片 CRUD + 排序

#### 2.1 涉及文件

| 文件 | 改动方向 |
|---|---|
| `src/core/ops/deckOperations.ts` | 新增 4 个纯函数 |
| `src/store/useDeckStore.ts` | 新增 4 个 store action |
| `src/components/editor/SlideNavigator.tsx` | 新增操作 UI |

#### 2.2 纯函数（`deckOperations.ts`）

```ts
addSlide(deck, afterId?, defaultBackground?): Deck
duplicateSlide(deck, slideId, idFactory): Deck
deleteSlide(deck, slideId): { deck: Deck; newCurrentId: string }
moveSlide(deck, slideId, toIndex): Deck
```

各函数要求：
- `addSlide`：在 `afterId` 之后插入空白页；无 `afterId` 则追加末尾；新页 elements 为空，background 取前一页或默认白色
- `duplicateSlide`：深拷贝目标页，所有 element id 和 slide id 用 `idFactory` 生成新值，插入原页之后
- `deleteSlide`：至少保留 1 页（调用方保证；函数层不做校验，store 层做校验）；返回删除后应切换到的 `newCurrentId`（优先前一页，无则取后一页）
- `moveSlide`：调整 slides 数组顺序，`toIndex` 越界时 clamp

#### 2.3 store actions（`useDeckStore.ts`）

```ts
addSlide: (afterId?: string) => void
duplicateSlide: (slideId: string) => void
deleteSlide: (slideId: string) => void
moveSlide: (slideId: string, toIndex: number) => void
```

- 所有操作推入 undo history（`pushHistory`）
- `deleteSlide` 同步更新 `currentSlideId` 和清空选择
- `addSlide` / `duplicateSlide` 后自动切换到新页

#### 2.4 SlideNavigator UI

当前结构是 `<button>` 包裹缩略图。改动方向：

- 每个缩略图 button 改为 `<div class="slide-thumb-wrapper">`，内部：
  - 原 `<button>` 缩略图（切换页面）
  - hover 时叠加操作层（`<div class="slide-thumb-actions">`）：
    - 复制按钮（`duplicateSlide`）
    - 删除按钮（`deleteSlide`，只剩 1 页时 disabled）
    - 上移/下移按钮（`moveSlide`）
- 列表底部固定"+ 新建幻灯片"按钮（`addSlide()`）

操作按钮同样用 CSS hover 展示（`.slide-thumb-wrapper:hover .slide-thumb-actions { opacity: 1 }`）。

---

### 任务 3：LayersPanel 行密度精简

#### 3.1 涉及文件

| 文件 | 改动方向 |
|---|---|
| `src/styles/editor.css` | hover reveal 样式 |
| `src/components/editor/LayersPanel.tsx` | 可选：减少常驻文字标签 |

#### 3.2 CSS 改动

```css
.layer-controls {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s;
}

.layer-row:hover .layer-controls,
.layer-row.is-selected .layer-controls {
  opacity: 1;
  pointer-events: auto;
}
```

同时清理行内冗余信息：
- 移除 `z {element.zIndex}` 标签（已有图层顺序操作，数字无独立价值）
- 移除 `{element.groupId}` 标签（groupId 只有调试意义，不适合常驻显示）
- 锁定/隐藏状态通过行的 className 加视觉样式区分（灰色/斜体），而不是靠文字标签

---

### 任务 4（顺带）：Shift + 等比缩放

#### 涉及文件

- `src/core/geometry/transform.ts` — `resizeBounds` 增加 `lockAspectRatio` 参数
- `src/components/editor/SlideCanvas.tsx` — `handlePointerMove` 的 resize 分支读取 `event.shiftKey`

#### 实现

```ts
// transform.ts
export function resizeBounds(
  start: Bounds,
  handle: ResizeHandle,
  delta: { x: number; y: number },
  min?: { w: number; h: number },
  lockAspect?: boolean,  // 新增
): Bounds
```

`lockAspect` 为 true 时，取 delta 的较大分量计算等比缩放。

`SlideCanvas` 的 `handlePointerMove` resize 分支：

```ts
const next = resizeBounds(
  interaction.startBounds,
  interaction.handle,
  delta,
  { w: interaction.minW, h: interaction.minH },
  event.shiftKey,  // 新增
);
```

---

### 任务 5（顺带）：Tab / Shift+Tab 循环选元素

#### 涉及文件

- `src/core/keyboard/editorShortcuts.ts` — 新增 `cycle-element` shortcut 类型
- `src/components/editor/AppShell.tsx` — handler 中响应 cycle

#### 实现

```ts
// editorShortcuts.ts 新增类型
| { type: "cycle-element"; direction: 1 | -1 }
```

`AppShell` handler：

```ts
if (shortcut.type === "cycle-element") {
  const slide = deck.slides.find(s => s.id === currentSlideId);
  if (!slide) return;
  const candidates = sortElements(slide.elements)
    .filter(e => !e.hidden && !e.locked);
  if (candidates.length === 0) return;
  const currentIndex = candidates.findIndex(e => e.id === selectedElementId);
  const next = candidates[(currentIndex + shortcut.direction + candidates.length) % candidates.length];
  selectElement(next.id);
}
```

---

## 四、执行顺序建议

```
任务3（图层面板CSS）→ 任务4（等比缩放）→ 任务5（Tab循环）
→ 任务2（幻灯片CRUD）→ 任务1（内联文本编辑）
```

先做 CSS 和工具函数改动（无 UI 复杂度），再做数据层（store ops），最后做交互最复杂的内联编辑。

---

## 五、不做（本轮延后）

- 多元素属性批量编辑
- 对齐辅助线 / 元素吸附
- 演示模式（全屏键盘翻页）
- 幻灯片备注面板
- PPTX 导出
- 字体管理
