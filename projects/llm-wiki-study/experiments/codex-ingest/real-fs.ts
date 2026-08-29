import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import type { FileNode, WikiProject } from "@/types/wiki"

export interface ListDirectoryOptions {
  includeHidden?: boolean
  maxDepth?: number
}

export interface FileBase64 {
  base64: string
  mimeType: string
}

export interface FileHistoryEntry {
  id: string
  path: string
  timestamp: number
  author: string
  tool: string
  content: string
}

export interface FileHistoryStats {
  bytes: number
  files: number
  entries: number
}

export interface FileHistorySettings {
  enabled: boolean
  maxVersionsPerFile: number
}

function normalized(value: string): string {
  return value.replace(/\\/g, "/")
}

async function buildTree(
  directory: string,
  includeHidden: boolean,
  depth: number,
  maxDepth: number,
): Promise<FileNode[]> {
  if (depth > maxDepth) return []
  let entries: Awaited<ReturnType<typeof fs.readdir>>
  try {
    entries = await fs.readdir(directory, { withFileTypes: true })
  } catch {
    return []
  }

  const visible = entries
    .filter((entry) => includeHidden || !entry.name.startsWith("."))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN", { numeric: true }))

  const nodes: FileNode[] = []
  for (const entry of visible) {
    const fullPath = normalized(path.join(directory, entry.name))
    nodes.push({
      name: entry.name,
      path: fullPath,
      is_dir: entry.isDirectory(),
      children: entry.isDirectory()
        ? await buildTree(fullPath, includeHidden, depth + 1, maxDepth)
        : [],
    })
  }
  return nodes
}

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8")
}

export async function writeFile(filePath: string, contents: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, contents, "utf8")
}

export async function writeFileBase64(filePath: string, base64: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, Buffer.from(base64, "base64"))
}

export async function writeFileAtomic(filePath: string, contents: string): Promise<void> {
  const temporary = `${filePath}.llm-wiki-study.tmp`
  await writeFile(temporary, contents)
  await fs.rename(temporary, filePath)
}

export async function listDirectory(
  directory: string,
  includeHiddenOrOptions: boolean | ListDirectoryOptions = false,
): Promise<FileNode[]> {
  const options = typeof includeHiddenOrOptions === "boolean"
    ? { includeHidden: includeHiddenOrOptions }
    : includeHiddenOrOptions
  return buildTree(directory, options.includeHidden ?? false, 0, options.maxDepth ?? 20)
}

export async function copyFile(source: string, destination: string): Promise<void> {
  await fs.mkdir(path.dirname(destination), { recursive: true })
  await fs.copyFile(source, destination)
}

export async function copyDirectory(source: string, destination: string): Promise<string[]> {
  await fs.cp(source, destination, { recursive: true })
  const files: string[] = []
  async function collect(current: string): Promise<void> {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) await collect(full)
      else files.push(normalized(full))
    }
  }
  await collect(destination)
  return files
}

export async function preprocessFile(filePath: string): Promise<string> {
  return readFile(filePath)
}

export async function deleteFile(filePath: string): Promise<void> {
  await fs.rm(filePath, { force: true })
}

export async function findRelatedWikiPages(): Promise<string[]> {
  return []
}

export async function createDirectory(directory: string): Promise<void> {
  await fs.mkdir(directory, { recursive: true })
}

export async function fileExists(filePath: string): Promise<boolean> {
  return fs.access(filePath).then(() => true, () => false)
}

export async function getFileModifiedTime(filePath: string): Promise<number> {
  return (await fs.stat(filePath)).mtimeMs
}

export async function getFileSize(filePath: string): Promise<number> {
  return (await fs.stat(filePath)).size
}

export async function getFileMd5(filePath: string): Promise<string> {
  return crypto.createHash("md5").update(await fs.readFile(filePath)).digest("hex")
}

export async function getFileHistorySettings(): Promise<FileHistorySettings> {
  return { enabled: false, maxVersionsPerFile: 0 }
}

export async function setFileHistorySettings(
  _projectPath: string,
  settings: FileHistorySettings,
): Promise<FileHistorySettings> {
  return settings
}

export async function getFileHistoryStats(): Promise<FileHistoryStats> {
  return { bytes: 0, files: 0, entries: 0 }
}

export async function clearFileHistory(): Promise<void> {}

export async function listFileHistory(): Promise<FileHistoryEntry[]> {
  return []
}

export async function restoreFileHistory(): Promise<string> {
  throw new Error("File history is disabled in the Codex ingest study adapter")
}

export async function applyTextSelectionEdit(input: {
  filePath: string
  prefix: string
  suffix: string
  replacement: string
}): Promise<string> {
  const next = `${input.prefix}${input.replacement}${input.suffix}`
  await writeFile(input.filePath, next)
  return next
}

export async function getPageLinks(): Promise<{
  outgoing: never[]
  backlinks: never[]
  missing: never[]
}> {
  return { outgoing: [], backlinks: [], missing: [] }
}

export async function createMissingWikiPage(
  projectPath: string,
  title: string,
  content = "",
): Promise<string> {
  const slug = title.trim().replace(/[\\/:*?\"<>|]/g, "-")
  const target = path.join(projectPath, "wiki", `${slug}.md`)
  await writeFile(target, content || `# ${title}\n`)
  return normalized(target)
}

export async function readFileAsBase64(filePath: string): Promise<FileBase64> {
  const extension = path.extname(filePath).toLowerCase()
  const mimeType = extension === ".png" ? "image/png"
    : extension === ".jpg" || extension === ".jpeg" ? "image/jpeg"
      : extension === ".webp" ? "image/webp"
        : "application/octet-stream"
  return { base64: (await fs.readFile(filePath)).toString("base64"), mimeType }
}

export async function createProject(name: string, projectPath: string): Promise<WikiProject> {
  await fs.mkdir(projectPath, { recursive: true })
  return { id: `study-${crypto.randomUUID()}`, name, path: normalized(projectPath) }
}

export async function openProject(projectPath: string): Promise<WikiProject> {
  return { id: "study-existing", name: path.basename(projectPath), path: normalized(projectPath) }
}

export async function openProjectFolder(): Promise<void> {}
export async function openPathInProject(): Promise<void> {}
export async function clipServerStatus(): Promise<string> { return "disabled" }
export async function apiServerStatus(): Promise<string> { return "disabled" }
export async function apiServerReloadConfig(): Promise<string> { return "disabled" }
export async function mcpServerEntryPath(): Promise<string> { return "" }
