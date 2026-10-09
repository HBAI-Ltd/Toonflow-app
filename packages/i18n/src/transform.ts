import { parse as parseScript, parseExpression } from "@babel/parser";
import type { Node, Expression, ObjectExpression, ObjectProperty } from "@babel/types";
import { baseParse, NodeTypes, type TemplateChildNode } from "@vue/compiler-dom";
import { parse as parseSfc } from "@vue/compiler-sfc";
import MagicString from "magic-string";
import { escapeMessageText } from "./messageText.ts";

const displayAttributes = new Set([
  "title", "label", "placeholder", "aria-label", "alt", "description", "content", "header", "message", "tip",
  "empty-text", "no-data-text", "loading-text", "error", "confirm-button-text", "cancel-button-text", "reset-button-text",
  "submit-button-text", "inline-prompt", "active-text", "inactive-text", "text", "help", "tooltip", "element-loading-text", "marks",
]);
const isDisplayAttribute = (name: string) => displayAttributes.has(name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`));
const displayProperties = new Set([
  "label", "title", "description", "groupLabel", "text", "tooltip", "placeholder", "emptyText", "noDataText", "loadingText",
  "confirmButtonText", "cancelButtonText", "resetButtonText", "submitButtonText", "activeText", "inactiveText", "message", "inputErrorMessage", "tip", "aria-label",
]);
const displayName = /^(?:labels?|titles?|descriptions?|menus?|tabs?|options?|columns?|steps?|sections?|modes?|types?|colors?|levels?|rules?|fields?|buttons?|handles?|features?|shortcuts?|categories|category|groups?|actions?|formats?|sorts?|contacts?|corners?|toolbar)$/i;
const excludedName = /(?:prompt|instruction|rawCode|sourceCode|systemMessage)/i;
const hasChinese = (value: string) => /[\u3400-\u9fff]/.test(value);
const quote = (value: string) => JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("{", "\\u007b").replaceAll("}", "\\u007d");
const attributeExpression = (value: string) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

function propertyName(node: ObjectProperty | Node): string | undefined {
  if (!("key" in node) || !("computed" in node) || node.computed) return;
  if (node.key.type === "Identifier") return node.key.name;
  if (node.key.type === "StringLiteral") return node.key.value;
}

function getBindingName(ancestors: Node[]): string {
  for (const node of ancestors.toReversed()) {
    if (node.type === "VariableDeclarator" && node.id.type === "Identifier") return node.id.name;
  }
  return "";
}

function isDisplayProperty(node: ObjectProperty, parent: ObjectExpression, ancestors: Node[]): boolean {
  const name = propertyName(node);
  if (!name || node.shorthand || node.computed) return false;
  const bindingName = getBindingName(ancestors);
  if (excludedName.test(bindingName)) return false;
  if (/^(?:data|payload|body|record|form|draft|project|document|node|message|messages)$/.test(bindingName) || /(?:Data|Payload|Body|Record|Form|Draft|Project|Document|Node|Message)$/.test(bindingName)) return false;
  if (ancestors.some((ancestor) => ancestor.type === "ObjectProperty" && /^(?:data|outputs|inputs|inputValue|payload|body)$/.test(propertyName(ancestor) ?? ""))) return false;
  if (/(?:labels|titles|descriptions|tooltips)$/i.test(bindingName)) return true;
  if (!displayProperties.has(name)) return false;
  if (/ButtonText$|^(?:groupLabel|placeholder|emptyText|loadingText|activeText|inactiveText|tooltip|inputErrorMessage|aria-label)$/.test(name)) return true;
  const siblings = parent.properties.flatMap((property) => property.type === "ObjectProperty" ? [propertyName(property)] : []);
  if (name === "message") return siblings.some((key) => key === "trigger" || key === "required" || key === "validator");
  return bindingName.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ").some((part) => displayName.test(part))
    || siblings.some((key) => ["icon", "component", "onClick", "dataKey"].includes(key ?? ""));
}

function analyze(source: string, id: string) {
  const output = new MagicString(source);
  const messages = new Set<string>();
  const replacements: [number, number][] = [];
  let translateName = "toonflowTranslate";
  while (new RegExp(`\\b${translateName}\\b`).test(source)) translateName += "Text";
  const replace = (start: number, end: number, value: string) => {
    if (replacements.some(([left, right]) => start < right && end > left)) return;
    output.overwrite(start, end, value);
    replacements.push([start, end]);
  };
  const translate = (message: string, values: string[] = []) => {
    messages.add(message);
    const parameters = values.length ? `, { ${values.map((value, index) => `${index}: (${value})`).join(", ")} }` : "";
    return `${translateName}(${quote(message)}${parameters})`;
  };
  const sliceNode = (node: Node, code: string) => code.slice(node.start ?? 0, node.end ?? 0);

  // ACT: Only display expressions are visited. Comparisons, keys, calls and user data retain their original semantics.
  function displayExpression(node: Node, code: string): string {
    const original = sliceNode(node, code);
    if (node.type === "StringLiteral") return hasChinese(node.value) ? translate(node.value) : original;
    if (node.type === "TemplateLiteral") {
      const template = node.quasis.map((part, index) => `${node.expressions.length ? escapeMessageText(part.value.cooked ?? part.value.raw) : part.value.cooked ?? part.value.raw}${index < node.expressions.length ? `{${index}}` : ""}`).join("");
      if (hasChinese(template)) return translate(template, node.expressions.map((expression) => displayExpression(expression, code)));
    }
    if (node.type === "BinaryExpression" && node.operator === "+") {
      const isString = (part: Node): boolean => part.type === "StringLiteral" || part.type === "TemplateLiteral" || part.type === "BinaryExpression" && part.operator === "+" && (isString(part.left) || isString(part.right));
      const collectParts = (part: Node): Node[] => part.type === "BinaryExpression" && part.operator === "+" && isString(part) ? [...collectParts(part.left), ...collectParts(part.right)] : [part];
      const parts = collectParts(node);
      if (parts.some((part) => part.type === "StringLiteral" && hasChinese(part.value))) {
        const values: string[] = [];
        const dynamic = parts.some((part) => part.type !== "StringLiteral");
        const message = parts.map((part) => {
          if (part.type === "StringLiteral") return dynamic ? escapeMessageText(part.value) : part.value;
          values.push(displayExpression(part, code));
          return `{${values.length - 1}}`;
        }).join("");
        return translate(message, values);
      }
    }
    const parts: Node[] = [];
    if (node.type === "TemplateLiteral") parts.push(...node.expressions);
    if (node.type === "ConditionalExpression") parts.push(node.consequent, node.alternate);
    if (node.type === "LogicalExpression") parts.push(node.left, node.right);
    if (node.type === "ObjectExpression") for (const property of node.properties) if (property.type === "ObjectProperty" && !property.computed && !property.shorthand) parts.push(property.value);
    if (node.type === "ArrayExpression") for (const element of node.elements) if (element && element.type !== "SpreadElement") parts.push(element);
    if (node.type === "MemberExpression" && node.object.type === "ObjectExpression") parts.push(node.object);
    if (["TSAsExpression", "TSSatisfiesExpression", "TSNonNullExpression", "ParenthesizedExpression"].includes(node.type) && "expression" in node) parts.push(node.expression as Expression);
    if (!parts.length) return original;
    const result = new MagicString(original);
    for (const part of parts) {
      const value = displayExpression(part, code);
      if (value !== sliceNode(part, code)) result.overwrite((part.start ?? 0) - (node.start ?? 0), (part.end ?? 0) - (node.start ?? 0), value);
    }
    return result.toString();
  }

  function transformExpression(code: string): string {
    try {
      const expression = parseExpression(code, { plugins: ["typescript"] });
      collectExplicit(expression);
      return displayExpression(expression, code);
    } catch {
      return code;
    }
  }

  function collectExplicit(node: Node) {
    if (node.type === "CallExpression" && node.callee.type === "Identifier" && ["translate", "t", "msg"].includes(node.callee.name)) {
      const message = node.arguments[0];
      if (message?.type === "StringLiteral" && hasChinese(message.value)) messages.add(message.value);
    }
    if (node.type === "TaggedTemplateExpression" && node.tag.type === "Identifier" && ["t", "msg"].includes(node.tag.name)) {
      const template = node.quasi.quasis.map((part, index) => `${node.quasi.expressions.length ? escapeMessageText(part.value.cooked ?? part.value.raw) : part.value.cooked ?? part.value.raw}${index < node.quasi.expressions.length ? `{${index}}` : ""}`).join("");
      if (hasChinese(template)) messages.add(template);
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child === "object" && "type" in child) collectExplicit(child as Node);
      } else if (value && typeof value === "object" && "type" in value) collectExplicit(value as Node);
    }
  }

  function visitScript(code: string, offset: number) {
    const ast = parseScript(code, { sourceType: "module", plugins: ["typescript", "jsx"], allowAwaitOutsideFunction: true });
    function visit(node: Node, ancestors: Node[]) {
      if (node.type === "VariableDeclarator" && node.id.type === "Identifier" && excludedName.test(node.id.name)) return;
      if (node.type === "ObjectProperty" && excludedName.test(propertyName(node) ?? "")) return;
      if (node.type === "VariableDeclarator" && node.id.type === "Identifier" && node.id.name === "placeholderPhrases" && node.init?.type === "ArrayExpression") {
        for (const value of node.init.elements) if (value?.type === "StringLiteral" && hasChinese(value.value)) messages.add(value.value);
      }
      if (node.type === "TaggedTemplateExpression" && node.tag.type === "Identifier" && ["t", "msg"].includes(node.tag.name)) {
        const template = node.quasi.quasis.map((part, index) => `${node.quasi.expressions.length ? escapeMessageText(part.value.cooked ?? part.value.raw) : part.value.cooked ?? part.value.raw}${index < node.quasi.expressions.length ? `{${index}}` : ""}`).join("");
        if (hasChinese(template)) messages.add(template);
        return;
      }
      if (node.type === "CallExpression") {
        const callee = node.callee;
        const root = callee.type === "Identifier" ? callee.name : callee.type === "MemberExpression" && callee.object.type === "Identifier" ? callee.object.name : "";
        if (["ElMessage", "ElMessageBox", "ElNotification"].includes(root)) {
          for (const argument of node.arguments.slice(0, root === "ElMessageBox" ? 2 : 1)) {
            if (argument.type === "SpreadElement" || argument.type === "ArgumentPlaceholder") continue;
            const value = displayExpression(argument, code);
            if (value !== sliceNode(argument, code)) replace(offset + argument.start!, offset + argument.end!, value);
          }
        }
        if (callee.type === "Identifier" && ["showNodeError", "errorMessage"].includes(callee.name)) {
          for (const argument of node.arguments.slice(callee.name === "showNodeError" ? 0 : 1, 2)) {
            const value = displayExpression(argument, code);
            if (value !== sliceNode(argument, code)) replace(offset + argument.start!, offset + argument.end!, value);
          }
        }
        if (callee.type === "Identifier" && ["translate", "t", "msg"].includes(callee.name)) {
          const message = node.arguments[0];
          if (message?.type === "StringLiteral" && hasChinese(message.value)) messages.add(message.value);
        }
      }
      if (node.type === "NewExpression" && node.callee.type === "Identifier" && /^(?:Error|TypeError|RangeError|DOMException)$/.test(node.callee.name)) {
        const argument = node.arguments[0];
        if (argument) {
          const value = displayExpression(argument, code);
          if (value !== sliceNode(argument, code)) replace(offset + argument.start!, offset + argument.end!, value);
        }
      }
      if (node.type === "AssignmentExpression") {
        const target = node.left.type === "MemberExpression" && node.left.property.type === "Identifier" && node.left.property.name === "value" ? node.left.object : node.left;
        if (target.type === "Identifier" && /(?:error|errorMessage|statusText|statusMessage|loadingText|progressText|progressMessage)$/i.test(target.name)) {
          const value = displayExpression(node.right, code);
          if (value !== sliceNode(node.right, code)) replace(offset + node.right.start!, offset + node.right.end!, value);
        }
      }
      if (node.type === "VariableDeclarator" && node.id.type === "Identifier" && /(?:label|title|description|placeholder|tooltip|statusText)$/i.test(node.id.name) && node.init?.type === "CallExpression" && node.init.callee.type === "Identifier" && node.init.callee.name === "computed") {
        const getter = node.init.arguments[0];
        if (getter?.type === "ArrowFunctionExpression" && getter.body.type !== "BlockStatement") {
          const value = displayExpression(getter.body, code);
          if (value !== sliceNode(getter.body, code)) replace(offset + getter.body.start!, offset + getter.body.end!, value);
        }
      }
      const parent = ancestors.at(-1);
      if (node.type === "ObjectProperty" && propertyName(node) === "inputValidator" && node.value.type === "ArrowFunctionExpression" && node.value.body.type !== "BlockStatement") {
        const value = displayExpression(node.value.body, code);
        if (value !== sliceNode(node.value.body, code)) replace(offset + node.value.body.start!, offset + node.value.body.end!, value);
      }
      if (node.type === "ObjectProperty" && parent?.type === "ObjectExpression" && isDisplayProperty(node, parent, ancestors)) {
        const value = displayExpression(node.value, code);
        if (value !== sliceNode(node.value, code)) {
          // Getters defer static configuration labels until rendering, keeping language changes reactive.
          replace(offset + node.start!, offset + node.end!, `get ${sliceNode(node.key, code)}() { return ${value}; }`);
          return;
        }
      }
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
          for (const child of value) if (child && typeof child === "object" && "type" in child) visit(child as Node, [...ancestors, node]);
        } else if (value && typeof value === "object" && "type" in value) visit(value as Node, [...ancestors, node]);
      }
    }
    visit(ast.program, []);
  }

  function visitTemplate(code: string, offset: number) {
    const root = baseParse(code, { comments: true });
    function visitChildren(children: TemplateChildNode[]) {
      for (let index = 0; index < children.length; index++) {
        const node = children[index]!;
        if (node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION) {
          const run = [node];
          while ([NodeTypes.TEXT, NodeTypes.INTERPOLATION].includes(children[index + 1]?.type ?? -1)) run.push(children[++index]! as typeof node);
          const textNodes = run.filter((item) => item.type === NodeTypes.TEXT);
          if (textNodes.some((item) => hasChinese(item.content))) {
            const values: string[] = [];
            const dynamic = run.some((item) => item.type === NodeTypes.INTERPOLATION);
            const message = run.map((item) => {
              if (item.type === NodeTypes.TEXT) return dynamic ? escapeMessageText(item.content) : item.content;
              values.push(transformExpression(item.content.loc.source));
              return `{${values.length - 1}}`;
            }).join("").replace(/[\t\r\n\f ]+/g, " ").replace(/^ +| +$/g, "");
            const original = code.slice(run[0]!.loc.start.offset, run.at(-1)!.loc.end.offset);
            const prefix = original.match(/^[\t\r\n\f ]*/)?.[0] ?? "";
            const suffix = original.match(/[\t\r\n\f ]*$/)?.[0] ?? "";
            replace(offset + run[0]!.loc.start.offset, offset + run.at(-1)!.loc.end.offset, `${prefix}{{ ${translate(message, values)} }}${suffix}`);
          } else {
            for (const item of run) {
              if (item.type !== NodeTypes.INTERPOLATION) continue;
              const expression = item.content.loc.source;
              const value = transformExpression(expression);
              if (value !== expression) replace(offset + item.content.loc.start.offset, offset + item.content.loc.end.offset, value);
            }
          }
          continue;
        }
        if (node.type !== NodeTypes.ELEMENT) continue;
        // Vue removes v-pre from its AST, so inspect the opening tag without quoted attribute values.
        const openingTag = node.loc.source.match(/^<(?:[^"'<>]|"[^"]*"|'[^']*')*>/)?.[0].replace(/"[^"]*"|'[^']*'/g, "") ?? "";
        if (["script", "style", "pre", "code"].includes(node.tag) || /\sv-pre(?:\s|=|\/?>)/.test(openingTag) || node.props.some((property) => property.type === NodeTypes.ATTRIBUTE && (property.name === "data-i18n-ignore" || property.name === "translate" && property.value?.content === "no"))) continue;
        const labelIsValue = /^(?:el-radio|el-checkbox|ElRadio|ElCheckbox)(?:-button|Button)?$/.test(node.tag)
          && !node.props.some((candidate) => candidate.type === NodeTypes.ATTRIBUTE && candidate.name === "value" || candidate.type === NodeTypes.DIRECTIVE && candidate.arg?.type === NodeTypes.SIMPLE_EXPRESSION && candidate.arg.content === "value");
        for (const property of node.props) {
          if (property.type === NodeTypes.DIRECTIVE && property.exp?.type === NodeTypes.SIMPLE_EXPRESSION) {
            try { collectExplicit(parseExpression(property.exp.content, { plugins: ["typescript"] })); } catch { /* Event statements and v-for aliases are not expressions. */ }
          }
          if (property.type === NodeTypes.ATTRIBUTE && property.value && isDisplayAttribute(property.name) && hasChinese(property.value.content)) {
            // Older Element Plus radios use label as their model value; only explicit value makes label display-only.
            if (property.name === "label" && labelIsValue) continue;
            replace(offset + property.loc.start.offset, offset + property.loc.end.offset, `:${property.name}="${attributeExpression(translate(property.value.content))}"`);
          }
          if (property.type === NodeTypes.DIRECTIVE && property.exp?.type === NodeTypes.SIMPLE_EXPRESSION && (property.name === "text" || property.name === "bind" && property.arg?.type === NodeTypes.SIMPLE_EXPRESSION && isDisplayAttribute(property.arg.content))) {
            if (property.arg?.type === NodeTypes.SIMPLE_EXPRESSION && property.arg.content === "label" && labelIsValue) continue;
            const value = transformExpression(property.exp.content);
            if (value !== property.exp.content) replace(offset + property.exp.loc.start.offset, offset + property.exp.loc.end.offset, attributeExpression(value));
          }
        }
        visitChildren(node.children);
      }
    }
    visitChildren(root.children);
  }

  if (/\.vue$/.test(id)) {
    const { descriptor, errors } = parseSfc(source, { filename: id });
    if (errors.length) throw new Error(`Unable to parse Vue component for i18n: ${id}: ${errors[0]}`);
    if (descriptor.template && !descriptor.template.lang) visitTemplate(descriptor.template.content, descriptor.template.loc.start.offset);
    for (const script of [descriptor.script, descriptor.scriptSetup]) if (script && !script.src) visitScript(script.content, script.loc.start.offset);
    if (replacements.length) {
      const importCode = `\nimport { translate as ${translateName} } from "@toonflow/i18n/vue";\n`;
      if (descriptor.scriptSetup) output.appendLeft(descriptor.scriptSetup.loc.start.offset, importCode);
      else output.prepend(`<script setup${descriptor.script?.lang ? ` lang="${descriptor.script.lang}"` : ""}>${importCode}</script>\n`);
    }
  } else {
    visitScript(source, 0);
    if (replacements.length) output.prepend(`import { translate as ${translateName} } from "@toonflow/i18n/vue";\n`);
  }
  return { output, messages, changed: replacements.length > 0 };
}

export function collectMessages(source: string, id: string): string[] {
  if (!/\.(?:vue|[cm]?[jt]sx?)$/.test(id) || /(?:providerPrompt|[?]|\.d\.ts$)/i.test(id)) return [];
  return [...analyze(source, id).messages];
}

export function transformSource(source: string, id: string) {
  if (!/\.(?:vue|[cm]?[jt]sx?)$/.test(id) || /(?:providerPrompt|[?]|\.d\.ts$)/i.test(id)) return;
  const result = analyze(source, id);
  if (!result.changed) return;
  return { code: result.output.toString(), map: result.output.generateMap({ source: id, includeContent: true, hires: true }) };
}
