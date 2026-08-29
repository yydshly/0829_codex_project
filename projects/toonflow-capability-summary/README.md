# Toonflow 能力与复用边界总结

> Toonflow 是与 AIComicBuilder 高度重合的 AI 短剧生产工作台；本项目保存其 Agent、Skill、模型 API 与复用边界，当前不重复部署，待连续短剧生产需求出现时重新评估。

## 项目信息

- 状态：`archived`
- 创建与归档日期：2026-08-29
- 项目 ID：`toonflow-capability-summary`
- 上游仓库：[HBAI-Ltd/Toonflow-app](https://github.com/HBAI-Ltd/Toonflow-app)
- 前端仓库：[HBAI-Ltd/Toonflow-web](https://github.com/HBAI-Ltd/Toonflow-web)
- 审阅版本：`Toonflow-app master@e03cf590eb0cab63534a4040db9acb4ec95b42a6`
- 前端版本：`Toonflow-web master@9c4cb0ec7d4f6b4067c7768e2df8cdc7f8587214`
- 审阅方式：README、目录结构和关键源码审计；未本地安装，未调用付费模型，未重新制作样片

## 一句话结论

Toonflow 不是底层视频模型，也不只是一个生成视频的 Skill 库。它是一套内含多个领域 Agent、SQLite 项目数据、无限画布、模型供应商适配器和媒体工作台的 AI 短剧应用：负责把小说、剧本、角色、资产、分镜和外部模型任务组织成生产流程，真实画面仍由接入的文本、图片、视频和 TTS 服务生成。

它和我们已经深入验证的 AIComicBuilder 属于同一产品类别，小说到视频的主体能力高度重合。其可见增量主要是内置决策/执行/监督 Agent、Markdown Skill 管理、本地 ONNX 语义记忆和可在线编辑的 TypeScript 供应商代码；这些属于交互与扩展机制改进，没有解决此前实验暴露的故事因果、人物状态、跨镜连续性、自动审片和可靠返工等核心难题。因此当前不重复部署和付费验证，只保留差异总结与重新使用指南。

## 它实际是什么

需要区分模型、Agent 与应用三个层级：

```text
外部 LLM / 图片模型 / 视频模型 / TTS
                    ↓
Toonflow 领域 Agent
  ├─ ScriptAgent：决策、编剧、编辑/监督
  └─ ProductionAgent：决策、执行导演、监制
                    ↓
Toonflow 应用
  ├─ 小说、剧本、角色、场景、道具和分镜数据
  ├─ SQLite、任务状态、本地素材和 Agent 记忆
  ├─ Vue Flow 无限画布与 WebAV 媒体工作台
  └─ Electron、Express、Socket.IO 与供应商适配器
```

Agent 的“思考能力”来自用户配置的 LLM API。Toonflow 本身没有训练或提供视频基础模型；图片和视频质量取决于外部供应商、参考素材、提示词及人工选择。

## 主要能力

- 导入和管理小说章节，调用 LLM 为章节提取事件摘要。
- 通过 ScriptAgent 生成故事骨架、改编策略和分集剧本。
- 通过 ProductionAgent 提取角色、场景、道具及衍生资产，生成导演计划、分镜表和分镜面板。
- 调用文本、图片、视频和 TTS 供应商，保存素材及任务结果。
- 在无限画布中组织剧本、资产、分镜和视频节点。
- 用 Markdown 文件管理编剧、导演、题材和画风 Skill，并允许在线调整。
- 使用本地 ONNX Embedding、SQLite 消息、近期对话和摘要提供跨会话记忆。
- 通过 TypeScript 供应商模板实现 OpenAI、Anthropic、Google、DeepSeek、通义、智谱、MiniMax、xAI 及兼容接口的接入。

README 所称“章节事件图谱”在当前关键实现中主要表现为：逐章调用 LLM 生成一段事件文本，存入章节记录，再由 Agent 按章节索引查询。没有看到能够直接解决实体关系、事件因果、人物知识状态和跨集时间线的完整图谱模型，因此不应把该名称等同于我们需要的全剧连续性知识图谱。

## 与既有小说转视频研究的关系

| 既有项目 | 核心定位 | 与 Toonflow 的关系 |
| --- | --- | --- |
| [AIComicBuilder](https://github.com/yydshly/0807_githubcode_study/tree/main/AIComicBuilder) | 项目、分集、角色、分镜、关键帧、任务、版本、返工和 FFmpeg 合成的短剧生产执行系统 | 最接近的同类产品；主体能力高度重合，且我们已经完成本地运行、模型接入、控制器、外部视频回流和真实样片验证 |
| [shuohao-skills](https://github.com/yydshly/0827_githubcode_study/tree/main/studies/shuohao-skills) | 小说到大纲、角色、美术、剧本、分镜投产包的结构化 Skills 与确定性质量门 | 可作为 Toonflow 上游 Schema 和质检层；其流程终点是投产包，不负责模型任务与成片 |
| [Story-to-Handdrawn Video](https://github.com/yydshly/0822_githubcode_study/tree/main/projects/story-to-handdrawn-video) | 故事规划、静态手绘分镜与 Remotion 确定性合成 | 范围更窄、风格固定，但确定性成片更清晰；可作为 Toonflow 的特定画风与后期 Adapter |
| [Vox Director](../vox-director-study/) | 镜头级前期导演数据、生成素材和本地可重复合成 | 可作为下游导演包、后期和 QA 参考；Toonflow 更侧重项目工作台与外部模型编排 |

最准确的能力分工是：

```text
shuohao：结构化改编与预生产质量门
    ↓
Toonflow / AIComicBuilder：项目、资产、分镜和模型任务控制
    ↓
图片与视频模型：具体生成
    ↓
Vox Director / Remotion / FFmpeg：确定性后期与交付
```

## 与 Codex 的区别

Codex 是通用软件工程和计算机操作 Agent，可以读取代码、运行命令、修改文件并通过工具完成不同领域任务。Toonflow 的 Agent 是短剧应用内部的固定业务角色，只能通过预先提供的工具读取章节、写入剧本、建立资产、生成分镜和触发模型任务。

因此两者不是替代关系：

- Toonflow 可以不依赖 Codex，直接配置模型 API 独立运行。
- Codex 可以位于 Toonflow 上方，负责主创判断、全剧因果检查、批次审批、生成后审片和返工决策。
- 若要让 Codex 稳定控制 Toonflow，应新增受支持的 CLI、MCP 或 REST Adapter，而不是依赖直接修改 SQLite 或临时操作网页。

## 直接接入 API 的方式

Toonflow 的正常使用就是接入外部 API。最低需要：

1. 文本模型：事件提取、Agent 决策、故事骨架、改编、剧本和分镜分析。
2. 图片模型：角色、场景、道具、衍生资产和分镜图。
3. 视频模型：文本、单图、首尾帧或多参考视频生成。
4. 可选 TTS：角色配音与声音资产。

基本链路：

```text
安装 Toonflow 客户端或私有部署
→ 修改默认管理员密码
→ 配置可信的文本/图片/视频供应商和 API Key
→ 为 ScriptAgent、ProductionAgent 绑定文本模型
→ 新建项目并导入少量章节
→ 提取事件、生成骨架和剧本
→ 建立角色/场景锚点并生成分镜
→ 只投产 1–3 个低风险镜头
→ 审查连续性、费用和失败恢复
→ 通过后再扩大批次
```

供应商代码经过 TypeScript 转译后在 `vm2` 中运行，并被提供 `fetch`、Axios、模型 SDK 和图片处理能力。其执行超时设置及网络能力意味着这些脚本应被视为管理员可信代码；不要允许不可信租户上传，也不要把带默认账号、模型密钥和动态供应商编辑能力的实例直接暴露公网。

## 当前没有解决的关键问题

Toonflow 没有从根本上补齐我们此前小说短剧实验的失败原因：

- 小说是否值得改编，以及主角目标、阻力和人物弧是否成立。
- 跨集事件因果、信息揭示顺序和人物知识状态。
- 服装、道具、伤势、时间、空间位置和镜头起止状态的结构化账本。
- 图片模型是否真正保持角色、场景和构图一致。
- 视频模型是否正确执行动作、对白、镜头切点和多角色互动。
- 自动视觉审片、局部返工、费用控制和可恢复的供应商任务。
- 面向多人、租户、权限、审计和对象存储的生产级 SaaS 架构。

多 Agent 角色可以生成与审核文字，但“监督 Agent 返回通过”不能替代视频抽帧、连续播放和人工视觉验收。

## 后期重新使用指南

### 重新启用条件

只有出现以下任一真实需求时，才值得重新打开本项目：

- 准备制作连续、多集、多角色的小说漫改或 AI 短剧。
- 需要可视化地管理大量角色、场景、分镜和模型任务。
- AIComicBuilder 当前数据模型或 UI 无法满足生产要求，需要比较替代工作台。
- 希望把自有画风 Skill 或新视频供应商以文件/Adapter 形式接入。
- Toonflow 新增全剧因果图、角色状态机、自动视觉 QA、持久任务恢复等可验证能力。

### 重新评估时只比较增量

不再重复回答“能否调用模型生成视频”，而只验证：

1. 内置决策、执行和监督 Agent 是否比 AIComicBuilder + Codex 控制层更稳定。
2. Skill 热编辑能否显著降低题材、画风和导演规则的维护成本。
3. 供应商热插拔是否真的兼容目标文本、图片和视频 API。
4. 长篇章节事件是否能维持因果、人物知识和跨集状态，而不只是摘要召回。
5. 任务失败、超时、重启、重复提交和费用记录是否可恢复、可审计。
6. WebAV 导出是否满足字幕、音频、转场、响度、编码和平台交付要求。

### 推荐的最小对照实验

- 使用与既有 AIComicBuilder 样片相同的 30–60 秒、3–6 镜头剧本。
- 固定同一文本、图片和视频供应商，避免把模型差异误判为工作台差异。
- 比较建档耗时、人工操作次数、角色一致性、失败恢复、局部返工、API 成本和最终成片完整度。
- 先验证一个镜头，再扩展到三镜连续播放；未通过连续性门不批量投产。
- 将 Toonflow 数据导出能力、许可证和供应商密钥迁移能力纳入退出测试，避免形成新的平台锁定。

## 许可与采用边界

仓库声明 Apache-2.0，同时附加商业分发和品牌保留条件：以产品形式向两个及以上独立第三方分发需要书面商业授权，且不得删除或修改 Toonflow 标识。个人学习、内容生产和限定范围内部使用被列为免费场景。它不是无附加条件的标准 Apache-2.0 使用情形；若未来对外部署、销售或白标，应重新核对当时的完整 LICENSE 并取得必要授权。

## 归档决定

```text
小说生成视频新增能力：低
与 AIComicBuilder 的重复度：高
Agent / Skill / 供应商架构参考：中
当前直接采用必要性：低
重新启用价值：取决于连续短剧生产需求
```

当前不克隆上游、不安装客户端、不配置模型密钥、不制作重复样片，也不把官方 Demo 成本和质量当作本地验证结果。保留本说明，用于未来快速判断是否值得重新比较或接入。

## 主要证据入口

- [Toonflow-app README](https://github.com/HBAI-Ltd/Toonflow-app/blob/e03cf590eb0cab63534a4040db9acb4ec95b42a6/README.md)
- [ScriptAgent 实现](https://github.com/HBAI-Ltd/Toonflow-app/blob/e03cf590eb0cab63534a4040db9acb4ec95b42a6/src/agents/scriptAgent/index.ts)
- [ProductionAgent 实现](https://github.com/HBAI-Ltd/Toonflow-app/blob/e03cf590eb0cab63534a4040db9acb4ec95b42a6/src/agents/productionAgent/index.ts)
- [Agent 记忆实现](https://github.com/HBAI-Ltd/Toonflow-app/blob/e03cf590eb0cab63534a4040db9acb4ec95b42a6/src/utils/agent/memory.ts)
- [本地 Embedding 实现](https://github.com/HBAI-Ltd/Toonflow-app/blob/e03cf590eb0cab63534a4040db9acb4ec95b42a6/src/utils/agent/embedding.ts)
- [统一模型与供应商调用层](https://github.com/HBAI-Ltd/Toonflow-app/blob/e03cf590eb0cab63534a4040db9acb4ec95b42a6/src/utils/ai.ts)
- [供应商脚本运行环境](https://github.com/HBAI-Ltd/Toonflow-app/blob/e03cf590eb0cab63534a4040db9acb4ec95b42a6/src/utils/vm.ts)
- [Toonflow-web 依赖与 WebAV/Vue Flow](https://github.com/HBAI-Ltd/Toonflow-web/blob/9c4cb0ec7d4f6b4067c7768e2df8cdc7f8587214/package.json)
- [完整许可证](https://github.com/HBAI-Ltd/Toonflow-app/blob/e03cf590eb0cab63534a4040db9acb4ec95b42a6/LICENSE)
