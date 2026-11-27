import { mediaModelRoute } from "@/lib/mediaModelRequest";
import u from "@/utils";

export default mediaModelRoute(undefined, (root, source, output, _, progress, signal) =>
  u.processWorkspaceVideo(root, source, output, { operation: "interpolate", factor: 2 }, progress, signal));
