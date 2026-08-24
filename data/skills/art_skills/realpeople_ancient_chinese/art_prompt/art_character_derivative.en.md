# Character Derived Asset Generation · Constraint Manual

---

## 1. Layering principles

1. **The face does not change** — after layering, the features must be exactly identical to the base model; any facial drift is forbidden
2. **The pose does not change** — keep the natural standing pose of the base model; any change of pose/action/bearing is forbidden
3. **Layer-by-layer control** — describe each layer independently so layers can be swapped (change the outfit without changing the makeup)
4. **Unified style** — all costume and makeup elements obey the same aesthetic system
5. **No drop in texture** — after layering, the texture standard is no lower than the base model
6. **Costume and makeup only** — layer on makeup/hairstyle/clothing/accessories only; introducing props, scenes, environment or actions is forbidden

---

## 2. Layer stack

| Layer | Content | Notes |
|---|---|---|
| L0 | Base model | The base likeness model, not modified |
| L1 | Makeup (decision layer) | Analyze the user's cues first, then decide the strength: "base makeup / light makeup / formal makeup" |
| L2 | Hairstyle and styling | Buns/tied hair/braids + hair ornaments |
| L3 | Inner robe/base layer | Replaces the white base inner robe |
| L4 | Outer robe/main garment | Wide-sleeve robe/straight-hem robe/great cloak and the like |
| L5 | Accessories | Headpieces/earrings/neckwear/waist ornaments/hand ornaments |

> **Scope boundary**: character derived assets cover only layers L0–L5 (costume, makeup and styling); they do not cover props (umbrella/sword/fan/book/lantern and other handheld items), scene environment (interior/exterior/weather and the like) or poses and actions (walking/glancing back/raising a hand and the like). Those belong to other asset types.

---

## 3. Makeup constraints (L1)

### Base-model-to-derivative makeup strategy (key)

> The character base model is bare-faced, but derived assets enter the makeup-and-styling flow by default. The system should analyze the makeup requirement from the cues the user provides and decide the strength between base makeup, light makeup and formal makeup, rather than staying bare-faced.

### L1 cue analysis and makeup decision

| Step | What is processed | Decision result |
|---|---|---|
| S1 | Extract user cues: facial-state words, emotion words, intensity words | Form a summary of the makeup requirement |
| S2 | Filter out non-makeup cues: prop/scene/action/pose words are not grounds for applying makeup | Prevents misjudgment |
| S3 | Match the makeup style matrix and give the strength tier | Base makeup / light makeup / formal makeup |
| S4 | Generate the final L1 prompt | Output the conclusion only, not the analysis process |

### Cue-to-makeup mapping (execution standard)

| Cue type | Typical cue | L1 decision |
|---|---|---|
| No clear facial-emphasis cue | Only the clothing/hairstyle changes, no emphasis on emotion or state | Base makeup |
| Slight facial cue | Gentle, smiling, lashes trembling lightly, complexion slightly lifted | Light makeup (extremely faint) |
| Clear frailty cue | Pale face, extremely faint lip color, faint redness under the eyes | Frail pear makeup (light makeup) |
| Clear formal-ceremony cue | Full dress, ceremony, splendid entrance | Formal makeup (controlled) |

> Decision principle: every derived asset must have makeup and styling; look at the facial cues first to decide strength and style — changes of prop, scene or pose must not raise the makeup strength on their own.

### Female makeup style matrix

| Style | Suitable scene | Core prompt |
|---|---|---|
| Elegant plain makeup | Everyday, first meeting, in the boudoir | elegant makeup、lightly drawn moth brows、plain makeup clear face |
| Cold-beauty frost makeup | Formal, confrontation, power | cold striking makeup、sharp brows and eyes、thin cold lips |
| Soft peach makeup | Sweet romance, tension, heart-flutter | peach-blossom makeup、faint redness at the outer eye corners、dewy lip color |
| Frail pear makeup | Injury, weakness | pale face、extremely faint lip color、faint redness under the eyes |
| Regal phoenix makeup | Grand wedding, full dress | rich splendid makeup、vermilion lips phoenix eyes |

### General base skin (shared by all makeup styles)

| Item | Constraint | Prompt |
|---|---|---|
| Texture | Dewy skin, naturally translucent | dewy skin、creamy porcelain skin、luminous skin |
| Fairness | Cool fair skin, translucent but not deathly pale | milky skin、milky white skin |
| Inner glow | A soft light coming from within | inner glow、translucent glowing skin |
| Forbidden | Matte/dead white/waxy/oily/blown out | — |

### Base makeup in detail (default tier)

| Item | Constraint | Prompt |
|---|---|---|
| Brows | Lightly groomed along the base model's brow shape, without changing the shape | naturally groomed brows、clean brow shape |
| Eyes | Extremely faint eye work, emphasizing clarity and liveliness | clear bright eyes、extremely faint inner eyeliner |
| Cheeks | Extremely faint lift of complexion, no visible piling of color | natural cheek complexion、faintly lifted complexion |
| Lips | Nude pink or pale pink tint, kept restrained | naturally moist lip color、pale pink lip color |
| Overall | Makeup is visible, but the makeup feel is very light | base makeup、no-makeup makeup look、natural retouching |

### By area (elegant plain makeup as the example)

| Area | Constraint | Prompt |
|---|---|---|
| Base | Thin and translucent, dewy faint sheen | thin base makeup、dewy creamy skin |
| Brows | Distant-mountain brows/willow-leaf brows, lightly swept in gray-brown | distant-mountain dark brows、lightly drawn moth brows |
| Eyes | Extremely faint eyeshadow, inner eyeliner, long slender lashes | clear eye makeup、long slender lashes |
| Blush | Extremely faint thin powder, lightly swept on the apples of the cheeks | extremely faint blush、thin powder faintly flushed |
| Lips | Dewy pale pink, faint sheen | dewy pale pink lip color |

### Male makeup

| Item | Constraint | Prompt |
|---|---|---|
| Base skin | Dewy creamy skin, fair and translucent, fresh and natural | dewy skin、creamy skin、luminous skin |
| Principle | No-makeup makeup — looks unmade-up but with excellent skin | no-makeup makeup、naturally great skin |
| Brows | Naturally thick brows, not drawn | naturally sword-shaped brows、handsome brow shape |
| Lip color | Natural blood color, slightly moist | natural lip color、a healthy flush |

---

## 4. Hairstyle and styling constraints (L2)

### Female styling types

| Styling | Description | Suitable for | Prompt |
|---|---|---|---|
| Half-up cloud bun | Bun on top + hair falling behind | Everyday, going out | half-up cloud bun、black tresses half tied |
| Flying-immortal bun | High bun swept up, flowing | Fairyland, entrance | flying-immortal bun、high bun swept up |
| Fallen-horse bun | Low bun to one side, languid | Private moments, tension | fallen-horse bun、languid side bun |
| Double-loop bun | Symmetrical twin buns, girlish | Young characters | double-loop bun、girlish twin buns |
| Fully loose hair | Long hair fully loose, with simple hair ornaments | Injury, ruin | long hair falling loose、black tresses like a waterfall |
| Tied ponytail | High tie, crisp and capable | Martial training, action | high tied ponytail、crisp and capable |

### Female hair ornaments

| Item | Constraint | Prompt |
|---|---|---|
| Style | Maximalist, matched to the clothing | maximalist hair ornaments、splendid and exquisite |
| Material | Metal + pearls and jade + tassels | gold-thread tassels、head full of pearls and kingfisher jade |
| Craft | Master craft, ultra-fine | master craft、finely carved and wrought |

### Male styling types

| Styling | Suitable for | Prompt |
|---|---|---|
| Tied hair with half crown | Everyday, literati | tied hair with half crown、jade hairpin holding the hair |
| Full crown, high tie | Formal, court | full crown high tie、jade crown holding the hair |
| Loose hair over the shoulders | Private moments, injury | loose hair over the shoulders、long hair like ink |
| Battle ponytail | Combat, martial training | high-tied battle hair、crisp ponytail |

---

## 5. Clothing constraints (L3+L4)

### Female clothing matrix

| Style | Design | Suitable for | Prompt |
|---|---|---|---|
| Ethereal flowing outfit | Multi-layer wide-sleeve robe, Wei-Jin cut | Everyday, fairyland | wide-sleeve robe、multi-layer garments、flowing fabric |
| Dignified formal robe | Curved-hem shenyi/ruqun | Court, banquet | curved-hem shenyi、dignified and splendid |
| Light everyday wear | Narrow-sleeve ruqun/short jacket | Action, martial training | narrow-sleeve short jacket、light and crisp |
| Sleepwear | Thin gauze inner robe, plain color | Interior, night | plain-color sleepwear、loose and comfortable |
| Grand wedding attire | Phoenix coronet and xiapei, layered red dress | Wedding | phoenix coronet and xiapei、layered red garments |

### General constraints for female clothing

| Item | Constraint | Prompt |
|---|---|---|
| Main color | White/moon white/silver gray by default | exquisite white clothing、plain robes white as snow |
| Material | Substantial and flowing + embroidery + pearlescent fabric | substantial flowing fabric、pearlescent embroidery |
| Texture | The texture must be ultra-crisp | clear clothing texture、ultra-crisp texture |
| Shoulders | Shoulder ornaments/shawl/cloud collar | splendid cloud collar、ornament on the shoulders |
| Layering | Multiple layers worn together, clearly layered | multiple layers worn together、clearly layered |

### Male clothing matrix

| Style | Suitable for | Prompt |
|---|---|---|
| Literati elegant wear | Everyday, study | wide-sleeve long robe、moon white garments |
| Warrior's fitted wear | Combat, training | narrow-sleeve fitted wear、dark battle dress |
| Dark robe and great cloak | Entrance, night travel | ink-dark great cloak、cloak snapping in the wind |
| Everyday casual wear | Leisure, private moments | plain-color everyday wear、simple casual wear |
| Formal court robe | Court, ceremony | formal court robe、splendid ceremonial robe |

---

## 6. Accessory constraints (L5)

### Female accessories

| Type | Constraint | Prompt |
|---|---|---|
| Headpiece | Maximalist, never sparse | maximalist headpiece、head full of pearls and kingfisher jade |
| Earrings | Hanging tassels/jade ear pendants | tassel earrings、hanging jade ear pendants |
| Neckwear | Yingluo necklace/torque | splendid yingluo necklace、exquisite torque |
| Waist ornaments | Palace sash/jade pendant | flowing palace sash、jade pendant at the waist |
| Hand ornaments | Jade bangle/arm bracelet | translucent jade bangle、exquisite arm bracelet |

### Male accessories

| Type | Constraint | Prompt |
|---|---|---|
| Hair crown | Jade crown/gold crown, exquisite | jade crown holding the hair |
| Waist belt | Wide sash/leather belt | wide sash、distinct texture |
| Jade pendant | Translucent and warm | jade pendant at the waist |
| Weapon | Sword/fan/flute (optional) | long sword at the side、folding fan half raised |

---

## 7. Costume and makeup combination quick lookup

| Scene | Makeup | Hairstyle | Clothing | Accessories |
|---|---|---|---|---|
| Everyday in the boudoir | Elegant plain makeup | Half-up cloud bun | Ethereal flowing outfit | Medium |
| First meeting | Elegant plain makeup | Half-up/flying-immortal | Ethereal flowing outfit | Medium to many |
| Sweet-romance interaction | Soft peach makeup | Half-up/fallen-horse | Ethereal/light wear | Medium |
| Formal entrance | Cold-beauty frost makeup | Flying-immortal bun | Dignified formal robe | Maximalist |
| Night conversation in private | Elegant/peach makeup | Fully loose/fallen-horse | Sleepwear | Minimal |
| Injured and ruined | Frail pear makeup | Fully loose (disheveled) | Damaged everyday wear | Minimal/none |
| Grand wedding ceremony | Regal phoenix makeup | Flying-immortal bun | Wedding attire | Maximalist |
| Martial training and action | Plain makeup (extremely faint) | Tied ponytail | Light everyday wear | Simple |

---

> **🔍 Inference rules for uncovered scenes**
>
> When the scene/situation the user describes is not in the table above, infer it yourself from the core DNA of this style:
>
> | Inference dimension | Live-action realist ancient-style DNA |
> |---|---|
> | Makeup strength | Elegant plain makeup by default (dewy skin + realistic hair strands); power/confrontation → cold-beauty frost makeup; heart-flutter/tension → soft peach makeup; injury/weakness → frail pear makeup; grand wedding/ceremony → regal phoenix makeup |
> | Hairstyle | Everyday/boudoir → half-up cloud bun; fairyland/entrance → flying-immortal bun; private moments/tension → fallen-horse bun; injured and ruined → fully loose hair; action → tied ponytail; hair strands must be separated one by one |
> | Clothing | Live-action realist texture first; everyday → wide-sleeve robe/soft and flowing; formal → curved-hem shenyi; action → narrow-sleeve everyday wear; main color white/moon white by default; texture must be ultra-crisp |
> | Accessory density | Realist craft maximalism (master craft, finely carved and wrought); everyday → medium; formal → maximalist (head full of pearls and kingfisher jade + yingluo necklace + palace sash); action → simple; injury → minimal/none |
> | Texture baseline | Anchored on live-action realistic photography; dewy creamy porcelain skin + hair-strand detail maintained throughout; 3D rendering/CG feel is forbidden |

## 8. Four-view design sheet specification

> After the derivative costume and makeup are layered on, a four-view design sheet must still be output, to guarantee the consistency of costume, makeup and styling at every angle.

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| First from left | Portrait close-up | Front, eye level | Face to collarbone | Face taking 60%+, features/makeup clear | portrait closeup、face detail、makeup detail |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, full front view of the clothing | front view、height mark |
| Second from right | Side view | Right side 90° | Full-body standing figure | Pure profile outline, side layering of the clothing | side view、profile、height mark |
| First from right | Back view | Rear 180° | Full-body standing figure | Hair ornaments at the back of the head/back of the clothing/hair ends clear | back view、rear view、height mark |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side from left to right in one frame |
| Background | Clean neutral gray #E8E8E8 |
| Stance | Standing naturally, feet parallel and slightly apart, arms hanging naturally or slightly out (**any change of pose is forbidden**) |
| Expression | A micro-expression matching the makeup style (elegant plain makeup → serene, peach makeup → smiling); facial micro-expression only, no body action |
| Light | Even soft light, key light from the front + fill on both sides, no hard shadow |
| Consistency | Face/makeup/hairstyle/hair ornaments/clothing/accessories are exactly the same across the four views |
| Frame ratio | 4:1 or 3:1 recommended |

---

## 9. Prompt template

### Output format constraints

| Item | Constraint |
|---|---|
| Output content | **Output the prompt text only**, output nothing else |
| Forbidden output | Quick-lookup tables, layered build plans, visual constraint tables, prohibition tables, derivative plans, output suggestions, core-element tables and any other non-prompt content |
| Forbidden scenes | Character derived assets **contain no scene/environment description**; output no scene/environment/weather/background narrative content (scenes belong to the scene-asset scope) |
| Forbidden props | **Contain no prop interaction**; output no umbrella/sword/fan/book/lantern/wine cup or other handheld or interacted objects (props belong to the prop-asset scope) |
| Forbidden pose change | **Do not change the base model's pose**; output no walking/glancing back/raising a hand/turning sideways/running or any other action or bearing change — keep the natural standing pose |
| Format | Output a directly usable prompt code block; no heading, table, explanation or plan comparison is needed |

### Full costume-and-makeup layering (four views)

```
Using the character base likeness image as the base image, img2img layering of costume, makeup and styling，
ancient-style {gender} character four-view design sheet，live-action realistic photography，ancient-style realist documentary，high contrast，extreme detail，8K，ultra-fidelity
character design sheet，character turnaround，
keep the base likeness face unchanged，{overall temperament}，
【L1·Makeup】decide from the user's cues: {base makeup/light makeup/formal makeup}; use {makeup style}，dewy creamy porcelain skin，{brow makeup}，{eye makeup}，{lip makeup}，
【L2·Hairstyle】{styling type}，hair strands separated one by one，{hair ornament description}，
【L3+L4·Clothing】{main color}{design}，{material}，{decorative craft}，clear clothing texture，ultra-crisp texture，
【L5·Accessories】{headpiece}，{earrings}，{neckwear}，{waist ornaments}，
side by side left to right in one frame: portrait close-up+front view+side view+back view，
standing naturally，clean neutral gray background，even soft light，no hard shadow，
four-view consistency，delicate facial rendering，delicate hair-strand rendering，ultra-crisp texture detail
no text of any kind in the image
```

---

## 10. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | After layering, the face must be identical to the base model |
| R2 | Clothing must use "clear clothing texture + ultra-crisp texture" |
| R3 | Female accessories must be "maximalist + master craft" |
| R4 | Makeup/hairstyle/clothing/accessories are unified in style |
| R5 | A four-view design sheet must be output (portrait close-up+front view+side view+back view) |
| R6 | Must specify "clean neutral gray background" |
| R7 | Must specify "four-view consistency" |
| R8 | **Output the prompt only** — outputting quick-lookup tables/layered plans/visual constraints/prohibitions/derivative plans/output suggestions or any other non-prompt content is forbidden |
| R9 | **No scene description** — character derived assets do not touch scene/environment/weather/background narrative; scenes are an independent asset type |
| R10 | **No prop interaction** — contain no handheld or interacted object (umbrella/sword/fan/book and the like); props are an independent asset type |
| R11 | **The pose stays unchanged** — the natural standing pose of the base model must be kept; any change of action/bearing/posture is forbidden |
| R12 | **L1 must analyze before deciding** — parse the user's facial cues first, then settle on base makeup/light makeup/formal makeup |
| R13 | **Every derived asset needs makeup and styling** — normally do not stay bare-faced; use at least base makeup |
| R14 | **Makeup strength stays controlled** — even with makeup applied, stay restrained; no modern heavy makeup/exaggerated color makeup effect |
| R15 | **Props/scenes/actions are not grounds for raising the strength** — prop, environment or action information alone must not raise base makeup to a stronger makeup |

### Strictly forbidden

| No. | Forbidden |
|---|---|
| X1 | Facial drift after layering |
| X2 | Accessories that are too simple/modernized (female) |
| X3 | Makeup/clothing styles clashing with each other |
| X4 | Complex scene backgrounds (a plain gray ground is required) |
| X5 | Costume, makeup and styling inconsistent between the four views |
| X6 | Any content other than the output prompt (tables/plans/suggestions/explanations/variants and the like) |
| X7 | Adding scene description to a character derived asset (mountain path/rain scene/interior/street/weather and other environmental elements) |
| X8 | Outputting sections such as "core-element quick lookup", "layered build plan", "visual constraints", "prohibitions", "derivative plans" |
| X9 | Adding any prop interaction (holding an umbrella/sword/fan/book/lantern/wine cup and the like) |
| X10 | Changing the base model's pose (walking/glancing back/raising a hand/turning sideways/running/lowering the head/looking up and other action descriptions) |
| X11 | Adding descriptions that link expression and pose (such as narrative writing like "turning 45° sideways while walking, corners of the mouth lightly curved") |
| X12 | Applying a preset makeup directly without analyzing the user's cues |
| X13 | Wrongly staying bare-faced, so the derived asset lacks the makeup and styling it should have |
| X14 | Wrongly upgrading the makeup only because of prop/scene/action words, leading to a wrong makeup-strength decision |
