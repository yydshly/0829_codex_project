# Screenshot-to-Code 视觉 Agent 能力研究

> 研究 screenshot-to-code 如何通过 Agent 闭环把截图、录屏和视觉参考转化为可运行前端，并判断这项低频能力是否值得 Research Lab 安装、集成或产品化。

## 项目信息

- 状态：`completed`
- 创建日期：2026-08-29
- 最近更新：2026-08-29
- 项目 ID：`screenshot-to-code-agent-study`
- 研究对象：[abi/screenshot-to-code](https://github.com/abi/screenshot-to-code)
- 固定审计提交：[`d026163`](https://github.com/abi/screenshot-to-code/tree/d026163f586dfa8c5c10d28c36edd59a9d3b0e88)
- Web 演示：[GitHub Pages 在线页面](https://yydshly.github.io/0829_codex_project/projects/screenshot-to-code-agent-study/)
- 完整报告：[notes/research-report.md](notes/research-report.md)

## 研究问题

`screenshot-to-code` 的实际能力是什么？它是专用视觉模型、Prompt 封装，还是有环境观察与自我修正能力的 Agent？它适合解决哪些问题、不能从截图恢复什么、还能扩展到哪些方向？对于以可复现研究和静态演示为主的 Research Lab，应该整体采用、局部复用，还是只保留研究参考？

判断标准包括：

- 能力必须能从固定提交的源码或可运行证据追溯。
- “能生成原型”与“能交付生产系统”必须分开。
- 外部模型提供的能力与仓库自身实现的能力必须分开。
- 采用建议必须同时考虑成本、隐私、维护漂移、许可和现有工作流。

## 当前结论

最准确的定位是：**它是视觉前端复刻 Agent 工作台，不是自研截图识别模型。**

外部多模态模型负责理解截图和生成代码；仓库自身的核心价值是把 provider、Prompt、文件状态、素材裁剪、图片工具、Playwright 浏览器截图和多模型候选串成反馈闭环：

```text
视觉参考 → Agent 创建/编辑 HTML → 浏览器渲染 → 模型观察 → 局部修正
```

研究判断：

| 维度 | 判断 | 原因 |
| --- | --- | --- |
| 研究价值 | 高 | 是专业 Agent 如何由工具、状态和反馈形成能力的完整样本 |
| 架构复用 | 高 | 视觉预览、素材提取、provider session、运行记录和评测可独立吸收 |
| 直接采用 | 低 | 与现有看图、编码和浏览器验证能力重叠，且依赖多个外部 API |
| 生产交付 | 低 | 截图不包含真实业务、数据、权限、安全和维护契约 |

对 Research Lab 的最终建议是：**完成研究归档，当前不安装、不集成、不作为产品方向。** 截图是一个信息不足的低频输入：有设计稿时应使用 Figma 和设计系统，有现成网页时应读取 DOM/CSS，有代码时应直接修改工程。只有未来连续出现“手里只有截图、需要批量还原页面”的真实任务，才重新评估部署和成本。

## 日常产品化判断

截图转页面在营销页工厂、外包建站、旧系统视觉恢复等高频批量场景中可以成立，但对我们的日常流程不构成独立需求：

- 第一次生成只是视觉初稿，响应式、组件化、业务逻辑、数据接入和验收仍需继续完成。
- Codex 已经具备视觉理解、代码编辑、运行页面和浏览器验证能力，额外安装本库主要产生重复能力。
- Node、Python、Playwright、模型密钥与外部图片服务会增加安装、费用、隐私和维护成本。
- 独立“截图转代码”容易同质化；更通用的价值是“生成 → 运行 → 观察 → 修正”的 Agent 闭环。

因此，**研究它有意义，不等于采用它有意义**。本项目的有效产出是确认了实现机制、能力边界和不采用理由。

## 能力与边界

### 已确认能力

- 图片、视频、文字三种核心输入模式。
- HTML/CSS、HTML/Tailwind、React、Vue、Bootstrap、Ionic 六种输出栈。
- 创建、局部编辑、图片生成/编辑/去背景、素材提取、浏览器预览和候选取回工具。
- OpenAI、Anthropic、Gemini provider 适配。
- 多模型变体并行生成和历史继续编辑。
- Playwright 桌面与手机截图反馈。
- Gemini 边界框 + Pillow 原像素裁剪的素材复用。

### 重要边界

- 主输出契约仍是单个 `index.html`，不是标准多文件前端工程。
- Figma 目前通过截图或导出画板输入，不直接读取 Figma URL、节点树和设计变量。
- 录屏可以帮助模拟可见交互，但无法证明恢复了真实后端行为。
- 视觉相似不代表无障碍、安全、性能、SEO 和长期可维护性合格。
- 敏感截图会经过外部模型或图片服务，采用前必须评估隐私。

## 方法与证据

1. 将上游 `main` 固定到提交 `d026163f586dfa8c5c10d28c36edd59a9d3b0e88`。
2. 阅读 README、Agent 设计文档、Prompt、provider、工具运行时、素材提取、预览和评测源码。
3. 使用零第三方依赖的审计脚本提取输入模式、输出栈、工具、文件统计和关键源码行。
4. 区分源码观察、实现解释和采用判断。
5. 制作零依赖研究演示，并在桌面、平板、手机、明暗主题、键盘和 reduced-motion 下验收。

证据入口：

- [源码审计脚本](scripts/audit_source.py)
- [源码审计结果](data/source-audit.json)
- [完整研究报告](notes/research-report.md)
- [设计与覆盖契约](notes/design-contract.md)
- [浏览器验证记录](notes/validation.md)

本次静态审计得到 316 个非 Git 文件、135 个 Python 文件、73 个 TSX 文件和 52 个测试文件，并识别到 9 个 Agent 工具。还发现两处值得记录的文档漂移：Agent 设计文档写最多 20 个 tool turn，而当前 engine 是 30 step；README 的默认 OpenAI 模型与当前模型选择代码不完全一致。

## 使用场景

适合：营销页、活动页、内部概念验证、旧页面视觉恢复、竞品视觉研究、有限交互原型和研究演示初稿。

谨慎：多页面产品、长页面、高密度应用、品牌资产、敏感内部界面和需要严格跨断点一致性的项目。

不适合直接交付：登录、支付、权限、数据库、复杂领域规则组成的生产系统，以及未经授权的第三方页面公开复制。

## 可扩展方向

- **P0：可测量视觉闭环**——增加像素差、感知距离、布局树和溢出诊断。
- **P1：工程化输出**——组件、路由、数据模型、设计 token、lint、类型、无障碍和测试。
- **P1：结构化输入**——读取 Figma 节点、DOM、computed styles 和录屏状态图。
- **P2：领域视觉 Agent**——形成“参考图 + 设计契约 + 内容数据 + 浏览器验收”的 Research Lab 专用流程。

## 复现

静态源码审计：

```powershell
git clone https://github.com/abi/screenshot-to-code.git tmp/screenshot-to-code
git -C tmp/screenshot-to-code checkout d026163f586dfa8c5c10d28c36edd59a9d3b0e88
python projects/screenshot-to-code-agent-study/scripts/audit_source.py tmp/screenshot-to-code
```

构建和查看研究站：

```powershell
python scripts/validate_repository.py
python scripts/build_site.py
python -m http.server 8000 --directory .site
```

然后访问：

```text
http://127.0.0.1:8000/projects/screenshot-to-code-agent-study/
```

## 结论与局限

本研究完成了固定提交的静态架构审计和本地研究页面验收，没有调用 OpenAI、Anthropic、Gemini、Replicate 或 ScreenshotOne 进行真实质量对照。原因是模型质量、可用型号、延迟和价格会变化，严谨实验需要先固定测试集、供应商、预算和评分方法。

因此，本项目可以支持“架构如何实现、能力边界在哪里、是否值得吸收”的结论，但不支持“当前哪个模型还原质量最好”或“单次生成成本是多少”的结论。上游与外部服务持续变化，后续采用必须固定 commit 并重新运行测试。

## 研究日志

### 2026-08-29

- 创建并登记研究子项目。
- 固定上游提交并完成关键源码静态审计。
- 明确项目是视觉前端复刻 Agent，而不是自研截图模型。
- 记录单文件输出、Figma 输入、隐藏业务和生产交付边界。
- 发现 Agent step 与默认模型列表的文档漂移。
- 完成能力、原理、价值、场景、扩展和 Research Lab 采用建议。
- 根据日常工作流复盘，将采用结论收敛为“不安装、不集成、不产品化；仅保留 Agent 闭环研究”。
- 完成零依赖 Web 演示与多表面浏览器验收。
