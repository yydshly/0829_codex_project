"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const project = path.resolve(__dirname, "..");
const evidenceDir = path.join(project, "notes", "evidence", "browser");
const resultPath = path.join(project, "notes", "evidence", "browser-validation.json");
const baseUrl = process.env.DEMO_URL || "http://127.0.0.1:8765/projects/vox-director-study/demo/";

fs.mkdirSync(evidenceDir, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function inspect(browser, config) {
  const context = await browser.newContext({
    viewport: config.viewport,
    colorScheme: config.colorScheme,
    reducedMotion: config.reducedMotion || "no-preference",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  page.on("requestfailed", (request) => failedRequests.push(`${request.url()}: ${request.failure()?.errorText || "failed"}`));

  await page.goto(config.url || baseUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.waitForFunction(() => document.querySelectorAll("#prep-sample option").length >= 5);
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));

  const basic = await page.evaluate(() => ({
    title: document.title,
    bodyText: document.body.innerText,
    theme: document.documentElement.dataset.theme,
    ready: document.documentElement.dataset.ready,
    viewportWidth: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    modeTabs: document.querySelectorAll("#mode-tabs [role='tab']").length,
    prepTabs: document.querySelectorAll("#prep .prep-tabs [role='tab']").length,
    prepSamples: document.querySelectorAll("#prep-sample option").length,
    prepBeats: document.querySelectorAll("#prep-editor .beat-editor").length,
    prepShots: document.querySelectorAll("#prep-editor .shot-editor").length,
    prepKeyframes: document.querySelectorAll("#prep-editor .generated-keyframe img").length,
    prepDispatchCards: document.querySelectorAll("#prep-editor .dispatch-card").length,
    prepShotCopyButtons: document.querySelectorAll("#prep-editor [data-copy-shot]").length,
    prepCopyAllButtons: document.querySelectorAll("#prep-panel-shots [data-copy-all-shots]").length,
    samples: document.querySelectorAll(".sample-button").length,
    risks: document.querySelectorAll("#risk-list li").length,
    roadmap: document.querySelectorAll("#roadmap-list li").length,
    meaning: document.querySelectorAll("#meaning-points li").length,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    images: [...document.images].map((image) => ({
      src: image.currentSrc || image.src,
      complete: image.complete,
      naturalWidth: image.naturalWidth,
    })),
    overlay: Boolean(document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay")),
  }));

  assert(basic.title.includes("Vox Director"), `${config.name}: wrong title`);
  assert(basic.ready === "true", `${config.name}: data did not reach ready state`);
  assert(basic.bodyText.includes("从一个主题"), `${config.name}: hero missing`);
  assert(basic.bodyText.includes("一个交付说明书"), `${config.name}: comparison missing`);
  assert(basic.bodyText.includes("不调用它的模型"), `${config.name}: preproduction workspace missing`);
  assert(basic.bodyText.includes("先补可信度"), `${config.name}: roadmap missing`);
  assert(basic.bodyText.includes("Research Lab"), `${config.name}: meaning missing`);
  assert(basic.modeTabs === 3, `${config.name}: expected three mode tabs`);
  assert(basic.prepTabs === 3, `${config.name}: expected three preproduction tabs`);
  assert(basic.prepSamples === 5, `${config.name}: expected four upstream structures plus one demonstration`);
  if (config.dunhuang) {
    assert(basic.prepBeats === 3 && basic.prepShots === 6, `${config.name}: Dunhuang 3-beat / 6-shot plan missing`);
    assert(basic.prepKeyframes === 6, `${config.name}: six generated Dunhuang keyframes missing`);
    assert(basic.prepDispatchCards === 6 && basic.prepShotCopyButtons === 6, `${config.name}: six direct-copy video task cards missing`);
    assert(basic.prepCopyAllButtons === 1, `${config.name}: copy-all video tasks control missing`);
  } else {
    assert(basic.prepBeats === 3 && basic.prepShots === 3, `${config.name}: default 15s structure missing`);
    assert(basic.prepKeyframes === 0, `${config.name}: local demonstration keyframes leaked into default sample`);
    assert(basic.prepDispatchCards === 0 && basic.prepShotCopyButtons === 0, `${config.name}: demonstration dispatch cards leaked into default sample`);
  }
  assert(basic.samples === 5, `${config.name}: expected five sample controls`);
  assert(basic.risks === 7, `${config.name}: expected seven risk records`);
  assert(basic.roadmap === 8, `${config.name}: expected eight roadmap items`);
  assert(basic.meaning === 4, `${config.name}: expected four meaning points`);
  assert(basic.scrollWidth <= basic.viewportWidth + 1, `${config.name}: horizontal overflow ${basic.scrollWidth}/${basic.viewportWidth}`);
  assert(basic.images.every((image) => image.complete && image.naturalWidth > 0), `${config.name}: local image failed`);
  assert(!basic.overlay, `${config.name}: error overlay present`);
  assert(consoleErrors.length === 0, `${config.name}: console errors ${consoleErrors.join(" | ")}`);
  assert(pageErrors.length === 0, `${config.name}: page errors ${pageErrors.join(" | ")}`);
  assert(failedRequests.length === 0, `${config.name}: failed requests ${failedRequests.join(" | ")}`);
  assert(basic.theme === config.colorScheme, `${config.name}: expected ${config.colorScheme} theme, got ${basic.theme}`);
  if (config.reducedMotion === "reduce") assert(basic.reducedMotion, `${config.name}: reduced motion not active`);

  const interaction = {};
  if (config.dunhuang) {
    interaction.dunhuangSample = await page.locator("#prep-sample").inputValue();
    interaction.dunhuangTopic = await page.locator("#prep-topic").inputValue();
    interaction.dunhuangRoute = await page.locator("#prep-route").inputValue();
    interaction.dunhuangDuration = await page.locator("#prep-duration").inputValue();
    interaction.dunhuangWarning = await page.locator("#adaptation-warning").textContent();
    interaction.dunhuangNarration = await page.locator(".narration-editor textarea").first().inputValue();
    interaction.dunhuangPromptSources = await page.locator(".prompt-origin").count();
    interaction.dunhuangAssetStatus = await page.locator("#asset-checklist").textContent();
    assert(interaction.dunhuangSample === "dunhuang-30s", "Dunhuang demonstration: URL did not select the preset");
    assert(interaction.dunhuangTopic.includes("沙漠中的世界十字路口"), "Dunhuang demonstration: topic missing");
    assert(interaction.dunhuangRoute === "image-to-video" && interaction.dunhuangDuration === "30", "Dunhuang demonstration: route or duration wrong");
    assert(interaction.dunhuangWarning.includes("研究示范已载入"), "Dunhuang demonstration: provenance label missing");
    assert(interaction.dunhuangNarration.includes("河西走廊"), "Dunhuang demonstration: Chinese narration missing");
    assert(interaction.dunhuangPromptSources === 6, "Dunhuang demonstration: prompt provenance missing");
    assert(interaction.dunhuangAssetStatus.includes("6/6 张本地关键帧已生成"), "Dunhuang demonstration: generated keyframe readiness missing");
    const firstShotCopy = page.locator("[data-copy-shot='B01-S01']");
    await firstShotCopy.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector("#prep-status")?.textContent.includes("B01-S01 完整视频提示词已复制"));
    interaction.firstShotCopyStatus = await page.locator("#prep-status").textContent();
    const firstShotClipboard = await page.evaluate(() => navigator.clipboard.readText());
    interaction.firstShotClipboardLength = firstShotClipboard.length;
    assert(firstShotClipboard.includes("【B01-S01｜图生视频任务】"), "Dunhuang demonstration: copied shot ID missing");
    assert(firstShotClipboard.includes("完整视频提示词：") && firstShotClipboard.includes("负向提示词："), "Dunhuang demonstration: copied task is still fragmented");
    assert(firstShotClipboard.includes("B01-S01.png") && firstShotClipboard.includes("9:16｜5 秒") && firstShotClipboard.includes("敦煌圆点"), "Dunhuang demonstration: copied image name, parameters, or scene missing");
    assert(!firstShotClipboard.includes("B01-S02"), "Dunhuang demonstration: single-shot copy included another shot");
    await page.locator("[data-copy-all-shots]").click();
    await page.waitForFunction(() => document.querySelector("#prep-status")?.textContent.includes("全部 6 个视频任务已复制"));
    interaction.copyAllStatus = await page.locator("#prep-status").textContent();
    const allShotsClipboard = await page.evaluate(() => navigator.clipboard.readText());
    interaction.allShotsClipboardLength = allShotsClipboard.length;
    const copiedShotIds = [...allShotsClipboard.matchAll(/【(B\d{2}-S\d{2})｜图生视频任务】/g)].map((match) => match[1]);
    interaction.copiedShotIds = copiedShotIds;
    assert(copiedShotIds.join(",") === "B01-S01,B01-S02,B02-S01,B02-S02,B03-S01,B03-S02", "Dunhuang demonstration: copy-all order or coverage wrong");
    assert((allShotsClipboard.match(/负向提示词：/g) || []).length === 6, "Dunhuang demonstration: copy-all negative prompts incomplete");
    await page.locator("#prep-tab-json").click();
    const demoJson = await page.locator("#prep-json").textContent();
    const demoPack = JSON.parse(demoJson);
    const demoShots = demoPack.beats.flatMap((beat) => beat.shots);
    interaction.dunhuangJsonReady = demoJson.includes('"content_status": "research-demonstration-ready"');
    interaction.dunhuangReferenceImages = demoShots.map((shot) => shot.reference_image);
    interaction.dunhuangMissingRequired = demoShots.flatMap((shot) => shot.model_task.missing_required);
    assert(interaction.dunhuangJsonReady, "Dunhuang demonstration: handoff provenance missing from JSON");
    assert(demoJson.includes("敦煌：沙漠中的世界十字路口"), "Dunhuang demonstration: topic missing from JSON");
    assert(demoPack.source.keyframe_generator === "Codex built-in imagegen", "Dunhuang demonstration: keyframe generator missing from JSON");
    assert(interaction.dunhuangReferenceImages.length === 6 && interaction.dunhuangReferenceImages.every((value) => value.startsWith("assets/dunhuang/")), "Dunhuang demonstration: local keyframe paths missing from JSON");
    assert(interaction.dunhuangMissingRequired.length === 0, "Dunhuang demonstration: image-to-video dispatch still has missing inputs");
    await page.locator("#prep-tab-shots").click();
  }
  if (config.interactions) {
    const bTab = page.locator("#mode-tab-broll");
    const aTab = page.locator("#mode-tab-aroll");
    await bTab.focus();
    await page.keyboard.press("ArrowRight");
    interaction.keyboardMode = await aTab.getAttribute("aria-selected");
    interaction.focusedMode = await page.evaluate(() => document.activeElement?.id || "");
    interaction.aRollTitle = await page.locator("#mode-name").textContent();
    interaction.aRollStages = await page.locator(".stage-button").count();
    assert(interaction.keyboardMode === "true", "desktop interactions: arrow key did not select A-roll");
    assert(interaction.focusedMode === "mode-tab-aroll", "desktop interactions: focus did not follow selected tab");
    assert(interaction.aRollTitle.includes("真人口播"), "desktop interactions: A-roll content missing");
    assert(interaction.aRollStages === 4, "desktop interactions: A-roll stage count wrong");

    await page.locator("#mode-tab-croll").click();
    await page.locator(".stage-button").nth(1).click();
    interaction.cRollTitle = await page.locator("#mode-name").textContent();
    interaction.stageTitle = await page.locator("#stage-label").textContent();
    assert(interaction.cRollTitle.includes("单图锚定"), "desktop interactions: C-roll content missing");
    assert(interaction.stageTitle === "图片编辑", "desktop interactions: stage detail did not update");

    await page.locator(".sample-button").nth(1).click();
    interaction.moneyVideo = await page.locator("#sample-video").getAttribute("src");
    interaction.moneySample = await page.locator("#sample-title").textContent();
    assert(interaction.moneySample.includes("货币"), "desktop interactions: money sample did not update");
    assert(interaction.moneyVideo.endsWith("assets/showcase-money.mp4"), "desktop interactions: fixed money video URL missing");

    await page.locator(".sample-button").nth(4).click();
    interaction.posterOnlyVisible = await page.locator("#poster-only").isVisible();
    interaction.videoHidden = await page.locator("#sample-video").isHidden();
    interaction.disabledAssetLink = await page.locator("#sample-link").getAttribute("aria-disabled");
    assert(interaction.posterOnlyVisible && interaction.videoHidden, "desktop interactions: poster-only fallback failed");
    assert(interaction.disabledAssetLink === "true", "desktop interactions: missing video link not disabled");

    const priorTheme = await page.locator("html").getAttribute("data-theme");
    await page.locator("#theme-button").click();
    interaction.themeAfterToggle = await page.locator("html").getAttribute("data-theme");
    assert(interaction.themeAfterToggle !== priorTheme, "desktop interactions: theme did not toggle");
    await page.locator("#theme-button").click();
    assert(await page.locator("html").getAttribute("data-theme") === priorTheme, "desktop interactions: reverse theme transition failed");

    await page.locator("#prep-sample").selectOption("tang-30s");
    interaction.prepSample = await page.locator("#prep-pack-title").textContent();
    interaction.prepBeats = await page.locator("#prep-editor .beat-editor").count();
    interaction.prepShots = await page.locator("#prep-editor .shot-editor").count();
    assert(interaction.prepSample.includes("30 秒"), "preproduction: Tang structure did not load");
    assert(interaction.prepBeats === 3 && interaction.prepShots === 6, "preproduction: normalized Tang counts wrong");

    await page.locator("#prep-topic").fill("用 15 秒解释可控视频前期");
    await page.locator("#prep-route").selectOption("first-last-frame");
    await page.locator("#prep-duration").fill("15");
    await page.locator("#prep-form button[type='submit']").click();
    interaction.prepDuration = await page.locator("#prep-badges").textContent();
    interaction.adaptationWarning = await page.locator("#adaptation-warning").textContent();
    assert(interaction.prepDuration.includes("15s"), "preproduction: duration scaling failed");
    assert(interaction.adaptationWarning.includes("requires-manual-rewrite"), "preproduction: changed topic was not marked for rewrite");

    const firstScene = page.locator("#prep-editor .shot-editor textarea").first();
    await firstScene.fill("一张清晰的前期导演台，镜头卡片依次排开");
    await page.locator("#prep-tab-shots").focus();
    await page.keyboard.press("ArrowRight");
    interaction.prepFocusedTab = await page.evaluate(() => document.activeElement?.id || "");
    interaction.assetPanelVisible = await page.locator("#prep-panel-assets").isVisible();
    interaction.endFrameAsset = await page.locator("#asset-checklist").textContent();
    assert(interaction.prepFocusedTab === "prep-tab-assets" && interaction.assetPanelVisible, "preproduction: tab keyboard path failed");
    assert(interaction.endFrameAsset.includes("尾帧"), "preproduction: route-specific asset checklist missing");

    await page.locator("#prep-tab-json").click();
    const prepJson = await page.locator("#prep-json").textContent();
    assert(prepJson.includes('"route": "first-last-frame"'), "preproduction: route missing from JSON");
    assert(prepJson.includes("一张清晰的前期导演台"), "preproduction: editor change missing from JSON");
    assert(prepJson.includes('"end_frame"'), "preproduction: missing-input contract absent");
    await page.locator("#prep-copy").click();
    await page.waitForFunction(() => document.querySelector("#prep-status")?.textContent.includes("复制"));
    interaction.copyStatus = await page.locator("#prep-status").textContent();
    assert(interaction.copyStatus.includes("已复制"), "preproduction: copy feedback missing");
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#prep-download").click();
    const download = await downloadPromise;
    interaction.downloadName = download.suggestedFilename();
    assert(interaction.downloadName.endsWith("-preproduction-pack.json"), "preproduction: JSON download filename wrong");
  }

  await page.locator(config.captureSelector).evaluate((element) => {
    const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 80;
    window.scrollTo({ top: Math.max(0, element.offsetTop - margin), behavior: "instant" });
  });
  await page.screenshot({ path: path.join(evidenceDir, `${config.name}.png`), fullPage: false });
  await context.close();
  return { ...basic, interaction, consoleErrors, pageErrors, failedRequests };
}

async function inspectErrorState(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "light" });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  await page.goto(`${baseUrl}?data-error=1`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "error");
  const result = await page.evaluate(() => ({
    state: document.documentElement.dataset.ready,
    visible: !document.querySelector("#error-panel").hidden,
    message: document.querySelector("#error-panel").innerText,
    bodyTextLength: document.body.innerText.length,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
  }));
  assert(result.state === "error", "error state: ready marker wrong");
  assert(result.visible, "error state: fallback panel hidden");
  assert(result.message.includes("研究数据没有加载成功"), "error state: recovery message missing");
  assert(result.bodyTextLength > 900, "error state: static explanation disappeared");
  assert(result.scrollWidth <= result.innerWidth + 1, "error state: horizontal overflow");
  assert(pageErrors.length === 0, `error state: page errors ${pageErrors.join(" | ")}`);
  await page.locator("#error-panel").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(evidenceDir, "mobile-error-state.png"), fullPage: false });
  await context.close();
  return { ...result, pageErrors };
}

async function inspectPrepErrorState(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  await page.goto(`${baseUrl}?prep-error=1`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  const result = await page.evaluate(() => ({
    state: document.documentElement.dataset.ready,
    visible: !document.querySelector("#prep-error").hidden,
    message: document.querySelector("#prep-error").innerText,
    researchAvailable: document.querySelectorAll(".sample-button").length === 5,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
    theme: document.documentElement.dataset.theme,
  }));
  assert(result.visible, "prep error state: fallback panel hidden");
  assert(result.message.includes("前期样例数据未加载"), "prep error state: recovery message missing");
  assert(result.researchAvailable, "prep error state: research content regressed");
  assert(result.scrollWidth <= result.innerWidth + 1, "prep error state: horizontal overflow");
  assert(pageErrors.length === 0, `prep error state: page errors ${pageErrors.join(" | ")}`);
  await page.locator("#prep-error").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(evidenceDir, "mobile-prep-error-state.png"), fullPage: false });
  await context.close();
  return { ...result, pageErrors };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const matrix = [
    { name: "desktop-light-overview", viewport: { width: 1440, height: 1000 }, colorScheme: "light", captureSelector: "#overview" },
    { name: "desktop-light-preproduction", viewport: { width: 1440, height: 1000 }, colorScheme: "light", captureSelector: "#prep", interactions: true },
    { name: "desktop-dunhuang-demonstration", viewport: { width: 1440, height: 1000 }, colorScheme: "light", captureSelector: ".generated-keyframe img[alt*='B01-S01']", url: `${baseUrl}?demo=dunhuang#prep`, dunhuang: true },
    { name: "desktop-dark-samples", viewport: { width: 1440, height: 1000 }, colorScheme: "dark", captureSelector: "#samples" },
    { name: "tablet-light-modes", viewport: { width: 768, height: 900 }, colorScheme: "light", captureSelector: "#modes" },
    { name: "mobile-dark-preproduction", viewport: { width: 390, height: 844 }, colorScheme: "dark", reducedMotion: "reduce", captureSelector: "#prep", url: `${baseUrl}?demo=dunhuang#prep`, dunhuang: true },
  ];
  const results = {};
  for (const config of matrix) results[config.name] = await inspect(browser, config);
  results["mobile-error-state"] = await inspectErrorState(browser);
  results["mobile-prep-error-state"] = await inspectPrepErrorState(browser);
  await browser.close();

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    playwrightVersion: require("playwright/package.json").version,
    matrix: Object.fromEntries(Object.entries(results).map(([name, value]) => [name, {
      viewport: [value.viewportWidth || value.innerWidth, name.startsWith("mobile") ? 844 : name.startsWith("tablet") ? 900 : 1000],
      theme: value.theme || "light",
      reducedMotion: value.reducedMotion || false,
      horizontalOverflow: (value.scrollWidth || 0) > (value.viewportWidth || value.innerWidth || 0) + 1,
      consoleErrors: value.consoleErrors || [],
      pageErrors: value.pageErrors || [],
      failedRequests: value.failedRequests || [],
      interaction: value.interaction || {},
      status: "pass",
    }])),
    summary: {
      surfaces: Object.keys(results).length,
      failures: 0,
      screenshots: fs.readdirSync(evidenceDir).filter((name) => name.endsWith(".png") && !name.includes("baseline")).sort(),
    },
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`evidence: ${path.relative(project, resultPath)}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
