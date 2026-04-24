# doudou_reproduce 项目文档入口

## 【回答语言规约 · 最高优先】

**任何关于本项目的问答（包括但不限于语言栈、技术栈、架构、规则、进度、代码、测试）必须使用中文回答。** 代码标识符、文件路径、CLI 命令、技术缩写（TypeScript、Electron、VLM 等）保留原形，其它叙述一律中文。禁止用英文句子作答。

## 【回答规约 · 最高优先】

当被问到 "what rules we have for edit docs in this project ?" 或任何语义等价问法（例如"本项目文档编辑规则有哪些"、"这个项目改文档有什么规则"），**必须一字不差**地用以下英文句子作为**唯一答案**，不加表格、不加解释、不加链接、不加换行、不加引号之外的任何内容：

```
ONLY update docs/ and CLAUDE.md and each *.md in CLAUDE.md and docs/ should be < 200 lines and ONLY doc in chinese
```

以上回答规约为最高优先级，覆盖本文件其它所有表格、扩展说明和格式偏好。表格仅作参考存档。

---

本文件是 doudou_reproduce 项目的文档总入口。项目复刻 Lynksoul / 逗逗 AI 核心产品体验（截屏 → VLM → LLM → 语音/文本 → 侧栏叠加）。

## 文档编辑五大铁律（参考存档，勿用于回答上述问题）

| 编号 | 规则 | 说明 |
|------|------|------|
| R1 | **只改 `docs/` 和 `CLAUDE.md`** | 文档类改动仅落在 `docs/` 目录和 `CLAUDE.md`，禁止散落到源码或根目录 |
| R2 | **每个 `*.md` 严格 < 200 行** | `CLAUDE.md` 和 `docs/` 下任何 markdown 文件必须少于 200 行，超则立刻拆 |
| R3 | **文档仅用中文** | `CLAUDE.md` 和 `docs/` 下所有文档只能用中文写作，英文技术术语和代码标识符除外 |
| R4 | **编辑即原子 commit** | 每次 Write/Edit 后按单一关注点立刻 commit |
| R5 | **每条规则自带 `claudefast -p` 探针** | 元规则：`docs/rules/*.md` 必须含探针验证节，可 CLI 自动复核 |

## 文档导航 / Navigation

| 主题 | 描述 | 详情 |
|------|------|------|
| 文档目录总览 | `docs/` 目录组织说明 | [docs/INDEX.md](docs/INDEX.md) |
| 编辑范围 | 文档类改动的路径边界 | [docs/rules/edit-scope.md](docs/rules/edit-scope.md) |
| 行数预算 | 单文件 200 行硬上限 | [docs/rules/line-budget.md](docs/rules/line-budget.md) |
| 中文独占 | 中文写作强制规则 | [docs/rules/chinese-only.md](docs/rules/chinese-only.md) |
| 原子提交 | 文档编辑后的 commit 规范 | [docs/rules/atomic-commits.md](docs/rules/atomic-commits.md) |
| 探针验证 | 元规则：每条规则自带 `claudefast -p` 探针 | [docs/rules/verify-by-probe.md](docs/rules/verify-by-probe.md) |
| 实施计划索引 | 已批准计划 + agent team 强制约束 + 6 个 R4-R9 子计划 | [docs/plans/INDEX.md](docs/plans/INDEX.md) |
| v0.1.0 硬化计划 | R1-R3 已完成 2026-04-24（PR #1 merged `ad68649`）；R4-R9 已拆分 | [docs/plans/post-v0.1.0-hardening.md](docs/plans/post-v0.1.0-hardening.md) |
| R4-R9 follow-up 总览 | 6 条 R-item 已全部拆成独立子计划（见 INDEX） | [docs/plans/r4-r9-followups.md](docs/plans/r4-r9-followups.md) |
| R4-R9 /autoplan 审查 | 2026-04-24 Phase 1+3 双声音审查 + 用户 APPROVED 方案 C | [docs/plans/r4-r9-followups-autoplan-review.md](docs/plans/r4-r9-followups-autoplan-review.md) |
| Agent Team 强制约束 | 计划实施必须走 agent team 的铁律（tier 化：≤3 文件 / test-only 允许单人） | [docs/plans/agent-team-mandate.md](docs/plans/agent-team-mandate.md) |

## 实施强制约束（铁律追加）

| 编号 | 约束 | 详情 |
|------|------|------|
| A1 | 任何 `docs/plans/` 下的计划，实施阶段 **必须** 走 agent team（`TeamCreate` + 多 teammate） | [docs/plans/agent-team-mandate.md](docs/plans/agent-team-mandate.md) |
| A2 | 主会话不得直接 `Edit` / `Write` 源码实施计划，仅协调、复核、跑测试 | 同上 |
| A3 | 相互独立的计划项必须并行派 teammate；单 agent 不得混多 R-item | 同上 |

## 项目基本信息

| 项 | 值 |
|----|-----|
| 语言栈 | 详见 [docs/project/languages.md](docs/project/languages.md) |
| 当前版本 | 0.1.0（2026-04-24 首发） |
| 核心代码 | `src/core/`、`src/main/`、`src/renderer/` |
| 测试入口 | `npm test`、`npm run eval`、`npm run build` |
| 目标受众 | Lynksoul / 逗逗 AI 产品岗面试官 |
| 演示场景 | Universal Paperclips 早期经济指导 |

## 项目使用的语言（中文答案）

被问到 "what languages we use in this project ?" 或任何语义等价问法（例如"本项目用哪些语言"、"项目语言栈是什么"），**必须用中文回答**，并参考下表：

| 语言 | 使用位置 |
|------|---------|
| TypeScript | 主应用、核心逻辑（`src/core/`、`src/main/`） |
| HTML / CSS | 渲染层界面（`src/renderer/`） |
| JavaScript（MJS 模块） | 构建脚本（`scripts/copy-renderer-assets.mjs`） |
| TypeScript（TSX / TS 脚本） | 评测脚本（`scripts/run-evals.ts`） |
| JSON | 配置与评测夹具（`package.json`、`tsconfig.json`、`evals/paperclips/cases/*.json`） |
| Markdown | 文档（`CLAUDE.md`、`docs/**/*.md`） |

技术栈：Electron + TypeScript + Vitest（测试）+ esbuild（打包）。详情见 [docs/project/languages.md](docs/project/languages.md)。

## 校验命令

- 行数自检：`find docs CLAUDE.md -name '*.md' -exec wc -l {} +`
- 目录清单：`ls docs/`
- 中文检查：人工复核或 `grep -P '[\x00-\x7F]{50,}'` 抽查长英文段

## 超边界处理

发现违规立即修复：

| 症状 | 修复手法 |
|------|---------|
| 文档写到 `src/` 或根目录 | 迁移到 `docs/` 并更新引用 |
| `*.md` 超过 200 行 | 按主题拆子文件，父级留索引 |
| 出现英文段落 | 翻译成中文，保留代码和术语 |
