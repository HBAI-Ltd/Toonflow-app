import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { transform } from "sucrase";
import { VM } from "vm2";

type PostCall = { url: string; body: any; options: { headers: Record<string, string> } };

class MockFormData {
  private readonly boundary = "test-boundary";
  private readonly parts: Buffer[] = [];

  append(name: string, value: string | Buffer, options?: { filename: string; contentType: string }) {
    const disposition = options ? `; filename="${options.filename}"` : "";
    const contentType = options ? `\r\nContent-Type: ${options.contentType}` : "";
    this.parts.push(
      Buffer.concat([
        Buffer.from(`--${this.boundary}\r\nContent-Disposition: form-data; name="${name}"${disposition}${contentType}\r\n\r\n`),
        Buffer.isBuffer(value) ? value : Buffer.from(value),
        Buffer.from("\r\n"),
      ]),
    );
  }

  getHeaders(headers: Record<string, string>) {
    return { ...headers, "content-type": `multipart/form-data; boundary=${this.boundary}` };
  }

  getBuffer() {
    return Buffer.concat([...this.parts, Buffer.from(`--${this.boundary}--\r\n`)]);
  }
}

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
      Buffer,
      createOpenAI: () => ({ chat: () => ({}) }),
      exports,
      FormData: MockFormData,
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

test("uses image edits multipart requests for multiple referenceList images", async () => {
  const { adapter, calls } = loadAdapter({ data: [{ b64_json: "ZWRpdGVk" }] });

  const result = await adapter.imageRequest(
    {
      ...config,
      referenceList: [
        { type: "image", base64: "data:image/png;base64,Zmlyc3Q=" },
        { type: "image", base64: "data:image/jpeg;base64,c2Vjb25k" },
      ],
    },
    model,
  );

  assert.equal(result, "ZWRpdGVk");
  assert.equal(calls[0].url, "https://example.test/v1/images/edits");
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-key");
  assert.match(calls[0].options.headers["content-type"], /^multipart\/form-data; boundary=/);
  const multipart = calls[0].body.getBuffer().toString("utf8");
  assert.equal((multipart.match(/name="image\[\]"/g) ?? []).length, 2);
  assert.match(multipart, /name="model"\r\n\r\ngpt-image-2/);
  assert.match(multipart, /name="prompt"\r\n\r\na cat/);
  assert.match(multipart, /name="size"\r\n\r\n1536x1024/);
  assert.match(multipart, /filename="reference-1.png"/);
  assert.match(multipart, /filename="reference-2.jpg"/);
});

test("supports legacy imageBase64 values in image edits", async () => {
  const { adapter, calls } = loadAdapter({ data: [{ url: "https://images.test/edited.png" }] });

  const result = await adapter.imageRequest({ ...config, imageBase64: ["bGVnYWN5"] }, model);

  assert.equal(result, "downloaded:https://images.test/edited.png");
  assert.equal(calls[0].url, "https://example.test/v1/images/edits");
  const multipart = calls[0].body.getBuffer().toString("utf8");
  assert.equal((multipart.match(/name="image\[\]"/g) ?? []).length, 1);
  assert.match(multipart, /filename="reference-1.png"/);
});
