import { z } from "zod";
import { t, translateMessage } from "@/lib/i18n";
import type {
  AuthenticatedOptions, Captcha, Channel, CreateSubAccountParams, ExploreDetail, ExplorePage, ExploreParams, ExploreProcess, ExploreProject,
  ExploreSubmission, ExploreUploadSignature, ExploreUploadSignatureParams, ForgotPasswordParams, HomeAdvertisement, HomeAdvertisements, Login, LoginParams, ModelData, ModelDataParams, Plugin, PluginExistence, PluginIdentity, PluginsParams, PluginType, PluginUploadSignature, PluginUploadSignatureParams, PointsConsumption,
  PointsConsumptionParams, PreviewData, ProviderSources, RegisterParams, RequestOptions, SmsParams, Sponsor, SubAccountsPage, SubAccountsParams, TaskRecordsPage, TaskRecordsParams,
  UpdatePluginParams, UploadExploreProjectParams, UploadPluginParams, UsageStatistics, UsageStatisticsParams, WalletActivity, WalletBonusBatchesPage, WalletBonusBatchesParams, WalletOrdersPage, WalletOrdersParams, WalletPayment, WalletPaymentParams, WalletPaymentStatus, WalletPlan, WalletPresentation,
} from "./types";

const pluginTypes: PluginType[] = ["node", "tool", "skill", "agent", "ext"];
const modelTypes = ["text", "image", "video", "audio"] as const;
const modelPrice = z.number().nonnegative();
const modelPriceStep = z.object({
  inputMinTokens: z.number().int().nonnegative(), inputMaxTokens: z.number().int().nonnegative(),
  outputMinTokens: z.number().int().nonnegative(), outputMaxTokens: z.number().int().nonnegative(),
  inputPrice: modelPrice, outputPrice: modelPrice,
});
const modelClock = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const modelBilling = z.object({
  inputPrice: modelPrice.optional(), outputPrice: modelPrice.optional(), fixedPrice: modelPrice.optional(),
  steps: z.array(modelPriceStep).optional(),
  periods: z.array(z.object({
    type: z.string(), weekdays: z.array(z.number().int().min(0).max(7)),
    startTime: modelClock, endTime: modelClock,
    cacheRead: modelPrice.optional(), cacheWrite: modelPrice.optional(), steps: z.array(modelPriceStep),
  })).optional(),
  idleSteps: z.array(modelPriceStep).optional(), idleCacheRead: modelPrice.optional(), idleCacheWrite: modelPrice.optional(),
  ruleText: z.object({ description: z.string().optional() }).optional(),
});
const modelData = z.array(z.object({
  id: z.number().int().positive(), codeName: z.string().min(1), type: z.enum(modelTypes),
  ability: z.string(), quality: z.string(), state: z.union([z.literal(0), z.literal(1)]),
  billingType: z.number().int().nonnegative(), billingData: z.string(),
  priceUnitKey: z.string(), priceUnit: z.string(), illustrate: z.string().nullish(),
}));
const taskTimestamp = z.number().int().nonnegative().refine(value => Number.isFinite(new Date(value).getTime()));
const taskRecordsPage = z.object({
  data: z.array(z.object({
    id: z.number().int().positive(), taskICode: z.string(), modelName: z.string(),
    price: z.union([z.number(), z.string()]).nullish(),
    timeConsuming: z.number().nonnegative().nullish(), state: z.number().int(),
    extractUrl: z.string().nullish(),
    keyName: z.string().nullish(), errorReason: z.string().nullish(),
    creationTime: taskTimestamp, completionTime: taskTimestamp.nullish(),
  })),
  total: z.number().int().nonnegative(),
});
const walletAmount = z.number().nonnegative();
const walletPaymentAmount = walletAmount.min(0.01).refine(value => Number(value.toFixed(2)) === value);
const walletBonus = z.object({
  bonusAmount: walletAmount,
  bonusActivityName: z.string().nullable(),
  bonusExpireMode: z.enum(["days", "fixed"]).nullable(),
  bonusValidDays: z.number().int().positive().nullable(),
  bonusExpiresAt: taskTimestamp.nullable(),
});
const walletOrdersPage = z.object({
  data: z.array(z.object({
    id: z.number().int().positive(), goodsName: z.string(),
    amount: z.number().nonnegative(), points: z.number().nonnegative(), orderNumber: z.string().min(1),
    type: z.number().int(), status: z.number().int(), wayCode: z.string().nullish(),
    creationTime: taskTimestamp, paymentTime: taskTimestamp.nullish(), remark: z.string().nullish(),
    ...walletBonus.partial().shape,
  })),
  total: z.number().int().nonnegative(),
});
const walletPlans = z.array(z.object({
  id: z.number().int().positive(), money: z.union([z.string(), walletAmount]), integral: z.union([z.string(), walletAmount]), describe: z.string(),
  amount: walletAmount, points: z.union([z.string(), walletAmount]), bonusAmount: walletAmount, bonusRate: walletAmount, totalAmount: walletAmount,
}));
const walletPresentation = z.object({
  agreement: z.object({ title: z.string().trim().min(1), content: z.string().trim().min(1), version: z.string().trim().min(1), updatedAt: taskTimestamp }).nullable(),
  activities: z.array(z.object({
    id: z.number().int().positive(), key: z.string().min(1), title: z.string(), updatedAt: taskTimestamp,
    rechargeConfig: z.object({
      ruleType: z.string(), scope: z.enum(["all", "custom", "packages"]), packageIds: z.array(z.number().int().positive()).default([]),
      badge: z.string().default(""), summary: z.string().default(""), startsAt: taskTimestamp.nullish().transform(value => value ?? null),
      endsAt: taskTimestamp.nullish().transform(value => value ?? null),
    }),
  })),
  pricing: z.object({ rechargeDiscount: z.number().positive(), agentFirstRecharge: z.boolean() }),
  serverTime: taskTimestamp,
});
const walletActivityFields = {
  firstRechargeDiscount: z.number().positive().max(1), serverTime: taskTimestamp, refreshAt: taskTimestamp.optional(),
};
const walletActivity = z.discriminatedUnion("eligible", [
  z.object({ eligible: z.literal(false), ...walletActivityFields }),
  z.object({
    eligible: z.literal(true), ...walletActivityFields,
    name: z.string().trim().min(1), rate: z.number().min(0).max(10), rateMode: z.enum(["fixed", "tiered"]),
    tiers: z.array(z.object({ upTo: walletPaymentAmount.max(50000), rate: z.number().min(0).max(10).refine(value => Number(value.toFixed(6)) === value) })).max(100),
    expireMode: z.enum(["days", "fixed"]), validDays: z.number().int().positive().nullable(), expiresAt: taskTimestamp.nullable(),
    startsAt: taskTimestamp.nullable(), endsAt: taskTimestamp.nullable(),
  }).refine(value => (value.rateMode !== "tiered" || value.tiers.length > 0)
    && value.tiers.every((tier, index) => index === 0 || tier.upTo > value.tiers[index - 1]!.upTo)
    && (value.expireMode === "days" ? value.validDays !== null : value.expiresAt !== null)),
]);
const walletBonusStatus = z.enum(["available", "used", "expired"]);
const walletBonusBatchesPage = z.object({
  data: z.array(z.object({
    id: z.number().int().positive(), orderId: z.number().int().positive().nullish().transform(value => value ?? null),
    orderNumber: z.string().nullish().transform(value => value ?? ""), activityName: z.string(), source: z.string(), expireMode: z.string(),
    validDays: z.number().int().positive().nullish().transform(value => value ?? null),
    amount: walletAmount, available: walletAmount, used: walletAmount, expired: walletAmount,
    createdAt: taskTimestamp, expiresAt: taskTimestamp.nullish().transform(value => value ?? null), status: walletBonusStatus,
  })),
  total: z.number().int().nonnegative(),
  summary: z.object({
    availableAmount: walletAmount, expiringSoonAmount: walletAmount, nextExpiresAt: taskTimestamp.nullable(),
    counts: z.object({ available: z.number().int().nonnegative(), used: z.number().int().nonnegative(), expired: z.number().int().nonnegative() }),
  }),
});
const subAccountsPage = z.object({
  data: z.array(z.object({
    id: z.number().int().positive(), name: z.string(), key: z.string().min(1),
    balance: z.union([z.string(), z.number()]), groupId: z.number().int().positive(),
    quotaType: z.union([z.literal(0), z.literal(1)]), expirationType: z.union([z.literal(0), z.literal(1)]),
    expirationTime: taskTimestamp, creationTime: taskTimestamp, state: z.number().int(),
  })),
  total: z.number().int().nonnegative(),
});

function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

function requireText(value: unknown, message: string) {
  if (typeof value !== "string" || !value.trim()) fail(message);
}

function parseModelJson<T>(value: string, schema: z.ZodType<T>): T {
  try {
    return schema.parse(JSON.parse(value));
  } catch {
    fail("模型列表响应格式不正确", 502);
  }
}

function authenticated(options: AuthenticatedOptions) {
  if (typeof options?.token !== "string" || !options.token.trim()) fail("请先在账号与余额中登录 Toonflow 账号", 401);
  return { token: options.token.trim(), signal: options.signal };
}

function parseAmount(value: unknown, allowNegative = false) {
  const amount = typeof value === "string" && value.trim() ? Number(value) : value;
  if (typeof amount !== "number" || !Number.isFinite(amount) || (!allowNegative && amount < 0)) fail("账号金额格式不正确", 502);
  return amount;
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isExploreUrl(value: unknown, allowEmpty = false): value is string {
  if (allowEmpty && value === "") return true;
  if (typeof value !== "string" || !URL.canParse(value)) return false;
  const url = new URL(value);
  return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
}

function validateExploreId(id: string, status = 400) {
  if (typeof id !== "string" || !id.trim() || id.length > 200) fail("探索项目 ID 无效", status);
}

function validateExploreProject(project: ExploreProject) {
  validateExploreId(project?.id, 502);
  if (![project.likeCount, project.collectionCount].every(count => Number.isSafeInteger(count) && count >= 0)) fail("作品互动响应格式不正确", 502);
  if (typeof project.title !== "string" || !isExploreUrl(project.coverUrl, true)
    || !project.author || typeof project.author.id !== "string" || typeof project.author.name !== "string"
    || (project.author.avatarUrl !== undefined && !isExploreUrl(project.author.avatarUrl, true))) fail("探索项目响应格式不正确", 502);
}

const advertisementSettingsPanels = ["account", "general", "languageModel", "mediaModel", "pluginMarket", "mcp", "network", "deviceLink", "personalization", "developer", "multiTenant", "about"];
const advertisementColor = z.string().regex(/^(?:|#[\da-f]{3}|#[\da-f]{6}|#[\da-f]{8})$/i);
const homeAdvertisement = z.object({
  title: z.string().trim().min(1).max(120), content: z.string().max(500), imageUrl: z.string().refine(value => isExploreUrl(value, true)), buttonText: z.string().max(40),
  actionType: z.enum(["web", "path", "settings"]), actionTarget: z.string().min(1).max(2048), endsAt: taskTimestamp.refine(value => value > 0).nullable(), updatedAt: taskTimestamp,
  appearance: z.object({
    mode: z.enum(["text", "image"]), backgroundColor: advertisementColor, backgroundEndColor: advertisementColor.optional(), textColor: advertisementColor,
    buttonColor: advertisementColor, buttonTextColor: advertisementColor,
  }).strict().optional(),
}).refine(advertisement => {
  if (advertisement.actionType === "web") return isExploreUrl(advertisement.actionTarget);
  if (advertisement.actionType === "path") return /^\/(?!\/)[^\\\x00-\x1f\x7f]*$/.test(advertisement.actionTarget);
  return advertisementSettingsPanels.includes(advertisement.actionTarget);
});

export class Toonflow implements Channel {
  private async request<T>(params: {
    path: string; method: "GET" | "POST"; data?: unknown; token?: string; signal?: AbortSignal; timeout?: number; sensitiveValues?: string[];
  }): Promise<T> {
    const timeout = AbortSignal.timeout(params.timeout ?? 20000);
    const signal = params.signal ? AbortSignal.any([params.signal, timeout]) : timeout;
    let response: Response | undefined;
    let body: { code?: unknown; data?: unknown; message?: unknown } | null;
    try {
      response = await fetch("https://api.toonflow.net" + params.path, {
        method: params.method,
        signal,
        redirect: "error",
        headers: {
          Accept: "application/json",
          ...(params.data !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(params.token ? { Authorization: "Bearer " + params.token } : {}),
        },
        ...(params.data !== undefined ? { body: JSON.stringify(params.data) } : {}),
      });
      body = await response.json() as typeof body;
    } catch {
      if (params.signal?.aborted) fail("请求已取消", 499);
      if (timeout.aborted) fail("Toonflow 请求超时，请重试", 504);
      if (response && !response.ok) fail(t`Toonflow 请求失败（HTTP ${response.status}）`, response.status >= 400 && response.status <= 599 ? response.status : 502);
      fail(response ? "Toonflow 响应格式不正确" : "Toonflow 请求失败，请检查网络连接", 502);
    }
    if (params.signal?.aborted) fail("请求已取消", 499);
    if (!response.ok || body?.code !== 200) {
      const status = !response.ok ? response.status : body?.code;
      let message = typeof body?.message === "string" && body.message.trim() ? body.message : "Toonflow 请求失败";
      const input = params.data as Record<string, unknown> | null | undefined;
      const verify = input?.verify as Record<string, unknown> | null | undefined;
      for (const secret of [...(params.sensitiveValues ?? []), params.token, input?.key, input?.code, input?.password, input?.newPassword, input?.confirmPassword, input?.captcha,
        input?.originalCaptcha, input?.verificationCode, verify?.ticket, verify?.randstr]) {
        if (typeof secret === "string" && secret) message = message.replaceAll(secret, "••••••");
      }
      message = message.replace(/(Bearer\s+)[^\s"'<>]+/gi, "$1••••••").slice(0, 1000);
      fail(message, typeof status === "number" && Number.isInteger(status) && status >= 400 && status <= 599 ? status : 502);
    }
    return body.data as T;
  }

  async getCaptcha(options?: RequestOptions): Promise<Captcha> {
    const data = await this.request<Captcha>({ method: "GET", path: "/web/toonflow/user/getCaptcha", signal: options?.signal });
    if (!data || typeof data.svg !== "string" || !data.svg.trim() || typeof data.captcha !== "string" || !data.captcha.trim()) {
      fail("图形验证码响应格式不正确", 502);
    }
    return { svg: data.svg, captcha: data.captcha };
  }

  async sendSmsCode(params: SmsParams, options?: RequestOptions): Promise<number> {
    requireText(params.phone, "请输入手机号");
    requireText(params.verify?.ticket, "请先完成人机验证");
    requireText(params.verify?.randstr, "请先完成人机验证");
    if (params.isForget != null && params.isForget !== 0 && params.isForget !== 1) fail("短信验证码场景无效");
    const data = await this.request<number>({
      method: "POST", path: "/web/toonflow/user/sendSmsCode", signal: options?.signal,
      data: {
        phone: params.phone.trim(), verify: { ticket: params.verify.ticket, randstr: params.verify.randstr },
        ...(params.isForget !== undefined ? { isForget: params.isForget } : {}),
      },
    });
    if (typeof data !== "number" || !Number.isSafeInteger(data) || data <= 0) fail("短信验证码响应格式不正确", 502);
    return data;
  }

  async register(params: RegisterParams, options?: RequestOptions): Promise<{ userCode: string }> {
    requireText(params.userName, "请输入昵称");
    requireText(params.phone, "请输入手机号");
    if (typeof params.password !== "string" || !params.password) fail("请输入密码");
    requireText(params.verificationCode, "请输入短信验证码");
    if (params.invitationCode !== undefined && typeof params.invitationCode !== "string") fail("邀请码格式不正确");
    const data = await this.request<{ userCode: string }>({
      method: "POST", path: "/web/toonflow/user/register", signal: options?.signal,
      data: {
        userName: params.userName.trim(), phone: params.phone.trim(), password: params.password,
        verificationCode: params.verificationCode.trim(),
        ...(params.invitationCode !== undefined ? { invitationCode: params.invitationCode.trim() } : {}),
      },
    });
    if (!data || typeof data.userCode !== "string" || !data.userCode.trim()) fail("注册响应格式不正确", 502);
    return { userCode: data.userCode };
  }

  async login(params: LoginParams, options?: RequestOptions): Promise<Login> {
    requireText(params.userName, "请输入手机号或邮箱");
    if (typeof params.password !== "string" || !params.password) fail("请输入密码");
    requireText(params.captcha, "请输入图形验证码");
    requireText(params.originalCaptcha, "请先获取图形验证码");
    const data = await this.request<Login>({
      method: "POST", path: "/web/toonflow/user/login", signal: options?.signal,
      data: {
        userName: params.userName.trim(), password: params.password,
        captcha: params.captcha.trim(), originalCaptcha: params.originalCaptcha,
      },
    });
    if (!data || typeof data.token !== "string" || !data.token.trim() || !data.info
      || typeof data.info.userName !== "string" || typeof data.info.phone !== "string") fail("登录响应格式不正确", 502);
    return { token: data.token, info: { userName: data.info.userName, phone: data.info.phone } };
  }

  async forgotPassword(params: ForgotPasswordParams, options?: RequestOptions): Promise<string> {
    requireText(params.phone, "请输入手机号");
    requireText(params.verificationCode, "请输入短信验证码");
    if (typeof params.newPassword !== "string" || params.newPassword.length < 6) fail("新密码至少 6 位");
    if (params.confirmPassword !== params.newPassword) fail("两次输入的密码不一致");
    const data = await this.request<string>({
      method: "POST", path: "/web/toonflow/user/forgotPassword", signal: options?.signal,
      data: {
        phone: params.phone.trim(), verificationCode: params.verificationCode.trim(),
        newPassword: params.newPassword, confirmPassword: params.confirmPassword,
      },
    });
    if (typeof data !== "string") fail("重置密码响应格式不正确", 502);
    return data;
  }

  async getSubAccounts(params: SubAccountsParams, options: AuthenticatedOptions): Promise<SubAccountsPage> {
    if (!Number.isSafeInteger(params.page) || params.page < 1) fail("页码必须为正整数");
    if (!Number.isSafeInteger(params.limit) || params.limit < 1 || params.limit > 100) fail("每页数量必须为 1 至 100 的整数");
    if (params.credential !== undefined && (typeof params.credential !== "string" || params.credential.trim().length > 1000)) fail("搜索凭证格式不正确");
    const credential = params.credential?.trim() ?? "";
    const data = await this.request<unknown>({
      ...authenticated(options), method: "GET", path: "/web/web/key/getKeyData?" + new URLSearchParams({
        page: String(params.page), limit: String(params.limit), key: credential,
      }),
      sensitiveValues: [credential],
    });
    const parsed = subAccountsPage.safeParse(data);
    if (!parsed.success) fail("凭证响应格式不正确", 502);
    return {
      total: parsed.data.total,
      list: parsed.data.data.map(item => ({
        id: item.id, name: item.name, credential: item.key, balance: parseAmount(item.balance, true), groupId: item.groupId,
        quotaType: item.quotaType, expirationType: item.expirationType, expiresAt: item.expirationTime,
        createdAt: item.creationTime, state: item.state,
      })),
    };
  }

  async createSubAccount(params: CreateSubAccountParams, options: AuthenticatedOptions): Promise<void> {
    requireText(params.name, "请输入凭证名称");
    if (params.name.trim().length > 200) fail("凭证名称不能超过 200 个字符");
    if (params.quotaType !== 0 && params.quotaType !== 1) fail("凭证额度类型无效");
    if (params.expirationType !== 0 && params.expirationType !== 1) fail("凭证有效期类型无效");
    if (params.quotaType === 1 && (typeof params.balance !== "number" || !Number.isFinite(params.balance) || params.balance < 0)) fail("请输入有效的凭证额度");
    if (params.quotaType === 0 && params.balance !== undefined) fail("不限额时无需设置额度");
    const expiresAt = params.expiresAt;
    if (params.expirationType === 1 && (typeof expiresAt !== "number" || !Number.isSafeInteger(expiresAt)
      || !Number.isFinite(new Date(expiresAt).getTime()) || expiresAt <= Date.now())) fail("请选择未来的凭证到期时间");
    if (params.expirationType === 0 && params.expiresAt !== undefined) fail("永久有效时无需设置到期时间");
    await this.request<unknown>({
      ...authenticated(options), method: "POST", path: "/web/web/key/addKey",
      data: {
        name: params.name.trim(), groupId: 1, quotaType: params.quotaType, expirationType: params.expirationType,
        ...(params.quotaType === 1 ? { balance: params.balance } : {}),
        ...(params.expirationType === 1 ? { expirationTime: params.expiresAt } : {}),
      },
    });
  }

  async removeSubAccount(id: number, options: AuthenticatedOptions): Promise<void> {
    if (!Number.isSafeInteger(id) || id < 1) fail("凭证 ID 无效");
    await this.request<unknown>({ ...authenticated(options), method: "POST", path: "/web/web/key/delKey", data: { id } });
  }

  async getWalletPlans(options: AuthenticatedOptions): Promise<WalletPlan[]> {
    const data = await this.request<unknown>({
      ...authenticated(options), method: "GET", path: "/web/web/recharge/getRechargeData",
    });
    const parsed = walletPlans.safeParse(data);
    if (!parsed.success) fail("钱包充值套餐响应格式不正确", 502);
    return parsed.data.map(item => ({
      id: item.id, money: parseAmount(item.money), integral: parseAmount(item.integral), amount: item.amount, points: parseAmount(item.points),
      bonusAmount: item.bonusAmount, bonusRate: item.bonusRate, totalAmount: item.totalAmount, description: item.describe,
    }));
  }

  async getWalletPresentation(options: AuthenticatedOptions): Promise<WalletPresentation> {
    const data = await this.request<unknown>({
      ...authenticated(options), method: "GET", path: "/web/web/recharge/getPresentation",
    });
    const parsed = walletPresentation.safeParse(data);
    if (!parsed.success) fail("充值协议信息响应格式不正确", 502);
    return parsed.data;
  }

  async getWalletActivity(options: AuthenticatedOptions): Promise<WalletActivity> {
    const data = await this.request<unknown>({
      ...authenticated(options), method: "GET", path: "/web/web/recharge/getActivity",
    });
    const parsed = walletActivity.safeParse(data);
    if (!parsed.success) fail("充值活动响应格式不正确", 502);
    return parsed.data;
  }

  async getWalletBonusBatches(params: WalletBonusBatchesParams, options: AuthenticatedOptions): Promise<WalletBonusBatchesPage> {
    if (!walletBonusStatus.safeParse(params.status).success) fail("赠送金状态无效");
    if (!Number.isSafeInteger(params.page) || params.page < 1) fail("页码必须为正整数");
    if (!Number.isSafeInteger(params.limit) || params.limit < 1 || params.limit > 100) fail("每页数量必须为 1 至 100 的整数");
    const data = await this.request<unknown>({
      ...authenticated(options), method: "GET", path: "/web/web/recharge/getBonusBatches?" + new URLSearchParams({
        status: params.status, page: String(params.page), limit: String(params.limit),
      }),
    });
    const parsed = walletBonusBatchesPage.safeParse(data);
    if (!parsed.success) fail("赠送金明细响应格式不正确", 502);
    return { list: parsed.data.data, total: parsed.data.total, summary: parsed.data.summary };
  }

  async getWalletOrders(params: WalletOrdersParams, options: AuthenticatedOptions): Promise<WalletOrdersPage> {
    if (!Number.isSafeInteger(params.page) || params.page < 1) fail("页码必须为正整数");
    if (!Number.isSafeInteger(params.limit) || params.limit < 1 || params.limit > 100) fail("每页数量必须为 1 至 100 的整数");
    const data = await this.request<unknown>({
      ...authenticated(options), method: "GET", path: "/web/web/order/getOrder?" + new URLSearchParams({
        page: String(params.page), limit: String(params.limit),
      }),
    });
    const parsed = walletOrdersPage.safeParse(data);
    if (!parsed.success) fail("钱包订单响应格式不正确", 502);
    return {
      total: parsed.data.total,
      list: parsed.data.data.map(item => ({
        id: item.id, name: item.goodsName, amount: item.amount, points: item.points, orderNumber: item.orderNumber,
        type: item.type, status: item.status, paymentMethod: item.wayCode ?? "", createdAt: item.creationTime,
        paidAt: item.paymentTime ?? null, remark: item.remark ?? "",
        bonusAmount: item.bonusAmount, bonusActivityName: item.bonusActivityName, bonusExpireMode: item.bonusExpireMode,
        bonusValidDays: item.bonusValidDays, bonusExpiresAt: item.bonusExpiresAt,
      })),
    };
  }

  async exchangeWalletCode(code: string, options: AuthenticatedOptions): Promise<void> {
    requireText(code, "请输入兑换码");
    if (code.trim().length > 200) fail("兑换码长度不能超过 200 个字符");
    await this.request<unknown>({
      ...authenticated(options), method: "POST", path: "/web/web/recharge/exchange", data: { code: code.trim() },
    });
  }

  async createWalletPayment(params: WalletPaymentParams, options: AuthenticatedOptions): Promise<WalletPayment> {
    if (!Number.isSafeInteger(params.comboId) || (params.comboId !== -1 && params.comboId < 1)) fail("请选择充值套餐");
    if (params.payType !== "wechat" && params.payType !== "alipay") fail("不支持的支付方式");
    if (params.comboId === -1 && !walletPaymentAmount.min(1).safeParse(params.customMoney).success) {
      fail("请输入 1 元及以上的自定义充值金额，最多保留两位小数");
    }
    const bonus = walletBonus.safeParse(params.expectedBonus);
    if (!walletPaymentAmount.safeParse(params.expectedAmount).success || !bonus.success
      || !walletAmount.safeParse(params.expectedBonusAmount).success || params.expectedBonusAmount !== bonus.data.bonusAmount) {
      fail("请确认充值金额和赠送规则后重新支付");
    }
    const data = await this.request<unknown>({
      ...authenticated(options), method: "POST", path: "/web/web/recharge/pay",
      data: {
        comboId: params.comboId, payType: params.payType, expectedAmount: params.expectedAmount,
        expectedBonusAmount: params.expectedBonusAmount, expectedBonus: bonus.data,
        ...(params.comboId === -1 ? { customMoney: params.customMoney } : {}),
      },
    });
    const parsed = walletBonus.extend({ orderNumber: z.string().trim().min(1), payUrl: z.url(), amount: walletPaymentAmount }).safeParse(data);
    if (!parsed.success) fail("充值支付响应格式不正确", 502);
    const payment = parsed.data;
    if (payment.amount !== params.expectedAmount || Object.entries(bonus.data).some(([key, value]) => payment[key as keyof typeof bonus.data] !== value)) {
      fail("充值活动规则已变化，请确认最新金额、赠送活动和有效期后重新支付", 409);
    }
    const payUrl = new URL(payment.payUrl);
    if (payUrl.protocol !== "https:" || payUrl.username || payUrl.password) fail("充值支付链接格式不正确", 502);
    if (params.payType === "wechat" && !payUrl.pathname.toLowerCase().endsWith(".png")) fail("微信支付二维码格式不正确", 502);
    return { ...payment, kind: params.payType === "wechat" ? "image" : "url" };
  }

  async getWalletPaymentStatus(orderNumber: string, options: AuthenticatedOptions): Promise<WalletPaymentStatus> {
    requireText(orderNumber, "请输入订单号");
    if (orderNumber.trim().length > 200) fail("订单号长度不能超过 200 个字符");
    const data = await this.request<WalletPaymentStatus>({
      ...authenticated(options), method: "GET", path: "/web/web/recharge/queryOrder?" + new URLSearchParams({ orderNumber: orderNumber.trim() }),
    });
    if (!data || !Number.isSafeInteger(data.status)) fail("支付订单状态响应格式不正确", 502);
    return { status: data.status };
  }

  async getTaskRecords(params: TaskRecordsParams, options: AuthenticatedOptions): Promise<TaskRecordsPage> {
    if (!Number.isSafeInteger(params.page) || params.page < 1) fail("页码必须为正整数");
    if (!Number.isSafeInteger(params.limit) || params.limit < 1 || params.limit > 100) fail("每页数量必须为 1 至 100 的整数");
    if (params.taskId !== undefined && (typeof params.taskId !== "string" || params.taskId.trim().length > 200)) fail("任务 ID 格式不正确");
    const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit), taskICode: params.taskId?.trim() ?? "" });
    const data = await this.request<unknown>({ ...authenticated(options), method: "GET", path: "/web/web/operationLog/getOperationLog?" + query });
    const parsed = taskRecordsPage.safeParse(data);
    if (!parsed.success) fail("任务记录响应格式不正确", 502);
    return {
      list: parsed.data.data.map(item => ({
        id: item.id, taskId: item.taskICode, modelName: item.modelName,
        amount: item.price == null ? null : parseAmount(item.price), duration: item.timeConsuming ?? null,
        status: item.state, result: item.extractUrl ?? "", resultUrl: isExploreUrl(item.extractUrl) ? item.extractUrl : "",
        keyName: item.keyName ?? "", errorReason: item.errorReason ?? "",
        createdAt: item.creationTime, completedAt: item.completionTime ?? null,
      })),
      total: parsed.data.total,
    };
  }

  async getPointsConsumption(params: PointsConsumptionParams, options: AuthenticatedOptions): Promise<PointsConsumption> {
    if (params.key !== undefined && (typeof params.key !== "string" || params.key.trim().length > 1000)) fail("凭证格式不正确");
    if (![params.startTime, params.finishTime].every(value => Number.isSafeInteger(value) && value >= 0 && Number.isFinite(new Date(value).getTime()))
      || params.finishTime < params.startTime) fail("结束时间不能早于开始时间，且时间格式必须正确");
    const data = await this.request<{ total: unknown; count: unknown }>({
      ...authenticated(options), method: "POST", path: "/web/web/query/getPointsConsumption",
      data: { key: params.key?.trim() ?? "", startTime: params.startTime, finishTime: params.finishTime },
    });
    if (!data || typeof data.count !== "number" || !Number.isSafeInteger(data.count) || data.count < 0) fail("消耗查询响应格式不正确", 502);
    return { total: parseAmount(data.total), count: data.count };
  }

  async getModelData(params: ModelDataParams, options: AuthenticatedOptions): Promise<ModelData[]> {
    if (!["all", ...modelTypes].includes(params.type)) fail("不支持的模型类型");
    const data = await this.request<unknown>({
      ...authenticated(options), method: "GET", path: "/web/web/model/getModelData?" + new URLSearchParams({ type: params.type }),
    });
    const parsed = modelData.safeParse(data);
    if (!parsed.success) fail("模型列表响应格式不正确", 502);
    return parsed.data.map(item => {
      const { ruleText, ...billing } = parseModelJson(item.billingData, modelBilling);
      if ((item.billingType === 0 && (billing.inputPrice === undefined || billing.outputPrice === undefined))
        || (item.billingType === 1 && billing.fixedPrice === undefined)
        || (item.billingType === 3 && !billing.steps)
        || (item.billingType === 4 && !ruleText)
        || (item.billingType === 5 && (!billing.periods || !billing.idleSteps))) fail("模型计费响应格式不正确", 502);
      return {
        id: item.id, name: item.codeName, type: item.type,
        abilities: parseModelJson(item.ability, z.array(z.string())),
        qualities: parseModelJson(item.quality, z.array(z.string())),
        available: item.state === 1, description: item.illustrate ?? "", currency: item.priceUnitKey, priceUnit: item.priceUnit,
        billing: {
          type: item.billingType, ...billing,
          ...([0, 3, 5].includes(item.billingType) ? { tokenUnit: 1000000 } : {}),
          ...(ruleText?.description !== undefined ? { ruleDescription: ruleText.description } : {}),
        },
      };
    });
  }

  async getPlugins(params: PluginsParams, options: AuthenticatedOptions): Promise<{ list: Plugin[]; total: number }> {
    if (!Number.isSafeInteger(params.page) || params.page < 1) fail("页码必须为正整数");
    if (!Number.isSafeInteger(params.limit) || params.limit < 1 || params.limit > 50) fail("每页数量必须为 1 至 50 的整数");
    if (![...pluginTypes, "all", "my", "collection"].includes(params.type)) fail("不支持的插件列表类型");
    if (params.searchKeyword !== undefined && typeof params.searchKeyword !== "string") fail("插件搜索关键词格式不正确");
    // ACT: 上游实际部署路径包含两层 web，不能按 URL 根路径合并去掉其中一层。
    const data = await this.request<{ list: Plugin[]; total: unknown }>({
      ...authenticated(options), method: "POST", path: "/web/web/plugIn/getPlugIn",
      data: {
        page: params.page, limit: params.limit, type: params.type,
        ...(params.searchKeyword !== undefined ? { searchKeyword: params.searchKeyword.trim() } : {}),
      },
    });
    const total = typeof data?.total === "string" && data.total.trim() ? Number(data.total) : data?.total;
    if (typeof total !== "number" || !Number.isSafeInteger(total) || total < 0 || !Array.isArray(data?.list) || data.list.length > params.limit
      || data.list.some(item => !item || !Number.isSafeInteger(item.id) || item.id < 1 || !pluginTypes.includes(item.type)
        || typeof item.identifier !== "string" || !item.identifier.trim() || typeof item.name !== "string" || ![0, 1, 2].includes(item.state)
        || (item.version !== undefined && typeof item.version !== "string")
        || [item.supplier, item.desc, item.link, item.fileName, item.rejectReason].some(value => value != null && typeof value !== "string")
        || [item.demoVideoUrl, item.coverUrl].some(value => value != null && !isExploreUrl(value, true))
        || (item.tags != null && !z.array(z.object({ text: z.string(), color: advertisementColor })).safeParse(item.tags).success)
        || (item.isCollected != null && typeof item.isCollected !== "boolean")
        || (item.state === 1 && (typeof item.link !== "string" || !item.link.trim()
          || typeof item.fileName !== "string" || !item.fileName.trim())))) fail("插件市场列表格式不正确", 502);
    return {
      total,
      list: data.list.map(item => ({
        ...item, supplier: item.supplier ?? undefined, desc: item.desc ?? undefined,
        link: item.link ?? undefined, fileName: item.fileName ?? undefined, isCollected: item.isCollected ?? false,
        rejectReason: item.rejectReason ?? undefined, tags: item.tags ?? [],
        demoVideoUrl: item.demoVideoUrl || undefined, coverUrl: item.coverUrl || undefined,
      })),
    };
  }

  getPluginExistence(plugins: PluginIdentity[], options: AuthenticatedOptions): Promise<PluginExistence[]> {
    if (!Array.isArray(plugins) || !plugins.length) fail("待检查插件不能为空");
    return this.request<PluginExistence[]>({
      ...authenticated(options), method: "POST", path: "/web/web/plugIn/getPluginExistence", data: { plugins },
    });
  }

  async toggleCollection(pluginId: number, options: AuthenticatedOptions): Promise<{ collected: boolean }> {
    if (!Number.isSafeInteger(pluginId) || pluginId < 1) fail("插件 ID 必须为正整数");
    const data = await this.request<{ collected: boolean }>({
      ...authenticated(options), method: "POST", path: "/web/web/plugIn/toggleCollection", data: { pluginId },
    });
    if (!data || typeof data.collected !== "boolean") fail("插件收藏响应格式不正确", 502);
    return { collected: data.collected };
  }

  async getPluginUploadSignature(params: PluginUploadSignatureParams, options: AuthenticatedOptions): Promise<PluginUploadSignature> {
    const data = await this.request<PluginUploadSignature>({
      ...authenticated(options), method: "POST", path: "/web/web/plugIn/getUploadSignature", data: params,
    });
    if (!data || !isExploreUrl(data.uploadUrl) || typeof data.fileKey !== "string" || !data.fileKey || data.fileKey.length > 512
      || !["video/mp4", "video/webm", "image/jpeg", "image/png", "image/webp"].includes(data.contentType)) {
      fail("插件素材上传签名格式不正确", 502);
    }
    return data;
  }

  async uploadPlugin(params: UploadPluginParams, options: AuthenticatedOptions): Promise<string> {
    for (const [value, label] of [[params.name, "插件名称"], [params.identifier, "插件标识"], [params.fileBase64, "插件文件内容"],
      [params.fileName, "插件文件名"], [params.version, "版本号"]] as const) {
      if (typeof value !== "string" || !value.trim()) fail(t`${translateMessage(label)}不能为空`);
    }
    if (!pluginTypes.includes(params.type)) fail("不支持的插件类型");
    if (params.desc !== undefined && typeof params.desc !== "string") fail("插件描述格式不正确");
    const extension = params.type === "skill" || params.type === "agent" ? ".zip" : ".js";
    if (!params.fileName.trim().toLowerCase().endsWith(extension)) fail(t`此类插件只支持 ${extension} 文件`);
    const data = await this.request<string>({
      ...authenticated(options), method: "POST", path: "/web/web/plugIn/uploadPlugin", timeout: 60000,
      data: {
        name: params.name.trim(), identifier: params.identifier.trim(), type: params.type,
        ...(params.desc !== undefined ? { desc: params.desc.trim() } : {}),
        fileBase64: `data:${extension === ".zip" ? "application/zip" : "text/javascript"};base64,${params.fileBase64}`,
        fileName: params.fileName.trim(), version: params.version.trim(),
        ...(params.demoVideoKey !== undefined ? { demoVideoKey: params.demoVideoKey } : {}),
        ...(params.coverKey !== undefined ? { coverKey: params.coverKey } : {}),
      },
    });
    if (typeof data !== "string") fail("上传插件响应格式不正确", 502);
    return data;
  }

  async updatePlugin(params: UpdatePluginParams, options: AuthenticatedOptions): Promise<string> {
    if (!Number.isSafeInteger(params.id) || params.id < 1) fail("插件 ID 必须为正整数");
    for (const [value, label] of [[params.name, "插件名称"], [params.fileBase64, "插件文件内容"],
      [params.fileName, "插件文件名"], [params.version, "版本号"]] as const) {
      if (typeof value !== "string" || !value.trim()) fail(t`${translateMessage(label)}不能为空`);
    }
    if (params.desc !== undefined && typeof params.desc !== "string") fail("插件描述格式不正确");
    const archive = params.fileName.trim().toLowerCase().endsWith(".zip");
    if (!archive && !params.fileName.trim().toLowerCase().endsWith(".js")) fail("插件文件只支持 .js 或 .zip 文件");
    const data = await this.request<string>({
      ...authenticated(options), method: "POST", path: "/web/web/plugIn/updatePlugin", timeout: 60000,
      data: {
        id: params.id, name: params.name.trim(), version: params.version.trim(),
        ...(params.desc !== undefined ? { desc: params.desc.trim() } : {}),
        fileBase64: `data:${archive ? "application/zip" : "text/javascript"};base64,${params.fileBase64}`,
        fileName: params.fileName.trim(),
        ...(params.demoVideoKey !== undefined ? { demoVideoKey: params.demoVideoKey } : {}),
        ...(params.coverKey !== undefined ? { coverKey: params.coverKey } : {}),
      },
    });
    if (typeof data !== "string") fail("重新提交插件响应格式不正确", 502);
    return data;
  }

  async deletePlugin(id: number, options: AuthenticatedOptions): Promise<string> {
    if (!Number.isSafeInteger(id) || id < 1) fail("插件 ID 必须为正整数");
    const data = await this.request<string>({
      ...authenticated(options), method: "POST", path: "/web/web/plugIn/deletePlugin", data: { id },
    });
    if (typeof data !== "string") fail("删除插件响应格式不正确", 502);
    return data;
  }

  async getPreviewData(options: AuthenticatedOptions): Promise<PreviewData> {
    const data = await this.request<PreviewData>({
      ...authenticated(options), method: "GET", path: "/web/web/pointsPreview/getPreviewData",
    });
    if (!Array.isArray(data?.daily)) fail("账号余额响应格式不正确", 502);
    return {
      totalPoints: parseAmount(data.totalPoints, true),
      bonusBalance: parseAmount(data.bonusBalance),
      totalConsumption: parseAmount(data.totalConsumption),
      daily: data.daily.map(item => {
        if (!item || !isDate(item.date)) fail("每日消费数据格式不正确", 502);
        return { date: item.date, total: parseAmount(item.total) };
      }),
    };
  }

  async getUsageStatistics(params: UsageStatisticsParams, options: AuthenticatedOptions): Promise<UsageStatistics> {
    if (![params.startTime, params.finishTime].every(value => Number.isSafeInteger(value) && Number.isFinite(new Date(value).getTime()))) fail("统计时间格式不正确");
    if (params.finishTime < params.startTime || params.finishTime - params.startTime > 31 * 24 * 60 * 60 * 1000) fail("统计时间范围必须在 31 天以内，且结束时间不能早于开始时间");
    if (params.modelName !== undefined && typeof params.modelName !== "string") fail("统计模型名称格式不正确");
    if (params.keyId !== undefined && (!Number.isSafeInteger(params.keyId) || params.keyId < 1)) fail("统计 API Key ID 必须为正整数");
    if (params.groupBy !== undefined && params.groupBy !== "model" && params.groupBy !== "key") fail("不支持的消费统计分组方式");
    const data = await this.request<UsageStatistics>({
      ...authenticated(options), method: "POST", path: "/web/web/pointsPreview/getUsageStatistics",
      data: {
        startTime: params.startTime, finishTime: params.finishTime, groupBy: params.groupBy ?? "model",
        ...(params.modelName !== undefined ? { modelName: params.modelName.trim() } : {}),
        ...(params.keyId !== undefined ? { keyId: params.keyId } : {}),
      },
    });
    if (!data?.summary || !Number.isSafeInteger(data.summary.totalRequests) || data.summary.totalRequests < 0
      || !Array.isArray(data.dates) || !data.dates.every(isDate) || !Array.isArray(data.series)
      || !Array.isArray(data.models) || data.models.some(item => typeof item !== "string")
      || !Array.isArray(data.keys) || data.keys.some(item => !item || !Number.isSafeInteger(item.id) || item.id < 1
        || (item.name !== null && typeof item.name !== "string"))) fail("消费统计响应格式不正确", 502);
    return {
      summary: { totalRequests: data.summary.totalRequests, totalAmount: parseAmount(data.summary.totalAmount) },
      dates: data.dates,
      series: data.series.map(item => {
        if (!item || typeof item.name !== "string" || !Array.isArray(item.data) || item.data.length !== data.dates.length) fail("消费统计图表数据格式不正确", 502);
        return { name: item.name, data: item.data.map(value => value === null ? null : parseAmount(value)) };
      }),
      models: data.models,
      keys: data.keys.map(item => ({ id: item.id, name: item.name })),
    };
  }

  async getProviderSource(options: AuthenticatedOptions): Promise<ProviderSources> {
    const sources = await this.request<ProviderSources>({
      ...authenticated(options), method: "GET", path: "/web/web/provider/getProviderSource",
    });
    if (!sources || typeof sources.language !== "string" || !sources.language.trim()
      || typeof sources.media !== "string" || !sources.media.trim()) fail("供应商源码响应格式不正确", 502);
    if ([sources.language, sources.media].some(source => Buffer.byteLength(source, "utf8") > 2 * 1024 * 1024)) {
      fail("供应商源码不能超过 2 MB", 502);
    }
    return { language: sources.language, media: sources.media };
  }

  async getExploreProjects(params: ExploreParams, options?: RequestOptions): Promise<ExplorePage> {
    if (!Number.isSafeInteger(params.limit) || params.limit < 1 || params.limit > 50) fail("每页数量必须为 1 至 50 的整数");
    const page = await this.request<ExplorePage>({
      method: "POST", path: "/v1/explore/getProjects", signal: options?.signal,
      data: {
        limit: params.limit,
        ...(params.cursor !== undefined ? { cursor: params.cursor } : {}),
        ...(params.categoryId !== undefined ? { categoryId: params.categoryId } : {}),
        ...(params.searchKeyword !== undefined ? { searchKeyword: params.searchKeyword } : {}),
      },
    });
    if (!page || !Array.isArray(page.list) || page.list.length > params.limit
      || (page.nextCursor !== null && (typeof page.nextCursor !== "string" || !page.nextCursor.trim()))) fail("探索分页响应格式不正确", 502);
    if (!Array.isArray(page.categories) || page.categories.some(item => !item || typeof item.id !== "string" || !item.id.trim()
      || typeof item.name !== "string" || !item.name.trim()) || new Set(page.categories.map(item => item.id)).size !== page.categories.length) fail("探索分类响应格式不正确", 502);
    page.list.forEach(validateExploreProject);
    if (new Set(page.list.map(project => project.id)).size !== page.list.length) fail("探索项目 ID 重复", 502);
    return page;
  }

  async getExploreProject(projectId: string, options?: RequestOptions): Promise<ExploreDetail> {
    validateExploreId(projectId);
    const project = await this.request<ExploreDetail>({ method: "POST", path: "/v1/explore/getProject", data: { projectId }, signal: options?.signal });
    validateExploreProject(project);
    if (project.id !== projectId || typeof project.description !== "string"
      || !isExploreUrl(project.videoUrl, true) || !isExploreUrl(project.shareUrl)) fail("作品详情响应格式不正确", 502);
    return project;
  }

  async getExploreProcess(projectId: string, options?: RequestOptions): Promise<ExploreProcess> {
    validateExploreId(projectId);
    const process = await this.request<ExploreProcess>({ method: "POST", path: "/v1/explore/getProcess", data: { projectId }, signal: options?.signal });
    if (!process || !Array.isArray(process.canvases) || !process.canvases.length) fail("制作过程响应格式不正确", 502);
    const canvasIds = new Set<string>();
    for (const canvas of process.canvases) {
      if (!canvas || typeof canvas.id !== "string" || !canvas.id || canvasIds.has(canvas.id) || typeof canvas.name !== "string"
        || !Array.isArray(canvas.nodes) || !Array.isArray(canvas.edges)) fail("制作过程画布格式不正确", 502);
      canvasIds.add(canvas.id);
      const nodes = new Map<string, typeof canvas.nodes[number]>();
      for (const node of canvas.nodes) {
        if (!node || typeof node.id !== "string" || !node.id || nodes.has(node.id) || typeof node.label !== "string"
          || !node.position || ![node.position.x, node.position.y].every(Number.isFinite)
          || [node.width, node.height].some(size => size !== undefined && (!Number.isFinite(size) || size <= 0))
          || (node.parentNode !== undefined && typeof node.parentNode !== "string")
          || (node.kind !== undefined && node.kind !== "group")
          || [node.text, node.prompt].some(text => text !== undefined && typeof text !== "string")
          || (node.media !== undefined && (!node.media || !["image", "video", "audio"].includes(node.media.type) || !isExploreUrl(node.media.url)))) fail("制作过程节点格式不正确", 502);
        if (node.handles !== undefined) {
          if (!Array.isArray(node.handles) || (node.kind === "group" && node.handles.length)) fail("制作过程节点端口格式不正确", 502);
          const handleIds = new Set<string>();
          for (const handle of node.handles) {
            const dataTypes = Array.isArray(handle?.dataType) ? handle.dataType : [handle?.dataType];
            if (!handle || typeof handle.id !== "string" || !handle.id.trim() || handleIds.has(handle.id)
              || !["source", "target"].includes(handle.type) || (handle.label !== undefined && typeof handle.label !== "string")
              || !dataTypes.length || dataTypes.some(type => typeof type !== "string" || !type.split(",").some(part => part.trim()))) fail("制作过程节点端口格式不正确", 502);
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
          if (ancestors.has(current.id)) fail("制作过程分组存在循环", 502);
          ancestors.add(current.id);
          if (current.parentNode !== undefined && nodes.get(current.parentNode)?.kind !== "group") fail("制作过程分组不存在", 502);
          current = current.parentNode === undefined ? undefined : nodes.get(current.parentNode);
        }
        for (const id of ancestors) checked.add(id);
      }
      const edgeIds = new Set<string>();
      for (const edge of canvas.edges) {
        if (!edge || typeof edge.id !== "string" || !edge.id || edgeIds.has(edge.id) || !nodes.has(edge.source) || !nodes.has(edge.target)) fail("制作过程连线格式不正确", 502);
        const source = nodes.get(edge.source)!;
        const target = nodes.get(edge.target)!;
        if (source.kind === "group" || target.kind === "group") fail("制作过程分组不能连接端口", 502);
        for (const [node, id, type, fallback] of [[source, edge.sourceHandle, "source", "out"], [target, edge.targetHandle, "target", "in"]] as const) {
          if (id !== undefined && (typeof id !== "string" || !id.trim()
            || (node.handles === undefined ? id !== fallback : !node.handles.some(handle => handle.id === id && handle.type === type)))) fail("制作过程连线端口不存在或方向不正确", 502);
          if (id === undefined && node.handles !== undefined && !node.handles.some(handle => handle.type === type)) fail("制作过程连线端口不存在或方向不正确", 502);
        }
        edgeIds.add(edge.id);
      }
    }
    return process;
  }

  async getExploreDownload(projectId: string, options?: RequestOptions): Promise<{ downloadUrl: string }> {
    validateExploreId(projectId);
    const download = await this.request<{ downloadUrl: string }>({ method: "POST", path: "/v1/explore/getDownload", data: { projectId }, signal: options?.signal });
    if (!isExploreUrl(download?.downloadUrl) || new URL(download.downloadUrl).protocol !== "https:") fail("项目下载地址无效", 502);
    return download;
  }

  async getSponsorList(options?: RequestOptions): Promise<Sponsor[]> {
    const sponsors = await this.request<Sponsor[]>({ method: "POST", path: "/web/sponsor/getSponsorList", data: null, signal: options?.signal });
    if (!Array.isArray(sponsors) || sponsors.some(item => !item || !Number.isSafeInteger(item.id) || item.id < 1
      || typeof item.name !== "string" || typeof item.logoUrl !== "string" || typeof item.readme !== "string")) fail("赞助商响应格式不正确", 502);
    return sponsors;
  }

  async getExploreUploadSignature(params: ExploreUploadSignatureParams, options: AuthenticatedOptions): Promise<ExploreUploadSignature> {
    const data = await this.request<ExploreUploadSignature>({
      ...authenticated(options), method: "POST", path: "/web/toonflow/explore/getUploadSignature", data: params,
    });
    const contentTypes: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", mp4: "video/mp4", webm: "video/webm", zip: "application/zip" };
    const extension = params.fileName.split(".").at(-1)?.toLowerCase() ?? "";
    if (!data || !isExploreUrl(data.uploadUrl) || new URL(data.uploadUrl).protocol !== "https:"
      || typeof data.fileKey !== "string" || !data.fileKey.startsWith(`toonflow/explore/${params.kind}/`) || data.fileKey.length > 512
      || !contentTypes[extension] || data.contentType !== contentTypes[extension]) fail("作品上传签名格式不正确", 502);
    return data;
  }

  async uploadExploreProject(params: UploadExploreProjectParams, options: AuthenticatedOptions): Promise<ExploreSubmission> {
    const data = await this.request<ExploreSubmission>({
      ...authenticated(options), method: "POST", path: "/web/toonflow/explore/uploadProject", data: params, timeout: 60000,
    });
    if (!data || !Number.isSafeInteger(data.id) || data.id < 1 || data.state !== 0) fail("作品提交响应格式不正确", 502);
    return data;
  }

  async getAdvertisements(options?: RequestOptions): Promise<HomeAdvertisements> {
    const data = await this.request<{ banner: unknown; banners?: unknown; bannerMode?: unknown; bannerInterval?: unknown; sidebar: unknown }>({
      method: "POST", path: "/web/toonflow/home/getAdvertisements", signal: options?.signal,
    });
    if (!data || typeof data !== "object" || Array.isArray(data)) fail("首页广告响应格式不正确", 502);
    const now = Date.now();
    function parseAdvertisement(value: unknown, requireImage = false): HomeAdvertisement | null {
      const parsed = homeAdvertisement.safeParse(value);
      if (!parsed.success) return null;
      const advertisement = parsed.data;
      if (advertisement.endsAt && advertisement.endsAt <= now) return null;
      if ((requireImage || advertisement.appearance?.mode === "image") && !advertisement.imageUrl) return null;
      return advertisement;
    }
    // ACT: 新接口的空数组表示明确清空；只有旧接口缺少 banners 时才回退单条。
    if (data.banners !== undefined && !Array.isArray(data.banners)) fail("顶部横幅响应格式不正确", 502);
    const banners = (Array.isArray(data.banners) ? data.banners : [data.banner])
      .slice(0, 10).map(item => parseAdvertisement(item)).filter((item): item is HomeAdvertisement => item !== null);
    const sidebar = Array.isArray(data.sidebar) ? data.sidebar : [data.sidebar];
    return {
      banner: banners[0] ?? null,
      banners,
      bannerMode: data.bannerMode === "stack" ? "stack" : "carousel",
      bannerInterval: typeof data.bannerInterval === "number" && Number.isInteger(data.bannerInterval) && data.bannerInterval >= 2 && data.bannerInterval <= 60 ? data.bannerInterval : 5,
      sidebar: sidebar.slice(0, 10).map(item => parseAdvertisement(item, true)).filter((item): item is HomeAdvertisement => item !== null),
    };
  }
}
