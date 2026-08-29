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
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText || "failed";
    if (request.resourceType() === "media" && errorText === "net::ERR_ABORTED") return;
    failedRequests.push(`${request.url()}: ${errorText}`);
  });

  await page.goto(config.url || baseUrl, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.waitForFunction(() => document.querySelectorAll("#prep-sample option").length >= 5);
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));
  if (config.dunhuang) {
    await page.waitForFunction(() => {
      const videos = [...document.querySelectorAll(".generated-video video")];
      return videos.length === 6 && videos.every((video) => video.readyState >= 1);
    });
  }
  if (config.caseHash) {
    await page.waitForFunction(() => location.hash === "#case-study" && !document.querySelector("#case-study")?.hidden && document.querySelector("#case-study").getBoundingClientRect().top >= 70 && document.querySelector("#case-study").getBoundingClientRect().top < 220);
  }

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
    prepVideos: document.querySelectorAll("#prep-editor .generated-video video").length,
    videoReviewStatuses: document.querySelectorAll("#prep-editor .video-review-status").length,
    roughCutVideos: document.querySelectorAll("#rough-cut-preview video").length,
    soundPreviewVideos: document.querySelectorAll("#sound-preview video").length,
    caseStudyVideos: document.querySelectorAll("#case-study video").length,
    caseStatus: document.querySelector("#case-study .case-final")?.dataset.caseStatus || "",
    caseOwners: document.querySelectorAll("#case-study .case-owner").length,
    caseChainSteps: document.querySelectorAll("#case-study .case-chain li").length,
    caseLearnings: document.querySelectorAll("#case-study .case-insight").length,
    caseCurrentThemes: document.querySelectorAll("#case-study .case-current-theme").length,
    caseThemeBeats: document.querySelectorAll("#case-study .case-theme-arc li").length,
    caseThemeOptions: document.querySelectorAll("#case-study .case-theme-option").length,
    caseThemeChangeCards: document.querySelectorAll("#case-study .case-theme-change-card").length,
    caseThemeReplaceItems: document.querySelectorAll("#case-study .case-theme-change-card[data-change='replace'] li").length,
    caseThemeKeepItems: document.querySelectorAll("#case-study .case-theme-change-card[data-change='keep'] li").length,
    caseFitCards: document.querySelectorAll("#case-study .case-fit-card").length,
    caseExtensions: document.querySelectorAll("#case-study .case-extension-list li").length,
    caseMeaning: document.querySelectorAll("#case-study .case-meaning-list li").length,
    provenanceCards: document.querySelectorAll("#capability-provenance .provenance-card").length,
    provenanceText: document.querySelector("#capability-provenance")?.textContent || "",
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
  assert(basic.provenanceCards === 3, `${config.name}: three-way capability provenance map missing`);
  assert(basic.provenanceText.includes("原库真实能力") && basic.provenanceText.includes("Codex · Research Lab 新增") && basic.provenanceText.includes("用户外部模型产物"), `${config.name}: capability provenance labels incomplete`);
  if (config.dunhuang) {
    assert(basic.prepBeats === 3 && basic.prepShots === 6, `${config.name}: Dunhuang 3-beat / 6-shot plan missing`);
    assert(basic.prepKeyframes === 6, `${config.name}: six generated Dunhuang keyframes missing`);
    assert(basic.prepDispatchCards === 6 && basic.prepShotCopyButtons === 6, `${config.name}: six direct-copy video task cards missing`);
    assert(basic.prepCopyAllButtons === 1, `${config.name}: copy-all video tasks control missing`);
    assert(basic.prepVideos === 6 && basic.videoReviewStatuses === 6, `${config.name}: six user videos or review statuses missing`);
    assert(basic.roughCutVideos === 1, `${config.name}: 30-second picture rough cut missing`);
    assert(basic.soundPreviewVideos === 1, `${config.name}: 30-second sound preview missing`);
    assert(basic.caseStudyVideos === 1 && basic.caseStatus === "completed", `${config.name}: completed-case final video or status missing`);
    assert(basic.caseOwners === 3 && basic.caseChainSteps === 8 && basic.caseLearnings === 5, `${config.name}: completed-case ownership, workflow, or learnings incomplete`);
    assert(basic.caseCurrentThemes === 1 && basic.caseThemeBeats === 3 && basic.caseThemeOptions === 10, `${config.name}: current theme or replaceable theme map incomplete`);
    assert(basic.caseThemeChangeCards === 2 && basic.caseThemeReplaceItems === 5 && basic.caseThemeKeepItems === 6, `${config.name}: theme replacement/reuse guidance incomplete`);
    assert(basic.caseFitCards === 2 && basic.caseExtensions === 5 && basic.caseMeaning === 4, `${config.name}: completed-case scenarios, extensions, or meaning incomplete`);
  } else {
    assert(basic.prepBeats === 3 && basic.prepShots === 3, `${config.name}: default 15s structure missing`);
    assert(basic.prepKeyframes === 0, `${config.name}: local demonstration keyframes leaked into default sample`);
    assert(basic.prepDispatchCards === 0 && basic.prepShotCopyButtons === 0, `${config.name}: demonstration dispatch cards leaked into default sample`);
    assert(basic.prepVideos === 0, `${config.name}: demonstration video leaked into default sample`);
    assert(basic.roughCutVideos === 0, `${config.name}: demonstration rough cut leaked into default sample`);
    assert(basic.soundPreviewVideos === 0, `${config.name}: demonstration sound preview leaked into default sample`);
    assert(basic.caseStudyVideos === 0, `${config.name}: completed demonstration case leaked into default sample`);
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
    interaction.videoReviewStatuses = await page.locator(".video-review-status").allTextContents();
    interaction.videoVersionHistories = await page.locator(".video-version-history").allTextContents();
    interaction.codexImageSourceLabels = await page.locator("[data-source='codex-image']").allTextContents();
    interaction.userVideoSourceLabels = await page.locator("[data-source='user-video']").allTextContents();
    interaction.codexReviewSourceLabels = await page.locator("[data-source='codex-review']").allTextContents();
    interaction.promptOrigins = await page.locator(".prompt-origin").allTextContents();
    interaction.roughCutProvenance = await page.locator(".rough-cut-provenance").textContent();
    interaction.soundPreviewProvenance = await page.locator(".sound-preview-provenance").textContent();
    assert(interaction.dunhuangSample === "dunhuang-30s", "Dunhuang demonstration: URL did not select the preset");
    assert(interaction.dunhuangTopic.includes("沙漠中的世界十字路口"), "Dunhuang demonstration: topic missing");
    assert(interaction.dunhuangRoute === "image-to-video" && interaction.dunhuangDuration === "30", "Dunhuang demonstration: route or duration wrong");
    assert(interaction.dunhuangWarning.includes("研究示范已完成"), "Dunhuang demonstration: completed status missing");
    assert(interaction.dunhuangWarning.includes("静音画面粗剪") && interaction.dunhuangWarning.includes("最终声音版 V2") && interaction.dunhuangWarning.includes("神经网络 TTS"), "Dunhuang demonstration: final-video status missing");
    assert(interaction.dunhuangNarration.includes("河西走廊"), "Dunhuang demonstration: Chinese narration missing");
    assert(interaction.dunhuangPromptSources === 6, "Dunhuang demonstration: prompt provenance missing");
    assert(interaction.dunhuangAssetStatus.includes("6/6 张本地关键帧已生成"), "Dunhuang demonstration: generated keyframe readiness missing");
    assert(interaction.dunhuangAssetStatus.includes("6/6 个本地镜头视频已回填"), "Dunhuang demonstration: completed video progress missing");
    assert(interaction.dunhuangAssetStatus.includes("30 秒最终声音版") && interaction.dunhuangAssetStatus.includes("程序化环境声、ducking 与响度混音已完成"), "Dunhuang demonstration: completed final-audio asset status missing");
    assert(interaction.videoReviewStatuses[0].includes("通过 V2") && interaction.videoReviewStatuses[0].includes("进入剪辑"), "Dunhuang demonstration: first v2 approval status missing");
    assert(interaction.videoReviewStatuses[1].includes("通过 V1") && interaction.videoReviewStatuses[1].includes("进入剪辑"), "Dunhuang demonstration: second video approval status missing");
    assert(interaction.videoReviewStatuses[2].includes("通过 V2") && interaction.videoReviewStatuses[2].includes("进入剪辑"), "Dunhuang demonstration: third v2 approval status missing");
    assert(interaction.videoReviewStatuses[3].includes("通过 V1") && interaction.videoReviewStatuses[3].includes("进入剪辑"), "Dunhuang demonstration: B02-S02 approval status missing");
    assert(interaction.videoReviewStatuses[4].includes("通过 V1") && interaction.videoReviewStatuses[4].includes("进入剪辑"), "Dunhuang demonstration: B03-S01 approval status missing");
    assert(interaction.videoReviewStatuses[5].includes("通过 V1") && interaction.videoReviewStatuses[5].includes("进入剪辑"), "Dunhuang demonstration: B03-S02 approval status missing");
    assert(interaction.videoVersionHistories.length === 2 && interaction.videoVersionHistories[0].includes("路线出现树枝状扩张") && interaction.videoVersionHistories[1].includes("卷轴展开并生成文字"), "Dunhuang demonstration: v1 history records missing");
    assert(interaction.codexImageSourceLabels.length === 6 && interaction.codexImageSourceLabels.every((text) => text.includes("Codex 图片模型关键帧")), "Dunhuang demonstration: Codex image provenance missing");
    assert(interaction.userVideoSourceLabels.length === 6 && interaction.userVideoSourceLabels.every((text) => text.includes("用户外部模型产物") && text.includes("非原库生成")), "Dunhuang demonstration: user video provenance missing");
    assert(interaction.codexReviewSourceLabels.length === 6 && interaction.codexReviewSourceLabels.every((text) => text.includes("Codex / Research Lab")), "Dunhuang demonstration: review provenance missing");
    assert(interaction.promptOrigins.length === 6 && interaction.promptOrigins.every((text) => text.includes("关键帧由 Codex") && text.includes("视频由用户外部模型")), "Dunhuang demonstration: per-shot split provenance missing");
    assert(interaction.roughCutProvenance.includes("用户外部模型") && interaction.roughCutProvenance.includes("Codex / Research Lab") && interaction.roughCutProvenance.includes("非原库本次执行"), "Dunhuang demonstration: rough-cut provenance missing");
    assert(interaction.soundPreviewProvenance.includes("Microsoft Yunyang Neural") && interaction.soundPreviewProvenance.includes("Microsoft Edge online neural TTS") && interaction.soundPreviewProvenance.includes("无外部音乐或采样") && interaction.soundPreviewProvenance.includes("非原库本次执行"), "Dunhuang demonstration: sound-preview provenance missing");
    interaction.roughCutMetadata = await page.locator("#rough-cut-preview video").evaluate(async (video) => {
      video.muted = true;
      await video.play();
      return { src: video.currentSrc, duration: video.duration, width: video.videoWidth, height: video.videoHeight, audioTracks: video.captureStream?.().getAudioTracks().length ?? null };
    });
    await page.waitForFunction(() => document.querySelector("#rough-cut-preview video")?.currentTime > 0.15);
    await page.locator("#rough-cut-preview video").evaluate((video) => video.pause());
    assert(interaction.roughCutMetadata.src.endsWith("assets/dunhuang/final/dunhuang-rough-cut-v1.mp4"), "Dunhuang demonstration: rough-cut video src wrong");
    assert(Math.abs(interaction.roughCutMetadata.duration - 30) < 0.08 && interaction.roughCutMetadata.width === 720 && interaction.roughCutMetadata.height === 1280, "Dunhuang demonstration: rough-cut browser metadata wrong");
    const roughCutLinks = await page.locator(".rough-cut-actions a").evaluateAll((links) => links.map((link) => ({ href: link.href, download: link.download })));
    assert(roughCutLinks.length === 2 && roughCutLinks[0].href.endsWith("dunhuang-rough-cut-v1.mp4") && roughCutLinks[1].href.endsWith("dunhuang-narration-v1.srt"), "Dunhuang demonstration: rough-cut or narration download missing");
    interaction.soundPreviewMetadata = await page.locator("#sound-preview video").evaluate(async (video) => {
      video.muted = true;
      await video.play();
      return { src: video.currentSrc, duration: video.duration, width: video.videoWidth, height: video.videoHeight, audioTracks: video.captureStream?.().getAudioTracks().length ?? null };
    });
    await page.waitForFunction(() => document.querySelector("#sound-preview video")?.currentTime > 0.15);
    await page.locator("#sound-preview video").evaluate((video) => video.pause());
    assert(interaction.soundPreviewMetadata.src.endsWith("assets/dunhuang/final/dunhuang-sound-preview-v2.mp4"), "Dunhuang demonstration: sound-preview video src wrong");
    assert(Math.abs(interaction.soundPreviewMetadata.duration - 30) < 0.08 && interaction.soundPreviewMetadata.width === 720 && interaction.soundPreviewMetadata.height === 1280 && interaction.soundPreviewMetadata.audioTracks === 1, "Dunhuang demonstration: sound-preview browser metadata or audio track wrong");
    const soundLinks = await page.locator(".sound-preview-actions a").evaluateAll((links) => links.map((link) => ({ href: link.href, download: link.download })));
    assert(soundLinks.length === 4 && soundLinks[0].href.endsWith("dunhuang-sound-preview-v2.mp4") && soundLinks[1].href.endsWith("dunhuang-narration-yunyang-v2.m4a") && soundLinks[2].href.endsWith("dunhuang-ambient-bed-v1.m4a") && soundLinks[3].href.endsWith("dunhuang-audio-mix-v2.m4a"), "Dunhuang demonstration: sound-preview download set incomplete");
    interaction.completedCaseText = await page.locator("#case-study").textContent();
    assert(interaction.completedCaseText.includes("案例已完成") && interaction.completedCaseText.includes("先分清：谁完成了什么") && interaction.completedCaseText.includes("只有首帧能锁定起点") && interaction.completedCaseText.includes("从提示词，升级为制作系统"), "Dunhuang demonstration: completed-case summary missing essential conclusions");
    interaction.completedCaseMetadata = await page.locator("#case-study video").evaluate(async (video) => {
      video.muted = true;
      await video.play();
      return { src: video.currentSrc, duration: video.duration, width: video.videoWidth, height: video.videoHeight, audioTracks: video.captureStream?.().getAudioTracks().length ?? null };
    });
    await page.waitForFunction(() => document.querySelector("#case-study video")?.currentTime > 0.15);
    await page.locator("#case-study video").evaluate((video) => video.pause());
    assert(interaction.completedCaseMetadata.src.endsWith("assets/dunhuang/final/dunhuang-sound-preview-v2.mp4"), "Dunhuang demonstration: completed-case final video src wrong");
    assert(Math.abs(interaction.completedCaseMetadata.duration - 30) < 0.08 && interaction.completedCaseMetadata.width === 720 && interaction.completedCaseMetadata.height === 1280 && interaction.completedCaseMetadata.audioTracks === 1, "Dunhuang demonstration: completed-case final video metadata or audio track wrong");
    const caseLinks = await page.locator(".case-final-actions a").evaluateAll((links) => links.map((link) => ({ href: link.href, download: link.download })));
    assert(caseLinks.length === 2 && caseLinks[0].href.endsWith("dunhuang-sound-preview-v2.mp4") && caseLinks[0].download === "dunhuang-crossroads-final-v2.mp4" && caseLinks[1].href.includes("notes/dunhuang-case-study.md"), "Dunhuang demonstration: completed-case delivery links incomplete");
    interaction.videoMetadata = [];
    interaction.videoPlaybackTimes = [];
    const videoPlayers = page.locator(".generated-video video");
    for (let videoIndex = 0; videoIndex < 6; videoIndex += 1) {
      interaction.videoMetadata.push(await videoPlayers.nth(videoIndex).evaluate(async (video) => {
        video.muted = true;
        await video.play();
        return {
          src: video.currentSrc,
          poster: video.poster,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        };
      }));
      await page.waitForFunction((index) => document.querySelectorAll(".generated-video video")[index]?.currentTime > 0.15, videoIndex);
      interaction.videoPlaybackTimes.push(await videoPlayers.nth(videoIndex).evaluate((video) => {
        video.pause();
        return video.currentTime;
      }));
    }
    assert(interaction.videoMetadata[0].src.endsWith("assets/dunhuang/video/B01-S01-v2.mp4"), "Dunhuang demonstration: first v2 local video src wrong");
    assert(interaction.videoMetadata[0].poster.endsWith("assets/dunhuang/B01-S01.png"), "Dunhuang demonstration: first video poster wrong");
    assert(Math.abs(interaction.videoMetadata[0].duration - 5.062) < 0.08 && interaction.videoMetadata[0].width === 474 && interaction.videoMetadata[0].height === 842, "Dunhuang demonstration: first v2 browser video metadata wrong");
    assert(interaction.videoMetadata[1].src.endsWith("assets/dunhuang/video/B01-S02-v1.mp4"), "Dunhuang demonstration: second local video src wrong");
    assert(interaction.videoMetadata[1].poster.endsWith("assets/dunhuang/B01-S02.png"), "Dunhuang demonstration: second video poster wrong");
    assert(Math.abs(interaction.videoMetadata[1].duration - 5.088) < 0.08 && interaction.videoMetadata[1].width === 496 && interaction.videoMetadata[1].height === 864, "Dunhuang demonstration: second browser video metadata wrong");
    assert(interaction.videoMetadata[2].src.endsWith("assets/dunhuang/video/B02-S01-v2.mp4"), "Dunhuang demonstration: third v2 local video src wrong");
    assert(interaction.videoMetadata[2].poster.endsWith("assets/dunhuang/B02-S01.png"), "Dunhuang demonstration: third video poster wrong");
    assert(Math.abs(interaction.videoMetadata[2].duration - 5.062) < 0.08 && interaction.videoMetadata[2].width === 474 && interaction.videoMetadata[2].height === 842, "Dunhuang demonstration: third v2 browser video metadata wrong");
    assert(interaction.videoMetadata[3].src.endsWith("assets/dunhuang/video/B02-S02-v1.mp4"), "Dunhuang demonstration: fourth local video src wrong");
    assert(interaction.videoMetadata[3].poster.endsWith("assets/dunhuang/B02-S02.png"), "Dunhuang demonstration: fourth video poster wrong");
    assert(Math.abs(interaction.videoMetadata[3].duration - 5.088) < 0.08 && interaction.videoMetadata[3].width === 496 && interaction.videoMetadata[3].height === 864, "Dunhuang demonstration: fourth browser video metadata wrong");
    assert(interaction.videoMetadata[4].src.endsWith("assets/dunhuang/video/B03-S01-v1.mp4"), "Dunhuang demonstration: fifth local video src wrong");
    assert(interaction.videoMetadata[4].poster.endsWith("assets/dunhuang/B03-S01.png"), "Dunhuang demonstration: fifth video poster wrong");
    assert(Math.abs(interaction.videoMetadata[4].duration - 5.175) < 0.08 && interaction.videoMetadata[4].width === 768 && interaction.videoMetadata[4].height === 1344, "Dunhuang demonstration: fifth browser video metadata wrong");
    assert(interaction.videoMetadata[5].src.endsWith("assets/dunhuang/video/B03-S02-v1.mp4"), "Dunhuang demonstration: sixth local video src wrong");
    assert(interaction.videoMetadata[5].poster.endsWith("assets/dunhuang/B03-S02.png"), "Dunhuang demonstration: sixth video poster wrong");
    assert(Math.abs(interaction.videoMetadata[5].duration - 5.088) < 0.08 && interaction.videoMetadata[5].width === 496 && interaction.videoMetadata[5].height === 864, "Dunhuang demonstration: sixth browser video metadata wrong");
    assert(interaction.videoPlaybackTimes.every((value) => value > 0.15), "Dunhuang demonstration: a local video did not decode and play");
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
    assert(firstShotClipboard.includes("禁止树枝状生长") && firstShotClipboard.includes("增加任何分叉"), "Dunhuang demonstration: tightened tail retry constraint missing");
    assert(!firstShotClipboard.includes("B01-S02"), "Dunhuang demonstration: single-shot copy included another shot");
    assert((await page.locator("[data-copy-shot='B02-S01']").textContent()).includes("复制本镜头"), "Dunhuang demonstration: approved third video copy action missing");
    await page.locator("[data-copy-all-shots]").click();
    await page.waitForFunction(() => document.querySelector("#prep-status")?.textContent.includes("全部 6 个视频任务已复制"));
    interaction.copyAllStatus = await page.locator("#prep-status").textContent();
    const allShotsClipboard = await page.evaluate(() => navigator.clipboard.readText());
    interaction.allShotsClipboardLength = allShotsClipboard.length;
    const copiedShotIds = [...allShotsClipboard.matchAll(/【(B\d{2}-S\d{2})｜图生视频任务】/g)].map((match) => match[1]);
    interaction.copiedShotIds = copiedShotIds;
    assert(copiedShotIds.join(",") === "B01-S01,B01-S02,B02-S01,B02-S02,B03-S01,B03-S02", "Dunhuang demonstration: copy-all order or coverage wrong");
    assert((allShotsClipboard.match(/负向提示词：/g) || []).length === 6, "Dunhuang demonstration: copy-all negative prompts incomplete");
    assert(allShotsClipboard.includes("禁止把纸艺手、瓶子或丝绸变成写实材质") && allShotsClipboard.includes("卷轴必须保持卷起且完全无字"), "Dunhuang demonstration: tightened B02-S01 retry constraints missing");
    await page.locator("#prep-tab-json").click();
    const demoJson = await page.locator("#prep-json").textContent();
    const demoPack = JSON.parse(demoJson);
    const demoShots = demoPack.beats.flatMap((beat) => beat.shots);
    interaction.dunhuangJsonReady = demoJson.includes('"content_status": "research-demonstration-ready"');
    interaction.dunhuangReferenceImages = demoShots.map((shot) => shot.reference_image);
    interaction.dunhuangReferenceVideos = demoShots.map((shot) => shot.reference_video).filter(Boolean);
    interaction.dunhuangMissingRequired = demoShots.flatMap((shot) => shot.model_task.missing_required);
    assert(interaction.dunhuangJsonReady, "Dunhuang demonstration: handoff provenance missing from JSON");
    assert(demoJson.includes("敦煌：沙漠中的世界十字路口"), "Dunhuang demonstration: topic missing from JSON");
    assert(demoPack.source.keyframe_generator === "Codex built-in imagegen", "Dunhuang demonstration: keyframe generator missing from JSON");
    assert(interaction.dunhuangReferenceImages.length === 6 && interaction.dunhuangReferenceImages.every((value) => value.startsWith("assets/dunhuang/")), "Dunhuang demonstration: local keyframe paths missing from JSON");
    assert(interaction.dunhuangReferenceVideos.join(",") === "assets/dunhuang/video/B01-S01-v2.mp4,assets/dunhuang/video/B01-S02-v1.mp4,assets/dunhuang/video/B02-S01-v2.mp4,assets/dunhuang/video/B02-S02-v1.mp4,assets/dunhuang/video/B03-S01-v1.mp4,assets/dunhuang/video/B03-S02-v1.mp4", "Dunhuang demonstration: current local video paths missing from JSON");
    assert(demoShots[0].previous_versions?.[0]?.reference_video.endsWith("B01-S01-v1.mp4") && demoShots[2].previous_versions?.[0]?.reference_video.endsWith("B02-S01-v1.mp4"), "Dunhuang demonstration: v1 paths missing from JSON history");
    assert(demoPack.rough_cut?.reference_video.endsWith("dunhuang-rough-cut-v1.mp4") && demoPack.rough_cut?.audio_status.includes("silent-placeholder-track") && demoPack.rough_cut?.shot_order.length === 6, "Dunhuang demonstration: rough-cut handoff metadata missing");
    assert(demoPack.rough_cut?.sound_preview?.reference_video.endsWith("dunhuang-sound-preview-v2.mp4") && demoPack.rough_cut?.sound_preview?.voice.includes("Microsoft Yunyang Neural") && demoPack.rough_cut?.sound_preview?.voice_source.includes("online neural TTS") && demoPack.rough_cut?.sound_preview?.previous_version?.voice.includes("Microsoft Kangkang") && demoPack.rough_cut?.sound_preview?.narration_cues.length === 3, "Dunhuang demonstration: sound-preview handoff metadata missing");
    assert(demoPack.case_closure?.status === "completed" && demoPack.case_closure?.final_video.endsWith("dunhuang-sound-preview-v2.mp4") && demoPack.case_closure?.deliverables.length === 10, "Dunhuang demonstration: completed-case handoff metadata missing");
    assert(demoPack.case_closure?.theme_reuse?.current?.arc.length === 3 && demoPack.case_closure?.theme_reuse?.alternatives.length === 10 && demoPack.case_closure?.theme_reuse?.replace_when_switching.length === 5 && demoPack.case_closure?.theme_reuse?.keep_across_themes.length === 6, "Dunhuang demonstration: theme reuse handoff metadata missing");
    assert(interaction.dunhuangMissingRequired.length === 0, "Dunhuang demonstration: image-to-video dispatch still has missing inputs");
    await page.locator("#prep-tab-shots").click();
    if (config.name === "desktop-dunhuang-demonstration") {
      await page.locator("#rough-cut-preview").scrollIntoViewIfNeeded();
      await page.locator("#rough-cut-preview").screenshot({ path: path.join(evidenceDir, "dunhuang-rough-cut-v1-review.png") });
      await page.locator("#sound-preview").scrollIntoViewIfNeeded();
      await page.locator("#sound-preview").screenshot({ path: path.join(evidenceDir, "dunhuang-sound-preview-v2-review.png") });
      await page.locator("#case-study").screenshot({ path: path.join(evidenceDir, "dunhuang-completed-case.png") });
      for (const shotId of ["B01-S01", "B02-S01"]) {
        const card = page.locator(`[data-shot-id='${shotId}'] .generated-video`);
        await card.evaluate((element) => { element.closest("details").open = true; });
        await card.scrollIntoViewIfNeeded();
        await card.screenshot({ path: path.join(evidenceDir, `${shotId}-v2-review.png`) });
      }
    }
    if (config.name === "mobile-dark-preproduction") {
      for (const [selector, filename] of [["#rough-cut-preview", "mobile-dunhuang-rough-cut.png"], ["#sound-preview", "mobile-dunhuang-sound-preview.png"]]) {
        const card = page.locator(selector);
        await card.evaluate((element) => {
          const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 74;
          const absoluteTop = element.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: Math.max(0, absoluteTop - margin), behavior: "instant" });
        });
        await card.screenshot({ path: path.join(evidenceDir, filename) });
      }
      const completedCase = page.locator("#case-study .case-final");
      await completedCase.evaluate((element) => {
        const absoluteTop = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.max(0, absoluteTop - 92), behavior: "instant" });
      });
      await completedCase.screenshot({ path: path.join(evidenceDir, "mobile-dunhuang-completed-case.png") });
      const themeReuse = page.locator("#case-study [data-case-evidence='theme-reuse']");
      await themeReuse.scrollIntoViewIfNeeded();
      await themeReuse.screenshot({ path: path.join(evidenceDir, "mobile-theme-reuse.png") });
    }
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

  const captureTarget = page.locator(config.captureSelector);
  await captureTarget.evaluate((element) => {
    const parentDetails = element.closest("details");
    if (parentDetails) parentDetails.open = true;
  });
  await captureTarget.evaluate((element) => {
    const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 80;
    const absoluteTop = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, absoluteTop - margin), behavior: "instant" });
  });
  const captureVideo = captureTarget.locator("video");
  if (await captureVideo.count() === 1) {
    await captureVideo.evaluate(async (video) => {
      video.muted = true;
      await video.play();
    });
    await page.waitForTimeout(300);
    await captureVideo.evaluate((video) => video.pause());
  }
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

async function inspectVideoFallbackState(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "light" });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  await page.route("**/assets/dunhuang/video/*.mp4", (route) => route.abort("failed"));
  await page.route("**/assets/dunhuang/final/*.mp4", (route) => route.abort("failed"));
  await page.goto(`${baseUrl}?demo=dunhuang#prep`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelectorAll("#prep-editor .shot-editor").length === 6);
  await page.waitForFunction(() => document.querySelectorAll(".video-fallback:not([hidden])").length === 6);
  await page.waitForFunction(() => document.querySelectorAll(".rough-cut-fallback:not([hidden])").length === 1);
  await page.waitForFunction(() => document.querySelectorAll(".sound-preview-fallback:not([hidden])").length === 1);
  await page.waitForFunction(() => document.querySelectorAll(".case-final-fallback:not([hidden])").length === 1);
  const result = await page.evaluate(() => ({
    fallbackCount: document.querySelectorAll(".video-fallback:not([hidden])").length,
    fallbackText: [...document.querySelectorAll(".video-fallback:not([hidden])")].map((item) => item.textContent).join(" | "),
    roughCutFallbackCount: document.querySelectorAll(".rough-cut-fallback:not([hidden])").length,
    roughCutFallbackText: document.querySelector(".rough-cut-fallback:not([hidden])")?.textContent || "",
    soundPreviewFallbackCount: document.querySelectorAll(".sound-preview-fallback:not([hidden])").length,
    soundPreviewFallbackText: document.querySelector(".sound-preview-fallback:not([hidden])")?.textContent || "",
    completedCaseFallbackCount: document.querySelectorAll(".case-final-fallback:not([hidden])").length,
    completedCaseFallbackText: document.querySelector(".case-final-fallback:not([hidden])")?.textContent || "",
    completedCaseText: document.querySelector("#case-study")?.textContent || "",
    keyframeStillVisible: Boolean(document.querySelector(".generated-keyframe img")?.naturalWidth),
    dispatchStillAvailable: document.querySelectorAll(".dispatch-card").length === 6,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth,
    theme: document.documentElement.dataset.theme,
  }));
  assert(result.fallbackCount === 6 && result.fallbackText.includes("关键帧和完整提示词仍可使用"), "video fallback: per-video recovery messages missing");
  assert(result.roughCutFallbackCount === 1 && result.roughCutFallbackText.includes("旁白时间稿"), "video fallback: rough-cut recovery message missing");
  assert(result.soundPreviewFallbackCount === 1 && result.soundPreviewFallbackText.includes("声音分轨"), "video fallback: sound-preview recovery message missing");
  assert(result.completedCaseFallbackCount === 1 && result.completedCaseFallbackText.includes("案例结论") && result.completedCaseText.includes("当前是敦煌") && result.completedCaseText.includes("三星堆") && result.completedCaseText.includes("先分清：谁完成了什么"), "video fallback: completed-case summary, theme reuse, or recovery message missing");
  assert(result.keyframeStillVisible && result.dispatchStillAvailable, "video fallback: base workflow disappeared");
  assert(result.scrollWidth <= result.innerWidth + 1, "video fallback: horizontal overflow");
  assert(pageErrors.length === 0, `video fallback: page errors ${pageErrors.join(" | ")}`);
  await page.locator("#case-study .case-final").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(evidenceDir, "mobile-video-fallback.png"), fullPage: false });
  await context.close();
  return { ...result, pageErrors };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const matrix = [
    { name: "desktop-light-overview", viewport: { width: 1440, height: 1000 }, colorScheme: "light", captureSelector: "#overview" },
    { name: "desktop-light-preproduction", viewport: { width: 1440, height: 1000 }, colorScheme: "light", captureSelector: "#prep", interactions: true },
    { name: "desktop-dunhuang-demonstration", viewport: { width: 1440, height: 1000 }, colorScheme: "light", captureSelector: "#capability-provenance", url: `${baseUrl}?demo=dunhuang#prep`, dunhuang: true },
    { name: "desktop-dark-samples", viewport: { width: 1440, height: 1000 }, colorScheme: "dark", captureSelector: "#samples" },
    { name: "tablet-light-modes", viewport: { width: 768, height: 900 }, colorScheme: "light", captureSelector: "#modes" },
    { name: "tablet-light-completed-case", viewport: { width: 768, height: 900 }, colorScheme: "light", captureSelector: "#case-study", url: `${baseUrl}?demo=dunhuang#case-study`, dunhuang: true, caseHash: true },
    { name: "mobile-dark-preproduction", viewport: { width: 390, height: 844 }, colorScheme: "dark", reducedMotion: "reduce", captureSelector: "#prep", url: `${baseUrl}?demo=dunhuang#prep`, dunhuang: true },
  ];
  const results = {};
  for (const config of matrix) results[config.name] = await inspect(browser, config);
  results["mobile-error-state"] = await inspectErrorState(browser);
  results["mobile-prep-error-state"] = await inspectPrepErrorState(browser);
  results["mobile-video-fallback"] = await inspectVideoFallbackState(browser);
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
