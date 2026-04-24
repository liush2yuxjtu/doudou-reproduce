# 规则 R4：文档编辑后的原子提交

## 核心约束

对 `CLAUDE.md` 或 `docs/` 下任意 `*.md` 的修改完成后，**立即**按单一关注点创建原子 commit。

## 原子 commit 判据

| 判据 | 说明 |
|------|------|
| 单一主题 | 一次提交只做一件事 |
| 文件粒度匹配主题 | 无关文件不混入 |
| 可独立回滚 | 撤销此 commit 不破坏其它功能 |
| 测试仍通过 | `npm test` 不因此次 commit 失败 |

## 提交消息格式

沿用 Conventional Commits：

```
docs: <动词> <对象>

<可选正文：为什么做这次改动、引用规则编号>
```

## 动词选择

| 动词 | 场景 |
|------|------|
| `add` | 新建文档或规则 |
| `update` | 修订既有文档内容 |
| `split` | 拆分超长文件 |
| `move` | 迁移文档路径 |
| `remove` | 删除过时文档 |
| `fix` | 修正错别字或坏链接 |

## 示例

```bash
# 新建规则
git commit -m "docs: add edit-scope rule (R1)"

# 拆文件
git commit -m "docs: split proposal.md into docs/product/*"

# 修链接
git commit -m "docs: fix broken link in docs/INDEX.md"
```

## 批量编辑时的拆分

一次会话改了多份文档：

1. 按规则/主题分组
2. 每组单独 `git add` 指定文件
3. 每组单独 `git commit`
4. 最后 `git log --oneline` 复核提交序列

## 禁止的反模式

| 反模式 | 问题 |
|--------|------|
| 一个 commit 同时改源码和文档 | 违反原子性 |
| 一个 commit 同时拆文件又改内容 | 难以回滚 |
| commit 消息写成 `docs: update` 无细节 | 丢失意图 |
| 跳过 commit 直接下一个任务 | 违反"编辑即提交"原则 |

## 与全局规则的关系

用户全局 `~/.claude/CLAUDE.md` 有 `atomic-commits-on-edit.md`：任何 Write/Edit 后立即原子 commit。本规则是其在文档领域的细化。
