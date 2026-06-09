import { eq } from "drizzle-orm";
import { db } from "@/utils/db/index";
import { users } from "@/utils/db/schema";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export default {
  findByUsername(username: string): User | undefined {
    return db.select().from(users).where(eq(users.username, username)).get();
  },
  update(id: number, data: Partial<NewUser>): User | undefined {
    return db.update(users).set(data).where(eq(users.id, id)).returning().get();
  },
  delete(id: number): boolean {
    const result = db.delete(users).where(eq(users.id, id)).run();
    return result.changes > 0;
  },
};
