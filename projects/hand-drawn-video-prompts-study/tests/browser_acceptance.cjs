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

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator("#shot-title").waitFor({ state: "visible" });
  await page.locator("#i2v-experiment").scrollIntoViewIfNeeded();
  await page.locator("#i2v-shot-board .i2v-shot-card").first().waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const image = document.querySelector("#i2v-experiment .i2v-input-frame img");
    return image && image.complete && image.naturalWidth > 0;
  });
  await page.locator(".sample-strip").scrollIntoViewIfNeeded();
  if (config.verifyAllImages) {
    await page.evaluate(() => [...document.images].forEach((image) => { image.loading = "eager"; }));
    await page.waitForFunction(
      () => [...document.images].every((image) => image.complete && image.naturalWidth > 0),
      null,
      { timeout: 60_000 }
    );
  }
  if (config.verifyMedia) {
    await page.evaluate(() => {
      document.querySelector("#final-film .case-film-player video")?.load();
      document.querySelector("#i2v-experiment video")?.load();
      document.querySelector("#i2v-production-board .i2v-final-player video")?.load();
    });
    await page.waitForFunction(() => {
      const videos = [
        document.querySelector("#final-film .case-film-player video"),
        document.querySelector("#i2v-experiment video"),
        document.querySelector("#i2v-production-board .i2v-final-player video"),
      ];
      return videos.every((video) => video && video.readyState >= 1 && Number.isFinite(video.duration));
    }, null, { timeout: 60_000 });
  }

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
    summaryPipelineSteps: document.querySelectorAll("#project-summary .project-pipeline li").length,
    summaryVerdicts: document.querySelectorAll("#project-summary .project-verdict-grid article").length,
    i2vVideos: document.querySelectorAll("#i2v-experiment .i2v-output-player video").length,
    i2vPromptDownloads: document.querySelectorAll("#i2v-experiment a[download][href$='i2v-agent-workflow-prompt.txt']").length,
    i2vStoryShots: document.querySelectorAll("#i2v-shot-board .i2v-shot-card").length,
    i2vReadyShots: document.querySelectorAll("#i2v-shot-board .i2v-shot-card.is-ready").length,
    i2vPendingShots: document.querySelectorAll("#i2v-shot-board .i2v-shot-card.is-pending").length,
    i2vPairedFrames: document.querySelectorAll("#i2v-shot-board .i2v-paired-frame img").length,
    i2vFirstLabels: [...document.querySelectorAll("#i2v-shot-board .i2v-frame-label")].filter((node) => node.textContent === "FIRST").length,
    i2vLastLabels: [...document.querySelectorAll("#i2v-shot-board .i2v-frame-label")].filter((node) => node.textContent === "LAST").length,
    i2vHistoryLinks: document.querySelectorAll("#i2v-shot-board .i2v-history-link").length,
    i2vPairedVideos: document.querySelectorAll("#i2v-shot-board .i2v-shot-clip video").length,
    i2vClipDownloads: document.querySelectorAll("#i2v-shot-board .i2v-clip-download[download]").length,
    i2vProductionFinalVideos: document.querySelectorAll("#i2v-production-board .i2v-final-player video").length,
    i2vStoryDownloads: document.querySelectorAll("#i2v-production-board .i2v-board-actions a[download]").length,
    i2vFrameDownloads: document.querySelectorAll("#i2v-shot-board .i2v-frame-download[download]").length,
    finalVideo: (() => {
      const video = document.querySelector("#final-film .case-film-player video");
      return video
        ? { duration: video.duration, width: video.videoWidth, height: video.videoHeight, readyState: video.readyState }
        : null;
    })(),
    i2vVideo: (() => {
      const video = document.querySelector("#i2v-experiment video");
      return video
        ? { duration: video.duration, width: video.videoWidth, height: video.videoHeight, readyState: video.readyState }
        : null;
    })(),
    i2vProductionFinalVideo: (() => {
      const video = document.querySelector("#i2v-production-board .i2v-final-player video");
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

  assert(basic.title.includes("从 Prompt Skill 到 30 秒成片"), `${config.name}: wrong document title`);
  assert(basic.bodyText.includes("从一段文案"), `${config.name}: hero content missing`);
  assert(basic.bodyText.includes("8月28日，中国首次"), `${config.name}: demo data missing`);
  assert(basic.bodyText.includes("我们的案例已经接入"), `${config.name}: integrated case section missing`);
  assert(basic.bodyText.includes("不是一条路线"), `${config.name}: production-route diagnosis missing`);
  assert(basic.bodyText.includes("最终效果不是“一个 Skill 自动生成视频”"), `${config.name}: current conclusion missing`);
  assert(basic.bodyText.includes("真正用到视频模型"), `${config.name}: real image-to-video experiment missing`);
  assert(basic.bodyText.includes("6.08 秒 / 单镜头"), `${config.name}: image-to-video duration boundary missing`);
  assert(basic.bodyText.includes("对你的价值：把“追热点”变成可复用流程"), `${config.name}: value section missing`);
  assert(basic.bodyText.includes("灾难、战争与未核实爆料"), `${config.name}: scenario boundary missing`);
  assert(basic.shotButtons === 7, `${config.name}: expected 7 shot controls`);
  assert(basic.outputTabs === 4, `${config.name}: expected 4 output tabs`);
  assert(basic.sourceLinks === 2, `${config.name}: expected 2 authoritative source links`);
  assert(basic.generatedFrames === 1, `${config.name}: generated news keyframe proof missing`);
  assert(basic.comparisonVideos === 2, `${config.name}: expected case and upstream comparison videos`);
  assert(basic.qualityCards === 4, `${config.name}: quality gap diagnosis is incomplete`);
  assert(basic.summaryPipelineSteps === 4 && basic.summaryVerdicts === 4, `${config.name}: current project summary is incomplete`);
  assert(basic.i2vVideos === 1, `${config.name}: expected one real image-to-video experiment`);
  assert(basic.i2vPromptDownloads === 1, `${config.name}: image-to-video prompt download missing`);
  assert(basic.i2vStoryShots === 5, `${config.name}: expected five-shot production board`);
  assert(basic.i2vReadyShots === 5 && basic.i2vPendingShots === 0, `${config.name}: paired-frame production status must be 5 ready / 0 pending`);
  assert(basic.i2vPairedFrames === 10 && basic.i2vFirstLabels === 5 && basic.i2vLastLabels === 5, `${config.name}: all five FIRST/LAST pairs must be visible`);
  assert(basic.i2vHistoryLinks === 1, `${config.name}: historical single-image video boundary is missing`);
  assert(basic.i2vPairedVideos === 5 && basic.i2vClipDownloads === 5, `${config.name}: five paired-frame shot videos are not traceable`);
  assert(basic.i2vProductionFinalVideos === 1, `${config.name}: 30-second paired-frame final player is missing`);
  assert(basic.i2vStoryDownloads === 5, `${config.name}: production pack downloads are incomplete`);
  assert(basic.i2vFrameDownloads === 10, `${config.name}: FIRST/LAST direct downloads are incomplete`);
  assert(basic.bodyText.includes("5 条新首尾帧视频和 30 秒完整成片均已完成"), `${config.name}: paired-frame final-film completion boundary missing`);
  assert(basic.bodyText.includes("MiniMax 温润男声"), `${config.name}: selected MiniMax Gentleman voice label missing`);
  assert(basic.deterministicTitle === "从任务到行动", `${config.name}: current hero title overlay missing`);
  assert(basic.scrollWidth <= basic.viewportWidth + 1, `${config.name}: horizontal page overflow`);
  assert(basic.images.every((image) => !image.complete || image.naturalWidth > 0), `${config.name}: image failed to load`);
  if (config.verifyAllImages) {
    assert(basic.images.every((image) => image.complete && image.naturalWidth > 0), `${config.name}: exhaustive image load check failed`);
  }
  assert(basic.videoSources.some((source) => source.endsWith("assets/news-case-final.mp4")), `${config.name}: final video source missing`);
  assert(basic.videoSources.some((source) => source.endsWith("assets/demo-722.mp4")), `${config.name}: upstream evidence video missing`);
  assert(basic.videoSources.some((source) => source.endsWith("assets/i2v-agent-workflow.mp4")), `${config.name}: real image-to-video source missing`);
  assert(basic.videoSources.some((source) => source.endsWith("assets/i2v-agent-workflow-30s-final.mp4")), `${config.name}: paired-frame final source missing`);
  if (config.verifyMedia) {
    assert(basic.finalVideo && basic.finalVideo.width === 1080 && basic.finalVideo.height === 1920, `${config.name}: final video dimensions are wrong`);
    assert(Math.abs(basic.finalVideo.duration - 41.02) < 0.2, `${config.name}: final video duration is wrong`);
    assert(basic.i2vVideo && basic.i2vVideo.width === 496 && basic.i2vVideo.height === 864, `${config.name}: image-to-video dimensions are wrong`);
    assert(Math.abs(basic.i2vVideo.duration - 6.08) < 0.2, `${config.name}: image-to-video duration is wrong`);
    assert(basic.i2vProductionFinalVideo && basic.i2vProductionFinalVideo.width === 1080 && basic.i2vProductionFinalVideo.height === 1920, `${config.name}: paired-frame final dimensions are wrong`);
    assert(Math.abs(basic.i2vProductionFinalVideo.duration - 30) < 0.1, `${config.name}: paired-frame final duration is wrong`);
  }
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

    const promptDetails = page.locator("#i2v-experiment .i2v-prompt-details");
    const promptSummary = promptDetails.locator("summary");
    await promptSummary.focus();
    await page.keyboard.press("Enter");
    assert(await promptDetails.getAttribute("open") !== null, "image-to-video prompt disclosure did not open from keyboard");
    assert(await promptDetails.locator("pre").isVisible(), "image-to-video prompt content is not visible");

    const pairedPrompt = page.locator("#i2v-shot-board .i2v-shot-card.is-ready details:not(.i2v-shot-clip)").first();
    await pairedPrompt.locator("summary").click();
    assert((await pairedPrompt.locator("pre").textContent()).includes("locked flat frontal camera"), "production-board prompt is missing camera lock");

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
  await context.route("**/assets/i2v-agent-workflow.mp4", (route) => route.abort("failed"));
  await context.route("**/assets/i2v-agent-workflow-30s-final.mp4", (route) => route.abort("failed"));
  await context.route("**/assets/i2v-agent-workflow-shot-*.mp4", (route) => route.abort("failed"));
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const download = page.locator("#final-film a[download][href$='news-case-final.mp4']");
  const i2vDownload = page.locator("#i2v-experiment a[download][href$='i2v-agent-workflow.mp4']");
  const promptDownload = page.locator("#i2v-experiment a[download][href$='i2v-agent-workflow-prompt.txt']");
  const storyPromptDownload = page.locator("#i2v-production-board a[download][href$='i2v-agent-workflow-30s-prompts.txt']");
  const storyVoiceoverDownload = page.locator("#i2v-production-board a[download][href$='i2v-agent-workflow-voiceover.m4a']");
  const storyFinalDownload = page.locator("#i2v-production-board a[download][href$='i2v-agent-workflow-30s-final.mp4']");
  const storyClipDownloads = page.locator("#i2v-production-board .i2v-clip-download[download]");
  const inputFrame = page.locator("#i2v-experiment .i2v-input-frame img");
  const boundary = page.locator("#final-film .film-boundary");
  assert(await download.isVisible(), "media fallback lost the direct MP4 download");
  assert(await i2vDownload.isVisible(), "image-to-video fallback lost the direct MP4 download");
  assert(await promptDownload.isVisible(), "image-to-video fallback lost the prompt download");
  assert(await storyPromptDownload.isVisible(), "media fallback lost the five-shot prompt pack");
  assert(await storyVoiceoverDownload.isVisible(), "media fallback lost the MiniMax voiceover");
  assert(await storyFinalDownload.isVisible(), "media fallback lost the 30-second final MP4 download");
  assert((await storyClipDownloads.count()) === 5, "media fallback lost the five paired-shot downloads");
  assert(await inputFrame.isVisible(), "image-to-video fallback lost the input frame");
  assert((await boundary.textContent()).includes("代码完成"), "media method boundary is missing");
  await context.close();
  return { name: "media-error-fallback", status: "pass", recovery: "direct MP4/SRT/prompt links, input frame and method boundary remain available" };
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
      verifyMedia: true,
      verifyAllImages: true,
      viewportScreenshotSelector: "#final-film",
    },
    {
      name: "desktop-light-i2v",
      viewport: { width: 1440, height: 1000 },
      colorScheme: "light",
      viewportScreenshotSelector: "#i2v-experiment",
    },
    {
      name: "desktop-light-i2v-board",
      viewport: { width: 1440, height: 1000 },
      colorScheme: "light",
      viewportScreenshotSelector: "#i2v-production-board",
    },
    {
      name: "desktop-light-project-summary",
      viewport: { width: 1440, height: 1000 },
      colorScheme: "light",
      viewportScreenshotSelector: "#project-summary",
    },
    {
      name: "mobile-dark-i2v-board",
      viewport: { width: 390, height: 844 },
      colorScheme: "dark",
      viewportScreenshotSelector: "#i2v-production-board",
    },
    {
      name: "mobile-dark-project-summary",
      viewport: { width: 390, height: 844 },
      colorScheme: "dark",
      viewportScreenshotSelector: "#project-summary",
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
