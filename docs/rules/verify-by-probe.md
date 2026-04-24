# 规则 R5（元规则）：每条规则必须自带 `claudefast -p` 探针

## 核心约束

`docs/rules/` 下**每一条**规则文件（含本文件），都必须在末尾自带一段「探针验证」节，让该规则可用 `claudefast -p "{问题}"` 自动复核。

## 为什么

| 动机 | 说明 |
|------|------|
| 可验证性 | 规则不只是文档，还要可被 CLI 回归 |
| 防腐 | 随实现漂移时，探针先红 |
| 面试可演示 | 任何人复制命令即能验证规则现状 |
| 统一判据 | 每条规则都有明确通过 / 失败阈值 |

## 探针验证节模板

每条规则文件必须包含以下小节：

```markdown
## 探针验证（`claudefast -p`）

### 合同

| 项 | 值 |
|----|-----|
| 命令 | `claudefast -p "{探针问题}"` |
| 判定 | <如何判定输出是否符合规则> |
| 通过 | <通过阈值> |
| 失败 | <失败信号> |

### 标准探针集

| 探针问题 | 期望答案语义 |
|----------|-------------|
| `{问题 1}` | `{期望 1}` |

### 判定脚本（macOS 兼容）

```bash
answer=$(claudefast -p "{探针问题}" 2>&1)
# 判定逻辑
```

### 最近一次运行结果

| 项 | 值 |
|----|-----|
| 探针 | `{问题}` |
| 运行时间 | `YYYY-MM-DD` |
| 判定 | PASS / FAIL |
```

## 覆盖要求

| 规则 | 必有探针 |
|------|----------|
| R1 edit-scope | ✅ |
| R2 line-budget | ✅ |
| R3 chinese-only | ✅ |
| R4 atomic-commits | ✅ |
| R5 verify-by-probe（本文件） | ✅ |

新增规则时：无探针即不通过评审，PR 必须带探针节。

## 判定脚本（元规则自检）

```bash
for f in docs/rules/*.md; do
  if ! grep -q '探针验证' "$f"; then
    echo "FAIL: $f 缺探针节"
  else
    echo "PASS: $f"
  fi
done
```

所有规则文件都必须输出 PASS。

## 探针验证（`claudefast -p`）

### 合同

| 项 | 值 |
|----|-----|
| 命令 | `claudefast -p "does every rule in this project need a claudefast probe ?"` |
| 判定 | 输出语义是否确认"是 / 必须 / 每条规则都需要探针" |
| 通过 | 答案含"是"/"必须"/"需要"等肯定中文词 |
| 失败 | 答案否定或含糊 |

### 标准探针集

| 探针问题 | 期望答案语义 |
|----------|-------------|
| `does every rule in this project need a claudefast probe ?` | 是，必须自带探针 |
| `本项目每条规则都要自带探针吗` | 是，R5 元规则强制 |

### 判定脚本（macOS 兼容）

```bash
answer=$(claudefast -p "does every rule in this project need a claudefast probe ?" 2>&1)
echo "$answer" | grep -qE '(必须|需要|是的|要|must)' && echo PASS || echo FAIL
```

### 最近一次运行结果

| 项 | 值 |
|----|-----|
| 探针 | `does every rule in this project need a claudefast probe ?` |
| 运行时间 | 2026-04-24 |
| 判定 | PASS |
