---
name: director_storyboard
description: Director storyboard prompt techniques · stop-motion clay texture
metaData: director_skills
---

# Storyboard Prompt · Stop-Motion Clay · Style-Specific Techniques

---

## Scope of use

This Skill is dedicated to storyboard prompt generation for the **stop-motion clay texture** style.

---

## Emotion → face/gaze word mapping

| Emotion input | Face words | Gaze words | Micro-expression supplement |
|----------|--------|--------|-----------|
| Heart-flutter / delight | Cheeks slightly flushed, restrained expression | Bright eyes, gentle gaze | Corners of the mouth lifting, clay indentations |
| Sadness / loss | Downcast look, soft expression | Dimmed eyes, wandering gaze | Brows slightly knitted, inward expression |
| Surprise / curiosity | Eyes widening, lively expression | Focused eyes, curious gaze | Mouth slightly open, natural movement |
| Tenderness / affection | Soft look, gentle brows and eyes | Attentive eyes, affectionate gaze | Corners of the mouth lifting slightly, restrained warm expression |
| Determination / courage | Serious look, firm eyes | Clear gaze, focused eyes | Firm expression, bright temperament |
| Shyness / bashfulness | Cheeks flushing, natural expression | Gaze lowered, not daring to look straight | Hand pinching the clay hem, gentle movement |
| Warmth / being moved | Soft expression, a smile at the corners of the eyes | Warm eyes, gentle gaze | Corners of the mouth lifting, sincere expression |
| Loneliness / longing | Quiet look, distant eyes | Vacant gaze, lost in thought | Calm expression, quiet temperament |
| Joy / elation | Radiant smile, bright eyes | Lively eyes, vivid expression | Body leaning forward, brisk movement |
| Tension / unease | Slightly stiff expression, brow faintly furrowed | Wandering eyes, uncertain gaze | Fingers clenched, tense movement |

---

## Lighting-atmosphere word bank (stop-motion clay)

### Light by time of day

| Time of day | Key-light words | Tone words | Atmosphere words |
|--------|--------|--------|---------|
| Early morning | Soft morning light, scattered light | Warm yellow tone + pale blue accents | A fresh feel, light through the window |
| Afternoon | Soft angled side light, diffused light | Warm tones dominant | Dappled light and shadow, a warm feel |
| Dusk/sunset | Backlit warm tone, orange afterglow | Warm amber + pink accents | Long shadows stretching, a nostalgic feel |
| Night | Cool moonlight, local warm light | Pale blue keynote + warm accents | A quiet feel, layered light and shadow |
| Indoor everyday | Warm side light, even and soft | Warm yellow dominant | A cozy feel, family atmosphere |
| Whimsical/magic | Whimsical light effect, magic light motes | Colored light flecks, soft-focus effect | A dreamlike feel, magical atmosphere |

### Emotional lighting

| Emotional keynote | Light type | Supplementary constraint |
|----------|----------|---------|
| Heart-flutter/tenderness | Soft side light, warm diffusion | Shallow depth of field, background slightly blurred |
| Sadness/loss | Cool-toned side light, low-key lighting | Keep part of the face in shadow |
| Whimsical/dreamlike | Magic light effect, colored light motes | Halo controlled, rim light soft |
| Nostalgia/memory | Warm soft-focus light, hazing effect | Edges slightly blurred, soft overall |
| Everyday/cozy | Even diffused light, neutral warm tone | Light soft, no obvious shadow |
| Night/quiet | Cool moonlight, local warm light | Light-dark contrast, clear layering |

---

## Scene texture constraint words (by scene type)

| Scene type | Constraint words to add |
|----------|-----------|
| Retro wooden house | Clear wood grain, clay brick wall, warm lamplight, retro furniture |
| Whimsical forest | Clay-textured trees, light-fleck effect, magic light motes, natural ground |
| Indoor everyday | Clay texture on the walls, furniture detail, warm lamplight, everyday clutter |
| Street and square | Clay-textured flagstone paving, retro architecture, warm streetlight, clay crowd |
| Cafe/restaurant | Clay-textured wooden tables and chairs, warm lamplight, street view outside the window blurred |
| Garden/courtyard | Clay-sculpted flowers and grass, soil texture, dappled sunlight, bench detail |
| Cave/underground | Clay grain on the rock, cave lighting, layered shadow, mysterious atmosphere |
| Castle/palace | Clay-textured stone brick, ornate decoration, warm lamplight, grand space |

---

## Fixed style anchor words (every output must contain them)

**Stop-motion anchoring (mandatory):**

Stop-motion animation style, clay texture, fingerprint indentations visible, clay-texture material, warm-toned light and shadow

**Clay texture (mandatory in every output):**

Clear clay texture, fingerprint indentations visible, obvious material graininess, handcrafted marks preserved

**Character material (mandatory when the shot contains a character):**

3D cartoon character, whimsical style, soft shallow depth of field, clear clay material detail

**Light-and-shadow layering (mandatory when the scene involves lighting):**

Cinematic light-and-shadow layering, clear light-dark contrast, soft natural light effect, warm tones dominant

**Atmosphere anchoring (mandatory):**

Healing nostalgic atmosphere, stop-motion animation aesthetic, warm emotional expression, handcrafted texture

**Image-quality lock words (every output must contain them, placed after the style ending):**

Mode A (English) — default:
High-definition image quality, clear clay texture, soft colors, no stray color no noise in the frame, shallow depth-of-field effect

Mode A (English) — in-frame text scenes (when the shot description contains prop text such as a signboard or sign):
High-definition image quality, clear clay texture, soft colors, no stray color no noise in the frame, shallow depth-of-field effect, prop text on signboards/signs clearly legible

Mode B (English) — default:
high-quality stop-motion animation, clear clay texture, warm lighting, soft shallow depth of field, no digital artifacts, no plastic look

Mode B (English) — in-frame text scenes:
high-quality stop-motion animation, clear clay texture, warm lighting, soft shallow depth of field, no digital artifacts, no plastic look, legible text on props and signs

**Negative-word template (mode B must contain it, placed at the end of the prompt):**

> ⚠️ Seedream (mode A) **does not support negative prompts**; negative words apply to mode B only. Mode A guarantees image quality through the texture anchoring and image-quality lock words in the positive prompt.

Mode B (English):
no modern digital 3D, no CGI rendering, no smooth plastic, no oversaturated colors, no neon colors, no cyberpunk, no sci-fi elements, no sharp edges, no clean lines, no vector art, no cartoon flat coloring, no cel-shading

---

## Aesthetic prohibitions (avoid strictly when generating)

The following words/styles must not appear in the output prompt:

- ❌ Modern 3D animation style (Pixar/late-period Disney style)
- ❌ Words related to smooth plastic/modern CG rendering
- ❌ Highly saturated fluorescent colors/neon color systems
- ❌ Modern scene/modern architecture elements
- ❌ Heavy shadow/excessive contrast/dark-tone style
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
| 1 | Inside a retro wooden house, two clay figures look at each other and smile in the warm light | Wooden house | 主角A/B | 5s | 中景 | 缓推 | Sitting facing each other, hands touching lightly, smiling tenderly | Heart-flutter / sweetness | Warm side light + soft shallow depth of field |

### Example output A (mode A · Seedream)

[Prompt]
Stop-motion animation style, clay texture, fingerprint indentations visible, clay-texture material, warm-toned light and shadow, 中景 medium shot composition, two clay figures framed from the waist up, clear clay texture, fingerprint indentations visible, obvious material graininess, handcrafted marks preserved, 3D cartoon character, whimsical style, soft shallow depth of field, clear clay material detail, inside a retro wooden house, two clay figures sitting facing each other in the warm light, hands touching lightly, smiling tenderly, eyes full of heart-flutter and sweetness, warm side light, soft shallow depth of field, clear wood grain, clay brick wall texture, cinematic light-and-shadow layering, clear light-dark contrast, soft natural light effect, healing nostalgic atmosphere, stop-motion animation aesthetic, warm emotional expression, high-definition image quality, clear clay texture, soft colors, no stray color no noise in the frame, shallow depth-of-field effect.
Based on the reference image of 主角A/B, maintain consistent: face features, hairstyle, costume details. Generate a new scene: two clay characters sitting across from each other inside a retro wooden room at warm light, touching hands gently, smiling tenderly. Keep character appearance identical to reference.

### Example output B (mode B · Nanobanana)

```xml
<role>
You are a stop-motion claymation director.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: 主角A/B — clay figurines, soft rounded features, warm earthy tones, small cute proportions
</character_reference>
<continuity_rules>
- Same clay texture, color palette, face features across ALL shots
- Same environment, lighting style, color grade
- Only framing, angle, action, expression may change
- Do NOT introduce new characters not in reference images
</continuity_rules>
<shot>
Medium shot, two clay characters sitting across from each other inside a retro wooden room at warm light, hands gently touching, smiling tenderly, eyes filled with warmth and affection, warm side light, soft shallow depth of field, wooden texture visible, clay brick wall texture, cinematic lighting layers, clear contrast between light and dark, soft natural light effects, healing nostalgic atmosphere, stop-motion animation aesthetic, high-quality stop-motion, clear clay texture, warm lighting, no digital artifacts, no plastic look.
</shot>
<negative>
no modern digital 3D, no CGI rendering, no smooth plastic, no oversaturated colors, no neon colors, no cyberpunk, no sci-fi elements, no sharp edges, no clean lines, no vector art, no cartoon flat coloring, no cel-shading
</negative>
```

## Quick reference card

### Emotion → frame word quick lookup

| Emotion | Face keywords | Light match |
|------|-----------|---------|
| Heart-flutter | Cheeks slightly flushed, clay indentations | Soft side light, warm tone |
| Sadness | Downcast look, soft expression | Cool-toned side light, low key |
| Tenderness | Soft look, gentle brows and eyes | Even diffused warm light |
| Whimsical | Eyes widening, colored light motes | Whimsical light effect, halo |
| Being moved | A smile at the corners of the eyes, sincere expression | Warm-toned side light, soft |
| Loneliness | Quiet look, vacant gaze | Cool-toned side light, dark areas |
| Joy | Radiant smile, bright eyes | Warm-toned diffused light |
