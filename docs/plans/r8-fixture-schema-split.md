# R8 · Fixture schema 独立化（production 类型保持必填）

## 来源

- `docs/plans/r4-r9-followups.md` 第 37 行 R8 条目
- `/autoplan` 2026-04-24 review：原 acceptance `capturedAt?: string` 是**放松生产契约**，与"硬化"矛盾
- Gate 决定：方案 C，R8 作为独立立项（本 plan）

## 问题陈述

原 acceptance 自相矛盾：

- 意图写"类型契约硬化"
- 实做"`RawPaperclipsScene.capturedAt?: string`"= 把必填改可选

把生产 API 输入类型改可选，等于所有调用者都要处理 `undefined`——这是**放松**契约，下游 null-check 负担↑。

## 正确方向（Codex 提出）

**分离 production schema 和 fixture schema：**

| Schema | 文件 | `capturedAt` / `captureId` | 用途 |
|--------|------|---------------------------|------|
| `RawPaperclipsScene` | `src/shared/types.ts` | 必填 | 生产 VLM 输入 / IPC |
| `EvalCaseRawScene`（新） | `src/shared/types.ts` 或 `scripts/eval-types.ts` | 可选 | 测试 fixture 加载时 |

`runEvals` 在加载 fixture 时：

1. 读 `EvalCaseRawScene`（宽松）
2. 若字段缺失，runner 补默认值（`captureId = index + 1`、`capturedAt = now.toISOString()`）
3. 校验后转为 `RawPaperclipsScene`（严格）
4. 下游 validator / advisor 只见严格类型

额外：`evalDir` 用 `import.meta.url` 基线，非根 `cwd` 调用仍稳定（原 plan 正确点保留）。

## 当前状态

`src/shared/types.ts:38-46`：

```typescript
export interface RawPaperclipsScene {
  captureId: number;          // 必填
  capturedAt: string;          // 必填
  isPaperclips: boolean;
  confidence: number;
  fields: PaperclipsFields;
  unknowns: string[];
  notes: string[];
}
```

`scripts/run-evals.ts:33-39`：

```typescript
const fixture = JSON.parse(readFileSync(join(evalDir, file), 'utf8')) as EvalCase;
const rawScene: RawPaperclipsScene = {
  ...fixture.rawScene,
  captureId: index + 1,
  capturedAt: fixture.rawScene.capturedAt ?? now.toISOString()   // 当前用 ??
};
```

`run-evals.ts` 已经**隐式**允许 fixture 缺 `capturedAt`（用 `??` fallback），但类型断言 `as EvalCase` 欺骗编译器。

## 期望状态

1. `src/shared/types.ts` 新增 `EvalCaseRawScene`：`RawPaperclipsScene` 所有字段保留，但 `captureId` 和 `capturedAt` 标 optional
2. `scripts/run-evals.ts`：
   - `EvalCase.rawScene` 类型改 `EvalCaseRawScene`
   - 加载后显式补默认值 → 构造严格 `RawPaperclipsScene`
   - 加 runtime schema 校验（至少 `isPaperclips` / `confidence` / `fields` 非空）
3. `evalDir` 默认值用 `import.meta.url` 基线：
   - `const defaultEvalDir = fileURLToPath(new URL('../evals/paperclips/cases', import.meta.url));`
   - 调用侧传 `options.evalDir` 优先
4. 新 test：从非根 `cwd` 跑 runner 仍绿

## 实施步骤

1. 基线 `npm run check` 绿
2. 改 `src/shared/types.ts`：加 `EvalCaseRawScene` 类型
3. 改 `scripts/run-evals.ts`：
   - 导入 `EvalCaseRawScene`、`fileURLToPath`
   - `evalDir` 改 `import.meta.url` 派生
   - fixture 加载路径显式补默认值
   - 加 schema 校验（简单 typeof / Array.isArray 断言）
4. 改 `tests/integration/eval-runner.test.ts`：
   - 加 test：从非根 `cwd` 跑（用 `process.chdir` 或独立 helper）
   - 加 test：fixture 缺 `capturedAt` → runner 补默认后通过
   - 加 test：fixture 字段类型错 → runner 抛清晰错误
5. `npm run check` 全绿

## 文件清单

| 文件 | 改动 |
|------|------|
| `src/shared/types.ts` | 加 `EvalCaseRawScene` 类型，`RawPaperclipsScene` 保持必填 |
| `scripts/run-evals.ts` | `evalDir` 改 import.meta.url 基线 + fixture 校验 |
| `tests/integration/eval-runner.test.ts` | 加 3 条 test case |

## 测试增量

- test: 非根 cwd 调用 `runEvals` 仍绿
- test: fixture 缺 `capturedAt` → runner 补默认 → PASS
- test: fixture 缺 `isPaperclips` → runner 抛可读错误（非 crash）
- test: production `RawPaperclipsScene` 类型仍拒绝 missing `capturedAt`（编译期验证——用 `@ts-expect-error` 标注）

## 验收标准

- [ ] `RawPaperclipsScene.capturedAt` / `captureId` 仍必填
- [ ] `EvalCaseRawScene` 新类型存在，`capturedAt?` / `captureId?`
- [ ] `scripts/run-evals.ts` 用 `import.meta.url` 派生 evalDir
- [ ] 新 fixture schema 校验步骤
- [ ] 新 3 条 integration test
- [ ] `npm run check` 全绿
- [ ] 单一 commit，prefix `refactor(R8):` 或 `feat(R8):`

## 执行模式

- Tier 判定：3 文件 / 跨 src + scripts + tests → **需要 TeamCreate**（tier 化后仍 ≥ 3 文件 + 类型跨模块）
- 建议团队：
  - lead = 主会话
  - `typescript-reviewer` teammate：审类型分离与 schema 校验
  - `tdd-guide` teammate：写 3 条 integration test
- `TeamCreate description`: "实施 docs/plans/r8-fixture-schema-split.md"

## 回滚

- 3 文件改动 → 可 `git revert` 单 commit
- 若生产 `RawPaperclipsScene` 意外被放松 → 立刻回滚
- test 新增可单独保留（即使 src 回滚）

## 与其他 R-item 关系

- 与 R4（常量去重）独立
- 与 R7（token 修复）独立
- 与 R9（hash 写入时机）独立

## 相关

- /autoplan review: Section 3B（Codex 建议 EvalCaseRawScene）
- 当前 runner 隐式 fallback 位置：`scripts/run-evals.ts:38`
- 类型源：`src/shared/types.ts:38-46`
