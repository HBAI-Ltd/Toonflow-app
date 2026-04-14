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
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "toonflow-built-smoke-"));
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
            id: "legacy-memory-built",
            isolationKey: "legacy:built",
            type: "message",
            role: "user",
            content: "built legacy memory",
            createTime: Date.now() - 10_000,
          });
      } finally {
        legacyDb.close();
      }
    }

    process.env.NODE_ENV = "prod";
    process.env.TOONFLOW_SKIP_EMBEDDING = "1";
    process.env.TOONFLOW_MOCK_VENDOR_TEST = "1";
    process.env.TOONFLOW_MOCK_CLEAN_NOVEL = "1";
    process.chdir(tempRoot);

    const skillRelativePath = "built/skill.md";
    const skillFilePath = path.join(tempRoot, "data", "skills", "built", "skill.md");
    const initialSkillContent = "# Built Skill\n\ninitial content\n";
    const updatedSkillContent = "# Built Skill\n\nupdated content\n";
    fs.mkdirSync(path.dirname(skillFilePath), { recursive: true });
    fs.writeFileSync(skillFilePath, initialSkillContent, "utf-8");

    const appModule = require(path.join(repoRoot, "data", "serve", "app.js"));
    const appExports = resolveAppModuleExports(appModule);
    const port = await appExports.default(true);
    const baseUrl = `http://127.0.0.1:${port}`;
    const updatedLoginName = "built-admin";
    const updatedLoginPassword = "built-pass-123";
    const downloadVersion = "9.9.9-built";
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
            { type: "windows", url: "https://downloads.example/windows-installer.exe" },
            { type: "macos", url: "https://downloads.example/macos-installer.dmg" },
            { type: "linux", url: "https://downloads.example/linux-installer.AppImage" },
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
    const patchNoZipPayload = createUpdatePayload(patchVersion, { includeZip: false });
    const patchMissingZipUrlPayload = createPayloadWithMissingDownloadUrl(patchPayload, "zip");
    const majorMissingInstallerUrlPayload = createPayloadWithMissingDownloadUrl(
      createUpdatePayload(majorVersion),
      currentPlatformInstallerType,
    );
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
      "/patch-no-zip.json": patchNoZipPayload,
      "/patch-missing-zip-url.json": patchMissingZipUrlPayload,
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
      '  id: "built-link-vendor",',
      '  name: "Built Link Vendor",',
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
    console.log("BUILT_LEGACY_DB_MIGRATION_OK");
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

    const downloadAppResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/downloadApp", token, {
      method: "POST",
      body: JSON.stringify({
        url: "https://downloads.example/manual-installer.exe",
        reinstall: true,
        version: downloadVersion,
      }),
    });

    assert.equal(downloadAppResult.response.status, 200);
    assert.ok(downloadAppResult.json);
    assert.equal(downloadAppResult.json.code, 200);
    assert.ok(typeof downloadAppResult.json.data === "string" && downloadAppResult.json.data.length > 0);
    assert.equal(fs.readFileSync(serveMarkerPath, "utf-8"), "serve-before-download");
    assert.equal(fs.readFileSync(webIndexPath, "utf-8"), "<html>before download</html>");
    assert.equal(fs.readFileSync(downloadedSkillPath, "utf-8"), "# Before Download Skill\n");
    assert.equal(fs.readFileSync(downloadedModelPath, "utf-8"), "model-before-download");
    assert.ok(!fs.existsSync(path.join(tempRoot, "data", "temp")));

    const failedIncrementalDownloadResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/downloadApp", token, {
      method: "POST",
      body: JSON.stringify({
        url: `${unavailableDownloadBaseUrl}/update.zip`,
        reinstall: false,
        version: downloadVersion,
      }),
    });

    assert.equal(failedIncrementalDownloadResult.response.status, 400);
    assert.ok(failedIncrementalDownloadResult.json);
    assert.equal(failedIncrementalDownloadResult.json.code, 400);
    assert.equal(failedIncrementalDownloadResult.json.data, null);
    assert.equal(fs.readFileSync(serveMarkerPath, "utf-8"), "serve-before-download");
    assert.equal(fs.readFileSync(webIndexPath, "utf-8"), "<html>before download</html>");
    assert.equal(fs.readFileSync(downloadedSkillPath, "utf-8"), "# Before Download Skill\n");
    assert.equal(fs.readFileSync(downloadedModelPath, "utf-8"), "model-before-download");
    assert.ok(!fs.existsSync(path.join(tempRoot, "data", "temp")));

    const invalidZipDownloadResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/downloadApp", token, {
      method: "POST",
      body: JSON.stringify({
        url: `${downloadServer.baseUrl}/invalid.zip`,
        reinstall: false,
        version: downloadVersion,
      }),
    });

    assert.equal(invalidZipDownloadResult.response.status, 400);
    assert.ok(invalidZipDownloadResult.json);
    assert.equal(invalidZipDownloadResult.json.code, 400);
    assert.equal(invalidZipDownloadResult.json.data, null);
    assert.equal(fs.readFileSync(serveMarkerPath, "utf-8"), "serve-before-download");
    assert.equal(fs.readFileSync(webIndexPath, "utf-8"), "<html>before download</html>");
    assert.equal(fs.readFileSync(downloadedSkillPath, "utf-8"), "# Before Download Skill\n");
    assert.equal(fs.readFileSync(downloadedModelPath, "utf-8"), "model-before-download");
    assert.ok(!fs.existsSync(path.join(tempRoot, "data", "temp")));

    const webDirPath = path.dirname(webIndexPath);
    fs.rmSync(webDirPath, { recursive: true, force: true });
    fs.writeFileSync(webDirPath, "web-target-locked", "utf-8");

    const partialRollbackDownloadResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/downloadApp", token, {
      method: "POST",
      body: JSON.stringify({
        url: `${downloadServer.baseUrl}/update.zip`,
        reinstall: false,
        version: downloadVersion,
      }),
    });

    assert.equal(partialRollbackDownloadResult.response.status, 400);
    assert.ok(partialRollbackDownloadResult.json);
    assert.equal(partialRollbackDownloadResult.json.code, 400);
    assert.equal(partialRollbackDownloadResult.json.data, null);
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

    const copyFailureDownloadResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/downloadApp", token, {
      method: "POST",
      body: JSON.stringify({
        url: `${downloadServer.baseUrl}/update.zip`,
        reinstall: false,
        version: downloadVersion,
      }),
    });

    assert.equal(copyFailureDownloadResult.response.status, 400);
    assert.ok(copyFailureDownloadResult.json);
    assert.equal(copyFailureDownloadResult.json.code, 400);
    assert.equal(copyFailureDownloadResult.json.data, null);
    assert.equal(fs.readFileSync(serveDirPath, "utf-8"), "serve-target-locked");
    assert.equal(fs.readFileSync(webIndexPath, "utf-8"), "<html>before download</html>");
    assert.equal(fs.readFileSync(downloadedSkillPath, "utf-8"), "# Before Download Skill\n");
    assert.equal(fs.readFileSync(downloadedModelPath, "utf-8"), "model-before-download");
    assert.ok(!fs.existsSync(path.join(tempRoot, "data", "temp")));

    fs.rmSync(serveDirPath, { recursive: true, force: true });
    fs.mkdirSync(serveDirPath, { recursive: true });
    fs.writeFileSync(serveMarkerPath, "serve-before-download", "utf-8");

    const incrementalDownloadAppResult = await requestJsonWithAuth(baseUrl, "/api/setting/about/downloadApp", token, {
      method: "POST",
      body: JSON.stringify({
        url: `${downloadServer.baseUrl}/update.zip`,
        reinstall: false,
        version: downloadVersion,
      }),
    });

    assert.equal(incrementalDownloadAppResult.response.status, 200);
    assert.ok(incrementalDownloadAppResult.json);
    assert.equal(incrementalDownloadAppResult.json.code, 200);
    assert.ok((incrementalDownloadAppResult.json.data as string).includes(downloadVersion));
    assert.equal(fs.readFileSync(serveMarkerPath, "utf-8"), "serve-after-download");
    assert.equal(fs.readFileSync(webIndexPath, "utf-8"), "<html><body>after download</body></html>");
    assert.equal(fs.readFileSync(downloadedSkillPath, "utf-8"), "# After Download Skill\n");
    assert.equal(fs.readFileSync(downloadedModelPath, "utf-8"), "model-after-download");
    assert.ok(!fs.existsSync(path.join(tempRoot, "data", "temp")));

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
    delete process.env.TOONFLOW_FORCE_ELECTRON;
    delete process.env.TOONFLOW_MOCK_OPEN_FOLDER;

    const promptResult = await requestJsonWithAuth(baseUrl, "/api/setting/promptManage/getPrompt", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(promptResult.response.status, 200);
    assert.ok(promptResult.json);
    assert.equal(promptResult.json.code, 200);
    assert.ok(Array.isArray(promptResult.json.data));
    assert.ok(promptResult.json.data.length > 0);
    const promptToUpdate = promptResult.json.data[0] as { id: number; data: string };
    const updatedPromptData = `${promptToUpdate.data}\n\n[built prompt updated]`;

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

    const agentDeployResult = await requestJsonWithAuth(baseUrl, "/api/setting/agentDeploy/getAgentDeploy", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(agentDeployResult.response.status, 200);
    assert.ok(agentDeployResult.json);
    assert.equal(agentDeployResult.json.code, 200);
    const agentDeployRows = normalizeAgentDeployRows(agentDeployResult.json.data);
    const scriptAgent = agentDeployRows.find((item: { key?: string }) => item.key === "scriptAgent") as {
      id: number;
    };
    assert.ok(scriptAgent);

    const deployAgentModelResult = await requestJsonWithAuth(baseUrl, "/api/setting/agentDeploy/deployAgentModel", token, {
      method: "POST",
      body: JSON.stringify({
        id: scriptAgent.id,
        name: "剧本Agent-built",
        model: "GPT-4.1 mini",
        modelName: "openai:gpt-4.1-mini",
        vendorId: "openai",
        desc: "built deployed model",
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
      (item: { id?: number; name?: string; model?: string; modelName?: string; vendorId?: string; desc?: string }) =>
        item.id === scriptAgent.id,
    );
    assert.ok(updatedScriptAgent);
    assert.equal(updatedScriptAgent.name, "剧本Agent-built");
    assert.equal(updatedScriptAgent.model, "GPT-4.1 mini");
    assert.equal(updatedScriptAgent.modelName, "openai:gpt-4.1-mini");
    assert.equal(updatedScriptAgent.vendorId, "openai");
    assert.equal(updatedScriptAgent.desc, "built deployed model");

    process.env.TOONFLOW_MOCK_AGENT_SET_KEY = "success";

    const agentSetKeySuccessResult = await requestJsonWithAuth(baseUrl, "/api/setting/agentDeploy/agentSetKey", token, {
      method: "POST",
      body: JSON.stringify({
        key: "tf-built-success-key",
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
    assert.equal(scriptAgentAfterSetKey.modelName, "toonflow:claude-sonnet-4-6");
    assert.equal(productionAgentAfterSetKey.vendorId, "toonflow");
    assert.equal(productionAgentAfterSetKey.modelName, "toonflow:claude-sonnet-4-6");
    assert.equal(universalAiAfterSetKey.vendorId, "toonflow");
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
    assert.equal(toonflowVendorAfterSetKey.inputValues.apiKey, "tf-built-success-key");
    delete process.env.TOONFLOW_MOCK_AGENT_SET_KEY;

    const memoryInitialResult = await requestJsonWithAuth(baseUrl, "/api/setting/memoryConfig/getMemory", token, {
      method: "GET",
    });

    assert.equal(memoryInitialResult.response.status, 200);
    assert.ok(memoryInitialResult.json);
    assert.equal(memoryInitialResult.json.code, 200);
    assert.equal(memoryInitialResult.json.data.messagesPerSummary, 10);
    assert.deepEqual(memoryInitialResult.json.data.modelOnnxFile, ["all-MiniLM-L6-v2", "onnx", "model_fp16.onnx"]);

    const updateMemoryResult = await requestJsonWithAuth(baseUrl, "/api/setting/memoryConfig/sureMemory", token, {
      method: "POST",
      body: JSON.stringify({
        messagesPerSummary: 14,
        shortTermLimit: 8,
        summaryMaxLength: 650,
        summaryLimit: 12,
        ragLimit: 5,
        deepRetrieveSummaryLimit: 7,
        modelOnnxFile: ["built-model", "onnx", "model_q8.onnx"],
        modelDtype: "q8",
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
    assert.equal(memoryUpdatedResult.json.data.messagesPerSummary, 14);
    assert.equal(memoryUpdatedResult.json.data.shortTermLimit, 8);
    assert.equal(memoryUpdatedResult.json.data.summaryMaxLength, 650);
    assert.equal(memoryUpdatedResult.json.data.summaryLimit, 12);
    assert.equal(memoryUpdatedResult.json.data.ragLimit, 5);
    assert.equal(memoryUpdatedResult.json.data.deepRetrieveSummaryLimit, 7);
    assert.deepEqual(memoryUpdatedResult.json.data.modelOnnxFile, ["built-model", "onnx", "model_q8.onnx"]);
    assert.equal(memoryUpdatedResult.json.data.modelDtype, "q8");

    insertMemoryRow(dbPath, {
      content: "built memory before cleanup",
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

    const transcriptProjectId = 9101;
    const transcriptScopeKey = `${transcriptProjectId}:scriptAgent`;
    const transcriptUserTime = Date.now() - 4_000;
    const transcriptAssistantTime = transcriptUserTime + 1_000;
    insertConversationMessageRow(dbPath, {
      id: "built-transcript-user",
      scopeKey: transcriptScopeKey,
      projectId: transcriptProjectId,
      agentType: "scriptAgent",
      createTime: transcriptUserTime,
      updateTime: transcriptUserTime,
      messageJson: JSON.stringify({
        id: "built-transcript-user",
        role: "user",
        status: "complete",
        datetime: new Date(transcriptUserTime).toISOString(),
        content: [{ id: "built-user-text", type: "text", status: "complete", data: "继续生成" }],
      }),
    });
    insertConversationMessageRow(dbPath, {
      id: "built-transcript-assistant",
      scopeKey: transcriptScopeKey,
      projectId: transcriptProjectId,
      agentType: "scriptAgent",
      createTime: transcriptAssistantTime,
      updateTime: transcriptAssistantTime,
      messageJson: JSON.stringify({
        id: "built-transcript-assistant",
        role: "assistant",
        status: "complete",
        datetime: new Date(transcriptAssistantTime).toISOString(),
        content: [
          { id: "built-assistant-text", type: "text", status: "complete", data: "已恢复 built 会话" },
          {
            id: "built-assistant-suggestion",
            type: "suggestion",
            status: "complete",
            data: [{ title: "继续", prompt: "继续执行计划" }],
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
    assert.equal(getConversationResult.json.data[0].id, "built-transcript-user");
    assert.equal(getConversationResult.json.data[1].content[1].data[0].prompt, "继续执行计划");

    const fallbackProjectId = 9102;
    const fallbackEpisodesId = 41;
    insertMemoryRow(dbPath, {
      id: "built-fallback-memory",
      isolationKey: `${fallbackProjectId}:productionAgent:${fallbackEpisodesId}`,
      role: "assistant:decision",
      content: "built legacy fallback history",
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
    assert.equal(fallbackConversationResult.json.data[0].content[0].data, "built legacy fallback history");

    const clearProjectId = 9103;
    const clearEpisodesId = 22;
    insertMemoryRow(dbPath, {
      id: "built-clear-memory-target",
      isolationKey: `${clearProjectId}:productionAgent:${clearEpisodesId}`,
      content: "clear me",
      createTime: Date.now() - 1_000,
    });
    insertMemoryRow(dbPath, {
      id: "built-clear-memory-keep",
      isolationKey: `${clearProjectId}:productionAgent:${clearEpisodesId + 1}`,
      content: "keep me",
      createTime: Date.now(),
    });
    insertConversationMessageRow(dbPath, {
      id: "built-clear-conversation-target",
      scopeKey: `${clearProjectId}:productionAgent:${clearEpisodesId}`,
      projectId: clearProjectId,
      episodesId: clearEpisodesId,
      agentType: "productionAgent",
    });
    insertConversationMessageRow(dbPath, {
      id: "built-clear-conversation-keep",
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
    console.log("BUILT_CONVERSATION_TRANSCRIPT_SMOKE_OK");

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

    const vendorId = `built-vendor-${Date.now()}`;
    const vendorFilePath = path.join(tempRoot, "data", "vendor", `${vendorId}.ts`);
    const initialModelName = "built-model-v1";
    const updatedModelName = "built-model-v2";

    const invalidVendorId = `built-invalid-vendor-${Date.now()}`;
    const invalidVendorFilePath = path.join(tempRoot, "data", "vendor", `${invalidVendorId}.ts`);
    const invalidAddVendorResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/addVendor", token, {
      method: "POST",
      body: JSON.stringify({
        tsCode: createVendorTsCode(invalidVendorId, {
          name: "Built Invalid Vendor",
          description: "Built invalid vendor",
          inputValues: {
            apiKey: "sk-built-invalid",
            baseUrl: "https://built.invalid.example/v1",
          },
          modelName: "built-invalid-model",
          modelLabel: "Built Invalid Model",
        }).replace('"author": "baseline-test",', '"author": 123,'),
      }),
    });

    assert.equal(invalidAddVendorResult.response.status, 400);
    assert.ok(invalidAddVendorResult.json);
    assert.equal(invalidAddVendorResult.json.code, 400);
    assert.ok(typeof invalidAddVendorResult.json.message === "string" && invalidAddVendorResult.json.message.includes("author"));
    assert.ok(!fs.existsSync(invalidVendorFilePath));

    const missingExportVendorId = `built-missing-export-${Date.now()}`;
    const missingExportVendorFilePath = path.join(tempRoot, "data", "vendor", `${missingExportVendorId}.ts`);
    const missingExportAddVendorResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/addVendor", token, {
      method: "POST",
      body: JSON.stringify({
        tsCode: createVendorTsCode(missingExportVendorId, {
          name: "Built Missing Export Vendor",
          description: "Built missing export vendor",
          inputValues: {
            apiKey: "sk-built-missing-export",
            baseUrl: "https://built.missing-export.example/v1",
          },
          modelName: "built-missing-export-model",
          modelLabel: "Built Missing Export Model",
        }).replace("exports.textRequest = textRequest;\n", ""),
      }),
    });

    assert.equal(missingExportAddVendorResult.response.status, 400);
    assert.ok(missingExportAddVendorResult.json);
    assert.equal(missingExportAddVendorResult.json.code, 200);
    assert.ok(typeof missingExportAddVendorResult.json.data === "string" && missingExportAddVendorResult.json.data.length > 0);
    assert.ok(!fs.existsSync(missingExportVendorFilePath));

    const colonVendorId = `built:colon-${Date.now()}`;
    const colonVendorFilePath = path.join(tempRoot, "data", "vendor", `${colonVendorId}.ts`);
    const colonAddVendorResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/addVendor", token, {
      method: "POST",
      body: JSON.stringify({
        tsCode: createVendorTsCode(colonVendorId, {
          name: "Built Colon Vendor",
          description: "Built colon vendor",
          inputValues: {
            apiKey: "sk-built-colon",
            baseUrl: "https://built.colon.example/v1",
          },
          modelName: "built-colon-model",
          modelLabel: "Built Colon Model",
        }),
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

    const addVendorResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/addVendor", token, {
      method: "POST",
      body: JSON.stringify({
        tsCode: createVendorTsCode(vendorId, {
          name: "Built Smoke Vendor",
          description: "Built smoke initial",
          inputValues: {
            apiKey: "sk-built-initial",
            baseUrl: "https://built.initial.example/v1",
          },
          modelName: initialModelName,
          modelLabel: "Built Model V1",
        }),
      }),
    });

    assert.equal(addVendorResult.response.status, 200);
    assert.ok(addVendorResult.json);
    assert.equal(addVendorResult.json.code, 200);
    assert.equal(addVendorResult.json.data.id, vendorId);
    assert.ok(fs.existsSync(vendorFilePath));

    const duplicateVendorCode = createVendorTsCode(vendorId, {
      name: "Built Smoke Vendor Duplicate",
      description: "Built smoke duplicate",
      inputValues: {
        apiKey: "sk-built-duplicate",
        baseUrl: "https://built.duplicate.example/v1",
      },
      modelName: "built-model-duplicate",
      modelLabel: "Built Model Duplicate",
    });
    const vendorFileBeforeDuplicateAdd = fs.readFileSync(vendorFilePath, "utf-8");

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
    assert.equal(fs.readFileSync(vendorFilePath, "utf-8"), vendorFileBeforeDuplicateAdd);

    const missingUpdateVendorId = `built-missing-update-${Date.now()}`;
    const missingUpdateVendorFilePath = path.join(tempRoot, "data", "vendor", `${missingUpdateVendorId}.ts`);
    const missingUpdateCodeResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/updateCode", token, {
      method: "POST",
      body: JSON.stringify({
        id: missingUpdateVendorId,
        tsCode: createVendorTsCode(missingUpdateVendorId, {
          name: "Built Missing Update Vendor",
          description: "Built missing update vendor",
          inputValues: {
            apiKey: "sk-built-missing-update",
            baseUrl: "https://built.missing-update.example/v1",
          },
          modelName: "built-missing-update",
          modelLabel: "Built Missing Update",
        }),
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

    const vendorFileBeforeMissingExportUpdate = fs.readFileSync(vendorFilePath, "utf-8");
    const missingExportUpdateCodeResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/updateCode", token, {
      method: "POST",
      body: JSON.stringify({
        id: vendorId,
        tsCode: createVendorTsCode(vendorId, {
          name: "Built Smoke Vendor Missing Export Update",
          description: "Built smoke missing export update",
          inputValues: {
            apiKey: "sk-built-missing-export-update",
            baseUrl: "https://built.missing-export-update.example/v1",
          },
          modelName: "built-missing-export-update",
          modelLabel: "Built Missing Export Update",
        }).replace("exports.textRequest = textRequest;\n", ""),
      }),
    });

    assert.equal(missingExportUpdateCodeResult.response.status, 400);
    assert.ok(missingExportUpdateCodeResult.json);
    assert.equal(missingExportUpdateCodeResult.json.code, 200);
    assert.ok(typeof missingExportUpdateCodeResult.json.data === "string" && missingExportUpdateCodeResult.json.data.length > 0);
    assert.equal(fs.readFileSync(vendorFilePath, "utf-8"), vendorFileBeforeMissingExportUpdate);

    const vendorFileBeforeInvalidUpdate = fs.readFileSync(vendorFilePath, "utf-8");
    const invalidUpdateCodeResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/updateCode", token, {
      method: "POST",
      body: JSON.stringify({
        id: vendorId,
        tsCode: createVendorTsCode(vendorId, {
          name: "Built Smoke Vendor Invalid Update",
          description: "Built smoke invalid update",
          inputValues: {
            apiKey: "sk-built-invalid-update",
            baseUrl: "https://built.invalid-update.example/v1",
          },
          modelName: "built-invalid-update",
          modelLabel: "Built Invalid Update",
        }).replace('"author": "baseline-test",', '"author": 456,'),
      }),
    });

    assert.equal(invalidUpdateCodeResult.response.status, 400);
    assert.ok(invalidUpdateCodeResult.json);
    assert.equal(invalidUpdateCodeResult.json.code, 400);
    assert.ok(typeof invalidUpdateCodeResult.json.message === "string" && invalidUpdateCodeResult.json.message.includes("author"));
    assert.equal(fs.readFileSync(vendorFilePath, "utf-8"), vendorFileBeforeInvalidUpdate);

    const vendorFileBeforeMismatchedUpdate = fs.readFileSync(vendorFilePath, "utf-8");
    const mismatchedVendorId = `${vendorId}-mismatch`;
    const mismatchedUpdateCodeResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/updateCode", token, {
      method: "POST",
      body: JSON.stringify({
        id: vendorId,
        tsCode: createVendorTsCode(mismatchedVendorId, {
          name: "Built Smoke Vendor Mismatched Update",
          description: "Built smoke mismatched update",
          inputValues: {
            apiKey: "sk-built-mismatch",
            baseUrl: "https://built.mismatch-update.example/v1",
          },
          modelName: "built-mismatch-update",
          modelLabel: "Built Mismatch Update",
        }),
      }),
    });

    assert.equal(mismatchedUpdateCodeResult.response.status, 400);
    assert.ok(mismatchedUpdateCodeResult.json);
    assert.equal(mismatchedUpdateCodeResult.json.code, 400);
    assert.ok(typeof mismatchedUpdateCodeResult.json.message === "string" && mismatchedUpdateCodeResult.json.message.length > 0);
    assert.equal(fs.readFileSync(vendorFilePath, "utf-8"), vendorFileBeforeMismatchedUpdate);

    const vendorListAfterMismatchedUpdateResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/getVendorList", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(vendorListAfterMismatchedUpdateResult.response.status, 200);
    assert.ok(vendorListAfterMismatchedUpdateResult.json);
    assert.equal(vendorListAfterMismatchedUpdateResult.json.code, 200);
    const vendorAfterMismatchedUpdate = vendorListAfterMismatchedUpdateResult.json.data.find(
      (item: {
        id?: string;
        name?: string;
        inputValues?: { apiKey?: string; baseUrl?: string };
        models?: Array<{ modelName?: string; name?: string }>;
      }) => item.id === vendorId,
    );
    assert.ok(vendorAfterMismatchedUpdate);
    assert.equal(vendorAfterMismatchedUpdate.name, "Built Smoke Vendor");
    assert.equal(vendorAfterMismatchedUpdate.inputValues.apiKey, "sk-built-initial");
    assert.equal(vendorAfterMismatchedUpdate.inputValues.baseUrl, "https://built.initial.example/v1");
    assert.ok(
      vendorAfterMismatchedUpdate.models?.some(
        (item: { modelName?: string; name?: string }) =>
          item.modelName === initialModelName && item.name === "Built Model V1",
      ),
    );

    const updateCodeResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/updateCode", token, {
      method: "POST",
      body: JSON.stringify({
        id: vendorId,
        tsCode: createVendorTsCode(vendorId, {
          name: "Built Smoke Vendor Updated",
          description: "Built smoke updated",
          inputValues: {
            apiKey: "sk-built-updated",
            baseUrl: "https://built.updated.example/v1",
          },
          modelName: updatedModelName,
          modelLabel: "Built Model V2",
        }),
      }),
    });

    assert.equal(updateCodeResult.response.status, 200);
    assert.ok(updateCodeResult.json);
    assert.equal(updateCodeResult.json.code, 200);

    const enableVendorResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/enableVendor", token, {
      method: "POST",
      body: JSON.stringify({
        id: vendorId,
        enable: 1,
      }),
    });

    assert.equal(enableVendorResult.response.status, 200);
    assert.ok(enableVendorResult.json);
    assert.equal(enableVendorResult.json.code, 200);

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
    const builtModelListEntry = modelListResult.json.data.find(
      (item: { id?: string; label?: string; value?: string; type?: string; name?: string }) =>
        item.id === vendorId && item.value === updatedModelName,
    ) as
      | {
          id: string;
          label: string;
          value: string;
          type: string;
          name: string;
        }
      | undefined;
    assert.ok(builtModelListEntry);
    assert.equal(builtModelListEntry.label, "Built Model V2");
    assert.equal(builtModelListEntry.type, "text");
    assert.equal(builtModelListEntry.name, "Built Smoke Vendor Updated");

    const modelDetailResult = await requestJsonWithAuth(baseUrl, "/api/modelSelect/getModelDetail", token, {
      method: "POST",
      body: JSON.stringify({
        modelId: `${vendorId}:${updatedModelName}`,
      }),
    });

    assert.equal(modelDetailResult.response.status, 200);
    assert.ok(modelDetailResult.json);
    assert.equal(modelDetailResult.json.code, 200);
    assert.equal(modelDetailResult.json.data.modelName, updatedModelName);
    assert.equal(modelDetailResult.json.data.name, "Built Model V2");
    assert.equal(modelDetailResult.json.data.type, "text");
    assert.equal(modelDetailResult.json.data.think, false);

    const modelTestResult = await requestJsonWithAuth(baseUrl, "/api/setting/vendorConfig/modelTest", token, {
      method: "POST",
      body: JSON.stringify({
        id: vendorId,
        modelName: updatedModelName,
        type: "text",
      }),
    });

    assert.equal(modelTestResult.response.status, 200);
    assert.ok(modelTestResult.json);
    assert.equal(modelTestResult.json.code, 200);
    assert.equal(modelTestResult.json.data, `[mock vendor test] ${vendorId}:${updatedModelName}:text`);

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
        id: vendorId,
      }),
    });

    assert.equal(deleteVendorResult.response.status, 200);
    assert.ok(deleteVendorResult.json);
    assert.equal(deleteVendorResult.json.code, 200);
    assert.ok(!fs.existsSync(vendorFilePath));

    const initialArtStyleImageDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp3cAAAAASUVORK5CYII=";
    const updatedArtStyleImageDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mNk+M/wHwAEAQH/cetH5QAAAABJRU5ErkJggg==";
    const artStyleName = `built-art-style-${Date.now()}`;
    const updatedArtStyleName = `${artStyleName}-updated`;
    const artStylePrompt = "built art style prompt";
    const updatedArtStylePrompt = "built art style prompt updated";

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

    const initialVisualManualImageDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp3cAAAAASUVORK5CYII=";
    const updatedVisualManualImageDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mNk+M/wHwAEAQH/cetH5QAAAABJRU5ErkJggg==";
    const visualManualSlug = `built_visual_manual_${Date.now()}`;
    const visualManualName = `built-visual-manual-${Date.now()}`;
    const updatedVisualManualName = `${visualManualName}-updated`;
    const invalidVisualManualSlug = `${visualManualSlug}_invalid`;
    const visualManualReadme = "built visual manual readme";
    const visualManualPrefix = "built visual manual prefix";
    const visualManualCharacter = "built visual manual character";
    const visualManualCharacterDerivative = "built visual manual character derivative";
    const visualManualProp = "built visual manual prop";
    const visualManualPropDerivative = "built visual manual prop derivative";
    const visualManualScene = "built visual manual scene";
    const visualManualSceneDerivative = "built visual manual scene derivative";
    const visualManualDirectorStoryboard = "built visual manual director storyboard";
    const visualManualStoryboardVideo = "built visual manual storyboard video";
    const visualManualPlanningStyle = "built visual manual planning style";
    const visualManualStoryboardTableStyle = "built visual manual storyboard table style";
    const updatedVisualManualReadme = "built visual manual readme updated";
    const updatedVisualManualPrefix = "built visual manual prefix updated";
    const updatedVisualManualCharacter = "built visual manual character updated";
    const updatedVisualManualCharacterDerivative = "built visual manual character derivative updated";
    const updatedVisualManualProp = "built visual manual prop updated";
    const updatedVisualManualPropDerivative = "built visual manual prop derivative updated";
    const updatedVisualManualScene = "built visual manual scene updated";
    const updatedVisualManualSceneDerivative = "built visual manual scene derivative updated";
    const updatedVisualManualDirectorStoryboard = "built visual manual director storyboard updated";
    const updatedVisualManualStoryboardVideo = "built visual manual storyboard video updated";
    const updatedVisualManualPlanningStyle = "built visual manual planning style updated";
    const updatedVisualManualStoryboardTableStyle = "built visual manual storyboard table style updated";

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

    const initialDirectorManualImageDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp3cAAAAASUVORK5CYII=";
    const updatedDirectorManualImageDataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mNk+M/wHwAEAQH/cetH5QAAAABJRU5ErkJggg==";
    const directorManualSlug = `built_director_manual_${Date.now()}`;
    const directorManualName = `built-director-manual-${Date.now()}`;
    const updatedDirectorManualName = `${directorManualName}-updated`;
    const directorManualReadme = "built director manual readme";
    const directorManualPlanning = "built director manual planning";
    const directorManualStoryboard = "built director manual storyboard";
    const updatedDirectorManualReadme = "built director manual readme updated";
    const updatedDirectorManualPlanning = "built director manual planning updated";
    const updatedDirectorManualStoryboard = "built director manual storyboard updated";
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

    const taskProjectAName = `built-task-project-a-${Date.now()}`;
    const taskProjectBName = `built-task-project-b-${Date.now()}`;

    const createTaskProjectAResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: taskProjectAName,
        intro: "built task project a",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "built-task-image-model-a",
        videoModel: "built-task-video-model-a",
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
        intro: "built task project b",
        type: "adaptation",
        artStyle: "default",
        directorManual: "",
        videoRatio: "16:9",
        imageModel: "built-task-image-model-b",
        videoModel: "built-task-video-model-b",
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
      id: 820001,
      projectId: taskProjectA.id,
      taskClass: "built-render",
      model: "built-task-model-a",
      describe: "built pending task detail",
      state: "pending",
      reason: "built-pending",
    });
    const doneTask = insertTaskRow(dbPath, {
      id: 820002,
      projectId: taskProjectB.id,
      taskClass: "built-cleanup",
      model: "built-task-model-b",
      describe: "built done task detail",
      state: "done",
      reason: "built-done",
    });

    const taskProjectListResult = await requestJsonWithAuth(baseUrl, "/api/task/getProject", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(taskProjectListResult.response.status, 200);
    assert.ok(taskProjectListResult.json);
    assert.equal(taskProjectListResult.json.code, 200);
    assert.ok(
      taskProjectListResult.json.data.some(
        (item: { id?: number; name?: string }) => item.id === taskProjectA.id && item.name === taskProjectAName,
      ),
    );
    assert.ok(
      taskProjectListResult.json.data.some(
        (item: { id?: number; name?: string }) => item.id === taskProjectB.id && item.name === taskProjectBName,
      ),
    );

    const taskCategoriesResult = await requestJsonWithAuth(baseUrl, "/api/task/getTaskCategories", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(taskCategoriesResult.response.status, 200);
    assert.ok(taskCategoriesResult.json);
    assert.equal(taskCategoriesResult.json.code, 200);
    assert.ok(taskCategoriesResult.json.data.some((item: { taskClass?: string }) => item.taskClass === "built-render"));
    assert.ok(taskCategoriesResult.json.data.some((item: { taskClass?: string }) => item.taskClass === "built-cleanup"));

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
          item.taskClass === "built-render" &&
          item.describe === "built pending task detail" &&
          item.state === "pending" &&
          item.projectId === taskProjectA.id &&
          item.name === taskProjectAName,
      ),
    );
    assert.ok(
      allTasksResult.json.data.data.some(
        (item: { taskClass?: string; describe?: string; state?: string; projectId?: number; name?: string }) =>
          item.taskClass === "built-cleanup" &&
          item.describe === "built done task detail" &&
          item.state === "done" &&
          item.projectId === taskProjectB.id &&
          item.name === taskProjectBName,
      ),
    );

    const filteredTaskClassResult = await requestJsonWithAuth(baseUrl, "/api/task/getTaskApi", token, {
      method: "POST",
      body: JSON.stringify({
        taskClass: "built-render",
        page: 1,
        limit: 10,
      }),
    });

    assert.equal(filteredTaskClassResult.response.status, 200);
    assert.ok(filteredTaskClassResult.json);
    assert.equal(filteredTaskClassResult.json.code, 200);
    assert.equal(Number(filteredTaskClassResult.json.data.total), 1);
    assert.equal(filteredTaskClassResult.json.data.data[0].taskClass, "built-render");

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
    assert.equal(filteredStateAndProjectResult.json.data.data[0].taskClass, "built-cleanup");
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
    assert.equal(taskDetailsResult.json.data.taskClass, "built-render");
    assert.equal(taskDetailsResult.json.data.describe, "built pending task detail");
    assert.equal(taskDetailsResult.json.data.state, "pending");
    assert.equal(taskDetailsResult.json.data.projectId, taskProjectA.id);
    assert.equal(doneTask.taskId, 820002);

    const projectName = `built-project-${Date.now()}`;
    const createProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: projectName,
        intro: "built project lifecycle smoke",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "built-image-model",
        videoModel: "built-video-model",
        imageQuality: "standard",
        mode: "story",
      }),
    });

    assert.equal(createProjectResult.response.status, 200);
    assert.ok(createProjectResult.json);
    assert.equal(createProjectResult.json.code, 200);

    const projectListResult = await requestJsonWithAuth(baseUrl, "/api/project/getProject", token, {
      method: "POST",
      body: JSON.stringify({}),
    });

    assert.equal(projectListResult.response.status, 200);
    assert.ok(projectListResult.json);
    assert.equal(projectListResult.json.code, 200);
    const createdProject = projectListResult.json.data.find(
      (item: { id?: number; name?: string; projectType?: string }) => item.name === projectName,
    ) as { id: number; name: string; projectType: string } | undefined;
    assert.ok(createdProject);
    assert.equal(createdProject.projectType, "short-drama");
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
    assert.equal(singleProjectResult.json.data[0].name, projectName);

    const partialUpdateResult = await requestJsonWithAuth(baseUrl, "/api/general/updateProject", token, {
      method: "POST",
      body: JSON.stringify({
        id: projectId,
        intro: "built project intro updated",
      }),
    });

    assert.equal(partialUpdateResult.response.status, 200);
    assert.ok(partialUpdateResult.json);
    assert.equal(partialUpdateResult.json.code, 200);

    const editProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/editProject", token, {
      method: "POST",
      body: JSON.stringify({
        id: projectId,
        projectType: "feature",
        name: `${projectName}-edited`,
        intro: "built project fully edited",
        type: "adaptation",
        artStyle: "cinematic",
        directorManual: "built director manual",
        videoRatio: "16:9",
        imageModel: "built-image-model-v2",
        videoModel: "built-video-model-v2",
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
    assert.equal(singleProjectAfterEditResult.json.data[0].projectType, "feature");
    assert.equal(singleProjectAfterEditResult.json.data[0].videoRatio, "16:9");

    insertProjectScopedRows(dbPath, projectId);
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

    const generalStatsProjectName = `built-general-stats-project-${Date.now()}`;
    const createGeneralStatsProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: generalStatsProjectName,
        intro: "built general statistics project",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "built-general-stats-image-model",
        videoModel: "built-general-stats-video-model",
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

    const generalStatsRoleName = `built-general-role-${Date.now()}`;
    const addGeneralStatsAssetResult = await requestJsonWithAuth(baseUrl, "/api/assets/addAssets", token, {
      method: "POST",
      body: JSON.stringify({
        name: generalStatsRoleName,
        describe: "built general statistics role",
        type: "role",
        projectId: generalStatsProjectId,
        remark: "built general statistics role remark",
        prompt: "built general statistics role prompt",
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

    const generalStatsScriptName = `built-general-script-${Date.now()}`;
    const addGeneralStatsScriptResult = await requestJsonWithAuth(baseUrl, "/api/script/addScript", token, {
      method: "POST",
      body: JSON.stringify({
        name: generalStatsScriptName,
        content: "built general statistics script",
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
      name: `built-general-helper-asset-${Date.now()}`,
      describe: "built general statistics helper asset",
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
      name: `built-general-storyboard-${Date.now()}`,
      describe: "built general statistics storyboard",
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

    const productionProjectName = `built-production-project-${Date.now()}`;
    const createProductionProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: productionProjectName,
        intro: "built production flow project",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "built-production-image-model",
        videoModel: "built-production-video-model",
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

    const productionParentImageRelativePath = "built-production/parent.png";
    const productionChildImageRelativePath = "built-production/child.png";
    const productionStoryboardOneRelativePath = "built-production/storyboard-one.png";
    const productionStoryboardTwoRelativePath = "built-production/storyboard-two.png";
    const productionVideoOneRelativePath = "built-production/video-one.mp4";
    const productionVideoTwoRelativePath = "built-production/video-two.mp4";
    const productionVideoIgnoredRelativePath = "built-production/video-ignored.mp4";
    const productionParentImageAbsolutePath = path.join(tempRoot, "data", "oss", ...productionParentImageRelativePath.split("/"));
    const productionChildImageAbsolutePath = path.join(tempRoot, "data", "oss", ...productionChildImageRelativePath.split("/"));
    const productionStoryboardOneAbsolutePath = path.join(tempRoot, "data", "oss", ...productionStoryboardOneRelativePath.split("/"));
    const productionStoryboardTwoAbsolutePath = path.join(tempRoot, "data", "oss", ...productionStoryboardTwoRelativePath.split("/"));
    const productionVideoOneAbsolutePath = path.join(tempRoot, "data", "oss", ...productionVideoOneRelativePath.split("/"));
    const productionVideoTwoAbsolutePath = path.join(tempRoot, "data", "oss", ...productionVideoTwoRelativePath.split("/"));
    const productionVideoIgnoredAbsolutePath = path.join(tempRoot, "data", "oss", ...productionVideoIgnoredRelativePath.split("/"));
    fs.mkdirSync(path.dirname(productionParentImageAbsolutePath), { recursive: true });
    fs.writeFileSync(productionParentImageAbsolutePath, "built-production-parent-image", "utf-8");
    fs.writeFileSync(productionChildImageAbsolutePath, "built-production-child-image", "utf-8");
    fs.writeFileSync(productionStoryboardOneAbsolutePath, "built-production-storyboard-one", "utf-8");
    fs.writeFileSync(productionStoryboardTwoAbsolutePath, "built-production-storyboard-two", "utf-8");
    fs.writeFileSync(productionVideoOneAbsolutePath, "built-production-video-one", "utf-8");
    fs.writeFileSync(productionVideoTwoAbsolutePath, "built-production-video-two", "utf-8");
    fs.writeFileSync(productionVideoIgnoredAbsolutePath, "built-production-video-ignored", "utf-8");

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
      name: "Built Production Parent Asset",
      type: "role",
      describe: "built production parent asset",
      prompt: "built production parent prompt",
      remark: "built production parent remark",
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
      name: "Built Production Child Asset",
      type: "role",
      describe: "built production child asset",
      prompt: "built production child prompt",
      remark: "built production child remark",
      imageId: productionChildImageId,
      assetsId: productionParentAssetId,
    });

    const productionScriptName = `built-production-script-${Date.now()}`;
    const productionScriptContent = "built production script content";
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
    assert.equal(defaultProductionAsset.name, "Built Production Parent Asset");
    assert.equal(defaultProductionAsset.type, "role");
    assert.equal(defaultProductionAsset.prompt, "built production parent prompt");
    assert.equal(defaultProductionAsset.desc, "built production parent asset");
    assert.ok(defaultProductionAsset.src);
    assert.equal(getUrlPathname(defaultProductionAsset.src), `/oss/${productionParentImageRelativePath}`);
    assert.equal(defaultProductionAsset.derive.length, 1);
    assert.equal(defaultProductionAsset.derive[0].id, productionChildAssetId);
    assert.equal(defaultProductionAsset.derive[0].name, "Built Production Child Asset");
    assert.equal(defaultProductionAsset.derive[0].type, "role");
    assert.equal(defaultProductionAsset.derive[0].prompt, "built production child prompt");
    assert.equal(defaultProductionAsset.derive[0].desc, "built production child asset");
    assert.equal(defaultProductionAsset.derive[0].state, "done");
    assert.ok(defaultProductionAsset.derive[0].src);
    assert.equal(getUrlPathname(defaultProductionAsset.derive[0].src!), `/oss/${productionChildImageRelativePath}`);
    assert.deepEqual(defaultProductionFlowData.storyboard, []);
    assert.ok(defaultProductionFlowData.workbench);
    assert.deepEqual(defaultProductionFlowData.workbench?.videoList, []);

    const { storyboardId: productionStoryboardOneId } = insertStoryboardRow(dbPath, {
      projectId: productionProjectId,
      scriptId: productionScriptId,
      prompt: "built production storyboard one prompt",
      filePath: productionStoryboardOneRelativePath,
      duration: 4,
      state: "done",
      trackId: productionTrackOneId,
      videoDesc: "built production storyboard one video desc",
      shouldGenerateImage: 1,
      index: 91,
      assetIds: [productionParentAssetId],
    });
    const { storyboardId: productionStoryboardTwoId } = insertStoryboardRow(dbPath, {
      projectId: productionProjectId,
      scriptId: productionScriptId,
      prompt: "built production storyboard two prompt",
      filePath: productionStoryboardTwoRelativePath,
      duration: 8,
      state: "done",
      trackId: productionTrackTwoId,
      videoDesc: "built production storyboard two video desc",
      shouldGenerateImage: 1,
      index: 13,
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
    assert.equal(productionStoryboardList[0].prompt, "built production storyboard two prompt");
    assert.equal(productionStoryboardList[1].prompt, "built production storyboard one prompt");
    assert.equal(productionStoryboardList[0].scriptId, productionScriptId);
    assert.equal(productionStoryboardList[1].scriptId, productionScriptId);
    assert.ok(productionStoryboardList[0].filePath);
    assert.ok(productionStoryboardList[1].filePath);
    assert.equal(getUrlPathname(productionStoryboardList[0].filePath!), `/oss/${productionStoryboardTwoRelativePath}`);
    assert.equal(getUrlPathname(productionStoryboardList[1].filePath!), `/oss/${productionStoryboardOneRelativePath}`);
    assert.equal(productionStoryboardList[0].characters?.length, 1);
    assert.equal(productionStoryboardList[1].characters?.length, 1);
    assert.equal(productionStoryboardList[0].characters?.[0].name, "Built Production Child Asset");
    assert.equal(productionStoryboardList[0].characters?.[0].type, "role");
    assert.ok(productionStoryboardList[0].characters?.[0].avatar);
    assert.equal(
      getUrlPathname(productionStoryboardList[0].characters?.[0].avatar!),
      `/oss/${productionChildImageRelativePath}`,
    );
    assert.equal(productionStoryboardList[1].characters?.[0].name, "Built Production Parent Asset");
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

    const savedProductionFlowData = {
      script: productionScriptContent,
      scriptPlan: "built production script plan",
      assets: [],
      storyboardTable: "built production storyboard table",
      storyboard: [
        {
          id: productionStoryboardOneId,
          duration: 4,
          prompt: "built production storyboard one prompt",
          associateAssetsIds: [productionParentAssetId],
          src: "",
          index: 91,
        },
        {
          id: productionStoryboardTwoId,
          duration: 8,
          prompt: "built production storyboard two prompt",
          associateAssetsIds: [productionChildAssetId],
          src: "",
          index: 13,
        },
      ],
      workbench: {
        videoList: [{ id: 1, name: "built-production-video" }],
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
    assert.equal(savedProductionFlow.scriptPlan, "built production script plan");
    assert.equal(savedProductionFlow.storyboardTable, "built production storyboard table");
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
      ["built production storyboard one prompt", "built production storyboard two prompt"],
    );
    assert.deepEqual(savedProductionFlow.storyboard[0].associateAssetsIds, [productionParentAssetId]);
    assert.deepEqual(savedProductionFlow.storyboard[1].associateAssetsIds, [productionChildAssetId]);
    assert.ok(savedProductionFlow.storyboard[0].src);
    assert.ok(savedProductionFlow.storyboard[1].src);
    assert.equal(getUrlPathname(savedProductionFlow.storyboard[0].src!), `/oss/${productionStoryboardOneRelativePath}`);
    assert.equal(getUrlPathname(savedProductionFlow.storyboard[1].src!), `/oss/${productionStoryboardTwoRelativePath}`);
    assert.equal(savedProductionFlow.storyboard[0].state, "done");
    assert.equal(savedProductionFlow.storyboard[1].state, "done");
    assert.equal(savedProductionFlow.storyboard[0].videoDesc, "built production storyboard one video desc");
    assert.equal(savedProductionFlow.storyboard[1].videoDesc, "built production storyboard two video desc");
    assert.equal(savedProductionFlow.storyboard[0].shouldGenerateImage, 1);
    assert.equal(savedProductionFlow.storyboard[1].shouldGenerateImage, 1);
    assert.deepEqual(savedProductionFlow.workbench?.videoList, [{ id: 1, name: "built-production-video" }]);

    const generateProjectName = `built-generate-project-${Date.now()}`;
    const createGenerateProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: generateProjectName,
        intro: "built generate data project",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "built-generate-image-model",
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

    const generateScriptName = `built-generate-script-${Date.now()}`;
    const generateScriptResult = await requestJsonWithAuth(baseUrl, "/api/script/addScript", token, {
      method: "POST",
      body: JSON.stringify({
        name: generateScriptName,
        content: "built generate script content",
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

    const generateVendorId = `built-generate-vendor-${Date.now()}`;
    const generateModelName = "built-generate-video";
    const generateVendorModels = [
      {
        name: "Built Generate Video",
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
        name: "Built Generate Vendor",
        description: "Built generate smoke vendor",
        inputValues: {},
        modelName: generateModelName,
        modelLabel: "Built Generate Video",
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

    const generateRefImageRelativePath = "built-generate/ref-image.png";
    const generateTrackTwoImageRelativePath = "built-generate/track-two-image.png";
    const generateStoryboardOneRelativePath = "built-generate/storyboard-one.png";
    const generateStoryboardTwoRelativePath = "built-generate/storyboard-two.png";
    const generateVideoOneRelativePath = "built-generate/video-one.mp4";
    const generateVideoTwoRelativePath = "built-generate/video-two.mp4";
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
    fs.writeFileSync(generateRefImageAbsolutePath, "built-generate-ref-image", "utf-8");
    fs.writeFileSync(generateTrackTwoImageAbsolutePath, "built-generate-track-two-image", "utf-8");
    fs.writeFileSync(generateStoryboardOneAbsolutePath, "built-generate-storyboard-one", "utf-8");
    fs.writeFileSync(generateStoryboardTwoAbsolutePath, "built-generate-storyboard-two", "utf-8");
    fs.writeFileSync(generateVideoOneAbsolutePath, "built-generate-video-one", "utf-8");
    fs.writeFileSync(generateVideoTwoAbsolutePath, "built-generate-video-two", "utf-8");

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
      name: "Built Generate Shared Asset",
      type: "role",
      describe: "built generate shared asset",
      prompt: "built generate shared prompt",
      imageId: generateSharedImageId,
    });
    insertAssetRow(dbPath, {
      id: generateTextOnlyAssetId,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      name: "Built Generate Text Asset",
      type: "role",
      describe: "built generate text asset",
      prompt: "built generate text prompt",
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
      name: "Built Generate Track Two Asset",
      type: "role",
      describe: "built generate track two asset",
      prompt: "built generate track two prompt",
      imageId: generateTrackTwoImageId,
    });

    insertVideoTrackRow(dbPath, {
      id: generateTrackOneId,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      prompt: "built generate track one prompt",
      duration: 8,
      state: "已完成",
      reason: "done",
      selectVideoId: generateVideoTwoId,
    });
    insertVideoTrackRow(dbPath, {
      id: generateTrackTwoId,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      prompt: "built generate track two prompt",
      duration: 3,
      state: "生成中",
      reason: "",
      selectVideoId: null,
    });

    const { storyboardId: generateStoryboardOneId } = insertStoryboardRow(dbPath, {
      id: generateSeed + 9,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      prompt: "built generate storyboard one prompt",
      filePath: generateStoryboardOneRelativePath,
      duration: 5,
      state: "done",
      trackId: generateTrackOneId,
      videoDesc: "built generate storyboard one video desc",
      index: 1,
      assetIds: [generateSharedAssetId],
    });
    const { storyboardId: generateStoryboardTwoId } = insertStoryboardRow(dbPath, {
      id: generateSeed + 10,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      prompt: "built generate storyboard two prompt",
      filePath: generateStoryboardTwoRelativePath,
      duration: 5,
      state: "done",
      trackId: generateTrackOneId,
      videoDesc: "built generate storyboard two video desc",
      index: 2,
      assetIds: [generateSharedAssetId, generateTextOnlyAssetId],
    });
    const { storyboardId: generateStoryboardThreeId } = insertStoryboardRow(dbPath, {
      id: generateSeed + 11,
      projectId: generateProjectId,
      scriptId: generateScriptId,
      prompt: "built generate storyboard three prompt",
      filePath: "",
      duration: 3,
      state: "done",
      trackId: generateTrackTwoId,
      videoDesc: "built generate storyboard three video desc",
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

    assert.equal(generateTrackOne.prompt, "built generate track one prompt");
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

    assert.equal(generateTrackTwo.prompt, "built generate track two prompt");
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

    const scriptProjectName = `built-script-project-${Date.now()}`;
    const createScriptProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: scriptProjectName,
        intro: "built script lifecycle project",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "built-script-image-model",
        videoModel: "built-script-video-model",
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
      name: "Built Script Asset",
    });

    const oversizedScriptName = `built-oversized-script-${Date.now()}`;
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

    const scriptName = `built-script-${Date.now()}`;
    const addScriptResult = await requestJsonWithAuth(baseUrl, "/api/script/addScript", token, {
      method: "POST",
      body: JSON.stringify({
        name: scriptName,
        content: "built script content",
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
    assert.equal(createdScript.content, "built script content");
    assert.ok(createdScript.relatedAssets.some((item) => item.id === assetId && item.name === "Built Script Asset"));

    const scriptId = createdScript.id;
    const updatedScriptName = `${scriptName}-updated`;
    const updatedScriptContent = "built script content updated";
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

    const assetsProjectName = `built-assets-project-${Date.now()}`;
    const createAssetsProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: assetsProjectName,
        intro: "built assets lifecycle project",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "built-assets-image-model",
        videoModel: "built-assets-video-model",
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

    const initialAssetName = `built-parent-asset-${Date.now()}`;
    const updatedAssetName = `${initialAssetName}-updated`;
    const addAssetResult = await requestJsonWithAuth(baseUrl, "/api/assets/addAssets", token, {
      method: "POST",
      body: JSON.stringify({
        name: initialAssetName,
        describe: "built parent asset describe",
        type: "role",
        projectId: assetsProjectId,
        remark: "built asset remark",
        prompt: "built asset prompt",
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
    assert.equal(createdAsset.describe, "built parent asset describe");
    assert.equal(createdAsset.remark, "built asset remark");
    assert.equal(createdAsset.prompt, "built asset prompt");
    assert.deepEqual(createdAsset.sonAssets, []);

    const assetsId = createdAsset.id;
    const updateAssetResult = await requestJsonWithAuth(baseUrl, "/api/assets/updateAssets", token, {
      method: "POST",
      body: JSON.stringify({
        id: assetsId,
        name: updatedAssetName,
        describe: "built parent asset describe updated",
        remark: "built asset remark updated",
        prompt: "built asset prompt updated",
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
    assert.equal(updatedAsset.describe, "built parent asset describe updated");
    assert.equal(updatedAsset.remark, "built asset remark updated");
    assert.equal(updatedAsset.prompt, "built asset prompt updated");

    const parentImageRelativePath = "built-assets/parent-image.png";
    const parentImageAbsolutePath = path.join(tempRoot, "data", "oss", "built-assets", "parent-image.png");
    fs.mkdirSync(path.dirname(parentImageAbsolutePath), { recursive: true });
    fs.writeFileSync(parentImageAbsolutePath, "built-parent-image", "utf-8");

    const { imageId: linkedImageId } = insertImageRow(dbPath, {
      assetsId,
      filePath: parentImageRelativePath,
      state: "done",
    });

    insertAssetRow(dbPath, {
      projectId: assetsProjectId,
      name: "Built Referencing Asset",
      describe: "built referencing asset",
      type: "role",
      imageId: linkedImageId,
    });

    insertAssetRow(dbPath, {
      projectId: assetsProjectId,
      name: "Built Child Asset",
      describe: "built child asset",
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
      (item: { name?: string }) => item.name === "Built Referencing Asset",
    ) as { imageId?: number | null } | undefined;
    assert.ok(referencingAsset);
    assert.equal(referencingAsset.imageId, null);

    const novelProjectName = `built-novel-project-${Date.now()}`;
    const createNovelProjectResult = await requestJsonWithAuth(baseUrl, "/api/project/addProject", token, {
      method: "POST",
      body: JSON.stringify({
        projectType: "short-drama",
        name: novelProjectName,
        intro: "built novel lifecycle project",
        type: "original",
        artStyle: "default",
        directorManual: "",
        videoRatio: "9:16",
        imageModel: "built-novel-image-model",
        videoModel: "built-novel-video-model",
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
            chapterData: "built novel chapter one",
          },
          {
            index: 2,
            reel: "第一卷",
            chapter: "第二章 重逢",
            chapterData: "built novel chapter two",
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
      event: string;
    };
    const secondNovel = novelListResult.json.data.data[1] as {
      id: number;
      chapter: string;
      event: string;
    };
    assert.match(firstNovel.event, /^\[mock event\]/);
    assert.match(secondNovel.event, /^\[mock event\]/);

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

    const updateNovelResult = await requestJsonWithAuth(baseUrl, "/api/novel/updateNovel", token, {
      method: "POST",
      body: JSON.stringify({
        id: firstNovel.id,
        index: 1,
        reel: "第一卷-修订",
        chapter: "第一章 初见（修订）",
        chapterData: "built novel chapter one updated",
        event: "built updated novel event",
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
    assert.equal(updatedNovelSearchResult.json.data.data[0].event, "built updated novel event");

    const eventSmokeFirstLink = insertNovelEventLink(dbPath, {
      novelId: firstNovel.id,
      eventId: 950001,
      eventChapterId: 950101,
      name: "Built Event Alpha",
      detail: "built event alpha detail",
    });
    const eventSmokeSecondLink = insertNovelEventLink(dbPath, {
      novelId: secondNovel.id,
      eventId: 950002,
      eventChapterId: 950102,
      name: "Built Event Beta",
      detail: "built event beta detail",
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
          item.eventName === "Built Event Alpha" &&
          Array.isArray(item.chapters) &&
          item.chapters.includes(1),
      ),
    );
    assert.ok(
      getEventResult.json.data.list.some(
        (item: { id?: number; eventName?: string; chapters?: number[] }) =>
          item.id === eventSmokeSecondLink.eventId &&
          item.eventName === "Built Event Beta" &&
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
      eventId: 930001,
      eventChapterId: 940001,
      name: "Built Novel Event 1",
    });
    const secondNovelEventLink = insertNovelEventLink(dbPath, {
      novelId: secondNovel.id,
      eventId: 930002,
      eventChapterId: 940002,
      name: "Built Novel Event 2",
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

    insertMemoryRow(dbPath, {
      content: "built memory before clearData",
    });
    assert.equal(countMemoriesByIsolationPrefix(dbPath, "baseline-test"), 1);

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

    console.log("BUILT_LOGIN_CONFIG_SMOKE_OK");
    console.log("BUILT_AGENT_DEPLOY_SMOKE_OK");
    console.log("BUILT_AGENT_SET_KEY_SMOKE_OK");
    console.log("BUILT_CLEAR_DATA_SMOKE_OK");
    console.log("BUILT_PROMPT_MANAGE_SMOKE_OK");
    console.log("BUILT_MEMORY_CONFIG_SMOKE_OK");
    console.log("BUILT_SKILL_MANAGEMENT_SMOKE_OK");
      console.log("BUILT_OPEN_FOLDER_SMOKE_OK");
      console.log("BUILT_VENDOR_CODE_SMOKE_OK");
      console.log("BUILT_MODEL_SELECT_SMOKE_OK");
      console.log("BUILT_VENDOR_GET_CODE_BY_LINK_SMOKE_OK");
      console.log("BUILT_DOWNLOAD_APP_SMOKE_OK");
      console.log("BUILT_ART_STYLE_SMOKE_OK");
      console.log("BUILT_GENERAL_STATISTICS_SMOKE_OK");
      console.log("BUILT_PRODUCTION_MEDIA_LIST_SMOKE_OK");
      console.log("BUILT_PRODUCTION_FLOW_SMOKE_OK");
      console.log("BUILT_PRODUCTION_GENERATE_DATA_SMOKE_OK");
      console.log("BUILT_VISUAL_MANUAL_SMOKE_OK");
      console.log("BUILT_DIRECTOR_MANUAL_SMOKE_OK");
      console.log("BUILT_TASK_SMOKE_OK");
    console.log("BUILT_PROJECT_LIFECYCLE_SMOKE_OK");
    console.log("BUILT_SCRIPT_LIFECYCLE_SMOKE_OK");
    console.log("BUILT_ASSETS_LIFECYCLE_SMOKE_OK");
    console.log("BUILT_NOVEL_LIFECYCLE_SMOKE_OK");
    console.log("BUILT_NOVEL_EVENT_SMOKE_OK");
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
    console.log("Built app smoke passed");
    setTimeout(() => process.exit(0), 250);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
