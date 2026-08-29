# 0829 Codex Research Lab

[![Repository checks](https://github.com/yydshly/0829_codex_project/actions/workflows/quality.yml/badge.svg)](https://github.com/yydshly/0829_codex_project/actions/workflows/quality.yml)
[![GitHub Pages](https://github.com/yydshly/0829_codex_project/actions/workflows/pages.yml/badge.svg)](https://github.com/yydshly/0829_codex_project/actions/workflows/pages.yml)

一个面向多子项目的长期研究仓库。这里以**可复现、可比较、可展示**为基本原则，记录对不同工具、代码库与技术路线的研究过程；根 README 是整个仓库的入口索引。

> 展示站点：[Research Lab on GitHub Pages](https://yydshly.github.io/0829_codex_project/)

## 研究项目

项目状态统一使用：`planned`（计划中）、`active`（进行中）、`paused`（暂停）、`completed`（已完成）、`archived`（已归档）。

当前研究以 GitHubDaily 的开源项目发现与内容索引为起点，并将候选项目逐步转化为可复现、可比较、可展示的独立研究记录。

<!-- PROJECTS:START -->
| 子项目 | 研究问题 | 状态 | 在线展示 | 最近更新 |
| --- | --- | --- | --- | --- |
| [GitHubDaily 开源项目精选与内容索引研究](projects/githubdaily-capability-map/) | GitHubDaily 如何通过人工精选、中文介绍、社区投稿与年度归档发现和传播开源项目；它适合哪些场景、可如何扩展、对我们的研究体系有什么价值？ | 已完成 | [打开演示](https://yydshly.github.io/0829_codex_project/projects/githubdaily-capability-map/) | 2026-08-29 |
| [GoFilm 来源机制简析](projects/gofilm-source-summary/) | 简要归档 GoFilm 的第三方影视采集 API、主附源聚合与部署机制；核心问题已在 Moovie 研究中覆盖，后续按需参考。 | 已归档 | — | 2026-08-29 |
| [Rachel Digital Human Production 采用价值研究](projects/rachel-digital-human-production-study/) | 该 Skill 是否提供独立数字人能力；审计确认它只是 MiniMax 与 HeyGen 的固定流程封装，且与既有研究高度重复，因此归档。 | 已归档 | — | 2026-08-29 |
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
