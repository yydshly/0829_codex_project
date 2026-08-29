# LLM Wiki 能力与知识编译研究

> 研究 LLM Wiki 如何把多格式资料持续编译为可追溯 Markdown Wiki，并验证其摄取、混合检索、知识图谱、Agent / MCP 与本地优先边界。

- 状态：`paused`（阶段性研究已收口，等待后期触发条件）
- 研究对象：[nashsu/llm_wiki](https://github.com/nashsu/llm_wiki)
- 固定版本：`v0.6.11` / `e8082119649e6a8e1cf85eaf289adcabfdf39d4e`
- 研究入口：[阶段总结](notes/stage-summary.md) · [在线演示](https://yydshly.github.io/0829_codex_project/projects/llm-wiki-study/) · [本地入口](demo/index.html) · [原库界面](demo/index.html#original-ui) · [原生实测](demo/index.html#native-run) · [《左耳听风》样例](demo/index.html#left-ear-demo)
- 首轮源码审计：`14 / 14` 检查通过
- 创建 / 更新：2026-08-29

## 当前结论

LLM Wiki 不是普通的“上传文件后聊天”壳。它更像一台本地知识编译器：先保存原始资料，再用两阶段 LLM 流程抽取实体、概念、论证和矛盾，生成带 `sources[]` 与 `[[wikilink]]` 的持久 Markdown Wiki；之后才通过关键词、向量和图谱混合检索，把这层知识交给聊天、Deep Research、Agent、本地 API 与 MCP 使用。

这套架构的独特价值是：回答会结束，Wiki 会留下；检索索引可以重建，Markdown 仍可由人直接编辑、迁移和审计。

## 阶段性收口

本轮研究于 2026-08-30 暂停扩展并固化证据。已经回答了“它是什么、原理是什么、原库是否有界面、与直接模型 / RAG / Obsidian 的差异、图谱和 Skill 如何工作，以及能否形成个人知识与能力沉淀”等核心问题；同时从源码构建原生客户端，用安全《左耳听风》胶囊跑通了 Wiki、搜索、图谱、Review 与 RAG → Codex 引用回答。

当前采用判断：**值得保存为长期研究记忆层候选，但暂不升级为日常生产依赖。**价值在于把原始资料、派生 Wiki、关系图谱和可复用 Skill 外部化，使 Codex 等模型可以共享、检索和延续同一套知识；保留意见来自当前 CLI provider / Chat planner / Skills 配置摩擦，以及尚未完成 PDF / 网页、大规模吞吐、向量召回、API / MCP 和长期增量漂移验证。

后期回顾时应先阅读本节、[原生实测结果](demo/assets/native-run-result.json)和[验证记录](notes/validation.md)，不要从头重新审计已固定的 `v0.6.11`。只有上游版本明显变化或出现下方触发条件，才重新开启研究。

## 原库是否有专门界面

有。LLM Wiki 本身是一个基于 Tauri 的桌面应用，不是只有命令行或无界面的 RAG 库。原生产品以项目为单位组织资料和 Wiki，提供知识树、文件、搜索、编辑、Review、Lint、知识图谱、AI Chat、Deep Research 与设置等可视操作表面；Chrome Clipper 是网页资料入口，Markdown / Wikilink 目录还能由 Obsidian 打开。本地 API 与 MCP 则是给脚本和 Agent 使用的非可视接口。

本项目里的 Web 页面不是原生客户端复刻，而是研究伴侣：它负责解释能力、运行实验、比较 RAG / 模型调用并固定证据。页面新增的“原库界面”区直接使用上游 `v0.6.11` 随仓库提供的六张官方截图，逐张映射：

| 产品表面 | 画面中可见的能力 | 意义 |
| --- | --- | --- |
| 桌面工作区 | 项目知识树、Wiki 页面、关系图、多面板阅读 | 资料处理结果落入可维护工作区，而不是停在聊天中 |
| Deep Research | Review 缺口、来源列表、综合结果、写页入口 | 让知识缺口驱动下一轮检索并回写 Wiki |
| AI Chat | 项目问答、会话历史、长答案与引用 | 模型调用是知识层的一种消费方式 |
| 知识图谱 | 节点类型、双链网络、社群与缺口洞察 | 把关系结构与维护线索可视化 |
| Chrome Clipper | 目标项目、标题 / URL、正文预览、一键剪藏 | 让网页资料直接进入摄取管线 |
| Obsidian 兼容 | Markdown 目录、Wikilink 与外部 Graph view | 保留可迁移、可编辑的知识资产 |

界面映射数据见 [demo/assets/original-ui.json](demo/assets/original-ui.json)，官方图片副本见 [demo/assets/original-ui](demo/assets/original-ui/)，每张图在网页中都链接到固定提交里的原文件。截图只能证明产品表面与交互意图，模型质量仍由单独实验判断。

## 原生客户端《左耳听风》实测

2026-08-30 已从固定上游源码实际构建并启动 Windows Tauri 客户端，没有修改上游业务代码。我们在原库自己的项目界面中导入 4,389 B 的安全研究胶囊，调用原库内置的 Codex CLI provider，完成“资料 → Wiki → Review / 图谱 → 混合检索 → Codex 引用回答”的原生闭环。

| 层次 | 本次结果 | 它负责什么 |
| --- | --- | --- |
| LLM Wiki 产品层 | Tauri 源码构建通过；生成 9 个文件、2 个 Review；图谱 9 页 / 11 链接 | 把资料编译为可编辑、可追溯、可复用的持久知识资产 |
| RAG 检索层 | 查询“慢 SQL”得到 5 个结果：4 个关键词命中、0 个向量命中、2 个图谱命中 | 在提问时从已有 Wiki 选择相关证据并组装上下文 |
| Codex 模型层 | Codex CLI `0.150.1` / `gpt-5.4-mini` 完成知识生成与最终回答 | 理解输入、组织知识、根据已检索证据推理和表达 |

原生问答明确回答：慢 SQL 是症状或直接触发因素，但单凭它不足以证明系统根因；还应检查超时、隔离、容量、观测、发布和所有权等控制。回答返回 5 条 References，说明这里不是“Codex 自由回答”，而是本地混合检索先找证据、Codex 再生成、界面最后回链来源的 RAG 链路。

真实运行也暴露了整合边界。第一次摄取中 Codex 消耗响应预算后返回空 `agent_message`，自动第二次尝试才成功写出 9 个文件。Chat 的 Rust HTTP planner 不能直接使用 CLI provider；要触发本地 Wiki 检索后备路径，还需在原库 Skills 页面禁用自动发现的 33 个无关用户 Skill，并将 Retrieval / Agent 都设为 Standard。换言之，能力已真实跑通，但 Codex CLI 的开箱体验仍有配置摩擦，也是最明确的后续扩展点。

机器可读指标与文件哈希见 [demo/assets/native-run-result.json](demo/assets/native-run-result.json)，本机窗口证据见 [demo/assets/native-run](demo/assets/native-run/)，隔离项目、输入与原始证据见 [experiments/native-client](experiments/native-client/)。官方截图与本机实测在网页中分别标为 `OFFICIAL SCREENSHOTS` 和 `LOCAL NATIVE RUN`，不能混用。

## 进一步理解：知识与能力的双重沉淀

这次研究把 LLM Wiki 的定位推进了一步：它不只是“把资料整理成模型能识别的内容”，而是一套模型之外的长期记忆与方法资产。模型可以更换，原始来源、Markdown、来源字段、关系、Review 和 Skill 仍然保留。

```text
来源收集 → Wiki 编译 → 图谱连接 → RAG / Agent 使用
    ↑                                      ↓
    └──── Skill 复用 ← 人工修订 / Review ──┘
```

它沉淀两类不同资产：

| 资产 | 回答的问题 | 实际载体 |
| --- | --- | --- |
| 知识资产 | 我知道什么，证据在哪里，知识如何关联 | `raw/sources`、Markdown Wiki、`sources[]`、Wikilink、图谱、索引与 Review |
| 能力资产 | 我通常如何分析、判断和行动 | `SKILL.md`、检查表、输出模板、工具选择规则与人工确认边界 |

这不是把资料训练进模型参数。每次查询时，RAG 或 Agent 才从外部知识层选择证据，并按需要加载 Skill，再交给当前模型推理。这样的外部化设计使知识可以被人直接修改、用 Obsidian 管理、由 Agent 在授权范围内回写，也可以迁移、删除或交给另一种模型继续使用。

真正产生复利还需要三个条件：来源持续进入；人工处理 Review 和错误合并；只有稳定、通过验证的方法才提炼成 Skill。缺少这三点，系统仍可能退化为“自动生成很多 Markdown”，而不是可信的个人知识库。

## Codex 真实摄取结果

2026-08-29 已使用本机 Codex CLI 和安全的《左耳听风》派生研究胶囊，真实执行固定上游 `src/lib/ingest.ts::autoIngest`。输入是 1,655 字符的研究者自写结构摘要与合成慢 SQL 事故，不含 119 篇第三方专栏正文；云 Embedding、Web 搜索、MinerU、MCP 和本地 API 均关闭。

| 指标 | 结果 |
| --- | --- |
| 模型 | `gpt-5.6-luna` via Codex CLI |
| 总耗时 | 142.6 秒 |
| 模型调用 | 3 次：结构分析、Wiki 生成、专项 Review |
| Token | 65,131 input / 26,880 cached input / 6,677 output |
| 生成页面 | 8 个 Markdown，其中 5 个主题页 |
| 来源追踪 | 6 个页面带 `sources[]` |
| Wiki 关系 | 13 条 `[[wikilink]]` |
| Review | 上游 Store 保留 2 项 |
| 结构 Lint | 5 项：4 个无正文出链、1 个孤立页 |

真实产物包括来源页、合成慢 SQL 案例页、“直接触发与系统根因”概念页、“系统性故障学习审查”方法页、“不以归责替代治理”原则页和《左耳听风》背景实体页。索引、日志和内容哈希缓存也由上游管线生成。

本次最有价值的不是“生成了页面”，而是同时看见了质量边界：

- 模型正确保留了“研究者派生材料、合成事故、非专栏原文”的边界。
- 专项 Review 主动指出了一个潜在过度推断：来源只说“需要继续检查的系统条件”，生成页面不能直接把它们升级为已证实根因。
- 专项 Review 输出的第一块漏写 `END REVIEW`，导致原本 3 条建议最终只保留为 2 个 Store 项；结构化生成仍需要格式校验。
- 确定性索引正确追加了 6 个页面，但保留了模板中的“尚未摄取资料”旧文案。
- 生成图谱已经可浏览，但 5 个 Lint 提示说明关系仍需人工补全。

运行器、输入、完整 JSONL、Wiki 与机器可读结果见 [experiments/codex-ingest](experiments/codex-ingest/)。本轮使用 Node 文件适配器替代 Tauri `invoke`，并用 Node Codex transport 镜像上游 Rust transport 参数；保持不变的是上游 `autoIngest` 核心、提示、FILE/REVIEW 解析、路径规则、来源合并、索引、日志、缓存与 Review 逻辑。它验证的是 JavaScript 摄取核心，不是完整桌面壳。

## 已确认能力

| 能力层 | 能力 | 关键机制 | 当前证据状态 |
| --- | --- | --- | --- |
| 资料摄取 | PDF、Office、EPUB/MOBI、Org、网页和媒体 | Rust 解析器组合；复杂 PDF 可选 MinerU | 源码确认 |
| 资料摄取 | PDF 图片抽取与视觉字幕 | 图片落盘、哈希去重、视觉模型说明、图片搜索 | 源码确认 |
| 知识编译 | 两阶段摄取 | 先分析知识结构，再生成 / 合并受路径约束的 Wiki 页面 | 源码确认 |
| 知识编译 | 增量维护与恢复 | 内容哈希、持久队列、重试 / 取消、长文检查点 | 源码确认 |
| 知识编译 | 持久 Markdown Wiki | 原始资料、Wiki、purpose/schema 分层；YAML 来源与双链 | 源码确认 |
| 知识编译 | Review 与 Lint | 确定性结构检查 + LLM 语义检查 + 人工审核任务 | 源码确认 |
| 检索问答 | 关键词 × 向量 × 图谱 | 中英文分词、LanceDB chunk、RRF、一跳图谱扩展 | 源码确认 |
| 检索问答 | 可追溯问答 | Wiki / 来源 / 图谱工具；Faithful 模式关闭 Web 与 AnyTXT | 源码确认 |
| 知识图谱 | 社群与缺口洞察 | 双链 / 共同来源相关度、Louvain、孤立 / 稀疏 / 桥接规则 | 源码确认 |
| 深度研究 | 缺口驱动的检索与综合 | 多搜索源并行、带引用综合页、直接建立向量索引 | 源码确认 |
| Agent | 工具运行时与 Skills | Wiki / 来源 / 图谱 / Web 工具，受限工作区与命令批准 | 源码确认 |
| 外部集成 | 本地 API、9 个 MCP 工具、Clipper | `127.0.0.1:19828` JSON/SSE API 与 MCP 包装 | 源码确认 |

完整机制、输出、源码链接和待验证项见[能力展示](demo/index.html)。能力数据位于 [demo/assets/capabilities.json](demo/assets/capabilities.json)，可独立复用。

## 它与常规 RAG 的差别

```text
常规 RAG：资料 → 分块 / 向量 → 查询时召回 → 一次性回答

LLM Wiki：资料 → 分析知识结构 → 持久 Wiki → 混合检索 → Chat / Agent / MCP
                         ↑             ↓
                    人工编辑       Review / 缺口研究
```

它不是放弃 RAG，而是在 RAG 前增加一层可读、可编辑、可演化的知识表示。代价是摄取更慢、模型调用更多，而且生成 Wiki 本身也可能发生遗漏、错误合并或幻觉。

## 《左耳听风》同题样例

能力页复用此前 Cangjie Skill 研究中的《左耳听风》受控代理语料，以同一个慢 SQL 故障问题演示三种处理方式，并在下方单独呈现 Codex 真实摄取，避免把结构说明冒充运行产物：

- **直接模型调用**：只有当前问题，形成一次回答，不自动证明观点来自指定资料。
- **普通 RAG**：从 119 篇文章的分块中召回相关原文，回答可追溯，但跨文章方法主要在查询时临时组织。
- **LLM Wiki**：示例性地把同一证据组织为来源页、案例页、概念页、方法页和边界页，再用关键词、向量与图谱联合查询；回答结束后知识结构仍可复用。

此前研究的真实数据包括 119 篇 Markdown、约 852,621 字符、247 条候选知识单元和 1 个正式“系统性故障学习审查”Skill，后者通过 19 / 19 合成回归。必须同时注意：这些是此前 **Cangjie** 研究的结果，不是 LLM Wiki 对 119 篇正文的产物；三模式里的 Wiki 路径属于结构演示，紧随其后的 8 个页面才是本次安全胶囊实跑结果。完整口径见 [notes/left-ear-sample.md](notes/left-ear-sample.md) 与 [notes/real-ingest-protocol.md](notes/real-ingest-protocol.md)。

## 对当前研究工作的意义

LLM Wiki 值得作为“长期研究记忆层”的候选，而不是另一个通用聊天客户端。它尤其适合：

1. 把论文、项目源码说明、网页资料和研究日志编译成可持续维护的专题 Wiki。
2. 让 Codex、Claude Code 等工具通过 MCP 查询同一套本地知识，而不是每次重新喂上下文。
3. 从图谱中的孤立页、稀疏社群和矛盾处生成下一轮研究问题。
4. 用 Markdown 和来源字段保留退出路径，避免知识被锁在单一产品数据库中。

暂不应把它直接当成事实数据库或企业知识平台。对敏感内容，还必须区分“本地存储”与“全本地推理”：配置云模型、Embedding 或搜索服务时，资料仍可能发送给对应服务商。

## 方法与证据

源码审计回答“实现是否存在”，Codex 实验补充回答“当前安全中文样本能否跑通、会产生什么和哪里会失真”。方法如下：

1. 以 Git submodule 固定上游版本，避免研究对象漂移。
2. 阅读 README、摄取主流程、搜索融合、图谱分析、Agent 工具、本地 API 和 MCP 实现。
3. 用 [tests/audit.py](tests/audit.py) 对 14 个关键实现标记执行可复现检查。
4. 将结果保存为 [notes/evidence/audit-results.json](notes/evidence/audit-results.json)，并由展示页逐项链接到固定提交。
5. 审阅固定版本随仓库提供的官方界面截图，并把可见操作映射到对应源码能力；不从截图推断模型效果。
6. 以自写/合成胶囊执行真实 `autoIngest`，保存 Codex JSONL、生成 Wiki、token、耗时、Review 与 Lint 结果。
7. 从固定源码构建 Tauri 客户端，在原库界面内复跑安全胶囊并验证 Wiki、搜索、图谱、Review 和 RAG → Codex 引用回答。

详细的证据判定与文档漂移见 [notes/source-audit.md](notes/source-audit.md)。

## 复现

在仓库根目录执行：

```bash
git submodule update --init projects/llm-wiki-study/upstream
python projects/llm-wiki-study/tests/audit.py --output projects/llm-wiki-study/notes/evidence/audit-results.json
projects\llm-wiki-study\upstream\node_modules\.bin\vitest.cmd run --config projects\llm-wiki-study\experiments\codex-ingest\vite.config.mjs --reporter verbose
python scripts/build_site.py
python -m http.server 8000 --directory .site
```

然后访问 `http://127.0.0.1:8000/projects/llm-wiki-study/`。

## 已知边界

- 14 项源码审计仍是静态证据；真实摄取只覆盖 1 份安全 Markdown 胶囊和 1 次 Codex 运行，不能外推到全量质量与吞吐。
- 原库界面区仍使用固定版本官方截图来说明完整产品表面；另设原生实测区证明本机实际操作过的项目、Wiki、搜索、图谱、Review 与 Chat，二者证据范围不同。
- 《左耳听风》三模式对照是基于既有受控研究资产的结构映射；Codex 实测处理的是自写/合成胶囊，不是 119 篇代理正文。
- 早期 8 页面实验通过 Node 适配文件系统与 Codex transport；随后已验证 Tauri 桌面壳与原生 Codex CLI provider。尚未实测本地 API、MCP、向量命中以及 PDF/网页解析。
- 原生 Chat 依赖 Standard 检索后备路径；自动发现的无关用户 Skills 会阻止该路径，Codex CLI 又不能充当当前 Rust HTTP planner。这是版本 `v0.6.11` 的实际整合限制，不应被网页演示隐藏。
- README 提到 Deep Research 结果会“自动摄取”；当前源码改为直接写入 `wiki/queries` 并调用 `embedPage`，以避免来源复审放大。研究判断以固定提交源码为准。
- 当前同一项目的摄取队列以串行为主；大批量资料吞吐尚未测量。
- README 中的检索召回率声明尚未由本研究独立复现。
- Wiki 是 LLM 生成的派生视图，关键事实仍应回到原始资料核验；当前引用主要是页面级，claim 级定位仍有增强空间。

## 后期回顾触发条件

1. 需要建立持续数月、跨多批资料的专题知识库，而不再只是一次性研究。
2. 需要让 Codex、Claude Code 或其他 Agent 通过 API / MCP 共用同一份本地知识。
3. 上游修复 CLI provider、Chat planner 与 Skills 的配置耦合，或发布值得重新审计的大版本。
4. 准备投入 20 问召回基准、PDF / 网页解析、重复摄取漂移、批量吞吐和人工修订成本测试。

## 研究日志

### 2026-08-30

- 阶段性收口研究，状态改为 `paused`；固定网页、源码、原生运行、实验产物、失败边界和后期回顾触发条件。
- 明确研究网页与原生产品的边界：前者负责解释和实验，后者是 Tauri 桌面知识工作台。
- 将桌面工作区、Deep Research、AI Chat、知识图谱、Chrome Clipper 与 Obsidian 兼容六类官方截图接入网页，并逐项映射可见操作、留下的知识资产和固定提交证据。
- 从固定源码构建并启动 Windows Tauri 客户端，使用 Codex CLI `0.150.1` / `gpt-5.4-mini` 在原库界面中完成安全《左耳听风》胶囊摄取。
- 原生运行生成 9 个文件与 2 个 Review，形成 9 页 / 11 链接图谱，并以本地混合检索向 Codex 提供 5 个引用结果。
- 记录首次空响应恢复、Chat planner 与 CLI provider 不兼容、无关 Skills 阻断离线检索后备路径等真实边界。
- 完成原库界面区的浅 / 深主题、1440 / 768 / 390、键盘 Arrow / Home / End、原图加载和无溢出验收。

### 2026-08-29

- 建立研究子项目并以 submodule 获取上游 `v0.6.11`。
- 完成 14 项可复现源码检查，确认 12 组核心能力。
- 建立带固定源码证据的响应式能力展示页。
- 记录 Deep Research 文档与实现的策略漂移，作为后续运行验证重点。
- 用 Codex CLI 对安全《左耳听风》研究胶囊真实执行 `autoIngest`，生成 8 个页面、13 条关系和 2 个 Review 项。
- 将真实调用、生成页面、质量读数、能力意义与适用/不适用场景接入网页，并完成多视口浏览器验收。
