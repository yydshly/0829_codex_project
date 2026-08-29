# 源码、Codex 摄取与网页验证记录

验证日期：2026-08-30

## 源码审计

- 命令：`python projects/llm-wiki-study/tests/audit.py --output projects/llm-wiki-study/notes/evidence/audit-results.json`
- 结果：14 / 14 通过
- 固定版本：`v0.6.11` / `e8082119649e6a8e1cf85eaf289adcabfdf39d4e`
- 解释边界：只确认实现标记存在，不代表真实模型质量已经验证。

## 真实浏览器验收

- 命令：`python projects/llm-wiki-study/tests/browser_acceptance.py`
- 浏览器：本机 Google Chrome，由 Playwright 驱动。
- 后备说明：环境未安装 `agent-browser` CLI，按浏览器技能的失败后备要求使用现有 Playwright / Chrome 自动化完成等价验收。

| 表面或交互 | 结果 |
| --- | --- |
| 1440 × 960 浅色 | 通过，无横向溢出 |
| 1440 × 960 深色 | 通过，无横向溢出 |
| 768 × 1024 浅色 | 通过，无横向溢出 |
| 390 × 844 深色 | 通过，无横向溢出 |
| 原库六类官方界面与版本 / 来源边界 | 通过 |
| 原库界面图、说明、能力标签与固定原图链接同步 | 通过 |
| 原库界面 tab 键盘 Arrow / Home / End | 通过，当前 tab 始终滚入可视区域 |
| 本机原生运行证据与官方截图边界 | 通过 |
| 原生 Wiki / 图谱 / Review / 搜索 / RAG 截图 | 通过 |
| LLM Wiki / RAG / Codex 分工说明 | 通过 |
| 知识与能力双重沉淀模型 | 通过：来源 → Wiki → 图谱 → RAG → 修订 → Skill |
| 非模型训练边界 | 通过：Markdown / 索引 / 图谱是模型外部记忆 |
| 分类筛选 | 通过 |
| 《左耳听风》同题三模式切换 | 通过 |
| 直接模型 / RAG / LLM Wiki 内容映射 | 通过 |
| 样例 Wiki 五节点结构 | 通过 |
| 样例证据边界 | 通过 |
| Codex 真实摄取指标 | 通过：142.6 秒 / 3 次调用 / 8 页面 / 13 关系 / 2 Review |
| 真实页面浏览器 | 通过：8 页面可选择，来源、链接、路径与哈希同步更新 |
| 真实页面键盘 Arrow / Home / End | 通过 |
| 真实质量读数 | 通过：Review 合并、5 个 Lint、旧索引文案均可见 |
| 能力、意义、适用与不适用场景 | 通过 |
| 样例 tab 键盘 Arrow / End | 通过 |
| 关键词搜索、空状态与重置 | 通过 |
| 能力详情与固定提交源码链接 | 通过 |
| URL hash 状态重放 | 通过 |
| 键盘筛选导航与可见焦点 | 通过 |
| 浅 / 深主题往返 | 通过 |
| reduced-motion | 通过 |
| 研究站点首页项目入口 | 通过 |
| 控制台错误 / 页面错误 | 0 / 0 |

机器可读结果见 `notes/evidence/browser/browser-results.json`。截图证据保存在同目录，其中：

- `desktop-light.png`
- `original-ui-desktop-light.png`
- `original-ui-desktop-dark.png`
- `original-ui-tablet-light.png`
- `original-ui-mobile-dark.png`
- `native-run-desktop-light.png`
- `native-run-desktop-dark.png`
- `native-run-tablet-light.png`
- `native-run-mobile-dark.png`
- `knowledge-flywheel-desktop-light.png`
- `knowledge-flywheel-desktop-dark.png`
- `knowledge-flywheel-tablet-light.png`
- `knowledge-flywheel-mobile-dark.png`
- `capabilities-desktop-light.png`
- `capabilities-desktop-dark.png`
- `tablet-light.png`
- `mobile-dark.png`
- `capabilities-mobile-dark.png`
- `left-ear-sample-desktop-light.png`
- `left-ear-sample-desktop-dark.png`
- `left-ear-sample-tablet-light.png`
- `left-ear-sample-mobile-dark.png`
- `codex-run-desktop-light.png`
- `codex-run-desktop-dark.png`
- `codex-run-tablet-light.png`
- `codex-run-mobile-dark.png`

## Codex 真实摄取

- 命令：`upstream/node_modules/.bin/vitest.cmd run --config experiments/codex-ingest/vite.config.mjs --reporter verbose`
- 结果：1 / 1 通过，真实模型调用 3 次，总耗时 142.6 秒。
- 模型：`gpt-5.6-luna` via Codex CLI。
- 上游核心：`src/lib/ingest.ts::autoIngest` @ `e8082119649e`。
- 输入：1,655 字符研究者自写/合成胶囊；不含第三方专栏正文。
- Token：65,131 input / 26,880 cached input / 6,677 output。
- 产物：8 个 Markdown、5 个主题页、6 个带来源页面、13 条 Wikilink、2 个 Store Review、5 个结构 Lint。
- 完整证据：`experiments/codex-ingest/output/latest/result.json`、`wiki/`、`evidence/codex-call-*.jsonl`。

运行边界：这是早期 JavaScript 核心实验，使用 Node 文件适配器替代 Tauri `invoke`，并使用与上游 Rust transport 等价的 Codex CLI 安全参数。上游 `autoIngest` 核心、提示、FILE/REVIEW 解析、路径规则、来源合并、索引、日志、缓存与 Review 逻辑保持不变。第一次沙箱内调用因 socket `10013` 被拒，按环境规则从受限沙箱外重跑后通过；随后独立完成的原生客户端实测见下一节。

质量边界：专项 Review 尝试生成 2 个块，但第一块缺少 `END REVIEW`，与生成阶段的 1 个 Review 合计只在 Store 中保留为 2 项；确定性索引追加页面后仍保留模板旧文案；Lint 发现 4 个无正文出链和 1 个孤立页。这些失败信号已在网页公开展示。

## Tauri 原生客户端实测

- 固定上游：`v0.6.11` / `e8082119649e6a8e1cf85eaf289adcabfdf39d4e`。
- 运行表面：Windows Tauri desktop client；本地 Clip 服务 `127.0.0.1:19827`，本地 API `127.0.0.1:19828/api/v1`。
- 构建前置：Node `22.15`、npm `10.9.2`、Rust / Cargo `1.95`、MSVC、WebView2；项目隔离安装 `protoc 36.0`。
- 模型路径：原库内置 `codex-cli` provider，Codex CLI `0.150.1`，模型 `gpt-5.4-mini`，本地 CLI isolation 开启，连接测试通过。
- 输入：`experiments/native-client/workspace/left-ear-codex-demo/raw/sources/left-ear-research-capsule.md`，4,389 B，SHA-256 `95c8a358af782a1cbdaca348f826ca0ea6e6f18b33a216bcff68989d3a16a9d2`；不含第三方专栏正文。
- 摄取：第一次因空 `agent_message` 失败，自动第二次成功；写出 9 个文件，形成 2 个 Review，运行后 Wiki 共 10 个 Markdown（含初始 overview）。
- 图谱：9 个页面、6 个可见页面、3 个隐藏结构页、11 条链接。
- 搜索：“慢 SQL”返回 8 个 Wiki 页面。
- Chat：禁用 33 个无关自动发现 Skills，并设置 Retrieval `Standard` / Agent `Standard` 后通过；混合检索得到 5 个结果，`tokenHits=4`、`vectorHits=0`、`graphHits=2`，Codex 回答返回 5 条 References。
- 证据：`demo/assets/native-run-result.json`、`demo/assets/native-run/*.png`、`experiments/native-client/evidence/`。

原生运行没有修改上游业务代码。`mcp-server` 的 `npm ci` 报告上游依赖当前存在 5 个 audit finding（1 low、1 moderate、3 high）；本研究未执行会改变依赖解析的 `npm audit fix`。Tauri 开发进程保留打开，方便继续操作和复核。

Chat 的恢复路径揭示三个版本边界：Codex CLI 不能作为 Rust HTTP planner；非空的自动发现 Skills 会阻止 planner 不可用时的离线 Wiki 检索后备；Fast retrieval 也不会进入该后备路径。最终闭环完全通过原库现有设置完成，没有通过修改源码伪造成功。

## 知识与能力沉淀理解

网页新增“个人知识复利”段落，把已验证功能组织成六阶段闭环：来源收集、Wiki 编译、图谱连接、RAG / Agent 使用、人工修订、Skill 复用。该段落明确区分：

- 知识资产：`raw/sources`、Markdown Wiki、`sources[]`、Wikilink、图谱、索引与 Review；回答“我知道什么、证据在哪里”。
- 能力资产：`SKILL.md`、检查表、输出模板、工具选择规则与人工确认边界；回答“我通常如何分析和行动”。
- 模型边界：资料没有进入模型参数；查询时才由 RAG / Agent 检索相关知识并加载适用 Skill，所以内容和模型可以分别修改或替换。

浏览器精修记录：

- Browser environment：`http://127.0.0.1:8765/projects/llm-wiki-study/`，本机 Chrome + Playwright；`agent-browser` CLI 不可用，使用仓库既有等价验收后备。
- Baseline evidence：上一轮 `native-run-*.png` 已证明原生章节通过，但没有解释知识与方法如何形成复利，因此 Revision 5 重新打开信息、响应式和文档覆盖。
- Observed evidence：首次 390px 截图中“资料”的“料”单独换行，第二句被拆为三行。
- Problem category：手机端标题排版和信息层级。
- Root cause：Revision 5 标题沿用较大的手机标题比例，超过 390px 内容宽度。
- Minimal intervention：仅将 `.knowledge-flywheel-head h3` 的手机字号改为 `clamp(1.7rem, 8.4vw, 3.2rem)` 并微调行高。
- Adjacent regression surfaces：1440 浅 / 深、768 浅、390 深、整页 overflow、既有交互、reduced-motion。
- Observed result：两句核心结论在 390px 分别保持完整；六阶段在手机端按单列排序，桌面保持六列；四个表面无横向溢出，控制台 / 页面错误为 0。
- Runtime note：一轮回归中早期 Codex JSON 出现一次瞬时 `Failed to fetch`；两个结果资源与页面随后均返回 HTTP 200，连续重跑通过，没有复现为交付缺陷。
- Decision：pass；无新增权限或产品决策需求。

## 工程验证

- `python scripts/build_site.py`：通过，能力页已复制到 `.site/projects/llm-wiki-study/`。
- `python scripts/validate_repository.py`：通过，研究项目元数据与仓库结构有效。
- `node --check projects/llm-wiki-study/demo/app.js`：通过。
- `python projects/llm-wiki-study/tests/browser_acceptance.py`：通过，官方界面区、本机原生实测区、知识与能力飞轮和早期 Codex 摄取区在 1440 / 768 / 390、浅深主题、键盘与 reduced-motion 下均通过，控制台 / 页面错误为 0。

## 阶段性收口与发布

- 研究状态：`paused`。当前结论、原生实测、失败边界和后期触发条件已汇总到 `notes/stage-summary.md`。
- 仓库入口：根 `README.md` 已增加“阶段研究提示：LLM Wiki”，说明它对本仓库的意义、暂不作为日常生产依赖的原因，以及未来重新启动研究的条件。
- 在线交付：静态能力页随仓库既有 GitHub Pages 工作流从 `main` 分支构建，目标地址为 `https://yydshly.github.io/0829_codex_project/projects/llm-wiki-study/`。
- 发布边界：GitHub 中保留研究网页、结构化结果、原生截图、验证记录和固定上游子模块；本机临时工具目录 `.tools/` 不进入版本库。
