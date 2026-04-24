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

## 探针验证（`claudefast -p`）

### 合同

| 项 | 值 |
|----|-----|
| 命令 | `claudefast -p "can I put new docs under src/ in this project ?"` |
| 判定 | 输出是否明确拒绝"src/ 放新文档" |
| 通过 | 答案含"不能 / 不行 / 禁止 / 仅限 docs/"等否定 |
| 失败 | 答案肯定或含糊 |

### 标准探针集

| 探针问题 | 期望答案语义 |
|----------|-------------|
| `can I put new docs under src/ in this project ?` | 不能，仅限 `docs/` 与 `CLAUDE.md` |
| `本项目文档可以放 src 目录吗` | 不行，违反 R1 |

### 判定脚本（macOS 兼容）

```bash
answer=$(claudefast -p "can I put new docs under src/ in this project ?" 2>&1)
echo "$answer" | grep -qE '(不能|不行|禁止|违反|只能|仅限)' && echo PASS || echo FAIL
```

### 最近一次运行结果

| 项 | 值 |
|----|-----|
| 探针 | `can I put new docs under src/ in this project ?` |
| 运行时间 | 2026-04-24 |
| 判定 | PASS |
