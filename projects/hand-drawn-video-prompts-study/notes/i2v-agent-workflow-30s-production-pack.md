# AI Agent 整理任务：30 秒图生视频生产包

## 生产状态

- 结构：5 镜头 × 6 秒，9:16 竖屏。
- 首帧：5/5 已完成。
- 尾帧：5/5 已完成。
- 状态匹配图生视频 Prompt：5/5 已完成。
- 新首尾帧视频：5/5 已生成并接入。
- 历史证据：镜头 04 另有一条单图首帧实验 MP4；它不计入本次新首尾帧合同的 5/5。
- 旁白与字幕：MiniMax TTS 脚本和 30 秒 SRT 已准备；合并旁白经过动态响度归一化，实际约 −16.4 LUFS、峰值约 −1.4 dBTP。

五条源 MP4 已非破坏性归档到 `media/i2v-agent-workflow-paired-sources/`。项目以 0.10 秒、3.00 秒、5.95 秒抽帧检查首态、中间运动和尾态，再用 `scripts/build_i2v_paired_final.ps1` 统一为 5 条 6.000 秒无平台音轨分镜，并组装 `demo/assets/i2v-agent-workflow-30s-final.mp4`。最终视频为 `1080×1920`、24fps、30.000 秒 H.264/AAC，使用现有 MiniMax 旁白和两行硬字幕。

## 外部平台设置

选择“首尾帧/起止帧图生视频”。每次按文件名把 `-first.png` 上传为 FIRST、`-last.png` 上传为 LAST，不要颠倒；时长设为 6 秒、画幅设为 9:16。关闭自动配乐、自动字幕、智能扩写与预设运镜，创意度使用低到中，提示词遵循与主体保持使用高。完整可复制 Prompt 见 `demo/assets/i2v-agent-workflow-30s-prompts.txt`。

## 文件映射

| 镜头 | FIRST | LAST | 新视频状态 | 目标文件名 |
| --- | --- | --- | --- | --- |
| 01 任务洪水 | `i2v-agent-workflow-shot-01-first.png` | `i2v-agent-workflow-shot-01-last.png` | 已接入 | `i2v-agent-workflow-shot-01.mp4` |
| 02 统一收集 | `i2v-agent-workflow-shot-02-first.png` | `i2v-agent-workflow-shot-02-last.png` | 已接入 | `i2v-agent-workflow-shot-02.mp4` |
| 03 识别阻塞 | `i2v-agent-workflow-shot-03-first.png` | `i2v-agent-workflow-shot-03-last.png` | 已接入 | `i2v-agent-workflow-shot-03.mp4` |
| 04 编排流程 | `i2v-agent-workflow-shot-04-first.png` | `i2v-agent-workflow-shot-04-last.png` | 已接入；另有历史单图实验 | `i2v-agent-workflow-shot-04.mp4` |
| 05 执行闭环 | `i2v-agent-workflow-shot-05-first.png` | `i2v-agent-workflow-shot-05-last.png` | 已接入 | `i2v-agent-workflow-shot-05.mp4` |

## 最终交付

- 完整成片：`demo/assets/i2v-agent-workflow-30s-final.mp4`
- 逐镜浏览器资产：`demo/assets/i2v-agent-workflow-shot-01.mp4` 至 `-05.mp4`
- 构建元数据：`demo/assets/i2v-agent-workflow-30s-build.json`
- 烧录字幕：`media/i2v-agent-workflow.ass`；可编辑交付字幕仍为 `media/i2v-agent-workflow.srt`
- 首尾与中间态证据：`notes/evidence/i2v-paired-import/`

## ImageGen 生成记录

首轮四张主题关键帧通过内置 ImageGen 模式生成；修订 7 再以对应现有帧为 `edit target`，非破坏性补出 6 张缺失状态帧，最终形成 10 张显式 FIRST/LAST。六次编辑的完整最终提示词见 `notes/i2v-agent-workflow-frame-pair-generation-prompts.md`；逐镜头首尾状态和外部视频 Prompt 保存在 `data/i2v-agent-workflow-storyboard.json`，并由构建脚本生成可下载 TXT，避免数据与下载文件漂移。

新增关键帧的共同行为合同：暖白纸张、蜡笔质感、粗黑轮廓、钴蓝/向日葵黄/番茄红/鼠尾草绿、Q 版人物、中心 65% 主体区、底部 15% 字幕安全区、无文字/数字/Logo/水印/3D/摄影感。
