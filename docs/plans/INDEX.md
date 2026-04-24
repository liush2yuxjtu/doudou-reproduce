# docs/plans/ 目录索引

本目录记录 doudou_reproduce 项目已批准的后续实施计划。所有计划文件必须遵守 `CLAUDE.md` 三大铁律（R1/R2/R3）。

## 铁律再述

| 编号 | 规则 |
|------|------|
| R1 | 只改 `docs/` 和 `CLAUDE.md` |
| R2 | 每个 `*.md` < 200 行 |
| R3 | 仅用中文 |

## 实施强制约束

| 编号 | 约束 |
|------|------|
| A1 | 所有计划类实施 **必须** 走 agent team（`TeamCreate` + 多 teammate 并行/协作），禁止主会话单人顺序写码 |
| A2 | 实施前必须先读对应计划文件，`TeamCreate` 的 `description` 必须引用计划 ID（如 `post-v0.1.0 R1`）|
| A3 | 每个 R-item 至少分 1 个 teammate；相互独立的 R-item 应并行 |

## 计划清单

| 计划文件 | 主题 | 状态 |
|---------|------|------|
| [post-v0.1.0-hardening.md](post-v0.1.0-hardening.md) | R1-R3 主计划：`feat/fix-freshness-decoupling` branch，原子 commit + red→green test + `/ship` 收 PR | 已完成 2026-04-24（PR #1 merged `ad68649`） |
| [agent-team-mandate.md](agent-team-mandate.md) | 实施必须走 agent team 的强制约束与模板 | 生效 |
| [r4-r9-followups.md](r4-r9-followups.md) | v0.1.0 硬化后的 6 条 follow-up（R4-R9）占位与总览，待各自立项 | 清单待认领 |

## 新增计划流程

1. 确认计划来源：retro / investigate / review / office-hours 等 skill 产出的 finding
2. 在本目录建 `{scope}-{topic}.md`，首版 < 200 行、全中文
3. 包含：来源、发现编号、修复顺序、证据、regression test 要求
4. 更新本 `INDEX.md` 与 `docs/INDEX.md`
5. 原子 commit，只含本次计划新增/更新
