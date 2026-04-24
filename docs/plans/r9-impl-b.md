# R9-B · Validation 失败也写 `latestFrameHash`（路线 B 实施）

## 来源

- 决策 artifact：[r9-framehash-decision.md](r9-framehash-decision.md) `## DECISION` 段，2026-04-24 选定路线 B
- 决策者：项目所有者（LiuShiyuMath）

## 范围边界

本 plan 只锁 `companion-pipeline` 语义 + 接口层 `duplicate` 数据透传 + R3 回归测试翻转。**不含** renderer UI 文案 / 提示样式 / 引导换窗口——那属 UX 迭代，单独开 plan。

## 当前状态（main `ab380c7`）

`src/main/companion-pipeline.ts:37-56` `captureScene` 流程：

```
beginCapture → captureFrame → 计算 duplicate → VLM extract
  → validate（失败 throw，不写 hash）
  → commitScene（失败 throw，不写 hash）
  → recordScene + 写 latestFrameHash   ← 仅成功路径
  → return { frame, scene, duplicate }
```

`latestFrameHash` 只在成功路径写入，任何 throw 都不写 → 同帧 VLM 失败后重试 `duplicate=false`。

R3 回归测试 `tests/unit/companion-pipeline.test.ts:49` 断言此行为：VLM throw 后同帧重试 `duplicate === false`。

## 期望状态

1. VLM / validate / commit 任一阶段失败 → **仍写** `latestFrameHash = frame.hash` 后再 throw
2. 同帧重试：`duplicate === true`（pipeline return 或 throw 包装 error 的附加 metadata 里）
3. `tests/unit/companion-pipeline.test.ts:49` 翻转：失败后同帧重试 `duplicate === true`
4. 新增至少 2 条回归：
   - VLM throw 后写 hash 已落地
   - validation throw 后写 hash 已落地
5. IPC 层（`src/main/main.ts` `companion:capture-scene` / `src/main/preload.ts`）保留 `duplicate` 字段在成功 return 中；**失败路径**通过 error 附带 metadata（例如 `error.cause = { duplicate: true }`）或 pipeline 拓展 return 类型（见下决策点）

## 实施决策点（本 plan 内定）

**失败路径如何透传 `duplicate`？** 两选：

| 方案 | 说明 | 倾向 |
|------|------|------|
| B1：throw `AggregateError` 或自定义 `PipelineCaptureError` 带 `duplicate` | 调用方 catch 读 error 属性 | **选 B1** |
| B2：改 return 类型为 `{ scene?, duplicate, error? }` 联合 | 调用方 if (error) {} | 侵入 return shape |

选 **B1**：改 throw 为 `throw Object.assign(new Error(...), { duplicate: true })` 或自定义 class，保持 happy path return shape 不变。

## 文件清单

| 文件 | 改动 |
|------|------|
| `src/main/companion-pipeline.ts` | 拆 try/finally：VLM / validate / commit 失败时先 `this.latestFrameHash = frame.hash`，再 throw 带 `duplicate` 的 error |
| `tests/unit/companion-pipeline.test.ts` | 翻转 line:49；加 2 条 hash-written-on-failure 回归 |
| `src/main/main.ts` | `companion:capture-scene` IPC error 透传 `duplicate` 到 renderer（若 UI 未来消费） |
| （可选）`src/shared/types.ts` | 若需导出 `PipelineCaptureError` 类 |

## 测试增量

1. VLM throw 后 `getLatestFrameHash()` === `frame.hash`（新）
2. Validation throw 后 `getLatestFrameHash()` === `frame.hash`（新）
3. 同帧 VLM 失败重试 `duplicate === true`（**翻转原 R3 test**）
4. 不同帧 VLM 失败重试 `duplicate === false`（保护跨帧正常流）

## 验收标准

- [ ] `src/main/companion-pipeline.ts` VLM / validate / commit 失败路径都写 `latestFrameHash`
- [ ] R3 test 翻转 + 2 条新回归
- [ ] `tests/unit/companion-pipeline.test.ts` 总 test 数 1 → ≥ 4
- [ ] `npm run check` 全绿
- [ ] IPC 层 error 附带 `duplicate` metadata（renderer 可读可忽略）
- [ ] Atomic commit，prefix `feat(R9-B):` 或 `refactor(R9-B):`

## 执行模式

- Tier 判定：≤3 src 文件 + 1 test 文件 → tier 化后允许单人，但因语义反转 + 测试翻转建议开小 team
- 建议团队：lead + `typescript-reviewer` teammate 审错误类型 + `tdd-guide` teammate 写 test-first
- `TeamCreate description`：实施 docs/plans/r9-impl-b.md（路线 B）

## 回滚

- `git revert` 单 commit
- 回滚后 main 行为回到路线 A，R3 test 断言仍成立

## 非阻塞项

- 与 R4/R5/R6/R7/R8 已合并无关，独立实施
- 不阻塞任何 renderer 改动，UX 可在本 plan 合并后另立 plan

## 相关

- 决策：[r9-framehash-decision.md](r9-framehash-decision.md) `## DECISION`
- Pipeline 源码：`src/main/companion-pipeline.ts:37-56`
- R3 回归：`tests/unit/companion-pipeline.test.ts:49`
- IPC 入口：`src/main/main.ts` `companion:capture-scene`
