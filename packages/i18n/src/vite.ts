import type { Plugin } from "vite";
import { isUiSource, transformSource } from "./transform.ts";

export function i18nPlugin(): Plugin {
  return {
    name: "toonflowI18n",
    enforce: "pre",
    transform(source, id) {
      const path = id.replaceAll("\\", "/");
      if (!isUiSource(path)) return;
      return transformSource(source, path);
    },
  };
}
