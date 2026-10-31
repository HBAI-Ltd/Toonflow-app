import { computed, onScopeDispose, ref, watch, type Ref } from "vue";
import { useNode, useVueFlow } from "@vue-flow/core";
import { nodeTools, z } from "@toonflow/nodes-scaffold/nodeTools";
import { useNodePersistence, type NodePersistenceContext } from "@toonflow/nodes-scaffold/nodeDocument";
import type { NodeAudioRequest, NodeImageRequest, NodeMediaResult, NodeMediaTaskStatus, NodeVideoRequest, useNodeAi } from "@toonflow/nodes-scaffold/nodeAi";
import type { NodeOutputs } from "@toonflow/nodes-scaffold/values";
import { showNodeError } from "./showNodeError";

export type NodeGenerationTask = {
  taskId: string;
  directory: string;
  canvasPath: string;
  nodeId: string;
  mediaType: "image" | "video" | "audio";
  providerId: string;
  modelId: string;
  state: "submitting" | NonNullable<NodeMediaTaskStatus["state"]>;
  resumable?: boolean;
  providerData?: unknown;
  recoveryData?: unknown;
  applied?: boolean;
};

type GenerationOptions = {
  ai: ReturnType<typeof useNodeAi>;
  recover?: (results: NodeMediaResult[], task: NodeGenerationTask, signal: AbortSignal) => Promise<NodeMediaResult[]>;
};

export function useNodeGeneration(outputs: Readonly<Ref<NodeOutputs>>, cancel: () => void, options?: GenerationOptions) {
  const { id, node } = useNode();
  const { findNode } = useVueFlow();
  const getPersistence = useNodePersistence();
  const savedData = computed(() => node.data as { mediaTask?: NodeGenerationTask });
  const lifetime = new AbortController();
  let executionController: AbortController | undefined;
  let recoveryController: AbortController | undefined;
  let recovering: Promise<void> | undefined;
  let attemptedTaskId = "";
  const status = ref<"idle" | "running" | "succeeded" | "failed">("idle");
  const error = ref("");
  const cancelling = ref(false);
  const generating = computed(() => status.value === "running");
  const pendingRecovery = computed(() => !generating.value && needsRecovery());
  const getStatus = () => ({ status: status.value, outputs: outputs.value, ...(error.value ? { error: error.value } : {}),
    ...(savedData.value.mediaTask ? { task: { taskId: savedData.value.mediaTask.taskId, state: savedData.value.mediaTask.state, resumable: savedData.value.mediaTask.resumable } } : {}) });

  nodeTools.register({
    name: "getGenerationStatus",
    description: "查询节点生成或恢复状态（idle/running/succeeded/failed）、当前输出和最近一次错误。查询中断保留任务，下次生成操作优先复查已有任务，不会重复提交",
    parameters: z.strictObject({}),
    execute: getStatus,
  });
  nodeTools.register({
    name: "cancelGeneration",
    description: "明确放弃当前任务并停止等待，允许之后重新生成；结果未知时须先核对供应商任务。cancellationRequested 表示已发出停止请求，不会删除已有输出，不能保证供应商撤销任务或费用",
    parameters: z.strictObject({}),
    async execute() {
      const cancellationRequested = generating.value || needsRecovery();
      if (cancellationRequested) await cancelGeneration();
      return { ...getStatus(), cancellationRequested };
    },
  });

  function needsRecovery() {
    const task = savedData.value.mediaTask;
    // ACT: applied 仅在成功后释放任务；替换输出不能放弃仍可能已接单的任务。
    return !!task && task.state !== "failed" && task.state !== "cancelled" && (task.state !== "succeeded" || !task.applied);
  }

  function checkTask(task: NodeGenerationTask, context: NodePersistenceContext) {
    lifetime.signal.throwIfAborted();
    if (task.state === "cancelled") throw new DOMException("生成已取消", "AbortError");
    if (findNode(id) !== node || savedData.value.mediaTask?.taskId !== task.taskId || task.directory !== context.directory || getPersistence?.()?.directory !== context.directory) {
      throw new Error("节点或工作区已变化，本次任务结果不再应用");
    }
  }

  function taskOptions(task: NodeGenerationTask, context: NodePersistenceContext, signal: AbortSignal) {
    return {
      taskId: task.taskId, nodeId: id, canvasPath: task.canvasPath,
      isCancelled: () => task.state === "cancelled",
      async onStatus(value: NodeMediaTaskStatus) {
        checkTask(task, context);
        if (value.nodeId && value.nodeId !== id) throw new Error("生成任务不属于当前节点");
        if (value.canvasPath && value.canvasPath !== task.canvasPath) throw new Error("生成任务的原画布归属不一致");
        const before = JSON.stringify([task.state, task.resumable, task.providerData]);
        if (value.state) task.state = value.state;
        if (value.resumable !== undefined) task.resumable = value.resumable;
        if (value.providerData !== undefined) task.providerData = value.providerData;
        if (before !== JSON.stringify([task.state, task.resumable, task.providerData])) {
          const current = getPersistence?.();
          if (!current) throw new Error("画布已关闭，无法保存任务状态");
          await current.save(signal);
        }
        if (task.state === "interrupted" && task.resumable === false) {
          throw new Error([value.result?.message, "上次生成结果未知，可能已接单或扣费。请先核对供应商任务；如需重新生成，请点击“放弃任务”。"].filter(Boolean).join("\n"));
        }
      },
    };
  }

  async function generate<T extends "image" | "video" | "audio">(mediaType: T, input: NodeImageRequest | NodeVideoRequest | NodeAudioRequest, signal: AbortSignal, recoveryData?: unknown) {
    if (!options) throw new Error("节点未提供媒体生成能力");
    if (needsRecovery()) throw new Error("当前节点仍有未确认的生成任务，请先复查或明确放弃此任务后再生成");
    const context = getPersistence?.();
    if (!context || context.directory !== input.directory) throw new Error("画布尚未就绪，无法保存生成任务");
    let task: NodeGenerationTask = {
      taskId: crypto.randomUUID(), directory: context.directory, canvasPath: context.canvasPath, nodeId: id,
      mediaType, providerId: input.providerId, modelId: input.modelId, state: "submitting",
      ...(recoveryData === undefined ? {} : { recoveryData: JSON.parse(JSON.stringify(recoveryData)) }),
    };
    savedData.value.mediaTask = task;
    task = savedData.value.mediaTask;
    const waitingSignal = AbortSignal.any([lifetime.signal, signal]);
    try { await context.save(waitingSignal); }
    catch (error) { if (task.state !== "cancelled") task.state = "failed"; throw error; }
    signal.throwIfAborted();
    checkTask(task, context);
    const requestOptions = taskOptions(task, context, waitingSignal);
    try {
      const result = mediaType === "image" ? await options.ai.generateImage(input as NodeImageRequest, signal, requestOptions)
        : mediaType === "video" ? await options.ai.generateVideo(input as NodeVideoRequest, signal, requestOptions)
        : await options.ai.generateAudio(input as NodeAudioRequest, signal, requestOptions);
      checkTask(task, context);
      signal.throwIfAborted();
      return result as Extract<NodeMediaResult, { mediaType: T }>[];
    } catch (error) {
      // 只有明确拒绝接单的响应才能释放任务；断线、超时、冲突和 5xx 仍须先按 ID 复查。
      if (task.state === "submitting" && (error as { mediaTaskRejected?: boolean })?.mediaTaskRejected === true) {
        task.state = "failed";
        task.resumable = false;
        const current = getPersistence?.();
        if (current?.directory === context.directory && findNode(id) === node && savedData.value.mediaTask?.taskId === task.taskId) await current.save();
      }
      throw error;
    }
  }

  async function finish(signal: AbortSignal) {
    const task = savedData.value.mediaTask;
    if (!options || !task) return;
    const context = getPersistence?.();
    if (!context) throw new Error("画布已关闭，生成结果将在重新打开后恢复");
    checkTask(task, context);
    const applied = task.applied;
    task.applied = true;
    try { await context.save(signal); }
    catch (error) { task.applied = applied; throw error; }
  }

  async function execute<T>(action: () => Promise<T>): Promise<T> {
    if (cancelling.value) throw new Error("任务正在取消，请稍后重试");
    if (generating.value) throw new Error("节点正在生成，请等待完成");
    const controller = executionController = new AbortController();
    status.value = "running";
    error.value = "";
    try {
      const result = await action();
      await finish(AbortSignal.any([lifetime.signal, controller.signal]));
      status.value = "succeeded";
      return result;
    } catch (failure) {
      status.value = "failed";
      const message = (failure as { response?: { data?: { message?: string } } })?.response?.data?.message;
      error.value = failure instanceof Error && failure.name === "AbortError" ? "生成已取消"
        : message || (failure instanceof Error ? failure.message : "生成失败");
      throw failure;
    } finally {
      if (executionController === controller) executionController = undefined;
    }
  }

  function resume() {
    if (recovering) return recovering;
    const task = savedData.value.mediaTask;
    const context = getPersistence?.();
    if (!options || !task || !context || !needsRecovery()) return Promise.resolve();
    if (task.nodeId !== id || task.directory !== context.directory || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.taskId)
      || !["image", "video", "audio"].includes(task.mediaType)) return Promise.reject(new Error("保存的生成任务归属无效，请放弃此任务后重新生成"));
    recoveryController = new AbortController();
    const signal = AbortSignal.any([lifetime.signal, recoveryController.signal]);
    recovering = execute(async () => {
      let results = await options.ai.resumeMedia(task.directory, task.taskId, signal, taskOptions(task, context, signal));
      checkTask(task, context);
      if (task.applied) return;
      if (options.recover) results = await options.recover(results, task, signal);
      signal.throwIfAborted();
      checkTask(task, context);
      const result = results[0];
      if (!result || result.mediaType !== task.mediaType) throw new Error("生成任务未返回对应的媒体结果");
      if (result.mediaType === "image") outputs.value.image = { dataType: "IMAGE", value: { url: result.path, mimeType: result.mimeType } };
      else if (result.mediaType === "video") outputs.value.video = { dataType: "VIDEO", value: { url: result.path, mimeType: result.mimeType } };
      else outputs.value.audio = { dataType: "AUDIO", value: { url: result.path, mimeType: result.mimeType } };
    }).finally(() => { recovering = undefined; recoveryController = undefined; });
    return recovering;
  }

  async function run(action: () => Promise<void>) {
    if (needsRecovery()) return resume();
    return execute(action);
  }

  async function cancelGeneration(persist = true) {
    if (cancelling.value) throw new Error("任务正在取消，请稍后重试");
    cancelling.value = true;
    try {
      const task = savedData.value.mediaTask;
      const context = getPersistence?.();
      if (options && task && needsRecovery()) {
        if (!context) throw new Error("工作区已变化，无法取消此节点任务");
        // ACT: 项目移动后的旧任务仅在当前节点放弃，不请求原目录的后台任务。
        if (task.directory === context.directory) await options.ai.cancelMedia(task.directory, task.taskId);
        const current = getPersistence?.();
        if (savedData.value.mediaTask?.taskId === task.taskId && current?.directory === context.directory && findNode(id) === node) {
          const { state, resumable } = task;
          task.state = "cancelled";
          task.resumable = false;
          try { if (persist) await current.save(); }
          catch (error) { task.state = state; task.resumable = resumable; throw error; }
        }
      }
      recoveryController?.abort();
      executionController?.abort();
      cancel();
      await recovering?.catch(() => {});
    } finally {
      cancelling.value = false;
    }
  }

  watch(() => getPersistence?.()?.canvasPath, path => {
    const task = savedData.value.mediaTask;
    if (!path || !options || !task || generating.value || !needsRecovery() || attemptedTaskId === task.taskId) return;
    attemptedTaskId = task.taskId;
    void resume().catch(error => { if (!lifetime.signal.aborted) showNodeError(error, "生成任务恢复失败"); });
  }, { immediate: true, flush: "post" });
  watch(outputs, () => {
    // 保留用户替换或编辑的输出；未决任务仍须复查完成或明确放弃，不能借此重新提交。
    if (!generating.value && needsRecovery() && savedData.value.mediaTask) savedData.value.mediaTask.applied = true;
  }, { deep: true, flush: "sync" });
  onScopeDispose(() => lifetime.abort());

  return { generating, pendingRecovery, cancelling, run, generate, resume, cancel: cancelGeneration };
}
