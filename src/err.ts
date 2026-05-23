import { serializeError } from "serialize-error";

// 处理未捕获的 Promise 拒绝
process.on("unhandledRejection", (reason, promise) => {
  console.error("[未处理的 Promise 拒绝]");
  if (reason instanceof Error) {
    console.error("错误名称:", reason.name);
    console.error("错误消息:", reason.message);
    console.error("堆栈信息:", reason.stack);
    console.error("序列化详情:", JSON.stringify(serializeError(reason), null, 2));
  } else {
    console.error("原因:", reason);
    console.error("类型:", typeof reason);
    try {
      console.error("JSON:", JSON.stringify(reason, null, 2));
    } catch {
      console.error("(无法序列化)");
    }
  }
  console.error("Promise:", promise);
});

// 处理未捕获的异常
// Node.js 文档明确建议：uncaughtException 后应退出进程，
// 因为此时进程状态不可预测，继续运行可能导致数据损坏。
process.on("uncaughtException", (error) => {
  console.error("[未捕获的异常]");
  console.error("错误名称:", error.name);
  console.error("错误消息:", error.message);
  console.error("堆栈信息:", error.stack);
  console.error("序列化详情:", JSON.stringify(serializeError(error), null, 2));
  process.exit(1);
});
