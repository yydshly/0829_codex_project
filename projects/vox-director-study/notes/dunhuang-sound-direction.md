# 《敦煌：沙漠中的世界十字路口》声音试听 v2

## 目的与边界

这一版用于判断 30 秒叙事的语速、停顿和声音层次，不是发布母版。

- 旁白：Microsoft Edge 在线神经网络音色 `zh-CN-YunyangNeural`，成年男声，语速 −6%、音高 −8 Hz；方向为专业、可靠、克制的历史纪录片叙述。
- 环境声：Codex / Research Lab 使用 FFmpeg 程序化合成，没有下载或引用外部音乐、采样和音效。
- 合成：FFmpeg 对齐、旁白触发环境声 ducking、响度归一化并复用静音粗剪的 H.264 画面流。
- 归属：视频素材来自用户外部模型；TTS、环境声与混音不是 vox-director 原库在本项目中的执行结果。
- 发布边界：神经网络 TTS 仅作试听，不冒充真人；三段非敏感旁白文本已发送给在线 TTS 服务。正式发布前仍需确认音色选择、服务使用条款、音乐方向和字幕样式。

## 文件

| 文件 | 用途 |
| --- | --- |
| `media/dunhuang/final/dunhuang-sound-preview-v2.mp4` | 默认 30 秒带声音试听视频 |
| `media/dunhuang/final/dunhuang-narration-yunyang-v2.m4a` | 30 秒神经网络旁白分轨 |
| `media/dunhuang/final/dunhuang-ambient-bed-v1.m4a` | 30 秒原创环境声分轨 |
| `media/dunhuang/final/dunhuang-audio-mix-v2.m4a` | v2 旁白 + 环境声混音分轨 |
| `media/dunhuang/audio/narration/B01-yunyang-v2.mp3` | B01 神经网络旁白母段 |
| `media/dunhuang/audio/narration/B02-yunyang-v2.mp3` | B02 神经网络旁白母段 |
| `media/dunhuang/audio/narration/B03-yunyang-v2.mp3` | B03 神经网络旁白母段 |

## 时间与响度

| Beat | 起点 | 旁白源时长 | 检测到的主要发声结束 |
| --- | --- | --- | --- |
| B01 | 00:00.500 | 8.760 秒 | 约 00:08.651 |
| B02 | 00:10.550 | 8.232 秒 | 约 00:18.177 |
| B03 | 00:20.350 | 9.096 秒 | 约 00:28.838 |

每段均在自己的 10 秒 beat 内结束。最终混音约 −17.6 LUFS，峰值约 −1.2 dB；环境声在旁白出现时通过 sidechain compression 自动降低。声音版和三条分轨均为精确 30.000 秒，最终 MP4 为 720×1280、30fps、48kHz 双声道 AAC。

## 临时声音方向

- 旁白：成年男声、标准普通话、专业可靠、克制清楚，不模仿名人或特定真人；避免广告腔、体育解说腔和过度煽情。
- 声床：73.42 Hz 与 110 Hz 的低频持续音、滤波粉红噪声模拟的轻风，以及约 10/20 秒处的低音量提示音。
- 不包含：现成音乐、民族乐器采样、影视配乐模仿、原视频模型音轨、标题音效或硬字幕。

## 版本保留

用户实听后认为 `Microsoft Kangkang` v1 机械感较强、与敦煌纪录片气质不符，因此 v2 改为神经网络音色。`dunhuang-sound-preview-v1.mp4`、`dunhuang-narration-kangkang-v1.m4a`、`dunhuang-audio-mix-v1.m4a` 和三段 Kangkang WAV 继续保留，仅不再作为页面默认试听。

如果之后更换真人或其他 TTS，只需替换旁白分轨并重新运行混音；画面粗剪、环境声分轨、SRT 和六段源视频都不需要覆盖。
