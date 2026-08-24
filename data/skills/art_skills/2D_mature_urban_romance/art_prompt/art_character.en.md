# Base Anime Character Likeness Generation · Constraint Manual

---

## 1. Base likeness principles

1. **The face is the soul** — the features are the character's only anchor; their refinement matches the anime style
2. **Character first** — the base outfit is determined by the character description (identity/occupation/gender/setting) as their ordinary everyday wear; later specific costume and makeup are overlay layers
3. **Four-view consistency** — face/body type/hairstyle/base outfit stay highly consistent across the views
4. **Emotional conveyance** — even bare-faced, the character's temperament must come through (cool-detached/gentle/alluring/stern)

---

## 2. Face constraints

> Facial-feature parameters are no longer fixed. The character description (gender/age/personality/temperament) drives the AI to generate the features freely, so that characters look different from one another.

### General requirements

| Item | Constraint |
|---|---|
| Features | Derived naturally from the character description; do not preset face shape/eye shape/brow shape/nose shape/lip shape |
| Style base | Anime style, cel shading, low-saturation cool tones, cinema-level composition |
| Temperament | Must distil the overall temperament keywords from the character description (such as cool-detached/gentle/alluring) and write them into the prompt |
| Expression | Neutral micro-expression, in keeping with the character's temperament |

---

## 3. Skin constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Cool fair skin, even over the whole body, translucently pale | cool fair skin, fair complexion |
| Sheen | Soft light quality, neither matte nor oily | soft skin light, delicate skin |
| Texture | Fine and smooth, cel-shaded feel | delicate skin, skin texture |
| Exposed skin | Face/neck/collarbone/hands | beautiful shoulder and neck line, fair skin |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Pale and clear with a healthy look, even over the whole body | fair skin tone, healthy skin tone |
| Sheen | Fresh light quality, natural sheen | fresh skin, clear skin |
| Texture | Clean and crisp, cel-shaded sheen | fine skin texture, crisp features |

---

## 4. Body-type constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Height | Set by the character sheet, default range 160-170cm, height expressed by converting into a head-to-body ratio | `{height}cm tall`, `{height description, e.g.: tall slender woman}` |
| Head-to-body ratio | Six and a half to seven and a half heads tall, head-to-body ratio = height ÷ head length, strictly constraining full-body proportion | `6.5-7.5 heads tall proportion`, slender figure |
| Shoulders and neck | Slim shoulder line, collarbone clearly visible | slim shoulder line, clear collarbone |
| Hands | Slender and pale, distinct knuckles, five normal fingers | delicate slender hands, distinct knuckles |
| Posture | Modern urban woman, natural bearing | natural bearing, elegant carriage |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Height | Set by the character sheet, default range 175-185cm, height expressed by converting into a head-to-body ratio | `{height}cm tall`, `{height description, e.g.: tall imposing man}` |
| Head-to-body ratio | Seven to eight heads tall, head-to-body ratio = height ÷ head length, strictly constraining full-body proportion | `7-8 heads tall proportion`, tall figure |
| Shoulders and neck | Broad shoulders, strong neck | broad shoulders narrow waist |
| Hands | Distinct knuckles, broad palms, five normal fingers | distinctly knuckled fingers |
| Posture | Modern urban man, natural bearing | upright carriage, composed bearing |

### Height - head-to-body ratio conversion reference

| Height (cm) | Head-to-body ratio | Head length (cm) | Fitting description |
|---|---|---|---|
| 155-160 | 6.5-7.0 | ~22cm | Petite and dainty |
| 160-165 | 7.0-7.5 | ~22cm | Slim and slender |
| 165-170 | 7.0-7.5 | ~22cm | Tall and elegant (female default) |
| 170-175 | 7.5-8.0 | ~22cm | Slender and upright |
| 175-180 | 7.5-8.0 | ~22cm | Tall and handsome (male default) |
| 180-185 | 8.0 | ~22.5cm | Imposing and upright |
| 185-190 | 8.0-8.5 | ~22cm | Tall and powerfully built |

---

## 5. Base hairstyle constraints

> Only naturally loose hair / simply tied hair is defined here; hair ornaments are added in the costume-and-makeup derivative stage.

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Pure black, dark blue or dark brown; highlights forbidden | black long hair, dark long hair |
| Hair length | Shoulder-length, waist-length or longer | shoulder-length hair, waist-length hair |
| Hair quality | Distinct layering, clear lines | distinctly layered strands, finely rendered strands |
| Styling | Naturally loose, centre/side part, no hair ornament | long hair falling naturally, smooth long hair |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Pure black or dark brown | black hair, dark short/medium hair |
| Hair length | Short to medium-long | short hair, medium-long hair |
| Hair quality | Distinct layering, clear texture | distinctly layered strands, finely rendered strands |
| Styling | Naturally loose or a simple side part, no crown ornament | hair falling naturally, side-part hairstyle |

---

## 6. Base outfit constraints

> The base outfit is the most natural everyday wear implied by the character description (identity/occupation/gender/setting), serving as that character's "everyday default state"; formal costume and special derivatives are added in the costume-and-makeup derivative stage. **Underwear as the base layer is forbidden.**

### Outfit selection principles

| Character identity | Default outfit direction |
|---|---|
| Student | Modern school uniform / academy wear |
| Office worker | Smart casual work wear (shirt + trousers/skirt, light suit) |
| At home/leisure | Urban casual wear (hoodie/T-shirt + jeans/one-piece dress) |
| Fashion/date | Urban fashionable outfit |
| Special occupation | Outfit matching that identity (doctor/police officer/teacher, etc.) |
| Character description unclear | Urban everyday wear, low-saturation cool tones |

### Outfit consistency rules

- The clothing style must match the modern urban anime aesthetic (cel shading, low-saturation cool tones)
- Low-saturation colors, no complex patterns/ornament, so later derivative layers can be added easily
- The outfit design is exactly the same across the four views
- The base outfit is the "everyday default state"; the focus stays on the face and posture
- Underwear/revealing/sexualised base layers are strictly forbidden

---

## 7. Four-view character sheet specification

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Top of head to collarbone | Shown complete from the top of the head to the collarbone with no crop, face fills 60%+, features clear | `portrait closeup`, `face detail`, `head to collarbone complete`, `no crop` |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, arms natural, shown complete from the top of the head to the soles of the feet | `front view`, `full body head to toe`, `height mark` |
| Second from right | Side view | Right 90° | Full-body standing figure | Clean pure-profile silhouette, shown complete from the top of the head to the soles of the feet | `side view`, `profile`, `full body head to toe`, `height mark` |
| Far right | Back view | Rear 180° | Full-body standing figure | Back of the head/back/hair ends/feet clear, shown complete from the top of the head to the soles of the feet | `back view`, `rear view`, `full body head to toe`, `height mark` |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, in one frame |
| Background | Clean neutral gray `#E8E8E8` |
| Standing pose | Standing naturally, feet parallel and slightly apart, arms hanging naturally or slightly out |
| Full-body display | The full-body standing figure must fit in frame complete from the top of the head to the soles of the feet; cropping the crown of the head or the feet is strictly forbidden |
| Close-up display | The portrait close-up must fit in frame complete from the top of the head to the collarbone; cropping the crown of the head is strictly forbidden, and hair, forehead and chin must all be complete |
| Expression | Neutral micro-expression, in keeping with the character's temperament |
| Light | Even soft light, key light from the front + fill from both sides, no hard shadows |
| Consistency | Skin tone/body type/hairstyle/face/base outfit are exactly the same across the four views |
| Aspect ratio | 4:1 or 3:1 recommended |

---

## 8. Prompt template

{gender} character four-view sheet，anime style，cel shading，modern urban style，strong contrast，extreme detail，
character design sheet，character turnaround，
{facial features implied by the character description - derived naturally from it}，{overall temperament}，bare face no makeup，
{skin tone}，soft skin light，delicate skin，cel-shaded feel，
{height description, e.g.: 170cm tall、tall slender woman}，{head-to-body ratio, e.g.: 7 heads tall proportion}，{figure description}，{posture description}，
{hair color}{hair length}，distinctly layered strands，{base styling}，no hair ornament，
{ordinary outfit matching the character's identity, e.g.: modern school uniform/smart casual work wear/urban casual wear}，low-saturation cool tones，no complex pattern，
side by side left to right in one frame: portrait close-up + front view + side view + back view，
the portrait close-up shown complete from the top of the head to the collarbone，crown not cropped，head to collarbone complete，
the full-body standing figure shown complete from head to feet，full body head to toe，crown and feet not cropped，
standing naturally，clean neutral gray background，even soft light，no hard shadows，
four-view consistency，finely rendered features，finely rendered strands
no text of any kind in the image

---

## 9. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must be in a "bare face, no makeup" state |
| R2 | Must state a suitable everyday outfit as the base outfit based on the character description (e.g. student → school uniform, office worker → smart casual work wear, at home → urban casual wear); underwear as the base layer is forbidden |
| R3 | Must state "no hair ornament, no accessories" |
| R4 | Must specify "clean neutral gray background" |
| R5 | Must specify "four-view consistency" |
| R6 | The full-body standing figure must be shown complete from the top of the head to the soles of the feet; cropping is strictly forbidden |
| R7 | Must state the character's height and constrain full-body proportion by converting it into a head-to-body ratio (female default 160-170cm/6.5-7.5 heads, male default 175-185cm/7-8 heads) |
| R8 | The portrait close-up must be shown complete from the top of the head to the collarbone; cropping the crown is strictly forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Underwear/revealing/sexualised base layers; outfits clearly at odds with the character description; over-complex patterns/ornament that interfere with later costume-and-makeup overlays |
| X2 | Hard light from directly overhead/light from directly below/colored light |
| X3 | Whitened to the point of looking bloodless / skin tone going gray |
| X4 | Complex scene backgrounds (a plain gray ground is mandatory) |
| X5 | Exaggerated expressions/dynamic poses |
| X6 | Cropping the crown or the soles in the full-body standing figure — it must fit in frame complete from head to feet |
| X7 | Cropping the crown in the portrait close-up — it must fit in frame complete from the top of the head to the collarbone |
| X8 | Ignoring the height and head-to-body-ratio constraints — height must be stated explicitly and full-body proportion expressed through the head-to-body ratio |
