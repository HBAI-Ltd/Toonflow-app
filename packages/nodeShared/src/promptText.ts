import type { AnyTagProps } from "x-sender";
import type { ReferenceMention } from "./useNodeReferences";

export function referenceHtml(reference: ReferenceMention) {
  const tag = document.createElement("span");
  tag.className = "imageReference";
  tag.dataset.referenceId = reference.id;
  tag.dataset.value = reference.value;
  if (reference.avatar) {
    if (reference.previewable !== false) tag.classList.add("previewable");
    const image = document.createElement("img");
    image.src = String(reference.avatar);
    image.alt = "";
    image.draggable = false;
    tag.append(image);
  }
  tag.append(document.createTextNode(reference.label || reference.name));
  return tag.outerHTML;
}

export function normalizePromptModel(value: AnyTagProps[][], references: ReferenceMention[], keepMissingReferences = false): AnyTagProps[][] {
  if (!value.length) return [[{ type: "Write", text: "" }]];
  return value.map(line => {
    const tags = line.flatMap((tag): AnyTagProps[] => {
      if (tag.type === "Write") return tag.text.split(/(\{\{ref \d+\}\})/g).map(text => {
        const reference = references.find(item => item.value === text);
        return reference
          ? { type: "Custom", html: `<span style="display: inline-block;">${referenceHtml(reference)}</span>` }
          : { type: "Write", text };
      });
      if (tag.type !== "Custom") return [tag];
      const template = document.createElement("template");
      template.innerHTML = tag.html;
      const id = template.content.querySelector<HTMLElement>(".imageReference[data-reference-id]")?.dataset.referenceId;
      if (!id) return [tag];
      const reference = references.find(item => item.id === id);
      if (!reference) return keepMissingReferences ? [tag] : [];
      return [{ type: "Custom", html: `<span style="display: inline-block;">${referenceHtml(reference)}</span>` }];
    });
    const next: AnyTagProps[] = [{ type: "Write", text: "" }];
    for (const tag of tags) {
      const previous = next[next.length - 1];
      if (tag.type === "Write" && previous.type === "Write") previous.text += tag.text;
      else {
        if (tag.type !== "Write" && previous.type !== "Write") next.push({ type: "Write", text: "" });
        next.push(tag);
      }
    }
    if (next[next.length - 1].type !== "Write") next.push({ type: "Write", text: "" });
    return next;
  });
}

export function getPromptText(value: AnyTagProps[][], resolveReference?: (id: string) => string) {
  return value.map(line => line.map(tag => {
    if (tag.type === "Write") return tag.text;
    if (tag.type === "Input") return tag.text || tag.placeholder;
    if (tag.type !== "Custom") {
      const prefix = tag.type === "Mention" ? "@" : tag.type === "Trigger" ? tag.key : "";
      return prefix + tag.name;
    }
    const content = document.createElement("template");
    content.innerHTML = tag.html;
    for (const reference of content.content.querySelectorAll<HTMLElement>(".imageReference[data-value]")) {
      const id = reference.dataset.referenceId;
      reference.replaceWith(id && resolveReference ? resolveReference(id) : reference.dataset.value ?? "");
    }
    return content.content.textContent ?? "";
  }).join("")).join("\n");
}
