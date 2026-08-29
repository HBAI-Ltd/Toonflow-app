import assert from "node:assert/strict";
import test from "node:test";

import { isSeedance2Model } from "../src/lib/videoPromptReferences";

test("recognizes built-in Seedance 2.0 model identifiers", () => {
  for (const model of [
    "Seedance 2.0",
    "doubao-seedance-2-0-260128",
    "doubao-seedance-2-0-fast-260128",
    "bytedance/seedance-2.0/reference-to-video",
  ]) {
    assert.equal(isSeedance2Model(model), true, model);
  }
});

test("does not classify other models as Seedance 2.0", () => {
  for (const model of [
    "doubao-seedance-1-5-pro-251215",
    "doubao-seedance-2-1-260128",
    "doubao-seedream-2-0-260128",
  ]) {
    assert.equal(isSeedance2Model(model), false, model);
  }
});
