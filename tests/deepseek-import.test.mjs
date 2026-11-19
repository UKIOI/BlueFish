import assert from "node:assert/strict";
import test from "node:test";
import ChatCore from "../android/assets/core.js";
import DeepSeekImport from "../android/assets/deepseek-import.js";

test("imports the selected branch of a v3 export and skips previously imported IDs", () => {
  const date = "2025-01-28T00:59:07Z";
  const message = (id, parent_id, role, fragments) => ({ id, parent_id, role, status: "FINISHED", inserted_at: date, fragments });
  const data = {
    manifest: { export_format_version: 3 },
    index: [{ id: "official", updated_at: date }, { id: "missing" }],
    conversations: [{ id: "official", title: "官方对话", current_message_id: 2, messages: [
      message(1, null, "USER", [{ type: "REQUEST", content: "导出的问题" }]),
      message(2, 1, "ASSISTANT", [
        { type: "THINK", content: "思考正文" },
        { type: "TOOL_SEARCH", results: [{ url: "https://example.com/source", title: "来源" }, { url: "file:///invalid" }] },
        { type: "RESPONSE", content: "选中的回答" }
      ]),
      message(3, 1, "ASSISTANT", [{ type: "RESPONSE", content: "其他分支" }])
    ] }]
  };
  const result = DeepSeekImport.convert(data, []);
  assert.equal(result.skipped, 1);
  const [chat] = result.chats;
  assert.equal(chat.updated, Date.parse(date));
  assert.equal(chat.title, "官方对话");
  const turn = ChatCore.versionOf(chat.turns[0]);
  assert.equal(turn.prompt, "导出的问题");
  assert.equal(ChatCore.textOf(turn.reply), "选中的回答");
  assert.equal(turn.reply.blocks[0].thinking, "思考正文");
  assert.deepEqual(ChatCore.sourcesFor(turn.reply).map(source => source.title), ["来源"]);
  assert.deepEqual(DeepSeekImport.convert(data, [chat]), { chats: [], duplicates: 1, skipped: 1 });
});

test("reads legacy message mappings and skips broken trees", () => {
  const result = DeepSeekImport.convert([
    { id: "legacy", title: "旧版对话", mapping: {
      root: { parent: null, message: null },
      "1": { parent: "root", message: { fragments: [{ type: "REQUEST", content: "旧版提问" }] } },
      "2": { parent: "1", message: { fragments: [{ type: "RESPONSE", content: "旧版回答" }] } }
    } },
    { id: "broken", mapping: { "1": { parent: "1", message: { fragments: [{ type: "REQUEST", content: "循环节点" }] } } } },
    null
  ], []);
  assert.equal(result.skipped, 2);
  assert.equal(result.chats.length, 1);
  const turn = ChatCore.versionOf(result.chats[0].turns[0]);
  assert.equal(turn.prompt, "旧版提问");
  assert.equal(ChatCore.textOf(turn.reply), "旧版回答");
  assert.throws(() => DeepSeekImport.convert({ manifest: { export_format_version: 4 } }, []), /暂不支持/);
});
