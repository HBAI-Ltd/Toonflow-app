# Stop-Motion Clay Character Base Likeness Generation · Constraint Manual

---

## 1. Base likeness principles

1. **Clay texture is the soul** — handmade sculpting marks are visible on the surface; fingerprint indentations/clay grain are clearly distinguishable
2. **3D cartoon base model** — the base layer is a clay character in simplified form; all later costume and makeup are overlay layers
3. **Four-view consistency** — face/body type/hairstyle/base outfit stay highly consistent across the views
4. **Healing atmosphere** — even with no makeup, the character's personality must still come through (gentle/rounded/approachable)

---

## 2. Face constraints

> Facial-feature parameters are no longer fixed. The character description (gender/age/personality/temperament) drives the AI to generate the features freely, so that characters look different from one another.

### General requirements

| Item | Constraint |
|---|---|
| Features | Derived naturally from the character description; do not preset face shape/eye shape/brow shape/nose shape/lip shape; keep the rounded clay feel overall (no sharp angles) |
| Style base | Stop-motion clay animation, 3D cartoon rendering, matte clay texture, warm-toned light and shadow |
| Temperament | Must distil the overall temperament keywords from the character description (e.g. warm and healing/steady and reliable/lively and approachable) and write them into the prompt |
| Expression | Neutral micro-expression, in keeping with the character's temperament |

---

## 3. Skin constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Warm cream, soft and even | warm cream skin, soft skin tone |
| Sheen | Matte clay texture, no highlight | matte clay finish, matte clay texture |
| Texture | Clear clay texture, sculpting marks visible | clay surface, handmade sculpting marks |
| Exposed skin | Face/neck/hands | soft warm skin, clay texture |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Warm beige, soft and even | warm beige skin, soft skin tone |
| Sheen | Matte clay texture, no highlight | matte clay finish, matte clay texture |
| Texture | Clear clay texture, fingerprint indentations visible | clay surface, clear handcrafted marks |

---

## 4. Body-type constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Height | Default 155-165cm, expressed through the head-to-body ratio | {height}cm tall |
| Head-to-body ratio | Six to seven heads tall, big head small body | 6-7 heads tall, rounded proportions |
| Shoulders and neck | Rounded shoulder line, no sharp angles | rounded shoulders and neck, soft lines |
| Hands | Rounded fingers, simplified joints | rounded small hands, simplified hand detail |
| Posture | Soft curves, no aggressive stance | soft posture, rounded curves |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Height | Default 170-180cm, expressed through the head-to-body ratio | {height}cm tall |
| Head-to-body ratio | Six and a half to seven and a half heads tall | 6.5-7.5 heads tall, rounded proportions |
| Shoulders and neck | Rounded broad shoulders, soft shoulders | rounded shoulders, gentle shoulder line |
| Hands | Rounded palms, simplified knuckles | rounded palms, simplified knuckles |
| Posture | Steady and poised, soft lines | steady posture, rounded lines |

---

## 5. Base hairstyle constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Warm brown, chestnut, dark brown and other natural ranges | warm brown long hair, chestnut hair |
| Hair length | Shoulder-length or waist-length | shoulder-length long hair |
| Hair quality | Clay-sculpted, hair grouped into blocky locks | clay hairstyle, blocky hair locks |
| Styling | Falling naturally, simply tied, no complex hair ornament | natural hair locks, simply tied hair |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Warm brown, dark brown, black | warm brown short hair, dark hairstyle |
| Hair length | Short or medium-long | short hair, medium-long hair |
| Hair quality | Clay-sculpted, hair grouped into blocky locks | clay hairstyle, blocky hair locks |
| Styling | Falling naturally, simply tied | natural hair locks, simple hairstyle |

---

## 6. Base outfit constraints

> The base outfit is a simplified design with no complex detail.

### Female base outfit

A simplified one-piece dress or top + skirt, in low-saturation warm tones, with no patterned ornament.

### Male base outfit

A simplified shirt + trousers, in low-saturation warm tones, with no patterned ornament.

### Outfit consistency rules

- The clothing style is unified, so that later costume overlays meet no color interference
- Covered essentially everywhere except the face/hands/neck
- The outfit design is exactly the same across the four views
- The base outfit is only a safe base layer; the focus is the face and posture

---

## 7. Four-view character sheet specification

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Top of head to collarbone | Face fills 60%+, features clear | portrait closeup, face detail |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, complete from the top of the head to the soles of the feet | front view, full body |
| Second from right | Side view | Right 90° | Full-body standing figure | Clean profile silhouette, complete from head to feet | side view, profile, full body |
| Far right | Back view | Rear 180° | Full-body standing figure | Back of the head/back/hair ends/feet clear | back view, rear view, full body |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, in one frame |
| Background | Clean neutral gray #E8E8E8 |
| Standing pose | Standing naturally, feet parallel and slightly apart, arms hanging naturally |
| Full-body display | The full-body standing figure must fit in frame complete from head to feet; cropping is strictly forbidden |
| Close-up display | The portrait close-up must fit in frame complete from the top of the head to the collarbone; cropping is strictly forbidden |
| Expression | Neutral micro-expression, in keeping with the character's personality |
| Light | Warm soft light, key light from the front + fill light on both sides, no hard shadow |
| Consistency | Skin tone/body type/hairstyle/face/base outfit are exactly the same across the four views |
| Aspect ratio | 4:1 or 3:1 recommended |

---

## 8. Prompt template

```
stop-motion clay {gender} character four-view sheet，stop-motion animation style，3D cartoon render，warm-toned light and shadow，
character design sheet，character turnaround，
{facial features implied by the character description - derived naturally from it, keeping the rounded clay feel overall}，{overall temperament}，
{skin tone}，matte clay texture，clear clay texture，handmade sculpting marks，
{height description}，{head-to-body ratio, e.g.: 7 heads tall proportion}，{figure description}，{posture description}，
{hair color}{hair length}，clay hairstyle，{base styling}，no complex hair ornament，
(female: simplified one-piece dress / male: simplified shirt + trousers)，low-saturation warm tones，no pattern，
side by side left to right in one frame: portrait close-up + front view + side view + back view，
the portrait close-up shown complete from the top of the head to the collarbone，head to collarbone complete，
the full-body standing figure shown complete from head to feet，full body head to toe，
standing naturally，clean neutral gray background，warm soft light，no hard shadow，
four-view consistency，finely rendered clay texture，soft healing expression
no text of any kind in the image
```

---

## 9. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must be in a "matte clay texture" state |
| R2 | Must state the base outfit (female: simplified one-piece dress; male: simplified shirt + trousers) |
| R3 | Must state "no complex hair ornament, no modern accessories" |
| R4 | Must specify "clean neutral gray background" |
| R5 | Must specify "four-view consistency" |
| R6 | The full-body standing figure must be shown complete from head to feet; cropping is strictly forbidden |
| R7 | Must specify the character's height and constrain full-body proportion through the head-to-body ratio (default 6-7 heads) |
| R8 | The portrait close-up must be shown complete from the top of the head to the collarbone; cropping the crown is strictly forbidden |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Live-action photographic realism/photo-level realism |
| X2 | Cold hard light/hard shadow/high contrast |
| X3 | Sharp angles/aggressive stance |
| X4 | Complex scene backgrounds (a plain gray ground is mandatory) |
| X5 | Exaggerated expressions/dynamic poses |
| X6 | Cropping the crown or the soles in the full-body standing figure |
| X7 | Cropping the crown in the portrait close-up |
| X8 | Ignoring the height and head-to-body-ratio constraints |
