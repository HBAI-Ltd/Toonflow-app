import { createToolConfig } from "@toonflow/tools-scaffold";

await createToolConfig({
  name: "trumanMap",
  displayName: "白模预演TrumanMap",
  description: "让 AI 按描述制作和修改白模预演场景里的三维模型。",
  author: "Toonflow",
  github: "https://github.com/HBAI-Ltd/Toonflow-app",
  prompt: "Kiln turns authored JavaScript into editable GLB assets and image feedback. Use kilnTool with kiln_discover first for the exact helper contracts and tool input shapes. Send code once to kiln_validate or kiln_render, preserve the exact programRef for later kiln_source, kiln_edit, kiln_render and kiln_inspect calls. Inspect the actual images, check viewFidelity, refine the source rather than replacing it with JSON primitives, and export the accepted programRef through kilnExport. The CPU images assess shape and geometry, not final PBR material fidelity. Source is immutable and persists in the workspace. The evaluator accepts bounded pure Kiln helpers and explicit safe THREE constructors; imports, host I/O, reflection and dynamic property access are rejected. Keep each program below 64 KiB and each model below 50000 triangles. kilnPrepare explicitly prepares the pinned SDK when not ready; builds and development do not install runtime dependencies.",
  configRules: [],
}, import.meta.url);
