---
name: art_character_derivative
description: Character derived asset generation · constraint manual
metaData: art_skills
---

# Character Derived Asset Generation · Constraint Manual

---

## 1. Overlay principles

1. **The face does not change** — after overlaying, the features must match the base model exactly; any facial drift is forbidden
2. **The pose does not change** — keep the base model's natural standing pose; any change of pose/action/bearing is forbidden
3. **Controllable layer by layer** — each layer is described independently, so layers can be swapped (change the outfit without changing the makeup)
4. **Unified style** — every costume and makeup element obeys the same aesthetic system
5. **No drop in texture** — after overlaying, the texture standard is no lower than the base model's
6. **Costume and makeup only** — overlay makeup/hairstyle/costume/accessories only; introducing props, scenes, environment or action is forbidden

---

## 2. Overlay layers

| Layer | Content | Notes |
|---|---|---|
| L0 | Base model | The base image base model, not modified |
| L1 | Makeup (decision layer) | Analyze the user's clues first, then decide the strength: "base makeup / light makeup / formal makeup" |
| L2 | Hairstyle | Bun/tied hair/braids + hair ornaments |
| L3 | Middle layer/inner wear | Replaces the white base middle garment |
| L4 | Outer garment/main outfit | Guofeng-era splendid robes/ceremonial dress/everyday dress, etc. |
| L5 | Accessories | Head/ear/neck/waist/hand ornaments |

> **Scope boundary**: character derived assets cover only layers L0–L5 (costume, hair and makeup). They do not cover props (umbrella/sword/fan/book/lantern and other held objects), scene environment (interior/exterior/weather, etc.) or pose and action (walking/glancing back/raising a hand, etc.). Those belong to other asset types.

---

## 3. Makeup constraints (L1)

### Base model to derived makeup strategy (key)

> The character base model is bare-faced, but derived assets enter the makeup flow by default. The system should analyze the makeup requirement from the clues the user provides and decide the strength among base makeup, light makeup and formal makeup, rather than staying bare-faced.

### L1 clue analysis and makeup decision

| Step | What is processed | Decision result |
|---|---|---|
| S1 | Extract the user's clues: facial-state words, emotion words, intensity words | Form a summary of the makeup requirement |
| S2 | Filter out non-makeup clues: prop/scene/action/pose words are not grounds for applying makeup | Prevent misjudgement |
| S3 | Match the makeup style matrix and give a strength tier | Base makeup / light makeup / formal makeup |
| S4 | Generate the final L1 prompt | Output only the conclusion, not the analysis process |

### Clue to makeup mapping (execution standard)

| Clue type | Typical clue | L1 decision |
|---|---|---|
| No clear facial-emphasis clue | Only costume/hairstyle changes, with no emphasis on emotion or state | Base makeup |
| Slight facial clue | Gentle, smiling, lashes trembling lightly, complexion slightly lifted | Light makeup (extremely faint) |
| Clear everyday clue | Everyday, going out, leisure | Base makeup (natural and clear) |
| Clear formal-ceremony clue | Wedding, ceremony, important occasion | Formal makeup (refined and opulent) |

> Decision principle: every derived asset must carry makeup; look at the facial clues first to decide strength and style, and prop, scene or pose changes must never raise the makeup strength on their own.

### Female makeup style matrix

| Style | Applicable scenes | Core prompt |
|---|---|---|
| Clear plain makeup | Everyday, first meeting, in the boudoir | clear elegant makeup、lightly drawn brows、plain makeup and clear face |
| Courtly noble makeup | Court, formal, power | refined makeup、sharp brow shape、rosy lip color |
| Romantic peach-blossom makeup | Dates, heart-flutter, sweetness | peach-blossom makeup、slight red at the eye corners、dewy lip color |
| Grand wedding makeup | Wedding, ceremony | heavy splendid makeup、vermilion lips and phoenix eyes |
| Festival celebration | Celebration, gathering | bright color、pastel makeup |

### Universal base skin (shared by every makeup)

| Item | Constraint | Prompt |
|---|---|---|
| Texture | PBR material rendering, naturally translucent | PBR materials、natural sheen、soft texture |
| Whiteness | Pink-white keynote, translucent not ghostly | pink-white keynote、fair and translucent |
| Inner glow | A soft light from within | inner glow、skin translucent and luminous |
| Forbidden | Matte/dead white/waxy/oily/overexposed | — |

### Base makeup detail (default tier)

| Item | Constraint | Prompt |
|---|---|---|
| Brows | Lightly tidied along the base model's brow shape, without changing it | naturally tidied brows、clean brow shape |
| Eyes | Extremely faint eye work, emphasizing clarity and liveliness | clear eyes、extremely faint eyeshadow |
| Cheeks | An extremely faint lift of complexion, pastel blush | natural cheek complexion、pastel blush |
| Lips | Pale pink or vermilion tint, kept restrained | naturally dewy lip color、pale pink lip color |
| Overall | Makeup is visible, but the makeup feel is very light | base makeup、natural makeup feel、soft texture |

### Male makeup

| Item | Constraint | Prompt |
|---|---|---|
| Base skin | PBR material rendering, fair and translucent, fresh and natural | PBR materials、fair and translucent、natural sheen |
| Principle | Pseudo-bare-faced — looks unmade-up but the skin is superb | pseudo-bare-faced、naturally good skin |
| Brows | Naturally thick brows, not drawn | natural sword brows、handsome brow shape |
| Lip color | Natural blood color, slightly dewy | natural lip color、a look of good blood color |

---

## 4. Hairstyle constraints (L2)

### Female styling types

| Styling | Description | Applicable | Prompt |
|---|---|---|---|
| High cloud bun | High coiled bun + hair ornaments | Court, formal | high cloud bun、refined coiled hair |
| Double-ring bun | Two symmetrical rings, girlish | Young characters | double-ring bun、girlish style |
| Falling-horse bun | Low bun to one side, languid | Everyday, leisure | falling-horse bun、languid side bun |
| Loose hair | All the long hair loose, natural | In the boudoir, private | long hair falling loose、falling naturally |
| High ponytail | Tied high, crisp and capable | Martial training, action | high ponytail、crisp and capable |
| Half-tied hair | Top half tied + hair falling behind | Everyday, going out | half-tied cloud bun、hair falling naturally |

### Female hair ornaments

| Item | Constraint | Prompt |
|---|---|---|
| Style | Ornate and refined, matched to the costume | ornate hair ornaments、refined craft |
| Material | Gold and silver + pearl and jade + tassels | gold and silver hairpins、a head full of pearls and kingfisher feather |
| Craft | High-precision modeling, clear detail | high-precision craft、fine carving |

### Male styling types

| Styling | Applicable | Prompt |
|---|---|---|
| Tied hair with half crown | Everyday, scholar | tied hair with half crown、jade pin holding the hair |
| Full crown tied high | Formal, court | full crown tied high、jade crown holding the hair |
| Loose hair over the shoulders | Private, wounded | loose hair over the shoulders、long hair black as ink |
| High ponytail | Combat, martial training | high battle-tied hair、crisp ponytail |

---

## 5. Costume constraints (L3+L4)

### Female costume matrix

| Style | Design | Applicable | Prompt |
|---|---|---|---|
| Ancient-style long skirt | Long skirt, flowing | Everyday, in the boudoir | ancient-style long skirt、flowing robes and skirt |
| Court ceremonial dress | Ceremonial dress, ornate | Court, formal | court ceremonial dress、opulent skirt outfit |
| Light everyday dress | Short jacket, light | Action, martial training | light everyday dress、short jacket |
| Sleepwear | Thin gauze inner garment, plain color | Interior, night | sleepwear、loose and comfortable |
| Grand wedding robes | Phoenix coronet and rosy cape, layered red dress | Wedding | phoenix coronet and rosy cape、layered red robes |

### Universal constraints for female costume

| Item | Constraint | Prompt |
|---|---|---|
| Main color | Traditional Chinese tones by default | clothing in traditional Chinese tones、refined costume |
| Material | Silk + embroidery + pearlescent fabric | silk texture、embroidery detail |
| Texture | The grain must be ultra-clear | clear clothing texture、ultra-clear grain |
| Shoulders | Silk shawl/cloud collar/ornament | splendid cloud collar、ornament at the shoulder |
| Layering | Multiple layers worn together, clearly distinct | multiple layers worn together、clearly distinct layers |

### Male costume matrix

| Style | Applicable | Prompt |
|---|---|---|
| Scholar's dress | Everyday, study | scholar's dress、long robe |
| Warrior's fitted dress | Combat, martial practice | warrior's fitted dress、battle robe |
| Court robe | Court, ceremony | court robe、formal ceremonial dress |
| Everyday casual dress | Leisure, private | everyday casual dress、simple style |
| Ceremonial dress | Formal, celebration | ceremonial dress、opulent and refined |

---

## 6. Accessory constraints (L5)

### Female accessories

| Type | Constraint | Prompt |
|---|---|---|
| Head ornaments | Ornate and refined, never sparse | ornate head ornaments、a head full of pearls and kingfisher feather |
| Ear ornaments | Hanging tassels/jade ear pendants | tassel earrings、hanging jade ear pendants |
| Neck ornaments | Yingluo collar/torque | splendid yingluo collar、refined torque |
| Waist ornaments | Palace cord/jade pendant | flowing palace cord、jade pendant at the waist |
| Hand ornaments | Jade bracelet/arm bangle | translucent jade bracelet、refined arm bangle |

### Male accessories

| Type | Constraint | Prompt |
|---|---|---|
| Hair crown | Jade crown/gold crown, refined | jade crown holding the hair |
| Waist sash | Wide sash/leather belt | wide sash、distinct texture |
| Jade pendant | Translucent and warm | jade pendant at the waist |
| Weapon | Sword/fan/flute (optional) | long sword at the side、folding fan half raised |

---

## 7. Costume and makeup combination quick lookup

| Scene | Makeup | Hairstyle | Costume | Accessories |
|---|---|---|---|---|
| Everyday in the boudoir | Clear plain makeup | Loose hair/half-tied hair | Ancient-style long skirt | Medium |
| First meeting | Clear plain makeup | Half-tied hair/falling-horse bun | Ancient-style long skirt | Medium to many |
| Romantic interaction | Romantic peach-blossom makeup | Half-tied hair/falling-horse bun | Ancient-style long skirt/light dress | Medium |
| Formal appearance | Courtly noble makeup | High cloud bun | Court ceremonial dress | Extremely elaborate |
| Private at night | Clear plain/peach-blossom makeup | Loose hair/falling-horse bun | Sleepwear | Extremely minimal |
| Grand wedding ceremony | Grand wedding makeup | High cloud bun | Wedding robes | Extremely elaborate |
| Martial training, action | Plain makeup (extremely faint) | High ponytail | Light everyday dress | Simple |

---

> **🔍 Inference rule for scenes not covered**
>
> When the scene/situation the user describes is not in the table above, infer it yourself from the core DNA of this style:
>
> | Inference dimension | Guofeng 3D render DNA |
> |---|---|
> | Makeup strength | Clear plain makeup by default; court/power/formal→courtly noble makeup; heart-flutter/sweet romance→romantic peach-blossom makeup; wedding/ceremony→grand wedding makeup; festival gathering→festival celebration makeup |
> | Hairstyle | Everyday/in the boudoir→half-tied hair or falling-horse bun; court/formal→high cloud bun; private/night→loose hair; martial training/action→high ponytail |
> | Costume | Ancient dress is the keynote; emotional scenes→flowing long skirt; power/formal→court ceremonial dress; action→light everyday dress; PBR materials always maintained |
> | Accessory density | Everyday→medium; formal/court→extremely elaborate (gold and silver hair ornaments + yingluo collar + jade pendant); private→extremely minimal; action→simple |
> | Texture baseline | PBR materials + cinema-level lighting always locked; a sense of volume and sheen takes priority over flat decorative feel |

## 8. Four-view design sheet specification

> After the derived costume and makeup are overlaid, a four-view design sheet must still be output, to ensure the costume, hair and makeup stay consistent at every angle.

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Face to collarbone | Face fills 60%+, features/makeup clear | portrait closeup、face detail、makeup detail |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, the whole front of the costume | front view、height mark |
| Second from right | Side view | Right 90° | Full-body standing figure | Pure profile silhouette, the side layering of the costume | side view、profile、height mark |
| Far right | Back view | Rear 180° | Full-body standing figure | Hair ornaments at the back of the head/costume back/hair ends clear | back view、rear view、height mark |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, in one frame |
| Background | Plain gray solid color #B8B8B8 |
| Standing pose | Standing naturally, feet parallel and slightly apart, arms hanging naturally or slightly out (**any change of pose is forbidden**) |
| Expression | A micro-expression matching the makeup style (clear plain makeup→serene, peach-blossom makeup→smiling); facial micro-expression only, involving no body action |
| Light | Even soft light, key light from the front + fill light on both sides, no hard shadow |
| Consistency | Face/makeup/hairstyle/hair ornaments/costume/accessories are exactly the same across the four views |
| Aspect ratio | 4:1 or 3:1 recommended |

---

## 9. Prompt template

### Output format constraints

| Item | Constraint |
|---|---|
| Output content | **Output the prompt text only**, and nothing else |
| Forbidden output | Quick-lookup tables, layered construction plans, visual constraint tables, prohibition tables, derivation plans, output suggestions, core-element tables and any other non-prompt content |
| Forbidden scenes | Character derived assets **contain no scene/environment description**; output no scene/environment/weather/background narrative content (the scene belongs to the scene asset category) |
| Forbidden props | **No prop interaction of any kind**; output no umbrella/sword/fan/book/lantern/wine cup or other held or interacted object (props belong to the prop asset category) |
| Forbidden pose change | **Do not change the base model's pose**; output no walking/glancing back/raising a hand/turning side-on/running or any other action or bearing change — keep the natural standing pose |
| Format | Output a usable prompt code block directly, with no heading, table, explanation or plan comparison |

### Complete costume and makeup overlay (four views)

Take the character base image as the underlying image and overlay the costume, hair and makeup with img2img，
3D render style，high-precision modeling，PBR materials，Guofeng 3D，cinema-level lighting，
Guofeng-era {gender} character four-view design sheet，3D render，high-precision modeling，8K，ultra-faithful
character design sheet, character turnaround,
keep the face of the base image unchanged，{overall temperament},
【L1·Makeup】decide from the user's clues: {base makeup/light makeup/formal makeup}; use {makeup style}, PBR material rendering, {brow makeup}, {eye makeup}, {lip makeup},
【L2·Hairstyle】{styling type}, high-precision clear hair strands, {hair ornament description},
【L3+L4·Costume】{main color}{design}, {material}, {decorative craft}, clear clothing texture, PBR material rendering,
【L5·Accessories】{head ornaments}, {ear ornaments}, {neck ornaments}, {waist ornaments},
side by side left to right in one frame：portrait close-up+front view+side view+back view,
standing naturally, plain gray solid-color background, even soft light, no hard shadow,
four-view consistency, clear 3D Guofeng-era modeling, clear high-precision modeling,
no text of any kind in the image

---

## 10. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | After overlaying, the face must match the base model |
| R2 | The costume must use "clear clothing texture + PBR material rendering" |
| R3 | Female accessories must be "ornate and refined + finely crafted" |
| R4 | Makeup/hairstyle/costume/accessory styles are unified |
| R5 | A four-view design sheet must be output (portrait close-up+front view+side view+back view) |
| R6 | Must specify "plain gray solid-color background" |
| R7 | Must specify "four-view consistency" |
| R8 | **Output the prompt only** — outputting quick-lookup tables/layered plans/visual constraints/prohibitions/derivation plans/output suggestions or any other non-prompt content is forbidden |
| R9 | **No scene description** — character derived assets involve no scene/environment/weather/background narrative; the scene is an independent asset type |
| R10 | **No prop interaction** — no held or interacted object of any kind (umbrella/sword/fan/book, etc.); props are an independent asset type |
| R11 | **The pose stays unchanged** — the base model's natural standing pose must be kept; any change of action/bearing/posture is forbidden |
| R12 | **L1 must analyze before deciding** — parse the user's facial clues first, then settle on base makeup/light makeup/formal makeup |
| R13 | **Every derived asset needs makeup** — normally it does not stay bare-faced; use at least base makeup |
| R14 | **Makeup strength is controlled** — even with makeup applied it must stay restrained; modern heavy makeup/exaggerated color makeup effects must not appear |
| R15 | **Props/scenes/actions are not grounds for raising the strength** — prop, environment or action information alone must never raise base makeup to a stronger makeup |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Facial drift after overlaying |
| X2 | Accessories too simple/modernized (female) |
| X3 | Makeup/costume styles clashing with each other |
| X4 | A complex scene background (it must be a solid color) |
| X5 | Costume, hair and makeup inconsistent between the four views |
| X6 | Any content beyond the output prompt (tables/plans/suggestions/explanations/variants, etc.) |
| X7 | Adding a scene description to a character derived asset (street view/rain/interior/street/weather or other environmental elements) |
| X8 | Outputting sections such as "core element quick lookup", "layered construction plan", "visual constraints", "prohibitions" or "derivation plans" |
| X9 | Adding any prop interaction (holding an umbrella/sword/fan/book/lantern/wine cup or other object) |
| X10 | Changing the base model's pose (walking/glancing back/raising a hand/turning side-on/running/lowering the head/looking up or other action descriptions) |
| X11 | Adding descriptions that link expression and pose (narrative writing such as "walking side-on at 45° with the corner of the mouth curving slightly") |
| X12 | Applying a fixed makeup directly without analyzing the user's clues |
| X13 | Wrongly staying bare-faced, so the derived asset lacks the makeup it should have |
| X14 | Wrongly upgrading the makeup on prop/scene/action words alone, leading to a wrong makeup-strength decision |
