# OpenReel Video 能力与复用边界总结

> OpenReel 是本地优先的浏览器视频剪辑器，并扩展了桌面原生编码与 Agent/MCP 控制；当前安装和验证成本较高，先保存架构理解与按需复用入口。

## 项目信息

- 状态：`archived`
- 创建与归档日期：2026-08-29
- 项目 ID：`openreel-video-capability-summary`
- 研究源库：[Augani/openreel-video](https://github.com/Augani/openreel-video)
- 审阅版本：`main@2566c34e0f8ea22992a85f3ff16e048307b49365`
- 审阅方式：README、目录结构和关键源码审计；在临时目录完成依赖安装、类型检查、Web 构建和测试抽查，未把上游源码或依赖纳入本仓库

## 一句话结论

OpenReel 的主体是一个运行在桌面浏览器中的非线性视频剪辑软件：素材解码、时间线编辑、预览合成、音频处理、项目保存和常规导出可以在用户设备本地完成。它不是视频生成模型，也不是单纯的 Prompt Skill；桌面版、云端 GPU 与生成式 AI 是围绕浏览器剪辑核心增加的可选能力。

它与本 Research Lab 已研究的 Toonflow、Vox Director、数字人或提示词项目不属于同一能力层。那些项目主要组织脚本、分镜、模型任务或固定风格成片，OpenReel 更接近一个通用、可人工修改、可被 Agent 调用的后期工作台。这个差异有架构参考价值，但目前没有明确的通用剪辑器集成需求，因此不继续做重型安装、完整功能测试或生产接入。

## 它实际是什么

```text
本地视频、音频、图片
          ↓
MediaBunny + WebCodecs 解封装与解码
          ↓
Project → Timeline → Track → Clip / Effect / Keyframe
          ↓
WebGPU 优先、Canvas2D 回退的逐帧合成
          +
Web Audio API 播放、效果链与离线混音
          ↓
WebCodecs + MediaBunny 编码封装并写入本地文件
```

核心项目与媒体数据保存在 IndexedDB；剪切、移动、转场、效果和关键帧等编辑被表示为可验证的 Action，并配套反向 Action、撤销、重做和分组历史。这个 Action 层同时支撑网页内 BYOK 对话、Electron 桌面 MCP 和无头 Agent Runner，让 Agent 调用结构化工具修改工程，而不是依赖鼠标模拟。

## 主要能力

- 多轨视频、音频、图片、文字和图形时间线；裁切、拆分、波纹删除、变速、转场和关键帧。
- 实时预览、调色、LUT、色度键、蒙版、混合模式、字幕、SVG、贴纸和背景。
- Web Audio API 混音、音量自动化、淡入淡出、EQ、压缩、混响、降噪和节拍检测。
- IndexedDB 自动保存、工程导入导出、屏幕录制、音频/图片序列和常规视频导出。
- WebGPU、WebCodecs、OffscreenCanvas、Worker、帧缓存和 Canvas2D 降级路径。
- Motion Creator、Shader、表达式、粒子、路径动画、3D 场景和部分本地 AI 推理。
- 网页 BYOK Agent、桌面 MCP 与无头 Runner；自动生成的能力文档在固定版本中列出 228 个工具。
- Electron 桌面端通过原生 FFmpeg、硬件编码器、文件系统和可选云端 GPU 扩展浏览器能力。

## 必须保留的能力边界

1. **“浏览器运行”不等于移动端可用。** 当前 Web 应用会在移动设备或小屏幕上显示 `Desktop Only`。
2. **“本地优先”不等于每项功能都离线。** 基础剪辑可以留在设备上，模板云、分享、部分转写、生成式 AI 和 GPU Job 会访问网络服务。
3. **浏览器与桌面导出能力不同。** 浏览器端依赖实际可用的 WebCodecs；ProRes 和完整原生编码路线主要依赖桌面 FFmpeg，浏览器默认后端会把 ProRes 请求归一化为 H.264/MP4。
4. **它首先是应用仓库，不是稳定 SDK。** 根包和 `@openreel/core` 都标记为 `private`，内部包直接导出 TypeScript 源码，API 仍可能快速变化。
5. **功能数量不等于生产成熟度。** 仓库包含大量高级模块和设计文档，但跨浏览器、长视频、真实 4K、复杂编码和端到端媒体测试仍需针对目标机器重新验证。

## 与既有研究的关系

| 既有项目 | 主体能力 | OpenReel 的差异 |
| --- | --- | --- |
| Hand-Drawn Video Prompts | 口播拆镜、静帧与运动 Prompt、风险提示 | OpenReel 不负责定义画风 Prompt，而负责接收素材并形成可修改时间线 |
| Rachel Digital Human Production | MiniMax 与 HeyGen 的固定数字人 SOP | OpenReel 自己包含剪辑、合成和工程保存能力，不依赖数字人供应商才成立 |
| Vox Director | 多模型素材生成、审批和 FFmpeg 确定性成片 | OpenReel 更通用、更适合人工局部修改；Vox Director 的固定流水线更轻、更易批量复现 |
| Toonflow / AIComicBuilder | 小说、角色、分镜、模型任务和短剧项目管理 | OpenReel 位于下游后期层，不能替代故事、角色连续性和模型任务治理 |
| Remotion / FFmpeg 路线 | 代码驱动、确定性合成与批量导出 | OpenReel 提供传统 NLE 交互与 Agent Action；代价是运行时和状态系统更复杂 |

因此它不是对既有生成型研究的重复，但现阶段也不是必须补齐的依赖。只有当多个上游流程都需要进入同一个可视化工程进行审片、局部返修和再次导出时，它的增量才会明显超过现有 FFmpeg/Remotion 合成层。

## 本轮工程核验

在临时目录检出固定提交并运行：

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm --filter @openreel/web build
pnpm test
```

观察结果：

- 依赖安装成功，工作区包含 15 个项目，安装约 914 个包；Electron、FFmpeg、MediaPipe、ONNX Runtime、Three.js 和浏览器构建依赖使首次安装较重。
- 全工作区 TypeScript 类型检查通过。
- Web 生产构建成功；构建包含约 21.6 MB 的 ONNX Runtime WASM，并报告多个较大的 JavaScript chunk。
- 递归测试运行到 `@openreel/core` 时为 1192 项通过、2 项失败、20 项跳过；两个失败位于导出特效测试，单独重跑该文件时 4 项全部通过，表现为并行运行时的超时或隔离不稳定。
- Electron 原生媒体与导出集成测试默认有跳过项，因此本轮结果不能证明真实长视频和所有编码格式已经稳定。

这些证据说明仓库不是界面空壳，核心实现与测试规模可观；同时也支持“暂不为理解性研究承担完整环境、媒体矩阵与生产验收成本”的决定。

## 当前采用决定

- 不把 OpenReel 安装到当前工作区，不复制其大型 monorepo 和依赖。
- 不做全面滤镜、Motion Creator、3D、Shader、Blender 或云 GPU 功能盘点。
- 不把它当作已经稳定发布的 npm SDK，也不直接作为现有视频生产依赖。
- 保留浏览器本地剪辑、Action 历史、渲染后端抽象和 Agent/MCP 控制层的架构理解。
- 从根 README 和本页直接引导到研究源库，后续根据真实需求重新检出固定版本。

## 重新启用条件

只有出现以下任一需求时，才值得进入深入验证：

- 希望把 Vox Director、数字人、图片或视频生成结果统一送入一个可视化后期工程。
- 需要 Codex、Claude、Cursor 等通过 MCP 自动裁切、排镜头、加字幕、调音量和导出。
- 需要隐私敏感素材在本地浏览器完成基础剪辑，不上传公共云端编辑服务。
- 现有 FFmpeg/Remotion 合成层难以支持频繁人工返修、关键帧调整或模板化变体。
- OpenReel 发布稳定 SDK、项目 Schema、插件系统或明显改善跨浏览器与长视频可靠性。

## 后期按需使用指南

重新评估时不要从全部功能开始，只用一条既有 30–60 秒、1080×1920 样片做最小对照：

1. 固定当时的上游 commit，先阅读 README、Release 和项目 Schema 变化。
2. 优先试用在线版本；需要源码验证时在独立临时目录克隆，不直接污染 Research Lab。
3. 导入 3–6 个镜头、旁白、音乐和 SRT，完成人工时间线并连续导出 5 次 H.264。
4. 关闭并重新打开工程，验证素材、字幕、转场、关键帧和音量设置能否完整恢复。
5. 通过浏览器网络记录区分本地能力和云端请求，不把“本地优先”误写成“完全离线”。
6. 再测试 Agent/MCP 的 10 个明确编辑任务，记录成功率、撤销、失败恢复和人工操作次数。
7. 与现有 FFmpeg/Remotion 基线比较内存、耗时、成片一致性、局部返修成本和工程迁移成本。

如果基础导出不稳定、项目无法可靠恢复、Agent 工具只适合演示，或关键能力大量依赖官方云端，应立即停止并继续沿用现有确定性合成层。

## 许可与风险

上游使用 MIT License，可以在保留许可声明的前提下学习、修改和商用代码。但仓库许可不自动覆盖第三方依赖、编码专利、字体、模板、人物肖像、声音、外部模型服务及用户导入素材。未来若进行白标分发或云端服务化，需要重新审计依赖许可证、安全边界和浏览器可用的编解码器。

## 主要证据入口

- [上游 README 与架构说明](https://github.com/Augani/openreel-video/blob/2566c34e0f8ea22992a85f3ff16e048307b49365/README.md)
- [根工作区与依赖](https://github.com/Augani/openreel-video/blob/2566c34e0f8ea22992a85f3ff16e048307b49365/package.json)
- [核心包定义](https://github.com/Augani/openreel-video/blob/2566c34e0f8ea22992a85f3ff16e048307b49365/packages/core/package.json)
- [Action 执行与撤销基础](https://github.com/Augani/openreel-video/blob/2566c34e0f8ea22992a85f3ff16e048307b49365/packages/core/src/actions/action-executor.ts)
- [媒体解码与帧抽取](https://github.com/Augani/openreel-video/blob/2566c34e0f8ea22992a85f3ff16e048307b49365/packages/core/src/media/mediabunny-engine.ts)
- [WebGPU 与 Canvas2D 渲染选择](https://github.com/Augani/openreel-video/blob/2566c34e0f8ea22992a85f3ff16e048307b49365/packages/core/src/video/renderer-factory.ts)
- [本地 IndexedDB 存储](https://github.com/Augani/openreel-video/blob/2566c34e0f8ea22992a85f3ff16e048307b49365/packages/core/src/storage/storage-engine.ts)
- [浏览器与桌面导出边界](https://github.com/Augani/openreel-video/blob/2566c34e0f8ea22992a85f3ff16e048307b49365/packages/core/src/export/export-engine.ts)
- [Agent 使用指南](https://github.com/Augani/openreel-video/blob/2566c34e0f8ea22992a85f3ff16e048307b49365/docs/AGENT-GUIDE.md)
- [Agent 工具能力清单](https://github.com/Augani/openreel-video/blob/2566c34e0f8ea22992a85f3ff16e048307b49365/docs/AGENT-CAPABILITIES.md)
- [发布记录](https://github.com/Augani/openreel-video/releases)
