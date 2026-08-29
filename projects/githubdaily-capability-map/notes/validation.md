# 浏览器验收与交接

## 当前状态

- 项目：GitHubDaily 开源项目精选与内容索引研究
- 内部阶段：Stage 9 / Engineering and delivery closure
- 规范地址：`http://127.0.0.1:8000/projects/githubdaily-capability-map/`
- 验收日期：2026-08-29
- 浏览器：Google Chrome 151.0.7922.174（Playwright 驱动）
- 服务器：`python -m http.server 8000 --directory .site`

`agent-browser` CLI 不在本机 PATH，且其当前版本要求 Node 24，而环境为 Node 22。没有安装新依赖；改用工作区现有 Playwright 与本机 Chrome 完成了等价的真实浏览器操作和截图证据，因此没有浏览器验证延期项。

## 浏览器证据

| 表面 / 状态 | 证据 | 结果 |
| --- | --- | --- |
| 1440 × 960 / 深色 | `notes/evidence/desktop-dark.png` | 首屏“开源项目精选与传播档案”、三行标题、流程图与导航通过；无横向溢出 |
| 768 × 1024 / 浅色 | `notes/evidence/tablet-light.png` | 原理步骤、边界提示、对比度与布局通过；无横向溢出 |
| 390 × 844 / 深色 | `notes/evidence/mobile-dark.png` | 首屏、标题语义行、按钮和精选流程图通过；无横向溢出 |
| 保存内容 / 深色 | `notes/evidence/capability-dark.png`、`capability-mobile-dark.png` | “保存了什么 / 没保存什么”在桌面和手机均清晰；章节跳转不被固定页头遮挡 |
| 收录质量 / 三表面 | `collection-dark.png`、`collection-tablet-light.png`、`collection-mobile-dark.png` | 统计、保留判断和筛选边界在桌面深色、平板浅色和手机深色下清晰 |
| 本质定位 / 三表面 | `positioning-dark.png`、`positioning-tablet-light.png`、`positioning-mobile-dark.png` | “开源项目精选与传播档案”、GitHub 检索 / GitHubDaily / Research Lab 三方差异在桌面、平板和手机均清晰 |
| 优秀库样本 / 深色 | `collection-samples-dark.png`、`collection-samples-mobile-dark.png` | 5 个样本的名称、用途、采用、许可证和活跃标签无截断 |
| 分层保留建议 / 深色 | `retention-plan-dark.png`、`retention-plan-mobile-dark.png` | “全量留信息、重点留文档、少量留代码”在桌面和手机均保持完整层级 |
| 对我们的价值 / 深色 | `notes/evidence/meaning-dark.png`、`meaning-mobile-dark.png` | “扩展研究雷达”与“核心资产来自独立验证”的判断层级清楚 |
| Research Lab 主索引 | 项目卡片与在线演示链接 | 状态、标题和目标 URL 通过 |
| 收录质量锚点 | 点击桌面“收录质量”导航 | URL 滚动、`aria-current` 和固定页头留白通过 |
| 原理步骤 | 点击第四步；键盘 ArrowRight 切换第二步 | 内容与 `aria-selected` 同步 |
| 使用场景 | 点击“开源作者” | 标题、建议与误区同步 |
| 主题 | 深 → 浅 → 深 | `data-theme` 和主题按钮标签同步 |
| 键盘 | Tab 角色、方向键与焦点轮廓 | 焦点顺序可操作，焦点轮廓可见 |
| reduced-motion | 浏览器模拟 `reduce` | 页面滚动行为切换为 `auto` |
| 运行错误 | console / pageerror / error overlay | 0 个错误 |

## 视觉校准记录

### Revision 6：纠正研究问题与 GitHubDaily 定位

- 观察：第 5 版把原始的“能力、原理、场景、扩展、意义”研究问题收窄成“是不是备份库”，又把 GitHubDaily 简化为“个人/团队项目笔记”。
- 事实：GitHubDaily 官方定位是持续分享高质量、有趣实用的开源技术教程、开发者工具、编程网站和技术资讯；公开仓库包含年度清单、文章、资源与社区投稿入口。
- 原因：连续修订时把“不是代码备份”和“具有编辑偏好”两个边界条件误写成了项目的主定位。
- 最小干预：保留已经验证的统计、样本、能力边界和交互结构；重写标题、研究问题、首屏、本质定位、三方对比和意义章节，并同步元数据、主索引与浏览器断言。
- 相邻检查：桌面深色、平板浅色、390px 深色；导航、主题、键盘、reduced-motion、根索引和 canonical URL。
- 结果：页面恢复完整研究范围，将 GitHubDaily 定位为开源项目精选、中文内容传播与历史索引；“不是代码镜像/不是权威选型”回到边界说明；移除过时的“Research Lab 只有第一个项目”现状描述。
- 决策：`pass`。

### Revision 5：纠正当前 Research Lab 的新库状态

- 观察：第 4 版把 Research Lab 的目标方法写成了已经具备的现状，容易被理解为当前库已经积累大量仓库研究。
- 事实：`projects/catalog.json` 目前只有 GitHubDaily 一个项目；它是 0829 Research Lab 的第一个子项目。
- 原因：三方对比没有区分“当前状态”和“未来研究方法”，上一轮回答还错误引用了其他独立仓库的任务。
- 最小干预：保留 GitHubDaily 分析、统计、样本、布局和交互；将第三张定位卡改为“新的 Research Lab / 从第一个项目起步”，将意义章节改为“它提供起点，研究由我们积累”。
- 相邻检查：桌面深色、平板浅色、390px 深色的定位卡和意义章节；章节锚点、主题往返、键盘焦点、reduced-motion、根索引和 canonical URL。
- 结果：页面明确当前只有第一个子项目，GitHubDaily 是起步线索与结构参考，未来子项目的证据与判断才逐步形成新库的核心资产；三视口无横向溢出，控制台与页面错误均为 0。
- 决策：`pass`。

### Revision 4：接入“公开个人 / 团队整理笔记”的定位

- 观察：第 3 版分析了收录规模和优秀样本，但没有明确它带有维护者的兴趣与经验视角，也没有解释它与 GitHub 检索、我们的深度研究之间的差异。
- 原因：页面把目录的信息价值讲得偏高，缺少“公开整理笔记”这一更贴切的本质定位。
- 最小干预：保留既有首屏、统计、样本和交互；在收录质量章节加入三方定位对比，并将“对我们的价值”改成“增量价值有限的外部线索”。
- 视觉校准：初版定位标题在桌面出现不自然断行；调整标题文案、字号与左右栏比例后，桌面两行、平板两行、手机自然换行。
- 相邻检查：长章节使旧 IntersectionObserver 激活规则出现导航状态不稳定；改为以视口 30% 阅读线判断当前章节，重新验证锚点、`aria-current`、键盘和 reduced-motion。
- 结果：三方定位在桌面深色、平板浅色和手机深色均无溢出；意义章节明确“它重广度，我们重深度”；浏览器断言与专项截图通过。
- 决策：`pass`。

### Revision 3：补齐被收录项目的质量分析

- 观察：第 2 版说明了 GitHubDaily 保存哪些信息，但没有回答“里面是否真有优秀项目、哪些内容值得留”。
- 原因：页面只分析目录载体，没有分析目录内容。
- 最小干预：在“保存内容”后新增收录质量章节，展示 2025 清单统计、5 个当前核验样本和三层保留建议；保留既有首屏、视觉系统和交互。
- 数据证据：1,523 条记录、1,488 个唯一 GitHub 地址、612 条 AI 工具（40.2%）、34 个“编程语言/库”（2.2%）；FastMCP、Fluent UI System Icons、MediaBunny、ggwave、pinyin-pro 均未归档并具有公开许可证。
- 相邻检查：六项桌面导航、锚点滚动、桌面/平板/手机卡片布局、明暗主题、键盘、reduced-motion 和研究站索引全部重测。
- 结果：新增内容不溢出；样本与建议层级清楚；浏览器断言和专项截图通过。
- 决策：`pass`。

### Revision 3：长章节导航状态

- 观察：点击新增锚点后，固定 150ms 读取时导航状态尚未完成更新。
- 原因：页面采用平滑滚动，长距离滚动和 IntersectionObserver 的状态更新是异步完成的。
- 最小干预：产品逻辑保持不变；验收改为等待“导航激活且标题低于固定页头”这一可观察结果，而不是依赖固定延时。
- 相邻检查：收录质量锚点、其他步骤切换、焦点轮廓和三视口滚动重测。
- 决策：`pass`。

### Revision 2：抽象叙事改为信息备份边界

- 观察：第 1 版用“开源信号”“候选池”“编辑流水线”“决策系统”解释仓库，读者需要先理解比喻。
- 原因：页面先讲概念模型，没有先讲仓库中实际保存的字段。
- 最小干预：保留视觉、主题和交互，重写首屏与章节文案，新增“保存了什么 / 没保存什么”和“信息 / 文档 / 代码备份”分层。
- 相邻检查：桌面、平板、手机、明暗主题、步骤和角色切换、键盘焦点、研究站索引、reduced-motion 全部重测。
- 结果：首屏 5 秒内可判断“信息清单 ≠ 代码备份”；专项截图与内容断言通过。
- 决策：`pass`。

### Revision 2：固定页头遮挡章节跳转

- 观察：移动端滚动到“保存内容”和“对我们的价值”时，固定页头可能贴近章节标题。
- 原因：章节没有为 sticky header 预留滚动边距。
- 最小干预：为内容章节增加 `scroll-margin-top`，并只在 `:focus-visible` 时显示跳过链接。
- 相邻检查：桌面与手机章节截图、导航、键盘焦点和无横向溢出重测。
- 决策：`pass`。

### Stage 2：桌面标题断行

- 观察：1440px 首屏中“工具”二字被拆到两行，削弱核心判断的可读性。
- 原因：标题字号与左侧网格宽度不匹配。
- 最小干预：提高左侧网格比例，将桌面标题上限调整为 5.2rem，并把两句话声明为完整标题行。
- 相邻检查：重新检查 1440、768 和 390px；三者无溢出。
- 决策：`pass`。

### Stage 7：移动首屏证据位置

- 观察：第一次移动截图继承了平板的历史滚动位置，截图不是页面首屏。
- 原因：浏览器 reload 保留滚动恢复状态。
- 最小干预：截图前执行 `scrollTo(0, 0)`，等待并断言 `window.scrollY === 0`。
- 相邻检查：截图、内容断言和交互断言重新运行。
- 决策：`pass`。

## 工程验证

```text
python scripts/validate_repository.py                         PASS
python scripts/build_site.py                                  PASS
python projects/githubdaily-capability-map/tests/browser_acceptance.py PASS
node --check .site/projects/githubdaily-capability-map/app.js PASS
```

## 延期与阻塞

- 延期：无。
- 阻塞：无。
- 非适用项：页面没有登录、后端、表单提交、弹窗、高成本图片/视频/WebGL 或多语言切换，因此对应状态与能力回退不进入本项目范围。

## 下一会话

当前范围完成后无需继续实现。若下一步要做真正的“备份信息库”，优先建立定期 Markdown → JSON 快照；随后只为关注项目归档 README/关键文档，只为真正依赖的项目做 Git 镜像或固定 commit。这属于新范围，不是本次未完成项。
