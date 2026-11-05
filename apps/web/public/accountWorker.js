// ACT: 不缓存凭据或响应；每次向发起请求的页面取得其内存令牌，支持图片、视频 Range 与 SSE。
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith("/api/") || url.pathname.startsWith("/api/auth/")) return;
  event.respondWith((async () => {
    const client = await self.clients.get(event.clientId);
    if (!client) return new Response(null, { status: 401 });
    const token = await new Promise(resolve => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => { channel.port1.close(); resolve(""); }, 15000);
      channel.port1.onmessage = message => {
        clearTimeout(timer);
        channel.port1.close();
        resolve(typeof message.data?.token === "string" ? message.data.token : "");
      };
      client.postMessage({ type: "accountToken" }, [channel.port2]);
    });
    if (!token) return new Response(null, { status: 401 });
    const headers = new Headers(event.request.headers);
    headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(new Request(event.request, { headers, mode: "same-origin", redirect: "error", cache: "no-store" }));
    if (response.status === 401) client.postMessage({ type: "accountUnauthorized" });
    return response;
  })());
});
