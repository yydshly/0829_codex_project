"""Audit the local research artifacts without third-party dependencies."""

from __future__ import annotations

import json
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
EVIDENCE = PROJECT / "notes" / "evidence" / "audit-results.json"
EXPECTED_COMMIT = "d026163f586dfa8c5c10d28c36edd59a9d3b0e88"


def check(check_id: str, passed: bool, evidence: str) -> dict[str, object]:
    return {"id": check_id, "pass": passed, "evidence": evidence}


def main() -> None:
    metadata = json.loads((PROJECT / "project.json").read_text(encoding="utf-8"))
    source_audit = json.loads(
        (PROJECT / "data" / "source-audit.json").read_text(encoding="utf-8")
    )
    html = (PROJECT / "demo" / "index.html").read_text(encoding="utf-8")
    css = (PROJECT / "demo" / "styles.css").read_text(encoding="utf-8")
    javascript = (PROJECT / "demo" / "app.js").read_text(encoding="utf-8")
    report = (PROJECT / "notes" / "research-report.md").read_text(encoding="utf-8")
    contract = (PROJECT / "notes" / "design-contract.md").read_text(encoding="utf-8")

    expected_artifacts = [
        "README.md",
        "project.json",
        "data/source-audit.json",
        "notes/research-report.md",
        "notes/design-contract.md",
        "demo/index.html",
        "demo/styles.css",
        "demo/app.js",
        "demo/favicon.svg",
        "scripts/audit_source.py",
        "tests/browser_acceptance.py",
    ]

    required_topics = ["能力", "实现原理", "价值", "使用场景", "可扩展场景", "对我们的意义"]
    required_sections = ["capability", "mechanism", "value", "scenarios", "extensions", "meaning", "evidence"]
    checks = [
        check(
            "required-artifacts",
            all((PROJECT / path).is_file() for path in expected_artifacts),
            ", ".join(expected_artifacts),
        ),
        check("project-completed", metadata["status"] == "completed", metadata["status"]),
        check("demo-registered", bool(metadata["demo_url"]), metadata["demo_url"]),
        check(
            "fixed-source-commit",
            source_audit["upstream"]["commit"] == EXPECTED_COMMIT,
            source_audit["upstream"]["commit"],
        ),
        check(
            "source-audit-shape",
            len(source_audit["repository"]["agent_tools"]) == 9
            and len(source_audit["repository"]["output_stacks"]) == 6
            and len(source_audit["observations"]) == 8,
            "9 tools / 6 stacks / 8 observations",
        ),
        check(
            "documentation-drift-recorded",
            len(source_audit["documentation_drift"]) == 2,
            "tool-step and model-list drift",
        ),
        check(
            "research-topics-covered",
            all(topic in report for topic in required_topics),
            ", ".join(required_topics),
        ),
        check(
            "demo-sections",
            all(f'id="{section}"' in html for section in required_sections),
            ", ".join(required_sections),
        ),
        check(
            "static-core-content",
            html.count('data-scenario="') == 9
            and html.count('data-step="') == 5
            and "视觉前端复刻闭环" in html,
            "9 scenario cards / 5 agent steps / core conclusion in HTML",
        ),
        check(
            "theme-and-motion-contract",
            'data-theme="dark"' in html
            and "prefers-reduced-motion: reduce" in css
            and "stc-study-theme" in javascript,
            "light/dark persistence and reduced-motion CSS",
        ),
        check(
            "keyboard-tab-contract",
            'role="tablist"' in html
            and "ArrowRight" in javascript
            and "ArrowLeft" in javascript,
            "ARIA tabs with arrow-key navigation",
        ),
        check(
            "coverage-contract",
            "Coverage record" in contract and "覆盖清单" in contract,
            "full delivery coverage is recorded",
        ),
    ]

    failed = [item for item in checks if not item["pass"]]
    result = {
        "generated_at": "2026-08-29",
        "summary": {"checks": len(checks), "failures": len(failed)},
        "checks": checks,
    }
    EVIDENCE.parent.mkdir(parents=True, exist_ok=True)
    EVIDENCE.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(result["summary"], ensure_ascii=False, indent=2))
    print(f"evidence: {EVIDENCE.relative_to(PROJECT)}")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
