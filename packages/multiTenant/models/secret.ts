import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { lstat, readFile, writeAtomic } from "@toonflow/file";
import { dataSourceSchema } from "@toonflow/multi-tenant-db";
import { z } from "zod";

const jsonRecordSchema = z.record(z.string(), z.json());
const maxPayloadBytes = 8 * 1024 * 1024;
export const maxModelCipherLength = 12 * 1024 * 1024;
export const modelCipherSchema = z.string().max(maxModelCipherLength)
  .regex(/^v1\.[A-Za-z0-9+/]{16}\.[A-Za-z0-9+/]{22}==\.[A-Za-z0-9+/]+={0,2}$/);
type SecretPurpose = "cloud" | "execution" | "providers";

function invalid(message: string): never { throw Object.assign(new Error(message), { status: 503 }); }

function decodeKey(value: string) {
  if (!/^[A-Za-z0-9+/]{43}=$/.test(value)) invalid("模型加密密钥无效，必须为 32 字节 Base64");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32 || key.toString("base64") !== value) invalid("模型加密密钥无效，必须为 32 字节 Base64");
  return key;
}

export function createModelSecret(dataDirectory: string) {
  let key: Promise<Buffer> | undefined;
  async function readKey(create: boolean) {
    const configured = process.env.TOONFLOW_MULTI_TENANT_SECRET;
    if (configured !== undefined) return decodeKey(configured.trim());
    const directory = resolve(dataDirectory, "multiTenant");
    const directoryInfo = await lstat(directory).catch((cause: NodeJS.ErrnoException) => {
      if (cause.code === "ENOENT") invalid("多租户数据目录尚未初始化");
      throw cause;
    });
    if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink()) invalid("多租户数据目录必须是普通目录");
    const configPath = resolve(directory, "dataSource.json");
    const configInfo = await lstat(configPath);
    if (!configInfo.isFile() || configInfo.isSymbolicLink() || configInfo.size > 65536) invalid("多租户数据源配置文件无效");
    let provider: "sqlite" | "mysql";
    try { provider = dataSourceSchema.parse(JSON.parse(await readFile(configPath, "utf8"))).provider; }
    catch { invalid("多租户数据源配置文件无效"); }
    if (provider !== "sqlite") invalid("MySQL 部署必须配置 TOONFLOW_MULTI_TENANT_SECRET");
    const path = resolve(directory, "modelSecret.key");
    let info = await lstat(path).catch((cause: NodeJS.ErrnoException) => {
      if (cause.code === "ENOENT") return null;
      throw cause;
    });
    if (!info && create) {
      try { await writeAtomic(path, randomBytes(32).toString("base64"), { exclusive: true, mode: 0o600 }); }
      catch (cause) { if ((cause as NodeJS.ErrnoException).code !== "EEXIST") throw cause; }
      info = await lstat(path);
    }
    if (!info) invalid("模型加密密钥文件缺失，请恢复原密钥");
    if (!info.isFile() || info.isSymbolicLink() || info.size > 128) invalid("模型加密密钥文件无效");
    if (process.platform !== "win32" && (info.mode & 0o077) !== 0) invalid("模型加密密钥文件权限必须为 0600");
    return decodeKey((await readFile(path, "utf8")).trim());
  }
  async function getKey(create: boolean) {
    if (key) return key;
    const opening = readKey(create);
    key = opening;
    try { return await opening; }
    catch (cause) {
      if (key === opening) key = undefined;
      throw cause;
    }
  }
  return {
    async seal(payload: Record<string, unknown>, purpose: SecretPurpose) {
      const data = JSON.stringify(jsonRecordSchema.parse(payload));
      if (Buffer.byteLength(data, "utf8") > maxPayloadBytes) throw Object.assign(new Error("模型执行配置不能超过 8 MB"), { status: 400 });
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", await getKey(true), iv);
      cipher.setAAD(Buffer.from(`toonflow:multiTenant:models:${purpose}:v1`));
      const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
      return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), encrypted.toString("base64")].join(".");
    },
    async open(value: string, purpose: SecretPurpose): Promise<Record<string, unknown>> {
      const parsed = modelCipherSchema.safeParse(value);
      if (!parsed.success) invalid("模型加密配置无效，请检查原始记录与密钥");
      const [, ivValue, tagValue, encryptedValue] = parsed.data.split(".");
      const iv = Buffer.from(ivValue!, "base64");
      const tag = Buffer.from(tagValue!, "base64");
      const encrypted = Buffer.from(encryptedValue!, "base64");
      if (iv.toString("base64") !== ivValue || tag.toString("base64") !== tagValue || encrypted.toString("base64") !== encryptedValue
        || encrypted.length > maxPayloadBytes) invalid("模型加密配置无效，请检查原始记录与密钥");
      const secret = await getKey(false);
      try {
        const decipher = createDecipheriv("aes-256-gcm", secret, iv);
        decipher.setAAD(Buffer.from(`toonflow:multiTenant:models:${purpose}:v1`));
        decipher.setAuthTag(tag);
        const data = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return jsonRecordSchema.parse(JSON.parse(data.toString("utf8")));
      } catch { invalid("模型加密配置无法解密，请检查原始记录与密钥"); }
    },
  };
}
