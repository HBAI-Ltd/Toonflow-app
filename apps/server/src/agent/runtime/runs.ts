type AgentRun = { cwd: string; abort: () => void; finished: Promise<void> };

// ACT: 每轮 HTTP 请求独立持有取消通道；迟到的停止请求不能取消同一会话的下一轮。
const agentRuns = new Map<string, AgentRun>();

export function registerAgentRun(cwd: string, abort: () => void) {
  const id = crypto.randomUUID();
  const finished = Promise.withResolvers<void>();
  agentRuns.set(id, { cwd, abort, finished: finished.promise });
  return {
    id,
    finish() {
      agentRuns.delete(id);
      finished.resolve();
    },
  };
}

export async function stopAgentRun(cwd: string, id: string) {
  const run = agentRuns.get(id);
  if (!run) return;
  if (run.cwd !== cwd) throw Object.assign(new Error("对话不属于当前工作区"), { status: 403 });
  run.abort();
  // 等待 run 的 finally 完成，不能提前释放会话文件锁或向客户端确认停止。
  await run.finished;
}
