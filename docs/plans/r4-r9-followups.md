# R4-R9 后续 follow-up 清单

<!-- /autoplan restore: ~/.gstack/projects/doudou_reproduce/main-autoplan-restore-20260424-120228.md -->
<!-- /autoplan review 2026-04-24 APPROVED 方案 C: docs/plans/r4-r9-followups-autoplan-review.md -->
<!-- Gate 决定: R9 降中 / R5 重指 openai-vision-client / A1-A3 tier 化 / R4 扩 renderer。具体待 commit 落地。 -->

本文件收拢 `post-v0.1.0-hardening.md` 之后的 6 条延后项，作为独立计划的占位与总览。每条 R-item 正式动工时，再按需拆单独 `{r-id}-{topic}.md`。

## 来源

- `post-v0.1.0-hardening.md` 原「延后项」：R4-R6
- PR #1 gemini-code-assist review + 主会话 adversarial subagent：R7-R9
- 合并时间：2026-04-24

## 铁律再述

| 编号 | 规则 |
|------|------|
| R1 | 只改 `docs/` 和 `CLAUDE.md` |
| R2 | 每个 `*.md` < 200 行 |
| R3 | 仅用中文 |
| R4 | Write/Edit 后立刻原子 commit |
| R5 | `docs/rules/*.md` 每条需 `claudefast -p` 探针（本文件是 plan 非 rule，不适用） |

## 实施强制约束

| 编号 | 约束 |
|------|------|
| A1 | 实施阶段必须走 `TeamCreate` + 多 teammate，禁主会话单人顺序写码 |
| A2 | `TeamCreate` description 引用具体 R-item ID |
| A3 | 独立 R-item 并行派 teammate |

## 清单

| ID | 主题 | 触发源 | 文件/位置 | 粒度 | 优先级 |
|----|------|--------|-----------|------|--------|
| R4 | `MAX_SCENE_AGE_MS` 常量漂移清理 | 原 hardening plan | `src/core/scene-validator.ts`、`src/core/evidence-validator.ts` | 清理类，单 commit | 低 |
| R5 | ISSUE-001 / stdin-close 回归测试 | 原 hardening plan；QA 历史修复 | `src/main/codex-vision-worker.ts`、`tests/unit/*` | 回归测试，单 commit | 中 |
| R6 | `FreshResultGate` reset 契约 | 原 hardening plan；R3 落地后评估 | `src/core/fresh-result-gate.ts` | 契约优化，视 R9 结论决定 | 中 |
| R7 | `approveAdvice` error token 拆 `advice_stale` / `scene_stale` | gemini review + adversarial 共识 | `src/core/evidence-validator.ts`、调用侧日志 | 可观测性改进，≤ 3 文件 | 中 |
| R8 | `RawPaperclipsScene.capturedAt` 类型契约硬化 + `runEvals` 绝对 `evalDir` | adversarial（R2 引入的松动） | `src/shared/types.ts`、`scripts/run-evals.ts`、`tests/integration/eval-runner.test.ts` | 类型硬化 + 测试路径稳定 | 中 |
| R9 | `validated.ok=false` 场景是否写入 `latestFrameHash` | adversarial（R3 引入的行为变化） | `src/main/companion-pipeline.ts` | 产品侧决策 + 实现 | 高 |

## 每项最小验收

| ID | 最小验收 |
|----|----------|
| R4 | 常量只在一处定义，相关 import 路径统一；`npm test`、`npm run build`、`npm run eval` 全绿 |
| R5 | 新增一条 stdin-close 回归 test，red→green 可复现；不改产品代码或仅小改 |
| R6 | gate reset 路径明确文档化 + 一条新 test；与 R9 结论一致 |
| R7 | `issues` 数组出现 `advice_stale` 与 `scene_stale` 两种 token；上游日志/跳过理由能区分；新增 / 更新测试断言具体 token |
| R8 | `RawPaperclipsScene.capturedAt?: string`（或等价约束）+ fixture schema 校验；`runEvals` 的 `evalDir` 有 import.meta.url 基线；新测试从非根 `cwd` 调用也稳定 |
| R9 | 新增产品决策注释 + 统一处理路径 + 回归 test；能区分 VLM 抛错（当前 R3 行为）、validation 失败、gate stale 三条退出路径 |

## 处理顺序建议

1. R9（高优先级）先定性：决定 validation 失败时的哈希语义
2. R7（中优先级）跟上：token 拆分不影响行为，仅改可观测性
3. R8（中优先级）并行：类型硬化与 runner 稳定独立进行
4. R6 等 R9 结论：gate 契约直接受 R9 决策影响
5. R5、R4 清理类：最后处理，合入 R6 或独立

## 新增正式计划的入口

任一 R-item 正式立项时：

1. 新建 `docs/plans/{rN}-{topic}.md`（例如 `r9-frame-hash-on-validation-fail.md`）
2. 写明：来源、触发代码位置、当前行为、期望行为、实施 teammate 分工、最小验收
3. 更新 `docs/plans/INDEX.md`、本文件、`CLAUDE.md`
4. 单一 commit 含上述新增与更新

## 探针（可选）

本 plan 本身不设 `claudefast -p` 探针；待单独立项后，对应 `docs/rules/*.md` 或 plan 文件按需附带。
