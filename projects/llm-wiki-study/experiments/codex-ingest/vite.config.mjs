import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))

export default {
  root: here,
  resolve: {
    alias: [
      {
        find: "@/commands/fs",
        replacement: path.join(here, "real-fs.ts"),
      },
      {
        find: "@/lib/llm-client",
        replacement: path.join(here, "codex-llm-client.ts"),
      },
      {
        find: "@",
        replacement: path.resolve(here, "../../upstream/src"),
      },
    ],
  },
  define: {
    __APP_VERSION__: JSON.stringify("0.6.11-codex-study"),
  },
  test: {
    environment: "node",
    include: ["run.test.ts"],
    testTimeout: 45 * 60 * 1000,
    hookTimeout: 45 * 60 * 1000,
  },
}
