import type { Editor, JSONContent } from "@tiptap/core";
import { DOMSerializer } from "@tiptap/pm/model";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import TextAlign from "@tiptap/extension-text-align";
import FindAndReplace from "@tiptap/extension-find-and-replace";

const extensions = [
  StarterKit.configure({ link: { openOnClick: false } }),
  Markdown.configure({ markedOptions: { gfm: true } }),
  TaskList,
  TaskItem.configure({ nested: true }),
  TableKit,
  Image,
  Highlight,
  Superscript,
  Subscript,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  FindAndReplace,
];

function needsHtml(node: JSONContent): boolean {
  return !!((node.attrs?.textAlign && node.attrs.textAlign !== "left")
    || node.marks?.some(mark => ["underline", "highlight", "superscript", "subscript"].includes(mark.type))
    || node.content?.some(needsHtml));
}

export function serializeMarkdown(editor: Editor): string {
  const content = editor.getJSON().content || [];
  if (!content.some(needsHtml)) return editor.getMarkdown();
  const serializer = DOMSerializer.fromSchema(editor.schema);
  // ACT: 标准 Markdown 无法表达这些格式，整块转为 HTML，保留列表、表格及组合样式。
  return content.map(node => {
    if (!needsHtml(node)) return editor.markdown!.serialize({ type: "doc", content: [node] });
    const element = document.createElement("div");
    element.append(serializer.serializeNode(editor.schema.nodeFromJSON(node)));
    return element.innerHTML;
  }).join("\n\n");
}

export default extensions;
