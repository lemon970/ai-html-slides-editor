# 桌面化资源目录方案预研

日期：2026-06-18  
背景：第九轮迭代附属产出，基于 `deck.assets` 地基（第八轮）和当前草稿体积瓶颈（4MB localStorage 限制）做前期评估。

---

## 一、问题定义

当前所有图片资源以 Data URL 内嵌在 `deck.json` 中。这带来三个连锁问题：

1. **草稿体积**：单张 1600×900 JPEG 约 800KB，4 张即触发 localStorage 4MB 限制，触发图片省略策略。
2. **JSON 可读性**：deck.json 中充斥 base64 字符串，手动编辑困难。
3. **资产共享**：同一张图片在多张幻灯片中使用时，base64 数据重复存储。

桌面化资源目录方案可从根本上解决这三个问题。

---

## 二、Tauri vs Electron 选型

| 维度 | Tauri v2 | Electron |
|---|---|---|
| 包体积 | ~8MB（WebView 来自系统） | ~80–120MB（含 Chromium） |
| 内存 | 低（原生 WebView） | 高 |
| 文件系统 API | 原生插件（`tauri-plugin-fs`） | `fs` 模块（Node.js 全能力） |
| 自动更新 | `tauri-plugin-updater` | `electron-updater` |
| 语言 | Rust（命令层）+ TS（前端） | Node.js + TS（前端） |
| 原生菜单 | `tauri-plugin-menu` | `Menu` API | 
| 打包复杂度 | 中（需 Rust 工具链） | 低（Node.js 生态成熟） |
| 适用场景 | 体积优先、性能优先 | 开发速度优先、生态优先 |

**推荐：Tauri v2**。项目定位是"个人可部署工具"，包体积是核心体验。Rust 工具链一次性安装后日常开发不受影响。

---

## 三、资源目录方案

### 3.1 项目文件结构

```
my-presentation/              ← 项目根目录
  deck.json                   ← 主数据文件
  assets/
    img-abc123.jpg            ← 图片资源（哈希命名）
    img-def456.png
    font-NotoSans.woff2       ← 字体资源（第十轮）
```

`deck.json` 中图片元素和资产库的 `src` 字段改为相对路径：

```json
{
  "assets": [
    { "id": "asset-1", "type": "image", "src": "assets/img-abc123.jpg", ... }
  ]
}
```

### 3.2 当前 Data URL 模型的迁移路径

| 场景 | 迁移策略 |
|---|---|
| 导入图片 | 写入 `assets/` 目录，`src` 改相对路径；原 Data URL 模式作为 Web 兼容回落 |
| 草稿恢复 | 路径引用不受 4MB 限制，彻底解决体积问题 |
| 导出 HTML | 导出前内联读取文件并转为 Data URL，单文件 HTML 仍有效 |
| 导出 ZIP | 直接打包 `deck.json` + `assets/` 目录 |

### 3.3 Schema 扩展方向

`deckAssetSchema.src` 改为接受两种格式：

```ts
src: z.string().min(1)
// runtime 层区分:
// - "data:image/..." → Data URL（Web 模式）
// - "assets/..." → 相对路径（桌面模式）
// - "https://..." → 远程 URL（需 preflight 警告）
```

无需修改 schema 验证规则，由 asset 管理层在写入时决定使用哪种格式。

---

## 四、Web 模式与桌面模式兼容

| 能力 | Web 模式 | 桌面模式 |
|---|---|---|
| 存储 | localStorage（4MB）/ IndexedDB（待升级） | 本地文件系统 |
| 图片 | Data URL 内嵌 | 相对路径引用 |
| 草稿 | 自动 debounce 写 localStorage | 自动保存到 `deck.json` |
| 字体 | 系统字体 + Google Fonts 外链 | 本地 woff2 资源 |

应用层代码通过一个 `Platform` 抽象（`isPlatformDesktop()`）路由到不同的存储实现，核心 schema 和 ops 层无需改动。

---

## 五、前置依赖（在启动 Tauri 打包前需完成）

1. **IndexedDB 草稿升级**（第十轮）：先在 Web 模式解决体积问题，验证资产管理逻辑。
2. **字体资产支持**（第十轮）：字体是桌面资源目录的第二大类资产，先在 Web 模式跑通。
3. **ZIP 导出**（可选扩展）：桌面模式的"另存为"可以导出 `deck.json` + `assets/` zip 包，复用 JSZip。

---

## 六、结论

- **第九轮**：本文档，不动代码。
- **第十轮**：IndexedDB 草稿 + 字体资产 + 图片裁切，在 Web 模式验证资产管理完整闭环。
- **第十一轮**：启动 Tauri v2 脚手架，接入文件系统插件，实现本地项目文件读写，迁移 `src` 路径策略。
