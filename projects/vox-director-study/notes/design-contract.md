# Vox Director 研究演示设计契约

## 目标锁定

- Entry mode：brief-led；在现有 Research Lab 内新增一个正式研究子项目。
- Request revision：4（把零散字段整理成可直接复制的视频模型任务卡）。
- Target user and context：已有其他图片/视频模型、但缺少统一前期结构与交接格式的中文创作者。
- Desired first impression：先看懂样例如何被拆成 beats 与 shots，再把任一样例转成可交给其他模型的前期包。
- Visual ambition：Editorial。
- Experience architecture：Editorial Flow。
- Visual constraints：以纸张拼贴与编辑部版式为气质参考，但不复制 Vox 品牌；信息与样例优先，不依赖视频播放才能理解内容；支持明暗主题。
- Information constraints：只陈述固定上游版本和本地审计可以支持的事实；明确区分“仓库已有样例”“本研究演示”“尚未实测的外部模型能力”。
- Operation constraints：零前端依赖、静态部署；新增样例选择、生成路线、主题、画幅与时长输入，以及前期包预览、复制和 JSON 下载；敦煌镜头须把关键帧、参数、完整运动提示与负向提示聚合为一张直接投喂卡，支持逐镜头复制与复制全部；键盘可达。
- State constraints：默认展示 B-roll 与唐代样例；普通前期台默认读取 15 秒货币样例；`?demo=dunhuang` 必须载入敦煌 30 秒预案并清晰标记为研究示范；切换样例或路线后镜头表、资产清单与模型交接单同步更新；复制成功与失败均有就地反馈；无 API 时全部功能仍可用。
- Environment constraints：Windows、Python 3.10+；GitHub Pages 由现有 `scripts/build_site.py` 发布；不要求 Atlas Cloud 密钥才能浏览演示。
- Primary journey：用户打开敦煌示范，展开任一镜头，看见关键帧与一整块“视频模型直接输入”，点击一次复制本镜头；也可在准备台一次复制全部 6 镜头，再交给自己的视频模型。
- User-defined phases：整理样例；建立模型无关的前期准备；让准备包可以驱动其他模型；用敦煌主题进行一次完整示范；保留原研究结论与边界。
- Required artifacts：规范化上游样例数据、敦煌示范预案、6 张 Codex 关键帧、逐镜头视频调度提示、逐镜头复制按钮、复制全部按钮、复制反馈、前期导演台、镜头/资产/交接三视图、JSON 复制与下载、README 使用说明、自动数据审计、桌面/平板/手机与主题/键盘浏览器证据、发布态站点。
- Autonomy authorization：用户已明确要求新建并完成子项目；范围内的可逆实现、测试和文档更新无需重复确认。
- User-decision boundary：允许使用 Codex 内置图片模型生成示范关键帧；不调用视频模型、Atlas Cloud 或其他付费供应商，不上传私有素材，不对外发布。
- Observable completion criteria：四份上游 beats 样例被规范化；敦煌示范包含 30 秒、3 beats、6 shots 和完整中文前期内容；专属 URL 可直接载入；每个 shot 显示一块完整可复制任务文本，文本包含 shot ID、图片提示、画幅、时长、运动提示和负向提示；单镜头与全部复制可用且有反馈；原研究能力不回退；发布态桌面/手机、键盘、主题和仓库校验通过。

## 设计方向

| 决策 | 选择 | 可观察约束 | 验收标准 |
| --- | --- | --- | --- |
| 信息层级 | “完整制片 Skill”结论先行，能力模式与生产链居中 | 首屏不堆满研究细节 | 桌面和手机首屏均能识别定位与主入口 |
| 视觉语言 | 编辑部纸张、套印红、墨黑与暖纸色 | 不冒充 Vox 官方品牌 | 视觉有拼贴气质且来源/边界清晰 |
| 样例策略 | 真实上游媒体与 JSON 证据并列 | 不把模拟卡片写成真实生成结果 | 每个样例标注来源、模式与证据级别 |
| 主题 | 完整明暗主题 | 状态颜色和层级不依赖单一颜色 | 两个主题下文本、控件、视频说明可读 |
| 响应式 | 文档流；宽屏双栏，窄屏单栏 | 无横向滚动，控制顺序不变 | 1440、768、390px 主路径均可完成 |
| 动效 | 只用于状态切换和轻微入场 | reduced-motion 下取消非必要动画 | 信息不因关闭动效而丢失 |

## Coverage manifest

| 用户阶段 | 要求或产物 | 表面/状态 | 证据 | 阶段 | 状态 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- |
| 获取上游 | 固定 vox-director 上游提交 | Git submodule | `audit-results.json` 与 submodule HEAD | 1/9 | pass | 已固定 `668ec394` |
| 演示能力 | B/A/C-roll 模式可切换 | 桌面/手机、明暗主题 | `browser-validation.json` 与截图 | 2–7 | pass | 三模式及阶段选择已验证 |
| 展示样例 | 上游视频与示例 beats 可浏览 | 播放入口与媒体降级 | 4 个 MP4 元数据、5 个样例 DOM | 3/6/8 | pass | 4 视频 + 1 海报证据已展示 |
| 使用场景 | 适合/不适合边界 | 内容区 | 浏览器 DOM 与报告 | 3 | pass | 4 类适合、4 类不适合已呈现 |
| 扩展方向 | P0/P1/P2 路线 | 内容区 | 浏览器 DOM 与报告 | 3 | pass | 8 项路线已呈现 |
| 对我们的意义 | 与现有 Hand-Drawn 研究对照 | 决策区 | 浏览器 DOM 与报告 | 3 | pass | 4 点意义及采用建议已呈现 |
| 研究产物 | README、报告、数据、测试 | 文件系统 | 仓库校验与审计 | 9 | pass | 规范产物完整，校验通过 |
| 主题 | light/dark 双向可读 | 1440px | 截图与 computed style | 7 | pass | 双向切换及持久化已验证 |
| 视口 | 桌面/平板/390px 无溢出 | 1440/768/390px | 截图与尺寸检查 | 7 | pass | 7 个 surface 均无页面溢出 |
| 键盘 | 模式、样例、主题均可达 | 键盘路径 | ARIA tab 键盘断言 | 7 | pass | Arrow/Home/End 与焦点样式通过 |
| 动效 | reduced-motion 不隐藏内容 | 390px | 媒体模拟与截图 | 7/8 | pass | reduced-motion surface 通过 |
| 错误/降级 | 数据失败或视频不支持时可理解 | error/fallback | 错误态与海报态截图 | 6/8 | pass | 数据错误与无视频样例均可理解 |
| 站点闭环 | 根索引和 Pages 构建包含新项目 | 构建产物 | validate/build 输出 | 9 | pass | catalog、根 README、`.site` 已同步 |
| 整理样例 | 4 份 beats.json 统一为可比较结构 | 数据与前期台 | 规范 JSON、审计与 DOM | 1/3/9 | pass | 4 套、17 beats、26 shots 已规范化 |
| 前期准备 | 样例、主题、路线、画幅、时长可配置 | light/dark、桌面/手机 | 浏览器交互与截图 | 3–7 | pass | 发布态配置与时长缩放已验证 |
| 驱动其他模型 | 每个 shot 输出 still/motion prompt 与输入约束 | 镜头表/交接单 | DOM 与下载 JSON | 5/6/9 | pass | v1 dispatch schema 已生成并验证 |
| 资产清单 | 按路线生成必需/可选/人工关卡 | populated state | DOM 与断言 | 5/6 | pass | 首尾帧路线尾帧缺口与 6 关卡已验证 |
| 导出 | 复制与下载 JSON，不调用外部 API | success/error | 浏览器下载与剪贴板证据 | 5/6 | pass | 剪贴板与下载文件名均通过 |
| 修订回归 | 原样例、主题、视口与错误态不回退 | 1440/768/390px | 发布态浏览器矩阵 | 7/8 | pass | 7/7 surfaces 通过，0 页面溢出 |
| 敦煌示范内容 | 30 秒、3 beats、6 shots 的完整中文预案 | 数据与镜头编辑 | JSON 审计与 DOM | 1/3/9 | pass | 6 镜头内容完整性审计通过 |
| 敦煌示范入口 | 专属 URL 自动载入示范而不影响普通默认值 | `?demo=dunhuang#prep` | 浏览器状态与截图 | 5/6/7 | pass | 桌面与手机专属 URL 已验证 |
| 示范交接 | 路线、资产缺口、研究示范标签和 JSON 可见 | 桌面/手机、light/dark | 浏览器断言与下载 | 5–9 | pass | provenance、路线与 JSON 已验证 |
| 敦煌关键帧 | 6 个 shots 各有一张 9:16 本地关键帧 | 镜头编辑与发布资产 | PNG 尺寸审计、DOM 与截图 | 3/5/7/9 | pass | 6 张 941×1672 PNG 已加载 |
| 视频调度提示 | 每张关键帧配一条可复制的运动提示与负向约束 | 文档与交接 JSON | 文件审计与内容复核 | 5/6/9 | pass | 6 条逐镜头提示与统一约束已记录 |
| 图像回填 | 关键帧路径进入 provider-neutral 包且无 missing image | 资产清单与 JSON | DOM、JSON 与浏览器断言 | 5/6/9 | pass | 桌面/手机均为 6/6 READY、0 missing input |
| 单镜头直接复制 | 每个敦煌 shot 聚合完整视频任务并一键复制 | 桌面/手机、light/dark、键盘 | DOM、真实剪贴板与成功反馈 | 4/5/6/7 | pass | 6 张任务卡均可用 Enter 复制完整文本 |
| 复制全部镜头 | 一次复制按顺序编号的 6 个完整任务 | 敦煌准备台、success/error | 真实剪贴板、顺序与反馈断言 | 4/5/6/7 | pass | 6 个 shot 按 ID 顺序复制且 JSON 复制未回退 |

## Refinement ledger

- Baseline：390px 视口因装饰阴影与内部横向流水线产生 6px 页面级溢出；在 `html/body` 约束横向溢出，保留阶段列表自身滚动。
- Final：为所有带锚点的 section 增加与粘性导航匹配的 `scroll-margin-top`，平板模式区与手机决策区截图不再被导航遮住。
- Revision 1 baseline：研究页面只能解释样例，无法把结构交给其他模型；新增前期导演台后，主题变化会显式进入 `requires-manual-rewrite`，避免把旧镜头冒充新主题改稿。
- Revision 1 final：发布态已验证唐代样例切换、6 镜头编辑、首尾帧路线、15 秒缩放、资产缺口、键盘 tab、复制与下载，并验证前期数据缺失时研究内容仍可用。
- Revision 2 final：专属 URL 在发布态自动载入敦煌 30 秒预案；桌面与 390px 手机均显示 3 beats、6 shots、中文旁白、研究示范来源和模型无关交接 JSON，普通 URL 仍默认 15 秒上游结构。
- Revision 3 final：6 张 Codex 关键帧回填逐镜头编辑器，资产清单为 6/6 READY；发布态桌面和手机确认全部本地 PNG 加载、交接 JSON 无缺失输入，视频边界与逐镜头调度提示清晰可见。
- Revision 4 baseline：发布态桌面敦煌镜头把关键帧、scene、still prompt、motion prompt 分开放置；唯一复制入口位于交接 JSON，用户无法从镜头区直接复制可投喂文本。当前阶段 1，证据环境为 `http://127.0.0.1:8765/.site/projects/vox-director-study/?demo=dunhuang#prep`、1440×1000、light。
- Revision 4 final：每个敦煌 shot 增加深色“视频模型直接输入”卡，聚合首帧说明、9:16、5 秒、scene、motion 与统一负向提示；桌面/390px 手机均以真实剪贴板验证单镜头和 6 镜头批量复制，按钮支持键盘 Enter 并显示成功反馈。
- Evidence：`notes/evidence/browser-validation.json`、`notes/evidence/browser/*.png`、`notes/evidence/audit-results.json`。
