# 0829 Codex Research Lab

[![Repository checks](https://github.com/yydshly/0829_codex_project/actions/workflows/quality.yml/badge.svg)](https://github.com/yydshly/0829_codex_project/actions/workflows/quality.yml)
[![GitHub Pages](https://github.com/yydshly/0829_codex_project/actions/workflows/pages.yml/badge.svg)](https://github.com/yydshly/0829_codex_project/actions/workflows/pages.yml)

一个面向多子项目的长期研究仓库。这里以**可复现、可比较、可展示**为基本原则，记录对不同工具、代码库与技术路线的研究过程；根 README 是整个仓库的入口索引。

> 展示站点：[Research Lab on GitHub Pages](https://yydshly.github.io/0829_codex_project/)

## 研究项目

项目状态统一使用：`planned`（计划中）、`active`（进行中）、`paused`（暂停）、`completed`（已完成）、`archived`（已归档）。

当前研究从 GitHubDaily 的信息索引定位开始，并继续对 Hand-Drawn Video Prompts 等具体仓库做可复现的能力、资产和工程边界验证。每个已完成项目均提供独立 README、证据与 GitHub Pages 演示。

<!-- PROJECTS:START -->
| 子项目 | 研究源库 | 研究问题 | 状态 | 在线展示 | 最近更新 |
| --- | --- | --- | --- | --- | --- |
| [GitHubDaily 项目信息库说明](projects/githubdaily-capability-map/) | [打开源库](https://github.com/GitHubDaily/GitHubDaily) | GitHubDaily 是一份人工整理的 GitHub 项目清单。它保存项目名称、链接、中文简介、分类和年度记录，但不保存项目源代码；本项目分析清单中是否有值得保留的优秀项目，以及它对研究选题的参考价值。 | 已完成 | [打开演示](https://yydshly.github.io/0829_codex_project/projects/githubdaily-capability-map/) | 2026-08-29 |
| [GoFilm 来源机制简析](projects/gofilm-source-summary/) | [打开源库](https://github.com/ProudMuBai/GoFilm) | 简要归档 GoFilm 的第三方影视采集 API、主附源聚合与部署机制；核心问题已在 Moovie 研究中覆盖，后续按需参考。 | 已归档 | — | 2026-08-29 |
| [Hand-Drawn Video Prompts 能力研究](projects/hand-drawn-video-prompts-study/) | [打开源库](https://github.com/kaomei/hand-drawn-video-prompts) | 该 Skill 能否稳定地把中文口播转为可执行、风格一致且风险分层的竖屏短视频提示词，其能力边界与扩展价值是什么？ | 已完成 | [打开演示](https://yydshly.github.io/0829_codex_project/projects/hand-drawn-video-prompts-study/) | 2026-08-29 |
| [Intelligent Terminal 能力与原理总结](projects/intelligent-terminal-capability-summary/) | [打开源库](https://github.com/microsoft/intelligent-terminal) | Intelligent Terminal 是 Codex、Claude、Copilot 等 Agent CLI 之上的统一宿主、适配和终端调度层；个人当前可直接使用底层 CLI，没有额外采用价值，因此归档。 | 已归档 | — | 2026-08-29 |
| [OpenReel Video 能力与复用边界总结](projects/openreel-video-capability-summary/) | [打开源库](https://github.com/Augani/openreel-video) | OpenReel 是本地优先的浏览器视频剪辑器，并扩展了桌面原生编码与 Agent/MCP 控制；当前安装和验证成本较高，先保存架构理解与按需复用入口。 | 已归档 | — | 2026-08-29 |
| [Rachel Digital Human Production 采用价值研究](projects/rachel-digital-human-production-study/) | [打开源库](https://github.com/Jingyi-Wu-Richael/rachel-digital-human-production) | 该 Skill 是否提供独立数字人能力；审计确认它只是 MiniMax 与 HeyGen 的固定流程封装，且与既有研究高度重复，因此归档。 | 已归档 | — | 2026-08-29 |
| [Screenshot-to-Code 视觉 Agent 能力研究](projects/screenshot-to-code-agent-study/) | [打开源库](https://github.com/abi/screenshot-to-code) | 确认 screenshot-to-code 通过多模态模型、代码工具和浏览器反馈实现视觉前端复刻；Agent 闭环值得研究，但该能力对当前日常流程低频且重叠，因此不安装、不集成、不产品化。 | 已完成 | [打开演示](https://yydshly.github.io/0829_codex_project/projects/screenshot-to-code-agent-study/) | 2026-08-29 |
| [Toonflow 能力与复用边界总结](projects/toonflow-capability-summary/) | [打开源库](https://github.com/HBAI-Ltd/Toonflow-app) | Toonflow 是与 AIComicBuilder 高度重合的 AI 短剧生产工作台；本项目保存其 Agent、Skill、模型 API 与复用边界，当前不重复部署，待连续短剧生产需求出现时重新评估。 | 已归档 | — | 2026-08-29 |
| [Vox Director 端到端视频能力研究](projects/vox-director-study/) | [打开源库](https://github.com/Alisa0808/vox-director) | Vox Director 如何把主题、口播视频或单张照片编排为纸张拼贴成片，它比 Prompt Skill 多了什么，工程边界与采用价值是什么？ | 已完成 | [打开演示](https://yydshly.github.io/0829_codex_project/projects/vox-director-study/) | 2026-08-29 |
<!-- PROJECTS:END -->

项目索引数据保存在 [`projects/catalog.json`](projects/catalog.json)，上表由脚本自动维护。

## 快速开始

环境要求：Git 与 Python 3.10+。仓库本身不绑定某一种前端或研究技术栈，各子项目可独立管理依赖。

```bash
# 创建一个研究项目，同时更新 catalog 与本页索引
python scripts/new_project.py my-first-study "第一个研究项目" \
  --summary "验证一个清晰、可复现的研究问题" \
  --tag experiment

# 校验目录、元数据和 README 索引是否一致
python scripts/validate_repository.py

# 本地构建展示站点
python scripts/build_site.py
python -m http.server 8000 --directory .site
```

Windows PowerShell 中可将多行命令写成一行执行。

## 仓库结构

```text
.
├─ projects/                   # 研究项目与机器可读索引
│  ├─ catalog.json
│  └─ <project-id>/            # 每个子项目拥有独立 README 与元数据
├─ templates/research-project/ # 新项目模板
├─ docs/                       # GitHub Pages 静态展示层
├─ scripts/                    # 创建、校验、构建脚本（仅用 Python 标准库）
├─ .github/workflows/          # 自动校验与 Pages 发布
├─ RESEARCH_GUIDE.md           # 研究记录规范
└─ CONTRIBUTING.md             # 协作约定
```

## 工作方式

1. 从一个可验证的研究问题开始，而不是先堆积实现。
2. 在子项目 README 中记录假设、方法、环境、证据和局限。
3. 将可重复执行的代码、最小样例和结果放在同一个子项目中。
4. 只有可由现有证据支持的结论才标记为 `completed`。
5. 合并到 `main` 后，GitHub Actions 会校验索引并更新展示站点。

详细规范见 [RESEARCH_GUIDE.md](RESEARCH_GUIDE.md)，协作方式见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可说明

本仓库暂未统一指定开源许可证。每个子项目可以按其依赖、数据和研究目标单独声明许可证；未明确声明许可证的内容不应被视为已授权开放使用。
