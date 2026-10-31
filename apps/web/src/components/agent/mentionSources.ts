import axios from "axios";
import { inject } from "vue";
import type { AgentMention } from "@toonflow/server/agent/types";
import type { MentionAsset, MentionCanvasSource, MentionNode, MentionOutput, MentionPage, MentionQuery } from "@toonflow/server/agent/mentionSources";

export type { MentionAsset, MentionNode, MentionOutput, MentionPage } from "@toonflow/server/agent/mentionSources";

export function useMentionSources(getDirectory: () => string | undefined) {
  const getCanvasSource = inject<(() => MentionCanvasSource | undefined) | undefined>("mentionCanvas", undefined);

  async function request<T>(operation: string, args: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> {
    const directory = getDirectory();
    if (!directory) throw new Error("请先打开工作区");
    const { data } = await axios.get<{ data: T }>("/api/agent/mentionSource", {
      params: { directory, operation, ...args }, signal, headers: { "x-toonflow-workspace": "1" },
    }).catch(error => {
      const message = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
      if (message) throw new Error(message, { cause: error });
      throw error;
    });
    signal?.throwIfAborted();
    if (directory !== getDirectory()) throw new Error("工作区已切换，请重新选择");
    return data.data;
  }

  return {
    currentCanvasId: () => getCanvasSource?.()?.currentCanvasId() ?? "",
    async canvases(signal?: AbortSignal) {
      signal?.throwIfAborted();
      const directory = getDirectory();
      const canvases = await getCanvasSource?.()?.canvases(signal);
      signal?.throwIfAborted();
      if (directory !== getDirectory()) throw new Error("工作区已切换，请重新选择");
      return canvases ?? request<{ id: string; name: string }[]>("canvases", {}, signal);
    },
    async nodes({ canvasId, ...options }: MentionQuery & { canvasId: string }) {
      options.signal?.throwIfAborted();
      const directory = getDirectory();
      const live = getCanvasSource?.()?.nodes(canvasId, options);
      if (live) {
        const result = await live;
        options.signal?.throwIfAborted();
        if (directory !== getDirectory()) throw new Error("工作区已切换，请重新选择");
        return result;
      }
      const { signal, ...args } = options;
      return request<MentionPage<MentionNode>>("nodes", { canvasId, ...args }, signal);
    },
    async outputs({ canvasId, nodeId, signal }: { canvasId: string; nodeId: string; signal?: AbortSignal }) {
      signal?.throwIfAborted();
      return getCanvasSource?.()?.outputs(canvasId, nodeId) ?? request<MentionOutput[]>("outputs", { canvasId, nodeId }, signal);
    },
    assets({ signal, ...options }: MentionQuery & { path?: string } = {}) {
      return request<MentionPage<MentionAsset>>("assets", options, signal);
    },
    async selectCanvas({ canvasId, nodeId, outputId, signal }: { canvasId: string; nodeId: string; outputId?: string; signal?: AbortSignal }) {
      signal?.throwIfAborted();
      const directory = getDirectory();
      const selected = await (getCanvasSource?.()?.selectCanvas(canvasId, nodeId, outputId)
        ?? request<AgentMention>("selectCanvas", { canvasId, nodeId, outputId }, signal));
      signal?.throwIfAborted();
      if (directory !== getDirectory()) throw new Error("工作区已切换，请重新选择");
      return selected;
    },
    selectAsset({ path, signal }: { path: string; signal?: AbortSignal }) {
      return request<AgentMention>("selectAsset", { path }, signal);
    },
  };
}
