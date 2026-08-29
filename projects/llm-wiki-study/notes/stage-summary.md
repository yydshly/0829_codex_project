# LLM Wiki 阶段研究总结

更新日期：2026-08-30  
状态：`paused`  
研究对象：[nashsu/llm_wiki](https://github.com/nashsu/llm_wiki)  
固定版本：`v0.6.11` / `e8082119649e6a8e1cf85eaf289adcabfdf39d4e`  
在线展示：<https://yydshly.github.io/0829_codex_project/projects/llm-wiki-study/>

## 一句话结论

LLM Wiki 是一套本地优先的知识编译工作台：把多格式来源转换为人能编辑、模型能检索、Agent 能调用的持久 Markdown Wiki，再通过图谱、RAG、Review、Skills、API 和 MCP 持续使用。它沉淀的是模型之外的知识资产与方法资产，不是把资料训练进模型参数。

## 已经确认

| 问题 | 阶段结论 | 证据 |
| --- | --- | --- |
| 是否有专门界面 | 有，是 Windows / macOS / Linux 方向的 Tauri 桌面知识工作台 | 上游六类官方截图 + 本机原生窗口 |
| 是否只是 RAG | 不是；RAG 是查询阶段，前面还有来源保存、知识抽取、Wiki 生成、关系构建和 Review | 固定源码审计 `14 / 14` |
| 能否形成知识库 | 可以；主要资产是原始来源、Markdown Wiki、`sources[]`、Wikilink、索引和图谱 | Node 核心实验 + Tauri 原生实测 |
| 图谱是否只是展示 | 不是；它也参与关系评分、社群 / 缺口分析和查询扩展 | 9 页 / 11 链接原生图谱；Chat 有 2 个 graph hit |
| 能否修改 | 可以；页面可在原库编辑器中修改，也可由 Obsidian 打开，Agent 写入受权限约束 | 图谱侧栏编辑器和 Markdown 存储源码 |
| Skill 是什么 | 写给 Agent 的可复用方法说明，可指导检索、审查、生成和工具选择；不是模型微调 | `SKILL.md` 扫描与 Agent tool registry |
| 与 Obsidian 的关系 | 互补；LLM Wiki 强在自动摄取与知识编译，Obsidian 强在人工编辑、写作和成熟插件生态 | Markdown / Wikilink 兼容设计 |

## 原生实测读数

- 输入：4,389 B 研究者自写结构胶囊与合成慢 SQL 事故，不含第三方专栏正文。
- 模型：Codex CLI `0.150.1` / `gpt-5.4-mini`。
- 摄取：第一次空 `agent_message` 失败，自动第二次成功；写出 9 个文件和 2 个 Review。
- 图谱：9 个页面、11 条链接。
- 搜索：“慢 SQL”返回 8 个 Wiki 页面。
- Chat：本地混合检索得到 5 个结果，4 个 token hit、0 个 vector hit、2 个 graph hit；Codex 回答返回 5 条 References。

机器可读证据见 [`../demo/assets/native-run-result.json`](../demo/assets/native-run-result.json)，完整运行与浏览器验证见 [`validation.md`](validation.md)。

## 对我们的意义

它值得保留为长期研究记忆层候选，尤其适合把论文、源码说明、网页资料和实验日志编译为长期专题 Wiki，并让 Codex、Claude Code 等 Agent 通过同一个知识层工作。最有价值的闭环是：

```text
来源 → Wiki → 图谱 → RAG / Agent → 人工修订 → Skill → 下一批来源
```

其中知识资产回答“我知道什么、证据在哪里”，能力资产回答“我通常如何分析和行动”。模型只是可替换的使用者。

## 当前不采用为生产依赖的原因

- Codex CLI 不能充当当前 Rust HTTP planner；原生 Chat 需要特定 Standard 后备路径。
- 自动发现的无关用户 Skills 会影响普通 Wiki 检索链路，本次必须禁用 33 个 Skills 才跑通。
- 真实模型样本仍只有安全 Markdown 胶囊，没有覆盖复杂 PDF、网页、批量资料和长期重复摄取。
- 向量召回、本地 API、MCP、权限协作、claim 级引用和企业级吞吐尚未独立验收。
- Wiki 是模型生成的派生视图，不是事实数据库；关键结论仍需回到原始来源。

## 后期重新开启的触发条件

1. 出现需要持续数月维护的专题知识库。
2. 需要让多个 Agent 共用本地长期知识。
3. 上游发布修复 CLI / planner / Skills 耦合的重要版本。
4. 可以投入 20 问召回基准、PDF / 网页解析、重复摄取漂移和人工维护成本测试。

重新开启时先核对上游新版本与本总结的差异，不重复已经固定的 v0.6.11 审计和安全样例实验。

## 回顾入口

- [项目完整 README](../README.md)
- [在线能力展示](https://yydshly.github.io/0829_codex_project/projects/llm-wiki-study/)
- [源码审计说明](source-audit.md)
- [真实摄取协议](real-ingest-protocol.md)
- [验证记录](validation.md)
- [设计与理解演进](design-contract.md)

