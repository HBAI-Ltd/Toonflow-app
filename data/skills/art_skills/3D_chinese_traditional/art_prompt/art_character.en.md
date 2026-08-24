---
name: art_character
description: Character base image generation · constraint manual
metaData: art_skills
---

# Character Base Image Generation · Constraint Manual

---

## 1. Base image principles

1. **Form is the soul** — the character's form is the core anchor: Guofeng 3D styling, flowing lines
2. **The base model is the foundation** — base underlayer clothing + bare face; all later costume and makeup are overlay layers
3. **Four views consistent** — face/body type/hairstyle/base clothing highly unified across the views
4. **Classical temperament** — even bare-faced, the character's temperament must show (elegant/gentle/spirited)

---

## 2. Face constraints

> Facial-feature parameters are no longer fixed; the character description (gender/age/personality/temperament) drives the AI to generate the features freely, so characters differ in appearance.

### General requirements

| Item | Constraint |
|---|---|
| Features | Derived naturally from the character description; no preset face shape/eye shape/brow shape/nose shape/lip shape |
| Style base | Guofeng 3D render, high-precision modeling, PBR materials, cinema-level lighting |
| Temperament | An overall temperament keyword must be distilled from the character description (such as elegant and gentle/refined and spirited/chivalrous yet tender) and written into the prompt |
| Expression | Neutral micro-expression, in keeping with the character's temperament |

---

## 3. Skin constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Pink-white keynote, even over the whole body, fair and translucent | pink-white keynote、fair and translucent、3D-modeled skin tone |
| Sheen | PBR material rendering, natural sheen, not matte | PBR material rendering、natural sheen、soft texture |
| Texture | High-precision modeling, clear grain, soft edges | high-precision modeling、clear grain、soft edges |
| Exposed skin | Face/neck/hands | delicate hands、soft neck line |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Fair keynote, even over the whole body, healthy texture | fair keynote、healthy texture、3D-modeled skin tone |
| Sheen | PBR material rendering, natural sheen | PBR material rendering、natural sheen、soft texture |
| Texture | High-precision modeling, clean and crisp | high-precision modeling、3D render、soft |

---

## 4. Body-type constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Height | Specified by the character setting, default range 160-170cm | {height}cm tall、{height description, e.g.: tall elegant woman} |
| Head-to-body ratio | Seven to seven and a half heads tall, classical proportion | 7 heads tall proportion、classical proportion |
| Shoulders and neck | Swan neck, beautiful shoulder and neck line | swan neck、beautiful shoulders and neck |
| Hands | Slender and fair, natural fingers | slender and fair、natural fingers |
| Bearing | Classical temperament, graceful and upright | graceful bearing、upright posture |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Height | Specified by the character setting, default range 175-185cm | {height}cm tall、{height description, e.g.: tall imposing man} |
| Head-to-body ratio | Seven to seven and a half heads tall, classical proportion | 7 heads tall proportion、classical proportion |
| Shoulders and neck | Broad shoulders, strong neck | broad shoulders、strong neck |
| Hands | Well-defined knuckles, natural fingers | well-defined knuckles、natural fingers |
| Bearing | Refined and spirited, upright and correct | spirited bearing、upright posture |

---

## 5. Base hairstyle constraints

> Only the natural hairstyle is defined here; hair ornaments are overlaid in the costume-and-makeup derivation stage.

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Ink black; other colors are banned | ink-black long hair、black hair like a waterfall |
| Hair length | Long hair to the waist | long hair to the waist、long hair |
| Hair quality | High-precision modeling, clear hair strands | high-precision modeling、clear hair strands |
| Styling | Naturally loose, no hair ornaments | long hair falling loose、no hair ornaments |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Ink black; other colors are banned | ink-black long hair、hair black as ink |
| Hair length | Long hair to the shoulders or tied up | long hair to the shoulders、hair tied up |
| Hair quality | High-precision modeling, clear hair strands | high-precision modeling、clear hair strands |
| Styling | Naturally loose or half tied up, no hair crown | long hair falling loose、long hair half tied up |

---

## 6. Base clothing constraints

> The base clothing carries no special constraint: a plain-colored ancient-style long skirt for women, a plain-colored ancient-style long robe for men. Formal costume is overlaid in the costume-and-makeup derivation stage.

### Female base clothing

A plain-colored ancient-style long skirt, mainly in base colors, with no patterned ornament.

### Male base clothing

A plain-colored ancient-style long robe, mainly in base colors, with no patterned ornament.

### Unified dressing rules

- The clothing style is unified, so that later costume overlays meet no color interference
- Coverage is essentially complete apart from face/hands/neck
- The clothing design is exactly the same across the four views
- The base clothing is only a safe underlayer; the focus is the face and the bearing

---

## 7. Four-view design sheet specification

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Top of head to collarbone | Shown complete from the top of the head to the collarbone, face fills 60%+, features clear | portrait closeup、face detail |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, arms natural, shown complete from the top of the head to the soles of the feet | front view、full body |
| Second from right | Side view | Right 90° | Full-body standing figure | Clean pure-profile silhouette, shown complete from the top of the head to the soles of the feet | side view、profile、full body |
| Far right | Back view | Rear 180° | Full-body standing figure | Back of the head/back/hair ends/feet clear, shown complete from the top of the head to the soles of the feet | back view、rear view、full body |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, in one frame |
| Background | Plain gray solid color #B8B8B8 |
| Standing pose | Standing naturally, feet parallel and slightly apart, arms hanging naturally |
| Full-body display | The full-body standing figure must fit in frame complete from the top of the head to the soles of the feet; cropping is strictly forbidden |
| Close-up display | The portrait close-up must fit in frame complete from the top of the head to the collarbone; cropping is strictly forbidden |
| Expression | Neutral micro-expression, in keeping with the character's temperament |
| Light | Even soft light, key light from the front + fill light on both sides, no hard shadow |
| Consistency | Skin tone/body type/hairstyle/face/base clothing are exactly the same across the four views |
| Aspect ratio | 4:1 or 3:1 recommended |

---

## 8. Prompt template

{gender} character four-view design sheet，3D render style，high-precision modeling，PBR materials，Guofeng 3D，cinema-level lighting，
character design sheet, character turnaround,
{facial features matching the character description - derived naturally from the character description}, {overall temperament}, bare-faced,
{skin tone}, PBR material rendering, translucent 3D render texture, high-precision modeling, richly layered light and shadow,
{height description, e.g.:165cm tall, tall elegant woman}, {head-to-body ratio, e.g.:7 heads tall proportion}, {figure description}, {bearing description},
{hair color}{hair length}, high-precision clear hair strands, {base styling}, no hair ornaments,
(female: plain-colored ancient-style long skirt / male: plain-colored ancient-style long robe), base color, no patterned ornament,
side by side left to right in one frame：portrait close-up+front view+side view+back view,
the portrait close-up shown complete from the top of the head to the collarbone, no crop of the crown, head to collarbone complete,
the full-body standing figure shown complete from the top of the head to the soles of the feet, full body head to toe, no crop of the crown or the feet,
standing naturally, plain gray solid-color background, even soft light, no hard shadow,
four-view consistency, clear 3D Guofeng-era modeling, clear high-precision modeling,
no text of any kind in the image


---

## 9. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must be "bare-faced" |
| R2 | Must state the base clothing (female: plain-colored ancient-style long skirt; male: plain-colored ancient-style long robe) |
| R3 | Must state "no hair ornaments, no accessories" |
| R4 | Must specify "plain gray solid-color background" |
| R5 | Must specify "four-view consistency" |
| R6 | The full-body standing figure must be shown complete from the top of the head to the soles of the feet; cropping is strictly forbidden |
| R7 | Must state the character's height and constrain the whole-body proportion through the head-to-body ratio (female default 160-170cm/7 heads, male default 175-185cm/7 heads) |
| R8 | The portrait close-up must be shown complete from the top of the head to the collarbone; cropping the crown of the head is strictly forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Any clothing/accessory/makeup beyond the base clothing |
| X2 | Hard top light/bottom light/cool-colored light |
| X3 | Whitening so extreme the skin looks bloodless / a gray skin tone |
| X4 | A complex scene background (it must be a solid color) |
| X5 | Exaggerated expressions/dynamic poses |
| X6 | Cropping the crown of the head or the soles of the feet in the full-body standing figure — it must fit in frame complete from head to toe |
| X7 | Cropping the crown of the head in the portrait close-up — it must fit in frame complete from the top of the head to the collarbone |
| X8 | Ignoring the height and head-to-body ratio constraints — the height must be stated explicitly and the whole-body proportion expressed through the head-to-body ratio |
