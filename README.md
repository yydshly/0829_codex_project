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
| [LLM Wiki 能力与知识编译研究](projects/llm-wiki-study/) | [打开源库](https://github.com/nashsu/llm_wiki) | 验证 LLM Wiki 如何把多格式资料持续编译为可追溯 Markdown Wiki，并评估其摄取、混合检索、知识图谱、Agent/MCP 与本地优先边界。 | 暂停 | [打开演示](https://yydshly.github.io/0829_codex_project/projects/llm-wiki-study/) | 2026-08-30 |
| [OpenReel Video 能力与复用边界总结](projects/openreel-video-capability-summary/) | [打开源库](https://github.com/Augani/openreel-video) | OpenReel 是本地优先的浏览器视频剪辑器，并扩展了桌面原生编码与 Agent/MCP 控制；当前安装和验证成本较高，先保存架构理解与按需复用入口。 | 已归档 | — | 2026-08-29 |
| [Rachel Digital Human Production 采用价值研究](projects/rachel-digital-human-production-study/) | [打开源库](https://github.com/Jingyi-Wu-Richael/rachel-digital-human-production) | 该 Skill 是否提供独立数字人能力；审计确认它只是 MiniMax 与 HeyGen 的固定流程封装，且与既有研究高度重复，因此归档。 | 已归档 | — | 2026-08-29 |
| [Screenshot-to-Code 视觉 Agent 能力研究](projects/screenshot-to-code-agent-study/) | [打开源库](https://github.com/abi/screenshot-to-code) | 确认 screenshot-to-code 通过多模态模型、代码工具和浏览器反馈实现视觉前端复刻；Agent 闭环值得研究，但该能力对当前日常流程低频且重叠，因此不安装、不集成、不产品化。 | 已完成 | [打开演示](https://yydshly.github.io/0829_codex_project/projects/screenshot-to-code-agent-study/) | 2026-08-29 |
| [Toonflow 能力与复用边界总结](projects/toonflow-capability-summary/) | [打开源库](https://github.com/HBAI-Ltd/Toonflow-app) | Toonflow 是与 AIComicBuilder 高度重合的 AI 短剧生产工作台；本项目保存其 Agent、Skill、模型 API 与复用边界，当前不重复部署，待连续短剧生产需求出现时重新评估。 | 已归档 | — | 2026-08-29 |
| [Vox Director 端到端视频能力研究](projects/vox-director-study/) | [打开源库](https://github.com/Alisa0808/vox-director) | Vox Director 如何把主题、口播视频或单张照片编排为纸张拼贴成片，它比 Prompt Skill 多了什么，工程边界与采用价值是什么？ | 已完成 | [打开演示](https://yydshly.github.io/0829_codex_project/projects/vox-director-study/) | 2026-08-29 |
<!-- PROJECTS:END -->

项目索引数据保存在 [`projects/catalog.json`](projects/catalog.json)，上表由脚本自动维护。

## 阶段研究提示：LLM Wiki

[LLM Wiki 能力与知识编译研究](projects/llm-wiki-study/)已完成本阶段源码审计、网页能力展示、Codex 摄取实验和 Windows Tauri 原生客户端验证，当前状态为 `paused`。在线成果由 GitHub Pages 持续保留：[打开能力与原生实测网页](https://yydshly.github.io/0829_codex_project/projects/llm-wiki-study/)。

它对本仓库的主要意义不是增加另一个聊天客户端，而是提供一个“模型之外的长期知识与能力层”候选：把原始资料编译为可编辑、可追溯的 Markdown Wiki，用图谱和混合检索为 Codex 等 Agent 提供证据，再把成熟的研究方法沉淀为 Skill。模型可以更换，来源、Wiki、关系、Review 和方法仍能保留；它与 Obsidian 更适合互补，而不是简单替代。

当前不直接作为日常生产依赖。固定版本实测仍存在 Codex CLI / Chat planner / Skills 配置摩擦，PDF / 网页、大规模吞吐、向量召回、长期增量漂移和 API / MCP 闭环尚未完成。后期只有在需要长期专题知识库、多 Agent 共用本地知识，或上游发布重要版本时再重新开启；回顾应先阅读[阶段总结](projects/llm-wiki-study/notes/stage-summary.md)、[项目 README](projects/llm-wiki-study/README.md)、[原生实测结果](projects/llm-wiki-study/demo/assets/native-run-result.json)与[验证记录](projects/llm-wiki-study/notes/validation.md)，避免重复已经固定的研究。

## 技术参考备忘

- [Kumone](https://github.com/missuo/kumone) 是一个使用 SwiftUI 开发的非官方 macOS 与 iOS 网易云音乐客户端，覆盖登录、推荐与曲库、歌单管理、播放队列、同步歌词、系统媒体控制、灰色歌曲音源回退和自动更新。
  - **音源组成**：正常播放源来自网易云音乐，客户端携带用户登录 Cookie，直接请求网易云私有 `weapi` / `eapi` 接口取得歌曲资料、歌词和播放 URL；可用版权、试听范围和音质仍取决于网易云账号、地区及黑胶 VIP 权限。网易云没有返回完整地址或仅提供试听时，可选的灰色歌曲回退会先按网易云歌曲 ID 请求 GD Studio / pyncmd，再用“歌名 + 歌手”搜索酷狗、酷我，并从靠前结果中按约 ±5 秒的时长误差匹配替代音频。Kumone 不拥有或托管曲库，也没有作者自建的付费音源服务器；软件本身免费，但网易云会员内容仍按平台规则收费，第三方接口的免费性、稳定性和授权状态均没有保证。
  - **技术链路**：`weapi` 对 JSON 进行两轮 AES-128-CBC 加密并提交预计算的 RSA `encSecKey`，`eapi` 使用 MD5 摘要与 AES-128-ECB；网络层负责 Cookie、请求头、错误和响应解码，类型化 API 层统一歌曲、歌单、专辑与用户模型。播放层以 `PlayerService` 管理队列、随机/循环、私人 FM、URL 降级、歌词和状态恢复，再交给 AVPlayer 播放，并通过 MediaPlayer 接入媒体键、控制中心和锁屏；图片采用内存与磁盘两级缓存，macOS 通过 Sparkle、签名和公证完成发布。
  - **参考与边界**：当前 Windows 研究环境无法运行该 Apple 原生应用，私有接口可能随网易云调整而失效，第三方匹配可能命中翻唱、现场版或提示音，歌曲信息还会发送到相应第三方服务；本项目因此不把它作为现阶段生产依赖或稳定音源库。保留其协议适配、多音源 Provider、歌曲匹配、播放状态机、跨 Apple 平台 SwiftUI、歌词解析、缓存和发布流程，供后期开发类似原生音乐软件时参考。

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
