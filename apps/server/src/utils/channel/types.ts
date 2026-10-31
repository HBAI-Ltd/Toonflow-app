export type RequestOptions = { signal?: AbortSignal };
export type AuthenticatedOptions = RequestOptions & { token: string };

export type Captcha = { svg: string; captcha: string };
export type UserInfo = { userName: string; phone: string };
export type Login = { token: string; info: UserInfo };
export type ProviderSources = { language: string; media: string };
export type LoginParams = { userName: string; password: string; captcha: string; originalCaptcha: string };
export type SmsParams = { phone: string; verify: { ticket: string; randstr: string }; isForget?: 0 | 1 | null };
export type RegisterParams = { userName: string; phone: string; password: string; verificationCode: string; invitationCode?: string };
export type ForgotPasswordParams = { phone: string; verificationCode: string; newPassword: string; confirmPassword: string };

export type PluginType = "node" | "tool" | "skill" | "agent" | "ext";
export type PluginIdentity = { type: PluginType; identifier: string };
export type PluginExistence = PluginIdentity & { exists: boolean };
export type Plugin = {
  id: number;
  identifier: string;
  type: PluginType;
  name: string;
  state: 0 | 1 | 2;
  version?: string;
  supplier?: string;
  desc?: string;
  link?: string;
  fileName?: string;
  isCollected?: boolean;
  rejectReason?: string;
  tags?: { text: string; color: string }[];
  demoVideoUrl?: string;
  coverUrl?: string;
};
export type PluginsParams = { page: number; limit: number; type: PluginType | "all" | "my" | "collection"; searchKeyword?: string };
export type UploadPluginParams = { name: string; identifier: string; type: PluginType; desc?: string; fileBase64: string; fileName: string; version: string; demoVideoKey?: string; coverKey?: string };
export type UpdatePluginParams = { id: number; name: string; desc?: string; fileBase64: string; fileName: string; version: string; demoVideoKey?: string; coverKey?: string };
export type PluginUploadSignatureParams = { kind: "video" | "cover"; fileName: string };
export type PluginUploadSignature = { uploadUrl: string; fileKey: string; contentType: string };

export type PreviewData = { totalPoints: number; bonusBalance: number; totalConsumption: number; daily: { date: string; total: number }[] };
export type UsageStatisticsParams = { startTime: number; finishTime: number; modelName?: string; keyId?: number; groupBy?: "model" | "key" };
export type UsageStatistics = {
  summary: { totalRequests: number; totalAmount: number };
  dates: string[];
  series: { name: string; data: (number | null)[] }[];
  models: string[];
  keys: { id: number; name: string | null }[];
};

export type TaskRecordsParams = { page: number; limit: number; taskId?: string };
export type TaskRecord = {
  id: number;
  taskId: string;
  modelName: string;
  amount: number | null;
  duration: number | null;
  status: number;
  result: string;
  resultUrl: string;
  keyName: string;
  errorReason: string;
  createdAt: number;
  completedAt: number | null;
};
export type TaskRecordsPage = { list: TaskRecord[]; total: number };
export type PointsConsumptionParams = { key?: string; startTime: number; finishTime: number };
export type PointsConsumption = { total: number; count: number };

export type SubAccountsParams = { page: number; limit: number; credential?: string };
export type SubAccount = {
  id: number;
  name: string;
  credential: string;
  balance: number;
  groupId: number;
  quotaType: 0 | 1;
  expirationType: 0 | 1;
  expiresAt: number;
  createdAt: number;
  state: number;
};
export type SubAccountsPage = { list: SubAccount[]; total: number };
export type CreateSubAccountParams = {
  name: string;
  quotaType: 0 | 1;
  expirationType: 0 | 1;
  balance?: number;
  expiresAt?: number;
};

export type WalletOrdersParams = { page: number; limit: number };
export type WalletPlan = {
  id: number; money: number; integral: number; amount: number; points: number;
  bonusAmount: number; bonusRate: number; totalAmount: number; description: string;
};
export type WalletBonus = {
  bonusAmount: number;
  bonusActivityName: string | null;
  bonusExpireMode: "days" | "fixed" | null;
  bonusValidDays: number | null;
  bonusExpiresAt: number | null;
};
export type WalletPresentationActivity = {
  id: number;
  key: string;
  title: string;
  updatedAt: number;
  rechargeConfig: {
    ruleType: string;
    scope: "all" | "custom" | "packages";
    packageIds: number[];
    badge: string;
    summary: string;
    startsAt: number | null;
    endsAt: number | null;
  };
};
export type WalletPresentation = {
  agreement: { title: string; content: string; version: string; updatedAt: number } | null;
  activities: WalletPresentationActivity[];
  pricing: { rechargeDiscount: number; agentFirstRecharge: boolean };
  serverTime: number;
};
export type WalletActivity = { firstRechargeDiscount: number; serverTime: number; refreshAt?: number } & ({ eligible: false } | {
  eligible: true;
  name: string;
  rate: number;
  rateMode: "fixed" | "tiered";
  tiers: { upTo: number; rate: number }[];
  expireMode: "days" | "fixed";
  validDays: number | null;
  expiresAt: number | null;
  startsAt: number | null;
  endsAt: number | null;
});
export type WalletBonusBatchesParams = { status: "available" | "used" | "expired"; page: number; limit: number };
export type WalletBonusBatch = {
  id: number;
  orderId: number | null;
  orderNumber: string;
  activityName: string;
  source: string;
  expireMode: string;
  validDays: number | null;
  amount: number;
  available: number;
  used: number;
  expired: number;
  createdAt: number;
  expiresAt: number | null;
  status: WalletBonusBatchesParams["status"];
};
export type WalletBonusBatchesPage = {
  list: WalletBonusBatch[];
  total: number;
  summary: {
    availableAmount: number;
    expiringSoonAmount: number;
    nextExpiresAt: number | null;
    counts: Record<WalletBonusBatchesParams["status"], number>;
  };
};
export type WalletOrder = Partial<WalletBonus> & {
  id: number;
  name: string;
  amount: number;
  points: number;
  orderNumber: string;
  type: number;
  status: number;
  paymentMethod: string;
  createdAt: number;
  paidAt: number | null;
  remark: string;
};
export type WalletOrdersPage = { list: WalletOrder[]; total: number };
export type WalletPaymentParams = {
  comboId: number; payType: "wechat" | "alipay"; customMoney?: number;
  expectedAmount: number; expectedBonusAmount: number; expectedBonus: WalletBonus;
};
export type WalletPayment = WalletBonus & { orderNumber: string; payUrl: string; kind: "image" | "url"; amount: number };
export type WalletPaymentStatus = { status: number };

export type ModelType = "text" | "image" | "video" | "audio";
export type ModelDataParams = { type: ModelType | "all" };
export type ModelPriceStep = {
  inputMinTokens: number;
  inputMaxTokens: number;
  outputMinTokens: number;
  outputMaxTokens: number;
  inputPrice: number;
  outputPrice: number;
};
export type ModelPricePeriod = {
  type: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
  cacheRead?: number;
  cacheWrite?: number;
  steps: ModelPriceStep[];
};
export type ModelBilling = {
  type: number;
  tokenUnit?: number;
  inputPrice?: number;
  outputPrice?: number;
  fixedPrice?: number;
  steps?: ModelPriceStep[];
  periods?: ModelPricePeriod[];
  idleSteps?: ModelPriceStep[];
  idleCacheRead?: number;
  idleCacheWrite?: number;
  ruleDescription?: string;
};
export type ModelData = {
  id: number;
  name: string;
  type: ModelType;
  abilities: string[];
  qualities: string[];
  available: boolean;
  description: string;
  currency: string;
  priceUnit: string;
  billing: ModelBilling;
};

export type Sponsor = { id: number; name: string; logoUrl: string; readme: string };
export type HomeAdvertisement = {
  title: string;
  content: string;
  imageUrl: string;
  buttonText: string;
  actionType: "web" | "path" | "settings";
  actionTarget: string;
  endsAt: number | null;
  updatedAt: number;
  appearance?: {
    mode: "text" | "image";
    backgroundColor: string;
    backgroundEndColor?: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
  };
};
export type HomeAdvertisements = {
  banner: HomeAdvertisement | null;
  banners: HomeAdvertisement[];
  bannerMode: "carousel" | "stack";
  bannerInterval: number;
  sidebar: HomeAdvertisement[];
};
export type ExploreCategory = { id: string; name: string };
export type ExploreProject = {
  id: string;
  title: string;
  coverUrl: string;
  author: { id: string; name: string; avatarUrl?: string };
  likeCount: number;
  collectionCount: number;
};
export type ExploreParams = { cursor?: string; limit: number; categoryId?: string; searchKeyword?: string };
export type ExplorePage = { categories: ExploreCategory[]; list: ExploreProject[]; nextCursor: string | null };
export type ExploreDetail = ExploreProject & { description: string; videoUrl: string; shareUrl: string };
export type ExploreUploadSignatureParams = { kind: "cover" | "video" | "download"; fileName: string };
export type ExploreUploadSignature = { uploadUrl: string; fileKey: string; contentType: string };
export type UploadExploreProjectParams = { title: string; description?: string; coverKey: string; videoKey: string; downloadKey?: string };
export type ExploreSubmission = { id: number; state: 0 };
export type ExploreProcess = {
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
      handles?: { id: string; type: "source" | "target"; dataType: string | string[]; label?: string }[];
      text?: string;
      prompt?: string;
      media?: { type: "image" | "video" | "audio"; url: string };
    }[];
    edges: { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string }[];
  }[];
};

export interface Channel {
  getCaptcha(options?: RequestOptions): Promise<Captcha>;
  sendSmsCode(params: SmsParams, options?: RequestOptions): Promise<number>;
  register(params: RegisterParams, options?: RequestOptions): Promise<{ userCode: string }>;
  login(params: LoginParams, options?: RequestOptions): Promise<Login>;
  forgotPassword(params: ForgotPasswordParams, options?: RequestOptions): Promise<string>;
  getPlugins(params: PluginsParams, options: AuthenticatedOptions): Promise<{ list: Plugin[]; total: number }>;
  getPluginExistence(plugins: PluginIdentity[], options: AuthenticatedOptions): Promise<PluginExistence[]>;
  toggleCollection(pluginId: number, options: AuthenticatedOptions): Promise<{ collected: boolean }>;
  getPluginUploadSignature(params: PluginUploadSignatureParams, options: AuthenticatedOptions): Promise<PluginUploadSignature>;
  uploadPlugin(params: UploadPluginParams, options: AuthenticatedOptions): Promise<string>;
  updatePlugin(params: UpdatePluginParams, options: AuthenticatedOptions): Promise<string>;
  deletePlugin(id: number, options: AuthenticatedOptions): Promise<string>;
  getPreviewData(options: AuthenticatedOptions): Promise<PreviewData>;
  getUsageStatistics(params: UsageStatisticsParams, options: AuthenticatedOptions): Promise<UsageStatistics>;
  getTaskRecords(params: TaskRecordsParams, options: AuthenticatedOptions): Promise<TaskRecordsPage>;
  getPointsConsumption(params: PointsConsumptionParams, options: AuthenticatedOptions): Promise<PointsConsumption>;
  getSubAccounts(params: SubAccountsParams, options: AuthenticatedOptions): Promise<SubAccountsPage>;
  createSubAccount(params: CreateSubAccountParams, options: AuthenticatedOptions): Promise<void>;
  removeSubAccount(id: number, options: AuthenticatedOptions): Promise<void>;
  getWalletOrders(params: WalletOrdersParams, options: AuthenticatedOptions): Promise<WalletOrdersPage>;
  getWalletPlans(options: AuthenticatedOptions): Promise<WalletPlan[]>;
  getWalletPresentation(options: AuthenticatedOptions): Promise<WalletPresentation>;
  getWalletActivity(options: AuthenticatedOptions): Promise<WalletActivity>;
  getWalletBonusBatches(params: WalletBonusBatchesParams, options: AuthenticatedOptions): Promise<WalletBonusBatchesPage>;
  exchangeWalletCode(code: string, options: AuthenticatedOptions): Promise<void>;
  createWalletPayment(params: WalletPaymentParams, options: AuthenticatedOptions): Promise<WalletPayment>;
  getWalletPaymentStatus(orderNumber: string, options: AuthenticatedOptions): Promise<WalletPaymentStatus>;
  getModelData(params: ModelDataParams, options: AuthenticatedOptions): Promise<ModelData[]>;
  getProviderSource(options: AuthenticatedOptions): Promise<ProviderSources>;
  getExploreProjects(params: ExploreParams, options?: RequestOptions): Promise<ExplorePage>;
  getExploreProject(projectId: string, options?: RequestOptions): Promise<ExploreDetail>;
  getExploreProcess(projectId: string, options?: RequestOptions): Promise<ExploreProcess>;
  getExploreDownload(projectId: string, options?: RequestOptions): Promise<{ downloadUrl: string }>;
  getExploreUploadSignature(params: ExploreUploadSignatureParams, options: AuthenticatedOptions): Promise<ExploreUploadSignature>;
  uploadExploreProject(params: UploadExploreProjectParams, options: AuthenticatedOptions): Promise<ExploreSubmission>;
  getSponsorList(options?: RequestOptions): Promise<Sponsor[]>;
  getAdvertisements(options?: RequestOptions): Promise<HomeAdvertisements>;
}
