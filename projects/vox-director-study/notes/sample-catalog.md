# Vox Director 上游样例目录

固定上游提交：`668ec3946fe0139bc985313b15c1a300fca42f94`。

这里把仓库的 4 份 `beats.json` 统一成同一种比较口径。规范数据位于 `data/preproduction-data.json`，由 `scripts/build_preproduction.py` 从上游重新生成。

| 结构样例 | 原主题 | 画幅 | Beats | Shots | 适合借用的结构 | 原文件 |
| --- | --- | --- | ---: | ---: | --- | --- |
| 15 秒三段式 | Money is trust | 9:16 | 3 | 3 | 提出变化 → 快速递进 → 一句落点 | `money-15s.beats.json` |
| 30 秒时间线 | 唐代黄金时代 | 16:9 | 3 | 6 | 三个章节，每章主镜头 + 细节镜头 | `tang-30s.beats.json` |
| 60 秒解释型 | 货币简史 | 9:16 | 6 | 12 | 历史递进、概念解释、结尾升华 | `money-60s-9x16-english.beats.json` |
| 人物生涯节点 | Cristiano Ronaldo | 9:16 | 5 | 5 | 以五个关键节点组织人物故事 | `ronaldo-9x16-kling.beats.json` |

合计：17 beats、26 shots。

## Research Lab 示范预案

`data/dunhuang-demo.json` 是本研究基于“30 秒时间线”结构编写的《敦煌：沙漠中的世界十字路口》示范：9:16、30 秒、3 beats、6 shots。它采用“相遇 → 交流 → 留存”的叙事弧和沙金、青金石蓝、朱砂红、经卷米白的配色；每个 shot 都包含中文 scene、still prompt、motion prompt 与 5 秒时长。

它不是固定上游提交的第 5 份样例。前期脚本由 Research Lab 编写，6 张关键帧由 Codex 内置图片模型生成；页面和导出 JSON 均标记为 `research-demonstration-ready`，并明确视频尚未生成。

## 规范化规则

- `beat` 统一包含 `id`、`title`、`narration`、`background`、`feel` 和 `shots`。
- `shot` 统一包含 `duration`、`scene`、`still_prompt`、`motion_prompt`、参考图和参考视频。
- 上游没有 `shots` 数组时，把 beat 本身视作一个 shot。
- 上游没有 `scene` 时，使用 narration 作为视觉 Brief，并标记为派生内容。
- 上游没有静帧 Prompt 时，以 scene 作为待编辑起点，并标记 `derived-from-scene`；不把它冒充为上游原 Prompt。
- 所有上游模型 ID 只作为历史证据保存，不作为前期台的执行依赖。

## 使用边界

样例提供的是结构、字段和工作方法。把主题换成自己的内容后，必须重新编写并核验旁白、画面、事实、人物/产品权利和模型参数；不能只改项目标题就直接投喂生成模型。
