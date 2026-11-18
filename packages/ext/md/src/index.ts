import { defineExt, type ExtContext } from "@toonflow/ext-scaffold/runtime";
import metadata from "./metadata";

export interface MarkdownEditorContext extends Pick<ExtContext, "text" | "loading" | "active" | "updateText" | "writeClipboardText" | "openFile" | "location"> {
  resource: Pick<ExtContext["resource"], "path">;
  files?: ExtContext["files"];
}

export default defineExt({ ...metadata, load: () => import("./index.vue") });
