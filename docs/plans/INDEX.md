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
| [agent-team-mandate.md](agent-team-mandate.md) | 实施必须走 agent team 的强制约束与模板（tier 化：≤3 文件 / test-only 单 commit 允许单人） | 生效 |
| [r4-r9-followups.md](r4-r9-followups.md) | R4-R9 roster 总览，子计划独立 | 已拆分 |
| [r4-r9-followups-autoplan-review.md](r4-r9-followups-autoplan-review.md) | `/autoplan` 2026-04-24 对 roster 的完整审查报告（R2 豁免） | 已 APPROVED 方案 C |
| [r4-constant-dedup.md](r4-constant-dedup.md) | R4 · `MAX_SCENE_AGE_MS` 3 处→1 处（含 renderer） | 待实施 |
| [r5-codex-cli-stdin-regression.md](r5-codex-cli-stdin-regression.md) | R5 · Codex CLI 子进程 stdin-close 回归测试（重指 `openai-vision-client.ts`） | 待实施 |
| [r6-freshresultgate-no-reset.md](r6-freshresultgate-no-reset.md) | R6 · `FreshResultGate` 显式无 reset 契约（仅 JSDoc + test） | 待实施 |
| [r7-scene-stale-token-fix.md](r7-scene-stale-token-fix.md) | R7 · `evidence-validator.ts:31` bug fix：`approval_scene_stale` | 待实施 |
| [r8-fixture-schema-split.md](r8-fixture-schema-split.md) | R8 · production schema 保持必填 + 独立 `EvalCaseRawScene` fixture schema | 待实施 |
| [r9-framehash-decision.md](r9-framehash-decision.md) | R9 · `validation_fail` 写 hash 的产品决策 artifact（未决策） | 待决策 |

## 新增计划流程

1. 确认计划来源：retro / investigate / review / office-hours 等 skill 产出的 finding
2. 在本目录建 `{scope}-{topic}.md`，首版 < 200 行、全中文
3. 包含：来源、发现编号、修复顺序、证据、regression test 要求
4. 更新本 `INDEX.md` 与 `docs/INDEX.md`
5. 原子 commit，只含本次计划新增/更新
