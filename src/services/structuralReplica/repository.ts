import u from "@/utils";
import type {
  o_sr_asset_binding,
  o_sr_asset_gap,
  o_sr_consistency_report,
  o_sr_dialogue_structure,
  o_sr_frame_sample,
  o_sr_frame_understanding,
  o_sr_generation_candidate,
  o_sr_generation_job,
  o_sr_model_route,
  o_sr_provider_capability,
  o_sr_quality_report,
  o_sr_regenerated_storyboard,
  o_sr_shot_detection,
  o_sr_shot_adaptation,
  o_sr_source_media,
  o_sr_story_ir,
  o_sr_storyboard_mapping,
  o_sr_task,
  o_sr_timeline_export,
  o_sr_transcript,
  o_sr_upload_part,
} from "@/types/database";
import type {
  AssetBinding,
  AssetGap,
  ConsistencyReport,
  CreateTaskInput,
  DialogueStructure,
  FrameSample,
  FrameUnderstanding,
  RegeneratedStoryboard,
  ShotDetection,
  ShotAdaptation,
  SourceMedia,
  StructuralIr,
  Transcript,
  ProviderCapability,
  ModelRoute,
} from "./schemas";
import { assertTransition, SrTaskStatus } from "./taskState";
import { decryptSecret, encryptSecret, redactProviderCapability } from "./securityService";

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;
type LatestTaskTables = {
  o_sr_transcript: o_sr_transcript;
  o_sr_shot_detection: o_sr_shot_detection;
  o_sr_story_ir: o_sr_story_ir;
  o_sr_dialogue_structure: o_sr_dialogue_structure;
  o_sr_asset_gap: o_sr_asset_gap;
  o_sr_regenerated_storyboard: o_sr_regenerated_storyboard;
  o_sr_consistency_report: o_sr_consistency_report;
};

export interface TaskBundle {
  task: o_sr_task;
  sourceMedia?: o_sr_source_media;
  transcript?: o_sr_transcript;
  shotDetection?: o_sr_shot_detection;
  frameSamples: o_sr_frame_sample[];
  frameUnderstanding: o_sr_frame_understanding[];
  storyIr?: o_sr_story_ir;
  dialogueStructure?: o_sr_dialogue_structure;
  assetGap?: o_sr_asset_gap;
  bindings: o_sr_asset_binding[];
  shotAdaptations: o_sr_shot_adaptation[];
  regeneratedStoryboard?: o_sr_regenerated_storyboard;
  report?: o_sr_consistency_report;
  mapping: o_sr_storyboard_mapping[];
  modelRoutes: o_sr_model_route[];
  generationJobs: o_sr_generation_job[];
  generationCandidates: o_sr_generation_candidate[];
  qualityReports: o_sr_quality_report[];
  timelineExports: o_sr_timeline_export[];
}

function jsonStringify(data: JsonValue): string {
  return typeof data === "string" ? data : JSON.stringify(data);
}

function parseJson<T>(data: string | null | undefined, fallback: T): T {
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

async function getLatestByTask<TTable extends keyof LatestTaskTables>(
  table: TTable,
  taskId: number,
): Promise<LatestTaskTables[TTable] | undefined> {
  return (await u.db(table).where("taskId", taskId).orderBy("id", "desc").first()) as LatestTaskTables[TTable] | undefined;
}

export async function createTask(input: CreateTaskInput): Promise<o_sr_task> {
  const now = Date.now();
  const [id] = await u.db("o_sr_task").insert({
    projectId: input.projectId,
    scriptId: null,
    name: input.name,
    status: "draft",
    platform: input.platform,
    aspectRatio: input.aspectRatio,
    createdAt: now,
    updatedAt: now,
    errorReason: null,
  });
  return await getTaskOrThrow(Number(id));
}

export async function getTaskOrThrow(taskId: number): Promise<o_sr_task> {
  const task = await u.db("o_sr_task").where("id", taskId).first();
  if (!task) throw new Error(`Structural replica task not found: ${taskId}`);
  return task;
}

export async function updateTaskStatus(taskId: number, status: SrTaskStatus, errorReason?: string | null): Promise<o_sr_task> {
  const task = await getTaskOrThrow(taskId);
  assertTransition(task.status || "", status);
  await u
    .db("o_sr_task")
    .where("id", taskId)
    .update({
      status,
      updatedAt: Date.now(),
      errorReason: errorReason === undefined ? task.errorReason : errorReason,
    });
  return await getTaskOrThrow(taskId);
}

export async function saveSourceMedia(input: SourceMedia): Promise<o_sr_source_media> {
  const now = Date.now();
  const existing = await u.db("o_sr_source_media").where("taskId", input.taskId).first();
  const row = {
    taskId: input.taskId,
    sourcePath: input.sourcePath,
    normalizedPath: input.normalizedPath ?? null,
    audioPath: input.audioPath ?? null,
    coverPath: input.coverPath ?? null,
    mediaJson: input.mediaJson ?? null,
    sha256: input.sha256 ?? null,
    sizeBytes: input.sizeBytes,
    durationSec: input.durationSec ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    fps: input.fps ?? null,
    hasAudio: input.hasAudio,
    updatedAt: now,
  };

  if (existing?.id) {
    await u.db("o_sr_source_media").where("id", existing.id).update(row);
    return (await u.db("o_sr_source_media").where("id", existing.id).first())!;
  }

  const [id] = await u.db("o_sr_source_media").insert({ ...row, createdAt: now });
  return (await u.db("o_sr_source_media").where("id", Number(id)).first())!;
}

export async function saveUploadPart(input: Omit<o_sr_upload_part, "id" | "createdAt">): Promise<o_sr_upload_part> {
  await u
    .db("o_sr_upload_part")
    .where({ taskId: input.taskId, uploadId: input.uploadId, partIndex: input.partIndex })
    .delete();
  const [id] = await u.db("o_sr_upload_part").insert({
    ...input,
    createdAt: Date.now(),
  });
  return (await u.db("o_sr_upload_part").where("id", Number(id)).first())!;
}

export async function listUploadParts(taskId: number, uploadId: string): Promise<o_sr_upload_part[]> {
  return await u.db("o_sr_upload_part").where({ taskId, uploadId }).orderBy("partIndex", "asc");
}

export async function saveTranscript(taskId: number, transcript: Transcript): Promise<o_sr_transcript> {
  const avgSpeechRateCps = averageSpeechRate(transcript.segments.map((segment) => segment.speechRateCps ?? null));
  const [id] = await u.db("o_sr_transcript").insert({
    taskId,
    engine: transcript.engine,
    model: transcript.model,
    dataJson: jsonStringify(transcript),
    avgSpeechRateCps,
    createdAt: Date.now(),
  });
  return (await u.db("o_sr_transcript").where("id", Number(id)).first())!;
}

export async function saveShotDetection(taskId: number, shotDetection: ShotDetection): Promise<o_sr_shot_detection> {
  const now = Date.now();
  const [id] = await u.db("o_sr_shot_detection").insert({
    taskId,
    engine: shotDetection.engine,
    dataJson: jsonStringify(shotDetection),
    shotCount: shotDetection.shots.length,
    createdAt: now,
    updatedAt: now,
  });
  return (await u.db("o_sr_shot_detection").where("id", Number(id)).first())!;
}

export async function saveFrameSamples(taskId: number, samples: FrameSample[]): Promise<o_sr_frame_sample[]> {
  await u.db("o_sr_frame_sample").where("taskId", taskId).delete();
  if (!samples.length) return [];

  await u.db("o_sr_frame_sample").insert(
    samples.map((sample) => ({
      taskId,
      shotId: sample.shotId,
      frameType: sample.frameType,
      timeSec: sample.timeSec,
      filePath: sample.filePath,
      qualityScore: sample.qualityScore ?? null,
      createdAt: Date.now(),
    })),
  );
  return await u.db("o_sr_frame_sample").where("taskId", taskId).orderBy("id", "asc");
}

export async function saveFrameUnderstanding(taskId: number, understanding: FrameUnderstanding): Promise<o_sr_frame_understanding> {
  const now = Date.now();
  const existing = await u.db("o_sr_frame_understanding").where({ taskId, shotId: understanding.shotId }).first();
  const row = {
    taskId,
    shotId: understanding.shotId,
    provider: understanding.provider,
    dataJson: jsonStringify(understanding),
    reviewRequired: understanding.reviewRequired ? 1 : 0,
    updatedAt: now,
  };

  if (existing?.id) {
    await u.db("o_sr_frame_understanding").where("id", existing.id).update(row);
    return (await u.db("o_sr_frame_understanding").where("id", existing.id).first())!;
  }

  const [id] = await u.db("o_sr_frame_understanding").insert({ ...row, createdAt: now });
  return (await u.db("o_sr_frame_understanding").where("id", Number(id)).first())!;
}

export async function clearFrameUnderstanding(taskId: number): Promise<void> {
  await u.db("o_sr_frame_understanding").where("taskId", taskId).delete();
}

export async function clearDerivedArtifactsFromFrameUnderstanding(taskId: number): Promise<void> {
  await Promise.all([
    u.db("o_sr_frame_understanding").where("taskId", taskId).delete(),
    u.db("o_sr_story_ir").where("taskId", taskId).delete(),
    u.db("o_sr_dialogue_structure").where("taskId", taskId).delete(),
    u.db("o_sr_asset_gap").where("taskId", taskId).delete(),
    u.db("o_sr_asset_binding").where("taskId", taskId).delete(),
    u.db("o_sr_shot_adaptation").where("taskId", taskId).delete(),
    u.db("o_sr_regenerated_storyboard").where("taskId", taskId).delete(),
    u.db("o_sr_consistency_report").where("taskId", taskId).delete(),
    u.db("o_sr_storyboard_mapping").where("taskId", taskId).delete(),
    u.db("o_sr_model_route").where("taskId", taskId).delete(),
    u.db("o_sr_generation_job").where("taskId", taskId).delete(),
    u.db("o_sr_generation_candidate").where("taskId", taskId).delete(),
    u.db("o_sr_generation_cost").where("taskId", taskId).delete(),
    u.db("o_sr_quality_report").where("taskId", taskId).delete(),
    u.db("o_sr_timeline_export").where("taskId", taskId).delete(),
  ]);
}

export async function clearDerivedArtifactsFromStoryIr(taskId: number): Promise<void> {
  await Promise.all([
    u.db("o_sr_dialogue_structure").where("taskId", taskId).delete(),
    u.db("o_sr_asset_gap").where("taskId", taskId).delete(),
    u.db("o_sr_asset_binding").where("taskId", taskId).delete(),
    u.db("o_sr_shot_adaptation").where("taskId", taskId).delete(),
    u.db("o_sr_regenerated_storyboard").where("taskId", taskId).delete(),
    u.db("o_sr_consistency_report").where("taskId", taskId).delete(),
    u.db("o_sr_storyboard_mapping").where("taskId", taskId).delete(),
    u.db("o_sr_model_route").where("taskId", taskId).delete(),
    u.db("o_sr_generation_job").where("taskId", taskId).delete(),
    u.db("o_sr_generation_candidate").where("taskId", taskId).delete(),
    u.db("o_sr_generation_cost").where("taskId", taskId).delete(),
    u.db("o_sr_quality_report").where("taskId", taskId).delete(),
    u.db("o_sr_timeline_export").where("taskId", taskId).delete(),
  ]);
}

export async function clearDerivedArtifactsFromDialogue(taskId: number): Promise<void> {
  await Promise.all([
    u.db("o_sr_regenerated_storyboard").where("taskId", taskId).delete(),
    u.db("o_sr_consistency_report").where("taskId", taskId).delete(),
    u.db("o_sr_storyboard_mapping").where("taskId", taskId).delete(),
    u.db("o_sr_model_route").where("taskId", taskId).delete(),
    u.db("o_sr_generation_job").where("taskId", taskId).delete(),
    u.db("o_sr_generation_candidate").where("taskId", taskId).delete(),
    u.db("o_sr_generation_cost").where("taskId", taskId).delete(),
    u.db("o_sr_quality_report").where("taskId", taskId).delete(),
    u.db("o_sr_timeline_export").where("taskId", taskId).delete(),
  ]);
}

export async function clearDerivedArtifactsFromAssetBindings(taskId: number): Promise<void> {
  await Promise.all([
    u.db("o_sr_shot_adaptation").where("taskId", taskId).delete(),
    u.db("o_sr_regenerated_storyboard").where("taskId", taskId).delete(),
    u.db("o_sr_consistency_report").where("taskId", taskId).delete(),
    u.db("o_sr_storyboard_mapping").where("taskId", taskId).delete(),
    u.db("o_sr_model_route").where("taskId", taskId).delete(),
    u.db("o_sr_generation_job").where("taskId", taskId).delete(),
    u.db("o_sr_generation_candidate").where("taskId", taskId).delete(),
    u.db("o_sr_generation_cost").where("taskId", taskId).delete(),
    u.db("o_sr_quality_report").where("taskId", taskId).delete(),
    u.db("o_sr_timeline_export").where("taskId", taskId).delete(),
  ]);
}

export async function saveStoryIr(taskId: number, storyIr: StructuralIr): Promise<o_sr_story_ir> {
  const now = Date.now();
  const [id] = await u.db("o_sr_story_ir").insert({
    taskId,
    dataJson: jsonStringify(storyIr),
    shotCount: storyIr.shots.length,
    createdAt: now,
    updatedAt: now,
  });
  return (await u.db("o_sr_story_ir").where("id", Number(id)).first())!;
}

export async function saveDialogueStructure(taskId: number, dialogueStructure: DialogueStructure): Promise<o_sr_dialogue_structure> {
  const now = Date.now();
  const [id] = await u.db("o_sr_dialogue_structure").insert({
    taskId,
    version: dialogueStructure.version,
    status: dialogueStructure.status,
    dataJson: jsonStringify(dialogueStructure),
    createdAt: now,
    updatedAt: now,
  });
  return (await u.db("o_sr_dialogue_structure").where("id", Number(id)).first())!;
}

export async function saveAssetGap(taskId: number, assetGap: AssetGap): Promise<o_sr_asset_gap> {
  const now = Date.now();
  const [id] = await u.db("o_sr_asset_gap").insert({
    taskId,
    dataJson: jsonStringify(assetGap),
    missingCount: assetGap.missingCount,
    createdAt: now,
    updatedAt: now,
  });
  return (await u.db("o_sr_asset_gap").where("id", Number(id)).first())!;
}

export async function saveAssetBindings(taskId: number, bindings: AssetBinding[]): Promise<o_sr_asset_binding[]> {
  await u.db("o_sr_asset_binding").where("taskId", taskId).delete();
  if (!bindings.length) return [];

  await u.db("o_sr_asset_binding").insert(
    bindings.map((binding) => ({
      taskId,
      shotId: binding.shotId,
      slotName: binding.slotName,
      slotType: binding.slotType,
      assetId: binding.assetId,
      bindingStatus: binding.bindingStatus,
      note: binding.note ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })),
  );
  return await u.db("o_sr_asset_binding").where("taskId", taskId).orderBy("id", "asc");
}

export async function saveShotAdaptations(taskId: number, adaptations: ShotAdaptation[]): Promise<o_sr_shot_adaptation[]> {
  await u.db("o_sr_shot_adaptation").where("taskId", taskId).delete();
  if (!adaptations.length) return [];

  const now = Date.now();
  await u.db("o_sr_shot_adaptation").insert(
    adaptations.map((adaptation) => ({
      taskId,
      shotId: adaptation.shotId,
      level: adaptation.adaptationLevel,
      strategy: adaptation.adaptationStrategy,
      assetMatchScore: adaptation.assetMatchScore,
      requiredSlotsJson: jsonStringify(adaptation.requiredSlots),
      matchedAssetsJson: jsonStringify(adaptation.matchedAssets),
      adaptedVisual: adaptation.adaptedVisual,
      blockedReasonsJson: jsonStringify(adaptation.blockedReasons),
      downgradeReasonsJson: jsonStringify(adaptation.downgradeReasons),
      createdAt: now,
      updatedAt: now,
    })),
  );
  return await u.db("o_sr_shot_adaptation").where("taskId", taskId).orderBy("id", "asc");
}

export function parseShotAdaptationRow(row: o_sr_shot_adaptation): ShotAdaptation {
  return {
    taskId: Number(row.taskId),
    shotId: String(row.shotId || ""),
    adaptationLevel: row.level as ShotAdaptation["adaptationLevel"],
    adaptationStrategy: row.strategy as ShotAdaptation["adaptationStrategy"],
    assetMatchScore: Number(row.assetMatchScore || 0),
    requiredSlots: parseJson<string[]>(row.requiredSlotsJson, []),
    matchedAssets: parseJson<ShotAdaptation["matchedAssets"]>(row.matchedAssetsJson, {}),
    adaptedVisual: row.adaptedVisual || "",
    blockedReasons: parseJson<string[]>(row.blockedReasonsJson, []),
    downgradeReasons: parseJson<string[]>(row.downgradeReasonsJson, []),
  };
}

export async function saveRegeneratedStoryboard(taskId: number, storyboard: RegeneratedStoryboard): Promise<o_sr_regenerated_storyboard> {
  const now = Date.now();
  const [id] = await u.db("o_sr_regenerated_storyboard").insert({
    taskId,
    version: storyboard.version,
    dataJson: jsonStringify(storyboard),
    createdAt: now,
    updatedAt: now,
  });
  return (await u.db("o_sr_regenerated_storyboard").where("id", Number(id)).first())!;
}

export async function saveConsistencyReport(taskId: number, report: ConsistencyReport): Promise<o_sr_consistency_report> {
  const [id] = await u.db("o_sr_consistency_report").insert({
    taskId,
    status: report.status,
    reportJson: jsonStringify(report),
    reportMarkdown: report.markdown ?? null,
    createdAt: Date.now(),
  });
  return (await u.db("o_sr_consistency_report").where("id", Number(id)).first())!;
}

export async function saveStoryboardMappings(
  taskId: number,
  mappings: Omit<o_sr_storyboard_mapping, "id" | "taskId" | "createdAt">[],
): Promise<o_sr_storyboard_mapping[]> {
  await u.db("o_sr_storyboard_mapping").where("taskId", taskId).delete();
  if (!mappings.length) return [];

  await u.db("o_sr_storyboard_mapping").insert(
    mappings.map((mapping) => ({
      taskId,
      shotId: mapping.shotId,
      storyboardId: mapping.storyboardId,
      trackId: mapping.trackId,
      createdAt: Date.now(),
    })),
  );
  return await u.db("o_sr_storyboard_mapping").where("taskId", taskId).orderBy("id", "asc");
}

export async function listProviderCapabilities(): Promise<ProviderCapability[]> {
  const rows = (await u.db("o_sr_provider_capability").orderBy("id", "asc")) as o_sr_provider_capability[];
  return rows.map((row) =>
    redactProviderCapability({
      ...parseJson<ProviderCapability>(row.capabilityJson, {
        providerId: row.providerId || "",
        providerType: (row.providerType as ProviderCapability["providerType"]) || "openai_compatible",
        displayName: row.displayName || undefined,
        baseUrl: row.baseUrl || "",
        apiKey: "",
        enabled: row.enabled !== 0,
        models: [],
      }),
      providerId: row.providerId || "",
      providerType: (row.providerType as ProviderCapability["providerType"]) || "openai_compatible",
      displayName: row.displayName || undefined,
      baseUrl: row.baseUrl || "",
      apiKey: "",
      enabled: row.enabled !== 0,
    }),
  );
}

export async function upsertProviderCapability(capability: ProviderCapability): Promise<ProviderCapability> {
  const now = Date.now();
  const existing = await u.db("o_sr_provider_capability").where("providerId", capability.providerId).first();
  const existingPayload = parseJson<ProviderCapability | null>(existing?.capabilityJson, null);
  const savedApiKey = capability.apiKey
    ? await encryptSecret(capability.apiKey)
    : existingPayload?.apiKey
      ? await encryptSecret(existingPayload.apiKey)
      : "";
  const storedCapability: ProviderCapability = {
    ...capability,
    apiKey: savedApiKey,
  };
  const row = {
    providerId: capability.providerId,
    providerType: capability.providerType,
    displayName: capability.displayName ?? null,
    baseUrl: capability.baseUrl ?? null,
    capabilityJson: jsonStringify(storedCapability),
    enabled: capability.enabled ? 1 : 0,
    updatedAt: now,
  };
  if (existing?.id) {
    await u.db("o_sr_provider_capability").where("id", existing.id).update(row);
  } else {
    await u.db("o_sr_provider_capability").insert({ ...row, createdAt: now });
  }
  const saved = (await listProviderCapabilities()).find((item) => item.providerId === capability.providerId);
  if (!saved) throw new Error(`provider capability was not saved: ${capability.providerId}`);
  return saved;
}

export async function getProviderCapabilityWithSecret(providerId: string): Promise<ProviderCapability | undefined> {
  const row = await u.db("o_sr_provider_capability").where("providerId", providerId).first();
  if (!row) return undefined;
  const capability = parseJson<ProviderCapability>(row.capabilityJson, {
    providerId: row.providerId || "",
    providerType: (row.providerType as ProviderCapability["providerType"]) || "openai_compatible",
    displayName: row.displayName || undefined,
    baseUrl: row.baseUrl || "",
    apiKey: "",
    enabled: row.enabled !== 0,
    models: [],
  });
  return {
    ...capability,
    apiKey: await decryptSecret(capability.apiKey),
  };
}

export async function recordProviderProbe(input: {
  providerId: string;
  model?: string | null;
  status: "available" | "unavailable";
  latencyMs?: number | null;
  errorReason?: string | null;
  result?: JsonValue;
}) {
  const [id] = await u.db("o_sr_model_probe_result").insert({
    providerId: input.providerId,
    model: input.model ?? null,
    status: input.status,
    latencyMs: input.latencyMs ?? null,
    errorReason: input.errorReason ?? null,
    resultJson: stringifyOptional(input.result),
    createdAt: Date.now(),
  });
  return await u.db("o_sr_model_probe_result").where("id", Number(id)).first();
}

function stringifyOptional(data: JsonValue | undefined): string | null {
  if (data === undefined) return null;
  return jsonStringify(data);
}

export async function saveModelRoutes(taskId: number, routes: ModelRoute[]): Promise<o_sr_model_route[]> {
  await u.db("o_sr_model_route").where("taskId", taskId).delete();
  if (!routes.length) return [];
  const now = Date.now();
  await u.db("o_sr_model_route").insert(
    routes.map((route) => ({
      taskId,
      shotId: route.shotId,
      selectedProviderId: route.selectedProviderId,
      selectedModel: route.selectedModel,
      routeStatus: route.routeStatus,
      requiredCapabilitiesJson: jsonStringify(route.requiredCapabilities),
      fallbackPlanJson: jsonStringify(route.fallbackPlan),
      downgradeReasonsJson: jsonStringify(route.downgradeReasons),
      createdAt: now,
      updatedAt: now,
    })),
  );
  return await u.db("o_sr_model_route").where("taskId", taskId).orderBy("id", "asc");
}

export function parseModelRouteRow(row: o_sr_model_route): ModelRoute {
  return {
    taskId: Number(row.taskId),
    shotId: row.shotId || "",
    selectedProviderId: row.selectedProviderId ?? null,
    selectedModel: row.selectedModel ?? null,
    routeStatus: (row.routeStatus as ModelRoute["routeStatus"]) || "blocked",
    requiredCapabilities: parseJson<string[]>(row.requiredCapabilitiesJson, []),
    fallbackPlan: parseJson<string[]>(row.fallbackPlanJson, []),
    downgradeReasons: parseJson<string[]>(row.downgradeReasonsJson, []),
  };
}

export async function getTaskBundle(taskId: number): Promise<TaskBundle> {
  const task = await getTaskOrThrow(taskId);
  const [
    sourceMedia,
    transcript,
    shotDetection,
    frameSamples,
    frameUnderstanding,
    storyIr,
    dialogueStructure,
    assetGap,
    bindings,
    shotAdaptations,
    regeneratedStoryboard,
    report,
    mapping,
    modelRoutes,
    generationJobs,
    generationCandidates,
    qualityReports,
    timelineExports,
  ] = await Promise.all([
    u.db("o_sr_source_media").where("taskId", taskId).first(),
    getLatestByTask("o_sr_transcript", taskId),
    getLatestByTask("o_sr_shot_detection", taskId),
    u.db("o_sr_frame_sample").where("taskId", taskId).orderBy("id", "asc"),
    u.db("o_sr_frame_understanding").where("taskId", taskId).orderBy("id", "asc"),
    getLatestByTask("o_sr_story_ir", taskId),
    getLatestByTask("o_sr_dialogue_structure", taskId),
    getLatestByTask("o_sr_asset_gap", taskId),
    u.db("o_sr_asset_binding").where("taskId", taskId).orderBy("id", "asc"),
    u.db("o_sr_shot_adaptation").where("taskId", taskId).orderBy("id", "asc"),
    getLatestByTask("o_sr_regenerated_storyboard", taskId),
    getLatestByTask("o_sr_consistency_report", taskId),
    u.db("o_sr_storyboard_mapping").where("taskId", taskId).orderBy("id", "asc"),
    u.db("o_sr_model_route").where("taskId", taskId).orderBy("id", "asc"),
    u.db("o_sr_generation_job").where("taskId", taskId).orderBy("id", "desc"),
    u.db("o_sr_generation_candidate").where("taskId", taskId).orderBy("shotId", "asc").orderBy("candidateIndex", "asc").orderBy("id", "asc"),
    u.db("o_sr_quality_report").where("taskId", taskId).orderBy("id", "desc"),
    u.db("o_sr_timeline_export").where("taskId", taskId).orderBy("id", "desc"),
  ]);

  return {
    task,
    sourceMedia,
    transcript,
    shotDetection,
    frameSamples,
    frameUnderstanding,
    storyIr,
    dialogueStructure,
    assetGap,
    bindings,
    shotAdaptations,
    regeneratedStoryboard,
    report,
    mapping,
    modelRoutes,
    generationJobs,
    generationCandidates,
    qualityReports,
    timelineExports,
  };
}

function averageSpeechRate(values: (number | null)[]): number | null {
  const validValues = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!validValues.length) return null;
  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}
