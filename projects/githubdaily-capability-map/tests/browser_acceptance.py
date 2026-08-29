"""Browser acceptance checks for the GitHubDaily curation research page."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import Page, sync_playwright


URL = "http://127.0.0.1:8000/projects/githubdaily-capability-map/"
ROOT = Path(__file__).resolve().parents[1]
EVIDENCE_DIR = ROOT / "notes" / "evidence"
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")


def assert_no_horizontal_overflow(page: Page, surface: str) -> None:
    dimensions = page.evaluate(
        """() => ({
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth
        })"""
    )
    if dimensions["scrollWidth"] > dimensions["innerWidth"] + 1:
        raise AssertionError(f"{surface}: horizontal overflow {dimensions}")


def assert_key_content(page: Page) -> None:
    assert "GitHubDaily 开源项目精选与内容索引研究" in page.title()
    assert page.locator("h1").inner_text() == "它是一套长期维护的\nGitHub 开源项目\n精选与传播档案。"
    assert page.get_by_role("heading", name="它保存的， 是项目信息。").count() == 1
    assert page.get_by_role("heading", name="有保留价值， 但必须筛选。").count() == 1
    assert page.get_by_role("heading", name="它扩展研究雷达， 判断仍由我们完成。").count() == 1
    assert "它传播的是项目内容与线索，不是项目源代码镜像。" in page.locator("main").inner_text()
    assert "可以把它叫“信息备份”，但不能把它叫“GitHub 仓库备份”。" in page.locator("main").inner_text()
    assert page.locator("#collection .sample-card").count() == 5
    assert page.locator("#collection .positioning-grid article").count() == 3
    assert "长期维护的\n开源项目精选与传播档案。" in page.locator("#collection").inner_text()
    assert "重验证与沉淀" in page.locator("#collection").inner_text()
    assert "核心资产：独立验证" in page.locator("#meaning").inner_text()
    assert "1,523" in page.locator("#collection").inner_text()
    assert "全量保留索引" in page.locator("#collection").inner_text()
    assert page.locator(".section-nav a").count() == 6
    assert page.locator("main").inner_text().strip()
    assert page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count() == 0


def capture_section_view(page: Page, selector: str, path: Path) -> None:
    page.evaluate(
        """selector => {
          const section = document.querySelector(selector);
          const header = document.querySelector('.site-header');
          const top = section.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 18;
          window.scrollTo({ top, behavior: 'instant' });
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        }""",
        selector,
    )
    page.wait_for_timeout(100)
    page.screenshot(path=path)


def verify_interactions(page: Page) -> None:
    collection_link = page.locator('.section-nav a[href="#collection"]')
    collection_link.click()
    page.wait_for_function(
        "document.querySelector('.section-nav a[href=\"#collection\"]').getAttribute('aria-current') === 'true'"
    )
    page.wait_for_function(
        "document.querySelector('#collection-title').getBoundingClientRect().top > "
        "document.querySelector('.site-header').getBoundingClientRect().bottom"
    )
    assert collection_link.get_attribute("aria-current") == "true"
    header_bottom = page.locator(".site-header").bounding_box()["height"]
    collection_top = page.locator("#collection-title").bounding_box()["y"]
    assert collection_top > header_bottom

    step_tabs = page.locator("[data-step]")
    step_tabs.nth(3).click()
    assert page.locator("#step-title").inner_text() == "按分类和年份保存到 Markdown 清单"
    assert step_tabs.nth(3).get_attribute("aria-selected") == "true"

    step_tabs.nth(0).click()
    step_tabs.nth(0).focus()
    page.keyboard.press("ArrowRight")
    assert step_tabs.nth(1).get_attribute("aria-selected") == "true"
    assert page.locator("#step-title").inner_text() == "人工决定哪些项目放进清单"
    focus_outline = step_tabs.nth(1).evaluate(
        "element => ({ width: getComputedStyle(element).outlineWidth, style: getComputedStyle(element).outlineStyle })"
    )
    assert focus_outline["style"] != "none" and focus_outline["width"] != "0px"

    audience_tabs = page.locator("[data-audience]")
    audience_tabs.nth(3).click()
    assert page.locator("#audience-title").inner_text() == "向中文开发者介绍自己的项目"
    assert audience_tabs.nth(3).get_attribute("aria-selected") == "true"

    toggle = page.locator("#theme-toggle")
    initial = page.locator("html").get_attribute("data-theme")
    toggle.click()
    changed = page.locator("html").get_attribute("data-theme")
    assert changed != initial
    toggle.click()
    assert page.locator("html").get_attribute("data-theme") == initial


def main() -> None:
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    console_errors: list[str] = []
    page_errors: list[str] = []
    results: dict[str, object] = {"url": URL, "viewports": {}, "interactions": {}}

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=str(CHROME))
        context = browser.new_context(viewport={"width": 1440, "height": 960}, color_scheme="dark")
        page = context.new_page()
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        page.on("pageerror", lambda error: page_errors.append(str(error)))
        page.goto(URL, wait_until="networkidle")
        page.evaluate("localStorage.setItem('ghd-theme', 'dark')")
        page.reload(wait_until="networkidle")

        assert_key_content(page)
        assert_no_horizontal_overflow(page, "desktop")
        page.screenshot(path=EVIDENCE_DIR / "desktop-dark.png")
        capture_section_view(page, "#capability", EVIDENCE_DIR / "capability-dark.png")
        capture_section_view(page, "#collection", EVIDENCE_DIR / "collection-dark.png")
        capture_section_view(page, ".positioning-block", EVIDENCE_DIR / "positioning-dark.png")
        capture_section_view(page, ".sample-block", EVIDENCE_DIR / "collection-samples-dark.png")
        capture_section_view(page, ".retention-plan", EVIDENCE_DIR / "retention-plan-dark.png")
        capture_section_view(page, "#meaning", EVIDENCE_DIR / "meaning-dark.png")
        results["viewports"]["desktop"] = {"size": "1440x960", "theme": "dark", "overflow": False}

        verify_interactions(page)
        results["interactions"] = {
            "collection_anchor": "pass",
            "mechanism_tabs": "pass",
            "audience_tabs": "pass",
            "keyboard_tabs": "pass",
            "focus_visible": "pass",
            "theme_round_trip": "pass",
        }

        page.set_viewport_size({"width": 768, "height": 1024})
        page.evaluate("localStorage.setItem('ghd-theme', 'light')")
        page.reload(wait_until="networkidle")
        assert_key_content(page)
        assert_no_horizontal_overflow(page, "tablet")
        capture_section_view(page, "#collection", EVIDENCE_DIR / "collection-tablet-light.png")
        capture_section_view(page, ".positioning-block", EVIDENCE_DIR / "positioning-tablet-light.png")
        page.locator("#mechanism").scroll_into_view_if_needed()
        page.screenshot(path=EVIDENCE_DIR / "tablet-light.png")
        results["viewports"]["tablet"] = {"size": "768x1024", "theme": "light", "overflow": False}

        page.set_viewport_size({"width": 390, "height": 844})
        page.evaluate("localStorage.setItem('ghd-theme', 'dark')")
        page.reload(wait_until="networkidle")
        page.evaluate("scrollTo(0, 0)")
        assert_key_content(page)
        assert_no_horizontal_overflow(page, "mobile")
        page.evaluate("scrollTo(0, 0)")
        page.wait_for_timeout(100)
        assert page.evaluate("window.scrollY") == 0
        page.screenshot(path=EVIDENCE_DIR / "mobile-dark.png")
        capture_section_view(page, "#capability", EVIDENCE_DIR / "capability-mobile-dark.png")
        capture_section_view(page, "#collection", EVIDENCE_DIR / "collection-mobile-dark.png")
        capture_section_view(page, ".positioning-block", EVIDENCE_DIR / "positioning-mobile-dark.png")
        capture_section_view(page, ".sample-block", EVIDENCE_DIR / "collection-samples-mobile-dark.png")
        capture_section_view(page, ".retention-plan", EVIDENCE_DIR / "retention-plan-mobile-dark.png")
        capture_section_view(page, "#meaning", EVIDENCE_DIR / "meaning-mobile-dark.png")
        results["viewports"]["mobile"] = {"size": "390x844", "theme": "dark", "overflow": False}

        index_page = context.new_page()
        index_page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        index_page.on("pageerror", lambda error: page_errors.append(str(error)))
        index_page.goto("http://127.0.0.1:8000/", wait_until="networkidle")
        githubdaily_card = index_page.locator(".project-card").filter(
            has_text="GitHubDaily 开源项目精选与内容索引研究"
        )
        assert githubdaily_card.count() == 1
        demo_link = githubdaily_card.get_by_role("link", name="在线演示 ↗")
        assert demo_link.count() == 1
        assert demo_link.get_attribute("href") == "https://yydshly.github.io/0829_codex_project/projects/githubdaily-capability-map/"
        results["research_index"] = "pass"
        index_page.close()
        reduced_context = browser.new_context(
            viewport={"width": 390, "height": 844},
            color_scheme="dark",
            reduced_motion="reduce",
        )
        reduced_page = reduced_context.new_page()
        reduced_page.goto(URL, wait_until="networkidle")
        assert reduced_page.evaluate("getComputedStyle(document.documentElement).scrollBehavior") == "auto"
        results["reduced_motion"] = "pass"
        reduced_context.close()

        context.close()
        browser.close()

    if console_errors or page_errors:
        raise AssertionError(json.dumps({"console_errors": console_errors, "page_errors": page_errors}, ensure_ascii=False))
    results["console_errors"] = []
    results["page_errors"] = []
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
