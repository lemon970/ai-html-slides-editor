# AI HTML Slides Editor

面向 AI 生成 HTML Slides 的可视化 MVP 编辑器。项目以 `deck.json` 为主数据模型，提供类似 PPT 的基础人工编辑能力，并导出为单文件 HTML。

## Quick Start

```bash
pnpm install
pnpm dev
```

打开本地地址后可以：

- 切换左侧 slide 缩略图。
- 点击选择画布元素。
- 编辑文本、字体、字号、字重、行高、字距、颜色、背景。
- 拖动、缩放、旋转元素。
- 编辑 slide 纯色、渐变和图片背景。
- 替换图片元素。
- 使用基础对齐和图层控制。
- 保存 JSON。
- 导出单文件 HTML。
- 导入本项目导出的受约束 HTML。

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | 启动本地开发服务 |
| `pnpm test` | 运行 Vitest 单元测试 |
| `pnpm build` | 生产构建 |
| `pnpm exec tsc --noEmit` | TypeScript 类型检查 |

## Docs

- `docs/ai-html-slides-editor-research.md`：技术调研和产品拆解。
- `docs/mvp-implementation-roadmap.md`：从 0 到 MVP 的实现路径。
