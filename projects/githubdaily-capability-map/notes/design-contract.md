# GitHubDaily 项目信息库说明：交付契约

```text
Entry mode: Revision-led（第 5 版：纠正“当前 Research Lab 是新库”的事实定位）
Request revision: 5
Target user and context: 正在用 GitHubDaily 作为第一个子项目、逐步建立新 Research Lab 的中文用户
Desired first impression: GitHubDaily 是可供新库参考的外部整理笔记；当前 Research Lab 只有第一个子项目，深度研究是未来逐项积累的方法，不是已经存在的大量资产
Visual ambition: Editorial
Experience architecture: Editorial Flow
Visual constraints: 延续 Research Lab 深色编辑气质；高对比排版；绿色信号色；不依赖图片、3D 或高成本视觉
Information constraints: 使用大白话；明确“个人理解视角，不是权威数据库”；用并列对比解释 GitHub 搜索、GitHubDaily 与 Research Lab；事实、样本、判断和建议明确区分
Operation constraints: 零依赖静态 HTML/CSS/JS；键盘可操作；核心信息不依赖 JavaScript 才可见
State constraints: 明/暗主题；原理步骤选择；场景角色选择；滚动章节状态；reduced-motion
Environment constraints: GitHub Pages 子路径；桌面、平板、390px 手机；现代浏览器
Primary journey: 大白话结论 → 保存了什么 / 没保存什么 → 本质定位与三方对比 → 收录结构与优秀样本 → 怎么收集 → 可以怎么用 → 对新库的起步价值 → 真正备份怎么做 → 风险与来源
User-defined phases: 新建第一个子项目；总结和说明该库能力；以 Web 方式展示
Required artifacts: 项目 README、project.json、静态 demo、设计契约、浏览器验收记录、主索引和 Pages 构建接入
Autonomy authorization: 用户已直接要求新建和展示；范围内可逆实现无需二次确认
User-decision boundary: 无未决产品方向；不引入后端、登录、真实接口或外部依赖
Observable completion criteria: 页面明确出现“公开维护的个人/团队项目整理笔记”；明确当前 Research Lab 是新库且只有第一个子项目；并列说明 GitHub 检索、GitHubDaily 和新 Research Lab 的侧重点；“对我们”的章节说明它可作为起步线索与结构参考，但不能替代后续深度研究；canonical URL 可访问；交互可用；无横向溢出；桌面/平板/390px、明暗主题、键盘和 reduced-motion 有证据；仓库校验通过
```

## 设计方向

| 决策 | 选择 | 可观察约束 | 验收标准 |
| --- | --- | --- | --- |
| 信息层级 | 一句大白话结论主导，证据和细节逐层展开 | 首屏只讲“项目清单”及其备份边界 | 5 秒扫描可判断它备份信息、不备份代码 |
| 字体角色 | 大号紧凑标题、舒展正文、等宽标签 | 角色不只依赖颜色区分 | 窄屏无截断，正文保持舒适行长 |
| 色彩 | 中性深浅主题 + 绿色信号色 + 琥珀风险色 | 信号色只用于关键状态和操作 | 两个主题均保持层级与可读性 |
| 材质与深度 | 细边框、网格、少量高光，无重拟物 | 内容块边界清晰但不过度卡片化 | 阅读路径连续，不形成卡片噪声 |
| 动效 | 仅用于选项切换、导航状态和轻微进入反馈 | 信息不依赖动画出现 | reduced-motion 下关闭非必要过渡 |
| 响应式 | 桌面双栏，平板/手机单栏 | 导航和控制不离开可见区域 | 390px 无横向滚动或遮挡 |

## 第 2 版修订说明

```text
Current stage: Stage 9 / Engineering and delivery closure
User phase: 第 2 版整体叙事修订
Coverage item: 首屏结论、保存边界、对我们的价值、三层备份方式
User goal: 用大白话理解该库，并判断它是否可以作为我们的备份信息库
Browser environment: Google Chrome 151.0.7922.174；1440×960、768×1024、390×844；明暗主题
Observed evidence: 首屏使用“开源信号”，后续使用“候选池”“编辑流水线”“决策系统”等术语，读者需要先解释比喻才能理解对象。
Problem category: 信息层级 / 文案抽象
Root cause: 页面优先建立概念模型，没有先说明仓库中实际保存的字段和备份边界。
Minimal intervention: 保留视觉系统、主题、响应式和既有交互；重写标题、模块顺序与关键文案，新增“信息备份 / 文档备份 / 代码备份”分层。
Adjacent regression surfaces: 三视口换行与溢出、明暗主题、步骤与角色切换、键盘路径、reduced-motion、研究站索引。
Observed result: 首屏明确“人工整理的项目清单”；保存项和缺失项并列；对我们的价值明确为信息源、历史快照和研究清单；五张专项截图和三视口验收均无溢出或遮挡。
Decision: pass
Next executable action: 无；本次修订范围关闭
New authority required: 无
```

## 第 3 版修订说明

```text
Current stage: Stage 9 / Engineering and delivery closure
User phase: 补充被收录项目的质量分析
Coverage item: 2025 收录结构、优秀项目样本、保留价值和筛选边界
User goal: 判断这份项目清单本身是否有保留价值，以及其中是否真的有优秀库
Browser environment: 规范地址 http://127.0.0.1:8000/projects/githubdaily-capability-map/；Google Chrome 151；桌面、平板、390px 手机；明暗主题
Observed evidence: 第 2 版只说明 GitHubDaily 保存哪些字段，没有分析被收录项目的组成和质量。
Problem category: 信息缺口 / 核心判断不完整
Root cause: 页面把“目录的价值”与“目录内容的质量”混在一起，缺少样本和量化结构。
Minimal intervention: 保留既有首屏和交互；在“保存内容”后新增一个收录质量章节，用 2025 清单统计、5 个当前项目样本和三层保留建议回答问题。
Adjacent regression surfaces: 桌面导航宽度、章节编号、明暗主题、桌面/平板/手机卡片布局、锚点滚动、键盘链接、研究说明与来源。
Observed result: 新章节展示 1,523 条记录、1,488 个唯一地址、40.2% AI 占比和 34 个显式库；5 个代表项目提供当前采用、许可和活跃信号；分层保留建议与相邻收集方式自然衔接。桌面、平板、390px、明暗主题、锚点滚动和键盘路径均通过。
Decision: pass
Next executable action: 无；第 3 版修订范围关闭。
New authority required: 无；用户已直接要求补充分析。
```

## 第 4 版修订说明

```text
Current stage: Stage 9 / Engineering and delivery closure
User phase: 把补充理解描述接入 Web
Coverage item: 本质定位、GitHub 搜索 / GitHubDaily / Research Lab 对比、对我们的有限价值
User goal: 页面准确表达“它类似公开的个人项目研究笔记，而我们的工作更偏深度判断”
Browser environment: 规范地址 http://127.0.0.1:8000/projects/githubdaily-capability-map/；Google Chrome 151；桌面、平板、390px 手机；明暗主题
Observed evidence: 第 3 版已经分析收录规模和优秀样本，但“个人/团队理解视角”及其与 GitHub 检索、我们的研究方式之间的差异仍只存在于对话中。
Problem category: 核心定位缺口 / 对我们价值表述偏高
Root cause: 页面说明了信息价值，却没有明确它只是编辑者视角下的宽口径整理笔记，也没有展示我们已有 GitHub 检索与深度研究能力后的低增量价值。
Minimal intervention: 保留首屏、统计、样本和既有交互；在收录质量章节加入三方定位对比，并重写“对我们的价值”标题和五条说明。
Adjacent regression surfaces: 收录质量章节密度、三列表格在平板/手机的折行、意义章节标题、明暗主题、章节锚点、键盘与 reduced-motion。
Observed result: 收录质量章节已明确“公开维护的个人 / 团队项目笔记”，并列呈现 GitHub 检索重实时发现、GitHubDaily 重广度整理、Research Lab 重深度判断；“对我们的实际意义”明确为增量价值有限的外部线索，而非核心资产。桌面、平板、390px、明暗主题、锚点、键盘与 reduced-motion 均通过。
Decision: pass
Next executable action: 无；第 4 版修订范围关闭。
New authority required: 无；用户已直接要求接入 Web。
```

## 第 5 版修订说明

```text
Current stage: Stage 9 / Engineering and delivery closure
User phase: 纠正当前 Research Lab 的新库状态
Coverage item: 三方定位、Research Lab 当前状态、GitHubDaily 对新库的起步价值
User goal: 页面不能暗示当前库已经积累大量仓库研究；必须准确说明这是新库和第一个子项目
Browser environment: 规范地址 http://127.0.0.1:8000/projects/githubdaily-capability-map/；Google Chrome 151；桌面、平板、390px 手机；明暗主题
Observed evidence: 当前定位卡写“我们的 Research Lab 重深度判断”，意义章节写“对已经能用 GitHub 检索和 Codex 深挖仓库的 Research Lab”，容易被理解为当前库已经具有大量研究资产；但项目 catalog 只有 GitHubDaily 这一个首个子项目。
Problem category: 事实定位错误 / 时态与项目阶段混淆
Root cause: 页面把 Research Lab 的目标方法写成了已经具备的现状，并在上一轮回答中错误引用了其他独立仓库的任务。
Minimal intervention: 保留视觉结构、GitHubDaily 分析、统计、样本和交互；把 Research Lab 卡片与意义章节改为“新库当前状态 + 未来积累方式”，同步项目说明和浏览器断言。
Adjacent regression surfaces: 定位卡与意义章节在桌面/平板/手机的换行、明暗主题、章节锚点、键盘、reduced-motion、项目元数据与根索引。
Observed result: 定位卡已改为“新的 Research Lab / 从第一个项目起步”，意义章节明确“本 Research Lab 是新库，目前只有 GitHubDaily 这一个子项目”，并将核心资产表述为未来由子项目证据、判断和可复现结果逐步建设。桌面、平板、390px、明暗主题、锚点、键盘与 reduced-motion 均通过。
Decision: pass
Next executable action: 无；第 5 版修订范围关闭。
New authority required: 无；用户已直接指出当前事实定位错误。
```

## 覆盖清单

| 用户阶段 | 要求或产物 | 表面 / 状态 | 证据 | 阶段 | 状态 | 下一动作 |
| --- | --- | --- | --- | --- | --- | --- |
| 新建第一个子项目 | 目录、元数据和主索引 | 仓库 | 文件与校验输出 | 0/9 | pass | 元数据、根索引与 Pages 构建通过 |
| 总结和说明 | 大白话结论、保存项、缺失项、我们的价值和备份分层 | 页面内容 | DOM 与截图 | 2/3 | pass | 内容断言和五张专项截图通过 |
| 总结和说明 | 收录结构、优秀样本、保留价值与质量局限 | 页面内容 | 数据解析、项目核验、DOM 与截图 | 0/3/7 | pass | 统计、5 个样本、分层保留建议和专项截图通过 |
| 总结和说明 | 个人/团队整理笔记定位、新库状态与三方能力对比 | 页面内容 | DOM 与桌面/平板/手机截图 | 2/3/7 | pass | 新库现状、起步价值与未来研究方法通过 |
| Web 展示 | 收集步骤和场景切换 | 鼠标/键盘 | 浏览器交互 | 4/5 | pass | 点击、方向键与 ARIA 状态通过 |
| Web 展示 | 明暗主题 | 两个主题 | 浏览器截图 | 6/7 | pass | 新库状态文案在深浅主题通过 |
| Web 展示 | 响应式 | 1440/768/390px | 浏览器截图 | 7 | pass | 新库状态卡与意义标题在三视口无溢出 |
| Web 展示 | 可访问性与动效 | 键盘/reduced-motion | 浏览器观察 | 7/8 | pass | 相邻锚点、焦点与 reduced-motion 重测通过 |
| Web 展示 | 可复现交付 | 构建与 canonical URL | 构建、校验、运行记录 | 1/9 | pass | 构建、仓库校验、脚本语法与 200 响应通过 |
