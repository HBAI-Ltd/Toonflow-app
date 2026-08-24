---
name: director_storyboard
description: Director storyboard prompt techniques · Guofeng anime new Guochao
metaData: director_skills
---

# Storyboard Prompt · Guofeng Anime New Guochao · Style-Specific Techniques

---

## Scope of use

This Skill is used solely for generating storyboard prompts in the **Guofeng anime new Guochao** style.

---

## Emotion → face/gaze word mapping

| Emotion input | Face words | Gaze words | Micro-expression addition |
|----------|--------|--------|-----------|
| Tender / deeply affectionate | Tender expression, feeling in the brows and eyes | Focused gentle gaze, warm look | Corners of the mouth lifted slightly, healing expression |
| Resolute / brave | Serious expression, bright clear look | Firm gaze, looking straight ahead | Chin lifted slightly, decisive expression |
| Shy / bashful | Cheeks flushed, eyes darting away | Shy gaze, eyes lowered | Lips pressed lightly, cute expression |
| Sharp / severe | Cold stern expression, gaze like a blade | Keen gaze, firm look | Jaw tightened, imposing expression |
| Joyful / cheerful | Radiant expression, eyes curving like crescents | Bright gaze, lively look | Cheeks slightly red, vivid expression |
| Sorrowful / lamenting | Lamenting expression, dimmed eyes | Tearful gaze, eyes lowered | Corners of the mouth sinking, grieving expression |
| Surprised / pleasantly surprised | Eyes slightly widened, vivid expression | Bright gaze, focused look | Mouth slightly open, startled expression |
| Pensive / introspective | Faint expression, distant look | Unfocused gaze, eyes out of focus | Calm expression, reserved temperament |
| Weary / listless | Hazy gaze, soft expression | Look slightly weary, gaze soft | A slight yawn, languid expression |
| Expectant / hopeful | Eyes lighting up, lively expression | Expectant gaze, look flickering | Corners of the mouth lifted, vivid expression |

---

## Lighting and atmosphere vocabulary (Guofeng anime new Guochao)

### Light by time of day

| Time of day | Key-light words | Tone words | Atmosphere words |
|--------|--------|--------|--------|
| Early morning | Soft morning light, warm raking light | Moon white + blue-green | Thin mist drifting, fresh air |
| Midday | Bright sunlight, direct soft light | Vermilion + golden yellow highlights | Clear light and shadow, vivid color |
| Evening/dusk | Backlit silhouette, warm gradient | Vermilion + indigo gradient | The afterglow of sunset, rim light |
| Night | Cool background + warm accents | Indigo keynote + warm yellow points of light | Serene and warm, soft lamplight |
| Rainy day | Diffused cool light, no key light | Blue-green + moon white | Damp air, low contrast |

### Emotional lighting

| Emotional keynote | Light type | Additional constraint |
|----------|----------|----------|
| Xianxia ethereal | Diffused soft light, flowing motion | Blue-green tone, depth-of-field softening, cel-shaded flat coloring |
| Courtly splendor | Warm lighting, local highlights | Vermilion tone, emphasized highlights, layered depth of field |
| Everyday girlhood | Local soft light, soft shadows | Rouge tone, medium close-up (近景) and close-up (特写), fresh atmosphere |
| Wuxia severity | Cool-toned shadow, hard-light contrast | Indigo + ink black, low saturation, tense atmosphere |
| Poetic moonlit night | Moonlight lighting, warm-cool contrast | Indigo background, warm accents, exquisite atmosphere |

---

## Scene texture constraint words (by scene type)

| Scene type | Constraint words that must be added |
|----------|-----------|
| Xianxia scene | Cloud and mist curling, flying eaves and pavilions, flowing sleeves and robes, blue-green landscape, cel-shaded flat coloring |
| Court scene | Vermilion palace walls, gilded glazed roofs, carved beams and painted rafters, white marble balustrades, new Guochao ornament |
| Lady's chamber interior | Screens and lattice doors, carved window lattice, gauze drapes and bed curtains, classical furniture, delicate brushwork |
| Wuxia scene | Bamboo grove/snowfield/cliff, cool tone, oppressive atmosphere, sharp lines, new Guochao style |
| Festival celebration | Lanterns/streamers/fireworks, highly saturated warm color, lively atmosphere, bustling crowd |
| Night street scene | Lanterns/street lamps/shops, warm accents, cool background, reflections, Japanese-style rendering |

---

## Fixed style anchor words (every output must contain them)

**Guofeng anime anchoring (mandatory):**

Guofeng anime, new Guochao aesthetic, Japanese anime rendering, cel-shaded flat coloring, delicate brushwork

**Character texture (mandatory when the shot contains a character):**

Anime Guofeng silhouette, clear lines, cel shading, refined clothing detail, richly layered light and shadow

**Scene texture (mandatory when the shot contains a scene):**

Guofeng anime scene, rich traditional architectural detail, Japanese-style rendering technique, delicate light-and-shadow texture

**Consistency anchoring (mandatory in reference-image mode):**

Keep the character silhouette consistent with the reference image, keep the scene style consistent with the reference image, keep the light and color keynote unified

**Style ending (fixed):**

Guofeng anime cinematic texture, Eastern classical charm, new Guochao style, Japanese anime rendering technique

**Image-quality lock words (every output must contain them, placed after the style ending):**

Mode A (English) — default (when the frame needs no in-frame text):
Guofeng anime high-definition rendering, high detail, delicate lines, cel-shaded flat feel, cinematic texture, no subtitles, no watermark, no title overlay in the frame

Mode A (English) — in-frame text scenes (when the shot description contains prop text such as a plaque, a couplet or a book):
Guofeng anime high-definition rendering, high detail, delicate lines, cel-shaded flat feel, cinematic texture, no subtitles, no watermark, no title overlay in the frame, text on scene props such as plaques and couplets clearly legible

Mode B (English) — default:
Chinese style anime, neo-chic aesthetic, Japanese animation rendering technique, cel shading, fine brushstrokes, cinematic quality, high detail, no subtitles, no captions, no watermark, no title overlay

Mode B (English) — in-frame text scenes:
Chinese style anime, neo-chic aesthetic, Japanese animation rendering technique, cel shading, fine brushstrokes, cinematic quality, high detail, no subtitles, no captions, no watermark, no title overlay, legible text on in-scene props such as plaques and couplets

**Negative-word template (mode B must contain it, placed at the end of the prompt):**

> ⚠️ Seedream (mode A) **does not support negative prompts**; negative words apply to mode B only. Mode A guarantees image quality through the texture anchoring and image-quality lock words in the positive prompt.

Mode B (English):
no photorealistic, no realistic photography, no 3D render, no low-poly, no rough modeling, no plastic texture, no harsh lines, no western fantasy, no cyberpunk, no sci-fi, no modern elements, no cartoon style without anime quality, no subtitles, no captions, no watermark, no title overlay, no UI text

---

## Aesthetic prohibitions (avoid strictly when generating)

The following words/styles must not appear in the output prompt:

- ❌ Photorealistic photography/3D photorealistic rendering/photo-level realism words
- ❌ Highly saturated fluorescent colors/neon colors/strongly digital feel
- ❌ Western fantasy/cyberpunk/excessively modern elements
- ❌ Crude linework/blurry image quality/low-precision modeling
- ❌ Cartoon/anime/anime-style but without refinement
- ❌ Flat design/no anime sense of depth
- ❌ Chaotic color/wrong light and shadow/wrong perspective
- ❌ Modern architecture/modern clothing elements

> 💡 **Exception**: certain modern rendering techniques (volumetric light, depth-of-field softening) may be used reasonably, but the Guofeng anime aesthetic keynote must hold.

---

## Complete generation example

> Below is a side-by-side demonstration of mode A and mode B for the same input; in actual use **output only one of them**.

### Input (storyboard table row data)

| 序号 | Shot description | Scene | Associated asset names | Duration | Shot size | Camera movement | Character action | Emotion | Lighting and atmosphere |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | An ancient-dress girl stands before the palace, holding a flowering branch, her gaze tender | Palace | 古装少女 | 6s | 中景 | 缓推 | Turned sideways holding the flowers, gaze tender | Gentle / elegant | Warm lighting |

### Example output A (mode A · Seedream)

[Prompt]
Guofeng anime, new Guochao aesthetic, Japanese anime rendering, cel-shaded flat coloring, delicate brushwork, anime Guofeng silhouette, clear lines, cel shading, refined clothing detail, richly layered light and shadow, 中景 medium shot composition, an ancient-dress girl stands before the palace, holding a flowering branch turned sideways, tender expression, tender gaze, vermilion palace wall background, golden yellow highlight accents, volumetric light atmosphere, depth-of-field softening, Guofeng anime cinematic texture, Eastern classical charm, new Guochao style, Japanese anime rendering technique, Guofeng anime high-definition rendering, high detail, delicate lines, cel-shaded flat feel, cinematic texture, no subtitles, no watermark, no title overlay in the frame.
Based on the reference image of 古装少女，maintain consistent: face features, hairstyle, costume details. Generate a new scene: standing in front of palace at dusk, holding flower branch. Keep visual style identical to reference.


### Example output B (mode B · Nanobanana)

```xml
<role>
You are an anime storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: 古装少女 — 国风二次元造型，典雅服饰，新国潮美学
</character_reference>
<continuity_rules>
- Same outfit, hairstyle, face features across ALL shots
- Same cel shading style, Japanese animation rendering
- Same scene lighting, Chinese anime aesthetic
- Do NOT introduce photorealistic or western fantasy elements
</continuity_rules>
<shot>
Medium shot, ancient Chinese girl in elegant traditional attire standing before palace, holding flower branch, gentle expression, soft gaze, cinematic lighting, volumetric fog, depth of field blur, cel shading with fine brushstrokes, Chinese style anime, neo-chic aesthetic, Japanese animation rendering technique, high detail, no subtitles, no captions, no watermark, no title overlay.
</shot>
<negative>
no photorealistic, no realistic photography, no 3D render, no low-poly, no rough modeling, no plastic texture, no harsh lines, no western fantasy, no cyberpunk, no sci-fi, no modern elements, no cartoon style without anime quality, no subtitles, no captions, no watermark, no title overlay, no UI text
</negative>
```

## Quick reference card

### Emotion → frame word quick lookup

| Emotion | Face keywords | Matching light |
|------|-----------|---------|
| Tender | Tender expression, focused gaze | Diffused soft light + warm light |
| Resolute | Serious expression, bright clear look | Warm raking light + clear silhouette |
| Shy | Cheeks flushed, eyes darting away | Warm raking light + blush |
| Sharp | Cold stern expression, gaze like a blade | Cool-toned shadow + hard light |
| Joyful | Radiant expression, eyes curving like crescents | Warm lighting + high saturation |
| Sorrowful | Lamenting expression, dimmed eyes | Cool-toned shadow + low contrast |
| Weary | Hazy gaze, soft expression | Soft light + low contrast |
| Pensive | Faint expression, distant look | Volumetric light + mist |
| Expectant | Eyes lighting up, lively expression | Warm raking light + high brightness |
