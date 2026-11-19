"use strict";
const C = ChatCore;
const $ = id => document.getElementById(id);
const host = window.Lanwen;
const appName = document.title;
const installedVersion = host?.getAppVersion?.() || "";
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const icons = {
  chat: "M20 11.5a8 8 0 0 1-8 8H4l1.6-4A8 8 0 1 1 20 11.5ZM8 10h8m-8 4h5",
  history: "M4 11a8 8 0 1 1 1.6 6.9M4 5v6h6m2-3v5l3 2",
  new: "M12 5v14M5 12h14", close: "m6 6 12 12M6 18 18 6", back: "m14 6-6 6 6 6",
  newChat: "M4.2 16.5a9 9 0 1 1 5 4l-1.3-.6a2.5 2.5 0 0 0-2.5.3l-1.3.9M12 8v8m-4-4h8",
  ghost: "M3 11.7a9 9 0 0 1 18 0v7.6q0 1.05-1 .55L17.5 18.5l-2.1 2.2q-.65.55-1.3 0L12 18.5l-2.1 2.2q-.65.55-1.3 0L6.5 18.5 4 19.85q-1 .5-1-.55ZM9 10h.01M15 10h.01",
  next: "m10 6 6 6-6 6", down: "m6 9 6 6 6-6", send: "M12 19V5m-6 6 6-6 6 6", stop: "M7 7h10v10H7Z",
  unfold: "m7 9 5-5 5 5m-10 6 5 5 5-5",
  globe: "M3 12h18m-9-9a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0a4 9 0 1 0 0 18 4 9 0 0 0 0-18Z",
  paper: "M8 3h6l5 5v13H5V3h3Zm6 0v5h5M8 13h8m-8 4h6",
  import: "M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5",
  download: "M12 4v10m-4.25-4.25L12 14l4.25-4.25M4 13v4a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-4",
  photo: "M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3ZM4 15l2.5-2a2.7 2.7 0 0 1 3.6.1L17 20m.5-11a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0Z",
  camera: "M4 7h3l1.7-2.3A2 2 0 0 1 10.3 4h3.4a2 2 0 0 1 1.6.7L17 7h3a2 2 0 0 1 2 2v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9a2 2 0 0 1 2-2Zm8 2.6a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z",
  clip: "m20 12-7.8 7.8a5 5 0 0 1-7.1-7.1l8.5-8.5a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-2.8-2.8l7.1-7.1",
  search: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm5 11.5 4.5 4.5",
  copy: "M6 8h6a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4Zm1-3a4 4 0 0 1 4-3h6a4 4 0 0 1 4 4v7a4 4 0 0 1-2 3",
  up: "M8 10l4.5-6.5a1.7 1.7 0 0 1 2.9 1.5L14 9h3.5a3 3 0 0 1 2.8 4l-2 5.5a3 3 0 0 1-2.8 2H6a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3h2v9",
  bad: "M16 14l-4.5 6.5a1.7 1.7 0 0 1-2.9-1.5L10 15H6.5a3 3 0 0 1-2.8-4l2-5.5a3 3 0 0 1 2.8-2H18a3 3 0 0 1 3 3V10a3 3 0 0 1-3 3h-2V4",
  speak: "M3 9h4l6-5v16l-6-5H3Zm13 .1a4 4 0 0 1 0 5.8m2.7-8.3a7.5 7.5 0 0 1 0 10.8",
  share: "M13 8V4l8 7.5-8 7.5v-4c-4.4 0-7.5 1.4-10 4.5C3.4 13 6.6 8.8 13 8Z",
  retry: "M20 10a8.5 8.5 0 1 0 .3 4m0-8v4.5h-4.5",
  dots: "M5 12h.01m7 0h.01m7 0h.01",
  wallet: "M3 6h18v13H3Zm0 3h18m-5 5h2",
  memory: "M5 4h14v16l-7-4-7 4Zm4 5h6",
  crossChatMemory: "M6 4h8a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H9l-4 3v-3.2A3 3 0 0 1 3 10V7a3 3 0 0 1 3-3Zm1 4.5h6M20 9.5a2.8 2.8 0 0 1 1 2.2v4.1a2.7 2.7 0 0 1-2 2.6V21l-4-2.5h-2.5a3 3 0 0 1-2.9-2.4",
  key: "M14 4a5 5 0 1 1-3.7 8.4L5 18v2H3v-4l5.4-5.4A5 5 0 0 1 14 4Zm3 5h.01",
  link: "m10 13 4-4m-6 6-1 1a4 4 0 0 1-5-5l4-4a4 4 0 0 1 5 0m2 10a4 4 0 0 0 5 0l4-4a4 4 0 0 0-5-5l-1 1",
  external: "M13 4h7v7m0-7-9 9m7 0v6H5V6h6",
  settings: "M4 7h16M4 17h16M9 4v6m6 4v6",
  account: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2",
  data: "M20 6c0 2-3.6 3.5-8 3.5S4 8 4 6s3.6-3.5 8-3.5 8 1.5 8 3.5ZM4 6v12c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5V6M4 12c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5",
  moon: "M20.8 14A8.9 8.9 0 0 1 10 3.2 9 9 0 1 0 20.8 14Z",
  about: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v5m0-8h.01",
  check: "m5 12 4 4 10-10"
};
const customGlyphs = {
  menu: '<g fill="currentColor" stroke="none" shape-rendering="crispEdges">'
    + '<rect x="4" y="6.6667" width="16" height="1.5556"/>'
    + '<rect x="4" y="15.7778" width="9.1111" height="1.5556"/></g>',
  // Match the painted sizes while keeping every icon centered in the same box.
  pencil: '<g transform="translate(12 12) scale(.977 .9) translate(-11.72 -12.31)">'
    + '<path stroke-width="2" d="m2.4 19.9 1.3-4.6L15.2 3.8a2.6 2.6 0 0 1 3.7 0l1.2 1.2a2.6 2.6 0 0 1 0 3.7L8.6 20.2l-4.7 1.3a1.2 1.2 0 0 1-1.5-1.6ZM13.5 5.5l5 5"/>'
    + '<path fill="currentColor" stroke="none" d="m13.2 19.4-2.1 2.1h11v-2.1Z"/></g>',
  pin: '<g transform="translate(12 12) scale(.98 .964) translate(-12.125 -11.875)">'
    + '<path stroke-width="2" d="m12.4 2.5 9.1 9.1c-1.5.3-2.9.7-4 1.8l-3.2 3.2-.7 3.9a.8.8 0 0 1-1.4.4l-9.1-9.1a.8.8 0 0 1 .4-1.4l3.9-.7 3.2-3.2c1.1-1.1 1.5-2.5 1.8-4Z"/>'
    + '<path d="m7.4 16.6-4.8 4.8"/></g>',
  unpin: '<g transform="translate(12 12) scale(.95) translate(-12.125 -11.875)">'
    + '<path stroke-width="2" d="M9.6 7.5l1-1c1.1-1.1 1.5-2.5 1.8-4l9.1 9.1c-1.5.3-2.9.7-4 1.8l-1 1M6.5 9.9l-3 .5a.8.8 0 0 0-.4 1.4l9.1 9.1a.8.8 0 0 0 1.4-.4l.5-3"/>'
    + '<path d="m7.4 16.6-4.8 4.8"/><path stroke-width="2" stroke-linecap="butt" d="m3.2 3.2 17.6 17.6"/></g>',
  multi: '<g transform="translate(12 12) scale(.933 .973) translate(-10.97 -12)" stroke-width="1.9" stroke-linecap="butt">'
    + '<circle cx="5.3" cy="7" r="2.9"/><circle cx="5.3" cy="17" r="2.9"/>'
    + '<path d="M11.2 7h9.3m-9.3 10h9.3"/></g>',
  trash: '<path transform="translate(12 12) scale(.984 1.042) translate(-12 -12.25)" stroke-width="2" stroke-linecap="butt"'
    + ' d="M2 6.5h20m-15 0 1.5-2a2.5 2.5 0 0 1 2-1h3a2.5 2.5 0 0 1 2 1l1.5 2M4.2 8.4l.6 8.2A4.7 4.7 0 0 0 9.5 21h5a4.7 4.7 0 0 0 4.7-4.4l.6-8.2M9.5 10.2v6.6m5-6.6v6.6"/>'
};
function icon(name, geometry = customGlyphs[name] || '<path d="' + icons[name] + '"/>') {
  return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + geometry + '</svg>';
}
const historyDots = '<g fill="currentColor" stroke="none"><circle cx="4" cy="12" r="1.6"/>'
  + '<circle cx="12" cy="12" r="1.6"/><circle cx="20" cy="12" r="1.6"/></g>';
function fishMark(kind, viewBox = "0 0 112 72") {
  return '<svg class="fish-mark ' + kind + '" aria-hidden="true" viewBox="' + viewBox + '">'
    // The inner viewport ends at the waterline, including while the tail rotates.
    + '<svg width="112" height="54" viewBox="0 0 112 54" overflow="hidden"><g class="fish-dive"><g class="fish-idle">'
    + '<path class="fish-tail" d="M13 13c14-4 28 0 41 12 1 1 3 1 4-1C71 11 85 7 99 9q3 0 1 2c-8 5-9 15-17 21-7 6-16 5-20 11-3 5-1 13 4 23H45c5-10 7-18 4-23-4-6-14-5-21-10-8-6-9-14-16-18q-2-1 1-2z"/>'
    + '</g></g></svg><g class="fish-surface">'
    + '<path class="fish-water" d="M12 55c11 3 20 2 30 0 5-1 9-1 14-1h8c12 0 21 4 36 1" fill="none" stroke-width="3.4" stroke-linecap="round"/>'
    + '<path class="fish-water" d="M37 64c7-2 13-2 19-1 6 1 12 2 19 0" fill="none" stroke-width="2.5" stroke-linecap="round" opacity=".66"/>'
    + '</g></svg>';
}
const profileMark = fishMark("profile-mark", "9 4 94 66");
const heroMark = () => '<button type="button" class="hero-mark-button" data-do="wagTail" aria-label="' + esc(t("让鱼尾摆动")) + '">'
  + fishMark("hero-mark") + '</button>';
const waitingMark = fishMark("thinking-mark");
const privateTitle = "无痕对话";
const welcomeLines = [
  "今天想聊什么？",
  "想从哪儿聊起？",
  "今天有什么新点子？",
  "有什么想问的？",
  "今天想探索什么？"
];
let welcomeIndex = Math.floor(Math.random() * welcomeLines.length);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const iconAnimations = new WeakMap();
function playIconPart(part, frames, duration, easeOut = true) {
  if (!part.animate || reduceMotion.matches) return;
  const style = getComputedStyle(part);
  const start = { transform: style.transform, opacity: style.opacity };
  const easing = easeOut ? style.getPropertyValue("--ease-out").trim() : "linear";
  iconAnimations.get(part)?.cancel();
  const animation = part.animate(
    [start, ...frames].map(frame => ({ easing, ...frame })),
    { duration }
  );
  iconAnimations.set(part, animation);
  return animation;
}
function wagTail(control) {
  playIconPart(control.querySelector(".fish-tail"), [
    { transform: "rotate(-11deg)", offset: .33 },
    { transform: "rotate(6deg)", offset: .64 },
    { transform: "rotate(0deg)" }
  ], 560);
}
function ib(name, label, command, data = "", extra = "", geometry) {
  return '<button type="button" class="icon ' + extra + '" aria-label="' + esc(label) + '" title="' + esc(label)
    + '" data-do="' + command + '" data-value="' + esc(data) + '">' + icon(name, geometry) + "</button>";
}
function button(label, command, value = "", style = "") {
  return '<button type="button" class="' + style + '" data-do="' + command + '" data-value="' + esc(value) + '">' + esc(label) + '</button>';
}
function entry(label, command, value = "", description = "", pictogram = "") {
  return '<button class="entry" data-do="' + command + '" data-value="' + esc(value) + '">'
    + (pictogram ? '<span class="entry-icon">' + icon(pictogram) + '</span>' : "") + '<span class="entry-text"><strong>' + esc(label) + '</strong>'
    + (description ? '<small>' + esc(description) + '</small>' : '') + '</span><span class="right">' + icon("next") + '</span></button>';
}
const md = window.markdownit?.({ html: false, linkify: false, breaks: true });
if (md) {
  window.installMath?.(md, window.katex);
  md.renderer.rules.image = (tokens, idx) => esc(tokens[idx].content || t("图片"));
  md.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
    if (tokens[index + 1]?.type === "text" && /^\d+$/.test(tokens[index + 1].content) && tokens[index + 2]?.type === "link_close") {
      tokens[index].attrJoin("class", "cite");
    }
    return renderer.renderToken(tokens, index, options);
  };
}

const isStoredObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const storedObjects = value => Array.isArray(value) ? value.filter(isStoredObject) : [];
const storedText = value => typeof value === "string" ? value : "";

function restoreTurn(turn) {
  const versions = storedObjects(turn.variants);
  if (!versions.length) return [];
  const selected = Math.max(0, versions.indexOf(turn.variants[turn.selected]));
  const variants = versions.map(version => ({
    ...version,
    prompt: storedText(version.prompt),
    files: storedObjects(version.files),
    tail: Array.isArray(version.tail) ? storedObjects(version.tail).flatMap(restoreTurn) : undefined,
    reply: isStoredObject(version.reply) ? {
      ...version.reply,
      blocks: Array.isArray(version.reply.blocks) ? version.reply.blocks : [],
      used: storedObjects(version.reply.used)
    } : undefined
  }));
  return [{ ...turn, selected, variants }];
}

function loadState() {
  const defaults = { language: "zh-CN", chats: [], current: "", mode: "", memory: [], memoryEnabled: true, historyEnabled: true,
    dismissedSuggestions: [], dreaming: { enabled: false, seen: [], suggestions: [], attempted: 0, finished: 0 },
    accounts: {}, receipts: [] };
  try {
    const raw = host ? host.load() : localStorage.getItem("lanwen-chat");
    const saved = raw && JSON.parse(raw);
    if (!isStoredObject(saved)) return defaults;
    return {
      ...defaults,
      ...saved,
      language: languages.has(saved.language) ? saved.language : defaults.language,
      chats: storedObjects(saved.chats).filter(chat => storedText(chat.id)).map(chat => ({
        ...chat,
        title: storedText(chat.title),
        draft: storedText(chat.draft),
        files: storedObjects(chat.files),
        references: storedObjects(chat.references).slice(0, 3),
        turns: storedObjects(chat.turns).flatMap(restoreTurn)
      })),
      current: storedText(saved.current),
      mode: ["key", "trial"].includes(saved.mode) ? saved.mode : "",
      memory: storedObjects(saved.memory).filter(entry => typeof entry.text === "string")
        .map(entry => ({ ...entry, supportingSources: storedObjects(entry.supportingSources) })),
      dismissedSuggestions: Array.isArray(saved.dismissedSuggestions) ? saved.dismissedSuggestions.filter(item => typeof item === "string") : [],
      dreaming: {
        enabled: saved.dreaming?.enabled === true,
        seen: Array.isArray(saved.dreaming?.seen) ? saved.dreaming.seen.filter(item => typeof item === "string").slice(0, 250) : [],
        suggestions: storedObjects(saved.dreaming?.suggestions).filter(item => typeof item.text === "string"
          && typeof item.id === "string" && Array.isArray(item.sources) && item.sources.length).slice(0, 8),
        attempted: Number.isFinite(saved.dreaming?.attempted) ? Math.max(0, Math.min(saved.dreaming.attempted, Date.now())) : 0,
        finished: Number.isFinite(saved.dreaming?.finished) ? saved.dreaming.finished : 0
      },
      accounts: isStoredObject(saved.accounts) ? saved.accounts : {},
      receipts: storedObjects(saved.receipts)
    };
  } catch {
    return defaults;
  }
}
const { languages, translate } = window.BlueFishLocale;
const state = loadState();
const t = (message, values) => translate(state.language, message, values);
function errorText(message) {
  const status = /^服务请求失败（HTTP (\d+)）$/.exec(message)?.[1];
  return status ? t("服务请求失败（HTTP {status}）", { status }) : t(message);
}
const appearanceOptions = new Map([["system", "跟随系统"], ["light", "浅色"], ["dark", "深色"]]);
const savedAppearance = host?.getAppearance?.() ?? state.appearance;
let appearance = appearanceOptions.has(savedAppearance) ? savedAppearance : "system";
let info = { key: "", keyTag: "", trialTag: "", trialEndpoint: "" };
let pending = new Map();
let skipped = new Set();
let selected = new Set();
let selecting = false;
let historySearchOpen = false;
const destinations = [
  { id: "chat", label: "对话", glyph: "chat" },
  { id: "memory", label: "记忆", glyph: "memory" },
  { id: "wallet", label: "用量", glyph: "wallet" }
];
let activePage = "chat";
let drawerOpen = false;
let drawerOpener = null;
let historyMenuOpener = null;
let barMarkup = "";
let layers = [];
let renderedSettings;
let gallery = { access: "loading", photos: [] };
let galleryRevision = 0;
const photoImports = new Map();
let pickerInput = null;
const historyImport = { busy: false, message: "", error: false, canView: false };
let attachmentPanel = false;
let editDraft = null;
let privateChat = null;
let regularView = null;
let reading = null;
let request = null;
let dreamingTimer = 0;
let dreamingRun = null;
const DREAMING_INTERVAL = 6 * 60 * 60_000;
const nextDreamingAt = () => state.dreaming.attempted + DREAMING_INTERVAL;
const thoughtChoices = new WeakMap();
let warning = "";
let saving = 0;
let frame = 0;
let toastTimer = 0;
if (!state.chats.some(chat => chat.id === state.current)) makeChat();
for (const chat of state.chats) {
  for (const turn of chat.turns) for (const variant of turn.variants) {
    if (variant.reply?.status === "running") variant.reply.status = "stopped";
  }
}
function writeState(value) {
  const raw = JSON.stringify(value);
  if (host) return host.save(raw);
  localStorage.setItem("lanwen-chat", raw);
  return true;
}
function persist(immediate = false) {
  clearTimeout(saving);
  const save = () => {
    try {
      if (!writeState(state)) toast(t("设备空间不足，未能保存最近变更"));
    } catch { toast(t("设备空间不足，未能保存最近变更")); }
  };
  if (immediate) save();
  else saving = setTimeout(save, 260);
}
function call(type, args = {}, onEvent, id = C.uuid()) {
  if (!host) return Promise.reject({ message: t("此操作需要在安卓 App 中打开"), status: 0 });
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, onEvent });
    host.request(id, type, JSON.stringify(args));
  });
}
window.onNative = (id, type, value) => {
  if (id === "deepseek-export") return handleHistoryImport(type, value);
  if (id === "picker") {
    const input = pickerInput;
    pickerInput = null;
    if (type === "ok" && (!input || input === composerState())) addFiles(value);
    if (type === "fail") toast(value.message);
    return;
  }
  const task = pending.get(id);
  if (!task) return;
  if (type === "ok" || type === "fail" || type === "stopped") {
    pending.delete(id);
    if (type === "fail") task.reject(value);
    else task.resolve(type === "stopped" ? { stopped: true } : value);
  } else task.onEvent?.(type, value);
};
function makeChat() {
  const empty = state.chats.find(chat => !chat.turns.length && !chat.draft && !chat.files.length && !chat.references?.length && !chat.paused);
  const chat = empty || C.newChat();
  if (!empty) state.chats.push(chat);
  state.current = chat.id;
  return chat;
}
const current = () => privateChat || state.chats.find(chat => chat.id === state.current);
const composerState = () => editDraft || current();
const tagOf = mode => mode === "trial" ? info.trialTag : mode === "key" ? info.keyTag : "";
const modeName = mode => mode === "trial" ? t("试用") : t("自带 Key");
function referencesFor(chat, input) {
  return state.historyEnabled && !chat.paused ? (input.references || []).map(source =>
    C.historyReference(state.chats.find(previous => previous.id === source.chat && !previous.paused), source)).filter(Boolean) : [];
}
function contextFor(chat, input, prompt = input.draft) {
  const memories = C.memoriesFor(state.memory, prompt, state.memoryEnabled && !chat.paused, new Set());
  const references = referencesFor(chat, input);
  const selected = memories.filter(item => !(input.skipped || skipped).has(item.id));
  const context = C.contextFor(selected, references);
  return { ...context, memories, references, overflow: selected.length + references.length - context.items.length };
}
function toast(message, variant = "") {
  const notice = $("toast");
  notice.textContent = errorText(message);
  notice.dataset.variant = variant;
  notice.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => notice.hidden = true, 2450);
}
function togglePrivateChat() {
  const feed = $("feed");
  const previousContent = feed.firstElementChild;
  $("draft").blur();
  stopReading();
  attachmentPanel = false;
  $("toast").hidden = true;
  if (privateChat) {
    if (request?.chat === privateChat) actions.stop();
    privateChat = null;
    ({ editDraft, skipped, warning } = regularView);
  } else {
    stopDreaming();
    regularView = { editDraft, skipped, warning, scrollTop: feed.scrollTop };
    privateChat = { ...C.newChat(), paused: true };
    editDraft = null;
    skipped = new Set();
    warning = "";
  }
  document.documentElement.dataset.incognito = String(!!privateChat);
  host?.setIncognito?.(!!privateChat);
  fullRender();
  if (!privateChat) {
    feed.scrollTop = regularView.scrollTop;
    regularView = null;
    jumpVisibility();
    scheduleDreaming();
  }
  const content = feed.firstElementChild;
  const entrance = content !== previousContent
    ? content?.animate?.(
      [{ opacity: 0, transform: reduceMotion.matches ? "none" : "translateY(6px)" }, { opacity: 1, transform: "none" }],
      { duration: reduceMotion.matches ? 140 : 240, easing: "cubic-bezier(.23, 1, .32, 1)" }
    )
    : null;
  if (!privateChat && !reduceMotion.matches) {
    const mark = content?.querySelector(".hero-mark-button");
    if (!mark) return;
    const dive = mark.querySelector(".fish-dive");
    const reveal = dive.getAnimations?.() || [];
    if (entrance) reveal.push(entrance);
    Promise.all(reveal.map(animation => animation.finished)).then(() => {
      if (mark.isConnected && !mark.disabled) wagTail(mark);
    }, () => { /* The reveal was interrupted. */ });
  }
}
function openChat(id, target, source) {
  const chat = state.chats.find(item => item.id === id);
  if (!chat) return toast(t("原对话已删除"));
  if (source?.turn) {
    const path = C.sourcePath(chat.turns, source.turn, source.version);
    if (!path) return toast(t("找不到原消息"));
    if (request?.chat === chat && path.some(step => !chat.turns[step.index] || C.versionOf(chat.turns[step.index]) !== step.variant)) {
      return toast(t("请等当前生成结束后查看这个版本"));
    }
    for (const step of path) C.switchVersion(chat, step.index, step.choice);
  }
  state.current = id;
  if (chat.paused) stopDreaming();
  if (!current().turns.length) {
    const step = 1 + Math.floor(Math.random() * (welcomeLines.length - 1));
    welcomeIndex = (welcomeIndex + step) % welcomeLines.length;
  }
  editDraft = null;
  stopReading();
  skipped.clear();
  attachmentPanel = false;
  warning = "";
  closeDrawer();
  activePage = "chat";
  closeAll();
  fullRender();
  if (target) requestAnimationFrame(() => {
    const element = document.querySelector('[data-message="' + CSS.escape(target) + '"]');
    const answer = source?.role === "answer" ? element?.nextElementSibling : null;
    if (element) (answer?.matches(".assistant") ? answer : element).scrollIntoView({ block: "center" });
    else toast(t("消息位于另一个回答版本"));
  });
  else bottom();
  persist();
  scheduleDreaming();
}
function beginEdit(value) {
  if (request) return toast(t("请先停止正在生成的回答"));
  const index = Number(value);
  const turn = current().turns[index];
  if (!turn) return;
  const item = C.versionOf(turn);
  editDraft = {
    index, draft: item.prompt, files: item.files.map(file => ({ ...file })),
    think: item.think, search: item.search, scrollTop: $("feed").scrollTop, references: [], skipped: new Set()
  };
  closeAll();
  attachmentPanel = false;
  fullRender();
  const draft = $("draft");
  draft.focus({ preventScroll: true });
  draft.setSelectionRange(draft.value.length, draft.value.length);
  centerEditedMessage();
}
function centerEditedMessage() {
  $("feed").querySelector(".is-editing")?.scrollIntoView({ block: "center" });
}
function cancelEdit() {
  if (!editDraft) return;
  const { index, scrollTop } = editDraft;
  editDraft = null;
  attachmentPanel = false;
  fullRender();
  $("feed").scrollTop = scrollTop;
  $("feed").querySelector('.user[data-index="' + index + '"] .bubble')?.focus({ preventScroll: true });
}
function menuButton() {
  return ib("menu", t("打开对话侧栏"), "menu", "", "menu-toggle").replace("<button", '<button aria-controls="drawer" aria-haspopup="dialog"');
}
function alignMenuLines() {
  const density = window.devicePixelRatio || 1;
  const svgUnitsPerPixel = 24 / (31 * density);
  // Both rectangles must span the same whole number of device pixels.
  const height = Math.max(1, Math.round(1.5556 / svgUnitsPerPixel)) * svgUnitsPerPixel;
  document.documentElement.style.setProperty("--menu-line-height", height + "px");
}
function renderBar() {
  const markup = '<div class="app-bar-inner"><div class="regular-chat-control">' + menuButton() + '</div>'
    + '<span class="private-title" role="heading" aria-level="1">' + esc(t(privateTitle)) + '</span>'
    + '<div class="app-bar-actions"><div class="regular-chat-control">'
    + ib("newChat", t("新建对话"), "new", "", "new-chat") + '</div>'
    + ib("ghost", t("进入无痕对话"), "togglePrivateChat", "", "private-toggle").replace("</button>", icon("close") + "</button>") + '</div></div>';
  if (markup !== barMarkup) {
    $("bar").innerHTML = markup;
    barMarkup = markup;
  }
  const bar = $("bar");
  bar.querySelector(".private-title").setAttribute("aria-hidden", String(!privateChat));
  bar.querySelector(".menu-toggle").disabled = !!privateChat;
  bar.querySelector(".new-chat").disabled = !!privateChat;
  updateControl(bar.querySelector(".private-toggle"), privateChat ? t("退出无痕对话") : t("进入无痕对话"));
}

let appUpdate = { version: "", status: "available" };
function renderNavigation() {
  $("navigation").innerHTML = '<div class="drawer-profile" data-do="settings">'
    + profileMark + '<span class="drawer-brand">' + esc(appName) + '</span>'
    + ib("download", t("下载更新"), "downloadAppUpdate", "", "app-update").replace("<button", "<button hidden")
    + ib("dots", t("{app} 设置", { app: appName }), "settings", "", "drawer-settings", historyDots) + '</div>';
  renderAppUpdate();
}
function renderAppUpdate() {
  const control = $("navigation").querySelector(".app-update");
  const { version, status } = appUpdate;
  const busy = status === "downloading" || status === "fallback";
  const label = busy ? "正在下载 BlueFish {version}" : status === "ready" ? "安装 BlueFish {version}" : "下载 BlueFish {version} 更新";
  control.hidden = !version;
  control.disabled = busy;
  control.setAttribute("aria-busy", String(busy));
  updateControl(control, t(label, { version }));
}
window.onAppUpdate = (version, status) => {
  const notices = {
    downloading: "正在下载 BlueFish {version}",
    fallback: "正在从备用源下载更新",
    downloadFailed: "更新下载失败，点按下载按钮可重试。",
    permission: "请允许 BlueFish 安装更新。",
    installFailed: "无法打开安装器，点按下载按钮可重试。"
  };
  const next = status === "installFailed" || status === "permission" ? "ready" : status;
  appUpdate = { version, status: next };
  renderAppUpdate();
  if (version && notices[status]) toast(t(notices[status], { version }));
};
function visibleMenu() {
  if (privateChat) return $("bar").querySelector(".private-toggle");
  return $(activePage === "chat" ? "bar" : "screen").querySelector(".menu-toggle");
}
function openDrawer(control) {
  if (privateChat) return;
  drawerOpener = control;
  drawerOpen = true;
  host?.syncAppUpdate?.();
  $("draft").blur();
  if (attachmentPanel) {
    attachmentPanel = false;
    renderTools();
  }
  renderLayer();
  $("history-title")?.focus({ preventScroll: true });
}
function closeDrawer(restoreFocus = false) {
  if (!drawerOpen) return;
  closeHistoryMenu();
  if (historySearchOpen) dismissHistorySearch(false);
  drawerOpen = false;
  selecting = false;
  selected.clear();
  if (restoreFocus) {
    renderLayer();
    (drawerOpener?.isConnected ? drawerOpener : visibleMenu())?.focus({ preventScroll: true });
  }
  drawerOpener = null;
}

function navigate(name) {
  if (!destinations.some(item => item.id === name) || (activePage === name && !layer() && !drawerOpen)) return;
  const composerWasOpen = attachmentPanel;
  attachmentPanel = false;
  if (composerWasOpen) renderTools();
  closeDrawer();
  activePage = name;
  closeAll();
  if (name === "wallet" && state.mode) refresh(state.mode);
  if (name === "chat") jumpVisibility();
}

function renderFeed(streamIndex = -1) {
  const node = $("feed");
  const chat = current();
  const preserve = node.dataset.chat === chat.id;
  const languageChanged = node.dataset.language !== state.language;
  node.dataset.language = state.language;
  const previousTop = node.scrollTop;
  const pinToEnd = preserve && node.scrollHeight - node.clientHeight - previousTop < 84;
  node.dataset.chat = chat.id;
  $("app").dataset.welcome = String(!chat.turns.length);
  $("draft").placeholder = t("随心输入");
  const liveArticle = streamIndex < 0 ? null : node.querySelector('.assistant[data-index="' + streamIndex + '"]');
  if (liveArticle && preserve) {
    const turn = chat.turns[streamIndex];
    const item = C.versionOf(turn);
    const template = document.createElement("template");
    template.innerHTML = renderReply(item, streamIndex);
    updateLiveArticle(liveArticle, template.content.firstElementChild);
  } else if (!chat.turns.length) {
    const greeting = t(welcomeLines[welcomeIndex]);
    if (languageChanged || !node.firstElementChild?.classList.contains("welcome")) {
      node.innerHTML = '<div class="welcome">' + heroMark() + '<h1>' + esc(greeting) + '</h1>'
        + '<p class="private-notice"><span>' + esc(t("无痕对话不会出现在你的历史记录中，")) + '</span> <span>' + esc(t("也不会进入 AI 的跨对话记忆。")) + '</span></p></div>';
    }
    const welcome = node.querySelector(".welcome");
    const title = welcome.querySelector("h1");
    if (title.textContent !== greeting) title.textContent = greeting;
    title.setAttribute("aria-hidden", String(!!privateChat));
    welcome.querySelector(".private-notice").setAttribute("aria-hidden", String(!privateChat));
    const mark = welcome.querySelector(".hero-mark-button");
    mark.disabled = !!privateChat;
    mark.setAttribute("aria-hidden", String(!!privateChat));
  } else {
    node.innerHTML = '<div class="messages">' + chat.turns.map((turn, index) => {
      const item = C.versionOf(turn);
      const files = item.files.length ? '<div class="msg-files">' + item.files.map((file, i) =>
        attachmentCard(file, "pastFile", index + ":" + i)).join("") + '</div>' : "";
      const editing = editDraft?.index === index;
      const { selected, variants } = turn;
      const total = variants.length;
      const versions = total > 1
        ? ib("back", t("上一版本"), "version", index + ":" + ((selected + total - 1) % total))
          + '<span class="version-count" style="--version-digits:' + String(total).length + '">' + (selected + 1) + " / " + total + '</span>'
          + ib("next", t("下一版本"), "version", index + ":" + ((selected + 1) % total))
        : "";
      return '<article class="message user' + (editing ? " is-editing" : "") + '" data-message="' + esc(turn.id) + '" data-menu="userMenu" data-index="' + index + '">'
        + files + '<div class="user-line">' + button(item.prompt || t("修改附件"), "edit", index, "bubble") + '</div>'
        + (versions ? '<div class="alt">' + versions + '</div>' : "") + '</article>'
        + renderReply(item, index);
    }).join("") + '</div>';
  }
  const preview = node.querySelector(".thought[data-preview=true] .thought-preview");
  if (preview) {
    preview.dataset.clipped = String(preview.scrollHeight > preview.clientHeight);
    preview.scrollTop = preview.scrollHeight;
  }
  if (reading) syncReading();
  node.scrollTop = pinToEnd ? node.scrollHeight : preserve ? previousTop : 0;
  jumpVisibility();
}
function updateLiveArticle(previous, next) {
  const before = previous.querySelector(".thought, .reply-progress");
  const after = next.querySelector(".thought, .reply-progress");
  if (!before || !after || before.className !== after.className || before.dataset.preview !== after.dataset.preview) {
    if (previous.innerHTML !== next.innerHTML) previous.replaceWith(next);
    return;
  }
  // Keep the animated mark and disclosure in place as streaming text arrives.
  for (const selector of [".thought-label", ".thoughtBody", ".reply"]) {
    const current = previous.querySelector(selector);
    const update = next.querySelector(selector);
    if (current && current.innerHTML !== update.innerHTML) current.innerHTML = update.innerHTML;
  }
  const currentReply = previous.querySelector(".reply");
  while (currentReply.nextElementSibling) currentReply.nextElementSibling.remove();
  let sibling = next.querySelector(".reply").nextElementSibling;
  while (sibling) {
    const following = sibling.nextElementSibling;
    previous.append(sibling);
    sibling = following;
  }
}
function renderMarkdown(text) {
  return md ? md.render(text) : '<p class="snippet">' + esc(text) + '</p>';
}
function displayReplyText(reply, text = C.textOf(reply)) {
  return reply?.stopReason === "refusal" ? t(text) : text;
}
function progressCaption(blocks, attachment) {
  if (attachment) return t(attachment.label, { name: attachment.name });
  // A batch can return one tool result while other calls are still pending.
  const resolved = new Set();
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (!block) continue;
    if (block.type === "thinking") {
      if (!resolved.size) return t("正在思考");
      break;
    }
    if (block.type === "text") return t("正在生成回答");
    if (block.tool_use_id) resolved.add(block.tool_use_id);
    if (block.type !== "server_tool_use" || resolved.has(block.id)) continue;
    const action = block.input?.action;
    if (action === "read_link" || block.name === "deepseek_read_url") return t("正在阅读链接");
    if (block.kind === "image_search" || block.kind === "deep_image_search") return t("正在搜索图片");
    if (action === "find_in_page") return t("正在查找页内内容");
    if (action === "open_page") return t("正在打开网页");
    if (action === "search" || block.input?.queries?.length || ["deepseek_web_search", "web_search"].includes(block.name)) {
      return t("正在搜索网页");
    }
  }
  return t("正在等待回复…");
}
function renderReply(item, index) {
  const { reply } = item;
  if (!reply) return "";
  const chat = current();
  const sources = C.sourcesFor(reply);
  const outline = reply.blocks.flatMap(block => {
    if (!block) return [];
    if (block.type === "thinking" && block.thinking) return [{ text: block.thinking }];
    if (block.input?.queries?.length) return [{ glyph: "search", text: t("搜索 {queries}", { queries: block.input.queries.join(state.language === "en" ? ", " : "、") }) }];
    if (block.input?.action === "open_page") return [{ glyph: "link", text: t("打开 {url}", { url: block.input.url }) }];
    if (block.input?.action === "read_link") return [{ glyph: "link", text: t("阅读 {url}", { url: block.input.url }) }];
    if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      const names = block.content.filter(item => item.url).map(item => item.site_name || item.title).filter(Boolean);
      if (names.length) return [{ glyph: "globe", text: t("已找到 {count} 个网页", { count: names.length }) }];
    }
    if (block.type === "web_fetch_tool_result" && block.content?.url) return [{ glyph: "paper", text: t("已浏览 {page}", { page: block.content.content?.title || block.content.url }) }];
    return [];
  });
  const active = reply.status === "running";
  const content = reply.blocks.filter(block => block?.type === "text");
  let text = "";
  for (const block of content) {
    const marks = new Map();
    for (const citation of block.citations || []) {
      const source = sources.findIndex(item => item.url === C.httpUrl(citation.url));
      if (source < 0) continue;
      const offset = citation.cited_text && block.text?.startsWith(citation.cited_text) ? citation.cited_text.length : block.text.length;
      const mark = " [" + (source + 1) + "](" + citation.url.replace(/[()\s<>]/g, char => encodeURIComponent(char)) + ")";
      marks.set(offset, (marks.get(offset) || "") + mark);
    }
    let offset = 0;
    for (const [position, mark] of [...marks].sort((a, b) => a[0] - b[0])) {
      text += block.text.slice(offset, position) + mark;
      offset = position;
    }
    text += block.text?.slice(offset) || "";
  }
  const body = text ? renderMarkdown(displayReplyText(reply, text)) : "";
  const preview = active && !text.trim();
  const label = preview ? (request?.reply === reply && request.compacting ? t("正在压缩早期对话…")
    : progressCaption(reply.blocks, request?.reply === reply ? request.attachment : null))
    : outline.some(row => !row.glyph) ? t("已思考") : t("已搜索");
  const spent = reply.thoughtElapsed || reply.elapsed;
  const caption = label + (!preview && spent ? t("（用时 {seconds} 秒）", { seconds: spent }) : "");
  const statusLabel = (preview ? '<span class="thought-label status-sweep" aria-live="polite" aria-atomic="true">'
    : '<span class="thought-label">') + esc(caption) + '</span>';
  const thought = outline.length || (preview && (item.think || item.search))
    ? '<details class="thought" data-preview="' + preview + '"' + (preview || thoughtChoices.get(reply) ? ' open' : '') + '>'
      + '<summary>' + (preview ? waitingMark : "") + statusLabel
      + '<span class="thought-chevron">' + icon(preview ? "unfold" : "next") + '</span></summary><div class="thought-preview"><div class="thoughtBody">'
      + outline.map(row => row.glyph
        ? '<div class="thought-tool">' + icon(row.glyph) + '<span>' + esc(row.text) + '</span></div>'
        : '<div class="thought-text">' + renderMarkdown(row.text) + '</div>').join("") + '</div></div></details>' : "";
  const progress = preview && !thought ? '<p class="reply-progress">' + statusLabel + '</p>' : "";
  const error = reply.error ? '<p class="row-error">' + esc(errorText(reply.error)) + '</p>' : reply.status === "stopped"
    ? '<p class="muted">' + esc(t("已停止 · 已保留收到的内容")) + '</p>' : reply.stopReason === "max_tokens" ? '<p class="muted">' + esc(t("DeepSeek 因长度限制结束了本轮回答")) + '</p>' : "";
  const toolbar = active ? "" : '<div class="actions">'
    + (body ? ib("copy", t("复制"), "copyReply", index).replace("</button>", icon("check") + "</button>")
      + ib("up", t("赞"), "feedback", index + ":up").replace('data-do=', 'aria-pressed="' + (reply.feedback === "up") + '" data-do=')
      + ib("bad", t("踩"), "feedback", index + ":bad").replace('data-do=', 'aria-pressed="' + (reply.feedback === "bad") + '" data-do=')
      + ib("speak", t("朗读回答"), "speakReply", index).replace("<button", '<button aria-pressed="false"').replace("</button>", icon("stop") + "</button>")
      + ib("share", t("分享"), "shareReply", index) : "")
    + ib("retry", t("重新生成"), "retry", index, "end") + '</div>';
  const list = sources.length ? '<button class="source-summary" data-do="sources" data-value="' + index + '">' + icon("globe")
    + esc(t("{count} 个网页", { count: sources.length })) + '</button>' : "";
  const used = reply.used?.length ? '<details class="used-memory muted"><summary>' + esc(t("本轮附带 {count} 条上下文", { count: reply.used.length })) + '</summary>'
    + reply.used.map(row => '<div class="used-item">' + contextText(row) + (row.source
      ? button(t("查看原消息"), "openSource", JSON.stringify(row.source)) : "") + '</div>').join("") + '</details>' : "";
  const intent = index === chat.turns.length - 1 && !active && !reply.error && reply.status === "done" && state.memoryEnabled && !chat.paused
    ? C.memoryIntent(item.prompt, item.at || reply.start || chat.updated) : null;
  const target = intent?.explicit ? C.memoryTarget(intent, state.memory, chat.id) : null;
  const suggestion = intent?.explicit && C.isCurrent(intent) && !suggestionHandled(intent)
    && !(target?.updated > (item.at || reply.start || chat.updated))
    ? '<div class="reply-memory-action">' + button(target ? t("更新记忆") : t("保存为记忆"),
      "memoryIntent", index, "secondary") + '</div>' : "";
  return '<article class="message assistant" data-menu="replyMenu" data-index="' + index + '"'
    + (body && !active ? ' tabindex="0" aria-label="' + esc(t("回答")) + '" aria-keyshortcuts="Shift+F10"' : '') + '>'
    + thought + progress
    + '<div class="reply">' + body + '</div>' + error + list + toolbar + used + suggestion + '</article>';
}
function balanceFor(mode) { return state.accounts[mode]?.data; }
function depleted(mode) {
  const balance = balanceFor(mode);
  return mode === "trial" ? balance?.available <= 0 : balance?.is_available === false;
}
function initComposer() {
  const ring = '<g class="mode-orbit"><path d="M2.5 12a9.5 9.5 0 0 1 19 0" opacity=".64" vector-effect="non-scaling-stroke"/>'
    + '<path d="M2.5 12a9.5 9.5 0 0 0 19 0" vector-effect="non-scaling-stroke"/></g>';
  const atom = icon("think", '<g transform="rotate(45 12 12)">' + ring + '</g>'
    + '<g transform="rotate(-45 12 12)">' + ring + '</g>'
    + '<circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>');
  const meridian = ' d="M12 2.4a9.6 9.6 0 0 1 0 19.2" stroke-width="1.5" vector-effect="non-scaling-stroke"/>';
  const globe = icon("globe", '<g stroke-width="1.9"><circle cx="12" cy="12" r="9.6"/><path d="M2.4 12h19.2"/>'
    + '<path class="mode-meridian west"' + meridian + '<path class="mode-meridian east"' + meridian + '</g>');
  const chip = (glyph, label, command) => '<button class="chip" type="button" aria-pressed="false" data-do="' + command + '">'
    + glyph + '<span>' + label + '</span></button>';
  $("compose-modes").innerHTML = chip(atom, t("深度思考"), "think") + chip(globe, t("智能搜索"), "search")
    + chip(icon("crossChatMemory"), t("跨对话记忆"), "toggleContext");
  $("compose-actions").innerHTML = ib("new", t("添加附件"), "attach", "", "attach-control")
    .replace("<button", '<button aria-controls="attachment-panel" aria-expanded="false"')
    + ib("send", t("发送消息"), "send", "", "send-control").replace("</button>", icon("stop") + "</button>");
  $("edit-banner").innerHTML = '<span>' + esc(t("修改输入")) + '</span>' + ib("close", t("取消修改"), "cancelEdit");
}
function turnThinkingRings(control) {
  control.querySelectorAll(".mode-orbit").forEach((ring, index) => {
    const playState = iconAnimations.get(ring)?.playState;
    if (playState === "running" || playState === "paused") return;
    // Orthographic projection of a circle turning around its local horizontal axis.
    const flipped = ring.classList.contains("is-flipped");
    const tilt = Math.acos(.42) + (flipped ? Math.PI : 0);
    const direction = index === 0 ? 1 : -1;
    const frames = Array.from({ length: 8 }, (_, step) => {
      const angle = tilt + direction * (step + 1) * Math.PI / 8;
      return { transform: "scaleY(" + Math.cos(angle).toFixed(4) + ")" };
    });
    if (playIconPart(ring, frames, 280, false)) ring.classList.toggle("is-flipped", !flipped);
  });
}
function turnSearchGlobe(control) {
  const [west, east] = control.querySelectorAll(".mode-meridian");
  // Each meridian disappears at the rim and comes around on the other side.
  playIconPart(east, [
    { transform: "scaleX(.96)", opacity: 0, offset: .22 },
    { transform: "scaleX(-.96)", opacity: 0, offset: .23 },
    { transform: "scaleX(-.54)", opacity: 1, offset: .36 },
    { transform: "scaleX(.42)", opacity: 1 }
  ], 280, false);
  playIconPart(west, [
    { transform: "scaleX(.24)", opacity: 1, offset: .34 },
    { transform: "scaleX(.96)", opacity: 0, offset: .57 },
    { transform: "scaleX(-.96)", opacity: 0, offset: .58 },
    { transform: "scaleX(-.42)", opacity: 1 }
  ], 280, false);
}
function toggleComposerMode(mode) {
  const input = composerState();
  input[mode] = !input[mode];
  renderTools();
  if (!editDraft) persist();
}
function updateModeEdges() {
  const strip = $("compose-modes");
  strip.dataset.fadeStart = String(strip.scrollLeft > 1);
  strip.dataset.fadeEnd = String(strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1);
}
function updateControl(control, label) {
  control.setAttribute("aria-label", label);
  control.title = label;
}
function syncReading() {
  for (const button of $("feed").querySelectorAll('[data-do="speakReply"]')) {
    const playing = reading?.index === button.dataset.value;
    button.setAttribute("aria-pressed", String(playing));
    updateControl(button, playing ? t("停止朗读") : t("朗读回答"));
  }
}
function stopReading() {
  if (!reading) return;
  reading = null;
  host?.stopSpeech?.();
  syncReading();
}
window.onSpeechFinished = (id, failed) => {
  if (reading?.id !== id) return;
  reading = null;
  syncReading();
  if (failed) toast(t("无法朗读，请检查安卓的文字转语音设置"));
};
const fileTypes = [
  [/^(docx?)$|wordprocessingml|msword/, "document", "M9 14h10m-10 4h10m-10 4h6.5"],
  [/^pdf$|\/pdf$/, "pdf", "M9 23c3-3 4-6 4-10 1 4 3 6 7 7-4-1-8 0-11 3Z"],
  [/^(xlsx?|csv)$|spreadsheetml|excel|\/csv$/, "sheet", "M9 14h10v9H9Zm0 4.5h10M14 14v9"],
  [/^(pptx?)$|presentationml|powerpoint/, "slides", "M9 13.5h10v6H9Zm5 6v2.5m-2.5 2 2.5-2 2.5 2"],
  [/^(epub|mobi)$|epub|mobipocket/, "book", "M8.5 14q3-1.5 5.5.7 2.5-2.2 5.5-.7v8q-3-1.5-5.5.7-2.5-2.2-5.5-.7Zm5.5.7v8"],
  [/^(json|xml|html|js|ts|py|java|kt|c|cpp|h|yaml|yml)$|json|xml|javascript|html/, "code", "m11 15-3 3.5 3 3.5m6-7 3 3.5-3 3.5m-2-8-2 9"],
  [/^(txt|md|log)$|^text\//, "text", "M9 14h10m-10 4h6.5m-6.5 4h10"]
];
function attachmentName(file) {
  return typeof file.pastedText === "string" ? t("粘贴的文本") : String(file.name ?? t("文件"));
}
function attachmentSize(size) {
  if (!Number.isFinite(size) || size < 0) return t("大小未知");
  const unit = size >= 1024 * 1024 ? "MB" : size >= 1024 ? "KB" : "B";
  const divisor = unit === "MB" ? 1024 * 1024 : unit === "KB" ? 1024 : 1;
  return new Intl.NumberFormat(state.language === "en" ? "en" : "zh-CN", {
    maximumFractionDigits: 1
  }).format(size / divisor) + " " + unit;
}
function attachmentCard(file, action, value) {
  const name = attachmentName(file);
  const base = 'type="button" data-do="' + action + '" data-value="' + value + '"';
  if (file.mime === "image/jpeg") {
    return '<button ' + base + ' class="attachment-card attachment-image" aria-label="' + esc(name) + '">'
      + '<img alt="" loading="lazy" decoding="async" src="/thumb/' + esc(file.id) + '"></button>';
  }
  const pasted = typeof file.pastedText === "string";
  const suffix = pasted ? "" : name.match(/\.[a-z\d]{1,8}$/i)?.[0] || "";
  const extension = suffix === name ? "" : suffix;
  const ext = extension.slice(1).toLowerCase();
  const type = fileTypes.find(([pattern]) => pattern.test(ext))
    || fileTypes.find(([pattern]) => pattern.test(file.mime || ""));
  const [kind, glyph] = pasted ? ["paste", "M9 14h2m2.5 0H19M9 18h10m-10 4h6"]
    : type?.slice(1) || ["generic", "M10 18h.01m4 0h.01m4 0h.01"];
  const stem = Array.from(extension ? name.slice(0, -extension.length) : name);
  const maxStemLength = 32 - extension.length;
  const title = stem.length > maxStemLength ? stem.slice(0, maxStemLength - 1).join("") + "…" : stem.join("");
  const meta = pasted ? t("粘贴至对话框") : attachmentSize(file.size);
  return '<button ' + base + ' class="attachment-card attachment-file" title="' + esc(name) + '" aria-label="' + esc(name + " · " + meta) + '">'
    + '<span class="attachment-icon" data-kind="' + kind + '">'
    + '<svg aria-hidden="true" viewBox="0 0 28 32" fill="none">'
    + '<path class="attachment-icon-page" d="M6.8 2h11.6l7 7v17.3a3.7 3.7 0 0 1-3.7 3.7H6.8a3.7 3.7 0 0 1-3.7-3.7V5.7A3.7 3.7 0 0 1 6.8 2Z"/>'
    + '<path class="attachment-icon-fold" d="M18.4 2v5.1c0 1 .9 1.9 1.9 1.9h5.1Z"/>'
    + '<path class="attachment-icon-detail" d="' + glyph + '"/></svg>'
    + '</span><span class="attachment-info"><span class="attachment-name"><span class="attachment-stem">'
    + esc(title) + '</span>' + (extension ? '<span class="attachment-extension">' + esc(extension) + '</span>' : '') + '</span>'
    + '<span class="attachment-meta">' + esc(meta) + '</span></span></button>';
}
let composerAttachmentMarkup = "";
function renderTools(animateAttachment = false) {
  const chat = current();
  const input = composerState();
  const busy = request?.chat === chat;
  const modes = $("compose-modes");
  modes.querySelector('[data-do="think"]').setAttribute("aria-pressed", String(!!input.think));
  modes.querySelector('[data-do="search"]').setAttribute("aria-pressed", String(!!input.search));
  const memoryToggle = modes.querySelector('[data-do="toggleContext"]');
  memoryToggle.hidden = !!privateChat;
  memoryToggle.setAttribute("aria-pressed", String(!chat.paused));
  const attach = $("compose-actions").querySelector(".attach-control");
  const dock = $("dock");
  const tray = $("attachment-tray");
  const expanded = String(attachmentPanel);
  if (dock.dataset.attachmentsOpen !== expanded) {
    if (!attachmentPanel && document.activeElement && tray.contains(document.activeElement)) {
      attach.focus({ preventScroll: true });
    }
    dock.dataset.attachmentsInstant = String(!animateAttachment);
    dock.dataset.attachmentsOpen = expanded;
    tray.inert = !attachmentPanel;
  }
  attach.setAttribute("aria-expanded", expanded);
  updateControl(attach, attachmentPanel ? t("收起附件") : t("添加附件"));
  const sendButton = $("compose-actions").querySelector(".send-control");
  sendButton.dataset.do = busy ? "stop" : "send";
  sendButton.disabled = !busy && (!!request || [...photoImports.values()].includes(input) || (!input.draft.trim() && !input.files.length));
  updateControl(sendButton, busy ? t("停止生成") : editDraft ? t("发送修改后的消息") : t("发送消息"));
  updateModeEdges();
  const attachmentMarkup = input.files.map((file, index) => '<span class="attachment">'
    + attachmentCard(file, "preview", index)
    + ib("close", t("移除 {name}", { name: attachmentName(file) }), "removeFile", index, "attachment-remove") + '</span>').join("");
  if (attachmentMarkup !== composerAttachmentMarkup) {
    $("attachments").innerHTML = attachmentMarkup;
    composerAttachmentMarkup = attachmentMarkup;
  }
  renderAttachmentPanel(input);
  const mode = state.mode;
  const message = errorText(warning) || (depleted(mode) ? t(mode === "trial" ? "试用额度已用完" : "DeepSeek 账户余额不足") : "");
  $("notice").innerHTML = message ? '<div class="notice"><span>' + esc(message) + '</span>'
    + button(mode === "trial" ? t("使用自己的 Key") : t("查看设置"), mode === "trial" ? "key" : "wallet") + '</div>' : "";
  syncBackHandler();
}
function renderAttachmentPanel(input) {
  if (!attachmentPanel) return;
  const panel = $("attachment-panel");
  const { access, photos } = gallery;
  const tiles = photos.map(photo => {
    const selected = input.files.some(file => file.galleryId === photo.id);
    const importing = photoImports.get(photo.id) === input;
    return '<button class="recent-photo" type="button" data-do="recentPhoto" data-value="' + esc(photo.id)
      + '" aria-label="' + esc(photo.name) + '" aria-pressed="' + selected + '" aria-busy="' + importing + '">'
      + '<img alt="" src="/gallery-thumb/' + esc(photo.id) + '" loading="lazy"><span class="photo-check">' + icon("check") + '</span></button>';
  }).join("");
  const accessButton = access === "none" || access === "limited"
    ? button(access === "limited" ? t("调整照片权限") : t("允许显示最近照片"), "photoAccess", "", "gallery-access") : "";
  const status = access === "loading" ? t("正在读取最近照片…") : access === "error" ? t("暂时无法读取最近照片")
    : access === "full" && !photos.length ? t("相册里没有照片") : "";
  const markup = '<div class="recent" role="group" aria-label="' + esc(t("最近照片")) + '">' + tiles + accessButton
    + (status ? '<p class="gallery-status" role="status">' + status + '</p>' : '') + '</div>'
    + '<div class="attachment-shortcuts">' + [["camera", t("拍照"), "camera"], ["photo", t("相册"), "photo"], ["clip", t("文件"), "file"]]
      .map(([glyph, label, value]) => '<button type="button" data-do="pick" data-value="' + value + '">' + icon(glyph) + '<span>' + label + '</span></button>').join("") + '</div>';
  if (panel.dataset.markup === markup) return;
  const position = panel.querySelector(".recent")?.scrollLeft || 0;
  const focus = document.activeElement;
  const key = panel.contains(focus) ? focus.dataset.value : null;
  panel.innerHTML = markup;
  panel.dataset.markup = markup;
  panel.querySelector(".recent").scrollLeft = position;
  if (key) panel.querySelector('[data-value="' + CSS.escape(key) + '"]')?.focus({ preventScroll: true });
}
window.refreshRecentPhotos = async () => {
  if (!attachmentPanel) return;
  const revision = ++galleryRevision;
  try {
    const snapshot = await call("recentPhotos");
    if (revision !== galleryRevision || !attachmentPanel) return;
    gallery = snapshot;
  } catch {
    if (revision !== galleryRevision || !attachmentPanel) return;
    gallery = { access: "error", photos: [] };
  }
  renderAttachmentPanel(composerState());
};
async function toggleRecentPhoto(id) {
  const input = composerState();
  const selected = input.files.findIndex(file => file.galleryId === id);
  if (selected >= 0) {
    input.files.splice(selected, 1);
    renderTools();
    if (!editDraft) persist();
    return;
  }
  if (photoImports.has(id)) return;
  photoImports.set(id, input);
  renderTools();
  try {
    const file = await call("importRecentPhoto", { id });
    if (input !== composerState()) return;
    input.files.push({ ...file, galleryId: id });
    if (!editDraft) persist();
  } catch (error) {
    if (input === composerState()) toast(error.message);
  } finally {
    photoImports.delete(id);
    if (input === composerState()) renderTools();
  }
}
function syncBackHandler() {
  host?.setBackIntercept?.(layers.length > 0 || drawerOpen || activePage !== "chat" || attachmentPanel || !!editDraft || !!privateChat);
}
function jumpVisibility() {
  const node = $("feed");
  const edge = $("feed-region");
  const scrolled = String(node.scrollTop > 1 && current().turns.length > 0);
  if (edge.dataset.scrolled !== scrolled) edge.dataset.scrolled = scrolled;
  const visible = node.scrollHeight - node.clientHeight - node.scrollTop > 112;
  let jump = $("jump");
  if (!jump && visible) {
    const dots = '<span class="jump-dots" aria-hidden="true"><span></span><span></span><span></span></span>';
    const control = ib("down", t("回到最新消息"), "bottom", "", "jump")
      .replace("<button", '<button id="jump"').replace("</button>", dots + "</button>");
    $("dock").insertAdjacentHTML("afterbegin", control);
    jump = $("jump");
  }
  if (!jump) return;
  jump.hidden = !visible;
  jump.dataset.streaming = String(request?.chat === current() && request.reply.status === "running");
}
function bottom() { $("feed").scrollTop = $("feed").scrollHeight; jumpVisibility(); }
function sizeDraft() {
  const field = $("draft");
  field.style.height = "48px";
  field.style.height = Math.max(48, Math.min(field.scrollHeight + 1, 132)) + "px";
}
function fullRender() {
  renderBar();
  $("app").dataset.editing = String(!!editDraft);
  $("edit-banner").hidden = !editDraft;
  $("draft").setAttribute("aria-label", editDraft ? t("修改输入") : t("消息"));
  $("draft").value = composerState().draft;
  $("compose-modes").scrollLeft = 0;
  sizeDraft();
  renderFeed();
  renderTools();
}
function scheduleRender() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (request?.chat !== current()) return;
    const { index, reply } = request;
    const turn = current().turns[index];
    if (turn && C.versionOf(turn)?.reply === reply) renderFeed(index);
  });
}

function push(name, data = {}) {
  const inSettings = name === "settings" || !!layer()?.inSettings;
  layers.push({ name, data, inSettings, opener: document.activeElement });
  renderLayer();
  if (name === "rename") {
    const field = $("rename-field");
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
    return;
  }
  const heading = layerHost().querySelector(".layer-head h2");
  heading?.setAttribute("tabindex", "-1");
  heading?.focus({ preventScroll: true });
}
function closeAll() { layers = []; renderLayer(); }
function closeLayer() {
  const previous = layers.pop();
  renderLayer();
  const root = layerHost();
  const opener = previous?.opener;
  const restoreRoot = layer()?.inSettings ? root : whenHistory() ? historySurface() : null;
  const restored = restoreRoot && opener?.dataset.do && !opener.isConnected
    ? [...restoreRoot.querySelectorAll("[data-do]")].find(control =>
      control.dataset.do === opener.dataset.do && control.dataset.value === opener.dataset.value)
    : null;
  const fallback = root.querySelector(".layer-head button")
    || (historySearchOpen ? $("history-query") : drawerOpen ? $("history-title") : visibleMenu());
  (opener?.isConnected ? opener : restored || fallback)?.focus({ preventScroll: true });
}
function layer() { return layers[layers.length - 1]; }
function layerHost() { return $(layer()?.inSettings ? "settings-screen" : "overlay"); }
function panel(title, contents, type = "sheet", footer = "") {
  const inSettings = layer()?.inSettings;
  const tag = inSettings ? "main" : "section";
  const page = inSettings || type === "page";
  const style = inSettings ? 'class="layer page settings-page"' : 'class="layer ' + type + '" role="dialog" aria-modal="true"';
  return '<' + tag + ' ' + style + ' aria-label="' + esc(title) + '"><div class="layer-head">'
    + (page ? ib("back", t("返回"), "close") : '') + '<h2>' + esc(title) + '</h2>'
    + (page ? '' : ib("close", t("关闭"), "close"))
    + '</div><div class="scroll body-pad">' + (inSettings ? '<div class="settings-sections">' + contents + '</div>' : contents)
    + '</div>' + (footer ? '<div class="layer-footer">' + footer + '</div>' : '') + '</' + tag + '>';
}
function historyDialog(title, contents, actions, type) {
  return '<section class="layer history-dialog ' + type + '" role="dialog" aria-modal="true" aria-labelledby="history-dialog-title"'
    + (type === "history-delete" ? ' aria-describedby="history-delete-note"' : '')
    + '><div class="layer-head"><h2 id="history-dialog-title">' + esc(title) + '</h2></div>'
    + '<div class="scroll history-dialog-body">' + contents + '</div>'
    + '<div class="history-dialog-actions">' + actions + '</div></section>';
}
function settingsGroup(title, rows) {
  return '<section class="settings-group"><h3>' + esc(title) + '</h3><div class="settings-card">' + rows + '</div></section>';
}
function settingsRow(glyph, title, command, value = "") {
  const contents = icon(glyph) + '<span class="settings-name">' + esc(title) + '</span>'
    + (value ? '<span class="settings-value">' + esc(value) + '</span>' : '');
  return command ? '<button type="button" class="settings-row" data-do="' + command + '">' + contents + icon("next") + '</button>'
    : '<div class="settings-row">' + contents + '</div>';
}
function settingsChoices(name, options, selected, translateLabels = true) {
  return [...options].map(([value, label]) =>
    '<label class="settings-row theme-choice"><span class="settings-name"'
    + (translateLabels ? '' : ' lang="' + esc(value) + '"') + '>' + esc(translateLabels ? t(label) : label)
    + '</span><input type="radio" name="' + name + '" value="' + esc(value) + '"'
    + (selected === value ? ' checked' : '') + '></label>').join("");
}
function appAboutPage() {
  const features = [
    ["自带 API Key 与用量明细", "用自己的 Key 直连 DeepSeek，并查看余额和每轮用量。也可通过邀请码启用开发者试用。"],
    ["可管理的跨对话记忆", "在设备上编辑、删除记忆或设置有效期。发送前可选择带入哪些记忆，也可启用后台整理并核对建议来源。"],
    ["导入和引用旧对话", "将 DeepSeek 导出的对话导入本机，按主题或日期查找旧消息，引用到本轮并跳回原文。"],
    ["无痕对话", "适合临时聊天。无痕会话不写入本地历史，也不会带入已保存的记忆。"],
    ["离线朗读", "使用设备已安装的离线语音朗读回答。"]
  ];
  return panel(appName, '<div class="app-info">'
    + '<p>' + esc(t("BlueFish 是一款独立开发的 Android 聊天客户端，通过 DeepSeek API 提供深度思考、智能搜索和附件对话。")) + '</p>'
    + '<div class="settings-card">' + settingsRow("paper", t("更新日志"), "changelog") + '</div>'
    + '<section class="app-features"><h3>' + esc(t("相较于 DeepSeek 官方 App")) + '</h3><dl>'
    + features.map(([title, description]) => '<div><dt>' + esc(t(title)) + '</dt><dd>' + esc(t(description)) + '</dd></div>').join("")
    + '</dl></section></div>');
}
function changelogPage() {
  const releases = [
    ["0.2.13", [
      "设置中的版本项会显示当前安装版本，点按可查看 BlueFish 介绍和特色功能。",
      "新增可离线查看的更新日志，支持简体中文和 English。"
    ]],
    ["0.2.12", [
      "试用支持处理 PDF、Word 和 PowerPoint 等文档，并可使用长对话压缩和后台记忆整理。",
      "回答过程中会显示正在搜索、打开或阅读网页等进度。"
    ]],
    ["0.2.11", [
      "图片以圆角缩略图显示，文档卡片展示文件类型和大小，长段粘贴可转为文本卡片。",
      "编辑或重新生成后，可在对话版本之间循环切换。"
    ]],
    ["0.2.10", ["调整侧栏按钮，让两条横线在不同屏幕密度下保持一致。"]],
    ["0.2.9", ["支持在应用内发现并下载新版安装包。"]]
  ];
  return panel(t("更新日志"), '<div class="app-info changelog">'
    + releases.map(([version, changes]) => '<section class="settings-card release"><div class="release-heading">'
      + '<h3>' + esc(version) + '</h3>'
      + (version === installedVersion ? '<span>' + esc(t("当前版本")) + '</span>' : '')
      + '</div><ul>' + changes.map(change => '<li>' + esc(t(change)) + '</li>').join("") + '</ul></section>').join("")
    + '</div>');
}
function historyImportPage() {
  const { busy, message, error, canView } = historyImport;
  const details = '<p class="muted">' + esc(t("选择 DeepSeek 导出的 ZIP 或 conversations.json。导出时选中的分支会添加到本机历史。")) + '</p>'
    + '<p id="history-import-status" class="' + (error ? "row-error" : "muted") + '" role="status" aria-atomic="true">' + esc(message) + '</p>'
    + button(t("查看历史对话"), "viewImportedHistory", "", "secondary wide")
      .replace("<button", '<button id="history-import-view"' + (canView ? "" : " hidden"));
  const picker = button(t("选择导出文件"), "pickHistoryExport", "", "primary")
    .replace("<button", '<button id="history-import-picker"' + (busy ? " disabled" : ""));
  return panel(t("导入 DeepSeek 对话"), details, "page", picker);
}
function updateHistoryImport(changes, finished = false) {
  Object.assign(historyImport, changes);
  const status = $("history-import-status");
  if (!status) {
    if (finished && historyImport.message) toast(historyImport.message);
    return;
  }
  const picker = $("history-import-picker");
  const view = $("history-import-view");
  picker.disabled = historyImport.busy;
  view.hidden = !historyImport.canView;
  status.className = historyImport.error ? "row-error" : "muted";
  status.textContent = historyImport.message;
  if (finished) (historyImport.canView ? view : picker).focus({ preventScroll: true });
}
function pickHistoryExport() {
  if (historyImport.busy) return;
  if (!host?.pickDeepSeekExport) {
    updateHistoryImport({ message: t("此操作需要在安卓 App 中打开"), error: true, canView: false });
    return;
  }
  updateHistoryImport({ busy: true, message: "", error: false, canView: false });
  host.pickDeepSeekExport();
}
async function handleHistoryImport(type, value) {
  if (!historyImport.busy) return;
  if (type === "reading") return updateHistoryImport({ message: t("正在读取导出文件…") });
  if (type === "cancel") return updateHistoryImport({ busy: false, message: "" }, true);
  const fail = message => updateHistoryImport({ busy: false, message: t(message), error: true }, true);
  if (type === "fail") return fail(value.message);
  if (type !== "ok") return;

  let data;
  try {
    const response = await fetch("/deepseek-history/" + encodeURIComponent(value), { cache: "no-store" });
    if (!response.ok) throw new Error();
    data = await response.json();
  } catch {
    return fail("DeepSeek 导出文件无法读取，请重新导出后再试。");
  }

  let result;
  try { result = DeepSeekImport.convert(data, state.chats); }
  catch (error) { return fail(error.message); }
  const { chats, duplicates, skipped } = result;
  if (!chats.length && !duplicates) return fail("文件中没有可导入的 DeepSeek 对话。");
  if (chats.length) {
    const merged = state.chats.concat(chats);
    const saveError = "本机空间不足或聊天记录已达到容量上限，未能保存导入的对话。";
    try { if (!writeState({ ...state, chats: merged })) return fail(saveError); }
    catch { return fail(saveError); }
    clearTimeout(saving);
    state.chats = merged;
    if (!layer() && drawerOpen) renderLayer();
  }
  const message = [chats.length && t("已导入 {count} 个对话", { count: chats.length }),
    duplicates && t("已跳过 {count} 个重复对话", { count: duplicates }),
    skipped && t("有 {count} 个对话无法导入", { count: skipped })].filter(Boolean).join(" · ");
  updateHistoryImport({ busy: false, message, canView: true }, true);
}
function screenHeader(title, action = "") {
  return '<header class="screen-head">' + menuButton() + '<h1>' + esc(title) + '</h1>' + action + '</header>';
}
function emptyScreen(glyph, title, description, action = "") {
  return '<div class="empty-screen"><span class="empty-icon">' + icon(glyph) + '</span><p class="empty-title">' + esc(title)
    + '</p><p class="muted">' + esc(description) + '</p>' + action + '</div>';
}
function hasHistoryEntry(chat) {
  return chat.turns.length > 0 || chat.draft || chat.references?.length;
}
const historyTitle = chat => chat.title || chat.draft.slice(0, 40) || t("新对话");
const historySelectionTitle = () => t("已选择 {count} 个对话", { count: selected.size });
const shouldUnpinSelection = () => selected.size > 0 && state.chats.every(chat => !selected.has(chat.id) || chat.pinned);
const historyActionContent = (label, glyph) => icon(glyph) + '<span>' + esc(label) + '</span>';
function historyMenuItem(label, glyph, command, id, style = "") {
  return '<button type="button" role="menuitem" tabindex="-1" class="' + style + '" data-do="' + command
    + '" data-value="' + esc(id) + '">' + historyActionContent(label, glyph) + '</button>';
}
function historyList(query = "") {
  const chats = state.chats.filter(hasHistoryEntry);
  const searching = Boolean(query.trim());
  const matches = searching ? new Map(C.historySearch(state.chats, query).map(item => [item.source.chat, item])) : new Map();
  const groups = new Map();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const week = new Date(today);
  week.setDate(week.getDate() - 6);
  for (const chat of chats.sort((a, b) => (Number(!!b.pinned) - Number(!!a.pinned)) || (b.updated - a.updated))) {
    const match = matches.get(chat.id);
    if (searching && !match) continue;
    const group = searching ? "搜索结果" : chat.pinned ? "置顶" : chat.updated >= today ? "今天"
      : chat.updated >= yesterday ? "昨天" : chat.updated >= week ? "7 天内" : "更早";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({ chat, match });
  }
  const selectButton = !selecting && chats.length ? ib("multi", t("批量选择对话"), "selectMode") : "";
  if (!groups.size) {
    return (selectButton ? '<div class="history-group-head">' + selectButton + '</div>' : '')
      + '<div class="history-empty' + (searching ? ' history-no-results' : '') + '">' + (searching
      ? emptyScreen("search", t("没有找到对话"), t("试试标题或消息里的其他词。"))
      : emptyScreen("history", t("还没有历史对话"), t("开始聊天后，可在这里继续对话。"), button(t("开始聊天"), "new", "", "primary"))) + '</div>';
  }
  const selectGroup = groups.keys().next().value;
  return [...groups].map(([name, items]) => '<section class="history-group' + (name === "置顶" ? ' history-pinned' : '')
    + '"><header class="history-group-head" data-history-group="' + esc(name) + '"><h2>'
    + esc(name === "置顶" && state.language === "en" ? "Pinned" : t(name)) + '</h2>'
    + (name === selectGroup ? selectButton : '') + '</header>'
    + items.map(({ chat, match }) => {
    const title = historyTitle(chat);
    if (selecting) {
      return '<label class="history-check" data-history-id="' + esc(chat.id) + '"><input type="checkbox" data-chat-select="'
        + esc(chat.id) + '"' + (selected.has(chat.id) ? ' checked' : '') + '>'
        + '<span class="history-checkmark" aria-hidden="true">' + icon("check") + '</span><span class="history-check-title">' + esc(title) + '</span></label>';
    }
    const selectedChat = chat.id === state.current;
    return '<div class="history-row' + (selectedChat ? ' selected' : '') + '" data-history-id="' + esc(chat.id)
      + '"><button class="history-open" data-do="openChat" data-value="'
      + esc(chat.id + (match?.source.turn ? ":" + match.source.turn : "")) + '"' + (selectedChat ? ' aria-current="true"' : '') + '>'
      + '<span class="history-text"><strong>' + esc(title) + '</strong>'
      + (match?.text ? '<small>' + esc(match.text) + '</small>' : '') + '</span></button>'
      + ib("dots", t("{title}的选项", { title }), "chatMenu", chat.id, "", historyDots)
        .replace("<button", '<button aria-haspopup="menu" aria-controls="history-menu" aria-expanded="false"') + '</div>';
  }).join("") + '</section>').join("");
}
function batchPinContent() {
  const unpin = shouldUnpinSelection();
  return historyActionContent(t(unpin ? "取消置顶" : "置顶"), unpin ? "unpin" : "pin");
}
function updateHistorySelection() {
  $("history-title").textContent = historySelectionTitle();
  $("batch-pin").innerHTML = batchPinContent();
  $("batch-pin").disabled = $("batch-delete").disabled = !selected.size;
}
function historyPanel() {
  const hasHistory = state.chats.some(hasHistoryEntry);
  const title = selecting ? historySelectionTitle() : t("历史对话");
  const heading = '<h1 id="history-title" tabindex="-1"' + (selecting ? ' aria-live="polite"' : ' class="sr-only"') + '>' + esc(title) + '</h1>';
  const disabled = selected.size ? '' : ' disabled';
  return (selecting ? '<header class="history-drawer-head">' + heading + ib("close", t("退出多选"), "close", "", "quiet-icon") + '</header>' : heading)
    + (selecting || !hasHistory ? '' : '<div class="history-search-entry"><button type="button" class="history-search-pill"'
      + ' data-do="openHistorySearch" aria-haspopup="dialog" aria-controls="history-search-screen">'
      + icon("search") + '<span>' + esc(t("搜索对话内容…")) + '</span></button></div>')
    + '<div class="scroll screen-content" id="history-list">' + historyList() + '</div>'
    + (selecting ? '<div class="history-batch">'
      + '<button type="button" class="secondary" id="batch-pin" data-do="batchPin"' + disabled + '>' + batchPinContent() + '</button>'
      + '<button type="button" class="danger secondary" id="batch-delete" data-do="batchDelete"' + disabled + '>'
      + historyActionContent(t("删除"), "trash") + '</button>'
      + '</div>' : '');
}
function activeHistoryList() {
  return $(historySearchOpen ? "history-search-results" : "history-list");
}
function historyLayout(list, withTitles) {
  const viewport = list.getBoundingClientRect();
  const frames = new Map();
  for (const item of list.querySelectorAll("[data-history-id], [data-history-group]")) {
    const rect = item.getBoundingClientRect();
    if (rect.bottom <= viewport.top || rect.top >= viewport.bottom) continue;
    const key = item.dataset.historyId ? "chat:" + item.dataset.historyId : "group:" + item.dataset.historyGroup;
    const title = withTitles && item.querySelector(".history-text, .history-check-title");
    frames.set(key, { item, top: rect.top, title, left: title ? title.getBoundingClientRect().left : 0 });
  }
  return frames;
}
function animateHistoryLayout(before, after, pins, options) {
  for (const [key, { item, top, title, left }] of after) {
    const previous = before.get(key);
    const pin = pins.has(item.dataset.historyId);
    if (!previous) {
      if (pin || item.dataset.historyGroup === "置顶") item.animate([{ opacity: .35 }, { opacity: 1 }], options);
      continue;
    }
    const dy = previous.top - top;
    const dx = previous.left - left;
    if (Math.abs(dy) > .5) {
      const motion = item.animate([{ transform: "translateY(" + dy + "px)" }, { transform: "none" }],
        { ...options, duration: pin ? 240 : 185 });
      motion.id = "history-row-move";
      if (pin) {
        item.classList.add("history-pin-moving");
        motion.onfinish = motion.oncancel = () => item.classList.remove("history-pin-moving");
      }
    } else if (pin) {
      item.animate([{ opacity: .72 }, { opacity: 1 }], options);
    }
    if (title && Math.abs(dx) > .5) {
      title.animate([{ transform: "translateX(" + dx + "px)" }, { transform: "none" }], options);
    }
  }
}
function renderHistoryChange(pointer, { pins = new Set(), selectionChanged = false, focus } = {}) {
  const drawer = $("drawer");
  const content = $("drawer-content");
  const list = activeHistoryList();
  const animated = pointer && drawer.animate && list;
  const moving = animated && !reduceMotion.matches;
  const before = moving ? historyLayout(list, selectionChanged) : null;
  const outgoing = animated && selectionChanged
    ? [...content.children].filter(node =>
      node.matches(".history-drawer-head, .history-search-entry, .history-batch") && !node.classList.contains("history-motion-copy"))
      .map(node => ({
        copy: node.cloneNode(true),
        rect: node.getBoundingClientRect(),
        opacity: getComputedStyle(node).opacity
      })) : [];
  renderLayer();
  focus?.();
  if (!animated) return;

  const easing = getComputedStyle(drawer).getPropertyValue("--ease-out").trim();
  const options = { duration: moving ? 180 : 140, easing, fill: "backwards" };
  const after = historyLayout(activeHistoryList(), selectionChanged && moving);
  if (moving) animateHistoryLayout(before, after, pins, options);
  else {
    for (const { item } of after.values()) {
      if (pins.has(item.dataset.historyId)) item.animate([{ opacity: .72 }, { opacity: 1 }], options);
    }
  }
  if (!selectionChanged) return;

  const bounds = content.getBoundingClientRect();
  for (const { copy, rect, opacity } of outgoing) {
    const footer = copy.classList.contains("history-batch");
    copy.classList.add("history-motion-copy");
    copy.setAttribute("aria-hidden", "true");
    copy.inert = true;
    for (const child of copy.querySelectorAll("[id]")) child.removeAttribute("id");
    Object.assign(copy.style, { left: rect.left - bounds.left + "px", top: rect.top - bounds.top + "px",
      width: rect.width + "px", height: rect.height + "px" });
    content.append(copy);
    copy.animate([{ opacity, transform: "none" },
      { opacity: 0, transform: moving ? (footer ? "translateY(12px)" : "translateY(-4px)") : "none" }],
      { ...options, duration: 140 }).onfinish = () => copy.remove();
  }
  const header = content.querySelector(selecting ? ".history-drawer-head" : ".history-search-entry");
  header?.animate([{ opacity: 0, transform: moving ? "translateY(4px)" : "none" },
    { opacity: 1, transform: "none" }], options);
  if (selecting) {
    for (const { item } of after.values()) {
      item.querySelector(".history-checkmark")?.animate([{ opacity: 0, transform: moving ? "translateX(-8px)" : "none" },
        { opacity: 1, transform: "none" }], options);
    }
    content.querySelector(".history-batch").animate([{ opacity: 0, transform: moving ? "translateY(12px)" : "none" },
      { opacity: 1, transform: "none" }], { ...options, delay: moving ? 35 : 0 });
  }
}
function leaveHistorySelection(pointer, pins) {
  selecting = false;
  selected.clear();
  renderHistoryChange(pointer, { pins, selectionChanged: true, focus: () => {
    $("drawer").querySelector('[data-do="selectMode"]')?.focus({ preventScroll: true });
  } });
}
function placeHistorySearchAtEntry(pill, entry) {
  const { left, top } = $("history-search-head").getBoundingClientRect();
  const origin = entry.getBoundingClientRect();
  pill.style.setProperty("--history-search-x", (origin.left - left - pill.offsetLeft) + "px");
  pill.style.setProperty("--history-search-y", (origin.top - top - pill.offsetTop) + "px");
  pill.style.setProperty("--history-search-entry-width", origin.width + "px");
}
function showHistorySearch(_, entry) {
  if (!whenHistory() || selecting || historySearchOpen) return;
  closeHistoryMenu();
  historySearchOpen = true;
  const screen = $("history-search-screen");
  const returning = document.body.dataset.historySearchReturn === "true"
    && getComputedStyle(screen).visibility === "visible";
  document.body.dataset.historySearchReturn = "false";
  if (!returning) {
    const placeholder = esc(t("搜索对话内容…"));
    screen.setAttribute("aria-label", t("搜索标题或消息"));
    $("history-search-head").innerHTML = ib("back", t("返回"), "closeHistorySearch")
      + '<div class="history-search-pill">' + icon("search") + '<input id="history-query" type="search"'
      + ' autocomplete="off" autocapitalize="off" enterkeyhint="search" placeholder="' + placeholder
      + '" aria-label="' + esc(t("搜索标题或消息")) + '"></div>';
    const pill = $("history-query").parentElement;
    placeHistorySearchAtEntry(pill, entry);
    // Commit the starting position before switching to the full-screen layout.
    pill.getBoundingClientRect();
  }
  $("history-search-results").innerHTML = "";
  syncHistorySearch();
  // Focus within the tap handler so Android can open the system keyboard.
  $("history-query").focus({ preventScroll: true });
}
function dismissHistorySearch(restoreFocus = true) {
  closeHistoryMenu();
  const input = $("history-query");
  const entry = $("drawer").querySelector('[data-do="openHistorySearch"]');
  if (restoreFocus && entry) {
    placeHistorySearchAtEntry(input.parentElement, entry);
    input.value = "";
  }
  input.blur();
  document.body.dataset.historySearchReturn = String(restoreFocus && !!entry);
  historySearchOpen = false;
  syncHistorySearch();
  if (restoreFocus) entry?.focus({ preventScroll: true });
}
function syncHistorySearch() {
  const screen = $("history-search-screen");
  const drawer = $("drawer");
  document.body.dataset.historySearch = String(historySearchOpen);
  screen.inert = !historySearchOpen || !!layer();
  screen.setAttribute("aria-hidden", String(screen.inert));
  drawer.inert = !drawerOpen || !!layer() || historySearchOpen;
  drawer.setAttribute("aria-hidden", String(drawer.inert));
}
function historySurface() {
  return $(historySearchOpen ? "history-search-screen" : "drawer");
}
function renderHistorySearchResults() {
  const query = $("history-query").value;
  $("history-search-results").innerHTML = query.trim() ? historyList(query) : "";
}
function positionHistoryMenu() {
  if (!historyMenuOpener) return;
  const menu = $("history-menu");
  const surface = historySurface().getBoundingClientRect();
  const list = activeHistoryList().getBoundingClientRect();
  const row = historyMenuOpener.closest(".history-row").getBoundingClientRect();
  if (row.bottom <= list.top || row.top >= list.bottom) return closeHistoryMenu(true);
  const gap = 6;
  const below = list.bottom - row.bottom - gap;
  const above = row.top - list.top - gap;
  menu.style.maxHeight = "";
  const openBelow = below >= menu.offsetHeight || below >= above;
  const space = openBelow ? below : above;
  menu.style.maxHeight = Math.max(0, space) + "px";
  menu.style.top = (openBelow ? row.bottom + gap : row.top - gap - menu.offsetHeight) - surface.top + "px";
  menu.style.right = surface.right - row.right + "px";
  alignHistoryDividers(menu);
}
function alignHistoryDividers(menu) {
  // Keep each separator on a single device pixel at fractional densities.
  const density = window.devicePixelRatio || 1;
  const offsets = [...menu.querySelectorAll("button + button")].map(item => {
    const top = item.getBoundingClientRect().top - 1;
    const snapped = Math.round(top * density) / density;
    return [item, snapped - top];
  });
  menu.style.setProperty("--history-divider-scale", 1 / density);
  for (const [item, offset] of offsets) {
    item.style.setProperty("--history-divider-offset", offset + "px");
  }
}
function closeHistoryMenu(restoreFocus = false) {
  if (!historyMenuOpener) return;
  const opener = historyMenuOpener;
  historyMenuOpener = null;
  $("history-menu").hidden = true;
  opener.setAttribute("aria-expanded", "false");
  opener.closest(".history-row").classList.remove("menu-active");
  if (restoreFocus) opener.focus({ preventScroll: true });
}
function openHistoryMenu(id, control) {
  const chat = state.chats.find(item => item.id === id);
  if (!chat || !whenHistory() || selecting) return;
  closeHistoryMenu();
  const row = control.closest(".history-row");
  for (const motion of row.getAnimations?.() || []) {
    if (motion.id === "history-row-move") motion.finish();
  }
  const menu = $("history-menu");
  historySurface().append(menu);
  historyMenuOpener = control;
  control.setAttribute("aria-expanded", "true");
  row.classList.add("menu-active");
  menu.setAttribute("aria-label", t("{title}的选项", { title: historyTitle(chat) }));
  menu.innerHTML = historyMenuItem(t("重命名"), "pencil", "rename", id)
    + historyMenuItem(t(chat.pinned ? "取消置顶" : "置顶"), chat.pinned ? "unpin" : "pin", "singlePin", id)
    + historyMenuItem(t("多选"), "multi", "selectMode", id)
    + historyMenuItem(t("删除"), "trash", "singleDelete", id, "danger");
  menu.hidden = false;
  positionHistoryMenu();
  if (!menu.hidden) menu.querySelector("button").focus({ preventScroll: true });
}
function field(label, id, value = "", type = "text", placeholder = "") {
  return '<label class="form-label" for="' + id + '">' + esc(label) + '</label><input class="field" id="' + id + '" type="' + type
    + '" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(value) + '" placeholder="' + esc(placeholder) + '">';
}
function formFooter(label, command, requiredFields) {
  return '<p class="form-error" id="form-error" role="status"></p>'
    + button(label, command, "", "primary wide").replace("<button", '<button data-required-fields="' + requiredFields + '"');
}
function syncFormAction(root, changedField) {
  const action = root.querySelector("[data-required-fields]");
  const requiredFields = action?.dataset.requiredFields;
  if (!requiredFields) return;
  const fields = requiredFields.split(" ");
  if (changedField && !fields.includes(changedField)) return;
  action.classList.toggle("form-ready", fields.every(id => Boolean($(id)?.value.trim())));
}
function money(micros) { return "¥" + (micros / 1e6).toLocaleString(state.language, { minimumFractionDigits: 2, maximumFractionDigits: 6 }); }
function dateAt(ms) { return new Date(ms).toLocaleString(state.language, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
function walletPanel(primary = false) {
  const rows = [state.mode === "trial" ? "trial" : "key", state.mode === "trial" ? "key" : "trial"].map(mode => {
    const record = state.accounts[mode];
    const balance = record?.data;
    const configured = !!tagOf(mode);
    const active = configured && state.mode === mode;
    const values = mode === "trial" ? (Number.isFinite(balance?.available) ? [{ total_balance: money(balance.available) }] : [])
      : (balance?.balance_infos || []).map(item => ({ total_balance: item.total_balance + " " + item.currency }));
    return '<section class="balance-card"><span class="balance-icon">'
      + icon(mode === "trial" ? "wallet" : "key") + '</span><div class="balance-info"><div class="balance-head"><h3>'
      + (mode === "trial" ? t("试用额度") : t("DeepSeek 账户")) + '</h3>'
      + (active ? '<span class="balance-current">' + esc(t("当前使用")) + '</span>' : '') + '</div>'
      + (values.length ? values.map(item => '<p class="balance-value">' + esc(item.total_balance) + '</p>').join("")
        : '<p class="balance-state">' + (configured ? t("等待读取余额") : mode === "trial" ? t("尚未启用试用") : t("尚未连接 API Key")) + '</p>')
      + (record?.at ? '<p class="muted balance-meta">' + esc(t("更新于 {time}", { time: dateAt(record.at) })) + (record.error ? ' · ' + esc(errorText(record.error)) : '') + '</p>' : '')
      + (mode === "trial" && balance?.reserved ? '<p class="muted">' + esc(t("有 {amount} 正在结算，稍后可刷新", { amount: money(balance.reserved) })) + '</p>' : '')
      + (mode === "key" && info.key ? '<p class="muted">' + esc(info.key) + '</p>' : '')
      + '</div><div class="balance-actions">' + (configured ? button(t("刷新余额"), "refresh", mode, "secondary")
        + (!active ? button(t("切换使用"), "mode", mode, "secondary") : "")
        : button(mode === "trial" ? t("启用试用") : t("添加 Key"), mode, "", "secondary"))
      + (configured && mode === "key" ? button(t("更换 Key"), "key") : '') + '</div></section>';
  }).join("");
  const contents = '<div class="balance-grid">' + rows + '</div>'
    + '<section class="wallet-links">' + entry(t("用量明细"), "usage", "", t("按对话查看 token 与费用"), "paper")
    + '</section>' + (info.key ? button(t("移除设备上的 Key"), "removeKey", "", "wallet-remove danger") : '');
  return primary ? screenHeader(t("使用与用量"), ib("settings", t("设置"), "settings", "", "quiet-icon"))
    + '<div class="scroll screen-content wallet-content">' + contents + '</div>'
    : panel(layer()?.inSettings ? t("账号管理") : t("使用与用量"), contents, "page");
}
function estimate(receipt) {
  const usage = receipt.usage;
  if (!usage) return t("用量待确认");
  if (receipt.mode === "trial") return t("已由试用服务计入额度");
  const cached = usage.cache_read_input_tokens || 0;
  const input = usage.input_tokens || 0;
  const output = usage.output_tokens || 0;
  const active = cached * .04 + input * 2 + output * 8;
  return t("估算 {range}", { range: money(active / 2) + "–" + money(active) });
}
function usagePanel(mode) {
  const list = state.receipts.filter(row => !mode || mode === row.mode);
  const filters = [["", t("全部")], ["trial", t("试用")], ["key", t("自带 Key")]];
  return panel(t("用量明细"), '<div class="filter-bar" aria-label="' + esc(t("筛选使用方式")) + '">' + filters.map(([value, text]) =>
    '<button type="button" data-do="usageMode" data-value="' + value + '" aria-pressed="' + (mode === value) + '">' + text + '</button>').join("") + '</div>'
    + (list.length ? '<div class="receipt-list">' + list.map(row => '<article class="receipt"><strong>' + esc(row.kind === "private" || row.kind === "dreaming" || row.kind === "compaction" || row.private ? t(row.title) : row.title || t("聊天")) + '</strong><p class="muted">'
      + esc(dateAt(row.at) + " · " + modeName(row.mode)) + '</p><p>' + (row.kind === "file" ? esc(row.pages ? t("{count} 页 · 估算 {amount}", { count: row.pages, amount: money(row.pages * 1500) }) : t("文档解析 · 金额以平台为准"))
      : esc(row.usage ? t("{input} 输入 · {output} 输出 · {cached} 缓存命中 · {estimate}", {
        input: row.usage.input_tokens || 0, output: row.usage.output_tokens || 0, cached: row.usage.cache_read_input_tokens || 0, estimate: estimate(row)
      }) : t("用量待确认")))
      + '</p></article>').join("") + '</div>' : emptyScreen("wallet", t("还没有用量记录"), t("完成一次模型调用后，可在这里查看用量。"))), "page");
}
function dreamingControls() {
  return '<section class="dreaming-settings"><label class="memory-toggle" for="dreaming-enabled"><span>'
    + '<strong>' + esc(t("后台整理（Dreaming）")) + '</strong><small>' + esc(t("应用打开时可将近期对话片段和相关记忆发给当前服务整理。")) + '</small></span>'
    + '<input id="dreaming-enabled" type="checkbox" role="switch"' + (state.dreaming.enabled ? ' checked' : '') + '></label>'
    + dreamingAction() + '</section>';
}
function dreamingAction() {
  if (!dreamingAvailable()) return "";
  const run = button(dreamingRun ? t("正在整理…") : t("立即整理"), "dreamingNow", "", "secondary");
  return '<div class="dreaming-actions">' + (request || dreamingRun ? run.replace("<button", "<button disabled") : run) + '</div>';
}
function memoryList() {
  return '<label class="memory-toggle"><span><strong>' + esc(t("使用已保存的记忆")) + '</strong>'
    + '<small>' + esc(t("保存在此设备。相关条目会在发送前显示。")) + '</small></span>'
    + '<input id="memory-enabled" type="checkbox" role="switch"' + (state.memoryEnabled ? ' checked' : '') + '></label>'
    + '<label class="memory-toggle"><span><strong>' + esc(t("引用旧聊天")) + '</strong>'
    + '<small>' + esc(t("你选择的原文片段会随本轮消息发送。")) + '</small></span>'
    + '<input id="history-enabled" type="checkbox" role="switch"' + (state.historyEnabled ? ' checked' : '') + '></label>'
    + dreamingControls() + '<div class="memory-entries">' + memoryEntries() + '</div>';
}
function memoryEntries() {
  const suggestions = visibleSuggestions();
  return (suggestions.length ? '<section class="memory-suggestions"><div class="collection-head"><h2>' + esc(t("记忆建议")) + '</h2></div>'
      + suggestions.map(item => '<article class="memory-item"><p class="context-excerpt">' + esc(item.text) + '</p>'
        + (Array.isArray(item.sources) && item.sources.length
          ? '<p class="context-meta">' + esc(t("Dreaming · {count} 条来源", { count: item.sources.length })) + '</p>' : '')
        + '<div class="item-actions">' + (Array.isArray(item.sources) ? button(t("查看来源"), "dreamingSources", item.id)
          : button(t("查看原消息"), "openSource", JSON.stringify(item.source)))
        + button(t("忽略"), "ignoreSuggestion", item.id) + button(t("检查并保存"), "reviewSuggestion", item.id, "secondary")
        + '</div></article>').join("") + '</section>' : '')
    + '<div class="collection-head"><h2>' + esc(t("已保存")) + ' <span>' + state.memory.length + '</span></h2>' + button(t("新增记忆"), "memoryAdd", "", "primary") + '</div>'
    + (state.memory.length ? '<div class="memory-items">' + state.memory.map(item => '<article class="memory-item">'
      + entry(item.text, "memoryEdit", item.id, [item.type === "temporary" ? t("临时状态") : t("长期记忆"),
        item.expires ? t(C.isCurrent(item) ? "有效至 {date}" : "已到期 · {date}", { date: item.expires }) : "",
        item.always && C.isCurrent(item) ? t("优先带入") : ""].filter(Boolean).join(" · "), "memory")
      + '<div class="item-actions">' + (item.source ? button(item.supportingSources?.length > 1 ? t("查看来源") : t("查看原消息"), "memorySource", item.id) : '')
      + button(t("删除"), "memoryDelete", item.id, "danger") + '</div></article>').join("") + '</div>'
      : "");
}
function choiceField(label, id, choices, value) {
  const selected = choices.find(choice => choice.value === value) || choices[0];
  return '<div><span class="form-label" id="' + id + '-label">' + esc(label) + '</span>'
    + '<details class="choice-field" name="memory-choices"><summary class="field" aria-labelledby="' + id + '-label ' + id + '-value">'
    + '<span id="' + id + '-value" class="choice-value">' + esc(selected.label) + '</span>' + icon("down") + '</summary>'
    + '<input type="hidden" id="' + id + '" value="' + esc(selected.value) + '">'
    + '<div class="choice-options" role="group" aria-labelledby="' + id + '-label">' + choices.map(choice =>
      '<button type="button" data-do="pickFieldChoice" data-value="' + esc(choice.value) + '" aria-pressed="' + (choice === selected) + '">'
      + '<span>' + esc(choice.label) + '</span>' + icon("check") + '</button>').join("") + '</div></details></div>';
}
function closeFieldChoice(field) {
  field.open = false;
  field.querySelector("summary").focus({ preventScroll: true });
}
function closeOpenFieldChoice() {
  const field = layerHost().querySelector(".choice-field[open]");
  if (!field) return false;
  closeFieldChoice(field);
  return true;
}
function memoryEditor(data) {
  const item = state.memory.find(row => row.id === data.id) || data;
  const replace = data.suggestion && state.memory.length ? choiceField(t("保存方式"), "memory-replace", [
    { value: "", label: t("新增记忆") }, ...state.memory.map(row => ({ value: row.id, label: t("更新 · {text}", { text: row.text.slice(0, 38) }) }))
  ], data.target) : "";
  return panel(data.id ? t("编辑记忆") : t("保存为记忆"), replace
    + '<div><label class="form-label" for="memory-text">' + esc(t("记忆内容")) + '</label>'
    + '<textarea id="memory-text" class="field" rows="4" maxlength="500">' + esc(item.text || "") + '</textarea>'
    + '</div>' + choiceField(t("类型"), "memory-type", [{ value: "longTerm", label: t("长期记忆") }, { value: "temporary", label: t("临时状态") }], item.type)
    + '<div id="memory-expiry"' + (item.type === "temporary" ? '' : ' hidden') + '>'
    + field(t("有效至（可选）"), "memory-expires", item.expires || "", "date") + '</div>'
    + '<label class="check"><input id="memory-always" type="checkbox"' + (item.always ? ' checked' : '')
    + '>' + esc(t("优先带入这条记忆")) + '</label>' + formFooter(t("保存"), "memorySave", "memory-text"));
}
function contextText(row) {
  const date = row.at ? new Date(row.at) : null;
  const label = date && date.getFullYear() !== new Date().getFullYear() ? date.getFullYear() + "/" + dateAt(row.at) : date ? dateAt(row.at) : "";
  const sourceChat = row.kind === "history" && state.chats.find(chat => chat.id === row.source?.chat);
  const title = sourceChat && !sourceChat.title ? t("新对话") : row.title;
  return (row.kind === "history" ? '<p class="context-meta">' + esc(title + (label ? " · " + label : "")
    + " · " + (row.source?.role === "answer" ? t("回答") : t("消息"))) + '</p>' : "")
    + '<p class="context-excerpt">' + esc(row.text) + '</p>';
}
function roundPanel(data) {
  const chat = current();
  const input = data.input || composerState();
  const context = contextFor(chat, input);
  const target = state.mode === "trial" ? t("试用服务") : state.mode === "key" ? "DeepSeek" : t("所选推理服务");
  const retry = data.input ? button(t("重新生成"), "confirmRetry", "", "primary") : "";
  const toggle = data.input ? "" : '<label class="check"><input id="chat-memory" type="checkbox"'
    + (!chat.paused ? ' checked' : '') + '>' + esc(t("为此对话启用上下文")) + '</label>';
  const empty = !context.references.length && !context.memories.length
    ? '<p class="muted context-note">' + (chat.paused ? t("此对话的上下文已关闭。") : t("本轮没有可带入的记忆或旧聊天引用。")) + '</p>' : "";
  const included = new Set(context.items.map(row => row.id));
  return panel(t("本轮上下文"), toggle + empty
    + (context.references.length ? '<section class="context-section"><h3>' + esc(t("旧聊天引用")) + '</h3>' + context.references.map(row =>
      '<article class="context-row">' + contextText(row) + (!included.has(row.id) ? '<p class="context-meta">' + esc(t("超出长度限制")) + '</p>' : '') + '<div class="item-actions">'
      + button(t("移除引用"), "removeReference", row.id) + '</div></article>').join("") + '</section>' : '')
    + (context.memories.length ? '<section class="context-section"><h3>' + esc(t("已保存记忆")) + '</h3>' + context.memories.map(row => {
      const checked = !(input.skipped || skipped).has(row.id);
      return '<label class="check"><input type="checkbox" data-memory-use="' + esc(row.id) + '"'
        + (checked ? ' checked' : '') + '><span>' + esc(row.text)
        + (checked && !included.has(row.id) ? '<small class="context-meta">' + esc(t("超出长度限制")) + '</small>' : '') + '</span></label>';
    }).join("") + '</section>' : '')
    + (context.items.length ? '<p class="muted context-note">' + esc(t("将发送 {count} 条上下文至 {target}。", { count: context.items.length, target })) + '</p>' : '')
    + (context.overflow ? '<p class="muted context-note">' + esc(t("{count} 条超出本轮长度限制。移除其他条目可腾出空间。", { count: context.overflow })) + '</p>' : ''), "sheet", retry);
}
function sameReference(a, b) {
  return a.chat === b.chat && a.turn === b.turn && a.version === b.version && a.role === b.role;
}
function historyLookupResults(data) {
  const references = contextInput().references || [];
  const matches = C.historySearch(state.chats, data.query, { current: state.current, related: true }).slice(0, 8);
  return matches.length ? matches.map(row => {
    const added = references.some(source => sameReference(source, row.source));
    const action = button(added ? t("已引用") : t("引用到本轮"), "addReference", JSON.stringify(row.source), "secondary");
    return '<article class="context-row">' + contextText({ ...row, kind: "history" }) + '<div class="item-actions">'
      + (added ? action.replace("<button", "<button disabled") : action) + '</div></article>';
  }).join("")
    : '<p class="muted context-note">' + esc(t("没有符合条件的旧聊天。可以换个关键词或日期。")) + '</p>';
}
function layerMarkup(top) {
  const data = top.data;
  const chat = current();
  const index = Number(data.index);
  const version = chat.turns[index] && C.versionOf(chat.turns[index]);
  let body;
  switch (top.name) {
    case "connect":
      body = panel(t("选择使用方式"), entry(t("免费试用"), "trial", "", t("使用开发者提供的 DeepSeek 服务"), "wallet")
        + entry(t("使用自己的 Key"), "key", "", t("直接连接 DeepSeek，按账户用量计费"), "settings"));
      break;
    case "settings":
      body = panel(t("设置"), settingsGroup(t("账户"), settingsRow("account", t("账号管理"), "wallet")
        + settingsRow("data", t("数据管理"), "dataSettings"))
        + settingsGroup(t("应用"), settingsRow("globe", t("语言"), "languageSettings", languages.get(state.language))
          + settingsRow("moon", t("外观"), "appearanceSettings", t(appearanceOptions.get(appearance))))
        + settingsGroup(t("关于"), settingsRow("about", t("版本"), "appAbout", installedVersion)));
      break;
    case "appAbout": body = appAboutPage(); break;
    case "changelog": body = changelogPage(); break;
    case "dataSettings":
      body = panel(t("数据管理"), settingsGroup(t("记忆"), settingsRow("memory", t("跨对话记忆"), "memory")
        + settingsRow("history", t("查找旧聊天"), "lookupHistory", !state.historyEnabled || chat.paused ? t("引用已暂停") : "")
        + settingsRow("chat", t("本轮上下文"), "roundMemory", chat.paused ? t("已关闭") : ""))
        + settingsGroup(t("对话记录"), settingsRow("import", t("导入 DeepSeek 对话"), "historyImport")));
      break;
    case "historyImport": body = historyImportPage(); break;
    case "appearanceSettings":
      body = panel(t("外观"), settingsGroup(t("应用主题"), settingsChoices("appearance", appearanceOptions, appearance)));
      break;
    case "languageSettings":
      body = panel(t("语言"), settingsGroup(t("界面语言"), settingsChoices("language", languages, state.language, false)));
      break;
    case "key":
      body = panel(t("使用自己的 Key"), '<p class="muted">' + esc(t("Key 保存在此设备，用于直接连接 DeepSeek。")) + '</p><div>'
        + '<a class="api-guide" href="https://platform.deepseek.com/api_keys">' + esc(t("创建 DeepSeek API Key")) + icon("external") + '</a></div><div>'
        + '<label class="form-label" for="key-field">DeepSeek API Key</label><div class="field-wrap"><input class="field" id="key-field" type="password" autocomplete="off" spellcheck="false" placeholder="' + esc(t("粘贴 API Key")) + '">'
        + button(t("显示"), "showKey") + '</div></div>' + formFooter(t("验证并保存"), "saveKey", "key-field"), "page");
      break;
    case "trial":
      body = panel(t("启用试用"), '<div>' + field(t("试用服务地址"), "trial-origin", info.trialEndpoint, "url", "https://")
        + '</div><div>' + field(t("邀请码"), "trial-code", "", "text", t("输入邀请码")) + '</div>'
        + formFooter(t("启用试用"), "claim", "trial-origin trial-code"), "page");
      break;
    case "wallet": body = walletPanel(); break;
    case "usage": body = usagePanel(data.mode); break;
    case "memory": body = panel(t("跨对话记忆"), memoryList(), "page"); break;
    case "dreamingSources": body = panel(t("Dreaming 来源"), data.sources.map(source => {
      const chat = state.chats.find(item => item.id === source.chat);
      const reference = C.historyReference(chat, source);
      return reference ? '<article class="context-row">' + contextText(reference) + '<div class="item-actions">'
        + button(t("查看原消息"), "openSource", JSON.stringify(source)) + '</div></article>' : "";
    }).join("")); break;
    case "memoryEdit": body = memoryEditor(data); break;
    case "roundMemory": body = roundPanel(data); break;
    case "lookupHistory": body = panel(t("查找旧聊天"), field(t("主题或日期"), "lookup-query", data.query, "search", t("例如发布计划、上周"))
      + '<div id="lookup-results" aria-live="polite">' + historyLookupResults(data) + '</div>', "page"); break;
    case "rename":
      body = historyDialog(t("重命名对话"), '<label class="sr-only" for="rename-field">' + esc(t("标题"))
        + '</label><input class="field" id="rename-field" type="text" maxlength="80" autocomplete="off" enterkeyhint="done"'
        + ' aria-describedby="form-error" value="' + esc(data.text) + '"><p class="form-error" id="form-error" role="status"></p>',
        button(t("取消"), "close") + button(t("确认"), "renameSave", "", "primary")
          .replace("<button", '<button data-required-fields="rename-field"'), "history-rename");
      break;
    case "deleteChats":
      body = historyDialog(data.title, '<p id="history-delete-note">' + esc(data.body) + '</p>',
        button(data.label, "confirm", "", "danger secondary") + button(t("取消"), "close"), "history-delete");
      break;
    case "userMenu": body = panel(t("消息选项"), entry(t("复制"), "copyUser", index) + entry(t("编辑消息"), "edit", index)
      + (privateChat ? "" : entry(t("保存为记忆"), "memoryUser", index))); break;
    case "replyMenu": body = panel(t("回答选项"), entry(t("选取文本"), "selectReply", index)
      + (privateChat ? "" : entry(t("保存为记忆"), "memoryReply", index))); break;
    case "selectText": body = panel(t("选取文本"), '<p class="snippet">' + esc(data.text) + '</p>'); break;
    case "sources":
      body = panel(t("网页来源"), C.sourcesFor(version.reply).map((source, i) =>
        entry((i + 1) + " · " + (source.title || source.site || new URL(source.url).hostname), "source", source.url, new URL(source.url).hostname)).join(""));
      break;
    case "preview": {
      const file = data.file;
      if (typeof file.pastedText === "string") {
        body = panel(attachmentName(file), '<p class="snippet">' + esc(file.pastedText) + '</p>');
        break;
      }
      body = panel(file.name, (file.mime === "image/jpeg" ? '<img class="image-preview" alt="' + esc(file.name) + '" src="/thumb/' + esc(file.id) + '">' : '')
        + '<p class="muted">' + esc(attachmentSize(file.size) + (file.pages ? t(" · {count} 页", { count: file.pages }) : "")) + '</p>'
        + (data.editable && file.purpose && file.purpose !== "user_data" ? '<label class="check"><input type="checkbox" id="rich-layout"'
          + (file.purpose === "rich_layout_recognition" ? " checked" : "") + '>' + esc(t("同时解析文档里的图表和图片")) + '</label>' : ""));
      break;
    }
    case "confirm":
      body = panel(data.title, '<p>' + esc(data.body) + '</p><div class="form-actions">' + button(t("取消"), "close")
        + button(data.label, "confirm", "", data.danger ? "danger secondary" : "primary") + '</div>');
      break;
    default: body = "";
  }
  return body;
}
function renderLayer() {
  const top = layer();
  const root = $("overlay");
  const settings = $("settings-screen");
  const primary = $("screen");
  $("app").hidden = activePage !== "chat";
  $("workspace").inert = drawerOpen || !!top;
  primary.hidden = activePage === "chat";
  document.body.dataset.drawer = String(drawerOpen);
  document.body.dataset.historySelecting = String(selecting);
  document.body.dataset.textSheet = String(top?.name === "selectText");
  syncHistorySearch();
  if (drawerOpen && !top) {
    closeHistoryMenu();
    const content = $("drawer-content");
    const scroll = $("history-list")?.scrollTop || 0;
    content.innerHTML = historyPanel();
    $("history-list").scrollTop = scroll;
    if (historySearchOpen) renderHistorySearchResults();
  }
  if (!top || primary.dataset.name !== activePage || primary.dataset.language !== state.language) {
    if (activePage === "memory") primary.innerHTML = screenHeader(t("跨对话记忆")) + '<div class="scroll screen-content memory-content">' + memoryList() + '</div>';
    if (activePage === "wallet") primary.innerHTML = walletPanel(true);
    primary.dataset.name = activePage;
    primary.dataset.language = state.language;
  }
  if ($("navigation").dataset.language !== state.language) {
    $("navigation").dataset.language = state.language;
    renderNavigation();
  }
  if (renderedSettings) renderedSettings.scrollTop = settings.querySelector(".scroll").scrollTop;
  renderedSettings = top?.inSettings ? top : null;
  settings.hidden = !renderedSettings;
  root.dataset.historyDialog = String(isHistoryDialog());
  root.hidden = !top || !!renderedSettings;
  root.innerHTML = root.hidden ? "" : layerMarkup(top);
  settings.innerHTML = renderedSettings ? layerMarkup(top) : "";
  if (top) syncFormAction(layerHost());
  if (renderedSettings) settings.querySelector(".scroll").scrollTop = renderedSettings.scrollTop || 0;
  syncBackHandler();
}

function addFiles(files) {
  const input = composerState();
  const attached = new Set(input.files.map(file => file.id));
  for (const file of files) {
    if (attached.has(file.id)) continue;
    attached.add(file.id);
    input.files.push(file);
  }
  attachmentPanel = false;
  renderTools();
  if (!editDraft) persist();
}
async function refresh(mode, announce = false) {
  const tag = tagOf(mode);
  if (!tag) return;
  try {
    const data = await call("balance", { mode });
    if (tag !== tagOf(mode)) return;
    state.accounts[mode] = { data, at: Date.now(), tag };
    if (announce) toast(t("余额已刷新"));
  } catch (error) {
    if (tag !== tagOf(mode)) return;
    if (state.accounts[mode]) state.accounts[mode].error = "刷新失败";
    if (announce) toast(error.message);
  }
  persist();
  renderTools();
  if (layer()?.name === "wallet" || (activePage === "wallet" && !layer())) renderLayer();
}
function chooseMode(mode) {
  if (!tagOf(mode)) return push(mode);
  if (mode !== state.mode) stopDreaming();
  state.mode = mode;
  warning = "";
  persist(true);
  renderBar();
  renderTools();
  refresh(mode);
  scheduleDreaming();
}
async function configure(mode, args, control) {
  const origin = layer();
  control.disabled = true;
  control.textContent = mode === "key" ? t("正在验证…") : t("正在启用…");
  $("form-error").textContent = "";
  try {
    const result = await call(mode === "key" ? "saveKey" : "claim", args);
    info = result.info;
    state.accounts[mode] = { data: result.balance, at: Date.now(), tag: tagOf(mode) };
    chooseMode(mode);
    if (layer() === origin) {
      const wasWallet = layers.some(item => item.name === "wallet");
      if (wasWallet) closeLayer();
      else closeAll();
    }
    toast(mode === "key" ? t("Key 已保存") : t("试用已启用"));
  } catch (error) {
    if (layer() === origin) {
      $("form-error").textContent = errorText(error.message);
      control.disabled = false;
      control.textContent = mode === "key" ? t("验证并保存") : t("启用试用");
    }
  }
}
function confirmAction(title, body, label, callback, danger = false) { push("confirm", { title, body, label, callback, danger }); }

function receiptUsage(usage, isPrivate) {
  if (!isPrivate || !usage) return usage;
  return {
    input_tokens: Number(usage.input_tokens) || 0,
    output_tokens: Number(usage.output_tokens) || 0,
    cache_read_input_tokens: Number(usage.cache_read_input_tokens) || 0
  };
}

function send(kind, index = -1, retryInput = null) {
  if (request) return toast(t("请等待当前生成完成，或先停止"));
  const chat = current();
  const mode = state.mode;
  const tag = tagOf(mode);
  if (!tag) return push("connect");
  if (depleted(mode)) return push("wallet");
  const original = index >= 0 ? C.versionOf(chat.turns[index]) : null;
  const input = retryInput || (kind === "edit" ? editDraft : chat);
  const prompt = kind === "retry" ? original?.prompt : input.draft.trim();
  const files = kind === "retry" ? original?.files || [] : [...input.files];
  if (!prompt && !files.length) return;
  const end = index < 0 ? chat.turns.length : index;
  const documents = files.filter(file => file.purpose && file.purpose !== "user_data");
  const historyChangedAccount = chat.turns.slice(C.contextCheckpoint(chat, end).start, index < 0 ? end : index + 1).some(turn => {
    const item = C.versionOf(turn);
    return item.files.some(file => file.purpose) && item.reply && item.reply.tag !== tag;
  });
  const start = () => startChat(chat, { mode, tag }, kind, index, prompt, files, input);
  if (historyChangedAccount) {
    return confirmAction(t("切换服务后继续"), t("本轮会把相关历史和附件发给当前服务。文档可能需要重新上传或解析，解析费用计入当前账户。"), t("继续发送"), start);
  }
  if (documents.some(file => !original?.files.some(prior => prior.id === file.id)) && kind !== "retry") {
    return confirmAction(t("上传并解析文档"), t(mode === "trial" ? "附件会发送给试用服务，由服务承担解析费用。" : "DeepSeek 成功解析后按页计费，后续问答另计模型用量。"), t("上传并发送"), start);
  }
  return start();
}

async function compactChat(run, account, plan) {
  run.compacting = true;
  if (current() === run.chat) scheduleRender();
  try {
    let summary = plan.summary;
    for (const chunk of C.compactionChunks(run.chat, plan)) {
      const reply = C.newReply(account.tag, account.mode);
      const receipt = { mode: account.mode, at: Date.now(), title: "对话上下文压缩", kind: "compaction", usage: null };
      run.id = C.uuid();
      const result = await call("chat", { mode: account.mode, tag: account.tag, payload: C.compactionRequest(summary, chunk) }, (type, event) => {
        if (type === "sse") C.applyStream(reply, event);
        if (reply.usage) receipt.usage = receiptUsage(reply.usage, run.isPrivate);
      }, run.id);
      if (receipt.usage || !result.stopped) state.receipts.unshift(receipt);
      if (result.stopped) return false;
      summary = C.compactionText(reply);
      if (!summary) throw new Error(reply.error || "上下文压缩未完成，请重试");
    }
    C.versionOf(run.chat.turns[plan.end - 1]).contextSummary = summary;
    if (!run.isPrivate) persist(true);
    return true;
  } finally {
    run.compacting = false;
    if (current() === run.chat) scheduleRender();
  }
}

function contextOverflow(message) {
  return /context[_ ]length[_ ]exceeded|context window.{0,80}(exceed|too (long|large))|maximum context length|input.{0,40}exceeds.{0,40}context|上下文.{0,20}(过长|超限|超出)|试用对话过长|超过.{0,20}上下文/i.test(message || "");
}

async function startChat(chat, account, kind, index, prompt, files, input) {
  if (request || current() !== chat || state.mode !== account.mode || tagOf(account.mode) !== account.tag) return toast(t("对话或使用方式已变更，请重新发送"));
  const isPrivate = chat === privateChat;
  stopDreaming();
  const context = contextFor(chat, input, prompt);
  stopReading();
  closeAll();
  attachmentPanel = false;
  if (kind === "edit") editDraft = null;
  document.activeElement?.blur();
  const reply = C.newReply(account.tag, account.mode);
  reply.used = context.items.map(({ id, text, kind, title, at, source }) => ({ id, text, kind, title, at, source }));
  const variant = { prompt, files, think: input.think, search: input.search, reply, at: Date.now() };
  const draft = { text: chat.draft, files: chat.files, references: chat.references, skipped: new Set(skipped) };
  if (kind === "new") {
    index = chat.turns.length;
    chat.turns.push({ id: C.uuid(), selected: 0, variants: [variant] });
    chat.draft = "";
    chat.files = [];
    chat.references = [];
  } else {
    C.addVersion(chat, index, prompt, files, variant);
  }
  if (kind === "new") skipped.clear();
  const initializing = !chat.title;
  if (initializing) {
    chat.title = (prompt || files[0].pastedText?.trim() || files[0].name).slice(0, 26);
    chat.autoTitle = true;
  }
  chat.updated = Date.now();
  const run = { id: "", chat, reply, index, isPrivate };
  request = run;
  const receipt = { mode: account.mode, at: Date.now(), title: isPrivate ? privateTitle : chat.title, ...(isPrivate ? { kind: "private" } : {}), usage: null };
  persist(true);
  fullRender();
  bottom();
  try {
    let payload = C.requestFor(chat, index, account, context);
    const plan = C.compactionPlan(chat, index, account, payload);
    if (plan) {
      if (!await compactChat(run, account, plan)) {
        reply.status = "stopped";
        return;
      }
      payload = C.requestFor(chat, index, account, context);
    }
    state.receipts.unshift(receipt);
    const submit = payload => call("chat", { mode: account.mode, tag: account.tag, payload }, (type, event) => {
      if (type === "sse") {
        C.applyStream(reply, event);
        if (!reply.thoughtElapsed && event.type === "content_block_start" && event.content_block?.type === "text") {
          reply.thoughtElapsed = Math.max(1, Math.round((Date.now() - reply.start) / 1000));
        }
      }
      if (type === "uploading") run.attachment = {
        label: event.parsing ? "正在上传并解析文件 {name}" : "正在上传文件 {name}", name: event.name
      };
      if (type === "reading_image") run.attachment = { label: "正在读取图片 {name}", name: event.name };
      if (type === "attachments_ready" || type === "sse") run.attachment = null;
      if (type === "parsed") state.receipts.unshift({ kind: "file", mode: account.mode, at: Date.now(),
        title: isPrivate ? "文档解析" : event.name, ...(isPrivate ? { private: true } : {}), pages: isPrivate ? Number(event.pages) || 0 : event.pages });
      if (event.type === "message_delta" && chat.autoTitle && reply.title) {
        chat.title = reply.title.slice(0, 80);
        chat.autoTitle = false;
      }
      if (event.type === "message_delta" || event.type === "error") {
        receipt.usage = receiptUsage(reply.usage, isPrivate);
      }
      if (current() === chat) scheduleRender();
      persist();
    }, run.id = C.uuid());
    let result;
    let failure;
    try { result = await submit(payload); }
    catch (error) { failure = error; }
    const recovery = !reply.blocks.length && !reply.usage && contextOverflow(failure?.message || reply.error)
      ? C.compactionPlan(chat, index, account, payload, true) : null;
    if (recovery) {
      reply.status = "running";
      delete reply.error;
      if (!await compactChat(run, account, recovery)) {
        reply.status = "stopped";
        return;
      }
      result = await submit(C.requestFor(chat, index, account, context));
    } else if (failure) throw failure;
    if (result.stopped && reply.status === "running") reply.status = "stopped";
    else if (reply.status === "running") reply.status = "done";
  } catch (error) {
    reply.status = "failed";
    reply.error = error.status === 401 ? "凭证已失效，请检查使用方式" : error.message;
    if ([401, 402, 409].includes(error.status) && kind === "new" && !reply.blocks.length && !chat.draft && !chat.files.length) {
      chat.turns.pop();
      chat.draft = draft.text;
      chat.files = draft.files;
      chat.references = draft.references;
      if (current() === chat) skipped = draft.skipped;
      if (initializing && !chat.turns.length) chat.title = "";
      state.receipts = state.receipts.filter(item => item !== receipt);
      if (current() === chat) warning = reply.error;
    }
  } finally {
    reply.elapsed = Math.max(1, Math.round((Date.now() - reply.start) / 1000));
    request = null;
    persist(true);
    if (current() === chat) fullRender();
    else renderTools();
    refresh(account.mode);
    scheduleDreaming();
  }
}

function deleteChats(ids) {
  if (!ids.length) return;
  if (request && ids.includes(request.chat.id)) return toast(t("请先停止正在生成的回答"));
  const single = ids.length === 1;
  const title = single ? t("删除此对话？") : t("删除 {count} 个对话？", { count: ids.length });
  const body = t("删除后无法恢复，由这些对话保存的记忆也会删除。");
  const label = single ? t("删除对话") : t("删除所选对话");
  push("deleteChats", { title, body, label, callback: () => {
    stopDreaming();
    state.chats = state.chats.filter(chat => !ids.includes(chat.id));
    state.memory = state.memory.filter(item => !ids.includes(item.source?.chat)
      && !item.supportingSources?.some(source => ids.includes(source.chat)));
    state.dreaming.suggestions = state.dreaming.suggestions.filter(item => item.sources.every(source => !ids.includes(source?.chat)));
    for (const chat of state.chats) chat.references = (chat.references || []).filter(source => !ids.includes(source.chat));
    if (editDraft) editDraft.references = editDraft.references.filter(source => !ids.includes(source.chat));
    if (!current()) { editDraft = null; stopReading(); makeChat(); }
    selected.clear();
    selecting = false;
    renderLayer();
    $("history-title")?.focus({ preventScroll: true });
    fullRender();
    persist(true);
    scheduleDreaming();
  } });
}
const whenHistory = () => drawerOpen && !layer();
const isHistoryDialog = () => ["rename", "deleteChats"].includes(layer()?.name);
const roundLayer = () => layers.find(item => item.name === "roundMemory");
const contextInput = () => roundLayer()?.data.input || composerState();

function setConversationContext(enabled) {
  if (privateChat) return;
  current().paused = !enabled;
  if (!enabled) stopDreaming();
  if (layer()?.name === "roundMemory") {
    renderLayer();
    $("chat-memory")?.focus({ preventScroll: true });
  }
  renderFeed();
  renderTools();
  persist(true);
  scheduleDreaming();
}

function suggestionHandled(intent) {
  const id = C.suggestionId(intent.text);
  return state.dismissedSuggestions.includes(id) || state.memory.some(entry => entry.suggestion === id || C.suggestionId(entry.text) === id);
}
function reviewIntent(intent, source) {
  const target = state.memory.find(item => item.id === intent.target && item.text === intent.targetText)
    || C.memoryTarget(intent, state.memory, source.chat);
  push("memoryEdit", { ...intent, source, suggestion: C.suggestionId(intent.text), target: target?.id });
}
function visibleSuggestions() {
  if (!state.memoryEnabled || current().paused) return [];
  const suggested = state.historyEnabled ? state.dreaming.suggestions.filter(item => !suggestionHandled(item)
    && C.isCurrent(item) && item.sources.every(source => {
      const chat = state.chats.find(chat => chat.id === source?.chat && !chat.paused);
      return chat && C.historyReference(chat, source);
    })) : [];
  const ids = new Set(suggested.map(item => item.id));
  return [...suggested, ...C.memorySuggestions(state.chats, state.memory, state.dismissedSuggestions).filter(item => !ids.has(item.id))];
}
function dismissSuggestion(id) {
  if (!id || state.dismissedSuggestions.includes(id)) return;
  state.dismissedSuggestions = [id, ...state.dismissedSuggestions].slice(0, 200);
  state.dreaming.suggestions = state.dreaming.suggestions.filter(item => item.id !== id);
}
function dreamingAvailable() {
  return !!host && state.dreaming.enabled && state.memoryEnabled && state.historyEnabled && !current().paused
    && !!tagOf(state.mode) && !depleted(state.mode) && document.visibilityState !== "hidden";
}
function refreshDreamingView() {
  if (layer()?.name !== "memory" && (layer() || activePage !== "memory")) return;
  const root = layer() ? layerHost() : $("screen");
  const controls = root.querySelector(".dreaming-settings");
  const entries = root.querySelector(".memory-entries");
  if (!controls || !entries) return;
  const restoreFocus = document.activeElement?.dataset?.do === "dreamingNow";
  controls.querySelector(".dreaming-actions")?.remove();
  controls.insertAdjacentHTML("beforeend", dreamingAction());
  entries.innerHTML = memoryEntries();
  if (restoreFocus) $("dreaming-enabled")?.focus({ preventScroll: true });
}
function scheduleDreaming() {
  clearTimeout(dreamingTimer);
  if (!dreamingAvailable() || request || dreamingRun) return;
  dreamingTimer = setTimeout(() => runDreaming(), Math.max(0, nextDreamingAt() - Date.now()));
}
function stopDreaming() {
  clearTimeout(dreamingTimer);
  if (!dreamingRun) return;
  const { id } = dreamingRun;
  dreamingRun = null;
  host.stop?.(id);
  window.onNative(id, "stopped", {});
}
async function runDreaming(manual = false) {
  if (!dreamingAvailable() || request || dreamingRun) return;
  if (!manual && Date.now() < nextDreamingAt()) {
    scheduleDreaming();
    return;
  }
  clearTimeout(dreamingTimer);
  const dreaming = state.dreaming;
  const batch = C.dreamingBatch(state.chats, state.memory, dreaming.seen);
  if (!batch) {
    if (manual) toast(t("没有可整理的新内容，需要至少两段近期对话"));
    return;
  }
  const run = { id: C.uuid(), mode: state.mode, tag: tagOf(state.mode) };
  dreamingRun = run;
  dreaming.attempted = Date.now();
  const receipt = { mode: run.mode, at: dreaming.attempted, title: "后台记忆整理（Dreaming）", kind: "dreaming", usage: null };
  state.receipts.unshift(receipt);
  const reply = C.newReply(run.tag, run.mode);
  persist(true);
  refreshDreamingView();
  try {
    const result = await call("chat", { mode: run.mode, tag: run.tag, payload: C.dreamingRequest(batch) }, (type, event) => {
      if (type !== "sse") return;
      C.applyStream(reply, event);
      if (reply.usage) receipt.usage = reply.usage;
    }, run.id);
    if (result?.stopped || dreamingRun !== run || !dreamingAvailable() || state.mode !== run.mode || tagOf(run.mode) !== run.tag) return;
    if (reply.status !== "done" || reply.stopReason === "refusal" || reply.stopReason === "max_tokens") throw new Error("整理未完成");
    const suggestions = C.dreamingSuggestions(C.textOf(reply), batch).filter(item => !suggestionHandled(item));
    const newIds = new Set(suggestions.map(item => item.id));
    dreaming.suggestions = [...suggestions, ...dreaming.suggestions.filter(item => !newIds.has(item.id))]
      .filter(item => C.isCurrent(item)).slice(0, 8);
    dreaming.seen = [...new Set([...batch.sample.map(item => item.marker), ...dreaming.seen])].slice(0, 250);
    dreaming.finished = Date.now();
    if (manual) toast(suggestions.length ? t("已生成 {count} 条待确认建议", { count: suggestions.length }) : t("本次整理没有新的建议"));
  } catch {
    if (manual && dreamingRun === run) toast(t("本次整理未完成，可稍后重试"));
  } finally {
    if (dreamingRun === run) {
      dreamingRun = null;
      persist(true);
      refreshDreamingView();
      refresh(run.mode);
      scheduleDreaming();
    }
  }
}
function openLink(url) {
  const address = C.httpUrl(url);
  if (address && host) host.openLink(address);
  else if (address) window.open(address, "_blank", "noopener");
}
const actions = {
  appAbout: () => push("appAbout"),
  changelog: () => push("changelog"),
  appearanceSettings: () => push("appearanceSettings"),
  languageSettings: () => push("languageSettings"),
  dataSettings: () => push("dataSettings"),
  historyImport: () => push("historyImport"),
  pickHistoryExport,
  viewImportedHistory: () => {
    selecting = false;
    selected.clear();
    closeAll();
    openDrawer(visibleMenu());
  },
  wagTail: (_, control) => wagTail(control),
  togglePrivateChat,
  navigate,
  menu: (_, control) => openDrawer(control),
  dismissDrawer: () => closeDrawer(true),
  openHistorySearch: showHistorySearch,
  closeHistorySearch: () => dismissHistorySearch(),
  new: () => openChat(makeChat().id),
  close: (_, _control, pointer) => {
    if (selecting && whenHistory()) {
      leaveHistorySelection(pointer);
    } else {
      closeLayer();
    }
  },
  bottom,
  think: (_, control) => { toggleComposerMode("think"); turnThinkingRings(control); },
  search: (_, control) => { toggleComposerMode("search"); turnSearchGlobe(control); },
  attach: (_, control, pointer) => {
    attachmentPanel = !attachmentPanel;
    if (attachmentPanel) gallery = { access: "loading", photos: [] };
    renderTools(pointer);
    if (attachmentPanel) window.refreshRecentPhotos();
  },
  pick: value => {
    if (!host) return toast(t("请在安卓 App 中选择附件"));
    if (pickerInput) return;
    pickerInput = composerState();
    host.pick(value);
  },
  photoAccess: () => host?.requestPhotoAccess?.(),
  recentPhoto: toggleRecentPhoto,
  removeFile: value => { composerState().files.splice(Number(value), 1); renderTools(); if (!editDraft) persist(); },
  preview: value => push("preview", { file: composerState().files[Number(value)], editable: true }),
  pastFile: value => { const [turn, pos] = value.split(":").map(Number); push("preview", { file: C.versionOf(current().turns[turn]).files[pos] }); },
  send: () => editDraft ? send("edit", editDraft.index) : send("new"),
  stop: () => {
    if (!request) return;
    const id = request.id;
    host?.stop(id);
    window.onNative(id, "stopped", {});
  },
  key: () => push("key"), trial: () => push("trial"),
  wallet: () => {
    if (layer() || privateChat) {
      push("wallet");
      if (state.mode) refresh(state.mode);
    } else {
      navigate("wallet");
    }
  },
  settings: () => push("settings"),
  downloadAppUpdate: () => host?.downloadAppUpdate?.(),
  mode: chooseMode,
  refresh: value => refresh(value, true),
  usage: () => push("usage", { mode: "" }),
  usageMode: value => { layer().data.mode = value; renderLayer(); },
  showKey: (_, control) => {
    const field = $("key-field");
    field.type = field.type === "text" ? "password" : "text";
    control.textContent = field.type === "text" ? t("隐藏") : t("显示");
  },
  saveKey: (_, control) => configure("key", { value: $("key-field").value }, control),
  claim: (_, control) => configure("trial", { origin: $("trial-origin").value, code: $("trial-code").value }, control),
  removeKey: () => confirmAction(t("移除 Key"), t("将从此设备移除 Key。聊天记录和用量明细保留。"), t("移除"), async () => {
    try {
      stopDreaming();
      info = await call("removeKey");
      delete state.accounts.key;
      if (state.mode === "key") state.mode = "";
      persist(true); renderLayer(); renderBar(); renderTools();
    } catch (error) { toast(error.message); }
  }, true),
  openChat: value => openChat(...value.split(":")),
  selectMode: (id, _control, pointer) => {
    if (historySearchOpen) dismissHistorySearch(false);
    selecting = true;
    selected.clear();
    if (id) selected.add(id);
    renderHistoryChange(pointer, { selectionChanged: true, focus: () => {
      if (id) $("history-list").querySelector('[data-chat-select="' + CSS.escape(id) + '"]')?.scrollIntoView({ block: "nearest" });
      $("drawer").querySelector('[data-do="close"]')?.focus({ preventScroll: true });
    } });
  },
  chatMenu: openHistoryMenu,
  rename: id => {
    const chat = state.chats.find(item => item.id === id);
    if (chat) push("rename", { id, text: historyTitle(chat) });
  },
  renameSave: () => {
    const chat = state.chats.find(item => item.id === layer().data.id);
    const field = $("rename-field");
    const title = field.value.trim();
    if (!title) {
      $("form-error").textContent = t("请输入标题");
      field.setAttribute("aria-invalid", "true");
      field.focus();
      return;
    }
    chat.title = title.slice(0, 80);
    chat.autoTitle = false;
    closeLayer(); renderBar(); persist(true);
  },
  batchPin: (_, _control, pointer) => {
    const pin = !shouldUnpinSelection();
    const moved = new Set();
    for (const chat of state.chats) {
      if (!selected.has(chat.id) || !!chat.pinned === pin) continue;
      chat.pinned = pin;
      moved.add(chat.id);
    }
    leaveHistorySelection(pointer, moved);
    persist(true);
  },
  batchDelete: () => deleteChats([...selected]),
  singlePin: (id, _control, pointer) => {
    const chat = state.chats.find(item => item.id === id);
    if (!chat) return;
    chat.pinned = !chat.pinned;
    renderHistoryChange(pointer, { pins: new Set([id]), focus: () => {
      activeHistoryList()?.querySelector('[data-do="chatMenu"][data-value="' + CSS.escape(id) + '"]')?.focus();
    } });
    persist(true);
  },
  singleDelete: id => deleteChats([id]),
  confirm: () => { const callback = layer().data.callback; closeLayer(); callback(); },
  userMenu: index => push("userMenu", { index }),
  replyMenu: index => push("replyMenu", { index }),
  copyUser: index => copy(C.versionOf(current().turns[index]).prompt),
  copyReply: (index, control) => {
    copy(displayReplyText(C.versionOf(current().turns[index]).reply));
    control.dataset.copied = "true";
    setTimeout(() => delete control.dataset.copied, 750);
  },
  speakReply: value => {
    if (!host?.speak) return toast(t("请在安卓 App 中使用朗读"));
    const reply = C.versionOf(current().turns[value]).reply;
    const wasReading = reading?.reply === reply;
    stopReading();
    if (wasReading) return;
    const content = $("feed").querySelector('.assistant[data-index="' + Number(value) + '"] .reply');
    const text = content?.innerText.trim() || displayReplyText(reply);
    reading = { id: C.uuid(), reply, index: value };
    syncReading();
    host.speak(reading.id, text);
  },
  selectReply: index => push("selectText", { text: displayReplyText(C.versionOf(current().turns[index]).reply) }),
  shareReply: index => {
    if (!host) return toast(t("请在安卓 App 分享"));
    host.share(displayReplyText(C.versionOf(current().turns[index]).reply), t("分享文本"));
  },
  feedback: (value, control) => {
    const [index, kind] = value.split(":");
    const reply = C.versionOf(current().turns[index]).reply;
    reply.feedback = reply.feedback === kind ? "" : kind;
    for (const button of control.parentElement.querySelectorAll('[data-do="feedback"]')) {
      button.setAttribute("aria-pressed", String(button.dataset.value.endsWith(":" + reply.feedback)));
    }
    persist();
  },
  retry: value => {
    if (editDraft || request) return;
    const index = Number(value);
    const original = C.versionOf(current().turns[index]);
    const references = (original.reply?.used || []).filter(item => item.kind === "history" && item.source).map(item => item.source);
    const input = { ...original, draft: original.prompt, references, skipped: new Set() };
    const context = contextFor(current(), input);
    if (context.items.length) push("roundMemory", { index, input });
    else send("retry", index, input);
  },
  confirmRetry: () => {
    const { index, input } = layer().data;
    send("retry", index, input);
  },
  edit: beginEdit,
  cancelEdit,
  version: value => {
    if (request) return toast(t("请先停止正在生成的回答"));
    stopDreaming();
    if (editDraft) cancelEdit();
    stopReading();
    const [index, choice] = value.split(":").map(Number);
    C.switchVersion(current(), index, choice);
    renderFeed(); persist(true);
    scheduleDreaming();
  },
  sources: index => push("sources", { index }),
  source: openLink,
  memory: () => push("memory"),
  toggleContext: () => setConversationContext(current().paused),
  roundMemory: () => push("roundMemory"),
  lookupHistory: () => {
    if (!state.historyEnabled) return toast(t("请先在跨对话记忆中开启「引用旧聊天」"));
    if (current().paused) return toast(t("请先开启此对话的上下文"));
    push("lookupHistory", { query: C.historyQuery(contextInput().draft) || "" });
  },
  addReference: (value, control) => {
    const source = JSON.parse(value);
    const chat = current();
    const previous = state.chats.find(item => item.id === source.chat);
    if (!state.historyEnabled || chat.paused || previous?.paused) return toast(t("旧聊天引用已暂停"));
    if (source.chat === chat.id || !C.historyReference(previous, source)) return toast(t("原消息已不可用"));
    const input = contextInput();
    const references = input.references || [];
    if (references.some(item => sameReference(item, source))) return toast(t("此消息已引用"));
    if (references.length >= 3) return toast(t("每轮最多引用 3 条旧消息"));
    input.references = [...references, source];
    control.textContent = t("已引用");
    control.disabled = true;
    toast(t("已引用到本轮"));
    if (input === chat) persist(true);
  },
  removeReference: value => {
    const input = contextInput();
    input.references = input.references.filter(item => JSON.stringify(item) !== value);
    renderLayer();
    renderTools();
    if (input === current()) persist(true);
  },
  openSource: value => {
    const source = JSON.parse(value);
    openChat(source.chat, source.turn, source);
  },
  memoryIntent: value => {
    if (privateChat) return;
    const turn = current().turns[Number(value)];
    const variant = C.versionOf(turn);
    const intent = C.memoryIntent(variant.prompt, variant.at || variant.reply?.start || current().updated);
    if (intent) reviewIntent(intent, { chat: state.current, turn: turn.id, version: turn.selected, role: "user" });
  },
  reviewSuggestion: id => {
    const item = visibleSuggestions().find(suggestion => suggestion.id === id);
    if (item) reviewIntent(item, item.source);
  },
  dreamingNow: () => runDreaming(true),
  dreamingSources: id => {
    const item = visibleSuggestions().find(suggestion => suggestion.id === id);
    if (Array.isArray(item?.sources)) push("dreamingSources", { sources: item.sources });
  },
  ignoreSuggestion: id => {
    dismissSuggestion(id);
    renderLayer(); renderFeed(); persist(true);
  },
  memoryAdd: () => push("memoryEdit", { text: "" }),
  memoryEdit: id => push("memoryEdit", { id }),
  memoryUser: index => saveFromMessage(index, false),
  memoryReply: index => saveFromMessage(index, true),
  pickFieldChoice: (value, control) => {
    const field = control.closest(".choice-field");
    const input = field.querySelector('input[type="hidden"]');
    input.value = value;
    field.querySelector(".choice-value").textContent = control.querySelector("span").textContent;
    field.querySelector('[aria-pressed="true"]').setAttribute("aria-pressed", "false");
    control.setAttribute("aria-pressed", "true");
    closeFieldChoice(field);
    input.dispatchEvent(new Event("change", { bubbles: true }));
  },
  memorySave: () => {
    const data = layer().data;
    const text = $("memory-text").value.trim();
    if (!text) { $("form-error").textContent = t("请输入记忆内容"); return; }
    const replace = $("memory-replace")?.value;
    const existing = state.memory.find(item => item.id === (replace || data.id));
    const type = $("memory-type").value;
    const expires = type === "temporary" ? $("memory-expires").value : "";
    const values = { text, type, expires, always: $("memory-always").checked, updated: Date.now(),
      key: C.memoryIntent(text)?.key || data.key || "", suggestion: data.suggestion || existing?.suggestion,
      source: data.source || existing?.source,
      supportingSources: Array.isArray(data.sources) ? data.sources : data.source ? [] : existing?.supportingSources };
    if (existing?.suggestion && existing.suggestion !== values.suggestion) dismissSuggestion(existing.suggestion);
    if (existing && existing.text !== text) dismissSuggestion(C.suggestionId(existing.text));
    if (existing) Object.assign(existing, values);
    else state.memory.unshift({ id: C.uuid(), ...values });
    if (data.suggestion) state.dreaming.suggestions = state.dreaming.suggestions.filter(item => item.id !== data.suggestion);
    closeLayer();
    if (["userMenu", "replyMenu"].includes(layer()?.name)) closeLayer();
    renderFeed(); renderTools(); persist(true); toast(existing ? t("记忆已更新") : t("记忆已保存"));
  },
  memorySource: id => {
    const item = state.memory.find(item => item.id === id);
    if (item?.supportingSources?.length > 1) push("dreamingSources", { sources: item.supportingSources });
    else if (item?.source) openChat(item.source.chat, item.source.turn, item.source);
  },
  memoryDelete: id => confirmAction(t("删除记忆"), t("删除后，后续消息将不再带入这条记忆。"), t("删除"), () => {
    const entry = state.memory.find(row => row.id === id);
    if (entry) {
      dismissSuggestion(entry.suggestion);
      dismissSuggestion(C.suggestionId(entry.text));
    }
    state.memory = state.memory.filter(row => row.id !== id);
    renderLayer(); renderFeed(); renderTools(); persist(true);
  }, true)
};
function saveFromMessage(index, answer) {
  if (privateChat) return;
  const chat = current();
  const turn = chat.turns[index];
  const item = C.versionOf(turn);
  const selection = window.getSelection()?.toString().trim();
  const text = selection || (answer ? displayReplyText(item.reply) : item.prompt);
  push("memoryEdit", { text: text.slice(0, 500), source: { chat: chat.id, turn: turn.id, version: turn.selected, role: answer ? "answer" : "user" } });
}
function copy(text) {
  if (host) { host.copy(text); toast(t("已复制"), "copy"); }
  else navigator.clipboard?.writeText(text).then(() => toast(t("已复制"), "copy")).catch(() => toast(t("无法读取剪贴板")));
  if (["userMenu", "replyMenu"].includes(layer()?.name)) closeLayer();
}

let selectedMessages = [];
document.addEventListener("selectionchange", () => {
  const feed = $("feed");
  const selection = window.getSelection();
  const range = selection?.rangeCount && !selection.isCollapsed ? selection.getRangeAt(0) : null;
  const messages = range && feed.contains(range.commonAncestorContainer)
    ? [...feed.querySelectorAll(".message")].filter(message => range.intersectsNode(message)) : [];
  for (const message of selectedMessages) if (!messages.includes(message)) message.classList.remove("has-selected-text");
  for (const message of messages) if (!selectedMessages.includes(message)) message.classList.add("has-selected-text");
  selectedMessages = messages;
  $("feed-region").dataset.selectingText = String(messages.length > 0);
});

$("dock").addEventListener("mousedown", event => {
  if (event.button !== 0 || document.activeElement !== $("draft")) return;
  // Keep the caret and IME active while tapping controls that edit the draft in place.
  if (event.target.closest('#compose-modes button, button[data-do="attach"], button[data-do="removeFile"], button[data-do="recentPhoto"], button[data-do="stop"]')) {
    event.preventDefault();
  }
});

document.addEventListener("click", event => {
  const thought = event.target.closest('.thought[data-preview="false"] > summary')?.parentElement;
  if (thought) {
    const index = Number(thought.closest(".assistant").dataset.index);
    const reply = C.versionOf(current().turns[index]).reply;
    thoughtChoices.set(reply, !thought.open);
  }
  const anchor = event.target.closest("a[href]");
  const button = event.target.closest("[data-do]");
  if (historyMenuOpener) {
    const choose = button && $("history-menu").contains(button);
    closeHistoryMenu(true);
    if (!choose) { event.preventDefault(); return; }
  }
  if (anchor) { event.preventDefault(); openLink(anchor.getAttribute("href")); return; }
  if (button && !button.disabled) actions[button.dataset.do]?.(button.dataset.value || "", button, event.detail > 0);
  else if (event.target === $("drawer-scrim")) closeDrawer(true);
  else if (event.target === $("overlay") && !layer()?.data?.callback && !["key", "trial", "memoryEdit", "rename"].includes(layer()?.name)) actions.close();
});
document.addEventListener("keydown", event => {
  if (historyMenuOpener) {
    if (event.key === "Escape" || event.key === "Tab") {
      closeHistoryMenu(true);
      if (event.key === "Escape") event.preventDefault();
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      const items = [...$("history-menu").querySelectorAll("button")];
      const index = items.indexOf(document.activeElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
        : (index + items.length + (event.key === "ArrowDown" ? 1 : -1)) % items.length;
      items[next].focus();
      event.preventDefault();
      return;
    }
  }
  if (event.target.id === "rename-field" && event.key === "Enter" && !event.isComposing && event.keyCode !== 229) {
    event.preventDefault();
    actions.renameSave();
    return;
  }
  if (event.key === "Escape" && layer()?.name === "memoryEdit" && closeOpenFieldChoice()) {
    event.preventDefault();
    return;
  }
  if (event.shiftKey && event.key === "F10") {
    const trigger = event.target.closest(".history-row")?.querySelector('[data-do="chatMenu"]');
    if (trigger) {
      event.preventDefault();
      openHistoryMenu(trigger.dataset.value, trigger);
      return;
    }
    const message = event.target.closest("[data-menu]");
    if (message && !request) {
      event.preventDefault();
      actions[message.dataset.menu](message.dataset.index);
    }
  }
  if (event.key === "Escape" && (whenHistory() || isHistoryDialog() || privateChat)) {
    event.preventDefault();
    window.appBack();
    return;
  }
  if (event.key !== "Tab") return;
  const scope = isHistoryDialog() ? $("overlay") : whenHistory() ? historySurface() : null;
  if (!scope) return;
  const controls = [...scope.querySelectorAll('button:not(:disabled), input:not(:disabled)')]
    .filter(control => control.getClientRects().length && !control.closest(".history-motion-copy"));
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey ? document.activeElement === first : document.activeElement === last) {
    event.preventDefault();
    (event.shiftKey ? last : first)?.focus();
  }
});
document.addEventListener("contextmenu", event => {
  const trigger = event.target.closest(".history-row")?.querySelector('[data-do="chatMenu"]');
  if (trigger && whenHistory()) {
    event.preventDefault();
    openHistoryMenu(trigger.dataset.value, trigger);
    return;
  }
  const message = event.target.closest("[data-menu]");
  if (!message || request?.chat === current()) return;
  event.preventDefault();
  actions[message.dataset.menu](message.dataset.index);
});
$("draft").addEventListener("paste", event => {
  const text = event.clipboardData?.getData("text/plain") || "";
  if (!/^[\s\S]{1000}/u.test(text) || !text.trim()) return;
  event.preventDefault();
  const input = composerState();
  input.files.push({ id: C.uuid(), name: "粘贴的文本", pastedText: text });
  renderTools();
  const attachments = $("attachments");
  attachments.scrollLeft = attachments.scrollWidth;
  if (!editDraft) persist();
});
document.addEventListener("input", event => {
  const form = event.target.closest("#settings-screen, #overlay");
  if (form && event.target.id) syncFormAction(form, event.target.id);
  if (event.target.id === "rename-field" && event.target.hasAttribute("aria-invalid")) {
    event.target.removeAttribute("aria-invalid");
    $("form-error").textContent = "";
  }
  if (event.target === $("draft")) {
    composerState().draft = event.target.value;
    sizeDraft(); renderTools(); if (!editDraft) persist();
  }
  if (event.target.id === "history-query" && historySearchOpen) {
    closeHistoryMenu();
    renderHistorySearchResults();
    $("history-search-results").scrollTop = 0;
  }
  if (event.target.id === "lookup-query") {
    const data = layer().data;
    data.query = event.target.value;
    $("lookup-results").innerHTML = historyLookupResults(data);
  }
});
document.addEventListener("change", event => {
  const field = event.target;
  if (field.name === "language" && languages.has(field.value) && field.value !== state.language) {
    state.language = field.value;
    $("toast").hidden = true;
    renderStaticLabels();
    fullRender();
    renderLayer();
    layerHost().querySelector('input[name="language"]:checked')?.focus({ preventScroll: true });
    persist(true);
  }
  if (field.name === "appearance" && appearanceOptions.has(field.value)) {
    appearance = field.value;
    if (host?.setAppearance) host.setAppearance(appearance);
    else {
      state.appearance = appearance;
      persist(true);
    }
    window.syncTheme();
  }
  if (field.dataset.chatSelect) {
    if (field.checked) selected.add(field.dataset.chatSelect); else selected.delete(field.dataset.chatSelect);
    updateHistorySelection();
  }
  if (field.dataset.memoryUse) {
    const selection = contextInput().skipped || skipped;
    if (field.checked) selection.delete(field.dataset.memoryUse); else selection.add(field.dataset.memoryUse);
    const scroll = field.closest(".body-pad").scrollTop;
    renderLayer();
    layerHost().querySelector(".body-pad").scrollTop = scroll;
    layerHost().querySelector('[data-memory-use="' + CSS.escape(field.dataset.memoryUse) + '"]')?.focus({ preventScroll: true });
    renderTools();
  }
  if (field.id === "memory-type") $("memory-expiry").hidden = field.value !== "temporary";
  if (field.id === "memory-enabled") {
    state.memoryEnabled = field.checked;
    if (!field.checked) stopDreaming();
    refreshDreamingView(); renderFeed(); renderTools(); persist(true);
    scheduleDreaming();
  }
  if (field.id === "history-enabled") {
    state.historyEnabled = field.checked;
    if (!field.checked) stopDreaming();
    renderTools(); persist(true); refreshDreamingView(); scheduleDreaming();
  }
  if (field.id === "dreaming-enabled") {
    state.dreaming.enabled = field.checked;
    if (!field.checked) stopDreaming();
    persist(true); refreshDreamingView(); scheduleDreaming();
  }
  if (field.id === "chat-memory") setConversationContext(field.checked);
  if (field.id === "rich-layout") { layer().data.file.purpose = field.checked ? "rich_layout_recognition" : "text_recognition"; persist(); }
});
$("feed").addEventListener("scroll", jumpVisibility, { passive: true });
$("drawer").addEventListener("scroll", event => {
  if (event.target.id === "history-list") positionHistoryMenu();
}, { capture: true, passive: true });
$("history-search-results").addEventListener("scroll", positionHistoryMenu, { passive: true });
$("history-menu").addEventListener("scroll", event => alignHistoryDividers(event.currentTarget), { passive: true });
$("compose-modes").addEventListener("scroll", updateModeEdges, { passive: true });
window.addEventListener("resize", updateModeEdges);
window.addEventListener("resize", positionHistoryMenu);
window.addEventListener("resize", alignMenuLines);
if (typeof ResizeObserver === "function") new ResizeObserver(updateModeEdges).observe($("compose-modes"));
window.appBack = () => {
  if (historyMenuOpener) { closeHistoryMenu(true); return true; }
  if (layer()?.name === "memoryEdit" && closeOpenFieldChoice()) return true;
  if (layers.length) { actions.close(); return true; }
  if (historySearchOpen) { dismissHistorySearch(); return true; }
  if (selecting && whenHistory()) { actions.close(); return true; }
  if (drawerOpen) { closeDrawer(true); return true; }
  if (activePage !== "chat") { navigate("chat"); return true; }
  if (attachmentPanel) { attachmentPanel = false; renderTools(true); return true; }
  if (editDraft) { cancelEdit(); return true; }
  if (document.activeElement === $("draft")) { $("draft").blur(); return true; }
  if (privateChat) { togglePrivateChat(); return true; }
  return false;
};
const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
window.syncTheme = () => {
  const dark = appearance === "system" ? (host?.isDarkMode?.() ?? themeQuery.matches) : appearance === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
};
window.setKeyboardVisible = visible => {
  const opening = visible && document.body.dataset.ime !== "true";
  document.body.dataset.ime = String(visible);
  if (opening && editDraft) requestAnimationFrame(centerEditedMessage);
};
if (themeQuery.addEventListener) themeQuery.addEventListener("change", window.syncTheme);
else themeQuery.addListener(window.syncTheme);
window.syncTheme();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    stopDreaming();
    persist(true);
  } else {
    if (state.mode && Date.now() - (state.accounts[state.mode]?.at || 0) > 45000) refresh(state.mode);
    scheduleDreaming();
  }
});
function renderStaticLabels() {
  document.documentElement.lang = state.language;
  $("feed").setAttribute("aria-label", t("对话"));
  $("compose-modes").setAttribute("aria-label", t("对话工具"));
  $("navigation").setAttribute("aria-label", t("更多功能"));
  $("disclaimer").textContent = t("内容由 AI 生成，仅供参考");
  $("drawer-toggle").innerHTML = ib("menu", t("关闭侧栏"), "dismissDrawer");
  const jump = $("jump");
  if (jump) updateControl(jump, t("回到最新消息"));
  initComposer();
}
alignMenuLines();
renderStaticLabels();
fullRender();
renderLayer();
host?.syncAppUpdate?.();
if (host) call("info").then(settings => {
  info = settings;
  for (const mode of ["trial", "key"]) if (state.accounts[mode]?.tag !== tagOf(mode)) delete state.accounts[mode];
  if (!tagOf(state.mode)) state.mode = "";
  renderBar();
  renderTools();
  if (activePage === "wallet" && !layer()) renderLayer();
  if (state.mode) refresh(state.mode);
  scheduleDreaming();
}).catch(error => toast(error.message));
