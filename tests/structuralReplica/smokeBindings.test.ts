import assert from "node:assert/strict";
import { assetIdForGap, bindingsFromGap } from "../../scripts/structuralReplicaSmoke";

const gaps = [
  { slotName: "讲解者", slotType: "role", usedByShots: ["shot_001", "shot_002"] },
  { slotName: "主场景全景图", slotType: "scene", usedByShots: ["shot_001"] },
  { slotName: "陌生角色音频", slotType: "voice", usedByShots: ["shot_002"] },
];

assert.equal(assetIdForGap(gaps[0], { "role:讲解者": 101, "type:role": 999 }), 101);
assert.equal(assetIdForGap(gaps[1], { "type:scene": 201 }), 201);
assert.equal(assetIdForGap(gaps[2], { "type:audio": 301 }), 301);

const bindings = bindingsFromGap(gaps, {
  "type:role": 101,
  "type:scene": 201,
  "type:audio": 301,
});

assert.deepEqual(
  bindings.map((item) => `${item.shotId}:${item.slotType}:${item.slotName}:${item.assetId}`),
  ["shot_001:role:讲解者:101", "shot_002:role:讲解者:101", "shot_001:scene:主场景全景图:201", "shot_002:voice:陌生角色音频:301"],
);
