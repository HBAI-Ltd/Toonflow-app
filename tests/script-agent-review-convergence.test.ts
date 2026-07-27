import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(path: string) {
  return fs.readFileSync(path, "utf8");
}

test("script agents receive the previous review as a fixed repair checklist", () => {
  const source = read("src/agents/scriptAgent/index.ts");

  assert.match(source, /async function getLatestMemoryContent/);
  assert.equal((source.match(/getLatestMemoryContent\(parentCtx\.isolationKey, "assistant:supervision"\)/g) ?? []).length, 3);
  assert.equal((source.match(/上一轮完整审核报告/g) ?? []).length, 2);
  assert.match(source, /上一轮审核报告如下。请把它作为复审验收清单/);
});

test("supervision deterministically completes a missing downstream repair first", () => {
  const source = read("src/agents/scriptAgent/index.ts");

  assert.match(source, /function isCrossWorkspaceRepair/);
  assert.match(source, /assistant:execution:adaptationStrategy/);
  assert.match(source, /if \(adaptationCreateTime < userCreateTime\)/);
  assert.match(source, /await runAdaptationStrategy\(parentCtx\.text\)/);
  assert.match(source, /请审核【改编策略】的同步修复结果，并校验其跟随最新故事骨架/);
});

test("decision agent treats cross-workspace repairs as one ordered transaction", () => {
  const skill = read("data/skills/script_agent_decision.md");

  assert.match(skill, /跨工作区修复事务/);
  assert.match(skill, /先调用 `run_sub_agent_storySkeleton`，成功后再调用 `run_sub_agent_adaptationStrategy`/);
  assert.match(skill, /两个执行器都返回成功确认后，才允许调用 `run_supervision_agent`/);
  assert.match(skill, /未实际调用对应执行器，不得声称已修改、同步或更新该工作区/);
  assert.match(skill, /跨工作区修复事务是唯一例外/);
  assert.match(skill, /不得在骨架完成后单独提前审核/);
});

test("execution agents repair only their own current workspace", () => {
  const skeleton = read("data/skills/script_execution_skeleton.md");
  const adaptation = read("data/skills/script_execution_adaptation.md");

  assert.match(skeleton, /get_planData\(key="storySkeleton"\)/);
  assert.match(skeleton, /只允许写入 `storySkeleton`/);
  assert.match(skeleton, /不得声称已修改、同步或更新 `adaptationStrategy`/);
  assert.match(skeleton, /上一轮完整审核报告.*固定问题清单/s);

  assert.match(adaptation, /get_planData\(key="storySkeleton"\).*get_planData\(key="adaptationStrategy"\)/s);
  assert.match(adaptation, /只允许写入 `adaptationStrategy`/);
  assert.match(adaptation, /不得声称已修改、同步或更新 `storySkeleton`/);
  assert.match(adaptation, /依赖方向固定为 `storySkeleton → adaptationStrategy`/);
});

test("supervision reviews converge and exempt one-minute single-episode projects from long-form rules", () => {
  const skill = read("data/skills/script_agent_supervision.md");

  assert.match(skill, /复审必须收敛/);
  assert.match(skill, /冻结为本轮验收清单/);
  assert.match(skill, /只允许新增本轮修改引入的回归/);
  assert.match(skill, /1 集且总时长 ≤60 秒/);
  assert.match(skill, /不得要求大三角、付费卡点、前10集投放、长线人物弧、≈3个股价级反转/);
  assert.match(skill, /只调用 `get_planData\(key="storySkeleton"\)`/);
  assert.match(skill, /禁止读取或引用 `adaptationStrategy` 作为骨架不通过的依据/);
  assert.match(skill, /跨工作区事务复审/);
});
