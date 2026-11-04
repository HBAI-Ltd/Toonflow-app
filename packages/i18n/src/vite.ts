import type { Plugin } from "vite";
import { transformSource } from "./transform.ts";

export function i18nPlugin(): Plugin {
  return {
    name: "toonflowI18n",
    enforce: "pre",
    transform(source, id) {
      const path = id.replaceAll("\\", "/");
      if (!/\/(?:apps\/web\/src|packages\/providerWeb)\//.test(path)) return;
      return transformSource(source, path);
    },
  };
}
