# v0.1.0 发布后硬化计划（R1-R6）

## 来源

- `/retro` 7d 窗口（2026-04-17 → 2026-04-24）：`.context/retros/2026-04-24-1.json`
- `/investigate` 于 2026-04-24 基于 retro 信号做的 latent issue 盘点
- 当前分支：`main`（已发布 v0.1.0）

## 总览

v0.1.0 tests 19/19、build、eval 3/3 全绿，但 investigate 排除了 6 个潜伏问题。本计划按严重度排序，**必须** 走 agent team 实施（见 [agent-team-mandate.md](agent-team-mandate.md)）。

## 修复顺序与优先级

| ID | 严重度 | 主题 | 文件 | 预估改动 |
|----|--------|------|------|---------|
| R1 | 🔴 用户可观察 | Advice 60s 窗口过松 | `src/core/evidence-validator.ts:9` | 2 行 + 1 red test |
| R2 | 🔴 测试盲区 | Eval 覆盖不了 staleness | `scripts/run-evals.ts:23`、`evals/paperclips/cases/` | 1 新 fixture + runner 分支 |
| R3 | 🟡 silent failure | `latestFrameHash` 过早置位 | `src/main/companion-pipeline.ts:40-45` | 行序调整 + 1 red test |
| R4 | 🟡 常量漂移 | `MAX_SCENE_AGE_MS` 双份 | `src/renderer/app.ts:8` | 删常量或共享导入 |
| R5 | 🟡 回归盲区 | 3 个 QA fix 无回归测试 | `tests/unit/*.test.ts` | 补 ISSUE-001 / stdin-close / staleness 3 test |
| R6 | 🟢 契约弱 | `FreshResultGate` 无 reset | `src/core/fresh-result-gate.ts` | 加 `resetScene()` + pipeline 错误路径调用 |

## R1 · Advice 最大年龄解耦

**根因：** fd9bc2a 把 scene 最大年龄 10s → 60s，同时错把 advice 最大年龄也绑定到 60s。advice 生成 <1ms，10s 窗口本是 UI 防陈旧护栏。

**修复：** `DEFAULT_MAX_ADVICE_AGE_MS = 10_000`（解耦 scene）。

**回归测试：** 15s 前生成的 advice → `approveAdvice` 返回 `{ok:false, issues:['advice_stale']}`。

## R2 · Eval 抓 staleness

**根因：** `scripts/run-evals.ts` 用 `now.toISOString()` 覆盖 fixture 的 `capturedAt`，所有 staleness 回归都被屏蔽。

**修复：** 新增 `evals/paperclips/cases/stale-scene.json`（`capturedAt` 提前 90s），runner 尊重 fixture 自带 `capturedAt` 字段，预期 validation fail。

## R3 · captureScene 的 frameHash 置位顺序

**根因：** `companion-pipeline.ts:40-41` 在 VLM 调用之前写 `latestFrameHash`。VLM 抛错后，下次同帧会被误报 `duplicate: true`。

**修复：** hash 写入移到 scene commit 成功后。

**回归测试：** mock VLM 抛错，同帧连续两次 captureScene，第二次不应 duplicate。

## R4 · 常量漂移

**根因：** `src/renderer/app.ts:8` 声明 `MAX_SCENE_AGE_MS = 60_000`，与 `src/core/scene-validator.ts:13` 的 `DEFAULT_MAX_SCENE_AGE_MS` 重复。

**修复：** 删 renderer 常量，或从 `src/shared/` 导出单一来源。

## R5 · 回归测试补齐

| 缺失测试 | 最小覆盖 |
|---------|---------|
| ISSUE-001 source picker 隐藏（9f422bb）| renderer DOM 测试：打开 picker 后点 select → hidden 属性为 true |
| stdin close（55b5d5c）| spawn mock 验证 `stdio[0]='ignore'` |
| staleness 拒收（fd9bc2a）| scene `capturedAt` 超过 60s → validation fail |

## R6 · FreshResultGate reset

**根因：** 捕获 / advice 失败时 `currentSceneId` 不清空，ask(fresh=false) 路径可能接受过期 scene 的 advice。

**修复：** 加 `resetScene()`；`CompanionPipeline` 错误分支调用。

## 验收标准

- 每项 R fix 独立 commit，commit message 含 `fix(Rx):` 前缀
- 每项 R fix 同 commit 含至少 1 个 red→green 回归测试
- `npm test`、`npm run build`、`npm run eval` 全绿
- 按 R1 → R2 → R3 → R5 → R4 → R6 顺序处理；R1/R2 必须先完成
- 合并走 feature branch + `/ship` PR，禁止直推 main

## 超时与回滚

- 任一 R-item 调试超过 3 hypothesis → 触发 investigate 的 3-strike 规则，停止并升级
- 任一 fix 触碰 > 5 文件 → `AskUserQuestion` 汇报 blast radius
- 全量测试红 → 立刻回滚该 commit，不得 `--amend`
