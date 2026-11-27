import type { ResolveModelRunner } from "@/types/localModels";

// 与宿主数据目录一样，部署适配器按服务进程设置，后台任务与 HTTP 请求共用。
let resolveDeploymentRunner: ResolveModelRunner | undefined;

export function configureModelRunners(resolve?: ResolveModelRunner) {
  resolveDeploymentRunner = resolve;
}

export function getDeploymentModelRunner({ id, version, fileName, sha256 }: Parameters<ResolveModelRunner>[0]) {
  if (id === "onnxRuntime" || id === "directMl" || id === "whisperRuntime") return;
  return resolveDeploymentRunner?.({ id, version, fileName, sha256 });
}
