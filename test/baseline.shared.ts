import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

export type AppModuleExports = {
  default: (randomPort?: boolean) => Promise<number>;
  closeServe: () => Promise<void>;
};

export function resolveAppModuleExports(appModule: any): AppModuleExports {
  if (typeof appModule?.default === "function" && typeof appModule?.closeServe === "function") {
    return appModule as AppModuleExports;
  }

  if (typeof appModule?.default?.default === "function" && typeof appModule?.default?.closeServe === "function") {
    return appModule.default as AppModuleExports;
  }

  throw new Error("Unable to resolve app module exports");
}

export async function requestJson(baseUrl: string, pathname: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, init);
  const text = await response.text();

  try {
    return {
      response,
      text,
      json: JSON.parse(text),
    };
  } catch {
    return {
      response,
      text,
      json: null,
    };
  }
}

export async function requestJsonWithAuth(baseUrl: string, pathname: string, token: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", token);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return requestJson(baseUrl, pathname, {
    ...init,
    headers,
  });
}

export async function login(
  baseUrl: string,
  credentials: {
    username?: string;
    password?: string;
  } = {},
): Promise<string> {
  const { username = "admin", password = "admin123" } = credentials;

  const { response, json } = await requestJson(baseUrl, "/api/login/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  assert.equal(response.status, 200);
  assert.ok(json);
  assert.equal(json.code, 200);
  assert.match(json.data.token, /^Bearer\s.+/);

  return json.data.token as string;
}

export function createVendorTsCode(
  vendorId: string,
  options: {
    name: string;
    description: string;
    inputValues: Record<string, string>;
    modelName: string;
    modelLabel: string;
    models?: Array<Record<string, unknown>>;
  },
): string {
  const vendorConfig = {
    id: vendorId,
    version: "2.0",
    author: "baseline-test",
    name: options.name,
    description: options.description,
    icon: "",
    inputs: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
      },
      {
        key: "baseUrl",
        label: "Base URL",
        type: "url",
        required: true,
        placeholder: "https://api.example.test/v1",
      },
    ],
    inputValues: options.inputValues,
    models:
      options.models ??
      [
        {
          name: options.modelLabel,
          modelName: options.modelName,
          type: "text",
          think: false,
        },
      ],
  };

  return `
const vendor = ${JSON.stringify(vendorConfig, null, 2)};
const textRequest = () => ({ provider: "mock" });
const imageRequest = async () => "";
const videoRequest = async () => "";
exports.vendor = vendor;
exports.textRequest = textRequest;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
export {};
`.trim();
}

export function insertMemoryRow(
  dbPath: string,
  overrides: Partial<{
    id: string;
    isolationKey: string;
    type: string;
    role: string;
    content: string;
    createTime: number;
  }> = {},
) {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath);

  try {
    const row = {
      id: `memory-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      isolationKey: "baseline-test",
      type: "message",
      role: "user",
      content: "baseline memory content",
      createTime: Date.now(),
      ...overrides,
    };

    sqlite
      .prepare(
        `
          INSERT INTO memories (id, isolationKey, type, role, content, createTime)
          VALUES (@id, @isolationKey, @type, @role, @content, @createTime)
        `,
      )
      .run(row);

    return row;
  } finally {
    sqlite.close();
  }
}

export function countMemories(dbPath: string): number {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath, { readonly: true });

  try {
    const result = sqlite.prepare("SELECT COUNT(*) AS count FROM memories").get() as { count: number };
    return result.count;
  } finally {
    sqlite.close();
  }
}

export function insertConversationMessageRow(
  dbPath: string,
  overrides: Partial<{
    id: string;
    scopeKey: string;
    projectId: number;
    episodesId: number | null;
    agentType: "scriptAgent" | "productionAgent";
    messageJson: string;
    createTime: number;
    updateTime: number;
  }> = {},
) {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath);

  try {
    const now = Date.now();
    const row = {
      id: `conversation-${now}-${Math.random().toString(16).slice(2)}`,
      scopeKey: "baseline-scope",
      projectId: 1,
      episodesId: null,
      agentType: "scriptAgent" as const,
      messageJson: JSON.stringify({
        id: `message-${now}`,
        role: "assistant",
        status: "complete",
        datetime: new Date(now).toISOString(),
        content: [{ id: `content-${now}`, type: "text", status: "complete", data: "baseline conversation content" }],
      }),
      createTime: now,
      updateTime: now,
      ...overrides,
    };

    sqlite
      .prepare(
        `
          INSERT INTO o_agentConversationMessage
            (id, scopeKey, projectId, episodesId, agentType, messageJson, createTime, updateTime)
          VALUES
            (@id, @scopeKey, @projectId, @episodesId, @agentType, @messageJson, @createTime, @updateTime)
        `,
      )
      .run(row);

    return row;
  } finally {
    sqlite.close();
  }
}

export function countConversationMessages(dbPath: string): number {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath, { readonly: true });

  try {
    const result = sqlite.prepare("SELECT COUNT(*) AS count FROM o_agentConversationMessage").get() as { count: number };
    return result.count;
  } finally {
    sqlite.close();
  }
}

export function countConversationMessagesByScopePrefix(dbPath: string, scopeKeyPrefix: string): number {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath, { readonly: true });

  try {
    const result = sqlite
      .prepare("SELECT COUNT(*) AS count FROM o_agentConversationMessage WHERE scopeKey LIKE ?")
      .get(`${scopeKeyPrefix}%`) as { count: number };
    return result.count;
  } finally {
    sqlite.close();
  }
}

export function insertProjectScopedRows(dbPath: string, projectId: number) {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath);

  try {
    const now = Date.now();
    const taskId = Number(`${now}${Math.floor(Math.random() * 1000)}`);
    const agentWorkDataId = taskId + 1;
    const memoryId = `project-memory-${projectId}-${Math.random().toString(16).slice(2)}`;
    const memoryIsolationKey = `${projectId}:baseline-project-scope`;

    sqlite
      .prepare(
        `
          INSERT INTO o_tasks (id, projectId, taskClass, relatedObjects, model, describe, state, startTime, reason)
          VALUES (@id, @projectId, @taskClass, @relatedObjects, @model, @describe, @state, @startTime, @reason)
        `,
      )
      .run({
        id: taskId,
        projectId,
        taskClass: "baseline-project-task",
        relatedObjects: JSON.stringify([projectId]),
        model: "baseline-model",
        describe: "baseline project scoped task",
        state: "pending",
        startTime: now,
        reason: "baseline",
      });

    sqlite
      .prepare(
        `
          INSERT INTO o_agentWorkData (id, projectId, episodesId, key, data, createTime, updateTime)
          VALUES (@id, @projectId, @episodesId, @key, @data, @createTime, @updateTime)
        `,
      )
      .run({
        id: agentWorkDataId,
        projectId,
        episodesId: null,
        key: "baseline-project-key",
        data: "baseline-project-agent-work",
        createTime: now,
        updateTime: now,
      });

    sqlite
      .prepare(
        `
          INSERT INTO memories (id, isolationKey, type, role, content, createTime)
          VALUES (@id, @isolationKey, @type, @role, @content, @createTime)
        `,
      )
      .run({
        id: memoryId,
        isolationKey: memoryIsolationKey,
        type: "message",
        role: "user",
        content: "baseline project memory",
        createTime: now,
      });

    return {
      taskId,
      agentWorkDataId,
      memoryId,
      memoryIsolationKey,
    };
  } finally {
    sqlite.close();
  }
}

export function insertTaskRow(
  dbPath: string,
  options: {
    id?: number;
    projectId: number;
    taskClass?: string;
    relatedObjects?: string;
    model?: string;
    describe?: string;
    state?: string;
    startTime?: number;
    reason?: string;
  },
) {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath);

  try {
    const now = options.startTime ?? Date.now();
    const taskId = options.id ?? Number(`${now}${Math.floor(Math.random() * 1000)}`);

    sqlite
      .prepare(
        `
          INSERT INTO o_tasks (id, projectId, taskClass, relatedObjects, model, describe, state, startTime, reason)
          VALUES (@id, @projectId, @taskClass, @relatedObjects, @model, @describe, @state, @startTime, @reason)
        `,
      )
      .run({
        id: taskId,
        projectId: options.projectId,
        taskClass: options.taskClass ?? "baseline-task",
        relatedObjects: options.relatedObjects ?? JSON.stringify([options.projectId]),
        model: options.model ?? "baseline-model",
        describe: options.describe ?? "baseline task describe",
        state: options.state ?? "pending",
        startTime: now,
        reason: options.reason ?? "baseline-reason",
      });

    return {
      taskId,
      startTime: now,
    };
  } finally {
    sqlite.close();
  }
}

export function countRowsByProjectId(dbPath: string, tableName: "o_tasks" | "o_agentWorkData", projectId: number): number {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath, { readonly: true });

  try {
    const result = sqlite
      .prepare(`SELECT COUNT(*) AS count FROM ${tableName} WHERE projectId = ?`)
      .get(projectId) as { count: number };
    return result.count;
  } finally {
    sqlite.close();
  }
}

export function countMemoriesByIsolationPrefix(dbPath: string, isolationKeyPrefix: string): number {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath, { readonly: true });

  try {
    const result = sqlite
      .prepare("SELECT COUNT(*) AS count FROM memories WHERE isolationKey LIKE ?")
      .get(`${isolationKeyPrefix}%`) as { count: number };
    return result.count;
  } finally {
    sqlite.close();
  }
}

export function insertAssetRow(
  dbPath: string,
  options: {
    id?: number;
    projectId: number;
    name?: string;
    type?: string;
    describe?: string;
    prompt?: string | null;
    remark?: string | null;
    scriptId?: number | null;
    imageId?: number | null;
    assetsId?: number | null;
    startTime?: number;
  },
) {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath);

  try {
    const assetId = options.id ?? Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
    sqlite
      .prepare(
        `
          INSERT INTO o_assets (id, name, prompt, remark, type, describe, scriptId, imageId, assetsId, projectId, startTime)
          VALUES (@id, @name, @prompt, @remark, @type, @describe, @scriptId, @imageId, @assetsId, @projectId, @startTime)
        `,
      )
      .run({
        id: assetId,
        name: options.name ?? `baseline-asset-${assetId}`,
        prompt: options.prompt ?? null,
        remark: options.remark ?? null,
        describe: options.describe ?? "baseline script asset",
        type: options.type ?? "character",
        scriptId: options.scriptId ?? null,
        imageId: options.imageId ?? null,
        assetsId: options.assetsId ?? null,
        projectId: options.projectId,
        startTime: options.startTime ?? Date.now(),
      });

    return {
      assetId,
    };
  } finally {
    sqlite.close();
  }
}

export function insertImageRow(
  dbPath: string,
  options: {
    id?: number;
    assetsId: number;
    filePath?: string | null;
    type?: string | null;
    model?: string | null;
    resolution?: string | null;
    state?: string | null;
    errorReason?: string | null;
  },
) {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath);

  try {
    const imageId = options.id ?? Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
    sqlite
      .prepare(
        `
          INSERT INTO o_image (id, filePath, type, assetsId, model, resolution, state, errorReason)
          VALUES (@id, @filePath, @type, @assetsId, @model, @resolution, @state, @errorReason)
        `,
      )
      .run({
        id: imageId,
        filePath: options.filePath ?? null,
        type: options.type ?? "image",
        assetsId: options.assetsId,
        model: options.model ?? null,
        resolution: options.resolution ?? null,
        state: options.state ?? "done",
        errorReason: options.errorReason ?? null,
      });

    return {
      imageId,
    };
  } finally {
    sqlite.close();
  }
}

export function insertScriptScopedRows(
  dbPath: string,
  options: {
    projectId: number;
    scriptId: number;
    assetId: number;
  },
) {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath);

  try {
    const now = Date.now();
    const agentWorkDataId = Number(`${now}${Math.floor(Math.random() * 1000)}`);
    const storyboardId = agentWorkDataId + 1;
    const videoId = agentWorkDataId + 2;

    sqlite
      .prepare(
        `
          INSERT INTO o_agentWorkData (id, projectId, episodesId, key, data, createTime, updateTime)
          VALUES (@id, @projectId, @episodesId, @key, @data, @createTime, @updateTime)
        `,
      )
      .run({
        id: agentWorkDataId,
        projectId: options.projectId,
        episodesId: options.scriptId,
        key: "baseline-script-key",
        data: "baseline-script-agent-work",
        createTime: now,
        updateTime: now,
      });

    sqlite
      .prepare(
        `
          INSERT INTO o_storyboard (id, scriptId, projectId, filePath, createTime)
          VALUES (@id, @scriptId, @projectId, @filePath, @createTime)
        `,
      )
      .run({
        id: storyboardId,
        scriptId: options.scriptId,
        projectId: options.projectId,
        filePath: `baseline/${storyboardId}.png`,
        createTime: now,
      });

    sqlite
      .prepare(
        `
          INSERT INTO o_assets2Storyboard (assetId, storyboardId)
          VALUES (@assetId, @storyboardId)
        `,
      )
      .run({
        assetId: options.assetId,
        storyboardId,
      });

    sqlite
      .prepare(
        `
          INSERT INTO o_video (id, scriptId, projectId, filePath, state, time)
          VALUES (@id, @scriptId, @projectId, @filePath, @state, @time)
        `,
      )
      .run({
        id: videoId,
        scriptId: options.scriptId,
        projectId: options.projectId,
        filePath: `baseline/${videoId}.mp4`,
        state: "done",
        time: now,
      });

    sqlite
      .prepare(
        `
          INSERT INTO o_scriptAssets (scriptId, assetId)
          VALUES (@scriptId, @assetId)
        `,
      )
      .run({
        scriptId: options.scriptId,
        assetId: options.assetId,
      });

    return {
      agentWorkDataId,
      storyboardId,
      videoId,
    };
  } finally {
    sqlite.close();
  }
}

export function insertVendorConfigRow(
  dbPath: string,
  options: {
    id: string;
    inputValues?: Record<string, unknown> | string | null;
    models?: Array<Record<string, unknown>> | string | null;
    enable?: number | null;
  },
) {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath);

  try {
    sqlite
      .prepare(
        `
          INSERT INTO o_vendorConfig (id, inputValues, models, enable)
          VALUES (@id, @inputValues, @models, @enable)
        `,
      )
      .run({
        id: options.id,
        inputValues:
          typeof options.inputValues === "string"
            ? options.inputValues
            : JSON.stringify(options.inputValues ?? {}),
        models: typeof options.models === "string" ? options.models : JSON.stringify(options.models ?? []),
        enable: options.enable ?? 1,
      });
  } finally {
    sqlite.close();
  }
}

export function updateProjectVideoModel(dbPath: string, projectId: number, videoModel: string | null) {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath);

  try {
    sqlite
      .prepare(
        `
          UPDATE o_project
          SET videoModel = @videoModel
          WHERE id = @projectId
        `,
      )
      .run({
        projectId,
        videoModel,
      });
  } finally {
    sqlite.close();
  }
}

export function insertStoryboardRow(
  dbPath: string,
  options: {
    id?: number;
    projectId: number;
    scriptId: number;
    prompt?: string | null;
    filePath?: string | null;
    duration?: string | number | null;
    state?: string | null;
    trackId?: number | null;
    reason?: string | null;
    track?: string | null;
    videoDesc?: string | null;
    shouldGenerateImage?: number | null;
    flowId?: number | null;
    index?: number | null;
    createTime?: number;
    assetIds?: number[];
  },
) {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath);

  try {
    const now = options.createTime ?? Date.now();
    const storyboardId = options.id ?? Number(`${now}${Math.floor(Math.random() * 1000)}`);
    sqlite
      .prepare(
        `
          INSERT INTO o_storyboard (id, scriptId, prompt, filePath, duration, state, trackId, reason, track, videoDesc, shouldGenerateImage, projectId, flowId, \`index\`, createTime)
          VALUES (@id, @scriptId, @prompt, @filePath, @duration, @state, @trackId, @reason, @track, @videoDesc, @shouldGenerateImage, @projectId, @flowId, @index, @createTime)
        `,
      )
      .run({
        id: storyboardId,
        scriptId: options.scriptId,
        prompt: options.prompt ?? null,
        filePath: options.filePath ?? null,
        duration: options.duration == null ? null : String(options.duration),
        state: options.state ?? null,
        trackId: options.trackId ?? null,
        reason: options.reason ?? null,
        track: options.track ?? null,
        videoDesc: options.videoDesc ?? null,
        shouldGenerateImage: options.shouldGenerateImage ?? null,
        projectId: options.projectId,
        flowId: options.flowId ?? null,
        index: options.index ?? null,
        createTime: now,
      });

    const assetIds = Array.from(new Set(options.assetIds ?? []));
    if (assetIds.length) {
      const insertLink = sqlite.prepare(
        `
          INSERT INTO o_assets2Storyboard (assetId, storyboardId)
          VALUES (@assetId, @storyboardId)
        `,
      );

      for (const assetId of assetIds) {
        insertLink.run({
          assetId,
          storyboardId,
        });
      }
    }

    return {
      storyboardId,
    };
  } finally {
    sqlite.close();
  }
}

export function insertVideoTrackRow(
  dbPath: string,
  options: {
    id?: number;
    projectId: number;
    scriptId: number;
    videoId?: number | null;
    state?: string | null;
    reason?: string | null;
    prompt?: string | null;
    selectVideoId?: number | null;
    duration?: number | null;
  },
) {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath);

  try {
    const trackId = options.id ?? Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
    sqlite
      .prepare(
        `
          INSERT INTO o_videoTrack (id, videoId, projectId, scriptId, state, reason, prompt, selectVideoId, duration)
          VALUES (@id, @videoId, @projectId, @scriptId, @state, @reason, @prompt, @selectVideoId, @duration)
        `,
      )
      .run({
        id: trackId,
        videoId: options.videoId ?? null,
        projectId: options.projectId,
        scriptId: options.scriptId,
        state: options.state ?? null,
        reason: options.reason ?? null,
        prompt: options.prompt ?? null,
        selectVideoId: options.selectVideoId ?? null,
        duration: options.duration ?? null,
      });

    return {
      trackId,
    };
  } finally {
    sqlite.close();
  }
}

export function insertVideoRow(
  dbPath: string,
  options: {
    id?: number;
    projectId: number;
    scriptId: number;
    videoTrackId?: number | null;
    filePath?: string | null;
    state?: string | null;
    time?: number;
    errorReason?: string | null;
  },
) {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath);

  try {
    const now = options.time ?? Date.now();
    const videoId = options.id ?? Number(`${now}${Math.floor(Math.random() * 1000)}`);
    sqlite
      .prepare(
        `
          INSERT INTO o_video (id, filePath, errorReason, time, state, scriptId, projectId, videoTrackId)
          VALUES (@id, @filePath, @errorReason, @time, @state, @scriptId, @projectId, @videoTrackId)
        `,
      )
      .run({
        id: videoId,
        filePath: options.filePath ?? null,
        errorReason: options.errorReason ?? null,
        time: now,
        state: options.state ?? null,
        scriptId: options.scriptId,
        projectId: options.projectId,
        videoTrackId: options.videoTrackId ?? null,
      });

    return {
      videoId,
    };
  } finally {
    sqlite.close();
  }
}

export function insertNovelEventLink(
  dbPath: string,
  options: {
    novelId: number;
    eventId?: number;
    eventChapterId?: number;
    name?: string;
    detail?: string;
    createTime?: number;
  },
) {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath);

  try {
    const now = options.createTime ?? Date.now();
    const eventId = options.eventId ?? Number(`${now}${Math.floor(Math.random() * 1000)}`);
    const eventChapterId = options.eventChapterId ?? eventId + 1;

    sqlite
      .prepare(
        `
          INSERT INTO o_event (id, name, detail, createTime)
          VALUES (@id, @name, @detail, @createTime)
        `,
      )
      .run({
        id: eventId,
        name: options.name ?? `baseline-event-${eventId}`,
        detail: options.detail ?? "baseline event detail",
        createTime: now,
      });

    sqlite
      .prepare(
        `
          INSERT INTO o_eventChapter (id, eventId, novelId)
          VALUES (@id, @eventId, @novelId)
        `,
      )
      .run({
        id: eventChapterId,
        eventId,
        novelId: options.novelId,
      });

    return {
      eventId,
      eventChapterId,
    };
  } finally {
    sqlite.close();
  }
}

export function createDirectorManualData(options: {
  readme: string;
  planning: string;
  storyboard: string;
}) {
  return [
    {
      label: "README",
      value: "README",
      data: options.readme,
    },
    {
      label: "Director Planning",
      value: "director_planning_narrative",
      data: options.planning,
    },
    {
      label: "Director Storyboard Table",
      value: "director_storyboard_table_narrative",
      data: options.storyboard,
    },
  ];
}

export function createVisualManualData(options: {
  readme: string;
  prefix: string;
  character: string;
  characterDerivative: string;
  prop: string;
  propDerivative: string;
  scene: string;
  sceneDerivative: string;
  directorStoryboard: string;
  storyboardVideo: string;
  planningStyle: string;
  storyboardTableStyle: string;
}) {
  return [
    {
      label: "README",
      value: "README",
      data: options.readme,
    },
    {
      label: "Prefix",
      value: "prefix",
      data: options.prefix,
    },
    {
      label: "Character",
      value: "art_character",
      data: options.character,
    },
    {
      label: "Character Derivative",
      value: "art_character_derivative",
      data: options.characterDerivative,
    },
    {
      label: "Prop",
      value: "art_prop",
      data: options.prop,
    },
    {
      label: "Prop Derivative",
      value: "art_prop_derivative",
      data: options.propDerivative,
    },
    {
      label: "Scene",
      value: "art_scene",
      data: options.scene,
    },
    {
      label: "Scene Derivative",
      value: "art_scene_derivative",
      data: options.sceneDerivative,
    },
    {
      label: "Director Storyboard",
      value: "director_storyboard",
      data: options.directorStoryboard,
    },
    {
      label: "Storyboard Video",
      value: "art_storyboard_video",
      data: options.storyboardVideo,
    },
    {
      label: "Planning Style",
      value: "director_planning_style",
      data: options.planningStyle,
    },
    {
      label: "Storyboard Table Style",
      value: "director_storyboard_table_style",
      data: options.storyboardTableStyle,
    },
  ];
}

export function getDirectorManualPaths(tempRoot: string, directorManual: string) {
  const manualDir = path.join(tempRoot, "data", "skills", "story_skills", directorManual);

  return {
    manualDir,
    readmePath: path.join(manualDir, "README.md"),
    planningPath: path.join(manualDir, "driector_skills", "director_planning_narrative.md"),
    storyboardPath: path.join(manualDir, "driector_skills", "director_storyboard_table_narrative.md"),
    imagesDir: path.join(manualDir, "images"),
  };
}

export function getVisualManualPaths(tempRoot: string, stylePath: string) {
  const manualDir = path.join(tempRoot, "data", "skills", "art_skills", stylePath);

  return {
    manualDir,
    readmePath: path.join(manualDir, "README.md"),
    prefixPath: path.join(manualDir, "prefix.md"),
    artCharacterPath: path.join(manualDir, "art_prompt", "art_character.md"),
    artCharacterDerivativePath: path.join(manualDir, "art_prompt", "art_character_derivative.md"),
    artPropPath: path.join(manualDir, "art_prompt", "art_prop.md"),
    artPropDerivativePath: path.join(manualDir, "art_prompt", "art_prop_derivative.md"),
    artScenePath: path.join(manualDir, "art_prompt", "art_scene.md"),
    artSceneDerivativePath: path.join(manualDir, "art_prompt", "art_scene_derivative.md"),
    directorStoryboardPath: path.join(manualDir, "driector_skills", "director_storyboard.md"),
    artStoryboardVideoPath: path.join(manualDir, "art_prompt", "art_storyboard_video.md"),
    planningStylePath: path.join(manualDir, "driector_skills", "director_planning_style.md"),
    storyboardTableStylePath: path.join(manualDir, "driector_skills", "director_storyboard_table_style.md"),
    imagesDir: path.join(manualDir, "images"),
  };
}

export function listImageFiles(imagesDir: string): string[] {
  try {
    return fs
      .readdirSync(imagesDir)
      .filter((fileName) => /\.(png|jpe?g|gif|webp|svg)$/i.test(fileName))
      .sort();
  } catch {
    return [];
  }
}

export function countRowsByColumn(
  dbPath: string,
  tableName:
    | "o_assets2Storyboard"
    | "o_scriptAssets"
    | "o_storyboard"
    | "o_video"
    | "o_assets"
    | "o_image"
    | "o_event"
    | "o_eventChapter",
  columnName: "scriptId" | "storyboardId" | "assetsId" | "id" | "eventId" | "novelId",
  value: number,
): number {
  const Database = require("better-sqlite3");
  const sqlite = new Database(dbPath, { readonly: true });

  try {
    const result = sqlite
      .prepare(`SELECT COUNT(*) AS count FROM ${tableName} WHERE ${columnName} = ?`)
      .get(value) as { count: number };
    return result.count;
  } finally {
    sqlite.close();
  }
}

export function readRepoPackageVersion(repoRoot: string): string {
  const pkgPath = path.join(repoRoot, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  return pkg.version as string;
}

export function bumpVersion(version: string, level: "major" | "minor" | "patch"): string {
  const [major, minor, patch] = version.split(".").map((item) => Number(item));

  if (level === "major") {
    return `${major + 1}.0.0`;
  }

  if (level === "minor") {
    return `${major}.${minor + 1}.0`;
  }

  return `${major}.${minor}.${patch + 1}`;
}

export async function startMockJsonServer(routes: Record<string, unknown>): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  const server = http.createServer((req, res) => {
    const requestPath = req.url ? new URL(req.url, "http://127.0.0.1").pathname : "/";
    const payload = routes[requestPath];

    if (payload === undefined) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(payload));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to resolve mock server address");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      }),
  };
}

export async function startMockTextServer(
  routes: Record<
    string,
    | string
    | {
        body: string;
        contentType?: string;
        statusCode?: number;
      }
  >,
): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  const server = http.createServer((req, res) => {
    const requestPath = req.url ? new URL(req.url, "http://127.0.0.1").pathname : "/";
    const route = routes[requestPath];

    if (route === undefined) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Not found");
      return;
    }

    if (typeof route === "string") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end(route);
      return;
    }

    res.statusCode = route.statusCode ?? 200;
    res.setHeader("Content-Type", route.contentType ?? "text/plain; charset=utf-8");
    res.end(route.body);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to resolve mock server address");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      }),
  };
}

export async function startMockBinaryServer(
  routes: Record<
    string,
    | Buffer
    | {
        body: Buffer;
        contentType?: string;
        statusCode?: number;
      }
  >,
): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  const server = http.createServer((req, res) => {
    const requestPath = req.url ? new URL(req.url, "http://127.0.0.1").pathname : "/";
    const route = routes[requestPath];

    if (route === undefined) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/octet-stream");
      res.end(Buffer.from("Not found", "utf-8"));
      return;
    }

    if (Buffer.isBuffer(route)) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/octet-stream");
      res.end(route);
      return;
    }

    res.statusCode = route.statusCode ?? 200;
    res.setHeader("Content-Type", route.contentType ?? "application/octet-stream");
    res.end(route.body);
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to resolve mock server address");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      }),
  };
}

export async function getUnusedLocalBaseUrl(): Promise<string> {
  const server = http.createServer((_req, res) => {
    res.statusCode = 204;
    res.end();
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to resolve unused local address");
  }

  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  return `http://127.0.0.1:${address.port}`;
}

export async function createZipFixture(
  files: Record<string, string | Buffer>,
): Promise<{
  zipPath: string;
  cleanup: () => void;
}> {
  const compressing = require("compressing");
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "toonflow-zip-fixture-"));
  const sourceRoot = path.join(fixtureRoot, "payload");
  const zipPath = path.join(fixtureRoot, "payload.zip");

  for (const [relativePath, content] of Object.entries(files)) {
    const normalizedSegments = relativePath.split(/[\\/]+/).filter(Boolean);
    const filePath = path.join(sourceRoot, ...normalizedSegments);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }

  await compressing.zip.compressDir(sourceRoot, zipPath, { ignoreBase: true });

  return {
    zipPath,
    cleanup: () => {
      fs.rmSync(fixtureRoot, { recursive: true, force: true });
    },
  };
}
