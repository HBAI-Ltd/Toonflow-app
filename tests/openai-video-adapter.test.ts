import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { transform } from "sucrase";
import { VM } from "vm2";

type PostCall = { url: string; body: Record<string, unknown>; options: { headers: Record<string, string> } };
type GetCall = { url: string; options: { headers: Record<string, string> } };
type ResponseStep = { status?: number; data: unknown } | { error: unknown };

function loadAdapter(options?: { createResponse?: unknown; createError?: unknown; statusResponses?: ResponseStep[] }) {
  const postCalls: PostCall[] = [];
  const getCalls: GetCall[] = [];
  const statusResponses = [...(options?.statusResponses ?? [{ data: { status: "done", video: { url: "https://videos.test/result.mp4" } } }])];
  const axios = {
    post: async (url: string, body: Record<string, unknown>, requestOptions: PostCall["options"]) => {
      postCalls.push({ url, body, options: requestOptions });
      if (options?.createError) throw options.createError;
      return { data: options?.createResponse ?? { request_id: "request-123" } };
    },
    get: async (url: string, requestOptions: GetCall["options"]) => {
      getCalls.push({ url, options: requestOptions });
      const response = statusResponses.shift() ?? { data: { status: "pending" } };
      if ("error" in response) throw response.error;
      return response;
    },
  };
  const exports: Record<string, any> = {};
  const source = fs.readFileSync("data/vendor/openai.ts", "utf8");
  const code = transform(source, { transforms: ["typescript"] }).code.replace(/export\s*\{\s*\};?/g, "");
  const vm = new VM({
    sandbox: {
      axios,
      createOpenAI: () => ({ chat: () => ({}) }),
      exports,
      logger: () => {},
      pollTask: async (fn: () => Promise<{ completed: boolean; data?: string; error?: string }>) => {
        for (let index = 0; index < 10; index += 1) {
          const result = await fn();
          if (result.completed || result.error) return result;
        }
        return { completed: false, error: "timeout" };
      },
      urlToBase64: async (url: string) => `downloaded:${url}`,
    },
  });
  vm.run(code);
  exports.vendor.inputValues = { apiKey: "Bearer test-key", baseUrl: "https://example.test/v1/" };
  return { adapter: exports, postCalls, getCalls };
}

const model = {
  name: "Grok Imagine Video",
  modelName: "grok-imagine-video",
  type: "video",
  mode: ["text", "singleImage"],
  audio: false,
  durationResolutionMap: [{ duration: [5], resolution: ["480"] }],
};
const config = {
  prompt: "mist moving over a quiet lake",
  referenceList: [],
  duration: 5,
  resolution: "480",
  aspectRatio: "16:9",
  audio: false,
  mode: "text",
};

test("creates and polls an xAI-compatible text-to-video request", async () => {
  const { adapter, postCalls, getCalls } = loadAdapter({
    statusResponses: [{ status: 202, data: "" }, { data: { status: "done", video: { url: "https://videos.test/result.mp4" } } }],
  });

  const result = await adapter.videoRequest(config, model);

  assert.equal(result, "https://videos.test/result.mp4");
  assert.equal(postCalls[0].url, "https://example.test/v1/videos/generations");
  assert.deepEqual(postCalls[0].body, {
    model: "grok-imagine-video",
    prompt: "mist moving over a quiet lake",
    duration: 5,
    aspect_ratio: "16:9",
    resolution: "480p",
  });
  assert.equal(postCalls[0].options.headers.Authorization, "Bearer test-key");
  assert.equal(getCalls[0].url, "https://example.test/v1/videos/request-123");
});

test("limits video prompts to the compatible endpoint maximum", async () => {
  const { adapter, postCalls } = loadAdapter();
  await adapter.videoRequest({ ...config, prompt: `${"x".repeat(4090)}中文对白` }, model);
  const submittedPrompt = String(postCalls[0].body.prompt);
  assert.ok(Buffer.byteLength(submittedPrompt, "utf8") <= 4096);
  assert.ok(submittedPrompt.length < 4094);
});

test("maps single-image and reference-image modes to the documented fields", async () => {
  const startImage = "data:image/png;base64,c3RhcnQ=";
  const { adapter: imageAdapter, postCalls: imageCalls } = loadAdapter();
  await imageAdapter.videoRequest({ ...config, mode: "singleImage", referenceList: [{ type: "image", base64: startImage }] }, model);
  assert.deepEqual(imageCalls[0].body.image, { url: startImage });

  const { adapter: referenceAdapter, postCalls: referenceCalls } = loadAdapter();
  await referenceAdapter.videoRequest(
    {
      ...config,
      mode: ["imageReference:5", "videoReference:1"],
      referenceList: [
        { type: "image", base64: "data:image/png;base64,b25l" },
        { type: "image", base64: "data:image/png;base64,dHdv" },
      ],
    },
    model,
  );
  assert.deepEqual(referenceCalls[0].body.reference_images, [
    { url: "data:image/png;base64,b25l" },
    { url: "data:image/png;base64,dHdv" },
  ]);
  assert.equal(referenceCalls[0].body.duration, 5);

  const { adapter: longReferenceAdapter, postCalls: longReferenceCalls } = loadAdapter();
  await longReferenceAdapter.videoRequest(
    {
      ...config,
      duration: 15,
      mode: ["imageReference:5"],
      referenceList: [{ type: "image", base64: "data:image/png;base64,b25l" }],
    },
    model,
  );
  assert.equal(longReferenceCalls[0].body.duration, 10);
});

test("uses the video edit endpoint for a video reference", async () => {
  const { adapter, postCalls } = loadAdapter();
  await adapter.videoRequest(
    {
      ...config,
      mode: ["imageReference:5", "videoReference:1"],
      referenceList: [{ type: "video", base64: "data:video/mp4;base64,dmlkZW8=" }],
    },
    model,
  );

  assert.equal(postCalls[0].url, "https://example.test/v1/videos/edits");
  assert.deepEqual(postCalls[0].body, {
    model: "grok-imagine-video",
    prompt: "mist moving over a quiet lake",
    video: { url: "data:video/mp4;base64,dmlkZW8=" },
  });
});

test("surfaces task failures and missing request IDs", async () => {
  const { adapter: failedAdapter } = loadAdapter({
    statusResponses: [{ data: { status: "failed", error: { message: "upstream rejected the prompt" } } }],
  });
  await assert.rejects(() => failedAdapter.videoRequest(config, model), /upstream rejected the prompt/);

  const { adapter: emptyAdapter } = loadAdapter({ createResponse: {} });
  await assert.rejects(() => emptyAdapter.videoRequest(config, model), /未返回 request_id/);
});

test("surfaces structured create and moderation errors from compatible endpoints", async () => {
  const { adapter: createErrorAdapter } = loadAdapter({
    createError: {
      response: {
        data: {
          code: "invalid-argument",
          error: "Duration 15s exceeds the maximum allowed for reference-to-video, which is 10s.",
        },
      },
    },
  });
  await assert.rejects(
    () => createErrorAdapter.videoRequest(config, model),
    /invalid-argument: Duration 15s exceeds the maximum allowed/,
  );

  const { adapter: moderationAdapter } = loadAdapter({
    statusResponses: [
      {
        error: {
          response: {
            data: {
              code: "imagine:content-moderated",
              error: "Generated video rejected by content moderation.",
            },
          },
        },
      },
    ],
  });
  await assert.rejects(
    () => moderationAdapter.videoRequest(config, model),
    /imagine:content-moderated: Generated video rejected by content moderation/,
  );
});

test("rejects unsupported mixed references instead of silently ignoring them", async () => {
  const { adapter } = loadAdapter();
  await assert.rejects(
    () =>
      adapter.videoRequest(
        {
          ...config,
          mode: ["imageReference:5", "videoReference:1"],
          referenceList: [
            { type: "image", base64: "data:image/png;base64,aW1hZ2U=" },
            { type: "video", base64: "data:video/mp4;base64,dmlkZW8=" },
          ],
        },
        model,
      ),
    /不能同时使用图片和视频参考/,
  );
});
