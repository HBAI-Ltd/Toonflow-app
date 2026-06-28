import assert from "node:assert/strict";
import { applyAgentChatEventToMessages } from "../src/utils/agentChatHistory";
import { parseScriptAgentArtifacts, scriptArtifactIssue } from "../src/utils/scriptAgentPlan";

let messages = applyAgentChatEventToMessages([], "message", {
  id: "m1",
  role: "assistant",
  status: "pending",
  datetime: "2026-06-27T00:00:00.000Z",
  content: [],
});
messages = applyAgentChatEventToMessages(messages, "content:add", {
  messageId: "m1",
  content: { id: "c1", type: "text", data: "", status: "pending" },
});
messages = applyAgentChatEventToMessages(messages, "content:update", {
  messageId: "m1",
  contentId: "c1",
  type: "text",
  data: "<scriptItem name=\"EP01\">A",
  strategy: "append",
  status: "streaming",
});
messages = applyAgentChatEventToMessages(messages, "content:update", {
  messageId: "m1",
  contentId: "c1",
  type: "text",
  data: "</scriptItem>",
  strategy: "append",
  status: "complete",
});
messages = applyAgentChatEventToMessages(messages, "message:update", { id: "m1", status: "complete" });

assert.equal(messages[0].status, "complete");
assert.equal(messages[0].content?.[0].data, "<scriptItem name=\"EP01\">A</scriptItem>");

const parsed = parseScriptAgentArtifacts(String(messages[0].content?.[0].data));
assert.deepEqual(parsed.scripts, [{ name: "EP01", content: "A" }]);
assert.equal(scriptArtifactIssue("<scriptItem name=\"EP02\">B"), "EP02 生成未完成，缺少 </scriptItem>，未写入剧本卡片。请重新生成该集。");

console.log("script agent continuity checks passed");
process.exit(0);
