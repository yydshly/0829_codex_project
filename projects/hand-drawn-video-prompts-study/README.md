# Hand-Drawn Video Prompts 能力研究

> 该 Skill 能否稳定地把中文口播转为可执行、风格一致且风险分层的竖屏短视频提示词，其能力边界与扩展价值是什么？

## 项目信息

- 状态：`completed`
- 创建：2026-08-29；当前交付：2026-08-30
- 研究对象：[kaomei/hand-drawn-video-prompts](https://github.com/kaomei/hand-drawn-video-prompts)
- 固定上游提交：`dae2da391d58fdd42c7c4475742eb4c989cf53f2`
- 上游获取方式：[`upstream/`](upstream/) Git submodule
- Web 演示：[GitHub Pages 在线页面](https://yydshly.github.io/0829_codex_project/projects/hand-drawn-video-prompts-study/)
- 完整报告：[notes/research-report.md](notes/research-report.md)

## 当前结论

这个仓库是一个 **Prompt 编译型 Agent Skill**，不是视频模型或独立生成器。它最有价值的能力是把中文观点转换为 4–6 秒语义镜头、视觉隐喻、静帧 Prompt、运动 Prompt 和准确性风险提示；“自动成片”依赖宿主另行提供生图、视频或代码运动、TTS、字幕、时间线和导出工具。

本项目已经把这套方法验证到完整交付，而不再只是一份 Prompt 演示：

1. **Skill 层**：文案 → 镜头职责、视觉隐喻、FIRST/LAST、运动约束与风险边界；
2. **生成层**：图像模型产出 10 张配对帧，外部视频模型产出 5 段真实中间运动；
3. **声音层**：MiniMax `speech-2.8-hd` 温润男声生成并拟合 30 秒旁白；
4. **确定性后期层**：FFmpeg 完成首尾核验、6 秒裁切、规格统一、字幕、响度和最终组装。

当前最终交付为 **5/5 首尾帧 I2V 镜头 + 30.000 秒 H.264/AAC 成片**。外部视频平台、具体模型、种子、费用与失败率没有随下载文件提供，因此本研究不猜测模型归属，也不把结果当成严格的模型横评。

固定提交共 24 个上游文件、8 次提交、1 位贡献者、0 个可执行源文件。它已经是一套可以辅助创作的 SOP，但尚未包含结构化接口、模型适配器、自动评测和生产编排。

## 对你的意义

- **直接价值**：把“凭感觉写一条长 Prompt”变成可逐镜检查、可交给外部平台、可回传组装的生产合同，减少返工和沟通损耗。
- **适用场景**：热点与知识解读、产品流程、服务说明、培训内容、品牌观念短片；尤其适合“抽象但可核实”的内容。
- **谨慎场景**：灾难、战争、医疗、法律、金融承诺和未核实爆料；生成隐喻不能替代事实证据或现场影像。
- **优先扩展**：生成时登记 provider/model/seed/cost；引入角色与道具参考；按首尾偏差、动作语义和构图漂移自动评分；建立音色/字幕/响度模板；自动监测回传文件并一键组装。
- **产品方向**：最值得继续做的不是“更长的 Prompt”，而是一个带版本、状态、评测和交付记录的短视频生产中间层。

## 能力演示

本研究选择 2026-08-28 公布的“我国首次在轨验证地月双向高速激光通信能力”作为最新热点实战，依据[中国科学院](https://www.cas.cn/cm/202608/t20260827_5119119.shtml)与[新华网](https://www.xinhuanet.com/20260828/2846f43524b94d66bb78c7271d7e9466/c.html)交叉核验。约 41 秒口播被拆为 7 个镜头，并为每个镜头提供：

- 对应口播与 4–6 秒建议时长；
- 单一视觉隐喻与画面短关键词；
- 自包含的英文静帧 Prompt；
- 自包含的英文图生视频 Prompt；
- 来源事实、精确数字、未来用途与编辑观点的边界提醒。

完整数据见 [`data/demo-case.json`](data/demo-case.json)。自动审计执行 28 项 Prompt 合约检查和 8 项新闻来源/成片交付检查。交互页面可以逐镜头切换视觉隐喻、静帧 Prompt、运动 Prompt 和准确性风险。

七个镜头分别实际调用内置图像模型，生成 7 张 `941×1672` 无文字关键帧。随后由 [`scripts/build_final_video.ps1`](scripts/build_final_video.ps1) 按每镜头的月球、光束、人物或装置区域设置语义切分，合成分阶段纸片装配与克制回弹运动，并加入 MiniMax Speech 2.8 HD 中文 TTS、硬字幕和来源标签，输出 `1080×1920`、20fps、41.02 秒的 H.264/AAC 参考成片 [`demo/assets/news-case-final.mp4`](demo/assets/news-case-final.mp4)。未调用 Flow/Veo；画面来自生图，运动来自确定性代码。演示页已把本案例与上游 Demo 722 接入同一比较区，并明确标出两条生产链的差异。

在此基础上又增加了一条真实图生视频能力验证：新主题“AI Agent 把混乱任务整理成执行流程”先生成完成构图，再由用户在外部平台以单图首帧方式生成 [`demo/assets/i2v-agent-workflow.mp4`](demo/assets/i2v-agent-workflow.mp4)。原文件为 `496×864`、24fps、6.08 秒、H.264/AAC。逐秒抽帧确认它完成了卡片吸入、阻塞清除与黄色清单展开，语义动作明显强于代码切片；同时机器比例、人物姿态、箭头与卡片数量被重新设计，说明单图输入不能保证像素级构图锁定。页面保留输入图、实际 Prompt、文件参数和这一边界。

该单镜头现已扩展为一套完成的 30 秒首尾帧成片：5 个镜头分别承担“任务洪水、统一收集、识别阻塞、编排流程、执行闭环”，每镜头 6 秒。10/10 FIRST/LAST 与 5 条状态匹配 Prompt 先形成严格生成合同；用户回传的 5 条外部视频模型结果再经首尾与 3 秒中间态抽帧核验，非破坏性归档后统一为 `1080×1920`、24fps、6.000 秒无平台音轨分镜。最终由 [`scripts/build_i2v_paired_final.ps1`](scripts/build_i2v_paired_final.ps1) 拼接并加入 30.000 秒 MiniMax `Chinese (Mandarin)_Gentleman` 温润男声（`calm`、语速 `0.98`）与两行硬字幕，输出 H.264/AAC 成片 [`demo/assets/i2v-agent-workflow-30s-final.mp4`](demo/assets/i2v-agent-workflow-30s-final.mp4)，响度约为 −16.6 LUFS / −1.3 dBTP。既有镜头 04 MP4 继续作为历史单图实验，不计入本次 5/5。生产板、逐镜播放/下载、状态和 Prompt 见页面 `#i2v-production-board`。

## 关键实测

- 上游 4 张 PNG 均接近 9:16，但顶部空白区域 2,240 个采样点对 `#F8F6EF` 的精确命中率为 `0%`。精确色号是 Prompt 目标，需要固定底图或后期统一才能成为结果保证。
- 2 个 MP4 都是 540×960、20fps，时长分别为 32.45 秒和 40.87 秒；它们证明流程能产出成片，但缺少模型版本、随机种子、生成记录和成本，不能视为严格可重复实验。
- 当前主规则与旧样例存在 4 类漂移：视觉组数量、人物比例、关键词处理，以及“完全空白首帧”和“画面文字全程固定”的冲突。
- 7 张实生成关键帧与新闻代码成片验证了静帧 Prompt 和确定性编排，但这条基线本身没有验证视频模型的角色一致性和自然运动能力；后续五镜头首尾帧案例才补上真实 I2V 运动验证。
- 新增 6.08 秒外部图生视频验证了对象级语义动作，同时暴露单图模式的构图重绘；它是单镜头实验，不等同于完整 30 秒成片或严格模型对照。
- 5 镜头最终案例验证了“Skill 分镜 → 10 张首尾配对帧 → 状态匹配 I2V Prompt → 5 条外部视频 → MiniMax TTS/字幕 → 本地确定性组装”的完整链路；新合同视频为 5/5，历史单图实验仍单独保留。

## 目录

```text
projects/hand-drawn-video-prompts-study/
├─ upstream/                    # 固定上游 Git submodule
├─ data/demo-case.json          # 最新热点与七镜头完整 Prompt
├─ data/i2v-agent-workflow-storyboard.json # 5 镜头 / 30 秒 I2V 生产合同
├─ demo/                        # 零依赖交互研究页
├─ media/                       # 中文旁白、SRT/ASS 与五条外部源视频归档
├─ notes/research-report.md     # 完整研究结论
├─ notes/evidence/              # 审计 JSON、抽帧和浏览器截图
├─ scripts/build_demo.py        # 同步规范数据到静态演示
├─ scripts/build_final_video.ps1# 可复现的 TTS + FFmpeg 成片脚本
├─ scripts/build_i2v_story_audio.ps1 # 5 段 MiniMax TTS 与 30 秒旁白
├─ scripts/build_i2v_paired_final.ps1 # 5 条首尾帧视频标准化与 30 秒组装
└─ tests/
   ├─ audit.py                  # stdlib 仓库/Prompt/PNG/MP4 审计
   └─ browser_acceptance.cjs    # Playwright 跨表面验收
```

## 复现

初始化上游并生成审计结果：

```powershell
git submodule update --init --recursive
python projects/hand-drawn-video-prompts-study/scripts/build_demo.py
python projects/hand-drawn-video-prompts-study/tests/audit.py
```

重新生成完整参考成片（需要 FFmpeg、ffprobe 与 Windows Microsoft Huihui 语音）：

```powershell
powershell -ExecutionPolicy Bypass -File projects/hand-drawn-video-prompts-study/scripts/build_final_video.ps1
```

用已归档的 5 条首尾帧视频重建 30 秒最终成片：

```powershell
powershell -ExecutionPolicy Bypass -File projects/hand-drawn-video-prompts-study/scripts/build_i2v_paired_final.ps1
```

使用 MiniMax `speech-2.8-hd` 预置音色直接把文案生成语音（同步 T2A，每镜头独立生成后自动校准到镜头时长）。先复制配置模板并填写本地配置：

```powershell
Copy-Item projects/hand-drawn-video-prompts-study/config/minimax.example.json `
  projects/hand-drawn-video-prompts-study/config/minimax.local.json
```

编辑 `config/minimax.local.json` 中的 `api_key`，然后执行：

```powershell
powershell -ExecutionPolicy Bypass -File projects/hand-drawn-video-prompts-study/scripts/run_minimax_build.ps1
```

单独重新生成 AI Agent 五镜头的 30 秒旁白（默认复用已经验证的逐镜原始 MP3）：

```powershell
powershell -ExecutionPolicy Bypass -File projects/hand-drawn-video-prompts-study/scripts/build_i2v_story_audio.ps1
```

本案例默认配置为中国区 `https://api.minimaxi.com`、`Chinese (Mandarin)_Gentleman` 温润男声、语速 `0.98` 与 `calm`；可在配置中调整 `api_host`、`model`、`voice_id`、`speed` 和 `emotion`。`minimax.local.json` 已加入 `.gitignore`，不会被 Git 跟踪，但其中的 Key 仍是本机明文敏感信息，不要复制、截图或提交。接口和当前模型列表以 [MiniMax 中国区官方 TTS 文档](https://platform.minimaxi.com/docs/api-reference/speech-t2a-http)为准。

如需使用本人或已获授权的真人声音，先准备 10 秒到 5 分钟、20 MB 以内的 `mp3/m4a/wav`，然后执行音色复刻。脚本不会自动搜索或上传音频，并要求显式传入 `--authorized`：

```powershell
python projects/hand-drawn-video-prompts-study/scripts/clone_minimax_voice.py `
  --input "D:\authorized-voice.wav" `
  --voice-id "MyNewsVoice2026" `
  --transcript "参考音频的准确文字" `
  --noise-reduction `
  --volume-normalization `
  --authorized
```

复刻成功后，可把返回的 `voice_id` 写入 `minimax.local.json` 的 `voice_id` 字段。声音复刻需要说话人明确同意和相应使用权；不得克隆未经授权的公众人物或第三方声音。官方限制见 [MiniMax 音色快速复刻文档](https://platform.minimaxi.com/docs/guides/speech-voice-clone)。

运行源码演示：

```powershell
python -m http.server 8765 --directory .
```

访问 `http://127.0.0.1:8765/projects/hand-drawn-video-prompts-study/demo/`。

浏览器验收使用工作区 Playwright 1.62.1。设置 `NODE_PATH` 指向包含 `playwright` 的 Node modules 后执行：

```powershell
$env:NODE_PATH = "<node_modules>"
node projects/hand-drawn-video-prompts-study/tests/browser_acceptance.cjs
```

构建 Research Lab 站点：

```powershell
python scripts/validate_repository.py
python scripts/build_site.py
python -m http.server 8000 --directory .site
```

构建后访问 `http://127.0.0.1:8000/projects/hand-drawn-video-prompts-study/`。

## 验证结果

- Prompt 自动审计：28/28，通过；新闻来源与成片交付检查：8/8，通过；7/7 实生成关键帧和最终 MP4 元数据完成检查。
- 图生视频与 30 秒生产包审计：11/11，通过；10/10 FIRST/LAST、5/5 状态匹配 Prompt、5/5 标准化分镜、30.000 秒 H.264/AAC 最终成片、MiniMax 温润男声（calm / 0.98）、两行硬字幕与 1 条历史单图实验边界均得到检查。
- 浏览器矩阵：13/13，通过。
- 覆盖：1440px 浅色完整交互、完整成片、新闻来源/关键帧与深色证据视图，768px 平板，390px 手机 + reduced-motion，数据错误和视频错误降级。
- 浏览器控制台错误、页面错误、失败请求和横向页面溢出：均为 0。

证据见 [`notes/evidence/browser-validation.json`](notes/evidence/browser-validation.json) 和 [`notes/evidence/audit-results.json`](notes/evidence/audit-results.json)。

## 许可与边界

上游按 MIT License 发布；演示中复用的上游媒体保留了 [`LICENSE-upstream.txt`](demo/assets/LICENSE-upstream.txt)。本研究自己的内容沿用 Research Lab 当前未统一授权的状态。

本研究只验证固定提交的公开内容和本地演示，不代表上游作者、Google Flow、Nano Banana 或文中公司。外部模型结果、成本和账号能力可能变化。

## 研究日志

### 2026-08-29

- 创建并登记子项目，以 Git submodule 获取并固定上游提交。
- 完整检查 Skill、风格参考、输出示例、自动化工作流、公开 Prompt 与媒体资产。
- 以地月双向高速激光通信热点替换通用样例，形成约 41 秒、七镜头完整 Prompt 演示。
- 生成 7 张独立无文字关键帧，并用确定性代码叠加中文标题、字幕与来源。
- 生成 41.02 秒中文配音参考成片、SRT 字幕和独立 AAC 旁白，并把播放器接入演示页。
- 建立零依赖审计，验证 Prompt 合约、PNG 色值/比例和 MP4 元数据。
- 识别并记录 4 类规则漂移及其产品影响。
- 实现零依赖 Web 研究页并完成桌面、平板、手机、主题、键盘、交互与降级验收。
- 接入用户外部生成的 6.08 秒真实图生视频，保留输入完成图和 Prompt，并完成媒体、构图漂移与浏览器适配审计。
- 用内置 ImageGen 补齐同主题关键帧，并以 MiniMax 生成 30.000 秒旁白和五条 SRT。
- 再用内置 ImageGen 非破坏性补齐六张缺失状态帧，把五镜头升级为 10 张严格 FIRST/LAST，并按每对可见状态重写运动 Prompt。
- 接入双帧生产板，明确展示 0/5 新首尾帧视频、1 条历史单图实验，避免把旧 MP4、静帧或 Prompt 冒充最终成片。

### 2026-08-30

- 接收并按 01–05 映射用户下载的五条首尾帧视频；源文件均为 `768×1344`、24fps、6.583 秒 H.264/AAC。
- 核验 0.10 秒首帧、3.00 秒中间态和 5.95 秒尾帧，五条均与对应 FIRST/LAST 及核心谓词匹配。
- 非破坏性归档源文件，剥离平台音轨并标准化为 5 条 `1080×1920`、24fps、6.000 秒 H.264 分镜。
- 复用现有 MiniMax 旁白，修正中文字幕自动换行问题，组装 30.000 秒 H.264/AAC 完整成片。
- 将生产板升级为 5/5、接入完整播放器与逐镜播放/下载，并完成 11/11 媒体审计和 11/11 浏览器矩阵。
- 对新闻女声、温暖闺蜜、温柔学姐、真诚青年、温润男声和文字设计音色做同文案试听；用户选择 D 温润男声后，归档旧新闻女声并重建五段旁白与最终成片。
- 重整网页信息层级：首屏改为三路线研究总览，在最终成片后补充四层能力分工、当前结论、价值、边界与优先扩展，并把旧的“尚未进入首尾帧生成”表述改为已验证结果。
- 筛选可复现资产、同步审计与交付文档，并将当前子项目作为独立范围提交到远端仓库。
