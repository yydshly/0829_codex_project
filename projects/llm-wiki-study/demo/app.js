const DATA_URL = "./assets/capabilities.json";
const SAMPLE_URL = "./assets/left-ear-sample.json";
const REAL_RUN_URL = "./assets/codex-ingest-result.json";
const ORIGINAL_UI_URL = "./assets/original-ui.json";

const state = {
  data: null,
  category: "all",
  query: "",
  selectedId: null,
  sampleData: null,
  sampleMode: "wiki",
  originalUiData: null,
  originalUiMode: "workspace",
  realRunData: null,
  selectedRealPage: null,
};

const elements = {
  filters: document.querySelector("#category-filters"),
  search: document.querySelector("#capability-search"),
  count: document.querySelector("#result-count"),
  grid: document.querySelector("#capability-grid"),
  detail: document.querySelector("#detail-panel"),
  title: document.querySelector("#detail-title"),
  summary: document.querySelector("#detail-summary"),
  mechanism: document.querySelector("#detail-mechanism"),
  outputs: document.querySelector("#detail-outputs"),
  evidence: document.querySelector("#detail-evidence"),
  pending: document.querySelector("#detail-pending"),
  empty: document.querySelector("#empty-state"),
  error: document.querySelector("#error-state"),
  reset: document.querySelector("#reset-filter"),
  retry: document.querySelector("#retry-load"),
  themeToggle: document.querySelector("#theme-toggle"),
  progress: document.querySelector(".reading-progress span"),
  sampleConsole: document.querySelector("#sample-console"),
  sampleSourceKind: document.querySelector("#sample-source-kind"),
  sampleArticles: document.querySelector("#sample-articles"),
  sampleCharacters: document.querySelector("#sample-characters"),
  sampleCandidates: document.querySelector("#sample-candidates"),
  sampleSkills: document.querySelector("#sample-skills"),
  sampleSkillName: document.querySelector("#sample-skill-name"),
  sampleRegression: document.querySelector("#sample-regression"),
  sampleQuestionLabel: document.querySelector("#sample-question-label"),
  sampleQuestion: document.querySelector("#sample-question"),
  sampleSourceBoundary: document.querySelector("#sample-source-boundary"),
  sampleModePanel: document.querySelector("#sample-mode-panel"),
  sampleModeNumber: document.querySelector("#sample-mode-number"),
  sampleModeTitle: document.querySelector("#sample-mode-title"),
  sampleModeStatus: document.querySelector("#sample-mode-status"),
  sampleModeInput: document.querySelector("#sample-mode-input"),
  sampleProcess: document.querySelector("#sample-process"),
  sampleAnswerLabel: document.querySelector("#sample-answer-label"),
  sampleAnswer: document.querySelector("#sample-answer"),
  sampleEvidenceState: document.querySelector("#sample-evidence-state"),
  sampleAfter: document.querySelector("#sample-after"),
  sampleArtifacts: document.querySelector("#sample-artifacts"),
  sampleVerdict: document.querySelector("#sample-verdict"),
  sampleWikiMap: document.querySelector("#sample-wiki-map"),
  wikiMapBoundary: document.querySelector("#wiki-map-boundary"),
  wikiNodeList: document.querySelector("#wiki-node-list"),
  wikiRelations: document.querySelector("#wiki-relations"),
  sampleError: document.querySelector("#sample-error"),
  sampleRetry: document.querySelector("#sample-retry"),
  originalUiConsole: document.querySelector("#original-ui-console"),
  originalUiTabs: document.querySelector(".original-ui-tabs"),
  originalUiPanel: document.querySelector("#original-ui-panel"),
  originalUiBoundary: document.querySelector("#original-ui-boundary"),
  originalUiImage: document.querySelector("#original-ui-image"),
  originalUiImageLabel: document.querySelector("#original-ui-image-label"),
  originalUiNumber: document.querySelector("#original-ui-number"),
  originalUiTitle: document.querySelector("#original-ui-surface-title"),
  originalUiSummary: document.querySelector("#original-ui-summary"),
  originalUiOperation: document.querySelector("#original-ui-operation"),
  originalUiOutcome: document.querySelector("#original-ui-outcome"),
  originalUiCapabilities: document.querySelector("#original-ui-capabilities"),
  originalUiSource: document.querySelector("#original-ui-source"),
  originalUiError: document.querySelector("#original-ui-error"),
  originalUiRetry: document.querySelector("#original-ui-retry"),
  realRunConsole: document.querySelector("#real-run-console"),
  realRunStatus: document.querySelector("#real-run-status"),
  realRunEngine: document.querySelector("#real-run-engine"),
  realElapsed: document.querySelector("#real-elapsed"),
  realCalls: document.querySelector("#real-calls"),
  realPages: document.querySelector("#real-pages"),
  realThematic: document.querySelector("#real-thematic"),
  realRelations: document.querySelector("#real-relations"),
  realReviews: document.querySelector("#real-reviews"),
  realCallList: document.querySelector("#real-call-list"),
  realPageList: document.querySelector("#real-page-list"),
  realPageDetail: document.querySelector("#real-page-detail"),
  realPageType: document.querySelector("#real-page-type"),
  realPagePath: document.querySelector("#real-page-path"),
  realPageTitle: document.querySelector("#real-page-title"),
  realPageExcerpt: document.querySelector("#real-page-excerpt"),
  realPageSources: document.querySelector("#real-page-sources"),
  realPageLinks: document.querySelector("#real-page-links"),
  realPageSha: document.querySelector("#real-page-sha"),
  realQualityGrid: document.querySelector("#real-quality-grid"),
  realRunError: document.querySelector("#real-run-error"),
  realRunRetry: document.querySelector("#real-run-retry"),
};

function normalize(value) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function categoryLabel(categoryId) {
  return state.data.categories.find((item) => item.id === categoryId)?.label ?? categoryId;
}

function filteredCapabilities() {
  if (!state.data) return [];
  const query = normalize(state.query);
  return state.data.capabilities.filter((item) => {
    const matchesCategory = state.category === "all" || item.category === state.category;
    const searchable = [
      item.title,
      item.summary,
      item.mechanism,
      item.outputs.join(" "),
      item.pending,
    ]
      .join(" ")
      .toLocaleLowerCase("zh-CN");
    return matchesCategory && (!query || searchable.includes(query));
  });
}

function evidenceUrl(path, line) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `https://github.com/nashsu/llm_wiki/blob/${state.data.commit}/${encodedPath}#L${line}`;
}

function updateHash(id) {
  const hash = `#cap-${id}`;
  if (window.location.hash !== hash) history.replaceState(null, "", hash);
}

function renderDetail(item) {
  elements.detail.hidden = !item;
  if (!item) return;

  elements.title.textContent = item.title;
  elements.summary.textContent = item.summary;
  elements.mechanism.textContent = item.mechanism;
  elements.pending.textContent = item.pending;
  elements.outputs.replaceChildren();
  item.outputs.forEach((output) => {
    const listItem = document.createElement("li");
    listItem.textContent = output;
    elements.outputs.append(listItem);
  });

  elements.evidence.replaceChildren();
  item.evidence.forEach((entry) => {
    const link = document.createElement("a");
    link.href = evidenceUrl(entry.path, entry.line);
    link.target = "_blank";
    link.rel = "noreferrer";
    const label = document.createElement("strong");
    label.textContent = `${entry.label} ↗`;
    const path = document.createElement("code");
    path.textContent = `${entry.path}:L${entry.line}`;
    link.append(label, path);
    elements.evidence.append(link);
  });
}

function selectCapability(id, { updateLocation = true } = {}) {
  const item = state.data.capabilities.find((capability) => capability.id === id);
  if (!item) return;
  state.selectedId = id;
  document.querySelectorAll(".capability-card").forEach((card) => {
    card.setAttribute("aria-pressed", String(card.dataset.id === id));
  });
  renderDetail(item);
  if (updateLocation) updateHash(id);
}

function createCard(item) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "capability-card";
  card.dataset.id = item.id;
  card.setAttribute("aria-pressed", String(item.id === state.selectedId));
  card.setAttribute("aria-controls", "detail-panel");

  const top = document.createElement("span");
  top.className = "card-top";
  const number = document.createElement("span");
  number.className = "card-number";
  number.textContent = item.number;
  const category = document.createElement("span");
  category.className = "card-category";
  category.textContent = categoryLabel(item.category);
  top.append(number, category);

  const copy = document.createElement("span");
  const title = document.createElement("h3");
  title.textContent = item.title;
  const summary = document.createElement("p");
  summary.textContent = item.summary;
  copy.append(title, summary);

  const foot = document.createElement("span");
  foot.className = "card-foot";
  const status = document.createElement("span");
  status.className = "card-status";
  status.textContent = item.status;
  const arrow = document.createElement("span");
  arrow.className = "card-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↗";
  foot.append(status, arrow);
  card.append(top, copy, foot);
  card.addEventListener("click", () => selectCapability(item.id));
  return card;
}

function renderCapabilities({ preserveSelection = false } = {}) {
  const items = filteredCapabilities();
  elements.grid.replaceChildren(...items.map(createCard));
  elements.grid.setAttribute("aria-busy", "false");
  elements.count.textContent = `${items.length} / ${state.data.capabilities.length}`;
  elements.grid.hidden = items.length === 0;
  elements.empty.hidden = items.length !== 0;

  if (!items.length) {
    renderDetail(null);
    return;
  }
  if (!preserveSelection || !items.some((item) => item.id === state.selectedId)) {
    state.selectedId = items[0].id;
  }
  selectCapability(state.selectedId);
}

function setCategory(categoryId, { preserveSelection = false } = {}) {
  state.category = categoryId;
  document.querySelectorAll(".filter-button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.category === categoryId));
  });
  renderCapabilities({ preserveSelection });
}

function handleFilterKeys(event) {
  const buttons = [...elements.filters.querySelectorAll(".filter-button")];
  const current = buttons.indexOf(document.activeElement);
  if (current < 0) return;
  let next = current;
  if (event.key === "ArrowRight") next = (current + 1) % buttons.length;
  if (event.key === "ArrowLeft") next = (current - 1 + buttons.length) % buttons.length;
  if (event.key === "Home") next = 0;
  if (event.key === "End") next = buttons.length - 1;
  if (next !== current) {
    event.preventDefault();
    buttons[next].focus();
  }
}

function renderFilters() {
  const fragment = document.createDocumentFragment();
  state.data.categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.dataset.category = category.id;
    button.textContent = category.label;
    button.setAttribute("aria-pressed", String(category.id === state.category));
    button.addEventListener("click", () => setCategory(category.id));
    fragment.append(button);
  });
  elements.filters.replaceChildren(fragment);
}

function capabilityFromHash() {
  if (!state.data || !location.hash.startsWith("#cap-")) return null;
  const id = decodeURIComponent(location.hash.slice(5));
  return state.data.capabilities.find((item) => item.id === id) ?? null;
}

function renderWikiMapping(mapping) {
  elements.wikiMapBoundary.textContent = mapping.boundary;
  elements.wikiNodeList.replaceChildren();
  mapping.nodes.forEach((item) => {
    const node = document.createElement("article");
    node.className = "wiki-node";
    node.dataset.type = item.type;
    const type = document.createElement("span");
    type.textContent = item.label;
    const title = document.createElement("strong");
    title.textContent = item.title;
    const path = document.createElement("code");
    path.textContent = item.path;
    node.append(type, title, path);
    elements.wikiNodeList.append(node);
  });

  elements.wikiRelations.replaceChildren();
  mapping.relations.forEach((relation) => {
    const item = document.createElement("span");
    item.textContent = relation;
    elements.wikiRelations.append(item);
  });
}

function renderSampleMode(modeId, { focus = false } = {}) {
  if (!state.sampleData) return;
  const mode = state.sampleData.modes.find((item) => item.id === modeId);
  if (!mode) return;
  state.sampleMode = mode.id;

  document.querySelectorAll("[data-sample-mode]").forEach((button) => {
    const selected = button.dataset.sampleMode === mode.id;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  const activeTab = document.querySelector(`[data-sample-mode="${mode.id}"]`);
  elements.sampleModePanel.setAttribute("aria-labelledby", activeTab.id);
  const tabList = activeTab.parentElement;
  const targetLeft = activeTab.offsetLeft - (tabList.clientWidth - activeTab.offsetWidth) / 2;
  tabList.scrollTo({ left: Math.max(0, targetLeft), behavior: "instant" });
  if (focus) activeTab.focus();

  elements.sampleModeNumber.textContent = `${mode.number} / ${mode.short}`;
  elements.sampleModeTitle.textContent = mode.label;
  elements.sampleModeStatus.textContent = mode.status;
  elements.sampleModeInput.textContent = mode.input;
  elements.sampleAnswerLabel.textContent = mode.answerLabel;
  elements.sampleAnswer.textContent = mode.answer;
  elements.sampleEvidenceState.textContent = mode.evidenceState;
  elements.sampleAfter.textContent = mode.after;
  elements.sampleVerdict.textContent = mode.verdict;

  elements.sampleProcess.replaceChildren();
  mode.process.forEach((step, index) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = `${String(index + 1).padStart(2, "0")} / ${step.label}`;
    const title = document.createElement("strong");
    title.textContent = step.title;
    const detail = document.createElement("p");
    detail.textContent = step.detail;
    item.append(label, title, detail);
    elements.sampleProcess.append(item);
  });

  elements.sampleArtifacts.replaceChildren();
  mode.artifacts.forEach((artifact) => {
    const item = document.createElement("li");
    item.textContent = artifact;
    elements.sampleArtifacts.append(item);
  });
  elements.sampleWikiMap.hidden = mode.id !== "wiki";
}

function handleSampleTabKeys(event) {
  const tabs = [...document.querySelectorAll("[data-sample-mode]")];
  const current = tabs.indexOf(document.activeElement);
  if (current < 0) return;
  let next = current;
  if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
  if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
  if (event.key === "Home") next = 0;
  if (event.key === "End") next = tabs.length - 1;
  if (next !== current) {
    event.preventDefault();
    renderSampleMode(tabs[next].dataset.sampleMode, { focus: true });
  }
}

async function loadSample() {
  elements.sampleConsole.setAttribute("aria-busy", "true");
  elements.sampleError.hidden = true;
  elements.sampleModePanel.hidden = false;
  try {
    const response = await fetch(SAMPLE_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.sampleData = await response.json();
    const { source, priorStudy, scenario, wikiMapping } = state.sampleData;
    elements.sampleSourceKind.textContent = source.kind;
    elements.sampleArticles.textContent = `${source.articleFiles} 篇`;
    elements.sampleCharacters.textContent = `${new Intl.NumberFormat("zh-CN").format(source.approxCharacters)}`;
    elements.sampleCandidates.textContent = `${priorStudy.candidateUnits} 条`;
    elements.sampleSkills.textContent = "1 个";
    elements.sampleSkillName.textContent = priorStudy.formalSkill;
    elements.sampleRegression.textContent = `${priorStudy.syntheticRegression} 合成回归通过`;
    elements.sampleQuestionLabel.textContent = scenario.label;
    elements.sampleQuestion.textContent = scenario.question;
    elements.sampleSourceBoundary.textContent = `${source.boundary} ${priorStudy.boundary}`;
    renderWikiMapping(wikiMapping);
    renderSampleMode(state.sampleMode);
    elements.sampleConsole.setAttribute("aria-busy", "false");
  } catch (error) {
    console.error("Failed to load controlled sample", error);
    elements.sampleModePanel.hidden = true;
    elements.sampleError.hidden = false;
    elements.sampleConsole.setAttribute("aria-busy", "false");
  }
}

function originalUiSourceUrl(surface) {
  const path = surface.source.split("/").map(encodeURIComponent).join("/");
  return `https://github.com/nashsu/llm_wiki/blob/${state.originalUiData.commit}/${path}`;
}

function renderOriginalUi(surfaceId, { focus = false } = {}) {
  if (!state.originalUiData) return;
  const surface = state.originalUiData.surfaces.find((item) => item.id === surfaceId);
  if (!surface) return;
  state.originalUiMode = surface.id;

  document.querySelectorAll("[data-original-ui]").forEach((button) => {
    const selected = button.dataset.originalUi === surface.id;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  const activeTab = document.querySelector(`[data-original-ui="${surface.id}"]`);
  elements.originalUiPanel.setAttribute("aria-labelledby", activeTab.id);
  const targetLeft = activeTab.offsetLeft - (elements.originalUiTabs.clientWidth - activeTab.offsetWidth) / 2;
  elements.originalUiTabs.scrollTo({ left: Math.max(0, targetLeft), behavior: "instant" });
  if (focus) activeTab.focus();

  elements.originalUiImage.src = surface.image;
  elements.originalUiImage.alt = surface.alt;
  elements.originalUiImageLabel.textContent = surface.short.toUpperCase();
  elements.originalUiNumber.textContent = `${surface.number} / ${surface.short.toUpperCase()}`;
  elements.originalUiTitle.textContent = surface.title;
  elements.originalUiSummary.textContent = surface.summary;
  elements.originalUiOperation.textContent = surface.operation;
  elements.originalUiOutcome.textContent = surface.outcome;
  elements.originalUiSource.href = originalUiSourceUrl(surface);
  elements.originalUiSource.setAttribute("aria-label", `打开${surface.label}的固定版本原图`);

  elements.originalUiCapabilities.replaceChildren(...surface.capabilities.map((capability) => {
    const item = document.createElement("li");
    item.textContent = capability;
    return item;
  }));
}

function handleOriginalUiKeys(event) {
  if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
  const tabs = [...document.querySelectorAll("[data-original-ui]")];
  const current = tabs.indexOf(document.activeElement);
  if (current < 0) return;
  let next = current;
  if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
  if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
  if (event.key === "Home") next = 0;
  if (event.key === "End") next = tabs.length - 1;
  event.preventDefault();
  renderOriginalUi(tabs[next].dataset.originalUi, { focus: true });
}

async function loadOriginalUi() {
  elements.originalUiConsole.setAttribute("aria-busy", "true");
  elements.originalUiError.hidden = true;
  try {
    const response = await fetch(ORIGINAL_UI_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.originalUiData = await response.json();
    elements.originalUiBoundary.textContent = state.originalUiData.boundary;
    renderOriginalUi(state.originalUiMode);
    elements.originalUiConsole.hidden = false;
    elements.originalUiConsole.setAttribute("aria-busy", "false");
  } catch (error) {
    console.error("Failed to load upstream UI evidence", error);
    elements.originalUiConsole.hidden = true;
    elements.originalUiError.hidden = false;
    elements.originalUiConsole.setAttribute("aria-busy", "false");
  }
}

function formatDuration(milliseconds) {
  return `${new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(milliseconds / 1000)} 秒`;
}

function renderRealPage(path, { focus = false } = {}) {
  if (!state.realRunData) return;
  const page = state.realRunData.pages.find((item) => item.path === path);
  if (!page) return;
  state.selectedRealPage = path;

  elements.realPageList.querySelectorAll("button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.path === path));
  });
  const activeButton = [...elements.realPageList.querySelectorAll("button")]
    .find((button) => button.dataset.path === path);
  if (focus) activeButton?.focus();

  elements.realPageType.textContent = page.type;
  elements.realPagePath.textContent = page.path;
  elements.realPageTitle.textContent = page.title;
  elements.realPageExcerpt.textContent = page.excerpt || "该页面主要由结构信息组成。";
  elements.realPageSources.textContent = page.sources.length
    ? page.sources.join(" · ")
    : "无；索引与日志由应用确定性生成";
  elements.realPageLinks.textContent = page.wikilinks.length
    ? page.wikilinks.join(" · ")
    : "没有正文出链";
  elements.realPageSha.textContent = page.sha256.slice(0, 16);
}

function createRealPageButton(page) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.path = page.path;
  button.setAttribute("aria-pressed", String(page.path === state.selectedRealPage));
  const type = document.createElement("span");
  type.textContent = page.type;
  const title = document.createElement("strong");
  title.textContent = page.title;
  const meta = document.createElement("small");
  meta.textContent = `${page.sources.length} source · ${page.wikilinks.length} link`;
  button.append(type, title, meta);
  button.addEventListener("click", () => renderRealPage(page.path));
  return button;
}

function renderRealQuality(data) {
  const mergedReview = data.reviews.some((item) => item.description?.includes("---REVIEW:"));
  const staleIndex = data.pages.some((page) =>
    page.path === "wiki/index.md" && page.excerpt.includes("尚未摄取资料"));
  const attemptedReviews = mergedReview ? data.metrics.reviews + 1 : data.metrics.reviews;
  const findings = [
    {
      tone: "pass",
      label: "BOUNDARY",
      title: "合成边界被保留下来",
      detail: "来源页、案例页和实体页都明确声明：不是专栏原文，也不对应真实公司事故。",
    },
    {
      tone: "pass",
      label: "TRACEABILITY",
      title: `${data.metrics.sourcedPages} 个页面带来源`,
      detail: "主题页通过 sources[] 回到同一研究胶囊；索引和日志属于应用确定性产物。",
    },
    {
      tone: mergedReview ? "warn" : "pass",
      label: "REVIEW FORMAT",
      title: mergedReview ? `${attemptedReviews} 条建议只解析为 ${data.metrics.reviews} 项` : "Review 格式完整",
      detail: mergedReview
        ? "专项 Review 的第一块漏写 END 标记，导致下一块被并入描述；说明结构化输出仍需格式校验。"
        : "本次所有 Review 块都被上游解析器独立保留。",
    },
    {
      tone: data.lint.total ? "warn" : "pass",
      label: "STRUCTURAL LINT",
      title: `${data.lint.total} 个结构提示`,
      detail: data.lint.total
        ? `${data.lint.byType["no-outlinks"] || 0} 个页面无正文出链，${data.lint.byType.orphan || 0} 个孤立页；生成图谱可用，但还不够完整。`
        : "本次生成页面没有结构性 Lint 提示。",
    },
    {
      tone: staleIndex ? "warn" : "pass",
      label: "INDEX MERGE",
      title: staleIndex ? "索引更新了，但保留了旧种子文案" : "索引状态一致",
      detail: staleIndex
        ? "应用正确追加了 6 个 Recently Updated 条目，却没有移除“尚未摄取资料”；增量合并仍需人工检查。"
        : "索引内容与当前摄取状态一致。",
    },
  ];

  elements.realQualityGrid.replaceChildren(...findings.map((finding) => {
    const article = document.createElement("article");
    article.dataset.tone = finding.tone;
    const label = document.createElement("span");
    label.textContent = finding.label;
    const title = document.createElement("strong");
    title.textContent = finding.title;
    const detail = document.createElement("p");
    detail.textContent = finding.detail;
    article.append(label, title, detail);
    return article;
  }));
}

function renderRealRun(data) {
  elements.realRunConsole.dataset.status = data.status;
  elements.realRunStatus.textContent = data.statusLabel;
  elements.realRunEngine.textContent = `${data.engine.model} → ${data.engine.pipeline.split("::").pop()}`;
  elements.realElapsed.textContent = formatDuration(data.metrics.elapsedMs);
  elements.realCalls.textContent = `${data.metrics.codexCalls} 次`;
  elements.realPages.textContent = `${data.metrics.markdownPages} 个`;
  elements.realThematic.textContent = `${data.metrics.thematicPages} 个`;
  elements.realRelations.textContent = `${data.metrics.wikilinkRelations} 条`;
  elements.realReviews.textContent = `${data.metrics.reviews} 项`;

  const stageNames = ["结构分析", "Wiki 生成", "专项 Review"];
  elements.realCallList.replaceChildren(...data.calls.map((call, index) => {
    const item = document.createElement("li");
    const number = document.createElement("span");
    number.textContent = String(call.call).padStart(2, "0");
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = stageNames[index] || `模型调用 ${call.call}`;
    const detail = document.createElement("small");
    detail.textContent = `${new Intl.NumberFormat("zh-CN").format(call.inputTokens || 0)} input · ${new Intl.NumberFormat("zh-CN").format(call.outputTokens || 0)} output`;
    copy.append(title, detail);
    const duration = document.createElement("code");
    duration.textContent = formatDuration(call.elapsedMs);
    item.append(number, copy, duration);
    return item;
  }));

  const orderedPages = [...data.pages].sort((a, b) => {
    const order = ["案例", "概念", "方法", "原则", "来源", "实体", "索引", "日志"];
    return order.indexOf(a.type) - order.indexOf(b.type);
  });
  state.selectedRealPage = orderedPages.find((page) => page.type === "案例")?.path
    || orderedPages[0]?.path;
  elements.realPageList.replaceChildren(...orderedPages.map(createRealPageButton));
  renderRealPage(state.selectedRealPage);
  renderRealQuality(data);
}

function handleRealPageKeys(event) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  const buttons = [...elements.realPageList.querySelectorAll("button")];
  const current = buttons.indexOf(document.activeElement);
  if (current < 0) return;
  let next = current;
  if (event.key === "ArrowDown") next = (current + 1) % buttons.length;
  if (event.key === "ArrowUp") next = (current - 1 + buttons.length) % buttons.length;
  if (event.key === "Home") next = 0;
  if (event.key === "End") next = buttons.length - 1;
  event.preventDefault();
  renderRealPage(buttons[next].dataset.path, { focus: true });
}

async function loadRealRun() {
  elements.realRunConsole.setAttribute("aria-busy", "true");
  elements.realRunError.hidden = true;
  try {
    const response = await fetch(REAL_RUN_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.realRunData = await response.json();
    renderRealRun(state.realRunData);
    elements.realRunConsole.hidden = false;
    elements.realRunConsole.setAttribute("aria-busy", "false");
  } catch (error) {
    console.error("Failed to load real Codex ingest evidence", error);
    elements.realRunConsole.hidden = true;
    elements.realRunError.hidden = false;
    elements.realRunConsole.setAttribute("aria-busy", "false");
  }
}

async function loadCapabilities() {
  elements.error.hidden = true;
  elements.empty.hidden = true;
  elements.grid.hidden = false;
  elements.grid.setAttribute("aria-busy", "true");
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    const fromHash = capabilityFromHash();
    state.selectedId = fromHash?.id ?? state.data.capabilities[0].id;
    state.category = fromHash?.category ?? "all";
    renderFilters();
    renderCapabilities({ preserveSelection: true });
  } catch (error) {
    console.error("Failed to load capability evidence", error);
    elements.grid.hidden = true;
    elements.detail.hidden = true;
    elements.error.hidden = false;
    elements.count.textContent = "读取失败";
    elements.grid.setAttribute("aria-busy", "false");
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  elements.themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "切换为浅色主题" : "切换为深色主题",
  );
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    theme === "dark" ? "#101619" : "#f4f6f2",
  );
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("llm-wiki-study-theme", next);
  applyTheme(next);
}

let scrollFrame = null;
function updateScrollState() {
  scrollFrame = null;
  const scrollable = document.documentElement.scrollHeight - innerHeight;
  elements.progress.style.transform = `scaleX(${scrollable > 0 ? Math.min(scrollY / scrollable, 1) : 0})`;

  const links = [...document.querySelectorAll(".section-nav a")];
  const marker = Math.min(innerHeight * 0.4, 300);
  let currentId = links[0]?.hash.slice(1);
  links.forEach((link) => {
    const section = document.querySelector(link.hash);
    if (section && section.getBoundingClientRect().top <= marker) currentId = section.id;
  });
  links.forEach((link) => {
    if (link.hash === `#${currentId}`) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
}

function queueScrollUpdate() {
  if (scrollFrame === null) scrollFrame = requestAnimationFrame(updateScrollState);
}

elements.filters.addEventListener("keydown", handleFilterKeys);
elements.originalUiTabs.addEventListener("keydown", handleOriginalUiKeys);
document.querySelector(".sample-tabs").addEventListener("keydown", handleSampleTabKeys);
elements.realPageList.addEventListener("keydown", handleRealPageKeys);
document.querySelectorAll("[data-original-ui]").forEach((button) => {
  button.addEventListener("click", () => renderOriginalUi(button.dataset.originalUi));
});
document.querySelectorAll("[data-sample-mode]").forEach((button) => {
  button.addEventListener("click", () => renderSampleMode(button.dataset.sampleMode));
});
elements.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderCapabilities();
});
elements.reset.addEventListener("click", () => {
  state.query = "";
  elements.search.value = "";
  setCategory("all");
  elements.search.focus();
});
elements.retry.addEventListener("click", loadCapabilities);
elements.originalUiRetry.addEventListener("click", loadOriginalUi);
elements.sampleRetry.addEventListener("click", loadSample);
elements.realRunRetry.addEventListener("click", loadRealRun);
elements.themeToggle.addEventListener("click", toggleTheme);
addEventListener("scroll", queueScrollUpdate, { passive: true });
addEventListener("resize", queueScrollUpdate);
addEventListener("hashchange", () => {
  const item = capabilityFromHash();
  if (!item) return;
  state.query = "";
  elements.search.value = "";
  setCategory(item.category, { preserveSelection: true });
  selectCapability(item.id, { updateLocation: false });
});

applyTheme(document.documentElement.dataset.theme);
updateScrollState();
loadCapabilities();
loadOriginalUi();
loadSample();
loadRealRun();
