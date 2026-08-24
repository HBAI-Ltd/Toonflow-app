---
name: art_character
description: Base character likeness generation · constraint manual
metaData: art_skills
---

# Base Character Likeness Generation · Constraint Manual

---

## 1. Base likeness principles

1. **The silhouette is the soul** — the character's silhouette is the core anchor; Guofeng anime silhouette, fluid linework
2. **The base model is the foundation** — plain base outfit + bare face; all later costume and makeup are overlay layers
3. **Four-view consistency** — face/body type/hairstyle/base outfit stay highly consistent across the views
4. **Classical temperament** — even bare-faced, the character's temperament must come through (elegant/gentle/heroic)

---

## 2. Face constraints

> Facial-feature parameters are no longer fixed. The character description (gender/age/personality/temperament) drives the AI to generate the features freely, so that characters look different from one another.

### General requirements

| Item | Constraint |
|---|---|
| Features | Derived naturally from the character description; do not preset face shape/eye shape/brow shape/nose shape/lip shape |
| Style base | Guofeng anime, new Guochao aesthetic, Japanese anime rendering, cel-shaded flat coloring, delicate brushwork |
| Temperament | Must distil the overall temperament keywords from the character description (e.g. elegant and gentle/scholarly and heroic/chivalrous yet tender) and write them into the prompt |
| Expression | Neutral micro-expression, in keeping with the character's temperament |

---

## 3. Skin constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Pink-white key, even over the whole body, fair and translucent | pink-white key、fair and translucent、anime skin tone |
| Sheen | Cel-shaded flat coloring, natural sheen, not matte | cel-shaded flat coloring、natural sheen、soft texture |
| Texture | Delicate lines, even color, soft edges | delicate lines、even color、soft edges |
| Exposed skin | Face/neck/hands | delicate hands、soft neck lines |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Fair key, even over the whole body, healthy texture | fair key、healthy texture、anime skin tone |
| Sheen | Cel-shaded flat coloring, natural sheen | cel-shaded flat coloring、natural sheen、soft texture |
| Texture | Delicate lines, clean and crisp | delicate lines、cel-shaded flat coloring、soft |

---

## 4. Body-type constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Height | Set by the character sheet, default range 160-170cm | {height}cm tall、{height description, e.g.: tall elegant woman} |
| Head-to-body ratio | Six to seven heads tall, classical anime proportion | 6-7 heads tall proportion、classical anime proportion |
| Shoulders and neck | Swan neck, beautiful shoulder-and-neck line | swan neck、beautiful shoulders and neck |
| Hands | Slender and fair, natural fingers | slender and fair、natural fingers |
| Posture | Classical temperament, elegant and upright | elegant bearing、upright posture |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Height | Set by the character sheet, default range 175-185cm | {height}cm tall、{height description, e.g.: tall imposing man} |
| Head-to-body ratio | Six to seven heads tall, classical anime proportion | 6-7 heads tall proportion、classical anime proportion |
| Shoulders and neck | Broad shoulders, strong neck | broad shoulders、strong neck |
| Hands | Well-defined knuckles, natural fingers | well-defined knuckles、natural fingers |
| Posture | Scholarly and heroic, upright and correct | heroic bearing、upright posture |

---

## 5. Base hairstyle constraints

> Only natural hairstyles are defined here; hair ornaments are added in the costume-and-makeup derivative stage.

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Ink black, all other colors forbidden | long ink-black hair、black hair flowing like a waterfall |
| Hair length | Long hair to the waist | long hair to the waist、long hair |
| Hair quality | Delicate lines, clear strands | delicate lines、clear hair strands |
| Styling | Naturally loose, no hair ornament | long hair falling naturally、no hair ornament |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Ink black, all other colors forbidden | long ink-black hair、hair dark as ink |
| Hair length | Long hair to the shoulders or tied up | long hair to the shoulders、hair tied up |
| Hair quality | Delicate lines, clear strands | delicate lines、clear hair strands |
| Styling | Naturally loose or half-tied, no hair crown | long hair falling naturally、long hair half-tied |

---

## 6. Base outfit constraints

> The base outfit carries no special constraint: a plain-color ancient-style (hanfu) long dress for women, a plain-color ancient-style long robe for men. Formal costume is added in the costume-and-makeup derivative stage.

### Female base outfit

A plain-color ancient-style long dress, mainly in base colors, with no patterned ornament.

### Male base outfit

A plain-color ancient-style long robe, mainly in base colors, with no patterned ornament.

### Outfit consistency rules

- The clothing style is unified, so later costume overlays meet no color interference
- Covered essentially everywhere except face/hands/neck
- The outfit design is exactly the same across the four views
- The base outfit is only a safe under-layer; the focus stays on the face and bearing

---

## 7. Four-view character sheet specification

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
| Background | Solid moon white #E8EAF5 |
| Standing pose | Standing naturally, feet parallel and slightly apart, arms hanging naturally |
| Full-body display | The full-body standing figure must fit in frame complete from the top of the head to the soles of the feet; cropping is strictly forbidden |
| Close-up display | The portrait close-up must fit in frame complete from the top of the head to the collarbone; cropping is strictly forbidden |
| Expression | Neutral micro-expression, in keeping with the character's temperament |
| Light | Even soft light, key light in front + fill on both sides, no hard shadow |
| Consistency | Skin tone/body type/hairstyle/face/base outfit are exactly the same across the four views |
| Aspect ratio | 4:1 or 3:1 recommended |

---

## 8. Prompt template

{gender} character four-view sheet，Guofeng anime，new Guochao aesthetic，Japanese anime rendering，cel-shaded flat coloring，delicate brushwork，
character design sheet, character turnaround,
{facial features implied by the character description - derived naturally from it}, {overall temperament}, bare face no makeup,
{skin tone}, cel-shaded flat coloring, translucent glowing skin, delicate lines, richly layered light and shadow,
{height description, e.g.: 165cm tall, tall elegant woman}, {head-to-body ratio, e.g.: 6.5 heads tall proportion}, {figure description}, {posture description},
{hair color}{hair length}, delicate hair strands clear, {base styling}, no hair ornament,
（female: plain-color ancient-style long dress / male: plain-color ancient-style long robe）, base color, no patterned ornament,
side by side left to right in one frame: portrait close-up + front view + side view + back view,
the portrait close-up shown complete from the top of the head to the collarbone, crown not cropped, head to collarbone complete,
the full-body standing figure shown complete from head to feet, full body head to toe, crown and feet not cropped,
standing naturally, solid moon white background, even soft light, no hard shadow,
four-view consistency, clear Guofeng anime silhouette, clear delicate lines,
no text of any kind in the image

---

## 9. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must be in a "bare face, no makeup" state |
| R2 | Must state the base outfit (female: plain-color ancient-style long dress; male: plain-color ancient-style long robe) |
| R3 | Must state "no hair ornament, no accessories" |
| R4 | Must specify "solid moon white background" |
| R5 | Must specify "four-view consistency" |
| R6 | The full-body standing figure must be shown complete from the top of the head to the soles of the feet; cropping is strictly forbidden |
| R7 | Must state the character's height and constrain full-body proportion by converting it into a head-to-body ratio (female default 160-170cm/6-7 heads, male default 175-185cm/6-7 heads) |
| R8 | The portrait close-up must be shown complete from the top of the head to the collarbone; cropping the crown is strictly forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Any clothing/accessory/makeup beyond the base outfit |
| X2 | Hard light straight from above/light from straight below/cool-colored light |
| X3 | Whitened to the point of bloodlessness / grayish skin tone |
| X4 | Complex scene backgrounds (a solid color is mandatory) |
| X5 | Exaggerated expressions/dynamic poses |
| X6 | Cropping the crown or the soles in the full-body standing figure — it must fit in frame complete from head to feet |
| X7 | Cropping the crown in the portrait close-up — it must fit in frame complete from the top of the head to the collarbone |
| X8 | Ignoring the height and head-to-body-ratio constraints — height must be stated explicitly and full-body proportion expressed through the head-to-body ratio |
