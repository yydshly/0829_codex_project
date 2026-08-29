import fs from "node:fs";

const [, , command = "snapshot", ...args] = process.argv;
const targets = await fetch("http://127.0.0.1:9229/json").then((response) => response.json());
const target = targets.find((item) => item.type === "page" && item.url.includes("localhost:1420"));

if (!target) {
  throw new Error("The LLM Wiki WebView target was not found on port 9229.");
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(JSON.stringify(message.error)));
  else resolve(message.result);
});

function send(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  }
  return result.result.value;
}

const interactiveSelector = [
  "button",
  "a[href]",
  "input",
  "textarea",
  "select",
  "[role='button']",
  "[role='menuitem']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const interactiveExpression = `
  Array.from(document.querySelectorAll(${JSON.stringify(interactiveSelector)}))
    .filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
    })
`;

await send("Runtime.enable");

let output;
if (command === "snapshot") {
  output = await evaluate(`(() => {
    const elements = ${interactiveExpression};
    return {
      title: document.title,
      url: location.href,
      bodyText: document.body.innerText.slice(0, 12000),
      elements: elements.map((element, index) => ({
        index,
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute("type"),
        role: element.getAttribute("role"),
        text: (element.innerText || element.value || "").trim().slice(0, 240),
        ariaLabel: element.getAttribute("aria-label"),
        placeholder: element.getAttribute("placeholder"),
        disabled: Boolean(element.disabled),
      })),
    };
  })()`);
} else if (command === "click-index") {
  const index = Number(args[0]);
  output = await evaluate(`(() => {
    const elements = ${interactiveExpression};
    const target = elements[${JSON.stringify(index)}];
    if (!target) throw new Error("Interactive element index not found");
    target.focus();
    target.click();
    return { clicked: ${JSON.stringify(index)}, text: (target.innerText || target.value || "").trim() };
  })()`);
} else if (command === "click-text") {
  const expected = args.join(" ").trim();
  output = await evaluate(`(() => {
    const expected = ${JSON.stringify(expected)}.toLowerCase();
    const elements = ${interactiveExpression};
    const target = elements.find((element) => {
      const label = [element.innerText, element.value, element.getAttribute("aria-label")]
        .filter(Boolean).join(" ").trim().toLowerCase();
      return label === expected || label.includes(expected);
    });
    if (!target) throw new Error("Interactive element text not found: " + expected);
    target.focus();
    target.click();
    return { clicked: expected, text: (target.innerText || target.value || "").trim() };
  })()`);
} else if (command === "fill-index") {
  const index = Number(args[0]);
  const value = args.slice(1).join(" ");
  output = await evaluate(`(() => {
    const elements = ${interactiveExpression};
    const target = elements[${JSON.stringify(index)}];
    if (!target) throw new Error("Interactive element index not found");
    const prototype = target.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value").set;
    setter.call(target, ${JSON.stringify(value)});
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    target.focus();
    return { filled: ${JSON.stringify(index)}, value: target.value };
  })()`);
} else if (command === "press") {
  const key = args[0];
  output = await evaluate(`(() => {
    const target = document.activeElement || document.body;
    target.dispatchEvent(new KeyboardEvent("keydown", { key: ${JSON.stringify(key)}, bubbles: true }));
    target.dispatchEvent(new KeyboardEvent("keyup", { key: ${JSON.stringify(key)}, bubbles: true }));
    return { key: ${JSON.stringify(key)}, target: target.tagName };
  })()`);
} else if (command === "eval-base64") {
  const expression = Buffer.from(args[0], "base64").toString("utf8");
  output = await evaluate(expression);
} else if (command === "screenshot") {
  const outputPath = args[0];
  if (!outputPath) throw new Error("screenshot requires an output path");
  await send("Page.enable");
  const result = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  fs.writeFileSync(outputPath, Buffer.from(result.data, "base64"));
  output = { screenshot: outputPath };
} else {
  throw new Error(`Unknown command: ${command}`);
}

console.log(JSON.stringify(output, null, 2));
socket.close();
