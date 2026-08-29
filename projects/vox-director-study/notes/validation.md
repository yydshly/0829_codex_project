# Vox Director 研究演示验证记录

验证日期：2026-08-30
固定上游：`668ec3946fe0139bc985313b15c1a300fca42f94`

## 运行基线

- 项目演示：`python -m http.server 8765 --directory .site`，发布态访问 `/projects/vox-director-study/`。
- 站点构建：根目录 `python scripts/build_site.py`，目标为 `.site/projects/vox-director-study/`；最终浏览器矩阵直接针对 `http://127.0.0.1:8765/projects/vox-director-study/` 运行。
- 前端：零运行时依赖的 HTML/CSS/JavaScript；媒体 `preload="none"`，页面理解不依赖 MP4 播放成功。
- 自动浏览器：Playwright 1.62.1。`agent-browser` CLI 在当前主机未安装，故按验证 Skill 的回退规则使用工作区捆绑 Playwright，保留同等的交互、控制台、网络与截图证据。

## 工程审计

`python projects/vox-director-study/tests/audit.py`

- 50/50 项契约检查通过，0 失败。
- 读取 47 个上游文件、18 个 Python 文件、10 个 Markdown 文件。
- 使用 `ffprobe` 检查 4 个 MP4：均包含 H.264 视频与 AAC 音频，总时长约 210.9 秒。
- 解析 4 份 `beats.json`，确认主题、画幅、beats、shots、关键帧与片段 URL 数量。
- 将 4 份样例规范为 4 套模型无关结构、17 beats、26 shots，并校验 4 种 dispatch 路线与 6 道人工关卡。
- 校验敦煌示范为 30 秒、3 beats、6 shots；全部 6 个 shot 均具有 scene、still prompt、motion prompt 与 duration。
- 校验 6 张 Codex 关键帧均为 941×1672 竖屏 PNG，规范源文件、演示副本和 shot 引用一一对应。
- 校验视频调度指南覆盖 6 个 shot、图片输入、运动提示、统一负向约束和“未调用视频模型”边界。
- 使用 `ffprobe` 校验用户提供的 B01-S01 v2：5.062 秒、474×842、30fps、H.264/AAC；源文件、规范媒体、演示副本与发布副本 SHA-256 均为 `1B42CE10870E0C72DB9643166D8B22F4A0C31C18E62317CBCFB47F6C64884A4C`。B01-S01 v1 继续保留并由 JSON 历史记录引用。
- 使用 `ffprobe` 校验用户提供的 B01-S02 v1：5.088 秒、496×864、24fps、H.264/AAC；源文件、规范媒体与发布副本的 SHA-256 均为 `A550CE78AC182B7FCE4A1FE9278C962AF79DB6331A03915AD3F29C64DF2F9385`。
- 使用 `ffprobe` 校验用户提供的 B02-S01 v2：5.062 秒、474×842、30fps、H.264/AAC；源文件、规范媒体、演示副本与发布副本 SHA-256 均为 `89B8699F55B8E743FF1A5F5C55C30BE9BDFD98151ECCBAC914BD121FAA0EB9F9`。B02-S01 v1 继续保留并由 JSON 历史记录引用。
- 使用 `ffprobe` 校验用户提供的 B03-S02 v1：5.088 秒、496×864、24fps、H.264/AAC；源文件、规范媒体与发布副本的 SHA-256 均为 `E533055E0F78003071C5AA27D5FD094332F51B25DC1CF96F62C32C674FD0CFFA`。
- 使用 `ffprobe` 校验用户提供的 B02-S02 v1：5.088 秒、496×864、24fps、H.264/AAC；源文件、规范媒体与发布副本的 SHA-256 均为 `17A8E91D4E48A4FDC47EDF4E54B845BF138F7D4E0E145FAB2A42CDFF778D8CA7`。
- 使用 `ffprobe` 校验用户提供的 B03-S01 v1：5.175 秒、768×1344、24fps、H.264/AAC；源文件、规范媒体与发布副本的 SHA-256 均为 `54CE139849C120760AA810D8DD9393248A0C44784EC94C10B396732A9CADF321`。
- 使用 FFmpeg 将六段当前通过版各取 5 秒并按 shot 顺序硬切合成画面粗剪；`ffprobe` 确认为 30.000 秒、720×1280、30fps、H.264/AAC，规范媒体、演示副本和发布副本 SHA-256 均为 `41B142205B792128406E416C06D1C0134EBFF81BB0ECBAD82AE0455848247831`。
- 使用 `volumedetect` 验证粗剪 AAC 占位轨峰值为 −91.0 dB；三段 10 秒旁白 SRT 的规范/演示/发布副本 SHA-256 均为 `17176BA283AED4088BEDAC65CE64CF9574CF22066B32A7E106C3340E8599427A`。
- Kangkang 系统 TTS v1 及三个母段继续保留；用户实听后认为机械感较强，因此不再作为默认声音试听。
- 使用 Edge 在线 `zh-CN-YunyangNeural` 神经网络音色、语速 −6%、音高 −8 Hz 生成三段 v2 母段，时长分别为 8.760、8.232、9.096 秒；在 0.50、10.55、20.35 秒进入后均完整落在对应 10 秒 beat 内。
- 使用 FFmpeg 程序化合成 30 秒环境声床，不含外部音乐或采样；旁白、环境声和混音三条 48kHz 双声道 AAC 分轨均精确为 30.000 秒。
- v2 声音试听版为 30.000 秒、720×1280、30fps、H.264/AAC、48kHz 双声道；混音实测约 −17.6 LUFS、峰值 −1.2 dB。声音版、旁白、环境声和混音的规范/演示/发布 SHA-256 分别一致：`6B52C2057A04C4E77A8599EDD902C258189C6CD8C1CBA49136BDD9397869391E`、`33C76C161F3611738E23AE2010B30D4F4F9D5384D57788871774F586C3B2DD83`、`E72FD49D1BB4B60043F0A03FAC8988EB73FEAA6F7936095EC527E8F65704DFE7`、`C5ADE1FFC44CBE426891D5C968407F2C119CB6016D1CAE9FDD636767668EF974`。
- 校验能力来源契约：准备台、六张镜头卡和 README 均明确区分 vox-director 原库、Codex / Research Lab 新增与用户外部模型产物。
- 校验完成案例数据：`completed` 状态、最终 V2、3 类能力归属、8 步生产链、5 项关键发现、适用边界、5 项扩展和 4 点价值均完整。
- 校验 `notes/dunhuang-case-study.md` 覆盖能力归属、完整生产链、首帧/首尾帧差异、使用场景、意义、扩展和发布边界；数据索引的 10 项交付文件全部存在。
- 记录 5 项边界：单一 provider 实现、`/usr/bin/curl` Windows 兼容问题、模型列表依赖 Agent 指令、B-roll 3:4 分辨率缺口、上游无测试。
- 机器证据：`notes/evidence/audit-results.json`。

## 浏览器验收矩阵

`node projects/vox-director-study/tests/browser_acceptance.cjs`

| Surface | 视口 | 主题/偏好 | 验证重点 | 结果 |
| --- | --- | --- | --- | --- |
| desktop-light-overview | 1440×1000 | light | 首屏、差异、原研究内容 | pass |
| desktop-light-preproduction | 1440×1000 | light | 模式回归；样例切换、时长缩放、逐镜头编辑、资产、复制与下载 | pass |
| desktop-dunhuang-demonstration | 1440×1000 | light | 三类能力来源、逐镜头图片/视频/复核归属、6/6 播放、直接任务卡与复制 | pass |
| desktop-dark-samples | 1440×1000 | dark | 上游样例浏览与视频海报 | pass |
| tablet-light-modes | 768×900 | light | 模式控制台响应式布局 | pass |
| tablet-light-completed-case | 768×900 | light | `#case-study` 锚点直达、最终 V2、完成态摘要与响应式布局 | pass |
| mobile-dark-preproduction | 390×844 | dark + reduced-motion | 敦煌示范、前期台响应式、无动画依赖、无横向溢出 | pass |
| mobile-error-state | 390×844 | light | 数据加载失败时静态解释仍可读 | pass |
| mobile-prep-error-state | 390×844 | dark | 前期数据失败时原研究内容仍可用 | pass |
| mobile-video-fallback | 390×844 | light | 本地 MP4 请求失败时显示说明，关键帧和复制任务仍可用 | pass |

最终结果：10/10 surfaces 通过；0 console error、0 page error、0 非预期 failed request、0 页面级横向溢出。桌面、平板和手机均显示“案例已完成”和最终 V2；完成区实际解码 30 秒、720×1280 视频及音轨，下载名和案例文档链接正确。当前敦煌主题、3 段叙事、10 类可替换主题、5 项重做内容和 6 项复用骨架均通过数据与 DOM 断言；3 类能力归属、8 步生产链、5 项关键发现、适合/不适合、5 项工程扩展与 4 点价值继续通过。`#case-study` 直达位置不被粘性导航遮挡；主动拦截单镜头、粗剪和全部 final MP4 时，主题说明、案例总结与独立恢复说明仍可读，关键帧、任务卡、旁白稿和声音分轨入口仍可用。机器证据见 `notes/evidence/browser-validation.json`，主题桌面与手机证据见 `notes/evidence/browser/dunhuang-completed-case.png` 与 `notes/evidence/browser/mobile-theme-reuse.png`。

根级 `validate_repository.py` 对 10 个研究记录校验通过；`build_site.py` 构建 5 个有 Web 演示的项目，Vox Director 发布目录共 35 个文件。

## 视觉校准账本

1. Baseline：390px 页面宽度出现 6px 装饰性溢出；流水线自身需要横向滚动，但不应推动整个页面。
2. 修正：约束 `html/body` 页面级横向溢出，保留 `.stage-list` 的局部滚动。
3. Final：给锚点 section 添加与粘性导航匹配的 `scroll-margin-top`，并让截图滚动使用同一偏移量；平板模式标题与手机决策标题均完整可见。
4. Revision 1：新增的双栏前期台在 980px 以下变为单栏，390px 下表单、tabs、镜头编辑和错误态保持文档流；桌面发布态 JSON 视图与手机前期台已经人工查看。
5. Revision 3：关键帧以 9:16 小型纸卡回填 shot 编辑器；桌面证据取景直接显示 B01-S01 图片与对应 still/motion prompt，手机 reduced-motion 表面确认无横向溢出。
6. Revision 4：关键帧下增加高对比直接输入卡与显式复制按钮；桌面截图同时显示图片、完整任务文本和操作，390px 下按钮改为整行且真实剪贴板路径通过。
7. Revision 5：B01-S01 本地播放器与复核文字采用双栏，390px 下折为单栏；桌面证据同时显示播放器、人工结论和重做任务卡，手机视频失败场景保留基础工作流。
8. Revision 6：B01-S02 复用同一逐镜头播放器结构，但使用独立的绿色通过状态；桌面证据直接取景第二段，桌面与手机均验证双视频解码，拦截 MP4 时出现两条独立降级说明。
9. Revision 7：B02-S01 使用独立的红色未通过状态与整段重做按钮；桌面证据直接取景第三段，桌面与手机均验证三视频解码，拦截 MP4 时出现三条独立降级说明。
10. Revision 8：B03-S02 使用绿色通过状态并记录尾帧冻结建议；桌面证据直接取景中央无字卷轴，桌面与手机均验证四视频解码，拦截 MP4 时出现四条独立降级说明。
11. Revision 9：B02-S02 使用绿色通过状态并记录纸艺纹理与灯光变化；桌面证据直接取景人物、琵琶、鼓与飘带，桌面与手机均验证五视频解码，拦截 MP4 时出现五条独立降级说明。
12. Revision 10：B03-S01 使用绿色通过状态并记录起始亮度的调色建议；桌面证据直接取景洞窟、壁画人物和暖光，桌面与手机均验证六视频解码，拦截 MP4 时出现六条独立降级说明。
13. Revision 11：准备台顶部增加三类来源地图；桌面使用等宽三栏，手机转为纵向卡片。每个敦煌 shot 继续显示独立的 Codex 图片、用户外部模型视频和 Codex 复核来源，避免把本研究效果误认为原库原生能力。
14. Revision 12：B01-S01 与 B02-S01 当前播放器切换到通过的 v2，审核状态使用动态版本号；卡片内增加紧凑的 v1 历史区，不把旧问题误写为当前结论。桌面单卡截图同时显示 v2 播放器、通过状态、Codex 复核与 v1 替换原因，390px 与视频失败面未产生回退。
15. Revision 13：准备台在状态说明后新增一张编辑部式画面粗剪卡，以 9:16 播放器为主视觉，右侧/下方依次显示规格、双层来源、静音边界、版本顺序与两个下载动作。1440px 使用双栏，390px 折为单栏；浅色桌面与深色手机截图均确认可读，媒体失败时出现独立恢复说明。
16. Revision 14：在粗剪卡之后增加独立的声音试听卡，以 9:16 声音版播放器和 4 个下载动作为核心；来源行分别标出本机系统 TTS、Codex / Research Lab 程序化环境声和 FFmpeg 混音。1440px 为双栏，390px 为单栏；自动滚动使用与粘性导航一致的偏移，手机标题和按钮完整可见，声音媒体失败不影响静音粗剪和分轨入口。
17. Revision 15：保留声音卡版式，只替换默认媒体和必要说明；v2 状态、Yunyang Neural、在线服务边界、语速/音高和 v1 替换原因在桌面与 390px 手机均完整可读。四个下载按钮保持原层级，未因新增版本说明产生溢出或遮挡。
18. Revision 16：准备台之后新增完成案例区。首块使用深色双栏成片舞台，桌面让 9:16 播放器和完成指标并列，手机折为视频在前、结论在后；随后用来源三栏、8 步链路、关键发现、场景边界、扩展清单和黄色价值总结形成单一阅读路径。1440/768/390px 均无溢出，`#case-study` 锚点使用现有双重顶部偏移避免粘性导航遮挡，媒体失败时不隐藏文字结论。
19. Revision 17：在最终成片之后增加主题复用区。深色当前主题主卡同时呈现规格、视觉方向、核心表达和三段叙事；十个替换方向使用桌面三栏、平板两栏、手机单栏，末尾用红/绿双卡区分“需要重做”与“可以复用”。桌面、768px 浅色和平板、390px 深色/reduced-motion 与媒体失败路径均通过，新增 `mobile-theme-reuse.png` 保留窄屏完整阅读证据。

## 边界与未执行项

- 本项目没有调用 Atlas Cloud 或视频模型；6 段当前视频与 2 段保留的 v1 均由用户在外部生成后提供。本地除原样复制、媒体检查、人工复核和页面回填外，使用 FFmpeg 做确定性规格统一、硬切粗剪与试听混音。
- 静音粗剪和 Kangkang v1 继续保留；默认声音试听 v2 使用 Microsoft Edge 在线 `zh-CN-YunyangNeural`，三段非敏感旁白文本已发送给该在线服务。环境声由 FFmpeg 程序化合成且不含外部采样；这些都不是 vox-director 原库的声音生成能力，也不代表音色已经取得正式商用授权。
- 正式旁白音色/表演、音乐或音效授权、字幕样式、标题和最终发布响度仍未被擅自确定。
- 未上传真人、声音或私有素材；未把研究演示对外发布。
- 上游能力证据仍来自固定提交的 4 个 MP4、5 张海报和 4 份 `beats.json`；新增的 6 张敦煌图明确标注为 Codex 关键帧，不冒充上游生成结果或已完成视频。
- MP4 采用固定提交的 raw URL；断网或浏览器不支持播放时，海报、元数据与文字结论仍完整。
- 前期导演台不依赖任何模型 API；导出只发生在浏览器本地。修改主题后必须人工重写镜头，页面和 JSON 都会明确标记该状态。

## 完成判定

设计契约共 65 个 coverage 项：64 项已通过；外部 README 直达、当前主题解释、10 类可替换主题、5 项重做内容、6 项复用骨架、50/50 工程审计和 10/10 浏览器矩阵均已完成。仅 Revision 17 的远端交付在本次提交推送成功前保持 `continue`；无关的 `projects/llm-wiki-study/upstream` 本地脏状态不会纳入提交。
