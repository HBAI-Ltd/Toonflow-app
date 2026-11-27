import { computed, inject, onScopeDispose, ref, watch, type Ref } from "vue";
import { useNode, useVueFlow } from "@vue-flow/core";
import { nodeTools, z } from "@toonflow/nodes-scaffold/nodeTools";
import { useNodePersistence, type NodePersistenceContext } from "@toonflow/nodes-scaffold/nodeDocument";
import { findNodeModel, type NodeAudioRequest, type NodeImageRequest, type NodeMediaModel, type NodeMediaPrice, type NodeMediaPriceRequest, type NodeMediaResult, type NodeMediaTaskStatus, type NodeVideoRequest, type useNodeAi } from "@toonflow/nodes-scaffold/nodeAi";
import type { NodeOutputs } from "@toonflow/nodes-scaffold/values";
import { showNodeError } from "./showNodeError";
import { sumMediaPrices, type useMediaPrice } from "./useMediaPrice";

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
  models?: Readonly<Ref<readonly NodeMediaModel[]>>;
  quote?: ReturnType<typeof useMediaPrice>;
  /** 恢复时按任务顺序传入各任务结果，返回最终应用到输出的结果。 */
  recover?: (results: NodeMediaResult[][], tasks: NodeGenerationTask[], signal: AbortSignal) => Promise<NodeMediaResult[]>;
};
type MediaType = NodeGenerationTask["mediaType"];
type GenerationRequest = NodeImageRequest | NodeVideoRequest | NodeAudioRequest;

export type ConfirmMediaCost = (
  request: { providerId: string; providerLabel: string; mediaType: NodeGenerationTask["mediaType"] },
  getQuote: (signal: AbortSignal) => Promise<NodeMediaPrice | null>,
  signal: AbortSignal,
) => Promise<boolean>;

export function useNodeGeneration(outputs: Readonly<Ref<NodeOutputs>>, cancel: () => void, options?: GenerationOptions) {
  const { id, node } = useNode();
  const { findNode } = useVueFlow();
  const getPersistence = useNodePersistence();
  const confirmMediaCost = inject<ConfirmMediaCost | undefined>("confirmMediaCost", undefined);
  // ACT: 单任务仍保存为对象；批量任务（如多段重拍）保存为数组，整批一起成功、失败或取消。
  const savedData = computed(() => node.data as { mediaTask?: NodeGenerationTask | NodeGenerationTask[] });
  const savedTasks = () => [savedData.value.mediaTask ?? []].flat();
  const lifetime = new AbortController();
  const costCancelled = Symbol();
  let execution: { controller: AbortController; context?: NodePersistenceContext; taskId?: string } | undefined;
  let recoveryController: AbortController | undefined;
  let recovering: Promise<void> | undefined;
  let attemptedTaskId = "";
  const status = ref<"idle" | "preparing" | "running" | "succeeded" | "failed">("idle");
  const error = ref("");
  const cancelling = ref(false);
  const running = computed(() => status.value === "running");
  const generating = computed(() => status.value === "preparing" || running.value);
  const pendingRecovery = computed(() => !generating.value && needsRecovery());
  const costBlocked = computed(() => status.value === "preparing" || (!generating.value && !pendingRecovery.value && options?.quote?.blocked.value === true));
  const taskStatus = (task: NodeGenerationTask) => ({ taskId: task.taskId, state: task.state, resumable: task.resumable });
  const getStatus = () => {
    const tasks = savedTasks();
    return { status: generating.value ? "running" : status.value, outputs: outputs.value, ...(error.value ? { error: error.value } : {}),
      ...(tasks.length === 1 ? { task: taskStatus(tasks[0]!) } : tasks.length ? { tasks: tasks.map(taskStatus) } : {}) };
  };

  nodeTools.register({
    name: "getGenerationStatus",
    description: "查询节点生成或恢复状态（idle/running/succeeded/failed）、当前输出和最近一次错误。生成或恢复失败即结束任务，可直接重新生成；仅画布关闭时中断的任务会在重新打开后自动复查",
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

  function isPending(task: NodeGenerationTask) {
    // ACT: applied 仅在成功后释放任务；替换输出不能放弃仍可能已接单的任务。
    return task.state !== "failed" && task.state !== "cancelled" && (task.state !== "succeeded" || !task.applied);
  }

  function needsRecovery() {
    const tasks = savedTasks();
    return tasks.some(isPending) && tasks.every(task => task.state !== "failed" && task.state !== "cancelled");
  }

  function ownsTask(task: NodeGenerationTask, context: NodePersistenceContext) {
    return task.nodeId === id && task.directory === context.directory && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.taskId)
      && ["image", "video", "audio"].includes(task.mediaType);
  }

  // ACT: 失败即终态，节点回到可发送状态；卸载或画布已关闭时保留任务，重新打开后按 ID 复查。批量中其余未完成任务一并结束。
  async function release() {
    const tasks = savedTasks().filter(isPending);
    const context = getPersistence?.();
    if (!options || !tasks.length || !context || lifetime.signal.aborted || findNode(id) !== node) return;
    for (const task of tasks) {
      task.state = "failed";
      task.resumable = false;
    }
    // 清理失败不覆盖原始错误，未落盘时下次打开仍按 ID 复查；归属无效或项目已移动的任务只在本节点结束，不请求服务端。
    await Promise.all(tasks.filter(task => ownsTask(task, context)).map(task => options.ai.cancelMedia(task.directory, task.taskId).catch(() => {})));
    await context.save().catch(() => {});
  }

  function checkTask(task: NodeGenerationTask, context: NodePersistenceContext) {
    lifetime.signal.throwIfAborted();
    if (task.state === "cancelled") throw new DOMException("生成已取消", "AbortError");
    if (findNode(id) !== node || !savedTasks().some(item => item.taskId === task.taskId) || task.directory !== context.directory || getPersistence?.()?.directory !== context.directory) {
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
          throw new Error([value.result?.message, "上次生成结果未知，可能已接单或扣费；重新生成前请先核对供应商任务。"].filter(Boolean).join("\n"));
        }
      },
    };
  }

  /** 等待一批任务；任一失败即停止等待其余任务，由失败处理统一取消。 */
  function waitAll<T>(items: readonly NodeGenerationTask[], signal: AbortSignal, wait: (task: NodeGenerationTask, index: number, signal: AbortSignal) => Promise<T>) {
    const batch = new AbortController();
    const waiting = AbortSignal.any([signal, batch.signal]);
    return Promise.all(items.map((task, index) => wait(task, index, waiting).catch(error => {
      batch.abort(error);
      throw error;
    })));
  }

  async function generate<T extends MediaType>(mediaType: T, input: GenerationRequest, signal: AbortSignal, recoveryData?: unknown) {
    const [results] = await generateBatch(mediaType, [{ input, recoveryData }], signal);
    return results!;
  }

  /** 合计报价只确认一次，再并行提交；全部成功才返回各任务结果。 */
  async function generateBatch<T extends MediaType>(mediaType: T, items: readonly { input: GenerationRequest; recoveryData?: unknown }[], signal: AbortSignal) {
    if (!options) throw new Error("节点未提供媒体生成能力");
    if (!items.length) throw new Error("没有可提交的生成任务");
    if (needsRecovery()) throw new Error("当前节点仍有未确认的生成任务，已结束该任务，请重新生成");
    const context = execution ? execution.context : getPersistence?.();
    if (!context || items.some(item => item.input.directory !== context.directory)) throw new Error("画布尚未就绪，无法保存生成任务");
    if (!confirmMediaCost) throw new Error("费用提醒尚未就绪，请重新加载页面后再生成");
    const waitingSignal = AbortSignal.any([lifetime.signal, signal]);
    waitingSignal.throwIfAborted();
    // 报价和提交共用同一份参数快照，包含重绘参考图、时长和供应商自定义参数。
    const requests = items.map(item => ({ ...JSON.parse(JSON.stringify(item.input)), mediaType }) as NodeMediaPriceRequest);
    const recoveries = items.map(item => item.recoveryData === undefined ? undefined : JSON.parse(JSON.stringify(item.recoveryData)));
    const first = requests[0]!;
    const getQuote = (request: NodeMediaPriceRequest, quoteSignal: AbortSignal) => options.quote ? options.quote.getQuote(request, quoteSignal)
      : findNodeModel(options.models?.value ?? [], request)?.supportsPrice ? options.ai.getMediaPrice(request, quoteSignal) : Promise.resolve(null);
    const confirmed = await confirmMediaCost(
      { providerId: first.providerId, providerLabel: findNodeModel(options.models?.value ?? [], first)?.providerLabel || first.providerId, mediaType },
      async quoteSignal => sumMediaPrices(await Promise.all(requests.map(request => getQuote(request, quoteSignal)))),
      waitingSignal,
    );
    const current = getPersistence?.();
    if (!confirmed || waitingSignal.aborted || findNode(id) !== node || current?.directory !== context.directory || current.canvasPath !== context.canvasPath) throw costCancelled;
    if (needsRecovery()) throw new Error("节点正在生成，请等待完成");
    status.value = "running";
    const created = requests.map((request, index): NodeGenerationTask => ({
      taskId: crypto.randomUUID(), directory: context.directory, canvasPath: context.canvasPath, nodeId: id,
      mediaType, providerId: request.providerId, modelId: request.modelId, state: "submitting",
      ...(recoveries[index] === undefined ? {} : { recoveryData: recoveries[index] }),
    }));
    savedData.value.mediaTask = created.length === 1 ? created[0] : created;
    const tasks = savedTasks();
    if (execution) execution.taskId = tasks[0]!.taskId;
    try { await context.save(waitingSignal); }
    catch (error) {
      for (const task of tasks) if (task.state !== "cancelled") task.state = "failed";
      throw error;
    }
    signal.throwIfAborted();
    for (const task of tasks) checkTask(task, context);
    return waitAll(tasks, signal, async (task, index, requestSignal) => {
      const request = requests[index]!;
      const requestOptions = taskOptions(task, context, waitingSignal);
      try {
        const result = mediaType === "image" ? await options.ai.generateImage(request as NodeImageRequest, requestSignal, requestOptions)
          : mediaType === "video" ? await options.ai.generateVideo(request as NodeVideoRequest, requestSignal, requestOptions)
          : await options.ai.generateAudio(request as NodeAudioRequest, requestSignal, requestOptions);
        checkTask(task, context);
        signal.throwIfAborted();
        return result as Extract<NodeMediaResult, { mediaType: T }>[];
      } catch (error) {
        // 只有明确拒绝接单的响应才能释放任务；断线、超时、冲突和 5xx 仍须先按 ID 复查。
        if (task.state === "submitting" && (error as { mediaTaskRejected?: boolean })?.mediaTaskRejected === true) {
          task.state = "failed";
          task.resumable = false;
          const current = getPersistence?.();
          if (current?.directory === context.directory && findNode(id) === node && savedTasks().some(item => item.taskId === task.taskId)) await current.save();
        }
        throw error;
      }
    });
  }

  async function finish(signal: AbortSignal) {
    const tasks = savedTasks();
    if (!options || !tasks.length) return;
    const context = getPersistence?.();
    if (!context) throw new Error("画布已关闭，生成结果将在重新打开后恢复");
    for (const task of tasks) checkTask(task, context);
    const applied = tasks.map(task => task.applied);
    for (const task of tasks) task.applied = true;
    try { await context.save(signal); }
    catch (error) {
      tasks.forEach((task, index) => { task.applied = applied[index]; });
      throw error;
    }
  }

  async function execute(action: (context?: NodePersistenceContext) => Promise<void>) {
    if (cancelling.value) throw new Error("任务正在取消，请稍后重试");
    if (generating.value) throw new Error("节点正在生成，请等待完成");
    const active = execution = { controller: new AbortController(), context: getPersistence?.(), taskId: needsRecovery() ? savedTasks()[0]?.taskId : undefined };
    status.value = active.taskId || !options?.quote ? "running" : "preparing";
    error.value = "";
    try {
      await action(active.context);
      await finish(AbortSignal.any([lifetime.signal, active.controller.signal]));
      status.value = "succeeded";
    } catch (failure) {
      if (failure === costCancelled || !active.taskId && (active.controller.signal.aborted || lifetime.signal.aborted)) {
        status.value = "idle";
        return;
      }
      if (active.taskId && active.taskId === savedTasks()[0]?.taskId) await release();
      status.value = "failed";
      const message = (failure as { response?: { data?: { message?: string } } })?.response?.data?.message;
      error.value = failure instanceof Error && failure.name === "AbortError" ? "生成已取消"
        : message || (failure instanceof Error ? failure.message : "生成失败");
      throw failure;
    } finally {
      if (execution === active) execution = undefined;
    }
  }

  function resume() {
    if (recovering) return recovering;
    const tasks = savedTasks();
    const context = getPersistence?.();
    if (!options || !tasks.length || !context || !needsRecovery()) return Promise.resolve();
    recoveryController = new AbortController();
    const signal = AbortSignal.any([lifetime.signal, recoveryController.signal]);
    recovering = execute(async () => {
      if (!tasks.every(task => ownsTask(task, context))) throw new Error("保存的生成任务归属无效，无法恢复，请重新生成");
      const results = await waitAll(tasks, signal, (task, _index, waiting) => options.ai.resumeMedia(task.directory, task.taskId, waiting, taskOptions(task, context, signal)));
      for (const task of tasks) checkTask(task, context);
      if (tasks.every(task => task.applied)) return;
      const applied = options.recover ? await options.recover(results, tasks, signal) : results[0] ?? [];
      signal.throwIfAborted();
      for (const task of tasks) checkTask(task, context);
      const result = applied[0];
      if (!result || result.mediaType !== tasks[0]!.mediaType) throw new Error("生成任务未返回对应的媒体结果");
      if (result.mediaType === "image") outputs.value.image = { dataType: "IMAGE", value: { url: result.path, mimeType: result.mimeType } };
      else if (result.mediaType === "video") outputs.value.video = { dataType: "VIDEO", value: { url: result.path, mimeType: result.mimeType } };
      else outputs.value.audio = { dataType: "AUDIO", value: { url: result.path, mimeType: result.mimeType } };
    }).finally(() => { recovering = undefined; recoveryController = undefined; });
    return recovering;
  }

  async function run(action: (directory: string) => Promise<void>) {
    if (needsRecovery()) return resume();
    return execute(context => {
      if (options && !context) throw new Error("画布尚未就绪，无法保存生成任务");
      return action(context?.directory ?? "");
    });
  }

  async function cancelGeneration(persist = true) {
    if (cancelling.value) throw new Error("任务正在取消，请稍后重试");
    cancelling.value = true;
    try {
      const tasks = savedTasks();
      const context = getPersistence?.();
      if (options && tasks.length && needsRecovery()) {
        if (!context) throw new Error("工作区已变化，无法取消此节点任务");
        // ACT: 项目移动后的旧任务仅在当前节点放弃，不请求原目录的后台任务。
        await Promise.all(tasks.filter(task => task.directory === context.directory).map(task => options.ai.cancelMedia(task.directory, task.taskId)));
        const current = getPersistence?.();
        if (savedTasks()[0]?.taskId === tasks[0]!.taskId && current?.directory === context.directory && findNode(id) === node) {
          const states = tasks.map(({ state, resumable }) => ({ state, resumable }));
          for (const task of tasks) {
            task.state = "cancelled";
            task.resumable = false;
          }
          try { if (persist) await current.save(); }
          catch (error) {
            tasks.forEach((task, index) => Object.assign(task, states[index]));
            throw error;
          }
        }
      }
      recoveryController?.abort();
      execution?.controller.abort();
      cancel();
      await recovering?.catch(() => {});
    } finally {
      cancelling.value = false;
    }
  }

  watch(() => getPersistence?.()?.canvasPath, path => {
    const task = savedTasks()[0];
    if (!path || !options || !task || generating.value || !needsRecovery() || attemptedTaskId === task.taskId) return;
    attemptedTaskId = task.taskId;
    void resume().catch(error => { if (!lifetime.signal.aborted) showNodeError(error, "生成任务恢复失败"); });
  }, { immediate: true, flush: "post" });
  watch(outputs, () => {
    // 保留用户替换或编辑的输出；未决任务仍须复查完成，不能借此重新提交。
    if (!generating.value && needsRecovery()) for (const task of savedTasks()) task.applied = true;
  }, { deep: true, flush: "sync" });
  onScopeDispose(() => lifetime.abort());

  return { generating, running, costBlocked, pendingRecovery, cancelling, run, generate, generateBatch, resume, cancel: cancelGeneration };
}
