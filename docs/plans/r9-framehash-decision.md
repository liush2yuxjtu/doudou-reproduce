# R9 · `latestFrameHash` 在 validation 失败时写入策略 · DECISION

## 来源

- `docs/plans/r4-r9-followups.md` 第 38 行 R9 条目
- `/autoplan` 2026-04-24 review：R9 原标"高优先级"依据薄（`duplicate` 字段未被 renderer 消费）
- Gate 决定：R9 降为中，先做 decision artifact 再评优先级

## 本 plan 性质

**决策文档，非实施任务。** 产出 `DECISION` 段 + 验证前置条件。实施留待决策后单独立项。

## 前置事实

1. `src/main/companion-pipeline.ts:37-56` `captureScene` 流程：
   ```
   beginCapture → captureFrame → 计算 duplicate → VLM extract
     → validate
       → 若失败 throw
     → commitScene（可能失败 throw）
     → recordScene + 写 latestFrameHash   ← line 54
     → return { frame, scene, duplicate }
   ```
2. `latestFrameHash` **只在成功路径写入**。任何 throw 点都不写。
3. 同帧 VLM 失败后重试：`frame.hash === latestFrameHash` 比较时 `latestFrameHash === null`（或上一次成功的 hash）→ `duplicate = false`
4. **`duplicate` 字段消费情况：**
   - `src/main/main.ts:43` IPC handler `companion:capture-scene` 透传整个 return
   - `src/renderer/app.ts:14` IPC 类型声明：`Promise<IpcResult<{ scene: PaperclipsScene }>>` —— **没有 `duplicate`**
   - renderer 实际不消费 `duplicate` 字段
5. 已存在回归测试 `tests/unit/companion-pipeline.test.ts:49`：VLM throw 后同帧重试 `duplicate === false`（protect 当前 R3 行为）

## 两条产品路线

### 路线 A：保持当前（validation 失败不写 hash）

**语义：** VLM 失败的帧被视为"从未成功处理过"，允许无条件重试。

**优点：**
- 自动恢复：临时故障后重试立即被当"新帧"处理
- 代码简单：只保留一条 hash 写入点
- 测试覆盖已存在（R3 回归）

**缺点：**
- 成本：恶劣情况下同一帧反复打 VLM（每次 $$）
- 无可见性：用户看不到"同一帧又失败了"，只看到 error

### 路线 B：validation 失败也写 hash（提前到 line 40 之后）

**语义：** VLM 失败的帧被"占位"，同帧重试 `duplicate=true`。

**优点：**
- 成本控制：同一坏帧不会反复打 VLM
- 可见性：UI 可显示"同帧反复失败"，引导用户换窗口

**缺点：**
- 用户需先消费 `duplicate` 字段才有价值（当前 renderer 未消费）
- 代码复杂：hash 写入多点（成功路径 + 失败占位）
- 引入悖论：若 VLM 变好了，同帧能工作，但 `duplicate=true` 阻止更新

## 决策依据缺口

**无法在本 plan 直接定论**，需以下输入才能决策：

| 输入 | 来源 | 状态 |
|------|------|------|
| VLM 单次调用成本 | OpenAI / Codex CLI 计费 | 待填 |
| 日均 validation 失败率 | 生产 / eval 数据 | 待填 |
| renderer 对 `duplicate` 字段的规划 | 产品侧路线图 | 待填 |
| 目标用户重试心理模型 | 面试 demo 脚本 | 待填 |
| 决策者 | 项目所有者 | **必须命名** |

## 本 plan 行动项

1. **命名决策者。** 默认 = 项目所有者（即当前 Claude Code 会话背后的人类 decider）
2. **验证 `duplicate` UI 消费路径。** 选一：
   - a. 确认 renderer **不消费**：R9 改为低优先级，冻结当前行为
   - b. 确认 renderer **将消费**：在 `src/renderer/app.ts` IPC 类型先加 `duplicate`，加最小 UI 反馈
3. **收集 VLM 成本数字。** 至少：单次 extract token 估算 + 用户日均调用次数（即使粗估）
4. **写最终决策。** 本文件末尾追加 `## DECISION` 段，明确选 A / B / 混合 / 延后
5. **如选 B：** 单独开 `docs/plans/r9-impl-{a|b}.md` 做实施（含 test 更新，R3 的 `companion-pipeline.test.ts:49` 必然要改）

## 非阻塞判定

- 本 plan **不阻塞 R4 / R5 / R6 / R7 / R8**
- R6 的 plan 已独立选"显式无 reset"，与 R9 解耦
- R9 决策期间 R3 行为保持（当前生产已跑着）

## 验收标准（本 decision plan）

- [ ] 决策者已命名（本文件更新）
- [ ] `duplicate` UI 消费路径已验证（option 2 选定）
- [ ] VLM 成本数字已填入（可粗估）
- [ ] 本文件 `## DECISION` 段明确写出选项 + 理由
- [ ] 若选实施路线，已创建对应实施 plan
- [ ] 本 plan commit，prefix `docs(R9):`（纯文档）

## 执行模式

- Tier 判定：纯文档 decision artifact → 单人主会话即可
- 不需要 TeamCreate
- 后续实施（若触发）按实施 plan 的 tier 另行判定

## 回滚

- 纯文档 → 零回滚风险
- 若进入实施阶段且出错 → 实施 plan 自带回滚

## 相关

- /autoplan review: Section 3A（范围挑战 R9 `duplicate` 未消费）+ Section 3B（Codex 独家建议降级）
- 原行为回归测试：`tests/unit/companion-pipeline.test.ts:49`
- 决策前的 hash 写入代码：`src/main/companion-pipeline.ts:54`

## DECISION（2026-04-24 已定）

**决策者**：项目所有者（LiuShiyuMath，本仓库 owner）

**选定**：路线 B — validation 失败也写 `latestFrameHash`。

**前提承认**：

- VLM 单次成本 / 日均失败率：**未知 / 无数据**。选 B 非成本驱动
- Renderer 当前 **不消费** `duplicate`（grep `src/renderer/` + `src/main/main.ts` + `src/main/preload.ts` 0 引用）

**理由**：

- 即使当前 renderer 不消费，选 B 把"同帧反复失败"信号保留在 `companion-pipeline` return value 中，**把错误归因数据落到接口层**，后续加 UI 反馈或成本看板时不用再改 pipeline 行为
- 避免未来"VLM 月成本爆表"被动改代码：改 renderer 比改 pipeline 风险低，现在先锁 pipeline 语义
- 现有 R3 回归测试 `tests/unit/companion-pipeline.test.ts:49` 需要翻转（从 `duplicate===false` 改 `duplicate===true`），已在 r9-impl-b plan 计入

**实施 plan**：见 [r9-impl-b.md](r9-impl-b.md)

**非决策项**：renderer UI 反馈（"同帧反复失败"提示文案 / 引导换窗口）留到 implementation plan 之后的 UX 迭代，非本 R9 范围。
