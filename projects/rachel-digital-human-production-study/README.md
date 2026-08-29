# Rachel Digital Human Production 采用价值研究

> 该 Skill 是否提供独立数字人能力；审计确认它只是 MiniMax 与 HeyGen 的固定流程封装，且与既有研究高度重复，因此归档。

## 项目信息

- 状态：`archived`
- 创建日期：2026-08-29
- 最近更新：2026-08-29
- 项目 ID：`rachel-digital-human-production-study`
- 上游仓库：[Jingyi-Wu-Richael/rachel-digital-human-production](https://github.com/Jingyi-Wu-Richael/rachel-digital-human-production)
- 对照研究：[lanshu-create-ai-presenter-video](https://github.com/yydshly/0822_githubcode_study/tree/main/projects/lanshu-create-ai-presenter-video)

## 一句话结论

该仓库没有独立的数字人模型、声音模型或完整生成程序。它用 Codex Skill 规定一条固定生产流程：MiniMax 负责声音克隆与 TTS，HeyGen 负责照片人物、口型和视频生成，仓库自身只补充素材预检、15 秒预览审批、任务 ID 记录与安全规则。

对一般使用者，它可以作为简洁 SOP；对我们而言，能力与此前的 `lanshu-create-ai-presenter-video` 研究高度重复，且后者已经完成 D-ID 与 HeyGen Digital Twin 的真实样片对比。因此本项目不继续安装、接入或付费验证，只保留研究结论。

## 它实际实现了什么

```text
脚本 + 授权肖像 + 授权声音样本
                ↓
          本地素材预检
                ↓
    MiniMax 声音克隆与完整配音
                ↓
      截取 15 秒预览音频
                ↓
 HeyGen Image-to-Video 生成预览
                ↓
      用户审核口型、脸部和动作
                ↓
       HeyGen 生成完整 1080p
                ↓
         下载检查与状态归档
```

仓库自身的可执行代码只有两个辅助脚本：

- `scripts/preflight_assets.py`：检查脚本、肖像和声音文件是否存在，验证扩展名、大小，并在有 `ffprobe` 时检查声音时长；
- `scripts/init_job_state.py`：创建记录 MiniMax、HeyGen 任务 ID、审批状态和输出路径的 `job-state.json` 骨架。

MiniMax/HeyGen 的上传、声音克隆、TTS、视频创建、轮询、下载和完整 QA 并没有被实现为仓库内的生产客户端，仍需要 Codex 临场调用外部服务或另行开发。

## 能力归属

| 最终能力 | 实际提供者 | 本仓库的作用 |
| --- | --- | --- |
| 声音克隆 | MiniMax | 规定调用顺序、命名和复用 `voice_id` |
| 文本转配音 | MiniMax | 规定保存完整音频和 15 秒预览音频 |
| 照片人物动画 | HeyGen | 规定上传肖像和音频资产 |
| 口型、表情和动作 | HeyGen | 提供人工检查清单，不提供模型 |
| 1080p 数字人成片 | HeyGen | 设置预览批准后才能生成的流程门 |
| 素材预检 | 两个本地 Python 脚本 | 提供基础格式、大小和时长检查 |
| 任务恢复 | JSON 状态约定 | 记录外部任务 ID，但没有完整任务引擎 |

因此它属于成熟付费能力之上的**流程控制与业务封装**，不是数字人算法项目。

## 与既有研究的关系

我们此前研究的 `lanshu-create-ai-presenter-video` 同样是 Codex 数字人生产工作流，但范围更完整：它将声音、主讲人、短动作、口型修复、词级时间戳、时间线合成、编码与 QA 设计成可替换能力槽位，而不是固定绑定两家供应商。

既有研究还形成了真实对照证据：

- MiniMax 中文配音 + D-ID V2 单图头像链路可以运行，但口型自然度、手势和上半身表现未通过人工验收；
- HeyGen Digital Twin 的人物稳定性、中文声音、口型和上半身动作明显更好，是当前更适合交付的 `main_presenter`；
- HeyGen 成片仍出现几乎不眨眼的问题，说明商业服务也不能替代人工 QA；
- 单条视频追求最快效果时应直接使用 HeyGen；只有批量、多语言、多渠道、多供应商、审批和成本审计出现后，工作流控制层才产生明显价值。

需要特别区分：此前验证效果最好的是由真人训练视频建立的 **HeyGen Digital Twin**；Rachel 默认描述的是单张肖像驱动的 **Image-to-Video**。二者都属于 HeyGen，但不能假定单图路线达到 Digital Twin 的稳定性和身体表现。

## 研究判断

| 维度 | 结论 |
| --- | --- |
| 数字人算法研究价值 | 低：没有模型、权重、训练或推理实现 |
| 声音技术研究价值 | 低：完全依赖 MiniMax |
| 口型与人物驱动研究价值 | 低：完全依赖 HeyGen |
| 工作流参考价值 | 中：预览门、ID 复用和授权检查值得借鉴 |
| 工程复用价值 | 低：执行代码少，关键 API 适配仍需自建 |
| 对我们的新增价值 | 很低：既有研究覆盖更广，并有真实样片证据 |

## 保留的三条经验

1. 付费生成完整长视频前，先做 15 秒低成本预览。
2. 保存并复用 `voice_id`、`asset_id` 和 `video_id`，超时后继续查询原任务，不重复付费生成。
3. 声音相似度、中文口型、脸部变形、眨眼、肩部动作和平台构图必须经过人工审核。

## 采用决策

- 不安装为当前核心 Skill；
- 不复制上游源码或外部服务凭据；
- 不重复进行 MiniMax + HeyGen 付费样片测试；
- 不作为数字人算法或自主可控方案继续研究；
- 将“15 秒预览门”和外部任务 ID 复用规则并入既有数字人生产方法；
- 实际生产优先采用 `MiniMax/HeyGen Voice + HeyGen Digital Twin + FFmpeg/Remotion + 自有 QA`。

## 重新启动条件

只有出现以下任一条件才重新评估：

- 仓库新增可运行的 MiniMax/HeyGen 客户端、任务队列、失败恢复和自动 QA；
- 引入可替换的本地人物驱动或口型模型，不再完全绑定付费产品；
- 我们需要把 MiniMax 声音与 HeyGen 单图路线正式批量化，并且既有 `lanshu` 控制层无法满足需求；
- HeyGen Image-to-Video 与 Digital Twin 出现需要重新实测的显著能力或成本变化。

## 证据与局限

本轮属于源码与文档审计，没有调用付费 API，也没有用 Rachel 流程重新生成样片。关于 D-ID 与 HeyGen 的质量判断来自我们在 2026-08-23 完成的既有实验，而不是对 Rachel 的重复测试。外部服务的模型、接口、价格和质量会变化，未来若影响实际采购，应重新查阅官方文档并做短样片验证。

更详细的文件级证据和对照依据见 [研究记录](notes/research-report.md)。
