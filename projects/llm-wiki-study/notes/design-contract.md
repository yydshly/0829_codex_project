# LLM Wiki 能力展示设计契约

## 契约

- Entry mode：Revision-led；在已通过原生实测的研究页上，补充“个人知识与能力如何长期沉淀”的理解模型。
- Request revision：5。
- Target user and context：正在比较开源 AI/知识管理项目的研究者，需要在数分钟内理解 LLM Wiki 的差异化能力、证据入口与研究状态。
- Desired first impression：它不是一次性文档问答，而是一条“资料 → 持久 Wiki → 混合检索 → Agent”的知识编译流水线。
- Visual ambition：Editorial。
- Experience architecture：Editorial Flow。
- Visual constraints：研究型而非营销型；首屏必须先解释核心差异，能力卡片只承担导航；使用深墨蓝、纸白和高可读强调色，不依赖大图、视频或高成本渲染。
- Information constraints：所有能力声明必须能追溯到上游 README、依赖或核心源码；区分“已实现”“可选能力”“尚待实测”。
- Operation constraints：展示端保持纯静态 HTML/CSS/JavaScript；实验端允许调用本机 Codex CLI，并复用上游真实 `autoIngest` 分析、FILE/REVIEW 解析、写盘、索引、日志与缓存链路；不引入登录、长期后端或云 Embedding。
- State constraints：默认总览、原库六类官方界面切换、样例三种模式、Codex 实测摘要/生成页面/调用记录、分类筛选、选中能力、无匹配结果、浅色/深色主题；能力选择继续由 URL hash 重现，界面与样例模式由语义化 tab 控件重现。
- Environment constraints：研究页由仓库 `python scripts/build_site.py` 复制到 `.site`；原生客户端在 Windows 本机从固定上游提交构建，优先使用已有 Node / Rust / WebView2 环境，不改变用户全局配置；界面证据来自真实应用窗口截图和可复现启动日志。
- Primary journey：研究者先看原生实测结果，再沿“来源 → Wiki → 图谱 → RAG → Review → Skill”理解哪些资产会留下、谁可以修改，以及为什么这是一套外部知识与方法的复利系统而不是模型训练。
- User-defined phases：① 获取上游源码；② 首先展示能力；③ 后续深入研究摄取、检索、图谱和 Agent；④ 使用之前研究过的《左耳听风》进行网页样例演示；⑤ 按现有环境直接使用 Codex 处理并演示，同时总结能力、意义和使用场景；⑥ 展示原库专门界面并合理映射原库能力；⑦ 实际构建原生客户端并在其中验证《左耳听风》安全样例；⑧ 补充它如何沉淀个人知识库与可复用能力。
- Required artifacts：`upstream` 源码子模块、研究 README、能力展示页、固定版本的上游官方界面资产及其能力映射、《左耳听风》安全派生胶囊、Codex 摄取运行器与真实产物、机器可读实验结果、网页实测演示、个人知识与能力飞轮、设计契约、浏览器验收记录、桌面与移动端最终证据、仓库校验结果。
- Autonomy authorization：用户已明确确认进入“实际构建原生桌面客户端，并把《左耳听风》实验放进原生 UI”阶段，授权在隔离研究项目内安装项目依赖、构建、启动和验证；不授权改变用户全局模型配置或上传第三方专栏正文。
- User-decision boundary：第三方专栏正文、云 Embedding、付费搜索服务、119 篇全量摄取和长期采用决策；本轮只使用研究者自写/合成派生胶囊。用户已明确授权本机 Codex 调用。
- Observable completion criteria：既有原生证据保持有效；新增内容可清楚回答“沉淀什么、存在哪里、如何复用、谁能修改、哪些不会自动发生”；明确知识与 Skill 都在模型参数之外；1440 / 768 / 390、浅深主题、键盘与 reduced-motion 回归保持通过。

## 设计方向

| 决策 | 选择 | 可观察约束 | 验收标准 |
| --- | --- | --- | --- |
| 信息层级 | 先讲“知识编译”差异，再列能力 | 首屏只有一个主结论，流水线紧随其后 | 初次扫描无需点卡片即可说出项目核心差异 |
| 版式 | 编辑型长页 + 固定筛选工具条 | 内容按定位、流水线、能力、边界、证据顺序阅读 | 桌面与手机阅读顺序一致，没有横向滚动 |
| 字体角色 | 大标题、解释性正文、等宽证据标签 | 证据路径与状态使用等宽角色 | 技术证据与营销性描述视觉上可区分 |
| 主题 | 纸白浅色与深墨夜色 | 语义颜色在两种主题含义一致 | 双向切换后文字、边界、焦点均清晰 |
| 交互 | 分类筛选 + 卡片选择 + 证据详情 | 选中状态不只靠颜色，支持键盘 | Tab/Enter 可完成一次筛选与查看详情 |
| 动效 | 轻量显隐与面板过渡 | reduced-motion 下取消非必要动画 | 关闭动画后信息和操作不丢失 |

## Revision 1 方向

| 决策 | 保留 / 新增 | 可观察约束 | 验收标准 |
| --- | --- | --- | --- |
| 页面结构 | 保留原长页，在流水线与能力矩阵之间新增受控案例 | 不改首屏定位，不把案例冒充 LLM Wiki 实跑 | 首屏仍先讲知识编译；案例首屏可见“结构演示”边界 |
| 对照方式 | 新增直接模型、普通 RAG、LLM Wiki 三模式 tab | 三种模式始终使用同一问题与同一语料范围 | 切换后同时更新处理链、产物、示例回答与对话后状态 |
| 证据口径 | 复用 2026-08-28 已有 119 篇代理语料研究的统计与派生结论 | 不复制第三方正文，不把 247 个候选写成 LLM Wiki 产物 | 页面明确区分既有真实研究结果与本次预测映射 |
| 响应式 | 桌面为样例控制台，窄屏保持单列阅读 | tab 可横向滚动，内容不裁切 | 1440 / 768 / 390 均可完成模式切换 |

## Revision 2 方向

| 决策 | 保留 / 新增 | 可观察约束 | 验收标准 |
| --- | --- | --- | --- |
| 实测定位 | 保留三模式解释，新增“Codex 实测”证据层 | 结构示意和真实产物使用不同状态标签 | 读者能一眼分辨“预测映射”与“本次生成” |
| 输入边界 | 只摄取研究者自写/合成派生胶囊 | 不复制、不上传 119 篇第三方正文 | 页面列出输入文件、性质与哈希，不展示受限原文 |
| 管线证据 | 复用上游 `autoIngest`，Codex 只替代 LLM transport | 保存阶段、调用、写盘、索引、日志、缓存证据 | 结果文件可在仓库中逐项核验，失败也如实展示 |
| 能力解释 | 新增能力、意义、场景与限制总结 | 用“知识编译层”统一解释，不把它说成训练或纯向量库 | 页面同时回答它是什么、为什么有用、何时使用、何时不用 |
| 响应式与状态 | 新增实测结果面板及成功/部分成功/失败状态 | 1440 / 768 / 390 均能阅读文件与指标；长路径换行 | 双主题、窄屏、键盘和 reduced-motion 验收通过 |

## Revision 3 方向

| 决策 | 保留 / 新增 | 可观察约束 | 验收标准 |
| --- | --- | --- | --- |
| 产品边界 | 保留研究页，新增独立“原库产品界面”段落 | 官方截图必须带版本、来源与“非本页复刻”说明 | 读者能直接回答“原库有桌面界面，本页是研究伴侣” |
| 展示方式 | 六类界面使用单一大图舞台与语义化 tab | 图片不缩成难辨认的装饰缩略图；切换同步更新说明与证据链接 | 鼠标和键盘都能切换，当前界面名称、图、能力与证据一致 |
| 能力映射 | 每张图只解释画面中可见的操作及其意义 | 不从截图推断模型质量，不把兼容入口说成内置编辑器 | 可见界面、实际能力和研究结论三层措辞分开 |
| 响应式与性能 | 桌面图文并排，窄屏单列；单次只渲染当前界面图 | 1440 / 768 / 390 无裁切或横向溢出；原图可直接打开 | 双主题、键盘、降动效和图片加载均通过浏览器验收 |

## Revision 3 浏览器精修记录

- Current stage：9 / Engineering and delivery closure。
- User phase：展示原库专门界面并合理映射原库能力。
- Browser environment：`http://127.0.0.1:8765/projects/llm-wiki-study/`，本机 Chrome + Playwright。
- Observed evidence：初次 1440px 截图中标题末字“台”形成孤行；功能舞台、六个 tab 与来源边界可见。
- Problem category：信息与布局层级。
- Root cause：第二行中文标题长度超过左侧列宽，自动换行落下单个字符。
- Minimal intervention：在“它本身就是 / 桌面知识工作台”之间加入语义断行，不改变字号、栅格或其他章节。
- Adjacent regression surfaces：1440 浅 / 深、768 浅、390 深、导航宽度、tab 横向滚动。
- Observed result：标题断行语义完整；六类图、说明、能力标签与固定原图链接同步；四个目标表面无横向溢出，控制台与页面错误均为 0。
- Decision：pass；无新增权限或产品决策需求。

## Revision 4 方向

| 决策 | 保留 / 新增 | 可观察约束 | 验收标准 |
| --- | --- | --- | --- |
| 构建边界 | 保留固定上游提交，在其工作树内执行原生开发构建 | 不改上游业务代码来伪造启动；缺失前置如实记录 | 启动命令、进程、端口或窗口均有证据 |
| 样例边界 | 复用现有研究者自写/合成胶囊 | 不导入 119 篇第三方专栏正文，不改变真实运行结果 | 原生项目目录与输入哈希可核验 |
| 原生证据 | 新增真实应用窗口与实际项目状态 | 官方截图和本机实测使用不同标签 | 页面可一眼分辨 OFFICIAL 与 LOCAL NATIVE RUN |
| 模型路径 | 优先使用原库现有模型配置；Codex 只在原库明确支持或安全适配已有 transport 时使用 | 不写入全局凭证，不把实验 Node 适配器冒充原生内置能力 | 模型与摄取路径、成功/失败阶段均明确 |

## Revision 4 覆盖清单

| 用户阶段 | 要求或产物 | 表面 / 状态 | 证据 | 阶段 | 状态 | 下一动作 |
| --- | --- | --- | --- | --- | --- | --- |
| 原生客户端实测 | 构建前置与固定源码状态 | Node / Rust / WebView2 / package scripts | 版本与依赖检查输出 | 0-1 | pass | 工具链与项目隔离 protoc 已核验 |
| 原生客户端实测 | 原生开发构建与启动 | Windows 应用进程 / 窗口 | 启动日志、进程与窗口截图 | 1-5 | pass | Tauri、Clip 与本地 API 均启动 |
| 原生客户端实测 | 隔离《左耳听风》项目与安全胶囊 | 应用项目 / 文件系统 | 项目目录、输入哈希、界面截图 | 5-6 | pass | 4,389 B 安全胶囊与 SHA-256 已固定 |
| 原生客户端实测 | 摄取、Wiki、图谱或问答可用表面 | 成功 / 恢复 / 配置边界 | 窗口截图、应用日志与生成文件 | 5-8 | pass | Wiki、Search、Graph、Review 与 RAG → Codex 均已验证 |
| 原生客户端实测 | 网页证据与说明更新 | 研究页 / README / validation | LOCAL NATIVE RUN 区与文档 | 3-9 | pass | 官方截图、本机运行、早期 Node 实验已分层 |
| 原生客户端实测 | 工程与网页回归 | build / audit / browser / repository | 命令输出与最终截图 | 9 | pass | 14 / 14 审计、站点构建、仓库校验与四视口浏览器回归通过 |

## Revision 5 方向

| 决策 | 保留 / 新增 | 可观察约束 | 验收标准 |
| --- | --- | --- | --- |
| 解释模型 | 新增“知识与能力飞轮”，保留原生实测为前置证据 | 不重复堆叠功能；回答沉淀物、存储、复用与修改 | 读者能区分原始来源、派生 Wiki、图谱索引、Review 和 Skill |
| 模型边界 | 新增“外部记忆，不是参数训练”结论 | 不暗示资料自动进入模型权重或永久正确 | 页面明确说明知识在 Markdown / 索引 / 图谱中，查询时再提供给模型 |
| 复利机制 | 把人工修订和 Skill 反馈连接成闭环 | 不把全自动生成描述为可信终态 | 飞轮包含人工审核，成熟方法才进入 Skill |
| 版式 | 在原生实测之后增加一个紧凑、可顺序阅读的六阶段流 | 不引入新脚本、弹窗或高成本视觉 | 桌面横向有层次，手机单列无裁切，浅深主题语义一致 |

## Revision 5 覆盖清单

| 用户阶段 | 要求或产物 | 表面 / 状态 | 证据 | 阶段 | 状态 | 下一动作 |
| --- | --- | --- | --- | --- | --- | --- |
| 理解知识沉淀 | 解释沉淀物、位置、复用与修改 | 原生实测后的知识飞轮 | 页面 DOM 与桌面截图 | 0-3 | pass | 六阶段知识与能力飞轮已加入 |
| 理解知识沉淀 | 区分外部知识资产和模型参数 | 边界结论 | 页面文字与 README | 3 | pass | 非训练边界和双资产结论已写入 |
| 理解知识沉淀 | 保持多表面可读 | 1440 浅/深、768 浅、390 深 | 浏览器截图、overflow、错误记录 | 7-8 | pass | 四表面无 overflow，错误为 0，手机孤字已修复 |
| 理解知识沉淀 | 工程与文档闭环 | build / audit / browser / repository | 命令输出与 validation | 9 | pass | 14 / 14 审计、构建、仓库校验与浏览器回归通过 |

## 覆盖清单

| 用户阶段 | 要求或产物 | 表面 / 状态 | 证据 | 阶段 | 状态 | 下一动作 |
| --- | --- | --- | --- | --- | --- | --- |
| 获取上游源码 | `upstream` 固定到上游 Git 提交 | 文件系统 | submodule `e8082119649e` | 1 | pass | 固定到 `v0.6.11`，后续升级另开审计 |
| 首先展示能力 | 能力数据与证据映射 | 内容 | `notes/evidence/audit-results.json` / README | 3 | pass | 14 / 14 源码标记通过，12 组能力已映射 |
| 首先展示能力 | 默认总览和筛选详情旅程 | 1440px 浅色 | `notes/evidence/browser/capabilities-desktop-light.png` | 2-5 | pass | 默认、筛选、搜索、详情与 hash 均通过 |
| 首先展示能力 | 深色主题 | 1440px 深色 | `notes/evidence/browser/capabilities-desktop-dark.png` | 6-7 | pass | 浅→深→浅往返通过 |
| 首先展示能力 | 平板适配 | 768px 浅色 | `notes/evidence/browser/tablet-light.png` | 7 | pass | 无横向溢出，内容顺序保持 |
| 首先展示能力 | 手机适配 | 390px 深色 | `notes/evidence/browser/mobile-dark.png` | 7 | pass | 控件可达，无横向溢出 |
| 首先展示能力 | 键盘与可访问性 | 桌面、筛选/卡片/主题 | `notes/evidence/browser/browser-results.json` | 7 | pass | Arrow 键、Tab 焦点和语义状态通过 |
| 首先展示能力 | reduced-motion | 动效偏好 | `notes/evidence/browser/browser-results.json` | 7-8 | pass | 平滑滚动取消，动画时长被压缩 |
| 研究记录 | README 与验证记录 | 文件 | `README.md` / `notes/source-audit.md` / `notes/validation.md` | 9 | pass | 方法、证据、局限和复现命令已写入 |
| 交付 | 仓库索引与站点构建 | 工程 | build / validate 输出 | 9 | pass | 站点构建与仓库校验通过 |
| 左耳听风样例 | 样例数据与证据边界 | 内容 | `demo/assets/left-ear-sample.json` / `notes/left-ear-sample.md` | 0-3 | pass | 真实统计与结构演示边界已分开记录 |
| 左耳听风样例 | 三模式同题对照 | 1440px 浅色 / 深色 | `left-ear-sample-desktop-light.png` / `left-ear-sample-desktop-dark.png` | 3-6 | pass | 三模式切换、回答、产物和 Wiki 映射通过 |
| 左耳听风样例 | 平板和手机 | 768px 浅色 / 390px 深色 | `left-ear-sample-tablet-light.png` / `left-ear-sample-mobile-dark.png` | 7 | pass | 单列顺序、tab 可达性、长文本换行和 overflow 通过 |
| 左耳听风样例 | 键盘与 reduced-motion | tab / 主题 | `browser-results.json` | 7-8 | pass | Arrow / End、焦点、主题与降动效通过 |
| 左耳听风样例 | 文档、构建与仓库回归 | README / build / validate | 文件与命令输出 | 9 | pass | README、验证记录、构建与仓库校验已更新 |
| Codex 真实摄取 | 契约与安全派生胶囊 | 文件系统 / 研究边界 | `notes/real-ingest-protocol.md` / `experiments/codex-ingest/input/` | 0-1 | pass | 自写/合成输入、哈希、禁用服务与证明边界已固定 |
| Codex 真实摄取 | 上游 `autoIngest` + Codex CLI | 本地运行 | 运行日志 / `result.json` / 生成 Wiki | 5-6 | pass | 3 次真实调用，142.6 秒，8 页面、13 关系、2 Review 已保存 |
| Codex 真实摄取 | 实测页面与能力/意义/场景总结 | 1440px 浅色 / 深色 | `codex-run-desktop-light.png` / `codex-run-desktop-dark.png` | 2-6 | pass | 真实/示意边界、指标、页面浏览器、质量和场景均通过 |
| Codex 真实摄取 | 平板、手机、键盘和 reduced-motion | 768px / 390px / keyboard | `browser-results.json` / tablet / mobile 截图 | 7-8 | pass | 无 overflow；页面选择、Arrow/Home/End、主题和降动效通过 |
| Codex 真实摄取 | 文档、测试、构建和仓库回归 | 工程 | 验证命令输出 / `notes/validation.md` | 9 | pass | README、协议、验证、14/14 审计、站点与仓库校验通过 |
| 展示原库界面 | 官方截图、版本与来源边界 | 文件 / 内容 | `demo/assets/original-ui/` / `original-ui.json` | 0-3 | pass | 六张固定版本官方图片、逐图映射与非复刻边界已落盘 |
| 展示原库界面 | 大图舞台与六类界面切换 | 1440px 浅色 / 深色 | `original-ui-desktop-light.png` / `original-ui-desktop-dark.png` | 2-6 | pass | tab、说明、图片、能力标签与固定证据链接同步通过 |
| 展示原库界面 | 平板与手机适配 | 768px / 390px | `original-ui-tablet-light.png` / `original-ui-mobile-dark.png` | 7 | pass | 单列、tab 滚动、图片比例和无 overflow 通过 |
| 展示原库界面 | 键盘、可访问性与 reduced-motion | tab / image / link | `browser-results.json` | 7-8 | pass | Arrow/Home/End、焦点、alt、单图切换和降动效通过 |
| 展示原库界面 | 文档、构建与仓库回归 | README / build / validate | README、验证记录与命令输出 | 9 | pass | 14/14 审计、浏览器、站点构建、Node/Python 语法与仓库校验通过 |

## 支持边界

- 第一阶段只展示从源码与官方文档可确认的能力，不把“存在代码”冒充为“真实模型效果已验证”。
- 不读取或复制第三方专栏正文；本轮真实模型输入只包含研究者自写综述、来源边界和合成案例。
- 用户已授权调用本机 Codex；不使用云 Embedding、付费搜索或未授权 API 密钥。
- 已验证 Tauri 桌面壳、本地服务与 Codex CLI 原生闭环；本地 API 的具体端点行为和 MCP 工具调用仍需单独验收。
