import * as assets from "@/utils/assets";
import * as browser from "@/utils/browser";
import * as singleAgent from "@/utils/singleAgent";
import * as desktop from "@/utils/desktop";
import * as providerDebug from "@/utils/media/debug";
import * as mediaGeneration from "@/utils/media/generation";
import * as mediaSchemas from "@/utils/media/schemas";
import * as mediaTasks from "@/utils/media/tasks";
import * as mediaProvider from "@/utils/media/provider";
import * as mediaBilling from "@/utils/media/billing";
import * as mediaPreview from "@/utils/media/preview";
import * as ffmpeg from "@/utils/ffmpeg";
import * as pluginInstall from "@/utils/plugins/install";
import conf, { cleanNodeMenuSettings, removeLegacySettings } from "@/utils/conf";
import * as ai from "@/utils/ai";
import * as plugins from "@/utils/plugins/tools";
import * as nodePlugins from "@/utils/plugins/nodes";
import * as extPlugins from "@/utils/plugins/ext";
import * as agent from "@/agent";
import * as canvas from "@/agent/bridge/canvas";
import * as question from "@/agent/bridge/question";
import * as workspace from "@/utils/workspace";
import * as workspaceFile from "@/utils/workspace/files";
import * as workspaceDownload from "@/utils/workspace/download";
import * as chatImages from "@/utils/workspace/chatImages";
import * as skillFile from "@/utils/skills/files";
import * as mcpControl from "@/utils/mcp/control";
import * as mcpRuntime from "@/utils/mcp/runtime";
import * as mcpServers from "@/utils/mcp/servers";
import * as mcpDxt from "@/utils/mcp/dxt";
import * as mobileLink from "@/utils/mobileLink";
import * as teams from "@/utils/teams";
import * as a2aSettings from "@/agent/a2a/settings";
import * as personalization from "@/utils/personalization";
import * as mentionFiles from "@/agent/mentionFiles";
import * as network from "@/utils/network";
import * as channel from "@/utils/channel";

export default {
  assets,
  browser,
  singleAgent,
  desktop,
  providerDebug,
  mediaGeneration,
  mediaSchemas,
  mediaTasks,
  mediaProvider,
  mediaBilling,
  mediaPreview,
  ffmpeg,
  pluginInstall,
  conf,
  cleanNodeMenuSettings,
  removeLegacySettings,
  ai,
  plugins,
  nodePlugins,
  extPlugins,
  agent,
  canvas,
  question,
  workspace,
  workspaceFile,
  workspaceDownload,
  chatImages,
  skillFile,
  mcpControl,
  mcpRuntime,
  mcpServers,
  mcpDxt,
  mobileLink,
  teams,
  a2aSettings,
  personalization,
  mentionFiles,
  network,
  channel,
};
