#!/usr/bin/env bun

const args = process.argv.slice(2);
const command = ["/usr/bin/xcrun", ...args];
if (args[0] !== "stapler" || !["staple", "validate"].includes(args[1] ?? "")) {
  const child = Bun.spawn(command, { stdin: "inherit", stdout: "inherit", stderr: "inherit" });
  process.exit(await child.exited);
}

// ACT: Hutch 0.24.3 没有票据网络重试；仅重试这两个幂等命令，上游支持后可移除转发。
const maxRetries = 10;
for (let attempt = 0; attempt <= maxRetries; attempt++) {
  const result = Bun.spawnSync(command, { stdin: "inherit", stdout: "pipe", stderr: "pipe" });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  const output = result.stdout.toString() + result.stderr.toString();
  const networkError = /NSURLErrorDomain Code=-(1001|1003|1004|1005|1006|1009)\b|The network connection was lost/.test(output);
  if (result.exitCode === 0 || !networkError || attempt === maxRetries) {
    process.exitCode = result.exitCode;
    break;
  }
  console.error(`Apple 公证票据请求遇到网络错误，5 秒后重试（${attempt + 1}/${maxRetries}）：stapler ${args[1]}`);
  await Bun.sleep(5000);
}
