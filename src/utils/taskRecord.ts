import db from "@/utils/db";

export type TaskDone = ((state: 1 | -1, reason?: string) => Promise<void>) & { id: number };

const taskStateMap = {
  "0": "进行中",
  "1": "已完成",
  "-1": "生成失败",
};
/**
 * 记录任务并返回结束函数
 * @param projectId  项目 ID
 * @param taskClass  任务分类
 * @param modelName   模型名称
 * @param opts       可选项：关联对象、任务描
 */
export default async function taskRecord(
  projectId: number,
  taskClass: string,
  modelName: string,
  opts: {
    describe?: string;
    content?: any;
    promptHash?: string;
    promptVersionId?: number | null;
    promptSource?: string;
  } = {},
) {
  const { content, describe = "", promptHash, promptVersionId, promptSource } = opts;

  let opteorContent: string | undefined;
  if (content === undefined || content === null) {
    opteorContent = undefined;
  } else if (typeof content === "string") {
    opteorContent = content;
  } else if (typeof content === "function") {
    throw new Error("不支持的类型");
  } else {
    try {
      opteorContent = JSON.stringify(content);
    } catch (e) {
      opteorContent = content.toString();
    }
  }

  const [id] = await db("o_tasks").insert({
    projectId,
    taskClass,
    relatedObjects: opteorContent,
    model: modelName,
    describe,
    state: taskStateMap[0],
    startTime: Date.now(),
    promptHash,
    promptVersionId,
    promptSource,
  });

  /** 任务成功时调用 done(1)，失败时调用 done(-1, '原因') */
  const done = (async function done(state: 1 | -1, reason?: string) {
    await db("o_tasks")
      .where("id", id)
      .update({
        state: taskStateMap[state],
        reason: state === -1 ? (reason ?? "") : null,
      });
  }) as TaskDone;
  done.id = Number(id);
  return done;
}
