const steps = [
  {
    number: "01",
    type: "SOURCE / 信息来源",
    title: "从 GitHub 和社区投稿中找到项目",
    description: "维护者会主动寻找项目；开发者也可以通过 Issue 提交项目名、地址、100 字以内简介和最多 6 张截图。",
    evidence: "README 的自荐入口和 .github/issue_template.md。",
  },
  {
    number: "02",
    type: "SELECTION / 人工挑选",
    title: "人工决定哪些项目放进清单",
    description: "维护者根据项目是否有趣、实用、具有学习价值来选择。公开仓库没有一套可以直接运行的统一评分算法。",
    evidence: "长期分类、中文简介和选题记录；具体判断标准没有完整公开。",
  },
  {
    number: "03",
    type: "SUMMARY / 中文简介",
    title: "为项目写一段简短的中文说明",
    description: "每条记录通常保留项目名、链接和一段中文简介，让读者先知道它是做什么的，再决定是否打开原仓库。",
    evidence: "README 和年度归档中的 Markdown 项目表格。",
  },
  {
    number: "04",
    type: "STORAGE / 存入清单",
    title: "按分类和年份保存到 Markdown 清单",
    description: "GitHub 仓库按分类和年份保存项目记录。这里保存的是名称、链接和简介，不是每个项目的源代码。",
    evidence: "README 的分类内容和年度归档。",
  },
];

const audiences = {
  developer: {
    number: "01",
    role: "DEVELOPER",
    title: "找现成工具的起点",
    summary: "当你知道问题，却不知道有哪些现成项目时，可以先用分类和中文简介找到几个名字。",
    do: "选出 3—5 个候选，再检查提交活跃度、文档、测试、许可证和安全性。",
    dont: "不要因为被收录或 Star 多，就直接引入生产环境。",
  },
  product: {
    number: "02",
    role: "PRODUCT RESEARCH",
    title: "查同类项目和开源替代",
    summary: "通过清单里的同类工具，看看一个需求已经有哪些做法、哪些能力已有开源替代。",
    do: "记录用户问题、产品定位与关键差异，再验证真实用户和商业边界。",
    dont: "不要把项目数量或媒体曝光直接当作市场规模证据。",
  },
  creator: {
    number: "03",
    role: "CONTENT CREATOR",
    title: "从历史清单里找选题",
    summary: "分类和年度归档可以提供第一批选题，减少每次都从零搜索的时间。",
    do: "回到原仓库核对事实、最新版本和演示，再加入自己的测试与判断。",
    dont: "不要直接改写或商业转载整理内容；先核验 CC BY-NC-ND 4.0 边界。",
  },
  maintainer: {
    number: "04",
    role: "OPEN-SOURCE MAINTAINER",
    title: "向中文开发者介绍自己的项目",
    summary: "Issue 自荐入口提供了一个低成本传播渠道，适合已经有清晰定位和演示的开源项目。",
    do: "准备 100 字以内价值说明、稳定体验地址和 3—6 张能说明闭环的截图。",
    dont: "不要只描述技术栈；先说清楚为谁解决什么具体问题。",
  },
};

function setupTheme() {
  const root = document.documentElement;
  const button = document.querySelector("#theme-toggle");

  function syncLabel() {
    const isDark = root.dataset.theme === "dark";
    button.setAttribute("aria-label", isDark ? "切换为浅色主题" : "切换为深色主题");
    document.querySelector('meta[name="theme-color"]').content = isDark ? "#0b0d0c" : "#f2f3ed";
  }

  button.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("ghd-theme", root.dataset.theme);
    syncLabel();
  });

  syncLabel();
}

function activateTab(buttons, nextIndex, update) {
  buttons.forEach((button, index) => {
    const active = index === nextIndex;
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
  });
  update(buttons[nextIndex], nextIndex);
}

function addTabKeyboard(buttons, update) {
  buttons.forEach((button) => {
    button.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const current = buttons.indexOf(button);
      let next = current;
      if (event.key === "ArrowRight") next = (current + 1) % buttons.length;
      if (event.key === "ArrowLeft") next = (current - 1 + buttons.length) % buttons.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = buttons.length - 1;
      activateTab(buttons, next, update);
      buttons[next].focus();
    });
  });
}

function setupSteps() {
  const buttons = [...document.querySelectorAll("[data-step]")];
  const panel = document.querySelector("#step-panel");
  panel.setAttribute("aria-live", "polite");

  function update(button, index) {
    const item = steps[index];
    document.querySelector("#step-number").textContent = item.number;
    document.querySelector("#step-type").textContent = item.type;
    document.querySelector("#step-title").textContent = item.title;
    document.querySelector("#step-description").textContent = item.description;
    document.querySelector("#step-evidence").textContent = item.evidence;
    panel.setAttribute("aria-labelledby", button.id);
  }

  buttons.forEach((button, index) => button.addEventListener("click", () => activateTab(buttons, index, update)));
  addTabKeyboard(buttons, update);
}

function setupAudiences() {
  const buttons = [...document.querySelectorAll("[data-audience]")];
  const panel = document.querySelector("#audience-panel");
  panel.setAttribute("aria-live", "polite");

  function update(button) {
    const item = audiences[button.dataset.audience];
    document.querySelector("#audience-number").textContent = item.number;
    document.querySelector("#audience-role").textContent = item.role;
    document.querySelector("#audience-title").textContent = item.title;
    document.querySelector("#audience-summary").textContent = item.summary;
    document.querySelector("#audience-do").textContent = item.do;
    document.querySelector("#audience-dont").textContent = item.dont;
    panel.setAttribute("aria-labelledby", button.id);
  }

  buttons.forEach((button, index) => button.addEventListener("click", () => activateTab(buttons, index, update)));
  addTabKeyboard(buttons, update);
}

function setupReadingState() {
  const progress = document.querySelector(".page-progress span");
  let ticking = false;

  function updateProgress() {
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    const percentage = scrollable > 0 ? Math.min(100, Math.max(0, (scrollY / scrollable) * 100)) : 0;
    progress.style.setProperty("--progress", `${percentage}%`);
    ticking = false;
  }

  addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });
  updateProgress();

  const navLinks = [...document.querySelectorAll(".section-nav a")];
  const sections = [...document.querySelectorAll("[data-section]")];
  const observer = new IntersectionObserver(() => {
    const readingLine = innerHeight * 0.3;
    const visible = sections.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= readingLine && rect.bottom >= readingLine;
    });
    if (!visible) return;
    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${visible.id}`;
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-22% 0px -58%", threshold: 0 });
  sections.forEach((section) => observer.observe(section));
}

setupTheme();
setupSteps();
setupAudiences();
setupReadingState();
