# 《左耳听风》样例证据与映射边界

## 为什么选择这个样例

该语料已经在 2026-08-28 的 Cangjie Skill 研究中完成一轮受控分析，拥有固定来源、全量统计、候选池、方法构造和独立合成测试记录。它适合用来解释“同一份资料经过直接模型、RAG 和持久 Wiki 后，产物为什么不同”。

## 可复用的既有事实

既有研究目录：`E:\0827_codex_project\studies\cangjie-skill\experiments\zuoer-tingfeng\column-proxy`

| 事实 | 数值或结论 | 既有证据 |
| --- | --- | --- |
| 语料性质 | 第三方公开专栏镜像的代理语料，不是纸质书全文 | `CORPUS_MANIFEST.md` |
| 固定版本 | `f2a1a74c146545a4405dd23ffe96248283a1e20a` | `CORPUS_MANIFEST.md` |
| 规模 | 119 篇 Markdown、162 张图片、约 852,621 字符 | `CORPUS_MANIFEST.md` |
| Stage 1 候选池 | 247：39 框架、108 原则、50 案例、30 反例、20 术语 | `STAGE1_REPORT.md` |
| 代表方法 | 系统性故障学习审查 | `books/zuoer-tingfeng/incident-learning-audit/SKILL.md` |
| 合成回归 | v0.1.1 全量独立回归 19 / 19，6 个负例零误触发 | 同上 `SKILL.md` 的审计状态 |

公开研究入口：[0827 Cangjie / 左耳听风 Column Proxy](https://github.com/yydshly/0827_githubcode_study/tree/main/studies/cangjie-skill/experiments/zuoer-tingfeng/column-proxy)

## 本网页实际展示什么

网页使用同一个问题：“一次慢 SQL 导致线上故障，根因就是 SQL 写得慢吗？整改应该做到什么程度？”

- 直接模型：展示没有附加资料时的典型生成路径。
- 普通 RAG：展示查询时从原始文章片段中召回证据的路径。
- LLM Wiki：根据既有慢 SQL 案例与正式 Skill，设计一组示例性来源页、案例页、概念页、方法页和边界页，展示持久知识层如何工作。

三种回答均为结构演示，不是对三个真实在线系统发起的盲测结果。尤其是 LLM Wiki 页面数量、路径和关系属于预测映射，不能声称为 `nashsu/llm_wiki` 的真实摄取产物。

## 版权与真实性边界

- 不复制或提交 119 篇第三方镜像正文。
- 页面只使用统计、短事实、派生方法和必要的案例概述。
- 不把专栏代理语料称为纸质书电子版或逐章书评。
- 不把此前 Cangjie 研究的 247 个候选写成 LLM Wiki 生成结果。
- 后续若获得用户合法提供的资料和模型配置，应另开“真实 LLM Wiki 摄取实验”，与本结构演示并列保存。
