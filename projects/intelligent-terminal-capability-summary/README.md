# Intelligent Terminal 能力与原理总结

> Intelligent Terminal 是 Codex、Claude、Copilot 等 Agent CLI 之上的 Windows Terminal 原生宿主、适配和调度层。本研究以“能准确解释、完成最小安装验证、做出采用判断”为止，不做 Windows Terminal 源码级深挖。

## 项目信息

- 状态：`archived`
- 创建与更新：2026-08-29
- 研究对象：[microsoft/intelligent-terminal](https://github.com/microsoft/intelligent-terminal)
- 观察版本：[v0.2.23 / 0.2.2395.0](https://github.com/microsoft/intelligent-terminal/releases/tag/v0.2.23)
- 观察主分支提交：[`0f173203`](https://github.com/microsoft/intelligent-terminal/commit/0f173203760cf64dbcfca5ca2920d9bad62d78d0)
- 许可：MIT
- 外部资料索引：[notes/external-index.md](notes/external-index.md)
- 安装与边界验证：[notes/validation.md](notes/validation.md)

## 一句话结论

`Intelligent Terminal` **不是新的模型，也不是 Codex CLI、Claude CLI 的替代品**。它把这些底层 Agent CLI 接入同一个 Windows Terminal 界面，负责选择与启动 Agent、转发上下文、管理会话、显示确认 UI，并控制标签页和 Pane；真正的理解、规划、代码修改和 Agent 工具调用仍由底层 CLI 与模型完成。

对个人当前工作流，它解决的是“统一管理多个 Agent 和 Terminal 上下文”的问题，而这个问题尚不存在：直接使用 Codex CLI、Claude CLI 更简单，因此不采用并归档。

## 研究问题与范围

本项目回答四个问题：

1. 它与 Codex CLI、Claude CLI 等工具是不是同一层产品？
2. 它除“转发请求”外，还增加了哪些 Terminal 原生能力？
3. 用户请求、Shell 上下文和终端操作如何在各层之间流动？
4. 对当前个人工作流有没有值得承担额外安装和配置成本的增量价值？

研究方法仅包括官方文档、Release、架构说明、安全草案与已安装二进制的最小命令面验证。没有编译完整 Windows Terminal fork，没有登录第三方 Agent，也没有执行端到端 Autofix。

## 分层理解

最容易混淆的是“谁在提供智能”。准确分层如下：

```text
┌─────────────────────────────────────────────┐
│ Intelligent Terminal                       │
│ 统一 UI、Agent 选择、上下文、会话、确认、Pane 控制 │
├─────────────────────────────────────────────┤
│ ACP / Agent Adapter                         │
│ 在宿主与不同 Agent CLI 之间统一消息和会话协议       │
├─────────────────────────────────────────────┤
│ Codex / Claude / Copilot / Gemini / OpenCode│
│ Agent 循环、工具调用、文件修改、Shell 执行与权限逻辑  │
├─────────────────────────────────────────────┤
│ GPT / Claude / Gemini / 本地模型             │
│ 推理与生成                                    │
└─────────────────────────────────────────────┘
```

所以，“它是底层 CLI 上面的适配器”是正确的简化；更完整的定义是：

> **Agent Client/宿主 + ACP 适配路由 + 会话调度器 + Windows Terminal 控制面。**

它不是只有请求转发能力的薄网关，因为还持有 Terminal UI、当前 Pane 上下文、错误检测、确认交互与窗口控制；但移除底层 Agent CLI 和模型后，它自身也没有智能任务执行能力。

## 能力地图

| 能力 | Intelligent Terminal 提供 | 底层 Agent CLI 提供 |
| --- | --- | --- |
| 统一入口 | 在 Agent Pane 中选择 Copilot、Claude、Codex、Gemini、OpenCode 或自定义 Agent | 各自的认证、Agent 行为和工具集 |
| 上下文接入 | 当前 Shell、工作目录、Pane 输出和失败信息 | 理解上下文、生成分析和下一步计划 |
| 错误处理 | 识别 PowerShell、Bash、WSL 失败并触发 Autofix | 判断根因、提出修复 |
| 操作呈现 | 展示命令、目录、输出、退出码、文件变化、问题和确认卡片 | 生成工具调用或结构化操作建议 |
| Terminal 控制 | 创建标签页、分屏、读取 Pane、聚焦、关闭和发送输入 | 请求这些动作，或使用 CLI 自己的 Shell 工具 |
| 多会话 | 按标签页/Profile 选择 Agent 和模型，显示和恢复会话 | 提供可被 ACP 管理的 Agent Session |
| 模型接入 | 配置 OpenAI-compatible、BYOK、本地 Ollama 等入口 | 实际调用模型 Provider |

普通 CLI 与 Intelligent Terminal 的路径差异：

```text
直接使用：
用户 → Codex CLI → 模型 / 文件 / Shell 工具

通过 Intelligent Terminal：
用户 → Agent Pane → ACP → Codex CLI → 模型 / 文件 / Shell 工具
       └─ Terminal 上下文、Autofix、确认 UI、Pane 控制和会话管理
```

因此，它不会让同一个 Codex 或 Claude 模型变得更聪明；它改善的是宿主体验、上下文搬运和多会话可见性。

## 工作原理

官方当前架构采用一个共享 master 和每个 Agent Pane 一个 helper：

```text
用户 / Shell / Pane 输出
          ↓
wta-helper（每个 Agent Pane 一个）
  TUI、权限交互、Pane 会话和 Autofix
          ↓ ACP / JSON-RPC / Named Pipe
wta-master（每个 Terminal 进程共享）
  Agent 进程池、Session 复用和消息路由
          ↓ ACP / JSON-RPC / stdio
Codex / Claude / Copilot / Gemini / OpenCode CLI
          ↓
云端或本地模型
```

Agent 控制 Terminal 时走控制链路：

```text
Agent 的终端操作建议
  → 每会话 MCP 请求
  → 对应 wta-helper 的确认交互
  → wta / wtcli.exe
  → COM IProtocolServer
  → Windows Terminal 标签页、分屏或 Pane
```

关键组件：

- **ACP**：统一宿主与 Agent CLI 的消息、会话、工具活动和权限交互，角色类似 LSP 对编辑器生态的解耦作用。
- **WTA**：Rust 协调器；master 复用底层 Agent 进程，helper 承担每个 Pane 的 TUI 和副作用。
- **wtcli + COM**：Windows Terminal 控制边界，提供 Pane 读取、标签页/分屏创建和输入发送。
- **Session MCP**：向 Agent 暴露结构化终端操作建议和用户提问入口，不等同于一个通用 Terminal MCP Server。
- **Hooks / Shell Integration**：帮助识别命令生命周期、错误和外部 Agent Session 状态。

需要注意，Agent CLI 自己的 Shell 工具仍可能走独立路径，并遵循该 CLI 自己的模式和审批设置；Terminal 的确认卡片不是覆盖所有 Agent 行为的统一安全沙箱。

## 使用场景

它最适合：

- 经常在聊天窗口与 PowerShell、Bash、WSL 之间复制错误和命令；
- 同时运行多个 Agent、多个标签页或长时间任务；
- 希望不同 Windows/WSL Profile 固定不同 Agent 或模型；
- 需要把 Agent 操作过程、权限问题和终端结果放在同一可视界面；
- 开发自定义 ACP Agent，或研究 Terminal 原生 Agent 宿主。

它的增量较小：

- 个人只使用一个 Codex/Claude CLI，且其原生 TUI 已满足需求；
- 主要在 IDE 或 Codex 桌面端完成任务，很少跨多个 Terminal Session；
- 不需要自动捕获 Shell 错误，也不需要 Agent 管理标签页和分屏；
- 期待的是更强模型能力，而不是更统一的宿主体验。

## 安全与隐私边界

Intelligent Terminal 是本地传输和宿主层，实际 Prompt、终端上下文最终发往哪里取决于所选 Agent CLI 和模型 Provider。本地模型可以减少云端传输，但并不自动解决 Terminal 控制权限、日志和 Prompt Injection 风险。

项目自己的安全草案明确记录了以下残余风险：

- COM 控制面可以读取或改变 Terminal 状态；
- Pane Scrollback、诊断日志可能包含代码、命令输出或秘密；
- 不可信终端输出可能形成 Prompt Injection；
- Agent 自有 Shell 工具与 Terminal 确认路径是不同权限边界；
- 当前产品是 full-trust Terminal fork，不是 AppContainer 安全沙箱。

因此即使未来采用，也不应首先在管理员终端、生产凭据环境或包含敏感输出的 Pane 中试验。

## 采用判断

### 当前决定：不采用，归档

当前个人使用场景已经可以直接调用 Codex CLI、Claude CLI。Intelligent Terminal 增加的统一 Agent Pane、Profile 路由、多 Session 管理和 Terminal 控制并未解决现实痛点，反而引入另一个 Terminal 应用、Agent Adapter、设置和安全边界。

本次曾安装官方 `Microsoft.IntelligentTerminal 0.2.2395.0` 做最小验证，确认包与 WTA 命令面后已经卸载；没有登录 Agent、绑定账号或执行 AI 命令。

### 重新评估触发条件

只有出现以下需求之一，才值得重新打开研究：

1. 需要在同一 Terminal 中频繁切换多个 Agent CLI；
2. 需要统一观察大量后台 Agent Session；
3. 复制 Shell 错误和上下文已成为明显成本；
4. 需要为团队开发自定义 ACP Agent 或受控 Terminal 工作台；
5. 官方从 experimental 进入稳定阶段，并明显补强权限、脱敏和恢复能力。

## 可扩展方向

如果未来进入产品级研究，优先方向应是：

1. 自定义 ACP Agent 与企业内部工具接入；
2. Pane 上下文裁剪、秘密检测和发送前预览；
3. 每轮、每 Pane、每操作类型的最小权限；
4. 多 Agent 委派、任务依赖和统一结果汇总；
5. Terminal Session 恢复与更丰富的结构化 Tab 内容；
6. 操作审计、企业 Policy 与 Provider 白名单。

这些扩展都建立在现有 Agent CLI 之上，不应重复实现模型和基础 Agent 循环。

## 复现与证据

安装入口：

```powershell
winget install --id Microsoft.IntelligentTerminal -e
```

本研究安装验证使用 GitHub v0.2.23 的 MSIX Bundle；记录的 SHA256、WTA 命令面和卸载状态见 [notes/validation.md](notes/validation.md)。完整源码没有复制进本仓库，避免为总结性研究引入接近完整 Windows Terminal 的大型历史；代码和版本关系通过固定 commit、Release 与[外部索引](notes/external-index.md)追溯。

仓库级校验：

```powershell
python scripts/validate_repository.py
```

## 局限

- 没有完成需要用户账户的 Agent 登录和真实 ACP Prompt 回合；
- 没有验证 Autofix、WSL Agent、本地模型、费用和延迟；
- 没有编译源码或逐项复核安全草案；
- Release、Agent Adapter 与 ACP 仍会快速变化，本记录固定在 2026-08-29；
- 结论回答的是“当前个人是否值得采用”，不代表团队和企业场景没有价值。

## 研究日志

### 2026-08-29

- 创建总结性研究项目并接入 Research Lab 索引。
- 对齐官方 README、v0.2.23 Release、ACP、WTA 架构与安全边界。
- 安装官方 `Microsoft.IntelligentTerminal 0.2.2395.0`，验证 AppX 与 WTA 命令面后卸载。
- 形成“Agent CLI 上层统一宿主、适配、调度和 Terminal 控制层”的分层理解。
- 判断个人当前直接使用底层 CLI 更简单，项目归档；保留重新评估条件和外部资料索引。
