# Trap · Agent Worktree 命名冲突

## 来源

2026-04-24 R4-R8 hardening 实施。主计划为 `docs/plans/r4-r9-followups.md`（派生出 R4-R8 共 5 个子 plan），最终通过 PR #2（merge `ab380c7`）落地。本次实施过程中，因并行 agent team 使用 Agent tool 的 `isolation=worktree` 参数而发生 worktree 路径冲突，导致 teammate 之间互相污染 branch、混合 commit，最终以「舍弃并发、返回主 repo sequential 重做」方式救回。

## 触发信号

未来会话中只要同时出现下列任意两条，就来查本文件：

- 并行 spawn ≥3 个 Agent 同时用 `isolation=worktree`，且未显式传 `name`
- Agent tool auto-generated 的 worktree dir 名基于 agent 角色或 task 关键字（如 `r4-constant-dedup`、`r8-fixture-schema`）
- team 模式下多个 teammate 抢 worktree path（主会话在 spawn 前没 `git worktree add` 预分配）
- 观察到某 teammate 的 worktree 被另一 teammate reuse（`git branch` 名在同一 worktree dir 内切来切去）

## 症状（可验证的具体证据）

- 5 个 teammate 派出后在 `.claude/worktrees/` 下只见 3 个 worktree dir（`r4-constant-dedup`、`r8-fixture-schema`、加一个动态切换 dir）
- `fixer-r4` 的 worktree 在运行中被 `fixer-r6` 接管，内部 branch 从 `worktree-r4-constant-dedup` 切到 `r6-freshresultgate-no-reset-docs` 再切到 `r5-codex-cli-stdin-regression`
- `fixer-r4` 跑 `npm run check` 看到 `evidence-validator.test.ts` 失败（期望 token `advice_stale`、实得 `approval_scene_stale`），该失败并非自己改动引入，而是 R7 改动被误并入 worktree
- 过程中一个中间 commit `3cb669f` 同时含 R7 的 `evidence-validator.ts` 修复与 R5 的 `codex-cli-boundary.test.ts`（116 行新文件），违反 agent team mandate 的「单 teammate 不混多 R-item」铁律
- TaskUpdate 状态与实际 commit 不一致：`fixer-r8` 标 `completed` 但其 worktree 随后被 remove，commit 差点丢失

## 根因

- Agent tool 的 `isolation=worktree` 参数不保证 worktree dir 名在 team 内唯一；auto-name 策略基于 prompt 关键字，天然容易撞同名
- team 模式下多个 teammate 并发 spawn 共享同一 repo，彼此之间对 `.claude/worktrees/` 的写入没有协调锁
- 主会话在 spawn 前没有预先 `git worktree add` N 个固定路径，teammate 的 dir 名完全依赖 Agent tool 自己推断
- 「worktree + 并行」并非通用安全组合：isolation 只在单 agent 维度成立，team 维度反而引入共享状态

## 救援路径（本次实际操作）

1. 发现症状后立刻 shutdown 所有 5 个 teammate
2. 保留 git objects（`git branch -D` 不 GC commit hash，只要知道 hash 就能 cherry-pick）
3. 从各 worktree 的 `git reflog` 找回干净 commit（如 R6 `907297b`、R8 `a851f0c`）
4. 对混合 commit `3cb669f` 做 commit split：拆出 `fix(R7) 153cc60` + `test(R5) fb8909f`，每个 commit 只含一个 R-item
5. 剩下的 R4（`da5a23f`）派单 teammate 在主 repo sequential 完成，不走 worktree
6. 所有 5 个 R-item 最终干净落到 `feat/r4-r8-hardening`，通过 PR #2 merge `ab380c7` 入 main

## 应对建议（未来同场景按优先级试）

1. **首选 · sequential spawn**：主会话在主 repo 顺序派 1 个 teammate 一轮，完成 commit 再派下一个。牺牲并行但零冲突，适合 ≤5 个 R-item 的短批次。
2. **次选 · 预分配 worktree**：主会话先 `git worktree add .claude/worktrees/<item-id> <branch>` 固定 N 个独立 path，在 teammate prompt 里显式写「cd 到 `.claude/worktrees/<item-id>`」，Agent spawn 不用 `isolation=worktree`。
3. **次选 · 依赖链串行**：TaskList 用 `blockedBy` 组依赖链，teammate claim 只能按顺序拿到，自然串行。
4. **不推荐**：Agent `isolation=worktree` + team 并发（本次失败路径），除非未来 Agent tool 提供了 dir-name 预分配 API。

## 校验命令

```
git worktree list                          # 对比 spawn 的 teammate 数，发现 <N 即已撞名
git branch -a                              # 看 auto-gen branch 名是否与已有 branch 冲突
git log --all --oneline <branchX> ^<baseY> # 确认每 branch 只含自己 R-item，不混入他人
git reflog --all | grep -E "moving|merge"  # 如已翻车，从 reflog 找回可 cherry-pick 的 commit
```

## 相关

- PR #2：https://github.com/liush2yuxjtu/doudou-reproduce/pull/2
- 计划索引：`docs/plans/INDEX.md`
- `/autoplan` 审查：`docs/plans/r4-r9-followups-autoplan-review.md`
- Agent team mandate：`docs/plans/agent-team-mandate.md`
