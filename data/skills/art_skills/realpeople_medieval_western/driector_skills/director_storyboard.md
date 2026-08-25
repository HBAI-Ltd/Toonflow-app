---
name: director_storyboard
description: Director storyboard prompt techniques · Live-action medieval epic
metaData: director_skills
---

# Storyboard Prompts · Live-Action Medieval Epic · Style-Specific Techniques

---

## Scope

This skill is dedicated to storyboard prompt generation for the **live-action medieval epic** style.

---

## Emotion → face/gaze word mapping

> Acting register: restrained period-drama performance. Emotion lives in the eyes and micro-tension, rarely in open display.

| Emotion input | Face words | Gaze words | Micro-expression |
|---|---|---|---|
| Resolve / oath | Set jaw, stern stillness | Steady unblinking gaze | Slow breath, weight settled |
| Grief / loss | Hollowed stillness, drawn face | Distant unfocused eyes | Jaw tight, a single swallowed breath |
| Fury / menace | Hardened brow, cold stillness | Narrowed burning gaze | Lips pressed thin, controlled |
| Tenderness / bond | Softened weathered face | Guarded warmth in the eyes | Faint ease at mouth corners, restrained |
| Fear / hunted | Pale drawn face, alert | Darting then frozen gaze | Shallow breath fog, tension in neck |
| Betrayal shock | Stillness collapsing inward | Disbelief hardening to cold | Slow blink, hand tightening |
| Shame / accused | Lowered brow, held stillness | Rising defiant | Throat working, chin lifting |
| Weariness | Deep-lined fatigue | Heavy-lidded distance | Slow movements, sagged shoulders |
| Awe / dread | Slack stillness | Wide upturned gaze | Half step back, breath caught |
| Quiet vindication | Weathered calm breaking | Wet steady gaze | Trembling jaw held firm |

---

## Light-atmosphere word bank (medieval epic)

### Time-of-day light

| Time | Key light words | Tone words | Atmosphere words |
|---|---|---|---|
| Dawn | Low gold shafts, mist diffusion | Cold-warm split | First light through smoke, long shadows |
| Overcast day | Even grey diffusion | Grey-blue neutral | Honest textures, flat cold light |
| Dusk | Ember horizon, torch-lighting hour | Cooling amber to steel | Shadows stretching, fires being lit |
| Firelit night | Torch pools, hearth glow | Amber against black | Flicker on stone, darkness pressing in |
| Moonlit night | Still silver light, hard rim edges | Steel blue | Frost glitter, breath fog, stillness |
| Fog / rain | Swallowed distance, wet sheen | Desaturated grey | Dripping eaves, muffled world |

### Emotion lighting

| Emotional keynote | Light type | Additional constraints |
|---|---|---|
| Bond / refuge | Single fire source, warm pool | Faces half-lit, black beyond the circle |
| Judgment / power | Cold window shafts, dust in beams | Hard split across faces, symmetry |
| Pursuit / dread | Moving torchlight, deep shadow | Shadows chase, sources unstable |
| Grief / cost | Overcast flat diffusion | No warm source, detail held in shadow |
| Vindication | Low dawn shafts through dust | Backlit dust, warm edge on faces |
| Creature awe | Moon rim light, forest gloom | Silver rim highlight, eyes catch light |

---

## Scene texture constraint words (by scene type)

| Scene type | Mandatory constraint words |
|---|---|
| Guild great hall | High-seat dais, trophy antlers, guild banners, hearth glow on stone, long scarred tables |
| Castle chamber | Fur over stone, narrow window shaft, candle pools, tapestry weave |
| Tavern | Low smoke-dark beams, tankard sheen, crowded bench shadows, fiddle corner warmth |
| Moor / wilderness | Wind-bent heather, grey-blue distance, standing stone silhouettes, exposed cold light |
| Old forest | Moss on bark, root shadows, canopy gloom, single light shafts |
| Castle walls | Wet battlements, banner snap, brazier ember glow, grey sky mass |
| Aftermath field | Torn banners, broken shields, crows lifting, grey snow, drifting smoke — no bodies, no blood |
| Forge | Coal-ember core light, anvil silhouette, spark flecks, soot-black walls |

---

## Fixed style anchor words (all outputs must include)

**Live-action anchor (mandatory):**

live-action photography, cinematic film still, period drama realism, strong contrast, ultra-fine detail, texture ultra-clear

**Character texture (mandatory when characters are in shot):**

weathered skin with visible pores, fine facial rendering, defined features, individual hair strands, fine hair rendering

**Costume texture (mandatory when characters are in shot):**

medieval fabric weave visible, wool and leather grain, garments drape naturally with movement, period-authentic fit and wear

**Consistency anchor (mandatory in reference-image mode):**

keep character face consistent with reference, keep costume and colors consistent with reference, keep scene light style unified

**Style close (fixed):**

medieval epic aesthetic, grim restrained period atmosphere, cinematic storyboard composition

**Image-quality lock (all outputs, after the style close):**

Mode A (Seedream) — default:
ultra-sharp 4K, high detail, natural sharpness, photorealistic clarity, no subtitles, no captions, no watermark, no title overlay

Mode B (with negative support) — default:
ultra-sharp 4K, high detail, crisp textures, naturalistic sharpness, photorealistic clarity, no subtitles, no captions, no watermark, no title overlay

**Negative template (Mode B must include, at prompt end):**

> ⚠️ Seedream (Mode A) **does not support negative prompts**; negatives apply to Mode B only. Mode A guards quality through positive anchors and the quality lock.

Mode B (EN):
no plastic skin, no beauty filter, no studio lighting, no centered composition, no oversaturation, no AI generated look, no motion blur, no noise, no blurry, no out of focus, no subtitles, no captions, no watermark, no title overlay, no UI text, no modern clothing, no modern buildings, no East Asian architecture, no hanfu, no church, no religious symbols, no neon, no glowing effects, no anime, no 3D render, no blood, no gore, no wounds

---

## Aesthetic prohibitions (strictly avoided at generation)

The following vocabulary/styles must not appear in output prompts:

- ❌ Modern elements (clothing, technology, buildings, grooming)
- ❌ Anime / 2D / illustration / CG-render words
- ❌ East Asian architecture / hanfu / guofeng words
- ❌ Church / chapel / monk / priest / cross / prayer — any religious vocabulary
- ❌ Neon / fluorescent / glowing magic / polished-gold high-fantasy gloss
- ❌ Soft-focus / dreamy-filter / low-contrast prettiness
- ❌ Cartoon proportions, big eyes, chibi deformation
- ❌ Cyberpunk / steampunk / sci-fi elements
- ❌ Gore vocabulary: blood, bleeding, gore, wound, stab, slash, execute, brutal, graphic, severed, corpse, dead body, kill, torture
- ❌ Overlaid text of any kind (subtitles, watermarks, title cards, UI text — frames must be pure image)

> 💡 **Safe substitution reference** (when the storyboard describes violence):
>
> | Instead of | Write |
> |---|---|
> | bloodied blade | notched blade, dulled steel |
> | stabbing / slashing | blades clash, sparks on impact, strike toward off-screen |
> | dying man | a hand releasing a sword, the witness's stricken face |
> | corpse-strewn field | torn banners, broken shields, crows lifting, grey snow |

> 💡 **Exception**: in-world prop script (illegible aged writing on parchment, banners, seals) is allowed but must remain illegible; no readable text.

---

## Complete generation example

> The same input rendered in Mode A and Mode B; in practice output **only one**.

### Input (storyboard table row)

| No. | Frame description | Scene | Assets | Duration | Scale | Camera | Action | Emotion | Light |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Aldric stands accused in the guild hall circle, council above | Guild great hall | Aldric | 5s | Wide | Slow push-in | Standing still, chin lifting | Accused / defiant | Cold window shafts + dust |

### Example output A (Mode A · Seedream)

[Prompt]
live-action photography, cinematic film still, period drama realism, strong contrast, ultra-fine detail, texture ultra-clear, wide shot composition, lone figure standing in the open center of a medieval guild great hall, weathered skin with visible pores, individual hair strands, worn leather jerkin over wool, medieval fabric weave visible, high-seat dais above with council figures in shadow, cold window light shafts with drifting dust, hard light split across the accused face, rising defiant gaze, chin lifting, throat working, hearth cold and dark, long scarred tables pushed back, guild banners hanging still, medieval epic aesthetic, grim restrained period atmosphere, cinematic storyboard composition, ultra-sharp 4K, high detail, natural sharpness, photorealistic clarity, no subtitles, no captions, no watermark, no title overlay.
Based on the reference image of Aldric, maintain consistent: face features, hairstyle, costume details. Generate a new scene: standing accused in the guild hall circle. Keep character appearance identical to reference.

### Example output B (Mode B · with negatives)

```xml
<role>
You are a cinematographer and storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: Aldric — weathered face, shoulder-length dark hair, worn leather jerkin over wool, tall broad build
</character_reference>
<continuity_rules>
- Same wardrobe, hairstyle, face features across ALL shots
- Same environment, lighting style, color grade
- Only framing, angle, action, expression may change
- Do NOT introduce new characters not in reference images
</continuity_rules>
<shot>
Wide shot, live-action photography, cinematic film still, period drama realism, strong contrast, ultra-fine detail, texture ultra-clear, lone figure standing in the open center of a medieval guild great hall, weathered skin with visible pores, individual hair strands, worn leather jerkin over wool, medieval fabric weave visible, council on the high-seat dais above in shadow, cold window light shafts with drifting dust, hard split light on the accused face, rising defiant gaze, chin lifting, guild banners still, long scarred tables, hearth dark, grim restrained period atmosphere, medieval epic aesthetic, cinematic storyboard composition, ultra-sharp 4K, high detail, crisp textures, photorealistic clarity, no subtitles, no captions, no watermark, no title overlay.
</shot>
<negative>
no plastic skin, no beauty filter, no studio lighting, no centered composition, no oversaturation, no AI generated look, no motion blur, no noise, no blurry, no out of focus, no subtitles, no captions, no watermark, no title overlay, no UI text, no modern clothing, no modern buildings, no East Asian architecture, no hanfu, no church, no religious symbols, no neon, no glowing effects, no anime, no 3D render, no blood, no gore, no wounds
</negative>
```

## Quick reference card

### Emotion → image word lookup

| Emotion | Face keywords | Light match |
|---|---|---|
| Resolve | Set jaw, steady gaze | Cold window shafts |
| Grief | Hollowed stillness, distant eyes | Overcast flat diffusion |
| Fury | Hardened brow, burning gaze | Hard side light, high contrast |
| Tenderness | Softened face, guarded warmth | Single fire source, warm pool |
| Hunted | Pale alert face, darting gaze | Moving torchlight, deep shadow |
| Vindication | Weathered calm breaking, wet gaze | Low dawn shafts through dust |
