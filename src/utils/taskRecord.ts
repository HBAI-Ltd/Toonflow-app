import db from "@/utils/db";
import { t, getLocale, type Locale } from "@/i18n";

function getTaskStateMap(locale: Locale) {
  return {
    "0": t("taskState.inProgress", {}, locale),
    "1": t("taskState.completed", {}, locale),
    "-1": t("taskState.failed", {}, locale),
  };
}
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
  const taskStateMap = getTaskStateMap(locale);
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
