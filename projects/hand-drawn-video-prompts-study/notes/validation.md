# 验证与交接记录

## 范围

验证对象为固定上游 commit `dae2da3`、最新热点新闻的七镜头 Prompt 数据、七张实生成关键帧、41.02 秒 MiniMax 配音参考成片、本案例与上游同屏比较区、历史 6.08 秒单图图生视频实验、完成后的 5 镜头/30 秒首尾帧成片、中文音轨与字幕、零依赖 Web 演示和 Research Lab 静态站构建。

## 自动审计

命令：

```powershell
python projects/hand-drawn-video-prompts-study/tests/audit.py
```

结果：

- 演示 Prompt 契约检查：28 项，通过 28，失败 0。
- 新闻来源、时效、关键事实、观点分层与成片交付记录：8 项，通过 8，失败 0。
- 上游规则漂移：4 项观察成立。
- PNG：4 张完成比例和顶部背景色采样。
- 本次实生成关键帧：7 张，均为 `941×1672`，完成比例与背景采样。
- 上游 MP4：2 个完成编码、尺寸、帧率和时长检查。
- 本案例 MP4：H.264/AAC、`1080×1920`、20fps、41.02 秒；7 条 SRT 字幕和独立 AAC 旁白存在。
- 运动配置：每镜头 3–4 个自定义语义区域，约 2.75–3.75 秒完成装配；媒体元数据记录 `semantic_region_reveal`，不误标为视频模型或对象级图层。
- 逐镜运动证据：[`evidence/news-semantic-motion-contact.jpg`](evidence/news-semantic-motion-contact.jpg)；优化前证据：[`evidence/news-current-motion-before-r4.jpg`](evidence/news-current-motion-before-r4.jpg)。
- 真实图生视频检查：3/3，通过；输入完成图、实际 Prompt 与外部 MP4 均存在，视频为 H.264/AAC、`496×864`、24fps、6.08 秒。
- 图生视频逐秒证据：[`evidence/i2v-agent-workflow-contact.jpg`](evidence/i2v-agent-workflow-contact.jpg)；可观察到卡片吸入、阻塞消失和清单展开，同时存在输入构图重绘。
- 图生视频生产包检查：11/11，通过；5 个 6 秒镜头、10/10 FIRST/LAST、5/5 状态匹配锁镜 Prompt、5/5 新首尾帧视频与 1 条历史单图实验边界、30.000 秒 MiniMax 温润男声旁白和 5 条 SRT/ASS 均得到验证；音色为 `Chinese (Mandarin)_Gentleman`、`calm`、语速 `0.98`。
- 五条源视频：均为 H.264/YUV420P、`768×1344`、24fps、6.583 秒，附 32kHz 双声道 AAC；归档 SHA-256 记录在最终构建元数据中。
- 五条标准化分镜：均为 H.264/YUV420P、`1080×1920`、24fps、6.000 秒且无音轨；最终成片为 30.000 秒 H.264/AAC mono 48kHz，约 −16.6 LUFS、−1.3 dBTP。
- 新视频首尾/中间态证据：[`evidence/i2v-paired-import/frame-contract-comparison.jpg`](evidence/i2v-paired-import/frame-contract-comparison.jpg) 与 [`evidence/i2v-paired-import/motion-midpoints.jpg`](evidence/i2v-paired-import/motion-midpoints.jpg)；最终字幕与镜头证据：[`evidence/i2v-paired-import/final-30s-contact.jpg`](evidence/i2v-paired-import/final-30s-contact.jpg)。
- 首尾帧视觉证据：[`evidence/i2v-agent-workflow-frame-pairs-contact.jpg`](evidence/i2v-agent-workflow-frame-pairs-contact.jpg)，上排 FIRST、下排 LAST。
- 五镜头视觉证据：[`evidence/i2v-agent-workflow-storyboard-contact.jpg`](evidence/i2v-agent-workflow-storyboard-contact.jpg)。
- 机器证据：[`evidence/audit-results.json`](evidence/audit-results.json)。

## 浏览器验收

运行时：Playwright 1.62.1 + Chromium，静态 HTTP 服务。

覆盖：

| 表面 | 主题/状态 | 结果 |
| --- | --- | --- |
| 1440×1000 桌面 | 浅色；完整镜头、输出层、复制、主题和键盘旅程 | 通过 |
| 1440×1000 桌面 | 深色；证据视图 | 通过 |
| 1440×1000 桌面 | 浅色；本案例与上游双播放器、下载、差距诊断与方法边界 | 通过 |
| 1440×1000 桌面 | 浅色；真实图生视频播放器、输入图、Prompt、参数与构图漂移说明 | 通过 |
| 1440×1000 桌面 | 浅色；30 秒最终播放器、5/5 生产板、逐镜视频与五类下载 | 通过 |
| 1440×1000 桌面 | 浅色；四层能力分工、当前结论、价值、限制与优先扩展 | 通过 |
| 1440×1000 桌面 | 浅色；新闻来源、四层事实结构与实生成关键帧 | 通过 |
| 768×1024 平板 | 浅色；架构与响应式布局 | 通过 |
| 390×844 手机 | 深色 + reduced-motion | 通过 |
| 390×844 手机 | 深色；最终播放器、5/5 状态与单列卡片 | 通过 |
| 390×844 手机 | 深色；当前结论与四层生产链单列阅读 | 通过 |
| 数据请求失败 | 明确错误信息、禁用复制、给出恢复方式 | 通过 |
| 视频请求失败 | 新闻成片、历史单图、30 秒首尾帧成片与五条分镜被阻断时，MP4/SRT/Prompt/首尾帧直接下载和方法边界仍可用 | 通过 |

十三项浏览器检查全部通过，均无控制台错误、页面错误、异常失败请求和横向页面溢出；完整成片区检测到本案例和上游两个比较播放器，历史实验区读取到 `496×864` 和约 6.08 秒元数据，生产板最终播放器读取 `1080×1920` 和 30.00 秒元数据，并显示 10 张 FIRST/LAST、5/5 新视频、5 条逐镜播放/下载、1 条历史单图实验和五类生产包下载；状态匹配 Prompt 折叠区可由键盘打开。四条大视频改为 `preload="none"`，避免不同视口验收或实际首开重复下载 4–10 MB 媒体；代表性桌面视口仍显式加载并核验三条关键视频元数据。生产板证据见 [`evidence/browser/desktop-light-i2v-board.png`](evidence/browser/desktop-light-i2v-board.png) 与 [`evidence/browser/mobile-dark-i2v-board.png`](evidence/browser/mobile-dark-i2v-board.png)，新增结论层证据见 [`evidence/browser/desktop-light-project-summary.png`](evidence/browser/desktop-light-project-summary.png) 与 [`evidence/browser/mobile-dark-project-summary.png`](evidence/browser/mobile-dark-project-summary.png)，完整记录见 [`evidence/browser-validation.json`](evidence/browser-validation.json)。

## 终端审计

- 上游 submodule 与固定 commit 可解析。
- `project.json`、`projects/catalog.json` 和根 README 索引一致。
- Research Lab 校验通过。
- 静态站构建包含本项目演示。
- 设计契约覆盖清单没有 `continue`、`defer` 或 `blocked`。

## 交接

项目阶段：`completed`。本次范围内没有延期项或阻塞项。当前既保留“新闻 → Skill 分镜 → 7 张生图 → 语义区域代码运动 → MiniMax TTS/字幕 → 41 秒完整 MP4”的可复现基线，也完整交付“5 镜头生产合同 → 10 张 FIRST/LAST → 状态匹配 Prompt → 5 条外部视频模型结果 → 30 秒 MiniMax 旁白/两行字幕 → 最终 MP4”的首尾帧路线。若后续用于成本和模型横评，第一步应补记外部平台、具体模型、种子、失败率、耗时和费用；这些信息未随本次下载文件提供，因此没有在页面中猜测。
