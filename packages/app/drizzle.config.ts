import "./src/env"
import { defineConfig } from 'drizzle-kit'
import getPath from "./src/utils/getPath";

export default defineConfig({
  schema: "./src/utils/db/schema.ts",
  out: "./src/utils/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: getPath("data", "sqlite.db"),
  },
})
