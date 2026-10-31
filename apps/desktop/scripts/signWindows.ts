import { $ } from "bun";
import { resolve } from "node:path";

export default async function signWindows(paths: string[]) {
  if (!paths.length) throw new Error("请提供需要签名的 Windows 文件路径。");
  const configuredThumbprint = process.env.windowsSigningThumbprint;
  if (configuredThumbprint === undefined) {
    console.warn("未配置 windowsSigningThumbprint，Windows 产物未签名；不能据此认定 Defender 告警已解决。");
    return;
  }
  const thumbprint = configuredThumbprint.trim();
  if (!/^[a-fA-F0-9]{40}$/.test(thumbprint)) throw new Error("windowsSigningThumbprint 必须是证书的 40 位十六进制指纹。");
  if (process.platform !== "win32") throw new Error("Windows 代码签名必须在 Windows 上执行。");
  const signTool = process.env.windowsSignToolPath?.trim() || "signtool.exe";
  if (/[\\/:]/.test(signTool) && !/^(?:[a-zA-Z]:[\\/]|[\\/]{2}[^\\/]+[\\/][^\\/]+)/.test(signTool)) {
    throw new Error("windowsSignToolPath 必须是绝对路径或 PATH 中的命令名，不能使用相对路径。");
  }
  const timestampUrl = new URL(process.env.windowsSigningTimestampUrl || "http://timestamp.digicert.com");
  if (!["http:", "https:"].includes(timestampUrl.protocol) || timestampUrl.username || timestampUrl.password) {
    throw new Error("Windows 签名时间戳地址必须是 HTTP 或 HTTPS 地址，且不能包含凭据。");
  }
  const absolutePaths = paths.map(path => resolve(path));
  await $`${signTool} sign /fd SHA256 /sha1 ${thumbprint} /s My /tr ${timestampUrl.href} /td SHA256 ${absolutePaths}`.quiet();
  await $`${signTool} verify /pa /all /v /tw ${absolutePaths}`.quiet();
  console.log(`Windows 代码签名及验证完成：${paths.length} 个文件。`);
}

if (import.meta.main) await signWindows(process.argv.slice(2));
