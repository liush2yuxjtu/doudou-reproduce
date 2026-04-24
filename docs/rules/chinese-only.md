# 规则 R3：文档仅用中文

## 核心约束

`CLAUDE.md` 与 `docs/` 目录下所有 markdown 文件**只能用中文**撰写。

## 允许的英文

中文规则不阻止以下合理英文片段：

| 类别 | 示例 |
|------|------|
| 代码标识符 | `GameCompanionService`、`captureId` |
| 文件路径 | `src/core/policy-engine.ts` |
| 命令与 CLI | `npm test`、`git commit`、`claudefast -p` |
| 技术术语缩写 | VLM、LLM、TTS、DOM、CI |
| 第三方产品名 | Electron、TypeScript、Vitest、OpenAI |
| URL 与 Markdown 链接语法 | `[链接名](https://...)` |
| 代码块内容 | ```` ```ts ``` ```` 内全部允许 |

## 禁止的英文

| 类别 | 示例 |
|------|------|
| 整段英文解释 | "This document describes..." |
| 英文标题 | `## Overview`、`## Installation` |
| 英文表头 | `| Name | Description |` |
| 英文项目符号 | `- Add support for...` |

## 判断口诀

> **中文骨架 + 必要英文标识** = 合规
> **英文骨架 + 中文注释** = 违规

## 违规修复

发现整段英文：

1. 翻译为中文，保留技术词原形
2. 英文表头改为中文（如 `| 名称 | 描述 |`）
3. 英文列表项翻译为中文
4. 代码块内容保持不动

## 原因

- 团队主沟通语言为中文
- 与用户全局偏好一致（`~/.claude/CLAUDE.md` 默认中文响应）
- 面试答辩场景以中文为主
- 保留技术标识符避免歧义

## 自检提示

```bash
# 粗筛：找出长度 ≥ 50 的纯英文连续串
grep -nP '[A-Za-z][A-Za-z ,\.\-]{49,}' CLAUDE.md docs/**/*.md
```

命中结果人工复核，代码片段和 URL 可忽略。

## 探针验证（`claudefast -p`）

本规则必须可用 `claudefast -p {问题}` 自动验证：输入探针问题，输出答案应语义匹配"中文作答"。

### 合同

| 项 | 值 |
|----|-----|
| 命令 | `claudefast -p "{问题}"` |
| 判定 | 输出是否以中文叙述（代码 / 路径 / 术语缩写除外） |
| 通过 | 答案主体为中文句子 |
| 失败 | 答案主体为英文句子 |

### 标准探针集

| 探针问题 | 期望答案语义 |
|----------|-------------|
| `what languages we use in this project ?` | 中文列出 TypeScript / HTML / CSS / JavaScript / JSON / Markdown |
| `本项目技术栈是什么` | 中文列出 Electron + TypeScript + Vitest |
| `how to run tests ?` | 中文说明 `npm test` / `npm run eval` |

### 运行示例

```bash
cd /Users/m1/projects/doudou_reproduce
claudefast -p "what languages we use in this project ?"
# 期望：答案以中文叙述，列出 TypeScript、HTML/CSS、JavaScript、JSON、Markdown
```

### 判定脚本（粗筛，macOS 兼容）

```bash
answer=$(claudefast -p "what languages we use in this project ?" 2>&1)
# 答案内中文字符数 ≥ 10 视为通过（perl 兼容 BSD / GNU）
count=$(printf '%s' "$answer" | perl -CSD -ne 'print for /[\x{4e00}-\x{9fff}]/g' | wc -m | tr -d ' ')
echo "中文字符数: $count"
[ "$count" -ge 10 ] && echo PASS || echo FAIL
```

### 最近一次运行结果

| 项 | 值 |
|----|-----|
| 探针 | `what languages we use in this project ?` |
| 运行时间 | 2026-04-24 |
| 中文字符数 | 57 |
| 判定 | PASS |

失败即规则回归，立即修复 CLAUDE.md 语言规约或对应答案节。
