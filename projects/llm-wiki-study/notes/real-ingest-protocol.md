# Codex 真实摄取实验协议

## 目标

验证固定上游 `v0.6.11` 的 `autoIngest` 核心能否使用本机 Codex CLI，把安全的中文研究胶囊编译为持久 Markdown Wiki，并记录来源、双链、Review、索引、日志、缓存和结构检查证据。

## 输入边界

- 输入：`experiments/codex-ingest/input/left-ear-research-capsule.md`。
- 性质：本研究自行编写的结构化摘要与合成事故，不含第三方专栏原文摘录。
- 不输入：119 篇第三方专栏代理正文、图片、个人资料、密钥或未公开文档。
- 不启用：云 Embedding、Web 搜索、MinerU、视觉模型。

## 执行路径

1. 以 `project-template/` 初始化临时 LLM Wiki 项目；用 Node 文件适配器替代 Tauri `invoke`，因为本机桌面壳前置不完整。
2. 把研究胶囊放入 `raw/sources/`。
3. 调用上游 `src/lib/ingest.ts` 导出的 `autoIngest`。
4. 仅在 LLM transport 边界使用 Node 适配器，以与上游 Rust transport 相同的安全参数启动本机 `codex exec --json`：`approval=never`、`sandbox=read-only`、`ephemeral`，并开启上游已有的本地 CLI 配置隔离。
5. 保留上游 `autoIngest` 核心、分析提示、生成提示、FILE/REVIEW 解析、路径约束、来源合并、确定性索引、日志、缓存与 Review 逻辑；文件读写由等价 Node 适配器落到实验目录。
6. 将调用元数据、生成 Wiki 和机器可读结果保存到 `experiments/codex-ingest/output/latest/`，并将脱敏摘要复制到网页资产。

## 这次能证明什么

- 能证明：在当前机器和 Codex 模型下，上游 JavaScript 核心摄取流程真实执行；生成页面、来源和关系是本次运行产物。
- 不能证明：Tauri 桌面壳、本地 API、MCP、向量检索和 119 篇全量语料质量已经通过。
- 不能证明：生成页面天然正确。模型输出仍需回到输入核验。

## 成功标准

- 至少产生一个 `wiki/sources/*.md` 和两个主题 Wiki 页面。
- 所有主题页面可在磁盘读取，至少一个页面带 `sources`，至少两个页面间存在 `[[wikilink]]`。
- `wiki/index.md` 与 `wiki/log.md` 由管线更新。
- 保存 Codex 调用次数、耗时、token 用量（若 CLI 返回）、退出码和 prompt 哈希，但不保存密钥。
- 网页明确区分“此前结构示意”和“本次 Codex 实测”。
