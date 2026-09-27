import { createDisplayError, createTranslator, getErrorDisplay } from "@toonflow/i18n";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

export const t = createTranslator({ zh, en });
export { createDisplayError, getErrorDisplay };
