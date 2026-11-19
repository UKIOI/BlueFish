"use strict";
(() => {
  const C = globalThis.ChatCore;
  const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const list = value => Array.isArray(value) ? value : [];
  const text = value => typeof value === "string" ? value : "";
  const nodeId = value => typeof value === "string" && value ? value : Number.isSafeInteger(value) ? String(value) : "";
  const time = value => Date.parse(text(value)) || 0;

  function branch(session) {
    const nodes = new Map();
    const add = (id, parent, message) => {
      if (!id || nodes.has(id) || (parent != null && !nodeId(parent))) return false;
      nodes.set(id, { id, parent: nodeId(parent), message });
      return true;
    };
    if (Array.isArray(session.messages)) {
      for (const message of session.messages) {
        if (!object(message) || !add(nodeId(message.id), message.parent_id, message)) return [];
      }
    } else if (object(session.mapping)) {
      for (const [id, node] of Object.entries(session.mapping)) {
        if (!object(node) || !add(id, node.parent, node.message)) return [];
      }
    }
    let newest = null;
    for (const node of nodes.values()) {
      if (!object(node.message)) continue;
      if (!newest || (Number.isSafeInteger(Number(node.id)) && Number.isSafeInteger(Number(newest.id))
        ? Number(node.id) > Number(newest.id) : time(node.message.inserted_at) >= time(newest.message.inserted_at))) newest = node;
    }
    let node = nodes.get(nodeId(session.current_message_id ?? session.current_node)) || newest;
    const seen = new Set();
    const messages = [];
    while (node) {
      if (seen.has(node.id)) return [];
      seen.add(node.id);
      if (object(node.message)) messages.push(node.message);
      if (!node.parent) return messages.reverse();
      node = nodes.get(node.parent);
    }
    return [];
  }

  function sources(results) {
    return list(results).flatMap(result => {
      const url = C.httpUrl(result?.url);
      return url ? [{ url, title: text(result.title), site_name: text(result.site_name) }] : [];
    });
  }

  function replyFrom(message, fragments, at) {
    const status = text(message.status).toUpperCase();
    const failed = ["FAILED", "CONTENT_FILTER", "TIMEOUT", "CONTEXT_LENGTH_EXCEEDED"].includes(status);
    const blocks = [];
    let template = "";
    let thoughtElapsed = 0;
    for (const fragment of fragments) {
      const content = text(fragment.content);
      switch (fragment.type) {
        case "RESPONSE":
          if (content && status !== "CONTENT_FILTER") blocks.push({ type: "text", text: content });
          break;
        case "THINK":
          if (content && status !== "CONTENT_FILTER") {
            blocks.push({ type: "thinking", thinking: content });
            if (Number.isFinite(fragment.elapsed_secs) && fragment.elapsed_secs > 0) thoughtElapsed += fragment.elapsed_secs;
          }
          break;
        case "TEMPLATE_RESPONSE":
          template += content;
          break;
        case "SEARCH":
        case "TOOL_SEARCH": {
          const queries = list(fragment.queries).filter(value => typeof value === "string" && value);
          if (queries.length) blocks.push({ type: "server_tool_use", input: { queries } });
          const content = sources(fragment.results);
          if (content.length) blocks.push({ type: "web_search_tool_result", content });
          break;
        }
        case "READ_LINK":
        case "TOOL_OPEN":
          for (const { url, title } of sources(fragment.type === "TOOL_OPEN" ? [fragment] : fragment.results)) {
            blocks.push({ type: "web_fetch_tool_result", content: { url, content: { title } } });
          }
          break;
      }
    }
    const stopped = status === "INCOMPLETE" || status === "WIP";
    if (!blocks.length && !template && !failed && !stopped) return undefined;
    return { blocks, start: at, status: failed || template ? "failed" : stopped ? "stopped" : "done", feedback: "", used: [],
      ...(thoughtElapsed ? { thoughtElapsed: Math.round(thoughtElapsed) } : {}),
      ...(failed || template ? { error: template || "DeepSeek 未完成这条回答。" } : {}) };
  }

  function convertSession(session, id, meta) {
    const turns = [];
    let latest;
    let messageDate = 0;
    for (const message of branch(session)) {
      const fragments = list(message.fragments).filter(object);
      const at = time(message.inserted_at) || time(session.inserted_at) || time(meta?.inserted_at);
      messageDate = Math.max(messageDate, at);
      const role = text(message.role).toUpperCase();
      const prompt = fragments.filter(fragment => fragment.type === "REQUEST").map(fragment => text(fragment.content)).join("");
      const files = [...list(message.files), ...fragments.filter(fragment => fragment.type === "FILE").flatMap(fragment => list(fragment.files))];
      if (role === "USER" || (!role && (prompt || files.length))) {
        const names = files.map(file => text(file?.file_name || file?.name)).filter(Boolean);
        latest = { prompt: prompt.trim() ? prompt : names.join("、"), files: [], at,
          think: message.thinking_enabled === true, search: message.search_enabled === true };
        if (latest.prompt) turns.push({ id: C.uuid(), selected: 0, variants: [latest] });
        else latest = undefined;
      } else if (latest && (!role || role === "ASSISTANT")) {
        latest.reply = replyFrom(message, fragments, at);
        latest.think = latest.think || message.thinking_enabled === true || fragments.some(fragment => fragment.type === "THINK");
        latest.search = latest.search || message.search_enabled === true || fragments.some(fragment => ["SEARCH", "TOOL_SEARCH"].includes(fragment.type));
        latest = undefined;
      }
    }
    if (!turns.length) return null;
    return { ...C.newChat(), deepSeekId: id, turns,
      title: text(session.title).trim() || text(meta?.title).trim() || turns[0].variants[0].prompt.trim().slice(0, 40),
      pinned: (session.pinned ?? meta?.pinned) === true,
      updated: time(meta?.updated_at) || time(session.updated_at) || messageDate };
  }

  function convert(data, existing) {
    let sessions;
    let index = new Map();
    if (Array.isArray(data)) sessions = data;
    else if (object(data) && object(data.manifest)) {
      if (data.manifest.export_format_version !== 3) throw new Error("这个版本的 DeepSeek 导出格式暂不支持。");
      if (!Array.isArray(data.index) || !Array.isArray(data.conversations)) throw new Error("DeepSeek 导出文件格式有误。");
      sessions = data.conversations;
      index = new Map(data.index.filter(row => object(row) && text(row.id).trim()).map(row => [row.id.trim(), row]));
    } else if (object(data) && (object(data.mapping) || Array.isArray(data.messages))) sessions = [data];
    else throw new Error("请选择 DeepSeek 导出的 ZIP 或 conversations.json 文件。");

    const known = new Set(existing.map(chat => chat.deepSeekId).filter(Boolean));
    const chats = [];
    let duplicates = 0;
    let skipped = 0;
    for (const session of sessions) {
      const id = text(session?.id).trim();
      const meta = index.get(id);
      index.delete(id);
      if (known.has(id)) { duplicates++; continue; }
      const chat = id && convertSession(session, id, meta);
      if (!chat) { skipped++; continue; }
      chats.push(chat);
      known.add(id);
    }
    return { chats, duplicates, skipped: skipped + index.size };
  }

  globalThis.DeepSeekImport = { convert };
  if (typeof module === "object") module.exports = globalThis.DeepSeekImport;
})();
