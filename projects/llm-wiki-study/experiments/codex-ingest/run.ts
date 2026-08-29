import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { autoIngest } from "@/lib/ingest"
import { runStructuralLint } from "@/lib/lint"
import { parseFrontmatter } from "@/lib/frontmatter"
import { parseSources } from "@/lib/sources-merge"
import { useWikiStore, type LlmConfig } from "@/stores/wiki-store"
import { useReviewStore } from "@/stores/review-store"
import { useActivityStore } from "@/stores/activity-store"
import { useChatStore } from "@/stores/chat-store"
import { getCodexCallEvidence, resetCodexCallEvidence } from "./codex-llm-client"

const here = path.dirname(fileURLToPath(import.meta.url))
const studyRoot = path.resolve(here, "../..")
const outputRoot = path.resolve(here, "output")
const projectPath = path.resolve(outputRoot, "latest")
const evidencePath = path.join(projectPath, "evidence")
const inputPath = path.join(here, "input", "left-ear-research-capsule.md")
const templatePath = path.join(here, "project-template")
const sourceRelativePath = "raw/sources/left-ear-research-capsule.md"
const sourcePath = path.join(projectPath, ...sourceRelativePath.split("/"))
const model = process.env.CODEX_MODEL || "gpt-5.6-luna"

function assertSafeGeneratedPath(target: string): void {
  const root = `${path.resolve(outputRoot)}${path.sep}`.toLowerCase()
  const resolved = path.resolve(target).toLowerCase()
  if (!resolved.startsWith(root) || resolved === path.resolve(outputRoot).toLowerCase()) {
    throw new Error(`Refusing to replace unsafe generated path: ${target}`)
  }
}

async function listMarkdown(directory: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) result.push(...await listMarkdown(full))
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) result.push(full)
  }
  return result.sort((a, b) => a.localeCompare(b, "zh-CN"))
}

function pageType(relativePath: string): string {
  const segment = relativePath.split("/")[1]
  const labels: Record<string, string> = {
    cases: "案例",
    concepts: "概念",
    methods: "方法",
    principles: "原则",
    boundaries: "边界",
    sources: "来源",
    entities: "实体",
  }
  if (relativePath === "wiki/index.md") return "索引"
  if (relativePath === "wiki/log.md") return "日志"
  return labels[segment] || "知识页"
}

function bodyExcerpt(content: string): string {
  const withoutFrontmatter = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
  const clean = withoutFrontmatter
    .replace(/^#{1,6}\s+.+$/gm, "")
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
  return clean.slice(0, 220)
}

function wikilinks(content: string): string[] {
  return [...content.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)]
    .map((match) => match[1].trim())
    .filter((value, index, all) => value && all.indexOf(value) === index)
}

function sha256(content: string | Buffer): string {
  return crypto.createHash("sha256").update(content).digest("hex")
}

export async function main(): Promise<void> {
  assertSafeGeneratedPath(projectPath)
  await fs.rm(projectPath, { recursive: true, force: true })
  await fs.mkdir(outputRoot, { recursive: true })
  await fs.cp(templatePath, projectPath, { recursive: true })
  await fs.mkdir(path.dirname(sourcePath), { recursive: true })
  await fs.copyFile(inputPath, sourcePath)
  await fs.mkdir(evidencePath, { recursive: true })

  const sourceContent = await fs.readFile(inputPath, "utf8")
  const normalizedProjectPath = projectPath.replace(/\\/g, "/")
  const normalizedSourcePath = sourcePath.replace(/\\/g, "/")
  const llmConfig: LlmConfig = {
    provider: "codex-cli",
    apiKey: "",
    model,
    ollamaUrl: "",
    customEndpoint: "",
    maxContextSize: 110_000,
    localCliIsolation: true,
    codexCliTimeoutMinutes: 30,
    streamingEnabled: false,
  }

  useWikiStore.setState({
    project: {
      id: "left-ear-codex-study",
      name: "左耳听风 Codex 摄取实验",
      path: normalizedProjectPath,
      createdAt: Date.now(),
      purposeText: "",
      fileTree: [],
    },
  } as never)
  useWikiStore.getState().setLlmConfig(llmConfig)
  useWikiStore.getState().setOutputLanguage("Chinese")
  useWikiStore.setState({
    embeddingConfig: {
      enabled: false,
      provider: "openai",
      apiKey: "",
      model: "",
      baseUrl: "",
    },
    multimodalConfig: {
      enabled: false,
      provider: "inherit",
      apiKey: "",
      model: "",
      baseUrl: "",
    },
    mineruConfig: {
      enabled: false,
      backend: "cloud",
      token: "",
      baseUrl: "",
    },
  } as never)
  useReviewStore.setState({ items: [] })
  useActivityStore.setState({ items: [] })
  useChatStore.setState({
    conversations: [],
    messages: [],
    activeConversationId: null,
    mode: "chat",
    ingestSource: null,
    isStreaming: false,
    streamingContent: "",
  })

  resetCodexCallEvidence(evidencePath)
  const startedAt = new Date()
  const started = Date.now()
  let writtenPaths: string[] = []
  let error: string | null = null

  try {
    writtenPaths = await autoIngest(
      normalizedProjectPath,
      normalizedSourcePath,
      llmConfig,
    )
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught)
  }
  const elapsedMs = Date.now() - started

  const markdownFiles = await listMarkdown(path.join(projectPath, "wiki"))
  const pages = await Promise.all(markdownFiles.map(async (filePath) => {
    const content = await fs.readFile(filePath, "utf8")
    const relativePath = path.relative(projectPath, filePath).replace(/\\/g, "/")
    const parsed = parseFrontmatter(content)
    const title = typeof parsed.frontmatter?.title === "string"
      ? parsed.frontmatter.title
      : content.match(/^#\s+(.+)$/m)?.[1]?.trim() || path.basename(filePath, ".md")
    return {
      path: relativePath,
      title,
      type: pageType(relativePath),
      sources: parseSources(content),
      wikilinks: wikilinks(content),
      characters: content.length,
      sha256: sha256(content),
      excerpt: bodyExcerpt(content),
    }
  }))

  const calls = getCodexCallEvidence()
  const lintResults = await runStructuralLint(normalizedProjectPath).catch(() => [])
  const lintByType = lintResults.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1
    return acc
  }, {})
  const relations = pages.flatMap((page) => page.wikilinks.map((target) => ({
    from: page.title,
    fromPath: page.path,
    to: target,
  })))
  const thematicPages = pages.filter((page) => !["索引", "日志", "来源"].includes(page.type))
  const sourcedPages = pages.filter((page) => page.sources.length > 0)
  const success = !error
    && pages.some((page) => page.type === "来源")
    && thematicPages.length >= 2
    && sourcedPages.length >= 1
    && relations.length >= 2

  const result = {
    schemaVersion: 1,
    experimentId: "left-ear-codex-auto-ingest-v1",
    status: success ? "passed" : error ? "failed" : "partial",
    statusLabel: success ? "真实摄取通过" : error ? "真实摄取失败" : "真实摄取部分通过",
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
    source: {
      displayName: "《左耳听风》研究胶囊：从慢 SQL 事故到系统性故障学习",
      path: "experiments/codex-ingest/input/left-ear-research-capsule.md",
      kind: "研究者自写结构摘要 + 合成事故",
      boundary: "不含 119 篇第三方专栏正文；不代表纸质书全量分析。",
      characters: sourceContent.length,
      bytes: Buffer.byteLength(sourceContent),
      sha256: sha256(sourceContent),
    },
    engine: {
      llmWikiVersion: "v0.6.11",
      upstreamCommit: "e8082119649e6a8e1cf85eaf289adcabfdf39d4e",
      pipeline: "src/lib/ingest.ts::autoIngest",
      provider: "Codex CLI",
      model,
      transport: "Node study adapter mirroring upstream codex_cli.rs arguments",
      filesystemTransport: "Node fs adapter replacing Tauri invoke; autoIngest core unchanged",
      sandbox: "read-only",
      approvalPolicy: "never",
      ephemeral: true,
      embeddingEnabled: false,
      webSearchEnabled: false,
    },
    metrics: {
      elapsedMs,
      codexCalls: calls.length,
      promptCharacters: calls.reduce((sum, item) => sum + item.promptCharacters, 0),
      responseCharacters: calls.reduce((sum, item) => sum + item.responseCharacters, 0),
      inputTokens: calls.every((item) => item.inputTokens !== null)
        ? calls.reduce((sum, item) => sum + (item.inputTokens || 0), 0)
        : null,
      cachedInputTokens: calls.every((item) => item.cachedInputTokens !== null)
        ? calls.reduce((sum, item) => sum + (item.cachedInputTokens || 0), 0)
        : null,
      outputTokens: calls.every((item) => item.outputTokens !== null)
        ? calls.reduce((sum, item) => sum + (item.outputTokens || 0), 0)
        : null,
      writtenPaths: writtenPaths.length,
      markdownPages: pages.length,
      thematicPages: thematicPages.length,
      sourcedPages: sourcedPages.length,
      wikilinkRelations: relations.length,
      reviews: useReviewStore.getState().items.length,
      lintFindings: lintResults.length,
    },
    acceptance: {
      sourceSummary: pages.some((page) => page.type === "来源"),
      atLeastTwoThematicPages: thematicPages.length >= 2,
      sourceTraceability: sourcedPages.length >= 1,
      atLeastTwoRelations: relations.length >= 2,
      deterministicIndex: pages.some((page) => page.path === "wiki/index.md"),
      deterministicLog: pages.some((page) => page.path === "wiki/log.md"),
    },
    writtenPaths,
    calls,
    pages,
    relations,
    reviews: useReviewStore.getState().items.map((item) => ({
      type: item.type,
      title: item.title,
      description: item.description,
      source: item.source,
    })),
    activity: useActivityStore.getState().items.map((item) => ({
      title: item.title,
      status: item.status,
      detail: item.detail,
      filesWritten: item.filesWritten,
    })),
    lint: {
      total: lintResults.length,
      byType: lintByType,
    },
    error,
    boundaries: [
      "本次是上游 JavaScript 摄取核心的真实执行，不是 Tauri 桌面壳验收。",
      "使用 Codex CLI 真实模型调用；没有启用向量 Embedding、Web 搜索、MCP 或本地 API。",
      "输入是研究者自写/合成胶囊，不是 119 篇第三方专栏全文。",
      "生成 Wiki 是模型派生理解，仍需人工核验，不能当成新的事实来源。",
    ],
  }

  const resultText = `${JSON.stringify(result, null, 2)}\n`
  await fs.writeFile(path.join(projectPath, "result.json"), resultText, "utf8")
  await fs.writeFile(path.join(studyRoot, "demo", "assets", "codex-ingest-result.json"), resultText, "utf8")
  await fs.writeFile(
    path.join(projectPath, "run-summary.md"),
    `# Codex 摄取运行摘要\n\n- 状态：${result.statusLabel}\n- 模型：${model}\n- 上游核心：\`autoIngest\` @ \`e8082119649e\`\n- 输入：研究者自写/合成胶囊（${sourceContent.length} 字符）\n- Codex 调用：${calls.length}\n- 耗时：${(elapsedMs / 1000).toFixed(1)} 秒\n- Markdown 页面：${pages.length}\n- 主题页面：${thematicPages.length}\n- 来源可追溯页面：${sourcedPages.length}\n- Wikilink 关系：${relations.length}\n- Review：${useReviewStore.getState().items.length}\n- Lint：${lintResults.length}\n- 错误：${error || "无"}\n`,
    "utf8",
  )

  console.log(JSON.stringify({
    status: result.status,
    elapsedSeconds: Number((elapsedMs / 1000).toFixed(1)),
    codexCalls: calls.length,
    pages: pages.length,
    thematicPages: thematicPages.length,
    relations: relations.length,
    reviews: result.reviews.length,
    lintFindings: lintResults.length,
    error,
    result: path.join(projectPath, "result.json"),
  }, null, 2))

  if (!success) process.exitCode = 1
}
