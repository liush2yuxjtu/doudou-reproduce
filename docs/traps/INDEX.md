# docs/traps/ 目录索引

本目录归档 doudou_reproduce 项目中历史出现过的「翻车模式」（trap），供未来 agent 在开始同类任务前先查重，避免二次踩同一条坑。所有 trap 文件必须遵守 `CLAUDE.md` 三大铁律（R1/R2/R3）。

## 铁律再述

| 编号 | 规则 |
|------|------|
| R1 | 只改 `docs/` 和 `CLAUDE.md` |
| R2 | 每个 `*.md` < 200 行 |
| R3 | 仅用中文 |

## 陷阱清单

| 文件 | 触发信号 | 状态 |
|------|---------|------|
| [agent-worktree-collision.md](agent-worktree-collision.md) | 并行 agent team + isolation=worktree + auto-name | 已归档 2026-04-24 |

## 新增 trap 流程

1. **何时加**：一次实施中出现「非业务代码原因导致的实施失败 / 救援 / 返工」，且根因可抽象为「若某 agent 再走同路径会再翻车」。纯业务 bug 不进 traps/，走 `docs/plans/` 或 code 修复。
2. **命名规则**：`{场景}-{症状关键字}.md`，全小写短横线。例如 `agent-worktree-collision.md`、`teammate-commit-mix.md`。文件名要让未来 agent grep 到。
3. **结构要求**：
   - 来源：指向触发本次 trap 的 plan 或 PR
   - 触发信号（≥3 条）：未来 agent 看到哪些信号就该来查本文件
   - 症状：具体 commit hash / 文件 / 报错，可验证
   - 根因：工具 / 协议 / 流程层面的可抽象原因
   - 救援路径：本次实际做了什么把事救回来
   - 应对建议：未来同场景先试什么（排序给优先级）
   - 校验命令：事前事后都可跑的 CLI 探针
4. **更 INDEX 原则**：新增 trap 后在本 `INDEX.md` 陷阱清单表末尾追加一行，填文件名、触发信号、状态。不动铁律表、不动新增流程节。
5. **原子 commit**：新增或更 trap 走单独 commit，prefix 用 `docs(traps):` 或 `trap:`，message 说明 trap 主题与归档来源。

## 与其它目录的边界

- `docs/rules/` 是「必须遵守的硬规则」，trap 是「历史失败模式的备忘」，不升格为 rule，除非反复翻车。
- `docs/plans/` 是「已批准的实施计划」，trap 是实施过程中的翻车归档，通常成对出现：plan 指向 trap 做事前警示。
