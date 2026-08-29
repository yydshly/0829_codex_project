"""Browser acceptance checks for the Screenshot-to-Code research demo."""

from __future__ import annotations

import json
import os
from pathlib import Path

from playwright.sync_api import Browser, Page, sync_playwright


PROJECT = Path(__file__).resolve().parents[1]
EVIDENCE_DIR = PROJECT / "notes" / "evidence" / "browser"
RESULT_PATH = PROJECT / "notes" / "evidence" / "browser-validation.json"
URL = os.environ.get(
    "STC_STUDY_URL",
    "http://127.0.0.1:8000/projects/screenshot-to-code-agent-study/",
)
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")


def assert_no_overflow(page: Page, surface: str) -> None:
    metrics = page.evaluate(
        """() => ({
          innerWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyWidth: document.body.scrollWidth
        })"""
    )
    if metrics["scrollWidth"] > metrics["innerWidth"] + 1:
        raise AssertionError(f"{surface}: horizontal overflow {metrics}")


def assert_core_content(page: Page) -> None:
    page.wait_for_function("document.documentElement.dataset.ready === 'true'")
    assert page.title() == "Screenshot-to-Code 视觉 Agent 能力研究"
    assert "截图转页面是低频入口" in page.locator("h1").inner_text()
    assert "保留研究，当前不采用" in page.locator(".verdict").inner_text()
    assert page.locator("main section[id]").count() == 8
    assert page.locator("[data-step]").count() == 5
    assert page.locator("[data-scenario]").count() == 9
    assert page.locator(".section-nav a").count() == 6
    assert page.locator(".tool-rail span").count() == 8
    assert page.locator(
        "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay"
    ).count() == 0


def inspect(
    browser: Browser,
    name: str,
    viewport: dict[str, int],
    color_scheme: str,
    capture_selector: str,
    reduced_motion: str = "no-preference",
    interactions: bool = False,
) -> dict[str, object]:
    context = browser.new_context(
        viewport=viewport,
        color_scheme=color_scheme,
        reduced_motion=reduced_motion,
    )
    context.add_init_script("localStorage.removeItem('stc-study-theme')")
    page = context.new_page()
    console_errors: list[str] = []
    page_errors: list[str] = []
    failed_requests: list[str] = []
    page.on(
        "console",
        lambda message: console_errors.append(message.text)
        if message.type == "error"
        else None,
    )
    page.on("pageerror", lambda error: page_errors.append(str(error)))
    page.on(
        "requestfailed",
        lambda request: failed_requests.append(
            f"{request.method} {request.url}: {request.failure}"
        ),
    )
    page.goto(URL, wait_until="networkidle")
    assert_core_content(page)
    assert_no_overflow(page, name)
    assert page.locator("html").get_attribute("data-theme") == color_scheme
    interaction_result: dict[str, object] = {}

    if interactions:
        tabs = page.locator("[data-step]")
        tabs.nth(2).click()
        assert page.locator("#step-title").inner_text() == "先定位素材边界，再裁剪原始像素"
        tabs.nth(2).focus()
        page.keyboard.press("ArrowRight")
        assert tabs.nth(3).get_attribute("aria-selected") == "true"
        assert page.locator("#step-title").inner_text() == "让 Agent 看见浏览器真正渲染出的结果"
        focus_style = tabs.nth(3).evaluate(
            """element => ({
              outlineStyle: getComputedStyle(element).outlineStyle,
              outlineWidth: getComputedStyle(element).outlineWidth
            })"""
        )
        assert focus_style["outlineStyle"] != "none"
        assert focus_style["outlineWidth"] != "0px"

        caution = page.locator('[data-filter="caution"]')
        caution.click()
        assert page.locator("[data-scenario]:visible").count() == 3
        assert page.locator("#filter-status").inner_text() == "正在显示谨慎 3 个场景"

        toggle = page.locator("#theme-toggle")
        before = page.locator("html").get_attribute("data-theme")
        toggle.click()
        after = page.locator("html").get_attribute("data-theme")
        assert after != before
        toggle.click()
        assert page.locator("html").get_attribute("data-theme") == before

        interaction_result = {
            "selected_step": 3,
            "filtered_scenarios": 3,
            "theme_round_trip": True,
            "visible_focus": True,
        }

    page.evaluate(
        """selector => {
          const target = document.querySelector(selector);
          const header = document.querySelector('.site-header');
          const top = target.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 22;
          window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        }""",
        capture_selector,
    )
    page.wait_for_timeout(120)
    screenshot = EVIDENCE_DIR / f"{name}.png"
    page.screenshot(path=screenshot, full_page=False)
    result = {
        "viewport": viewport,
        "theme": color_scheme,
        "reduced_motion": reduced_motion,
        "horizontal_overflow": False,
        "console_errors": console_errors,
        "page_errors": page_errors,
        "failed_requests": failed_requests,
        "interaction": interaction_result,
        "screenshot": screenshot.name,
    }
    assert not console_errors, f"{name}: console errors {console_errors}"
    assert not page_errors, f"{name}: page errors {page_errors}"
    assert not failed_requests, f"{name}: failed requests {failed_requests}"
    context.close()
    return result


def main() -> None:
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    executable = str(CHROME) if CHROME.is_file() else None
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path=executable)
        matrix = {
            "desktop-dark-hero": inspect(
                browser,
                "desktop-dark-hero",
                {"width": 1440, "height": 1000},
                "dark",
                "#top",
            ),
            "desktop-light-agent": inspect(
                browser,
                "desktop-light-agent",
                {"width": 1440, "height": 1000},
                "light",
                "#mechanism",
                interactions=True,
            ),
            "tablet-light-scenarios": inspect(
                browser,
                "tablet-light-scenarios",
                {"width": 768, "height": 900},
                "light",
                "#scenarios",
            ),
            "mobile-dark-meaning": inspect(
                browser,
                "mobile-dark-meaning",
                {"width": 390, "height": 844},
                "dark",
                "#meaning",
                reduced_motion="reduce",
            ),
        }
        browser.close()

    result = {
        "generated_at": "2026-08-29",
        "url": URL,
        "browser": "Google Chrome" if CHROME.is_file() else "Playwright Chromium",
        "matrix": matrix,
        "summary": {"surfaces": len(matrix), "failures": 0},
    }
    RESULT_PATH.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(result["summary"], ensure_ascii=False, indent=2))
    print(f"evidence: {RESULT_PATH.relative_to(PROJECT)}")


if __name__ == "__main__":
    main()
