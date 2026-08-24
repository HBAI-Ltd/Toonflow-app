# art_character_3d.md
# 3D Anime Character Base Likeness Generation · Constraint Manual

---

## 1. Base likeness principles

1. **The face is the soul** — the features are the character's only anchor, rendered at cel-shaded precision
2. **Character first** — the base outfit is determined by the character description (identity/occupation/gender/setting) as their ordinary everyday wear; later specific costume and makeup are overlay layers
3. **Four-view consistency** — face/body type/hairstyle/base outfit stay highly consistent across the views
4. **Warm, cute, healing** — even with no makeup, the character's temperament must still come through (cheerful/gentle/spirited)

---

## 2. Face constraints

> Facial-feature parameters are no longer fixed. The character description (gender/age/personality/temperament) drives the AI to generate the features freely, so that characters look different from one another.

### General requirements

| Item | Constraint |
|---|---|
| Features | Derived naturally from the character description; do not preset face shape/eye shape/brow shape/nose shape/lip shape |
| Style base | 3D cel-shaded anime rendering, warm-toned color scheme, cartoon proportions, joyful healing atmosphere |
| Temperament | Must distil the overall temperament keywords from the character description (e.g. warm/spirited/healing/sunny) and write them into the prompt |
| Expression | Neutral micro-expression, in keeping with the character's temperament |

---

## 3. Skin constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Warm fair skin, even over the whole body, translucent | warm fair skin, peach-toned skin, peach skin |
| Sheen | Soft-glow skin, inner translucency, not matte | soft-glow skin, inner glow, soft glow |
| Texture | Fine and smooth, cel-shaded render texture | fine skin, cel-shaded texture |
| Exposed skin | Face/neck/collarbone/hands | beautiful shoulder and neck line, warm fair translucent skin |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Warm beige, healthy-looking, even over the whole body | warm beige, healthy skin tone |
| Sheen | Fresh soft glow, natural sheen | soft-glow skin, translucent fresh skin |
| Texture | Clean and fine, cel-shaded sheen | fine skin texture, fresh face |

---

## 4. Body-type constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Height | Set by the character sheet, default range 155-165cm | {height}cm tall, {height description, e.g.: petite girl} |
| Head-to-body ratio | Six to seven heads tall; head-to-body ratio = height ÷ head length | 6-7 heads tall proportion, petite figure |
| Height conversion | Head length = height ÷ head-to-body ratio (e.g. 160cm ÷ 6.5 = 24.6cm head length) | cute proportions, harmonious head-to-body ratio |
| Shoulders and neck | Soft shoulders and neck, flowing lines | soft shoulder line, graceful neck |
| Hands | Small and rounded, soft knuckles | rounded small hands, defined knuckles |
| Posture | Spirited girl, light-footed carriage | light carriage, nimble bearing |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Height | Set by the character sheet, default range 170-180cm | {height}cm tall, {height description, e.g.: tall cute boy} |
| Head-to-body ratio | Six and a half to seven and a half heads tall; head-to-body ratio = height ÷ head length | 6.5-7.5 heads tall proportion, well-proportioned figure |
| Height conversion | Head length = height ÷ head-to-body ratio (e.g. 175cm ÷ 7 = 25cm head length) | cute proportions, harmonious head-to-body ratio |
| Shoulders and neck | Rounded shoulders, natural neck | rounded shoulders, natural neckline |
| Hands | Rounded palms, soft knuckles | rounded palms, defined knuckles |
| Posture | Sunny boy/gentle senior (per the character) | upright bearing, sunny carriage |

### Height-to-head-ratio conversion reference

| Height (cm) | Head-to-body ratio | Head length (cm) | Fitting description |
|---|---|---|---|
| 150-155 | 6.0 | ~25cm | Petite and cute |
| 155-160 | 6.0-6.5 | ~25cm | Sweet and petite |
| 160-165 | 6.5 | ~24.6cm | Fresh young girl (female default) |
| 165-170 | 6.5-7.0 | ~25cm | Tall slender girl |
| 170-175 | 7.0 | ~25cm | Clean-cut young man |
| 175-180 | 7.0-7.5 | ~25cm | Sunny boy (male default) |
| 180-185 | 7.5 | ~25cm | Handsome and tall |

---

## 5. Base hairstyle constraints

> Only naturally loose hair / simply tied hair is defined here; hair ornaments are added in the costume-and-makeup derivative stage.

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Warm brown/light chestnut/chocolate | warm brown long hair, chestnut with a golden cast |
| Hair length | Shoulder-length or long | long hair down to the shoulders |
| Hair quality | Strand by strand distinct, clear locks, cel-shaded texture | individually distinct hair strands, finely rendered hair strands |
| Styling | Naturally loose, centre/side part, no hair ornament | long hair falling naturally, smooth as a waterfall |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Warm brown/dark coffee | dark brown short hair, coffee-colored hair |
| Hair length | Short to medium-long | short hair, ear-length short hair |
| Hair quality | Strand by strand distinct, clear texture | individually distinct hair strands, finely rendered hair strands |
| Styling | Naturally loose or side-parted, no hair ornament | short hair falling naturally, side-parted hairstyle |

---

## 6. Base outfit constraints

> The base outfit is the most natural everyday wear implied by the character description (identity/occupation/gender/setting), serving as that character's "everyday default state"; formal costume and special derivatives are added in the costume-and-makeup derivative stage. **Underwear as the base layer is forbidden.**

### Outfit selection principles

| Character identity | Default outfit direction |
|---|---|
| Student | School uniform / academy wear |
| Office worker | Smart casual work wear (shirt + trousers/skirt, light suit) |
| At home/leisure | Urban casual wear (hoodie/T-shirt + trousers/one-piece dress) |
| Spirited/lively | Sportswear set / modified school uniform |
| Special occupation | Outfit matching that identity (doctor/police officer/teacher, etc.) |
| Character description unclear | Urban everyday wear, warm-toned color scheme |

### Outfit consistency rules

- The clothing style must match the 3D anime cel-shaded rendering aesthetic (warm-toned color scheme, cartoon proportions)
- Warm tones dominate, no complex patterns/ornament, so later derivative layers can be added easily
- The outfit design is exactly the same across the four views
- The base outfit is the "everyday default state"; the focus stays on the face and posture
- Underwear/revealing/sexualised base layers are strictly forbidden

---

## 7. Four-view character sheet specification

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Top of head to collarbone | Shown complete from the top of the head to the collarbone with no crop, face fills 60%+, features clear | portrait closeup, face detail, head to collarbone complete, no crop |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, arms natural, shown complete from the top of the head to the soles of the feet | front view, full body head to toe, height mark |
| Second from right | Side view | Right 90° | Full-body standing figure | Clean pure-profile silhouette, shown complete from the top of the head to the soles of the feet | side view, profile, full body head to toe, height mark |
| Far right | Back view | Rear 180° | Full-body standing figure | Back of the head/back/hair ends/feet clear, shown complete from the top of the head to the soles of the feet | back view, rear view, full body head to toe, height mark |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, in one frame |
| Background | Clean neutral gray #E8E8E8 |
| Standing pose | Standing naturally, feet parallel and slightly apart, arms hanging naturally or slightly out |
| Full-body display | The full-body standing figure must fit in frame complete from the top of the head to the soles of the feet; cropping the crown of the head or the feet is strictly forbidden |
| Close-up display | The portrait close-up must fit in frame complete from the top of the head to the collarbone; cropping the crown of the head is strictly forbidden, and hair, forehead and chin must all be complete |
| Expression | Neutral micro-expression, in keeping with the character's temperament |
| Light | Even soft light, key light from the front + fill light on both sides, no hard shadow |
| Consistency | Skin tone/body type/hairstyle/face/base outfit are exactly the same across the four views |
| Aspect ratio | 4:1 or 3:1 recommended |

---

## 8. Prompt template

```
{gender} character four-view sheet，3D animation render，cinematic lighting，vivid cel-shaded texture，high-detail materials，joyful healing atmosphere，cartoon urban style，high-detail cartoon materials，moderate cartoon proportions，warm-toned color scheme，8K ultra HD，cinematic composition，soft light-and-shadow layering，bright cartoon render style，warm and healing，
character design sheet，character turnaround，
{facial features implied by the character description - derived naturally from it}，{overall temperament}，bare face no makeup，
{skin tone}，soft-glow skin，translucent glowing skin，fine skin，cel-shaded texture，
{height description, e.g.: 165cm tall、petite cute girl}，{head-to-body ratio, e.g.: 6.5 heads tall proportion}，{figure description}，{posture description}，
{hair color}{hair length}，individually distinct hair strands，{base styling}，no hair ornament，
{ordinary outfit matching the character's identity, e.g.: school uniform/smart casual work wear/urban casual wear}，warm tones，no complex pattern，
side by side left to right in one frame: portrait close-up + front view + side view + back view，
the portrait close-up shown complete from the top of the head to the collarbone，crown not cropped，head to collarbone complete，
the full-body standing figure shown complete from head to feet，full body head to toe，crown and feet not cropped，
standing naturally，clean neutral gray background，even soft light，no hard shadow，
four-view consistency，finely rendered face，finely rendered hair strands
no text of any kind in the image
```


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
| R7 | Must state the character's height and constrain full-body proportion by converting it into a head-to-body ratio (female default 155-165cm/6-7 heads, male default 170-180cm/6.5-7.5 heads) |
| R8 | The portrait close-up must be shown complete from the top of the head to the collarbone; cropping the crown is strictly forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Underwear/revealing/sexualised base layers; outfits clearly at odds with the character description; over-complex patterns/ornament that interfere with later costume-and-makeup overlays |
| X2 | Hard top light/under-lighting/colored light |
| X3 | Whitened to the point of looking bloodless / gray-cast skin |
| X4 | Complex scene backgrounds (a plain gray ground is mandatory) |
| X5 | Exaggerated expressions/dynamic poses |
| X6 | Cropping the crown or the soles in the full-body standing figure — it must fit in frame complete from head to feet |
| X7 | Cropping the crown in the portrait close-up — it must fit in frame complete from the top of the head to the collarbone |
| X8 | Ignoring the height and head-to-body-ratio constraints — height must be stated explicitly and full-body proportion expressed through the head-to-body ratio |