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
| [post-v0.1.0-hardening.md](post-v0.1.0-hardening.md) | v0.1.0 发布后 6 项 latent issue 修复（R1-R6）| 批准待实施 |
| [agent-team-mandate.md](agent-team-mandate.md) | 实施必须走 agent team 的强制约束与模板 | 生效 |

## 新增计划流程

1. 确认计划来源：retro / investigate / review / office-hours 等 skill 产出的 finding
2. 在本目录建 `{scope}-{topic}.md`，首版 < 200 行、全中文
3. 包含：来源、发现编号、修复顺序、证据、regression test 要求
4. 更新本 `INDEX.md` 与 `docs/INDEX.md`
5. 原子 commit，只含本次计划新增/更新
