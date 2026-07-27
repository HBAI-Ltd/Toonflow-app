import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const artifactPath = fileURLToPath(new URL("../data/web/index.html", import.meta.url));
const artifact = readFileSync(artifactPath, "utf8");

test("内置前端包含图片编辑器工具栏保存入口", () => {
  assert.match(artifact, /guide-save-btn/);
  assert.match(artifact, /selectNodeToSave/);
  assert.match(artifact, /请选择一个要保存的图片节点/);
  assert.match(artifact, /Select exactly one image node to save/);
});

test("内置前端保留节点选取和画布交互控件", () => {
  assert.match(artifact, /keepBottomLeftBtn/);
  assert.match(artifact, /vue-flow__controls-interactive/);
});
