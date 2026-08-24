# Anime Character Derived Asset Generation · Constraint Manual

---

## 1. Overlay principles

1. **The face does not change** — after the overlay the features must be exactly the same as the base model; face drift is forbidden
2. **The pose does not change** — keep the base model's natural standing pose; any change of pose/action/bearing is forbidden
3. **Layer-by-layer control** — describe each layer independently so layers can be swapped one at a time (change the outfit without changing the makeup)
4. **Unified style** — every costume and makeup element obeys the same aesthetic system
5. **No drop in quality** — after the overlay the texture standard is no lower than the base model
6. **Costume-and-makeup scope only** — overlay makeup/hairstyle/clothing/accessories/footwear only; introducing props, scenes, environments or actions is forbidden

---

## 2. Overlay layers

| Layer | Content | Notes |
|---|---|---|
| L0 | Base model | The base likeness model, not modified |
| L1 | Makeup (decision layer) | First analyse the user's cues, then decide the strength: "base makeup / light makeup / formal makeup" |
| L2 | Hair styling | Bun/tied hair/braids + hair ornaments |
| L3 | Inner garment/base layer | Replaces the white base inner garment |
| L4 | Outer garment/main outfit | Differentiated modern urban clothing (shirt/coat/one-piece dress/suit, etc.) |
| L5 | Accessories | Jewellery/watch/glasses/bags, etc. |
| L6 | Footwear | High heels/ankle boots/loafers/sneakers, etc., forming a complete set with the whole outfit |

> **Scope boundary**: character derived assets cover layers L0–L6 (costume, makeup and styling) only. They do not cover props (phone/book/umbrella/coffee cup and other hand-held objects), scene environments (indoor/outdoor/weather, etc.) or poses and actions (walking/looking back/raising a hand, etc.). Those belong to other asset types.

---

## 3. Makeup constraints (L1)

### Base-model to derivative makeup strategy (key)

> Although the character base model is bare-faced, derived assets enter the makeup flow by default. The system should analyse the makeup requirement from the cues the user provides and decide the strength among base makeup, light makeup and formal makeup, rather than staying bare-faced.

### L1 cue analysis and makeup decision

| Step | What is processed | Decision output |
|---|---|---|
| S1 | Extract the user's cues: facial-state words, emotion words, intensity words | A summary of the makeup requirement |
| S2 | Filter out non-makeup cues: prop/scene/action/pose words are not grounds for applying makeup | Prevents misjudgement |
| S3 | Match the makeup style matrix and give a strength level | Base makeup / light makeup / formal makeup |
| S4 | Produce the final L1 prompt | Output the conclusion only, not the analysis process |

### Cue-to-makeup mapping (execution standard)

| Cue type | Typical cues | L1 decision |
|---|---|---|
| No clear facial-emphasis cue | Only clothing/hairstyle changes, no emphasis on emotion or state | Base makeup |
| Slight facial cue | Soft, smiling, lashes trembling faintly, complexion lifted a little | Light makeup (extremely faint) |
| Clear frailty cue | Pale complexion, extremely faint lip color, faint redness under the eyes | Frail pear makeup (light makeup) |
| Clear formal-ceremony cue | Full dress, ceremony, formal occasion | Formal makeup (controlled) |

> Decision principle: every derived asset must have makeup and styling; look at the facial cues first to decide strength and style — changes of prop, scene or pose must not raise the makeup strength on their own.

### Female makeup style matrix

| Style | Suitable scenes | Core prompt |
|---|---|---|
| Clear elegant plain makeup | Everyday, first meeting, workplace | elegant clear makeup, lightly brushed brows, plain makeup clear face |
| Cool striking frost makeup | Formal, confrontation, business | cool striking makeup, sharp brows and eyes, thin cold lips |
| Soft alluring peach makeup | Sweet-doting, ambiguity, dates | peach-blossom makeup, faint red at the outer eye corner, dewy lip color |
| Frail pear makeup | Injury, weakness | pale complexion, extremely faint lip color, faint redness under the eyes |
| Opulent evening-banquet makeup | Party, banquet | rich gorgeous makeup, vermilion lips bright eyes |

### General base skin (shared by all makeup styles)

| Item | Constraint | Prompt |
|---|---|---|
| Texture | Cel-shaded feel, smooth and fine | cel-shaded grain, smooth skin |
| Whiteness | Cool fair skin, translucent not deathly pale | cool fair skin, fair complexion |
| Inner translucency | Soft light coming from within | inner-lit translucency, translucent skin |
| Forbidden | Matte/dead white/waxy/oily/blown-out | — |

### Base makeup in detail (the default level)

| Item | Constraint | Prompt |
|---|---|---|
| Brows | Lightly groomed along the base model's brow shape, without changing that shape | naturally groomed brows, clean brow shape |
| Eyes | Extremely faint eye work, emphasising clarity and liveliness | clear translucent eyes, extremely faint inner eyeliner |
| Cheeks | Extremely faint complexion lift, no visible build-up of color | natural cheek complexion, faintly lifted complexion |
| Lips | Nude pink or light pink tint, kept restrained | naturally dewy lip color, light pink lip color |
| Overall | Makeup is visible, but the makeup feel is very light | base makeup, no-makeup makeup feel, natural |

### Male makeup

| Item | Constraint | Prompt |
|---|---|---|
| Base skin | Cel-shaded feel, fresh and natural | cel-shaded grain, fresh skin |
| Principle | No-makeup makeup — looks unmade-up but the skin is excellent | no-makeup makeup, naturally good skin |
| Brows | Naturally thick brows, not drawn on | natural brow shape, handsome upright brows |
| Lip color | Natural blood color, slightly dewy | natural lip color, healthy color |

---

## 4. Hair styling constraints (L2)

### Female styling types

| Styling | Description | Suitable for | Prompt |
|---|---|---|---|
| Naturally loose hair | Long hair falling naturally | Everyday, workplace | naturally loose hair, smooth long hair |
| Half-tied hair | Top half tied, lower hair falling | Everyday, commuting | half-tied hair, half-bound hair |
| Ponytail | High ponytail/low ponytail | Sports, leisure | high ponytail, low ponytail |
| Updo | Elegant updo | Formal occasions | elegant updo, updo |
| Twin tails | Girlish twin tails | Lively scenes | twin tails, girlish hairstyle |
| Fully tied hair | Bun/top knot | At home, leisure | top knot, hair bun |

### Female hair ornaments

| Item | Constraint | Prompt |
|---|---|---|
| Style | Simple and refined, matching the outfit | simple hair ornament, refined hair clip |
| Material | Metal/pearlescent/fabric | metal hair clip, pearlescent hair ornament |
| Craft | Refined craft, clear detail | refined craft, clear detail |

### Male styling types

| Styling | Suitable for | Prompt |
|---|---|---|
| Side-part short hair | Everyday, business | side-part short hair, business hairstyle |
| Tousled medium hair | Leisure, artistic | tousled medium hair, artistic hairstyle |
| Crisp short hair | Sports, brisk | crisp short hair, fresh hairstyle |
| Medium-long hair | Formal, artistic | medium-long hair, artistic hairstyle |

---

## 5. Clothing constraints (L3+L4)

### Female clothing matrix

| Style | Design | Suitable for | Prompt |
|---|---|---|---|
| Business formal | Suit skirt set/shirt + suit trousers | Workplace, formal | business formal, professional suit |
| Casual everyday | T-shirt + jeans/one-piece dress | Everyday, leisure | casual wear, everyday clothing |
| Date outfit | One-piece dress/skirt | Dates, date occasions | date outfit, pretty dress |
| Sporty casual | Sportswear/hoodie/track pants | Sports, leisure | sportswear, casual sporty |
| Evening gown | Formal evening gown | Party, evening banquet | evening gown, formal gown |

### Differentiated dressing principles

| Item | Constraint | Notes |
|---|---|---|
| Character differentiation | Let age, occupation, personality and financial situation decide the refinement and cut of the outfit | All characters wearing the same design, same color and same combination is forbidden |
| Difference within one style | Even within workplace wear, distinguish skirt/trousers, coat cut and the layering underneath | Keep a unified aesthetic without turning it into uniforms |
| Fitting the situation | Switch the clothing scheme separately for commuting, dates, staying home and banquets | Clothing should change as the situation changes |

### General constraints for female clothing

| Item | Constraint | Prompt |
|---|---|---|
| Main color | Mainly soft color families, low saturation, but each character needs their own color centre of gravity | soft color tone, low-saturation color, character-specific color scheme |
| Material | Modern fabric feel, clear texture | modern fabric, clear texture |
| Texture quality | Clear fabric texture on the garment | clear garment texture, fabric texture |
| Layering | Distinct clothing layers, sensible combinations, no one-size-fits-all templated outfits | clear clothing layers, well-matched |

### Male clothing matrix

| Style | Suitable for | Prompt |
|---|---|---|
| Business formal | Shirt/suit/casual suit | business formal, suit set |
| Casual everyday | Casual shirt/T-shirt + casual trousers | casual wear, everyday clothing |
| Sporty casual | Sportswear/hoodie/track pants | sportswear, casual sporty |
| Formal dress | Formal dress wear, suit | formal dress, suit formalwear |
| At-home wear | Loungewear, casual wear | loungewear, casual clothing |

### Footwear design (L6)

| Category | Suitable for | Prompt |
|---|---|---|
| Female commuting shoes | Workplace, formal | pointed high heels, kitten heels, loafers, fine leather |
| Female everyday shoes | Leisure, dates | low-cut flats, ankle boots, white sneakers, refined shoe shape |
| Male commuting shoes | Business, formal | leather shoes, derby shoes, loafers, clean crisp uppers |
| Unisex casual shoes | Everyday, sports | sneakers, canvas shoes, simple casual shoes, matching the outfit |

> Footwear must explicitly state the design, material and color scheme, and stay consistent with the clothing style; omitting the foot design or defaulting every character to the same shoes is forbidden.

---

## 6. Accessory constraints (L5)

### Female accessories

| Type | Constraint | Prompt |
|---|---|---|
| Jewellery | Simple and refined, not overly flashy | simple jewellery, refined earrings |
| Watch | Refined watch, fashionable wristwatch | fashionable watch, refined wristwatch |
| Bag | Shoulder bag/handbag, clear material quality | handbag, quality bag |
| Glasses | Fashionable glasses/sunglasses (optional) | fashionable glasses, refined sunglasses |
| Belt | Refined belt, clear detail | refined belt, fashionable belt |

### Male accessories

| Type | Constraint | Prompt |
|---|---|---|
| Watch | Fashionable watch, clear material quality | fashionable watch, refined wristwatch |
| Glasses | Fashionable glasses/sunglasses (optional) | fashionable glasses, refined sunglasses |
| Belt | Refined belt, clear detail | refined belt, fashionable belt |
| Tie | Tie/bow tie (formal occasions) | fashionable tie, refined bow tie |

---

## 7. Costume-and-makeup combination quick reference

| Scene | Makeup | Hairstyle | Clothing | Accessories | Footwear |
|---|---|---|---|---|---|
| Workplace commuting | Clear elegant plain makeup | Half-tied hair/updo | Business formal (can vary between suit skirt set/suit trousers/trench coat layering) | Simple jewellery/watch | High heels/loafers/leather shoes |
| First date | Soft alluring peach makeup | Naturally loose hair | Date outfit (one-piece dress/knit set/skirt) | Refined jewellery/bag | Flats/ankle boots |
| Everyday leisure | Base makeup | Ponytail/naturally loose hair | Casual everyday (T-shirt and jeans/layered shirt/hoodie) | Simple accessories | White sneakers/canvas shoes |
| Formal occasion | Cool striking frost makeup | Updo/half-tied | Business formal/evening gown | Refined jewellery/watch | High heels/dress shoes/leather shoes |
| Sporty leisure | Base makeup (extremely faint) | High ponytail/crisp short hair | Sporty casual | Sports watch/sports accessories | Sneakers |
| Party gathering | Formal makeup | Elegant updo/loose hair | Evening gown/fashion outfit | Refined jewellery/refined accessories | Stiletto heels/ankle boots/dress shoes |
| At-home leisure | Bare face/base makeup | Top knot/naturally loose hair | At-home wear | No or few accessories | Soft-soled slippers/simple house shoes |

---

> **🔍 Inference rule for scenes not covered**
>
> When the scene/situation the user describes is not in the table above, infer it yourself from this style's core DNA:
>
> | Inference dimension | Anime urban romance DNA |
> |---|---|
> | Makeup strength | Clear elegant plain makeup by default; tension/confrontation/authority words → cool striking frost makeup; sweet-doting/ambiguity/heart-flutter → soft alluring peach makeup; weakness/injury → frail pear makeup; evening banquet/party → opulent evening-banquet makeup |
> | Hairstyle | Workplace/commuting → half-tied hair or updo; everyday/romance → naturally loose hair; sports/action → high ponytail; formal occasion → elegant updo |
> | Clothing | Modern urban scenes first; the stronger the emotion, the more refined the outfit; tension scenes → business formal/cool color family |
> | Accessory density | Everyday → simple; date → refined jewellery + bag; formal/evening banquet → refined jewellery + watch; sports → few or none |
> | Color leaning | Cool fair skin + low-saturation urban color scheme; ambiguous scenes → warm pink tone; confrontation/tension → cool gray + black-and-white contrast |

## 8. Four-view character sheet specification

> After the derivative costume-and-makeup overlay, a four-view character sheet must still be output, to ensure the costume, makeup and styling stay consistent from every angle.

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Face to collarbone | Face fills 60%+, features/makeup clear | `portrait closeup`, `face detail`, `makeup detail` |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, full front view of the outfit | `front view`, `height mark` |
| Second from right | Side view | Right 90° | Full-body standing figure | Pure profile silhouette, side layering of the outfit | `side view`, `profile`, `height mark` |
| Far right | Back view | Rear 180° | Full-body standing figure | Hair ornament at the back of the head/back of the outfit/hair ends clear | `back view`, `rear view`, `height mark` |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, in one frame |
| Background | Clean neutral gray `#E8E8E8` |
| Standing pose | Standing naturally, feet parallel and slightly apart, arms hanging naturally or slightly out (**any change of pose is forbidden**) |
| Expression | A micro-expression that suits the makeup style (e.g. clear elegant plain makeup → serene, peach makeup → smiling), limited to facial micro-expression, involving no body movement |
| Light | Even soft light, key light from the front + fill from both sides, no hard shadows |
| Consistency | Face/makeup/hairstyle/hair ornaments/clothing/accessories/footwear are exactly the same across the four views |
| Aspect ratio | 4:1 or 3:1 recommended |

---

## 9. Prompt template

### Output format constraints

| Item | Constraint |
|---|---|
| Output content | **Output the prompt text only**, output nothing else |
| Forbidden output | Quick-reference tables, layered build plans, visual constraint tables, prohibition tables, derivative schemes, output suggestions, core-element tables and every other non-prompt content |
| Forbidden scenes | Character derived assets **contain no scene/environment description**; output no scene/environment/weather/background narrative content (scenes belong to the scene-asset scope) |
| Forbidden props | **Contain no prop interaction**; output no phone/book/umbrella/coffee cup or other hand-held or interacted-with object (props belong to the prop-asset scope) |
| Forbidden pose change | **Do not change the base model's pose**; output no walking/looking back/raising a hand/turning sideways/running or any other action or change of bearing — keep the natural standing pose |
| Format | Output the usable prompt block directly, with no heading, table, explanation or comparison of options |

### Full costume-and-makeup overlay (four views)

Use the character's base likeness image as the base image, img2img overlay of costume, makeup and styling，
anime {gender} character four-view sheet，cel shading，modern urban style，strong contrast，extreme detail，8K，ultra-faithful
character design sheet，character turnaround，
keep the base likeness face unchanged，{overall temperament}，
【L1·Makeup】decided from the user's cues: {base makeup/light makeup/formal makeup}; use {makeup style}，soft skin light，{brow makeup}，{eye makeup}，{lip makeup}，
【L2·Hairstyle】{styling type}，distinctly layered strands，{hair ornament description}，
【L3+L4·Clothing】{main color}{design}，{material}，{decorative craft}，differentiated by the character's identity and the scene, avoid everyone wearing the same design and color，clear garment texture，ultra-crisp texture，
【L5·Accessories】{head ornament}，{earrings}，{watch}，{bag}，
【L6·Footwear】{shoe shape}，{upper material}，{heel/sole description}，consistent with the clothing style，
side by side left to right in one frame: portrait close-up + front view + side view + back view，
standing naturally，clean neutral gray background，even soft light，no hard shadows，
four-view consistency，finely rendered features，finely rendered strands，ultra-crisp texture detail
no text of any kind in the image

---

## 10. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | After the overlay the face must be the same as the base model |
| R2 | Clothing must use "clear garment texture + ultra-crisp texture" |
| R3 | Female accessories must be "simple and refined + clear craft" |
| R4 | Makeup/hairstyle/clothing/accessories/footwear stay unified in style |
| R5 | A four-view character sheet must be output (portrait close-up + front view + side view + back view) |
| R6 | Must specify "clean neutral gray background" |
| R7 | Must specify "four-view consistency" |
| R8 | **Output the prompt only** — outputting quick-reference tables/layered plans/visual constraints/prohibitions/derivative schemes/output suggestions or any other non-prompt content is forbidden |
| R9 | **No scene description** — character derived assets involve no scene/environment/weather/background narrative; scenes are a separate asset type |
| R10 | **No prop interaction** — contain no hand-held or interacted-with object (phone/book/umbrella/coffee cup, etc.); props are a separate asset type |
| R11 | **The pose stays unchanged** — must keep the base model's natural standing pose; any change of action/bearing/posture is forbidden |
| R12 | **L1 must analyse before deciding** — parse the user's facial cues first, then settle on base makeup/light makeup/formal makeup |
| R13 | **Every derived asset needs makeup and styling** — do not stay bare-faced under normal circumstances; use at least base makeup |
| R14 | **Makeup strength is controlled** — even with makeup on, stay restrained; exaggerated color-makeup effects must not appear |
| R15 | **Props/scenes/actions are no grounds for raising strength** — prop, environment or action information alone must not raise base makeup to a stronger makeup |
| R16 | **The footwear design must be explicit** — state at least two of shoe shape, material and color; the foot pairing cannot be omitted |
| R17 | **Clothing must be differentiated** — vary the outfit with the character's identity, age, personality and the scene; applying one clothing template to every character is forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Face drift after the overlay |
| X2 | Accessories that are too plain/too flashy |
| X3 | Makeup/clothing/footwear styles clashing with one another |
| X4 | Complex scene backgrounds (a plain gray ground is mandatory) |
| X5 | Costume, makeup and styling being inconsistent between the four views |
| X6 | Outputting anything other than the prompt (tables/plans/suggestions/explanations/variants, etc.) |
| X7 | Adding a scene description into a character derived asset (modern interior/exterior/weather and other environmental elements) |
| X8 | Omitting the footwear design, leaving the feet with only the base model or no explicit pairing |
| X9 | Every character using the same design, color and cut of clothing, with no character differentiation |
| X10 | Outputting sections such as "core-element quick reference", "layered build plan", "visual constraints", "prohibitions", "derivative schemes" |
| X11 | Adding any prop interaction (holding a phone/book/umbrella/coffee cup or similar object) |
| X12 | Changing the base model's pose (walking/looking back/raising a hand/turning sideways/running/lowering the head/looking up and other action descriptions) |
| X13 | Adding descriptions that link expression and pose (narrative writing such as "walking at a 45° angle with the corner of the mouth faintly curved") |
| X14 | Applying a fixed makeup straight away without analysing the user's cues |
| X15 | Wrongly staying bare-faced, leaving the derived asset without the makeup and styling it should have |
| X16 | Upgrading the makeup by mistake purely because of prop/scene/action words, producing a wrong makeup-strength decision |
