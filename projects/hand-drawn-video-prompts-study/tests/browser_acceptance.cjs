"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const project = path.resolve(__dirname, "..");
const evidenceDir = path.join(project, "notes", "evidence", "browser");
const baseUrl = process.env.DEMO_URL || "http://127.0.0.1:8765/projects/hand-drawn-video-prompts-study/demo/";

fs.mkdirSync(evidenceDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function inspectPage(browser, config) {
  const context = await browser.newContext({
    viewport: config.viewport,
    colorScheme: config.colorScheme,
    reducedMotion: config.reducedMotion || "no-preference",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText || "failed";
    // Chromium commonly cancels a completed range request after MP4 metadata is available.
    if (request.resourceType() === "media" && errorText.includes("ERR_ABORTED")) return;
    failedRequests.push(`${request.url()}: ${errorText}`);
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator("#shot-title").waitFor({ state: "visible" });
  await page.locator(".sample-strip").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));
  await page.waitForFunction(() => {
    const video = document.querySelector("#final-film .case-film-player video");
    return video && video.readyState >= 1 && Number.isFinite(video.duration);
  });

  const basic = await page.evaluate(() => ({
    title: document.title,
    bodyText: document.body.innerText,
    viewportWidth: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    theme: document.documentElement.dataset.theme,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    images: [...document.images].map((image) => ({
      src: image.currentSrc || image.src,
      complete: image.complete,
      naturalWidth: image.naturalWidth,
    })),
    shotButtons: document.querySelectorAll(".shot-button").length,
    outputTabs: document.querySelectorAll(".output-tabs [role='tab']").length,
    sourceLinks: document.querySelectorAll("#source-links a").length,
    generatedFrames: [...document.images].filter((image) => image.src.includes("news-shot-02-generated.png")).length,
    deterministicTitle: document.querySelector(".deterministic-title")?.textContent || "",
    videoSources: [...document.querySelectorAll("video source")].map((source) => source.src),
    comparisonVideos: document.querySelectorAll("#final-film .film-compare-grid video").length,
    qualityCards: document.querySelectorAll("#final-film .quality-gap-grid article").length,
    finalVideo: (() => {
      const video = document.querySelector("#final-film .case-film-player video");
      return video
        ? { duration: video.duration, width: video.videoWidth, height: video.videoHeight, readyState: video.readyState }
        : null;
    })(),
  }));

  if (basic.scrollWidth > basic.viewportWidth + 1) {
    const overflowers = await page.evaluate(() =>
      [...document.querySelectorAll("body *")]
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className : "",
          id: element.id,
          left: Math.round(element.getBoundingClientRect().left),
          right: Math.round(element.getBoundingClientRect().right),
          width: Math.round(element.getBoundingClientRect().width),
        }))
        .filter((item) => item.right > innerWidth + 1 || item.left < -1)
        .slice(0, 20)
    );
    console.error(`${config.name}: overflow diagnostics ${JSON.stringify(overflowers)}`);
  }

  assert(basic.title.includes("热点新闻实战"), `${config.name}: wrong document title`);
  assert(basic.bodyText.includes("一条地月新闻"), `${config.name}: hero content missing`);
  assert(basic.bodyText.includes("8月28日，中国首次"), `${config.name}: demo data missing`);
  assert(basic.bodyText.includes("我们的案例已经接入"), `${config.name}: integrated case section missing`);
  assert(basic.bodyText.includes("差距主要不在 Prompt"), `${config.name}: quality diagnosis missing`);
  assert(basic.bodyText.includes("对你的价值：把“追热点”变成可复用流程"), `${config.name}: value section missing`);
  assert(basic.bodyText.includes("灾难、战争与未核实爆料"), `${config.name}: scenario boundary missing`);
  assert(basic.shotButtons === 7, `${config.name}: expected 7 shot controls`);
  assert(basic.outputTabs === 4, `${config.name}: expected 4 output tabs`);
  assert(basic.sourceLinks === 2, `${config.name}: expected 2 authoritative source links`);
  assert(basic.generatedFrames === 2, `${config.name}: generated keyframe not present in both proof surfaces`);
  assert(basic.comparisonVideos === 2, `${config.name}: expected case and upstream comparison videos`);
  assert(basic.qualityCards === 4, `${config.name}: quality gap diagnosis is incomplete`);
  assert(basic.deterministicTitle === "万里穿针", `${config.name}: deterministic title overlay missing`);
  assert(basic.scrollWidth <= basic.viewportWidth + 1, `${config.name}: horizontal page overflow`);
  assert(basic.images.every((image) => image.complete && image.naturalWidth > 0), `${config.name}: image failed to load`);
  assert(basic.videoSources.some((source) => source.endsWith("assets/news-case-final.mp4")), `${config.name}: final video source missing`);
  assert(basic.videoSources.some((source) => source.endsWith("assets/demo-722.mp4")), `${config.name}: upstream evidence video missing`);
  assert(basic.finalVideo && basic.finalVideo.width === 1080 && basic.finalVideo.height === 1920, `${config.name}: final video dimensions are wrong`);
  assert(Math.abs(basic.finalVideo.duration - 41.02) < 0.2, `${config.name}: final video duration is wrong`);
  assert(consoleErrors.length === 0, `${config.name}: console errors: ${consoleErrors.join(" | ")}`);
  assert(pageErrors.length === 0, `${config.name}: page errors: ${pageErrors.join(" | ")}`);
  assert(failedRequests.length === 0, `${config.name}: failed requests: ${failedRequests.join(" | ")}`);

  if (config.colorScheme === "dark") {
    assert(basic.theme === "dark", `${config.name}: dark preference not applied`);
  }
  if (config.reducedMotion === "reduce") {
    assert(basic.reducedMotion, `${config.name}: reduced-motion preference not active`);
  }

  if (config.interactions) {
    const shot04 = page.getByRole("tab", { name: /SHOT 04/ });
    await shot04.click();
    assert((await page.locator("#shot-title").textContent()) === "三关打通", "shot selection did not update title");

    await page.getByRole("tab", { name: "静帧 Prompt" }).click();
    assert((await page.locator("#output-content").textContent()).includes("exact base color #F8F6EF"), "image prompt view missing contract");
    await page.getByRole("tab", { name: "运动 Prompt" }).click();
    assert((await page.locator("#output-content").textContent()).includes("locked flat frontal camera"), "motion prompt view missing locked camera");
    await page.getByRole("tab", { name: "准确性风险" }).click();
    assert((await page.locator("#output-content").textContent()).includes("1.25Mbps"), "risk layer did not retain exact rate note");

    await page.locator("#copy-button").click();
    await page.waitForFunction(() => document.querySelector("#copy-button")?.textContent === "已复制");
    assert((await page.locator("#copy-button").textContent()) === "已复制", "copy feedback missing");

    const previousTheme = await page.locator("html").getAttribute("data-theme");
    await page.locator("#theme-toggle").click();
    const nextTheme = await page.locator("html").getAttribute("data-theme");
    assert(previousTheme !== nextTheme, "theme toggle did not change state");
    await page.locator("#theme-toggle").click();
    assert((await page.locator("html").getAttribute("data-theme")) === previousTheme, "theme toggle did not restore state");

    const firstShot = page.getByRole("tab", { name: /SHOT 01/ });
    await firstShot.click();
    await firstShot.focus();
    await page.keyboard.press("ArrowRight");
    assert((await page.locator(".shot-button[aria-selected='true']").textContent()).includes("SHOT 02"), "shot keyboard navigation failed");
    const focusStyle = await page.locator(".shot-button[aria-selected='true']").evaluate((node) => {
      const style = getComputedStyle(node);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    assert(focusStyle.outlineStyle !== "none" && focusStyle.outlineWidth !== "0px", "focused control lacks visible outline");

    const metaphorTab = page.getByRole("tab", { name: "视觉隐喻" });
    await metaphorTab.focus();
    await page.keyboard.press("ArrowRight");
    assert((await page.locator(".output-tabs [aria-selected='true']").textContent()) === "静帧 Prompt", "output keyboard navigation failed");
  }

  if (config.pageScreenshot) {
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      scrollTo(0, 0);
    });
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(evidenceDir, `${config.name}.png`) });
  } else if (config.viewportScreenshotSelector) {
    await page.locator(config.viewportScreenshotSelector).evaluate((node) => {
      document.documentElement.style.scrollBehavior = "auto";
      const top = node.getBoundingClientRect().top + scrollY - 92;
      scrollTo(0, Math.max(0, top));
    });
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(evidenceDir, `${config.name}.png`) });
  } else if (config.screenshotSelector) {
    await page.locator(config.screenshotSelector).scrollIntoViewIfNeeded();
    await page.locator(config.screenshotSelector).screenshot({
      path: path.join(evidenceDir, `${config.name}.png`),
    });
  }
  await context.close();
  return {
    name: config.name,
    viewport: config.viewport,
    colorScheme: config.colorScheme,
    reducedMotion: config.reducedMotion || "no-preference",
    theme: basic.theme,
    horizontalOverflow: basic.scrollWidth > basic.viewportWidth + 1,
    imagesLoaded: basic.images.length,
    consoleErrors,
    pageErrors,
    failedRequests,
    interactionJourney: config.interactions ? "pass" : "not repeated",
    screenshot: config.screenshotSelector || config.viewportScreenshotSelector || config.pageScreenshot ? `browser/${config.name}.png` : null,
  };
}

async function inspectErrorState(browser) {
  const context = await browser.newContext({ viewport: { width: 900, height: 800 } });
  await context.route("**/assets/demo-case.json", (route) => route.abort("failed"));
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const sourceText = await page.locator("#source-script").textContent();
  const copyDisabled = await page.locator("#copy-button").isDisabled();
  assert(sourceText.includes("演示数据读取失败"), "error state message missing");
  assert(copyDisabled, "copy action should be disabled when demo data fails");
  await context.close();
  return { name: "data-error-fallback", status: "pass", recovery: "serve the project through the documented HTTP command" };
}

async function inspectMediaFallback(browser) {
  const context = await browser.newContext({ viewport: { width: 900, height: 800 } });
  await context.route("**/assets/news-case-final.mp4", (route) => route.abort("failed"));
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const download = page.locator("#final-film a[download][href$='news-case-final.mp4']");
  const boundary = page.locator("#final-film .film-boundary");
  assert(await download.isVisible(), "media fallback lost the direct MP4 download");
  assert((await boundary.textContent()).includes("代码完成"), "media method boundary is missing");
  await context.close();
  return { name: "media-error-fallback", status: "pass", recovery: "direct MP4/SRT links and method boundary remain available" };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const configs = [
    {
      name: "desktop-light-demo",
      viewport: { width: 1440, height: 1000 },
      colorScheme: "light",
      interactions: true,
      viewportScreenshotSelector: "#demo-title",
    },
    {
      name: "desktop-dark-evidence",
      viewport: { width: 1440, height: 1000 },
      colorScheme: "dark",
      viewportScreenshotSelector: "#evidence-title",
    },
    {
      name: "desktop-light-final-film",
      viewport: { width: 1440, height: 1000 },
      colorScheme: "light",
      viewportScreenshotSelector: "#final-film",
    },
    {
      name: "desktop-light-news-proof",
      viewport: { width: 1440, height: 1000 },
      colorScheme: "light",
      viewportScreenshotSelector: "#news-proof",
    },
    {
      name: "tablet-light-architecture",
      viewport: { width: 768, height: 1024 },
      colorScheme: "light",
      screenshotSelector: "#architecture",
    },
    {
      name: "mobile-dark-hero",
      viewport: { width: 390, height: 844 },
      colorScheme: "dark",
      reducedMotion: "reduce",
      pageScreenshot: true,
    },
  ];
  const results = [];
  try {
    for (const config of configs) results.push(await inspectPage(browser, config));
    results.push(await inspectErrorState(browser));
    results.push(await inspectMediaFallback(browser));
  } finally {
    await browser.close();
  }

  const report = {
    generatedAt: new Date().toISOString(),
    canonicalUrl: baseUrl,
    playwrightVersion: require("playwright/package.json").version,
    checks: results,
    summary: { pass: results.length, fail: 0 },
  };
  fs.writeFileSync(
    path.join(project, "notes", "evidence", "browser-validation.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8"
  );
  console.log(JSON.stringify(report.summary));
})().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
