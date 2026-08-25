import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { transform } from "sucrase";

import runCode from "../src/utils/vm";

const source = fs.readFileSync(path.join(process.cwd(), "data/vendor/agnes.ts"), "utf8");
const compiled = transform(source, { transforms: ["typescript"] }).code;

function loadAdapter(overrides: Record<string, unknown>) {
  const adapter = runCode(compiled, undefined, overrides);
  Object.assign(adapter.vendor.inputValues, {
    apiKey: "test-key",
    baseUrl: "https://agnes.invalid",
  });
  return adapter;
}

test("Agnes adapter advertises V2.0 without advertising Video 2.5", () => {
  const adapter = loadAdapter({});
  const videoModels = adapter.vendor.models.filter((model: any) => model.type === "video");

  assert.deepEqual(
    videoModels.map((model: any) => model.modelName),
    ["agnes-video-v2.0"],
  );
  assert.deepEqual(videoModels[0].mode, ["text", "singleImage", "startEndRequired"]);
});

test("thinking mode is translated at the OpenAI-compatible HTTP boundary", async () => {
  let providerOptions: any;
  let outgoingBody: any;
  const adapter = loadAdapter({
    createOpenAICompatible: (options: any) => {
      providerOptions = options;
      return { chatModel: (modelName: string) => ({ modelName }) };
    },
    fetch: async (_url: string, options: any) => {
      outgoingBody = JSON.parse(options.body);
      return { ok: true };
    },
  });
  const model = adapter.vendor.models.find((item: any) => item.modelName === "agnes-2.5-flash");

  assert.deepEqual(adapter.textRequest(model, true, 0), { modelName: "agnes-2.5-flash" });
  await providerOptions.fetch("https://agnes.invalid/v1/chat/completions", {
    body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
  });

  assert.equal(providerOptions.baseURL, "https://agnes.invalid/v1");
  assert.equal(outgoingBody.chat_template_kwargs.enable_thinking, true);
});

test("image editing normalizes raw Base64 references to documented Data URIs", async () => {
  let submitted: any;
  const adapter = loadAdapter({
    axios: {
      post: async (_url: string, body: any) => {
        submitted = body;
        return { data: { data: [{ b64_json: "RESULT" }] } };
      },
    },
  });
  const model = adapter.vendor.models.find((item: any) => item.modelName === "agnes-image-2.1-flash");

  const result = await adapter.imageRequest(
    {
      prompt: "Keep the subject and change the background.",
      referenceList: [{ type: "image", sourceType: "base64", base64: "RAW_IMAGE" }],
      size: "2K",
      aspectRatio: "16:9",
    },
    model,
  );

  assert.equal(submitted.size, "2K");
  assert.equal(submitted.ratio, "16:9");
  assert.deepEqual(submitted.extra_body.image, ["data:image/png;base64,RAW_IMAGE"]);
  assert.equal(result, "data:image/png;base64,RESULT");
});

test("Agnes image models enforce their configured six-reference limit", async () => {
  let submitted: any;
  const adapter = loadAdapter({
    axios: {
      post: async (_url: string, body: any) => {
        submitted = body;
        return { data: { data: [{ b64_json: "RESULT" }] } };
      },
    },
  });
  const model = adapter.vendor.models.find((item: any) => item.modelName === "agnes-image-2.1-flash");

  await adapter.imageRequest(
    {
      prompt: "Compose the selected references.",
      referenceList: Array.from({ length: 7 }, (_, index) => ({
        type: "image",
        sourceType: "base64",
        base64: `REFERENCE_${index + 1}`,
      })),
      size: "1K",
      aspectRatio: "16:9",
    },
    model,
  );

  assert.equal(model.maxReferenceImages, 6);
  assert.deepEqual(
    submitted.extra_body.image,
    Array.from({ length: 6 }, (_, index) => `data:image/png;base64,REFERENCE_${index + 1}`),
  );
});

test("V2.0 text-to-video submits documented dimensions and an 8n+1 frame count", async () => {
  let submitted: any;
  const adapter = loadAdapter({
    axios: {
      post: async (_url: string, body: any) => {
        submitted = body;
        return { data: { video_id: "video-1" } };
      },
      get: async () => ({ data: { status: "completed", metadata: { url: "https://result.invalid/video.mp4" } } }),
    },
    pollTask: async (poll: () => Promise<any>) => poll(),
    urlToBase64: async (url: string) => `encoded:${url}`,
  });
  const model = adapter.vendor.models.find((item: any) => item.modelName === "agnes-video-v2.0");

  const result = await adapter.videoRequest(
    {
      duration: 5,
      resolution: "720p",
      aspectRatio: "16:9",
      prompt: "A slow dolly-in toward a lantern.",
      referenceList: [],
      mode: ["text"],
    },
    model,
  );

  assert.equal(submitted.width, 1280);
  assert.equal(submitted.height, 704);
  assert.equal(submitted.frame_rate, 24);
  assert.equal(submitted.num_frames % 8, 1);
  assert.equal(result, "encoded:https://result.invalid/video.mp4");
});

test("V2.0 keyframe mode sends exactly the first and last image as keyframes", async () => {
  let submitted: any;
  const adapter = loadAdapter({
    axios: {
      post: async (_url: string, body: any) => {
        submitted = body;
        return { data: { task_id: "task-1" } };
      },
      get: async () => ({ data: { status: "succeeded", url: "https://result.invalid/keyframes.mp4" } }),
    },
    pollTask: async (poll: () => Promise<any>) => poll(),
    urlToBase64: async (url: string) => `encoded:${url}`,
  });
  const model = adapter.vendor.models.find((item: any) => item.modelName === "agnes-video-v2.0");

  await adapter.videoRequest(
    {
      duration: 4,
      resolution: "480p",
      aspectRatio: "9:16",
      prompt: "The subject turns toward camera.",
      referenceList: [
        { type: "image", sourceType: "base64", base64: "data:image/png;base64,FIRST" },
        { type: "image", sourceType: "base64", base64: "data:image/png;base64,LAST" },
        { type: "image", sourceType: "base64", base64: "data:image/png;base64,IGNORED" },
      ],
      mode: ["startEndRequired"],
    },
    model,
  );

  assert.deepEqual(submitted.extra_body, {
    image: ["data:image/png;base64,FIRST", "data:image/png;base64,LAST"],
    mode: "keyframes",
  });
  assert.equal(submitted.width, 448);
  assert.equal(submitted.height, 832);
});

test("V2.0 accepts Toonflow's runtime string mode and normalizes raw image Base64", async () => {
  let submitted: any;
  const adapter = loadAdapter({
    axios: {
      post: async (_url: string, body: any) => {
        submitted = body;
        return { data: { video_id: "video-string-mode" } };
      },
      get: async () => ({ data: { status: "completed", metadata: { url: "https://result.invalid/image.mp4" } } }),
    },
    pollTask: async (poll: () => Promise<any>) => poll(),
    urlToBase64: async (url: string) => `encoded:${url}`,
  });
  const model = adapter.vendor.models.find((item: any) => item.modelName === "agnes-video-v2.0");

  await adapter.videoRequest(
    {
      duration: 3,
      resolution: "720p",
      aspectRatio: "16:9",
      prompt: "Subtle breathing motion while the face remains stable.",
      referenceList: [{ type: "image", sourceType: "base64", base64: "RAW_FRAME" }],
      mode: "singleImage",
    },
    model,
  );

  assert.equal(submitted.image, "data:image/png;base64,RAW_FRAME");
});

test("V2.0 retries a temporary poll 503 without submitting a second task", async () => {
  let postCount = 0;
  let getCount = 0;
  const adapter = loadAdapter({
    axios: {
      post: async () => {
        postCount += 1;
        return { data: { video_id: "video-retry-503" } };
      },
      get: async () => {
        getCount += 1;
        if (getCount === 1) {
          throw {
            message: "Request failed with status code 503",
            response: {
              status: 503,
              data: { error: { code: "temporarily_unavailable", message: "please retry later" } },
            },
          };
        }
        return { data: { status: "completed", metadata: { url: "https://result.invalid/retried.mp4" } } };
      },
    },
    pollTask: async (poll: () => Promise<any>) => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const result = await poll();
        if (result.completed || result.error) return result;
      }
      return { completed: false, error: "test poll exhausted" };
    },
    sleep: async () => {},
    urlToBase64: async (url: string) => `encoded:${url}`,
  });
  const model = adapter.vendor.models.find((item: any) => item.modelName === "agnes-video-v2.0");

  const result = await adapter.videoRequest(
    {
      duration: 5,
      resolution: "480p",
      aspectRatio: "16:9",
      prompt: "A portrait remains stable while the camera slowly moves closer.",
      referenceList: [{ type: "image", sourceType: "base64", base64: "FRAME" }],
      mode: "singleImage",
    },
    model,
  );

  assert.equal(result, "encoded:https://result.invalid/retried.mp4");
  assert.equal(postCount, 1);
  assert.equal(getCount, 2);
});

test("V2.0 backs off and retries an explicitly rejected full queue submission", async () => {
  let postCount = 0;
  const waits: number[] = [];
  const adapter = loadAdapter({
    axios: {
      post: async () => {
        postCount += 1;
        if (postCount < 3) {
          throw {
            message: "Request failed with status code 503",
            response: {
              status: 503,
              data: { error: { code: "video_queue_full", message: "video queue is full, please retry later" } },
            },
          };
        }
        return { data: { task_id: "task-after-queue" } };
      },
      get: async () => ({ data: { status: "completed", url: "https://result.invalid/queue-retried.mp4" } }),
    },
    pollTask: async (poll: () => Promise<any>) => poll(),
    sleep: async (milliseconds: number) => waits.push(milliseconds),
    urlToBase64: async (url: string) => `encoded:${url}`,
  });
  const model = adapter.vendor.models.find((item: any) => item.modelName === "agnes-video-v2.0");

  const result = await adapter.videoRequest(
    {
      duration: 5,
      resolution: "480p",
      aspectRatio: "16:9",
      prompt: "Wait for provider capacity.",
      referenceList: [{ type: "image", sourceType: "base64", base64: "FRAME" }],
      mode: "singleImage",
    },
    model,
  );

  assert.equal(result, "encoded:https://result.invalid/queue-retried.mp4");
  assert.equal(postCount, 3);
  assert.equal(waits.length, 2);
  assert.ok(waits[0] >= 10000);
  assert.ok(waits[1] >= waits[0]);
});

test("V2.0 disables proxy inheritance for the final result download", async () => {
  let downloadConfig: any;
  const adapter = loadAdapter({
    axios: {
      post: async () => ({ data: { task_id: "task-download-proxy" } }),
      get: async () => ({ data: { status: "completed", url: "https://result.invalid/no-proxy.mp4" } }),
    },
    pollTask: async (poll: () => Promise<any>) => poll(),
    urlToBase64: async (_url: string, config: any) => {
      downloadConfig = config;
      return "encoded-video";
    },
  });
  const model = adapter.vendor.models.find((item: any) => item.modelName === "agnes-video-v2.0");

  await adapter.videoRequest(
    {
      duration: 5,
      resolution: "480p",
      aspectRatio: "16:9",
      prompt: "Subtle movement.",
      referenceList: [{ type: "image", sourceType: "base64", base64: "FRAME" }],
      mode: "singleImage",
    },
    model,
  );

  assert.deepEqual(downloadConfig, { proxy: false, timeout: 120000 });
});

test("V2.0 retries a transient completed-result download with a bounded timeout", async () => {
  const downloadConfigs: any[] = [];
  const waits: number[] = [];
  let downloadCount = 0;
  const adapter = loadAdapter({
    axios: {
      post: async () => ({ data: { task_id: "task-download-timeout" } }),
      get: async () => ({ data: { status: "completed", url: "https://result.invalid/eventually.mp4" } }),
    },
    pollTask: async (poll: () => Promise<any>) => poll(),
    sleep: async (milliseconds: number) => waits.push(milliseconds),
    urlToBase64: async (_url: string, config: any) => {
      downloadCount += 1;
      downloadConfigs.push(config);
      if (downloadCount === 1) {
        throw { code: "ETIMEDOUT", message: "result download timed out" };
      }
      if (downloadCount === 2) {
        throw {
          message: "result CDN temporarily unavailable",
          response: { status: 520, data: { message: "result CDN temporarily unavailable" } },
        };
      }
      return "encoded-video";
    },
  });
  const model = adapter.vendor.models.find((item: any) => item.modelName === "agnes-video-v2.0");

  const result = await adapter.videoRequest(
    {
      duration: 5,
      resolution: "480p",
      aspectRatio: "16:9",
      prompt: "Download a completed provider task without hanging forever.",
      referenceList: [],
      mode: "text",
    },
    model,
  );

  assert.equal(result, "encoded-video");
  assert.equal(downloadCount, 3);
  assert.equal(waits.length, 2);
  assert.ok(downloadConfigs.every((config) => config.proxy === false));
  assert.ok(downloadConfigs.every((config) => config.timeout === 120000));
});

test("V2.0 checkpoints the provider task before polling and can resume without POST", async () => {
  const checkpoints: any[] = [];
  let postCount = 0;
  const adapter = loadAdapter({
    axios: {
      post: async () => {
        postCount += 1;
        return { data: { task_id: "unexpected-new-task" } };
      },
      get: async () => ({ data: { status: "completed", url: "https://result.invalid/resumed.mp4" } }),
    },
    pollTask: async (poll: () => Promise<any>) => poll(),
    urlToBase64: async (url: string) => `encoded:${url}`,
  });
  const model = adapter.vendor.models.find((item: any) => item.modelName === "agnes-video-v2.0");

  const result = await adapter.videoRequest(
    {
      duration: 5,
      resolution: "480p",
      aspectRatio: "16:9",
      prompt: "Resume an existing provider task.",
      referenceList: [],
      mode: "text",
      resumeTask: { taskId: "task-existing" },
      onTaskCheckpoint: async (checkpoint: any) => checkpoints.push(checkpoint),
    },
    model,
  );

  assert.equal(result, "encoded:https://result.invalid/resumed.mp4");
  assert.equal(postCount, 0);
  assert.deepEqual(
    checkpoints.map((checkpoint) => checkpoint.stage),
    ["poll", "download"],
  );
  assert.ok(checkpoints.every((checkpoint) => checkpoint.taskId === "task-existing"));
});

test("V2.0 errors identify stage, HTTP status, provider code, task id, and retry count", async () => {
  const adapter = loadAdapter({
    axios: {
      post: async () => ({ data: { task_id: "task-download-error" } }),
      get: async () => ({ data: { status: "completed", url: "https://result.invalid/unreachable.mp4" } }),
    },
    pollTask: async (poll: () => Promise<any>) => poll(),
    sleep: async () => {},
    urlToBase64: async () => {
      throw {
        code: "ECONNREFUSED",
        config: { headers: { Authorization: "Bearer should-not-appear" } },
      };
    },
  });
  const model = adapter.vendor.models.find((item: any) => item.modelName === "agnes-video-v2.0");

  await assert.rejects(
    adapter.videoRequest(
      {
        duration: 5,
        resolution: "480p",
        aspectRatio: "16:9",
        prompt: "Download the completed task.",
        referenceList: [],
        mode: "text",
      },
      model,
    ),
    (error: any) => {
      assert.match(error.message, /stage=download/);
      assert.match(error.message, /task_id=task-download-error/);
      assert.match(error.message, /retry=2/);
      assert.match(error.message, /ECONNREFUSED/);
      assert.doesNotMatch(error.message, /\[object Object\]/);
      assert.doesNotMatch(error.message, /should-not-appear/);
      return true;
    },
  );
});
