import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import channelRequest from "@/lib/channelRequest";

const pluginIdentity = z.strictObject({
  type: z.enum(["node", "tool", "skill", "agent", "ext"]),
  identifier: z.string().trim().min(1).max(200),
});
const fields = {
  plugins: z.array(pluginIdentity).min(1).refine(
    plugins => new Set(plugins.map(plugin => `${plugin.type}:${plugin.identifier}`)).size === plugins.length,
    "待检查插件不能重复",
  ),
};
const schema = z.strictObject(fields);
const resultsSchema = z.array(pluginIdentity.extend({ exists: z.boolean() }));

export default Router().post("/", validateFields(fields), (req, res) => channelRequest(req, res, async (channel, options) => {
  const { plugins } = schema.parse(req.body);
  const result = resultsSchema.safeParse(await channel.getPluginExistence(plugins, options));
  const pending = new Set(plugins.map(plugin => `${plugin.type}:${plugin.identifier}`));
  if (!result.success || result.data.length !== plugins.length
    || result.data.some(plugin => !pending.delete(`${plugin.type}:${plugin.identifier}`))) {
    throw Object.assign(new Error("插件市场批量存在性响应格式不正确"), { status: 502 });
  }
  return result.data;
}, true));
