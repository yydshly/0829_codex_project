import crypto from "node:crypto"
import { createWriteStream } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"
import { spawn } from "node:child_process"
import type { LlmConfig } from "@/stores/wiki-store"
import { useWikiStore } from "@/stores/wiki-store"
import type { ChatMessage, ContentBlock, RequestOverrides } from "@/lib/llm-providers"

export interface StreamCallbacks {
  onToken: (token: string) => void
  onReasoningToken?: (token: string) => void
  onDone: () => void
  onError: (error: Error) => void
}

export interface CodexCallEvidence {
  call: number
  promptSha256: string
  promptCharacters: number
  responseCharacters: number
  elapsedMs: number
  exitCode: number | null
  agentMessages: number
  inputTokens: number | null
  cachedInputTokens: number | null
  outputTokens: number | null
  model: string
  isolation: boolean
  stdoutFile: string
  stderrPreview: string
}

let evidenceDirectory = ""
let calls: CodexCallEvidence[] = []

export function resetCodexCallEvidence(directory: string): void {
  evidenceDirectory = directory
  calls = []
}

export function getCodexCallEvidence(): CodexCallEvidence[] {
  return calls.map((item) => ({ ...item }))
}

function contentToText(content: string | ContentBlock[]): string {
  if (typeof content === "string") return content
  return content.map((block) => block.type === "text"
    ? block.text
    : `[Image omitted: ${block.mediaType}]`).join("\n")
}

function escapePromptContent(text: string): string {
  return text.replace(/<\/?[A-Z_][A-Z0-9_]*>/gi, (tag) =>
    tag.replace(/</g, "&lt;").replace(/>/g, "&gt;"))
}

function buildPrompt(messages: ChatMessage[]): string {
  return messages.map((message) => {
    const role = message.role.toUpperCase()
    return `<${role}>\n${escapePromptContent(contentToText(message.content))}\n</${role}>`
  }).join("\n\n")
}

function parseAgentMessages(stdout: string): { messages: string[]; usage: Record<string, number> | null } {
  const messages: string[] = []
  let usage: Record<string, number> | null = null
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue
    try {
      const event = JSON.parse(line) as {
        type?: string
        item?: { type?: string; text?: string }
        usage?: Record<string, number>
      }
      if (event.type === "item.completed" && event.item?.type === "agent_message" && event.item.text) {
        messages.push(event.item.text)
      }
      if (event.type === "turn.completed" && event.usage) usage = event.usage
    } catch {
      // The Codex CLI contract is JSONL. Non-JSON diagnostic lines stay in the
      // raw evidence file and do not become model output.
    }
  }
  return { messages, usage }
}

export async function streamChat(
  config: LlmConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
  _requestOverrides?: RequestOverrides,
): Promise<void> {
  const prompt = buildPrompt(messages)
  const call = calls.length + 1
  const projectPath = useWikiStore.getState().project?.path
  if (!projectPath) {
    callbacks.onError(new Error("Codex CLI requires an active LLM Wiki project directory"))
    return
  }

  const isolate = config.localCliIsolation === true
  const args = ["-a", "never", "exec"]
  if (isolate) args.push("--ignore-user-config", "--ignore-rules")
  args.push(
    "--json",
    "--skip-git-repo-check",
    "--sandbox", "read-only",
    "--ephemeral",
    "--model", config.model,
    "-",
  )

  const started = Date.now()
  let stdout = ""
  let stderr = ""
  let timedOut = false
  const timeoutMinutes = Math.max(1, Math.min(240, config.codexCliTimeoutMinutes ?? 20))
  await fs.mkdir(evidenceDirectory, { recursive: true })
  const stdoutName = `codex-call-${String(call).padStart(2, "0")}.jsonl`
  const stderrName = `codex-call-${String(call).padStart(2, "0")}.stderr.txt`
  const stdoutStream = createWriteStream(path.join(evidenceDirectory, stdoutName), { encoding: "utf8" })
  const stderrStream = createWriteStream(path.join(evidenceDirectory, stderrName), { encoding: "utf8" })

  await new Promise<void>((resolve) => {
    const child = spawn(process.env.CODEX_BIN || "codex", args, {
      cwd: projectPath,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    })

    const timeout = setTimeout(() => {
      timedOut = true
      child.kill()
    }, timeoutMinutes * 60_000)

    const abort = () => child.kill()
    signal?.addEventListener("abort", abort, { once: true })
    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk) => {
      stdout += chunk
      stdoutStream.write(chunk)
    })
    child.stderr.on("data", (chunk) => {
      stderr += chunk
      stderrStream.write(chunk)
    })

    child.on("error", (error) => {
      clearTimeout(timeout)
      signal?.removeEventListener("abort", abort)
      stdoutStream.end()
      stderrStream.end()
      callbacks.onError(error)
      resolve()
    })

    child.on("close", async (exitCode) => {
      clearTimeout(timeout)
      signal?.removeEventListener("abort", abort)
      const parsed = parseAgentMessages(stdout)
      const output = parsed.messages.join("\n")
      await Promise.all([
        new Promise<void>((done) => stdoutStream.end(done)),
        new Promise<void>((done) => stderrStream.end(done)),
      ])

      const usage = parsed.usage
      calls.push({
        call,
        promptSha256: crypto.createHash("sha256").update(prompt).digest("hex"),
        promptCharacters: prompt.length,
        responseCharacters: output.length,
        elapsedMs: Date.now() - started,
        exitCode,
        agentMessages: parsed.messages.length,
        inputTokens: usage?.input_tokens ?? null,
        cachedInputTokens: usage?.cached_input_tokens ?? null,
        outputTokens: usage?.output_tokens ?? null,
        model: config.model,
        isolation: isolate,
        stdoutFile: `evidence/${stdoutName}`,
        stderrPreview: stderr.trim().slice(0, 400),
      })

      if (signal?.aborted) callbacks.onDone()
      else if (timedOut) callbacks.onError(new Error(`Codex CLI timed out after ${timeoutMinutes} minutes`))
      else if (exitCode !== 0) callbacks.onError(new Error(`Codex CLI exited with code ${exitCode}: ${stderr.trim()}`))
      else if (!output) callbacks.onError(new Error("Codex CLI completed without an agent_message"))
      else {
        callbacks.onToken(output)
        callbacks.onDone()
      }
      resolve()
    })

    child.stdin.end(prompt, "utf8")
  })
}

export function isFetchNetworkError(): boolean {
  return false
}
