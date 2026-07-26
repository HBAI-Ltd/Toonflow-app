import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { transform } from "sucrase";
import { VM } from "vm2";

type PostCall = { url: string; body: Record<string, unknown>; options: { headers: Record<string, string> } };

function loadAdapter(responseData: unknown) {
  const calls: PostCall[] = [];
  const axios = {
    post: async (url: string, body: Record<string, unknown>, options: PostCall["options"]) => {
      calls.push({ url, body, options });
      return { data: responseData };
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
      urlToBase64: async (url: string) => `downloaded:${url}`,
    },
  });
  vm.run(code);
  exports.vendor.inputValues = { apiKey: "Bearer test-key", baseUrl: "https://example.test/v1/" };
  return { adapter: exports, calls };
}

const model = { name: "GPT Image", modelName: "gpt-image-2", type: "image", mode: ["text"] };
const config = { prompt: "a cat", referenceList: [], size: "2K", aspectRatio: "16:9" };

test("requests the OpenAI image generations endpoint and returns b64_json", async () => {
  const { adapter, calls } = loadAdapter({ data: [{ b64_json: "aW1hZ2U=" }] });

  const result = await adapter.imageRequest(config, model);

  assert.equal(result, "aW1hZ2U=");
  assert.equal(calls[0].url, "https://example.test/v1/images/generations");
  assert.deepEqual(calls[0].body, { model: "gpt-image-2", prompt: "a cat", n: 1, size: "1536x1024" });
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-key");
});

test("downloads URL responses through the sandbox helper", async () => {
  const { adapter } = loadAdapter({ data: [{ url: "https://images.test/result.png" }] });

  const result = await adapter.imageRequest(config, model);

  assert.equal(result, "downloaded:https://images.test/result.png");
});

test("rejects empty image responses", async () => {
  const { adapter } = loadAdapter({ data: [{}] });

  await assert.rejects(() => adapter.imageRequest(config, model), /未返回 b64_json 或图片URL/);
});

test("rejects reference images instead of silently ignoring them", async () => {
  const { adapter } = loadAdapter({ data: [{ b64_json: "unused" }] });

  await assert.rejects(
    () => adapter.imageRequest({ ...config, referenceList: [{ type: "image", base64: "data:image/png;base64,eA==" }] }, model),
    /暂不支持参考图/,
  );
});
