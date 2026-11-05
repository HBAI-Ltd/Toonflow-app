import axios from "axios";
import type { NodeHandle } from "@toonflow/nodes-scaffold/connection";
import { customProviders, settings } from "@/stores/settings";
import { accountEnabled } from "@/lib/account";

type TfRequestOptions = { apiKey?: string; signal?: AbortSignal };

export type TfPayment = { orderNumber: string; payUrl?: string };
type TfOrder = { orderNumber: string; status: string | number };
export type TfRechargeSku = { id: number; price: number; integral: number; describe: string };
export type TfSponsor = { id: number; name: string; logoUrl: string; readme: string };
type TfResponse<T> = { code: number; data: T; message?: string };

export type TfExploreCategory = { id: string; name: string };
export type TfExploreProject = {
  id: string;
  title: string;
  coverUrl: string;
  author: { id: string; name: string; avatarUrl?: string };
  likeCount: number;
  collectionCount: number;
  liked: boolean;
  collected: boolean;
};
export type TfExploreParams = { cursor?: string; limit: number; categoryId?: string; searchKeyword?: string };
export type TfExplorePage = { categories: TfExploreCategory[]; list: TfExploreProject[]; nextCursor: string | null };
export type TfExploreDetail = TfExploreProject & { description: string; videoUrl: string; shareUrl: string };
export type TfExploreReaction = Pick<TfExploreProject, "liked" | "collected" | "likeCount" | "collectionCount">;
export type TfExploreProcess = {
  canvases: {
    id: string;
    name: string;
    nodes: {
      id: string;
      label: string;
      position: { x: number; y: number };
      width?: number;
      height?: number;
      parentNode?: string;
      kind?: "group";
      handles?: NodeHandle[];
      text?: string;
      prompt?: string;
      media?: { type: "image" | "video" | "audio"; url: string };
    }[];
    edges: { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }[];
  }[];
};

export type TfPayParams = {
  comboId: number;
  customMoney?: number;
  payType: "wechat" | "alipay";
};

type TfPlugin = {
  id: number;
  name: string;
  identifier: string;
  userId: number;
  supplier: string;
  type: "node" | "skill" | "tool" | "agent" | "ext";
  state: number;
  desc: string;
  link: string;
  fileName: string;
  creationTime: number;
  installation: number;
  download: number;
  version: string;
  updateById: number | null;
  isCollected: boolean;
};

type TfPluginParams = {
  page: number;
  limit: number;
  type: "all" | "node" | "skill" | "tool" | "agent" | "ext" | "my" | "collection";
  searchKeyword?: string;
};

export function isTfRouterProvider(provider: { id: string; apiUrl: string }) {
  return provider.id.toLowerCase() === "tfrouter" && URL.canParse(provider.apiUrl)
    && new URL(provider.apiUrl).origin === "https://api.toonflow.net";
}

const client = axios.create({ baseURL: "https://api.toonflow.net" });

export function getTfApiKey() {
  if (accountEnabled.value) return "";
  const provider = customProviders.value.find(isTfRouterProvider);
  const mediaConfigs = settings.value.mediaProviderConfigs as Record<string, { apiKey?: unknown }> | undefined;
  return [provider?.apiKey, mediaConfigs?.tfRouter?.apiKey]
    .map(key => typeof key === "string" ? key.trim().replace(/^Bearer(?:\s+|$)/i, "").trim() : "")
    .find(Boolean) ?? "";
}

function requestOptions({ apiKey, signal }: TfRequestOptions = {}) {
  const key = (apiKey ?? getTfApiKey()).trim().replace(/^Bearer(?:\s+|$)/i, "").trim();
  if (!key) throw new Error("请先配置 TF-Router API Key");
  return { signal, timeout: 20000, headers: { Authorization: `Bearer ${key}` } };
}

function responseData<T>(response: TfResponse<T>, fallback = "TF-Router 请求失败"): T {
  if (!response || typeof response !== "object" || typeof response.code !== "number") throw new Error("TF-Router 响应格式不正确");
  if (response.code !== 200) throw new Error(response.message || fallback);
  return response.data;
}

function exploreOptions(options?: Pick<TfRequestOptions, "signal">) {
  return getTfApiKey() ? requestOptions(options) : { signal: options?.signal, timeout: 20000 };
}

function isExploreUrl(value: unknown, allowEmpty = false): value is string {
  if (allowEmpty && value === "") return true;
  if (typeof value !== "string" || !URL.canParse(value)) return false;
  const url = new URL(value);
  return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
}

function validateExploreId(id: string) {
  if (typeof id !== "string" || !id.trim() || id.length > 200) throw new Error("探索项目 ID 无效");
}

function validateExploreReaction(value: TfExploreReaction) {
  if (!value || typeof value.liked !== "boolean" || typeof value.collected !== "boolean"
    || ![value.likeCount, value.collectionCount].every(count => Number.isSafeInteger(count) && count >= 0)) throw new Error("作品互动响应格式不正确");
}

function validateExploreProject(project: TfExploreProject) {
  validateExploreId(project?.id);
  validateExploreReaction(project);
  if (typeof project.title !== "string" || !isExploreUrl(project.coverUrl, true)
    || !project.author || typeof project.author.id !== "string" || typeof project.author.name !== "string"
    || (project.author.avatarUrl !== undefined && !isExploreUrl(project.author.avatarUrl, true))) throw new Error("探索项目响应格式不正确");
}

export default {
  // TF 探索接口统一返回 { code: 200, data, message? }；浏览接口可匿名，提供 Key 时附带用户互动状态。
  // 每页同时返回完整 categories 和筛选后的 list；分类不随搜索或分类筛选缩减。
  // cursor 首次省略，后续原样传回 nextCursor；服务端以 null 表示结束。
  async getExploreProjects(params: TfExploreParams, options?: Pick<TfRequestOptions, "signal">): Promise<TfExplorePage> {
    if (!Number.isSafeInteger(params.limit) || params.limit < 1 || params.limit > 50) throw new Error("每页数量必须为 1 至 50 的整数");
    const { data } = await client.post<TfResponse<TfExplorePage>>("/v1/explore/getProjects", params, exploreOptions(options));
    const page = responseData(data, "加载探索项目失败");
    if (!page || !Array.isArray(page.list) || page.list.length > params.limit
      || (page.nextCursor !== null && (typeof page.nextCursor !== "string" || !page.nextCursor.trim()))) throw new Error("探索分页响应格式不正确");
    if (!Array.isArray(page.categories) || page.categories.some(item => !item || typeof item.id !== "string" || !item.id.trim()
      || typeof item.name !== "string" || !item.name.trim()) || new Set(page.categories.map(item => item.id)).size !== page.categories.length) throw new Error("探索分类响应格式不正确");
    page.list.forEach(validateExploreProject);
    if (new Set(page.list.map(project => project.id)).size !== page.list.length) throw new Error("探索项目 ID 重复");
    return page;
  },

  async getExploreProject(projectId: string, options?: Pick<TfRequestOptions, "signal">): Promise<TfExploreDetail> {
    validateExploreId(projectId);
    const { data } = await client.post<TfResponse<TfExploreDetail>>("/v1/explore/getProject", { projectId }, exploreOptions(options));
    const project = responseData(data, "加载作品详情失败");
    validateExploreProject(project);
    if (project.id !== projectId || typeof project.description !== "string"
      || !isExploreUrl(project.videoUrl, true) || !isExploreUrl(project.shareUrl)) throw new Error("作品详情响应格式不正确");
    return project;
  },

  // 设置期望状态而非 toggle，网络失败后重试不会反向切换；响应包含更新后的两项状态和计数。
  async setExploreReaction(projectId: string, action: "like" | "collection", active: boolean, options?: TfRequestOptions): Promise<TfExploreReaction> {
    validateExploreId(projectId);
    const { data } = await client.post<TfResponse<TfExploreReaction>>("/v1/explore/setReaction", { projectId, action, active }, requestOptions(options));
    const reaction = responseData(data, "更新作品互动失败");
    validateExploreReaction(reaction);
    return reaction;
  },

  // TF 返回只读展示数据：保留画布位置与分组，媒体使用可直接访问的 HTTP(S) URL，文本文件需展开为 text。
  // handles 与连线的 sourceHandle/targetHandle 保留源节点端口 ID；未提供 handles 时前端使用默认 target in/source out。
  async getExploreProcess(projectId: string, options?: Pick<TfRequestOptions, "signal">): Promise<TfExploreProcess> {
    validateExploreId(projectId);
    const { data } = await client.post<TfResponse<TfExploreProcess>>("/v1/explore/getProcess", { projectId }, exploreOptions(options));
    const process = responseData(data, "加载制作过程失败");
    if (!process || !Array.isArray(process.canvases) || !process.canvases.length) throw new Error("制作过程响应格式不正确");
    const canvasIds = new Set<string>();
    for (const canvas of process.canvases) {
      if (!canvas || typeof canvas.id !== "string" || !canvas.id || canvasIds.has(canvas.id) || typeof canvas.name !== "string"
        || !Array.isArray(canvas.nodes) || !Array.isArray(canvas.edges)) throw new Error("制作过程画布格式不正确");
      canvasIds.add(canvas.id);
      const nodes = new Map<string, typeof canvas.nodes[number]>();
      for (const node of canvas.nodes) {
        if (!node || typeof node.id !== "string" || !node.id || nodes.has(node.id) || typeof node.label !== "string"
          || !node.position || ![node.position.x, node.position.y].every(Number.isFinite)
          || [node.width, node.height].some(size => size !== undefined && (!Number.isFinite(size) || size <= 0))
          || (node.parentNode !== undefined && typeof node.parentNode !== "string")
          || (node.kind !== undefined && node.kind !== "group")
          || [node.text, node.prompt].some(text => text !== undefined && typeof text !== "string")
          || (node.media !== undefined && (!node.media || !["image", "video", "audio"].includes(node.media.type) || !isExploreUrl(node.media.url)))) throw new Error("制作过程节点格式不正确");
        if (node.handles !== undefined) {
          if (!Array.isArray(node.handles) || (node.kind === "group" && node.handles.length)) throw new Error("制作过程节点端口格式不正确");
          const handleIds = new Set<string>();
          for (const handle of node.handles) {
            const dataTypes = Array.isArray(handle?.dataType) ? handle.dataType : [handle?.dataType];
            if (!handle || typeof handle.id !== "string" || !handle.id.trim() || handleIds.has(handle.id)
              || !["source", "target"].includes(handle.type) || (handle.label !== undefined && typeof handle.label !== "string")
              || !dataTypes.length || dataTypes.some(type => typeof type !== "string" || !type.split(",").some(part => part.trim()))) throw new Error("制作过程节点端口格式不正确");
            handleIds.add(handle.id);
          }
        }
        nodes.set(node.id, node);
      }
      const checked = new Set<string>();
      for (const node of canvas.nodes) {
        const ancestors = new Set<string>();
        let current: typeof node | undefined = node;
        while (current && !checked.has(current.id)) {
          if (ancestors.has(current.id)) throw new Error("制作过程分组存在循环");
          ancestors.add(current.id);
          if (current.parentNode !== undefined && nodes.get(current.parentNode)?.kind !== "group") throw new Error("制作过程分组不存在");
          current = current.parentNode === undefined ? undefined : nodes.get(current.parentNode);
        }
        for (const id of ancestors) checked.add(id);
      }
      const edgeIds = new Set<string>();
      for (const edge of canvas.edges) {
        if (!edge || typeof edge.id !== "string" || !edge.id || edgeIds.has(edge.id) || !nodes.has(edge.source) || !nodes.has(edge.target)) throw new Error("制作过程连线格式不正确");
        const source = nodes.get(edge.source)!;
        const target = nodes.get(edge.target)!;
        if (source.kind === "group" || target.kind === "group") throw new Error("制作过程分组不能连接端口");
        for (const [node, id, type, fallback] of [[source, edge.sourceHandle, "source", "out"], [target, edge.targetHandle, "target", "in"]] as const) {
          if (id !== undefined && (typeof id !== "string" || !id.trim()
            || (node.handles === undefined ? id !== fallback : !node.handles.some(handle => handle.id === id && handle.type === type)))) throw new Error("制作过程连线端口不存在或方向不正确");
          if (id === undefined && node.handles !== undefined && !node.handles.some(handle => handle.type === type)) throw new Error("制作过程连线端口不存在或方向不正确");
        }
        edgeIds.add(edge.id);
      }
    }
    return process;
  },

  // 下载包根目录即项目根目录，包含原始画布 JSON 与 assets 等全部依赖；URL 为短期有效的 HTTPS 签名地址。
  async getExploreDownload(projectId: string, options?: Pick<TfRequestOptions, "signal">): Promise<{ downloadUrl: string }> {
    validateExploreId(projectId);
    const { data } = await client.post<TfResponse<{ downloadUrl: string }>>("/v1/explore/getDownload", { projectId }, exploreOptions(options));
    const download = responseData(data, "获取项目下载地址失败");
    if (!isExploreUrl(download?.downloadUrl) || new URL(download.downloadUrl).protocol !== "https:") throw new Error("项目下载地址无效");
    return download;
  },

  async getSponsorList(options?: Pick<TfRequestOptions, "signal">): Promise<TfSponsor[]> {
    const { data } = await client.post<TfResponse<TfSponsor[]>>("/web/sponsor/getSponsorList", null, { signal: options?.signal, timeout: 20000 });
    const sponsors = responseData(data, "加载赞助商失败");
    if (!Array.isArray(sponsors) || sponsors.some(item => !item || !Number.isSafeInteger(item.id) || item.id < 1
      || typeof item.name !== "string" || typeof item.logoUrl !== "string" || typeof item.readme !== "string")) throw new Error("赞助商响应格式不正确");
    return sponsors;
  },

  async queryOrder(orderNumber: string, options?: TfRequestOptions): Promise<TfOrder> {
    if (!orderNumber.trim()) throw new Error("订单号不能为空");
    const { data } = await client.get<TfResponse<TfOrder>>("/v1/recharge/queryOrder", { ...requestOptions(options), params: { orderNumber: orderNumber.trim() } });
    const order = responseData(data);
    if (!order || order.orderNumber !== orderNumber.trim() || !["string", "number"].includes(typeof order.status)) throw new Error("订单查询响应格式不正确");
    return order;
  },

  async getRechargeData(options?: TfRequestOptions): Promise<TfRechargeSku[]> {
    const { data } = await client.get<TfResponse<unknown>>("/v1/recharge/getRechargeData", requestOptions(options));
    const skus = responseData(data);
    if (!Array.isArray(skus)) throw new Error("充值套餐响应格式不正确");
    return skus.map(sku => {
      const price = typeof sku?.price === "string" && sku.price.trim() ? Number(sku.price) : sku?.price;
      const integral = typeof sku?.integral === "string" && sku.integral.trim() ? Number(sku.integral) : sku?.integral;
      if (!sku || !Number.isSafeInteger(sku.id) || sku.id < 1 || typeof price !== "number" || !Number.isFinite(price) || price <= 0
        || typeof integral !== "number" || !Number.isFinite(integral) || integral < 0 || typeof sku.describe !== "string") throw new Error("充值套餐响应格式不正确");
      return { id: sku.id, price, integral, describe: sku.describe };
    });
  },

  async pay({ comboId, customMoney, payType }: TfPayParams, options?: TfRequestOptions): Promise<TfPayment> {
    if (!Number.isSafeInteger(comboId) || (comboId !== -1 && comboId < 1)) throw new Error("充值套餐 ID 必须为正整数或 -1");
    if (payType !== "wechat" && payType !== "alipay") throw new Error("请选择微信或支付宝支付");
    if (comboId === -1 && (typeof customMoney !== "number" || !Number.isFinite(customMoney) || customMoney < 0.01 || customMoney > 50000)) {
      throw new Error("自定义充值金额必须在 0.01 至 50000 之间");
    }
    const { data } = await client.post<TfResponse<TfPayment>>("/v1/recharge/pay", {
      comboId,
      ...(comboId === -1 ? { customMoney } : {}),
      payType,
    }, requestOptions(options));
    const payment = responseData(data);
    if (!payment || typeof payment.orderNumber !== "string" || !payment.orderNumber.trim()
      || (payment.payUrl !== undefined && typeof payment.payUrl !== "string")) throw new Error("支付响应格式不正确");
    return payment;
  },

  async getPlugIn(params: TfPluginParams, options?: TfRequestOptions) {
    if (!Number.isSafeInteger(params.page) || params.page < 1) throw new Error("页码必须为正整数");
    if (!Number.isSafeInteger(params.limit) || params.limit < 1 || params.limit > 50) throw new Error("每页数量必须为 1 至 50 的整数");
    const { data } = await client.post<TfResponse<{ list: TfPlugin[]; total: number }>>("/v1/plugin/getPlugin", params, requestOptions(options));
    return responseData(data, "加载插件市场失败");
  },

  async toggleCollection(pluginId: number, options?: TfRequestOptions): Promise<{ collected: boolean }> {
    if (!Number.isSafeInteger(pluginId) || pluginId < 1) throw new Error("插件 ID 必须为正整数");
    const { data } = await client.post<TfResponse<{ collected: boolean }>>("/v1/plugin/toggleCollection", { pluginId }, requestOptions(options));
    const collection = responseData(data, "更新插件收藏失败");
    if (typeof collection?.collected !== "boolean") throw new Error("插件收藏响应格式不正确");
    return collection;
  },
};
