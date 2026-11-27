/// <reference path="./types.d.ts" />

export type Provider = ProviderDefinition;
export type ProviderPrice = NonNullable<Awaited<ReturnType<NonNullable<Provider["getPrice"]>>>>;
export type ProviderPriceRequest = Parameters<NonNullable<Provider["getPrice"]>>[0];
export type ProviderPriceReference = NonNullable<ProviderPriceRequest["images"]>[number];
export type ProviderBalance = Awaited<ReturnType<NonNullable<Provider["getBalance"]>>>;
export type ProviderTools = ProviderContext["tool"];
export type ProviderTaskData = Parameters<NonNullable<ProviderContext["saveTaskData"]>>[0];
export type AudioConvertOptions = Parameters<ProviderTools["audio"]["convert"]>[1];
export type { FfmpegFactory, FfmpegCommand } from "@toonflow/ffmpeg/types";

export const aspectRatioPattern = /^[1-9]\d{0,3}:[1-9]\d{0,3}$/;
const defaultVideoRatios = ["16:9", "9:16", "1:1", "4:3", "3:4"];

/** 只按已选的时长和分辨率筛选，合并所有匹配行的比例。 */
export function getVideoRatios(mappings: ProviderModel["durationResolutionMap"], duration?: number, resolution?: string) {
  if (!mappings?.length) return [...defaultVideoRatios];
  const rows = mappings.filter(row => (duration === undefined || row.duration.includes(duration))
    && (!resolution || row.resolution.includes(resolution)));
  return [...new Set(rows.flatMap(row => row.ratio?.length ? row.ratio : defaultVideoRatios))];
}

const unitRate = /[/／每]|单价|起步价|起价|最低|起$|按(?:秒|分钟|时长|张|字符|字数|量|次|请求|token)|\bper\b/i;
const displayedTotal = /^(?:(约为?|大约|预计|预估|合计|总计|≈|~)\s*)?(?:(?:\p{Sc}|CNY|RMB|USD|EUR|GBP)\s*)?((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*(?:元|人民币|美元|美金|积分|点数|点券|点|金币|币|credits?|points?|CNY|RMB|USD|EUR|GBP)?$/iu;

export function getQuoteTotal(price: string | number, details = "") {
  if (typeof price === "number") return !unitRate.test(details) && Number.isFinite(price) && price >= 0 && price <= Number.MAX_SAFE_INTEGER ? price : undefined;
  if (price.length > 128) return undefined;
  const match = displayedTotal.exec(price.trim());
  // ACT: 明确的预估总价可附带单价明细；无前缀的数字若只说明了费率，不能当作本次总额。
  if (!match || (!match[1] && unitRate.test(details))) return undefined;
  const [whole, fraction = ""] = match[2]!.replaceAll(",", "").split(".");
  const digits = fraction.replace(/0+$/, "");
  const normalized = whole!.replace(/^0+(?=\d)/, "") + (digits ? "." + digits : "");
  const value = Number(normalized);
  // ACT: 避免长小数被舍入后恰好落在提醒线以下。
  return value >= 0 && value <= Number.MAX_SAFE_INTEGER
    && value.toLocaleString("en-US", { useGrouping: false, maximumSignificantDigits: 21 }) === normalized ? value : undefined;
}
