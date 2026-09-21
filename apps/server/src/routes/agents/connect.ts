import { Router } from "express";
import { z } from "zod";
import { createTeamA2aClient } from "@toonflow/teams-scaffold/a2a";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { error, success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({
  name: z.string().regex(u.teams.teamNamePattern),
  cardUrl: z.string().url().max(4096).refine(value => {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.hash;
  }),
  token: z.string().max(8192).optional(),
}), async (req, res) => {
  if (!u.workspace.isLocalWorkspaceRequest(req)) return res.status(403).json(error("请在桌面端或服务器本机连接远端团队", null, 403));
  const { name, cardUrl, token } = req.body as { name: string; cardUrl: string; token?: string };
  const signal = AbortSignal.timeout(20000);
  const client = await createTeamA2aClient({ url: cardUrl, token, fetch: ((input, init) => fetch(input, { ...init, signal })) as typeof fetch });
  const card = await client.getAgentCard();
  await u.teams.saveRemoteTeam({ name, cardUrl, ...(token ? { token } : {}), enabled: true, card });
  res.json(success({ name }, "远端团队已连接"));
});
