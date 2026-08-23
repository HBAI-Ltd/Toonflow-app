import { serializeError } from "serialize-error";

// 处理未捕获的 Promise 拒绝
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Unhandled Promise Rejection]");
  if (reason instanceof Error) {
    console.error("Error name:", reason.name);
    console.error("Error message:", reason.message);
    console.error("Stack:", reason.stack);
    console.error("Serialized details:", JSON.stringify(serializeError(reason), null, 2));
  } else {
    console.error("Reason:", reason);
    console.error("Type:", typeof reason);
    try {
      console.error("JSON:", JSON.stringify(reason, null, 2));
    } catch {
      console.error("(unable to serialize)");
    }
  }
  console.error("Promise:", promise);
});

// 处理未捕获的异常
process.on("uncaughtException", (error) => {
  console.error("[Uncaught Exception]");
  console.error("Error name:", error.name);
  console.error("Error message:", error.message);
  console.error("Stack:", error.stack);
  console.error("Serialized details:", JSON.stringify(serializeError(error), null, 2));
});
