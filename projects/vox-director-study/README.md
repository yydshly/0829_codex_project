# Vox Director 端到端视频能力研究

> Vox Director 如何把主题、口播视频或单张照片编排为纸张拼贴成片，它比 Prompt Skill 多了什么，工程边界与采用价值是什么？

## 项目信息

- 状态：`completed`
- 创建与更新：2026-08-29
- 研究对象：[Alisa0808/vox-director](https://github.com/Alisa0808/vox-director)
- 固定上游提交：`668ec3946fe0139bc985313b15c1a300fca42f94`
- 上游获取方式：[`upstream/`](upstream/) Git submodule
- Web 演示：[GitHub Pages 在线页面](https://yydshly.github.io/0829_codex_project/projects/vox-director-study/)
- 完整报告：[notes/research-report.md](notes/research-report.md)

## 一句话结论

`vox-director` 是一个**可运行的端到端 Agent 视频 Skill**，不是新的图片或视频模型。宿主 Agent 负责叙事、风格选择和审批，Atlas Cloud 上的媒体模型负责图片、视频、TTS 与音乐，Python 和 ffmpeg 负责状态、时间线、字幕、混音与导出。

它与此前研究的 `hand-drawn-video-prompts` 最大差别是：后者交付“怎样制作”的 Prompt 生产包，Vox Director 会继续调用生成模型并尝试交付 `final.mp4`。

## 没有它的视频模型，也能使用

本项目现在提供一个**模型无关的前期导演台**。导演台运行时不需要 Atlas Cloud，也不会自行调用外部付费 API：

- 把 4 份上游 `beats.json` 整理为 4 套结构、17 个 beats、26 个 shots；
- 可选择文生视频、关键帧生视频、首尾帧生视频或参考素材生视频；
- 可逐镜头编辑旁白、画面任务、静帧 Prompt、运动 Prompt 和时长；
- 敦煌示范的每个 shot 都有“复制本镜头”，可直接复制一整块图生视频任务；顶部也可一次复制全部 6 镜头；
- 自动整理路线相关的资产清单与 6 道人工放行关卡；
- 导出 `research-lab.preproduction-pack/v1` JSON，交给你已有的模型或另一个 Agent。

详细说明见 [样例目录](notes/sample-catalog.md) 和 [前期导演台指南](notes/preproduction-guide.md)。

完整示范：打开发布页的 `?demo=dunhuang#prep`，可直接载入《敦煌：沙漠中的世界十字路口》30 秒预案。示范包含 3 beats、6 shots、中文旁白、6 张 Codex 生成的 9:16 关键帧和无缺失输入的交接 JSON。展开镜头后点击“复制本镜头”即可获得一整段可投喂文本，也可点击顶部“复制全部 6 镜头”。视频模型尚未调用；独立调度文档见 [敦煌视频调度提示](notes/dunhuang-video-dispatch.md)。

## 首先看能力演示

交互演示把仓库的三种输入方式放进同一个控制台：

- B-roll：一句主题 → 分镜 → 风格试片 → 关键帧 → 图生视频 → 声音 → 成片；
- A-roll：真人口播 → ASR 分段 → 视频风格改造 → 原始声音重新混入；
- C-roll：单张人物/产品照 → 主体锚定 → 多镜头拼贴 → 可选声音克隆 → 成片。

演示同时展示固定提交中已有的 4 支 MP4：唐代、货币简史、足球史和硅谷史；墨西哥街头美食只有缩略图，因此没有把它计作仓库内可复现视频。页面使用仓库自己的媒体证明仓库自己的能力，没有在本研究中伪造新的生成结果。

本地访问：

```powershell
python projects/vox-director-study/scripts/build_demo.py
python -m http.server 8765 --directory .
```

打开 `http://127.0.0.1:8765/projects/vox-director-study/demo/`。

## 固定提交审计

- 47 个上游文件、29 次提交；
- 18 个 Python 脚本、10 个 Markdown；
- 4 支 H.264/AAC MP4，总时长约 210.9 秒；
- 4 份 `beats.json` 示例，其中 3 份保留了关键帧/视频 URL；
- 0 个上游测试路径；
- Provider 接口存在，但只有 Atlas Cloud 一个实现。

自动审计执行 25 项本地研究、前期包、敦煌关键帧与调度提示契约检查；另记录 5 项上游工程边界。机器可读证据见 [audit-results.json](notes/evidence/audit-results.json)。

## 适合与不适合

适合知识/历史解释、产品或品牌故事、真人口播包装，以及缺少实拍素材的短视频 B-roll。当前不适合直接承担精确 UI、数据图表、无审核热点新闻、复杂连续表演或严格 SLA 的批量生产。

关键原因是：仓库可以组织生成，但没有事实溯源、OCR、人物/Logo 保真指标、口型测量、成本账本和生产级任务治理。

## 对 Research Lab 的意义

它是本 Research Lab 从“Prompt Skill 研究”进入“Agent 媒体系统研究”的自然下一步：

```text
Hand-Drawn Video Prompts
  中文口播 → 分镜 → 双 Prompt → 风险提示

Vox Director
  主题/视频/照片 → beats.json → 多模型生成 → 声音 → ffmpeg → final.mp4
```

推荐把它作为固定版本的对照实验与架构参考，吸收 `beats.json`、人机审批、Provider、局部重跑和确定性合成；在补齐跨平台、事实层、质量门和成本证据前，不直接作为生产依赖。

## 目录

```text
projects/vox-director-study/
├─ upstream/                    # 固定上游 Git submodule
├─ data/research-data.json      # 演示与报告的规范数据
├─ data/preproduction-data.json # 4 套模型无关样例结构
├─ media/dunhuang/              # 6 张 Codex 生成的关键帧源文件
├─ demo/                        # 零依赖交互研究页
├─ scripts/build_demo.py        # 同步数据、缩略图与上游许可证
├─ scripts/build_preproduction.py # 规范化 17 beats / 26 shots
├─ tests/audit.py               # 仓库、样例、媒体与研究契约审计
├─ tests/browser_acceptance.cjs # 真实浏览器矩阵
└─ notes/
   ├─ design-contract.md
   ├─ dunhuang-video-dispatch.md
   ├─ research-report.md
   ├─ validation.md
   └─ evidence/
```

## 复现

```powershell
git submodule update --init --recursive
python projects/vox-director-study/scripts/build_demo.py
python projects/vox-director-study/tests/audit.py
python scripts/validate_repository.py
python scripts/build_site.py
```

浏览器验收使用工作区 Playwright。设置 `NODE_PATH` 指向含 `playwright` 的 Node modules 后执行：

```powershell
node projects/vox-director-study/tests/browser_acceptance.cjs
```

## 许可与边界

上游按 MIT License 发布；演示复用的缩略图保留了 [LICENSE-upstream.txt](demo/assets/LICENSE-upstream.txt)。代码许可不自动覆盖人物肖像、声音、Logo、外部模型服务条款和生成素材的商业使用权。

本研究没有 Atlas Cloud API Key，也没有调用视频模型。敦煌示范的 6 张关键帧由 Codex 内置图片模型生成并保存到项目；后续视频仍由用户选定的视频模型调度。因此验证边界是“固定源码 + 随库样例 + 本地编排审计 + Codex 关键帧 + 可交互前期演示”，不是独立复跑 Vox Director 的 Atlas Cloud 成片流程。

## 研究日志

### 2026-08-29

- 创建并登记子项目，以 Git submodule 固定上游提交。
- 审计 B/A/C-roll、Provider、提示词层、媒体生成、音频和 ffmpeg 合成实现。
- 检查 4 支随库 MP4 和 4 份 `beats.json` 示例。
- 制作三模式能力控制台、真实样例影院、场景边界、扩展路线和采用意义页面。
- 新增模型无关前期导演台、动态资产清单、人工关卡以及复制/下载 JSON 交接包。
- 用 Codex 内置图片模型生成 6 张敦煌关键帧，并补充逐镜头视频调度提示。
- 建立标准库审计与真实浏览器验收，记录跨平台和工程成熟度边界。
