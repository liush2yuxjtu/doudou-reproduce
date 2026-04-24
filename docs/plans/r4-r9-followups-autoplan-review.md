# r4-r9-followups /autoplan 审查报告

> 本文件由 `/autoplan` 于 2026-04-24 对 `docs/plans/r4-r9-followups.md` 做的自动化审查记录。
> 用户明确豁免项目 R2（< 200 行）和 R3（中文独占）规则以容纳完整报告；原 plan 文件内容保持不变，Restore Point 存于 `~/.gstack/projects/doudou_reproduce/main-autoplan-restore-20260424-120228.md`。

## 基本参数

| 项 | 值 |
|----|----|
| 目标 plan | `docs/plans/r4-r9-followups.md`（70 行） |
| 基线 branch | `main` |
| 基线 commit | `db43e4e` |
| UI scope | **否** —— plan 不涉及 UI 视觉/交互决策 |
| DX scope | **否** —— plan 不涉及外部开发者 API/CLI/SDK |
| 跳过阶段 | Phase 2 (Design)、Phase 3.5 (DX) |
| 执行阶段 | Phase 1 (CEO) + Phase 3 (Eng) + Phase 4 (Gate) |

---

## Phase 0 · 上下文盘点

已读文件（仓库当前状态）：

- `src/core/evidence-validator.ts`（R1 落地位）
- `src/core/scene-validator.ts`（产生 `scene_stale` token）
- `src/core/fresh-result-gate.ts`（当前 26 行，**无** `reset()` 方法）
- `src/main/companion-pipeline.ts`（R3 落地位，MockVisionClient 也在此文件）
- `src/main/openai-vision-client.ts`（`CODEX_CLI_TIMEOUT_MS`、`readCodexCliLastMessage` 所在，R5 的真实锚点候选）
- `scripts/run-evals.ts`（R2 落地位）
- `src/shared/types.ts`（`RawPaperclipsScene.capturedAt` 当前**必填**）
- `src/renderer/app.ts`（line 8 有**独立的** `MAX_SCENE_AGE_MS = 60_000`，plan 未覆盖）
- `tests/unit/*`、`tests/integration/*`（现有 9 个测试文件，**无** `codex-vision-worker` 相关测试）
- `docs/plans/post-v0.1.0-hardening.md`、`docs/plans/agent-team-mandate.md`
- `package.json`（`scripts.check` = test + build + eval）

关键事实：

1. **R5 锚定文件不存在。** `src/main/codex-vision-worker.ts` 在仓库中无任何匹配（grep 只命中 r4-r9-followups.md 自身的引用）。`src/main/` 只有 7 个 `.ts` 文件，名字都不沾 `codex-vision-worker`。
2. **R4 漏了第三个漂移点。** grep `MAX_SCENE_AGE_MS|60_000` 命中：
   - `src/core/scene-validator.ts:13` `export const DEFAULT_MAX_SCENE_AGE_MS = 60_000`（source of truth）
   - `src/core/evidence-validator.ts:2` 通过 import 使用（已合规）
   - `src/renderer/app.ts:8` `const MAX_SCENE_AGE_MS = 60_000`（**独立定义，未复用 core 常量**）
3. **R7 语义已部分成立。** `scene_stale` token 已存在于 `scene-validator.ts:62`；但 `evidence-validator.ts:26` 和 `:31` 都 push `advice_stale`——第 31 行是 scene age 判定，应当 push `scene_stale`（现状即 bug，不仅是"拆分"）。
4. **R8 方向反了。** plan 写"类型契约硬化"，acceptance 却写 `capturedAt?: string`（放松必填为可选），这是 relax 不是 harden。
5. **R9 duplicate 字段未被消费。** `captureScene` 返回 `{ frame, scene, duplicate }`，但 `src/renderer/app.ts:14` 的 IPC 类型只接 `{ scene: PaperclipsScene }`——`duplicate` 在 renderer 侧不可见，目前无 user-facing 消费者。R9 "高优先级" 的依据薄弱。
6. **R6 无对象。** `FreshResultGate` 整类只有 `beginCapture` / `canCommitCapture` / `commitScene` / `canCommitAdvice` 4 个方法，**无 `reset()`**。R6 "reset 契约" 实际是"要不要新增一个方法"的状态机设计题。

---

## Phase 1 · CEO Review（策略 + 范围）

### 1A. 前提挑战 Premise Challenge

plan 中被当作既定前提、但可以也应当挑战的点：

| # | 前提 | 挑战 | 初步结论 |
|---|------|------|---------|
| P1 | "R4-R9 值得正式立项继续做" | 项目是产品岗面试 artifact，受众是 Lynksoul 面试官。6 个硬化类 R-item 不改 demo 故事。shipping v0.2 新 UI/第二个 demo target 对受众更有效。 | **弱前提**——需求方未指认 |
| P2 | "R9 是高优先级" | `duplicate` 字段当前未被 renderer 消费。VLM 失败重试的重复检测无用户可见路径。"高"依据薄弱。 | **错误前提**——优先级至少下调为中 |
| P3 | "A1-A3 agent team mandate 对 R4-R9 全适用" | R4（常量 3 处统一）和 R5（加 1 条 test）是单 commit 级别工作，团队协调开销 > 实施开销。mandate 原本为 R1-R3 跨模块重构设计。 | **过度前提**——需要 tier 化 |
| P4 | "R6 等 R9 结论" | R6 是 gate 状态机设计、R9 是 hash 写入时机——代码路径不耦合。依赖关系是伪造的。 | **错误前提** |
| P5 | "R8 是硬化" | acceptance 提出 `capturedAt?: string` 是放松，不是硬化。intent/spec 不一致。 | **矛盾前提** |
| P6 | "R5 有可实施的代码锚点" | 目标文件 `src/main/codex-vision-worker.ts` 不存在。 | **虚构前提** |

**需要用户确认的前提（Gate 拦截）：**
- P1（plan 目的 = 硬化 vs plan 目的 = 交付 demo 故事）—— 用户挑战候选
- P2（R9 是否应当降级）—— 用户挑战候选
- P3（A1-A3 是否 tier 化）—— 用户挑战候选

### 1B. 已有代码杠杆 Leverage Map

每个 R-item 映射到当前 codebase 已存在的杠杆点：

| R-item | 目标子问题 | 已存在的代码 | 杠杆判定 |
|--------|-----------|-------------|---------|
| R4 | 常量去重 | `scene-validator.ts:13` 已 export | 直接 import 即可；renderer/app.ts 需接入 |
| R5 | stdin-close 回归 | **锚点文件不存在**；`openai-vision-client.ts:104-172` 有 Codex CLI spawn 边界 | 需先重新指认锚点 |
| R6 | gate 生命周期 | `FreshResultGate` 26 行，无 reset、无 invalidate | 要么加 API，要么显式文档化"不 reset" |
| R7 | token 语义分离 | `scene-validator.ts:62` 已有 `scene_stale`；`evidence-validator.ts:26/31` 存在 bug 形式的重复使用 | 现状是 bug，非特性请求 |
| R8 | 类型契约 | `types.ts:38-46` `RawPaperclipsScene` 当前全字段必填 | 真正硬化 = 引入独立 fixture schema，生产类型不变 |
| R9 | hash 写入 | `companion-pipeline.ts:40-54` 当前写入在 commit 后 | 改时机是单行移动；但首先要明确 `duplicate` 字段的产品语义 |

### 1C. Dream State 三态快照

```
CURRENT（plan 原样落地后）：
├─ 常量去重完成，但可能漏 renderer → 3 处中剩 1 处漂移
├─ R5 必然卡住，文件不存在
├─ R6/R7 语义混乱，新 token 与旧 token 并存
├─ R8 production type 被放松
├─ R9 决策无 owner，PR 写半年
└─ demo 故事无增量

THIS PLAN（按本审查建议修正后落地）：
├─ R4 扩到 renderer/app.ts，3 处归一
├─ R5 重指 openai-vision-client.ts 的 Codex CLI 边界，或删除
├─ R6 明确选择"无 reset，显式失效靠 beginCapture"并文档化
├─ R7 用 stage-qualified token (approval_scene_stale)
├─ R8 保持 production 必填，另加 fixture schema
├─ R9 降级为 P-low，duplicate 消费者确认前不动
└─ demo 故事仍无增量，但技术债清零

12-MONTH IDEAL（面试导向）：
├─ 第二个 demo target（非 Paperclips）证明泛化能力
├─ VLM 延迟 / 成本指标公开
├─ 显式"本地回退 / CLI / API"三模式切换
├─ 可观测性面板（advice_stale / scene_stale / duplicate 命中率）
└─ 硬化 R-item 作为 hygiene 文档化即可，不作为 milestone
```

**Delta：** 本 plan 即使完全落地，**不推进** 12-month ideal 的前 4 条。它只是清理技术债。

### 1D. 实施方案备选 Implementation Alternatives

| 方案 | 范围 | Effort (human / CC) | Risk | Pro | Con |
|------|------|---------------------|------|-----|-----|
| **A. plan 原样** | R4-R9 全做，A1-A3 mandate 全量 | 1 周 / 2 小时 | 中 R5/R8 阻塞 | 全面 | R5 拦截；R8 方向错；R9 无决策者 |
| **B. 修正后全做** | 按本审查逐条修正后实施 | 3 天 / 1.5 小时 | 低 | 可执行，技术债清零 | 仍不增量 demo 故事 |
| **C. 选择性保留** | 只做 R4 (含 renderer) + R7 (bug fix) + R6 (显式无 reset 文档化)；R5/R8/R9 单独立项或砍掉 | 1 天 / 40 min | 低 | 聚焦真 bug + 可观测性 | 遗漏潜在 R8 fixture pain |
| **D. kill R4-R8 + 只保 R9 决策 artifact** | 全部清单项停，只产出 R9-decision.md 写明两条路线 | 0.5 天 / 20 min | 低 | 专注产品决策 | 技术债不处理 |
| **E. 重定向到 v0.2 新功能** | 关闭 R4-R9 roster；启动第二个 demo target 或延迟指标面板 | 2 周 / 3 小时 | 中 | demo 故事跃迁 | 完全换方向，用户决策前不可做 |

**推荐：C（选择性保留）** —— 真 bug (R7 line 31) 必须修；R4 完成"常量 3 处归一"的原始承诺；R6 一条文档决策即可；R5/R8/R9 降级为独立决策 artifact。

### 1E. 时间维度质询 Temporal Interrogation

- **HOUR 1：** 主会话应当先砍掉 R5/R8 的虚构/错向 acceptance，止血。
- **HOUR 2-3：** R7 line 31 bug fix + test 更新（1 commit），R4 renderer 接入（1 commit）。
- **HOUR 4：** R6 产出决策文档（"显式无 reset，原因：beginCapture 已是有效重置"）。
- **HOUR 5+：** R5 / R8 / R9 各自立项，需要用户或 Lynksoul 方输入。
- **WEEK 2+：** 若 C 方案完成后精力有余，重定向到 v0.2 新功能或面试故事增强。

### 1F. 模式选择

**SELECTIVE EXPANSION** —— 砍一半、留一半、重写一半。本 plan 不值得 FULL_REVIEW 级别的全面实施。

### Phase 1 Step 0.5 · 双声音

#### CLAUDE SUBAGENT（CEO — 策略独立审查）

按 800 字原文返回，核心 6 条发现：

1. **CRITICAL：A1-A3 mandate 对 3 文件任务过度。** R1-R3 跨模块，团队有意义；R4-R9 单侧小修，团队是 net negative。修正：tier 化，`<5 文件 + 单 commit + red→green test` 单人执行。
2. **CRITICAL：R9 定位错——是产品决策，不是 backlog item。** 阻塞 R6。修正：抽出为独立 DECISION.md，命名决策者。
3. **HIGH：6 个不相关项挤一个 doc。** R4/R5 应合并为"cleanup"；R7/R8 应合并为"类型+可观测性"；R9 独立 artifact；R6 依赖 R9 后置。
4. **MEDIUM：面试 framing 缺失。** 纯工程 cleanup 不是产品故事。plan 应写明"为什么面试官关心"。
5. **MEDIUM：优先级通胀（5/6 medium = 无优先级）。** 重排：Must = R9+R7；Should = R8；Nice = R4+R5；Post-R9 = R6。
6. **MEDIUM：R4 acceptance 含糊。** "常量只在一处定义"是 lint 目标不是 acceptance；应写具体"X.ts import Y from Z，无本地重定义"。

#### CODEX（CEO — strategy challenge）

5 条发现（摘要）：

1. **CRITICAL：解决维护者痛点，不是面试官痛点。** `openai-vision-client.ts:13` 有 60s CLI timeout，`app.ts:101` 是阻塞交互；这些才是 demo 故事。**FIX：** 砍 R4-R8，ship 一个 interviewer-visible delta（second demo target / measured latency / guided demo）。
2. **CRITICAL：R5 是 stale backlog theater。** 文件不存在。**FIX：** 立即删 R5；R4 除非能复现现网 bug 否则也删。
3. **HIGH：R9 是假优先级。** 无决策者、无 KPI、无 interviewer scenario。**FIX：** 命名决策者 + 精确写出同帧 validation_fail 的用户规则。
4. **HIGH：R8 mislabeled。** `capturedAt?: string` 是放松契约。**FIX：** 保持必填；在 fixture 边界加 schema。仅当非根 cwd 执行对面试 artifact 重要时才做 evalDir 工作。
5. **MEDIUM：A1-A3 mandate 是 process cosplay。** **FIX：** `<=3 文件 / test-only` 单人；跨模块 / 用户可见才多 agent。

**六个月 regret 场景：** 6 项全落地，demo 仍是单游戏、视觉通用、延迟无度量；面试官记不住任何硬化项。**真正的竞争风险是"雷同"，不是 `advice_stale` token 歧义。**

#### CEO 双声音共识表

```
CEO DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════════════════════
  维度                                      Claude  Codex   共识
  ─────────────────────────────────────────  ──────  ──────  ────────────────
  1. 前提有效？                              N       N       CONFIRMED（两者都认定 R9 前提错）
  2. 这是要解决的正确问题？                   N       N       CONFIRMED（两者都认为 artifact 不进步 demo 故事）
  3. 范围标定正确？                          N       N       CONFIRMED（两者都要求砍 + 合并）
  4. 备选方案充分探索？                       N       N       CONFIRMED（都未探索"kill plan / 换方向"）
  5. 竞争/市场风险覆盖？                      N       N       CONFIRMED（都认为面试故事被忽视）
  6. 六个月轨迹靠谱？                        N       N       CONFIRMED（regret 场景一致：硬化无人记得）
═══════════════════════════════════════════════════════════════════════════════
所有 6 维均 CONFIRMED：两个独立审查都判定 plan 战略前提有问题。
这是 USER CHALLENGE 的强信号——两个模型都建议修改用户的既定方向。
```

### Phase 1 Sections 1-10（核心 review 指标）

#### 1. Problem Definition Review
plan 开头 "收拢 post-v0.1.0-hardening.md 之后的 6 条延后项" —— 问题陈述为"需要一个占位/总览"，而非"需要解决的用户/产品问题"。这是一个 backlog 文档，不是一个 plan。
**决定（Auto P5 explicit）：** 标记为 `backlog-not-plan`，建议拆成"正式立项时"触发的独立 plan 模板，而本文件降格为 `docs/plans/backlog.md`。

#### 2. Requirements Clarity
每个 R-item 都有"主题 / 触发源 / 文件 / 粒度 / 优先级"5 列——结构完整，但：
- R5 文件列虚构 → **CRITICAL**
- R8 粒度列"类型硬化"与 acceptance"可选化"矛盾 → **HIGH**
- R6 粒度列"视 R9 结论决定"是含糊要求 → **MEDIUM**

#### 3. Scope Check
plan 没有 "NOT in scope" 段。所有 R-item 都"可能做"，无截断。**决定（Auto P2 boil lakes + P5 explicit）：** 必须加 "NOT in scope"，至少包含：
- "不做 v0.2 新功能（另立项）"
- "不改 demo UI（另立项）"
- "不改 VLM provider 配置（另立项）"

#### 4. Architectural Soundness
plan 自身不是架构文档，不涉及架构决策。但 R6/R9 合起来暴露 companion-pipeline 的状态机未显式化：什么时候重置、什么时候继承旧 scene、validation fail 的 side effect——当前全靠 throw。这是**真架构债**，plan 没点名。
**决定（Auto P5 explicit）：** 添加 Section：`companion-pipeline 状态机显式化`——把 gate / memory / hash 三个持久状态画出来，R6/R9 基于此设计。

#### 5. Test Plan
plan 每项 "最小验收" 都写 "新 test / 回归 test"，但：
- 无 test 文件清单
- 无 red→green 具体断言
- R5 测试位置不存在
- R7 测试冲突未提（现有 evidence-validator.test.ts 对 `advice_stale` 的双 push 有断言）

**决定（Auto P1 completeness）：** 每个 R-item 必须在立项时补充具体 test 文件路径 + 期望断言。

#### 6. Non-functional Requirements
plan 未提性能 / 内存 / 延迟要求。R9 的 "VLM 重试成本" 是最像 NFR 的关切，但没有数字（每次 VLM 调用多少钱、日均重试次数多少、阈值几分钱）。
**决定（Auto P5 explicit）：** R9 立项时必须附：当前 VLM 单价 / 日均重试估算 / 决策阈值。

#### 7. Risk & Rollback
对比 `post-v0.1.0-hardening.md:95-98` 的"超时与回滚"章节，本 plan **完全缺失**。
**决定（Auto P1 completeness）：** 必须补回滚条款——至少"任一 R item 修改触及 >5 文件触发 AskUserQuestion"、"任一 R item 全量测试红立刻 revert"。

#### 8. Communication & Visibility
plan 无 changelog / release notes / PR 模板引导。
**决定：** 无需 auto-fix——这是 CEO 模式下 SELECTIVE EXPANSION 可容忍的，每个 R-item 立项时自带 commit message 前缀即可。

#### 9. Acceptance Criteria Rigor
已在 Sections 2-5 覆盖。核心发现：R4/R6/R7/R8 的 acceptance 句式太像目标，而非可验证的断言。

#### 10. Dependency Graph
plan lines 51-57 列出顺序建议，但 R6 依赖 R9 是**伪依赖**（见 Phase 0 / 1A）。R4 / R5 / R7 可即时并行。
**决定（Auto P3 pragmatic）：** 重画依赖——

```
R7 (bug fix 独立) ──┐
R4 (含 renderer)   ─┼── 可并行
R6 (显式无 reset)  ─┘
                      ↓
  [R9 决策 artifact] ── 待产品输入，不阻塞上面
                      ↓
  [R8 若确需重写] ── 分成 production + fixture 两 schema
                      ↓
  [R5 先重指锚点或删]
```

### Phase 1 Error & Rescue Registry

| 触发 | 现状 | 期望 rescue | R-item |
|------|------|-------------|--------|
| VLM 抛错（current R3 行为） | `captureScene` throw，hash 未写 | 用户重试，同帧不被标 duplicate——**当前行为 OK** | R9 确认 |
| validation 失败 | throw，hash 未写 | 同上 | R9 确认 |
| gate stale（commitScene 返回 false） | throw "StaleCaptureIgnored" | 丢弃本次，下次 beginCapture 重新开始——**当前行为 OK** | R6 显式化 |
| renderer MAX_SCENE_AGE_MS 独立定义 | UI 可能与 core 不同步 | core / renderer 共用同一常量 | R4 扩展 |
| stdin close（R5 声称的场景） | **现状未知**——文件不存在，不知道要 rescue 什么 | 先找出真实边界 | R5 重指 |

### Phase 1 Failure Modes Registry

| 失效模式 | 检测方式 | 严重度 | 当前覆盖 |
|---------|----------|--------|---------|
| 同帧反复 VLM 失败耗成本 | 需要 VLM 调用成本监控 | 高 | **未覆盖** (R9 想解决但路径错) |
| renderer 常量漂移导致 UI 与 core 不一致 | grep + lint | 中 | **未覆盖** (R4 应扩展) |
| `advice_stale` token 分不清来源 | 日志 token 区分度测试 | 中 | **未覆盖** (R7 应修 bug) |
| fixture `capturedAt` 类型随意导致 eval false pass | fixture schema 校验 | 中 | **未覆盖** (R8 方向需改) |
| gate 状态漂移 (beginCapture 但不 commit) | 状态机 invariant test | 低 | 部分覆盖 (concurrency.test.ts) |

### Phase 1 Completion Summary

| 项 | 结果 |
|----|------|
| 前提挑战 | 6 前提中 4 个被认定错误（P2/P3/P4/P5/P6） |
| 备选方案 | 推荐 C（选择性保留）；用户可选 D/E |
| 双声音共识 | 6/6 维度 CONFIRMED 战略前提有问题 |
| User Challenge 候选 | 3 条（kill plan? 降级 R9? tier A1-A3?） |
| Taste decisions | 2 条（C vs D vs E 方案；R5 删还是重指） |
| Auto 决定 | 10+ 条（见 audit trail） |
| Mandatory outputs | 全部已产出（上方章节） |

---

## Phase 3 · Eng Review（架构 + 测试 + 边界）

### 3A. 范围挑战 Scope Challenge

已在 Phase 0 读完所有相关代码。关键事实：

1. R5 锚点文件不存在——无法按字面实施。
2. R7 的拆分实际是 bug fix——`evidence-validator.ts:31` 现在 push `advice_stale` 在 scene age 判定路径，语义错。
3. R4 第三处漂移在 `src/renderer/app.ts:8`，plan 未覆盖。
4. R8 "硬化" 与 "可选化" 在同一条目里矛盾。
5. R9 的 `duplicate` 字段未被 renderer 消费——plan 优先级依据薄。
6. R6 的 `reset()` 方法不存在，plan 没说加还是不加。

### 3B. Step 0.5 · 双声音

#### CLAUDE SUBAGENT（Eng — 独立审查）

900 字完整报告，核心 7 条：

1. **CRITICAL R5：** 锚点文件不存在——修复建议：移到 `openai-vision-client.ts` 或 `companion-pipeline.ts` 测试。
2. **HIGH R7：** `evidence-validator.ts:31` 当前 push `advice_stale` 实为 bug（应 `scene_stale`）。R7 先作为 bug fix。
3. **HIGH R4：** 三处漂移点，含 `src/renderer/app.ts:8`。需 export + import 修复。
4. **HIGH R8：** plan 写"硬化"实做"放松"，矛盾。需选定方向。
5. **HIGH R9：** 必须决定 `latestFrameHash` 写在 validation 前还是后。推荐**写在前**（line 40 后立刻），同帧重试能 duplicate=true，UI 能告诉用户原因。
6. **MEDIUM R6：** 无 `reset()` 方法，plan 未说加还是不加。建议：加 `reset(): void` + test。
7. **MEDIUM：R6 和 R9 orthogonal**，plan 伪依赖。

**Test 连锁风险：** 改 evidence-validator.ts:31 会破坏现有 `evidence-validator.test.ts` 对双 `advice_stale` 的断言——必须 lockstep 更新。

#### CODEX（Eng — architecture challenge）

5 条发现（中文输出，摘要）：

1. **高 R8：** `capturedAt?: string` 放松生产契约。**FIX：** 保持 `RawPaperclipsScene.capturedAt: string` 必填；单独引入 `EvalCaseRawScene` / fixture schema，允许 fixture 的 `capturedAt` / `captureId` 可选；`runEvals` 在加载时补默认值并校验。
2. **中 R5：** 锚点文件不存在。**FIX：** 重写为针对 `readCodexCliLastMessage` / Codex CLI 子进程边界的回归测试，或先补 issue 复现链路再决定是否保留。
3. **中 R7：** 直接拆 `advice_stale` / `scene_stale` 仍不够（两阶段都会产生 scene_stale 歧义）。**FIX：** 用 stage-qualified token，例 `approval_scene_stale`；或改为结构化错误 `{ stage, code }`。
4. **中 R6：** `reset` 无对象。**FIX：** 先写清状态语义，再决定"明确无 reset"还是新增 `invalidateCurrentScene()` 显式 API。
5. **中 R4 + 低 R9：** R4 漏 renderer/app.ts:8；R9 的 `duplicate` 字段未被 renderer 消费（`app.ts:14` IPC 类型仅接 `{ scene }`），应降级为低。

#### ENG 双声音共识表

```
ENG DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════════════════════
  维度                                  Claude   Codex   共识
  ─────────────────────────────────────  ──────   ──────  ────────────────
  1. 架构合理？（R6 状态机设计）          N        N       CONFIRMED (均要求显式化)
  2. 测试覆盖足够？                      N        N       CONFIRMED (R5 无锚点，R7 lockstep 破)
  3. 性能/成本风险已覆盖？               N        N       CONFIRMED (R9 成本理由薄)
  4. 安全威胁已覆盖？                    N/A      N/A     SKIP (纯内部重构，无外部攻击面)
  5. Error path 处理？                   N        N       CONFIRMED (R9 throw 路径未文档化)
  6. 部署风险可控？                      Y        Y       CONFIRMED (纯重构，可小粒度 revert)
═══════════════════════════════════════════════════════════════════════════════
5/6 CONFIRMED 有问题，1/6 skip。两声音都认为 plan 不足以直接实施。
Codex 独家：R8 应分开 production schema / fixture schema（高价值方案）。
Claude 独家：R7 line 31 是 bug 不是特性（高价值方案）。
```

### 3.1 · Architecture Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                        renderer/app.ts                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ const MAX_SCENE_AGE_MS = 60_000  ← DRIFT (R4 missed)      │ │
│  │ askLatest.disabled = scene.ageMs > MAX_SCENE_AGE_MS       │ │
│  │ 消费 { scene } IPC，不消费 duplicate                       │ │ ← R9 priority evidence
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                           ↑ IPC
┌─────────────────────────────────────────────────────────────────┐
│                         main/main.ts                            │
│    ipcMain.handle('companion:capture-scene', ... pipeline ...)  │
│    ipcMain.handle('companion:ask', ... pipeline ...)            │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                  main/companion-pipeline.ts                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │   private    │  │   private    │  │    private       │     │
│  │  gate: FRG   │  │ memory: SM   │  │ latestFrameHash  │     │
│  │ (状态机 R6)  │  │  (历史)      │  │  (R3 + R9 焦点)  │     │
│  └──────────────┘  └──────────────┘  └──────────────────┘     │
│         │                                    │                 │
│   beginCapture  ──────→  commitScene  ──→ 成功才写 hash         │
│         ↓ 若 VLM throw / validation fail：hash 不变             │
│         ↓ R9 问：这正确吗？                                     │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│   core/scene-validator.ts                                       │
│   export DEFAULT_MAX_SCENE_AGE_MS = 60_000  (source of truth)   │
│   emits: captured_at_invalid, scene_stale, scene_from_future,   │
│          not_paperclips, scene_low_confidence, field_X_unusable │
└─────────────────────────────────────────────────────────────────┘
                           ↑ import
┌─────────────────────────────────────────────────────────────────┐
│   core/evidence-validator.ts                                    │
│   import { DEFAULT_MAX_SCENE_AGE_MS }  (正常 import)            │
│   :26  push 'advice_stale'  (if adviceAge > maxAdviceAge)       │
│   :31  push 'advice_stale'  (if sceneAge > MAX_SCENE)  ← BUG    │ ← R7 focus
│                               (应为 'scene_stale' 或 qualified)  │
└─────────────────────────────────────────────────────────────────┘
```

耦合观察：
- R4 的 drift 真正源头是 renderer 有独立定义，修复要跨 core / renderer 两层——`tsconfig` 可能需要允许 renderer import core，验证一下打包流程（esbuild）是否接受。
- R7 的修复是单点：`evidence-validator.ts:31`。但所有对 `advice_stale` 做断言的测试必须同步更新。
- R6 和 R9 无代码耦合——R6 改 FreshResultGate 类、R9 改 companion-pipeline 的一行。
- R8 的"硬化"正解：production 类型不动，在 fixture 加载边界 (`run-evals.ts:33`) 加 schema 校验。

### 3.2 · Code Quality Findings

| 文件:行 | 问题 | P | 决策 |
|---------|------|---|------|
| `evidence-validator.ts:31` | `scene` age 判定 push `advice_stale` 实为 bug | P4 DRY | R7 重定义为 bug fix，不仅是 token 拆 |
| `renderer/app.ts:8` | 独立 `MAX_SCENE_AGE_MS = 60_000` | P4 DRY | R4 必须扩到 renderer |
| `companion-pipeline.ts:54` | `latestFrameHash` 只在成功路径写 | P5 explicit | R9 决策后明确文档化（无论哪种） |
| `fresh-result-gate.ts` 全类 | 无 reset / invalidate API | P5 explicit | R6 显式选择"无 reset，beginCapture 是有效重置" |
| `run-evals.ts:38` | `fixture.rawScene.capturedAt ?? now.toISOString()` 覆盖缺失值 | P1 completeness | R8 正解：fixture 允许缺失但 runner 补默认值 |
| `types.ts:40` | `capturedAt: string` 必填 | — | **不要改**（plan 方向错） |
| `docs/plans/r4-r9-followups.md:21-27` | 重复 agent-team-mandate.md 的 A1-A3 | P4 DRY | 改为 "见 agent-team-mandate.md" 链接 |

### 3.3 · Test Plan

#### 现有测试文件地图

```
tests/
├── unit/
│   ├── companion-pipeline.test.ts       ← 含 R3 VLM throw 重试 duplicate 测试 (line 49)
│   ├── concurrency.test.ts              ← gate 并发测试 (2 cases)
│   ├── evidence-validator.test.ts       ← advice_stale 断言（R7 改动会破）
│   ├── scene-validator.test.ts          ← scene_stale 已被测
│   ├── policy-engine.test.ts
│   ├── vlm-parser.test.ts
│   ├── vlm-boundary.test.ts
│   ├── openai-vision-client.test.ts     ← R5 真正的家（若保留）
│   └── (NONE named codex-vision-worker)
└── integration/
    └── eval-runner.test.ts              ← R2/R8 改动区
```

#### 每个 R-item 的测试增量（修正后）

| R | 涉及测试文件 | 新断言 | Red→Green |
|---|------------|--------|-----------|
| R4（修正后） | `tests/unit/scene-validator.test.ts`（导出验证），新加 `tests/unit/renderer-constants.test.ts` 或直接合并到 renderer bundle 输出的断言 | renderer `app.ts` 不再自定义 `MAX_SCENE_AGE_MS`；import from core | Red: grep 当前 `app.ts:8` 存在。Green: 移除后 grep 为 0 |
| R5（若保留） | `tests/unit/openai-vision-client.test.ts` 或新 `codex-cli-boundary.test.ts` | mock Codex CLI 子进程 stdin close 时，`extractSceneWithCodexCli` 行为定义 | Red: 先提供一个 reproducer；Green: fix 后测试过 |
| R5（若删） | 无 | 无 | 文档化为"无现网信号，暂不处理" |
| R6（显式无 reset） | 更新 `concurrency.test.ts` | 加一条测试：`beginCapture` 后旧 `currentSceneId` 状态下 `canCommitAdvice` 的预期行为（应为 false 直到下次 commit） | 现状可能已 Green——需验证 |
| R7（bug fix） | 更新 `evidence-validator.test.ts` | scene age 超限时 issues 应含 `scene_stale`（或 stage-qualified）而非 `advice_stale` | Red: 现状测试断言 `advice_stale`，修 fix 后断言应改为 `scene_stale` |
| R8（修正方向后） | `tests/integration/eval-runner.test.ts` + 新 fixture schema test | fixture 缺失 `capturedAt` 时 runner 能补默认值；production `RawPaperclipsScene` 类型不变 | Red: 构造缺 capturedAt 的 fixture；Green: runner 补 now.toISOString 且通过 schema |
| R9（待决策） | `companion-pipeline.test.ts` | 若选"写 hash 在 validation 前"：同帧 VLM 抛错 → 重试 → `duplicate=true`；若选"不写"：保持现状 | 待产品决策 |

#### Test 计划 artifact

完整 test plan 已写入此 review 文件内（本节）。若 R9 立项时选"改写入时机"路线，额外产出 `~/.gstack/projects/doudou_reproduce/r9-test-plan.md`。

### 3.4 · Performance / NFR

- VLM 调用成本：plan 未量化，无法决策 R9 ROI。
- 测试套当前 `npm test`（vitest）、`npm run build`（tsc + esbuild）、`npm run eval`（tsx）三路——每次 R 落地都必须三路全绿。
- R8 在 fixture 路径加 schema 校验会增加 eval 启动开销，但每次全量 < 2s 内可接受。

### Phase 3 Completion Summary

| 项 | 结果 |
|----|------|
| Scope challenge | R5 虚构、R7 bug 未识别、R4 漏 renderer、R8 方向错、R6 无对象、R9 伪依赖 |
| ASCII arch diagram | 已产出 |
| Test diagram + plan | 已产出（3.3 节） |
| Failure modes registry | 5 条（见 Phase 1） |
| 双声音共识 | 5/6 CONFIRMED 有问题 |
| Mandatory outputs | 全部已产出 |

---

## Cross-Phase Themes（跨阶段主题）

| # | 主题 | 出现于 | 共识强度 |
|---|------|--------|---------|
| T1 | plan 解决维护者痛点，不是面试官痛点 | Phase 1 Codex, Claude subagent, Phase 0 | **强** (所有 3 个独立来源) |
| T2 | R5 / R8 / R9 的 acceptance 不可实施 | Phase 1 + Phase 3 两个阶段 4 个独立 voice | **强** |
| T3 | A1-A3 mandate 对 3-file 任务过度 | Phase 1 Codex + Claude subagent | **中** |
| T4 | plan 每项 acceptance 写法太像目标不像断言 | Phase 1 Section 2/9 + Phase 3 Section 3.2 | **中** |
| T5 | plan 缺回滚章节 (对比 post-v0.1.0-hardening 有) | Phase 1 Section 7 独家 | 弱 |

---

## Decision Audit Trail（自动决定清单）

| # | Phase | 决定 | 分类 | 原则 | 理由 | 被拒方案 |
|---|-------|------|-----|------|-----|---------|
| 1 | 0 | 跳过 Phase 2 (Design) | Mechanical | P6 action | plan 不涉及 UI 视觉 / 交互决策 | — |
| 2 | 0 | 跳过 Phase 3.5 (DX) | Mechanical | P6 action | plan 不涉及外部 API/CLI/SDK | — |
| 3 | 1A | P2 前提被挑战（R9 高优先级无依据） | Taste | P5 explicit + P6 action | Codex 验证 `duplicate` 未被 renderer 消费；Claude subagent 无决策者论点 | 保留 R9 高优 |
| 4 | 1A | P3 前提被挑战（A1-A3 对小任务过度） | Taste | P3 pragmatic | 双声音共识，R1-R3 本是跨模块才需要 team | 保留 mandate 不 tier 化 |
| 5 | 1A | P4 前提被挑战（R6 依赖 R9） | Mechanical | P5 explicit | 代码路径正交，伪依赖 | 保留原依赖 |
| 6 | 1A | P5 前提被挑战（R8 方向错） | Mechanical | P5 explicit + P1 completeness | acceptance 写 `capturedAt?: string` 与 "硬化" 矛盾；Codex 给出正解 | 保留 acceptance 原文 |
| 7 | 1A | P6 前提被挑战（R5 锚点不存在） | Mechanical | P5 explicit | grep 确认仓库无该文件 | 保留 R5 原锚点 |
| 8 | 1D | 推荐方案 C（选择性保留） | Taste | P3 pragmatic + P5 explicit | D/E 需要用户确认；C 覆盖真 bug + 原始承诺 | A/B/D/E |
| 9 | 1-7 | 加"超时与回滚"章节 | Mechanical | P1 completeness | post-v0.1.0-hardening 已有模板 | 不加 |
| 10 | 1-3 | 加"NOT in scope"段 | Mechanical | P2 boil lakes | CEO/Eng 都要求 | 不加 |
| 11 | 1-10 | 依赖图重画 | Mechanical | P3 pragmatic | R6/R9 正交；R7 独立；R4 独立 | 保留 plan 原依赖 |
| 12 | 3-3.2 | R7 重定义为 bug fix（非特性） | Mechanical | P5 explicit | `evidence-validator.ts:31` push token 语义错 | 保留原拆分框架 |
| 13 | 3-3.2 | R8 正解：production schema 不动 + fixture schema | Mechanical | P1 completeness + P5 explicit | Codex 提出；本审查验证代码匹配 | 保留 `capturedAt?: string` |
| 14 | 3-3.2 | R6 推荐"显式无 reset" | Taste | P5 explicit | 更简单；beginCapture 自然是有效重置 | 加 `invalidateCurrentScene()` API |
| 15 | 3-3.3 | 不新建单独 test plan artifact，并入本 review | Mechanical | P3 pragmatic | 本文件已 > 400 行，再拆多文件无益 | 外部 artifact |

---

## Phase 4 · 最终审批 Gate

### USER CHALLENGES（双模型都建议修改用户既定方向）

三条 User Challenge（非 auto 决定——必须用户确认）：

**Challenge 1：是否 kill plan、换 v0.2 新功能？**
- 您说：r4-r9-followups 需要正式立项继续做
- 两模型都建议：砍 R4-R8，ship interviewer-visible delta（第二个 demo / 延迟指标 / guided mode）
- 原因：artifact 受众是 Lynksoul 面试官，hardening items 不进步 demo 故事
- 我们可能忽视的：您对该项目是否已确定"v0.1 完结、v0.2 立项"的产品节奏；面试时间表；目标职位对 engineering rigor 的具体期望
- 若模型错了，代价：错失一次 demo 故事跃迁机会
- **这是战略偏好差异，非安全/可行性风险。**

**Challenge 2：R9 是否降级？**
- 您说：R9 高优先级（plan line 38）
- 两模型都建议：降为中/低——`duplicate` 字段未被 renderer 消费，高优依据薄
- 原因：renderer/app.ts:14 的 IPC 类型只接 `{ scene: PaperclipsScene }`，`duplicate` 在 UI 侧不可见
- 我们可能忽视的：您是否计划后续给 `duplicate` 添加 UI 消费路径；VLM 单价敏感度
- 若模型错了，代价：R9 比实际更重要、等后面卡住
- **这是技术判断，基于代码可观察事实。**

**Challenge 3：A1-A3 mandate 是否 tier 化？**
- 您说：所有 R4-R9 实施必须走 agent team（mandate A1-A3）
- 两模型都建议：tier 化，`<=5 文件 / test-only` 单人执行
- 原因：R4（3 处常量）和 R5（加 1 test）团队协调开销 > 实施开销
- 我们可能忽视的：您设立 mandate 的治理初衷（审计 / 节奏 / 防止主会话冲动）
- 若模型错了，代价：单人执行破坏原有审计流程
- **这是流程偏好，您的原始治理意图权重更高。**

### 您的选择（Taste Decisions）

**选 1：方案路线（C / D / E）**
- 我推荐 C（选择性保留：R4 含 renderer + R7 bug fix + R6 显式文档化；R5/R8/R9 独立立项）——P3 pragmatic
- 但 D（只产 R9 decision artifact，全停其他）也合理：
  - 下游影响：技术债不处理，专注产品决策
- 或 E（重定向 v0.2）：
  - 下游影响：完全换方向，需要您对 Lynksoul 面试节奏明确

**选 2：R5 处理（删 / 重指 `openai-vision-client.ts` / 保留待重查）**
- 我推荐 **重指** `openai-vision-client.ts` 的 Codex CLI 边界测试 —— P5 explicit
- 但 **删** 也合理：
  - 下游影响：若确实有 stdin-close 历史 issue，会被遗忘

### 自动决定 15 条

见上方 Decision Audit Trail。

### Review Scores

- CEO：6 维度全 CONFIRMED 有问题；推荐砍 R9 优先、抽 R5 为 bug、拆 R8 schema
- CEO Voices：Codex（5 findings，2 critical）+ Claude subagent（6 findings，2 critical）；6/6 共识
- Design：**skipped**（no UI scope）
- Eng：5 维度 CONFIRMED 有问题，1/6 skip（无安全面）；R7 是 bug、R8 方向错、R4 漏 renderer
- Eng Voices：Codex（5 findings）+ Claude subagent（7 findings）；5/6 共识

### Cross-Phase Themes

T1-T5 见上方 Cross-Phase 节。T1（维护者痛点 vs 面试官痛点）在 CEO + Eng 两阶段、3 个独立来源都命中——最强信号。

### Deferred to TODOS.md（建议追加）

```
TODO(R4+renderer): src/renderer/app.ts:8 应 import DEFAULT_MAX_SCENE_AGE_MS 而非本地定义
TODO(R5-dead-anchor): docs/plans/r4-r9-followups.md 引用的 src/main/codex-vision-worker.ts 不存在——决定删或重指
TODO(R7-bug): src/core/evidence-validator.ts:31 当前 push 'advice_stale' 在 scene age 路径，应为 'scene_stale' 或 stage-qualified token
TODO(R8-direction): 若要做 R8，保持 types.ts capturedAt 必填，另加 fixture schema
TODO(R9-decision): 命名决策者，写出 validation_fail 同帧用户规则；先验证 duplicate 字段的 UI 消费路径
TODO(R6-contract): 决定 FreshResultGate 是否加 reset / invalidateCurrentScene API，或显式文档化"无 reset"
TODO(plan-rollback): 本 plan 补"超时与回滚"章节，参照 post-v0.1.0-hardening.md:95-98
TODO(mandate-tier): A1-A3 补 tier 阈值，<=3 文件 test-only 单人执行
```

---

## 用户最终决定（2026-04-24 Gate）

| 决定 | 选择 | 影响 |
|------|------|------|
| 方案路线 | **C 选择性保留** | R4 含 renderer / R7 bug fix / R6 显式文档化 三项做；R5/R8/R9 独立立项 |
| R9 优先级 | **降为中** | 先验证 `duplicate` UI 消费路径，再评优先级；不阻塞 R6 |
| A1-A3 mandate | **tier 化** | `<=3 文件 / test-only / 单 commit` 单人执行；跨模块 / 用户可见继续团队 |
| R5 处理 | **重指 `src/main/openai-vision-client.ts` 边界** | R5 锚点改为 `readCodexCliLastMessage` / Codex CLI 子进程回归测试 |

## 下一步落地清单

| # | 动作 | 责任 | 产出 |
|---|------|------|------|
| 1 | 更新 `docs/plans/r4-r9-followups.md`：R9 优先级 高→中；R5 锚点改 openai-vision-client.ts；A1-A3 段加 tier 阈值；R4 目标列加 `src/renderer/app.ts` | 主会话（单文件 docs 编辑，tier 允许单人） | 新 commit: `docs(plans): adopt /autoplan review decisions for r4-r9` |
| 2 | R8 / R9 各自新建 `docs/plans/r8-fixture-schema.md` 与 `docs/plans/r9-framehash-decision.md`（用户确认立项后触发） | 待用户指令 | 新 plan 文件 |
| 3 | R7 bug fix（`evidence-validator.ts:31` push `scene_stale`）+ test 同步 | tier 允许单人 | 1 commit |
| 4 | R4 常量合并（renderer import core 的 `DEFAULT_MAX_SCENE_AGE_MS`） | tier 允许单人 | 1 commit |
| 5 | R6 显式无 reset 决策文档化（加入 `FreshResultGate` JSDoc + 1 条 concurrency test） | tier 允许单人 | 1 commit |

**状态：APPROVED（方案 C）。后续按"下一步落地清单"推进。**
