import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path: string) {
  return fs.readFileSync(path, "utf8");
}

test("storyboard review preserves valid role-shadow nouns", () => {
  const supervision = read("data/skills/production_agent_supervision.md");
  const execution = read("data/skills/production_execution_storyboard_table.md");

  assert.match(supervision, /“身影\/背影\/剪影\/影像”等角色或画面名词不属于此红线/);
  assert.match(supervision, /不要把“身影\/背影\/剪影\/影像”按单字“影”误报/);
  assert.doesNotMatch(supervision, /不出现 光\/影\/光线/);
  assert.match(execution, /“身影 \/ 背影 \/ 剪影 \/ 影像”等角色或画面名词可正常使用/);
});

test("confirmed storyboard repairs use the recommendation without asking again", () => {
  const decision = read("data/skills/production_agent_decision.md");
  const supervision = read("data/skills/production_agent_supervision.md");

  assert.match(decision, /确认去重与推荐落地/);
  assert.match(decision, /“全部修复 \/ 按推荐 \/ 确认 \/ 继续修复”等确认语/);
  assert.match(decision, /必须直接选择报告中标为“推荐”的方案并派发修复/);
  assert.match(decision, /不得再次把同一问题拆成选择题/);
  assert.match(decision, /最多允许 \*\*2 次分镜表修复执行\*\*/);
  assert.match(decision, /第二次复审仍未达到 A\/B 时必须停止/);
  assert.match(decision, /禁止继续循环调用执行层或监督层/);
  assert.match(supervision, /此前未报告的审美\/优化项不得升级为新的验收门槛/);
});
