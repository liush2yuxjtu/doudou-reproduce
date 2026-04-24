# docs/ 目录索引

本目录收录 doudou_reproduce 项目所有常驻文档。所有子文件必须遵守 `CLAUDE.md` 中列出的三大铁律。

## 铁律再述

| 编号 | 规则 |
|------|------|
| R1 | 只改 `docs/` 和 `CLAUDE.md` |
| R2 | 每个 `*.md` < 200 行 |
| R3 | 仅用中文 |

## 子目录

| 路径 | 用途 |
|------|------|
| `docs/rules/` | 文档编辑与项目协作的硬规则 |
| `docs/project/` | 项目基本事实（语言栈、架构、版本等）|

## 规则清单

| 规则文件 | 主题 |
|---------|------|
| [rules/edit-scope.md](rules/edit-scope.md) | 文档类改动的路径边界 |
| [rules/line-budget.md](rules/line-budget.md) | 单文件 200 行硬上限 |
| [rules/chinese-only.md](rules/chinese-only.md) | 中文写作强制规则 |
| [rules/atomic-commits.md](rules/atomic-commits.md) | 文档编辑后的 commit 规范 |

## 项目事实

| 文件 | 主题 |
|------|------|
| [project/languages.md](project/languages.md) | 本项目使用的编程语言与工具链 |

## 新增文档流程

1. 先确认主题在既有文件里无法承载
2. 在 `docs/rules/` 或新子目录下建文件
3. 确保首版 < 200 行，全中文
4. 更新本 `INDEX.md` 与 `CLAUDE.md` 主表格
5. 原子 commit，只含本次文档变更
