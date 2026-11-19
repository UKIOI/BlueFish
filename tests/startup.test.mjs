import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
import test from "node:test";
import { runInContext, createContext } from "node:vm";

const asset = name => readFileSync(new URL("../android/assets/" + name, import.meta.url), "utf8");
const index = asset("index.html");
const core = asset("core.js");
const locale = asset("i18n.js");
const app = asset("app.js");

function openApp({ saved = "", browserStorage = false, at = true, legacyMedia = false, native = {}, onReady } = {}) {
  const element = () => {
    const listeners = new Map();
    return { innerHTML: "", style: { setProperty() {} }, dataset: {}, scrollHeight: 0, clientHeight: 0,
      scrollTop: 0, addEventListener: (type, callback) => listeners.set(type, callback),
      dispatchEvent: event => listeners.get(event.type)?.(event),
      setAttribute() {}, blur() {}, focus() {}, querySelector() { return element(); } };
  };
  const elements = new Map([...index.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => [id, element()]));
  const documentElement = element();
  const events = new Map();
  const media = { matches: false, addListener() {} };
  if (!legacyMedia) media.addEventListener = () => {};
  const document = { title: "BlueFish", documentElement, body: element(),
    getElementById: id => elements.get(id) || null, addEventListener: (type, callback) => events.set(type, callback),
    dispatchEvent: event => events.get(event.type)?.(event) };
  const sandbox = { document, crypto: webcrypto, setTimeout, clearTimeout, structuredClone, TextEncoder,
    matchMedia: () => media, addEventListener() {}, requestAnimationFrame: callback => setTimeout(callback, 0) };
  if (!browserStorage) {
    sandbox.Lanwen = { load: () => saved, request() {}, ...native };
    sandbox.structuredClone = undefined;
  }
  Object.defineProperty(sandbox, "localStorage", { get() {
    if (browserStorage) return { getItem: () => saved };
    throw new Error("DOM Storage disabled");
  } });
  sandbox.window = sandbox;
  const context = createContext(sandbox);
  if (!at) runInContext("Array.prototype.at = undefined", context);
  runInContext(core, context, { filename: "core.js" });
  runInContext(locale, context, { filename: "i18n.js" });
  runInContext(app, context, { filename: "app.js" });
  assert.match(elements.get("bar").innerHTML, /data-do="menu"/);
  assert.match(elements.get("navigation").innerHTML, /aria-label="BlueFish (设置|settings)"/);
  onReady?.(code => runInContext(code, context));
  return elements;
}

test("fresh Android startup uses native storage when DOM storage is unavailable", () => {
  assert.match(openApp().get("feed").innerHTML, /class="welcome".*<h1>(?:今天想聊什么|想从哪儿聊起|今天有什么新点子|有什么想问的|今天想探索什么)？<\/h1>/);
});

test("Android startup recovers from malformed saved state without structuredClone", () => {
  assert.match(openApp({ saved: "{" }).get("feed").innerHTML, /class="welcome"/);
});

test("Android startup recovers from invalid chat and account collections", () => {
  const saved = JSON.stringify({ chats: null, current: "old", accounts: null, memory: null, receipts: null });
  assert.match(openApp({ saved }).get("feed").innerHTML, /class="welcome"/);
});

test("Android startup keeps saved drafts and valid turns alongside damaged records", () => {
  const saved = JSON.stringify({ current: "old", chats: [null, {
    id: "old", title: "已有对话", draft: "已有草稿", files: null,
    turns: [null, { id: "turn", selected: 1, variants: [null, {
      prompt: "以前的消息", files: [], reply: { status: "running", blocks: [{ type: "text", text: "以前的回复" }] }
    }] }]
  }], memory: [null, { id: "bad", text: 1 }] });
  const elements = openApp({ saved });
  assert.equal(elements.get("draft").value, "已有草稿");
  assert.equal(elements.get("draft").placeholder, "随心输入");
  assert.match(elements.get("feed").innerHTML, /以前的消息/);
  assert.match(elements.get("feed").innerHTML, /以前的回复/);
  assert.match(elements.get("feed").innerHTML, /已停止/);
});

test("older WebView opens a saved chat without Array.at or media-query EventTarget", () => {
  const saved = JSON.stringify({ current: "old", chats: [{ id: "old", title: "已保存的对话", draft: "之前的草稿", files: [], turns: [] }] });
  const withoutAt = openApp({ saved, at: false });
  assert.doesNotMatch(withoutAt.get("bar").innerHTML, /已保存的对话/);
  assert.equal(withoutAt.get("draft").value, "之前的草稿");
  const legacyMedia = openApp({ saved, legacyMedia: true });
  assert.equal(legacyMedia.get("draft").value, "之前的草稿");
});

test("browser preview still reads its own stored draft", () => {
  const saved = JSON.stringify({ current: "web", chats: [{ id: "web", draft: "浏览器草稿", files: [], turns: [] }] });
  assert.equal(openApp({ saved, browserStorage: true }).get("draft").value, "浏览器草稿");
});

test("long pastes appear as attachments but send the full original text", () => {
  const image = { id: "image", name: "照片.jpg", mime: "image/jpeg", size: 800 };
  const document = { id: "document", name: "会议纪要.docx", size: 40038 };
  const saved = JSON.stringify({ current: "chat", chats: [{ id: "chat", draft: "请总结", files: [image, document] }] });
  let run;
  let stored;
  const native = { save(raw) { stored = raw; return true; } };
  const elements = openApp({ saved, native, onReady: evaluate => { run = evaluate; } });
  const draft = elements.get("draft");
  const paste = text => {
    let prevented = false;
    draft.dispatchEvent({ type: "paste", clipboardData: { getData: () => text },
      preventDefault() { prevented = true; } });
    return prevented;
  };
  assert.equal(paste("短文本".repeat(333)), false);
  const original = "首行 <文本>\n" + "📝".repeat(1000) + "\n";
  assert.equal(paste(original), true);
  assert.equal(draft.value, "请总结");
  assert.match(elements.get("attachments").innerHTML, /attachment-image.*\/thumb\/image/);
  assert.match(elements.get("attachments").innerHTML, /data-kind="document".*39\.1 KB/);
  assert.match(elements.get("attachments").innerHTML, /粘贴至对话框/);
  run('actions.preview("2")');
  assert.match(elements.get("overlay").innerHTML, /首行 &lt;文本&gt;/);
  run("persist(true)");
  assert.equal(JSON.parse(stored).chats[0].files[2].pastedText, original);

  const sent = JSON.parse(stored);
  const chat = sent.chats[0];
  chat.turns = [{ id: "turn", selected: 0, variants: [{ prompt: chat.draft, files: chat.files }] }];
  chat.files = [];
  const opened = openApp({ saved: JSON.stringify(sent), onReady: evaluate => { run = evaluate; } });
  assert.match(opened.get("feed").innerHTML, /data-do="pastFile".*attachment-image.*粘贴至对话框/);
  assert.deepEqual(JSON.parse(run('JSON.stringify(C.requestFor(current(), 0, { mode: "key" }).messages[0].content)')), [
    { ...image, type: "_attachment" }, { ...document, type: "_attachment" },
    { type: "text", text: original }, { type: "text", text: "请总结" }
  ]);
});

test("the file picker can add more than six files to one message", () => {
  const attached = Array.from({ length: 8 }, (_, index) => ({
    id: "file-" + index, name: "笔记-" + index + ".txt", size: 100, plain: true, purpose: "user_data"
  }));
  let run;
  const native = {
    pick(...args) {
      assert.deepEqual(args, ["file"]);
      run(`window.onNative("picker", "ok", ${JSON.stringify([...attached, attached[0]])})`);
    }
  };
  const elements = openApp({ native, onReady: evaluate => { run = evaluate; } });
  run('actions.pick("file")');
  assert.equal(elements.get("attachments").innerHTML.match(/data-do="preview"/g).length, 8);
  assert.equal(run(`(() => {
    const chat = current();
    chat.turns.push({ selected: 0, variants: [{ prompt: "总结", files: chat.files }] });
    return C.requestFor(chat, 0, { mode: "key" }).messages[0].content
      .filter(block => block.type === "_attachment").length;
  })()`), 8);
});

test("trial sending accepts attachments larger than the former client limits", async () => {
  const images = Array.from({ length: 4 }, (_, index) => ({
    id: "photo-" + index, name: "照片-" + index + ".jpg", mime: "image/jpeg", size: 3 * 1024 * 1024
  }));
  const text = { id: "note", name: "笔记.txt", plain: true, purpose: "user_data", size: 300 * 1024 };
  const pdf = { id: "pdf", name: "资料.pdf", purpose: "text_recognition", size: 1024 };
  const files = [...images, text, pdf];
  const saved = JSON.stringify({
    current: "chat", mode: "trial", chats: [{ id: "chat", draft: "总结", files }],
    accounts: { trial: { tag: "fixture-trial", data: { available: 2_000_000 }, at: Date.now() } }
  });
  let run;
  let forwarded;
  const native = {
    request(id, type, raw) {
      if (type === "chat") forwarded = JSON.parse(raw).payload;
      const value = type === "info" ? { trialTag: "fixture-trial" } : { available: 2_000_000 };
      queueMicrotask(() => run(`window.onNative(${JSON.stringify(id)}, "ok", ${JSON.stringify(value)})`));
    }
  };
  openApp({ saved, native, onReady: evaluate => { run = evaluate; } });
  await new Promise(setImmediate);
  run("actions.send()");
  assert.equal(run("layer().data.title"), "上传并解析文档");
  await run("layer().data.callback()");
  assert.deepEqual(forwarded.messages[0].content.slice(0, -1), files.map(file => ({ ...file, type: "_attachment" })));
});

test("reply progress distinguishes attachment preparation, link reading, and image search", async () => {
  const saved = JSON.stringify({ mode: "key", current: "chat", chats: [{ id: "chat", draft: "看看附件和链接" }] });
  let evaluate;
  let chatId;
  openApp({ saved, onReady: run => { evaluate = run; }, native: {
    save: () => true,
    request(id, type) {
      if (type === "chat") chatId = id;
      else queueMicrotask(() => evaluate(`onNative(${JSON.stringify(id)}, "ok", { keyTag: "fixture-key" })`));
    }
  } });
  await new Promise(setImmediate);
  const sent = evaluate("actions.send()");
  const emit = (type, data) => evaluate(`onNative(${JSON.stringify(chatId)}, ${JSON.stringify(type)}, ${JSON.stringify(data)})`);
  const expectProgress = pattern => assert.match(
    evaluate("renderReply(C.versionOf(current().turns[0]), 0)"), pattern
  );
  emit("uploading", { name: "笔记.txt" });
  expectProgress(/正在上传文件 笔记\.txt/);
  emit("uploading", { name: "资料.pdf", parsing: true });
  expectProgress(/正在上传并解析文件 资料\.pdf/);
  emit("reading_image", { name: "图表.jpg" });
  expectProgress(/正在读取图片 图表\.jpg/);
  emit("attachments_ready", {});
  expectProgress(/正在等待回复/);
  const tool = (index, content_block) => emit("sse", { type: "content_block_start", index, content_block });
  tool(0, { type: "server_tool_use", id: "link", name: "deepseek_read_url", input: { action: "read_link" } });
  expectProgress(/正在阅读链接/);
  tool(1, { type: "web_fetch_tool_result", tool_use_id: "link" });
  tool(2, { type: "server_tool_use", id: "image", name: "deepseek_web_search", kind: "deep_image_search", input: { action: "search" } });
  expectProgress(/正在搜索图片/);
  emit("sse", { type: "message_stop" });
  emit("ok", {});
  await sent;
});

test("Dreaming uses the active trial service and records trial usage", async () => {
  const now = Date.now();
  const chats = [1, 2].map(number => ({
    id: "chat-" + number, updated: now,
    turns: [{ id: "turn-" + number, selected: 0, variants: [{ prompt: "持续推进数据库迁移", files: [], at: now }] }]
  }));
  let run;
  let request;
  const native = {
    request(id, type, raw) {
      queueMicrotask(() => {
        const emit = (name, data) => run("window.onNative(" + JSON.stringify(id) + "," + JSON.stringify(name) + "," + JSON.stringify(data) + ")");
        if (type === "chat") {
          request = JSON.parse(raw);
          emit("sse", { type: "content_block_start", index: 0, content_block: { type: "text", text: '{"suggestions":[]}' } });
          emit("sse", { type: "message_delta", usage: { input_tokens: 100, output_tokens: 8 } });
          emit("sse", { type: "message_stop" });
        }
        emit("ok", type === "info" ? { trialTag: "fixture-trial" } : { available: 2_000_000 });
      });
    }
  };
  openApp({ saved: JSON.stringify({ mode: "trial", current: "chat-1", chats }), native, onReady: evaluate => { run = evaluate; } });
  await new Promise(setImmediate);
  try {
    await run("state.memoryEnabled = true; state.historyEnabled = true; state.dreaming.enabled = true; runDreaming(true)");
    assert.equal(request.mode, "trial");
    assert.equal(request.tag, "fixture-trial");
    assert.match(request.payload.system, /记忆整理器/);
    assert.equal(run("state.receipts[0].mode"), "trial");
    assert.ok(run("state.dreaming.finished > 0"));
  } finally {
    run("stopDreaming()");
  }
});

test("language settings switch the live interface and persist English with the existing draft", () => {
  const saved = JSON.stringify({ current: "chat", chats: [{ id: "chat", draft: "已有草稿" }] });
  let stored;
  let run;
  const native = { save(raw) { stored = raw; return true; } };
  const elements = openApp({ saved, native, onReady: evaluate => { run = evaluate; } });

  run('actions.settings()');
  assert.match(elements.get("settings-screen").innerHTML, /data-do="languageSettings".*语言.*简体中文/);
  run('actions.languageSettings()');
  assert.match(elements.get("settings-screen").innerHTML, /name="language" value="zh-CN" checked/);
  run('document.dispatchEvent({ type: "change", target: { name: "language", value: "en", dataset: {} } })');
  assert.equal(run("document.documentElement.lang"), "en");
  assert.match(elements.get("settings-screen").innerHTML, /<h2>Language<\/h2>/);
  assert.match(elements.get("settings-screen").innerHTML, /name="language" value="en" checked/);
  assert.equal(elements.get("draft").placeholder, "Ask anything");
  assert.equal(elements.get("draft").value, "已有草稿");
  assert.equal(JSON.parse(stored).language, "en");

  assert.equal(openApp({ saved: stored }).get("draft").placeholder, "Ask anything");
  run('document.dispatchEvent({ type: "change", target: { name: "language", value: "zh-CN", dataset: {} } })');
  assert.equal(elements.get("draft").placeholder, "随心输入");
  assert.equal(JSON.parse(stored).language, "zh-CN");
});

test("trial compacts before sending, keeps old turns visible, and reuses the summary after reload", async () => {
  const turns = Array.from({ length: 16 }, (_, i) => ({
    id: "turn-" + i, selected: 0,
    variants: [{ prompt: "历史问题 " + i, files: [], reply: {
      status: "done", tag: "fixture-trial", blocks: [{ type: "text", text: "历史回答 " + i }]
    } }]
  }));
  turns[15].variants[0].reply.usage = { input_tokens: 800_000, output_tokens: 20 };
  let stored = JSON.stringify({ current: "chat", mode: "trial", chats: [{ id: "chat", title: "长对话", draft: "继续", turns }] });
  let run;
  const payloads = [];
  const native = {
    save(raw) { stored = raw; return true; },
    request(id, type, raw) {
      const payload = JSON.parse(raw).payload;
      if (type === "chat") payloads.push(payload);
      queueMicrotask(() => {
        const emit = (name, data) => run(`window.onNative(${JSON.stringify(id)}, ${JSON.stringify(name)}, ${JSON.stringify(data)})`);
        if (type === "chat") {
          const text = payload.system?.includes("负责压缩") ? "此前决定用 SQLite" : "继续回答";
          emit("sse", { type: "content_block_start", index: 0, content_block: { type: "text", text } });
          emit("sse", { type: "message_delta", usage: { input_tokens: 100, output_tokens: 8 } });
          emit("sse", { type: "message_stop" });
        }
        emit("ok", type === "info" ? { trialTag: "fixture-trial" } : {});
      });
    }
  };
  const open = () => openApp({ saved: stored, native, onReady: evaluate => { run = evaluate; } });
  const elements = open();
  await new Promise(setImmediate);
  await run("actions.send()");
  assert.equal(payloads.length, 2);
  assert.match(payloads[0].messages[0].content[0].text, /历史问题 0/);
  assert.doesNotMatch(JSON.stringify(payloads[0].messages), /历史问题 15/);
  assert.match(payloads[1].messages[0].content[0].text, /此前决定用 SQLite/);
  assert.doesNotMatch(JSON.stringify(payloads[1].messages), /历史问题 0/);
  assert.match(elements.get("feed").innerHTML, /历史问题 0/);
  assert.equal(JSON.parse(stored).chats[0].turns.length, 17);
  assert.ok(JSON.parse(stored).receipts.some(receipt => receipt.kind === "compaction" && receipt.usage));

  open();
  await new Promise(setImmediate);
  await run('current().draft = "再追问"; actions.send()');
  assert.equal(payloads.length, 3);
  assert.match(payloads[2].messages[0].content[0].text, /此前决定用 SQLite/);
  assert.match(payloads[2].messages.at(-1).content[0].text, /再追问/);
});

test("a provider context rejection compacts and retries the same user turn once", async () => {
  const turns = Array.from({ length: 4 }, (_, i) => ({
    id: "turn-" + i, selected: 0, variants: [{ prompt: "旧消息 " + i, files: [] }]
  }));
  const saved = JSON.stringify({ current: "chat", mode: "key", chats: [{ id: "chat", title: "对话", draft: "继续", turns }] });
  let run;
  const payloads = [];
  const native = {
    save: () => true,
    request(id, type, raw) {
      const payload = JSON.parse(raw).payload;
      if (type === "chat") payloads.push(payload);
      queueMicrotask(() => {
        const emit = (name, data) => run(`window.onNative(${JSON.stringify(id)}, ${JSON.stringify(name)}, ${JSON.stringify(data)})`);
        if (type === "chat") {
          if (payloads.length === 1) return emit("fail", { status: 400, message: "maximum context length exceeded" });
          const text = payloads.length === 2 ? "滚动摘要" : "续聊成功";
          emit("sse", { type: "content_block_start", index: 0, content_block: { type: "text", text } });
          emit("sse", { type: "message_stop" });
        }
        emit("ok", type === "info" ? { keyTag: "fixture-key" } : {});
      });
    }
  };
  const elements = openApp({ saved, native, onReady: evaluate => { run = evaluate; } });
  await new Promise(setImmediate);
  await run("actions.send()");
  assert.equal(payloads.length, 3);
  assert.match(payloads[2].messages[0].content[0].text, /滚动摘要/);
  assert.equal(run("current().turns.length"), 5);
  assert.match(elements.get("feed").innerHTML, /续聊成功/);
  assert.doesNotMatch(elements.get("feed").innerHTML, /maximum context length/);
});

test("incognito sends only its own turns and keeps conversation text out of stored state", async () => {
  const saved = JSON.stringify({ current: "regular", mode: "key", memoryEnabled: true, historyEnabled: true,
    memory: [{ id: "saved-memory", text: "常用记忆", always: true }],
    chats: [{ id: "regular", draft: "普通草稿", turns: [{ id: "regular-turn", selected: 0,
      variants: [{ prompt: "历史消息", files: [] }] }] }] });
  let run;
  let stored;
  const payloads = [];
  const native = {
    save(raw) { stored = raw; return true; },
    request(id, type, raw) {
      if (type === "chat") payloads.push(JSON.parse(raw).payload);
      queueMicrotask(() => {
        const emit = (name, data) => run(`window.onNative(${JSON.stringify(id)}, ${JSON.stringify(name)}, ${JSON.stringify(data)})`);
        if (type === "chat") {
          emit("parsed", { name: "无痕附件.txt", pages: 1 });
          emit("sse", { type: "content_block_start", index: 0, content_block: { type: "text", text: "无痕回复" } });
          emit("sse", { type: "message_delta", delta: { title: "无痕生成的标题" }, usage: { input_tokens: 10, detail: "无痕用量附加数据" } });
          emit("sse", { type: "message_stop" });
        }
        emit("ok", type === "info" ? { keyTag: "fixture-key" } : {});
      });
    }
  };
  const elements = openApp({ saved, native, onReady: evaluate => { run = evaluate; } });
  await new Promise(setImmediate);

  run("actions.togglePrivateChat(); current().draft = '记住我的无痕消息'; actions.toggleContext();");
  assert.equal(elements.get("draft").value, "");
  assert.match(elements.get("feed").innerHTML, /无痕对话不会出现在你的历史记录中/);
  await run("actions.send()");
  assert.match(elements.get("feed").innerHTML, /无痕回复/);
  assert.doesNotMatch(elements.get("feed").innerHTML, /保存为记忆|本轮附带/);
  run('actions.userMenu(0)');
  assert.doesNotMatch(elements.get("overlay").innerHTML, /保存为记忆/);
  run('window.appBack(); current().draft = "无痕追问"');
  await run("actions.send()");

  assert.equal(payloads.length, 2);
  assert.equal(payloads[0].system, undefined);
  assert.equal(payloads[1].system, undefined);
  assert.deepEqual(payloads[1].messages.map(message => message.content[0].text), ["记住我的无痕消息", "无痕回复", "无痕追问"]);
  assert.doesNotMatch(stored, /无痕消息|无痕追问|无痕回复|无痕附件|无痕生成的标题|无痕用量附加数据/);
  assert.equal(JSON.parse(stored).current, "regular");
  assert.equal(JSON.parse(stored).chats.length, 1);
  assert.equal(JSON.parse(stored).memory.length, 1);
  assert.ok(JSON.parse(stored).receipts.some(receipt => receipt.title === "无痕对话" && receipt.usage));

  assert.equal(run("window.appBack()"), true);
  assert.equal(elements.get("draft").value, "普通草稿");
  assert.match(elements.get("feed").innerHTML, /历史消息/);
  assert.doesNotMatch(elements.get("feed").innerHTML, /无痕回复/);
  assert.equal(run("actions.togglePrivateChat(); current().turns.length"), 0);
});
