# 验证与交接记录

## 范围

验证对象为固定上游 commit `dae2da3`、最新热点新闻的七镜头 Prompt 数据、七张实生成关键帧、41.02 秒 MiniMax 配音参考成片、本案例与上游同屏比较区、中文音轨与字幕、零依赖 Web 演示和 Research Lab 静态站构建。

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
- 机器证据：[`evidence/audit-results.json`](evidence/audit-results.json)。

## 浏览器验收

运行时：Playwright 1.62.1 + Chromium，静态 HTTP 服务。

覆盖：

| 表面 | 主题/状态 | 结果 |
| --- | --- | --- |
| 1440×1000 桌面 | 浅色；完整镜头、输出层、复制、主题和键盘旅程 | 通过 |
| 1440×1000 桌面 | 深色；证据视图 | 通过 |
| 1440×1000 桌面 | 浅色；本案例与上游双播放器、下载、差距诊断与方法边界 | 通过 |
| 1440×1000 桌面 | 浅色；新闻来源、四层事实结构与实生成关键帧 | 通过 |
| 768×1024 平板 | 浅色；架构与响应式布局 | 通过 |
| 390×844 手机 | 深色 + reduced-motion | 通过 |
| 数据请求失败 | 明确错误信息、禁用复制、给出恢复方式 | 通过 |
| 视频请求失败 | MP4/SRT 直接下载和方法边界仍可用 | 通过 |

八项浏览器检查全部通过，均无控制台错误、页面错误、异常失败请求和横向页面溢出；完整成片区检测到本案例和上游两个播放器、四张差距诊断卡，本案例播放器读取到 `1080×1920` 和约 41.02 秒元数据。最终首屏证据见 [`evidence/browser/desktop-light-final-film.png`](evidence/browser/desktop-light-final-film.png)，完整记录见 [`evidence/browser-validation.json`](evidence/browser-validation.json)。

## 终端审计

- 上游 submodule 与固定 commit 可解析。
- `project.json`、`projects/catalog.json` 和根 README 索引一致。
- Research Lab 校验通过。
- 静态站构建包含本项目演示。
- 设计契约覆盖清单没有 `continue`、`defer` 或 `blocked`。

## 交接

项目阶段：`completed`。本次范围内没有延期项或阻塞项。当前已经形成“新闻 → Skill 分镜 → 7 张生图 → 语义区域代码运动 → MiniMax TTS/字幕 → 完整 MP4 → 与上游同屏比较”的可播放基线。它不是原生图生视频：若后续具备 Flow 或其他视频生成连接器，下一项扩展实验应使用同一份 `data/demo-case.json` 和七张关键帧生成动态片段，并把人物一致性、末帧漂移、失败率、耗时和成本与当前代码成片对照。
