# Intelligent Terminal 外部资料索引

本页只收录项目官方仓库、Microsoft 官方文章和 ACP 官方文档，作为 README 中事实与架构描述的追溯入口。观察日期：2026-08-29。

| 资料 | 用途 | 本研究使用方式 |
| --- | --- | --- |
| [GitHub 主仓库](https://github.com/microsoft/intelligent-terminal) | 产品定位、安装、支持 Agent、用户功能和隐私概览 | 作为能力事实的首要入口 |
| [固定观察提交 0f173203](https://github.com/microsoft/intelligent-terminal/commit/0f173203760cf64dbcfca5ca2920d9bad62d78d0) | 固定本次研究对应的 main 状态 | 防止未来文档变化后无法追溯 |
| [v0.2.23 Release](https://github.com/microsoft/intelligent-terminal/releases/tag/v0.2.23) | 观察版本、BYOK、Autofix、Agent Pane 和近期方向 | 作为 2026-08-29 当前功能基线 |
| [Microsoft 0.1 公告](https://devblogs.microsoft.com/commandline/announcing-intelligent-terminal-version-0-1/) | 产品动机、Agent Pane、自动错误检测和命令面板入口 | 理解产品最初解决的问题 |
| [Microsoft 0.2 公告](https://devblogs.microsoft.com/commandline/intelligent-terminal-0-2-is-here-with-local-model-support/) | 本地模型、每标签页 Agent、WSL 和 Agent Pane 演进 | 补充 Release 的产品视角 |
| [仓库架构摘要 AGENTS.md](https://raw.githubusercontent.com/microsoft/intelligent-terminal/main/AGENTS.md) | helper/master、ACP、COM、Session MCP 和关键文件 | 作为分层架构的主要依据 |
| [WTA Overview](https://raw.githubusercontent.com/microsoft/intelligent-terminal/main/tools/wta/OVERVIEW.md) | WTA 进程角色、协议、命令面和 Terminal 控制路径 | 解释它为何不只是薄适配器 |
| [Multi-window Agent Pane Spec](https://raw.githubusercontent.com/microsoft/intelligent-terminal/main/doc/specs/Multi-window-agent-pane.md) | 多 Pane、多窗口、Session 路由和 stash/restore | 支撑会话调度理解，不做实现级审计 |
| [Security Model](https://raw.githubusercontent.com/microsoft/intelligent-terminal/main/doc/security-model.md) | COM、Prompt Injection、Scrollback、日志和权限残余风险 | 用于限制采用结论；文档自身标为 Draft |
| [ACP 官方介绍](https://agentclientprotocol.com/get-started/introduction) | ACP 的目标、JSON-RPC、stdio 与 Agent/Client 解耦 | 解释协议层定位 |
| [ACP Architecture](https://agentclientprotocol.com/get-started/architecture) | Client、Agent、Session 和能力协商 | 补充分层术语 |
| [GitHub Issues](https://github.com/microsoft/intelligent-terminal/issues) | 实验阶段的 Bug、需求和演进信号 | 仅作为后续重新评估入口，不以 Issue 推断已发布能力 |
| [MIT License](https://github.com/microsoft/intelligent-terminal/blob/main/LICENSE) | 代码使用与二次开发许可 | 确认代码许可，不推导模型或第三方 Agent 条款 |

## 索引边界

- 本项目没有镜像完整上游源码，也没有把会变化的 GitHub Star、Issue 数量作为采用依据。
- Release 说明代表已发布产品；main 分支架构文档可能领先于用户安装版本，两者出现差异时以观察 Release 为功能基线。
- `Security Model` 是项目维护者的 Draft 威胁分析，不等同于独立安全认证。
- ACP 负责 Agent Client 与 Agent CLI 的互操作；它不定义模型质量，也不会自动统一各 Agent 自有工具的权限策略。
