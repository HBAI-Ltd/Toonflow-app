# 插件服务

`@toonflow/plugin-server` 是 Node、Ext 共用的 HTTP／WebSocket 服务基础能力。插件注册处理函数，宿主负责实际网络入口、身份授权、服务命名空间与统一消息分发。这个包不依赖 VueFlow，也不执行服务端插件源码。

Node 从 `useNode().server` 使用；Ext 从宿主提供的上下文 `server` 使用。插件专属交互、页面生成、请求参数校验和业务协议仍在所属插件中，不需要声明页面清单或静态文件。

```ts
server.get("/", () => server.html("<html><body>插件页面</body></html>"));
server.get("/state", () => ({ ready: true }));
server.post("/echo", async ({ request }) => await request.json());
server.ws("/events", socket => {
  socket.onMessage(data => socket.send(data));
});

const url = await server.start();
```

获取能力与注册路由都不联网。`start()` 注册服务并返回访问地址，重复启动复用正在启动或已经运行的服务；`stop()` 撤销服务，已注册路由保留，之后可以重新启动。每次重新启动取得新的服务身份与地址。`dispose()` 供宿主生命周期释放，不允许再次启动。

## HTTP

提供 `get/post/put/patch/delete/head/options`，也可以调用 `route(method, path, handler)`。路径以 `/` 开头、相对当前服务根目录；不同实例的相同路径互不冲突。支持 `:name` 路径参数与末尾 `*`，通配结果在 `params.wildcard`。同一方法下等价路径重复注册会报错，启动后不可修改路由。

处理函数取得 `{ request, params, query, signal }`：

- `request` 是重建的标准 `Request`，正文通过 `json/text/arrayBuffer/formData` 等方法读取。
- `params` 是路径参数，`query` 是 `URLSearchParams`。
- `signal` 随客户端取消、请求超时、服务关闭而取消。异步业务仍需配合信号停止自身副作用。
- 普通对象、数组与 `null` 返回 JSON，字符串返回纯文本，`undefined` 返回 `204`。
- `server.html(content, status?)` 返回 HTML；返回 `Response` 可指定状态、响应头和内容，传输层仍过滤不允许的响应头。
- `ArrayBuffer`、TypedArray、`Blob` 可以作为二进制响应；需要 MIME 类型时使用 `Blob.type` 或 `Response`。

普通 HTTP 回调异常返回 `500`，并更新 `server.error`。Node／Ext 中注册的回调在各自现有的前端实例中执行，服务端转发请求，不会将捕获 Vue 状态的闭包搬到后端。关闭该实例后其服务也会结束。

## WebSocket

`ws(path, handler)` 的处理函数在新连接到达时取得桥接句柄：`id/request/params/query/signal/send/onMessage/onClose/close`。它不是原生 `WebSocket`；`onMessage`、`onClose` 返回取消订阅函数。

`send()` 接收可序列化 JSON、文本、`ArrayBuffer` 或 TypedArray。对象编码为 JSON；收到的文本是合法 JSON 时自动解析，否则按字符串交付，二进制交付为 `ArrayBuffer`。因此原始文本 `123` 会解析为数字；需要保证字符串语义时发送 JSON 字符串或具有明确字段的对象。`send()` 仅表示消息进入传输，不代表对端业务已执行。

每个连接按接收顺序调用消息处理器，异步处理器会被等待；处理失败时记录错误并关闭该连接。客户端断开、服务停止时触发关闭通知并取消连接信号。不会积压重放离线业务消息，也不会在授权失效后自动重新注册服务。

## 客户端

外部页面可以使用纯浏览器子路径，不需要加载 Node、Ext 或 Vue：

```ts
import { createServerClient } from "@toonflow/plugin-server/client";

const client = createServerClient(serviceUrl);
const state = await client.get("/state");
await client.post("/echo", { value: 1 });
const socket = await client.ws("/events");
socket.onMessage(data => console.log(data));
socket.send({ value: 1 });
```

`serviceUrl` 必须是宿主返回的完整服务根地址。客户端保留完整服务前缀，拒绝跨服务路径，HTTP 不携带主应用 Cookie，也不自动跟随重定向。`getUrl(path)` 可生成该范围内的地址；`request(path, RequestInit)` 返回原生 `Response`，其他 HTTP 方法按 Content-Type 解析结果，非成功 HTTP 状态会抛出带 `status/data` 的错误。

`client.ws()` 在连接打开后返回句柄，提供 `send/onMessage/onClose/onError/close/state`；关闭码遵循浏览器限制。`client.dispose()` 取消当前 HTTP 请求、关闭客户端连接，不会撤销其他访问者的服务。

## 宿主接入与边界

`createPluginServer(transport, { signal? })` 只需要统一传输的 `send/subscribe`。身份与具体节点／编辑器实例绑定由宿主捕获，插件不通过消息自报用户或租户。状态通过只读 `url/status/error` 和 `subscribe` 暴露；Vue 适配位于独立 `./vue` 子路径，供宿主注入工厂与自动释放。

`./protocol` 提供统一 wire 类型、路径处理、Base64 和消息编解码。HTTP 使用 `requestId`，WS 使用 `socketId`，两者同时绑定 `serviceId`；取消启动会发送 `cancelRegister`，晚到的注册结果也会立即注销，不能留下孤儿服务。

ACT：当前桥按完整消息传输，HTTP 正文／响应上限 8 MB、请求等待 30 秒；WS 单消息上限 1 MB、每连接积压上限 4 MB；每服务最多 128 条路由与 64 个 WS 连接，每个宿主最多 32 个服务。流式 HTTP 与大文件传输不在此协议内，可继续使用已有文件能力；未来支持流时需要显式加入分块、背压和取消协议，不能仅放大缓冲上限。

## 服务端部署

创作宿主通过一条 SSE 事件连接和 POST 消息接口复用现有后端连接。外部 HTTP／WS 由同一 Bun 进程中的插件网关接收，只转发到已注册的 Node／Ext 实例，不开放主应用 API。Tool 不提供这项能力。

默认在首次注册时监听 `0.0.0.0` 的动态端口，返回后端地址；本机创作时优先选用局域网 IPv4 地址。手机需能访问该地址及端口，多网卡或公网环境应显式配置：

| 环境变量 | 含义 |
| --- | --- |
| `TOONFLOW_PLUGIN_SERVER_PORT` | 网关监听端口，默认 `0`，由系统分配；反向代理部署应设置固定端口。 |
| `TOONFLOW_PLUGIN_SERVER_URL` | 外部可访问的 HTTP／HTTPS 根地址，不带路径、查询或凭据。反向代理需同时支持 HTTP 和 WebSocket upgrade。 |

例如固定监听 `10900`，将 `https://plugins.example.com` 反向代理至该端口，再将其设为 `TOONFLOW_PLUGIN_SERVER_URL`。HTTPS 创作入口必须配置此地址，避免返回无法使用的明文服务入口。主应用的代理应保留 SSE 长连接并关闭事件流缓冲。

返回地址包含本次服务的随机访问凭据，持有完整地址的客户端即可访问该服务，应只向预期访问者分享。每次启动生成新地址；关闭实例、断开宿主、注销或撤销授权后服务失效，WS 授权状态通过最长 15 秒的心跳复核。临时服务不写入数据库或工作区，不支持跨进程恢复。

插件页面使用 CSP sandbox 隔离，不获得主应用 Cookie、同源身份或 Service Worker 能力；网关过滤 Cookie、Authorization 及代理相关头，不支持基于这些头的插件认证。需要附加业务认证时可在插件请求正文或自定义头中处理。页面脚本调用自身 API 时使用完整服务地址或相对当前页面的路径；`/state` 这样的浏览器绝对路径指向网关根目录，推荐由 `createServerClient` 统一生成地址。

网关每服务最多同时处理 16 个 HTTP 请求、每宿主 32 个，上传阶段也计入限额；超时、断线及缓冲耗尽会取消请求或关闭连接，业务层按需要显式重试，不自动重放操作。
