# Vox Director 研究演示验证记录

验证日期：2026-08-29
固定上游：`668ec3946fe0139bc985313b15c1a300fca42f94`

## 运行基线

- 项目演示：`python -m http.server 8765 --directory .`，开发态访问 `/projects/vox-director-study/demo/`。
- 站点构建：根目录 `python scripts/build_site.py`，目标为 `.site/projects/vox-director-study/`；最终浏览器矩阵直接针对该发布产物运行。
- 前端：零运行时依赖的 HTML/CSS/JavaScript；媒体 `preload="none"`，页面理解不依赖 MP4 播放成功。
- 自动浏览器：Playwright 1.62.1。`agent-browser` CLI 在当前主机未安装，故按验证 Skill 的回退规则使用工作区捆绑 Playwright，保留同等的交互、控制台、网络与截图证据。

## 工程审计

`python projects/vox-director-study/tests/audit.py`

- 25/25 项契约检查通过，0 失败。
- 读取 47 个上游文件、18 个 Python 文件、10 个 Markdown 文件。
- 使用 `ffprobe` 检查 4 个 MP4：均包含 H.264 视频与 AAC 音频，总时长约 210.9 秒。
- 解析 4 份 `beats.json`，确认主题、画幅、beats、shots、关键帧与片段 URL 数量。
- 将 4 份样例规范为 4 套模型无关结构、17 beats、26 shots，并校验 4 种 dispatch 路线与 6 道人工关卡。
- 校验敦煌示范为 30 秒、3 beats、6 shots；全部 6 个 shot 均具有 scene、still prompt、motion prompt 与 duration。
- 校验 6 张 Codex 关键帧均为 941×1672 竖屏 PNG，规范源文件、演示副本和 shot 引用一一对应。
- 校验视频调度指南覆盖 6 个 shot、图片输入、运动提示、统一负向约束和“未调用视频模型”边界。
- 记录 5 项边界：单一 provider 实现、`/usr/bin/curl` Windows 兼容问题、模型列表依赖 Agent 指令、B-roll 3:4 分辨率缺口、上游无测试。
- 机器证据：`notes/evidence/audit-results.json`。

## 浏览器验收矩阵

`node projects/vox-director-study/tests/browser_acceptance.cjs`

| Surface | 视口 | 主题/偏好 | 验证重点 | 结果 |
| --- | --- | --- | --- | --- |
| desktop-light-overview | 1440×1000 | light | 首屏、差异、原研究内容 | pass |
| desktop-light-preproduction | 1440×1000 | light | 模式回归；样例切换、时长缩放、逐镜头编辑、资产、复制与下载 | pass |
| desktop-dunhuang-demonstration | 1440×1000 | light | 专属 URL、Codex 关键帧、直接任务卡、单镜头/全部复制、无缺失输入 | pass |
| desktop-dark-samples | 1440×1000 | dark | 上游样例浏览与视频海报 | pass |
| tablet-light-modes | 768×900 | light | 模式控制台响应式布局 | pass |
| mobile-dark-preproduction | 390×844 | dark + reduced-motion | 敦煌示范、前期台响应式、无动画依赖、无横向溢出 | pass |
| mobile-error-state | 390×844 | light | 数据加载失败时静态解释仍可读 | pass |
| mobile-prep-error-state | 390×844 | dark | 前期数据失败时原研究内容仍可用 | pass |

最终结果：8/8 surfaces 通过；0 console error、0 page error、0 failed request、0 页面级横向溢出。本地图片全部可加载。发布态桌面与手机确认 6 张敦煌关键帧、6 张完整视频任务卡、6/6 READY、`Codex built-in imagegen` 来源和 0 个 missing required input；真实剪贴板确认单镜头复制只含当前任务，批量复制按 `B01-S01` 至 `B03-S02` 排列且每段都有负向提示；原有 JSON 复制和下载仍有效。机器证据见 `notes/evidence/browser-validation.json`，最终截图见 `notes/evidence/browser/`。

根级 `validate_repository.py` 对 6 个研究记录校验通过；`build_site.py` 构建 3 个有 Web 演示的项目，Vox Director 发布目录共 18 个文件。

## 视觉校准账本

1. Baseline：390px 页面宽度出现 6px 装饰性溢出；流水线自身需要横向滚动，但不应推动整个页面。
2. 修正：约束 `html/body` 页面级横向溢出，保留 `.stage-list` 的局部滚动。
3. Final：给锚点 section 添加与粘性导航匹配的 `scroll-margin-top`，并让截图滚动使用同一偏移量；平板模式标题与手机决策标题均完整可见。
4. Revision 1：新增的双栏前期台在 980px 以下变为单栏，390px 下表单、tabs、镜头编辑和错误态保持文档流；桌面发布态 JSON 视图与手机前期台已经人工查看。
5. Revision 3：关键帧以 9:16 小型纸卡回填 shot 编辑器；桌面证据取景直接显示 B01-S01 图片与对应 still/motion prompt，手机 reduced-motion 表面确认无横向溢出。
6. Revision 4：关键帧下增加高对比直接输入卡与显式复制按钮；桌面截图同时显示图片、完整任务文本和操作，390px 下按钮改为整行且真实剪贴板路径通过。

## 边界与未执行项

- 本轮没有调用 Atlas Cloud 或视频模型；只使用 Codex 内置图片模型生成 6 张示范关键帧。
- 未上传真人、声音或私有素材；未把研究演示对外发布。
- 上游能力证据仍来自固定提交的 4 个 MP4、5 张海报和 4 份 `beats.json`；新增的 6 张敦煌图明确标注为 Codex 关键帧，不冒充上游生成结果或已完成视频。
- MP4 采用固定提交的 raw URL；断网或浏览器不支持播放时，海报、元数据与文字结论仍完整。
- 前期导演台不依赖任何模型 API；导出只发生在浏览器本地。修改主题后必须人工重写镜头，页面和 JSON 都会明确标记该状态。

## 完成判定

设计契约的 25 个 coverage 项全部为 `pass`。本轮已完成敦煌前期预案、6 张关键帧、页面回填和视频调度提示；唯一尚未执行的是外部视频模型生成，这正是用户保留的调度边界。
