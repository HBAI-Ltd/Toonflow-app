---
name: director_storyboard
description: Director storyboard prompt techniques · live-action urban realism
metaData: director_skills
---

# Storyboard Prompt · Live-Action Urban Realism · Style-Specific Techniques

---

## Scope of use

This Skill is used only for generating storyboard prompts in the **live-action urban realism** style.

---

## Emotion → face/gaze word mapping

| Emotion input | Face words | Gaze words | Micro-expression supplement |
|----------|--------|--------|-----------|
| Heart-flutter / delight | corners of the mouth lifted, a smile in the eyes | bright eyes, focused gaze | cheeks faintly flushed, natural expression |
| Sadness / loss | calm complexion, downcast look | dimmed eyes, wandering gaze | brows lightly knitted, restrained expression |
| Anger / pressure | sharp brows and eyes, cold hard look | blazing gaze, forceful eyes | lip line tightened, oppressive presence |
| Tenderness / deep affection | soft look, gentle brows and eyes | focused eyes, affectionate gaze | corners of the mouth lifted slightly, restrained warm expression |
| Resolve / finality | serious look, composed face | firm eyes, clear cold gaze | calm brows and eyes, capable air |
| Surprise / shock | momentarily blank look, complexion shifting | eyes widening, gaze snapping into focus | brow tips lifted, lips slightly parted |
| Coldness / distance | cold face, indifferent look | distant empty eyes, gaze without a ripple | expression almost frozen, detached air |
| Joy / elation | vivid look, radiant smile | bright lively eyes, eyes curved with laughter | corners of the mouth up, expression vivid and natural |
| Tension / panic | slightly bewildered expression, flustered bearing | drifting eyes, gaze darting around | brows faintly knitted, expression vivid and true |
| Endurance / restraint | restrained look, calm face | deep eyes, emotion held down behind them | lip line tightened, Adam's apple moving slightly |

---

## Lighting and atmosphere word bank (live-action urban realism)

### Light by time of day

| Time of day | Key light words | Tone words | Atmosphere words |
|--------|--------|--------|---------|
| Early morning | scattered morning light, diffuse soft light | cool white/neutral tone | the city waking up, fresh air |
| Afternoon | soft angled side light, diffuse scattered light | mainly warm, lightly warm | light and shadow dappled, distinct layering |
| Evening/dusk | warm side backlight, slanting afterglow | mainly warm, local warm accents | long shadows stretching, a warm quality of light |
| Night | cool blue window light, warm indoor point sources | warm-cool contrast | deep light and shadow, strong light-dark contrast |
| Rainy/overcast | diffuse cool light, no key light | gray-blue keynote | damp air, low saturation |
| Office/interior | top light + ambient light | neutral gray tone | soft and even, professional feel |

### Emotional lighting

| Emotional key | Light type | Additional constraint |
|----------|----------|---------|
| Heart-flutter/warmth | soft side backlight, scattered warm light in places | rim light outlining the figure, shallow depth of field softening the background |
| Standoff/pressure | hard side light, high-contrast strong lighting | hard shadows, clear light-dark division |
| Oppression/sadness | diffuse cool light, top light or cool side light | low-key lighting, part of the face left in shadow |
| Mystery/solemnity | cool blue side light, backlit silhouette | halo controlled, edge light precise |
| Ethereal/lyrical | scattered soft light, backlight slightly over-exposed | a sense of atmospheric perspective, the distance faint and thin |

---

## Scene texture constraint words (by scene type)

| Scene type | Constraint words that must be added |
|----------|-----------|
| Office | reflections on glass partitions, tidy desktop, glow of computer screens, modern office chairs |
| Cafe/restaurant | wood grain of tables and chairs, coffee cup detail, warm pendant lights, street view blurred outside the window |
| Home space | fabric texture of the sofa, rug weave, warm desk lamp light, everyday clutter detail |
| Street/plaza | reflections on asphalt, facade detail, neon signboards, crowd blurred |
| Mall/indoor space | reflections on marble floor, glass shopfronts, modern lighting, depth of commercial space |
| Inside a car | leather texture of the seats, reflections in the windows, glow of the dashboard, street view blurred outside the window |
| Bedroom/private space | creases in the sheets, warm bedside lamp light, clothes left casually, a lived-in feel |

---

## Fixed style anchor words (every output must contain them)

**Live-action realism anchoring (mandatory):**

live-action realistic photography, cinematic image quality, surrealist documentary, strong contrast, extreme detail, ultra-crisp texture

**Character texture (mandatory when the shot contains a character):**

delicate skin, finely rendered face, three-dimensional features, every hair strand distinct, finely rendered hair strands

**Clothing texture (mandatory when the shot contains a character):**

clear fabric texture of modern clothing, ultra-crisp texture detail, clothes falling naturally with the movement, modern tailoring that fits

**Consistency anchoring (mandatory in reference-image mode):**

keep the character's face consistent with the reference image, keep the clothing colors consistent with the reference image, keep the scene lighting style unified

**Style ending (fixed):**

urban realist aesthetic, modern Eastern air, cinematic storyboard composition

**Image-quality lock words (every output must contain them, placed after the style ending):**

Mode A (English) — default (when the frame needs no in-frame text):
ultra-clear 4K image quality, high detail, natural sharpness, realistic clarity, no subtitles, no watermark, no title overlay in the frame

Mode B (English) — default:
ultra-sharp 4K, high detail, crisp textures, naturalistic sharpness, photorealistic clarity, no subtitles, no captions, no watermark, no title overlay

Mode B (English) — in-frame text scenes:
ultra-sharp 4K, high detail, crisp textures, naturalistic sharpness, photorealistic clarity, no subtitles, no captions, no watermark, no title overlay, legible text on in-scene props such as screens, posters, and signage

**Negative-word template (mode B must contain it, placed at the end of the prompt):**

> ⚠️ Seedream (mode A) **does not support negative prompts**; negative words apply to mode B only. Mode A guarantees image quality through the texture anchoring and image-quality lock words in the positive prompt.

Mode B (English):
no plastic skin, no beauty filter, no studio lighting, no centered composition, no oversaturation, no AI generated look, no motion blur, no noise, no blurry, no out of focus, no subtitles, no captions, no watermark, no title overlay, no UI text, no ancient costume, no hanfu, no traditional Chinese architecture

---

## Aesthetic prohibitions (avoid strictly when generating)

The following words/styles must not appear in the output prompt:

- ❌ Words relating to ancient style/antiquity/hanfu/traditional architecture
- ❌ Words relating to anime/2D anime/illustration/CG rendering
- ❌ Missing modern elements (the modern setting must be stated explicitly)
- ❌ Tone words for a warm yellow keynote (use "local warm lighting accents" instead)
- ❌ Soft focus/hazy feel/low-contrast filter words
- ❌ Clashing colors/mash-ups/neon/fluorescent color families
- ❌ Deformation descriptions such as cartoon proportions, big eyes, chibi
- ❌ Cyberpunk/steampunk/invented Western-fantasy elements
- ❌ Text overlaid outside the picture (subtitles, watermarks, title cards, narration overlays, opening titles and other UI-layer text — the frame must be purely visual)

> 💡 **Exception**: prop text inside the story world (text naturally present in the scene, such as a phone or computer screen the character is looking at, posters, road signs, shop signs) is **not covered by the prohibition**. When the storyboard shot description contains such content, describe its presence faithfully and require the text to be clear.

---

## Complete generation example

> Below is a side-by-side demonstration of mode A and mode B for the same input; in actual use **output only one of them**.

### Input (storyboard table row data)

| 序号 | Shot description | Scene | Associated asset names | Duration | Shot size | Camera movement | Character action | Emotion | Lighting and atmosphere |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | 林晚 alone by the cafe window, raindrops sliding down outside | Cafe | 林晚 | 4s | 中景 | 缓推 | holding a coffee cup, gaze turned out the window | Longing / anticipation | warm side light + cool blue window light |

### Example output A (mode A · Seedream)

[Prompt]
live-action realistic photography, cinematic image quality, surrealist documentary, strong contrast, extreme detail, ultra-crisp texture, 中景 medium shot composition, character framed from the waist up, delicate skin, finely rendered face, three-dimensional features, every hair strand distinct, finely rendered hair strands, a female lead standing by the cafe window, both hands naturally cupping a coffee cup, gaze turned out the window, eyes full of anticipation tinged with longing, warm side light in the cafe, cool blue rain light from outside outlining the figure's edge, clear wood grain of tables and chairs, detail of raindrops on the glass, modern Eastern air, cinematic storyboard composition, ultra-clear 4K image quality, natural sharpness, realistic clarity, no subtitles, no watermark, no title overlay in the frame.
Based on the reference image of 林晚, maintain consistent: face features, hairstyle, costume details. Generate a new scene: standing by the cafe window on a rainy day, holding a coffee cup, gazing outside. Keep character appearance identical to reference.

### Example output B (mode B · Nanobanana)

```xml
<role>
You are a cinematographer and storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: 林晚 — black long hair tied in a half ponytail, gentle eyes, modern casual outfit, slim body shape
</character_reference>
<continuity_rules>
- Same wardrobe, hairstyle, face features across ALL shots
- Same environment, lighting style, color grade
- Only framing, angle, action, expression may change
- Do NOT introduce new characters not in reference images
</continuity_rules>
<shot>
Medium shot, character standing by a cafe window on a rainy day, holding a coffee cup with both hands, gazing outside with an expression of expectation and longing, warm side light, cold blue window light creating rim light effect, wooden table texture, raindrops on glass visible, modern cinematic realism, ultra-sharp 4K, high detail, crisp textures, photorealistic clarity, no subtitles, no captions, no watermark, no title overlay.
</shot>
<negative>
no plastic skin, no beauty filter, no studio lighting, no centered composition, no oversaturation, no AI generated look, no motion blur, no noise, no blurry, no out of focus, no subtitles, no captions, no watermark, no title overlay, no UI text, no ancient costume, no hanfu, no traditional Chinese architecture
</negative>
```

## Quick reference card

### Emotion → frame word quick reference

| Emotion | Face keywords | Matching light |
|------|-----------|---------|
| Heart-flutter | corners of the mouth lifted, a smile in the eyes | warm side light |
| Sadness | calm complexion, dimmed eyes | diffuse cool light |
| Anger | sharp brows and eyes, blazing gaze | hard side light, high contrast |
| Tenderness | soft look, focused eyes | scattered warm light in places |
| Resolve | serious look, firm eyes | neutral gray tone |
| Coldness | cold face, distant empty eyes | cool blue side light |
| Endurance | calm face, emotion held down behind the eyes | low-key cool light, shadows retained |
