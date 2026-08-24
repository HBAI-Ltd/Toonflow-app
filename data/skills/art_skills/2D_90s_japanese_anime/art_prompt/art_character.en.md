# 1990s Retro Japanese Anime Style - Base Character Likeness Generation · Constraint Manual

---

## 1. Base likeness principles

1. **The line is the soul** — fluid hand-drawn linework is the core of the character; avoid digital-looking sharp edges
2. **Character first** — the base outfit is determined by the character description (identity/occupation/gender/setting) as their ordinary everyday wear; later specific costume and makeup are overlay layers
3. **Four-view consistency** — face/body type/hairstyle/base outfit stay highly consistent across the views
4. **Emotionally restrained and calm** — the bare-faced state must convey the character's temperament (gentle/melancholy/detached)

---

## 2. Face constraints

> Facial-feature parameters are no longer fixed. The character description (gender/age/personality/temperament) drives the AI to generate the features freely, so that characters look different from one another.

### General requirements

| Item | Constraint |
|---|---|
| Features | Derived naturally from the character description; do not preset face shape/eye shape/brow shape/nose shape/lip shape |
| Style base | 1990s retro Japanese anime hand-drawn texture (soft warm colors, fluid linework, block shading) |
| Temperament | Must distil the overall temperament keywords from the character description (such as gentle/melancholy/detached/sunny) and write them into the prompt |
| Expression | Neutral micro-expression, in keeping with the character's temperament |

---

## 3. Skin constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Cool fair skin, warm-toned off-white | cool fair skin, warm-toned off-white |
| Sheen | Flat coloring, soft sheen | flat coloring, soft sheen |
| Texture | Hand-drawn texture, no digital traces | hand-drawn texture, no digital traces |
| Exposed skin | Face/neck/hands | collarbone visible, clear neckline |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Healthy skin tone, naturally warm | healthy skin tone, naturally warm |
| Sheen | Flat coloring, natural sheen | flat coloring, natural sheen |
| Texture | Hand-drawn texture, simple texture | hand-drawn texture, simple texture |

---

## 4. Body-type constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Height | Set by the character sheet, default 155-165cm | {height}cm, {height description} |
| Head-to-body ratio | Six to six and a half heads tall, a common 1990s proportion | 6-6.5 heads tall, 1990s proportion |
| Shoulders and neck | Slender, soft shoulder line | slender shoulders, softly graceful neckline |
| Hands | Slender, distinct knuckles | slender delicate hands, long fingers |
| Posture | Elegant/gentle, light bearing | light bearing, elegant posture |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Height | Set by the character sheet, default 170-180cm | {height}cm, {height description} |
| Head-to-body ratio | Six and a half to seven and a half heads tall | 6.5-7.5 heads tall, 1990s proportion |
| Shoulders and neck | Broad shoulders, strong neckline | broad shoulders, strong neck |
| Hands | Distinct knuckles, well-proportioned palm | distinctly knuckled fingers |
| Posture | Upright/sturdy, natural bearing | upright bearing, sturdy build |

---

## 5. Base hairstyle constraints

> Only naturally loose hair / simply tied hair is defined here; hair ornaments are added in the derivative stage.

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Natural hair color (black/brown/blond) | black hair, brown hair, blond hair |
| Hair length | Shoulder-length or longer | long hair, shoulder-length hair |
| Hair quality | Hand-drawn texture, fluid linework | fluid hair strands, hand-drawn texture |
| Styling | Naturally loose, no hair ornament | long hair falling naturally, no hair ornament |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Natural hair color (black/brown/gray) | black hair, brown hair, silver hair |
| Hair length | Medium-long to long | medium-long hair, long hair |
| Hair quality | Hand-drawn texture, fluid linework | fluid hair strands, hand-drawn texture |
| Styling | Naturally loose or half-tied, no crown ornament | long hair falling naturally, half-tied hair |

---

## 6. Base outfit constraints

> The base outfit is the most natural everyday wear implied by the character description (identity/occupation/gender/setting), serving as that character's "everyday default state"; formal costume and special derivatives are added in the costume-and-makeup derivative stage. **Underwear as the base layer is forbidden.**

### Outfit selection principles

| Character identity | Default outfit direction |
|---|---|
| Student | 1990s school uniform / academy uniform |
| Office worker | Smart casual work wear (shirt + trousers/skirt) |
| At home/leisure | 1990s retro casual wear (knitwear/dress/T-shirt) |
| Sporty/lively | Sports set / modified school uniform |
| Special occupation | Outfit matching the identity (doctor/police officer/teacher etc.) |
| Character description unclear | 1990s retro everyday wear |

### Outfit consistency rules

- The outfit style must match the 1990s retro Japanese anime aesthetic (soft warm colors, low saturation, hand-drawn texture)
- Low-saturation colors, no complex patterns/ornament, so later derivatives can be layered on
- The outfit is exactly the same across the four views
- The base outfit is the "everyday default state"; the focus stays on the face and the bearing
- Underwear/revealing/sexualised base layers are strictly forbidden

---

## 7. Four-view character sheet specification

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Top of head to collarbone | Shown complete from the top of the head to the collarbone, face fills 60%+ | portrait closeup, face detail |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, arms natural, complete from head to feet | front view, full body head to toe |
| Second from right | Side view | Right 90° | Full-body standing figure | Clean pure-profile silhouette, complete from head to feet | side view, profile, full body head to toe |
| Far right | Back view | Rear 180° | Full-body standing figure | Back of the head/back/hair ends/feet clear | back view, rear view, full body head to toe |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, in one frame |
| Background | Warm-toned off-white #F8F4E8 |
| Standing pose | Standing naturally, feet parallel and slightly apart, arms hanging naturally |
| Full-body display | Complete in frame from head to feet; cropping the crown of the head or the feet is strictly forbidden |
| Close-up display | Complete in frame from the top of the head to the collarbone; cropping the crown of the head is strictly forbidden |
| Expression | Neutral micro-expression, in keeping with the character's temperament |
| Light | Soft cinematic light, key light from the front + fill light on both sides |
| Consistency | Skin tone/body type/hairstyle/face/base outfit are exactly the same across the four views |
| Aspect ratio | 4:1 or 3:1 recommended |

---

## 8. Prompt template

```
{gender} character four-view sheet，90s anime style，retro Japanese anime style，hand-drawn flat coloring，soft warm tones，fine fluid linework，cinematic light and shadow，
character design sheet，character turnaround，
{facial features implied by the character description - derived naturally from it}，{overall temperament}，bare face no makeup，
{skin tone}，flat coloring，hand-drawn texture，delicate skin，
{height description, e.g.: 165cm tall、slender woman}，{head-to-body ratio, e.g.: 6.5 heads tall proportion}，{figure description}，{posture description}，
{hair color}{hair length}，fluid hair strands，{base styling}，no hair ornament，
{ordinary outfit matching the character's identity, e.g.: 1990s school uniform/smart casual work wear/retro dress}，soft low-saturation tones，no complex pattern，
side by side left to right in one frame: portrait close-up + front view + side view + back view，
the portrait close-up shown complete from the top of the head to the collarbone，head to collarbone complete，
the full-body standing figure shown complete from head to feet，full body head to toe，crown and feet not cropped，
standing naturally，clean neutral gray background，soft cinematic light，no hard shadow，
four-view consistency，finely rendered face，finely rendered hair strands
no text of any kind in the image
```

---

## 9. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must be in a "bare face, no makeup" state |
| R2 | Must state a suitable everyday outfit as the base outfit based on the character description (e.g. student → school uniform, office worker → smart casual work wear, at home → retro casual wear); underwear as the base layer is forbidden |
| R3 | Must state "no hair ornament, no accessories" |
| R4 | Must specify "warm-toned off-white background #F8F4E8" |
| R5 | Must specify "four-view consistency" |
| R6 | The full-body standing figure must be shown complete from head to feet; cropping is strictly forbidden |
| R7 | Must specify the character's height and constrain full-body proportion by converting it into a head-to-body ratio (female default 155-165cm/6-6.5 heads, male default 170-180cm/6.5-7.5 heads) |
| R8 | The portrait close-up must be shown complete from the top of the head to the collarbone; cropping the crown is strictly forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Underwear/revealing/sexualised base layers; outfits clearly at odds with the character description; over-complex patterns/ornament that interfere with later costume-and-makeup overlays |
| X2 | Digital-looking sharp edges, oversaturated color |
| X3 | Whitening the skin so far that it looks bloodless |
| X4 | Complex scene backgrounds (a warm-toned background is mandatory) |
| X5 | Exaggerated expressions/dynamic poses |
| X6 | Cropping the crown or the soles in the full-body standing figure — it must fit in frame complete from head to feet |
| X7 | Cropping the crown in the portrait close-up — it must fit in frame complete from the top of the head to the collarbone |
| X8 | Ignoring the height and head-to-body-ratio constraints |
