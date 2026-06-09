import "@/env";
import u from "@/utils";
import { md5 } from "js-md5";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "@/utils/db/index";
import { users, setting } from "@/utils/db/schema";

async function seed() {
  console.log("🔄 执行迁移...");

  // 自动执行迁移，确保表存在
  migrate(db, { migrationsFolder: "./src/utils/db/migrations" });

  console.log("🌱 开始填充数据...");

  const salt = u.uuid().slice(0, 8);

  db.insert(users)
    .values([{ username: "admin", password: md5("admin123" + salt) }])
    .returning()
    .all();

  db.insert(setting)
    .values([{ key: "tokenKey", value: salt }])
    .returning()
    .all();

  console.log("✅ 数据填充完成");
}

seed();
