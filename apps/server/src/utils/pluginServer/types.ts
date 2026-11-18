import type { Response } from "express";
import type { Server, ServerWebSocket } from "bun";
import type { PluginHttpResponse, PluginServiceRoute, ToPluginMessage } from "@toonflow/plugin-server/protocol";

export type PluginOwner = {
  id: string;
  tokenHash: string;
  origin: string;
  identity: string;
  closed: boolean;
  response?: Response;
  services: Map<string, PluginService>;
  registrations: Map<string, { controller: AbortController; serviceId?: string }>;
  assertActive(): Promise<void>;
  send(message: ToPluginMessage): void;
  close(): void;
};

export type PluginService = {
  id: string;
  token: string;
  owner: PluginOwner;
  routes: PluginServiceRoute[];
  closed: boolean;
  requests: Map<string, { finish(response?: PluginHttpResponse, status?: number): void }>;
  sockets: Map<string, ServerWebSocket<PluginSocket>>;
  windowStartedAt: number;
  messages: number;
};

export type PluginSocket = {
  service: PluginService;
  id: string;
  path: string;
  query: string;
  headers: [string, string][];
};

export type PluginRuntime = {
  owners: Map<string, PluginOwner>;
  services: Map<string, PluginService>;
  gateway?: Server<PluginSocket>;
  idleTimer?: ReturnType<typeof setTimeout>;
};
