# Vox Director 端到端视频能力研究

> Vox Director 如何把主题、口播视频或单张照片编排为纸张拼贴成片，它比 Prompt Skill 多了什么，工程边界与采用价值是什么？

## 项目信息

- 状态：`completed`
- 创建：2026-08-29；完成更新：2026-08-30
- 研究对象：[Alisa0808/vox-director](https://github.com/Alisa0808/vox-director)
- 固定上游提交：`668ec3946fe0139bc985313b15c1a300fca42f94`
- 上游获取方式：[`upstream/`](upstream/) Git submodule
- Web 演示：[直接打开敦煌完成案例](https://yydshly.github.io/0829_codex_project/projects/vox-director-study/?demo=dunhuang#case-study)
- 完整报告：[notes/research-report.md](notes/research-report.md)

## 一句话结论

`vox-director` 是一个**可运行的端到端 Agent 视频 Skill**，不是新的图片或视频模型。宿主 Agent 负责叙事、风格选择和审批，Atlas Cloud 上的媒体模型负责图片、视频、TTS 与音乐，Python 和 ffmpeg 负责状态、时间线、字幕、混音与导出。

它与此前研究的 `hand-drawn-video-prompts` 最大差别是：后者交付“怎样制作”的 Prompt 生产包，Vox Director 会继续调用生成模型并尝试交付 `final.mp4`。

## 完成案例：敦煌 30 秒成片

本项目已经从仓库研究走到一支完整案例。专属页面默认展示《敦煌：沙漠中的世界十字路口》最终 V2，并集中说明能力归属、完整生产链、首帧/尾帧经验、适用场景、局限、扩展方向和对我们的意义。

- [打开完成案例](https://yydshly.github.io/0829_codex_project/projects/vox-director-study/?demo=dunhuang#case-study)
- [阅读完整案例复盘](notes/dunhuang-case-study.md)
- 最终文件：`media/dunhuang/final/dunhuang-sound-preview-v2.mp4`
- 结果：30.000 秒、720×1280、30fps、H.264、48kHz 双声道 AAC；6/6 当前镜头通过，2 个失败 v1 与替换原因保留。

案例验证后的核心认识：只有首帧可以锁定起点，但不能保证尾部不漂移；需要明确落点时应使用真正不同的首尾帧，同时继续检查中间运动。Prompt、版本、人工质检、失败恢复、确定性剪辑、声音和文字层共同构成可生产的交付，而不是附属步骤。

### 当前主题与可替换主题

当前完成主题是《敦煌：沙漠中的世界十字路口》：30 秒、9:16、3 beats / 6 shots，采用“东方文化纪录片 × 纸艺拼贴 × 电影感视觉诗”，沿“沙漠中的门 → 文明在这里相遇 → 时间被留下”完成三段叙事。

这套流程不是敦煌专用模板。网页现已列出十个代表性替换方向：三星堆、山海经、故宫文物、宋画入境、海上丝路、非遗工艺、城市形象、品牌故事、科技科普和可持续议题。换主题时需要重做观点与事实、beats 与旁白、shots、关键帧与提示词、声音与包装；30 秒三段式模板、镜头编号、版本审批、首帧/首尾帧交接、首中尾帧质检、FFmpeg 后期和来源归属仍可复用。

## 没有它的视频模型，也能使用

本项目现在提供一个**模型无关的前期导演台**。导演台运行时不需要 Atlas Cloud，也不会自行调用外部付费 API：

- 把 4 份上游 `beats.json` 整理为 4 套结构、17 个 beats、26 个 shots；
- 可选择文生视频、关键帧生视频、首尾帧生视频或参考素材生视频；
- 可逐镜头编辑旁白、画面任务、静帧 Prompt、运动 Prompt 和时长；
- 敦煌示范的每个 shot 都有“复制本镜头”，可直接复制一整块图生视频任务；顶部也可一次复制全部 6 镜头；
- 自动整理路线相关的资产清单与 6 道人工放行关卡；
- 导出 `research-lab.preproduction-pack/v1` JSON，交给你已有的模型或另一个 Agent。

详细说明见 [样例目录](notes/sample-catalog.md) 和 [前期导演台指南](notes/preproduction-guide.md)。

## 先分清：原库能力与本研究实现

| 来源 | 真正包含的内容 | 不应误解为 |
| --- | --- | --- |
| vox-director 原库 | 以 `beats.json` 为中间协议的 B/A/C-roll 编排脚本、Atlas Cloud Provider、人工审批节点、媒体生成阶段和 ffmpeg/Pillow 确定性后期；随库附带 4 支 MP4 与 4 份结构样例 | 当前 Research Lab 网页、敦煌主题或 Codex 图片能力 |
| Codex / Research Lab 新增 | 固定版本审计、模型无关前期导演台、4 份样例规范化、敦煌 30 秒脚本与逐镜头提示、6 张 Codex 关键帧、视频回填/复核界面、FFmpeg 画面粗剪、在线神经网络 TTS/程序化环境声试听、浏览器验收与发布页 | vox-director 原库自带 UI、原库已经生成的敦煌视频或原库在本项目内完成的粗剪/配音/混音 |
| 用户外部模型产物 | 敦煌示范中的 6 段当前 MP4，以及 B01-S01、B02-S01 两段保留的 v1；均由用户在其他视频模型生成后提供 | vox-director 或 Codex 在本项目内生成的视频 |

完整示范：打开发布页的 `?demo=dunhuang#case-study`，可直接看到《敦煌：沙漠中的世界十字路口》完成案例；准备台仍保留 30 秒预案、3 beats、6 shots、中文旁白、6 张 Codex 生成的 9:16 关键帧和无缺失输入的交接 JSON。六段当前视频均已通过：`B01-S01 v2` 修复路线扩张，`B02-S01 v2` 锁定五只手、六枚硬币、纸艺器物和卷起的无字卷轴，其余四段使用通过的 v1。页面可播放/下载静音画面粗剪与最终声音版 V2；声音版采用 Microsoft Edge `zh-CN-YunyangNeural` 普通话神经网络男声和不含外部采样的 FFmpeg 程序化环境声，并提供旁白、环境声、混音分轨和 SRT。它是本研究案例的完成版，但不冒充真人或原库输出；三段非敏感旁白文本曾发送给在线 TTS 服务，正式商业发布前仍需确认音色及使用条款。Kangkang 声音 v1 和两个被替换的视频 v1 仍作为历史保留。详见 [完整案例复盘](notes/dunhuang-case-study.md)、[30 秒粗剪清单](notes/dunhuang-edit-decision-list.md) 和 [声音方向](notes/dunhuang-sound-direction.md)。

## 首先看能力演示

交互演示把仓库的三种输入方式放进同一个控制台：

- B-roll：一句主题 → 分镜 → 风格试片 → 关键帧 → 图生视频 → 声音 → 成片；
- A-roll：真人口播 → ASR 分段 → 视频风格改造 → 原始声音重新混入；
- C-roll：单张人物/产品照 → 主体锚定 → 多镜头拼贴 → 可选声音克隆 → 成片。

演示同时展示固定提交中已有的 4 支 MP4：唐代、货币简史、足球史和硅谷史；墨西哥街头美食只有缩略图，因此没有把它计作仓库内可复现视频。页面使用仓库自己的媒体证明仓库自己的能力，没有在本研究中伪造新的生成结果。

本地访问：

```powershell
python projects/vox-director-study/scripts/build_demo.py
python scripts/build_site.py
python -m http.server 8765 --directory .site
```

打开 `http://127.0.0.1:8765/projects/vox-director-study/`。

## 固定提交审计

- 47 个上游文件、29 次提交；
- 18 个 Python 脚本、10 个 Markdown；
- 4 支 H.264/AAC MP4，总时长约 210.9 秒；
- 4 份 `beats.json` 示例，其中 3 份保留了关键帧/视频 URL；
- 0 个上游测试路径；
- Provider 接口存在，但只有 Atlas Cloud 一个实现。

自动审计执行 50 项本地研究、前期包、敦煌关键帧、视频版本、粗剪、声音、完成案例、主题复用与外部入口契约检查；另记录 5 项上游工程边界。真实浏览器矩阵覆盖 10 个桌面、平板、手机、主题、键盘、错误与媒体降级 surface。机器可读证据见 [audit-results.json](notes/evidence/audit-results.json) 和 [browser-validation.json](notes/evidence/browser-validation.json)。

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
├─ media/dunhuang/              # 6 张 Codex 关键帧与 6 段用户生成视频
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

本研究没有 Atlas Cloud API Key，也没有直接调用视频模型。敦煌示范的 6 张关键帧由 Codex 内置图片模型生成；6 段视频均由用户在外部视频模型生成后提供，并已原样复制、检查和回填。30 秒画面粗剪、Yunyang Neural 在线 TTS 试听、程序化环境声和混音由 Codex / Research Lab 编排完成，不代表 vox-director 在本项目内执行了媒体生成或声音制作。因此验证边界是“固定源码 + 随库样例 + 本地编排审计 + Codex 关键帧 + 用户视频回填 + Codex 确定性后期/试听声音”，不是独立复跑 Vox Director 的 Atlas Cloud 成片流程。

## 研究日志

### 2026-08-30

- 根 README、项目目录和项目 README 的演示入口统一直达敦煌完成案例；完成案例新增当前主题、10 类可替换主题、5 项重做内容和 6 项可复用生产骨架。
- 将敦煌示范收口为完成案例，最终 V2 成片成为专属页面的默认结果。
- 新增网页完成案例区，集中呈现能力归属、8 步生产链、5 项关键发现、适合/不适合边界、扩展优先级和对我们的意义。
- 新增 `notes/dunhuang-case-study.md`，完整记录首帧与首尾帧差异、版本与质检经验、最终规格、交付目录、复现方式和发布边界。
- 保留所有静音版、分轨、历史视频和 Kangkang 声音 v1；完成版不覆盖可追溯证据。

### 2026-08-29

- 创建并登记子项目，以 Git submodule 固定上游提交。
- 审计 B/A/C-roll、Provider、提示词层、媒体生成、音频和 ffmpeg 合成实现。
- 检查 4 支随库 MP4 和 4 份 `beats.json` 示例。
- 制作三模式能力控制台、真实样例影院、场景边界、扩展路线和采用意义页面。
- 新增模型无关前期导演台、动态资产清单、人工关卡以及复制/下载 JSON 交接包。
- 用 Codex 内置图片模型生成 6 张敦煌关键帧，并补充逐镜头视频调度提示。
- 接收并回填用户生成的 B01-S01 v1；检查首、中、尾帧，记录尾帧路线分叉问题并收紧重做提示。
- 接收并回填用户生成的 B01-S02 v1；检查首、中、尾帧，确认驼队队形、城市剪影和纸层视差稳定，批准进入剪辑。
- 接收并回填用户生成的 B02-S01 v1；检查首、中、尾帧，记录写实化、新增手部与卷轴文字问题，并收紧整段重做提示。
- 接收并回填用户生成的 B03-S02 v1；确认结尾纸艺、中央无字留白与圆环归位通过，记录尾帧后期冻结建议。
- 接收并回填用户生成的 B02-S02 v1；确认人物、乐器和 S 形飘带稳定，记录纸艺从粗粝纹理转向平滑浮雕的剪辑注意。
- 接收并回填用户生成的 B03-S01 v1；确认洞窟门形、壁画人物、莲花与云纹连续稳定，批准进入剪辑并记录前 0.5 秒压暗建议。
- 接收 B01-S01 与 B02-S01 重做视频并映射为 v2；首中尾帧确认路线、五只手、六枚硬币、卷轴和纸艺材质稳定，批准进入剪辑，同时保留两个 v1 及原审核记录。
- 将六段当前通过版统一为 720×1280、30fps，各取 5 秒硬切合成 30 秒画面粗剪；移除模型原音并保留静音 AAC 占位轨，生成三段中文旁白 SRT 和可追溯的镜头版本清单。
- 使用 Microsoft Edge `zh-CN-YunyangNeural` 神经网络男声生成三段可替换旁白，以 −6% 语速、−8 Hz 音高调整到各自 10 秒窗口；用 FFmpeg 程序化合成无外部采样的低频/风声环境声，完成 ducking、响度归一化、30 秒声音试听 v2 与三条 AAC 分轨。原 Kangkang v1 保留但不再默认播放。
- 建立标准库审计与真实浏览器验收，记录跨平台和工程成熟度边界。
