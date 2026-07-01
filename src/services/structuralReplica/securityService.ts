import crypto from "node:crypto";
import u from "@/utils";

const PREFIX = "srenc:v1:";

async function getSecret(): Promise<Buffer> {
  let row = await u.db("o_setting").where("key", "sr.encryptionSecret").first();
  if (!row?.value) {
    const value = crypto.randomBytes(32).toString("hex");
    await u.db("o_setting").insert({ key: "sr.encryptionSecret", value });
    row = { key: "sr.encryptionSecret", value };
  }
  return crypto.createHash("sha256").update(String(row.value)).digest();
}

export function isEncryptedSecret(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export async function encryptSecret(value: string | null | undefined): Promise<string> {
  if (!value) return "";
  if (isEncryptedSecret(value)) return value;
  const key = await getSecret();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64")}`;
}

export async function decryptSecret(value: string | null | undefined): Promise<string> {
  if (!value) return "";
  if (!isEncryptedSecret(value)) return value;
  const data = Buffer.from(value.slice(PREFIX.length), "base64");
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", await getSecret(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function redactProviderCapability<T extends { apiKey?: string }>(capability: T): T {
  return { ...capability, apiKey: "" };
}

export async function upsertEncryptedSetting(key: string, value: string): Promise<void> {
  const encrypted = await encryptSecret(value);
  const existing = await u.db("o_setting").where("key", key).first();
  if (existing) await u.db("o_setting").where("key", key).update({ value: encrypted });
  else await u.db("o_setting").insert({ key, value: encrypted });
}

export async function getDecryptedSetting(key: string, fallback = ""): Promise<string> {
  const row = await u.db("o_setting").where("key", key).first();
  return row?.value ? await decryptSecret(String(row.value)) : fallback;
}
