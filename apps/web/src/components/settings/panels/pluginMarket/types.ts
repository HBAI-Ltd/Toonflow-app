import type { Rule } from "@form-create/element-ui";
import type { Plugin as MarketPlugin } from "@toonflow/server/channel";
import type { Raw } from "vue";

export type PluginType = "node" | "skill" | "tool" | "agent" | "ext";

export interface Plugin {
  key: string;
  id?: number;
  isCollected?: boolean;
  state?: 0 | 1 | 2;
  rejectReason?: string;
  tags?: MarketPlugin["tags"];
  demoVideoUrl?: string;
  coverUrl?: string;
  type: PluginType;
  name: string;
  displayName: string;
  author?: string;
  description?: string;
  readme?: string;
  github?: string;
  version?: string;
  installedAt?: number;
  enabled?: boolean;
  builtin?: boolean;
  canConfigure?: boolean;
  canManage?: boolean;
  configRules?: Raw<Rule[]>;
  config?: Record<string, unknown>;
  url?: string;
  fileName?: string;
  kind?: "local" | "remote";
  cardUrl?: string;
  loadError?: string;
}
