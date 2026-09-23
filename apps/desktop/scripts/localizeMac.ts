import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

if (process.env.ELECTROBUN_OS === "macos") {
  const buildDir = process.env.ELECTROBUN_BUILD_DIR;
  if (!buildDir) throw new Error("缺少 ELECTROBUN_BUILD_DIR，无法设置 macOS 应用语言。");

  const bundlePath = process.env.ELECTROBUN_WRAPPER_BUNDLE_PATH ?? readdirSync(buildDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith(".app"))
    .map((entry) => join(buildDir, entry.name))
    .find((path) => existsSync(join(path, "Contents", "Info.plist")));
  if (!bundlePath) throw new Error(`未找到待本地化的 macOS 应用：${buildDir}`);

  const plistPath = join(bundlePath, "Contents", "Info.plist");
  let plist = readFileSync(plistPath, "utf8");
  // ACT: 两套 SDK 当前生成 XML；如果改为二进制 plist，应改用 macOS 的 plutil。
  if (!/<\/dict>\s*<\/plist>\s*$/.test(plist)) throw new Error(`不支持的 Info.plist 格式：${plistPath}`);
  const bundleName = plist.match(/<key>CFBundleName<\/key>\s*<string>([^<]+)<\/string>/)?.[1];
  if (!bundleName) throw new Error(`无法读取应用名称：${plistPath}`);

  for (const [key, value] of [
    ["CFBundleDevelopmentRegion", "<string>zh-Hans</string>"],
    ["CFBundleLocalizations", "<array><string>zh-Hans</string></array>"],
  ]) {
    const existing = new RegExp(`<key>${key}</key>\\s*<(string|array)>[\\s\\S]*?</\\1>`);
    if (existing.test(plist)) {
      plist = plist.replace(existing, `<key>${key}</key>${value}`);
    } else {
      plist = plist.replace(/<\/dict>\s*<\/plist>\s*$/, `  <key>${key}</key>\n  ${value}\n</dict>\n</plist>`);
    }
  }
  writeFileSync(plistPath, plist);

  const resourceDir = join(bundlePath, "Contents", "Resources", "zh-Hans.lproj");
  mkdirSync(resourceDir, { recursive: true });
  writeFileSync(join(resourceDir, "InfoPlist.strings"),
    `CFBundleName = ${JSON.stringify(bundleName)};\nCFBundleDisplayName = ${JSON.stringify(bundleName)};\n`);
  console.log(`已设置 macOS 简体中文本地化：${bundlePath}`);
}
