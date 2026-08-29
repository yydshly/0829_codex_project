"""Create a reproducible static audit of an abi/screenshot-to-code checkout.

The script deliberately avoids importing upstream dependencies. It inspects the
checked-out source, records the exact Git revision, and emits the evidence used
by this study. A live model-quality run is outside this audit because it needs
paid, changing external APIs.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


PROJECT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = PROJECT / "data" / "source-audit.json"


def git(repo: Path, *args: str) -> str:
    return subprocess.check_output(
        ["git", "-C", str(repo), *args], text=True, encoding="utf-8"
    ).strip()


def source_text(repo: Path, relative: str) -> str:
    path = repo / relative
    if not path.is_file():
        raise FileNotFoundError(f"Missing expected upstream file: {relative}")
    return path.read_text(encoding="utf-8")


def evidence(repo: Path, relative: str, needle: str) -> dict[str, object]:
    lines = source_text(repo, relative).splitlines()
    for line_number, line in enumerate(lines, start=1):
        if needle in line:
            return {
                "file": relative,
                "line": line_number,
                "excerpt": line.strip(),
            }
    raise ValueError(f"Expected source evidence not found: {relative}: {needle}")


def literal_values(text: str, name: str) -> list[str]:
    match = re.search(rf"{re.escape(name)}\s*=\s*Literal\[(.*?)\]", text, re.S)
    if not match:
        return []
    return re.findall(r'["\']([^"\']+)["\']', match.group(1))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("upstream", type=Path, help="Path to an upstream checkout")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    repo = args.upstream.resolve()
    if not (repo / ".git").exists():
        raise SystemExit(f"Not a Git checkout: {repo}")

    files = [
        path
        for path in repo.rglob("*")
        if path.is_file() and ".git" not in path.relative_to(repo).parts
    ]
    suffixes = Counter(path.suffix.lower() or "[none]" for path in files)

    prompt_types = source_text(repo, "backend/prompts/prompt_types.py")
    input_types = source_text(repo, "backend/custom_types.py")
    tool_definitions = source_text(repo, "backend/agent/tools/definitions.py")
    tools = re.findall(r'name="([a-z_]+)"', tool_definitions)
    if "SAVE_ASSETS_TOOL_DEFINITION" in tool_definitions:
        tools.append("save_assets")

    engine_max = evidence(repo, "backend/agent/engine.py", "max_steps = 30")
    docs_max = evidence(
        repo, "design-docs/agent-tool-calling-flow.md", "Maximum 20 tool turns"
    )
    readme_models = evidence(repo, "README.md", "GPT-5.5 and GPT-5.4 Mini")
    runtime_models = evidence(
        repo, "backend/routes/model_choice_sets.py", "Llm.GPT_5_6_SOL_MAX"
    )

    observations = [
        {
            "id": "external-model-orchestrator",
            "finding": "核心能力来自外部多模态模型，仓库负责 provider 适配、prompt、工具和运行闭环，而不是训练专用截图模型。",
            "evidence": [
                evidence(repo, "backend/agent/providers/factory.py", "OPENAI_MODELS"),
                evidence(repo, "backend/agent/providers/factory.py", "ANTHROPIC_MODELS"),
                evidence(repo, "backend/agent/providers/factory.py", "GEMINI_MODELS"),
            ],
        },
        {
            "id": "single-file-contract",
            "finding": "主输出契约是可立即预览的单个 index.html，而不是标准多文件生产工程。",
            "evidence": [
                evidence(
                    repo,
                    "backend/prompts/system_prompt.py",
                    'The main file is a single HTML file',
                )
            ],
        },
        {
            "id": "agent-tool-loop",
            "finding": "模型通过 create/edit/image/asset/preview 等工具迭代文件状态，当前代码最多运行 30 个 agent step。",
            "evidence": [engine_max, evidence(repo, "backend/agent/engine.py", "append_tool_results")],
        },
        {
            "id": "visual-feedback-loop",
            "finding": "生成后的 HTML 会在桌面和手机视口渲染成截图，作为模型继续修正的视觉反馈。",
            "evidence": [
                evidence(
                    repo,
                    "backend/prompts/system_prompt.py",
                    "always call screenshot_preview once",
                ),
                evidence(repo, "backend/preview_screenshot/base.py", '"desktop": (1280, 832)'),
                evidence(repo, "backend/preview_screenshot/base.py", '"mobile": (342, 684)'),
            ],
        },
        {
            "id": "asset-crop-pipeline",
            "finding": "Gemini 返回归一化边界框，后端用 Pillow 裁剪原始像素，从而复用真实 logo、照片和图标。",
            "evidence": [
                evidence(repo, "backend/asset_extraction.py", "ASSET_EXTRACTION_GEMINI_MODEL"),
                evidence(repo, "backend/asset_extraction.py", "box_2d"),
                evidence(repo, "backend/asset_extraction.py", "image.crop"),
            ],
        },
        {
            "id": "parallel-variants",
            "finding": "同一请求可并行运行多个模型变体，再由用户比较候选。",
            "evidence": [
                evidence(repo, "backend/routes/generate_code.py", "asyncio.gather")
            ],
        },
        {
            "id": "figma-boundary",
            "finding": "所谓 Figma 支持实际是截图或导出画板输入；当前源码明确拒绝直接 Figma URL 导入。",
            "evidence": [
                evidence(
                    repo,
                    "frontend/src/components/unified-input/tabs/UrlTab.tsx",
                    "Direct Figma import is not supported",
                )
            ],
        },
        {
            "id": "small-manual-eval-baseline",
            "finding": "仓库提供评测脚本和评分界面，但公开基础说明仍是 16 张截图与人工 1–4 分。",
            "evidence": [
                evidence(repo, "Evaluation.md", "16 screenshots"),
                evidence(repo, "Evaluation.md", "scale of 1-4"),
            ],
        },
    ]

    drift = [
        {
            "id": "tool-step-doc-drift",
            "finding": "设计文档写最多 20 轮，当前 engine 实现为 30 step。",
            "documentation": docs_max,
            "implementation": engine_max,
        },
        {
            "id": "model-list-drift",
            "finding": "README 的默认 OpenAI 型号与当前模型选择代码不完全一致，说明模型清单是易变配置，不能作为稳定能力边界。",
            "documentation": readme_models,
            "implementation": runtime_models,
        },
    ]

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "upstream": {
            "url": "https://github.com/abi/screenshot-to-code",
            "commit": git(repo, "rev-parse", "HEAD"),
            "commit_date": git(repo, "show", "-s", "--format=%cI", "HEAD"),
            "commit_subject": git(repo, "show", "-s", "--format=%s", "HEAD"),
            "license": source_text(repo, "LICENSE").splitlines()[0],
        },
        "repository": {
            "file_count": len(files),
            "file_types": dict(sorted(suffixes.items())),
            "python_files": suffixes[".py"],
            "tsx_files": suffixes[".tsx"],
            "test_files": sum("test" in path.name.lower() for path in files),
            "provider_adapters": ["OpenAI", "Anthropic", "Gemini"],
            "input_modes": literal_values(input_types, "InputMode"),
            "output_stacks": literal_values(prompt_types, "Stack"),
            "agent_tools": sorted(set(tools)),
        },
        "observations": observations,
        "documentation_drift": drift,
        "scope_boundary": {
            "live_generation_executed": False,
            "reason": "Static architecture audit only; live quality depends on paid and changing OpenAI, Anthropic, Gemini, Replicate, and ScreenshotOne services.",
        },
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "commit": report["upstream"]["commit"],
                "files": report["repository"]["file_count"],
                "observations": len(observations),
                "documentation_drift": len(drift),
                "output": str(args.output),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
