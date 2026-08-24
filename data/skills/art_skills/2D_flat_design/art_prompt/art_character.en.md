# Base Character Likeness Generation · Flat Style Constraint Manual

---

## 1. Base likeness principles

1. **The silhouette is the soul** — line is the character's only anchor; flat color blocks build the layering
2. **Character first** — the base outfit is determined by the character description (identity/occupation/gender/setting) as their ordinary everyday wear; later specific costume and makeup are overlay layers
3. **Four-view consistency** — silhouette/body type/hairstyle/base outfit stay highly consistent across the views
4. **Color-block expression** — no shadow or gradient; layering is expressed through color-block contrast

---

## 2. Face constraints

> Facial-feature parameters are no longer fixed. The character description (gender/age/personality/temperament) drives the AI to generate the features freely, so that characters look different from one another.

### General requirements

| Item | Constraint |
|---|---|
| Features | Derived naturally from the character description; do not preset face shape/eye shape/brow shape/nose shape/lip shape |
| Style base | Flat vector illustration, solid color blocks, clear lines, no gradient, no light-and-shadow |
| Temperament | Must distil the overall temperament keywords from the character description and write them into the prompt |
| Expression | Neutral micro-expression, in keeping with the character's temperament |

---

## 3. Skin constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Single-color fill, no gradient | single-color skin, flat skin tone, solid skin color |
| Sheen | No highlight, no reflection | no sheen, matte flat, matte finish |
| Texture | Color-block fill, no texture | color-block fill, flat texture feel, no texture |
| Exposed skin | Face/neck/collarbone/hands | color-block skin tone, flat skin surface |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Single-color fill, no gradient | single-color skin, flat skin tone, solid skin color |
| Sheen | No highlight, no reflection | no sheen, matte flat, matte finish |
| Texture | Color-block fill, no texture | color-block fill, flat texture feel, no texture |

---

## 4. Body-type constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Height | Set by the character sheet, default range 160-170cm, expressed through the head-to-body ratio | {height}cm tall, tall slender woman |
| Head-to-body ratio | Seven to eight heads tall, strictly constraining full-body proportion | 7-8 heads tall proportion, slender figure |
| Shoulders and neck | Clean lines, color-block expression | clean lines, flat shoulders and neck |
| Hands | Simplified hand silhouette | simplified hands, color-block hands |
| Posture | Simple posture, no motion | simple posture, front-facing standing pose |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Height | Set by the character sheet, default range 175-185cm, expressed through the head-to-body ratio | {height}cm tall, tall imposing man |
| Head-to-body ratio | Seven and a half to eight and a half heads tall, strictly constraining full-body proportion | 7.5-8.5 heads tall proportion, tall figure |
| Shoulders and neck | Clean lines, color-block expression | clean lines, flat shoulders and neck |
| Hands | Simplified hand silhouette | simplified hands, color-block hands |
| Posture | Simple posture, no motion | simple posture, front-facing standing pose |

---

## 5. Base hairstyle constraints

> Only naturally loose hair / simply tied hair is defined here; hair ornaments are added in the costume-and-makeup derivative stage.

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Pure black, single color, no gradient | black hair, solid hair color |
| Hair length | Waist-length or longer | long hair, waist-length hair |
| Hair quality | Drawn with lines, no individual strands | line-drawn hairstyle, flat hair color, no hair strands |
| Styling | Naturally loose, centre/side part, no hair ornament | long hair falling naturally, simple hair color |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Pure black or ink-dark, single color | black hair, ink-dark hair color |
| Hair length | Medium-long to long | long hair, shoulder-length hair |
| Hair quality | Drawn with lines, no individual strands | line-drawn hairstyle, flat hair color, no hair strands |
| Styling | Naturally loose or half-tied, no crown ornament | long hair falling naturally, simple hairstyle |

---

## 6. Base outfit constraints

> The base outfit is the most natural everyday wear implied by the character description (identity/occupation/gender/setting), serving as that character's "everyday default state"; formal costume and special derivatives are added in the costume-and-makeup derivative stage. **Underwear as the base layer is forbidden.**

### Outfit selection principles

| Character identity | Default outfit direction |
|---|---|
| Student | School uniform / academy wear |
| Office worker | Smart casual work wear (shirt + trousers/skirt) |
| At home/leisure | Casual everyday wear (T-shirt + trousers/one-piece dress) |
| Sporty/lively | Sportswear set |
| Special occupation | Outfit matching that identity (doctor/police officer/teacher, etc.) |
| Character description unclear | Simple everyday wear |

### Outfit consistency rules

- The clothing style must match the flat vector illustration aesthetic (solid color blocks, no gradient, no light-and-shadow)
- Low-saturation solid-color fill, no complex patterns/ornament, so later derivative layers can be added easily
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
| Light | No light-and-shadow, purely flat-filled color blocks |
| Consistency | Skin tone/body type/hairstyle/face/base outfit are exactly the same across the four views |
| Aspect ratio | 4:1 or 3:1 recommended |

---

## 8. Prompt template

```
{gender} character four-view flat-style sheet，
2d flat design，vector art，flat illustration，
minimalist，clean lines，solid colors，
{facial features implied by the character description - derived naturally from it}，{overall temperament}，bare face no makeup，
{skin tone}，single-color skin，flat skin tone，solid skin color，
{height description, e.g.: 170cm tall、tall slender woman}，{head-to-body ratio, e.g.: 7.5 heads tall proportion}，{figure description}，{posture description}，
{hair color}{hair length}，line-drawn hairstyle，{base styling}，no hair ornament，
{ordinary outfit matching the character's identity, e.g.: school uniform/smart casual work wear/casual everyday wear}，base color solid fill，no complex pattern，
side by side left to right in one frame: portrait close-up + front view + side view + back view，
the portrait close-up shown complete from the top of the head to the collarbone，crown not cropped，head to collarbone complete，
the full-body standing figure shown complete from head to feet，full body head to toe，crown and feet not cropped，
standing naturally，clean neutral gray background，no light-and-shadow，no gradient，
four-view consistency，clean lines，color-block fill，
no text of any kind in the image
```

---

## 9. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must be in a "bare face, no makeup" state |
| R2 | Must state a suitable everyday outfit as the base outfit based on the character description (e.g. student → school uniform, office worker → smart casual work wear, at home → casual everyday wear); underwear as the base layer is forbidden |
| R3 | Must state "no hair ornament, no accessories" |
| R4 | Must specify "clean neutral gray background" |
| R5 | Must specify "four-view consistency" |
| R6 | The full-body standing figure must be shown complete from the top of the head to the soles of the feet; cropping is strictly forbidden |
| R7 | Must specify the character's height and constrain full-body proportion by converting it into a head-to-body ratio (female default 160-170cm/7-8 heads, male default 175-185cm/7.5-8.5 heads) |
| R8 | The portrait close-up must be shown complete from the top of the head to the collarbone; cropping the crown is strictly forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Underwear/revealing/sexualised base layers; outfits clearly at odds with the character description; over-complex patterns/ornament that interfere with later costume-and-makeup overlays |
| X2 | Light-and-shadow/shadow/gradient effects |
| X3 | 3D rendering/CG texture |
| X4 | Complex scene backgrounds (a plain gray ground is mandatory) |
| X5 | Exaggerated expressions/dynamic poses |
| X6 | Cropping the crown or the soles in the full-body standing figure — it must fit in frame complete from head to feet |
| X7 | Cropping the crown in the portrait close-up — it must fit in frame complete from the top of the head to the collarbone |
| X8 | Ignoring the height and head-to-body-ratio constraints — height must be stated explicitly and full-body proportion expressed through the head-to-body ratio |
