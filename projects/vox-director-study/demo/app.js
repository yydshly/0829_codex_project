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
  caseHashApplied: false,
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
  const completedVideos = shots.filter((shot) => shot.reference_video?.startsWith("assets/")).length;
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
    if (generatedKeyframes) {
      items.push({ name: "已生成视频", detail: `${completedVideos}/${shots.length} 个本地镜头视频已回填；逐镜头查看独立复核结论`, state: completedVideos ? "REVIEW" : "MISSING" });
    }
  }
  if (pack.rough_cut) {
    items.push({ name: "30 秒画面粗剪", detail: `${pack.rough_cut.version} · ${pack.rough_cut.duration_seconds}s · ${pack.rough_cut.dimensions} · 静音 AAC 占位轨`, state: "REVIEW" });
    if (pack.rough_cut.sound_preview) {
      items.push({ name: pack.case_closure?.status === "completed" ? "30 秒最终声音版" : "30 秒声音试听", detail: `${pack.rough_cut.sound_preview.version} · ${pack.rough_cut.sound_preview.voice} · 原创程序化环境声`, state: pack.case_closure?.status === "completed" ? "DONE" : "REVIEW" });
    }
  }
  if (route.id === "first-last-frame") {
    items.push({ name: "尾帧", detail: `需要为 ${shots.length} 个镜头准备 end_frame`, state: "MISSING" });
  }
  items.push(
    { name: "确定性文字层", detail: "标题、中文、数字和 Logo 建议在生成后叠加", state: "PLAN" },
    { name: "旁白与字幕", detail: pack.case_closure?.status === "completed" ? `${pack.beats.length} 段神经网络旁白与 SRT 已交付；字幕未烧录` : `${pack.beats.length} 段旁白需要录制、TTS 或人工配音`, state: pack.case_closure?.status === "completed" ? "DONE" : "PLAN" },
    { name: "音乐与音效", detail: pack.case_closure?.status === "completed" ? "程序化环境声、ducking 与响度混音已完成；未使用外部采样" : "先确定节奏、授权与响度目标，再进入混音", state: pack.case_closure?.status === "completed" ? "DONE" : "PLAN" },
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
        previous_versions: shot.previous_versions || [],
        video_review: shot.video_review || null,
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
      completed_video_count: source.completed_video_count || 0,
      video_dispatch_file: source.video_dispatch_file || "",
      notice: source.kind === "research-demonstration"
        ? `本预案由 Research Lab 基于上游结构编写；6 张关键帧由 Codex 内置图片模型生成，${source.completed_video_count || 0}/6 个用户视频已回填，最终 V2 已完成。`
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
        ? "当前示范已完成最终 V2；如需复用结构，可把每张 reference_image 连同对应 motion_prompt 交给其他图生视频模型。"
        : "当前加载的是上游样例原稿；投入新项目之前仍需核验事实、权利与模型参数。",
    human_gates: state.prepData.human_gates.map((gate) => ({ ...gate, approved: Boolean(state.prepGates[gate.id]) })),
    rough_cut: adapted ? null : source.rough_cut || null,
    case_closure: adapted ? null : source.case_closure || null,
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

function renderRoughCut(source, adapted) {
  const root = byId("rough-cut-preview");
  const roughCut = adapted ? null : source.rough_cut;
  root.replaceChildren();
  root.hidden = !roughCut;
  if (!roughCut) return;

  const head = document.createElement("header");
  const heading = document.createElement("div");
  const kicker = document.createElement("span");
  const title = document.createElement("h3");
  const status = document.createElement("strong");
  const grid = document.createElement("div");
  const media = document.createElement("div");
  const video = document.createElement("video");
  const fallback = document.createElement("p");
  const copy = document.createElement("div");
  const specs = document.createElement("p");
  const provenance = document.createElement("div");
  const materialSource = document.createElement("p");
  const assemblySource = document.createElement("p");
  const audio = document.createElement("p");
  const order = document.createElement("p");
  const actions = document.createElement("div");
  const downloadVideo = document.createElement("a");
  const downloadSrt = document.createElement("a");

  head.className = "rough-cut-head";
  kicker.className = "rough-cut-kicker";
  kicker.textContent = "PICTURE ROUGH CUT / 01";
  title.textContent = roughCut.title;
  status.className = "rough-cut-status";
  status.textContent = `${roughCut.version.toUpperCase()} · 画面粗剪待声音决策`;
  heading.append(kicker, title);
  head.append(heading, status);

  grid.className = "rough-cut-grid";
  media.className = "rough-cut-media";
  video.src = roughCut.reference_video;
  video.poster = "assets/dunhuang/B01-S01.png";
  video.controls = true;
  video.preload = "metadata";
  video.playsInline = true;
  video.setAttribute("aria-label", "敦煌 30 秒画面粗剪播放器");
  fallback.className = "rough-cut-fallback";
  fallback.hidden = true;
  fallback.textContent = "30 秒粗剪没有加载成功；六段原始镜头、旁白时间稿和下载信息仍然保留，请确认发布资产后重试。";
  video.addEventListener("error", () => { fallback.hidden = false; });
  media.append(video, fallback);

  copy.className = "rough-cut-copy";
  specs.className = "rough-cut-specs";
  specs.textContent = `${roughCut.duration_seconds}s · ${roughCut.dimensions} · ${roughCut.fps}fps · ${roughCut.video_codec.toUpperCase()} / ${roughCut.audio_codec.toUpperCase()}`;
  provenance.className = "rough-cut-provenance";
  materialSource.dataset.source = "rough-cut-materials";
  materialSource.textContent = "画面素材：用户外部模型生成的 6 段当前通过视频";
  assemblySource.dataset.source = "rough-cut-assembly";
  assemblySource.textContent = "粗剪合成：Codex / Research Lab 使用 FFmpeg；非原库本次执行";
  provenance.append(materialSource, assemblySource);
  audio.innerHTML = `<strong>声音边界：</strong>静音双声道 AAC 占位轨；未生成旁白、音乐或音效。`;
  order.innerHTML = `<strong>镜头顺序：</strong>${roughCut.shot_order.join(" → ")}；每段 5 秒硬切。`;
  actions.className = "rough-cut-actions";
  downloadVideo.className = "button button-primary";
  downloadVideo.href = roughCut.reference_video;
  downloadVideo.download = "dunhuang-rough-cut-v1.mp4";
  downloadVideo.textContent = "下载 30 秒粗剪";
  downloadSrt.className = "button button-secondary";
  downloadSrt.href = roughCut.narration_subtitles;
  downloadSrt.download = "dunhuang-narration-v1.srt";
  downloadSrt.textContent = "下载旁白时间稿";
  actions.append(downloadVideo, downloadSrt);
  copy.append(specs, provenance, audio, order, actions);
  grid.append(media, copy);
  root.append(head, grid);
}

function renderSoundPreview(source, adapted) {
  const root = byId("sound-preview");
  const roughCut = adapted ? null : source.rough_cut;
  const sound = roughCut?.sound_preview;
  root.replaceChildren();
  root.hidden = !sound;
  if (!sound) return;

  const head = document.createElement("header");
  const heading = document.createElement("div");
  const kicker = document.createElement("span");
  const title = document.createElement("h3");
  const status = document.createElement("strong");
  const grid = document.createElement("div");
  const video = document.createElement("video");
  const fallback = document.createElement("p");
  const copy = document.createElement("div");
  const specs = document.createElement("p");
  const provenance = document.createElement("div");
  const voice = document.createElement("p");
  const ambient = document.createElement("p");
  const assembly = document.createElement("p");
  const note = document.createElement("p");
  const cues = document.createElement("p");
  const history = document.createElement("p");
  const actions = document.createElement("div");

  head.className = "sound-preview-head";
  kicker.className = "sound-preview-kicker";
  kicker.textContent = "SOUND PREVIEW / 02";
  title.textContent = sound.title;
  status.className = "sound-preview-status";
  status.textContent = sound.status === "completed-case-default-v2"
    ? `${sound.version.toUpperCase()} · 案例完成版（声音可替换）`
    : `${sound.version.toUpperCase()} · 可替换声音试听`;
  heading.append(kicker, title);
  head.append(heading, status);

  grid.className = "sound-preview-grid";
  video.src = sound.reference_video;
  video.poster = "assets/dunhuang/B01-S01.png";
  video.controls = true;
  video.preload = "metadata";
  video.playsInline = true;
  video.setAttribute("aria-label", "敦煌 30 秒带声音试听播放器");
  fallback.className = "sound-preview-fallback";
  fallback.hidden = true;
  fallback.textContent = "声音试听没有加载成功；静音画面粗剪、旁白 SRT 和声音分轨仍可单独下载，请确认发布资产后重试。";
  video.addEventListener("error", () => { fallback.hidden = false; });
  const media = document.createElement("div");
  media.className = "sound-preview-media";
  media.append(video, fallback);

  copy.className = "sound-preview-copy";
  specs.className = "sound-preview-specs";
  specs.textContent = `${sound.duration_seconds}s · ${sound.dimensions} · ${sound.fps}fps · ${sound.sample_rate / 1000}kHz stereo · ${sound.integrated_loudness_lufs} LUFS`;
  provenance.className = "sound-preview-provenance";
  voice.dataset.source = "sound-voice";
  voice.textContent = `旁白试听：${sound.voice} · ${sound.voice_source} · 语速 ${sound.voice_rate} · 音高 ${sound.voice_pitch}`;
  ambient.dataset.source = "sound-ambient";
  ambient.textContent = "环境声：Codex / Research Lab 使用 FFmpeg 程序化合成 · 无外部音乐或采样";
  assembly.dataset.source = "sound-assembly";
  assembly.textContent = "混音：Codex / Research Lab 对齐、ducking 与响度归一化 · 非原库本次执行";
  provenance.append(voice, ambient, assembly);
  note.innerHTML = `<strong>使用边界：</strong>${sound.voice_usage_note}。`;
  cues.innerHTML = `<strong>旁白落点：</strong>${sound.narration_cues.map((cue) => `${cue.beat} ${cue.start_seconds.toFixed(2)}s`).join(" · ")}；三段均在各自 10 秒窗口内结束。`;
  history.innerHTML = sound.previous_version
    ? `<strong>上版保留：</strong>${sound.previous_version.version.toUpperCase()} ${sound.previous_version.voice}；因“${sound.previous_version.replacement_reason}”不再作为默认试听。`
    : "";
  actions.className = "sound-preview-actions";
  [
    [sound.reference_video, "下载声音试听"],
    [sound.narration_stem, "下载旁白分轨"],
    [sound.ambient_stem, "下载环境声分轨"],
    [sound.mix_stem, "下载混音分轨"],
  ].forEach(([href, label], index) => {
    const link = document.createElement("a");
    link.className = `button ${index === 0 ? "button-primary" : "button-secondary"}`;
    link.href = href;
    link.download = href.split("/").at(-1);
    link.textContent = label;
    actions.append(link);
  });
  copy.append(specs, provenance, note, cues);
  if (sound.previous_version) copy.append(history);
  copy.append(actions);
  grid.append(media, copy);
  root.append(head, grid);
}

function caseBlockHeader(code, titleText, copyText) {
  const head = document.createElement("header");
  const titleWrap = document.createElement("div");
  const codeLabel = document.createElement("span");
  const title = document.createElement("h3");
  const copy = document.createElement("p");
  head.className = "case-block-head";
  codeLabel.textContent = code;
  title.textContent = titleText;
  copy.textContent = copyText;
  titleWrap.append(codeLabel, title);
  head.append(titleWrap, copy);
  return head;
}

function renderCaseStudy(source, adapted) {
  const root = byId("case-study");
  const nav = byId("case-nav-link");
  const content = byId("case-study-content");
  const closure = adapted ? null : source.case_closure;
  root.hidden = !closure;
  nav.hidden = !closure;
  content.replaceChildren();
  if (!closure) return;

  const final = document.createElement("article");
  const media = document.createElement("div");
  const video = document.createElement("video");
  const fallback = document.createElement("p");
  const copy = document.createElement("div");
  const badge = document.createElement("strong");
  const title = document.createElement("h3");
  const subtitle = document.createElement("p");
  const summary = document.createElement("p");
  const metrics = document.createElement("div");
  const actions = document.createElement("div");
  const download = document.createElement("a");
  const documentLink = document.createElement("a");

  final.className = "case-final";
  final.dataset.caseStatus = closure.status;
  media.className = "case-final-media";
  video.src = closure.final_video;
  video.poster = "assets/dunhuang/B01-S01.png";
  video.controls = true;
  video.preload = "metadata";
  video.playsInline = true;
  video.setAttribute("aria-label", "敦煌完成案例最终成片播放器");
  fallback.className = "case-final-fallback";
  fallback.hidden = true;
  fallback.textContent = "最终成片没有加载成功；下面的案例结论、能力归属和生产链仍可阅读，也可返回准备台下载分轨与静音粗剪。";
  video.addEventListener("error", () => { fallback.hidden = false; });
  media.append(video, fallback);

  copy.className = "case-final-copy";
  badge.className = "case-complete-badge";
  badge.textContent = `案例已完成 · ${closure.completed_at} · FINAL V2`;
  title.textContent = closure.title;
  subtitle.className = "case-subtitle";
  subtitle.textContent = closure.subtitle;
  summary.className = "case-summary";
  summary.textContent = closure.summary;
  metrics.className = "case-metrics";
  metrics.setAttribute("aria-label", "案例交付摘要");
  closure.metrics.forEach((item) => {
    const cell = document.createElement("div");
    const value = document.createElement("strong");
    const label = document.createElement("span");
    value.textContent = item.value;
    label.textContent = item.label;
    cell.append(value, label);
    metrics.append(cell);
  });
  actions.className = "case-final-actions";
  download.className = "button button-primary";
  download.href = closure.final_video;
  download.download = closure.final_download_name;
  download.textContent = "下载最终成片";
  documentLink.className = "button button-secondary";
  documentLink.href = closure.case_document_url;
  documentLink.target = "_blank";
  documentLink.rel = "noreferrer";
  documentLink.textContent = "查看完整案例复盘 ↗";
  actions.append(download, documentLink);
  copy.append(badge, title, subtitle, summary, metrics, actions);
  final.append(media, copy);
  content.append(final);

  const themeReuse = closure.theme_reuse;
  if (themeReuse) {
    const themes = document.createElement("section");
    const current = document.createElement("article");
    const currentIntro = document.createElement("div");
    const currentLabel = document.createElement("b");
    const currentTitle = document.createElement("h4");
    const currentFormat = document.createElement("strong");
    const currentStyle = document.createElement("p");
    const currentConcept = document.createElement("p");
    const arc = document.createElement("ol");
    const optionGrid = document.createElement("div");
    const switchGrid = document.createElement("div");

    themes.className = "case-block";
    themes.dataset.caseEvidence = "theme-reuse";
    current.className = "case-current-theme";
    currentIntro.className = "case-current-theme-copy";
    currentLabel.textContent = themeReuse.current.label;
    currentTitle.textContent = themeReuse.current.title;
    currentFormat.textContent = themeReuse.current.format;
    currentStyle.textContent = themeReuse.current.style;
    currentConcept.textContent = themeReuse.current.concept;
    currentStyle.className = "case-current-theme-style";
    currentConcept.className = "case-current-theme-concept";
    currentIntro.append(currentLabel, currentTitle, currentFormat, currentStyle, currentConcept);

    arc.className = "case-theme-arc";
    arc.setAttribute("aria-label", "当前主题三段叙事");
    themeReuse.current.arc.forEach((item, index) => {
      const li = document.createElement("li");
      const number = document.createElement("span");
      const label = document.createElement("strong");
      number.textContent = `BEAT ${String(index + 1).padStart(2, "0")}`;
      label.textContent = item;
      li.append(number, label);
      arc.append(li);
    });
    current.append(currentIntro, arc);

    optionGrid.className = "case-theme-options";
    optionGrid.setAttribute("aria-label", "可替换主题示例");
    themeReuse.alternatives.forEach((item, index) => {
      const article = document.createElement("article");
      const meta = document.createElement("span");
      const heading = document.createElement("h4");
      const detail = document.createElement("p");
      article.className = "case-theme-option";
      meta.textContent = `${String(index + 1).padStart(2, "0")} / ${item.category}`;
      heading.textContent = item.title;
      detail.textContent = item.description;
      article.append(meta, heading, detail);
      optionGrid.append(article);
    });

    [["replace", "换主题时，需要重新制作", themeReuse.replace_when_switching], ["keep", "这些生产骨架，可以继续复用", themeReuse.keep_across_themes]].forEach(([kind, headingText, items]) => {
      const article = document.createElement("article");
      const heading = document.createElement("h4");
      const list = document.createElement("ul");
      article.className = "case-theme-change-card";
      article.dataset.change = kind;
      heading.textContent = headingText;
      items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.append(li);
      });
      article.append(heading, list);
      switchGrid.append(article);
    });
    switchGrid.className = "case-theme-switch";

    themes.append(
      caseBlockHeader("THEMES / 01", "当前是敦煌；流程可以换主题", "不是把标题替换一下就结束：内容层需要重做，已经验证的镜头协议、版本、质检和后期骨架可以保留。"),
      current,
      optionGrid,
      switchGrid
    );
    content.append(themes);
  }

  const ownership = document.createElement("section");
  const ownershipGrid = document.createElement("div");
  ownership.className = "case-block";
  ownershipGrid.className = "case-ownership";
  ownershipGrid.dataset.caseEvidence = "ownership";
  closure.ownership.forEach((item, index) => {
    const article = document.createElement("article");
    const number = document.createElement("b");
    const heading = document.createElement("strong");
    const detail = document.createElement("p");
    article.className = "case-owner";
    article.dataset.owner = item.id;
    number.textContent = `SOURCE / ${String(index + 1).padStart(2, "0")}`;
    heading.textContent = item.label;
    detail.textContent = item.summary;
    article.append(number, heading, detail);
    ownershipGrid.append(article);
  });
  ownership.append(caseBlockHeader("OWNERSHIP / 02", "先分清：谁完成了什么", "原库、Codex 和用户外部模型分别承担不同层，不能把本研究成片误写成上游仓库的直接生成结果。"), ownershipGrid);
  content.append(ownership);

  const chain = document.createElement("section");
  const chainList = document.createElement("ol");
  chain.className = "case-block";
  chainList.className = "case-chain";
  chainList.dataset.caseEvidence = "production-chain";
  closure.production_chain.forEach((item, index) => {
    const li = document.createElement("li");
    const number = document.createElement("b");
    const label = document.createElement("span");
    number.textContent = String(index + 1).padStart(2, "0");
    label.textContent = item;
    li.append(number, label);
    chainList.append(li);
  });
  chain.append(caseBlockHeader("WORKFLOW / 03", "一支片真正需要的完整链路", "从固定证据到最终交付，生成模型只是其中一环；拆镜头、质检、版本和确定性后期同样属于核心生产资产。"), chainList);
  content.append(chain);

  const learnings = document.createElement("section");
  const learningGrid = document.createElement("div");
  learnings.className = "case-block";
  learningGrid.className = "case-insights";
  learningGrid.dataset.caseEvidence = "key-learnings";
  closure.key_learnings.forEach((item) => {
    const article = document.createElement("article");
    const heading = document.createElement("h4");
    const detail = document.createElement("p");
    article.className = "case-insight";
    heading.textContent = item.title;
    detail.textContent = item.detail;
    article.append(heading, detail);
    learningGrid.append(article);
  });
  learnings.append(caseBlockHeader("LEARNINGS / 04", "经过实操后，我们补充确认了什么", "这些结论来自首帧、尾帧、重做、版本管理、粗剪和声音交付，不是仅靠阅读 README 得出的推测。"), learningGrid);
  content.append(learnings);

  const fit = document.createElement("section");
  const fitGrid = document.createElement("div");
  fit.className = "case-block";
  fitGrid.className = "case-fit-grid";
  [["best", "最适合", closure.best_fit], ["avoid", "不适合直接套用", closure.not_best_fit]].forEach(([kind, headingText, items]) => {
    const article = document.createElement("article");
    const heading = document.createElement("h4");
    const list = document.createElement("ul");
    article.className = "case-fit-card";
    article.dataset.fit = kind;
    heading.textContent = headingText;
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.append(li);
    });
    article.append(heading, list);
    fitGrid.append(article);
  });
  fit.append(caseBlockHeader("SCENARIOS / 05", "这个方法最适合用在哪里", "它擅长可拆镜头、可逐段放行、可统一包装的内容；对连续表演和精密口型仍需更强的专用能力。"), fitGrid);
  content.append(fit);

  const extensions = document.createElement("section");
  const extensionList = document.createElement("ul");
  extensions.className = "case-block";
  extensionList.className = "case-extension-list";
  closure.extension_priorities.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    extensionList.append(li);
  });
  extensions.append(caseBlockHeader("NEXT / 06", "工程可扩展方向：先稳定，再自动化", "这里说的是制作系统能力，不是内容主题：P0 解决 provider、状态和恢复；P1 提升质检与交付；P2 再做多模型路由和可积累评测。"), extensionList);
  content.append(extensions);

  const meaning = document.createElement("section");
  const meaningCard = document.createElement("div");
  const meaningTitle = document.createElement("h4");
  const meaningList = document.createElement("ul");
  meaning.className = "case-block";
  meaningCard.className = "case-meaning";
  meaningTitle.textContent = "对我们的意义：从提示词，升级为制作系统。";
  meaningList.className = "case-meaning-list";
  closure.meaning.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    meaningList.append(li);
  });
  meaningCard.append(meaningTitle, meaningList);
  meaning.append(meaningCard);
  content.append(meaning);
  if (!state.caseHashApplied && location.hash === "#case-study") {
    state.caseHashApplied = true;
    requestAnimationFrame(() => root.scrollIntoView({ block: "start" }));
  }
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
      ? `研究示范已完成：6 张 Codex 关键帧、${source.completed_video_count || 0}/6 个当前视频、1 个静音画面粗剪和最终声音版 V2 已回填；成片使用在线神经网络 TTS 与原创程序化环境声，完整结论见下方完成案例。`
      : "当前载入上游样例原稿。它可直接用于研究，但正式生产前仍需事实、权利与模型参数复核。";
  renderRoughCut(source, adapted);
  renderSoundPreview(source, adapted);
  renderCaseStudy(source, adapted);
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
  const needsRevision = Boolean(shot.video_review && !shot.video_review.creative_status?.startsWith("approved-"));
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
  eyebrow.textContent = "CODEX / RESEARCH LAB 新增提示卡";
  title.textContent = needsRevision ? "需要重做时，复制这一整块" : "这一整块可以直接复制";
  button.type = "button";
  button.className = "button button-primary dispatch-copy-button";
  button.dataset.copyShot = shot.id;
  button.textContent = needsRevision ? "复制重做提示" : "复制本镜头";
  button.setAttribute("aria-label", `复制 ${shot.id} ${needsRevision ? "重做" : "完整视频"}提示词`);
  button.addEventListener("click", () => copyShotDispatch(shot, button));
  help.textContent = "这张调度卡由本研究整理：先把上面的 Codex 关键帧上传给视频模型，再粘贴下面全部文字。";
  preview.dataset.dispatchPreview = shot.id;
  preview.tabIndex = 0;
  preview.textContent = makeShotDispatchText(shot);
  heading.append(eyebrow, title);
  head.append(heading, button);
  card.append(head, help, preview);
  return card;
}

function createGeneratedVideo(shot) {
  const review = shot.video_review || {};
  const approved = review.creative_status?.startsWith("approved-");
  const needsFullRegeneration = review.creative_status === "requires-full-regeneration";
  const versionLabel = (review.version || "v1").toUpperCase();
  const section = document.createElement("section");
  const head = document.createElement("div");
  const label = document.createElement("span");
  const title = document.createElement("strong");
  const grid = document.createElement("div");
  const video = document.createElement("video");
  const copy = document.createElement("div");
  const status = document.createElement("b");
  const specs = document.createElement("p");
  const strength = document.createElement("p");
  const issue = document.createElement("p");
  const recommendation = document.createElement("p");
  const history = document.createElement("div");
  const reviewSource = document.createElement("p");
  const fallback = document.createElement("p");
  section.className = "generated-video";
  section.setAttribute("aria-label", `${shot.id} 用户生成视频 ${review.version || "v1"}`);
  head.className = "generated-video-head";
  label.className = "asset-source-label";
  label.dataset.source = "user-video";
  label.textContent = "用户外部模型产物 · 非原库生成";
  title.textContent = `${shot.id} · ${review.version || "v1"} 已回填`;
  grid.className = "generated-video-grid";
  video.src = shot.reference_video;
  video.poster = shot.reference_image;
  video.controls = true;
  video.preload = "metadata";
  video.playsInline = true;
  video.setAttribute("aria-label", `${shot.id} ${versionLabel} 当前视频播放器`);
  copy.className = "generated-video-review";
  status.className = "video-review-status";
  status.dataset.status = review.creative_status || "review";
  status.textContent = review.creative_status === "usable-with-tail-revision"
    ? `可用 ${versionLabel} · 建议重做尾部`
    : approved ? `通过 ${versionLabel} · 可进入剪辑`
      : needsFullRegeneration ? `未通过 ${versionLabel} · 建议整段重做` : "等待人工复核";
  specs.textContent = `${review.duration_seconds || shot.duration}s · ${review.dimensions || "竖屏"} · ${review.fps || "—"}fps · ${(review.video_codec || "").toUpperCase()} / ${(review.audio_codec || "").toUpperCase()}`;
  strength.innerHTML = `<strong>保留得好：</strong>${review.strength || "等待复核"}`;
  issue.innerHTML = `<strong>${approved ? "复核备注" : needsFullRegeneration ? "未通过原因" : "尾帧问题"}：</strong>${review.issue || "等待复核"}`;
  recommendation.innerHTML = `<strong>建议：</strong>${review.recommendation || "等待复核"}`;
  history.className = "video-version-history";
  if (shot.previous_versions?.length) {
    const historyTitle = document.createElement("strong");
    historyTitle.textContent = "历史版本（保留，不作为当前播放）";
    history.append(historyTitle);
    shot.previous_versions.forEach((item) => {
      const row = document.createElement("p");
      row.textContent = `${(item.version || "旧版").toUpperCase()} · ${item.summary || item.creative_status || "已保留"}`;
      history.append(row);
    });
  }
  reviewSource.className = "review-source-label";
  reviewSource.dataset.source = "codex-review";
  reviewSource.textContent = "质量复核：Codex / Research Lab 首中尾帧检查";
  fallback.className = "video-fallback";
  fallback.hidden = true;
  fallback.textContent = "视频没有加载成功；关键帧和完整提示词仍可使用。请确认本地 MP4 已同步后重试。";
  video.addEventListener("error", () => { fallback.hidden = false; });
  head.append(label, title);
  copy.append(status, reviewSource, specs, strength, issue, recommendation);
  if (history.childElementCount) copy.append(history);
  grid.append(video, copy);
  section.append(head, grid, fallback);
  return section;
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
      details.dataset.shotId = shot.id;
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
        caption.className = "asset-source-label";
        caption.dataset.source = "codex-image";
        caption.textContent = `本研究新增 · Codex 图片模型关键帧 · ${shot.id} · 可作为图生视频首帧`;
        keyframe.append(image, caption);
        fields.append(keyframe);
        if (shot.reference_video?.startsWith("assets/")) fields.append(createGeneratedVideo(shot));
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
          ? shot.reference_video
            ? "来源拆分：关键帧由 Codex 图片模型生成；视频由用户外部模型生成并回填"
            : "关键帧由 Codex 图片模型生成；视频仍待用户外部模型生成"
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
