import { Toonflow } from "./toonflow";
import type { Channel } from "./types";

const channels = new Map<string, Channel>([["toonflow", new Toonflow()]]);

export function getChannel(): Channel {
  const source = channels.get(process.env.TOONFLOW_CHANNEL?.trim() || "toonflow");
  if (!source) throw Object.assign(new Error("渠道未配置，请检查 TOONFLOW_CHANNEL"), { status: 503 });
  return source;
}
