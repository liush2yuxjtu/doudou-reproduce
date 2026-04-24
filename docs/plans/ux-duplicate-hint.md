# UX · renderer 消费 `duplicate` 字段提示同帧反复失败

## 来源

- 决策 artifact：[r9-framehash-decision.md](r9-framehash-decision.md) `## DECISION` 末段明确「renderer UI 反馈留到 implementation plan 之后的 UX 迭代，非本 R9 范围」
- 前置实施：[r9-impl-b.md](r9-impl-b.md)（已合并入 main；commit `7d3c69a`，Merge PR #3 `145535a`）
- 派发日期：2026-04-24（`chore/ux-trap-docs` branch 基于 main `145535a`）

## 本 plan 性质

**UX 实施计划，不含架构决策。** 目标：让 `duplicate=true` 在 renderer 侧有可见反馈，避免用户对同一失败帧无意识地连点「Ask」。

## 当前状态（main `145535a` grep 实证）

### Pipeline 层（已达标）

`src/main/companion-pipeline.ts:41-68` 成功路径 return `{ frame, scene, duplicate }`；失败路径 `line:58 / line:63` 通过 `Object.assign(new Error(...), { duplicate })` 把字段挂到 error 上。

### IPC 层（丢字段）

- `src/main/main.ts:43` handler `companion:capture-scene` 包 `safeInvoke`
- `src/main/main.ts:50-57` `safeInvoke` 只取 `error.message`，把 `error.duplicate` **丢掉**

```
return { ok: false, error: message };   // duplicate 永远不透传
```

### Preload 层（纯转发）

`src/main/preload.ts:7` `captureScene: () => ipcRenderer.invoke('companion:capture-scene')`，无类型注解、不过滤。

### Renderer 层（0 消费）

- `src/renderer/app.ts:13` `captureScene(): Promise<IpcResult<{ scene: PaperclipsScene }>>`——类型里**没有** `duplicate`
- `src/renderer/app.ts:32` `IpcResult<T>` 失败分支只有 `{ ok: false; error: string }`
- `src/renderer/app.ts:100-106` `ask(fresh)` 捕 `!result.ok` 直接 `renderError(result.error)`，丢 metadata
- `src/renderer/app.ts:175-180` `renderError` 只填 `adviceBody.innerHTML`，无差异化提示

grep `duplicate` 在 `src/renderer/` 与 `src/main/{main,preload}.ts` 的业务引用数：**0**。

## 期望状态

1. `src/shared/types.ts` 新增可复用 IPC 错误载荷类型（见决策点 D2），`duplicate?: boolean` 与 `hint?: string` 作为可选字段
2. `src/main/main.ts` `safeInvoke` 或 `companion:capture-scene` 专用包装读 `error.duplicate`，透传到 `{ ok: false, error, duplicate? }`
3. `src/main/preload.ts` 接口保留透传（IPC 结构体自然传递，无需改 preload 代码，除非补类型注解）
4. `src/renderer/app.ts`：
   - `IpcResult<T>` 失败分支扩 `{ ok: false; error: string; duplicate?: boolean }`
   - `captureScene()` 类型更新为 `Promise<IpcResult<{ scene: PaperclipsScene; duplicate: boolean }>>`（成功路径同时扩）
   - `ask(fresh)` 分支在 `!result.ok && result.duplicate === true` 时走 `renderDuplicateHint(...)` 分支
   - 成功路径若 `result.data.duplicate === true` 亦可走轻量提示（可选，见决策点 D1 scope）
5. 不改 pipeline 语义；不新增 core 模块；不引入第三方库

## 决策点

本 plan 在实施前必须锁三件事，建议默认如下，实施 team 可复核：

### D1 · UI 位置

| 选项 | 说明 | 建议 |
|------|------|------|
| a. Toast（顶栏短时横幅） | 2-4 秒自动消失，不占用 AskResult 面板 | 一次性失败通知常见模式，但项目当前 renderer 无 toast 基础设施 |
| b. AskResult 面板内嵌（`adviceBody` 追加提示行） | 复用 `renderError` 的 DOM 位置 | **推荐**：零新 DOM、最小改动 |
| c. 单独 banner（`status-title` 下方新容器） | 固定区域常驻 | 改 HTML 结构，需要 `src/renderer/index.html` 改动 |

**推荐 b**：复用 `#advice-body`，在 error 内文末尾追加 hint 行；零 HTML 结构改动。

### D2 · 文案草案（≥2 版）

| 强度 | 文案 | 场景 |
|------|------|------|
| 保守 | 「同帧重试中，稍候。」 | 故障可能是临时，鼓励用户等待 |
| 主动 | 「同一画面反复失败，建议切换窗口或调整场景后重试。」 | 故障可能源于画面本身（遮挡、滚动错位等） |

**推荐主动版**：与 r9-decision 的成本治理立意一致，引导用户换画面而非盲目重试；若用户希望更温和，实施 team 可折中为「同一画面已连续失败，可尝试切换窗口。」

### D3 · IpcResult shape

| 选项 | 说明 | 风险 |
|------|------|------|
| a. 扩 failure union：`{ ok: false; error: string; duplicate?: boolean }` | 保持 `error` 字段不变，仅追加可选字段 | **推荐**：向后兼容，未消费者行为不变 |
| b. 新增并列字段：`{ ok: false; error: string; meta: { duplicate: boolean } }` | 为未来扩展留嵌套空间 | 当前没有第二个元字段，属 YAGNI |
| c. error payload 合并：`error: { message: string; duplicate: boolean }` | 把 error 变 object | 破坏现有 `renderError(result.error)` 所有调用点 |

**推荐 a**：加 optional field，单侧消费。成功路径同样从 `{ ok: true, data: { scene } }` 扩到 `{ ok: true, data: { scene, duplicate } }`。

## 文件清单

| 文件 | 改动 |
|------|------|
| `src/shared/types.ts` | （可选）导出 `IpcCaptureError` / `IpcCaptureSuccess` 或 `IpcResult` helper；若不导出，各处就地扩 |
| `src/main/main.ts` | `safeInvoke` 或 `companion:capture-scene` 专包装读 `error.duplicate` 并透传；成功路径 pipeline return 天然含 `duplicate` 不用动 |
| `src/main/preload.ts` | 无代码改动；若项目引入 shared IPC 类型则同步 import |
| `src/renderer/app.ts` | `IpcResult` 类型扩展 + `captureScene` / `ask` 分支消费 + 新函数 `renderDuplicateHint`（或复用 `renderError` 增参数） |

4 个源文件（含 1 个可选），跨 IPC 边界。

## 测试增量

### 必备

1. `tests/unit/main-ipc-safe-invoke.test.ts`（新）或追加到现有 main 层 test：
   - case A：`safeInvoke` 包装的 fn throw `Object.assign(new Error('x'), { duplicate: true })` → 返回 `{ ok: false, error: 'x', duplicate: true }`
   - case B：fn throw 普通 `new Error('y')` → 返回 `{ ok: false, error: 'y', duplicate: undefined }` 或省略 `duplicate` 字段
2. `tests/unit/companion-pipeline.test.ts`（保持现有 4 条不变）

### 可选

3. renderer bundle 层 smoke：`tests/unit/renderer-duplicate-hint.test.ts` 用 jsdom 模拟 `window.companionApi.captureScene` 返回 duplicate=true，断言 `adviceBody` 含预期文案片段——项目当前 renderer 测试少，此 test 可作为 renderer 层首个单测，非强制
4. 手工冒烟：`npm run dev`，选窗口 → 断网或 mock VLM 两次失败 → 第二次点 Ask 应在 `#advice-body` 看到 hint 文案

## 验收标准

- [ ] `npm run check`（test + build + eval）全绿
- [ ] grep `duplicate` 在 `src/main/main.ts` / `src/renderer/app.ts` 至少各 ≥1 业务引用
- [ ] `ask(true)` 在同帧 VLM 连续失败第二次点击时，`#advice-body` 渲染 hint 文案（上文 D2 推荐版）
- [ ] `ask(true)` 正常 happy path 无 hint 文案，无视觉回归
- [ ] `IpcResult<T>` 类型扩展向后兼容（既有消费者可忽略 `duplicate` 编译通过）
- [ ] 新增至少 2 条 main-IPC 层回归 test（duplicate=true / duplicate 缺省）
- [ ] Atomic commit，prefix `feat(ux-duplicate):` 或 `feat(ux):`

## 执行模式

**Tier 判定**：

- 4 文件（`types.ts` 可选则 3）
- **跨 IPC 三层**（main → preload → renderer）语义扩展
- 含类型 union 变更

→ 触发 A1 铁律：必须 `TeamCreate`。

**建议团队拓扑**：

| 角色 | 职责 |
|------|------|
| lead | 协调、跑 `npm run check`、开 PR |
| `typescript-reviewer` | 审 `IpcResult` union 扩展、`safeInvoke` 签名、renderer 类型收窄 |
| `tdd-guide` | Red 先行：main-IPC test 必须先红（当前 `safeInvoke` 丢 duplicate），实施后转绿 |

`TeamCreate description` 模板：`实施 docs/plans/ux-duplicate-hint.md（UX · duplicate 提示）` + 引本文件路径。

## 回滚

- 单 commit revert 完成，IPC shape 是**向后兼容增字段**，反向回退零风险
- 回滚后 pipeline 仍按 r9-impl-b 写 `latestFrameHash`（pipeline 层不动），只是 renderer 重回「无可见 hint」状态

## 与其它 R-item 关系

- 独立，不阻塞 v0.1.0 demo / release
- `tests/unit/companion-pipeline.test.ts` 4 条 R9-B 回归**不变**（pipeline 语义不动）
- 与 R4-R8 已合并子计划无交集

## 相关

- 决策：[r9-framehash-decision.md](r9-framehash-decision.md) `## DECISION`（末段点名本 plan）
- 前置实施：[r9-impl-b.md](r9-impl-b.md)（已合并 `7d3c69a`）
- IPC 源码：`src/main/main.ts:43-57`（`safeInvoke` 丢字段点）、`src/main/preload.ts:7`
- Renderer 源码：`src/renderer/app.ts:13` / `:32` / `:100-106` / `:175-180`
- Pipeline 源码：`src/main/companion-pipeline.ts:41-68`（`duplicate` 字段生产点）
