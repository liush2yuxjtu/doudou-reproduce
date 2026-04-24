# R5 · Codex CLI 子进程边界回归测试

## 来源

- `docs/plans/r4-r9-followups.md` 第 34 行 R5 条目（原锚点 `src/main/codex-vision-worker.ts` 不存在）
- `/autoplan` 2026-04-24 review：确认仓库无 `codex-vision-worker.ts`
- Gate 决定：重指 `src/main/openai-vision-client.ts` 的 Codex CLI 边界

## 背景

- 原 plan 写 "ISSUE-001 / stdin-close 回归测试"，锚点文件虚构
- 仓库真实的 Codex CLI spawn 边界在 `src/main/openai-vision-client.ts`：
  - `CODEX_CLI_TIMEOUT_MS = 60_000`（第 13 行）
  - `extractSceneWithCodexCli` / `extractSceneWithCodexCliModel`（第 104-172 附近）
  - `readCodexCliLastMessage`（解析 CLI 输出尾部）
- stdin-close 问题的真实场景：spawn Codex CLI 子进程后，stdin 关闭时机 / 异常退出时的 VLM 响应处理

## 当前状态

- `tests/unit/openai-vision-client.test.ts` 存在
- 无专项 stdin-close / subprocess crash 回归测试
- 无公开的 ISSUE-001 复现链路文档

## 期望状态

- `tests/unit/openai-vision-client.test.ts`（或新 `tests/unit/codex-cli-boundary.test.ts`）含至少 2 条回归：
  1. Codex CLI 子进程 stdin 被关闭 / 提前退出时，`extractSceneWithCodexCli` 返回可理解的错误（非 hang）
  2. CLI 输出末尾消息格式异常时，`readCodexCliLastMessage` 不 crash
- 如发现真实 bug，修复同 commit 附 red→green test

## 前置动作

- **必须先跑** `git log --all --source --since=2026-03-01 -- src/main/openai-vision-client.ts` 找 stdin / CLI 相关历史 fix
- 找不到历史信号 → 降级为"预防性测试"，标记 `preventive` 而非 `regression`
- 若找到旧 ISSUE-001 原始描述（`.context/` 或外部），链进本 plan

## 实施步骤

1. 研究：读 `src/main/openai-vision-client.ts:104-172`（Codex CLI 边界完整函数）
2. 研究：grep 当前测试覆盖，确认无重复
3. 写 red test（预期失败或需要 mock 子进程）：
   - 用 `vi.mock('node:child_process')` mock `spawn`
   - 模拟 stdin 提前关闭 / 子进程以非 0 码退出 / stdout 输出残缺 JSON
   - 断言 `extractSceneWithCodexCli` 返回 `RawPaperclipsScene`（fallback）或抛可读错误
4. 跑 test，确认 red（若当前代码已正确处理则转 green，标记 preventive）
5. 如有 bug，fix 代码（单一方向：不 hang、不 crash、明确错误信号）
6. Green 后跑 `npm run check` 全量

## 文件清单

| 文件 | 改动 |
|------|------|
| `tests/unit/openai-vision-client.test.ts` 或新 `tests/unit/codex-cli-boundary.test.ts` | 加 stdin-close / subprocess-crash 回归 case |
| `src/main/openai-vision-client.ts` | 仅当发现 bug 才改；只改最小路径 |

## 测试增量

- 至少 2 条新 unit test case
- 覆盖：stdin 异常关闭、子进程非 0 退出、stdout 截断
- Mock child_process，不跑真 Codex CLI

## 验收标准

- [ ] 新 test case 独立可跑
- [ ] `npm test` 全绿
- [ ] 如触发 fix：fix + test 同 commit，prefix `fix(R5):` 或 `test(R5):`
- [ ] 如无 fix：单 commit，prefix `test(R5):`，commit message 说明 "preventive, no current bug"

## 执行模式

- Tier 判定：test-only 或 ≤ 2 文件 → A1-A3 tier 化后允许单人
- 建议 teammate：`tdd-guide` agent
- 研究步骤（git log / 原始 issue 查找）建议 `Explore` subagent 协助
- 不强制 `TeamCreate`，但推荐对此项开一个小 team 以保留研究 / 测试 / 可能的 fix 分工

## 回滚

- 测试-only commit：revert 即可
- 如触发 fix：fix 文件单独 revert；保留 test 作为 preventive

## 相关

- /autoplan review: `docs/plans/r4-r9-followups-autoplan-review.md` Section 3B（Eng 双声音关于 R5）
- Codex CLI spawn 代码：`src/main/openai-vision-client.ts:104-172`
