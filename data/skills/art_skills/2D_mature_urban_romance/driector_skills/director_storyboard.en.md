---
name: director_storyboard
description: Director storyboard prompt techniques · Mature Urban Romance Animation
metaData: director_skills
---

# Anime Director Storyboard Prompt Techniques · Mature Urban Romance Animation

---

## 1. Emotion → face/gaze word mapping

| Emotion input | Face words | Gaze words | Micro-expression supplement |
|----------|--------|--------|-----------|
| Heart-flutter / stirring | Faintly flushed face, slightly dazed look | Eyes full of feeling, gaze lingering | Corner of the mouth lifting, expression restrained |
| Sorrow / oppression | Quiet face, grieving look | Rims of the eyes faintly red, gaze lowered | Brows lightly knitted, look held in |
| Anger / pressure | Sharp brows and eyes, cold stern look | Gaze like a blade, forceful eyes | Lip line tightening, oppressive presence |
| Tenderness / deep devotion | Gentle look, brows and eyes full of feeling | Focused soft gaze, eyes full of devotion | Corner of the mouth lifting lightly, expression restrained and warm |
| Resolve / finality | Solemn look, composed face | Firm gaze, clear cold eyes | Brows and eyes calm, bearing austere |
| Surprise / shock | Slightly stunned look, color shifting on the face | Eyes widening, gaze suddenly gathering | Tip of the brow lifting, lips slightly parted |
| Coldness / detachment | Cool distant face, indifferent look | Empty distant gaze, icy eyes | Expression almost frozen, ascetic bearing |
| Joy / elation | Vivid look, brimming with a smile | Bright lively eyes, crescent-moon outer corners | Corners of the mouth rising, expression vivid and natural |
| Tension / panic | Slightly bewildered expression, flustered manner | Wavering gaze, eyes darting around | Brow centre faintly furrowed, expression vivid and true |
| Restraint / holding back | Look held in, quiet face | Deep gaze, emotion suppressed behind the eyes | Lip line tightening, throat moving slightly |

---

## 2. Lighting and atmosphere word bank (Mature Urban Romance Animation)

### Light by time of day

| Time of day | Key-light words | Tonal words | Atmosphere words |
|--------|--------|--------|--------|
| Early morning | Diffuse morning light, scattered soft light | Cool white light tone, pale blue tone | Thin mist spreading, sense of air, dew-like texture |
| Afternoon | Soft angled side light, diffuse scattered light | Neutral tone, lightly warm tone | Dappled light and shadow, distinct layers |
| Evening/dusk | Cool-toned side-backlight, slanting afterglow | Cool tone dominant, local warm-light accents | Long shadows stretching, poetic light, rim light |
| Night | Cool blue moonlight, local warm candle points | Cool blue keynote | Deep light and shadow, strong light-dark contrast |
| Overcast rain | Diffuse cool light, no key source | Gray cool tone | Damp air, low saturation |

### Lighting by emotion

| Emotional keynote | Light type | Additional constraints |
|----------|----------|----------|
| Heart-flutter/tenderness | Soft side-backlight, local scattered warm light | Rim light tracing the outline, shallow depth of field softening the background |
| Confrontation/pressure | Hard side light, high-contrast strong lighting | Hard shadows, obvious light-dark division |
| Oppression/sorrow | Diffuse cool light, top light or cool side light | Low-key lighting, part of the face left in shadow |
| Mystery/solemnity | Cool blue side light, backlit silhouette | Halo controlled, edge light precise |
| Ethereal/atmospheric | Scattered soft light, slight backlight overexposure | A sense of aerial perspective, distance thin and hazy |

---

## 3. Scene texture constraint words (by scene type)

| Scene type | Constraint words to add |
|----------|-----------|
| Modern apartment | Sofa/TV/bed/kitchen, clear modern furniture texture, floor reflections, curtain drape |
| Business office | Desk/computer/documents/bookshelf, modern office materials, glass-partition reflections |
| Cafe | Tables and chairs/coffee cup/counter/window, wood grain, glass texture, warm lamps |
| City street | Street lamps/crosswalk/buildings/vehicles, modern urban materials, night lighting, aerial perspective |
| Park green space | Trees/benches/lawn/paths, natural materials, dappled light, sense of air |
| Campus scene | Teaching building/sports ground/trees/benches, campus materials, youthful atmosphere, natural light |
| Hotel room | Bed/bathroom/TV/nightstand, hotel materials, comfortable and modern, warm-light atmosphere |

---

## 4. Fixed style anchor words (every output must contain them)

**Anime style anchoring (mandatory):**

anime style, cel shading, clean lines, cinema-level composition, dramatic low-key lighting,

**Character texture (mandatory when the shot contains a character):**

finely rendered features, delicate skin, refined features, distinctly layered strands, finely rendered strands

**Clothing texture (mandatory when the shot contains a character):**

clear fabric texture on the garment, ultra-crisp texture detail, real fabric creases, clothing flowing with the movement

**Scene texture (mandatory when the shot contains a scene):**

clear scene material texture, aerial perspective, modern marks of use, lived-in feel, depth-of-field blur

**Consistency anchoring (mandatory in reference-image mode):**

keep the character's face consistent with the reference image, keep the clothing color scheme consistent with the reference image, keep the scene lighting style unified

**Style closing (fixed):**

mature urban romance animation style, modern-novel-adaptation animation, cinema-level storyboard composition

**Image-quality lock words (every output must contain them, placed after the style closing):**

### Mode A (English)

Default (when the frame needs no in-frame text):
ultra-sharp 4K image quality, high detail, natural sharpness, realistic clarity, no subtitles, no watermark, no title overlay in the frame

In-frame text scenes (when the shot description contains written text, scrolls, plaques and other prop text):
ultra-sharp 4K image quality, high detail, natural sharpness, realistic clarity, no subtitles, no watermark, no title overlay in the frame, text on scene props such as scrolls and plaques legible

### Mode B (English)

Default:
ultra-sharp 4K, high detail, crisp textures, naturalistic sharpness, photorealistic clarity, no subtitles, no captions, no watermark, no title overlay

In-frame text scenes:
ultra-sharp 4K, high detail, crisp textures, naturalistic sharpness, photorealistic clarity, no subtitles, no captions, no watermark, no title overlay, legible text on in-scene props such as scrolls and plaques

**Negative word template (mandatory for mode B, placed at the end of the prompt):**

> ⚠️ Seedream (mode A) **does not support negative prompts**; negative words apply to mode B only. Mode A guarantees image quality through the texture anchoring and image-quality lock words in the positive prompt.

Mode B (English):
no plastic skin, no beauty filter, no studio lighting, no centered composition, no oversaturation, no AI generated look, no motion blur, no noise, no blurry, no out of focus, no subtitles, no captions, no watermark, no title overlay, no UI text

---

## 5. Aesthetic prohibitions (avoid strictly when generating)

The following words/styles must not appear in the output prompt:

- ❌ Live-action realism/photography/3D-rendering words (such as: photorealistic, real photography, CGI)
- ❌ Guofeng/fantasy/sci-fi and any style other than modern elements
- ❌ Highly saturated fluorescent colors/neon colors
- ❌ Cartoon proportions, big eyes, chibi and other deformation descriptions (unless a specific style calls for them)
- ❌ Modern technology elements in frame (phone screens, computer interfaces, modern signage, etc.)
- ❌ Text overlaid outside the picture (subtitles, watermarks, title cards, narration overlays, opening titles and other UI-layer text — the frame must be purely visual)

> 💡 **Exception**: prop text inside the story world (a character writing, handwriting on a scroll, plaques, signboards, letters, prescriptions and other text naturally present in the scene) is **not covered by the prohibition**. When the storyboard shot description contains such content, describe its presence faithfully and require the text to be clear.

---

## 6. Complete generation example

> Below is a side-by-side demonstration of mode A and mode B for the same input; in actual use **output only one of them**.

### Input (storyboard table row data)

| 序号 | Shot description | Scene | Associated asset names | Duration | Shot size | Camera movement | Character action | Emotion | Lighting and atmosphere |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | 沈辞 stands alone at the apartment window, gazing out at the city night view | Apartment | 沈辞 | 4s | 全景 | 静止 | Standing with hands behind the back, gaze fixed out of the window | Tenderness / deep devotion | Cool-toned side-backlight at night |

### Example output A (mode A · Seedream)

[Prompt]
anime style, cel shading, clean lines, cinema-level composition, dramatic low-key lighting, 全景 wide shot composition, the character's full body in frame, finely rendered features, delicate skin, refined features, distinctly layered strands, finely rendered strands, the male lead standing at the apartment window, arms hanging naturally at his sides, gaze fixed out of the window, gentle look, focused soft gaze, eyes full of devotion, clear modern apartment materials, sofa/TV/bed/kitchen, clear modern furniture texture, floor reflections, curtain drape, cool-toned side-backlight at night, cool blue moonlight, deep light and shadow, strong light-dark contrast, mature urban romance animation style, modern-novel-adaptation animation, cinema-level storyboard composition, ultra-sharp 4K image quality, natural sharpness, realistic clarity, no subtitles, no watermark, no title overlay in the frame.
Based on the reference image of 沈辞, maintain consistent: face features, hairstyle, costume details. Generate a new scene: standing by the apartment window at night, gazing out at the city view. Keep character appearance identical to reference.

### Example output B (mode B · Nanobanana)

```xml
<role>
You are a cinematographer and storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: 沈辞 — black long hair, calm gentle eyes, modern casual clothing, tall slim body shape
</character_reference>
<continuity_rules>
- Same wardrobe, hairstyle, face features across ALL shots
- Same environment, lighting style, color grade
- Only framing, angle, action, expression may change
- Do NOT introduce new characters not in reference images
</continuity_rules>
<shot>
Full shot, character standing by the apartment window at night, gazing out at the city view, gentle and composed expression, focused eyes with deep emotion, cold dusk backlight, moonlight ambiance, dark interior with subtle light from outside, mature urban romance anime style, cel shading, ultra-sharp 4K, high detail, crisp textures, photorealistic clarity, no subtitles, no captions, no watermark, no title overlay.
</shot>
<negative>
no plastic skin, no beauty filter, no studio lighting, no centered composition, no oversaturation, no AI generated look, no motion blur, no noise, no blurry, no out of focus, no subtitles, no captions, no watermark, no title overlay, no UI text
</negative>
```

## Quick reference card

### Emotion → frame word quick lookup

| Emotion | Face keywords | Light match |
|------|-----------|----------|
| Heart-flutter | Faintly flushed face, eyes full of feeling | Soft side-backlight |
| Sorrow | Quiet face, rims of the eyes faintly red | Diffuse cool light |
| Anger | Sharp brows and eyes, gaze like a blade | Hard side light, high contrast |
| Tenderness | Brows and eyes full of feeling, soft gaze | Local scattered warm light |
| Resolve | Solemn look, clear cold eyes | Cool-toned side light |
| Coldness | Cool distant face, empty distant gaze | Cool blue side light |
| Restraint | Quiet face, suppression behind the eyes | Low-key cool light, shadow retained |
