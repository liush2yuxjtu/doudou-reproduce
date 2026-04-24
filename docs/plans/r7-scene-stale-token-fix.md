# R7 · `scene_stale` token 修复（bug fix，非特性）

## 来源

- `docs/plans/r4-r9-followups.md` 第 36 行 R7 条目（"拆 `advice_stale` / `scene_stale`"）
- `/autoplan` 2026-04-24 review：**R7 实为 bug fix**——`evidence-validator.ts:31` 当前 push `advice_stale` 在 scene age 判定路径，语义错
- Gate 决定：方案 C 包含 R7（先做）

## 当前 bug

`src/core/evidence-validator.ts:22-32` 现状：

```typescript
const adviceAgeMs = now.getTime() - Date.parse(advice.createdAt);
if (!Number.isFinite(adviceAgeMs) || adviceAgeMs > maxAdviceAgeMs) {
  issues.push('advice_stale');        // :26 — 建议年龄超限
}

const sceneAgeMs = now.getTime() - Date.parse(scene.capturedAt);
if (!Number.isFinite(sceneAgeMs) || sceneAgeMs > DEFAULT_MAX_SCENE_AGE_MS) {
  issues.push('advice_stale');        // :31 — 场景年龄超限，但 push 同 token 【BUG】
}
```

两条不同判定路径 push 同一个 token。调用侧无法区分"建议自身过期"vs"基础场景过期"。

对照：`src/core/scene-validator.ts:62` 已有独立的 `scene_stale` token（在 scene validation 阶段使用）。

## 命名歧义风险

直接把 `:31` 改成 push `scene_stale`：**歧义**。因为 `scene_stale` 在两个阶段都能产生：

- Stage 1: `validatePaperclipsScene` 输出（scene 创建时就旧）
- Stage 2: `approveAdvice` 内部重新判定（advice 生成到现在又超限）

日志看到 `scene_stale` 无法分辨来源。

## 本 plan 决策（Codex 建议）

使用 **stage-qualified token**：

| 原判定 | 新 token |
|--------|---------|
| `evidence-validator.ts:26` advice 年龄超限 | `advice_stale`（保持） |
| `evidence-validator.ts:31` scene 年龄在 approval 阶段超限 | `approval_scene_stale`（新） |
| `scene-validator.ts:62` scene 年龄在 validation 阶段超限 | `scene_stale`（保持） |

## 期望状态

- `evidence-validator.ts:31` push `'approval_scene_stale'` 而非 `'advice_stale'`
- `evidence-validator.test.ts` 更新：两种超限条件分别断言不同 token
- 上层调用（`companion-pipeline.ts:67` `AdviceBlocked: ${approved.issues.join(', ')}`）自动受益，错误 message 带具体来源

## 实施步骤

1. 跑基线 `npm run check` 绿
2. 改 `src/core/evidence-validator.ts:31`：`'advice_stale'` → `'approval_scene_stale'`
3. 改 `tests/unit/evidence-validator.test.ts`：
   - 找 scene age 超限的 test case
   - 改期望 `issues` 数组断言含 `approval_scene_stale`
   - 新增一条 test：advice 年龄与 scene 年龄**都**超限时，issues 同时含 `advice_stale` 和 `approval_scene_stale`
4. 跑 `npm run check` 全绿
5. grep 全项目确保无其他地方硬编码 `advice_stale` 期望它代表 scene age（预期 0 结果）

## 文件清单

| 文件 | 改动 |
|------|------|
| `src/core/evidence-validator.ts` | 1 行：line 31 token 更换 |
| `tests/unit/evidence-validator.test.ts` | 改 1-2 条断言 + 加 1 条新 test |

## 测试增量

- 修正现有 test：scene age 超限的 case 期望 `approval_scene_stale`
- 新 case：advice + scene 同时超限 → issues 含两个独立 token
- 新 case：只 advice 超限 → issues 仅含 `advice_stale`（保护原行为）
- 新 case：只 scene 超限 → issues 仅含 `approval_scene_stale`

## 验收标准

- [ ] `src/core/evidence-validator.ts:31` push `approval_scene_stale`
- [ ] `tests/unit/evidence-validator.test.ts` 有 4 条断言覆盖：两超限 / 单 advice 超限 / 单 scene 超限 / 无超限
- [ ] grep `'advice_stale'` 全仓库：只出现在 advice-age 判定位 + 对应 test
- [ ] `npm run check` 全绿
- [ ] 单一 commit，prefix `fix(R7):`，message 点名 "bug fix, not feature split"

## 执行模式

- Tier 判定：2 文件（1 src + 1 test）/ 单 commit → tier 化后允许单人
- 建议主会话或 `tdd-guide` teammate
- 不需要 `TeamCreate`

## 回滚

- `git revert` 零风险
- Test 和代码变更捆绑在一个 commit → revert 同进同退

## 上游影响

- 消费方：目前只有 `src/main/companion-pipeline.ts:67` throw message
- 无 renderer 消费（`AdviceBlocked: *` error 字符串透传到 UI）
- 不影响 UI 行为，只提升日志 / 错误信息可读性

## 相关

- /autoplan review: Section 3.2（code quality findings R7）
- Codex 建议 stage-qualified token 形式
- 源码：`src/core/evidence-validator.ts:22-32`
