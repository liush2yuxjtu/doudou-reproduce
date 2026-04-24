# v0.1.0 发布后硬化计划（R1-R3 主计划）

## 来源

- `/retro` 7d 窗口（2026-04-17 → 2026-04-24）：`.context/retros/2026-04-24-1.json`
- `/investigate` 于 2026-04-24 基于 retro 信号做的 latent issue 盘点
- 当前分支：`main`（已发布 v0.1.0）

## 实际执行计划（主动作）

**按 R1 → R2 → R3 顺序，在 branch `feat/fix-freshness-decoupling` 上逐项推进。每个 fix 一个原子 commit，同 commit 内补 red→green regression test。三项完成后走 `/ship` 收 PR。**

### 关键参数

| 项 | 值 |
|----|----|
| branch 名 | `feat/fix-freshness-decoupling` |
| base | `main` |
| 顺序 | R1 → R2 → R3（严格串行） |
| 每项粒度 | 1 原子 commit = 1 fix + 1 red→green test |
| commit 前缀 | `fix(R1):` / `fix(R2):` / `fix(R3):` |
| 收尾 | `/ship` → PR → 人工 review → merge |
| 禁止 | 直推 main、跨项合 commit、fix 与 test 分开 commit、`--no-verify` |

### 实施约束（强制）

**必须走 agent team**（见 [agent-team-mandate.md](agent-team-mandate.md)）：

1. `TeamCreate` 名 `fix-freshness-decoupling`，description 引用本文件
2. 主会话任 team-lead，不直接 `Edit` / `Write` 源码
3. 每项 R 至少派 1 个 teammate（`tdd-guide` 或 `typescript-reviewer` 辅 fixer）
4. R1/R2/R3 严格串行（R1 的 advice 解耦影响 R2 eval 的 fixture），但每项内部的 fix + test 可并行派发给 fixer + test-backfiller
5. 每个 commit 前过一次 `code-reviewer` agent 独立复核

## R1 · Advice 最大年龄解耦

**根因：** fd9bc2a 把 scene 最大年龄 10s → 60s，同时错把 advice 最大年龄绑定到 60s。advice 生成 <1ms，10s 窗口本是 UI 防陈旧护栏。

**文件：** `src/core/evidence-validator.ts:9`

**修复：** `DEFAULT_MAX_ADVICE_AGE_MS = 10_000`（解耦 scene）。

**Red test：** 15s 前生成的 advice → `approveAdvice` 返回 `{ok:false, issues:['advice_stale']}`。当前代码此 test 必红；修复后转绿。

## R2 · Eval 抓 staleness

**根因：** `scripts/run-evals.ts:23` 用 `now.toISOString()` 覆盖 fixture 的 `capturedAt`，staleness 回归被屏蔽。

**文件：** `scripts/run-evals.ts`、`evals/paperclips/cases/`

**修复：** 新增 `evals/paperclips/cases/stale-scene.json`（`capturedAt` 提前 90s，expectedAction `validation_fail`）；runner 尊重 fixture 自带 `capturedAt`，期望 validation 失败并记 PASS。

**Red test：** 新 fixture 在当前 runner 下会被 `now` 覆盖 → test 断言"staleness case 正确失败"必红；runner 改完转绿。

## R3 · captureScene 的 frameHash 置位顺序

**根因：** `companion-pipeline.ts:40-41` 在 VLM 调用之前写 `latestFrameHash`。VLM 抛错后，下次同帧会被误报 `duplicate: true`。

**文件：** `src/main/companion-pipeline.ts`

**修复：** hash 写入移到 scene commit 成功后。

**Red test：** mock VLM 抛错，同帧连续两次 captureScene，第二次 `duplicate` 必须为 false。当前实现该 test 必红；修复后转绿。

## 验收标准

- `git log feat/fix-freshness-decoupling` 恰好 3 commit：`fix(R1):` / `fix(R2):` / `fix(R3):`
- 每 commit 同时改源码与 test，单 commit 的 `npm test` 既可红→也可绿（通过 revert fix 一行观察）
- 最终 `npm test`、`npm run build`、`npm run eval`（含新 stale fixture）全绿
- `/ship` 生成 PR，description 链回本文件与 `.context/retros/2026-04-24-1.json`
- PR merge 后删 branch

## 实施结果

- **状态：** 已完成（2026-04-24）
- **PR：** [#1](https://github.com/liush2yuxjtu/doudou-reproduce/pull/1) merged as `ad68649`
- **三 commit：** `0d0672f fix(R1)`、`e22a683 fix(R2)`、`88d2220 fix(R3)`
- **测试：** `npm test` 23/23 绿；`npm run build` 通过；`npm run eval` 4/4（含新 `stale-scene.json` 走 `validation_fail`）
- **外部 review：** gemini-code-assist 留 informational 建议（error code 区分、`isMain` 跨平台）；主会话 adversarial subagent 另发现 R3 边界副作用（`validation_fail` 场景哈希不写入 → 同帧重试）

## 延后项（非主计划）

R4-R9 不在本 branch 处理，各自独立计划：

| ID | 主题 | 延后原因 |
|----|------|---------|
| R4 | `MAX_SCENE_AGE_MS` 常量漂移 | 清理类 |
| R5 | ISSUE-001 / stdin-close 回归测试 | R1/R2 已覆盖 staleness 主路径 |
| R6 | `FreshResultGate` reset 契约 | 等 R3 落地后评估必要性 |
| R7 | `approveAdvice` 拆 `advice_stale` token 为 `advice_stale` + `scene_stale` | gemini + adversarial 共识，可观测性改进 |
| R8 | `RawPaperclipsScene.capturedAt` 类型契约硬化 + `runEvals` 绝对 evalDir | R2 引入的类型松动 |
| R9 | `companion-pipeline` 在 `validated.ok=false` 场景是否写入 `latestFrameHash` | R3 引入的重试成本行为，需产品侧决策 |

## 超时与回滚

- 任一 R 调试超过 3 hypothesis → investigate 3-strike 停止升级
- 任一 fix 触碰 > 5 文件 → `AskUserQuestion` 报 blast radius
- 全量测试红 → 立刻回滚该 commit，不得 `--amend`
