# Hand-Drawn Video Prompts 能力研究

> 该 Skill 能否稳定地把中文口播转为可执行、风格一致且风险分层的竖屏短视频提示词，其能力边界与扩展价值是什么？

## 项目信息

- 状态：`completed`
- 创建与更新：2026-08-29
- 研究对象：[kaomei/hand-drawn-video-prompts](https://github.com/kaomei/hand-drawn-video-prompts)
- 固定上游提交：`dae2da391d58fdd42c7c4475742eb4c989cf53f2`
- 上游获取方式：[`upstream/`](upstream/) Git submodule
- Web 演示：[GitHub Pages 在线页面](https://yydshly.github.io/0829_codex_project/projects/hand-drawn-video-prompts-study/)
- 完整报告：[notes/research-report.md](notes/research-report.md)

## 当前结论

这个仓库是一个 **Prompt 编译型 Agent Skill**，不是视频模型或独立生成器。它最有价值的能力是把中文观点转换为 4–6 秒语义镜头、视觉隐喻、静帧 Prompt、运动 Prompt 和准确性风险提示；“自动成片”依赖宿主另行提供生图、视频或代码运动、TTS、字幕、时间线和导出工具。本项目已经补出一条可复现的低成本参考链路。

固定提交共 24 个上游文件、8 次提交、1 位贡献者、0 个可执行源文件。它已经是一套可以辅助创作的 SOP，但尚未包含结构化接口、模型适配器、自动评测和生产编排。

## 能力演示

本研究选择 2026-08-28 公布的“我国首次在轨验证地月双向高速激光通信能力”作为最新热点实战，依据[中国科学院](https://www.cas.cn/cm/202608/t20260827_5119119.shtml)与[新华网](https://www.xinhuanet.com/20260828/2846f43524b94d66bb78c7271d7e9466/c.html)交叉核验。约 41 秒口播被拆为 7 个镜头，并为每个镜头提供：

- 对应口播与 4–6 秒建议时长；
- 单一视觉隐喻与画面短关键词；
- 自包含的英文静帧 Prompt；
- 自包含的英文图生视频 Prompt；
- 来源事实、精确数字、未来用途与编辑观点的边界提醒。

完整数据见 [`data/demo-case.json`](data/demo-case.json)。自动审计执行 28 项 Prompt 合约检查和 8 项新闻来源/成片交付检查。交互页面可以逐镜头切换视觉隐喻、静帧 Prompt、运动 Prompt 和准确性风险。

七个镜头分别实际调用内置图像模型，生成 7 张 `941×1672` 无文字关键帧。随后由 [`scripts/build_final_video.ps1`](scripts/build_final_video.ps1) 按每镜头的月球、光束、人物或装置区域设置语义切分，合成分阶段纸片装配与克制回弹运动，并加入 MiniMax Speech 2.8 HD 中文 TTS、硬字幕和来源标签，输出 `1080×1920`、20fps、41.02 秒的 H.264/AAC 参考成片 [`demo/assets/news-case-final.mp4`](demo/assets/news-case-final.mp4)。未调用 Flow/Veo；画面来自生图，运动来自确定性代码。演示页已把本案例与上游 Demo 722 接入同一比较区，并明确标出两条生产链的差异。

## 关键实测

- 上游 4 张 PNG 均接近 9:16，但顶部空白区域 2,240 个采样点对 `#F8F6EF` 的精确命中率为 `0%`。精确色号是 Prompt 目标，需要固定底图或后期统一才能成为结果保证。
- 2 个 MP4 都是 540×960、20fps，时长分别为 32.45 秒和 40.87 秒；它们证明流程能产出成片，但缺少模型版本、随机种子、生成记录和成本，不能视为严格可重复实验。
- 当前主规则与旧样例存在 4 类漂移：视觉组数量、人物比例、关键词处理，以及“完全空白首帧”和“画面文字全程固定”的冲突。
- 7 张实生成关键帧验证了静帧 Prompt 的可读性；代码成片验证了生产编排，但没有验证 Flow/Veo 等图生视频模型的角色一致性和自然运动能力。

## 目录

```text
projects/hand-drawn-video-prompts-study/
├─ upstream/                    # 固定上游 Git submodule
├─ data/demo-case.json          # 最新热点与七镜头完整 Prompt
├─ demo/                        # 零依赖交互研究页
├─ media/                       # 中文旁白与 SRT 字幕
├─ notes/research-report.md     # 完整研究结论
├─ notes/evidence/              # 审计 JSON、抽帧和浏览器截图
├─ scripts/build_demo.py        # 同步规范数据到静态演示
├─ scripts/build_final_video.ps1# 可复现的 TTS + FFmpeg 成片脚本
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

使用 MiniMax `speech-2.8-hd` 预置音色直接把文案生成语音（同步 T2A，每镜头独立生成后自动校准到镜头时长）。先复制配置模板并填写本地配置：

```powershell
Copy-Item projects/hand-drawn-video-prompts-study/config/minimax.example.json `
  projects/hand-drawn-video-prompts-study/config/minimax.local.json
```

编辑 `config/minimax.local.json` 中的 `api_key`，然后执行：

```powershell
powershell -ExecutionPolicy Bypass -File projects/hand-drawn-video-prompts-study/scripts/run_minimax_build.ps1
```

默认使用中国区 `https://api.minimaxi.com` 与 `Chinese (Mandarin)_News_Anchor` 新闻女声；可在配置中调整 `api_host`、`model`、`voice_id` 和 `speed`。`minimax.local.json` 已加入 `.gitignore`，不会被 Git 跟踪，但其中的 Key 仍是本机明文敏感信息，不要复制、截图或提交。接口和当前模型列表以 [MiniMax 中国区官方 TTS 文档](https://platform.minimaxi.com/docs/api-reference/speech-t2a-http)为准。

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
- 浏览器矩阵：8/8，通过。
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
