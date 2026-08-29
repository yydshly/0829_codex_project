# Codex 驱动的真实摄取实验

本实验用本机 Codex CLI 替代 LLM transport，复用固定上游 `v0.6.11` 的 `autoIngest` 核心，对安全的《左耳听风》派生研究胶囊进行真实摄取。

## 运行

在仓库根目录执行：

```powershell
projects\llm-wiki-study\upstream\node_modules\.bin\vitest.cmd run `
  --config projects\llm-wiki-study\experiments\codex-ingest\vite.config.mjs `
  --reporter verbose
```

可用 `CODEX_MODEL` 覆盖默认模型 `gpt-5.6-luna`。选择 Luna 是为了让离线摄取演示更快；运行结果会记录实际模型名。

## 产物

- `output/latest/wiki/`：本次真实生成的 Wiki。
- `output/latest/evidence/`：Codex JSONL 与调用错误流。
- `output/latest/result.json`：机器可读的运行、页面、关系和验收结果。
- `demo/assets/codex-ingest-result.json`：网页使用的结果快照。

完整安全边界和可证明范围见 `notes/real-ingest-protocol.md`。
