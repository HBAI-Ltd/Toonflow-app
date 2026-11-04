import { z } from "zod";
import { openDatabase } from "@toonflow/multi-tenant-db";
import type { AdminDatabase } from "@toonflow/multi-tenant-db";
import { getDefaultSourceMapping, sourceMappingRevisionSchema, sourceMappingSchema } from "./config";
import type { SourceMapping, SourceMappingSnapshot } from "./config";

export { getDefaultSourceMapping, sourceMappingRevisionSchema, sourceMappingSchema } from "./config";
export type { SourceMapping, SourceMappingSnapshot } from "./config";

const storedSourceMappingSchema = z.object({
  mappings: sourceMappingSchema,
  revision: z.number().int().min(1).max(2147483647),
});

export function createSourceMapping(dataDirectory: string) {
  let database: Promise<AdminDatabase | undefined> | undefined;
  async function getDatabase() {
    if (database) return database;
    const opening = openDatabase(dataDirectory, false);
    database = opening;
    try {
      const current = await opening;
      if (!current && database === opening) database = undefined;
      return current;
    } catch (error) {
      if (database === opening) database = undefined;
      throw error;
    }
  }
  return {
    async read(): Promise<SourceMappingSnapshot> {
      const db = await getDatabase();
      const record = await db?.getSourceMapping();
      if (!record) return { mappings: getDefaultSourceMapping(), revision: 0, applied: false };
      const parsed = storedSourceMappingSchema.safeParse(record);
      if (!parsed.success) throw Object.assign(new Error("数据源映射配置无效，请检查数据库记录"), { status: 503 });
      return { ...parsed.data, applied: false };
    },
    async save(mappings: SourceMapping, expectedRevision: number): Promise<SourceMappingSnapshot> {
      const values = sourceMappingSchema.parse(mappings);
      const revision = sourceMappingRevisionSchema.parse(expectedRevision);
      const db = await getDatabase();
      if (!db || !await db.getAdmin()) throw Object.assign(new Error("请先设置超级管理员账号"), { status: 409 });
      await db.initializeSourceMapping();
      if (!await db.writeSourceMapping(values, revision)) {
        throw Object.assign(new Error("数据源映射已被更新，请重新加载后再保存"), { status: 409 });
      }
      return { mappings: values, revision: revision + 1, applied: false };
    },
  };
}
