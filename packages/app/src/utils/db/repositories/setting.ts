import { eq } from "drizzle-orm";
import { db } from "@/utils/db/index";
import { setting } from "@/utils/db/schema";

export type Setting = typeof setting.$inferSelect;
export type NewSetting = typeof setting.$inferInsert;

export default {
  findByKey(key: string): Setting | undefined {
    return db.select().from(setting).where(eq(setting.key, key)).get();
  },
  update(key: string, data: Partial<NewSetting>): Setting | undefined {
    return db.update(setting).set(data).where(eq(setting.key, key)).returning().get();
  },
  delete(key: string): boolean {
    const result = db.delete(setting).where(eq(setting.key, key)).run();
    return result.changes > 0;
  },
};
