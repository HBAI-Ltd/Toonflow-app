const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { stripTypeScriptTypes } = require("node:module");

class TestFormData {
  constructor() {
    this.parts = [];
  }

  append(name, value, options) {
    this.parts.push({ name, value, options });
  }

  getHeaders() {
    return { "content-type": "multipart/form-data; boundary=test" };
  }
}

function loadVendor(responses) {
  const calls = [];
  const source = fs
    .readFileSync(path.join(__dirname, "..", "data", "vendor", "minimax.ts"), "utf8")
    .replace(/export\s*\{\s*\};?/g, "");
  const code = stripTypeScriptTypes(source, { mode: "transform" });
  const sandbox = {
    axios: {
      post: async (...args) => {
        calls.push(args);
        return responses.shift();
      },
    },
    Buffer,
    FormData: TestFormData,
    exports: {},
    logger: () => {},
    zipImage: async (value) => value,
  };
  vm.runInNewContext(code, sandbox);
  return { calls, exports: sandbox.exports };
}

test("voice cloning uploads both audio purposes and calls the regional endpoint", async () => {
  const responses = [
    { data: { file: { file_id: 101 }, base_resp: { status_code: 0 } } },
    { data: { voice_id: "cloned-voice", base_resp: { status_code: 0 } } },
    { data: { file_id: 202, base_resp: { status_code: 0 } } },
  ];
  const { calls, exports } = loadVendor(responses);
  exports.vendor.inputValues = {
    apiKey: "test-key",
    baseUrl: "https://api.minimax.io",
  };

  const voiceId = await exports.voiceClone({
    cloneAudio: `data:audio/mpeg;base64,${Buffer.from("clone").toString("base64")}`,
    voiceId: "requested-voice",
    model: "speech-2.8-hd",
  });
  const promptFileId = await exports.uploadPromptAudio(
    `data:audio/wav;base64,${Buffer.from("prompt").toString("base64")}`,
  );

  assert.equal(voiceId, "cloned-voice");
  assert.equal(promptFileId, "202");
  assert.deepEqual(
    calls.map(([url]) => url),
    [
      "https://api.minimax.io/v1/files/upload",
      "https://api.minimax.io/v1/voice_clone",
      "https://api.minimax.io/v1/files/upload",
    ],
  );
  assert.equal(calls[0][1].parts[0].value, "voice_clone");
  assert.equal(calls[2][1].parts[0].value, "prompt_audio");
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1][1])), {
    file_id: "101",
    voice_id: "requested-voice",
    model: "speech-2.8-hd",
  });
  assert.equal(calls[1][2].headers.Authorization, "Bearer test-key");
});

test("voice clone capability registers models, formats, and China routing", async () => {
  const responses = [
    { data: { file_id: "303", base_resp: { status_code: 0 } } },
    { data: { voice_id: "cn-voice", base_resp: { status_code: 0 } } },
  ];
  const { calls, exports } = loadVendor(responses);
  exports.vendor.inputValues = {
    apiKey: "Bearer test-key",
    baseUrl: "https://api.minimaxi.com/",
  };

  const capability = exports.vendor.capabilities.find(({ type }) => type === "voiceClone");
  assert.equal(typeof exports.uploadCloneAudio, "function");
  assert.equal(typeof exports.uploadPromptAudio, "function");
  assert.equal(typeof exports.voiceClone, "function");
  assert.deepEqual(Array.from(capability.models), ["speech-2.8-hd", "speech-2.6-hd", "speech-02-hd", "speech-01-hd"]);
  assert.deepEqual(Array.from(capability.audioFormats), ["mp3", "m4a", "wav"]);
  assert.deepEqual(
    Array.from(capability.operations, ({ operationId, method, path }) => ({ operationId, method, path })),
    [
      { operationId: "uploadCloneAudio", method: "POST", path: "/v1/files/upload" },
      { operationId: "uploadPromptAudio", method: "POST", path: "/v1/files/upload" },
      { operationId: "voiceClone", method: "POST", path: "/v1/voice_clone" },
    ],
  );
  await exports.voiceClone({
    cloneAudio: `data:audio/mp4;base64,${Buffer.from("clone").toString("base64")}`,
    voiceId: "requested-cn-voice",
    model: "speech-2.6-hd",
  });

  assert.equal(calls[0][0], "https://api.minimaxi.com/v1/files/upload");
  assert.equal(calls[1][0], "https://api.minimaxi.com/v1/voice_clone");
  assert.equal(calls[1][2].headers.Authorization, "Bearer test-key");
});

test("voice cloning rejects unsupported audio before any request", async () => {
  const { calls, exports } = loadVendor([]);
  exports.vendor.inputValues = { apiKey: "test-key", baseUrl: "https://api.minimax.io" };

  await assert.rejects(
    exports.voiceClone({
      cloneAudio: "data:audio/ogg;base64,dGVzdA==",
      voiceId: "voice",
      model: "speech-02-hd",
    }),
    /MP3, M4A, or WAV/,
  );
  assert.equal(calls.length, 0);
});
