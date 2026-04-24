# R4 · `MAX_SCENE_AGE_MS` 常量漂移清理

## 来源

- `docs/plans/r4-r9-followups.md` 第 33 行 R4 条目
- `/autoplan` 2026-04-24 review（`docs/plans/r4-r9-followups-autoplan-review.md`）
- Gate 决定：方案 C（选择性保留），R4 必须扩到 `src/renderer/app.ts`

## 当前状态（2026-04-24 main）

`60_000` / `MAX_SCENE_AGE_MS` 常量在 3 处定义：

| 位置 | 变量 | 状态 |
|------|------|------|
| `src/core/scene-validator.ts:13` | `export const DEFAULT_MAX_SCENE_AGE_MS = 60_000` | **source of truth** |
| `src/core/evidence-validator.ts:2` | `import { DEFAULT_MAX_SCENE_AGE_MS }` | 已合规 |
| `src/renderer/app.ts:8` | `const MAX_SCENE_AGE_MS = 60_000` | **独立定义，漂移风险** |

原 `r4-r9-followups.md` 只列前两处，漏 renderer。本 plan 修正。

## 期望状态

- 只保留 `src/core/scene-validator.ts:13` 的 `DEFAULT_MAX_SCENE_AGE_MS` 定义
- `src/renderer/app.ts` 改为 `import { DEFAULT_MAX_SCENE_AGE_MS } from '../core/scene-validator.js'`
- 本地常量 `MAX_SCENE_AGE_MS` 删除
- 所有使用点（`app.ts:152`）替换为 import 来的名字
- `npm test` / `npm run build` / `npm run eval` 全绿

## 风险点

- renderer 跨模块 import core：esbuild bundle 必须接受跨 `src/` 子树引用。当前 `package.json` build 脚本用 `esbuild src/renderer/app.ts --bundle --platform=browser`，bundle 模式会把 import 打进 bundle，应该 OK。实施前先跑一次 `npm run build` 验证。
- renderer 没有 Node 模块解析特权，`.js` 扩展必须写全（项目已用 `.js` 扩展规范）

## 实施步骤

1. 跑基线 `npm run check`（test + build + eval），确认全绿（baseline）
2. 改 `src/renderer/app.ts`：
   - 第 4 行附近的 import 块加 `import { DEFAULT_MAX_SCENE_AGE_MS } from '../core/scene-validator.js';`
   - 删第 8 行 `const MAX_SCENE_AGE_MS = 60_000;`
   - 第 152 行 `askLatest.disabled = scene.ageMs > MAX_SCENE_AGE_MS;` 改名 `DEFAULT_MAX_SCENE_AGE_MS`
3. 跑 `npm run build` 确认 bundle 成功
4. 跑 `npm test` 确认 unit test 不受影响
5. 跑 `npm run eval` 确认 eval 仍绿
6. 手工启动 `npm run dev`，点 "Ask latest" 按钮，确认旧 scene 仍会被 disable（> 60s 逻辑工作）

## 文件清单

| 文件 | 改动 |
|------|------|
| `src/renderer/app.ts` | import + 删本地常量 + 改使用点 |

## 测试增量

- 无新测试文件（bundle 层的常量替换，现有 test 覆盖足够）
- 可选：加 `tests/unit/renderer-constants.test.ts` grep `src/renderer/app.ts` 文本，断言不再出现 `const MAX_SCENE_AGE_MS = 60_000`

## 验收标准

- [ ] `src/renderer/app.ts` 无本地 `MAX_SCENE_AGE_MS` 声明
- [ ] `DEFAULT_MAX_SCENE_AGE_MS` 在整个 src/ 下仅 `scene-validator.ts:13` 一处定义（grep 验证）
- [ ] `npm run check` 全绿
- [ ] 手工冒烟：`npm run dev` → Ask latest 按钮对旧 scene 仍 disable
- [ ] 单一 commit，prefix `fix(R4):` 或 `refactor(R4):`

## 执行模式

- Tier 判定：**1 文件 / 非 test-only / 单 commit** → A1-A3 tier 化后允许单人
- 单人实施：主会话 OR 一个 `general-purpose` teammate
- 不需要 `TeamCreate`

## 回滚

- `git revert <commit>` 即可（单文件、无数据迁移、无 API 变更）
- 任一 check 红 → 立即 revert，不 amend

## 相关

- /autoplan review: `docs/plans/r4-r9-followups-autoplan-review.md` Section 3.1 / 3.2
- Source of truth 定义：`src/core/scene-validator.ts:13`
