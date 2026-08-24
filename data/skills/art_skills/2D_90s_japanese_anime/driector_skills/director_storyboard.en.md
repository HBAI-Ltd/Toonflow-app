---
name: director_storyboard
description: Director storyboard prompt techniques · 1990s Japanese anime texture
metaData: director_skills
---

# Storyboard Prompts · 1990s Japanese Anime · Style-Specific Techniques

---

## Scope of use

This Skill is used solely for generating storyboard prompts in the **1990s Japanese anime texture** style.

---

## Emotion → face/gaze word mapping

| Emotion input | Face words | Gaze words | Micro-expression addition |
|----------|--------|--------|-----------|
| Heart-flutter / delight | Corners of the mouth lifted, cheeks slightly flushed | Bright gaze, gentle look | Eyes curved like crescents, expression restrained |
| Sadness / loss | Downcast look, rims of the eyes slightly red | Dulled gaze, wandering look | Slight furrow between the brows, expression held in |
| Surprise / shock | Momentarily blank look, eyes widened | Startled gaze, concentrated look | Brows raised, expression vivid |
| Tenderness / deep feeling | Soft look, gentle brows and eyes | Focused gaze, look full of feeling | Corners of the mouth lifted slightly, expression warm and restrained |
| Resolve / determination | Serious look, firm gaze | Clear look, focused gaze | Determined expression, bright temperament |
| Shyness / bashfulness | Cheeks flushed, gaze darting away | Eyes lowered, not daring to look straight on | Fingers lightly touching the cheek, expression natural |
| Warmth / being moved | Soft expression, a smile at the corners of the eyes | Warm gaze, gentle look | Corners of the mouth lifted, expression sincere |
| Loneliness / longing | Quiet look, distant gaze | Unfocused look, lost in thought | Calm expression, quiet temperament |
| Happiness / excitement | Radiant smile, eyes curved like crescents | Bright gaze, vivid expression | Both arms opened, movement light |
| Tension / unease | Slightly stiff expression, brows lightly knitted | Wandering gaze, uncertain look | Fingers pinching the hem of the clothes, movement natural |

---

## Light-atmosphere word bank (1990s Japanese anime)

### Light by time of day

| Time of day | Key-light words | Tone words | Atmosphere words |
|--------|--------|--------|---------|
| Early morning | Soft morning light, scattered rays | Warm yellow tone + pale blue accents | Fresh feel, light coming through the leaves |
| Afternoon | Soft oblique side light, diffused rays | Warm tone dominant | Dappled light and shadow, a sense of warmth |
| Dusk/sunset | Warm backlight, orange afterglow | Amber warmth + pink accents | Shadows stretched long, a sense of nostalgia |
| Night | Cool moonlight, local warm light | Pale blue keynote + warm accents | A sense of stillness, layered light and shadow |
| Rainy day | Diffused cool light, even and soft | Gray-blue tone + local warm color | A sense of wetness, a sense of freshness |
| Memory/flashback | Soft-focus warm light, haze effect | Warm yellow dominant, slightly faded | A sense of nostalgia, blurred edges |

### Emotional light

| Emotional keynote | Light type | Additional constraint |
|----------|----------|---------|
| Heart-flutter/tenderness | Soft side light, warm diffusion | Shallow depth of field, background slightly blurred |
| Sadness/loss | Cool side light, low-key lighting | Local dark areas kept on the face |
| Nostalgia/memory | Soft-focus warm light, haze effect | Edges slightly blurred, soft overall |
| Romance/sweetness | Warm backlight, rim light | Warm halo, background slightly overexposed |
| Everyday/warmth | Even diffused light, neutral warm tone | Soft light, no pronounced shadow |
| Night/stillness | Cool moonlight, local warm light | Light-and-dark contrast, clear layering |

---

## Scene texture constraint words (by scene type)

| Scene type | Constraint words to add |
|----------|-----------|
| Japanese school | Wood floor grain, chalk writing on the blackboard, green trees outside the window, latticed classroom windows |
| Japanese home | Tatami texture, wooden frames of sliding doors, warm lamplight, washitsu layout |
| Street/square | Stone paving, utility poles, convenience-store signboards, parked bicycles |
| Cafe/restaurant | Wooden tables and chairs, warm pendant lights, street view outside the window, coffee-cup detail |
| Park/green space | Grass texture, tree shadows, benches, buildings in the distance |
| Train/carriage | Seat fabric, reflections on the windows, scenery outside, hanging-strap detail |
| Bedroom/private space | Creases in the bedding, warm light of the desk lamp, stationery on the desk, a lived-in feel |
| Shrine/temple | Wooden torii pillars, stone paving, maple leaves/cherry blossoms, incense smoke |

---

## Fixed style anchor words (every output must contain them)

**1990s anime anchoring (mandatory):**

1990s Japanese anime style, hand-drawn texture, flat coloring, clear fluid linework, soft warm tones

**Line texture (mandatory in every output):**

Fine fluid linework, clear outlines, uniform and consistent lines, no broken lines no rough edges

**Coloring texture (mandatory when the shot contains characters):**

Flat coloring, even color, no pronounced gradient, moderate color saturation

**Light-and-shadow layering (mandatory when the scene contains light and shadow):**

Cinematic light-and-shadow layering, clear light-and-dark contrast, soft natural light effects

**Atmosphere anchoring (mandatory):**

Nostalgic healing atmosphere, Japanese anime aesthetic, warm emotional expression

**Image-quality lock words (every output must contain them, placed after the style ending):**

Mode A (English) — default:
High-definition image quality, clear lines, even coloring, soft color, no stray color no noise in the frame

Mode A (English) — in-frame text scenes (when the shot description contains prop text such as a signboard or sign):
High-definition image quality, clear lines, even coloring, soft color, no stray color no noise in the frame, prop text on signboards/signs clearly legible

Mode B (English) — default:
high-quality 90s anime style, clear line art, even flat coloring, soft warm tones, no noise, no grain, no digital artifacts

Mode B (English) — in-frame text scenes:
high-quality 90s anime style, clear line art, even flat coloring, soft warm tones, no noise, no grain, no digital artifacts, legible text on signs and props

**Negative-word template (mode B must contain it, placed at the end of the prompt):**

> ⚠️ Seedream (mode A) **does not support negative prompts**; negative words apply to mode B only. Mode A guarantees image quality through the texture anchoring and image-quality lock words in the positive prompt.

Mode B (English):
no modern anime style, no digital 3D rendering, no CG animation, no cel-shading, no heavy shading, no gradient fills, no plastic look, no oversaturated colors, no neon colors, no cyberpunk, no sci-fi elements, no futuristic design

---

## Aesthetic prohibitions (avoid strictly when generating)

The following words/styles must not appear in the output prompt:

- ❌ Modern Japanese anime style (such as late Makoto Shinkai or MAPPA style)
- ❌ Words related to 3D rendering/CG animation/digital painting
- ❌ Highly saturated fluorescent colors/neon color families
- ❌ Modern clothing/modern architectural elements
- ❌ Heavy shadow/excessive contrast/dark gloomy style
- ❌ Cartoon proportions, big eyes, chibi and other deformation descriptions
- ❌ Cyberpunk/steampunk/invented Western-fantasy elements
- ❌ Text overlaid outside the story (subtitles, watermarks, title cards, narration captions and other UI-layer text; the frame must be purely visual)

> 💡 **Exception**: prop text inside the story world (signboards, street signs, markings, books and other text that naturally exists in the scene) **is not within the prohibition**. When the storyboard shot description contains such content, describe its presence faithfully and require the text to be clear.

---

## Complete generation example

> Below is the same input shown side by side in mode A and mode B; in actual use **output only one of them**.

### Input (storyboard table row data)

| 序号 | Shot description | Scene | Associated asset names | Duration | Shot size | Camera movement | Character action | Emotion | Lighting and atmosphere |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | On the 浅草站 platform, the afterglow of sunset falls on the girl | Train station | 浅草站 | 5s | 中景 | 缓推 | Carrying a school bag, turned to the side, smiling into the distance | Anticipation / warmth | Warm dusk backlight |

### Example output A (mode A · Seedream)

[Prompt]
1990s Japanese anime style, hand-drawn texture, flat coloring, clear fluid linework, soft warm tones, 中景 medium shot composition, character framed from the waist up, fine fluid linework, clear outlines, uniform and consistent lines, no broken lines no rough edges, flat coloring, even color, no pronounced gradient, moderate color saturation, a girl standing on the 浅草站 platform, carrying a school bag, turned to the side and smiling into the distance, gaze full of anticipation and warmth, warm dusk backlight, shadows stretched long, nostalgic atmosphere, clear wooden platform texture, utility poles in the background, cinematic light-and-shadow layering, clear light-and-dark contrast, soft natural light effects, nostalgic healing atmosphere, Japanese anime aesthetic, warm emotional expression, high-definition image quality, clear lines, even coloring, soft color, no stray color no noise in the frame.
Based on the reference image of 女孩, maintain consistent: face features, hairstyle, costume details. Generate a new scene: standing on a train station platform at sunset, holding a school bag, smiling at the distance. Keep character appearance identical to reference.

### Example output B (mode B · Nanobanana)

```xml
<role>
You are a 90s anime storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: 女孩 — black long hair in twin tails, gentle eyes, school uniform, slim body shape
</character_reference>
<continuity_rules>
- Same wardrobe, hairstyle, face features across ALL shots
- Same environment, lighting style, color grade
- Only framing, angle, action, expression may change
- Do NOT introduce new characters not in reference images
</continuity_rules>
<shot>
Medium shot, character standing on a train station platform at sunset, holding a school bag with one hand, smiling gently at the distance, eyes filled with expectation and warmth, warm sunset backlight, long shadows, nostalgic atmosphere, wooden platform texture visible, electric poles in background, cinematic lighting layers, clear contrast between light and dark, soft natural light effects, healing anime aesthetic, high-quality 90s anime style, clear line art, even flat coloring, soft warm tones, no noise, no grain, no digital artifacts.
</shot>
<negative>
no modern anime style, no digital 3D rendering, no CG animation, no cel-shading, no heavy shading, no gradient fills, no plastic look, no oversaturated colors, no neon colors, no cyberpunk, no sci-fi elements, no futuristic design
</negative>
```

## Quick reference card

### Emotion → frame word quick lookup

| Emotion | Face keywords | Light match |
|------|-----------|---------|
| Heart-flutter | Cheeks slightly flushed, eyes curved like crescents | Soft warm side light |
| Sadness | Downcast look, rims of the eyes slightly red | Cool low-key side light |
| Tenderness | Soft look, gentle brows and eyes | Even diffused warm light |
| Nostalgia | Calm expression, distant gaze | Soft-focus warm light with haze |
| Being moved | A smile at the corners of the eyes, sincere expression | Warm backlight halo |
| Loneliness | Quiet look, unfocused gaze | Cool side light with dark areas |
| Happiness | Radiant smile, bright eyes | Even diffused warm light |
