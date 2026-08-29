# Rachel Digital Human Production 研究记录

## 研究范围

- 上游：<https://github.com/Jingyi-Wu-Richael/rachel-digital-human-production>
- 审计日期：2026-08-29
- 方法：阅读根 README、`SKILL.md`、`agents/openai.yaml`、`references/` 和 `scripts/`；对照 MiniMax、HeyGen 官方接口说明及我们此前的数字人实测记录。
- 本轮未执行：安装 Skill、上传人物或声音、调用付费 API、生成重复样片。

## 文件级观察

### `SKILL.md`

定义了固定生产门：

```text
asset check -> MiniMax narration -> 15-second HeyGen preview
-> user approval -> full HeyGen video -> download QA -> archive state
```

该文件是面向 Codex 的操作规则，不是人物驱动或口型推理代码。关键生产动作均表述为“上传、调用、轮询和下载”，实际执行依赖外部服务。

### `scripts/preflight_assets.py`

可验证：

- 脚本扩展名为 Markdown 或文本；
- 肖像扩展名为 JPEG/PNG，大小不超过预设资产上限；
- 声音扩展名为 MP3/M4A/WAV，大小不超过预设声音上限；
- 安装 `ffprobe` 时，声音时长是否在 10–300 秒范围。

不能验证：

- 是否真的只有一张清晰正脸；
- 人物是否成年及是否获得授权；
- 声音是否为单一说话人、是否干净；
- MiniMax/HeyGen 账号、额度和接口是否可用；
- 口型、表情和视频质量。

### `scripts/init_job_state.py`

只创建状态骨架，字段包括 MiniMax 文件/声音 ID、HeyGen 图片/音频/视频 ID、审批状态和输出路径。它没有：

- 文件哈希，因而无法可靠证明“源文件没有变化”；
- 状态版本、迁移、锁或原子更新机制；
- 外部任务轮询、重试退避、Webhook 或队列；
- 成本记录、供应商响应摘要和自动质量指标。

### `references/`

提供 API 事实摘要、审核清单和公共发布安全规则。这些内容能减少误操作，但仍是文档约束，并不会自动获得第三方账号、计费额度、素材授权或法律许可。

## 与既有研究的证据链

既有项目：<https://github.com/yydshly/0822_githubcode_study/tree/main/projects/lanshu-create-ai-presenter-video>

我们此前已经完成：

1. 审计另一套供应商无关的 Codex 数字人工作流；
2. 用 MiniMax 中文旁白接入 D-ID V2 Photo Avatar；
3. 记录 11.4 秒样片、41.7 秒生成耗时和 1 积分消耗；
4. 人工判定 D-ID 单图结果口型和身体表现不满足产品质量；
5. 使用 HeyGen Digital Twin 生成 12.16 秒中文样片；
6. 判定 HeyGen 在人物稳定、口型、声音和上半身动作方面明显更好；
7. 同时记录 HeyGen 样片几乎不眨眼，保留人工 QA 要求。

因此 Rachel 没有提出尚未覆盖的新研究问题，也没有包含能推翻既有结论的新模型或实现。

## 事实、解释与决策

### 观察事实

- 仓库包含流程说明、参考文档和两个辅助脚本；
- 声音克隆与配音由 MiniMax 提供；
- 照片人物、口型和视频由 HeyGen 提供；
- 仓库没有实现完整供应商客户端或数字人模型；
- 最终质量仍由 HeyGen 模型和人工审核决定。

### 解释

该项目的合理定位是“MiniMax + HeyGen 数字人口播 SOP”，而不是数字人能力本身。它减少的是调用顺序、审批和任务记录方面的组织成本，不能改善外部模型的口型、动作或身份稳定性。

### 决策

对首次使用 Codex 制作数字人口播的人，这套 SOP 有入门价值；对已经完成更广泛工作流审计和真实供应商 A/B 的我们，边际研究价值不足以支持继续安装、编码或付费验证，故状态设为 `archived`。

## 可复用检查规则

未来遇到名字包含“数字人生产”的仓库，先检查：

1. 是否包含模型权重、训练代码或本地推理实现；
2. 不配置第三方 API 时，是否仍能生成会说话的人物视频；
3. 仓库解决的是生成质量，还是只解决调用流程；
4. 是否有真实样片、质量基准、测试和成本证据；
5. 与现有研究相比，是否新增可验证能力。

若没有模型、离不开成熟付费 API、主要内容是 Skill/SOP，且结论与既有研究重复，应快速记录后归档，不再投入重型环境或重复付费测试。
