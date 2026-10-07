export type PanoramaMode = "sphere" | "cylinder";
export type PanoramaCapture = {
  images: { blob: Blob; width: number; height: number; label: string }[];
  columns: number;
  count: number;
};

export function getPanoramaViews(mode: PanoramaMode, count: 1 | 4 | 12, yaw: number, pitch: number) {
  const startYaw = Number.isFinite(yaw) ? yaw : 0;
  const startPitch = mode === "sphere" && Number.isFinite(pitch) ? Math.max(-85, Math.min(85, pitch)) : 0;
  return Array.from({ length: count }, (_, index) => {
    const columns = count === 12 && mode === "cylinder" ? 12 : 4;
    const viewYaw = ((startYaw + (count === 1 ? 0 : index % columns * 360 / columns)) % 360 + 360) % 360;
    const viewPitch = count === 1 ? startPitch : count === 12 && mode === "sphere" ? 45 - Math.floor(index / 4) * 45 : 0;
    return { yaw: viewYaw, pitch: viewPitch, label: `水平 ${Math.round(viewYaw)}°${mode === "sphere" ? ` · 俯仰 ${viewPitch}°` : ""}` };
  });
}

export function buildPanoramaPrompt(mode: PanoramaMode) {
  return [
    "Use reference image {{ref 1}} to reconstruct and extend the same environment around a single stationary camera position. Preserve the scene identity, subjects, materials, colors, lighting and visual style. Infer unseen surroundings consistently.",
    mode === "sphere"
      ? "Output a 720-degree full spherical panorama as one equirectangular image with a strict 2:1 aspect ratio, covering 360 degrees of longitude and 180 degrees of latitude. Include the complete zenith and nadir, with the horizon vertically centered. The left and right edges must join seamlessly. This must be a flat equirectangular texture ready to map onto the inside of a sphere."
      : "Output a 360-degree horizontal cylindrical panorama as one image with a strict 4:1 aspect ratio. Cover a complete horizontal revolution around the camera, keep the horizon level and vertically centered, and make the left and right edges join seamlessly. This must be a flat cylindrical texture ready to map onto the inside of a cylinder.",
    "Produce one continuous panorama without panels, grids, borders, seams, labels, text, watermarks, cameras or interface controls. Do not output a little-planet view, fisheye view or a picture of a panorama viewer.",
  ].join("\n");
}
