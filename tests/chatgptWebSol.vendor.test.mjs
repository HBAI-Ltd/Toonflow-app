import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { transform } from "sucrase";
import { VM } from "vm2";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vendorPath = path.join(rootDir, "data", "vendor", "chatgptWebSol.ts");
const fixDbPath = path.join(rootDir, "src", "lib", "fixDB.ts");

function loadVendor(options = {}) {
  const source = fs.readFileSync(vendorPath, "utf8");
  const code = transform(source, { transforms: ["typescript"] }).code.replace(/export\s*\{\s*\};?/g, "");
  const exports = {};
  const calls = [];
  const fetchCalls = [];
  const vm = new VM({
    timeout: 0,
    sandbox: {
      exports,
      logger: () => {},
      fetch:
        options.fetch ??
        (async (input, init) => {
          fetchCalls.push({ input, init });
          return { ok: true };
        }),
      createOpenAI:
        options.createOpenAI ??
        ((providerOptions) => ({
          chat: (modelName) => {
            const model = { options: providerOptions, modelName };
            calls.push(model);
            return model;
          },
        })),
    },
  });
  vm.run(code);
  return { adapter: exports, calls, fetchCalls };
}

test("declares only the ChatGPT web GPT-5.6 SOL extreme text model", () => {
  const { adapter } = loadVendor();

  assert.equal(adapter.vendor.id, "chatgptWebSol");
  assert.equal(adapter.vendor.name, "ChatGPT 网页 GPT-5.6 SOL");
  assert.equal(adapter.vendor.inputValues.baseUrl, "http://127.0.0.1:5173/v1");
  assert.deepEqual(adapter.vendor.models, [
    {
      name: "GPT-5.6 SOL（极高）",
      modelName: "gpt-5.6-sol-wm",
      type: "text",
      think: true,
    },
  ]);
});

test("always sends xhigh reasoning through the OpenAI-compatible provider", async () => {
  const { adapter, calls, fetchCalls } = loadVendor();
  adapter.vendor.inputValues.apiKey = "Bearer proxy-secret";

  const model = adapter.textRequest(adapter.vendor.models[0], false, 0);

  assert.equal(calls.length, 1);
  assert.equal(model.modelName, "gpt-5.6-sol-wm");
  assert.equal(model.options.baseURL, "http://127.0.0.1:5173/v1");
  assert.equal(model.options.apiKey, "proxy-secret");
  assert.equal(typeof model.options.fetch, "function");

  await model.options.fetch("http://127.0.0.1:5173/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: "gpt-5.6-sol-wm",
      messages: [{ role: "user", content: "只回复 OK" }],
      reasoning_effort: "low",
    }),
  });

  assert.equal(fetchCalls.length, 1);
  assert.deepEqual(JSON.parse(fetchCalls[0].init.body), {
    model: "gpt-5.6-sol-wm",
    messages: [{ role: "user", content: "只回复 OK" }],
    reasoning_effort: "xhigh",
  });
});

test("normalizes base URLs without duplicating the OpenAI path", () => {
  const { adapter } = loadVendor();
  adapter.vendor.inputValues.apiKey = "proxy-secret";

  adapter.vendor.inputValues.baseUrl = "http://127.0.0.1:8000/";
  assert.equal(adapter.textRequest(adapter.vendor.models[0], true, 3).options.baseURL, "http://127.0.0.1:8000/v1");

  adapter.vendor.inputValues.baseUrl = "http://127.0.0.1:8000/v1/chat/completions/";
  assert.equal(adapter.textRequest(adapter.vendor.models[0], true, 3).options.baseURL, "http://127.0.0.1:8000/v1");
});

test("rejects missing configuration without exposing credentials", () => {
  const { adapter } = loadVendor();

  assert.throws(() => adapter.textRequest(adapter.vendor.models[0], true, 3), /缺少代理 API Key/);

  adapter.vendor.inputValues.apiKey = "proxy-secret";
  adapter.vendor.inputValues.baseUrl = " ";
  assert.throws(() => adapter.textRequest(adapter.vendor.models[0], true, 3), /缺少请求地址/);
});

test("registers the provider from its packaged vendor file", () => {
  const source = fs.readFileSync(fixDbPath, "utf8");

  assert.match(source, /externalBuiltInVendorFiles\s*=\s*\[[^\]]*"chatgptWebSol\.ts"/s);
});

test("injects xhigh into the actual AI SDK chat completion request", async () => {
  let captured;
  const server = http.createServer((request, response) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      captured = {
        url: request.url,
        authorization: request.headers.authorization,
        body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
      };
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          id: "chatcmpl-test",
          object: "chat.completion",
          created: 1,
          model: "gpt-5.6-sol-wm",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "OK" },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
      );
    });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    assert.equal(typeof address, "object");
    const { adapter } = loadVendor({ createOpenAI, fetch });
    adapter.vendor.inputValues.apiKey = "proxy-secret";
    adapter.vendor.inputValues.baseUrl = `http://127.0.0.1:${address.port}`;

    const result = await generateText({
      model: adapter.textRequest(adapter.vendor.models[0], false, 0),
      prompt: "只回复 OK",
    });

    assert.equal(result.text, "OK");
    assert.equal(captured.url, "/v1/chat/completions");
    assert.equal(captured.authorization, "Bearer proxy-secret");
    assert.equal(captured.body.model, "gpt-5.6-sol-wm");
    assert.equal(captured.body.reasoning_effort, "xhigh");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
