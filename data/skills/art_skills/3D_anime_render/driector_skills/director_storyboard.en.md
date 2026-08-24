---
name: director_storyboard
description: Director storyboard prompt techniques · 3D Anime Render
metaData: director_skills
---

# Storyboard Prompts · 3D Anime Render · Style-Specific Techniques

---

## Scope of use

This Skill is used only for storyboard prompt generation in the **3D anime render** style.

---

## Emotion → face/gaze word mapping

| Emotion input | Face word | Gaze word | Micro-expression supplement |
|----------|--------|--------|-----------|
| Heart-flutter / delight | Corners of the mouth lifting, cheeks slightly flushed | Bright gaze, gentle look | Eyes curved like crescents, lively expression |
| Sadness / loss | Downcast look, eye rims slightly red | Dimmed gaze, wandering look | Brows lightly knitted, restrained expression |
| Surprise / curiosity | Eyes widened, lively expression | Focused gaze, curious look | Mouth slightly open, natural movement |
| Tenderness / deep affection | Soft look, gentle brows and eyes | Attentive gaze, affectionate look | Corners of the mouth lifting, restrained warm expression |
| Resolve / courage | Serious look, firm gaze | Clear look, focused gaze | Firm expression, bright temperament |
| Shyness / bashfulness | Cheeks flushed, natural expression | Eyes cast down, not daring to look straight | Fingers lightly touching the cheek, gentle movement |
| Warmth / being moved | Soft expression, smile at the corners of the eyes | Warm gaze, gentle look | Corners of the mouth lifting, sincere expression |
| Loneliness / longing | Quiet look, faraway gaze | Vacant look, lost in thought | Calm expression, quiet temperament |
| Joy / elation | Radiant smile, bright eyes | Lively gaze, animated expression | Body leaning forward, light brisk movement |
| Tension / unease | Expression slightly stiff, brows faintly furrowed | Wandering gaze, uncertain look | Fingers clenched, tense movement |

---

## Lighting-atmosphere word bank (3D anime render)

### Light by time of day

| Time of day | Key-light word | Tone word | Atmosphere word |
|--------|--------|--------|---------|
| Early morning | Soft morning light, scattered light | Warm yellow tone + pale blue accents | Fresh feel, light coming through the window |
| Afternoon | Soft raking side light, diffused light | Mostly warm tone | Dappled light and shadow, warm feel |
| Dusk/sunset | Backlit sunset glow, orange afterglow | Warm orange + pink accents | Long shadows stretching, romantic feel |
| Night | Neon glow, local warm light | Warm orange keynote + cool accents | Urban feel, lighting layers |
| Indoor everyday | Warm side light, even and soft | Mostly warm yellow | Cosy feel, family atmosphere |
| Empty city shot | Diffused sunset glow, soft halo | Warm orange keynote | Open feel, urban aesthetic |

### Emotional lighting

| Emotional key | Light type | Supplementary constraint |
|----------|----------|---------|
| Heart-flutter/tenderness | Soft side light, warm-toned diffusion | Shallow depth of field, background slightly blurred |
| Sadness/loss | Cool-toned side light, low-key lighting | Keep partial dark areas on the face |
| Romance/sweetness | Backlit sunset glow, rim light | Warm halo, background slightly overexposed |
| Nostalgia/memory | Soft-focus warm light, hazing effect | Edges slightly blurred, soft overall |
| Everyday/cosy | Even diffused light, neutral warm tone | Soft light, no obvious shadow |
| Night/urban | Neon glow, warm/cool contrast | Light-dark contrast, clear layering |

---

## Scene texture constraint words (by scene type)

| Scene type | Constraint words that must be added |
|----------|-----------|
| Modern city | Fine architectural structure, high-rises, glass curtain walls, city skyline |
| Cafe/restaurant | Wooden tables and chairs, warm lighting, street view through the window, coffee-cup detail |
| Home space | Modern furniture, warm desk lamp, detail of everyday clutter, cosy atmosphere |
| Office | Glass partitions, desk, computer screen, modern office chair |
| Street/plaza | Asphalt road surface, street lamps, pedestrians, modern architecture |
| Mall/interior | Marble floor, glass display windows, commercial space, lighting fixtures |
| Park/greenery | Grass texture, tree shadows, benches, buildings in the distance |
| In a car/public transport | Seat fabric, window reflections, dashboard light, street view outside the window blurred |

---

## Fixed style anchor words (every output must contain them)

**3D anime anchoring (mandatory):**

3D animation render, cel-shaded texture, cinematic lighting, high-detail materials

**Outline and line (mandatory in every output):**

Clear outlines, bright cartoon rendering, outlines uniform and consistent, no broken lines no rough edges

**Material texture (mandatory when the shot involves material):**

High-detail materials, realistic material combined with cartoon proportions, clear material grain, fine surface texture

**Light-and-shadow layering (mandatory when the scene involves lighting):**

Soft light-and-shadow layering, clear light-dark contrast, soft natural light effect, warm tones dominant

**Atmosphere anchoring (mandatory):**

Joyful healing atmosphere, 3D anime aesthetic, warm emotional expression, modern urban character

**Image-quality lock words (every output must contain them, placed after the style ending):**

Mode A (English) — default:
8K ultra HD, clear lines, fine materials, full color, no stray color no noise in the frame

Mode A (English) — in-frame text scenes (when the shot description contains prop text such as a signboard or sign):
8K ultra HD, clear lines, fine materials, full color, no stray color no noise in the frame, prop text on signboards/signs clearly legible

Mode B (English) — default:
8K ultra HD, clear cel-shading, detailed materials, warm tones, no digital artifacts, no grain, no noise

Mode B (English) — in-frame text scenes:

8K ultra HD, clear cel-shading, detailed materials, warm tones, no digital artifacts, no grain, no noise

Mode B (English) — in-frame text scenes:

8K ultra HD, clear cel-shading, detailed materials, warm tones, no digital artifacts, no grain, no noise, legible text on signs and props

**Negative-word template (mode B must contain it, placed at the end of the prompt):**

> ⚠️ Seedream (mode A) **does not support negative prompts**; negative words apply to mode B only. Mode A guarantees image quality through the texture anchoring and image-quality lock words in the positive prompt.

Mode B (English):
no photorealism, no realistic rendering, no CG realism, no dark tones, no heavy shading, no oversaturated colors, no neon colors, no cyberpunk, no sci-fi elements, no futuristic design, no plastic look, no cartoon flat coloring without depth

---

## Aesthetic prohibitions (avoid strictly when generating)

The following words/styles must not appear in the output prompt:

- ❌ Photorealistic rendering/photo-level realism style
- ❌ Dark tone/heavy shadow/over-contrasted style
- ❌ Highly saturated fluorescent colors/neon color systems
- ❌ Missing modern elements (a modern setting must be stated explicitly)
- ❌ Deformation descriptions such as cartoon proportions, big eyes, chibi
- ❌ Cyberpunk/steampunk/invented Western-fantasy elements
- ❌ Text overlaid outside the picture (subtitles, watermarks, title cards, narration overlays and other UI-layer text — the frame must be purely visual)

> 💡 **Exception**: prop text inside the story world (signboards, road signs, markers, books and other text naturally present in the scene) is **not covered by the prohibition**. When the storyboard shot description contains such content, describe its presence faithfully and require the text to be clear.

---

## Complete generation example

> Below is a side-by-side demonstration of mode A and mode B for the same input; in actual use **output only one of them**.

### Input (storyboard table row data)

| 序号 | Shot description | Scene | Associated asset names | Duration | Shot size | Camera movement | Character action | Emotion | Lighting and atmosphere |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | On a street at dusk, a girl stands at the corner, the sunset glow falling on her hair | Street | 女孩 | 5s | 中景 | 缓推 | Carrying a shopping bag, turned sideways, smiling into the distance | Anticipation / warmth | Dusk sunset glow + warm side light |

### Example output A (mode A · Seedream)

[Prompt]
3D animation render, cel-shaded texture, cinematic lighting, high-detail materials, 中景 medium shot composition, the character framed from the waist up, clear outlines, bright cartoon rendering, outlines uniform and consistent, no broken lines no rough edges, high-detail materials, realistic material combined with cartoon proportions, clear material grain, fine surface texture, on a street at dusk, a girl stands at the corner, carrying a shopping bag, turned sideways, smiling into the distance, eyes full of anticipation and warmth, the sunset glow falling on her hair, backlit sunset glow, warm orange keynote, pink accents, soft light-and-shadow layering, clear light-dark contrast, soft natural light effect, joyful healing atmosphere, 3D anime aesthetic, warm emotional expression, modern urban character, 8K ultra HD, clear lines, fine materials, full color, no stray color no noise in the frame.
Based on the reference image of 女孩, maintain consistent: face features, hairstyle, costume details. Generate a new scene: standing on a street corner at sunset, holding a shopping bag, smiling gently at the distance. Keep character appearance identical to reference.

### Example output B (mode B · Nanobanana)

```xml
<role>
You are a 3D animation storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: 女孩 — long brown hair, gentle eyes, modern casual outfit, slim body shape
</character_reference>
<continuity_rules>
- Same wardrobe, hairstyle, face features across ALL shots
- Same environment, lighting style, color grade
- Only framing, angle, action, expression may change
- Do NOT introduce new characters not in reference images
</continuity_rules>
<shot>
Medium shot, character standing on a street corner at sunset, holding a shopping bag with one hand, smiling gently at the distance, eyes filled with expectation and warmth, sunset backlight on hair, warm cel-shading, detailed materials, clear outline lines, cinematic lighting, warm tones, soft shallow depth of field, modern urban aesthetic, healing atmosphere, high-quality 3D animation, 8K ultra HD, clear line art, detailed materials, no digital artifacts, no grain.
</shot>
<negative>
no photorealism, no realistic rendering, no CG realism, no dark tones, no heavy shading, no oversaturated colors, no neon colors, no cyberpunk, no sci-fi elements, no futuristic design, no plastic look, no cartoon flat coloring without depth
</negative>
```

## Quick reference card

### Emotion → frame word quick lookup

| Emotion | Face keywords | Light match |
|------|-----------|---------|
| Heart-flutter | Corners of the mouth lifting, cheeks slightly flushed | Backlit sunset glow, warm tone |
| Sadness | Downcast look, eye rims slightly red | Cool-toned side light, low key |
| Tenderness | Soft look, gentle brows and eyes | Even diffused warm light |
| Romance | Attentive gaze, affectionate look | Backlit warm-toned halo |
| Being moved | Smile at the corners of the eyes, sincere expression | Warm-toned side light, soft |
| Loneliness | Quiet look, vacant gaze | Cool-toned side light, dark areas |
| Joy | Radiant smile, bright eyes | Warm-toned diffused light |
| Sweetness | Bright gaze, lively expression | Backlit rim light |