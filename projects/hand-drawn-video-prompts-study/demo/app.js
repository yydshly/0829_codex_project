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

elements.shotRail.addEventListener("keydown", handleShotKeys);
elements.copyButton.addEventListener("click", copyOutput);
setupOutputTabs();
setupTheme();
loadDemo();
loadBuildMetadata();
