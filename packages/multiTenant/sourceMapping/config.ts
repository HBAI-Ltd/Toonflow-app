import { z } from "zod";

const sourceMappingTargetSchema = z.enum(["backend", "toonflowCloud"]);

export const sourceMappingSchema = z.strictObject({
  models: sourceMappingTargetSchema,
  providers: sourceMappingTargetSchema,
  plugins: sourceMappingTargetSchema,
  community: sourceMappingTargetSchema,
});
export const sourceMappingRevisionSchema = z.number().int().min(0).max(2147483646);
export type SourceMapping = z.infer<typeof sourceMappingSchema>;
export type SourceMappingSnapshot = { mappings: SourceMapping; revision: number; applied: false };

export function getDefaultSourceMapping(): SourceMapping {
  return { models: "toonflowCloud", providers: "toonflowCloud", plugins: "toonflowCloud", community: "toonflowCloud" };
}
