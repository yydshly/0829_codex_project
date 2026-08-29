# Screenshot-to-Code 视觉 Agent 能力研究：交付契约

```text
Entry mode: Revision-led（原始 brief-led 研究项目的结论修订）
Request revision: 2
Target user and context: 想快速判断 screenshot-to-code 能做什么、为何有效、是否值得采用或拆解复用的中文研究者与开发者
Desired first impression: 它不是一个自研截图识别模型，而是一套把多模态模型、工具调用、素材处理和浏览器视觉反馈串起来的前端复刻 Agent
Visual ambition: Editorial
Experience architecture: Editorial Flow
Visual constraints: 延续 Research Lab 的编辑型研究气质；高信息密度但不堆卡片；蓝紫作为 Agent 信号色、青绿作为验证信号、琥珀作为边界提示；不用外部图片和高成本视觉
Information constraints: 能力、原理、价值、使用场景、扩展场景、对我们的意义必须分别回答；观察事实、源码解释和采用判断明确区分；避免把原型能力写成生产能力；明确日常需求低频、现有能力重叠与当前不采用结论
Operation constraints: 零依赖静态 HTML/CSS/JS；核心内容无 JavaScript 也可阅读；交互支持鼠标与键盘；不连接真实模型 API
State constraints: 明/暗主题；原理步骤选择；采用场景筛选；滚动章节状态；reduced-motion
Environment constraints: GitHub Pages 子路径；桌面 1440px、平板 768px、手机 390px；现代 Chromium
Primary journey: 首屏结论 → 能力边界 → Agent 原理闭环 → 价值与场景 → 扩展路线 → 对 Research Lab 的意义 → 证据、许可与局限
User-defined phases: 新建子项目；研究能力、原理、价值、使用场景、可扩展场景和对我们的意义；整理最终理解并提交远端 GitHub
Required artifacts: 项目 README、project.json、源码审计脚本与证据、研究报告、静态 demo、设计契约、浏览器验收记录、根索引与 Pages 构建接入、仅包含本研究的 Git 提交
Autonomy authorization: 用户已明确要求新建子项目、开展研究并将总结提交远端 GitHub；范围内可逆实现与 Git 提交推送无需二次确认
User-decision boundary: 不部署上游、不消耗外部模型额度、不提交密钥、不将上游完整复制进本仓库；若未来要求真实质量对照实验，再单独确认模型、预算和测试集
Observable completion criteria: 研究材料回答六个指定问题；解释 prompt/tool/file state/asset extraction/Playwright feedback 的实现链路；明确单文件原型、外部模型依赖和隐藏业务逻辑不可恢复等边界；README、报告、Demo 与索引一致表达“不安装、不集成、不产品化”；Demo 在三视口、明暗主题、键盘与 reduced-motion 下可用且无横向溢出；源码审计、仓库校验和 Pages 构建通过；只提交本研究相关文件并推送 origin/main
Coverage record: 见下表
```

## 设计方向

| 决策 | 选择 | 可观察约束 | 验收标准 |
| --- | --- | --- | --- |
| 信息层级 | 先给采用结论，再展开实现链路与证据 | 首屏直接出现“视觉复刻 Agent”与采用判断 | 5 秒内能判断它不是独立模型、主要价值在闭环 |
| 字体角色 | 大号标题、紧凑正文、等宽标签和流程节点 | 层级不只依赖颜色 | 手机端标题不截断，正文行长舒适 |
| 色彩 | 中性主题 + 蓝紫 Agent + 青绿验证 + 琥珀边界 | 颜色只强化语义 | 明暗主题均可读且状态含义一致 |
| 材质与深度 | 细线、分区、少量发光，不使用卡片墙 | 流程关系比装饰优先 | 页面阅读路径连续，模块边界清楚 |
| 动效 | 步骤切换、筛选和轻量进入反馈 | 信息不依赖动画呈现 | reduced-motion 关闭非必要过渡 |
| 响应式 | 桌面双栏信息流，平板/手机单栏 | 控件保持可见且可触达 | 390px 无横向滚动、遮挡或不可达操作 |

## 覆盖清单

| 用户阶段 | 要求或产物 | 表面 / 状态 | 证据 | 阶段 | 状态 | 下一动作 |
| --- | --- | --- | --- | --- | --- | --- |
| 新建子项目 | 目录、元数据、根索引 | 仓库 | 文件与校验输出 | 0/9 | pass | 项目已登记并标记 completed |
| 理解和研究 | 能力、原理、价值、场景、扩展、意义 | 文档与页面 | 源码审计、研究报告、DOM | 0/3/9 | pass | 固定提交与研究证据齐全 |
| 原理说明 | Agent 闭环可交互展示 | 页面 / 步骤选择 | 点击、键盘、ARIA | 4/5 | pass | 点击与方向键切换通过 |
| 场景判断 | 适合、谨慎、不适合筛选 | 页面 / 筛选状态 | 点击与键盘浏览 | 4/5/6 | pass | 9 个场景及三级筛选通过 |
| Web 展示 | 明暗主题 | dark / light | 浏览器截图与 DOM | 6/7 | pass | 双向主题切换与截图通过 |
| Web 展示 | 响应式 | 1440 / 768 / 390px | 浏览器截图与溢出检查 | 7 | pass | 三视口无横向溢出 |
| Web 展示 | 可访问性与动效 | 键盘 / reduced-motion | 焦点路径、媒体查询 | 7/8 | pass | 方向键、可见焦点与 reduced-motion 通过 |
| 可复现交付 | 审计、构建、canonical URL | 本地与 Pages 路径 | JSON、命令输出 | 1/9 | pass | 本地 canonical URL、构建和校验通过 |
| 整理并提交 | 最终采用结论一致 | README / 报告 / Demo / 索引 | 文本检索、浏览器截图、审计 | 0/3/7/9 | pass | 12 项审计、仓库校验、构建及四表面浏览器验收通过 |
| 整理并提交 | 独立 Git 提交与远端同步 | origin/main | staged diff、commit、push 结果 | 9 | pass | 主研究提交 `a9fd8cd` 已推送，其他工作区改动未暂存 |

## 最终验收记录

```text
Current stage: Stage 9 / Engineering and delivery closure
User phase: 整理最终理解并提交远端 GitHub
Coverage item: README、研究报告、静态 Demo、根索引、验证证据和独立 Git 提交
User goal: 明确库的实现能力和原理，以及它对我们“值得研究但当前不采用”的意义
Browser environment: Google Chrome；1440×1000 dark/light、768×900 light、390×844 dark + reduced-motion；canonical URL http://127.0.0.1:8000/projects/screenshot-to-code-agent-study/
Observed evidence: 新结论已同步到 README、报告、元数据、Demo 和索引；agent-browser 确认正文 2731 字符、data-ready=true、无错误覆盖层和横向溢出；4 个表面均无 console/page/request 错误，交互与主题检查通过。
Problem category: 采用判断曾把直接采用标记为“中”，与后续日常工作流复盘不一致；首次复验还发现浏览器测试硬编码旧首屏标题。
Root cause: 初版研究偏重技术可行性，低估了截图输入低频、结构信息不足、现有 Codex 能力重叠和持续维护成本；测试夹具依赖旧文案。
Minimal intervention: 不改变页面结构和视觉系统，只统一结论、采用评分与路线，并将测试断言更新为新的稳定语义。
Adjacent regression surfaces: 桌面 dark 首屏、桌面 light Agent、平板 light 场景、手机 dark + reduced-motion 意义章节。
Observed result: 12 项项目审计、9 项目仓库校验、Pages 构建和 4 个浏览器表面全部通过；新标题、采用结论和四步重新评估路径可见。
Decision: pass
Next executable action: 无；本次范围关闭
New authority required: 无
```
