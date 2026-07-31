import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const generationPaths = [
  "/api/assetsGenerate/generateAssets",
  "/api/assetsGenerate/batchGenerateImageAssets",
  "/api/production/assets/batchGenerateAssetsImage",
  "/api/production/storyboard/batchGenerateImage",
  "/api/production/editImage/generateFlowImage",
  "/api/production/workbench/generateVideo",
  "/api/production/workbench/batchGenerateVideo",
  "/api/setting/vendorConfig/modelTest/imageTest",
  "/api/setting/vendorConfig/modelTest/videoTest",
];

test("application blocks every image and video generation API before route execution", () => {
  const appSource = read("src/app.ts");
  const manualModeSource = read("src/lib/manualMediaMode.ts");

  assert.match(appSource, /MEDIA_GENERATION_PATHS/);
  assert.match(appSource, /status\(409\)/);
  for (const routePath of generationPaths) {
    assert.ok(manualModeSource.includes(routePath), `missing blocked route: ${routePath}`);
  }
});

test("AI image and video adapters fail closed before resolving a provider", () => {
  const aiSource = read("src/utils/ai.ts");
  const imageRun = aiSource.slice(aiSource.indexOf("class AiImage"), aiSource.indexOf("type VideoMode"));
  const videoRun = aiSource.slice(aiSource.indexOf("class AiVideo"), aiSource.indexOf("class AiAudio"));

  assert.match(imageRun, /assertManualMediaMode/);
  assert.match(videoRun, /assertManualMediaMode/);
  assert.ok(imageRun.indexOf("assertManualMediaMode") < imageRun.indexOf("resolveModelName"));
  assert.ok(videoRun.indexOf("assertManualMediaMode") < videoRun.indexOf("resolveModelName"));
});

test("manual video upload persists a completed video and selects it on the original track", () => {
  const uploadSource = read("src/routes/production/workbench/uploadVideo.ts");

  assert.match(uploadSource, /videoMimeExtensions/);
  assert.match(uploadSource, /base64Data\.match/);
  assert.match(uploadSource, /state:\s*"已完成"/);
  assert.match(uploadSource, /videoTrackId:\s*trackId/);
  assert.match(uploadSource, /update\(\{\s*videoId/);
  assert.doesNotMatch(uploadSource, /Ai\.Video|videoRequest/);
});

test("production agent uses manual media context without resolving media providers", () => {
  const productionAgentSource = read("src/agents/productionAgent/index.ts");
  const manualModeSource = read("src/lib/manualMediaMode.ts");

  assert.match(manualModeSource, /MANUAL_MEDIA_PROJECT_CONTEXT/);
  assert.match(productionAgentSource, /MANUAL_MEDIA_PROJECT_CONTEXT/);
  assert.doesNotMatch(productionAgentSource, /vendor\.getModelList/);
  assert.doesNotMatch(productionAgentSource, /projectInfo\.(?:imageModel|videoModel)/);
});

test("video workbench data and track creation do not require a project video model", () => {
  const getGenerateDataSource = read("src/routes/production/workbench/getGenerateData.ts");
  const addTrackSource = read("src/routes/production/workbench/addTrack.ts");

  assert.doesNotMatch(getGenerateDataSource, /项目未配置视频模型/);
  assert.doesNotMatch(getGenerateDataSource, /if\s*\(\s*!projectData\?\.videoModel/);
  assert.doesNotMatch(addTrackSource, /videoModel|vendor\.getModelList/);
  assert.match(addTrackSource, /o_videoTrack/);
});
