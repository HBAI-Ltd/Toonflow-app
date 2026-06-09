import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const setting = sqliteTable("setting", {
  key: text().primaryKey().notNull(),
  value: text(),
});

export const users = sqliteTable("users", {
  id: integer().primaryKey({ autoIncrement: true }).notNull(),
  username: text().notNull(),
  password: text().notNull(),
});

export const projects = sqliteTable("projects", {
  id: integer().primaryKey(),
  name: text(),
  createTime: integer(),
  byUser: integer(),
  type: text(),
});

export const assets = sqliteTable("assets", {
  id: integer().primaryKey(),
  type: text(),
  name: text(),
  path: text(),
  byProjectId: text(),
  byScriptId: text(),
  otherJson: text(),
});

export const scripts = sqliteTable("scripts", {
  id: integer().primaryKey(),
  name: text(),
  data: text(),
  byProjectId: text(),
  scriptIndex: text(),
  otherJson: text(),
});

export const flows = sqliteTable("flows", {
  id: integer().primaryKey(),
  position: text(),
  viewport: text(),
  byProjectId: text(),
  type: text(),
  otherJson: text(),
});

export const novels = sqliteTable("novels", {
  id: integer().primaryKey(),
  title: text(),
  group: text(),
  index: text(),
  data: text(),
  event: text(),
  byProjectId: text(),
  otherJson: text(),
});
