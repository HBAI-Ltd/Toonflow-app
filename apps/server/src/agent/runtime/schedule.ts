import { z } from "zod";
import { thinkingLevels } from "@/lib/modelReasoning";
import type { AgentSchedule } from "@/agent/runtime/types";

const timestamp = z.int().min(0).max(253402300799999);
const sessionFile = z.string().regex(/^[\w-]+\.jsonl$/);
export const timeZoneSchema = z.string().min(1).max(128).refine(value => {
  try { Intl.DateTimeFormat("en", { timeZone: value }); return true; }
  catch { return false; }
});
const wallTime = { time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/), timeZone: timeZoneSchema };
export const scheduleSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("once"), at: timestamp }),
  z.strictObject({ kind: z.literal("interval"), everySeconds: z.int().min(300).max(2147483647) }),
  z.strictObject({ kind: z.literal("daily"), ...wallTime }),
  z.strictObject({ kind: z.literal("weekly"), ...wallTime, weekdays: z.array(z.int().min(1).max(7)).min(1).max(7) }),
]);
const task = z.strictObject({
  name: z.string().trim().min(1).max(120), prompt: z.string().trim().min(1).max(8000),
  schedule: scheduleSchema, sessionFile: sessionFile.optional(),
  providerId: z.string().min(1).max(256), modelId: z.string().min(1).max(256), thinkingLevel: z.enum(thinkingLevels).optional(),
});
const reference = { id: z.uuid(), revision: z.int().positive() };
export const automationSchema = task.extend({
  ...reference, enabled: z.boolean(), createdAt: timestamp, nextRunAt: timestamp.nullable(), cancelledAt: timestamp.optional(),
  runs: z.array(z.strictObject({
    id: z.uuid(), startedAt: timestamp, finishedAt: timestamp.optional(), sessionFile: sessionFile.optional(),
    status: z.enum(["running", "completed", "failed", "interrupted", "cancelled"]), error: z.string().optional(),
  })),
});
export const automationCommandSchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("save"), id: reference.id.optional(), revision: reference.revision.optional(), task })
    .refine(value => Boolean(value.id) === Boolean(value.revision)),
  z.strictObject({ action: z.literal("run"), ...reference, retryRunId: z.uuid().optional() }),
  z.strictObject({ action: z.enum(["pause", "resume", "cancel", "delete"]), ...reference }),
]);

export function nextScheduleAt(schedule: AgentSchedule, after: number, anchor: number): number | null {
  if (schedule.kind === "once") return schedule.at > after ? schedule.at : null;
  if (schedule.kind === "interval") {
    const interval = schedule.everySeconds * 1000;
    return anchor + Math.max(1, Math.floor((after - anchor) / interval) + 1) * interval;
  }
  const clock = new Intl.DateTimeFormat("en-GB", { timeZone: schedule.timeZone, hourCycle: "h23",
    year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" });
  function localStamp(at: number) {
    const parts = Object.fromEntries(clock.formatToParts(at).map(part => [part.type, Number(part.value)]));
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  }
  const day = 86400000;
  const [hours, minutes] = schedule.time.split(":").map(Number);
  const today = Math.floor(localStamp(after) / day) * day;
  for (let date = today; ; date += day) {
    if (schedule.kind === "weekly" && !schedule.weekdays.includes(new Date(date).getUTCDay() || 7)) continue;
    const wall = date + (hours * 60 + minutes) * 60000;
    // 前后两天的 UTC 偏移涵盖夏令时切换。回拨取第一次，跳过不存在的墙上时间。
    const offsets = [wall - day, wall + day].map(probe => localStamp(probe) - probe);
    const instants = offsets.map(offset => wall - offset).filter(at => localStamp(at) === wall);
    const next = Math.min(...instants);
    if (Number.isFinite(next) && next > after) return next;
  }
}
