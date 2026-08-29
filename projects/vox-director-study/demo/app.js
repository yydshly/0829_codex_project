"use strict";

const commit = "668ec3946fe0139bc985313b15c1a300fca42f94";
const upstreamRaw = `https://raw.githubusercontent.com/Alisa0808/vox-director/${commit}/`;
const videoNegativePrompt = "不要生成文字、字母、数字、字幕、Logo 或水印；不要重绘主体；不要让人物、器物、路线或建筑变形；不要融化、跳变、闪烁、抽帧或突然增加新元素；保持手工纸张拼贴和矿物颜料质感；不要变成写实摄影、3D CGI 或现代舞台。";

const state = {
  data: null,
  modeIndex: 0,
  stageIndex: 0,
  sampleIndex: 0,
  prepData: null,
  prepLibrary: [],
  prepSampleIndex: 0,
  prepSample: null,
  prepViewIndex: 0,
  prepGates: {},
};

const byId = (id) => document.getElementById(id);

function setText(id, value) {
  const element = byId(id);
  if (element) element.textContent = value ?? "";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const button = byId("theme-button");
  button.setAttribute("aria-pressed", String(theme === "dark"));
  button.setAttribute("aria-label", theme === "dark" ? "切换为浅色主题" : "切换为深色主题");
}

function initializeTheme() {
  const saved = localStorage.getItem("vox-director-theme");
  const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(saved === "dark" || saved === "light" ? saved : preferred);
  byId("theme-button").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("vox-director-theme", next);
    applyTheme(next);
  });
}

function renderMetrics(data) {
  setText("metric-python", data.repository.python_files);
  setText("metric-videos", data.repository.bundled_videos);
  setText("metric-modes", data.modes.length);
  setText("metric-tests", data.repository.bundled_tests);

  const metrics = [
    [data.repository.file_count, "上游文件"],
    [data.repository.python_files, "Python 脚本"],
    [data.repository.bundled_videos, "随库 MP4"],
    [`${Math.round(data.repository.bundled_video_seconds)}s`, "视频总时长"],
    [data.repository.bundled_tests, "上游测试"],
  ];
  const root = byId("audit-metrics");
  root.replaceChildren(...metrics.map(([value, label]) => {
    const item = document.createElement("div");
    const strong = document.createElement("strong");
    const span = document.createElement("span");
    strong.textContent = value;
    span.textContent = label;
    item.append(strong, span);
    return item;
  }));
}

function renderComparison(data) {
  const hand = data.comparison.hand_drawn;
  const vox = data.comparison.vox_director;
  setText("hand-name", hand.name);
  setText("hand-role", hand.role);
  setText("hand-output", hand.output);
  setText("hand-stop", hand.stops_at);
  setText("vox-name", vox.name);
  setText("vox-role", vox.role);
  setText("vox-output", vox.output);
  setText("vox-stop", vox.continues_with);
}

function renderModeTabs(data) {
  const tabs = byId("mode-tabs");
  tabs.replaceChildren(...data.modes.map((mode, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mode-tab";
    button.id = `mode-tab-${mode.id}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", "mode-console");
    button.setAttribute("aria-selected", String(index === state.modeIndex));
    button.tabIndex = index === state.modeIndex ? 0 : -1;
    button.innerHTML = `<span>${mode.short}-ROLL / ${String(index + 1).padStart(2, "0")}</span><strong>${mode.name}</strong>`;
    button.addEventListener("click", () => selectMode(index));
    button.addEventListener("keydown", (event) => handleTabKeys(event, index));
    return button;
  }));
}

function handleTabKeys(event, index) {
  const count = state.data.modes.length;
  let next = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % count;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + count) % count;
  if (event.key === "Home") next = 0;
  if (event.key === "End") next = count - 1;
  if (next === null) return;
  event.preventDefault();
  selectMode(next);
  byId(`mode-tab-${state.data.modes[next].id}`).focus();
}

function selectMode(index) {
  state.modeIndex = index;
  state.stageIndex = 0;
  renderModeTabs(state.data);
  renderMode(state.data.modes[index]);
}

function renderMode(mode) {
  setText("mode-name", mode.name);
  setText("mode-input", mode.input);
  setText("mode-promise", mode.promise);
  setText("mode-output", mode.output);
  setText("mode-evidence", mode.evidence);
  setText("mode-boundary", mode.boundary);

  const list = byId("stage-list");
  list.replaceChildren(...mode.stages.map((stage, index) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "stage-button";
    button.setAttribute("aria-current", index === state.stageIndex ? "step" : "false");
    button.textContent = `${String(index + 1).padStart(2, "0")} ${stage.label}`;
    button.addEventListener("click", () => {
      state.stageIndex = index;
      renderMode(mode);
    });
    li.append(button);
    return li;
  }));
  renderStage(mode.stages[state.stageIndex], state.stageIndex, mode.stages.length);
}

function renderStage(stage, index, count) {
  setText("stage-count", `${String(index + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`);
  setText("stage-kind", stage.kind);
  setText("stage-script", stage.script);
  setText("stage-label", stage.label);
  setText("stage-copy", stage.detail);
}

function sampleAssetLink(sample) {
  return sample.source_file ? `${upstreamRaw}${sample.source_file}` : "";
}

function renderSampleRail(data) {
  const rail = byId("sample-rail");
  rail.replaceChildren(...data.samples.map((sample, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sample-button";
    button.setAttribute("aria-pressed", String(index === state.sampleIndex));
    button.setAttribute("aria-label", `查看样例：${sample.title}`);
    const image = document.createElement("img");
    image.src = sample.poster;
    image.alt = "";
    const label = document.createElement("span");
    label.textContent = sample.title;
    button.append(image, label);
    button.addEventListener("click", () => {
      state.sampleIndex = index;
      renderSampleRail(data);
      renderSample(sample);
    });
    return button;
  }));
}

function renderSample(sample) {
  setText("sample-proof", sample.proof);
  setText("sample-title", sample.title);
  setText("sample-subtitle", sample.subtitle);
  setText("sample-source", sample.source_file || "未随仓库提交");
  setText("sample-example", sample.example_file || "未提供对应 beats.json");

  const video = byId("sample-video");
  const posterOnly = byId("poster-only");
  const posterImage = byId("poster-only-image");
  const link = byId("sample-link");
  const assetLink = sampleAssetLink(sample);
  video.pause();
  video.removeAttribute("src");
  video.poster = sample.poster;

  if (sample.video) {
    posterOnly.hidden = true;
    video.hidden = false;
    video.src = sample.video;
    video.dataset.sample = sample.id;
    link.href = assetLink;
    link.removeAttribute("aria-disabled");
    link.textContent = "打开固定提交中的原始资产 ↗";
  } else {
    video.hidden = true;
    posterOnly.hidden = false;
    posterImage.src = sample.poster;
    posterImage.alt = `${sample.title}上游缩略图`;
    link.href = assetLink || "#";
    link.setAttribute("aria-disabled", "true");
    link.textContent = "没有仓库内 MP4 可打开";
  }
}

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value));
}

function prepRoute() {
  return state.prepData.routes.find((route) => route.id === byId("prep-route").value) || state.prepData.routes[0];
}

function totalPrepDuration() {
  return state.prepSample.beats.reduce(
    (total, beat) => total + beat.shots.reduce((sum, shot) => sum + Number(shot.duration || 0), 0),
    0,
  );
}

function scalePrepDuration(target) {
  const shots = state.prepSample.beats.flatMap((beat) => beat.shots);
  const current = shots.reduce((sum, shot) => sum + Number(shot.duration || 0), 0);
  if (!shots.length || !current || !Number.isFinite(target)) return;
  let used = 0;
  shots.forEach((shot, index) => {
    const duration = index === shots.length - 1
      ? Math.max(1, Math.round((target - used) * 10) / 10)
      : Math.max(1, Math.round((Number(shot.duration) / current) * target * 10) / 10);
    shot.duration = duration;
    used += duration;
  });
}

function prepAssets(route, pack) {
  const shots = pack.beats.flatMap((beat) => beat.shots);
  const withReferences = shots.filter((shot) => shot.reference_image).length;
  const completeScripts = shots.filter((shot) => shot.scene && shot.motion_prompt).length;
  const generatedKeyframes = pack.source.keyframe_generator === "Codex built-in imagegen";
  const items = [
    { name: "主题与受众 Brief", detail: pack.project.topic, state: pack.project.topic ? "READY" : "MISSING" },
    { name: "逐镜头脚本", detail: `${completeScripts}/${shots.length} 个镜头含画面与运动描述`, state: completeScripts === shots.length ? "READY" : "EDIT" },
  ];
  if (["image-to-video", "first-last-frame", "reference-to-video"].includes(route.id)) {
    items.push(generatedKeyframes
      ? { name: "Codex 关键帧", detail: `${withReferences}/${shots.length} 张本地关键帧已生成；可直接交给视频模型`, state: withReferences === shots.length ? "READY" : "MISSING" }
      : { name: "关键帧 / 参考图", detail: `${withReferences}/${shots.length} 个镜头带上游参考；改主题时必须替换`, state: withReferences === shots.length ? "REPLACE" : "MISSING" });
  }
  if (route.id === "first-last-frame") {
    items.push({ name: "尾帧", detail: `需要为 ${shots.length} 个镜头准备 end_frame`, state: "MISSING" });
  }
  items.push(
    { name: "确定性文字层", detail: "标题、中文、数字和 Logo 建议在生成后叠加", state: "PLAN" },
    { name: "旁白与字幕", detail: `${pack.beats.length} 段旁白需要录制、TTS 或人工配音`, state: "PLAN" },
    { name: "音乐与音效", detail: "先确定节奏、授权与响度目标，再进入混音", state: "PLAN" },
    { name: "模型参数映射", detail: `${route.required.join(" · ")} → ${pack.project.model}`, state: "MAP" },
  );
  return items;
}

function makePrepPack() {
  const route = prepRoute();
  const source = state.prepLibrary[state.prepSampleIndex];
  const topic = byId("prep-topic").value.trim();
  const aspect = byId("prep-aspect").value;
  const model = byId("prep-model").value.trim() || "待选择的视频模型";
  const adapted = topic !== source.topic;
  const beats = state.prepSample.beats.map((beat) => ({
    id: beat.id,
    title: beat.title,
    narration: beat.narration,
    background: beat.background,
    feel: beat.feel,
    shots: beat.shots.map((shot) => {
      const inputs = {
        scene: shot.scene,
        still_prompt: shot.still_prompt,
        motion_prompt: shot.motion_prompt,
        duration: Number(shot.duration),
        aspect,
        reference_image: shot.reference_image,
        reference_video: shot.reference_video,
        end_frame: "",
        negative_prompt: "no baked-in text; no identity drift; no layout warping; no flicker",
      };
      return {
        id: shot.id,
        ...inputs,
        model_task: {
          route: route.id,
          target_model: model,
          required_inputs: route.required,
          optional_inputs: route.optional,
          missing_required: route.required.filter((field) => !inputs[field]),
        },
      };
    }),
  }));
  const pack = {
    schema: state.prepData.schema,
    source: {
      upstream_commit: state.prepData.generated_from_commit,
      structural_sample: source.id,
      example_file: source.source_file,
      content_status: adapted
        ? "requires-manual-rewrite"
        : source.kind === "research-demonstration" ? "research-demonstration-ready" : "sample-content-loaded",
      keyframe_generator: source.keyframe_generator || "upstream-or-not-provided",
      video_generation_status: source.video_generation_status || "not-run",
      video_dispatch_file: source.video_dispatch_file || "",
      notice: source.kind === "research-demonstration"
        ? "本预案由 Research Lab 基于上游结构编写；6 张关键帧由 Codex 内置图片模型生成，视频尚未生成。"
        : state.prepData.notice,
    },
    project: {
      topic,
      aspect,
      duration_seconds: Math.round(totalPrepDuration() * 10) / 10,
      language: source.language,
      route: route.id,
      route_name: route.name,
      model,
    },
    adaptation_instruction: adapted
      ? `只借用「${source.label}」的节奏结构。请围绕「${topic}」逐段重写 title、narration、scene、still_prompt 与 motion_prompt，并逐项人工核验。`
      : source.kind === "research-demonstration"
        ? "当前示范已完成前期脚本与 6 张关键帧；请把每张 reference_image 连同对应 motion_prompt 交给图生视频模型。"
        : "当前加载的是上游样例原稿；投入新项目之前仍需核验事实、权利与模型参数。",
    human_gates: state.prepData.human_gates.map((gate) => ({ ...gate, approved: Boolean(state.prepGates[gate.id]) })),
    beats,
  };
  pack.asset_checklist = prepAssets(route, pack);
  return pack;
}

function renderPrepBadges(pack) {
  byId("prep-badges").replaceChildren(...[
    `${pack.beats.length} BEATS`,
    `${pack.beats.flatMap((beat) => beat.shots).length} SHOTS`,
    `${pack.project.duration_seconds}s`,
    pack.project.aspect,
  ].map((label) => {
    const badge = document.createElement("span");
    badge.textContent = label;
    return badge;
  }));
}

function renderPrepAssets(pack) {
  byId("asset-checklist").replaceChildren(...pack.asset_checklist.map((item, index) => {
    const article = document.createElement("article");
    article.className = "asset-item";
    const number = document.createElement("b");
    const body = document.createElement("div");
    const title = document.createElement("strong");
    const detail = document.createElement("span");
    const status = document.createElement("em");
    number.textContent = String(index + 1).padStart(2, "0");
    title.textContent = item.name;
    detail.textContent = item.detail;
    status.textContent = item.state;
    body.append(title, detail);
    article.append(number, body, status);
    return article;
  }));
}

function renderHumanGates() {
  byId("human-gate-list").replaceChildren(...state.prepData.human_gates.map((gate) => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    const text = document.createElement("span");
    input.type = "checkbox";
    input.checked = Boolean(state.prepGates[gate.id]);
    input.addEventListener("change", () => {
      state.prepGates[gate.id] = input.checked;
      refreshPrepDerived();
    });
    text.textContent = gate.label;
    label.append(input, text);
    return label;
  }));
}

function refreshPrepDerived(statusMessage = "准备包已在本地更新") {
  const pack = makePrepPack();
  const source = state.prepLibrary[state.prepSampleIndex];
  const adapted = pack.source.content_status === "requires-manual-rewrite";
  setText("prep-pack-title", source.label);
  renderPrepBadges(pack);
  renderPrepAssets(pack);
  byId("prep-json").textContent = JSON.stringify(pack, null, 2);
  const warning = byId("adaptation-warning");
  warning.dataset.status = adapted ? "rewrite" : "ready";
  warning.textContent = adapted
    ? "主题已变化：当前镜头仍是结构参考，请在下方逐项重写；导出包会标记 requires-manual-rewrite。"
    : source.kind === "research-demonstration"
      ? "研究示范已载入：前期预案和 6 张 Codex 关键帧已完成；视频尚未生成，请按逐镜头运动提示交给你的视频模型。"
      : "当前载入上游样例原稿。它可直接用于研究，但正式生产前仍需事实、权利与模型参数复核。";
  refreshDispatchPreviews();
  setText("prep-status", statusMessage);
  return pack;
}

function textEditor(labelText, value, onInput, rows = 3) {
  const label = document.createElement("label");
  const text = document.createElement("span");
  const input = document.createElement("textarea");
  text.className = "editor-label";
  text.textContent = labelText;
  input.rows = rows;
  input.value = value || "";
  input.addEventListener("input", () => {
    onInput(input.value);
    refreshPrepDerived();
  });
  label.append(text, input);
  return label;
}

function directDispatchShots() {
  if (!state.prepSample) return [];
  return state.prepSample.beats
    .flatMap((beat) => beat.shots)
    .filter((shot) => shot.reference_image?.startsWith("assets/"));
}

function makeShotDispatchText(shot) {
  const aspect = byId("prep-aspect")?.value || state.prepSample?.aspect || "9:16";
  return [
    `【${shot.id}｜图生视频任务】`,
    `关键帧：${shot.id}.png（请先上传，并将它作为严格首帧）`,
    `参数：${aspect}｜${shot.duration} 秒`,
    "",
    "完整视频提示词：",
    `保持输入关键帧的主体、构图、纸张材质和矿物配色。画面内容：${shot.scene}。${shot.motion_prompt}`,
    "",
    "负向提示词：",
    videoNegativePrompt,
  ].join("\n");
}

function makeAllDispatchText() {
  return directDispatchShots().map(makeShotDispatchText).join("\n\n━━━━━━━━━━━━━━━━━━━━\n\n");
}

function refreshDispatchPreviews() {
  directDispatchShots().forEach((shot) => {
    const preview = document.querySelector(`[data-dispatch-preview="${shot.id}"]`);
    if (preview) preview.textContent = makeShotDispatchText(shot);
  });
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }
}

function showCopyFeedback(button, success, successLabel, failureLabel) {
  const original = button.dataset.originalLabel || button.textContent;
  button.dataset.originalLabel = original;
  button.textContent = success ? "已复制 ✓" : "复制失败";
  button.dataset.copyState = success ? "success" : "error";
  setText("prep-status", success ? successLabel : failureLabel);
  window.setTimeout(() => {
    if (!button.isConnected) return;
    button.textContent = original;
    delete button.dataset.copyState;
  }, 1800);
}

async function copyShotDispatch(shot, button) {
  const copied = await writeClipboard(makeShotDispatchText(shot));
  showCopyFeedback(button, copied, `${shot.id} 完整视频提示词已复制`, `${shot.id} 复制失败，请手动选择任务卡文本`);
}

async function copyAllShotDispatches() {
  const button = byId("copy-all-shots");
  const shots = directDispatchShots();
  const copied = shots.length > 0 && await writeClipboard(makeAllDispatchText());
  showCopyFeedback(button, copied, `全部 ${shots.length} 个视频任务已复制`, "复制失败，请逐镜头复制");
}

function createDispatchCard(shot) {
  const card = document.createElement("section");
  const head = document.createElement("div");
  const heading = document.createElement("div");
  const eyebrow = document.createElement("span");
  const title = document.createElement("strong");
  const button = document.createElement("button");
  const help = document.createElement("p");
  const preview = document.createElement("pre");
  card.className = "dispatch-card";
  card.setAttribute("aria-label", `${shot.id} 视频模型直接输入`);
  head.className = "dispatch-card-head";
  eyebrow.textContent = "VIDEO MODEL READY";
  title.textContent = "这一整块可以直接复制";
  button.type = "button";
  button.className = "button button-primary dispatch-copy-button";
  button.dataset.copyShot = shot.id;
  button.textContent = "复制本镜头";
  button.setAttribute("aria-label", `复制 ${shot.id} 完整视频提示词`);
  button.addEventListener("click", () => copyShotDispatch(shot, button));
  help.textContent = "先把上面的关键帧上传给视频模型，再粘贴下面全部文字。";
  preview.dataset.dispatchPreview = shot.id;
  preview.tabIndex = 0;
  preview.textContent = makeShotDispatchText(shot);
  heading.append(eyebrow, title);
  head.append(heading, button);
  card.append(head, help, preview);
  return card;
}

function renderPrepEditor() {
  const dispatchShots = directDispatchShots();
  const toolbar = byId("dispatch-toolbar");
  toolbar.hidden = dispatchShots.length === 0;
  byId("copy-all-shots").textContent = `复制全部 ${dispatchShots.length} 镜头`;
  byId("prep-editor").replaceChildren(...state.prepSample.beats.map((beat, beatIndex) => {
    const article = document.createElement("article");
    article.className = "beat-editor";
    const head = document.createElement("div");
    head.className = "beat-editor-head";
    const beatId = document.createElement("span");
    const title = document.createElement("input");
    beatId.textContent = beat.id;
    title.value = beat.title;
    title.setAttribute("aria-label", `${beat.id} 标题`);
    title.addEventListener("input", () => {
      beat.title = title.value;
      refreshPrepDerived();
    });
    head.append(beatId, title);
    const narration = document.createElement("div");
    narration.className = "narration-editor";
    narration.append(textEditor("旁白 / NARRATION", beat.narration, (value) => { beat.narration = value; }, 3));
    article.append(head, narration);

    beat.shots.forEach((shot, shotIndex) => {
      const details = document.createElement("details");
      details.className = "shot-editor";
      details.open = beatIndex === 0 && shotIndex === 0;
      const summary = document.createElement("summary");
      const name = document.createElement("strong");
      const meta = document.createElement("span");
      name.textContent = shot.id;
      meta.textContent = `${shot.duration}s · ${shot.still_prompt_source}`;
      summary.append(name, meta);
      const fields = document.createElement("div");
      fields.className = "shot-fields";
      if (shot.reference_image?.startsWith("assets/")) {
        const keyframe = document.createElement("figure");
        const image = document.createElement("img");
        const caption = document.createElement("figcaption");
        keyframe.className = "generated-keyframe";
        image.src = shot.reference_image;
        image.alt = `${shot.id} 敦煌示范关键帧`;
        image.loading = "eager";
        caption.textContent = `CODEX 关键帧 · ${shot.id} · 可作为图生视频首帧`;
        keyframe.append(image, caption);
        fields.append(keyframe);
        fields.append(createDispatchCard(shot));
      }
      const durationLabel = document.createElement("label");
      const durationText = document.createElement("span");
      const duration = document.createElement("input");
      durationLabel.className = "duration-field";
      durationText.className = "editor-label";
      durationText.textContent = "镜头时长 / 秒";
      duration.type = "number";
      duration.min = "1";
      duration.max = "30";
      duration.step = "0.5";
      duration.value = shot.duration;
      duration.addEventListener("change", () => {
        shot.duration = Math.max(1, Number(duration.value) || 1);
        byId("prep-duration").value = Math.round(totalPrepDuration() * 10) / 10;
        meta.textContent = `${shot.duration}s · ${shot.still_prompt_source}`;
        refreshDispatchPreviews();
        refreshPrepDerived();
      });
      durationLabel.append(durationText, duration);
      const origin = document.createElement("p");
      origin.className = "prompt-origin";
      origin.textContent = shot.still_prompt_source === "upstream"
        ? "静帧 Prompt 来自固定上游样例"
        : shot.still_prompt_source === "codex-built-in-imagegen"
          ? "关键帧已由 Codex 内置图片模型生成；视频尚未生成"
          : "上游未提供静帧 Prompt；当前值由 scene 归一化而来";
      fields.append(
        durationLabel,
        textEditor("画面任务 / SCENE", shot.scene, (value) => { shot.scene = value; refreshDispatchPreviews(); }),
        textEditor("静帧提示 / STILL PROMPT", shot.still_prompt, (value) => { shot.still_prompt = value; }, 5),
        textEditor("运镜与元素运动 / MOTION PROMPT", shot.motion_prompt, (value) => { shot.motion_prompt = value; refreshDispatchPreviews(); }),
        origin,
      );
      details.append(summary, fields);
      article.append(details);
    });
    return article;
  }));
}

function renderRouteNote() {
  const route = prepRoute();
  byId("route-note").innerHTML = `<strong>${route.name}</strong>${route.best_for}<br>必需字段：${route.required.join(" · ")}`;
}

function loadPrepSample(index) {
  state.prepSampleIndex = index;
  state.prepSample = deepCopy(state.prepLibrary[index]);
  state.prepGates = {};
  const source = state.prepLibrary[index];
  byId("prep-sample").value = source.id;
  byId("prep-topic").value = source.topic;
  byId("prep-aspect").value = source.aspect;
  byId("prep-duration").value = source.timeline_seconds;
  byId("prep-route").value = source.default_route || "image-to-video";
  byId("prep-model").value = source.target_model || "待选择的视频模型";
  renderPrepEditor();
  renderHumanGates();
  renderRouteNote();
  refreshPrepDerived("已载入上游结构样例");
}

function selectPrepView(index, focus = false) {
  state.prepViewIndex = index;
  const names = ["shots", "assets", "json"];
  names.forEach((name, current) => {
    const tab = byId(`prep-tab-${name}`);
    const panel = byId(`prep-panel-${name}`);
    const selected = current === index;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    panel.hidden = !selected;
  });
  if (focus) byId(`prep-tab-${names[index]}`).focus();
}

function prepTabKeydown(event, index) {
  const count = 3;
  let next = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % count;
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + count) % count;
  if (event.key === "Home") next = 0;
  if (event.key === "End") next = count - 1;
  if (next === null) return;
  event.preventDefault();
  selectPrepView(next, true);
}

async function copyPrepPack() {
  const json = JSON.stringify(makePrepPack(), null, 2);
  const copied = await writeClipboard(json);
  setText("prep-status", copied ? "JSON 已复制到剪贴板" : "复制失败，请在 JSON 视图手动复制");
}

function downloadPrepPack() {
  const pack = makePrepPack();
  const blob = new Blob([`${JSON.stringify(pack, null, 2)}\n`], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${pack.source.structural_sample}-preproduction-pack.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  setText("prep-status", `已下载 ${link.download}`);
}

function initializePreproduction(data) {
  state.prepData = data;
  state.prepLibrary = [...(data.demonstrations || []), ...data.samples];
  const sampleSelect = byId("prep-sample");
  sampleSelect.replaceChildren(...state.prepLibrary.map((sample) => {
    const option = document.createElement("option");
    option.value = sample.id;
    const prefix = sample.kind === "research-demonstration" ? "研究示范 / " : "上游结构 / ";
    option.textContent = `${prefix}${sample.label} · ${sample.beat_count} beats / ${sample.shot_count} shots`;
    return option;
  }));
  const routeSelect = byId("prep-route");
  routeSelect.replaceChildren(...data.routes.map((route) => {
    const option = document.createElement("option");
    option.value = route.id;
    option.textContent = route.name;
    return option;
  }));
  sampleSelect.addEventListener("change", () => loadPrepSample(state.prepLibrary.findIndex((sample) => sample.id === sampleSelect.value)));
  routeSelect.addEventListener("change", () => {
    renderRouteNote();
    refreshPrepDerived("生成路线已更新");
  });
  ["prep-topic", "prep-aspect", "prep-model"].forEach((id) => {
    byId(id).addEventListener("input", () => refreshPrepDerived());
    byId(id).addEventListener("change", () => refreshPrepDerived());
  });
  byId("prep-form").addEventListener("submit", (event) => {
    event.preventDefault();
    scalePrepDuration(Number(byId("prep-duration").value));
    renderPrepEditor();
    refreshPrepDerived("时长与参数已应用到所有镜头");
  });
  byId("prep-reset").addEventListener("click", () => loadPrepSample(state.prepSampleIndex));
  ["shots", "assets", "json"].forEach((name, index) => {
    const tab = byId(`prep-tab-${name}`);
    tab.addEventListener("click", () => selectPrepView(index));
    tab.addEventListener("keydown", (event) => prepTabKeydown(event, index));
  });
  byId("prep-copy").addEventListener("click", copyPrepPack);
  byId("copy-all-shots").addEventListener("click", copyAllShotDispatches);
  byId("prep-download").addEventListener("click", downloadPrepPack);
  const requestedDemo = new URLSearchParams(location.search).get("demo");
  const requestedIndex = requestedDemo
    ? state.prepLibrary.findIndex((sample) => sample.id === `${requestedDemo}-30s` || sample.id === requestedDemo)
    : -1;
  loadPrepSample(requestedIndex >= 0 ? requestedIndex : 1);
}

function renderScenarios(data) {
  const build = (items, prefix) => items.map((item, index) => {
    const article = document.createElement("article");
    article.className = "scenario-item";
    const number = document.createElement("b");
    const content = document.createElement("div");
    const title = document.createElement("strong");
    const copy = document.createElement("p");
    number.textContent = `${prefix}${String(index + 1).padStart(2, "0")}`;
    title.textContent = item.name;
    copy.textContent = item.why;
    content.append(title, copy);
    article.append(number, content);
    return article;
  });
  byId("fit-list").replaceChildren(...build(data.scenarios.fit, "+"));
  byId("avoid-list").replaceChildren(...build(data.scenarios.avoid, "!"));
}

function renderRisks(data) {
  byId("risk-list").replaceChildren(...data.risks.map((risk, index) => {
    const li = document.createElement("li");
    const number = document.createElement("b");
    const text = document.createElement("span");
    number.textContent = `R${String(index + 1).padStart(2, "0")}`;
    text.textContent = risk;
    li.append(number, text);
    return li;
  }));
}

function renderRoadmap(data) {
  byId("roadmap-list").replaceChildren(...data.extensions.map((item) => {
    const li = document.createElement("li");
    li.dataset.priority = item.priority;
    const badge = document.createElement("span");
    const content = document.createElement("div");
    const title = document.createElement("strong");
    const copy = document.createElement("p");
    badge.textContent = item.priority;
    title.textContent = item.name;
    copy.textContent = item.value;
    content.append(title, copy);
    li.append(badge, content);
    return li;
  }));
}

function renderMeaning(data) {
  setText("meaning-headline", data.meaning.headline);
  setText("recommendation", data.meaning.recommendation);
  byId("meaning-points").replaceChildren(...data.meaning.points.map((point) => {
    const li = document.createElement("li");
    li.textContent = point;
    return li;
  }));
}

function initialize(data) {
  state.data = data;
  renderMetrics(data);
  renderComparison(data);
  renderModeTabs(data);
  renderMode(data.modes[state.modeIndex]);
  renderSampleRail(data);
  renderSample(data.samples[state.sampleIndex]);
  renderScenarios(data);
  renderRisks(data);
  renderRoadmap(data);
  renderMeaning(data);
  document.documentElement.dataset.ready = "true";
}

async function loadData() {
  const params = new URLSearchParams(location.search);
  const source = params.has("data-error") ? "assets/missing-research-data.json" : "assets/research-data.json";
  try {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    initialize(await response.json());
    try {
      const prepSource = params.has("prep-error") ? "assets/missing-preproduction-data.json" : "assets/preproduction-data.json";
      const prepResponse = await fetch(prepSource, { cache: "no-store" });
      if (!prepResponse.ok) throw new Error(`HTTP ${prepResponse.status}`);
      initializePreproduction(await prepResponse.json());
    } catch (error) {
      byId("prep-error").hidden = false;
      console.warn("Preproduction data unavailable:", error.message);
    }
  } catch (error) {
    byId("error-panel").hidden = false;
    document.documentElement.dataset.ready = "error";
    console.warn("Research data unavailable:", error.message);
  }
}

initializeTheme();
loadData();
