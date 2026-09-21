import axios from "axios";
import { customProviders, settings } from "@/stores/settings";

type TfRequestOptions = { apiKey?: string; signal?: AbortSignal };

export type TfBalance = {
  balance: number;
  totalConsumption: number;
  totalRecharge: number;
  keyBalance: number | null;
};

export type TfPayment = { orderNumber: string; payUrl?: string };
type TfOrder = { orderNumber: string; status: string | number };
export type TfRechargeSku = { id: number; price: number; integral: number; describe: string };
export type TfSponsor = { id: number; name: string; logoUrl: string; readme: string };
type TfResponse<T> = { code: number; data: T; message?: string };

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
  type: "node" | "skill" | "tool" | "agent";
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
  type: "all" | "node" | "skill" | "tool" | "agent" | "my" | "collection";
  searchKeyword?: string;
};

export function isTfRouterProvider(provider: { id: string; apiUrl: string }) {
  return provider.id.toLowerCase() === "tfrouter" && URL.canParse(provider.apiUrl)
    && new URL(provider.apiUrl).origin === "https://api.toonflow.net";
}

const client = axios.create({ baseURL: "https://api.toonflow.net" });

export function getTfApiKey() {
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

function balanceAmount(value: unknown): number {
  const amount = typeof value === "string" && value.trim() ? Number(value) : value;
  if (typeof amount !== "number" || !Number.isFinite(amount)) throw new Error("余额响应格式不正确");
  return amount;
}

export default {
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

  async getBalance(options?: TfRequestOptions): Promise<TfBalance> {
    const { data } = await client.get<TfResponse<TfBalance>>("/v1/balance", requestOptions(options));
    const balance = responseData(data);
    return {
      balance: balanceAmount(balance?.balance),
      totalConsumption: balanceAmount(balance?.totalConsumption),
      totalRecharge: balanceAmount(balance?.totalRecharge),
      keyBalance: balance?.keyBalance === null ? null : balanceAmount(balance?.keyBalance),
    };
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
