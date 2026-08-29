# 安装与最小验证记录

验证日期：2026-08-29
环境：Windows x64、PowerShell 7、Asia/Shanghai

## 安装基线

安装前运行：

```powershell
winget list --id Microsoft.IntelligentTerminal -e
```

结果：未发现已安装包。当时 WinGet Catalog 展示 `0.2.2192.0`，落后于 GitHub Latest Release，因此最小验证改用 GitHub v0.2.23 官方资产：

```text
文件：Microsoft.IntelligentTerminal_0.2.2395.0_8wekyb3d8bbwe.msixbundle
大小：58,845,486 bytes
SHA256：B5685956D4771728CEE35A313C7574445140DDFB6DC41FE2E3BA5D8EAF6CE039
```

通过 `Add-AppxPackage` 安装后观察到：

```text
Name:             Microsoft.IntelligentTerminal
Version:          0.2.2395.0
Status:           Ok
Install location: C:\Program Files\WindowsApps\Microsoft.IntelligentTerminal_0.2.2395.0_x64__8wekyb3d8bbwe
```

AppX Manifest 注册三个可执行入口：

```text
App    → WindowsTerminal.exe
Wtcli  → wtcli.exe
WtaCli → wta.exe
```

## WTA 命令面观察

执行已安装的 `wta.exe --help`，观察到五类能力：

- Terminal 查询：`list-windows`、`list-tabs`、`list-panes`、`active-pane`、`capture-pane`、`pane-status`；
- Terminal 修改：`new-tab`、`split-pane`、`kill-pane`；
- 调度与会话：`delegate`、`sessions`；
- Agent 探测：`probe-models`、`probe-sessions`、`probe-host-sessions`；
- 集成：`hooks`、`listen`、`resolve-command`。

可见的 Agent 参数包括 `--agent`、`--agent-id`、`--acp-model`、`--delegate-agent` 和 `--delegate-model`。帮助文本将 WTA 定义为：

```text
Windows Terminal Agent — ACP TUI client / tmux-like CLI
```

这支持本研究的核心判断：它同时承担 ACP Client/TUI 和 Terminal 控制 CLI，而不是底层推理 Agent。

## Terminal 上下文依赖

在普通 PowerShell、而不是 Intelligent Terminal Pane 内执行 `wta info`：

```text
Windows Terminal Protocol Info
========================================
  Status: Not running inside Windows Terminal
  (WT_COM_CLSID not set)
```

观察结论：WTA 的 Terminal 控制能力依赖 Intelligent Terminal 启动时提供的 COM 路由上下文；独立运行 `wta.exe` 不会获得智能或完整 Terminal 控制能力。真正的推理仍由配置的 Codex、Claude、Copilot 等 CLI 完成。

## 卸载验证

用户确认个人当前没有采用需求后，通过官方包入口卸载：

```powershell
winget uninstall --id Microsoft.IntelligentTerminal -e
```

WinGet 返回“已成功卸载”；随后：

```powershell
Get-AppxPackage -Name Microsoft.IntelligentTerminal
```

无结果，确认应用不再安装。

## 未验证项

- 首次启动 UI 和 Agent 登录；
- Codex、Claude、Copilot 的真实 ACP Prompt 回合；
- Autofix 的实际确认与执行；
- WSL Profile Agent；
- Ollama/BYOK；
- Session Restore 和多窗口恢复。

这些项目需要用户账户、模型或进一步交互式试用，不属于“理解能力与原理、判断个人价值”的总结范围。
