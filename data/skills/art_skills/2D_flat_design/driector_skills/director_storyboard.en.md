---
name: director_storyboard
description: Director storyboard prompt techniques · 2D Flat Design
metaData: director_skills
---

# Storyboard Prompts · 2D Flat Design · Style-Specific Techniques

---

## Scope of use

This Skill is used only for storyboard prompt generation in the **2D Flat Design** style.

---

## Emotion → face/gaze word mapping

| Emotion input | Face word | Gaze word | Micro-expression supplement |
|----------|--------|--------|-----------|
| Heart-flutter / delight | Clean lines, orange color block | Round eyes, bright gaze | Simple smiling face, flattened |
| Sadness / loss | Clean lines, cool tone | Oval eyes, soft gaze | Corners of the mouth turned down, flattened |
| Surprise / curiosity | Round eyes, enlarged expression | Focused gaze, curious look | O-shaped mouth, flattened |
| Tenderness / deep affection | Soft lines, warm tone | Attentive gaze, gentle look | Corners of the mouth turned up, flattened |
| Resolve / courage | Straight lines, cool tone | Firm gaze, focused look | Clear expression, flattened |
| Shyness / bashfulness | Pink color block, rounded lines | Eyes cast down, not daring to look straight | Blush on the cheeks, flattened |
| Warmth / being moved | Warm-toned lines, soft expression | Warm gaze, gentle look | Corners of the mouth lifting, flattened |
| Loneliness / longing | Cool-toned lines, plain expression | Vacant gaze, lost in thought | Calm expression, flattened |
| Joy / elation | Round lines, bright expression | Eyes curved like crescents, lively expression | Light, brisk movement, flattened |
| Tension / unease | Lines turn thin, knitted-brow symbol | Eyes turn small, uncertain look | Tense hand position, flattened |

---

## Color-atmosphere word bank (flat style)

### Hue use

| Scene type | Main color word | Secondary color word | Atmosphere word |
|--------|--------|--------|---------|
| Everyday life | Bright blue + off-white | Warm orange accents | Clean feel, modern feel |
| Office space | Cool gray + cool blue | White + light gray | Rational, efficient feel |
| Leisure space | Warm orange + warm pink | Off-white + light yellow | Relaxed, comfortable feel |
| Romantic scene | Warm pink + warm orange | Off-white + light purple | Cosy, sweet feel |
| Night scene | Deep blue + purple | Warm yellow accents | Quiet, mysterious feel |
| Memory scene | Light yellow + light gray | Warm pink accents | Nostalgic, soft feel |

### Emotional color blocks

| Emotional key | Color-block type | Supplementary constraint |
|----------|----------|---------|
| Heart-flutter/tenderness | Warm contrasting color blocks | More negative space, main color stands out |
| Sadness/loss | Cool single color block | Lower saturation, larger negative space |
| Joy/energy | Multi-color contrasting color blocks | High saturation, rich color |
| Nostalgia/memory | Low-saturation single color block | Unified tone, more negative space |
| Everyday/cosy | Warm main color block | Soft contrast, moderate negative space |
| Night/quiet | Cool main color block | Warm accents, clear layering |

---

## Scene texture constraint words (by scene type)

| Scene type | Constraint words that must be added |
|----------|-----------|
| Flat character | Geometric shapes, clean lines, no shadow no gradient, solid color-block fill |
| Flat scene | Solid-color background, geometric shapes, simple structure, no texture no detail |
| Office space | Clean furniture, geometric shapes, cool tone, modern design feel |
| Home space | Minimalist furniture, warm tone, geometric lines, cosy atmosphere |
| Cityscape | Simplified buildings, geometric shapes, cool tone, modern urban feel |
| Natural environment | Geometric trees, solid-color grass, simple shapes, flattened nature |
| Traffic scene | Simplified vehicles, geometric shapes, cool tone, modern traffic feel |
| Interior space | Clean partitions, solid-color walls, geometric doors and windows, modern minimalist |

---

## Fixed style anchor words (every output must contain them)

**Flat style anchoring (mandatory):**

2D flat style, Flat Design, no shadow no gradient, solid color blocks, clean lines

**Color-block texture (mandatory in every output):**

Solid-color fill, no texture no gradient, geometric shapes, flattened design

**Outline and line (mandatory in every output):**

Clear outline, uniform and consistent lines, no broken lines no rough edges

**Color layering (mandatory in every output):**

Moderate color saturation, clear color-block contrast, no complex light-and-shadow layering

**Atmosphere anchoring (mandatory):**

Minimalist modern atmosphere, flat design aesthetic, clear emotional expression, modern visuals

**Image-quality lock words (every output must contain them, placed after the style ending):**

Mode A (English) — default:
High-definition image quality, clear lines, pure color, no stray color no noise in the frame, no shadow no gradient

Mode A (English) — in-frame text scenes (when the shot description contains prop text such as a signboard or sign):
High-definition image quality, clear lines, pure color, no stray color no noise in the frame, no shadow no gradient, prop text on signboards/signs clearly legible

Mode B (English) — default:
high-quality 2D flat design, clean lines, pure colors, no shadows, no gradients, no noise, no artifacts

Mode B (English) — in-frame text scenes:
high-quality 2D flat design, clean lines, pure colors, no shadows, no gradients, no noise, no artifacts, legible text on signs and props

**Negative-word template (mode B must contain it, placed at the end of the prompt):**

> ⚠️ Seedream (mode A) **does not support negative prompts**; negative words apply to mode B only. Mode A guarantees image quality through the texture anchoring and image-quality lock words in the positive prompt.

Mode B (English):
no 3D rendering, no photorealism, no shadows, no gradients, no textures, no realistic lighting, no realistic materials, no complex details, no detailed backgrounds, no realistic faces, no realistic hair, no realistic clothing

---

## Aesthetic prohibitions (avoid strictly when generating)

The following words/styles must not appear in the output prompt:

- ❌ Photorealistic rendering/photo-level realism style
- ❌ Words relating to shadow/gradient/texture
- ❌ Highly saturated fluorescent colors/over-contrasted color systems
- ❌ Descriptions of complex detail/fine texture
- ❌ 3D perspective/depth descriptions
- ❌ Realistic people/realistic clothing/realistic architecture
- ❌ Text overlaid outside the picture (subtitles, watermarks, title cards, narration overlays and other UI-layer text — the frame must be purely visual)

> 💡 **Exception**: prop text inside the story world (signboards, road signs, markers, books and other text naturally present in the scene) is **not covered by the prohibition**. When the storyboard shot description contains such content, describe its presence faithfully and require the text to be clear.

---

## Complete generation example

> Below is a side-by-side demonstration of mode A and mode B for the same input; in actual use **output only one of them**.

### Input (storyboard table row data)

| 序号 | Shot description | Scene | Associated asset names | Duration | Shot size | Camera movement | Character action | Emotion | Lighting and atmosphere |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | Two people meet in flat style, orange and blue color-block contrast, simple background | City | 角色A/B | 5s | 中景 | 静止 | Looking at each other and smiling, clean lines | Heart-flutter / warmth | Warm contrast + negative space |

### Example output A (mode A · Seedream)

[Prompt]
2D flat style, Flat Design, no shadow no gradient, solid color blocks, clean lines, 中景 medium shot composition, two flat characters framed from the waist up, solid-color fill, no texture no gradient, geometric shapes, flattened design, clear outline, uniform and consistent lines, no broken lines no rough edges, moderate color saturation, clear color-block contrast, no complex light-and-shadow layering, two people meet in flat style, orange and blue color-block contrast, simple background, looking at each other and smiling, clean lines, bright gaze, warm contrast, plenty of negative space, minimalist modern atmosphere, flat design aesthetic, clear emotional expression, modern visuals, high-definition image quality, clear lines, pure color, no stray color no noise in the frame, no shadow no gradient.
Based on the reference image of 角色A/B, maintain consistent: face features, hairstyle, costume details. Generate a new scene: two flat characters meeting in city, orange and blue color block contrast, simple background, smiling and looking at each other. Keep character appearance identical to reference.

### Example output B (mode B · Nanobanana)

```xml
<role>
You are a 2D flat design storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: 角色A/B — flat design characters, geometric shapes, simple lines, pure colors
</character_reference>
<continuity_rules>
- Same color palette, face features, hairstyle across ALL shots
- Same environment, background color, geometric style
- Only framing, angle, action, expression may change
- Do NOT introduce new characters not in reference images
</continuity_rules>
<shot>
Medium shot, two flat characters meeting in city, orange and blue color block contrast, simple background, smiling and looking at each other, geometric shapes, simple lines, pure colors, no shadows, no gradients, clean lines, high-quality 2D flat design, no noise, no artifacts.
</shot>
<negative>
no 3D rendering, no photorealism, no shadows, no gradients, no textures, no realistic lighting, no realistic materials, no complex details, no detailed backgrounds, no realistic faces, no realistic hair, no realistic clothing
</negative>
```

## Quick reference card

### Emotion → frame word quick lookup

| Emotion | Face keywords | Color match |
|------|-----------|---------|
| Heart-flutter | Rounded lines, orange color block | Warm pink + warm orange contrast |
| Sadness | Straight lines, cool tone | Cool blue + gray single color |
| Tenderness | Soft lines, warm tone | Warm yellow + off-white, soft |
| Romance | Curved lines, pink tone | Warm pink + warm orange contrast |
| Being moved | Upward lines, warm tone | Warm orange + warm yellow as main colors |
| Loneliness | Cool-toned lines, plain expression | Cool blue + purple single color |
| Joy | Round lines, bright expression | Warm orange + yellow contrast |
