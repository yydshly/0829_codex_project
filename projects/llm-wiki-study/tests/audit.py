#!/usr/bin/env python3
"""Source-level capability audit for the pinned LLM Wiki upstream checkout."""

from __future__ import annotations

import argparse
import json
import subprocess
from dataclasses import dataclass
from datetime import date
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[1]
UPSTREAM = PROJECT_DIR / "upstream"


@dataclass(frozen=True)
class EvidenceCheck:
    capability: str
    label: str
    path: str
    needles: tuple[str, ...]


CHECKS = (
    EvidenceCheck(
        "knowledge-compile",
        "Two-stage analysis and Wiki generation",
        "src/lib/ingest.ts",
        ("Step 1/2", "structured analysis", "You are a wiki maintainer"),
    ),
    EvidenceCheck(
        "multiformat",
        "Native parser dependencies",
        "src-tauri/Cargo.toml",
        ("pdfium-render", "docx-rs", "calamine", "epub", "mobi"),
    ),
    EvidenceCheck(
        "multimodal",
        "PDF image extraction and visual captioning",
        "src/lib/ingest.ts",
        ("extractAndSaveSourceImages", "vision-model-generated factual caption"),
    ),
    EvidenceCheck(
        "incremental",
        "Persistent ingest queue",
        "src/lib/ingest-queue.ts",
        ("autoIngest", "processing", "retry"),
    ),
    EvidenceCheck(
        "traceability",
        "Source-linked page frontmatter",
        "src/lib/ingest.ts",
        ("frontmatter `sources` field", "add cross-references"),
    ),
    EvidenceCheck(
        "hybrid-search",
        "Keyword/vector reciprocal-rank fusion",
        "src-tauri/src/commands/search.rs",
        ("RRF_K", "apply_rrf_scores", "vector_hits"),
    ),
    EvidenceCheck(
        "graph-retrieval",
        "Graph expansion in project search",
        "src-tauri/src/commands/search.rs",
        ("blend_graph_results", "graph_result_quota", "graph_hits"),
    ),
    EvidenceCheck(
        "knowledge-graph",
        "Four-signal relevance model",
        "src/lib/graph-relevance.ts",
        ("directLink: 3.0", "sourceOverlap: 4.0", "commonNeighbor: 1.5", "typeAffinity: 1.0"),
    ),
    EvidenceCheck(
        "knowledge-graph",
        "Louvain community detection",
        "src/lib/wiki-graph-analysis.ts",
        ("graphology-communities-louvain", "detectCommunities", "cohesion"),
    ),
    EvidenceCheck(
        "deep-research",
        "Deep Research synthesis into a Wiki page",
        "src/lib/deep-research.ts",
        ("collectResearchSources", "buildResearchPageContent", "embedPage"),
    ),
    EvidenceCheck(
        "agent-runtime",
        "Built-in Agent tool registry",
        "src-tauri/src/agent/tools.rs",
        ("wiki.search", "source.search", "graph.search", "workspace.write_file", "shell.exec"),
    ),
    EvidenceCheck(
        "agent-skills",
        "Local SKILL.md discovery",
        "src-tauri/src/agent/skills.rs",
        ("SKILL.md", "load_project_skills"),
    ),
    EvidenceCheck(
        "local-api",
        "Token-aware local API",
        "src-tauri/src/api_server.rs",
        ("const PORT: u16 = 19828", 'const API_PREFIX: &str = "/api/v1"', "Bearer "),
    ),
    EvidenceCheck(
        "mcp",
        "MCP tools for external Agents",
        "mcp-server/src/index.ts",
        ("llm_wiki_search", "llm_wiki_chat", "llm_wiki_graph", "llm_wiki_rescan_sources"),
    ),
)


def git(*args: str) -> str:
    return subprocess.check_output(
        ["git", "-C", str(UPSTREAM), *args], text=True, encoding="utf-8"
    ).strip()


def count_sources() -> tuple[int, int]:
    source_suffixes = {".ts", ".tsx", ".rs"}
    sources = [
        path
        for root in (UPSTREAM / "src", UPSTREAM / "src-tauri" / "src", UPSTREAM / "mcp-server" / "src")
        for path in root.rglob("*")
        if path.is_file() and path.suffix in source_suffixes
    ]
    tests = [
        path
        for path in sources
        if ".test." in path.name or path.name.endswith("_test.rs") or "test" in path.parts
    ]
    return len(sources), len(tests)


def run_audit() -> dict[str, object]:
    results: list[dict[str, object]] = []
    for check in CHECKS:
        target = UPSTREAM / check.path
        content = target.read_text(encoding="utf-8") if target.exists() else ""
        missing = [needle for needle in check.needles if needle not in content]
        results.append(
            {
                "capability": check.capability,
                "label": check.label,
                "path": check.path,
                "needles": list(check.needles),
                "passed": not missing,
                "missing": missing,
            }
        )

    source_files, test_files = count_sources()
    passed = sum(1 for item in results if item["passed"])
    return {
        "audit_date": date.today().isoformat(),
        "upstream": "https://github.com/nashsu/llm_wiki",
        "version": git("describe", "--tags", "--always"),
        "commit": git("rev-parse", "HEAD"),
        "source_files": source_files,
        "test_files": test_files,
        "checks": {"passed": passed, "total": len(results)},
        "results": results,
        "interpretation": "Source-verified means the implementation marker exists in the pinned checkout; it does not prove real-model output quality.",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = run_audit()
    rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered, end="")
    return 0 if result["checks"]["passed"] == result["checks"]["total"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
