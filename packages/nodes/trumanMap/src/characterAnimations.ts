import { AnimationClip, NormalAnimationBlendMode } from "three";
import data from "./characterAnimationData.json";

const mirroredAnimations = [
  { sourceId: "cc0PickUp", id: "cc0PickUpRight", name: "右手台面拾取" },
  { sourceId: "cc0Interact", id: "cc0InteractRight", name: "右手伸手交互" },
];
const sourceCatalog = data.animations.map(entry => ({
  id: entry.id,
  name: entry.name,
  category: entry.category,
  duration: entry.clip.duration,
  sourceName: entry.sourceName,
  sourceUrl: entry.sourceUrl,
  license: entry.license,
  author: entry.author,
  contactHints: entry.contactHints,
}));
function mirrorBounds(bounds: { min: number[]; max: number[] }) {
  return { min: [-bounds.max[0]!, bounds.min[1]!, bounds.min[2]!], max: [-bounds.min[0]!, bounds.max[1]!, bounds.max[2]!] };
}
export const characterAnimationCatalog = Object.freeze([
  ...sourceCatalog,
  ...mirroredAnimations.map(mirror => {
    const source = sourceCatalog.find(entry => entry.id === mirror.sourceId)!;
    return { ...source, id: mirror.id, name: mirror.name, sourceName: source.sourceName + " (mirrored)", contactHints: { ...source.contactHints, leftHand: mirrorBounds(source.contactHints.rightHand), rightHand: mirrorBounds(source.contactHints.leftHand) } };
  }),
].map(entry => Object.freeze(entry)));

export function getCharacterAnimation(id: string) { return characterAnimationCatalog.find(entry => entry.id === id); }

let clips: AnimationClip[] | undefined;
export function createCharacterAnimationClips(): readonly AnimationClip[] {
  if (!clips) {
    clips = data.animations.map(entry => AnimationClip.parse({ ...entry.clip, blendMode: NormalAnimationBlendMode }));
    for (const mirror of mirroredAnimations) {
      const clip = clips.find(clip => clip.name === mirror.sourceId)!.clone();
      clip.name = mirror.id;
      for (const track of clip.tracks) {
        track.name = track.name.replace(/^(left|right)/, side => side === "left" ? "right" : "left");
        const stride = track.getValueSize();
        for (let index = 0; index < track.values.length; index += stride) {
          if (track.name.endsWith(".quaternion")) { track.values[index + 1] *= -1; track.values[index + 2] *= -1; }
          else if (track.name.endsWith(".position")) track.values[index] *= -1;
        }
      }
      clips.push(clip);
    }
  }
  return clips;
}
