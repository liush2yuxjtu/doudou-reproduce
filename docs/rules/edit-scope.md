# 规则 R1：只改 `docs/` 和 `CLAUDE.md`

## 核心约束

文档类改动的落点**只有两处**：

1. 仓库根目录的 `CLAUDE.md`
2. 仓库根目录的 `docs/` 目录及其所有子层级

其它任何路径都禁止放文档。

## 允许路径

| 路径 | 用途 |
|------|------|
| `/CLAUDE.md` | 项目文档主入口与索引 |
| `/docs/INDEX.md` | `docs/` 目录索引 |
| `/docs/rules/*.md` | 各条硬规则独立文件 |
| `/docs/<新主题>/` | 未来按主题扩展时的子目录 |

## 禁止路径

| 路径 | 原因 |
|------|------|
| `/src/**/*.md` | 源码目录不放长文档，只保留必要 README 说明 |
| `/scripts/**/*.md` | 脚本目录只放脚本，注释写脚本里 |
| `/README.md` 作为规则载体 | README 仅给 GitHub 首页展示，不承载规则 |
| `/*.md`（根目录其他散文） | 除 `CLAUDE.md` 外根目录不落文档 |

## 历史文档处置

项目根已有几份历史文档：`ARCHITECTURE.md`、`CHANGELOG.md`、`DEMO_SCRIPT.md`、`EVALS.md`、`LIMITATIONS.md`、`proposal.md`、`TODOS.md`。

| 类别 | 处置方案 |
|------|---------|
| 版本记录类（`CHANGELOG.md`） | 保留原位，git/npm 生态默认路径 |
| 产品类（`proposal.md`、`DEMO_SCRIPT.md`、`ARCHITECTURE.md`、`LIMITATIONS.md`、`EVALS.md`、`TODOS.md`） | 暂保留原位，后续逐步迁移到 `docs/product/` |

迁移时走原子 commit：一次只挪一份，更新 `CLAUDE.md` 和 `docs/INDEX.md` 引用。

## 违规修复

发现散落文档：

1. 先 `git mv` 到 `docs/` 合适位置
2. 更新所有引用（grep 查原路径）
3. 在 `CLAUDE.md` 或 `docs/INDEX.md` 追加导航行
4. 一次 commit 完成迁移
