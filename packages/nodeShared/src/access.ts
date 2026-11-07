import { ref, type Ref } from "vue";

const accessKey = Symbol.for("toonflow.access");
const host = globalThis as typeof globalThis & {
  [accessKey]?: { request?: () => Promise<boolean>; revision: Ref<number> };
};

// 节点和扩展分别打包，共用宿主的登录回调与认证状态。
export const accessState = host[accessKey] ??= { revision: ref(0) };

export async function fetchWithAccess(input: string | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (response.status !== 401 || response.headers.get("x-toonflow-access") !== "required") return response;
  const url = new URL(input, window.location.href);
  if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/")) return response;
  init?.signal?.throwIfAborted();
  const authenticated = await accessState.request?.();
  init?.signal?.throwIfAborted();
  return authenticated ? fetch(input, init) : response;
}
