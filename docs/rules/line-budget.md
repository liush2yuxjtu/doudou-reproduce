# 规则 R2：每个 `*.md` 严格 < 200 行

## 硬上限

`CLAUDE.md` 与 `docs/` 下任意 `*.md` 文件行数必须 **少于 200 行**。

## 目标行数

| 文件类型 | 目标区间 | 硬上限 |
|---------|---------|-------|
| `CLAUDE.md` 项目入口 | 50–100 行 | 200 |
| `docs/INDEX.md` 目录索引 | 30–80 行 | 200 |
| `docs/rules/*.md` 单规则 | 40–120 行 | 200 |
| 其它主题文档 | 按需，优先 < 120 | 200 |

## 超限处理

发现 `*.md` 逼近或超过 200 行：

1. 找主题断点，拆成多个子文件
2. 父级文件改成索引表格，只留导航
3. 子文件放到同级新目录或 `docs/<主题>/`
4. 更新 `CLAUDE.md` 与 `docs/INDEX.md` 引用
5. 原子 commit：`docs: split <file> into sub-pages`

## 行数自检

```bash
find CLAUDE.md docs -name '*.md' -print0 \
  | xargs -0 wc -l \
  | sort -n
```

若某行数字 ≥ 200，立即拆。

## 拆分判据

| 信号 | 动作 |
|------|------|
| 同一文件出现 ≥3 个独立主题 | 每主题一份文件 |
| 某章节超过 60 行 | 独立拆到子文件 |
| 表格行数 > 40 | 按维度分表或分文件 |
| 代码示例堆积 | 示例移到 `docs/examples/` |

## 为什么 200 行

- 单屏可读性：200 行约等于两屏，读完不疲劳
- 检索效率：短文件 grep 结果定位精准
- 维护成本：短文件冲突更少，diff 更干净
- 与用户全局规则（`~/.claude/CLAUDE.md` 目标 100–150 行）节奏一致

## 探针验证（`claudefast -p`）

### 合同

| 项 | 值 |
|----|-----|
| 命令 | `claudefast -p "what is the max line count for a markdown file in this project ?"` |
| 判定 | 输出是否指明上限 `< 200` 或 `200` |
| 通过 | 答案含 `200` 且语义为上限 |
| 失败 | 答案无 `200` 或方向错误 |

### 标准探针集

| 探针问题 | 期望答案语义 |
|----------|-------------|
| `what is the max line count for a markdown file in this project ?` | 严格少于 200 行 |
| `本项目 markdown 文件行数上限是多少` | `< 200` |

### 判定脚本（macOS 兼容）

```bash
answer=$(claudefast -p "what is the max line count for a markdown file in this project ?" 2>&1)
echo "$answer" | grep -q '200' && echo PASS || echo FAIL
```

### 最近一次运行结果

| 项 | 值 |
|----|-----|
| 探针 | `what is the max line count for a markdown file in this project ?` |
| 运行时间 | 2026-04-24 |
| 判定 | PASS |
