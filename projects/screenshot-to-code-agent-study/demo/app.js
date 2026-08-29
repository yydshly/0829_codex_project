(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector("#theme-toggle");
  const themeIcon = document.querySelector(".theme-icon");

  function applyTheme(theme, persist = true) {
    root.dataset.theme = theme;
    themeToggle?.setAttribute(
      "aria-label",
      theme === "dark" ? "切换到明亮主题" : "切换到深色主题",
    );
    if (themeIcon) themeIcon.dataset.mode = theme;
    if (persist) localStorage.setItem("stc-study-theme", theme);
  }

  applyTheme(root.dataset.theme || "dark", false);
  themeToggle?.addEventListener("click", () => {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  const steps = [
    {
      kicker: "输入归一化",
      title: "把截图、录屏、文字和历史整理成模型上下文",
      description:
        "后端根据 image、video、text 与 create、update 组合选择 Prompt 路径，再叠加输出栈、设计系统和素材策略。",
      observation: "像素、文字、用户约束",
      boundary: "视觉输入不包含隐藏业务逻辑",
      nodes: ["参考图", "Agent", "Prompt"],
    },
    {
      kicker: "工具调用循环",
      title: "模型不直接交卷，而是持续操作文件和工具",
      description:
        "Provider 把流式工具调用统一成内部事件；运行时执行 create_file、edit_file 等工具，把结果追加回对话。当前源码最多运行 30 个 Agent step。",
      observation: "文件状态、工具结果、成本",
      boundary: "精确字符串替换适合小型单文件原型",
      nodes: ["模型", "Tools", "File"],
    },
    {
      kicker: "真实素材处理",
      title: "先定位素材边界，再裁剪原始像素",
      description:
        "Gemini 返回归一化 box_2d，后端校验坐标并用 Pillow 裁剪 PNG；无法提取的素材才进入生成、编辑或去背景流程。",
      observation: "Logo、照片、插图、图标",
      boundary: "遮挡、模糊和背景融合素材可能无法隔离",
      nodes: ["原图", "Box", "PNG"],
    },
    {
      kicker: "视觉反馈",
      title: "让 Agent 看见浏览器真正渲染出的结果",
      description:
        "Playwright 默认生成 1280×832 桌面和 342×684 手机截图。模型检查重叠、间距、颜色和溢出，再决定是否修改。",
      observation: "浏览器像素与响应式结果",
      boundary: "没有自动像素差，质量仍依赖模型判断",
      nodes: ["HTML", "Chrome", "截图"],
    },
    {
      kicker: "局部修正与比较",
      title: "保留文件状态，生成多个候选并继续修改",
      description:
        "同一请求可以并行运行不同模型变体。用户选择候选、选中具体元素或补充说明后，Agent 只修改相关实现。",
      observation: "候选差异、选中元素、历史",
      boundary: "多个候选增加成本，不保证生产质量",
      nodes: ["候选 A", "选择", "候选 B"],
    },
  ];

  const stepTabs = [...document.querySelectorAll("[data-step]")];
  const stepPanel = document.querySelector("#step-panel");
  const stepFields = {
    kicker: document.querySelector("#step-kicker"),
    title: document.querySelector("#step-title"),
    description: document.querySelector("#step-description"),
    observation: document.querySelector("#step-observation"),
    boundary: document.querySelector("#step-boundary"),
  };
  const visualNodes = [...document.querySelectorAll(".step-visual .node")];

  function selectStep(index, shouldFocus = false) {
    const step = steps[index];
    if (!step) return;
    stepTabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    Object.entries(stepFields).forEach(([key, element]) => {
      if (element) element.textContent = step[key];
    });
    visualNodes.forEach((node, nodeIndex) => {
      node.textContent = step.nodes[nodeIndex];
    });
    stepPanel?.setAttribute("aria-labelledby", `step-tab-${index}`);
    if (shouldFocus) stepTabs[index].focus();
  }

  stepTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectStep(index));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % stepTabs.length;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + stepTabs.length) % stepTabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = stepTabs.length - 1;
      selectStep(next, true);
    });
  });

  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const scenarios = [...document.querySelectorAll("[data-scenario]")];
  const filterStatus = document.querySelector("#filter-status");
  const filterNames = { all: "全部", fit: "适合", caution: "谨慎", avoid: "不适合" };

  function applyFilter(filter) {
    let visible = 0;
    filterButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
    });
    scenarios.forEach((card) => {
      const show = filter === "all" || card.dataset.scenario === filter;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (filterStatus) filterStatus.textContent = `正在显示${filterNames[filter]} ${visible} 个场景`;
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => applyFilter(button.dataset.filter));
  });

  const navLinks = [...document.querySelectorAll(".section-nav a")];
  const observedSections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${visible.target.id}`;
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-20% 0px -65%", threshold: [0, 0.1, 0.4] },
  );

  observedSections.forEach((section) => observer.observe(section));
  root.dataset.ready = "true";
})();
