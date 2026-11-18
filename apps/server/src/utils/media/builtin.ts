import { z } from "zod";
import { getChannel } from "@/utils/channel";
import type { VendorKind } from "@/utils/channel/types";
import { validateMediaProviderSource, validateTextProviderSource } from "@/utils/media/provider";

export const listSchema = z.strictObject({ kind: z.enum(["language", "media"]) });
export const sourceSchema = listSchema.extend({ id: z.string().max(96).regex(/^[a-z][a-zA-Z0-9]*$/) });

export async function getSource(id: string, kind: VendorKind, signal?: AbortSignal) {
  const { source } = await getChannel().getVendorSource(id, kind, { signal });
  // ACT: 在线源码只做 AST 校验，用户安装后才沿已有供应商运行入口加载。
  const parsed = kind === "language" ? validateTextProviderSource(source) : validateMediaProviderSource(source);
  if (parsed.id !== id || id.toLowerCase() === "toonflow") {
    throw Object.assign(new Error("供应商源码 ID 与所选供应商不一致或使用了账号保留 ID"), { status: 502 });
  }
  if ("configuration" in parsed) {
    const { configuration, ...metadata } = parsed;
    return { source, provider: { ...metadata, ...configuration } };
  }
  return { source, provider: parsed };
}
