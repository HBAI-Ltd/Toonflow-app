---
name: storyboard_prompt_techniques
description: >-
  General storyboard prompt technique reference.
  Covers the parse-mapping rules, the shot-size vocabulary, the output format specification, the prompt structure framework, the image-quality specification, the image-asset annotation rules, the character-position continuity rules and so on, for an Agent to activate and use.
---
# Storyboard prompts · general base techniques

> The following is the **general base specification** for generating storyboard prompts and applies to every visual style. **Style-related content** — the style anchor words, the emotion mapping, the lighting vocabulary, the scene texture, the aesthetic prohibitions and so on — is defined by the style-specific technique (`director_storyboard`).

---

## Applicable modes

This specification supports output in only the following two **reference-image consistency modes**:

- **Mode A**: Seedream (doubao-seedream)
- **Mode B**: Nanobanana (Gemini)

> ⚠️ **No text-to-image mode prompt is generated**; every output assumes a **reference-image (image-to-image / ControlNet / character consistency)** workflow.

---

## The principle of faithfulness to the storyboard table's content (highest priority)

Prompt generation is **format conversion**, not **creative writing**. The storyboard table is the prompt's **only source of content**; all picture information must be faithful to the corresponding row of the storyboard table, adapted only in its form of expression and wording to what the image generation model requires.

### The core principle: the shot description is the backbone, not raw material

The storyboard table's "Shot description" field carries all the visual information of the shot and is the **backbone content** of the prompt body. Modifying words such as style words, image-quality words and lighting words are **auxiliary decoration** that serve the shot description. When the two compete for space in the token budget, **the shot description comes first** — cut the style words rather than a single visual element of the shot description.

### The iron rules

1. **The shot description is kept in full**: every visual element in the storyboard table's "Shot description" field (subject, object, spatial relations, dynamic detail, shot relations) must appear in full in the prompt body; **not one of them may be omitted**
2. **Semantically equivalent conversion**: when converting a storyboard-table field into a prompt, change only the form of expression (Chinese ↔ English, prose ↔ keywords, narrative language ↔ visual description) and **do not change the meaning**. Example: the storyboard table says "the architectural space with deep pillar shadows" → the prompt must show that space's dark pillar shadows and may not replace it with a different meaning such as "ornate architecture"
3. **No creative divergence**: do not add decorative visual elements the storyboard table does not mention (if the storyboard table does not write drifting petals, the prompt may not add them on its own); do not reinterpret the scene's mood (the storyboard table says "coldly disdainful" and this may not become "sorrowful and forlorn")
4. **Style words are subordinate to content**: style words such as style anchor words, image-quality lock words and scene texture words are **auxiliary modifiers** that serve the picture content the storyboard table has already defined, and must not take over — when a style word conflicts with the storyboard table's concrete description, the storyboard table governs
5. **Field-by-field back-check**: after generating each prompt, compare it field by field against the corresponding row of the storyboard table and confirm that all the following mappings are accurately reflected:

| Storyboard table field | What the prompt must reflect | Points to verify |
|-----------|---------------|--------|
| Shot description | The core content of the prompt body's 【画面】 section | Are all the visual subjects, spatial relations and key details kept with **zero omission** |
| Scene | The environmental anchor of the prompt body's 【画面】 section | Is the scene type consistent |
| Shot size | The shot-size framing word | Does the shot size match (for a compound shot size, take the starting end for the first frame) |
| Character action | The subject's posture and facing | Is the action's meaning consistent, is the facing stated explicitly |
| Emotion | The emotional facial word | Is the emotional keynote consistent |
| Lighting and atmosphere | The prompt body's 【光影】 section | Are the light direction, colour-tone leaning and light/dark relations complete and consistent |

> ⚠️ **Failing the check = the prompt is invalid**; it must be corrected before being output. The most common failure mode: concrete elements in the shot description are covered over and lost by style-template words.

---

## The first-frame recognition principle

The storyboard image is the **first-frame reference for the video**. The model should judge that frame's visual state for itself from the meaning of the storyboard table's "Shot description" and must not mechanically apply a "preparatory state" template.

**Judgement logic**:

| Type of shot description | How to handle it | Example |
|-------------|---------|------|
| **A static instant** (stopping to look up, standing and staring, turning the head with a sneer, bent over writing) | **Generate directly as described**, with no rewriting of the action | "the character stops and looks up at something" → the prompt writes "stops and looks up at something" directly |
| **A continuous process of action** (walking down the corridor, swinging the sword down, turning and leaving) | Take the **frozen instant at which the action begins** (not an abstract preparatory state) | "swinging the sword down" → "the sword is already raised overhead, the tip pointing down, the instant before it cleaves" |
| **A camera movement** (slow push to a medium shot, pull back to a wide shot, fade in) | Take the **shot size at the starting end** as the first frame's framing | "long shot → medium shot" → the first frame takes "大远景" |
| **A transition effect** (fade in from black, dissolve) | Keep the description but mark it as the opening state | "fade in from black at the opening" → "the picture emerges from black, an opening extreme long shot…" |

**The basis for the judgement**: the tense of the shot description's main verb and its narrative density.

> ❌ **The wrong way**: rewriting every action into a "about to happen" preparatory state, which dilutes the action's meaning
> - The storyboard table says "stops and looks up" → wrongly rewritten as "is about to raise the head and look ahead" (the action is weakened)
> - The storyboard table says "sneers from above" → wrongly rewritten as "the corner of the mouth is about to lift" (the emotion is weakened)
>
> ✅ **The right way**: stay faithful to the storyboard table's action description and take the starting end only when that action really is a continuous process

---

## Parse-mapping rules

| Storyboard field | How the prompt handles it |
|----------|----------------|
| Shot description | **The backbone content**: the core source of information for the prompt body's 【画面】 section. **All** visible subjects, spatial layers, key details and shot relations in the shot description must be kept in full, converting only the narrative language into visual-description format. Cutting a key element, replacing it with a different meaning, or adding a visual element not present in the shot description is strictly forbidden |
| Scene | Folded into the 【画面】 section as the environmental anchor, with the scene texture constraint words of the style-specific technique layered on |
| Shot size | The shot framing word (see the shot-size vocabulary below); it must match the storyboard table's "Shot size" field. For a compound shot size (such as "long shot → medium shot") take the **starting end for the first frame** |
| Camera movement | Storyboard production information only; it does not enter the prompt, and no camera-movement note is output |
| Character action | Based on the storyboard table's "Character action" field, handled by the "first-frame recognition principle". The action's semantic content and the explicit `｜朝向：` annotation must be preserved |
| Emotion | Based on the storyboard table's "Emotion" field, choosing the matching facial/gaze word from the style-specific technique's emotion mapping table. The emotional keynote must agree with the storyboard table |
| Lighting and atmosphere | Based on the storyboard table's "Lighting and atmosphere" field, written into the 【光影】 section as **its own paragraph**, keeping the light direction, colour-tone leaning, light/dark relations and textural detail in full |
| Dialogue | Does not enter the prompt; not output |
| Sound effects | Does not enter the prompt; not output |
| Associated asset names/IDs | Used only for internal reference-image binding, handled by the "image-asset annotation rules" |

---

## Shot-size vocabulary (general)

| Shot size input | Mode B (Nanobanana) English shot word | Mode A (Seedream) Chinese picture word |
|----------|-------------------------------|---------------------------|
| 大远景/大全景 | `extreme wide shot, establishing shot` | 大远景构图，环境全貌，人物渺小于场景 |
| 远景/全景 | `wide shot, full shot, full body` | 全身入镜，远景构图，人景比例协调 |
| 中景 | `medium shot, cowboy shot, knee shot` | 中景构图，人物膝盖以上入镜 |
| 近景 | `medium close-up, upper body` | 近景构图，上半身入镜，背景虚化 |
| 半身 | `half body shot, bust shot` | 半身构图，腰部以上入镜，浅景深 |
| 特写 | `close-up, face focus` | 特写构图，面部或细节局部放大，背景深度虚化 |
| 大特写 | `extreme close-up, macro detail` | 大特写，极度局部细节，虚化背景 |
| 过肩镜 | `over the shoulder shot, two shot` | 过肩构图，前景人物后背虚化，远景人物清晰 |

**Handling a compound shot size**: if the storyboard table writes a camera movement such as "long shot → medium shot" or "medium shot → close-up", the storyboard image is the first-frame reference, so **take the starting shot size on the left of the arrow**.

---

## Output format specification

Each shot **outputs the prompt body of one mode only** (one of the two); the same shot may not output both mode A and mode B.

**Mode selection rules**:

| Condition | Mode chosen |
|------|----------|
| The target model is Seedream / the Doubao family | Mode A (Chinese prompt) |
| The target model is Nanobanana / the Gemini family | Mode B (English JSON prompt) |
| The user has not specified a model | Mode A by default, or ask the user to confirm |
| Batch generation | Keep the same mode throughout; do not switch partway |

**Output content rules**:
- When mode A is chosen: output only the `[Prompt]` body (no negative words, which Seedream does not support)
- When mode B is chosen: output only the `[JSON Prompt]` body (including the `"negative"` field)
- Apart from the prompt body, the following are not output by default: the storyboard title, reference-image binding notes, dialogue notes, sound-effect notes, constraint checks, asset summaries

---

## Prompt structure framework (the shot description comes first)

### General structural principle

The prompt body uses a **three-section structure**, making sure the shot description holds the backbone position:

```
【画面】→ carries the complete visual content of the storyboard table's "Shot description" + "Scene" + "Shot size" + "Character action" + "Emotion" (the backbone, with the highest information density)
【光影】→ carries the light source, colour tone and light/dark relations of the storyboard table's "Lighting and atmosphere" (its own paragraph, so it is not squeezed out by style words)
【风格】→ style anchor words + image-quality lock words + the prohibition declaration (auxiliary modifiers, short)
```

> **The principle of allocating length**: the 【画面】 section has the highest information density and the greatest length, and must carry every visual element of the storyboard table's "Shot description" in full; the 【光影】 section comes next, carrying the lighting and atmosphere on its own; the 【风格】 section is the shortest, holding only the necessary style anchor words and image-quality lock words. The order of the three sections may not be reversed and their lengths may not be inverted — if the style words run longer than the picture section, the output has failed.

### Mode A: Seedream (API `reference_images`)

Mechanism: the reference images are passed in through the API parameter `reference_images`, and the prompt uses `@图N` to bind them directly.

Prompt structure:

```
@图1 为{asset name}{asset type} @图2 为{asset name}{asset type} ... ,

【画面】{scene anchor}，{shot-size framing word}，{the shot description transcribed in full — keeping every visual element, spatial relation, subject action, facing and emotion}。

【光影】{light direction}，{colour-tone leaning}，{light/dark relations}，{textural detail}。

【风格】{style anchor words}，{image-quality lock words}，禁止画外字幕、水印、UI 文字。

保持 @图N 面部特征、发型、服饰与参考图完全一致。
```

**Key rules**:
- The 【画面】 section must carry all the information of the storyboard table's "Shot description" field in full; **nothing may be cut**
- Inside the 【画面】 section, the names of characters/scenes/props **must be replaced by `@图N`** (not written out as names)
- The facing information must be written explicitly into the 【画面】 section (such as "3/4正面朝右")
- Do not append the English paragraph "Based on the reference image... Generate a new scene..." any more (the `@图N` mechanism already carries the reference-image binding, and appending the English paragraph produces two copies of the shot description that easily conflict)

> The concrete content of `[style anchor words]` and `[image-quality lock words]` is defined by the **style-specific technique**.

### Mode B: Nanobanana (multimodal + JSON)

Mechanism: the reference images go in together with the prompt as multimodal input, and the prompt uses structured JSON to constrain character consistency.

Prompt structure (a fixed framework):

```json
{
  "role": "You are a cinematographer and storyboard artist. Maintain strict visual continuity across all shots.",
  "character_reference": [
    { "image": 1, "ref": "@图1", "description": "[key appearance description: hair colour/hairstyle/costume/build]" },
    { "image": 2, "ref": "@图2", "description": "[key appearance description]" }
  ],
  "continuity_rules": [
    "Same wardrobe, hairstyle, face features across ALL shots",
    "Same environment, lighting style, color grade",
    "Only framing, angle, action, expression may change",
    "Do NOT introduce new characters not in reference images"
  ],
  "shot": {
    "scene_and_framing": "[scene anchor + shot-size framing word]",
    "subject_and_action": "[subject action + facing + emotion + every visual element in the shot description, using @图N in place of character/scene names]",
    "lighting": "[light direction + colour tone + light/dark relations + texture]",
    "style": "[style anchor words + image-quality lock words]"
  },
  "negative": "[the negative-word template, containing no subtitles, no watermark, no UI text] (the specific entries are defined by the style-specific technique)"
}
```

**Key rules**:
- The `shot` field is split into 4 sub-fields, forcing the shot description to occupy the two positions `scene_and_framing` and `subject_and_action` so that it is not squeezed out by style words
- `subject_and_action` is the field of highest information density and must carry the storyboard table's "Shot description" + "Character action" + "Emotion" in full
- The reference images go in as image input, not as URL text
- Keep the character description to 1-2 sentences of key features, avoiding verbosity

---

## General language and quality specification

- Mode A (Seedream) prefers natural-language paragraphs in Chinese
- Mode B (Nanobanana) prefers structured JSON prompts in English
- The prompt focuses on "content expression + image sharpness" and avoids blur-inducing words
- Do not use expressions that make the image mushy (see the "Image-quality-degrading forbidden words" table below)
- Mode B negative words are output from the style-specific "negative-word template"; every prompt must contain them and none may be omitted; mode A outputs no negative words
- Image-quality lock words are output from the style-specific "image-quality lock word" template; every prompt must contain them

---

## Off-picture text vs in-picture text rules

- **Off-picture text** (subtitles, watermarks, title cards, narration overlays and other UI-layer text) → **absolutely forbidden**; the prohibition must be declared in the 【风格】 section and in the negative words
- **In-picture text** (text props naturally present in the scene: a character writing with a brush, writing on a scroll, a plaque or signboard, the content of a letter, a road sign, a shop sign and so on) → **it is a scene prop**; when the storyboard's shot description explicitly contains such content, describe its presence normally in the 【画面】 section, unrestricted by the text prohibition rule
- **The test**: does that text exist **inside the story world**. Writing on a plaque = an in-picture prop ✅; a character's dialogue at the bottom of the frame = an off-picture subtitle ❌

---

## Image-quality-degrading forbidden words (general to every style)

| Forbidden wording | Model behaviour | Safe replacement |
|---------|---------|----------|
| `film grain` / `胶片颗粒` | Adds noise across the whole image and blurs it | `subtle cinematic texture` / `轻微电影质感` |
| `imperfect focus` / `失焦` | Throws the whole image out of focus | Delete outright |
| `edges not perfectly sharp` | Blurs the edges | Delete outright |
| `slight natural deviation` | Lowers the resolution overall | Delete outright |
| `not completely stable` | Blurs the picture | Delete outright |
| `blurry background` (overused) | The subject goes blurry along with it | `background bokeh, subject in sharp focus` |
| `hazy` / `foggy` (overused) | Fogs the whole image | Use only where aerial perspective is needed, and add `subject sharp` at the same time |
| `柔焦` / `朦胧感` | Lowers the overall sharpness | Delete outright |

> **Core principle**: the content may be "imperfect" (uneven light, asymmetric framing), but the image quality must be sharp.

---

## Batch processing specification

When the user inputs several storyboard rows:

1. **Process them row by row in order**; skip no row and merge none
2. Each shot outputs only the target mode's prompt body (Prompt or JSON Prompt)
3. If several consecutive shots are in the same scene, **the scene texture words may be reused**, but the emotion/light/shot size/action must be **handled independently per row**
4. For shots with the same associated asset names, **the consistency annotation words must be identical**
5. Do not append any non-prompt block (such as an asset-reference summary, dialogue/sound-effect notes or a constraint check)

---

## Image-asset annotation rules

The `prompt` field of every shot must have the **image-asset annotation** as its prefix, and the **prompt body must use `@图N` directly in place of the corresponding character/scene/prop names**, establishing a direct binding between the reference images and the shot description. The annotations follow the citation order of the assets in `associateAssetsIds`, numbered in sequence from `@图1`.

**Format**: `@图1 为{asset name}{asset type} @图2 为{asset name}{asset type} ... , the prompt whose body uses @图N in place of the character/scene names`

**Type mapping**:

| Asset type | Annotation type word |
|-----------|------------|
| role      | 角色       |
| tool      | 道具       |
| scene     | 场景       |
| clip      | 片段       |

**Rules**:
- Numbering starts at `@图1` and increments in the order of the `associateAssetsIds` array
- Each cited asset ID corresponds to one annotation item; **none may be missing and none extra**
- The asset name uses that asset's `name` field from the assets data
- The asset type is filled in from the type mapping table above
- The annotation part is separated from the prompt body by `, `
- A derived asset keeps its own `name` and its parent asset's `type`
- **Binding into the body (core)**: everywhere in the prompt body where a character name/scene name/prop name would otherwise appear, it **must be replaced by the corresponding `@图N` marker**, and the written name is no longer used. This makes the reference image point directly at the visual subject in the picture and avoids the ambiguity of an asset name that differs from the character name (for example, when a derived asset's name differs from the original character's name, `@图N` sidesteps the name ambiguity and points straight at the reference image)
- The same `@图N` may appear several times in the body (as when a character is visible in the foreground and in a reflection at once)

**Example** (assuming `associateAssetsIds="[A, B, C]"` corresponds to 角色甲(role), 角色乙(role), 某场景(scene)):

❌ Wrong (the body uses written names, disconnected from the prefix annotation):
```
@图1 为角色甲角色 @图2 为角色乙角色 @图3 为某场景场景, 角色甲冷笑，居高临下看着跪地的角色乙，场景内柱影深沉……
```

✅ Right (the body uses @图N to bind the reference images directly):
```
@图1 为角色甲角色 @图2 为角色乙角色 @图3 为某场景场景,

【画面】@图3 内，中景构图，@图1 身形挺立于画面左侧，3/4侧面朝右，嘴角微扬冷笑，居高临下俯视跪于画面右侧地面的@图2；@图2 俯身伏地，3/4背面朝左，双手撑地，肩背紧绷……
```

---

## Character position and facing continuity rules

When generating each prompt, obey the following cross-shot constraints on character position and facing consistency.

### I. Facing acquisition rules (obtaining the character's facial facing from the storyboard table)

The storyboard table's "Character action" field already carries an explicit `｜朝向：` annotation; when generating a prompt, **extract it directly by preference** and **write the corresponding facing word explicitly** into the prompt (such as `facing right` / `面朝右`, `three-quarter view facing left` / `3/4侧面朝左`).

**Acquisition priority** (high → low):

| Priority | Source of the cue | Handling logic |
|--------|---------|----------|
| **1** | **The `｜朝向：` annotation in the Character action field** | The storyboard table has already stated it → **use it directly**, no inference needed |
| 2 | **An explicit direction word in the shot description** | The shot description mentions the facing directly (such as "back to camera", "looking out of the window", "facing the audience") → use it directly (only when priority 1 is missing) |
| 3 | **Multi-character spatial relations (the 180° axis)** | In a conversation/confrontation/interaction scene the two characters face each other: the character on the left of frame faces right, the one on the right of frame faces left. Once the baseline is established at their first appearance it is locked for the whole scene |
| 4 | **What the shot size implies** | Over-the-shoulder: the foreground figure has their back/three-quarter back to camera and the distant figure faces towards camera; a close-up/medium close-up monologue: three-quarter view by default |
| 5 | **Emotion and narrative meaning** | Solitude/brooding/remembering → a profile outline or a three-quarter back view; confrontation/interrogation → front on or three-quarter front towards the other; avoidance/shyness → head turned slightly away from the other |
| 6 | **The spatial logic of the scene** | Greeting a guest at the door → facing out of the door; gazing at a view → facing the view; bent over writing → facing the desk with the head down |

> **In the ordinary case you only need to read priority 1**, since the storyboard table has already annotated it at source. Priorities 2-6 are only the fallback inference for when the storyboard table's annotation is missing.

**Acquisition steps**:
1. Read the annotation content after `｜朝向：` in the "Character action" field of the storyboard table's current row
2. If the annotation is present and complete → use it directly and skip the remaining priorities
3. If the annotation is missing (an empty-shot row, say) → infer it from priorities 2-6 in turn
4. Write the facing information you obtained into the description of the corresponding character in the prompt

**Facing vocabulary**:

| Facing type | Mode A (Chinese) | Mode B (English) | When it applies |
|---------|-------------|-------------|---------|
| 正面 | 正面面朝镜头 | facing camera, front view | A declaration about oneself, confronting the audience's gaze directly |
| 3/4正面 | 3/4侧面微朝镜头 | three-quarter view facing camera | A subject in conversation, conveying feeling |
| 正侧面 | 正侧面轮廓 | profile view, side view | Monologue, brooding, a confrontation in silhouette |
| 3/4背面 | 3/4侧背面 | three-quarter back view | Leaving, detachment, remembering |
| 背面 | 背对镜头 | back view, from behind | A mysterious entrance, parting, gazing into the distance |
| 面朝左 | 面朝画面左侧 | facing left | A character on the right of the 180° line, or facing a target on the left |
| 面朝右 | 面朝画面右侧 | facing right | A character on the left of the 180° line, or facing a target on the right |
| 微低头 | 微微低头 | slightly looking down | Grief, guilt, brooding |
| 微仰头 | 微微仰头 | slightly looking up | Arrogance, looking up, anticipation |

> A facing annotation must contain both the **horizontal facing** (facing left/right/camera) and the **tilt leaning** (if any), as in "3/4侧面朝右，微微仰头".

### II. Position and facing locking rules

- **Frame position is locked**: across the several shots of one character within the same scene, their left/right position in the frame (left of frame / centre / right of frame) must stay fixed and must not jump sides without a narrative reason
- **Conservation of facing**: a conversation/confrontation scene obeys the 180° axis — if character A faces right they keep facing right for the whole scene, and if character B faces left they keep facing left; the prompt must state it explicitly with direction words (facing left / 面朝左, on the left side of frame / 画面左侧 and so on)
- **Consistent foreground/background layering**: if character A is in the foreground and character B in the middle ground in shot N, their front-to-back relation should not reverse without reason in the following shots of the same scene
- **A change of position needs a linking action**: when a character's frame position genuinely has to change (the character walks, turns and so on), the prompt of the preceding shot must contain the corresponding movement/turning action; the position must not jump out of nowhere
- **A change of facing needs a linking action**: when a character's facing genuinely has to change (turning the head, turning round), the prompt of the current shot must contain the turning action (such as "turns the head slightly towards the left of frame"), and that turn must agree with the storyboard table's "Character action" field; the facing must not change out of nowhere
- **It may be reset across scenes**: when cutting to an entirely new scene, frame positions and facings may be reassigned, but they must still stay consistent within the new scene

### III. Visual relations at a reflective surface

When the picture contains a reflective medium (a mirror, water, polished metal, window glass, a camera lens and so on), note the following rules:

- **Mirror flip**: the character's left-right facing in the reflection is the opposite of the real one (the real body faces right → the reflection faces left), and the prompt must state the facing relation between the reflection and the real body explicitly (such as "@图1 面朝右，水面倒影中@图1 面朝左")
- **A reflective surface does not change the position baseline**: a character's frame position is set by the real body, and the image in the reflection does not count as a change of the character's position
- **The reflection's content matches the real body**: the character's costume, hairstyle, expression and so on visible in the reflection must match the real body in the same frame, with no discrepancy
- **Depth of field and sharpness of the reflection**: depending on the reflective surface's distance and material, the reflected image may be somewhat less sharp (blurred by ripples on water, say), but this must be annotated in the prompt (such as "水面倒影微微扭曲")
- **Recognition trigger**: this rule fires automatically when the storyboard's shot description or the scene asset contains a reflective element such as a mirror, water, a lake, a stream, glass, metallic reflection, or a camera/filming device

---

## Appendix: a complete worked example

The following demonstrates the complete flow of one shot from input to output, for the Agent's reference. This example uses abstract placeholders (角色甲, 某场景, 道具X and so on); in real use they are replaced by the storyboard table's concrete content.

### Input (a row of the storyboard table)

| Field | Content |
|------|------|
| Shot description | 开场黑场淡入，某场景出口大远景，人流涌动，醒目指示物立于画面右侧，角色甲背着道具X 独行人流中，镜头缓推至中景，他手攥道具Y 忽然停步仰望指示物，眼神紧张而笃定 |
| Scene | 某场景出口 |
| Shot size | 远景→中景 |
| Character action | 背包步行前行→忽然停步→抬头仰望指示物→手攥道具Y 微紧｜朝向：3/4正面朝右 |
| Emotion | 局促与笃定并存 |
| Lighting and atmosphere | 左侧柔和晨光均匀铺洒，暖黄底色轻染地面，指示物受光清晰，人影逆光偏暗形成轮廓感 |
| Associated asset IDs | [a, b, c, d] → 角色甲(role)、道具X(tool)、道具Y(tool)、某场景出口(scene) |

### Output (mode A · Seedream)

```
@图1 为角色甲角色 @图2 为道具X 道具 @图3 为道具Y 道具 @图4 为某场景出口场景,

【画面】@图4，开场自黑场淡入，大远景构图，人流涌动穿行，画面右侧醒目立有指示物；@图1 背着@图2 独行于人流之中，手中紧攥@图3，身体3/4正面朝右，停步于人群之间，抬头仰望画面右侧的指示物，眼神紧张而笃定，面容局促中透着决意。

【光影】左侧柔和晨光均匀铺洒，暖黄底色轻染地面，指示物受光清晰明亮，周围人影逆光偏暗形成剪影轮廓，@图1 身形半受光半逆光，面部轮廓微亮。

【风格】{风格锚定词}，{画质锁定词}，禁止画外字幕、水印、UI 文字。

保持 @图1 面部特征、发型、服饰与参考图完全一致。
```

> The `{风格锚定词}` and `{画质锁定词}` in the 【风格】 section are supplied by the style-specific technique (`director_storyboard`); this general specification does not hard-code the entries.

### Verification comparison

| Storyboard table field | Where the prompt reflects it | Consistent |
|-----------|---------------|---------|
| 开场黑场淡入 | 【画面】"开场自黑场淡入" | ✅ |
| 某场景出口 | 【画面】"@图4" | ✅ |
| 大远景 (the starting end for the first frame) | 【画面】"大远景构图" | ✅ |
| 人流涌动 | 【画面】"人流涌动穿行" | ✅ |
| 指示物在右侧 | 【画面】"画面右侧醒目立有指示物" | ✅ |
| 角色甲背道具X 独行 | 【画面】"@图1 背着@图2 独行于人流之中" | ✅ |
| 手攥道具Y | 【画面】"手中紧攥@图3" | ✅ |
| 停步仰望指示物 | 【画面】"停步于人群之间，抬头仰望画面右侧的指示物" | ✅ |
| 朝向3/4正面朝右 | 【画面】"身体3/4正面朝右" | ✅ |
| 紧张而笃定 | 【画面】"眼神紧张而笃定" | ✅ |
| 左侧晨光+暖黄底色 | 【光影】"左侧柔和晨光均匀铺洒，暖黄底色" | ✅ |
| 人影逆光剪影 | 【光影】"人影逆光偏暗形成剪影轮廓" | ✅ |

**Zero omissions, check passed.**
