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
