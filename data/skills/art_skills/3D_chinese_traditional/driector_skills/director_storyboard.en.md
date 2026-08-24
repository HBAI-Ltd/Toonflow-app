---
name: director_storyboard
description: Director storyboard prompt techniques · Guofeng 3D
metaData: director_skills
---

# Storyboard Prompt · Guofeng 3D · Style-Specific Techniques

---

## Scope of use

This Skill is used solely for generating storyboard prompts in the **Guofeng 3D** style.

---

## Emotion → face/gaze word mapping

| Emotion input | Face words | Gaze words | Micro-expression supplement |
|----------|--------|--------|-----------|
| Dignified / graceful | Dignified expression, calm gaze | Bright eyes, steady gaze | Corners of the mouth lifting slightly, elegant expression |
| Sorrowful / plaintive | Plaintive expression, dimmed eyes | Eyes brimming with tears, gaze lowered | Corners of the mouth sinking, grieving expression |
| Tender / deeply affectionate | Tender expression, affection in the brows and eyes | Attentive soft eyes, warm gaze | Corners of the mouth lifting slightly, healing expression |
| Sharp / grim | Austere expression, gaze like a blade | Keen eyes, resolute gaze | Jaw tightening, imposing expression |
| Surprised / delighted | Eyes slightly widened, lively expression | Bright eyes, focused gaze | Corners of the mouth turning up, pleasantly surprised expression |
| Contemplative / introspective | Faint expression, far-off gaze | Eyes emptied out, gaze unfocused | Calm expression, reserved bearing |
| Joyful / cheerful | Radiant expression, eyes curved like crescent moons | Bright eyes, lively gaze | Cheeks slightly flushed, lively expression |
| Weary / listless | Hazy eyes, soft expression | Gaze slightly tired, soft eyes | A small yawn, languid expression |
| Expectant / hopeful | Eyes lighting up, vivid expression | Expectant eyes, gaze flickering | Corners of the mouth turning up, lively expression |
| Determined / resolute | Earnest expression, clear bright gaze | Resolute eyes, gaze straight ahead | Chin lifted slightly, decisive expression |

---

## Lighting and atmosphere word bank (Guofeng 3D)

### Light by time of day

| Time of day | Key-light words | Tonal words | Atmosphere words |
|--------|--------|--------|--------|
| Early morning | Soft morning light, warm side illumination | Moon white + blue-green | Thin mist spreading, fresh air |
| Midday | Bright sunlight, direct soft light | Vermilion + golden yellow highlights | Clear light and shadow, vivid color |
| Evening/dusk | Backlit silhouette, warm gradation | Vermilion + indigo gradation | Sunset afterglow, rim light |
| Night | Cool background + warm accent light | Indigo keynote + warm yellow light points | Serene and warm, soft lamplight |
| Rainy day | Diffused cool light, no key light | Blue-green + moon white | Humid air, low contrast |

### Emotional lighting

| Emotional keynote | Light type | Supplementary constraint |
|----------|----------|----------|
| Courtly opulence | Warm-light illumination, local highlights | PBR material reflection, depth-of-field layering |
| Landscape mood | Volumetric light diffusion, misty atmosphere | Blue-green tone, depth-of-field blur |
| Boudoir gentleness | Local soft light, soft shadow | Rouge tone, medium close-up (近景) and close-up (特写) |
| Wuxia grimness | Cool-toned shadow, hard-light contrast | Indigo + ink black, low saturation |
| Moonlit night stillness | Moonlight illumination, warm/cool contrast | Indigo background, warm accent light |

---

## Scene texture constraint words (by scene type)

| Scene type | Constraint words that must be added |
|----------|-----------|
| Court architecture | Vermilion palace walls, gilded glazed roof, carved beams and painted rafters, white-marble balustrades |
| Landscape garden | Blue-green landscape, flying-eave pavilions, a winding path to seclusion, rockery and pond |
| Boudoir interior | Screens and lattice doors, carved window lattice, gauze drapes and bed curtains, classical furniture |
| Wuxia scene | Bamboo grove/snowfield/cliff, cool tones, oppressive atmosphere, sharp lines |
| Festival celebration | Lanterns/streamers/fireworks, highly saturated warm color, lively atmosphere, bustling crowd |
| Night street scene | Lanterns/street lamps/shopfronts, warm accent light, cool background, reflections |

---

## Fixed style anchor words (every output must contain them)

**3D render anchoring (mandatory):**

3D render style, high-precision modeling, PBR materials, Guofeng 3D, cinema-level lighting

**Character texture (mandatory when the shot contains a character):**

3D Guofeng-era modeling, high-precision textures, clear costume grain, finely rendered hair strands, richly layered light and shadow

**Scene texture (mandatory when the shot contains a scene):**

3D scene render, rich architectural detail, authentic material texture, depth-of-field blur, volumetric light

**Consistency anchoring (mandatory in reference-image mode):**

Keep the character styling consistent with the reference image, keep the scene style consistent with the reference image, keep the lighting and color keynote unified

**Style ending (fixed):**

Guofeng 3D render, Eastern aesthetics, PBR materials, cinema-level render

**Image-quality lock words (every output must contain them, placed after the style ending):**

Mode A (English) — default (when the frame needs no in-frame text):
3D HD render, high detail, high-precision modeling, PBR materials, no subtitles, no watermark, no title overlay in the frame

Mode A (English) — in-frame text scenes (when the shot description contains prop text such as a plaque, a couplet or a book):
3D HD render, high detail, high-precision modeling, PBR materials, no subtitles, no watermark, no title overlay in the frame, text on scene props such as plaques and couplets clearly legible

Mode B (English) — default:
3D rendered style, high-poly modeling, PBR materials, Chinese style, cinematic lighting, high detail, no subtitles, no captions, no watermark, no title overlay

Mode B (English) — in-frame text scenes:
3D rendered style, high-poly modeling, PBR materials, Chinese style, cinematic lighting, high detail, no subtitles, no captions, no watermark, no title overlay, legible text on in-scene props such as plaques and couplets

**Negative-word template (mode B must contain it, placed at the end of the prompt):**

> ⚠️ Seedream (mode A) **does not support negative prompts**; negative words apply to mode B only. Mode A guarantees image quality through the texture anchoring and image-quality lock words in the positive prompt.

Mode B (English):
no photorealistic, no realistic photography, no low-poly, no rough modeling, no plastic texture, no harsh lines, no cartoon style, no anime style, no western fantasy, no cyberpunk, no sci-fi, no modern elements, no subtitles, no captions, no watermark, no title overlay, no UI text

---

## Aesthetic prohibitions (avoid strictly when generating)

The following words/styles must not appear in the output prompt:

- ❌ Realistic-photography/photo-level-realism words (such as: photorealistic, realistic photography)
- ❌ Highly saturated fluorescent colors/neon colors/overly digital feel
- ❌ Western fantasy/cyberpunk/modern elements
- ❌ Low-precision modeling/crude textures/plastic texture
- ❌ Cartoon/anime/2D-anime style
- ❌ Flat design/no 3D depth
- ❌ Chaotic color/wrong lighting/wrong perspective
- ❌ Modern architecture/modern costume elements

> 💡 **Exception**: certain modern 3D rendering techniques (such as ray tracing and volumetric light) may reasonably be used, but the Guofeng aesthetic keynote must be preserved.

---

## Complete generation example

> Below is a side-by-side demonstration of mode A and mode B for the same input; in actual use **output only one of them**.

### Input (storyboard table row data)

| 序号 | Shot description | Scene | Associated asset names | Duration | Shot size | Camera movement | Character action | Emotion | Lighting and atmosphere |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | A woman in splendid robes stands before the palace, holding a palace lantern | Palace | 女子 | 6s | 中景 | 缓推 | Standing side-on holding the lantern, tender gaze | Gentle / elegant | Warm-light illumination |

### Example output A (mode A · Seedream)

[Prompt]
3D render style, high-precision modeling, PBR materials, Guofeng 3D, cinema-level lighting, 3D Guofeng-era modeling, high-precision textures, clear costume grain, finely rendered hair strands, richly layered light and shadow, medium shot (中景) composition, a woman in splendid robes stands before the palace, holding a palace lantern and standing side-on, gentle expression, tender gaze, vermilion palace-wall background, golden yellow highlight accents, volumetric light atmosphere, depth-of-field blur, Guofeng 3D render, Eastern aesthetics, PBR materials, 3D HD render, high detail, high-precision modeling, PBR materials, no subtitles, no watermark, no title overlay in the frame.
Based on the reference image of 女子, maintain consistent: face features, hairstyle, costume details. Generate a new scene: standing in front of palace at dusk, holding lantern. Keep visual style identical to reference.

### Example output B (mode B · Nanobanana)

```xml
<role>
You are a 3D storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: 女子 — 3D Guofeng-era styling, elegant costume, Guofeng 3D style
</character_reference>
<continuity_rules>
- Same outfit, hairstyle, face features across ALL shots
- Same 3D rendered style, PBR materials
- Same scene lighting, Chinese aesthetic
- Do NOT introduce photorealistic or western fantasy elements
</continuity_rules>
<shot>
Medium shot, woman in elegant traditional Chinese attire standing before palace, holding lantern, gentle expression, soft gaze, cinematic lighting, volumetric fog, depth of field blur, PBR material rendering, high-poly modeling, Chinese palace architecture, warm lighting, golden highlights, Chinese style 3D render, Eastern aesthetics, high detail, no subtitles, no captions, no watermark, no title overlay.
</shot>
<negative>
no photorealistic, no realistic photography, no low-poly, no rough modeling, no plastic texture, no harsh lines, no cartoon style, no anime style, no western fantasy, no cyberpunk, no sci-fi, no modern elements, no subtitles, no captions, no watermark, no title overlay, no UI text
</negative>


## Quick reference card

### Emotion → frame word quick lookup

| Emotion | Face keywords | Light match |
|------|-----------|---------|
| Dignified | Dignified expression, steady gaze | Warm-light illumination + highlights |
| Sorrowful | Plaintive expression, dimmed eyes | Cool-toned shadow + low contrast |
| Tender | Tender expression, attentive eyes | Local soft light + soft focus |
| Sharp | Austere expression, gaze like a blade | Cool-toned shadow + hard light |
| Joyful | Radiant expression, eyes curved like crescent moons | Warm-light illumination + high saturation |
| Contemplative | Faint expression, far-off gaze | Volumetric light + mist |
| Weary | Hazy eyes, soft expression | Soft light + low contrast |
| Resolute | Earnest expression, clear bright gaze | Warm side illumination + clear outlines |
