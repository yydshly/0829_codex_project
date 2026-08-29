import { expect, test } from "vitest"
import { main } from "./run"

test("Codex drives the real LLM Wiki autoIngest pipeline", async () => {
  await main()
  expect(process.exitCode).not.toBe(1)
})
