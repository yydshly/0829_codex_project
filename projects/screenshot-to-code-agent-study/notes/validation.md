# 验证记录

验证日期：2026-08-29

## 规范运行环境

```text
Build command: python scripts/build_site.py
Start command: python -m http.server 8000 --directory .site
Canonical URL: http://127.0.0.1:8000/projects/screenshot-to-code-agent-study/
Browser: Google Chrome
```

## 源码与研究产物

```powershell
python projects/screenshot-to-code-agent-study/scripts/audit_source.py <upstream-checkout>
python projects/screenshot-to-code-agent-study/tests/audit.py
python scripts/validate_repository.py
python scripts/build_site.py
```

结果：

- 上游固定到 `d026163f586dfa8c5c10d28c36edd59a9d3b0e88`。
- 源码审计记录 316 个文件、9 个 Agent 工具、6 个输出栈、8 条关键观察和 2 条文档漂移。
- 本地研究产物审计 12 项通过、0 项失败。
- 仓库结构、project.json、catalog 和根 README 索引一致。
- GitHub Pages 构建包含本项目 Demo。

## Agent-browser 快速体检

按照 dev server 验证流程实际打开 canonical URL，检查结果：

- 页面标题正确，正文非空。
- `data-ready=true`。
- 未发现框架错误覆盖层。
- 未发现浏览器 page errors。
- 文档宽度不超过视口宽度。
- 可访问性快照包含 6 个章节链接、5 个 Agent 步骤、4 个场景筛选和主要研究章节。
- Agent 步骤可从“理解输入”切换到“浏览器观察”，标题和节点内容同步更新。

快速体检截图保存在忽略目录 `tmp/`，不作为最终仓库证据。

## 浏览器覆盖矩阵

执行：

```powershell
python projects/screenshot-to-code-agent-study/tests/browser_acceptance.py
```

| 表面 | 主题 / 动效 | 检查 | 结果 | 证据 |
| --- | --- | --- | --- | --- |
| 1440×1000 首屏 | dark | 首屏结论、采用判断、审计信号、无溢出 | pass | `browser/desktop-dark-hero.png` |
| 1440×1000 Agent | light | 步骤点击、方向键、可见焦点、场景筛选、主题往返 | pass | `browser/desktop-light-agent.png` |
| 768×900 场景 | light | 导航、筛选布局、场景可读性、无溢出 | pass | `browser/tablet-light-scenarios.png` |
| 390×844 意义 | dark / reduced | 移动导航、采用路线、reduced-motion、无溢出 | pass | `browser/mobile-dark-meaning.png` |

共同结果：

- 4 个表面全部通过。
- 0 个 console error。
- 0 个 page error。
- 0 个 failed request。
- 0 个横向溢出。
- 主题切换后可回到初始主题。
- 场景筛选正确显示 3 个“谨慎”场景。
- 方向键从第 3 个步骤移动到第 4 个步骤，ARIA 选中状态和内容同步变化。

机器可读记录：[browser-validation.json](evidence/browser-validation.json)

## 视觉修正记录

首轮自动验收通过，但保留截图中的章节标题被 sticky header 部分遮挡。原因是证据脚本直接调用 `scroll_into_view_if_needed`，没有扣除顶栏高度。随后只修改截图定位逻辑，使用“目标元素文档位置 − 顶栏高度 − 22px”重新滚动；产品页面本身未变化。第二轮四个表面全部通过，最终截图标题完整。

## 采用结论修订复验

后续日常工作流复盘将采用判断从“参考吸收，暂不整体依赖”收敛为“保留研究，当前不采用”：不安装、不集成、不将截图转页面作为独立产品方向。此次修订同步更新 README、完整报告、项目元数据、Demo、根索引和浏览器测试语义。

复验结果：项目审计 12/12、仓库校验通过、Pages 构建包含 4 个 Demo；agent-browser 确认页面正文非空、`data-ready=true`、无错误覆盖层和横向溢出；正式浏览器矩阵 4/4 通过，新首屏与移动端意义章节均已刷新证据截图。

## 未执行边界

没有执行上游真实截图生成质量实验。该实验需要外部模型密钥、预算、固定测试集、模型版本和评分方式；缺少这些前提时，单次成功样例不能支持稳定性或成本结论。本研究将其作为新的独立实验触发条件，而不是本次交付中的未完成项。
