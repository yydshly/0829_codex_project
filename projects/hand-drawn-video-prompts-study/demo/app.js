const state = {
  data: null,
  shotIndex: 0,
  view: "metaphor",
};

const viewLabels = {
  metaphor: "视觉隐喻",
  image_prompt: "Flow 静帧 Prompt",
  video_prompt: "Flow 图生视频 Prompt",
  entity_note: "实体准确性风险",
};

const elements = {
  source: document.querySelector("#source-script"),
  durationBadge: document.querySelector("#duration-badge"),
  shotRail: document.querySelector("#shot-rail"),
  shotNumber: document.querySelector("#shot-number"),
  shotTitle: document.querySelector("#shot-title"),
  shotDuration: document.querySelector("#shot-duration"),
  shotNarration: document.querySelector("#shot-narration"),
  outputLabel: document.querySelector("#output-label"),
  outputContent: document.querySelector("#output-content"),
  copyButton: document.querySelector("#copy-button"),
  themeToggle: document.querySelector("#theme-toggle"),
  themeLabel: document.querySelector(".theme-label"),
  newsHeadline: document.querySelector("#news-headline"),
  newsWhy: document.querySelector("#news-why"),
  ttsProviderLabel: document.querySelector("#tts-provider-label"),
  i2vShotBoard: document.querySelector("#i2v-shot-board"),
};

function currentShot() {
  return state.data?.shots[state.shotIndex] ?? null;
}

function formatOutput(shot) {
  if (state.view === "metaphor") {
    return `视觉隐喻\n${shot.metaphor}\n\n画面中文关键词\n“${shot.keyword}”`;
  }
  return shot[state.view];
}

function renderOutput() {
  const shot = currentShot();
  if (!shot) return;
  elements.outputLabel.textContent = viewLabels[state.view];
  elements.outputContent.textContent = formatOutput(shot);
  elements.copyButton.textContent = "复制内容";
  elements.copyButton.dataset.copied = "false";
}

function renderShot() {
  const shot = currentShot();
  if (!shot) return;
  elements.shotNumber.textContent = `镜头 ${shot.id}`;
  elements.shotTitle.textContent = shot.title;
  elements.shotDuration.textContent = `${shot.duration_seconds} 秒`;
  elements.shotNarration.textContent = shot.narration;
  elements.shotRail.querySelectorAll(".shot-button").forEach((button, index) => {
    button.setAttribute("aria-selected", String(index === state.shotIndex));
    button.tabIndex = index === state.shotIndex ? 0 : -1;
  });
  renderOutput();
}

function selectShot(index, { focus = false } = {}) {
  if (!state.data || index < 0 || index >= state.data.shots.length) return;
  state.shotIndex = index;
  renderShot();
  if (focus) {
    elements.shotRail.querySelectorAll(".shot-button")[index]?.focus();
  }
}

function buildShotRail() {
  const fragment = document.createDocumentFragment();
  state.data.shots.forEach((shot, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "shot-button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", "output-panel");
    button.setAttribute("aria-selected", String(index === state.shotIndex));
    button.tabIndex = index === state.shotIndex ? 0 : -1;

    const number = document.createElement("span");
    number.textContent = `SHOT ${shot.id}`;
    const title = document.createElement("small");
    title.textContent = shot.title;
    button.append(number, title);
    button.addEventListener("click", () => selectShot(index));
    fragment.append(button);
  });
  elements.shotRail.replaceChildren(fragment);
}

function handleShotKeys(event) {
  if (!state.data) return;
  const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
  if (!keys.includes(event.key)) return;
  event.preventDefault();
  const last = state.data.shots.length - 1;
  if (event.key === "Home") return selectShot(0, { focus: true });
  if (event.key === "End") return selectShot(last, { focus: true });
  const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
  const next = (state.shotIndex + direction + state.data.shots.length) % state.data.shots.length;
  selectShot(next, { focus: true });
}

function setupOutputTabs() {
  const tabs = [...document.querySelectorAll(".output-tabs [role='tab']")];
  const selectView = (tab, { focus = false } = {}) => {
    state.view = tab.dataset.view;
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    if (focus) tab.focus();
    renderOutput();
  };

  tabs.forEach((tab, index) => {
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.addEventListener("click", () => selectView(tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else next = (index + (event.key === "ArrowLeft" ? -1 : 1) + tabs.length) % tabs.length;
      selectView(tabs[next], { focus: true });
    });
  });
}

async function copyOutput() {
  const text = elements.outputContent.textContent;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  elements.copyButton.textContent = "已复制";
  elements.copyButton.dataset.copied = "true";
  window.setTimeout(() => {
    elements.copyButton.textContent = "复制内容";
    elements.copyButton.dataset.copied = "false";
  }, 1600);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === "dark";
  elements.themeToggle.setAttribute("aria-pressed", String(isDark));
  elements.themeLabel.textContent = isDark ? "浅色" : "深色";
  try {
    localStorage.setItem("hdvp-research-theme", theme);
  } catch {
    // Theme persistence is optional; the visible toggle remains functional.
  }
}

function setupTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem("hdvp-research-theme");
  } catch {
    saved = null;
  }
  const initial = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(initial);
  elements.themeToggle.addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
}

async function loadDemo() {
  try {
    const response = await fetch("assets/demo-case.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    elements.source.textContent = state.data.source_script;
    elements.durationBadge.textContent = `约 ${state.data.estimated_duration_seconds} 秒`;
    if (elements.newsHeadline && state.data.news?.headline) {
      elements.newsHeadline.textContent = state.data.news.headline;
    }
    if (elements.newsWhy && state.data.news?.why_selected) {
      elements.newsWhy.textContent = `为什么选它：${state.data.news.why_selected}`;
    }
    buildShotRail();
    renderShot();
  } catch (error) {
    elements.source.textContent = "演示数据读取失败。请通过本项目记录的本地服务器命令访问，而不是直接双击 HTML 文件。";
    elements.outputContent.textContent = `无法读取 assets/demo-case.json：${error.message}`;
    elements.copyButton.disabled = true;
  }
}

async function loadBuildMetadata() {
  if (!elements.ttsProviderLabel) return;
  try {
    const response = await fetch("assets/news-case-build.json");
    if (!response.ok) return;
    const metadata = await response.json();
    if (metadata.tts_label) elements.ttsProviderLabel.textContent = metadata.tts_label;
  } catch {
    // The generic label remains accurate when optional build metadata is unavailable.
  }
}

function buildI2vShotCard(shot) {
  const card = document.createElement("article");
  const isReady = shot.status === "paired_video_ready" && Boolean(shot.video_asset);
  card.className = `i2v-shot-card ${isReady ? "is-ready" : "is-pending"}${shot.historical_single_image_video_asset ? " has-history" : ""}`;
  card.dataset.shotId = shot.id;

  const framePair = document.createElement("div");
  framePair.className = "i2v-frame-pair";
  const buildFrame = (kind, src, stateText) => {
    const figure = document.createElement("figure");
    figure.className = "i2v-paired-frame";
    const label = document.createElement("span");
    label.className = "i2v-frame-label";
    label.textContent = kind;
    const image = document.createElement("img");
    image.src = src;
    image.alt = `${shot.title}镜头${kind === "FIRST" ? "首帧" : "尾帧"}：${stateText}`;
    image.width = 941;
    image.height = 1672;
    image.loading = "lazy";
    const download = document.createElement("a");
    download.href = src;
    download.download = "";
    download.className = "i2v-frame-download";
    download.title = `下载 ${shot.title} ${kind} 图片`;
    download.append(image);
    figure.append(download, label);
    return figure;
  };
  framePair.append(
    buildFrame("FIRST", shot.first_frame_asset, shot.start_state),
    buildFrame("LAST", shot.last_frame_asset, shot.end_state)
  );

  const meta = document.createElement("div");
  meta.className = "i2v-shot-meta";
  const number = document.createElement("span");
  number.textContent = `SHOT ${shot.id} · ${shot.duration_seconds}s`;
  const title = document.createElement("h5");
  title.textContent = shot.title;
  const keyword = document.createElement("strong");
  keyword.textContent = shot.keyword;
  const narration = document.createElement("p");
  narration.textContent = shot.narration;
  const status = document.createElement("em");
  status.textContent = isReady ? "首尾帧视频已接入 · 6 秒" : "首尾帧就绪 · 新视频待生成";
  const startState = document.createElement("p");
  startState.className = "i2v-state-line";
  startState.innerHTML = `<b>FIRST</b>${shot.start_state}`;
  const endState = document.createElement("p");
  endState.className = "i2v-state-line";
  endState.innerHTML = `<b>LAST</b>${shot.end_state}`;
  meta.append(number, title, keyword, narration, status, startState, endState);

  const contract = document.createElement("div");
  contract.className = "i2v-shot-contract";

  if (isReady) {
    const clipDetails = document.createElement("details");
    clipDetails.className = "i2v-shot-clip";
    const clipSummary = document.createElement("summary");
    clipSummary.textContent = "播放本镜头实际视频";
    const video = document.createElement("video");
    video.controls = true;
    video.playsInline = true;
    video.preload = "none";
    video.poster = shot.first_frame_asset;
    video.setAttribute("aria-label", `${shot.title}六秒首尾帧图生视频`);
    const source = document.createElement("source");
    source.src = shot.video_asset;
    source.type = "video/mp4";
    video.append(source);
    const clipDownload = document.createElement("a");
    clipDownload.href = shot.video_asset;
    clipDownload.download = "";
    clipDownload.className = "i2v-clip-download";
    clipDownload.textContent = `下载 ${shot.video_asset.split("/").pop()}`;
    clipDetails.append(clipSummary, video, clipDownload);
    contract.append(clipDetails);
  }

  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "查看首尾状态匹配 Prompt";
  const prompt = document.createElement("pre");
  prompt.textContent = shot.video_prompt;
  details.append(summary, prompt);

  const delivery = document.createElement("code");
  delivery.textContent = shot.expected_video_asset.split("/").pop();
  delivery.className = "i2v-shot-delivery";
  contract.append(details, delivery);

  if (shot.historical_single_image_video_asset) {
    const history = document.createElement("a");
    history.href = shot.historical_single_image_video_asset;
    history.className = "i2v-history-link";
    history.textContent = "播放历史单图实验（不计入本次 5/5）↗";
    contract.append(history);
  }

  card.append(framePair, meta, contract);
  return card;
}

async function loadI2vStoryboard() {
  if (!elements.i2vShotBoard) return;
  try {
    const response = await fetch("assets/i2v-agent-workflow-storyboard.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const storyboard = await response.json();
    const fragment = document.createDocumentFragment();
    storyboard.shots.forEach((shot) => fragment.append(buildI2vShotCard(shot)));
    elements.i2vShotBoard.replaceChildren(fragment);
  } catch (error) {
    const message = document.createElement("p");
    message.className = "i2v-board-error";
    message.textContent = `30 秒分镜读取失败：${error.message}。下载链接仍可直接使用。`;
    elements.i2vShotBoard.replaceChildren(message);
  }
}

elements.shotRail.addEventListener("keydown", handleShotKeys);
elements.copyButton.addEventListener("click", copyOutput);
setupOutputTabs();
setupTheme();
loadDemo();
loadBuildMetadata();
loadI2vStoryboard();
