import db from "@/utils/db";
import { t, getLocale } from "@/i18n";

const taskStateMap = {
  "0": "进行中", // i18n-ignore — frontend hardcodes this exact Chinese string as its task-state filter value (data/web/index.html), must stay Chinese
  "1": "已完成", // i18n-ignore — frontend hardcodes this exact Chinese string as its task-state filter value (data/web/index.html), must stay Chinese
  "-1": "生成失败", // i18n-ignore — frontend hardcodes this exact Chinese string as its task-state filter value (data/web/index.html), must stay Chinese
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
  } = {},
) {
  const locale = await getLocale();
  const { content, describe = "" } = opts;

  let opteorContent: string | undefined;
  if (content === undefined || content === null) {
    opteorContent = undefined;
  } else if (typeof content === "string") {
    opteorContent = content;
  } else if (typeof content === "function") {
    throw new Error(t("utils.taskRecord.unsupportedType", {}, locale));
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
    state: taskStateMap["0"],
    startTime: Date.now(),
  });

  /** 任务成功时调用 done(1)，失败时调用 done(-1, '原因') */
  return async function done(state: 1 | -1, reason?: string) {
    await db("o_tasks")
      .where("id", id)
      .update({
        state: taskStateMap[String(state) as "1" | "-1"],
        reason: state === -1 ? (reason ?? "") : null,
      });
  };
}
