import { Knex } from "knex";

export default async (knex: Knex): Promise<void> => {
  const videoHasTime = await knex.schema.hasColumn("t_video", "time");
  if (!videoHasTime) {
    await knex.schema.alterTable("t_video", (table) => {
      table.integer("time");
    });
  }

  // 将旧的 index 列（SQLite 保留字）迁移为 sortIndex
  const configHasSortIndex = await knex.schema.hasColumn("t_config", "sortIndex");
  if (!configHasSortIndex) {
    await knex.schema.alterTable("t_config", (table) => {
      table.integer("sortIndex");
    });
  }
};
