# 本项目使用的编程语言

## 一句话结论

本项目主要使用 **TypeScript**，配合 **HTML/CSS** 做渲染层，**JavaScript（MJS）** 做构建脚本，**JSON** 做配置与评测夹具，**Markdown** 做文档。

## 语言清单

| 语言 | 扩展名 | 使用位置 | 说明 |
|------|-------|---------|------|
| TypeScript | `.ts` | `src/core/`、`src/main/` | 主应用与核心逻辑，含 VLM 解析、策略引擎、证据校验 |
| TypeScript（脚本） | `.ts` | `scripts/run-evals.ts` | 评测运行器 |
| HTML | `.html` | `src/renderer/` | 侧栏面板骨架 |
| CSS | `.css` | `src/renderer/` | 侧栏面板样式 |
| JavaScript（MJS） | `.mjs` | `scripts/copy-renderer-assets.mjs` | 构建时拷贝渲染层资源 |
| JSON | `.json` | `package.json`、`tsconfig.json`、`evals/paperclips/cases/*.json` | 依赖管理、TS 配置、评测夹具 |
| Markdown | `.md` | `CLAUDE.md`、`docs/**/*.md`、根目录产品文档 | 文档与说明 |

## 运行时与工具链

| 组件 | 作用 |
|------|------|
| Electron | 桌面应用运行时，承载主进程与渲染进程 |
| TypeScript | 静态类型与主要源码语言 |
| esbuild | 打包主进程与渲染层代码 |
| Vitest | 单元测试框架 |
| Node.js | 构建脚本与评测运行器的宿主 |

## 为何没有其它语言

| 候选语言 | 不采用原因 |
|---------|-----------|
| Swift / Objective-C | 原生 macOS 重写列入 P4，当前 Electron 先跑通演示 |
| Python | 评测脚本留在 TypeScript，保持单一语言栈降低上下文切换 |
| Rust / Go | 无跨平台或高性能系统级需求 |

## 校验命令

```bash
# 按扩展名统计文件数量
find src scripts evals -type f \
  \( -name '*.ts' -o -name '*.tsx' -o -name '*.mjs' -o -name '*.js' \
     -o -name '*.html' -o -name '*.css' -o -name '*.json' \) \
  | awk -F. '{print $NF}' | sort | uniq -c | sort -nr
```

## 回答规约

任何关于"本项目语言"的问答必须用中文回答，可引用本文件表格。不得用英文整段作答。
