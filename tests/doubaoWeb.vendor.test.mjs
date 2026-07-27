import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { transform } from "sucrase";
import { VM } from "vm2";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vendorPath = path.join(rootDir, "data", "vendor", "doubaoWeb.ts");

function loadVendor(fetchImpl) {
  const source = fs.readFileSync(vendorPath, "utf8");
  const code = transform(source, { transforms: ["typescript"] }).code.replace(/export\s*\{\s*\};?/g, "");
  const exports = {};
  const vm = new VM({
    timeout: 0,
    sandbox: {
      exports,
      fetch: fetchImpl,
      logger: () => {},
    },
  });
  vm.run(code);
  return exports;
}

const videoConfig = {
  duration: 5,
  resolution: "自动",
  aspectRatio: "16:9",
  prompt: "一只橘猫在窗边伸懒腰",
  referenceList: [
    { type: "image", base64: "data:image/png;base64,aW1hZ2Utb25l" },
    { type: "image", base64: "aW1hZ2UtdHdv" },
  ],
  audio: false,
  mode: ["imageReference:10"],
};

test("exposes the doubao-video model only in multi-image mode", () => {
  const adapter = loadVendor(async () => {
    throw new Error("fetch should not be called");
  });

  assert.equal(adapter.vendor.id, "doubaoWeb");
  assert.equal(adapter.vendor.inputValues.baseUrl, "http://127.0.0.1:9090");
  assert.deepEqual(adapter.vendor.models, [
    {
      name: "豆包网页多图视频生成（自动路由）",
      modelName: "doubao-video",
      type: "video",
      mode: [["imageReference:10"]],
      audio: false,
      durationResolutionMap: [{ duration: [5], resolution: ["自动"] }],
    },
  ]);
});

test("posts Toonflow video input to the doubao2api endpoint", async () => {
  let captured;
  const adapter = loadVendor(async (url, init) => {
    captured = { url, init };
    return new Response(
      JSON.stringify({
        created: 1,
        data: [{ video_url: "https://example.test/result.mp4" }],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  });
  adapter.vendor.inputValues.apiKey = "Bearer secret-token";

  const result = await adapter.videoRequest(videoConfig, adapter.vendor.models[0]);

  assert.equal(result, "https://example.test/result.mp4");
  assert.equal(captured.url, "http://127.0.0.1:9090/v1/video/generations");
  assert.equal(captured.init.method, "POST");
  assert.equal(captured.init.headers.Authorization, "Bearer secret-token");
  assert.deepEqual(JSON.parse(captured.init.body), {
    model: "doubao-video",
    prompt: "一只橘猫在窗边伸懒腰",
    ratio: "16:9",
    images: [
      {
        b64_json: "aW1hZ2Utb25l",
        filename: "reference-1.png",
        mime_type: "image/png",
      },
      {
        b64_json: "aW1hZ2UtdHdv",
        filename: "reference-2.png",
        mime_type: "image/png",
      },
    ],
  });
});

test("requires between one and ten image references", async () => {
  const adapter = loadVendor(async () => {
    throw new Error("fetch should not be called");
  });
  const model = adapter.vendor.models[0];

  await assert.rejects(
    adapter.videoRequest(
      { ...videoConfig, referenceList: [] },
      model,
    ),
    /至少上传 1 张参考图/,
  );

  await assert.rejects(
    adapter.videoRequest(
      {
        ...videoConfig,
        referenceList: Array.from(
          { length: 11 },
          (_, index) => ({
            type: "image",
            base64: `aW1hZ2Ut${index}`,
          }),
        ),
      },
      model,
    ),
    /最多上传 10 张参考图/,
  );

  await assert.rejects(
    adapter.videoRequest(
      {
        ...videoConfig,
        referenceList: [{ type: "video", base64: "dmlkZW8=" }],
      },
      model,
    ),
    /仅支持图片参考/,
  );
});

test("accepts a full endpoint URL and omits empty authorization", async () => {
  let captured;
  const adapter = loadVendor(async (url, init) => {
    captured = { url, init };
    return new Response(JSON.stringify({ data: [{ video_url: "https://example.test/result.mp4" }] }), { status: 200 });
  });
  adapter.vendor.inputValues.baseUrl = "http://127.0.0.1:9090/v1/video/generations/";
  adapter.vendor.inputValues.apiKey = "";

  await adapter.videoRequest(videoConfig, adapter.vendor.models[0]);

  assert.equal(captured.url, "http://127.0.0.1:9090/v1/video/generations");
  assert.equal("Authorization" in captured.init.headers, false);
});

test("surfaces backend errors and malformed success responses", async () => {
  const failedAdapter = loadVendor(async () => {
    return new Response(JSON.stringify({ error: { message: "登录状态失效" } }), { status: 401 });
  });
  await assert.rejects(
    failedAdapter.videoRequest(videoConfig, failedAdapter.vendor.models[0]),
    /豆包视频生成请求失败.*登录状态失效/,
  );

  const malformedAdapter = loadVendor(async () => {
    return new Response(JSON.stringify({ data: [] }), { status: 200 });
  });
  await assert.rejects(
    malformedAdapter.videoRequest(videoConfig, malformedAdapter.vendor.models[0]),
    /未返回视频地址/,
  );
});

test("turns the doubao risk-control code into an actionable message", async () => {
  const adapter = loadVendor(async () => {
    return new Response(
      JSON.stringify({
        detail: 'generate_video error: {"code":710022004,"message":"rate limited"}',
      }),
      { status: 502 },
    );
  });

  await assert.rejects(
    adapter.videoRequest(videoConfig, adapter.vendor.models[0]),
    /豆包触发人工验证.*托管浏览器/,
  );
});

test(
  "live: generates a video through the local doubao2api service",
  { skip: process.env.DOUBAO_LIVE_TEST !== "1", timeout: 420_000 },
  async () => {
    const adapter = loadVendor(fetch);
    const videoUrl = await adapter.videoRequest(
      {
        ...videoConfig,
        prompt: "固定镜头，一只橘猫在阳光下缓慢眨眼，画面稳定，写实风格",
      },
      adapter.vendor.models[0],
    );

    assert.match(videoUrl, /^https?:\/\//);
    const mediaResponse = await fetch(videoUrl, {
      headers: { Range: "bytes=0-1023" },
    });
    assert.ok(mediaResponse.ok || mediaResponse.status === 206);
    assert.match(mediaResponse.headers.get("content-type") || "", /^video\//);
  },
);
