import { parse, type Node } from "acorn";

type AstNode = Node & Record<string, unknown>;
type LexicalScope = { parent?: LexicalScope; functionScope: boolean; declarations: Set<string> };
const bannedNames = new Set(["globalThis", "global", "window", "self", "process", "Bun", "require", "module", "exports", "eval", "Function", "AsyncFunction", "GeneratorFunction", "WebAssembly", "Reflect", "Proxy", "Object", "JSON", "Promise", "fetch", "XMLHttpRequest", "Worker", "SharedWorker", "SharedArrayBuffer", "Atomics", "console", "arguments", "constructor", "prototype", "__proto__", "__defineGetter__", "__defineSetter__", "__lookupGetter__", "__lookupSetter__", "caller", "callee", "call", "apply", "bind"]);
const threeNames = new Set(["Group", "Object3D", "Mesh", "Bone", "BufferGeometry", "BoxGeometry", "SphereGeometry", "CylinderGeometry", "ConeGeometry", "TorusGeometry", "TorusKnotGeometry", "CapsuleGeometry", "PlaneGeometry", "CircleGeometry", "RingGeometry", "LatheGeometry", "TubeGeometry", "ExtrudeGeometry", "ShapeGeometry", "IcosahedronGeometry", "OctahedronGeometry", "DodecahedronGeometry", "TetrahedronGeometry", "BufferAttribute", "Float32BufferAttribute", "Uint16BufferAttribute", "Uint32BufferAttribute", "MeshStandardMaterial", "MeshBasicMaterial", "MeshLambertMaterial", "MeshPhysicalMaterial", "Color", "Vector2", "Vector3", "Vector4", "Euler", "Quaternion", "Matrix3", "Matrix4", "Box3", "Sphere", "Shape", "Path", "CurvePath", "CatmullRomCurve3", "CubicBezierCurve3", "QuadraticBezierCurve3", "LineCurve3", "AnimationClip", "VectorKeyframeTrack", "QuaternionKeyframeTrack", "NumberKeyframeTrack", "DoubleSide", "FrontSide", "BackSide", "MathUtils"]);
const geometrySegments: Record<string, readonly number[]> = {
  BoxGeometry: [3, 4, 5], SphereGeometry: [1, 2], CylinderGeometry: [3, 4], ConeGeometry: [2, 3],
  TorusGeometry: [2, 3], TorusKnotGeometry: [2, 3], CapsuleGeometry: [2, 3, 4], PlaneGeometry: [2, 3],
  CircleGeometry: [1], RingGeometry: [2, 3], LatheGeometry: [1], TubeGeometry: [1, 3], ShapeGeometry: [1],
};
const polyhedronNames = new Set(["IcosahedronGeometry", "OctahedronGeometry", "DodecahedronGeometry", "TetrahedronGeometry"]);
const bufferAttributeNames = new Set(["BufferAttribute", "Float32BufferAttribute", "Uint16BufferAttribute", "Uint32BufferAttribute"]);
const keyframeTrackNames = new Set(["VectorKeyframeTrack", "QuaternionKeyframeTrack", "NumberKeyframeTrack"]);
const helperSegments: Record<string, readonly number[]> = {
  capsuleGeo: [2], capsuleXGeo: [2], capsuleYGeo: [2], capsuleZGeo: [2],
  cylinderGeo: [3], cylinderXGeo: [3], cylinderYGeo: [3], cylinderZGeo: [3], sphereGeo: [1, 2],
  coneGeo: [2], coneXGeo: [2], coneYGeo: [2], coneZGeo: [2], taperConeGeo: [4], torusGeo: [2, 3], planeGeo: [2, 3],
  circleProfile: [1], curveToMesh: [2, 3], lathe: [1], bezierCurve: [1], catmullRomPath: [1], subdivide: [1],
};
const helperOptions: Record<string, { index: number; fields: readonly string[] }> = {
  extrudeProfile: { index: 1, fields: ["segments", "divisions"] },
  revolveProfile: { index: 1, fields: ["segments", "bevelSegments"] },
  roundedBoxGeo: { index: 4, fields: ["segments"] },
  revolveGeo: { index: 1, fields: ["segments"] },
  pipeAlongPath: { index: 2, fields: ["tubularSegments", "radialSegments"] },
  cylinderOnAxis: { index: 4, fields: ["segments"] },
  beamBetween: { index: 5, fields: ["segments"] },
  createLadder: { index: 1, fields: ["segments"] },
  taperedTube: { index: 2, fields: ["radialSegments"] },
  spiralPath: { index: 0, fields: ["samples"] },
  smoothOrganic: { index: 1, fields: ["iterations"] },
  parametricSurface: { index: 1, fields: ["uSegments", "vSegments"] },
  gearGeo: { index: 0, fields: ["teeth"] },
};
const boundedHelpers = new Set([...Object.keys(helperSegments), ...Object.keys(helperOptions)]);
const typedArrays = new Set(["Float32Array", "Float64Array", "Uint8Array", "Uint16Array", "Uint32Array", "Int8Array", "Int16Array", "Int32Array"]);
const pureGlobals = new Set(["undefined", "Infinity", "NaN", "Number", "String", "Boolean", ...typedArrays]);
const allowedNodes = new Set(["Program", "VariableDeclaration", "VariableDeclarator", "FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression", "BlockStatement", "ReturnStatement", "ExpressionStatement", "IfStatement", "ForStatement", "BreakStatement", "ContinueStatement", "EmptyStatement", "Literal", "Identifier", "ArrayExpression", "ObjectExpression", "Property", "RestElement", "SpreadElement", "ArrayPattern", "ObjectPattern", "AssignmentPattern", "CallExpression", "NewExpression", "MemberExpression", "ChainExpression", "UnaryExpression", "BinaryExpression", "LogicalExpression", "ConditionalExpression", "AssignmentExpression", "UpdateExpression", "SequenceExpression", "TemplateLiteral", "TemplateElement", "AwaitExpression"]);

function isNode(value: unknown): value is AstNode {
  return !!value && typeof value === "object" && typeof (value as AstNode).type === "string";
}

function memberName(node: AstNode) {
  const property = node.property as AstNode;
  if (!node.computed) return String(property.name);
  if (property.type !== "Literal" || !Number.isInteger(property.value) || Number(property.value) < 0 || Number(property.value) > 2048) throw new Error("只允许点属性和 0～2048 的字面整数下标，不能动态访问属性");
  return String(property.value);
}

function rootName(node: AstNode): string | undefined {
  if (node.type === "Identifier") return String(node.name);
  if (node.type === "MemberExpression") return rootName(node.object as AstNode);
  return undefined;
}

function requireBoundedInteger(node: AstNode, name: string, maximum: number, minimum = 1) {
  if (node.type !== "Literal" || !Number.isInteger(node.value) || Number(node.value) < minimum || Number(node.value) > maximum) throw new Error(`${name} 必须是 ${minimum}～${maximum} 的字面整数`);
}

function isLiteralArray(node: AstNode | undefined) {
  return node?.type === "ArrayExpression" && !(node.elements as (AstNode | null)[]).some(element => element?.type === "SpreadElement");
}

function requireBoundedArray(node: AstNode | undefined, name: string) {
  const boundedArray = node?.type === "NewExpression" && (node.callee as AstNode).type === "Identifier" && typedArrays.has(String((node.callee as AstNode).name));
  if (!isLiteralArray(node) && !boundedArray) throw new Error(`${name} 仅支持无展开的直接字面数组或受限 new 类型数组，不能传数字长度或未验证变量`);
}

export function validateSourcePolicy(code: string, helperNames: ReadonlySet<string>) {
  if (!code.trim() || Buffer.byteLength(code, "utf8") > 64 * 1024) throw new Error("Kiln 源码须为非空且不超过 64 KiB 的 JavaScript");
  if (Buffer.from(code, "utf8").toString("utf8") !== code) throw new Error("Kiln 源码必须是可完整保存的 Unicode 文本");
  const tree = parse(code, { ecmaVersion: 2022, sourceType: "script" }) as unknown as AstNode;
  const scopes = new WeakMap<AstNode, LexicalScope>();
  const rootScope: LexicalScope = { functionScope: true, declarations: new Set() };
  const globals = new Set([...helperNames, ...pureGlobals, "THREE", "Math"]);
  let count = 0;
  const collect = (value: unknown, scope: LexicalScope, depth = 0): void => {
    if (depth > 64) throw new Error("源码嵌套超过 64 层");
    if (Array.isArray(value)) { value.forEach(item => collect(item, scope, depth + 1)); return; }
    if (!isNode(value)) return;
    if (++count > 16000) throw new Error("源码语法节点超过上限");
    if (!allowedNodes.has(value.type)) throw new Error(`不允许的 JavaScript 语法：${value.type}`);
    if (value.type === "Identifier" && bannedNames.has(String(value.name))) throw new Error(`不允许访问 ${value.name}`);
    if (["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(value.type)) {
      if (value.generator) throw new Error("不支持生成器函数");
      scopes.set(value, scope);
      if (value.type === "FunctionDeclaration" && isNode(value.id)) declarePattern(value.id, scope);
      // 默认参数不能看见函数体的 var；将参数环境和函数体提升环境分别建模。
      const parameters: LexicalScope = { parent: scope, functionScope: false, declarations: new Set() };
      const body: LexicalScope = { parent: parameters, functionScope: true, declarations: new Set() };
      if (value.type === "FunctionExpression" && isNode(value.id)) declarePattern(value.id, parameters);
      (value.params as AstNode[]).forEach(parameter => declarePattern(parameter, parameters));
      if (isNode(value.id)) collect(value.id, value.type === "FunctionDeclaration" ? scope : parameters, depth + 1);
      collect(value.params, parameters, depth + 1);
      collect(value.body, body, depth + 1);
      return;
    }
    if (value.type === "BlockStatement" || value.type === "ForStatement") scope = { parent: scope, functionScope: false, declarations: new Set() };
    scopes.set(value, scope);
    if (value.type === "VariableDeclaration") {
      let target = scope;
      if (value.kind === "var") while (!target.functionScope && target.parent) target = target.parent;
      (value.declarations as AstNode[]).forEach(declaration => declarePattern(declaration.id as AstNode, target));
    }
    for (const [key, child] of Object.entries(value)) if (!["start", "end", "type"].includes(key)) collect(child, scope, depth + 1);
  };
  function declarePattern(node: AstNode, scope: LexicalScope) {
    if (node.type === "Identifier") {
      const name = String(node.name);
      if (bannedNames.has(name) || globals.has(name)) throw new Error(`不能重定义保留名称 ${name}`);
      scope.declarations.add(name);
    } else if (node.type === "RestElement") declarePattern(node.argument as AstNode, scope);
    else if (node.type === "AssignmentPattern") declarePattern(node.left as AstNode, scope);
    else if (node.type === "ArrayPattern") (node.elements as (AstNode | null)[]).forEach(item => { if (item) declarePattern(item, scope); });
    else if (node.type === "ObjectPattern") (node.properties as AstNode[]).forEach(item => declarePattern((item.value ?? item.argument) as AstNode, scope));
    else throw new Error("不支持的变量声明");
  }
  function resolveBinding(scope: LexicalScope | undefined, name: string): LexicalScope | undefined {
    while (scope) {
      if (scope.declarations.has(name)) return scope;
      scope = scope.parent;
    }
    return undefined;
  }
  collect(tree, rootScope);
  const loops: { name: string; scope: LexicalScope }[] = [];
  const visit = (node: AstNode, parent?: AstNode, key?: string): void => {
    const scope = scopes.get(node)!;
    if (node.type === "Identifier") {
      const name = String(node.name);
      const property = parent?.type === "MemberExpression" && key === "property" && !parent.computed;
      const objectKey = parent?.type === "Property" && key === "key" && !parent.computed;
      if (!property && !objectKey && !globals.has(name) && !resolveBinding(scope, name)) throw new Error(`当前词法作用域没有声明 ${name}，请使用 kiln_discover 查询真实 API`);
      if (["THREE", "Math"].includes(name) && !(parent?.type === "MemberExpression" && key === "object")) throw new Error(`${name} 只能通过明确的点属性使用`);
      if (!property && !objectKey && typedArrays.has(name) && !(parent?.type === "NewExpression" && key === "callee")) throw new Error("类型数组仅支持直接 new 的固定长度或字面数组，不能使用静态工厂或构造器别名");
      if (!property && !objectKey && helperNames.has(name) && boundedHelpers.has(name) && !(parent?.type === "CallExpression" && key === "callee")) throw new Error("受限细分 helper 只能直接调用，不能取别名、传作回调或用作构造器");
    }
    if (node.type === "Literal" && node.regex) throw new Error("模型源码不支持正则表达式");
    if (node.type === "Literal" && typeof node.value === "number" && !Number.isFinite(node.value)) throw new Error("数值必须有限");
    if (node.type === "Property" && (node.computed || node.kind !== "init")) throw new Error("不允许计算对象键、getter 或 setter");
    if (node.type === "Property" && bannedNames.has(String((node.key as AstNode).value ?? (node.key as AstNode).name))) throw new Error("对象字段包含禁止的能力名称");
    if (node.type === "MemberExpression") {
      const name = memberName(node);
      if (bannedNames.has(name) || name.startsWith("__")) throw new Error(`不允许的属性 ${name}`);
      if ((node.object as AstNode).type === "Identifier" && (node.object as AstNode).name === "THREE" && !threeNames.has(name)) throw new Error(`THREE.${name} 不在纯建模能力范围内`);
      if ((node.object as AstNode).type === "Identifier" && (node.object as AstNode).name === "THREE" && (geometrySegments[name] || polyhedronNames.has(name) || bufferAttributeNames.has(name) || keyframeTrackNames.has(name) || name === "ExtrudeGeometry" || name === "AnimationClip") && !(parent?.type === "NewExpression" && key === "callee")) throw new Error("受限分配类型只能直接 new，不能通过别名或静态工厂绕过参数校验");
    }
    if (node.type === "UnaryExpression" && !["-", "+", "!", "~", "typeof"].includes(String(node.operator))) throw new Error("不允许该一元运算");
    if (node.type === "AssignmentExpression" || node.type === "UpdateExpression") {
      const target = (node.left ?? node.argument) as AstNode;
      const name = rootName(target);
      const binding = name && resolveBinding(scope, name);
      if (!binding || loops.some(loop => loop.name === name && loop.scope === binding)) throw new Error("只能修改当前可见本地变量，循环计数器不能在循环体中重写");
    }
    if (node.type === "CallExpression" && (node.callee as AstNode).type === "Identifier") {
      const name = String((node.callee as AstNode).name);
      if (helperNames.has(name) && boundedHelpers.has(name)) {
        const args = node.arguments as AstNode[];
        if (args.some(argument => argument.type === "SpreadElement")) throw new Error("受限 helper 参数不能展开，须明确提供可校验的分配参数");
        for (const index of helperSegments[name] ?? []) if (args[index]) requireBoundedInteger(args[index], `${name} 细分参数`, name === "subdivide" ? 4 : 64, name === "subdivide" ? 0 : 1);
        const options = helperOptions[name];
        if (options && args[options.index]) {
          const value = args[options.index];
          if (value.type !== "ObjectExpression") throw new Error(`${name} options 必须是可校验的内联对象`);
          for (const property of value.properties as AstNode[]) {
            if (property.type !== "Property" || property.computed) throw new Error(`${name} options 不能展开或使用计算属性`);
            const field = String((property.key as AstNode).name ?? (property.key as AstNode).value);
            if (options.fields.includes(field)) requireBoundedInteger(property.value as AstNode, `${name} ${field}`, field === "iterations" ? 4 : 64, ["iterations", "divisions"].includes(field) ? 0 : 1);
          }
        }
      }
    }
    if (node.type === "NewExpression") {
      const callee = node.callee as AstNode;
      const args = node.arguments as AstNode[];
      if (args.some(argument => argument.type === "SpreadElement")) throw new Error("构造器参数不能展开，须明确提供可校验的分配参数");
      if (callee.type === "Identifier" && typedArrays.has(String(callee.name))) {
        const first = args[0];
        if (!first || !(isLiteralArray(first) || first.type === "Literal" && Number.isInteger(first.value) && Number(first.value) > 0 && Number(first.value) <= 262144)) throw new Error("类型数组必须使用无展开的字面数组或不超过 262144 的固定长度");
      } else if (!(callee.type === "MemberExpression" && (callee.object as AstNode).type === "Identifier" && (callee.object as AstNode).name === "THREE" && threeNames.has(memberName(callee)))) throw new Error("只能构造明确允许的 THREE 类型或有界类型数组");
      if (callee.type === "MemberExpression") {
        const name = memberName(callee);
        if (bufferAttributeNames.has(name)) requireBoundedArray(args[0], `${name} 首参`);
        if (keyframeTrackNames.has(name)) {
          requireBoundedArray(args[1], `${name} times`);
          requireBoundedArray(args[2], `${name} values`);
        }
        for (const index of geometrySegments[name] ?? []) if (args[index]) requireBoundedInteger(args[index], `${name} 细分参数`, 64);
        if (polyhedronNames.has(name) && args[1]) requireBoundedInteger(args[1], `${name} detail`, 4, 0);
        if (name === "ExtrudeGeometry" && args[1]) {
          const options = args[1];
          if (options.type !== "ObjectExpression") throw new Error("ExtrudeGeometry options 必须是可校验的内联对象");
          for (const property of options.properties as AstNode[]) {
            if (property.type !== "Property" || property.computed) throw new Error("ExtrudeGeometry options 不能展开或使用计算属性");
            const key = String((property.key as AstNode).name ?? (property.key as AstNode).value);
            if (["steps", "curveSegments", "bevelSegments"].includes(key)) requireBoundedInteger(property.value as AstNode, `ExtrudeGeometry ${key}`, 32, key === "bevelSegments" ? 0 : 1);
          }
        }
      }
    }
    if (node.type === "ForStatement") {
      const init = node.init as AstNode;
      const declaration = init?.type === "VariableDeclaration" ? (init.declarations as AstNode[])[0] : undefined;
      const variable = declaration?.id as AstNode | undefined;
      const initial = declaration?.init as AstNode | undefined;
      const test = node.test as AstNode;
      const update = node.update as AstNode;
      if (!variable || variable.type !== "Identifier" || initial?.type !== "Literal" || initial.value !== 0 || test?.type !== "BinaryExpression" || test.operator !== "<" || (test.left as AstNode).name !== variable.name || (test.right as AstNode).type !== "Literal" || !Number.isInteger((test.right as AstNode).value) || Number((test.right as AstNode).value) < 0 || Number((test.right as AstNode).value) > 512 || update?.type !== "UpdateExpression" || update.operator !== "++" || (update.argument as AstNode).name !== variable.name || loops.length >= 2) throw new Error("循环仅支持最多两层 for (let i = 0; i < 固定整数≤512; i++)");
      visit(init, node, "init"); visit(test, node, "test"); visit(update, node, "update");
      loops.push({ name: String(variable.name), scope: resolveBinding(scope, String(variable.name))! });
      visit(node.body as AstNode, node, "body");
      loops.pop();
      return;
    }
    for (const [childKey, child] of Object.entries(node)) {
      if (isNode(child)) visit(child, node, childKey);
      else if (Array.isArray(child)) child.forEach(item => { if (isNode(item)) visit(item, node, childKey); });
    }
  };
  visit(tree);
}
