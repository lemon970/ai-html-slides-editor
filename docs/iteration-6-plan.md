# 第六轮迭代计划：对齐分布 + 数据安全 + 播放模式

日期：2026-06-17  
分支基准：`codex/practical-usability-task-1-4`（commit `799d74a`）

---

## 一、定位

第五轮完成了 Source HTML 兼容层的收口（格式检测 + 转换引导 + 升级按钮）。
JSON Schema 编辑器的核心路径现在是：AI 生成 → 导入 → 编辑 → 导出。

第六轮目标是让这条路径从"能用"变成"好用"，解决三个高优问题：

| 问题 | 影响 | 解法 |
|---|---|---|
| 编辑体验差一口气：元素对不齐 | 每次布局都要手动拖，精度差 | 对齐 + 分布工具栏 |
| 数据不安全：刷新就丢 | 无法长期使用 | 打开JSON + localStorage 草稿 |
| 产品闭环不完整：只能编不能放 | 不能独立演示 | 全屏播放模式 |

---

## 二、方向 A — 对齐、分布、插入工具栏

### A1 对齐按钮（6 个）

**位置**：工具栏，多选或单选元素时激活。

| 操作 | 逻辑 |
|---|---|
| 左对齐 | 所有选中元素 x = min(x) |
| 水平居中 | 所有元素中心 x = 参考中心 x |
| 右对齐 | 所有元素 x+w = max(x+w) |
| 顶对齐 | 所有元素 y = min(y) |
| 垂直居中 | 所有元素中心 y = 参考中心 y |
| 底对齐 | 所有元素 y+h = max(y+h) |

参考对象：多选时以选中集合的 bounding box 为基准；单选时以画布为基准（居中到页面）。

### A2 分布按钮（2 个）

需要 ≥3 个元素才激活。

| 操作 | 逻辑 |
|---|---|
| 水平等间距 | 按 x 排序，均分总宽度范围内的间距 |
| 垂直等间距 | 按 y 排序，均分总高度范围内的间距 |

### A3 插入工具栏（补 UI 入口）

editorCommands 已有 `add-text-element` 和 `add-shape-element`，但工具栏没有入口。
本轮补上：

- "插入" 下拉菜单按钮（或内联 3 个图标按钮）
- 文本框、矩形、椭圆
- 分割线（1px 高矩形，fill 深灰，w=600）作为 preset

### 文件改动

- `src/core/ops/alignOperations.ts`（新建）— 对齐和分布的纯函数
- `src/core/commands/editorCommands.ts` — 新增 `align-elements` 和 `distribute-elements` 命令类型
- `src/components/EditorShell.tsx`（或 toolbar 组件）— UI 入口
- `src/styles/editor.css` — 对齐按钮样式（可复用 `.segmented-control` 或 `.button-grid-2`）

### 验收标准

- 选中 2 个元素，点对齐按钮，元素坐标按规则更新，历史可撤销
- 选中 3 个以上元素，分布按钮可用，间距均等
- 单选元素，对齐按钮把元素对齐到页面边缘/中心
- 工具栏可插入文本、矩形、椭圆、分割线

---

## 三、方向 B — 数据安全（打开 JSON + localStorage 草稿）

### B1 打开已有 JSON

**位置**：ImportLanding 页，现有"使用示例演示"按钮旁边。

实现：
- `<input type="file" accept=".json">` + `loadDeck(JSON.parse(text))`
- 加基础 schema 校验（有 slides 数组即可接受）
- 导入失败时 toast 提示，不覆盖当前 deck

### B2 localStorage 草稿

**策略**：每次 deck 变化 debounce 1s 后写 `localStorage["htmlppts_draft"]`。

内容：`{ deck, currentSlideId, savedAt: ISO string }`

注意：图片是 DataURL，单张超 1MB 就容易超配额（5MB 限制）。
处理策略：写入前检查序列化体积，超过 4MB 则跳过图片元素的 src（写 `"[omitted]"`），并在恢复时提示"图片需重新导入"。

### B3 草稿恢复提示

启动时（ImportLanding mount）：
- 检测 `localStorage["htmlppts_draft"]`
- 若存在且 `savedAt` 在 24 小时内，显示 banner：
  "发现未保存的草稿（保存于 XX 分钟前）" + "恢复" / "忽略" 两个按钮
- 点恢复 → `loadDeck(draft.deck)` + 进入编辑器
- 点忽略 → 删除草稿

### B4 未保存修改提示

编辑器 `beforeunload` 事件：若 deck 有变化（对比上次保存/导入的快照），弹浏览器原生确认框。
简单实现：进入编辑器时记录 deck hash（JSON stringify 取长度或简单 checksum），每次 deck 变化对比。

### B5 导出 JSON 时清除草稿

点"保存 JSON"后删除 localStorage 草稿（视为已持久化）。

### 文件改动

- `src/core/persistence/draft.ts`（新建）— 草稿读写和体积检查
- `src/components/ImportLanding.tsx` — 加打开JSON入口 + 草稿恢复 banner
- `src/store/useDeckStore.ts` — 订阅 deck 变化写草稿；beforeunload 注册

### 验收标准

- 可以打开已有 deck.json 文件，schema 不匹配时提示错误而不崩溃
- 编辑后刷新页面，ImportLanding 显示草稿恢复提示
- 点"恢复"，deck 状态完整还原（图片占位提示符合预期）
- 导出 JSON 后刷新，草稿提示消失
- 编辑后关闭标签页，浏览器显示"离开页面"确认

---

## 四、方向 C — 播放模式（全屏演示）

### C1 播放入口

工具栏右侧加"演示 ▶"按钮，触发全屏播放。

### C2 播放器组件 `PresentationMode`

全屏渲染每一页：
- 复用现有 `SlideCanvas`（无编辑交互），或直接 iframe 渲染 `renderDeckHtml()` 输出
- 推荐方案：直接用现有 `SlideCanvas` + 缩放到全屏，简单且与编辑器保持一致

布局：
```
全屏黑底
  └── 居中的 16:9 画布（scale 到视口）
  └── 底部 HUD：← 上一页  |  页码 3/12  |  下一页 →  |  ✕ 退出
```

### C3 键盘控制

| 按键 | 操作 |
|---|---|
| → / Space / PageDown | 下一页 |
| ← / PageUp | 上一页 |
| ESC | 退出播放 |
| F（可选） | 切换全屏 API |

### C4 全屏 API

使用 `document.documentElement.requestFullscreen()` 进入系统全屏。
ESC 同时退出全屏和播放模式。

### C5 播放模式状态

不放到全局 store，用组件内 useState 管理（currentSlideIndex 从 editor 当前页开始）。

### 文件改动

- `src/components/PresentationMode.tsx`（新建）— 播放器全屏组件
- `src/styles/presentation.css`（新建）或追加到 `editor.css`
- `src/components/EditorShell.tsx` — 挂载 PresentationMode overlay

### 验收标准

- 工具栏"演示"按钮点击后进入全屏，显示当前页
- 键盘左右键可翻页，ESC 退出
- 页码显示正确
- 退出后回到编辑器，当前页不变

---

## 五、任务优先级和顺序

```
Task 1：alignOperations.ts + editorCommands 扩展（纯逻辑，可独立）
Task 2：对齐/分布 UI（依赖 Task 1）
Task 3：插入工具栏入口（独立，可并行）
Task 4：draft.ts + store 订阅（独立）
Task 5：ImportLanding 草稿 banner + 打开JSON（依赖 Task 4）
Task 6：PresentationMode 组件（独立）
Task 7：演示按钮挂载（依赖 Task 6）
```

Tasks 1/3/4/6 可以并行开始。

---

## 六、不做（本轮）

- Snap 吸附系统（改造面大，留下轮）
- 元素动画（留下轮）
- 图片资源库（留下轮）
- 演讲者备注（播放器 v2 再做）
- 页面切换动画
- PPTX / PNG / PDF 导出

---

## 七、与长期路线的关系

```
轮次 6（本轮）：对齐 + 数据安全 + 播放  →  编辑器可以日常使用了
轮次 7：Snap + 元素动画 + 插入 preset 扩展  →  更接近 Canva
轮次 8：媒体资源库 + 图片裁切  →  资产管理
轮次 9：桌面化 / Tauri 打包  →  EXE 分发
```
