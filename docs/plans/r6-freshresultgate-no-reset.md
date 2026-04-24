# R6 · `FreshResultGate` 显式无 reset 契约

## 来源

- `docs/plans/r4-r9-followups.md` 第 35 行 R6 条目（"reset 契约"）
- `/autoplan` 2026-04-24 review：`FreshResultGate` 无 `reset()` 方法，plan 未说加还是不加
- Gate 决定：选方案 C，显式无 reset 文档化（不新增 API）

## 当前状态

```
src/core/fresh-result-gate.ts (26 行)
├─ private latestCaptureId = 0
├─ private currentSceneId: string | null = null
├─ beginCapture()       ← 递增 latestCaptureId
├─ canCommitCapture()   ← 比较 captureId
├─ commitScene()        ← 成功则写 currentSceneId
└─ canCommitAdvice()    ← 比较 sceneId
```

- **无** `reset()` / `invalidate()` 方法
- `tests/unit/concurrency.test.ts` 覆盖 2 个并发 case，未测 "reset" 语义

## 语义决策（本 plan 选定）

**显式无 reset。** 理由：

- 每次 `beginCapture()` 递增 `latestCaptureId` → 旧的 capture 自动失效
- `currentSceneId` 在 `commitScene` 成功时被覆盖 → 新 scene 自动接管
- 失败 / 中断的 capture 不写 `currentSceneId` → gate 保持在"等新 capture"状态
- 新增 `reset()` 方法会引入并发窗口（reset 与 beginCapture 竞态）

即：**`beginCapture()` 是唯一的"重置"语义，不需要单独 API**。

## 期望状态

- `src/core/fresh-result-gate.ts` 类级 JSDoc 明确说明上述语义
- 每个方法补短 JSDoc 说状态变迁
- `tests/unit/concurrency.test.ts` 加一条 test：
  - 连续调用 `beginCapture` 后，旧 captureId 再 `commitScene` 必须返回 false
  - 失败 commit 后，`canCommitAdvice` 对旧 sceneId 表现已文档化
- 源码行为**不变**，只加文档 + 测试

## 实施步骤

1. 读 `src/core/fresh-result-gate.ts` 全文
2. 读 `tests/unit/concurrency.test.ts` 现有 case
3. 在 `FreshResultGate` 类上方加 JSDoc 块：
   - 说明"无显式 reset"原因
   - 列出状态变迁：capture 序号单调递增 / scene id 单调覆盖
   - 说明失败路径：何时回到 null / 何时保持旧值
4. 每个 public 方法加 1 行 JSDoc
5. 加新 test case "`beginCapture` invalidates earlier captures"（可能已隐式覆盖，需显式化）
6. 跑 `npm run check` 全绿

## 文件清单

| 文件 | 改动 |
|------|------|
| `src/core/fresh-result-gate.ts` | 加 JSDoc，无行为变更 |
| `tests/unit/concurrency.test.ts` | 加 1-2 条 test case |

## 测试增量

- 新 test 1：连续 `beginCapture()` 后，用最早的 captureId 调 `commitScene` → 返回 false
- 新 test 2：`commitScene` 成功后，`canCommitAdvice(scene_id)` → true；再 `beginCapture` 一次，相同 sceneId 查询应仍 true（因 currentSceneId 未变）—— 文档化此行为

## 验收标准

- [ ] 类级 JSDoc 明确说"无 reset API，beginCapture 即重置"
- [ ] 每个 public 方法有 JSDoc
- [ ] 新增 ≥ 1 条 concurrency test case
- [ ] `npm run check` 全绿
- [ ] 单一 commit，prefix `docs(R6):` 或 `refactor(R6):`（因只改注释 + 测试）

## 执行模式

- Tier 判定：2 文件 / 文档 + test / 单 commit → tier 化后允许单人
- 建议主会话直接写（文档 + test 组合，不需要 teammate 分工）
- 不需要 `TeamCreate`

## 与 R9 的解耦

- 原 plan 说 "R6 等 R9 结论"——**伪依赖**
- R6 改 FreshResultGate 文档；R9 改 companion-pipeline 的 hash 写入时机
- 代码路径不相交，本 plan 独立落地
- R9 未来选任意方案都不影响本 plan 的决策

## 回滚

- 纯文档 + test 改动 → `git revert` 零风险

## 相关

- /autoplan review: Section 1A（P4 前提被挑战：R6/R9 正交）+ Section 3B
- 源码：`src/core/fresh-result-gate.ts`
