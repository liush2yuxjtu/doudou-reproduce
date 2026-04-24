# 计划实施：Agent Team 强制约束

## 铁律

**本项目任何来自 `docs/plans/` 的计划，实施阶段必须走 agent team，不得由主会话单人顺序写码。**

触发信号：用户说 "实施 R1"、"做 R2"、"按计划修"、"按 docs/plans/xxx 执行"、"开始硬化"、或任何等价指令。

## 必须步骤

1. 读对应计划文件（`docs/plans/{计划}.md`）
2. `TeamCreate` 建立团队，命名 `{scope}-{short}`，如 `post-v010-hardening`
3. `description` 字段写入计划引用，例：`实施 docs/plans/post-v0.1.0-hardening.md R1-R6`
4. 主会话担任 team-lead，通过 `TaskCreate` / `TaskUpdate` 把每个 R-item 拆成任务
5. 为每个 R-item 至少派 1 个 teammate（`Agent` tool，带 `team_name` 与 `name` 参数）
6. 相互独立的 R-item **必须并行** 派发（同一条消息多个 `Agent` 调用）
7. 主会话不直接 `Write` / `Edit` 源码，仅协调、复核、跑全量测试
8. 全部 teammate 完成后主会话做 `/review` 或 `/ship` 并关闭团队

## 推荐团队拓扑

| 角色 | subagent_type | 职责 |
|------|---------------|------|
| team-lead | 主会话 | 分任务、跑全量测试、review、ship |
| fixer-core | `general-purpose` 或 `typescript-reviewer` 辅助 | 写 R1 / R3 / R6 的 `src/core/` `src/main/` fix |
| fixer-eval | `general-purpose` | 写 R2 eval fixture + runner 分支 |
| test-backfiller | `tdd-guide` | 写 R5 三个回归测试，red 先 green 后 |
| cleaner | `refactor-cleaner` | 处理 R4 常量漂移 |
| reviewer | `code-reviewer` / `typescript-reviewer` | 每个 commit 前独立复核 |

## 并行示例（主会话一条消息里发多个 Agent）

```
Agent(fixer-core, "修 R1 advice 窗口解耦 + red test")
Agent(fixer-eval, "修 R2 eval staleness fixture + runner")
Agent(test-backfiller, "补 R5 三条回归测试")
```

R1、R2、R5 相互独立 → 同条消息发出 → 并行跑。R3 依赖 R1 的 test 框架落地 → 串行。

## 禁止项

| 禁止 | 原因 |
|------|------|
| 主会话直接 `Edit` / `Write` 源码实施计划 | 破坏团队分工审计 |
| 单 agent 把多个 R-item 混在一个 commit | 违反原子提交，无法回滚 |
| 忽略 teammate 的失败报告继续推进 | 掩盖 silent failure |
| 不写 regression test 就合并 | 违反计划验收标准 |
| 直推 main（即使绿）| 计划验收要求走 feature branch + PR |

## 例外

- 纯文档类计划（如本文件、INDEX 更新）：可由主会话直写，因只触及 `docs/`
- 单行 typo 修复：免团队，但仍原子 commit
- 紧急安全 fix（CVE 级别）：可单线实施，事后补团队复盘

## 验收

每次实施完成后：

1. `git log --oneline` 检查每个 R-item 对应独立 commit
2. 每 commit 含回归测试新增
3. 主会话汇报：R-item 清单 + teammate 归属 + 测试增量 + build/test/eval 结果
4. 关闭团队：`TeamDelete`
