---
name: art_character_derivative
description: Character derived asset generation · constraint manual
metaData: art_skills
---

# Character Derived Asset Generation · Constraint Manual

---

## 1. Overlay principles

1. **The face does not change** — after overlaying, the features must be exactly the same as the base model; face drift is forbidden
2. **The pose does not change** — keep the base model's natural standing pose; any change of pose/action/bearing is forbidden
3. **Layer by layer, controllable** — describe each layer independently, so layers can be swapped one at a time (change the outfit without changing the makeup)
4. **Unified style** — every costume-and-makeup element obeys the same aesthetic system
5. **No drop in quality** — after overlaying, the texture standard is no lower than the base model's
6. **Costume and makeup only** — overlay only makeup/hairstyle/clothing/accessories; introducing props, scenes, environment or actions is forbidden

---

## 2. Overlay layers

| Layer | Content | Notes |
|---|---|---|
| L0 | Base model | The base likeness model, not modified |
| L1 | Makeup (decision layer) | First analyse the user's cues, then decide the intensity: "base makeup / light makeup / formal makeup" |
| L2 | Hairstyle and styling | Chignon/tied hair/braids + hair ornaments |
| L3 | Middle garment/inner layer | Replaces the white base middle garment |
| L4 | Outer garment/main outfit | Ancient-style formal robes/ceremonial dress/everyday dress, etc. |
| L5 | Accessories | Head/ear/neck/waist/hand ornaments |

> **Scope boundary**: a character derived asset covers only layers L0–L5 (costume, makeup and styling). It does not cover props (umbrella/sword/fan/book/lantern and other handheld items), scene environment (indoor/outdoor/weather, etc.) or pose and action (walking/glancing back/raising a hand, etc.). Those belong to other asset types.

---

## 3. Makeup constraints (L1)

### Base-model to derived styling strategy (key)

> The character base model is bare-faced, but a derived asset enters the styling flow by default. The system should analyse the styling need from the cues the user provides and decide the intensity among base makeup, light makeup and formal makeup, rather than staying bare-faced.

### L1 cue analysis and makeup decision

| Step | What is processed | Decision result |
|---|---|---|
| S1 | Extract the user's cues: facial-state words, emotion words, intensity words | A summary of the makeup need |
| S2 | Filter out non-makeup cues: prop/scene/action/pose words are not grounds for makeup | Prevents misjudgement |
| S3 | Match the makeup style matrix and give an intensity tier | Base makeup / light makeup / formal makeup |
| S4 | Generate the final L1 prompt | Output only the conclusion, not the analysis process |

### Cue-to-makeup mapping (how to apply it)

| Cue type | Typical cue | L1 decision |
|---|---|---|
| No clear facial-emphasis cue | Only clothing/hairstyle changes, emotion and state not emphasised | Base makeup |
| Slight facial cue | Gentle, smiling, lashes trembling faintly, complexion slightly lifted | Light makeup (extremely subtle) |
| Clear everyday cue | Everyday, going out, leisure | Base makeup (natural and clear) |
| Clear formal-ceremony cue | Wedding, ceremony, important occasion | Formal makeup (refined and opulent) |

> Judgement principle: every derived asset must have styling; look at the facial cues first to decide intensity and style, and changes of prop, scene or pose must not raise makeup intensity on their own.

### Female makeup style matrix

| Style | Applicable scene | Core prompt |
|---|---|---|
| Fresh plain makeup | Everyday, first encounter, in the boudoir | fresh plain makeup、lightly drawn moth-antenna brows、plain makeup clear face |
| Courtly noble makeup | Court, formal, power | refined makeup、sharp brow shape、rosy lip color |
| Romantic peach-blossom makeup | A date, heart-flutter, sweetness | peach-blossom makeup、slight red at the outer eye corners、dewy lip color |
| Grand wedding full makeup | Wedding, ceremony | rich and splendid makeup、vermilion lips and phoenix eyes |
| Festival celebration | Celebration, gathering | bright colors、pastel makeup |

### Universal base skin (shared by all makeup)

| Item | Constraint | Prompt |
|---|---|---|
| Texture | Cel-shaded flat coloring, naturally translucent | cel-shaded texture、natural sheen、soft texture |
| Fairness | Pink-white key, translucent and not deathly pale | pink-white key、fair and translucent |
| Inner glow | A soft light coming from within | inner glow、translucent glowing skin |
| Forbidden | Matte/dead white/waxy/greasy shine/overexposed | — |

### Base makeup in detail (default tier)

| Item | Constraint | Prompt |
|---|---|---|
| Brows | Lightly groomed along the base model's brow line, brow shape unchanged | naturally groomed brows、clean brow shape |
| Eyes | Extremely subtle eye work, emphasising clarity and liveliness | clear eyes、extremely subtle eyeshadow |
| Cheeks | Extremely subtle lift of complexion, pastel blush | naturally healthy cheek color、pastel blush |
| Lips | Light pink or vermilion tint, kept restrained | naturally moist lip color、light pink lip color |
| Overall | Styling is visible, but the makeup reads as very light | base makeup、natural makeup look、soft texture |

### Male makeup

| Item | Constraint | Prompt |
|---|---|---|
| Base skin | Cel-shaded flat coloring, fair and translucent, fresh and natural | cel-shaded texture、fair and translucent、natural sheen |
| Principle | Faux bare face — looks unmade-up but the skin is superb | faux bare face、naturally great skin |
| Brows | Naturally thick brows, not drawn on | naturally sword-shaped brows、bold brow shape |
| Lip color | Natural blood color, slightly moist | natural lip color、a healthy flush |

---

## 4. Hairstyle and styling constraints (L2)

### Female styling types

| Styling | Description | Suits | Prompt |
|---|---|---|---|
| High cloud chignon | High coiled chignon + hair ornaments | Court, formal | high cloud chignon、refined coiled hair |
| Double-loop bun | Two symmetrical loops, girlish | Young characters | double-loop bun、girlish style |
| Falling-horse chignon | Low chignon to one side, languid | Everyday, leisure | falling-horse chignon、languid side chignon |
| Loose hair | Long hair fully loose, natural | In the boudoir, private | long hair falling loose、falling naturally |
| High ponytail with hair tied up | Tied high, crisp and capable | Martial practice, action | high ponytail、crisp and capable |
| Half-up hair | Top half tied + hair hanging behind | Everyday, going out | half-up cloud chignon、hair falling naturally |

### Female hair ornaments

| Item | Constraint | Prompt |
|---|---|---|
| Style | Ornate and refined, matched to the outfit | ornate hair ornaments、refined craft |
| Material | Gold and silver + pearl and jade + tassels | gold and silver hairpins、head full of pearls and kingfisher ornaments |
| Craft | Delicate lines, clear detail | fine craft、delicate carving |

### Male styling types

| Styling | Suits | Prompt |
|---|---|---|
| Tied hair with half crown | Everyday, scholarly | tied hair with half crown、jade hairpin holding the hair |
| Full crown tied high | Formal, the imperial court | full crown tied high、jade crown holding the hair |
| Loose hair over the shoulders | Private, wounded | loose hair over the shoulders、long hair dark as ink |
| High ponytail with hair tied up | Combat, martial practice | battle hair tied high、crisp ponytail |

---

## 5. Clothing constraints (L3+L4)

### Female clothing matrix

| Style | Cut | Suits | Prompt |
|---|---|---|---|
| Ancient-style long dress | Long dress, flowing | Everyday, in the boudoir | ancient-style long dress、flowing robes |
| Court ceremonial dress | Ceremonial dress, ornate | Court, formal | court ceremonial dress、opulent dress |
| Light everyday wear | Short jacket, light | Action, martial practice | light everyday wear、short jacket |
| Sleepwear | Thin gauze inner garment, plain color | Indoors, night | sleepwear、loose and comfortable |
| Wedding bridal robe | Phoenix crown and xiapei, layered red bridal dress | Wedding | phoenix crown and xiapei、layered red robes |

### Female clothing general constraints

| Item | Constraint | Prompt |
|---|---|---|
| Main color | Traditional Chinese color tones by default | clothing in traditional Chinese color tones、refined clothing |
| Material | Silk + embroidery + pearlescent fabric | silk texture、embroidery detail |
| Texture | The weave must be ultra clear | clear clothing texture、ultra clear weave |
| Shoulders | Silk stole (pibo)/cloud collar/ornament | ornate cloud collar、ornament at the shoulder |
| Layering | Multiple layers worn over one another, clearly layered | multiple worn layers、clearly layered |

### Male clothing matrix

| Style | Suits | Prompt |
|---|---|---|
| Scholar's robe | Everyday, the study | scholar's robe、long robe |
| Warrior's fighting garb | Combat, martial training | warrior's fighting garb、battle robe |
| Court robe | The imperial court, ceremony | court robe、formal ceremonial dress |
| Informal everyday robe | Leisure, private | informal everyday robe、simple style |
| Ceremonial dress | Formal, celebration | ceremonial dress、opulent and refined |

---

## 6. Accessory constraints (L5)

### Female accessories

| Type | Constraint | Prompt |
|---|---|---|
| Head ornament | Ornate and refined, never sparse | ornate head ornament、head full of pearls and kingfisher ornaments |
| Ear ornament | Hanging tassels/jade ear pendants | tassel earrings、hanging jade ear pendants |
| Neck ornament | Yingluo beaded collar/torque | ornate yingluo beaded collar、refined torque |
| Waist ornament | Palace silk cord/jade pendant | flowing palace silk cord、jade pendant at the waist |
| Hand ornament | Jade bangle/armlet | translucent jade bangle、refined armlet |

### Male accessories

| Type | Constraint | Prompt |
|---|---|---|
| Hair crown | Jade crown/gold crown, refined | jade crown holding the hair |
| Waist sash | Wide waist sash/leather belt | wide waist sash、distinct texture |
| Jade pendant | Translucent and mellow | jade pendant at the waist |
| Weapon | Sword/fan/flute (optional) | a long sword at the side、a folding fan half raised |

---

## 7. Costume-and-makeup combination quick reference

| Scene | Makeup | Hairstyle | Clothing | Accessories |
|---|---|---|---|---|
| Everyday in the boudoir | Fresh plain makeup | Loose hair/half-up hair | Ancient-style long dress | Medium |
| First encounter | Fresh plain makeup | Half-up hair/falling-horse chignon | Ancient-style long dress | Medium to many |
| Romantic interaction | Romantic peach-blossom makeup | Half-up hair/falling-horse chignon | Ancient-style long dress/light wear | Medium |
| Formal appearance | Courtly noble makeup | High cloud chignon | Court ceremonial dress | Extremely elaborate |
| Night, private | Fresh plain/peach-blossom makeup | Loose hair/falling-horse chignon | Sleepwear | Extremely minimal |
| Wedding ceremony | Grand wedding full makeup | High cloud chignon | Bridal robe | Extremely elaborate |
| Martial practice, action | Plain makeup (extremely subtle) | Tied hair, ponytail | Light everyday wear | Simple |

---

> **🔍 Rule for inferring uncovered scenes**
>
> When the scene or situation the user describes is not in the table above, infer it yourself from this style's core DNA:
>
> | Inference dimension | Guofeng anime DNA |
> |---|---|
> | Makeup intensity | Fresh plain makeup by default; festival/ceremony/formal keywords → courtly noble makeup; sweet-love/heart-flutter words → peach-blossom makeup |
> | Hairstyle | Everyday/in the boudoir → half-up hair or falling-horse chignon; formal/appearance → high cloud chignon; private/night → loose hair; action → tied hair, ponytail |
> | Clothing | Emotional drama/everyday → ancient-style long dress (soft and flowing); power/formal → court ceremonial dress; action/combat → light everyday wear |
> | Accessory density | Everyday → medium; formal → extremely elaborate (pearl-and-kingfisher hair ornaments + yingluo beaded collar + waist ornament); private/leisure → simple; action → simple |
> | Color leaning | Traditional Chinese colors as the anchor (frost white/moon white/cinnabar/indigo); night scene/private → lower the saturation; festive → warm red + gold |

## 8. Four-view character sheet specification

> After the derived costume and makeup are overlaid, a four-view character sheet must still be output, to guarantee the styling stays consistent at every angle.

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Face to collarbone | Face fills 60%+, features/makeup clear | portrait closeup、face detail、makeup detail |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, full front view of the outfit | front view、height mark |
| Second from right | Side view | Right 90° | Full-body standing figure | Pure profile silhouette, side layering of the outfit | side view、profile、height mark |
| Far right | Back view | Rear 180° | Full-body standing figure | Hair ornaments at the back of the head/back of the outfit/hair ends clear | back view、rear view、height mark |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, in one frame |
| Background | Solid moon white #E8EAF5 |
| Standing pose | Standing naturally, feet parallel and slightly apart, arms hanging naturally or slightly out (**any change of pose is forbidden**) |
| Expression | A micro-expression matching the makeup style (e.g. fresh plain makeup → serene, peach-blossom makeup → smiling), limited to facial micro-expression, involving no body action |
| Light | Even soft light, key light in front + fill on both sides, no hard shadow |
| Consistency | Face/makeup/hairstyle/hair ornaments/clothing/accessories are exactly the same across the four views |
| Aspect ratio | 4:1 or 3:1 recommended |

---

## 9. Prompt template

### Output format constraints

| Item | Constraint |
|---|---|
| Output content | **Output the prompt text only**, output nothing else |
| Forbidden output | Quick-reference tables, layered build plans, visual constraint tables, prohibition tables, derivative plans, output suggestions, core-element tables and every other non-prompt content |
| Forbidden scenes | A character derived asset **contains no scene/environment description**; output no scene/environment/weather/background narrative content (scenes belong to the scene asset type) |
| Forbidden props | **Contains no prop interaction**; output no umbrella/sword/fan/book/lantern/wine cup or other handheld or interacted objects (props belong to the prop asset type) |
| Forbidden pose change | **Do not change the base model's pose**; output no walking/glancing back/raising a hand/turning sideways/running or any other action or bearing change — keep the natural standing pose |
| Format | Output a usable prompt code block directly, with no heading, table, explanation or plan comparison |

### Complete costume-and-makeup overlay (four views)

with the character base likeness image as the base image，overlay costume and makeup with img2img，
Guofeng anime，new Guochao aesthetic，Japanese anime rendering，cel-shaded flat coloring，delicate brushwork，
ancient-style {gender} character four-view sheet，Guofeng anime，cel shading，8K，ultra faithful
character design sheet, character turnaround,
keep the base likeness face unchanged，{overall temperament},
【L1·Makeup】decide from the user's cues：{base makeup/light makeup/formal makeup}；use {makeup style}, cel-shaded flat coloring, {brow makeup}, {eye makeup}, {lip makeup},
【L2·Hairstyle】{styling type}, delicate hair strands clear, {hair ornament description},
【L3+L4·Clothing】{main color}{cut}, {material}, {decorative craft}, clear clothing texture, cel-shaded flat coloring,
【L5·Accessories】{head ornament}, {ear ornament}, {neck ornament}, {waist ornament},
side by side left to right in one frame: portrait close-up + front view + side view + back view,
standing naturally, solid moon white background, even soft light, no hard shadow,
four-view consistency, clear Guofeng anime silhouette, clear delicate lines,
no text of any kind in the image

---

## 10. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | After overlaying, the face must match the base model |
| R2 | Clothing must use "clear clothing texture + cel-shaded flat coloring" |
| R3 | Female accessories must be "ornate and refined + finely crafted" |
| R4 | Makeup/hairstyle/clothing/accessories are unified in style |
| R5 | Must output a four-view character sheet (portrait close-up + front view + side view + back view) |
| R6 | Must specify "solid moon white background" |
| R7 | Must specify "four-view consistency" |
| R8 | **Output the prompt only** — outputting quick-reference tables/layered plans/visual constraints/prohibitions/derivative plans/output suggestions or any other non-prompt content is forbidden |
| R9 | **No scene description** — a character derived asset involves no scene/environment/weather/background narrative; scenes are a separate asset type |
| R10 | **No prop interaction** — contains no handheld or interacted objects (umbrella/sword/fan/book, etc.); props are a separate asset type |
| R11 | **The pose stays unchanged** — must keep the base model's natural standing pose; any change of action/bearing/posture is forbidden |
| R12 | **L1 must analyse before deciding** — first parse the user's facial cues, then settle on base makeup/light makeup/formal makeup |
| R13 | **Every derived asset needs styling** — under normal circumstances do not stay bare-faced; use at least base makeup |
| R14 | **Makeup intensity is controlled** — even with makeup on, stay restrained; modern heavy makeup/exaggerated color makeup effects must not appear |
| R15 | **Props/scenes/actions are no grounds for an intensity upgrade** — prop, environment or action information alone must not raise base makeup to a stronger makeup |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Face drift after overlaying |
| X2 | Accessories that are too simple/modernised (female) |
| X3 | Makeup and clothing styles that clash with each other |
| X4 | Complex scene backgrounds (a solid color is mandatory) |
| X5 | Costume, makeup and styling inconsistent between the four views |
| X6 | Any content other than the prompt (tables/plans/suggestions/explanations/variants, etc.) |
| X7 | Adding a scene description to a character derived asset (street view/rain/interior/street/weather and other environmental elements) |
| X8 | Outputting sections such as "core-element quick reference", "layered build plan", "visual constraints", "prohibitions", "derivative plans" |
| X9 | Adding any prop interaction (holding an umbrella/sword/fan/book/lantern/wine cup and similar objects) |
| X10 | Changing the base model's pose (walking/glancing back/raising a hand/turning sideways/running/lowering the head/looking up and other action descriptions) |
| X11 | Adding descriptions that link expression and pose (narrative writing such as "turned 45° sideways, walking, the corner of the mouth slightly curved") |
| X12 | Applying a fixed makeup look directly without analysing the user's cues |
| X13 | Wrongly staying bare-faced, leaving the derived asset without the styling it should have |
| X14 | Upgrading the makeup by mistake purely because of prop/scene/action words, leading to a wrong styling-intensity decision |
