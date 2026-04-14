import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  bumpVersion,
  countConversationMessagesByScopePrefix,
  countMemoriesByIsolationPrefix,
  countRowsByColumn,
  countRowsByProjectId,
  countMemories,
  createDirectorManualData,
  createVisualManualData,
  createZipFixture,
  createVendorTsCode,
  getUnusedLocalBaseUrl,
  getDirectorManualPaths,
  getVisualManualPaths,
  insertAssetRow,
  insertImageRow,
  insertNovelEventLink,
  insertProjectScopedRows,
  insertScriptScopedRows,
  insertStoryboardRow,
  insertVendorConfigRow,
  insertVideoRow,
  insertVideoTrackRow,
  insertTaskRow,
  insertConversationMessageRow,
  insertMemoryRow,
  listImageFiles,
  login,
  readRepoPackageVersion,
  requestJson,
  requestJsonWithAuth,
  resolveAppModuleExports,
  startMockBinaryServer,
  startMockJsonServer,
  startMockTextServer,
  updateProjectVideoModel,
} from "./baseline.shared";

const repoRoot = path.resolve(__dirname, "..");
const originalCwd = process.cwd();
const originalNodeEnv = process.env.NODE_ENV;
const originalSkipEmbedding = process.env.TOONFLOW_SKIP_EMBEDDING;
const originalMockVendorTest = process.env.TOONFLOW_MOCK_VENDOR_TEST;
const originalMockAgentSetKey = process.env.TOONFLOW_MOCK_AGENT_SET_KEY;
const originalMockCleanNovel = process.env.TOONFLOW_MOCK_CLEAN_NOVEL;
const originalForceElectron = process.env.TOONFLOW_FORCE_ELECTRON;
const originalMockOpenFolder = process.env.TOONFLOW_MOCK_OPEN_FOLDER;

function getDirectorManualEntry(
  data: Array<{
    value?: string;
    data?: string;
  }>,
  value: string,
): string | undefined {
  return data.find((item) => item.value === value)?.data;
}

function getVisualManualEntry(
  data: Array<{
    value?: string;
    data?: string;
  }>,
  value: string,
): string | undefined {
  return data.find((item) => item.value === value)?.data;
}

function normalizeAgentDeployRows(data: unknown): Array<Record<string, any>> {
  if (Array.isArray(data)) {
    return data as Array<Record<string, any>>;
  }

  if (data && typeof data === "object") {
    const objectData = data as {
      qrdinaryData?: Array<Record<string, any>>;
      advancedData?: Array<Record<string, any>>;
    };
    return [...(objectData.qrdinaryData ?? []), ...(objectData.advancedData ?? [])];
  }

  return [];
}

function getOssRelativePath(fileUrl: string): string {
  const pathname = getUrlPathname(fileUrl);
  return pathname.replace(/^\/oss\//, "");
}

function getUrlPathname(fileUrl: string): string {
  return fileUrl.startsWith("http://") || fileUrl.startsWith("https://") ? new URL(fileUrl).pathname : fileUrl;
}

async function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "toonflow-baseline-"));
  const dbPath = path.join(tempRoot, "data", "db2.sqlite");
  let closeServe: (() => Promise<void>) | undefined;
  let closeUpdateServer: (() => Promise<void>) | undefined;
  let closeUpdateTextServer: (() => Promise<void>) | undefined;
  let closeCodeServer: (() => Promise<void>) | undefined;
  let closeDownloadServer: (() => Promise<void>) | undefined;
  let cleanupDownloadFixture: (() => void) | undefined;

  try {
    fs.mkdirSync(path.join(tempRoot, "data"), { recursive: true });
    const legacyDbPath = path.join(tempRoot, "db2.sqlite");
    {
      const Database = require("better-sqlite3");
      const legacyDb = new Database(legacyDbPath);
      try {
        legacyDb.exec(`
          CREATE TABLE memories (
            id TEXT PRIMARY KEY,
            isolationKey TEXT NOT NULL,
            type TEXT NOT NULL,
            role TEXT,
            name TEXT,
            content TEXT NOT NULL,
            embedding TEXT,
            relatedMessageIds TEXT,
            summarized INTEGER DEFAULT 0,
            createTime INTEGER NOT NULL
          )
        `);
        legacyDb
          .prepare(
            `
              INSERT INTO memories (id, isolationKey, type, role, content, createTime)
              VALUES (@id, @isolationKey, @type, @role, @content, @createTime)
            `,
          )
          .run({
            id: "legacy-memory-baseline",
            isolationKey: "legacy:migrated",
            type: "message",
            role: "user",
            content: "baseline legacy memory",
            createTime: Date.now() - 10_000,
          });
      } finally {
        legacyDb.close();
      }
    }

    process.env.NODE_ENV = "test";
    process.env.TOONFLOW_SKIP_EMBEDDING = "1";
    process.env.TOONFLOW_MOCK_VENDOR_TEST = "1";
    process.env.TOONFLOW_MOCK_CLEAN_NOVEL = "1";
    process.chdir(tempRoot);

    const skillRelativePath = "baseline/skill.md";
    const skillFilePath = path.join(tempRoot, "data", "skills", "baseline", "skill.md");
    const initialSkillContent = "# Baseline Skill\n\ninitial content\n";
    const updatedSkillContent = "# Baseline Skill\n\nupdated content\n";
    fs.mkdirSync(path.dirname(skillFilePath), { recursive: true });
    fs.writeFileSync(skillFilePath, initialSkillContent, "utf-8");

    const appModule = require(path.join(repoRoot, "src", "app.ts"));
    const appExports = resolveAppModuleExports(appModule);
    const port = await appExports.default(true);
    const baseUrl = `http://127.0.0.1:${port}`;
    const updatedLoginName = "baseline-admin";
    const updatedLoginPassword = "baseline-pass-123";
    const downloadVersion = "9.9.9-baseline";
    const serveMarkerPath = path.join(tempRoot, "data", "serve", "marker.txt");
    const webIndexPath = path.join(tempRoot, "data", "web", "index.html");
    const downloadedSkillPath = path.join(tempRoot, "data", "skills", "downloaded", "skill.md");
    const downloadedModelPath = path.join(tempRoot, "data", "models", "downloaded", "model.bin");
    fs.mkdirSync(path.dirname(serveMarkerPath), { recursive: true });
    fs.mkdirSync(path.dirname(webIndexPath), { recursive: true });
    fs.mkdirSync(path.dirname(downloadedSkillPath), { recursive: true });
    fs.mkdirSync(path.dirname(downloadedModelPath), { recursive: true });
    fs.writeFileSync(serveMarkerPath, "serve-before-download", "utf-8");
    fs.writeFileSync(webIndexPath, "<html>before download</html>", "utf-8");
    fs.writeFileSync(downloadedSkillPath, "# Before Download Skill\n", "utf-8");
    fs.writeFileSync(downloadedModelPath, "model-before-download", "utf-8");
    const currentVersion = readRepoPackageVersion(repoRoot);
    const patchVersion = bumpVersion(currentVersion, "patch");
    const majorVersion = bumpVersion(currentVersion, "major");
    const installerUrlMap = {
      win32: "https://downloads.example/windows-installer.exe",
      darwin: "https://downloads.example/macos-installer.dmg",
      linux: "https://downloads.example/linux-installer.AppImage",
    } as const;
    const platformInstallerType = {
      win32: "windows",
      darwin: "macos",
      linux: "linux",
    } as const;
    const currentPlatformInstallerType = platformInstallerType[process.platform as keyof typeof platformInstallerType];
    const createUpdatePayload = (
      version: string,
      options: {
        includeZip?: boolean;
        includeInstallers?: boolean;
      } = {},
    ) => {
      const { includeZip = true, includeInstallers = true } = options;
      const createSourceItems = () => {
        const items: Array<{ type: string; url: string }> = [];

        if (includeZip) {
          items.push({ type: "zip", url: "https://downloads.example/update.zip" });
        }

        if (includeInstallers) {
          items.push(
            { type: "windows", url: installerUrlMap.win32 },
            { type: "macos", url: installerUrlMap.darwin },
            { type: "linux", url: installerUrlMap.linux },
          );
        }

        return items;
      };

      return {
        version,
        time: "2026-04-11T00:00:00Z",
        data: {
          github: createSourceItems(),
          toonflow: createSourceItems(),
          gitee: createSourceItems(),
          atomgit: createSourceItems(),
        },
      };
    };
    const createPayloadWithMissingDownloadUrl = (
      payload: ReturnType<typeof createUpdatePayload>,
      missingType: string,
    ) => {
      const stripUrl = (items: Array<{ type: string; url: string }>) =>
        items.map((item) => (item.type === missingType ? ({ type: item.type } as { type: string; url?: string }) : item));

      return {
        ...payload,
        data: {
          github: stripUrl(payload.data.github),
          toonflow: stripUrl(payload.data.toonflow),
          gitee: stripUrl(payload.data.gitee),
          atomgit: stripUrl(payload.data.atomgit),
        },
      };
    };
    const patchPayload = createUpdatePayload(patchVersion);
    const samePayload = createUpdatePayload(currentVersion);
    const majorPayload = createUpdatePayload(majorVersion);
    const patchNoZipPayload = createUpdatePayload(patchVersion, { includeZip: false });
    const patchMissingZipUrlPayload = createPayloadWithMissingDownloadUrl(patchPayload, "zip");
    const majorNoInstallerPayload = createUpdatePayload(majorVersion, { includeInstallers: false });
    const majorMissingInstallerUrlPayload = createPayloadWithMissingDownloadUrl(majorPayload, currentPlatformInstallerType);
    const missingSourcePayload = {
      ...patchPayload,
      data: {
        toonflow: patchPayload.data.toonflow,
        gitee: patchPayload.data.gitee,
        atomgit: patchPayload.data.atomgit,
      },
    };
    const { version: _ignoredPatchVersion, ...missingVersionPayload } = patchPayload;
    const invalidVersionPayload = {
      ...patchPayload,
      version: "invalid-version",
    };
    const updateServer = await startMockJsonServer({
      "/patch.json": patchPayload,
      "/same.json": samePayload,
      "/major.json": majorPayload,
      "/patch-no-zip.json": patchNoZipPayload,
      "/patch-missing-zip-url.json": patchMissingZipUrlPayload,
      "/major-no-installer.json": majorNoInstallerPayload,
      "/major-missing-installer-url.json": majorMissingInstallerUrlPayload,
      "/missing-source.json": missingSourcePayload,
      "/missing-version.json": missingVersionPayload,
      "/invalid-version.json": invalidVersionPayload,
    });
    closeUpdateServer = updateServer.close;
    const updateTextServer = await startMockTextServer({
      "/invalid.json": {
        body: "{invalid-json",
        contentType: "application/json",
      },
    });
    closeUpdateTextServer = updateTextServer.close;
    const unavailableUpdateBaseUrl = await getUnusedLocalBaseUrl();
    const unavailableDownloadBaseUrl = await getUnusedLocalBaseUrl();
    const vendorCodeText = [
      "exports.vendor = {",
      '  id: "baseline-link-vendor",',
      '  name: "Baseline Link Vendor",',
      "};",
      "",
    ].join("\n");
    const codeServer = await startMockTextServer({
      "/vendor.ts": vendorCodeText,
    });
    closeCodeServer = codeServer.close;
    const downloadFixture = await createZipFixture({
      "serve/marker.txt": "serve-after-download",
      "web/index.html": "<html><body>after download</body></html>",
      "skills/downloaded/skill.md": "# After Download Skill\n",
      "models/downloaded/model.bin": "model-after-download",
    });
    cleanupDownloadFixture = downloadFixture.cleanup;
    const downloadZip = fs.readFileSync(downloadFixture.zipPath);
    const downloadServer = await startMockBinaryServer({
      "/update.zip": {
        body: downloadZip,
        contentType: "application/zip",
      },
      "/invalid.zip": {
        body: Buffer.from("not-a-valid-zip", "utf-8"),
        contentType: "application/zip",
      },
    });
    closeDownloadServer = downloadServer.close;

    closeServe = appExports.closeServe;

    let token = await login(baseUrl);
    assert.equal(countMemoriesByIsolationPrefix(dbPath, "legacy:"), 1);
    console.log("PASS login whitelist smoke");
    console.log("PASS legacy db migration smoke");

    const protectedResult = await requestJson(baseUrl, "/api/project/getProject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    assert.equal(protectedResult.response.status, 401);
    console.log("PASS auth guard smoke");

    const userResult = await requestJsonWithAuth(baseUrl, "/api/setting/loginConfig/getUser", token, {
      method: "GET",
    });

    assert.equal(userResult.response.status, 200);
    assert.ok(userResult.json);
    assert.equal(userResult.json.code, 200);
    assert.equal(userResult.json.data.id, 1);
    assert.equal(userResult.json.data.name, "admin");
    console.log("PASS setting loginConfig smoke");

    const updateUserPwdResult = await requestJsonWithAuth(baseUrl, "/api/setting/loginConfig/updateUserPwd", token, {
      method: "POST",
      body: JSON.stringify({
        id: 1,
        name: updatedLoginName,
        password: updatedLoginPassword,
      }),
    });

    assert.equal(updateUserPwdResult.response.status, 200);
    assert.ok(updateUserPwdResult.json);
    assert.equal(updateUserPwdResult.json.code, 200);

    const updatedUserResult = await requestJsonWithAuth(baseUrl, "/api/setting/loginConfig/getUser", token, {
      method: "GET",
    });

    assert.equal(updatedUserResult.response.status, 200);
    assert.ok(updatedUserResult.json);
    assert.equal(updatedUserResult.json.code, 200);
    assert.equal(updatedUserResult.json.data.name, updatedLoginName);

    const oldLoginResult = await requestJson(baseUrl, "/api/login/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "admin",
        password: "admin123",
      }),
    });

    assert.equal(oldLoginResult.response.status, 400);
    token = await login(baseUrl, {
      username: updatedLoginName,
      password: updatedLoginPassword,
    });
    console.log("PASS setting loginConfig update smoke");

    const switchInitialResult = await requestJsonWithAuth(baseUrl, "/api/setting/dev/getSwitchAiDevTool", token, {
      method: "GET",
    });

    assert.equal(switchInitialResult.response.status, 200);
    assert.ok(switchInitialResult.json);
    assert.equal(switchInitialResult.json.code, 200);
    assert.equal(switchInitialResult.json.data, "0");

    const switchUpdateResult = await requestJsonWithAuth(baseUrl, "/api/setting/dev/updateSwitchAiDevTool", token, {
      method: "POST",
      body: JSON.stringify({
        switchAiDevTool: "1",
      }),
    });

    assert.equal(switchUpdateResult.response.status, 200);
    assert.ok(switchUpdateResult.json);
    assert.equal(switchUpdateResult.json.code, 200);

    const switchUpdatedResult = await requestJsonWithAuth(baseUrl, "/api/setting/dev/getSwitchAiDevTool", token, {
      method: "GET",
    });

    assert.equal(switchUpdatedResult.response.status, 200);
    assert.ok(switchUpdatedResult.json);
    assert.equal(switchUpdatedResult.json.code, 200);
    assert.equal(switchUpdatedResult.json.data, "1");
    console.log("PASS setting dev toggle smoke");

    const promptResult = await requestJsonWithAuth(baseUrl, "/api/setting/promptManage/getPrompt", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(promptResult.response.status, 200);
    assert.ok(promptResult.json);
    assert.equal(promptResult.json.code, 200);
    assert.ok(Array.isArray(promptResult.json.data));
    assert.ok(promptResult.json.data.length > 0);
    assert.ok(promptResult.json.data.every((item: { data?: string }) => typeof item.data === "string"));
    const promptToUpdate = promptResult.json.data[0] as { id: number; data: string };
    const updatedPromptData = `${promptToUpdate.data}\n\n[baseline prompt updated]`;

    const updatePromptResult = await requestJsonWithAuth(baseUrl, "/api/setting/promptManage/updatePrompt", token, {
      method: "POST",
      body: JSON.stringify({
        id: promptToUpdate.id,
        data: updatedPromptData,
      }),
    });

    assert.equal(updatePromptResult.response.status, 200);
    assert.ok(updatePromptResult.json);
    assert.equal(updatePromptResult.json.code, 200);

    const promptUpdatedResult = await requestJsonWithAuth(baseUrl, "/api/setting/promptManage/getPrompt", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(promptUpdatedResult.response.status, 200);
    assert.ok(promptUpdatedResult.json);
    assert.equal(promptUpdatedResult.json.code, 200);
    const updatedPrompt = promptUpdatedResult.json.data.find((item: { id?: number; data?: string }) => item.id === promptToUpdate.id);
    assert.ok(updatedPrompt);
    assert.equal(updatedPrompt.data, updatedPromptData);
    console.log("PASS setting prompt manage smoke");

    const agentDeployResult = await requestJsonWithAuth(baseUrl, "/api/setting/agentDeploy/getAgentDeploy", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(agentDeployResult.response.status, 200);
    assert.ok(agentDeployResult.json);
    assert.equal(agentDeployResult.json.code, 200);
    const agentDeployRows = normalizeAgentDeployRows(agentDeployResult.json.data);
    assert.ok(agentDeployRows.length >= 2);
    assert.ok(agentDeployRows.some((item: { key?: string }) => item.key === "scriptAgent"));
    assert.ok(agentDeployRows.some((item: { key?: string }) => item.key === "productionAgent"));
    const scriptAgent = agentDeployRows.find((item: { key?: string }) => item.key === "scriptAgent") as {
      id: number;
    };
    assert.ok(scriptAgent);

    const deployAgentModelResult = await requestJsonWithAuth(baseUrl, "/api/setting/agentDeploy/deployAgentModel", token, {
      method: "POST",
      body: JSON.stringify({
        id: scriptAgent.id,
        name: "剧本Agent-基线",
        model: "GPT-4.1 mini",
        modelName: "openai:gpt-4.1-mini",
        vendorId: "openai",
        desc: "baseline deployed model",
      }),
    });

    assert.equal(deployAgentModelResult.response.status, 200);
    assert.ok(deployAgentModelResult.json);
    assert.equal(deployAgentModelResult.json.code, 200);

    const agentDeployUpdatedResult = await requestJsonWithAuth(baseUrl, "/api/setting/agentDeploy/getAgentDeploy", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(agentDeployUpdatedResult.response.status, 200);
    assert.ok(agentDeployUpdatedResult.json);
    assert.equal(agentDeployUpdatedResult.json.code, 200);
    const updatedAgentDeployRows = normalizeAgentDeployRows(agentDeployUpdatedResult.json.data);
    const updatedScriptAgent = updatedAgentDeployRows.find(
      (item: { id?: number; key?: string; name?: string; model?: string; modelName?: string; vendorId?: string; desc?: string }) =>
        item.id === scriptAgent.id,
    );
    assert.ok(updatedScriptAgent);
    assert.equal(updatedScriptAgent.name, "剧本Agent-基线");
    assert.equal(updatedScriptAgent.model, "GPT-4.1 mini");
    assert.equal(updatedScriptAgent.modelName, "openai:gpt-4.1-mini");
    assert.equal(updatedScriptAgent.vendorId, "openai");
    assert.equal(updatedScriptAgent.desc, "baseline deployed model");
    console.log("PASS setting agentDeploy smoke");

    process.env.TOONFLOW_MOCK_AGENT_SET_KEY = "success";

    const agentSetKeySuccessResult = await requestJsonWithAuth(baseUrl, "/api/setting/agentDeploy/agentSetKey", token, {
      method: "POST",
      body: JSON.stringify({
        key: "tf-success-key",
      }),
    });

    assert.equal(agentSetKeySuccessResult.response.status, 200);
    assert.ok(agentSetKeySuccessResult.json);
    assert.equal(agentSetKeySuccessResult.json.code, 200);

    const agentDeployAfterSetKeyResult = await requestJsonWithAuth(baseUrl, "/api/setting/agentDeploy/getAgentDeploy", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(agentDeployAfterSetKeyResult.response.status, 200);
    assert.ok(agentDeployAfterSetKeyResult.json);
    assert.equal(agentDeployAfterSetKeyResult.json.code, 200);
    const agentDeployRowsAfterSetKey = normalizeAgentDeployRows(agentDeployAfterSetKeyResult.json.data);
    const scriptAgentAfterSetKey = agentDeployRowsAfterSetKey.find(
      (item: { key?: string; vendorId?: string; model?: string; modelName?: string }) => item.key === "scriptAgent",
    );
    const productionAgentAfterSetKey = agentDeployRowsAfterSetKey.find(
      (item: { key?: string; vendorId?: string; model?: string; modelName?: string }) => item.key === "productionAgent",
    );
    const universalAiAfterSetKey = agentDeployRowsAfterSetKey.find(
      (item: { key?: string; vendorId?: string; model?: string; modelName?: string }) => item.key === "universalAi",
    );
    assert.ok(scriptAgentAfterSetKey);
    assert.ok(productionAgentAfterSetKey);
    assert.ok(universalAiAfterSetKey);
    assert.equal(scriptAgentAfterSetKey.vendorId, "toonflow");
    assert.equal(scriptAgentAfterSetKey.model, "claude-sonnet-4-6");
    assert.equal(scriptAgentAfterSetKey.modelName, "toonflow:claude-sonnet-4-6");
    assert.equal(productionAgentAfterSetKey.vendorId, "toonflow");
    assert.equal(productionAgentAfterSetKey.model, "claude-sonnet-4-6");
    assert.equal(productionAgentAfterSetKey.modelName, "toonflow:claude-sonnet-4-6");
    assert.equal(universalAiAfterSetKey.vendorId, "toonflow");
    assert.equal(universalAiAfterSetKey.model, "claude-haiku-4-5");
    assert.equal(universalAiAfterSetKey.modelName, "toonflow:claude-haiku-4-5-20251001");

    const vendorListAfterSetKeyResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterSetKeyResult.response.status, 200);
    assert.ok(vendorListAfterSetKeyResult.json);
    assert.equal(vendorListAfterSetKeyResult.json.code, 200);
    const toonflowVendorAfterSetKey = vendorListAfterSetKeyResult.json.data.find(
      (item: { id?: string; inputValues?: { apiKey?: string } }) => item.id === "toonflow",
    );
    assert.ok(toonflowVendorAfterSetKey);
    assert.equal(toonflowVendorAfterSetKey.inputValues.apiKey, "tf-success-key");

    process.env.TOONFLOW_MOCK_AGENT_SET_KEY = "failure";

    const agentSetKeyFailureResult = await requestJsonWithAuth(baseUrl, "/api/setting/agentDeploy/agentSetKey", token, {
      method: "POST",
      body: JSON.stringify({
        key: "tf-invalid-key",
      }),
    });

    assert.equal(agentSetKeyFailureResult.response.status, 400);
    assert.ok(agentSetKeyFailureResult.json);
    assert.equal(agentSetKeyFailureResult.json.code, 400);

    const vendorListAfterFailedSetKeyResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterFailedSetKeyResult.response.status, 200);
    assert.ok(vendorListAfterFailedSetKeyResult.json);
    assert.equal(vendorListAfterFailedSetKeyResult.json.code, 200);
    const toonflowVendorAfterFailedSetKey = vendorListAfterFailedSetKeyResult.json.data.find(
      (item: { id?: string; inputValues?: { apiKey?: string } }) => item.id === "toonflow",
    );
    assert.ok(toonflowVendorAfterFailedSetKey);
    assert.equal(toonflowVendorAfterFailedSetKey.inputValues.apiKey, "");

    const agentDeployAfterFailedSetKeyResult = await requestJsonWithAuth(baseUrl, "/api/setting/agentDeploy/getAgentDeploy", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(agentDeployAfterFailedSetKeyResult.response.status, 200);
    assert.ok(agentDeployAfterFailedSetKeyResult.json);
    assert.equal(agentDeployAfterFailedSetKeyResult.json.code, 200);
    const agentDeployRowsAfterFailedSetKey = normalizeAgentDeployRows(agentDeployAfterFailedSetKeyResult.json.data);
    const scriptAgentAfterFailedSetKey = agentDeployRowsAfterFailedSetKey.find(
      (item: { key?: string; vendorId?: string; modelName?: string }) => item.key === "scriptAgent",
    );
    assert.ok(scriptAgentAfterFailedSetKey);
    assert.equal(scriptAgentAfterFailedSetKey.vendorId, "toonflow");
    assert.equal(scriptAgentAfterFailedSetKey.modelName, "toonflow:claude-sonnet-4-6");
    delete process.env.TOONFLOW_MOCK_AGENT_SET_KEY;
    console.log("PASS setting agentSetKey smoke");

    const textModelResult = await requestJsonWithAuth(baseUrl, "/api/setting/getTextModel", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(textModelResult.response.status, 200);
    assert.ok(textModelResult.json);
    assert.equal(textModelResult.json.code, 200);
    assert.equal(textModelResult.json.data, "123");

    const patchUpdateResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/checkUpdate", token, {
      method: "POST",
      body: JSON.stringify({
        source: "github",
        url: `${updateServer.baseUrl}/patch.json`,
      }),
    });

    assert.equal(patchUpdateResult.response.status, 200);
    assert.ok(patchUpdateResult.json);
    assert.equal(patchUpdateResult.json.code, 200);
    assert.equal(patchUpdateResult.json.data.needUpdate, true);
    assert.equal(patchUpdateResult.json.data.reinstall, false);
    assert.equal(patchUpdateResult.json.data.latestVersion, patchVersion);
    assert.equal(patchUpdateResult.json.data.url, "https://downloads.example/update.zip");

    const sameVersionResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/checkUpdate", token, {
      method: "POST",
      body: JSON.stringify({
        source: "github",
        url: `${updateServer.baseUrl}/same.json`,
      }),
    });

    assert.equal(sameVersionResult.response.status, 200);
    assert.ok(sameVersionResult.json);
    assert.equal(sameVersionResult.json.code, 200);
    assert.equal(sameVersionResult.json.data.needUpdate, false);
    assert.equal(sameVersionResult.json.data.reinstall, false);
    assert.equal(sameVersionResult.json.data.latestVersion, currentVersion);

    const majorUpdateResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/checkUpdate", token, {
      method: "POST",
      body: JSON.stringify({
        source: "github",
        url: `${updateServer.baseUrl}/major.json`,
      }),
    });

    assert.equal(majorUpdateResult.response.status, 200);
    assert.ok(majorUpdateResult.json);
    assert.equal(majorUpdateResult.json.code, 200);
    assert.equal(majorUpdateResult.json.data.needUpdate, true);
    assert.equal(majorUpdateResult.json.data.reinstall, true);
    assert.equal(majorUpdateResult.json.data.latestVersion, majorVersion);
    assert.equal(
      majorUpdateResult.json.data.url,
      installerUrlMap[process.platform as keyof typeof installerUrlMap],
    );

    const patchNoZipResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/checkUpdate", token, {
      method: "POST",
      body: JSON.stringify({
        source: "github",
        url: `${updateServer.baseUrl}/patch-no-zip.json`,
      }),
    });

    assert.equal(patchNoZipResult.response.status, 400);
    assert.ok(patchNoZipResult.json);
    assert.equal(patchNoZipResult.json.code, 400);
    assert.equal(patchNoZipResult.json.data, null);
    assert.ok(typeof patchNoZipResult.json.message === "string" && patchNoZipResult.json.message.length > 0);

    const patchMissingZipUrlResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/checkUpdate", token, {
      method: "POST",
      body: JSON.stringify({
        source: "github",
        url: `${updateServer.baseUrl}/patch-missing-zip-url.json`,
      }),
    });

    assert.equal(patchMissingZipUrlResult.response.status, 400);
    assert.ok(patchMissingZipUrlResult.json);
    assert.equal(patchMissingZipUrlResult.json.code, 400);
    assert.equal(patchMissingZipUrlResult.json.data, null);
    assert.ok(typeof patchMissingZipUrlResult.json.message === "string" && patchMissingZipUrlResult.json.message.length > 0);

    const majorNoInstallerResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/checkUpdate", token, {
      method: "POST",
      body: JSON.stringify({
        source: "github",
        url: `${updateServer.baseUrl}/major-no-installer.json`,
      }),
    });

    assert.equal(majorNoInstallerResult.response.status, 400);
    assert.ok(majorNoInstallerResult.json);
    assert.equal(majorNoInstallerResult.json.code, 400);
    assert.equal(majorNoInstallerResult.json.data, null);
    assert.ok(typeof majorNoInstallerResult.json.message === "string" && majorNoInstallerResult.json.message.length > 0);

    const majorMissingInstallerUrlResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/checkUpdate", token, {
      method: "POST",
      body: JSON.stringify({
        source: "github",
        url: `${updateServer.baseUrl}/major-missing-installer-url.json`,
      }),
    });

    assert.equal(majorMissingInstallerUrlResult.response.status, 400);
    assert.ok(majorMissingInstallerUrlResult.json);
    assert.equal(majorMissingInstallerUrlResult.json.code, 400);
    assert.equal(majorMissingInstallerUrlResult.json.data, null);
    assert.ok(
      typeof majorMissingInstallerUrlResult.json.message === "string" && majorMissingInstallerUrlResult.json.message.length > 0,
    );

    const invalidJsonUpdateResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/checkUpdate", token, {
      method: "POST",
      body: JSON.stringify({
        source: "github",
        url: `${updateTextServer.baseUrl}/invalid.json`,
      }),
    });

    assert.equal(invalidJsonUpdateResult.response.status, 400);
    assert.ok(invalidJsonUpdateResult.json);
    assert.equal(invalidJsonUpdateResult.json.code, 400);
    assert.equal(invalidJsonUpdateResult.json.data, null);
    assert.ok(typeof invalidJsonUpdateResult.json.message === "string" && invalidJsonUpdateResult.json.message.length > 0);

    const unavailableUpdateResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/checkUpdate", token, {
      method: "POST",
      body: JSON.stringify({
        source: "github",
        url: `${unavailableUpdateBaseUrl}/update.json`,
      }),
    });

    assert.equal(unavailableUpdateResult.response.status, 400);
    assert.ok(unavailableUpdateResult.json);
    assert.equal(unavailableUpdateResult.json.code, 400);
    assert.equal(unavailableUpdateResult.json.data, null);
    assert.ok(typeof unavailableUpdateResult.json.message === "string" && unavailableUpdateResult.json.message.length > 0);

    const missingSourceUpdateResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/checkUpdate", token, {
      method: "POST",
      body: JSON.stringify({
        source: "github",
        url: `${updateServer.baseUrl}/missing-source.json`,
      }),
    });

    assert.equal(missingSourceUpdateResult.response.status, 400);
    assert.ok(missingSourceUpdateResult.json);
    assert.equal(missingSourceUpdateResult.json.code, 400);
    assert.equal(missingSourceUpdateResult.json.data, null);
    assert.ok(typeof missingSourceUpdateResult.json.message === "string" && missingSourceUpdateResult.json.message.length > 0);

    const missingVersionUpdateResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/checkUpdate", token, {
      method: "POST",
      body: JSON.stringify({
        source: "github",
        url: `${updateServer.baseUrl}/missing-version.json`,
      }),
    });

    assert.equal(missingVersionUpdateResult.response.status, 400);
    assert.ok(missingVersionUpdateResult.json);
    assert.equal(missingVersionUpdateResult.json.code, 400);
    assert.equal(missingVersionUpdateResult.json.data, null);
    assert.ok(typeof missingVersionUpdateResult.json.message === "string" && missingVersionUpdateResult.json.message.length > 0);

    const invalidVersionUpdateResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/checkUpdate", token, {
      method: "POST",
      body: JSON.stringify({
        source: "github",
        url: `${updateServer.baseUrl}/invalid-version.json`,
      }),
    });

    assert.equal(invalidVersionUpdateResult.response.status, 400);
    assert.ok(invalidVersionUpdateResult.json);
    assert.equal(invalidVersionUpdateResult.json.code, 400);
    assert.equal(invalidVersionUpdateResult.json.data, null);
    assert.ok(typeof invalidVersionUpdateResult.json.message === "string" && invalidVersionUpdateResult.json.message.length > 0);
    console.log("PASS setting about/checkUpdate smoke");

    const reinstallDownloadAppResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/downloadApp", token, {
      method: "POST",
      body: JSON.stringify({
        url: installerUrlMap[process.platform as keyof typeof installerUrlMap],
        reinstall: true,
        version: majorVersion,
      }),
    });

    assert.equal(reinstallDownloadAppResult.response.status, 200);
    assert.ok(reinstallDownloadAppResult.json);
    assert.equal(reinstallDownloadAppResult.json.code, 200);
    assert.ok(typeof reinstallDownloadAppResult.json.data === "string" && reinstallDownloadAppResult.json.data.length > 0);
    assert.equal(fs.readFileSync(serveMarkerPath, "utf-8"), "serve-before-download");
    assert.equal(fs.readFileSync(webIndexPath, "utf-8"), "<html>before download</html>");
    assert.equal(fs.readFileSync(downloadedSkillPath, "utf-8"), "# Before Download Skill\n");
    assert.equal(fs.readFileSync(downloadedModelPath, "utf-8"), "model-before-download");
    assert.ok(!fs.existsSync(path.join(tempRoot, "data", "temp")));

    const failedDownloadAppResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/downloadApp", token, {
      method: "POST",
      body: JSON.stringify({
        url: `${unavailableDownloadBaseUrl}/update.zip`,
        reinstall: false,
        version: downloadVersion,
      }),
    });

    assert.equal(failedDownloadAppResult.response.status, 400);
    assert.ok(failedDownloadAppResult.json);
    assert.equal(failedDownloadAppResult.json.code, 400);
    assert.equal(failedDownloadAppResult.json.data, null);
    assert.ok(typeof failedDownloadAppResult.json.message === "string" && failedDownloadAppResult.json.message.length > 0);
    assert.equal(fs.readFileSync(serveMarkerPath, "utf-8"), "serve-before-download");
    assert.equal(fs.readFileSync(webIndexPath, "utf-8"), "<html>before download</html>");
    assert.equal(fs.readFileSync(downloadedSkillPath, "utf-8"), "# Before Download Skill\n");
    assert.equal(fs.readFileSync(downloadedModelPath, "utf-8"), "model-before-download");
    assert.ok(!fs.existsSync(path.join(tempRoot, "data", "temp")));

    const invalidZipDownloadAppResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/downloadApp", token, {
      method: "POST",
      body: JSON.stringify({
        url: `${downloadServer.baseUrl}/invalid.zip`,
        reinstall: false,
        version: downloadVersion,
      }),
    });

    assert.equal(invalidZipDownloadAppResult.response.status, 400);
    assert.ok(invalidZipDownloadAppResult.json);
    assert.equal(invalidZipDownloadAppResult.json.code, 400);
    assert.equal(invalidZipDownloadAppResult.json.data, null);
    assert.ok(typeof invalidZipDownloadAppResult.json.message === "string" && invalidZipDownloadAppResult.json.message.length > 0);
    assert.equal(fs.readFileSync(serveMarkerPath, "utf-8"), "serve-before-download");
    assert.equal(fs.readFileSync(webIndexPath, "utf-8"), "<html>before download</html>");
    assert.equal(fs.readFileSync(downloadedSkillPath, "utf-8"), "# Before Download Skill\n");
    assert.equal(fs.readFileSync(downloadedModelPath, "utf-8"), "model-before-download");
    assert.ok(!fs.existsSync(path.join(tempRoot, "data", "temp")));

    const webDirPath = path.dirname(webIndexPath);
    fs.rmSync(webDirPath, { recursive: true, force: true });
    fs.writeFileSync(webDirPath, "web-target-locked", "utf-8");

    const partialRollbackDownloadAppResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/downloadApp", token, {
      method: "POST",
      body: JSON.stringify({
        url: `${downloadServer.baseUrl}/update.zip`,
        reinstall: false,
        version: downloadVersion,
      }),
    });

    assert.equal(partialRollbackDownloadAppResult.response.status, 400);
    assert.ok(partialRollbackDownloadAppResult.json);
    assert.equal(partialRollbackDownloadAppResult.json.code, 400);
    assert.equal(partialRollbackDownloadAppResult.json.data, null);
    assert.ok(
      typeof partialRollbackDownloadAppResult.json.message === "string" &&
        partialRollbackDownloadAppResult.json.message.length > 0,
    );
    assert.equal(fs.readFileSync(serveMarkerPath, "utf-8"), "serve-before-download");
    assert.equal(fs.readFileSync(webDirPath, "utf-8"), "web-target-locked");
    assert.equal(fs.readFileSync(downloadedSkillPath, "utf-8"), "# Before Download Skill\n");
    assert.equal(fs.readFileSync(downloadedModelPath, "utf-8"), "model-before-download");
    assert.ok(!fs.existsSync(path.join(tempRoot, "data", "temp")));

    fs.rmSync(webDirPath, { recursive: true, force: true });
    fs.mkdirSync(webDirPath, { recursive: true });
    fs.writeFileSync(webIndexPath, "<html>before download</html>", "utf-8");

    const serveDirPath = path.dirname(serveMarkerPath);
    fs.rmSync(serveDirPath, { recursive: true, force: true });
    fs.writeFileSync(serveDirPath, "serve-target-locked", "utf-8");

    const copyFailureDownloadAppResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/downloadApp", token, {
      method: "POST",
      body: JSON.stringify({
        url: `${downloadServer.baseUrl}/update.zip`,
        reinstall: false,
        version: downloadVersion,
      }),
    });

    assert.equal(copyFailureDownloadAppResult.response.status, 400);
    assert.ok(copyFailureDownloadAppResult.json);
    assert.equal(copyFailureDownloadAppResult.json.code, 400);
    assert.equal(copyFailureDownloadAppResult.json.data, null);
    assert.ok(typeof copyFailureDownloadAppResult.json.message === "string" && copyFailureDownloadAppResult.json.message.length > 0);
    assert.equal(fs.readFileSync(serveDirPath, "utf-8"), "serve-target-locked");
    assert.equal(fs.readFileSync(webIndexPath, "utf-8"), "<html>before download</html>");
    assert.equal(fs.readFileSync(downloadedSkillPath, "utf-8"), "# Before Download Skill\n");
    assert.equal(fs.readFileSync(downloadedModelPath, "utf-8"), "model-before-download");
    assert.ok(!fs.existsSync(path.join(tempRoot, "data", "temp")));

    fs.rmSync(serveDirPath, { recursive: true, force: true });
    fs.mkdirSync(serveDirPath, { recursive: true });
    fs.writeFileSync(serveMarkerPath, "serve-before-download", "utf-8");

    const downloadAppResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/downloadApp", token, {
      method: "POST",
      body: JSON.stringify({
        url: `${downloadServer.baseUrl}/update.zip`,
        reinstall: false,
        version: downloadVersion,
      }),
    });

    assert.equal(downloadAppResult.response.status, 200);
    assert.ok(downloadAppResult.json);
    assert.equal(downloadAppResult.json.code, 200);
    assert.ok((downloadAppResult.json.data as string).includes(downloadVersion));
    assert.equal(fs.readFileSync(serveMarkerPath, "utf-8"), "serve-after-download");
    assert.equal(fs.readFileSync(webIndexPath, "utf-8"), "<html><body>after download</body></html>");
    assert.equal(fs.readFileSync(downloadedSkillPath, "utf-8"), "# After Download Skill\n");
    assert.equal(fs.readFileSync(downloadedModelPath, "utf-8"), "model-after-download");
    assert.ok(!fs.existsSync(path.join(tempRoot, "data", "temp")));
    console.log("PASS setting about/downloadApp smoke");

    const openFolderWithoutElectronResult = await requestJsonWithAuth(baseUrl, "/api/setting/fileManagement/openFolder", token, {
      method: "POST",
      body: JSON.stringify({
        path: "skills",
      }),
    });

    assert.equal(openFolderWithoutElectronResult.response.status, 400);
    assert.ok(openFolderWithoutElectronResult.json);
    assert.equal(openFolderWithoutElectronResult.json.code, 400);

    process.env.TOONFLOW_FORCE_ELECTRON = "1";
    process.env.TOONFLOW_MOCK_OPEN_FOLDER = "success";

    const openFolderSuccessResult = await requestJsonWithAuth(baseUrl, "/api/setting/fileManagement/openFolder", token, {
      method: "POST",
      body: JSON.stringify({
        path: "skills",
      }),
    });

    assert.equal(openFolderSuccessResult.response.status, 200);
    assert.ok(openFolderSuccessResult.json);
    assert.equal(openFolderSuccessResult.json.code, 200);

    process.env.TOONFLOW_MOCK_OPEN_FOLDER = "failure";

    const openFolderFailureResult = await requestJsonWithAuth(baseUrl, "/api/setting/fileManagement/openFolder", token, {
      method: "POST",
      body: JSON.stringify({
        path: "skills",
      }),
    });

    assert.equal(openFolderFailureResult.response.status, 200);
    assert.ok(openFolderFailureResult.json);
    assert.equal(openFolderFailureResult.json.code, 400);
    assert.equal(openFolderFailureResult.json.message, "mock open folder failure");

    delete process.env.TOONFLOW_FORCE_ELECTRON;
    delete process.env.TOONFLOW_MOCK_OPEN_FOLDER;
    console.log("PASS setting openFolder smoke");

    const memoryInitialResult = await requestJsonWithAuth(baseUrl, "/api/setting/memoryConfig/getMemory", token, {
      method: "GET",
    });

    assert.equal(memoryInitialResult.response.status, 200);
    assert.ok(memoryInitialResult.json);
    assert.equal(memoryInitialResult.json.code, 200);
    assert.equal(memoryInitialResult.json.data.messagesPerSummary, 10);
    assert.equal(memoryInitialResult.json.data.shortTermLimit, 5);
    assert.deepEqual(memoryInitialResult.json.data.modelOnnxFile, ["all-MiniLM-L6-v2", "onnx", "model_fp16.onnx"]);
    assert.equal(memoryInitialResult.json.data.modelDtype, "fp16");

    const updateMemoryResult = await requestJsonWithAuth(baseUrl, "/api/setting/memoryConfig/sureMemory", token, {
      method: "POST",
      body: JSON.stringify({
        messagesPerSummary: 12,
        shortTermLimit: 7,
        summaryMaxLength: 600,
        summaryLimit: 11,
        ragLimit: 4,
        deepRetrieveSummaryLimit: 6,
        modelOnnxFile: ["baseline-model", "onnx", "model_fp32.onnx"],
        modelDtype: "fp32",
      }),
    });

    assert.equal(updateMemoryResult.response.status, 200);
    assert.ok(updateMemoryResult.json);
    assert.equal(updateMemoryResult.json.code, 200);

    const memoryUpdatedResult = await requestJsonWithAuth(baseUrl, "/api/setting/memoryConfig/getMemory", token, {
      method: "GET",
    });

    assert.equal(memoryUpdatedResult.response.status, 200);
    assert.ok(memoryUpdatedResult.json);
    assert.equal(memoryUpdatedResult.json.code, 200);
    assert.equal(memoryUpdatedResult.json.data.messagesPerSummary, 12);
    assert.equal(memoryUpdatedResult.json.data.shortTermLimit, 7);
    assert.equal(memoryUpdatedResult.json.data.summaryMaxLength, 600);
    assert.equal(memoryUpdatedResult.json.data.summaryLimit, 11);
    assert.equal(memoryUpdatedResult.json.data.ragLimit, 4);
    assert.equal(memoryUpdatedResult.json.data.deepRetrieveSummaryLimit, 6);
    assert.deepEqual(memoryUpdatedResult.json.data.modelOnnxFile, ["baseline-model", "onnx", "model_fp32.onnx"]);
    assert.equal(memoryUpdatedResult.json.data.modelDtype, "fp32");

    insertMemoryRow(dbPath, {
      content: "baseline memory before cleanup",
    });
    assert.equal(countMemoriesByIsolationPrefix(dbPath, "baseline-test"), 1);

    const clearMemoryResult = await requestJsonWithAuth(baseUrl, "/api/setting/memoryConfig/delAllMemory", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(clearMemoryResult.response.status, 200);
    assert.ok(clearMemoryResult.json);
    assert.equal(clearMemoryResult.json.code, 200);
    assert.equal(countMemories(dbPath), 0);
    console.log("PASS setting memoryConfig smoke");

    const transcriptProjectId = 8201;
    const transcriptScopeKey = `${transcriptProjectId}:scriptAgent`;
    const transcriptUserTime = Date.now() - 4_000;
    const transcriptAssistantTime = transcriptUserTime + 1_000;
    insertConversationMessageRow(dbPath, {
      id: "baseline-transcript-user",
      scopeKey: transcriptScopeKey,
      projectId: transcriptProjectId,
      agentType: "scriptAgent",
      createTime: transcriptUserTime,
      updateTime: transcriptUserTime,
      messageJson: JSON.stringify({
        id: "baseline-transcript-user",
        role: "user",
        status: "complete",
        datetime: new Date(transcriptUserTime).toISOString(),
        content: [{ id: "baseline-user-text", type: "text", status: "complete", data: "请继续改编" }],
      }),
    });
    insertConversationMessageRow(dbPath, {
      id: "baseline-transcript-assistant",
      scopeKey: transcriptScopeKey,
      projectId: transcriptProjectId,
      agentType: "scriptAgent",
      createTime: transcriptAssistantTime,
      updateTime: transcriptAssistantTime,
      messageJson: JSON.stringify({
        id: "baseline-transcript-assistant",
        role: "assistant",
        status: "complete",
        datetime: new Date(transcriptAssistantTime).toISOString(),
        content: [
          { id: "baseline-assistant-text", type: "text", status: "complete", data: "已恢复完整会话" },
          {
            id: "baseline-assistant-suggestion",
            type: "suggestion",
            status: "complete",
            data: [{ title: "继续生成", prompt: "继续生成完整分镜" }],
          },
        ],
      }),
    });

    const getConversationResult = await requestJsonWithAuth(baseUrl, "/api/agents/getConversation", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: transcriptProjectId,
        agentType: "scriptAgent",
      }),
    });

    assert.equal(getConversationResult.response.status, 200);
    assert.ok(getConversationResult.json);
    assert.equal(getConversationResult.json.code, 200);
    assert.equal(getConversationResult.json.data.length, 2);
    assert.equal(getConversationResult.json.data[0].id, "baseline-transcript-user");
    assert.equal(getConversationResult.json.data[0].role, "user");
    assert.equal(getConversationResult.json.data[0].content[0].data, "请继续改编");
    assert.equal(getConversationResult.json.data[1].id, "baseline-transcript-assistant");
    assert.equal(getConversationResult.json.data[1].content[1].type, "suggestion");
    assert.equal(getConversationResult.json.data[1].content[1].data[0].prompt, "继续生成完整分镜");

    const fallbackProjectId = 8202;
    const fallbackEpisodesId = 91;
    insertMemoryRow(dbPath, {
      id: "baseline-fallback-memory",
      isolationKey: `${fallbackProjectId}:productionAgent:${fallbackEpisodesId}`,
      role: "assistant:decision",
      content: "legacy fallback history",
      createTime: Date.now() - 2_000,
    });

    const fallbackConversationResult = await requestJsonWithAuth(baseUrl, "/api/agents/getConversation", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: fallbackProjectId,
        agentType: "productionAgent",
        episodesId: fallbackEpisodesId,
      }),
    });

    assert.equal(fallbackConversationResult.response.status, 200);
    assert.ok(fallbackConversationResult.json);
    assert.equal(fallbackConversationResult.json.code, 200);
    assert.equal(fallbackConversationResult.json.data.length, 1);
    assert.equal(fallbackConversationResult.json.data[0].role, "assistant");
    assert.equal(fallbackConversationResult.json.data[0].content[0].type, "markdown");
    assert.equal(fallbackConversationResult.json.data[0].content[0].data, "legacy fallback history");

    const clearProjectId = 8203;
    const clearEpisodesId = 12;
    insertMemoryRow(dbPath, {
      id: "baseline-clear-memory-target",
      isolationKey: `${clearProjectId}:productionAgent:${clearEpisodesId}`,
      content: "clear me",
      createTime: Date.now() - 1_000,
    });
    insertMemoryRow(dbPath, {
      id: "baseline-clear-memory-keep",
      isolationKey: `${clearProjectId}:productionAgent:${clearEpisodesId + 1}`,
      content: "keep me",
      createTime: Date.now(),
    });
    insertConversationMessageRow(dbPath, {
      id: "baseline-clear-conversation-target",
      scopeKey: `${clearProjectId}:productionAgent:${clearEpisodesId}`,
      projectId: clearProjectId,
      episodesId: clearEpisodesId,
      agentType: "productionAgent",
    });
    insertConversationMessageRow(dbPath, {
      id: "baseline-clear-conversation-keep",
      scopeKey: `${clearProjectId}:productionAgent:${clearEpisodesId + 1}`,
      projectId: clearProjectId,
      episodesId: clearEpisodesId + 1,
      agentType: "productionAgent",
    });

    const clearConversationResult = await requestJsonWithAuth(baseUrl, "/api/agents/clearMemory", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: clearProjectId,
        agentType: "productionAgent",
        episodesId: clearEpisodesId,
        type: "all",
      }),
    });

    assert.equal(clearConversationResult.response.status, 200);
    assert.ok(clearConversationResult.json);
    assert.equal(clearConversationResult.json.code, 200);
    assert.equal(countMemoriesByIsolationPrefix(dbPath, `${clearProjectId}:productionAgent:${clearEpisodesId}`), 0);
    assert.equal(countConversationMessagesByScopePrefix(dbPath, `${clearProjectId}:productionAgent:${clearEpisodesId}`), 0);
    assert.equal(countMemoriesByIsolationPrefix(dbPath, `${clearProjectId}:productionAgent:${clearEpisodesId + 1}`), 1);
    assert.equal(
      countConversationMessagesByScopePrefix(dbPath, `${clearProjectId}:productionAgent:${clearEpisodesId + 1}`),
      1,
    );
    console.log("PASS agents conversation transcript smoke");

    const skillListResult = await requestJsonWithAuth(baseUrl, "/api/setting/skillManagement/getSkillList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(skillListResult.response.status, 200);
    assert.ok(skillListResult.json);
    assert.equal(skillListResult.json.code, 200);
    assert.ok(Array.isArray(skillListResult.json.data));
    assert.ok(
      skillListResult.json.data.some((item: string) => item.replace(/\\/g, "/") === skillRelativePath),
    );

    const skillContentResult = await requestJsonWithAuth(baseUrl, "/api/setting/skillManagement/getSkillContent", token, {
      method: "POST",
      body: JSON.stringify({
        path: skillRelativePath,
      }),
    });

    assert.equal(skillContentResult.response.status, 200);
    assert.ok(skillContentResult.json);
    assert.equal(skillContentResult.json.code, 200);
    assert.equal(skillContentResult.json.data, initialSkillContent);

    const saveSkillContentResult = await requestJsonWithAuth(baseUrl, "/api/setting/skillManagement/saveSkillContent", token, {
      method: "POST",
      body: JSON.stringify({
        path: skillRelativePath,
        content: updatedSkillContent,
      }),
    });

    assert.equal(saveSkillContentResult.response.status, 200);
    assert.ok(saveSkillContentResult.json);
    assert.equal(saveSkillContentResult.json.code, 200);
    assert.equal(fs.readFileSync(skillFilePath, "utf-8"), updatedSkillContent);

    const invalidSkillReadResult = await requestJsonWithAuth(
      baseUrl,
      "/api/setting/skillManagement/getSkillContent",
      token,
      {
        method: "POST",
        body: JSON.stringify({
          path: "../outside.md",
        }),
      },
    );

    assert.equal(invalidSkillReadResult.response.status, 400);
    assert.ok(invalidSkillReadResult.json);
    assert.equal(invalidSkillReadResult.json.code, 400);

    const invalidSkillSaveResult = await requestJsonWithAuth(
      baseUrl,
      "/api/setting/skillManagement/saveSkillContent",
      token,
      {
        method: "POST",
        body: JSON.stringify({
          path: "../outside.md",
          content: "blocked",
        }),
      },
    );

    assert.equal(invalidSkillSaveResult.response.status, 400);
    assert.ok(invalidSkillSaveResult.json);
    assert.equal(invalidSkillSaveResult.json.code, 400);
    console.log("PASS setting skillManagement smoke");

    const vendorListResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListResult.response.status, 200);
    assert.ok(vendorListResult.json);
    assert.equal(vendorListResult.json.code, 200);
    assert.ok(Array.isArray(vendorListResult.json.data));
    assert.ok(vendorListResult.json.data.length >= 6);
    assert.equal(vendorListResult.json.data[0].id, "toonflow");
    assert.ok(vendorListResult.json.data.some((item: { id?: string; code?: string }) => item.id === "openai" && typeof item.code === "string"));
    const openaiVendorBefore = vendorListResult.json.data.find((item: { id?: string; enable?: number }) => item.id === "openai");
    assert.ok(openaiVendorBefore);
    assert.equal(openaiVendorBefore.enable, 0);

    const enableVendorResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/enableVendor", token, {
      method: "POST",
      body: JSON.stringify({
        id: "openai",
        enable: 1,
      }),
    });

    assert.equal(enableVendorResult.response.status, 200);
    assert.ok(enableVendorResult.json);
    assert.equal(enableVendorResult.json.code, 200);

    const vendorListAfterEnableResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterEnableResult.response.status, 200);
    assert.ok(vendorListAfterEnableResult.json);
    assert.equal(vendorListAfterEnableResult.json.code, 200);
    const openaiVendorAfter = vendorListAfterEnableResult.json.data.find((item: { id?: string; enable?: number }) => item.id === "openai");
    assert.ok(openaiVendorAfter);
    assert.equal(openaiVendorAfter.enable, 1);

    const updateVendorInputsResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/updateVendorInputs", token, {
      method: "POST",
      body: JSON.stringify({
        id: "openai",
        inputValues: {
          apiKey: "sk-baseline-test",
          baseUrl: "https://api.openai.example/v1",
        },
      }),
    });

    assert.equal(updateVendorInputsResult.response.status, 200);
    assert.ok(updateVendorInputsResult.json);
    assert.equal(updateVendorInputsResult.json.code, 200);

    const vendorListAfterInputsResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterInputsResult.response.status, 200);
    assert.ok(vendorListAfterInputsResult.json);
    assert.equal(vendorListAfterInputsResult.json.code, 200);
    const openaiVendorAfterInputs = vendorListAfterInputsResult.json.data.find(
      (item: { id?: string; inputValues?: { apiKey?: string; baseUrl?: string } }) => item.id === "openai",
    );
    assert.ok(openaiVendorAfterInputs);
    assert.equal(openaiVendorAfterInputs.inputValues.apiKey, "sk-baseline-test");
    assert.equal(openaiVendorAfterInputs.inputValues.baseUrl, "https://api.openai.example/v1");

    const customModelName = "gpt-baseline-custom";
    const customModel = {
      name: "GPT Baseline Custom",
      modelName: customModelName,
      type: "text" as const,
      think: false,
    };

    const addVendorModelResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/addVendorModel", token, {
      method: "POST",
      body: JSON.stringify({
        id: "openai",
        model: customModel,
      }),
    });

    assert.equal(addVendorModelResult.response.status, 200);
    assert.ok(addVendorModelResult.json);
    assert.equal(addVendorModelResult.json.code, 200);

    const vendorListAfterAddModelResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterAddModelResult.response.status, 200);
    assert.ok(vendorListAfterAddModelResult.json);
    assert.equal(vendorListAfterAddModelResult.json.code, 200);
    const openaiVendorAfterAddModel = vendorListAfterAddModelResult.json.data.find(
      (item: { id?: string; models?: Array<{ modelName?: string; name?: string; think?: boolean }> }) => item.id === "openai",
    );
    assert.ok(openaiVendorAfterAddModel);
    assert.ok(
      openaiVendorAfterAddModel.models?.some(
        (item: { modelName?: string; name?: string; think?: boolean }) =>
          item.modelName === customModelName && item.name === "GPT Baseline Custom",
      ),
    );

    const updatedCustomModel = {
      name: "GPT Baseline Custom Updated",
      modelName: customModelName,
      type: "text" as const,
      think: true,
    };

    const updateVendorModelResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/upVendorModel", token, {
      method: "POST",
      body: JSON.stringify({
        id: "openai",
        modelName: customModelName,
        model: updatedCustomModel,
      }),
    });

    assert.equal(updateVendorModelResult.response.status, 200);
    assert.ok(updateVendorModelResult.json);
    assert.equal(updateVendorModelResult.json.code, 200);

    const vendorListAfterUpdateModelResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterUpdateModelResult.response.status, 200);
    assert.ok(vendorListAfterUpdateModelResult.json);
    assert.equal(vendorListAfterUpdateModelResult.json.code, 200);
    const openaiVendorAfterUpdateModel = vendorListAfterUpdateModelResult.json.data.find(
      (item: { id?: string; models?: Array<{ modelName?: string; name?: string; think?: boolean }> }) => item.id === "openai",
    );
    assert.ok(openaiVendorAfterUpdateModel);
    assert.ok(
      openaiVendorAfterUpdateModel.models?.some(
        (item: { modelName?: string; name?: string; think?: boolean }) =>
          item.modelName === customModelName && item.name === "GPT Baseline Custom Updated" && item.think === true,
      ),
    );

    const deleteVendorModelResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/delVendorModel", token, {
      method: "POST",
      body: JSON.stringify({
        id: "openai",
        modelName: customModelName,
      }),
    });

    assert.equal(deleteVendorModelResult.response.status, 200);
    assert.ok(deleteVendorModelResult.json);
    assert.equal(deleteVendorModelResult.json.code, 200);

    const vendorListAfterDeleteModelResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterDeleteModelResult.response.status, 200);
    assert.ok(vendorListAfterDeleteModelResult.json);
    assert.equal(vendorListAfterDeleteModelResult.json.code, 200);
    const openaiVendorAfterDeleteModel = vendorListAfterDeleteModelResult.json.data.find(
      (item: { id?: string; models?: Array<{ modelName?: string }> }) => item.id === "openai",
    );
    assert.ok(openaiVendorAfterDeleteModel);
    assert.ok(
      !openaiVendorAfterDeleteModel.models?.some((item: { modelName?: string }) => item.modelName === customModelName),
    );

    const invalidCustomVendorId = `baseline-invalid-vendor-${Date.now()}`;
    const invalidCustomVendorFilePath = path.join(tempRoot, "data", "vendor", `${invalidCustomVendorId}.ts`);
    const invalidVendorCode = createVendorTsCode(invalidCustomVendorId, {
      name: "Baseline Invalid Vendor",
      description: "Invalid baseline vendor",
      inputValues: {
        apiKey: "sk-invalid",
        baseUrl: "https://vendor.invalid.example/v1",
      },
      modelName: "baseline-invalid-model",
      modelLabel: "Baseline Invalid Model",
    }).replace('"author": "baseline-test",', '"author": 123,');

    const invalidAddVendorResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/addVendor", token, {
      method: "POST",
      body: JSON.stringify({
        tsCode: invalidVendorCode,
      }),
    });

    assert.equal(invalidAddVendorResult.response.status, 400);
    assert.ok(invalidAddVendorResult.json);
    assert.equal(invalidAddVendorResult.json.code, 400);
    assert.ok(typeof invalidAddVendorResult.json.message === "string" && invalidAddVendorResult.json.message.includes("vendor"));
    assert.ok(invalidAddVendorResult.json.message.includes("author"));
    assert.ok(!fs.existsSync(invalidCustomVendorFilePath));

    const vendorListAfterInvalidAddResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterInvalidAddResult.response.status, 200);
    assert.ok(vendorListAfterInvalidAddResult.json);
    assert.equal(vendorListAfterInvalidAddResult.json.code, 200);
    assert.ok(
      !vendorListAfterInvalidAddResult.json.data.some((item: { id?: string }) => item.id === invalidCustomVendorId),
    );

    const missingExportVendorId = `baseline-missing-export-${Date.now()}`;
    const missingExportVendorFilePath = path.join(tempRoot, "data", "vendor", `${missingExportVendorId}.ts`);
    const missingExportVendorCode = createVendorTsCode(missingExportVendorId, {
      name: "Baseline Missing Export Vendor",
      description: "Missing export baseline vendor",
      inputValues: {
        apiKey: "sk-missing-export",
        baseUrl: "https://vendor.missing-export.example/v1",
      },
      modelName: "baseline-missing-export-model",
      modelLabel: "Baseline Missing Export Model",
    }).replace("exports.textRequest = textRequest;\n", "");

    const missingExportAddVendorResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/addVendor", token, {
      method: "POST",
      body: JSON.stringify({
        tsCode: missingExportVendorCode,
      }),
    });

    assert.equal(missingExportAddVendorResult.response.status, 400);
    assert.ok(missingExportAddVendorResult.json);
    assert.equal(missingExportAddVendorResult.json.code, 200);
    assert.ok(typeof missingExportAddVendorResult.json.data === "string" && missingExportAddVendorResult.json.data.length > 0);
    assert.ok(!fs.existsSync(missingExportVendorFilePath));

    const vendorListAfterMissingExportAddResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterMissingExportAddResult.response.status, 200);
    assert.ok(vendorListAfterMissingExportAddResult.json);
    assert.equal(vendorListAfterMissingExportAddResult.json.code, 200);
    assert.ok(
      !vendorListAfterMissingExportAddResult.json.data.some((item: { id?: string }) => item.id === missingExportVendorId),
    );

    const colonVendorId = `baseline:colon-${Date.now()}`;
    const colonVendorFilePath = path.join(tempRoot, "data", "vendor", `${colonVendorId}.ts`);
    const colonVendorCode = createVendorTsCode(colonVendorId, {
      name: "Baseline Colon Vendor",
      description: "Colon baseline vendor",
      inputValues: {
        apiKey: "sk-colon",
        baseUrl: "https://vendor.colon.example/v1",
      },
      modelName: "baseline-colon-model",
      modelLabel: "Baseline Colon Model",
    });

    const colonAddVendorResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/addVendor", token, {
      method: "POST",
      body: JSON.stringify({
        tsCode: colonVendorCode,
      }),
    });

    assert.equal(colonAddVendorResult.response.status, 400);
    assert.ok(colonAddVendorResult.json);
    assert.equal(colonAddVendorResult.json.code, 400);
    assert.ok(typeof colonAddVendorResult.json.message === "string" && colonAddVendorResult.json.message.includes("id"));
    assert.ok(!fs.existsSync(colonVendorFilePath));

    const vendorListAfterColonAddResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterColonAddResult.response.status, 200);
    assert.ok(vendorListAfterColonAddResult.json);
    assert.equal(vendorListAfterColonAddResult.json.code, 200);
    assert.ok(!vendorListAfterColonAddResult.json.data.some((item: { id?: string }) => item.id === colonVendorId));

    const customVendorId = `baseline-vendor-${Date.now()}`;
    const customVendorFilePath = path.join(tempRoot, "data", "vendor", `${customVendorId}.ts`);
    const initialVendorModelName = "baseline-text-v1";
    const initialVendorCode = createVendorTsCode(customVendorId, {
      name: "Baseline Vendor",
      description: "Initial baseline vendor",
      inputValues: {
        apiKey: "sk-custom-initial",
        baseUrl: "https://vendor.initial.example/v1",
      },
      modelName: initialVendorModelName,
      modelLabel: "Baseline Text V1",
    });

    const addVendorResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/addVendor", token, {
      method: "POST",
      body: JSON.stringify({
        tsCode: initialVendorCode,
      }),
    });

    assert.equal(addVendorResult.response.status, 200);
    assert.ok(addVendorResult.json);
    assert.equal(addVendorResult.json.code, 200);
    assert.equal(addVendorResult.json.data.id, customVendorId);
    assert.ok(fs.existsSync(customVendorFilePath));

    const vendorListAfterAddVendorResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterAddVendorResult.response.status, 200);
    assert.ok(vendorListAfterAddVendorResult.json);
    assert.equal(vendorListAfterAddVendorResult.json.code, 200);
    const customVendorAfterAdd = vendorListAfterAddVendorResult.json.data.find(
      (item: {
        id?: string;
        name?: string;
        code?: string;
        models?: Array<{ modelName?: string }>;
      }) => item.id === customVendorId,
    );
    assert.ok(customVendorAfterAdd);
    assert.equal(customVendorAfterAdd.name, "Baseline Vendor");
    assert.ok(typeof customVendorAfterAdd.code === "string" && customVendorAfterAdd.code.includes(customVendorId));
    assert.ok(customVendorAfterAdd.models?.some((item: { modelName?: string }) => item.modelName === initialVendorModelName));

    const duplicateVendorCode = createVendorTsCode(customVendorId, {
      name: "Baseline Vendor Duplicate",
      description: "Duplicate baseline vendor",
      inputValues: {
        apiKey: "sk-custom-duplicate",
        baseUrl: "https://vendor.duplicate.example/v1",
      },
      modelName: "baseline-text-duplicate",
      modelLabel: "Baseline Text Duplicate",
    });
    const vendorFileBeforeDuplicateAdd = fs.readFileSync(customVendorFilePath, "utf-8");

    const duplicateAddVendorResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/addVendor", token, {
      method: "POST",
      body: JSON.stringify({
        tsCode: duplicateVendorCode,
      }),
    });

    assert.equal(duplicateAddVendorResult.response.status, 500);
    assert.ok(duplicateAddVendorResult.json);
    assert.equal(duplicateAddVendorResult.json.code, 400);
    assert.ok(typeof duplicateAddVendorResult.json.message === "string" && duplicateAddVendorResult.json.message.length > 0);
    assert.equal(fs.readFileSync(customVendorFilePath, "utf-8"), vendorFileBeforeDuplicateAdd);

    const vendorListAfterDuplicateAddResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterDuplicateAddResult.response.status, 200);
    assert.ok(vendorListAfterDuplicateAddResult.json);
    assert.equal(vendorListAfterDuplicateAddResult.json.code, 200);
    const customVendorAfterDuplicateAdd = vendorListAfterDuplicateAddResult.json.data.find(
      (item: { id?: string; name?: string }) => item.id === customVendorId,
    );
    assert.ok(customVendorAfterDuplicateAdd);
    assert.equal(customVendorAfterDuplicateAdd.name, "Baseline Vendor");

    const missingUpdateVendorId = `baseline-missing-update-${Date.now()}`;
    const missingUpdateVendorFilePath = path.join(tempRoot, "data", "vendor", `${missingUpdateVendorId}.ts`);
    const missingUpdateVendorCode = createVendorTsCode(missingUpdateVendorId, {
      name: "Baseline Missing Update Vendor",
      description: "Missing update baseline vendor",
      inputValues: {
        apiKey: "sk-custom-missing-update",
        baseUrl: "https://vendor.missing-update.example/v1",
      },
      modelName: "baseline-missing-update",
      modelLabel: "Baseline Missing Update",
    });

    const missingUpdateCodeResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/updateCode", token, {
      method: "POST",
      body: JSON.stringify({
        id: missingUpdateVendorId,
        tsCode: missingUpdateVendorCode,
      }),
    });

    assert.equal(missingUpdateCodeResult.response.status, 400);
    assert.ok(missingUpdateCodeResult.json);
    assert.equal(missingUpdateCodeResult.json.code, 400);
    assert.ok(typeof missingUpdateCodeResult.json.message === "string" && missingUpdateCodeResult.json.message.length > 0);
    assert.ok(!fs.existsSync(missingUpdateVendorFilePath));

    const vendorListAfterMissingUpdateResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterMissingUpdateResult.response.status, 200);
    assert.ok(vendorListAfterMissingUpdateResult.json);
    assert.equal(vendorListAfterMissingUpdateResult.json.code, 200);
    assert.ok(
      !vendorListAfterMissingUpdateResult.json.data.some((item: { id?: string }) => item.id === missingUpdateVendorId),
    );

    const missingExportUpdatedVendorCode = createVendorTsCode(customVendorId, {
      name: "Baseline Vendor Missing Export Update",
      description: "Missing export update baseline vendor",
      inputValues: {
        apiKey: "sk-custom-missing-export",
        baseUrl: "https://vendor.missing-export-update.example/v1",
      },
      modelName: "baseline-missing-export-update",
      modelLabel: "Baseline Missing Export Update",
    }).replace("exports.textRequest = textRequest;\n", "");
    const vendorFileBeforeMissingExportUpdate = fs.readFileSync(customVendorFilePath, "utf-8");

    const missingExportUpdateCodeResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/updateCode", token, {
      method: "POST",
      body: JSON.stringify({
        id: customVendorId,
        tsCode: missingExportUpdatedVendorCode,
      }),
    });

    assert.equal(missingExportUpdateCodeResult.response.status, 400);
    assert.ok(missingExportUpdateCodeResult.json);
    assert.equal(missingExportUpdateCodeResult.json.code, 200);
    assert.ok(typeof missingExportUpdateCodeResult.json.data === "string" && missingExportUpdateCodeResult.json.data.length > 0);
    assert.equal(fs.readFileSync(customVendorFilePath, "utf-8"), vendorFileBeforeMissingExportUpdate);

    const vendorListAfterMissingExportUpdateResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterMissingExportUpdateResult.response.status, 200);
    assert.ok(vendorListAfterMissingExportUpdateResult.json);
    assert.equal(vendorListAfterMissingExportUpdateResult.json.code, 200);
    const customVendorAfterMissingExportUpdate = vendorListAfterMissingExportUpdateResult.json.data.find(
      (item: {
        id?: string;
        name?: string;
        inputValues?: { apiKey?: string; baseUrl?: string };
        models?: Array<{ modelName?: string; name?: string }>;
      }) => item.id === customVendorId,
    );
    assert.ok(customVendorAfterMissingExportUpdate);
    assert.equal(customVendorAfterMissingExportUpdate.name, "Baseline Vendor");
    assert.equal(customVendorAfterMissingExportUpdate.inputValues.apiKey, "sk-custom-initial");
    assert.equal(customVendorAfterMissingExportUpdate.inputValues.baseUrl, "https://vendor.initial.example/v1");
    assert.ok(
      customVendorAfterMissingExportUpdate.models?.some(
        (item: { modelName?: string; name?: string }) =>
          item.modelName === initialVendorModelName && item.name === "Baseline Text V1",
      ),
    );

    const invalidUpdatedVendorCode = createVendorTsCode(customVendorId, {
      name: "Baseline Vendor Invalid Update",
      description: "Invalid updated baseline vendor",
      inputValues: {
        apiKey: "sk-custom-invalid",
        baseUrl: "https://vendor.invalid-update.example/v1",
      },
      modelName: "baseline-invalid-update",
      modelLabel: "Baseline Invalid Update",
    }).replace('"author": "baseline-test",', '"author": 456,');
    const vendorFileBeforeInvalidUpdate = fs.readFileSync(customVendorFilePath, "utf-8");

    const invalidUpdateCodeResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/updateCode", token, {
      method: "POST",
      body: JSON.stringify({
        id: customVendorId,
        tsCode: invalidUpdatedVendorCode,
      }),
    });

    assert.equal(invalidUpdateCodeResult.response.status, 400);
    assert.ok(invalidUpdateCodeResult.json);
    assert.equal(invalidUpdateCodeResult.json.code, 400);
    assert.ok(typeof invalidUpdateCodeResult.json.message === "string" && invalidUpdateCodeResult.json.message.includes("vendor"));
    assert.ok(invalidUpdateCodeResult.json.message.includes("author"));
    assert.equal(fs.readFileSync(customVendorFilePath, "utf-8"), vendorFileBeforeInvalidUpdate);

    const vendorListAfterInvalidUpdateResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterInvalidUpdateResult.response.status, 200);
    assert.ok(vendorListAfterInvalidUpdateResult.json);
    assert.equal(vendorListAfterInvalidUpdateResult.json.code, 200);
    const customVendorAfterInvalidUpdate = vendorListAfterInvalidUpdateResult.json.data.find(
      (item: {
        id?: string;
        name?: string;
        inputValues?: { apiKey?: string; baseUrl?: string };
        models?: Array<{ modelName?: string; name?: string }>;
      }) => item.id === customVendorId,
    );
    assert.ok(customVendorAfterInvalidUpdate);
    assert.equal(customVendorAfterInvalidUpdate.name, "Baseline Vendor");
    assert.equal(customVendorAfterInvalidUpdate.inputValues.apiKey, "sk-custom-initial");
    assert.equal(customVendorAfterInvalidUpdate.inputValues.baseUrl, "https://vendor.initial.example/v1");
    assert.ok(
      customVendorAfterInvalidUpdate.models?.some(
        (item: { modelName?: string; name?: string }) =>
          item.modelName === initialVendorModelName && item.name === "Baseline Text V1",
      ),
    );

    const vendorFileBeforeMismatchedUpdate = fs.readFileSync(customVendorFilePath, "utf-8");
    const mismatchedUpdatedVendorId = `${customVendorId}-mismatch`;
    const mismatchedUpdatedVendorCode = createVendorTsCode(mismatchedUpdatedVendorId, {
      name: "Baseline Vendor Mismatched Update",
      description: "Mismatched update baseline vendor",
      inputValues: {
        apiKey: "sk-custom-mismatch",
        baseUrl: "https://vendor.mismatch-update.example/v1",
      },
      modelName: "baseline-text-mismatch",
      modelLabel: "Baseline Text Mismatch",
    });

    const mismatchedUpdateCodeResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/updateCode", token, {
      method: "POST",
      body: JSON.stringify({
        id: customVendorId,
        tsCode: mismatchedUpdatedVendorCode,
      }),
    });

    assert.equal(mismatchedUpdateCodeResult.response.status, 400);
    assert.ok(mismatchedUpdateCodeResult.json);
    assert.equal(mismatchedUpdateCodeResult.json.code, 400);
    assert.ok(typeof mismatchedUpdateCodeResult.json.message === "string" && mismatchedUpdateCodeResult.json.message.length > 0);
    assert.equal(fs.readFileSync(customVendorFilePath, "utf-8"), vendorFileBeforeMismatchedUpdate);

    const vendorListAfterMismatchedUpdateResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterMismatchedUpdateResult.response.status, 200);
    assert.ok(vendorListAfterMismatchedUpdateResult.json);
    assert.equal(vendorListAfterMismatchedUpdateResult.json.code, 200);
    const customVendorAfterMismatchedUpdate = vendorListAfterMismatchedUpdateResult.json.data.find(
      (item: {
        id?: string;
        name?: string;
        inputValues?: { apiKey?: string; baseUrl?: string };
        models?: Array<{ modelName?: string; name?: string }>;
      }) => item.id === customVendorId,
    );
    assert.ok(customVendorAfterMismatchedUpdate);
    assert.equal(customVendorAfterMismatchedUpdate.name, "Baseline Vendor");
    assert.equal(customVendorAfterMismatchedUpdate.inputValues.apiKey, "sk-custom-initial");
    assert.equal(customVendorAfterMismatchedUpdate.inputValues.baseUrl, "https://vendor.initial.example/v1");
    assert.ok(
      customVendorAfterMismatchedUpdate.models?.some(
        (item: { modelName?: string; name?: string }) =>
          item.modelName === initialVendorModelName && item.name === "Baseline Text V1",
      ),
    );

    const updatedVendorModelName = "baseline-text-v2";
    const updatedVendorCode = createVendorTsCode(customVendorId, {
      name: "Baseline Vendor Updated",
      description: "Updated baseline vendor",
      inputValues: {
        apiKey: "sk-custom-updated",
        baseUrl: "https://vendor.updated.example/v1",
      },
      modelName: updatedVendorModelName,
      modelLabel: "Baseline Text V2",
    });

    const updateCodeResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/updateCode", token, {
      method: "POST",
      body: JSON.stringify({
        id: customVendorId,
        tsCode: updatedVendorCode,
      }),
    });

    assert.equal(updateCodeResult.response.status, 200);
    assert.ok(updateCodeResult.json);
    assert.equal(updateCodeResult.json.code, 200);

    const vendorListAfterUpdateCodeResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterUpdateCodeResult.response.status, 200);
    assert.ok(vendorListAfterUpdateCodeResult.json);
    assert.equal(vendorListAfterUpdateCodeResult.json.code, 200);
    const customVendorAfterUpdate = vendorListAfterUpdateCodeResult.json.data.find(
      (item: {
        id?: string;
        name?: string;
        inputValues?: { apiKey?: string; baseUrl?: string };
        models?: Array<{ modelName?: string; name?: string }>;
      }) => item.id === customVendorId,
    );
    assert.ok(customVendorAfterUpdate);
    assert.equal(customVendorAfterUpdate.name, "Baseline Vendor Updated");
    assert.equal(customVendorAfterUpdate.inputValues.apiKey, "sk-custom-updated");
    assert.equal(customVendorAfterUpdate.inputValues.baseUrl, "https://vendor.updated.example/v1");
    assert.ok(
      customVendorAfterUpdate.models?.some(
        (item: { modelName?: string; name?: string }) =>
          item.modelName === updatedVendorModelName && item.name === "Baseline Text V2",
      ),
    );

    const enableCustomVendorResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/enableVendor", token, {
      method: "POST",
      body: JSON.stringify({
        id: customVendorId,
        enable: 1,
      }),
    });

    assert.equal(enableCustomVendorResult.response.status, 200);
    assert.ok(enableCustomVendorResult.json);
    assert.equal(enableCustomVendorResult.json.code, 200);

    const modelListResult = await requestJsonWithAuth(baseUrl, "/api/modelSelect/getModelList", token, {
      method: "POST",
      body: JSON.stringify({
        type: "text",
      }),
    });

    assert.equal(modelListResult.response.status, 200);
    assert.ok(modelListResult.json);
    assert.equal(modelListResult.json.code, 200);
    assert.ok(Array.isArray(modelListResult.json.data));
    const customModelListEntry = modelListResult.json.data.find(
      (item: { id?: string; label?: string; value?: string; type?: string; name?: string }) =>
        item.id === customVendorId && item.value === updatedVendorModelName,
    ) as
      | {
          id: string;
          label: string;
          value: string;
          type: string;
          name: string;
        }
      | undefined;
    assert.ok(customModelListEntry);
    assert.equal(customModelListEntry.label, "Baseline Text V2");
    assert.equal(customModelListEntry.type, "text");
    assert.equal(customModelListEntry.name, "Baseline Vendor Updated");

    const modelDetailResult = await requestJsonWithAuth(baseUrl, "/api/modelSelect/getModelDetail", token, {
      method: "POST",
      body: JSON.stringify({
        modelId: `${customVendorId}:${updatedVendorModelName}`,
      }),
    });

    assert.equal(modelDetailResult.response.status, 200);
    assert.ok(modelDetailResult.json);
    assert.equal(modelDetailResult.json.code, 200);
    assert.equal(modelDetailResult.json.data.modelName, updatedVendorModelName);
    assert.equal(modelDetailResult.json.data.name, "Baseline Text V2");
    assert.equal(modelDetailResult.json.data.type, "text");
    assert.equal(modelDetailResult.json.data.think, false);

    const modelTestResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/modelTest", token, {
      method: "POST",
      body: JSON.stringify({
        id: customVendorId,
        modelName: updatedVendorModelName,
        type: "text",
      }),
    });

    assert.equal(modelTestResult.response.status, 200);
    assert.ok(modelTestResult.json);
    assert.equal(modelTestResult.json.code, 200);
    assert.equal(modelTestResult.json.data, `[mock vendor test] ${customVendorId}:${updatedVendorModelName}:text`);

    const getCodeByLinkResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getCodeByLink", token, {
      method: "POST",
      body: JSON.stringify({
        link: `${codeServer.baseUrl}/vendor.ts`,
      }),
    });

    assert.equal(getCodeByLinkResult.response.status, 200);
    assert.ok(getCodeByLinkResult.json);
    assert.equal(getCodeByLinkResult.json.code, 200);
    assert.equal(getCodeByLinkResult.json.data, vendorCodeText);

    const deleteVendorResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/deleteVendor", token, {
      method: "POST",
      body: JSON.stringify({
        id: customVendorId,
      }),
    });

    assert.equal(deleteVendorResult.response.status, 200);
    assert.ok(deleteVendorResult.json);
    assert.equal(deleteVendorResult.json.code, 200);

    const vendorListAfterDeleteVendorResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterDeleteVendorResult.response.status, 200);
    assert.ok(vendorListAfterDeleteVendorResult.json);
    assert.equal(vendorListAfterDeleteVendorResult.json.code, 200);
    assert.ok(
      !vendorListAfterDeleteVendorResult.json.data.some((item: { id?: string }) => item.id === customVendorId),
    );
    assert.ok(!fs.existsSync(customVendorFilePath));
    console.log("PASS setting vendorConfig smoke");

    const initialArtStyleImageDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp3cAAAAASUVORK5CYII=";
    const updatedArtStyleImageDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mNk+M/wHwAEAQH/cetH5QAAAABJRU5ErkJggg==";
    const artStyleName = `baseline-art-style-${Date.now()}`;
    const updatedArtStyleName = `${artStyleName}-updated`;
    const artStylePrompt = "baseline art style prompt";
    const updatedArtStylePrompt = "baseline art style prompt updated";

    const initialArtStyleListResult = await requestJsonWithAuth(baseUrl, "/api/artStyle/getArtStyle", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(initialArtStyleListResult.response.status, 200);
    assert.ok(initialArtStyleListResult.json);
    assert.equal(initialArtStyleListResult.json.code, 200);
    assert.ok(Array.isArray(initialArtStyleListResult.json.data));
    const initialArtStyleCount = initialArtStyleListResult.json.data.length;

    const addArtStyleResult = await requestJsonWithAuth(baseUrl, "/api/artStyle/addArtStyle", token, {
      method: "POST",
      body: JSON.stringify({
        name: artStyleName,
        fileUrl: initialArtStyleImageDataUrl,
        prompt: artStylePrompt,
      }),
    });

    assert.equal(addArtStyleResult.response.status, 200);
    assert.ok(addArtStyleResult.json);
    assert.equal(addArtStyleResult.json.code, 200);

    const artStyleListAfterAddResult = await requestJsonWithAuth(baseUrl, "/api/artStyle/getArtStyle", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(artStyleListAfterAddResult.response.status, 200);
    assert.ok(artStyleListAfterAddResult.json);
    assert.equal(artStyleListAfterAddResult.json.code, 200);
    assert.ok(Array.isArray(artStyleListAfterAddResult.json.data));
    assert.equal(artStyleListAfterAddResult.json.data.length, initialArtStyleCount + 1);
    const createdArtStyle = artStyleListAfterAddResult.json.data.find(
      (item: { id?: number; name?: string }) => item.name === artStyleName,
    ) as { id: number; name: string; label: string; prompt: string; fileUrl: string } | undefined;
    assert.ok(createdArtStyle);
    assert.equal(createdArtStyle.label, artStyleName);
    assert.equal(createdArtStyle.prompt, artStylePrompt);
    assert.match(createdArtStyle.fileUrl, /\/oss\/artStyle\/.+\.jpg$/);
    const createdArtStyleRelativePath = getOssRelativePath(createdArtStyle.fileUrl);
    const createdArtStyleAbsolutePath = path.join(
      tempRoot,
      "data",
      "oss",
      ...createdArtStyleRelativePath.split("/"),
    );
    assert.ok(fs.existsSync(createdArtStyleAbsolutePath));
    assert.ok(fs.statSync(createdArtStyleAbsolutePath).size > 0);

    const editArtStyleResult = await requestJsonWithAuth(baseUrl, "/api/artStyle/editArtStyle", token, {
      method: "POST",
      body: JSON.stringify({
        id: createdArtStyle.id,
        name: updatedArtStyleName,
        fileUrl: updatedArtStyleImageDataUrl,
        prompt: updatedArtStylePrompt,
      }),
    });

    assert.equal(editArtStyleResult.response.status, 200);
    assert.ok(editArtStyleResult.json);
    assert.equal(editArtStyleResult.json.code, 200);

    const artStyleListAfterEditResult = await requestJsonWithAuth(baseUrl, "/api/artStyle/getArtStyle", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(artStyleListAfterEditResult.response.status, 200);
    assert.ok(artStyleListAfterEditResult.json);
    assert.equal(artStyleListAfterEditResult.json.code, 200);
    assert.equal(artStyleListAfterEditResult.json.data.length, initialArtStyleCount + 1);
    const updatedArtStyle = artStyleListAfterEditResult.json.data.find(
      (item: { id?: number }) => item.id === createdArtStyle.id,
    ) as { id: number; name: string; label: string; prompt: string; fileUrl: string } | undefined;
    assert.ok(updatedArtStyle);
    assert.equal(updatedArtStyle.name, updatedArtStyleName);
    assert.equal(updatedArtStyle.label, updatedArtStyleName);
    assert.equal(updatedArtStyle.prompt, updatedArtStylePrompt);
    assert.notEqual(updatedArtStyle.fileUrl, createdArtStyle.fileUrl);
    assert.match(updatedArtStyle.fileUrl, /\/oss\/artStyle\/.+\.jpg$/);
    const updatedArtStyleRelativePath = getOssRelativePath(updatedArtStyle.fileUrl);
    const updatedArtStyleAbsolutePath = path.join(
      tempRoot,
      "data",
      "oss",
      ...updatedArtStyleRelativePath.split("/"),
    );
    assert.ok(fs.existsSync(updatedArtStyleAbsolutePath));
    assert.ok(fs.statSync(updatedArtStyleAbsolutePath).size > 0);
    console.log("PASS artStyle lifecycle smoke");

    const initialVisualManualImageDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp3cAAAAASUVORK5CYII=";
    const updatedVisualManualImageDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mNk+M/wHwAEAQH/cetH5QAAAABJRU5ErkJggg==";
    const visualManualSlug = `baseline_visual_manual_${Date.now()}`;
    const visualManualName = `baseline-visual-manual-${Date.now()}`;
    const updatedVisualManualName = `${visualManualName}-updated`;
    const invalidVisualManualSlug = `${visualManualSlug}_invalid`;
    const visualManualReadme = "baseline visual manual readme";
    const visualManualPrefix = "baseline visual manual prefix";
    const visualManualCharacter = "baseline visual manual character";
    const visualManualCharacterDerivative = "baseline visual manual character derivative";
    const visualManualProp = "baseline visual manual prop";
    const visualManualPropDerivative = "baseline visual manual prop derivative";
    const visualManualScene = "baseline visual manual scene";
    const visualManualSceneDerivative = "baseline visual manual scene derivative";
    const visualManualDirectorStoryboard = "baseline visual manual director storyboard";
    const visualManualStoryboardVideo = "baseline visual manual storyboard video";
    const visualManualPlanningStyle = "baseline visual manual planning style";
    const visualManualStoryboardTableStyle = "baseline visual manual storyboard table style";
    const updatedVisualManualReadme = "baseline visual manual readme updated";
    const updatedVisualManualPrefix = "baseline visual manual prefix updated";
    const updatedVisualManualCharacter = "baseline visual manual character updated";
    const updatedVisualManualCharacterDerivative = "baseline visual manual character derivative updated";
    const updatedVisualManualProp = "baseline visual manual prop updated";
    const updatedVisualManualPropDerivative = "baseline visual manual prop derivative updated";
    const updatedVisualManualScene = "baseline visual manual scene updated";
    const updatedVisualManualSceneDerivative = "baseline visual manual scene derivative updated";
    const updatedVisualManualDirectorStoryboard = "baseline visual manual director storyboard updated";
    const updatedVisualManualStoryboardVideo = "baseline visual manual storyboard video updated";
    const updatedVisualManualPlanningStyle = "baseline visual manual planning style updated";
    const updatedVisualManualStoryboardTableStyle = "baseline visual manual storyboard table style updated";

    const invalidVisualManualResult = await requestJsonWithAuth(baseUrl, "/api/project/addVisualManual", token, {
      method: "POST",
      body: JSON.stringify({
        name: "bad/name",
        images: [initialVisualManualImageDataUrl],
        stylePath: invalidVisualManualSlug,
        data: createVisualManualData({
          readme: visualManualReadme,
          prefix: visualManualPrefix,
          character: visualManualCharacter,
          characterDerivative: visualManualCharacterDerivative,
          prop: visualManualProp,
          propDerivative: visualManualPropDerivative,
          scene: visualManualScene,
          sceneDerivative: visualManualSceneDerivative,
          directorStoryboard: visualManualDirectorStoryboard,
          storyboardVideo: visualManualStoryboardVideo,
          planningStyle: visualManualPlanningStyle,
          storyboardTableStyle: visualManualStoryboardTableStyle,
        }),
      }),
    });

    assert.equal(invalidVisualManualResult.response.status, 400);
    assert.ok(invalidVisualManualResult.json);
    assert.equal(invalidVisualManualResult.json.code, 400);
    assert.ok(!fs.existsSync(getVisualManualPaths(tempRoot, invalidVisualManualSlug).manualDir));

    const addVisualManualResult = await requestJsonWithAuth(baseUrl, "/api/project/addVisualManual", token, {
      method: "POST",
      body: JSON.stringify({
        name: visualManualName,
        images: [initialVisualManualImageDataUrl],
        stylePath: visualManualSlug,
        data: createVisualManualData({
          readme: visualManualReadme,
          prefix: visualManualPrefix,
          character: visualManualCharacter,
          characterDerivative: visualManualCharacterDerivative,
          prop: visualManualProp,
          propDerivative: visualManualPropDerivative,
          scene: visualManualScene,
          sceneDerivative: visualManualSceneDerivative,
          directorStoryboard: visualManualDirectorStoryboard,
          storyboardVideo: visualManualStoryboardVideo,
          planningStyle: visualManualPlanningStyle,
          storyboardTableStyle: visualManualStoryboardTableStyle,
        }),
      }),
    });

    assert.equal(addVisualManualResult.response.status, 200);
    assert.ok(addVisualManualResult.json);
    assert.equal(addVisualManualResult.json.code, 200);

    const visualManualPaths = getVisualManualPaths(tempRoot, visualManualSlug);
    assert.ok(fs.existsSync(visualManualPaths.manualDir));
    assert.equal(fs.readFileSync(visualManualPaths.readmePath, "utf-8"), `${visualManualName}\n${visualManualReadme}`);
    assert.equal(fs.readFileSync(visualManualPaths.prefixPath, "utf-8"), visualManualPrefix);
    assert.equal(fs.readFileSync(visualManualPaths.artCharacterPath, "utf-8"), visualManualCharacter);
    assert.equal(fs.readFileSync(visualManualPaths.artCharacterDerivativePath, "utf-8"), visualManualCharacterDerivative);
    assert.equal(fs.readFileSync(visualManualPaths.artPropPath, "utf-8"), visualManualProp);
    assert.equal(fs.readFileSync(visualManualPaths.artPropDerivativePath, "utf-8"), visualManualPropDerivative);
    assert.equal(fs.readFileSync(visualManualPaths.artScenePath, "utf-8"), visualManualScene);
    assert.equal(fs.readFileSync(visualManualPaths.artSceneDerivativePath, "utf-8"), visualManualSceneDerivative);
    assert.equal(fs.readFileSync(visualManualPaths.directorStoryboardPath, "utf-8"), visualManualDirectorStoryboard);
    assert.equal(fs.readFileSync(visualManualPaths.artStoryboardVideoPath, "utf-8"), visualManualStoryboardVideo);
    assert.equal(fs.readFileSync(visualManualPaths.planningStylePath, "utf-8"), visualManualPlanningStyle);
    assert.equal(fs.readFileSync(visualManualPaths.storyboardTableStylePath, "utf-8"), visualManualStoryboardTableStyle);
    const initialVisualManualImageFiles = listImageFiles(visualManualPaths.imagesDir);
    assert.equal(initialVisualManualImageFiles.length, 1);

    const visualManualListResult = await requestJsonWithAuth(baseUrl, "/api/project/getVisualManual", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(visualManualListResult.response.status, 200);
    assert.ok(visualManualListResult.json);
    assert.equal(visualManualListResult.json.code, 200);
    assert.ok(Array.isArray(visualManualListResult.json.data));
    const createdVisualManual = visualManualListResult.json.data.find(
      (item: { stylePath?: string }) => item.stylePath === visualManualSlug,
    ) as
      | {
          name: string;
          stylePath: string;
          image: string[];
          data: Array<{ value?: string; data?: string }>;
        }
      | undefined;
    assert.ok(createdVisualManual);
    assert.equal(createdVisualManual.name, visualManualName);
    assert.ok(Array.isArray(createdVisualManual.image));
    assert.equal(createdVisualManual.image.length, 1);
    assert.match(createdVisualManual.image[0], new RegExp(`/skills/art_skills/${visualManualSlug}/images/.+\\.jpg$`));
    assert.equal(getVisualManualEntry(createdVisualManual.data, "README"), `${visualManualName}\n${visualManualReadme}`);
    assert.equal(getVisualManualEntry(createdVisualManual.data, "prefix"), visualManualPrefix);
    assert.equal(getVisualManualEntry(createdVisualManual.data, "art_character"), visualManualCharacter);
    assert.equal(
      getVisualManualEntry(createdVisualManual.data, "art_character_derivative"),
      visualManualCharacterDerivative,
    );
    assert.equal(getVisualManualEntry(createdVisualManual.data, "art_prop"), visualManualProp);
    assert.equal(getVisualManualEntry(createdVisualManual.data, "art_prop_derivative"), visualManualPropDerivative);
    assert.equal(getVisualManualEntry(createdVisualManual.data, "art_scene"), visualManualScene);
    assert.equal(getVisualManualEntry(createdVisualManual.data, "art_scene_derivative"), visualManualSceneDerivative);
    assert.equal(
      getVisualManualEntry(createdVisualManual.data, "director_storyboard"),
      visualManualDirectorStoryboard,
    );
    assert.equal(getVisualManualEntry(createdVisualManual.data, "art_storyboard_video"), visualManualStoryboardVideo);
    assert.equal(
      getVisualManualEntry(createdVisualManual.data, "director_planning_style"),
      visualManualPlanningStyle,
    );
    assert.equal(
      getVisualManualEntry(createdVisualManual.data, "director_storyboard_table_style"),
      visualManualStoryboardTableStyle,
    );
    const originalVisualManualImageUrl = createdVisualManual.image[0];
    const originalVisualManualImageFileName = path.basename(getUrlPathname(originalVisualManualImageUrl));

    const editVisualManualResult = await requestJsonWithAuth(baseUrl, "/api/project/editVisualManual", token, {
      method: "POST",
      body: JSON.stringify({
        name: updatedVisualManualName,
        images: [originalVisualManualImageUrl, updatedVisualManualImageDataUrl],
        stylePath: visualManualSlug,
        data: createVisualManualData({
          readme: updatedVisualManualReadme,
          prefix: updatedVisualManualPrefix,
          character: updatedVisualManualCharacter,
          characterDerivative: updatedVisualManualCharacterDerivative,
          prop: updatedVisualManualProp,
          propDerivative: updatedVisualManualPropDerivative,
          scene: updatedVisualManualScene,
          sceneDerivative: updatedVisualManualSceneDerivative,
          directorStoryboard: updatedVisualManualDirectorStoryboard,
          storyboardVideo: updatedVisualManualStoryboardVideo,
          planningStyle: updatedVisualManualPlanningStyle,
          storyboardTableStyle: updatedVisualManualStoryboardTableStyle,
        }),
      }),
    });

    assert.equal(editVisualManualResult.response.status, 200);
    assert.ok(editVisualManualResult.json);
    assert.equal(editVisualManualResult.json.code, 200);
    assert.equal(
      fs.readFileSync(visualManualPaths.readmePath, "utf-8"),
      `${updatedVisualManualName}\n${updatedVisualManualReadme}`,
    );
    assert.equal(fs.readFileSync(visualManualPaths.prefixPath, "utf-8"), updatedVisualManualPrefix);
    assert.equal(fs.readFileSync(visualManualPaths.artCharacterPath, "utf-8"), updatedVisualManualCharacter);
    assert.equal(
      fs.readFileSync(visualManualPaths.artCharacterDerivativePath, "utf-8"),
      updatedVisualManualCharacterDerivative,
    );
    assert.equal(fs.readFileSync(visualManualPaths.artPropPath, "utf-8"), updatedVisualManualProp);
    assert.equal(fs.readFileSync(visualManualPaths.artPropDerivativePath, "utf-8"), updatedVisualManualPropDerivative);
    assert.equal(fs.readFileSync(visualManualPaths.artScenePath, "utf-8"), updatedVisualManualScene);
    assert.equal(fs.readFileSync(visualManualPaths.artSceneDerivativePath, "utf-8"), updatedVisualManualSceneDerivative);
    assert.equal(
      fs.readFileSync(visualManualPaths.directorStoryboardPath, "utf-8"),
      updatedVisualManualDirectorStoryboard,
    );
    assert.equal(fs.readFileSync(visualManualPaths.artStoryboardVideoPath, "utf-8"), updatedVisualManualStoryboardVideo);
    assert.equal(fs.readFileSync(visualManualPaths.planningStylePath, "utf-8"), updatedVisualManualPlanningStyle);
    assert.equal(
      fs.readFileSync(visualManualPaths.storyboardTableStylePath, "utf-8"),
      updatedVisualManualStoryboardTableStyle,
    );
    const visualManualImageFilesAfterEdit = listImageFiles(visualManualPaths.imagesDir);
    assert.equal(visualManualImageFilesAfterEdit.length, 2);

    const visualManualListAfterEditResult = await requestJsonWithAuth(baseUrl, "/api/project/getVisualManual", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(visualManualListAfterEditResult.response.status, 200);
    assert.ok(visualManualListAfterEditResult.json);
    assert.equal(visualManualListAfterEditResult.json.code, 200);
    const updatedVisualManual = visualManualListAfterEditResult.json.data.find(
      (item: { stylePath?: string }) => item.stylePath === visualManualSlug,
    ) as
      | {
          name: string;
          stylePath: string;
          image: string[];
          data: Array<{ value?: string; data?: string }>;
        }
      | undefined;
    assert.ok(updatedVisualManual);
    assert.equal(updatedVisualManual.name, updatedVisualManualName);
    assert.ok(Array.isArray(updatedVisualManual.image));
    assert.equal(updatedVisualManual.image.length, 2);
    const updatedVisualManualImageFileNames = updatedVisualManual.image.map((url) =>
      path.basename(getUrlPathname(url)),
    );
    assert.equal(updatedVisualManualImageFileNames.length, 2);
    assert.ok(updatedVisualManualImageFileNames.every((fileName) => visualManualImageFilesAfterEdit.includes(fileName)));
    assert.equal(
      getVisualManualEntry(updatedVisualManual.data, "README"),
      `${updatedVisualManualName}\n${updatedVisualManualReadme}`,
    );
    assert.equal(getVisualManualEntry(updatedVisualManual.data, "prefix"), updatedVisualManualPrefix);
    assert.equal(getVisualManualEntry(updatedVisualManual.data, "art_character"), updatedVisualManualCharacter);
    assert.equal(
      getVisualManualEntry(updatedVisualManual.data, "art_character_derivative"),
      updatedVisualManualCharacterDerivative,
    );
    assert.equal(getVisualManualEntry(updatedVisualManual.data, "art_prop"), updatedVisualManualProp);
    assert.equal(getVisualManualEntry(updatedVisualManual.data, "art_prop_derivative"), updatedVisualManualPropDerivative);
    assert.equal(getVisualManualEntry(updatedVisualManual.data, "art_scene"), updatedVisualManualScene);
    assert.equal(
      getVisualManualEntry(updatedVisualManual.data, "art_scene_derivative"),
      updatedVisualManualSceneDerivative,
    );
    assert.equal(
      getVisualManualEntry(updatedVisualManual.data, "director_storyboard"),
      updatedVisualManualDirectorStoryboard,
    );
    assert.equal(
      getVisualManualEntry(updatedVisualManual.data, "art_storyboard_video"),
      updatedVisualManualStoryboardVideo,
    );
    assert.equal(
      getVisualManualEntry(updatedVisualManual.data, "director_planning_style"),
      updatedVisualManualPlanningStyle,
    );
    assert.equal(
      getVisualManualEntry(updatedVisualManual.data, "director_storyboard_table_style"),
      updatedVisualManualStoryboardTableStyle,
    );

    const deleteVisualManualResult = await requestJsonWithAuth(baseUrl, "/api/project/deleteVisualManual", token, {
      method: "POST",
      body: JSON.stringify({
        name: visualManualSlug,
      }),
    });

    assert.equal(deleteVisualManualResult.response.status, 200);
    assert.ok(deleteVisualManualResult.json);
    assert.equal(deleteVisualManualResult.json.code, 200);
    assert.ok(!fs.existsSync(visualManualPaths.manualDir));

    const visualManualListAfterDeleteResult = await requestJsonWithAuth(baseUrl, "/api/project/getVisualManual", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(visualManualListAfterDeleteResult.response.status, 200);
    assert.ok(visualManualListAfterDeleteResult.json);
    assert.equal(visualManualListAfterDeleteResult.json.code, 200);
    assert.ok(
      !visualManualListAfterDeleteResult.json.data.some(
        (item: { stylePath?: string }) => item.stylePath === visualManualSlug,
      ),
    );
    console.log("PASS visual manual lifecycle smoke");

    const initialDirectorManualImageDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp3cAAAAASUVORK5CYII=";
    const updatedDirectorManualImageDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mNk+M/wHwAEAQH/cetH5QAAAABJRU5ErkJggg==";
    const directorManualSlug = `baseline_director_manual_${Date.now()}`;
    const directorManualName = `baseline-director-manual-${Date.now()}`;
    const updatedDirectorManualName = `${directorManualName}-updated`;
    const directorManualReadme = "baseline director manual readme";
    const directorManualPlanning = "baseline director manual planning";
    const directorManualStoryboard = "baseline director manual storyboard";
    const updatedDirectorManualReadme = "baseline director manual readme updated";
    const updatedDirectorManualPlanning = "baseline director manual planning updated";
    const updatedDirectorManualStoryboard = "baseline director manual storyboard updated";
    const invalidDirectorManualSlug = `${directorManualSlug}_invalid`;

    const invalidDirectorManualResult = await requestJsonWithAuth(baseUrl, "/api/project/addDirectorManual", token, {
      method: "POST",
      body: JSON.stringify({
        name: "bad/name",
        images: [initialDirectorManualImageDataUrl],
        directorManual: invalidDirectorManualSlug,
        data: createDirectorManualData({
          readme: directorManualReadme,
          planning: directorManualPlanning,
          storyboard: directorManualStoryboard,
        }),
      }),
    });

    assert.equal(invalidDirectorManualResult.response.status, 400);
    assert.ok(invalidDirectorManualResult.json);
    assert.equal(invalidDirectorManualResult.json.code, 400);
    assert.ok(!fs.existsSync(getDirectorManualPaths(tempRoot, invalidDirectorManualSlug).manualDir));

    const addDirectorManualResult = await requestJsonWithAuth(baseUrl, "/api/project/addDirectorManual", token, {
      method: "POST",
      body: JSON.stringify({
        name: directorManualName,
        images: [initialDirectorManualImageDataUrl],
        directorManual: directorManualSlug,
        data: createDirectorManualData({
          readme: directorManualReadme,
          planning: directorManualPlanning,
          storyboard: directorManualStoryboard,
        }),
      }),
    });

    assert.equal(addDirectorManualResult.response.status, 200);
    assert.ok(addDirectorManualResult.json);
    assert.equal(addDirectorManualResult.json.code, 200);

    const directorManualPaths = getDirectorManualPaths(tempRoot, directorManualSlug);
    assert.ok(fs.existsSync(directorManualPaths.manualDir));
    assert.equal(fs.readFileSync(directorManualPaths.readmePath, "utf-8"), `${directorManualName}\n${directorManualReadme}`);
    assert.equal(fs.readFileSync(directorManualPaths.planningPath, "utf-8"), directorManualPlanning);
    assert.equal(fs.readFileSync(directorManualPaths.storyboardPath, "utf-8"), directorManualStoryboard);
    const initialDirectorManualImageFiles = listImageFiles(directorManualPaths.imagesDir);
    assert.equal(initialDirectorManualImageFiles.length, 1);

    const directorManualListResult = await requestJsonWithAuth(baseUrl, "/api/project/queryDirectorManual", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(directorManualListResult.response.status, 200);
    assert.ok(directorManualListResult.json);
    assert.equal(directorManualListResult.json.code, 200);
    assert.ok(Array.isArray(directorManualListResult.json.data));
    const createdDirectorManual = directorManualListResult.json.data.find(
      (item: { directorManual?: string }) => item.directorManual === directorManualSlug,
    ) as
      | {
          name: string;
          directorManual: string;
          image: string[];
          data: Array<{ value?: string; data?: string }>;
        }
      | undefined;
    assert.ok(createdDirectorManual);
    assert.equal(createdDirectorManual.name, directorManualName);
    assert.ok(Array.isArray(createdDirectorManual.image));
    assert.equal(createdDirectorManual.image.length, 1);
    assert.match(
      createdDirectorManual.image[0],
      new RegExp(`/skills/story_skills/${directorManualSlug}/images/.+\\.jpg$`),
    );
    assert.equal(
      getDirectorManualEntry(createdDirectorManual.data, "README"),
      `${directorManualName}\n${directorManualReadme}`,
    );
    assert.equal(
      getDirectorManualEntry(createdDirectorManual.data, "director_planning_narrative"),
      directorManualPlanning,
    );
    assert.equal(
      getDirectorManualEntry(createdDirectorManual.data, "director_storyboard_table_narrative"),
      directorManualStoryboard,
    );
    const originalDirectorManualImageUrl = createdDirectorManual.image[0];
    const originalDirectorManualImageFileName = path.basename(getUrlPathname(originalDirectorManualImageUrl));

    const editDirectorManualResult = await requestJsonWithAuth(baseUrl, "/api/project/editDirectorlManual", token, {
      method: "POST",
      body: JSON.stringify({
        name: updatedDirectorManualName,
        images: [originalDirectorManualImageUrl, updatedDirectorManualImageDataUrl],
        data: createDirectorManualData({
          readme: updatedDirectorManualReadme,
          planning: updatedDirectorManualPlanning,
          storyboard: updatedDirectorManualStoryboard,
        }),
        directorManual: directorManualSlug,
      }),
    });

    assert.equal(editDirectorManualResult.response.status, 200);
    assert.ok(editDirectorManualResult.json);
    assert.equal(editDirectorManualResult.json.code, 200);
    assert.equal(
      fs.readFileSync(directorManualPaths.readmePath, "utf-8"),
      `${updatedDirectorManualName}\n${updatedDirectorManualReadme}`,
    );
    assert.equal(fs.readFileSync(directorManualPaths.planningPath, "utf-8"), updatedDirectorManualPlanning);
    assert.equal(fs.readFileSync(directorManualPaths.storyboardPath, "utf-8"), updatedDirectorManualStoryboard);
    const directorManualImageFilesAfterEdit = listImageFiles(directorManualPaths.imagesDir);
    assert.equal(directorManualImageFilesAfterEdit.length, 2);

    const directorManualListAfterEditResult = await requestJsonWithAuth(baseUrl, "/api/project/queryDirectorManual", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(directorManualListAfterEditResult.response.status, 200);
    assert.ok(directorManualListAfterEditResult.json);
    assert.equal(directorManualListAfterEditResult.json.code, 200);
    const updatedDirectorManual = directorManualListAfterEditResult.json.data.find(
      (item: { directorManual?: string }) => item.directorManual === directorManualSlug,
    ) as
      | {
          name: string;
          directorManual: string;
          image: string[];
          data: Array<{ value?: string; data?: string }>;
        }
      | undefined;
    assert.ok(updatedDirectorManual);
    assert.equal(updatedDirectorManual.name, updatedDirectorManualName);
    assert.ok(Array.isArray(updatedDirectorManual.image));
    assert.equal(updatedDirectorManual.image.length, 2);
    const updatedDirectorManualImageFileNames = updatedDirectorManual.image.map((url) =>
      path.basename(getUrlPathname(url)),
    );
    assert.equal(updatedDirectorManualImageFileNames.length, 2);
    assert.ok(updatedDirectorManualImageFileNames.every((fileName) => directorManualImageFilesAfterEdit.includes(fileName)));
    assert.equal(
      getDirectorManualEntry(updatedDirectorManual.data, "README"),
      `${updatedDirectorManualName}\n${updatedDirectorManualReadme}`,
    );
    assert.equal(
      getDirectorManualEntry(updatedDirectorManual.data, "director_planning_narrative"),
      updatedDirectorManualPlanning,
    );
    assert.equal(
      getDirectorManualEntry(updatedDirectorManual.data, "director_storyboard_table_narrative"),
      updatedDirectorManualStoryboard,
    );

    const deleteDirectorManualResult = await requestJsonWithAuth(baseUrl, "/api/project/deleteDirectorManual", token, {
      method: "POST",
      body: JSON.stringify({
        name: directorManualSlug,
      }),
    });

    assert.equal(deleteDirectorManualResult.response.status, 200);
    assert.ok(deleteDirectorManualResult.json);
    assert.equal(deleteDirectorManualResult.json.code, 200);
    assert.ok(!fs.existsSync(directorManualPaths.manualDir));

    const directorManualListAfterDeleteResult = await requestJsonWithAuth(baseUrl, "/api/project/queryDirectorManual", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(directorManualListAfterDeleteResult.response.status, 200);
    assert.ok(directorManualListAfterDeleteResult.json);
    assert.equal(directorManualListAfterDeleteResult.json.code, 200);
    assert.ok(
      !directorManualListAfterDeleteResult.json.data.some(
        (item: { directorManual?: string }) => item.directorManual === directorManualSlug,
      ),
    );
    console.log("PASS director manual lifecycle smoke");

    const taskProjectAName = `baseline-task-project-a-${Date.now()}`;
    const taskProjectBName = `baseline-task-project-b-${Date.now()}`;

    const createTaskProjectAResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: taskProjectAName,
        intro: "baseline task project a",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "task-image-model-a",
        videoModel: "task-video-model-a",
        imageQuality: "standard",
        mode: "story",
      }),
    });

    assert.equal(createTaskProjectAResult.response.status, 200);
    assert.ok(createTaskProjectAResult.json);
    assert.equal(createTaskProjectAResult.json.code, 200);

    const createTaskProjectBResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: taskProjectBName,
        intro: "baseline task project b",
        type: "adaptation",
        artStyle: "default",
        directorManual: "",
        videoRatio: "16:9",
        imageModel: "task-image-model-b",
        videoModel: "task-video-model-b",
        imageQuality: "hd",
        mode: "story",
      }),
    });

    assert.equal(createTaskProjectBResult.response.status, 200);
    assert.ok(createTaskProjectBResult.json);
    assert.equal(createTaskProjectBResult.json.code, 200);

    const taskProjectsResult = await requestJsonWithAuth(baseUrl, "/api/project/getProject", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(taskProjectsResult.response.status, 200);
    assert.ok(taskProjectsResult.json);
    assert.equal(taskProjectsResult.json.code, 200);
    const taskProjectA = taskProjectsResult.json.data.find(
      (item: { id?: number; name?: string }) => item.name === taskProjectAName,
    ) as { id: number; name: string } | undefined;
    const taskProjectB = taskProjectsResult.json.data.find(
      (item: { id?: number; name?: string }) => item.name === taskProjectBName,
    ) as { id: number; name: string } | undefined;
    assert.ok(taskProjectA);
    assert.ok(taskProjectB);

    const pendingTask = insertTaskRow(dbPath, {
      id: 810001,
      projectId: taskProjectA.id,
      taskClass: "baseline-render",
      model: "baseline-task-model-a",
      describe: "baseline pending task detail",
      state: "pending",
      reason: "baseline-pending",
    });
    const doneTask = insertTaskRow(dbPath, {
      id: 810002,
      projectId: taskProjectB.id,
      taskClass: "baseline-cleanup",
      model: "baseline-task-model-b",
      describe: "baseline done task detail",
      state: "done",
      reason: "baseline-done",
    });

    const taskProjectListResult = await requestJsonWithAuth(baseUrl, "/api/task/getProject", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(taskProjectListResult.response.status, 200);
    assert.ok(taskProjectListResult.json);
    assert.equal(taskProjectListResult.json.code, 200);
    assert.ok(Array.isArray(taskProjectListResult.json.data));
    assert.ok(taskProjectListResult.json.data.some((item: { id?: number; name?: string }) => item.id === taskProjectA.id && item.name === taskProjectAName));
    assert.ok(taskProjectListResult.json.data.some((item: { id?: number; name?: string }) => item.id === taskProjectB.id && item.name === taskProjectBName));

    const taskCategoriesResult = await requestJsonWithAuth(baseUrl, "/api/task/getTaskCategories", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(taskCategoriesResult.response.status, 200);
    assert.ok(taskCategoriesResult.json);
    assert.equal(taskCategoriesResult.json.code, 200);
    assert.ok(Array.isArray(taskCategoriesResult.json.data));
    assert.ok(taskCategoriesResult.json.data.some((item: { taskClass?: string }) => item.taskClass === "baseline-render"));
    assert.ok(taskCategoriesResult.json.data.some((item: { taskClass?: string }) => item.taskClass === "baseline-cleanup"));

    const allTasksResult = await requestJsonWithAuth(baseUrl, "/api/task/getTaskApi", token, {
      method: "POST",
      body: JSON.stringify({
        page: 1,
        limit: 10,
      }),
    });

    assert.equal(allTasksResult.response.status, 200);
    assert.ok(allTasksResult.json);
    assert.equal(allTasksResult.json.code, 200);
    assert.equal(Number(allTasksResult.json.data.total), 2);
    assert.equal(allTasksResult.json.data.data.length, 2);
    assert.ok(
      allTasksResult.json.data.data.some(
        (item: { taskClass?: string; describe?: string; state?: string; projectId?: number; name?: string }) =>
          item.taskClass === "baseline-render" &&
          item.describe === "baseline pending task detail" &&
          item.state === "pending" &&
          item.projectId === taskProjectA.id &&
          item.name === taskProjectAName,
      ),
    );
    assert.ok(
      allTasksResult.json.data.data.some(
        (item: { taskClass?: string; describe?: string; state?: string; projectId?: number; name?: string }) =>
          item.taskClass === "baseline-cleanup" &&
          item.describe === "baseline done task detail" &&
          item.state === "done" &&
          item.projectId === taskProjectB.id &&
          item.name === taskProjectBName,
      ),
    );

    const filteredTaskClassResult = await requestJsonWithAuth(baseUrl, "/api/task/getTaskApi", token, {
      method: "POST",
      body: JSON.stringify({
        taskClass: "baseline-render",
        page: 1,
        limit: 10,
      }),
    });

    assert.equal(filteredTaskClassResult.response.status, 200);
    assert.ok(filteredTaskClassResult.json);
    assert.equal(filteredTaskClassResult.json.code, 200);
    assert.equal(Number(filteredTaskClassResult.json.data.total), 1);
    assert.equal(filteredTaskClassResult.json.data.data[0].taskClass, "baseline-render");

    const filteredStateAndProjectResult = await requestJsonWithAuth(baseUrl, "/api/task/getTaskApi", token, {
      method: "POST",
      body: JSON.stringify({
        state: "done",
        projectId: taskProjectB.id,
        page: 1,
        limit: 10,
      }),
    });

    assert.equal(filteredStateAndProjectResult.response.status, 200);
    assert.ok(filteredStateAndProjectResult.json);
    assert.equal(filteredStateAndProjectResult.json.code, 200);
    assert.equal(Number(filteredStateAndProjectResult.json.data.total), 1);
    assert.equal(filteredStateAndProjectResult.json.data.data[0].taskClass, "baseline-cleanup");
    assert.equal(filteredStateAndProjectResult.json.data.data[0].state, "done");

    const taskDetailsResult = await requestJsonWithAuth(baseUrl, "/api/task/taskDetails", token, {
      method: "POST",
      body: JSON.stringify({
        taskId: pendingTask.taskId,
      }),
    });

    assert.equal(taskDetailsResult.response.status, 200);
    assert.ok(taskDetailsResult.json);
    assert.equal(taskDetailsResult.json.code, 200);
    assert.equal(taskDetailsResult.json.data.id, pendingTask.taskId);
    assert.equal(taskDetailsResult.json.data.taskClass, "baseline-render");
    assert.equal(taskDetailsResult.json.data.describe, "baseline pending task detail");
    assert.equal(taskDetailsResult.json.data.state, "pending");
    assert.equal(taskDetailsResult.json.data.projectId, taskProjectA.id);
    assert.equal(doneTask.taskId, 810002);
    console.log("PASS task query smoke");

    const projectName = `baseline-project-${Date.now()}`;
    const createResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: projectName,
        intro: "baseline integration test",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "mock-image-model",
        videoModel: "mock-video-model",
        imageQuality: "standard",
        mode: "story",
      }),
    });

    assert.equal(createResult.response.status, 200);
    assert.ok(createResult.json);
    assert.equal(createResult.json.code, 200);

    const listResult = await requestJsonWithAuth(baseUrl, "/api/project/getProject", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(listResult.response.status, 200);
    assert.ok(listResult.json);
    assert.equal(listResult.json.code, 200);
    assert.ok(Array.isArray(listResult.json.data));

    const createdProject = listResult.json.data.find(
      (item: { id?: number; name?: string; projectType?: string; intro?: string; videoRatio?: string }) => item.name === projectName,
    ) as {
      id: number;
      name: string;
      projectType: string;
      intro: string;
      videoRatio: string;
    } | undefined;

    assert.ok(createdProject);
    assert.equal(createdProject.projectType, "short-drama");
    console.log("PASS project create/list smoke");

    const projectId = createdProject.id;
    const singleProjectResult = await requestJsonWithAuth(baseUrl, "/api/general/getSingleProject", token, {
      method: "POST",
      body: JSON.stringify({
        id: projectId,
      }),
    });

    assert.equal(singleProjectResult.response.status, 200);
    assert.ok(singleProjectResult.json);
    assert.equal(singleProjectResult.json.code, 200);
    assert.ok(Array.isArray(singleProjectResult.json.data));
    assert.equal(singleProjectResult.json.data.length, 1);
    assert.equal(singleProjectResult.json.data[0].id, projectId);
    assert.equal(singleProjectResult.json.data[0].name, projectName);

    const patchedProjectIntro = "baseline integration project updated by general/updateProject";
    const partialUpdateResult = await requestJsonWithAuth(baseUrl, "/api/general/updateProject", token, {
      method: "POST",
      body: JSON.stringify({
        id: projectId,
        intro: patchedProjectIntro,
      }),
    });

    assert.equal(partialUpdateResult.response.status, 200);
    assert.ok(partialUpdateResult.json);
    assert.equal(partialUpdateResult.json.code, 200);

    const singleProjectAfterPartialUpdateResult = await requestJsonWithAuth(baseUrl, "/api/general/getSingleProject", token, {
      method: "POST",
      body: JSON.stringify({
        id: projectId,
      }),
    });

    assert.equal(singleProjectAfterPartialUpdateResult.response.status, 200);
    assert.ok(singleProjectAfterPartialUpdateResult.json);
    assert.equal(singleProjectAfterPartialUpdateResult.json.code, 200);
    assert.equal(singleProjectAfterPartialUpdateResult.json.data[0].intro, patchedProjectIntro);
    assert.equal(singleProjectAfterPartialUpdateResult.json.data[0].name, projectName);
    assert.equal(singleProjectAfterPartialUpdateResult.json.data[0].videoRatio, "9:16");

    const editedProjectName = `${projectName}-edited`;
    const editedProjectIntro = "baseline project fully edited";
    const editProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/editProject", token, {
      method: "POST",
      body: JSON.stringify({
        id: projectId,
        projectType: "feature",
        name: editedProjectName,
        intro: editedProjectIntro,
        type: "adaptation",
        artStyle: "cinematic",
        directorManual: "edited director manual",
        videoRatio: "16:9",
        imageModel: "edited-image-model",
        videoModel: "edited-video-model",
        imageQuality: "hd",
        mode: "free",
      }),
    });

    assert.equal(editProjectResult.response.status, 200);
    assert.ok(editProjectResult.json);
    assert.equal(editProjectResult.json.code, 200);

    const singleProjectAfterEditResult = await requestJsonWithAuth(baseUrl, "/api/general/getSingleProject", token, {
      method: "POST",
      body: JSON.stringify({
        id: projectId,
      }),
    });

    assert.equal(singleProjectAfterEditResult.response.status, 200);
    assert.ok(singleProjectAfterEditResult.json);
    assert.equal(singleProjectAfterEditResult.json.code, 200);
    assert.equal(singleProjectAfterEditResult.json.data[0].name, editedProjectName);
    assert.equal(singleProjectAfterEditResult.json.data[0].intro, editedProjectIntro);
    assert.equal(singleProjectAfterEditResult.json.data[0].projectType, "feature");
    assert.equal(singleProjectAfterEditResult.json.data[0].videoRatio, "16:9");
    assert.equal(singleProjectAfterEditResult.json.data[0].imageModel, "edited-image-model");
    assert.equal(singleProjectAfterEditResult.json.data[0].videoModel, "edited-video-model");
    assert.equal(singleProjectAfterEditResult.json.data[0].imageQuality, "hd");

    const scopedProjectRows = insertProjectScopedRows(dbPath, projectId);
    assert.ok(scopedProjectRows.memoryIsolationKey.startsWith(`${projectId}:`));
    assert.equal(countRowsByProjectId(dbPath, "o_tasks", projectId), 1);
    assert.equal(countRowsByProjectId(dbPath, "o_agentWorkData", projectId), 1);
    assert.equal(countMemoriesByIsolationPrefix(dbPath, `${projectId}:`), 1);

    const deleteProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/delProject", token, {
      method: "POST",
      body: JSON.stringify({
        id: projectId,
      }),
    });

    assert.equal(deleteProjectResult.response.status, 200);
    assert.ok(deleteProjectResult.json);
    assert.equal(deleteProjectResult.json.code, 200);

    const projectListAfterDeleteResult = await requestJsonWithAuth(baseUrl, "/api/project/getProject", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(projectListAfterDeleteResult.response.status, 200);
    assert.ok(projectListAfterDeleteResult.json);
    assert.equal(projectListAfterDeleteResult.json.code, 200);
    assert.ok(!projectListAfterDeleteResult.json.data.some((item: { id?: number }) => item.id === projectId));

    const singleProjectAfterDeleteResult = await requestJsonWithAuth(baseUrl, "/api/general/getSingleProject", token, {
      method: "POST",
      body: JSON.stringify({
        id: projectId,
      }),
    });

    assert.equal(singleProjectAfterDeleteResult.response.status, 200);
    assert.ok(singleProjectAfterDeleteResult.json);
    assert.equal(singleProjectAfterDeleteResult.json.code, 200);
    assert.ok(Array.isArray(singleProjectAfterDeleteResult.json.data));
    assert.equal(singleProjectAfterDeleteResult.json.data.length, 0);
    assert.equal(countRowsByProjectId(dbPath, "o_tasks", projectId), 0);
    assert.equal(countRowsByProjectId(dbPath, "o_agentWorkData", projectId), 0);
    assert.equal(countMemoriesByIsolationPrefix(dbPath, `${projectId}:`), 0);
    console.log("PASS project lifecycle smoke");

    const generalStatsProjectName = `baseline-general-stats-project-${Date.now()}`;
    const createGeneralStatsProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: generalStatsProjectName,
        intro: "baseline general statistics project",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "general-stats-image-model",
        videoModel: "general-stats-video-model",
        imageQuality: "standard",
        mode: "story",
      }),
    });

    assert.equal(createGeneralStatsProjectResult.response.status, 200);
    assert.ok(createGeneralStatsProjectResult.json);
    assert.equal(createGeneralStatsProjectResult.json.code, 200);

    const generalStatsProjectListResult = await requestJsonWithAuth(baseUrl, "/api/project/getProject", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(generalStatsProjectListResult.response.status, 200);
    assert.ok(generalStatsProjectListResult.json);
    assert.equal(generalStatsProjectListResult.json.code, 200);
    const generalStatsProject = generalStatsProjectListResult.json.data.find(
      (item: { id?: number; name?: string }) => item.name === generalStatsProjectName,
    ) as { id: number; name: string } | undefined;
    assert.ok(generalStatsProject);
    const generalStatsProjectId = generalStatsProject.id;

    const emptyGeneralStatsResult = await requestJsonWithAuth(baseUrl, "/api/general/generalStatistics", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: generalStatsProjectId,
      }),
    });

    assert.equal(emptyGeneralStatsResult.response.status, 200);
    assert.ok(emptyGeneralStatsResult.json);
    assert.equal(emptyGeneralStatsResult.json.code, 200);
    assert.deepEqual(emptyGeneralStatsResult.json.data, {
      roleCount: 0,
      scriptCount: 0,
      videoCount: 0,
      storyboardCount: 0,
    });

    const generalStatsRoleName = `baseline-general-role-${Date.now()}`;
    const addGeneralStatsAssetResult = await requestJsonWithAuth(baseUrl, "/api/assets/addAssets", token, {
      method: "POST",
      body: JSON.stringify({
        name: generalStatsRoleName,
        describe: "baseline general statistics role",
        type: "role",
        projectId: generalStatsProjectId,
        remark: "baseline general statistics role remark",
        prompt: "baseline general statistics role prompt",
      }),
    });

    assert.equal(addGeneralStatsAssetResult.response.status, 200);
    assert.ok(addGeneralStatsAssetResult.json);
    assert.equal(addGeneralStatsAssetResult.json.code, 200);

    const generalStatsAssetsListResult = await requestJsonWithAuth(baseUrl, "/api/assets/getAssetsApi", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: generalStatsProjectId,
        type: "role",
        page: 1,
        limit: 10,
      }),
    });

    assert.equal(generalStatsAssetsListResult.response.status, 200);
    assert.ok(generalStatsAssetsListResult.json);
    assert.equal(generalStatsAssetsListResult.json.code, 200);
    const generalStatsRoleAsset = generalStatsAssetsListResult.json.data.data.find(
      (item: { id?: number; name?: string }) => item.name === generalStatsRoleName,
    ) as { id: number; name: string } | undefined;
    assert.ok(generalStatsRoleAsset);
    const generalStatsRoleAssetId = generalStatsRoleAsset.id;

    const generalStatsScriptName = `baseline-general-script-${Date.now()}`;
    const addGeneralStatsScriptResult = await requestJsonWithAuth(baseUrl, "/api/script/addScript", token, {
      method: "POST",
      body: JSON.stringify({
        name: generalStatsScriptName,
        content: "baseline general statistics script",
        projectId: generalStatsProjectId,
        assets: [generalStatsRoleAssetId],
      }),
    });

    assert.equal(addGeneralStatsScriptResult.response.status, 200);
    assert.ok(addGeneralStatsScriptResult.json);
    assert.equal(addGeneralStatsScriptResult.json.code, 200);

    const generalStatsScriptListResult = await requestJsonWithAuth(baseUrl, "/api/script/getScrptApi", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: generalStatsProjectId,
      }),
    });

    assert.equal(generalStatsScriptListResult.response.status, 200);
    assert.ok(generalStatsScriptListResult.json);
    assert.equal(generalStatsScriptListResult.json.code, 200);
    const generalStatsScript = generalStatsScriptListResult.json.data.find(
      (item: { id?: number; name?: string }) => item.name === generalStatsScriptName,
    ) as { id: number; name: string } | undefined;
    assert.ok(generalStatsScript);
    const generalStatsScriptId = generalStatsScript.id;

    const { assetId: generalStatsScopedAssetId } = insertAssetRow(dbPath, {
      projectId: generalStatsProjectId,
      name: `baseline-general-helper-asset-${Date.now()}`,
      describe: "baseline general statistics helper asset",
      type: "scene",
    });

    insertScriptScopedRows(dbPath, {
      projectId: generalStatsProjectId,
      scriptId: generalStatsScriptId,
      assetId: generalStatsScopedAssetId,
    });

    insertAssetRow(dbPath, {
      projectId: generalStatsProjectId,
      scriptId: generalStatsScriptId,
      name: `baseline-general-storyboard-${Date.now()}`,
      describe: "baseline general statistics storyboard",
      type: "storyboard",
    });

    const populatedGeneralStatsResult = await requestJsonWithAuth(baseUrl, "/api/general/generalStatistics", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: generalStatsProjectId,
      }),
    });

    assert.equal(populatedGeneralStatsResult.response.status, 200);
    assert.ok(populatedGeneralStatsResult.json);
    assert.equal(populatedGeneralStatsResult.json.code, 200);
    assert.deepEqual(populatedGeneralStatsResult.json.data, {
      roleCount: 1,
      scriptCount: 1,
      videoCount: 1,
      storyboardCount: 1,
    });
    console.log("PASS general statistics smoke");

    const productionProjectName = `baseline-production-project-${Date.now()}`;
    const createProductionProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: productionProjectName,
        intro: "baseline production flow project",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "production-image-model",
        videoModel: "production-video-model",
        imageQuality: "standard",
        mode: "story",
      }),
    });

    assert.equal(createProductionProjectResult.response.status, 200);
    assert.ok(createProductionProjectResult.json);
    assert.equal(createProductionProjectResult.json.code, 200);

    const productionProjectListResult = await requestJsonWithAuth(baseUrl, "/api/project/getProject", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(productionProjectListResult.response.status, 200);
    assert.ok(productionProjectListResult.json);
    assert.equal(productionProjectListResult.json.code, 200);
    const productionProject = productionProjectListResult.json.data.find(
      (item: { id?: number; name?: string }) => item.name === productionProjectName,
    ) as { id: number; name: string } | undefined;
    assert.ok(productionProject);
    const productionProjectId = productionProject.id;

    const productionParentImageRelativePath = "baseline-production/parent.png";
    const productionChildImageRelativePath = "baseline-production/child.png";
    const productionStoryboardOneRelativePath = "baseline-production/storyboard-one.png";
    const productionStoryboardTwoRelativePath = "baseline-production/storyboard-two.png";
    const productionVideoOneRelativePath = "baseline-production/video-one.mp4";
    const productionVideoTwoRelativePath = "baseline-production/video-two.mp4";
    const productionVideoIgnoredRelativePath = "baseline-production/video-ignored.mp4";
    const productionParentImageAbsolutePath = path.join(tempRoot, "data", "oss", ...productionParentImageRelativePath.split("/"));
    const productionChildImageAbsolutePath = path.join(tempRoot, "data", "oss", ...productionChildImageRelativePath.split("/"));
    const productionStoryboardOneAbsolutePath = path.join(tempRoot, "data", "oss", ...productionStoryboardOneRelativePath.split("/"));
    const productionStoryboardTwoAbsolutePath = path.join(tempRoot, "data", "oss", ...productionStoryboardTwoRelativePath.split("/"));
    const productionVideoOneAbsolutePath = path.join(tempRoot, "data", "oss", ...productionVideoOneRelativePath.split("/"));
    const productionVideoTwoAbsolutePath = path.join(tempRoot, "data", "oss", ...productionVideoTwoRelativePath.split("/"));
    const productionVideoIgnoredAbsolutePath = path.join(tempRoot, "data", "oss", ...productionVideoIgnoredRelativePath.split("/"));
    fs.mkdirSync(path.dirname(productionParentImageAbsolutePath), { recursive: true });
    fs.writeFileSync(productionParentImageAbsolutePath, "baseline-production-parent-image", "utf-8");
    fs.writeFileSync(productionChildImageAbsolutePath, "baseline-production-child-image", "utf-8");
    fs.writeFileSync(productionStoryboardOneAbsolutePath, "baseline-production-storyboard-one", "utf-8");
    fs.writeFileSync(productionStoryboardTwoAbsolutePath, "baseline-production-storyboard-two", "utf-8");
    fs.writeFileSync(productionVideoOneAbsolutePath, "baseline-production-video-one", "utf-8");
    fs.writeFileSync(productionVideoTwoAbsolutePath, "baseline-production-video-two", "utf-8");
    fs.writeFileSync(productionVideoIgnoredAbsolutePath, "baseline-production-video-ignored", "utf-8");

    const productionSeed = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
    const productionParentAssetId = productionSeed;
    const productionParentImageId = productionSeed + 1;
    const productionChildAssetId = productionSeed + 2;
    const productionChildImageId = productionSeed + 3;
    const productionTrackOneId = productionSeed + 4;
    const productionTrackTwoId = productionSeed + 5;
    const productionIgnoredTrackId = productionSeed + 6;
    const productionVideoOneId = productionSeed + 7;
    const productionVideoTwoId = productionSeed + 8;
    const productionIgnoredVideoId = productionSeed + 9;

    insertImageRow(dbPath, {
      id: productionParentImageId,
      assetsId: productionParentAssetId,
      filePath: productionParentImageRelativePath,
      state: "done",
    });
    insertAssetRow(dbPath, {
      id: productionParentAssetId,
      projectId: productionProjectId,
      name: "Baseline Production Parent Asset",
      type: "role",
      describe: "baseline production parent asset",
      prompt: "baseline production parent prompt",
      remark: "baseline production parent remark",
      imageId: productionParentImageId,
    });

    insertImageRow(dbPath, {
      id: productionChildImageId,
      assetsId: productionChildAssetId,
      filePath: productionChildImageRelativePath,
      state: "done",
    });
    insertAssetRow(dbPath, {
      id: productionChildAssetId,
      projectId: productionProjectId,
      name: "Baseline Production Child Asset",
      type: "role",
      describe: "baseline production child asset",
      prompt: "baseline production child prompt",
      remark: "baseline production child remark",
      imageId: productionChildImageId,
      assetsId: productionParentAssetId,
    });

    const productionScriptName = `baseline-production-script-${Date.now()}`;
    const productionScriptContent = "baseline production script content";
    const addProductionScriptResult = await requestJsonWithAuth(baseUrl, "/api/script/addScript", token, {
      method: "POST",
      body: JSON.stringify({
        name: productionScriptName,
        content: productionScriptContent,
        projectId: productionProjectId,
        assets: [productionParentAssetId],
      }),
    });

    assert.equal(addProductionScriptResult.response.status, 200);
    assert.ok(addProductionScriptResult.json);
    assert.equal(addProductionScriptResult.json.code, 200);

    const productionScriptListResult = await requestJsonWithAuth(baseUrl, "/api/script/getScrptApi", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: productionProjectId,
      }),
    });

    assert.equal(productionScriptListResult.response.status, 200);
    assert.ok(productionScriptListResult.json);
    assert.equal(productionScriptListResult.json.code, 200);
    const productionScript = productionScriptListResult.json.data.find(
      (item: { id?: number; name?: string }) => item.name === productionScriptName,
    ) as { id: number; name: string } | undefined;
    assert.ok(productionScript);
    const productionScriptId = productionScript.id;

    const defaultProductionFlowResult = await requestJsonWithAuth(baseUrl, "/api/production/getFlowData", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: productionProjectId,
        episodesId: productionScriptId,
      }),
    });

    assert.equal(defaultProductionFlowResult.response.status, 200);
    assert.ok(defaultProductionFlowResult.json);
    assert.equal(defaultProductionFlowResult.json.code, 200);
    const defaultProductionFlowData = defaultProductionFlowResult.json.data as {
      script: string;
      scriptPlan: string;
      storyboardTable: string;
      assets: Array<{
        id: number;
        name: string;
        type: string;
        prompt: string;
        desc: string;
        src?: string;
        derive: Array<{
          id: number;
          name: string;
          type: string;
          prompt: string;
          desc: string;
          src?: string;
          state?: string;
        }>;
      }>;
      storyboard: Array<unknown>;
      workbench?: {
        videoList?: Array<unknown>;
      };
    };
    assert.equal(defaultProductionFlowData.script, productionScriptContent);
    assert.equal(defaultProductionFlowData.scriptPlan, "");
    assert.equal(defaultProductionFlowData.storyboardTable, "");
    assert.equal(defaultProductionFlowData.assets.length, 1);
    const defaultProductionAsset = defaultProductionFlowData.assets[0];
    assert.equal(defaultProductionAsset.id, productionParentAssetId);
    assert.equal(defaultProductionAsset.name, "Baseline Production Parent Asset");
    assert.equal(defaultProductionAsset.type, "role");
    assert.equal(defaultProductionAsset.prompt, "baseline production parent prompt");
    assert.equal(defaultProductionAsset.desc, "baseline production parent asset");
    assert.ok(defaultProductionAsset.src);
    assert.equal(getUrlPathname(defaultProductionAsset.src), `/oss/${productionParentImageRelativePath}`);
    assert.equal(defaultProductionAsset.derive.length, 1);
    assert.equal(defaultProductionAsset.derive[0].id, productionChildAssetId);
    assert.equal(defaultProductionAsset.derive[0].name, "Baseline Production Child Asset");
    assert.equal(defaultProductionAsset.derive[0].type, "role");
    assert.equal(defaultProductionAsset.derive[0].prompt, "baseline production child prompt");
    assert.equal(defaultProductionAsset.derive[0].desc, "baseline production child asset");
    assert.equal(defaultProductionAsset.derive[0].state, "done");
    assert.ok(defaultProductionAsset.derive[0].src);
    assert.equal(getUrlPathname(defaultProductionAsset.derive[0].src!), `/oss/${productionChildImageRelativePath}`);
    assert.deepEqual(defaultProductionFlowData.storyboard, []);
    assert.ok(defaultProductionFlowData.workbench);
    assert.deepEqual(defaultProductionFlowData.workbench?.videoList, []);

    const { storyboardId: productionStoryboardOneId } = insertStoryboardRow(dbPath, {
      projectId: productionProjectId,
      scriptId: productionScriptId,
      prompt: "baseline production storyboard one prompt",
      filePath: productionStoryboardOneRelativePath,
      duration: 4,
      state: "done",
      trackId: productionTrackOneId,
      videoDesc: "baseline production storyboard one video desc",
      shouldGenerateImage: 1,
      index: 99,
      assetIds: [productionParentAssetId],
    });
    const { storyboardId: productionStoryboardTwoId } = insertStoryboardRow(dbPath, {
      projectId: productionProjectId,
      scriptId: productionScriptId,
      prompt: "baseline production storyboard two prompt",
      filePath: productionStoryboardTwoRelativePath,
      duration: 8,
      state: "done",
      trackId: productionTrackTwoId,
      videoDesc: "baseline production storyboard two video desc",
      shouldGenerateImage: 1,
      index: 12,
      assetIds: [productionChildAssetId],
    });

    insertVideoRow(dbPath, {
      id: productionVideoOneId,
      projectId: productionProjectId,
      scriptId: productionScriptId,
      videoTrackId: productionTrackOneId,
      filePath: productionVideoOneRelativePath,
      state: "已完成",
    });
    insertVideoRow(dbPath, {
      id: productionVideoTwoId,
      projectId: productionProjectId,
      scriptId: productionScriptId,
      videoTrackId: productionTrackTwoId,
      filePath: productionVideoTwoRelativePath,
      state: "生成中",
    });
    insertVideoRow(dbPath, {
      id: productionIgnoredVideoId,
      projectId: productionProjectId,
      scriptId: productionScriptId,
      videoTrackId: productionIgnoredTrackId,
      filePath: productionVideoIgnoredRelativePath,
      state: "已完成",
    });

    const productionStoryboardListResult = await requestJsonWithAuth(baseUrl, "/api/production/getStoryboardData", token, {
      method: "POST",
      body: JSON.stringify({
        scriptId: productionScriptId,
      }),
    });

    assert.equal(productionStoryboardListResult.response.status, 200);
    assert.ok(productionStoryboardListResult.json);
    assert.equal(productionStoryboardListResult.json.code, 200);
    const productionStoryboardList = productionStoryboardListResult.json.data as Array<{
      id: string;
      duration?: number;
      filePath?: string;
      prompt?: string;
      scriptId?: number;
      characters?: Array<{
        name: string;
        type: string;
        avatar?: string;
      }>;
    }>;
    assert.deepEqual(
      productionStoryboardList.map((item) => item.id),
      [String(productionStoryboardTwoId), String(productionStoryboardOneId)],
    );
    assert.equal(productionStoryboardList[0].duration, 8);
    assert.equal(productionStoryboardList[1].duration, 4);
    assert.equal(productionStoryboardList[0].prompt, "baseline production storyboard two prompt");
    assert.equal(productionStoryboardList[1].prompt, "baseline production storyboard one prompt");
    assert.equal(productionStoryboardList[0].scriptId, productionScriptId);
    assert.equal(productionStoryboardList[1].scriptId, productionScriptId);
    assert.ok(productionStoryboardList[0].filePath);
    assert.ok(productionStoryboardList[1].filePath);
    assert.equal(getUrlPathname(productionStoryboardList[0].filePath!), `/oss/${productionStoryboardTwoRelativePath}`);
    assert.equal(getUrlPathname(productionStoryboardList[1].filePath!), `/oss/${productionStoryboardOneRelativePath}`);
    assert.equal(productionStoryboardList[0].characters?.length, 1);
    assert.equal(productionStoryboardList[1].characters?.length, 1);
    assert.equal(productionStoryboardList[0].characters?.[0].name, "Baseline Production Child Asset");
    assert.equal(productionStoryboardList[0].characters?.[0].type, "role");
    assert.ok(productionStoryboardList[0].characters?.[0].avatar);
    assert.equal(
      getUrlPathname(productionStoryboardList[0].characters?.[0].avatar!),
      `/oss/${productionChildImageRelativePath}`,
    );
    assert.equal(productionStoryboardList[1].characters?.[0].name, "Baseline Production Parent Asset");
    assert.equal(productionStoryboardList[1].characters?.[0].type, "role");
    assert.ok(productionStoryboardList[1].characters?.[0].avatar);
    assert.equal(
      getUrlPathname(productionStoryboardList[1].characters?.[0].avatar!),
      `/oss/${productionParentImageRelativePath}`,
    );

    const productionVideoListResult = await requestJsonWithAuth(
      baseUrl,
      "/api/production/workbench/getVideoList",
      token,
      {
        method: "POST",
        body: JSON.stringify({
          projectId: productionProjectId,
          scriptId: productionScriptId,
        }),
      },
    );

    assert.equal(productionVideoListResult.response.status, 200);
    assert.ok(productionVideoListResult.json);
    assert.equal(productionVideoListResult.json.code, 200);
    const productionVideoList = productionVideoListResult.json.data as Array<{
      id: number;
      src?: string;
      state?: string;
      videoTrackId?: number;
    }>;
    assert.deepEqual(
      productionVideoList.map((item) => item.id).sort((a, b) => a - b),
      [productionVideoOneId, productionVideoTwoId],
    );
    assert.ok(!productionVideoList.some((item) => item.id === productionIgnoredVideoId));
    const productionVideoOne = productionVideoList.find((item) => item.id === productionVideoOneId);
    const productionVideoTwo = productionVideoList.find((item) => item.id === productionVideoTwoId);
    assert.ok(productionVideoOne);
    assert.ok(productionVideoTwo);
    assert.equal(productionVideoOne.videoTrackId, productionTrackOneId);
    assert.equal(productionVideoTwo.videoTrackId, productionTrackTwoId);
    assert.equal(productionVideoOne.state, "已完成");
    assert.equal(productionVideoTwo.state, "生成中");
    assert.ok(productionVideoOne.src);
    assert.ok(productionVideoTwo.src);
    assert.equal(getUrlPathname(productionVideoOne.src!), `/oss/${productionVideoOneRelativePath}`);
    assert.equal(getUrlPathname(productionVideoTwo.src!), `/oss/${productionVideoTwoRelativePath}`);
    console.log("PASS production media list smoke");

    const savedProductionFlowData = {
      script: productionScriptContent,
      scriptPlan: "baseline production script plan",
      assets: [],
      storyboardTable: "baseline production storyboard table",
      storyboard: [
        {
          id: productionStoryboardOneId,
          duration: 4,
          prompt: "baseline production storyboard one prompt",
          associateAssetsIds: [productionParentAssetId],
          src: "",
          index: 99,
        },
        {
          id: productionStoryboardTwoId,
          duration: 8,
          prompt: "baseline production storyboard two prompt",
          associateAssetsIds: [productionChildAssetId],
          src: "",
          index: 12,
        },
      ],
      workbench: {
        videoList: [{ id: 1, name: "baseline-production-video" }],
      },
    };
    const saveProductionFlowResult = await requestJsonWithAuth(baseUrl, "/api/production/saveFlowData", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: productionProjectId,
        episodesId: productionScriptId,
        data: savedProductionFlowData,
      }),
    });

    assert.equal(saveProductionFlowResult.response.status, 200);
    assert.ok(saveProductionFlowResult.json);
    assert.equal(saveProductionFlowResult.json.code, 200);
    assert.equal(countRowsByProjectId(dbPath, "o_agentWorkData", productionProjectId), 1);

    const savedProductionFlowResult = await requestJsonWithAuth(baseUrl, "/api/production/getFlowData", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: productionProjectId,
        episodesId: productionScriptId,
      }),
    });

    assert.equal(savedProductionFlowResult.response.status, 200);
    assert.ok(savedProductionFlowResult.json);
    assert.equal(savedProductionFlowResult.json.code, 200);
    const savedProductionFlow = savedProductionFlowResult.json.data as {
      script: string;
      scriptPlan: string;
      storyboardTable: string;
      assets: Array<{
        id: number;
        derive: Array<{
          id: number;
        }>;
      }>;
      storyboard: Array<{
        id: number;
        index?: number | null;
        duration?: number;
        prompt?: string;
        associateAssetsIds?: number[];
        src?: string;
        state?: string;
        videoDesc?: string;
        shouldGenerateImage?: number;
      }>;
      workbench?: {
        videoList?: Array<{
          id: number;
          name: string;
        }>;
      };
    };
    assert.equal(savedProductionFlow.script, productionScriptContent);
    assert.equal(savedProductionFlow.scriptPlan, "baseline production script plan");
    assert.equal(savedProductionFlow.storyboardTable, "baseline production storyboard table");
    assert.equal(savedProductionFlow.assets.length, 1);
    assert.equal(savedProductionFlow.assets[0].id, productionParentAssetId);
    assert.equal(savedProductionFlow.assets[0].derive.length, 1);
    assert.equal(savedProductionFlow.assets[0].derive[0].id, productionChildAssetId);
    assert.equal(savedProductionFlow.storyboard.length, 2);
    assert.deepEqual(
      savedProductionFlow.storyboard.map((item) => item.id),
      [productionStoryboardOneId, productionStoryboardTwoId],
    );
    assert.deepEqual(
      savedProductionFlow.storyboard.map((item) => item.index),
      [0, 1],
    );
    assert.deepEqual(
      savedProductionFlow.storyboard.map((item) => item.duration),
      [4, 8],
    );
    assert.deepEqual(
      savedProductionFlow.storyboard.map((item) => item.prompt),
      ["baseline production storyboard one prompt", "baseline production storyboard two prompt"],
    );
    assert.deepEqual(savedProductionFlow.storyboard[0].associateAssetsIds, [productionParentAssetId]);
    assert.deepEqual(savedProductionFlow.storyboard[1].associateAssetsIds, [productionChildAssetId]);
    assert.ok(savedProductionFlow.storyboard[0].src);
    assert.ok(savedProductionFlow.storyboard[1].src);
    assert.equal(getUrlPathname(savedProductionFlow.storyboard[0].src!), `/oss/${productionStoryboardOneRelativePath}`);
    assert.equal(getUrlPathname(savedProductionFlow.storyboard[1].src!), `/oss/${productionStoryboardTwoRelativePath}`);
    assert.equal(savedProductionFlow.storyboard[0].state, "done");
    assert.equal(savedProductionFlow.storyboard[1].state, "done");
    assert.equal(savedProductionFlow.storyboard[0].videoDesc, "baseline production storyboard one video desc");
    assert.equal(savedProductionFlow.storyboard[1].videoDesc, "baseline production storyboard two video desc");
    assert.equal(savedProductionFlow.storyboard[0].shouldGenerateImage, 1);
    assert.equal(savedProductionFlow.storyboard[1].shouldGenerateImage, 1);
    assert.deepEqual(savedProductionFlow.workbench?.videoList, [{ id: 1, name: "baseline-production-video" }]);
    console.log("PASS production flow smoke");

    const generateProjectName = `baseline-generate-project-${Date.now()}`;
    const createGenerateProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: generateProjectName,
        intro: "baseline generate data project",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "baseline-generate-image-model",
        videoModel: "",
        imageQuality: "standard",
        mode: "story",
      }),
    });

    assert.equal(createGenerateProjectResult.response.status, 200);
    assert.ok(createGenerateProjectResult.json);
    assert.equal(createGenerateProjectResult.json.code, 200);

    const generateProjectListResult = await requestJsonWithAuth(baseUrl, "/api/project/getProject", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(generateProjectListResult.response.status, 200);
    assert.ok(generateProjectListResult.json);
    assert.equal(generateProjectListResult.json.code, 200);
    const generateProject = generateProjectListResult.json.data.find(
      (item: { id?: number; name?: string }) => item.name === generateProjectName,
    ) as { id: number; name: string } | undefined;
    assert.ok(generateProject);
    const generateProjectId = generateProject.id;

    const generateScriptName = `baseline-generate-script-${Date.now()}`;
    const generateScriptResult = await requestJsonWithAuth(baseUrl, "/api/script/addScript", token, {
      method: "POST",
      body: JSON.stringify({
        name: generateScriptName,
        content: "baseline generate script content",
        projectId: generateProjectId,
        assets: [],
      }),
    });

    assert.equal(generateScriptResult.response.status, 200);
    assert.ok(generateScriptResult.json);
    assert.equal(generateScriptResult.json.code, 200);

    const generateScriptListResult = await requestJsonWithAuth(baseUrl, "/api/script/getScrptApi", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: generateProjectId,
      }),
    });

    assert.equal(generateScriptListResult.response.status, 200);
    assert.ok(generateScriptListResult.json);
    assert.equal(generateScriptListResult.json.code, 200);
    const generateScript = generateScriptListResult.json.data.find(
      (item: { id?: number; name?: string }) => item.name === generateScriptName,
    ) as { id: number; name: string } | undefined;
    assert.ok(generateScript);
    const generateScriptId = generateScript.id;

    const generateVendorId = `baseline-generate-vendor-${Date.now()}`;
    const generateModelName = "baseline-generate-video";
    const generateVendorModels = [
      {
        name: "Baseline Generate Video",
        modelName: generateModelName,
        type: "video",
        mode: [["imageReference:1"]],
      },
    ];
    const generateVendorDir = path.join(tempRoot, "data", "vendor");
    fs.mkdirSync(generateVendorDir, { recursive: true });
    fs.writeFileSync(
      path.join(generateVendorDir, `${generateVendorId}.ts`),
      createVendorTsCode(generateVendorId, {
        name: "Baseline Generate Vendor",
        description: "Baseline generate smoke vendor",
        inputValues: {},
        modelName: generateModelName,
        modelLabel: "Baseline Generate Video",
        models: generateVendorModels,
      }),
      "utf-8",
    );
    insertVendorConfigRow(dbPath, {
      id: generateVendorId,
      inputValues: {},
      models: generateVendorModels,
      enable: 1,
    });

    const generateRefImageRelativePath = "baseline-generate/ref-image.png";
    const generateTrackTwoImageRelativePath = "baseline-generate/track-two-image.png";
    const generateStoryboardOneRelativePath = "baseline-generate/storyboard-one.png";
    const generateStoryboardTwoRelativePath = "baseline-generate/storyboard-two.png";
    const generateVideoOneRelativePath = "baseline-generate/video-one.mp4";
    const generateVideoTwoRelativePath = "baseline-generate/video-two.mp4";
    const generateRefImageAbsolutePath = path.join(tempRoot, "data", "oss", ...generateRefImageRelativePath.split("/"));
    const generateTrackTwoImageAbsolutePath = path.join(
      tempRoot,
      "data",
      "oss",
      ...generateTrackTwoImageRelativePath.split("/"),
    );
    const generateStoryboardOneAbsolutePath = path.join(
      tempRoot,
      "data",
      "oss",
      ...generateStoryboardOneRelativePath.split("/"),
    );
    const generateStoryboardTwoAbsolutePath = path.join(
      tempRoot,
      "data",
      "oss",
      ...generateStoryboardTwoRelativePath.split("/"),
    );
    const generateVideoOneAbsolutePath = path.join(tempRoot, "data", "oss", ...generateVideoOneRelativePath.split("/"));
    const generateVideoTwoAbsolutePath = path.join(tempRoot, "data", "oss", ...generateVideoTwoRelativePath.split("/"));
    fs.mkdirSync(path.dirname(generateRefImageAbsolutePath), { recursive: true });
    fs.writeFileSync(generateRefImageAbsolutePath, "baseline-generate-ref-image", "utf-8");
    fs.writeFileSync(generateTrackTwoImageAbsolutePath, "baseline-generate-track-two-image", "utf-8");
    fs.writeFileSync(generateStoryboardOneAbsolutePath, "baseline-generate-storyboard-one", "utf-8");
    fs.writeFileSync(generateStoryboardTwoAbsolutePath, "baseline-generate-storyboard-two", "utf-8");
    fs.writeFileSync(generateVideoOneAbsolutePath, "baseline-generate-video-one", "utf-8");
    fs.writeFileSync(generateVideoTwoAbsolutePath, "baseline-generate-video-two", "utf-8");

    const generateSeed = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
    const generateSharedAssetId = generateSeed;
    const generateSharedImageId = generateSeed + 1;
    const generateTextOnlyAssetId = generateSeed + 2;
    const generateTrackTwoAssetId = generateSeed + 3;
    const generateTrackTwoImageId = generateSeed + 4;
    const generateTrackOneId = generateSeed + 5;
    const generateTrackTwoId = generateSeed + 6;
    const generateVideoOneId = generateSeed + 7;
    const generateVideoTwoId = generateSeed + 8;

    insertImageRow(dbPath, {
      id: generateSharedImageId,
      assetsId: generateSharedAssetId,
      filePath: generateRefImageRelativePath,
      state: "done",
    });
    insertAssetRow(dbPath, {
      id: generateSharedAssetId,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      name: "Baseline Generate Shared Asset",
      type: "role",
      describe: "baseline generate shared asset",
      prompt: "baseline generate shared prompt",
      imageId: generateSharedImageId,
    });
    insertAssetRow(dbPath, {
      id: generateTextOnlyAssetId,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      name: "Baseline Generate Text Asset",
      type: "role",
      describe: "baseline generate text asset",
      prompt: "baseline generate text prompt",
      imageId: null,
    });
    insertImageRow(dbPath, {
      id: generateTrackTwoImageId,
      assetsId: generateTrackTwoAssetId,
      filePath: generateTrackTwoImageRelativePath,
      state: "done",
    });
    insertAssetRow(dbPath, {
      id: generateTrackTwoAssetId,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      name: "Baseline Generate Track Two Asset",
      type: "role",
      describe: "baseline generate track two asset",
      prompt: "baseline generate track two prompt",
      imageId: generateTrackTwoImageId,
    });

    insertVideoTrackRow(dbPath, {
      id: generateTrackOneId,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      prompt: "baseline generate track one prompt",
      duration: 8,
      state: "已完成",
      reason: "done",
      selectVideoId: generateVideoTwoId,
    });
    insertVideoTrackRow(dbPath, {
      id: generateTrackTwoId,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      prompt: "baseline generate track two prompt",
      duration: 3,
      state: "生成中",
      reason: "",
      selectVideoId: null,
    });

    const { storyboardId: generateStoryboardOneId } = insertStoryboardRow(dbPath, {
      id: generateSeed + 9,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      prompt: "baseline generate storyboard one prompt",
      filePath: generateStoryboardOneRelativePath,
      duration: 5,
      state: "done",
      trackId: generateTrackOneId,
      videoDesc: "baseline generate storyboard one video desc",
      index: 1,
      assetIds: [generateSharedAssetId],
    });
    const { storyboardId: generateStoryboardTwoId } = insertStoryboardRow(dbPath, {
      id: generateSeed + 10,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      prompt: "baseline generate storyboard two prompt",
      filePath: generateStoryboardTwoRelativePath,
      duration: 5,
      state: "done",
      trackId: generateTrackOneId,
      videoDesc: "baseline generate storyboard two video desc",
      index: 2,
      assetIds: [generateSharedAssetId, generateTextOnlyAssetId],
    });
    const { storyboardId: generateStoryboardThreeId } = insertStoryboardRow(dbPath, {
      id: generateSeed + 11,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      prompt: "baseline generate storyboard three prompt",
      filePath: "",
      duration: 3,
      state: "done",
      trackId: generateTrackTwoId,
      videoDesc: "baseline generate storyboard three video desc",
      index: 3,
      assetIds: [generateTrackTwoAssetId],
    });

    insertVideoRow(dbPath, {
      id: generateVideoOneId,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      videoTrackId: generateTrackOneId,
      filePath: generateVideoOneRelativePath,
      state: "生成中",
    });
    insertVideoRow(dbPath, {
      id: generateVideoTwoId,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      videoTrackId: generateTrackOneId,
      filePath: generateVideoTwoRelativePath,
      state: "已完成",
    });

    updateProjectVideoModel(dbPath, generateProjectId, null);
    const missingGenerateDataResult = await requestJsonWithAuth(
      baseUrl,
      "/api/production/workbench/getGenerateData",
      token,
      {
        method: "POST",
        body: JSON.stringify({
          projectId: generateProjectId,
          scriptId: generateScriptId,
        }),
      },
    );

    assert.equal(missingGenerateDataResult.response.status, 400);
    assert.ok(missingGenerateDataResult.json);
    assert.equal(missingGenerateDataResult.json.code, 200);
    assert.equal(missingGenerateDataResult.json.data, "项目未配置视频模型");

    updateProjectVideoModel(dbPath, generateProjectId, `${generateVendorId}:${generateModelName}`);
    const generateDataResult = await requestJsonWithAuth(baseUrl, "/api/production/workbench/getGenerateData", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: generateProjectId,
        scriptId: generateScriptId,
      }),
    });

    assert.equal(generateDataResult.response.status, 200);
    assert.ok(generateDataResult.json);
    assert.equal(generateDataResult.json.code, 200);
    const generateData = generateDataResult.json.data as {
      storyboardList: Array<{
        id: number;
        src?: string;
      }>;
      trackList: Array<{
        id?: number;
        prompt?: string;
        duration?: number;
        state?: string;
        reason?: string;
        selectVideoId?: number | null;
        medias: Array<{
          id?: number;
          src?: string;
        }>;
        videoList: Array<{
          id: number;
          src?: string;
          state?: string;
        }>;
      }>;
    };
    assert.deepEqual(
      generateData.storyboardList.map((item) => item.id),
      [generateStoryboardOneId, generateStoryboardTwoId, generateStoryboardThreeId],
    );
    assert.deepEqual(
      generateData.storyboardList.map((item) => (item.src ? getUrlPathname(item.src) : "")),
      [
        `/oss/${generateStoryboardOneRelativePath}`,
        `/oss/${generateStoryboardTwoRelativePath}`,
        "",
      ],
    );

    const generateTrackOne = generateData.trackList.find((item) => item.id === generateTrackOneId);
    const generateTrackTwo = generateData.trackList.find((item) => item.id === generateTrackTwoId);
    assert.ok(generateTrackOne);
    assert.ok(generateTrackTwo);

    assert.equal(generateTrackOne.prompt, "baseline generate track one prompt");
    assert.equal(generateTrackOne.duration, 8);
    assert.equal(generateTrackOne.state, "已完成");
    assert.equal(generateTrackOne.reason, "done");
    assert.equal(generateTrackOne.selectVideoId, generateVideoTwoId);
    assert.deepEqual(
      generateTrackOne.medias.map((item) => item.id),
      [generateSharedAssetId, generateStoryboardOneId, generateStoryboardTwoId, generateTextOnlyAssetId],
    );
    assert.deepEqual(
      generateTrackOne.medias.map((item) => (item.src ? getUrlPathname(item.src) : "")),
      [
        `/oss/${generateRefImageRelativePath}`,
        `/oss/${generateStoryboardOneRelativePath}`,
        `/oss/${generateStoryboardTwoRelativePath}`,
        "",
      ],
    );
    assert.equal(generateTrackOne.medias.filter((item) => item.id === generateSharedAssetId).length, 1);
    assert.deepEqual(
      generateTrackOne.videoList.map((item) => item.id),
      [generateVideoOneId, generateVideoTwoId],
    );
    assert.equal(
      getUrlPathname(generateTrackOne.videoList.find((item) => item.id === generateVideoOneId)?.src!),
      `/oss/${generateVideoOneRelativePath}`,
    );
    assert.equal(
      getUrlPathname(generateTrackOne.videoList.find((item) => item.id === generateVideoTwoId)?.src!),
      `/oss/${generateVideoTwoRelativePath}`,
    );
    assert.equal(generateTrackOne.videoList.find((item) => item.id === generateVideoOneId)?.state, "生成中");
    assert.equal(generateTrackOne.videoList.find((item) => item.id === generateVideoTwoId)?.state, "已完成");

    assert.equal(generateTrackTwo.prompt, "baseline generate track two prompt");
    assert.equal(generateTrackTwo.duration, 3);
    assert.equal(generateTrackTwo.state, "生成中");
    assert.equal(generateTrackTwo.reason, "");
    assert.equal(generateTrackTwo.selectVideoId, null);
    assert.deepEqual(
      generateTrackTwo.medias.map((item) => item.id),
      [generateTrackTwoAssetId, generateStoryboardThreeId],
    );
    assert.deepEqual(
      generateTrackTwo.medias.map((item) => (item.src ? getUrlPathname(item.src) : "")),
      [
        `/oss/${generateTrackTwoImageRelativePath}`,
        "",
      ],
    );
    assert.deepEqual(generateTrackTwo.videoList, []);
    console.log("PASS production workbench getGenerateData smoke");

    const scriptProjectName = `baseline-script-project-${Date.now()}`;
    const createScriptProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: scriptProjectName,
        intro: "baseline script lifecycle project",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "script-image-model",
        videoModel: "script-video-model",
        imageQuality: "standard",
        mode: "story",
      }),
    });

    assert.equal(createScriptProjectResult.response.status, 200);
    assert.ok(createScriptProjectResult.json);
    assert.equal(createScriptProjectResult.json.code, 200);

    const scriptProjectListResult = await requestJsonWithAuth(baseUrl, "/api/project/getProject", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(scriptProjectListResult.response.status, 200);
    assert.ok(scriptProjectListResult.json);
    assert.equal(scriptProjectListResult.json.code, 200);
    const scriptProject = scriptProjectListResult.json.data.find(
      (item: { id?: number; name?: string }) => item.name === scriptProjectName,
    ) as { id: number; name: string } | undefined;
    assert.ok(scriptProject);
    const scriptProjectId = scriptProject.id;

    const { assetId } = insertAssetRow(dbPath, {
      projectId: scriptProjectId,
      name: "Baseline Script Asset",
    });

    const oversizedScriptName = `oversized-script-${Date.now()}`;
    const addOversizedScriptResult = await requestJsonWithAuth(baseUrl, "/api/script/addScript", token, {
      method: "POST",
      body: JSON.stringify({
        name: oversizedScriptName,
        content: "x".repeat(3000),
        projectId: scriptProjectId,
        assets: [],
      }),
    });

    assert.equal(addOversizedScriptResult.response.status, 400);
    assert.ok(addOversizedScriptResult.json);
    assert.equal(addOversizedScriptResult.json.code, 400);
    assert.equal(addOversizedScriptResult.json.data, null);

    const scriptName = `baseline-script-${Date.now()}`;
    const addScriptResult = await requestJsonWithAuth(baseUrl, "/api/script/addScript", token, {
      method: "POST",
      body: JSON.stringify({
        name: scriptName,
        content: "baseline script content",
        projectId: scriptProjectId,
        assets: [assetId],
      }),
    });

    assert.equal(addScriptResult.response.status, 200);
    assert.ok(addScriptResult.json);
    assert.equal(addScriptResult.json.code, 200);

    const scriptListResult = await requestJsonWithAuth(baseUrl, "/api/script/getScrptApi", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: scriptProjectId,
      }),
    });

    assert.equal(scriptListResult.response.status, 200);
    assert.ok(scriptListResult.json);
    assert.equal(scriptListResult.json.code, 200);
    assert.ok(!scriptListResult.json.data.some((item: { name?: string }) => item.name === oversizedScriptName));
    const createdScript = scriptListResult.json.data.find(
      (item: { id?: number; name?: string; relatedAssets?: Array<{ id?: number; name?: string }> }) => item.name === scriptName,
    ) as { id: number; name: string; content: string; relatedAssets: Array<{ id: number; name: string }> } | undefined;
    assert.ok(createdScript);
    assert.equal(createdScript.content, "baseline script content");
    assert.ok(createdScript.relatedAssets.some((item) => item.id === assetId && item.name === "Baseline Script Asset"));

    const scriptId = createdScript.id;
    const updatedScriptName = `${scriptName}-updated`;
    const updatedScriptContent = "baseline script content updated";
    const updateScriptResult = await requestJsonWithAuth(baseUrl, "/api/script/updateScript", token, {
      method: "POST",
      body: JSON.stringify({
        id: scriptId,
        name: updatedScriptName,
        content: updatedScriptContent,
        assets: [],
      }),
    });

    assert.equal(updateScriptResult.response.status, 200);
    assert.ok(updateScriptResult.json);
    assert.equal(updateScriptResult.json.code, 200);

    const scriptListAfterUpdateResult = await requestJsonWithAuth(baseUrl, "/api/script/getScrptApi", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: scriptProjectId,
      }),
    });

    assert.equal(scriptListAfterUpdateResult.response.status, 200);
    assert.ok(scriptListAfterUpdateResult.json);
    assert.equal(scriptListAfterUpdateResult.json.code, 200);
    const updatedScript = scriptListAfterUpdateResult.json.data.find(
      (item: { id?: number }) => item.id === scriptId,
    ) as { name: string; content: string; relatedAssets: Array<{ id: number }> } | undefined;
    assert.ok(updatedScript);
    assert.equal(updatedScript.name, updatedScriptName);
    assert.equal(updatedScript.content, updatedScriptContent);
    assert.deepEqual(updatedScript.relatedAssets, []);

    const scriptScopedRows = insertScriptScopedRows(dbPath, {
      projectId: scriptProjectId,
      scriptId,
      assetId,
    });
    assert.equal(countRowsByProjectId(dbPath, "o_agentWorkData", scriptProjectId), 1);
    assert.equal(countRowsByColumn(dbPath, "o_scriptAssets", "scriptId", scriptId), 1);
    assert.equal(countRowsByColumn(dbPath, "o_storyboard", "scriptId", scriptId), 1);
    assert.equal(countRowsByColumn(dbPath, "o_video", "scriptId", scriptId), 1);
    assert.equal(countRowsByColumn(dbPath, "o_assets2Storyboard", "storyboardId", scriptScopedRows.storyboardId), 1);

    const deleteScriptResult = await requestJsonWithAuth(baseUrl, "/api/script/delScript", token, {
      method: "POST",
      body: JSON.stringify({
        ids: [scriptId],
      }),
    });

    assert.equal(deleteScriptResult.response.status, 200);
    assert.ok(deleteScriptResult.json);
    assert.equal(deleteScriptResult.json.code, 200);

    const scriptListAfterDeleteResult = await requestJsonWithAuth(baseUrl, "/api/script/getScrptApi", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: scriptProjectId,
      }),
    });

    assert.equal(scriptListAfterDeleteResult.response.status, 200);
    assert.ok(scriptListAfterDeleteResult.json);
    assert.equal(scriptListAfterDeleteResult.json.code, 200);
    assert.ok(!scriptListAfterDeleteResult.json.data.some((item: { id?: number }) => item.id === scriptId));
    assert.equal(countRowsByProjectId(dbPath, "o_agentWorkData", scriptProjectId), 0);
    assert.equal(countRowsByColumn(dbPath, "o_scriptAssets", "scriptId", scriptId), 0);
    assert.equal(countRowsByColumn(dbPath, "o_storyboard", "scriptId", scriptId), 0);
    assert.equal(countRowsByColumn(dbPath, "o_video", "scriptId", scriptId), 0);
    assert.equal(countRowsByColumn(dbPath, "o_assets2Storyboard", "storyboardId", scriptScopedRows.storyboardId), 0);
    console.log("PASS script lifecycle smoke");

    const assetsProjectName = `baseline-assets-project-${Date.now()}`;
    const createAssetsProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: assetsProjectName,
        intro: "baseline assets lifecycle project",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "assets-image-model",
        videoModel: "assets-video-model",
        imageQuality: "standard",
        mode: "story",
      }),
    });

    assert.equal(createAssetsProjectResult.response.status, 200);
    assert.ok(createAssetsProjectResult.json);
    assert.equal(createAssetsProjectResult.json.code, 200);

    const assetsProjectListResult = await requestJsonWithAuth(baseUrl, "/api/project/getProject", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(assetsProjectListResult.response.status, 200);
    assert.ok(assetsProjectListResult.json);
    assert.equal(assetsProjectListResult.json.code, 200);
    const assetsProject = assetsProjectListResult.json.data.find(
      (item: { id?: number; name?: string }) => item.name === assetsProjectName,
    ) as { id: number; name: string } | undefined;
    assert.ok(assetsProject);
    const assetsProjectId = assetsProject.id;

    const initialAssetName = `baseline-parent-asset-${Date.now()}`;
    const updatedAssetName = `${initialAssetName}-updated`;
    const addAssetResult = await requestJsonWithAuth(baseUrl, "/api/assets/addAssets", token, {
      method: "POST",
      body: JSON.stringify({
        name: initialAssetName,
        describe: "baseline parent asset describe",
        type: "role",
        projectId: assetsProjectId,
        remark: "baseline asset remark",
        prompt: "baseline asset prompt",
      }),
    });

    assert.equal(addAssetResult.response.status, 200);
    assert.ok(addAssetResult.json);
    assert.equal(addAssetResult.json.code, 200);

    const assetsListResult = await requestJsonWithAuth(baseUrl, "/api/assets/getAssetsApi", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: assetsProjectId,
        type: "role",
        page: 1,
        limit: 10,
      }),
    });

    assert.equal(assetsListResult.response.status, 200);
    assert.ok(assetsListResult.json);
    assert.equal(assetsListResult.json.code, 200);
    assert.equal(Number(assetsListResult.json.data.total), 1);
    const createdAsset = assetsListResult.json.data.data.find(
      (item: {
        id?: number;
        name?: string;
        describe?: string;
        remark?: string | null;
        prompt?: string | null;
        sonAssets?: Array<unknown>;
      }) => item.name === initialAssetName,
    ) as
      | {
          id: number;
          name: string;
          describe: string;
          remark: string | null;
          prompt: string | null;
          sonAssets: Array<unknown>;
        }
      | undefined;
    assert.ok(createdAsset);
    assert.equal(createdAsset.describe, "baseline parent asset describe");
    assert.equal(createdAsset.remark, "baseline asset remark");
    assert.equal(createdAsset.prompt, "baseline asset prompt");
    assert.deepEqual(createdAsset.sonAssets, []);

    const assetsId = createdAsset.id;
    const updateAssetResult = await requestJsonWithAuth(baseUrl, "/api/assets/updateAssets", token, {
      method: "POST",
      body: JSON.stringify({
        id: assetsId,
        name: updatedAssetName,
        describe: "baseline parent asset describe updated",
        remark: "baseline asset remark updated",
        prompt: "baseline asset prompt updated",
      }),
    });

    assert.equal(updateAssetResult.response.status, 200);
    assert.ok(updateAssetResult.json);
    assert.equal(updateAssetResult.json.code, 200);

    const filteredAssetsResult = await requestJsonWithAuth(baseUrl, "/api/assets/getAssetsApi", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: assetsProjectId,
        type: "role",
        name: updatedAssetName,
        page: 1,
        limit: 10,
      }),
    });

    assert.equal(filteredAssetsResult.response.status, 200);
    assert.ok(filteredAssetsResult.json);
    assert.equal(filteredAssetsResult.json.code, 200);
    assert.equal(Number(filteredAssetsResult.json.data.total), 1);
    const updatedAsset = filteredAssetsResult.json.data.data.find(
      (item: { id?: number }) => item.id === assetsId,
    ) as
      | {
          id: number;
          name: string;
          describe: string;
          remark: string | null;
          prompt: string | null;
          sonAssets: Array<unknown>;
        }
      | undefined;
    assert.ok(updatedAsset);
    assert.equal(updatedAsset.name, updatedAssetName);
    assert.equal(updatedAsset.describe, "baseline parent asset describe updated");
    assert.equal(updatedAsset.remark, "baseline asset remark updated");
    assert.equal(updatedAsset.prompt, "baseline asset prompt updated");

    const parentImageRelativePath = "baseline-assets/parent-image.png";
    const parentImageAbsolutePath = path.join(tempRoot, "data", "oss", "baseline-assets", "parent-image.png");
    fs.mkdirSync(path.dirname(parentImageAbsolutePath), { recursive: true });
    fs.writeFileSync(parentImageAbsolutePath, "baseline-parent-image", "utf-8");

    const { imageId: linkedImageId } = insertImageRow(dbPath, {
      assetsId,
      filePath: parentImageRelativePath,
      state: "done",
    });

    insertAssetRow(dbPath, {
      projectId: assetsProjectId,
      name: "Baseline Referencing Asset",
      describe: "baseline referencing asset",
      type: "role",
      imageId: linkedImageId,
    });

    insertAssetRow(dbPath, {
      projectId: assetsProjectId,
      name: "Baseline Child Asset",
      describe: "baseline child asset",
      type: "role",
      assetsId,
    });

    assert.equal(countRowsByColumn(dbPath, "o_image", "assetsId", assetsId), 1);
    assert.equal(countRowsByColumn(dbPath, "o_assets", "assetsId", assetsId), 1);

    const deleteAssetResult = await requestJsonWithAuth(baseUrl, "/api/assets/delAssets", token, {
      method: "POST",
      body: JSON.stringify({
        id: assetsId,
      }),
    });

    assert.equal(deleteAssetResult.response.status, 200);
    assert.ok(deleteAssetResult.json);
    assert.equal(deleteAssetResult.json.code, 200);
    assert.ok(!fs.existsSync(parentImageAbsolutePath));
    assert.equal(countRowsByColumn(dbPath, "o_image", "assetsId", assetsId), 0);
    assert.equal(countRowsByColumn(dbPath, "o_assets", "assetsId", assetsId), 0);

    const assetsListAfterDeleteResult = await requestJsonWithAuth(baseUrl, "/api/assets/getAssetsApi", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: assetsProjectId,
        type: "role",
        page: 1,
        limit: 20,
      }),
    });

    assert.equal(assetsListAfterDeleteResult.response.status, 200);
    assert.ok(assetsListAfterDeleteResult.json);
    assert.equal(assetsListAfterDeleteResult.json.code, 200);
    assert.ok(!assetsListAfterDeleteResult.json.data.data.some((item: { id?: number }) => item.id === assetsId));
    const referencingAsset = assetsListAfterDeleteResult.json.data.data.find(
      (item: { name?: string }) => item.name === "Baseline Referencing Asset",
    ) as { imageId?: number | null } | undefined;
    assert.ok(referencingAsset);
    assert.equal(referencingAsset.imageId, null);
    console.log("PASS assets lifecycle smoke");

    const novelProjectName = `baseline-novel-project-${Date.now()}`;
    const createNovelProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: novelProjectName,
        intro: "baseline novel lifecycle project",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "novel-image-model",
        videoModel: "novel-video-model",
        imageQuality: "standard",
        mode: "story",
      }),
    });

    assert.equal(createNovelProjectResult.response.status, 200);
    assert.ok(createNovelProjectResult.json);
    assert.equal(createNovelProjectResult.json.code, 200);

    const novelProjectListResult = await requestJsonWithAuth(baseUrl, "/api/project/getProject", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(novelProjectListResult.response.status, 200);
    assert.ok(novelProjectListResult.json);
    assert.equal(novelProjectListResult.json.code, 200);
    const novelProject = novelProjectListResult.json.data.find(
      (item: { id?: number; name?: string }) => item.name === novelProjectName,
    ) as { id: number; name: string } | undefined;
    assert.ok(novelProject);
    const novelProjectId = novelProject.id;

    const addNovelResult = await requestJsonWithAuth(baseUrl, "/api/novel/addNovel", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: novelProjectId,
        data: [
          {
            index: 1,
            reel: "第一卷",
            chapter: "第一章 初见",
            chapterData: "baseline novel chapter one",
          },
          {
            index: 2,
            reel: "第一卷",
            chapter: "第二章 重逢",
            chapterData: "baseline novel chapter two",
          },
        ],
      }),
    });

    assert.equal(addNovelResult.response.status, 200);
    assert.ok(addNovelResult.json);
    assert.equal(addNovelResult.json.code, 200);

    const novelListResult = await requestJsonWithAuth(baseUrl, "/api/novel/getNovel", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: novelProjectId,
        page: 1,
        limit: 10,
      }),
    });

    assert.equal(novelListResult.response.status, 200);
    assert.ok(novelListResult.json);
    assert.equal(novelListResult.json.code, 200);
    assert.equal(Number(novelListResult.json.data.total), 2);
    assert.equal(novelListResult.json.data.data.length, 2);
    assert.equal(novelListResult.json.data.data[0].index, 1);
    assert.equal(novelListResult.json.data.data[1].index, 2);
    assert.ok(novelListResult.json.data.data.every((item: { eventState?: number }) => item.eventState === 1));

    const firstNovel = novelListResult.json.data.data[0] as {
      id: number;
      chapter: string;
      chapterData: string;
      event: string;
      eventState: number;
    };
    const secondNovel = novelListResult.json.data.data[1] as {
      id: number;
      chapter: string;
      event: string;
      eventState: number;
    };
    assert.match(firstNovel.event, /^\[mock event\]/);
    assert.match(secondNovel.event, /^\[mock event\]/);

    const filteredNovelListResult = await requestJsonWithAuth(baseUrl, "/api/novel/getNovel", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: novelProjectId,
        page: 1,
        limit: 10,
        search: "初见",
      }),
    });

    assert.equal(filteredNovelListResult.response.status, 200);
    assert.ok(filteredNovelListResult.json);
    assert.equal(filteredNovelListResult.json.code, 200);
    assert.equal(Number(filteredNovelListResult.json.data.total), 1);
    assert.equal(filteredNovelListResult.json.data.data[0].id, firstNovel.id);

    const novelDataResult = await requestJsonWithAuth(baseUrl, "/api/novel/getNovelData", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: novelProjectId,
      }),
    });

    assert.equal(novelDataResult.response.status, 200);
    assert.ok(novelDataResult.json);
    assert.equal(novelDataResult.json.code, 200);
    assert.equal(novelDataResult.json.data.length, 2);

    const novelIndexResult = await requestJsonWithAuth(baseUrl, "/api/novel/getNovelIndex", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: novelProjectId,
      }),
    });

    assert.equal(novelIndexResult.response.status, 200);
    assert.ok(novelIndexResult.json);
    assert.equal(novelIndexResult.json.code, 200);
    assert.deepEqual(
      novelIndexResult.json.data.map((item: { index: number; chapter: string }) => ({
        index: item.index,
        chapter: item.chapter,
      })),
      [
        { index: 1, chapter: "第一章 初见" },
        { index: 2, chapter: "第二章 重逢" },
      ],
    );

    const novelEventStateResult = await requestJsonWithAuth(baseUrl, "/api/novel/getNovelEventState", token, {
      method: "POST",
      body: JSON.stringify({
        ids: [firstNovel.id, secondNovel.id],
      }),
    });

    assert.equal(novelEventStateResult.response.status, 200);
    assert.ok(novelEventStateResult.json);
    assert.equal(novelEventStateResult.json.code, 200);
    assert.equal(novelEventStateResult.json.data.length, 2);
    assert.ok(novelEventStateResult.json.data.every((item: { eventState?: number }) => item.eventState === 1));

    const updateNovelResult = await requestJsonWithAuth(baseUrl, "/api/novel/updateNovel", token, {
      method: "POST",
      body: JSON.stringify({
        id: firstNovel.id,
        index: 1,
        reel: "第一卷-修订",
        chapter: "第一章 初见（修订）",
        chapterData: "baseline novel chapter one updated",
        event: "baseline updated novel event",
      }),
    });

    assert.equal(updateNovelResult.response.status, 200);
    assert.ok(updateNovelResult.json);
    assert.equal(updateNovelResult.json.code, 200);

    const updatedNovelSearchResult = await requestJsonWithAuth(baseUrl, "/api/novel/getNovel", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: novelProjectId,
        page: 1,
        limit: 10,
        search: "修订",
      }),
    });

    assert.equal(updatedNovelSearchResult.response.status, 200);
    assert.ok(updatedNovelSearchResult.json);
    assert.equal(updatedNovelSearchResult.json.code, 200);
    assert.equal(Number(updatedNovelSearchResult.json.data.total), 1);
    assert.equal(updatedNovelSearchResult.json.data.data[0].id, firstNovel.id);
    assert.equal(updatedNovelSearchResult.json.data.data[0].event, "baseline updated novel event");

    const eventSmokeFirstLink = insertNovelEventLink(dbPath, {
      novelId: firstNovel.id,
      eventId: 900001,
      eventChapterId: 900101,
      name: "Baseline Event Alpha",
      detail: "baseline event alpha detail",
    });
    const eventSmokeSecondLink = insertNovelEventLink(dbPath, {
      novelId: secondNovel.id,
      eventId: 900002,
      eventChapterId: 900102,
      name: "Baseline Event Beta",
      detail: "baseline event beta detail",
    });

    const getEventResult = await requestJsonWithAuth(baseUrl, "/api/novel/event/getEvent", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: novelProjectId,
        page: 1,
        limit: 10,
      }),
    });

    assert.equal(getEventResult.response.status, 200);
    assert.ok(getEventResult.json);
    assert.equal(getEventResult.json.code, 200);
    assert.equal(getEventResult.json.data.total, 2);
    assert.equal(getEventResult.json.data.list.length, 2);
    assert.ok(
      getEventResult.json.data.list.some(
        (item: { id?: number; eventName?: string; chapters?: number[] }) =>
          item.id === eventSmokeFirstLink.eventId &&
          item.eventName === "Baseline Event Alpha" &&
          Array.isArray(item.chapters) &&
          item.chapters.includes(1),
      ),
    );
    assert.ok(
      getEventResult.json.data.list.some(
        (item: { id?: number; eventName?: string; chapters?: number[] }) =>
          item.id === eventSmokeSecondLink.eventId &&
          item.eventName === "Baseline Event Beta" &&
          Array.isArray(item.chapters) &&
          item.chapters.includes(2),
      ),
    );

    const getEventSearchResult = await requestJsonWithAuth(baseUrl, "/api/novel/event/getEvent", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: novelProjectId,
        page: 1,
        limit: 10,
        search: "Alpha",
      }),
    });

    assert.equal(getEventSearchResult.response.status, 200);
    assert.ok(getEventSearchResult.json);
    assert.equal(getEventSearchResult.json.code, 200);
    assert.equal(getEventSearchResult.json.data.total, 1);
    assert.equal(getEventSearchResult.json.data.list[0].id, eventSmokeFirstLink.eventId);

    const deleteEventResult = await requestJsonWithAuth(baseUrl, "/api/novel/event/deletEvent", token, {
      method: "POST",
      body: JSON.stringify({
        id: eventSmokeFirstLink.eventId,
      }),
    });

    assert.equal(deleteEventResult.response.status, 200);
    assert.ok(deleteEventResult.json);
    assert.equal(deleteEventResult.json.code, 200);
    assert.equal(countRowsByColumn(dbPath, "o_event", "id", eventSmokeFirstLink.eventId), 0);
    assert.equal(countRowsByColumn(dbPath, "o_eventChapter", "eventId", eventSmokeFirstLink.eventId), 0);
    assert.equal(countRowsByColumn(dbPath, "o_event", "id", eventSmokeSecondLink.eventId), 1);

    const batchDeleteEventResult = await requestJsonWithAuth(baseUrl, "/api/novel/event/batchDeleteEvent", token, {
      method: "POST",
      body: JSON.stringify({
        ids: [eventSmokeSecondLink.eventId],
      }),
    });

    assert.equal(batchDeleteEventResult.response.status, 200);
    assert.ok(batchDeleteEventResult.json);
    assert.equal(batchDeleteEventResult.json.code, 200);
    assert.equal(countRowsByColumn(dbPath, "o_event", "id", eventSmokeSecondLink.eventId), 0);
    assert.equal(countRowsByColumn(dbPath, "o_eventChapter", "eventId", eventSmokeSecondLink.eventId), 0);

    const getEventAfterDeleteResult = await requestJsonWithAuth(baseUrl, "/api/novel/event/getEvent", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: novelProjectId,
        page: 1,
        limit: 10,
      }),
    });

    assert.equal(getEventAfterDeleteResult.response.status, 200);
    assert.ok(getEventAfterDeleteResult.json);
    assert.equal(getEventAfterDeleteResult.json.code, 200);
    assert.equal(getEventAfterDeleteResult.json.data.total, 0);
    assert.deepEqual(getEventAfterDeleteResult.json.data.list, []);

    const firstNovelEventLink = insertNovelEventLink(dbPath, {
      novelId: firstNovel.id,
      eventId: 910001,
      eventChapterId: 920001,
      name: "Baseline Novel Event 1",
    });
    const secondNovelEventLink = insertNovelEventLink(dbPath, {
      novelId: secondNovel.id,
      eventId: 910002,
      eventChapterId: 920002,
      name: "Baseline Novel Event 2",
    });

    assert.equal(countRowsByColumn(dbPath, "o_eventChapter", "novelId", firstNovel.id), 1);
    assert.equal(countRowsByColumn(dbPath, "o_event", "id", firstNovelEventLink.eventId), 1);
    assert.equal(countRowsByColumn(dbPath, "o_event", "id", secondNovelEventLink.eventId), 1);

    const deleteNovelResult = await requestJsonWithAuth(baseUrl, "/api/novel/delNovel", token, {
      method: "POST",
      body: JSON.stringify({
        id: firstNovel.id,
      }),
    });

    assert.equal(deleteNovelResult.response.status, 200);
    assert.ok(deleteNovelResult.json);
    assert.equal(deleteNovelResult.json.code, 200);
    assert.equal(countRowsByColumn(dbPath, "o_eventChapter", "novelId", firstNovel.id), 0);
    assert.equal(countRowsByColumn(dbPath, "o_event", "id", firstNovelEventLink.eventId), 0);
    assert.equal(countRowsByColumn(dbPath, "o_event", "id", secondNovelEventLink.eventId), 1);

    const novelDataAfterDeleteResult = await requestJsonWithAuth(baseUrl, "/api/novel/getNovelData", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: novelProjectId,
      }),
    });

    assert.equal(novelDataAfterDeleteResult.response.status, 200);
    assert.ok(novelDataAfterDeleteResult.json);
    assert.equal(novelDataAfterDeleteResult.json.code, 200);
    assert.equal(novelDataAfterDeleteResult.json.data.length, 1);
    assert.equal(novelDataAfterDeleteResult.json.data[0].id, secondNovel.id);

    const batchDeleteNovelEmptyResult = await requestJsonWithAuth(baseUrl, "/api/novel/batchDeleteNovel", token, {
      method: "POST",
      body: JSON.stringify({
        ids: [],
      }),
    });

    assert.equal(batchDeleteNovelEmptyResult.response.status, 400);
    assert.ok(batchDeleteNovelEmptyResult.json);
    assert.equal(batchDeleteNovelEmptyResult.json.code, 400);

    const batchDeleteNovelResult = await requestJsonWithAuth(baseUrl, "/api/novel/batchDeleteNovel", token, {
      method: "POST",
      body: JSON.stringify({
        ids: [secondNovel.id],
      }),
    });

    assert.equal(batchDeleteNovelResult.response.status, 200);
    assert.ok(batchDeleteNovelResult.json);
    assert.equal(batchDeleteNovelResult.json.code, 200);
    assert.equal(countRowsByColumn(dbPath, "o_eventChapter", "novelId", secondNovel.id), 0);
    assert.equal(countRowsByColumn(dbPath, "o_event", "id", secondNovelEventLink.eventId), 0);

    const novelDataAfterBatchDeleteResult = await requestJsonWithAuth(baseUrl, "/api/novel/getNovelData", token, {
      method: "POST",
      body: JSON.stringify({
        projectId: novelProjectId,
      }),
    });

    assert.equal(novelDataAfterBatchDeleteResult.response.status, 200);
    assert.ok(novelDataAfterBatchDeleteResult.json);
    assert.equal(novelDataAfterBatchDeleteResult.json.code, 200);
    assert.deepEqual(novelDataAfterBatchDeleteResult.json.data, []);
    console.log("PASS novel lifecycle smoke");

    const clearDataResult = await requestJsonWithAuth(baseUrl, "/api/setting/dbConfig/clearData", token, {
      method: "GET",
    });

    assert.equal(clearDataResult.response.status, 200);
    assert.ok(clearDataResult.json);
    assert.equal(clearDataResult.json.code, 200);

    const oldTokenAfterClearResult = await requestJsonWithAuth(baseUrl, "/api/setting/loginConfig/getUser", token, {
      method: "GET",
    });

    assert.equal(oldTokenAfterClearResult.response.status, 401);

    const updatedLoginAfterClearResult = await requestJson(baseUrl, "/api/login/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: updatedLoginName,
        password: updatedLoginPassword,
      }),
    });

    assert.equal(updatedLoginAfterClearResult.response.status, 400);

    token = await login(baseUrl);

    const defaultUserAfterClearResult = await requestJsonWithAuth(baseUrl, "/api/setting/loginConfig/getUser", token, {
      method: "GET",
    });

    assert.equal(defaultUserAfterClearResult.response.status, 200);
    assert.ok(defaultUserAfterClearResult.json);
    assert.equal(defaultUserAfterClearResult.json.code, 200);
    assert.equal(defaultUserAfterClearResult.json.data.id, 1);
    assert.equal(defaultUserAfterClearResult.json.data.name, "admin");

    const switchAfterClearResult = await requestJsonWithAuth(baseUrl, "/api/setting/dev/getSwitchAiDevTool", token, {
      method: "GET",
    });

    assert.equal(switchAfterClearResult.response.status, 200);
    assert.ok(switchAfterClearResult.json);
    assert.equal(switchAfterClearResult.json.code, 200);
    assert.equal(switchAfterClearResult.json.data, "0");

    const memoryAfterClearResult = await requestJsonWithAuth(baseUrl, "/api/setting/memoryConfig/getMemory", token, {
      method: "GET",
    });

    assert.equal(memoryAfterClearResult.response.status, 200);
    assert.ok(memoryAfterClearResult.json);
    assert.equal(memoryAfterClearResult.json.code, 200);
    assert.equal(memoryAfterClearResult.json.data.messagesPerSummary, 10);
    assert.equal(memoryAfterClearResult.json.data.shortTermLimit, 5);
    assert.equal(memoryAfterClearResult.json.data.summaryMaxLength, 500);
    assert.equal(memoryAfterClearResult.json.data.summaryLimit, 10);
    assert.equal(memoryAfterClearResult.json.data.ragLimit, 3);
    assert.equal(memoryAfterClearResult.json.data.deepRetrieveSummaryLimit, 5);
    assert.deepEqual(memoryAfterClearResult.json.data.modelOnnxFile, ["all-MiniLM-L6-v2", "onnx", "model_fp16.onnx"]);
    assert.equal(memoryAfterClearResult.json.data.modelDtype, "fp16");
    assert.equal(countMemories(dbPath), 0);

    const projectListAfterClearResult = await requestJsonWithAuth(baseUrl, "/api/project/getProject", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(projectListAfterClearResult.response.status, 200);
    assert.ok(projectListAfterClearResult.json);
    assert.equal(projectListAfterClearResult.json.code, 200);
    assert.ok(Array.isArray(projectListAfterClearResult.json.data));
    assert.equal(projectListAfterClearResult.json.data.length, 0);
    console.log("PASS setting dbConfig clearData smoke");
  } finally {
    if (closeDownloadServer) {
      await closeDownloadServer();
    }

    if (cleanupDownloadFixture) {
      cleanupDownloadFixture();
    }

    if (closeCodeServer) {
      await closeCodeServer();
    }

    if (closeUpdateTextServer) {
      await closeUpdateTextServer();
    }

    if (closeUpdateServer) {
      await closeUpdateServer();
    }

    if (closeServe) {
      await closeServe();
    }

    process.chdir(originalCwd);

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalSkipEmbedding === undefined) {
      delete process.env.TOONFLOW_SKIP_EMBEDDING;
    } else {
      process.env.TOONFLOW_SKIP_EMBEDDING = originalSkipEmbedding;
    }

    if (originalMockVendorTest === undefined) {
      delete process.env.TOONFLOW_MOCK_VENDOR_TEST;
    } else {
      process.env.TOONFLOW_MOCK_VENDOR_TEST = originalMockVendorTest;
    }

    if (originalMockCleanNovel === undefined) {
      delete process.env.TOONFLOW_MOCK_CLEAN_NOVEL;
    } else {
      process.env.TOONFLOW_MOCK_CLEAN_NOVEL = originalMockCleanNovel;
    }

    if (originalMockAgentSetKey === undefined) {
      delete process.env.TOONFLOW_MOCK_AGENT_SET_KEY;
    } else {
      process.env.TOONFLOW_MOCK_AGENT_SET_KEY = originalMockAgentSetKey;
    }

    if (originalForceElectron === undefined) {
      delete process.env.TOONFLOW_FORCE_ELECTRON;
    } else {
      process.env.TOONFLOW_FORCE_ELECTRON = originalForceElectron;
    }

    if (originalMockOpenFolder === undefined) {
      delete process.env.TOONFLOW_MOCK_OPEN_FOLDER;
    } else {
      process.env.TOONFLOW_MOCK_OPEN_FOLDER = originalMockOpenFolder;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

void main()
  .then(() => {
    console.log("Baseline API smoke passed");
    setTimeout(() => process.exit(0), 250);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
