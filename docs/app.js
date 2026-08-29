const statusLabels = {
  planned: "计划中",
  active: "进行中",
  paused: "暂停",
  completed: "已完成",
  archived: "已归档",
};

const repositoryBase = "https://github.com/yydshly/0829_codex_project/tree/main/";
const projectList = document.querySelector("#project-list");
const searchInput = document.querySelector("#search");
const statusFilter = document.querySelector("#status-filter");
let projects = [];

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function makeLink(label, href) {
  const link = makeElement("a", "", label);
  link.href = href;
  if (href.startsWith("http")) {
    link.target = "_blank";
    link.rel = "noreferrer";
  }
  return link;
}

function createCard(project) {
  const article = makeElement("article", "project-card");
  const top = makeElement("div", "card-top");
  top.append(
    makeElement("span", `status status-${project.status}`, statusLabels[project.status] || project.status),
    makeElement("time", "card-date", project.updated),
  );

  const title = makeElement("h3", "", project.title);
  const summary = makeElement("p", "", project.summary);
  const footer = makeElement("div", "card-footer");
  const tags = makeElement("div", "tags");
  (project.tags || []).forEach((tag) => tags.append(makeElement("span", "tag", tag)));

  const links = makeElement("div", "card-links");
  links.append(makeLink("研究记录 ↗", `${repositoryBase}${project.path}`));
  if (project.demo_url) links.append(makeLink("在线演示 ↗", project.demo_url));
  if (project.source_url) links.append(makeLink("研究对象 ↗", project.source_url));
  footer.append(tags, links);
  article.append(top, title, summary, footer);
  return article;
}

function renderProjects() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const filtered = projects.filter((project) => {
    const haystack = [project.title, project.summary, ...(project.tags || [])].join(" ").toLowerCase();
    return (status === "all" || project.status === status) && (!query || haystack.includes(query));
  });

  projectList.replaceChildren();
  if (!filtered.length) {
    const empty = makeElement("div", "empty-state");
    const message = projects.length
      ? "没有符合当前筛选条件的项目。"
      : "研究清单已经就绪，第一个项目即将从这里开始。";
    const wrapper = makeElement("div");
    wrapper.append(makeElement("strong", "", projects.length ? "未找到项目" : "等待第一次探索"), document.createTextNode(message));
    empty.append(wrapper);
    projectList.append(empty);
    return;
  }
  filtered.forEach((project) => projectList.append(createCard(project)));
}

function updateStats() {
  document.querySelector("#project-count").textContent = projects.length;
  document.querySelector("#active-count").textContent = projects.filter((item) => item.status === "active").length;
  document.querySelector("#completed-count").textContent = projects.filter((item) => item.status === "completed").length;
}

async function loadProjects() {
  try {
    const response = await fetch("./projects.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const catalog = await response.json();
    projects = Array.isArray(catalog.projects) ? catalog.projects : [];
    updateStats();
    renderProjects();
  } catch (error) {
    projectList.replaceChildren();
    const empty = makeElement("div", "empty-state");
    const wrapper = makeElement("div");
    wrapper.append(
      makeElement("strong", "", "索引暂时无法读取"),
      document.createTextNode("请稍后刷新，或直接前往 GitHub 仓库查看研究记录。"),
    );
    empty.append(wrapper);
    projectList.append(empty);
    document.querySelectorAll(".stats strong").forEach((element) => { element.textContent = "—"; });
    console.error("Failed to load project catalog", error);
  }
}

searchInput.addEventListener("input", renderProjects);
statusFilter.addEventListener("change", renderProjects);
loadProjects();
