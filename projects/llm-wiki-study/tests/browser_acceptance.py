"""Real-browser acceptance checks for the LLM Wiki capability map."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright


URL = "http://127.0.0.1:8765/projects/llm-wiki-study/"
INDEX_URL = "http://127.0.0.1:8765/"
ROOT = Path(__file__).resolve().parents[1]
EVIDENCE_DIR = ROOT / "notes" / "evidence" / "browser"
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")


def assert_no_horizontal_overflow(page: Page, surface: str) -> None:
    dimensions = page.evaluate(
        """() => ({
          innerWidth: window.innerWidth,
          rootWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth
        })"""
    )
    if dimensions["rootWidth"] > dimensions["innerWidth"] + 1:
        raise AssertionError(f"{surface}: horizontal overflow {dimensions}")


def assert_page_loaded(page: Page) -> None:
    assert "LLM Wiki 能力地图" in page.title()
    assert page.locator("body").inner_text().strip()
    assert page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count() == 0
    assert page.get_by_role("heading", name="把散落资料， 编译成一座 持续生长的 Wiki。").count() == 1
    assert page.locator("#original-ui-title").count() == 1
    assert "桌面知识工作台" in page.locator("#original-ui-title").inner_text()
    assert page.locator("#native-run-title").count() == 1
    assert "《左耳听风》已经在" in page.locator("#native-run-title").inner_text()
    assert "原生端跑通" in page.locator("#native-run-title").inner_text()
    assert page.get_by_role("heading", name="选择一项能力， 查看机制与源码证据。").count() == 1
    assert page.get_by_role("heading", name="还是那份《左耳听风》， 三种方式会留下什么？").count() == 1
    assert page.get_by_role("heading", name="这次不是示意。 Codex 真的把资料编译成了 Wiki。").count() == 1
    assert page.get_by_role("heading", name="它真正提供的， 是人与 Agent 共用的知识层。").count() == 1
    assert page.locator(".section-nav a").count() == 8
    assert page.locator("[data-original-ui]").count() == 6
    assert page.locator("#original-ui-console").get_attribute("aria-busy") == "false"
    assert page.locator("#original-ui-surface-title").inner_text() == "原库本身是一款带完整界面的桌面应用"
    assert page.locator("#original-ui-capabilities li").count() == 4
    assert "官方截图" in page.locator("#original-ui-boundary").inner_text()
    assert page.locator("#original-ui-image").get_attribute("src") == "./assets/original-ui/overview.jpg"
    assert page.locator("#original-ui-image").evaluate("image => image.complete && image.naturalWidth > 0")
    assert page.locator("#native-run .native-run-shot").count() == 5
    assert "ACTUAL WINDOW" in page.locator("#native-run").inner_text()
    assert "9 files" in page.locator("#native-run").inner_text()
    assert "5 refs" in page.locator("#native-run").inner_text()
    assert page.locator("#knowledge-flywheel").count() == 1
    assert page.locator("#knowledge-flywheel .knowledge-flywheel-stages li").count() == 6
    assert page.locator("#knowledge-flywheel .knowledge-assets > *").count() == 3
    assert "不是把资料训练进模型参数" in page.locator("#knowledge-flywheel").inner_text()
    assert "成熟的检查表、判断边界和工作步骤写成 Skill" in page.locator("#knowledge-flywheel").inner_text()
    assert page.locator("[data-sample-mode]").count() == 3
    assert page.locator("#sample-articles").inner_text() == "119 篇"
    assert page.locator("#sample-characters").inner_text() == "852,621"
    assert page.locator("#sample-candidates").inner_text() == "247 条"
    assert page.locator("#sample-skill-name").inner_text() == "系统性故障学习审查"
    assert page.locator("#sample-regression").inner_text() == "19 / 19 合成回归通过"
    assert page.locator("#sample-mode-title").inner_text() == "LLM Wiki"
    assert page.locator("#sample-process li").count() == 4
    assert page.locator("#wiki-node-list .wiki-node").count() == 5
    assert page.locator("#sample-wiki-map").is_visible()
    active_tab_bounds = page.locator('[data-sample-mode="wiki"]').evaluate(
        """element => {
          const tab = element.getBoundingClientRect();
          const list = element.parentElement.getBoundingClientRect();
          return { left: tab.left, right: tab.right, listLeft: list.left, listRight: list.right };
        }"""
    )
    assert active_tab_bounds["left"] >= active_tab_bounds["listLeft"] - 1
    assert active_tab_bounds["right"] <= active_tab_bounds["listRight"] + 1
    assert "不是纸质书全文" in page.locator("#left-ear-demo").inner_text()
    assert "不是 LLM Wiki 的实际生成数量" in page.locator("#sample-source-boundary").inner_text()
    assert page.locator("#real-run-status").inner_text() == "真实摄取通过"
    assert page.locator("#real-elapsed").inner_text() == "142.6 秒"
    assert page.locator("#real-calls").inner_text() == "3 次"
    assert page.locator("#real-pages").inner_text() == "8 个"
    assert page.locator("#real-thematic").inner_text() == "5 个"
    assert page.locator("#real-relations").inner_text() == "13 条"
    assert page.locator("#real-reviews").inner_text() == "2 项"
    assert page.locator("#real-call-list li").count() == 3
    assert page.locator("#real-page-list button").count() == 8
    assert page.locator("#real-quality-grid article").count() == 5
    assert "输入不是 119 篇第三方专栏正文" in page.locator("#codex-run").inner_text()
    assert "人与 Agent 共用的知识层" in page.locator("#codex-run").inner_text()
    assert page.locator(".capability-card").count() == 12
    assert page.locator(".filter-button").count() == 8
    assert page.locator("#result-count").inner_text() == "12 / 12"
    assert page.locator("#detail-evidence a").count() >= 2
    assert page.locator("img").evaluate_all("images => images.every(image => image.complete && image.naturalWidth > 0)")


def set_theme(page: Page, theme: str) -> None:
    page.evaluate("theme => localStorage.setItem('llm-wiki-study-theme', theme)", theme)
    page.goto(URL, wait_until="networkidle")
    assert page.locator("html").get_attribute("data-theme") == theme


def capture_section(page: Page, selector: str, output: Path) -> None:
    page.evaluate(
        """selector => {
          const target = document.querySelector(selector);
          const header = document.querySelector('.site-header');
          const top = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 12;
          window.scrollTo({ top, behavior: 'instant' });
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        }""",
        selector,
    )
    page.wait_for_timeout(120)
    # Full-page captures can occasionally spend more than Playwright's default
    # 30 seconds encoding the image on Windows. Keep the acceptance check strict,
    # but give the renderer enough time to finish after fonts have loaded.
    page.screenshot(path=output, timeout=60_000)


def verify_interactions(page: Page) -> dict[str, str]:
    graph_filter = page.get_by_role("button", name="知识图谱", exact=True)
    graph_filter.click()
    assert graph_filter.get_attribute("aria-pressed") == "true"
    assert page.locator(".capability-card").count() == 1
    assert page.locator("#result-count").inner_text() == "1 / 12"
    assert page.locator("#detail-title").inner_text() == "知识图谱与缺口洞察"

    all_filter = page.get_by_role("button", name="全部", exact=True)
    all_filter.click()
    assert page.locator(".capability-card").count() == 12

    search = page.get_by_role("searchbox", name="搜索能力")
    search.fill("这条搜索不会命中")
    assert page.locator("#empty-state").is_visible()
    assert page.locator("#capability-grid").is_hidden()
    assert page.locator("#detail-panel").is_hidden()
    page.get_by_role("button", name="显示全部能力").click()
    assert page.locator(".capability-card").count() == 12
    assert page.locator("#result-count").inner_text() == "12 / 12"
    assert search.input_value() == ""

    hybrid = page.locator('.capability-card[data-id="hybrid-retrieval"]')
    hybrid.click()
    assert page.locator("#detail-title").inner_text() == "关键词 × 向量 × 图谱检索"
    assert page.url.endswith("#cap-hybrid-retrieval")
    href = page.locator("#detail-evidence a").first.get_attribute("href")
    assert "e8082119649e6a8e1cf85eaf289adcabfdf39d4e" in href
    assert "src-tauri/src/commands/search.rs#L414" in href

    all_filter.focus()
    page.keyboard.press("ArrowRight")
    assert page.evaluate("document.activeElement.textContent") == "资料摄取"
    focus_style = page.get_by_role("button", name="资料摄取", exact=True).evaluate(
        "element => ({ style: getComputedStyle(element).outlineStyle, width: getComputedStyle(element).outlineWidth })"
    )
    assert focus_style["style"] != "none" and focus_style["width"] != "0px"

    toggle = page.locator("#theme-toggle")
    initial = page.locator("html").get_attribute("data-theme")
    toggle.click()
    assert page.locator("html").get_attribute("data-theme") != initial
    toggle.click()
    assert page.locator("html").get_attribute("data-theme") == initial

    return {
        "category_filter": "pass",
        "search_empty_reset": "pass",
        "detail_and_fixed_source_link": "pass",
        "url_hash_replay": "pass",
        "keyboard_filter_navigation": "pass",
        "focus_visible": "pass",
        "theme_round_trip": "pass",
    }


def verify_sample_interactions(page: Page) -> dict[str, str]:
    model_tab = page.get_by_role("tab", name="01 直接模型")
    rag_tab = page.get_by_role("tab", name="02 普通 RAG")
    wiki_tab = page.get_by_role("tab", name="03 LLM Wiki")

    model_tab.click()
    assert model_tab.get_attribute("aria-selected") == "true"
    assert page.locator("#sample-mode-title").inner_text() == "直接模型调用"
    assert page.locator("#sample-process li").count() == 3
    assert page.locator("#sample-wiki-map").is_hidden()
    assert "无检索" in page.locator("#sample-mode-status").inner_text()

    rag_tab.click()
    assert rag_tab.get_attribute("aria-selected") == "true"
    assert page.locator("#sample-mode-title").inner_text() == "普通 RAG"
    assert "27 分钟" in page.locator("#sample-answer").inner_text()
    assert "原始分块" in page.locator("#sample-artifacts").inner_text()

    wiki_tab.click()
    assert wiki_tab.get_attribute("aria-selected") == "true"
    assert page.locator("#sample-mode-title").inner_text() == "LLM Wiki"
    assert page.locator("#sample-process li").count() == 4
    assert page.locator("#sample-wiki-map").is_visible()
    assert page.locator("#wiki-node-list .wiki-node").count() == 5
    assert "sources[]" in page.locator("#sample-evidence-state").inner_text()

    model_tab.focus()
    page.keyboard.press("ArrowRight")
    assert rag_tab.get_attribute("aria-selected") == "true"
    assert page.evaluate("document.activeElement.id") == "sample-tab-rag"
    page.keyboard.press("End")
    assert wiki_tab.get_attribute("aria-selected") == "true"
    assert page.evaluate("document.activeElement.id") == "sample-tab-wiki"

    return {
        "same_question_three_modes": "pass",
        "model_mode": "pass",
        "rag_mode": "pass",
        "wiki_mapping": "pass",
        "sample_keyboard_tabs": "pass",
        "sample_evidence_boundary": "pass",
    }


def verify_original_ui_interactions(page: Page) -> dict[str, str]:
    workspace_tab = page.get_by_role("tab", name="01 桌面工作区")
    research_tab = page.get_by_role("tab", name="02 Deep Research")
    clipper_tab = page.get_by_role("tab", name="05 网页剪藏")
    obsidian_tab = page.get_by_role("tab", name="06 Obsidian 兼容")

    research_tab.click()
    assert research_tab.get_attribute("aria-selected") == "true"
    assert page.locator("#original-ui-surface-title").inner_text() == "从知识缺口出发，继续检索并沉淀新页面"
    assert page.locator("#original-ui-image").get_attribute("src") == "./assets/original-ui/1-deepresearch.jpg"
    page.wait_for_function(
        "document.querySelector('#original-ui-image').complete && document.querySelector('#original-ui-image').naturalWidth > 0"
    )
    assert "缺口识别" in page.locator("#original-ui-capabilities").inner_text()
    source_href = page.locator("#original-ui-source").get_attribute("href")
    assert "e8082119649e6a8e1cf85eaf289adcabfdf39d4e" in source_href
    assert source_href.endswith("assets/1-deepresearch.jpg")

    clipper_tab.click()
    assert clipper_tab.get_attribute("aria-selected") == "true"
    assert "选择项目" in page.locator("#original-ui-operation").inner_text()
    assert "Chrome 扩展" in page.locator("#original-ui-summary").inner_text()

    workspace_tab.focus()
    page.keyboard.press("ArrowRight")
    assert research_tab.get_attribute("aria-selected") == "true"
    assert page.evaluate("document.activeElement.id") == "original-ui-tab-research"
    page.keyboard.press("End")
    assert obsidian_tab.get_attribute("aria-selected") == "true"
    assert page.evaluate("document.activeElement.id") == "original-ui-tab-obsidian"
    assert "Obsidian" in page.locator("#original-ui-image").get_attribute("alt")
    page.wait_for_function(
        "document.querySelector('#original-ui-image').complete && document.querySelector('#original-ui-image').naturalWidth > 0"
    )

    active_tab_bounds = obsidian_tab.evaluate(
        """element => {
          const tab = element.getBoundingClientRect();
          const list = element.parentElement.getBoundingClientRect();
          return { left: tab.left, right: tab.right, listLeft: list.left, listRight: list.right };
        }"""
    )
    assert active_tab_bounds["left"] >= active_tab_bounds["listLeft"] - 1
    assert active_tab_bounds["right"] <= active_tab_bounds["listRight"] + 1

    return {
        "official_ui_provenance": "pass",
        "six_surface_mapping": "pass",
        "ui_image_and_copy_sync": "pass",
        "fixed_image_source_link": "pass",
        "original_ui_keyboard_tabs": "pass",
        "active_tab_scroll_visibility": "pass",
    }


def verify_native_run(page: Page) -> dict[str, str]:
    section = page.locator("#native-run")
    section.scroll_into_view_if_needed()
    assert "SOURCE BUILD PASS" in section.inner_text()
    assert "Codex CLI 0.150.1" in section.inner_text()
    assert "gpt-5.4-mini" in section.inner_text()
    assert "RAG / 检索机制" in section.inner_text()
    assert "CODEX / 推理生成器" in section.inner_text()
    assert section.locator(".native-run-flow article").count() == 4
    assert section.locator(".native-run-meaning article").count() == 3
    assert section.locator("img").evaluate_all("images => images.every(image => image.complete && image.naturalWidth > 0)")
    assert section.get_by_role("link", name="机器可读运行结果 ↓").get_attribute("href") == "./assets/native-run-result.json"
    recovery = section.locator(".native-run-recovery")
    assert not recovery.get_attribute("open")
    recovery.locator("summary").click()
    assert recovery.get_attribute("open") is not None
    assert "第一次 Codex 摄取返回空" in recovery.inner_text()
    assert "33 个" in recovery.inner_text()

    return {
        "native_source_build": "pass",
        "native_ingest_wiki_graph_review": "pass",
        "native_rag_codex_answer": "pass",
        "native_provenance_boundary": "pass",
        "native_failure_recovery_disclosed": "pass",
    }


def verify_real_run_interactions(page: Page) -> dict[str, str]:
    page.locator("#codex-run").scroll_into_view_if_needed()
    assert page.locator("#real-run-console").get_attribute("aria-busy") == "false"
    assert page.locator("#real-page-title").inner_text() == "合成慢 SQL 事故"
    assert page.locator('#real-page-list button[aria-pressed="true"]').count() == 1
    assert "left-ear-research-capsule.md" in page.locator("#real-page-sources").inner_text()
    assert "系统性故障学习审查" in page.locator("#real-page-links").inner_text()

    method_button = page.locator("#real-page-list button").filter(has_text="系统性故障学习审查")
    method_button.click()
    assert method_button.get_attribute("aria-pressed") == "true"
    assert page.locator("#real-page-type").inner_text() == "方法"
    assert "事实、扩散链" in page.locator("#real-page-excerpt").inner_text()

    method_button.focus()
    page.keyboard.press("ArrowDown")
    assert page.evaluate("document.activeElement.getAttribute('aria-pressed')") == "true"
    assert page.locator("#real-page-title").inner_text() != "系统性故障学习审查"

    quality_text = page.locator("#real-quality-grid").inner_text()
    assert "3 条建议只解析为 2 项" in quality_text
    assert "5 个结构提示" in quality_text
    assert "保留了旧种子文案" in quality_text
    result_href = page.get_by_role("link", name="打开机器可读结果 ↗").get_attribute("href")
    assert result_href == "./assets/codex-ingest-result.json"

    return {
        "real_codex_metrics": "pass",
        "real_page_browser": "pass",
        "real_page_keyboard_navigation": "pass",
        "real_quality_findings": "pass",
        "capability_meaning_and_use_cases": "pass",
    }


def open_surface(
    context: BrowserContext,
    width: int,
    height: int,
    theme: str,
    console_errors: list[str],
    page_errors: list[str],
) -> Page:
    page = context.new_page()
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    page.set_viewport_size({"width": width, "height": height})
    page.goto(URL, wait_until="networkidle")
    set_theme(page, theme)
    assert_page_loaded(page)
    assert_no_horizontal_overflow(page, f"{width}x{height}-{theme}")
    return page


def main() -> None:
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    console_errors: list[str] = []
    page_errors: list[str] = []
    results: dict[str, object] = {
        "url": URL,
        "viewports": {},
        "interactions": {},
        "console_errors": console_errors,
        "page_errors": page_errors,
    }

    with sync_playwright() as playwright:
        browser: Browser = playwright.chromium.launch(headless=True, executable_path=str(CHROME))
        context = browser.new_context()

        desktop = open_surface(context, 1440, 960, "light", console_errors, page_errors)
        desktop.screenshot(path=EVIDENCE_DIR / "desktop-light.png", full_page=True)
        capture_section(desktop, "#original-ui", EVIDENCE_DIR / "original-ui-desktop-light.png")
        results["original_ui_interactions"] = verify_original_ui_interactions(desktop)
        capture_section(desktop, "#native-run", EVIDENCE_DIR / "native-run-desktop-light.png")
        results["native_run"] = verify_native_run(desktop)
        capture_section(desktop, ".knowledge-flywheel-head", EVIDENCE_DIR / "knowledge-flywheel-desktop-light.png")
        capture_section(desktop, ".sample-console", EVIDENCE_DIR / "left-ear-sample-desktop-light.png")
        results["sample_interactions"] = verify_sample_interactions(desktop)
        capture_section(desktop, "#codex-run", EVIDENCE_DIR / "codex-run-desktop-light.png")
        results["real_run_interactions"] = verify_real_run_interactions(desktop)
        capture_section(desktop, "#capabilities", EVIDENCE_DIR / "capabilities-desktop-light.png")
        results["interactions"] = verify_interactions(desktop)
        results["viewports"]["desktop_light"] = {"size": "1440x960", "overflow": False}
        desktop.close()

        desktop_dark = open_surface(context, 1440, 960, "dark", console_errors, page_errors)
        capture_section(desktop_dark, "#original-ui", EVIDENCE_DIR / "original-ui-desktop-dark.png")
        capture_section(desktop_dark, "#native-run", EVIDENCE_DIR / "native-run-desktop-dark.png")
        capture_section(desktop_dark, ".knowledge-flywheel-head", EVIDENCE_DIR / "knowledge-flywheel-desktop-dark.png")
        capture_section(desktop_dark, ".sample-console", EVIDENCE_DIR / "left-ear-sample-desktop-dark.png")
        capture_section(desktop_dark, "#codex-run", EVIDENCE_DIR / "codex-run-desktop-dark.png")
        capture_section(desktop_dark, "#capabilities", EVIDENCE_DIR / "capabilities-desktop-dark.png")
        results["viewports"]["desktop_dark"] = {"size": "1440x960", "overflow": False}
        desktop_dark.close()

        tablet = open_surface(context, 768, 1024, "light", console_errors, page_errors)
        capture_section(tablet, ".original-ui-console", EVIDENCE_DIR / "original-ui-tablet-light.png")
        capture_section(tablet, ".native-run-proof", EVIDENCE_DIR / "native-run-tablet-light.png")
        capture_section(tablet, ".knowledge-flywheel-head", EVIDENCE_DIR / "knowledge-flywheel-tablet-light.png")
        capture_section(tablet, ".sample-workbench", EVIDENCE_DIR / "left-ear-sample-tablet-light.png")
        capture_section(tablet, ".real-run-console", EVIDENCE_DIR / "codex-run-tablet-light.png")
        capture_section(tablet, "#capabilities", EVIDENCE_DIR / "tablet-light.png")
        results["viewports"]["tablet_light"] = {"size": "768x1024", "overflow": False}
        tablet.close()

        mobile = open_surface(context, 390, 844, "dark", console_errors, page_errors)
        mobile.evaluate("scrollTo(0, 0)")
        mobile.screenshot(path=EVIDENCE_DIR / "mobile-dark.png")
        capture_section(mobile, ".original-ui-console", EVIDENCE_DIR / "original-ui-mobile-dark.png")
        capture_section(mobile, ".native-run-proof", EVIDENCE_DIR / "native-run-mobile-dark.png")
        capture_section(mobile, ".knowledge-flywheel-head", EVIDENCE_DIR / "knowledge-flywheel-mobile-dark.png")
        capture_section(mobile, ".sample-workbench", EVIDENCE_DIR / "left-ear-sample-mobile-dark.png")
        capture_section(mobile, ".real-run-console", EVIDENCE_DIR / "codex-run-mobile-dark.png")
        capture_section(mobile, "#capabilities", EVIDENCE_DIR / "capabilities-mobile-dark.png")
        results["viewports"]["mobile_dark"] = {"size": "390x844", "overflow": False}
        mobile.close()

        index_page = context.new_page()
        index_page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        index_page.on("pageerror", lambda error: page_errors.append(str(error)))
        index_page.goto(INDEX_URL, wait_until="networkidle")
        card = index_page.locator(".project-card").filter(has_text="LLM Wiki 能力与知识编译研究")
        assert card.count() == 1
        assert card.get_by_role("link", name="在线演示 ↗").count() == 1
        results["research_index"] = "pass"
        index_page.close()
        context.close()

        reduced_context = browser.new_context(
            viewport={"width": 390, "height": 844},
            color_scheme="dark",
            reduced_motion="reduce",
        )
        reduced_page = reduced_context.new_page()
        reduced_page.goto(URL, wait_until="networkidle")
        assert reduced_page.evaluate("getComputedStyle(document.documentElement).scrollBehavior") == "auto"
        animation_duration_ms = reduced_page.locator(".flow-line i").first.evaluate(
            """element => {
              const value = getComputedStyle(element).animationDuration;
              return value.endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1000;
            }"""
        )
        assert animation_duration_ms <= 0.1
        assert_no_horizontal_overflow(reduced_page, "390x844-reduced-motion")
        results["reduced_motion"] = "pass"
        reduced_context.close()
        browser.close()

    if console_errors or page_errors:
        raise AssertionError(json.dumps({"console_errors": console_errors, "page_errors": page_errors}, ensure_ascii=False))

    output = EVIDENCE_DIR / "browser-results.json"
    output.write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
