import { markMessages } from "@toonflow/i18n";
import { getRuntimePlatform } from "@/lib/platform";
import type { ModelAsset } from "@/utils/localModel/catalog";
import { githubRawSources, githubSources } from "@/utils/localModel/assets/sources";

const builds: Record<string, [string, number, string]> = {
  "win32-x64": ["x86_64-pc-windows-msvc.exe", 26912256, "75e11fa16445f560cb6b021521ddb89e89270d13b83089705d98776f58fd7915"],
  "darwin-arm64": ["aarch64-apple-darwin", 27877081, "4601e7f4e4c03e59a4c5b5000216ef3add3e808799cfccd95e14e83ea4611081"],
  "darwin-x64": ["x86_64-apple-darwin", 29933512, "d3be84003acb7c23e738ad7f70a158ec779a8d233a82e7fa3e717d112eb5b50f"],
  "linux-x64": ["x86_64-unknown-linux-musl", 36417296, "70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da"],
  "linux-arm64": ["aarch64-unknown-linux-gnu", 39238496, "14e02a1c0028f3ca0bdf83b62b3336e56ba0556894ef295a95e8573f06557166"],
  "linux-arm": ["armv7-unknown-linux-gnueabihf", 35353724, "29feffdfacbaa30ff7811bd275f252d405d43ad6e5523ffcedeaf3ff5bb8335b"],
};
const platform = getRuntimePlatform();
const build = !platform.mobile && builds[platform.os === "win32" && process.arch === "arm64" ? "win32-x64" : `${platform.os}-${process.arch}`];
const sileroRevision = "60b7ffa243625ebdc1070275a29f18c87843786a";
const sileroFile = "silero_vad_16k_sequence.onnx";
export const deepFilterAssets: ModelAsset[] = [
  { id: "sileroVad", name: "Silero VAD", displayName: markMessages("对白与停顿检测"), version: "6.2.2", fileName: sileroFile, size: 1246165,
    sha256: "9ccdacc4719d8aa7e45a77536bfabec45a03ba1f2fad5e241ab4060b24238a85",
    sources: githubRawSources("snakers4/silero-vad", sileroRevision, `src/silero_vad/data/${sileroFile}`) },
];
if (build) {
  const [target, size, sha256] = build;
  const fileName = `deep-filter-0.5.6-${target}`;
  deepFilterAssets.push({ id: "deepFilterNet", name: "DeepFilterNet3", displayName: markMessages("对白降噪"), version: "0.5.6", fileName, size, sha256,
    sources: githubSources("Rikorose/DeepFilterNet", "v0.5.6", fileName) });
} else {
  deepFilterAssets.push({ id: "deepFilterNet", name: "DeepFilterNet3", displayName: markMessages("对白降噪"), version: "0.5.6", fileName: "", size: 0, sha256: "", sources: [] });
}
