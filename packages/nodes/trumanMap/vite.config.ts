import { createNodeConfig } from "@toonflow/nodes-scaffold";
import { compressNode } from "./nodeCompression.ts";
import { compactAnimationData } from "./animationDataCompaction.ts";

const config = createNodeConfig({
  name: "trumanMap",
  displayName: "白模预演TrumanMap",
  author: "Toonflow",
  github: "https://github.com/HBAI-Ltd/Toonflow-app",
}, import.meta.url);

export default { ...config, plugins: [compactAnimationData(), ...config.plugins ?? [], compressNode()] };
