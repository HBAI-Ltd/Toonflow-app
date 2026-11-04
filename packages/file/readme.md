# 文件基础能力

`@toonflow/file` 是 Node/Bun 共用的文件操作入口，只管理原子提交和进程内文件队列。全局文件由所属模块决定路径；工作区文件仍先经过 server 的 `resolveWorkspacePath`、业务锁和接口权限校验。模块保留安装事务、回滚、数据格式及错误提示。

```ts
import { readFile, writeAtomic } from "@toonflow/file";

await writeAtomic(absolutePath, JSON.stringify(snapshot));
const content = await readFile(absolutePath, "utf8");
```

- `writeAtomic` / `writeAtomicSync`：同目录短随机临时文件、`wx` 创建、完整写入后重命名；`exclusive: true` 在 Windows Bun 和移动端使用系统独占重命名，其他环境用硬链接提交，目标文件已存在时报 `EEXIST`，不覆盖已有文件、目录或符号链接。默认权限 `0o600`，不自动创建父目录，不合并快照，不保证断电持久性。
- 普通 `writeFile`、`appendFile`、`copyFile` 保留标准库语义并参与队列。需要完整覆盖的业务快照显式选择原子接口；追加、开发热更新复制和安装 staging 不改成另一种操作。
- `async-mutex` 负责 FIFO 队列：同文件最多 64 个并发读，写入独占，不同文件并行。Windows 路径忽略大小写；多路径按固定顺序获取，避免互相等待。调用模块负责 realpath、链接和目录层级的事务边界。
- 读写流、`open` 返回的句柄、`opendir` 返回的目录持有访问许可直到关闭；调用方必须结束、取消或关闭它们。排队最多等待 30 秒，支持 `withFileAccess` 的 AbortSignal；同步调用碰到本进程未结束的冲突操作立即报 `EBUSY`。
- 路径读写流支持 AbortSignal 和 `destroy()`，等待许可时取消不会在稍后打开或截断文件；底层关闭失败且句柄仍可能有效时保留许可。不接受外部 `fd` 或自定义 `fs` 绕过队列，已有文件句柄使用 `open` 返回对象的流方法。第三方 Semaphore 的已取消等待项会排到原位置后释放许可，不会执行业务操作，期间仍保留原有先后顺序。
- `rename` 和原子提交使用 `stubborn-fs` 有限重试，最多约 5 秒；持续占用仍抛出原始错误。不要重试整个多步安装事务，也不要重试已经消费的输入流。原子写入只清理本次创建的临时文件，关闭或清理失败不能掩盖原始写入错误；提交成功后的临时文件清理失败仅记录警告，不将已保存内容报告为失败。
- `withFileAccess(paths, kind, action, signal?)` 供 HTTP/SDK 等模块适配原生 I/O；回调必须等操作真正完成。它不是可重入锁，不在相同路径的回调里再次调用本包的受管 I/O；需要组合操作时由业务模块决定事务范围。

Bun 文件方法从 `@toonflow/file/bun` 导入 `file`、`write`。返回值保持真实 Blob 身份，`text/json/arrayBuffer/bytes/formData/stream/write/delete/unlink` 接入队列；字符串、URL 和字节路径共用同一文件队列。`file` 不接受外部 fd；同步 `FileSink.writer` 不暴露，流式写入使用 `createWriteStream`。把 Blob 交给 `Response` 等原生消费者后，消费生命周期由调用模块负责；需要与修改协调时在模块中使用 `withFileAccess`。

`write` 和 `file(...).write` 只接受非流数据；`Response`、`Request`、`ReadableStream` 使用标准 `pipeline` 配合 `createWriteStream`，并向流和 `pipeline` 同时传入取消信号。Bun 1.3.14 的部分异常输入流会使原生 `Bun.write` 永不结束，本包直接拒绝这些输入，避免占住文件队列。

本包不接管第三方库内部文件系统、外部进程、C#/NSIS 或操作系统的文件锁；SDK 持久化、配置、HTTP、FFmpeg 和安装器保持各自模块边界。不在这里引入业务 SDK，也不全局修改 `node:fs`。
