# Base Character Likeness Generation · Urban Realism Constraint Manual

---

## 1. Base likeness principles

1. **The face is the soul** — the features are the character's only anchor, rendered in pore-level detail
2. **Character first** — the base outfit is determined by the character description (identity/occupation/gender/setting) as their ordinary everyday wear; later specific costume and makeup are overlay layers
3. **Four-view consistency** — face/body type/hairstyle/base outfit stay highly consistent across the views
4. **Natural and true** — even with no makeup, the character's temperament must still come through (capable/gentle/aloof/warm)
5. **Live-action photography** — anchored on real photography, keeping the true texture of skin (pores/tiny imperfections)

---

## 2. Face constraints

> Facial-feature parameters are no longer fixed. The character description (gender/age/personality/temperament) drives the AI to generate the features freely, so that characters look different from one another.

### General requirements

| Item | Constraint |
|---|---|
| Features | Derived naturally from the character description; do not preset face shape/eye shape/brow shape/nose shape/lip shape |
| Style base | Live-action realistic photography, pore-level fine rendering, realistic material, natural light and shadow |
| Temperament | Must distil the overall temperament keywords from the character description (e.g. capable/gentle/aloof/warm) and write them into the prompt |
| Expression | Neutral micro-expression, in keeping with the character's temperament |

---

## 3. Skin constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Natural skin tone, even over the whole body, may lean fair/warm yellow | natural skin tone, even skin tone |
| Sheen | Natural sheen, neither matte nor oily | natural skin, healthy sheen |
| Texture | Delicate, keeps a faint pore texture, may have small imperfections | delicate skin, pores faintly visible |
| Exposed skin | Face/neck/collarbone/hands/part of the arms | natural shoulder and neck line, healthy skin |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Natural skin tone, may lean wheat-toned, even over the whole body | natural skin tone, healthy skin tone |
| Sheen | Natural sheen, fresh and clean | natural skin, fresh clean texture |
| Texture | Clean and crisp, visible pores, may have fine imperfections | true skin texture, clear pores |

---

## 4. Body-type constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Height | Set by the character sheet, default range 155-175cm | {height}cm tall |
| Head-to-body ratio | Seven to eight heads tall, strictly constraining full-body proportion | 7-8 heads tall proportion |
| Shoulders and neck | Natural shoulder and neck line, collarbone visible | natural shoulder and neck line |
| Hands | Natural hand shape, normal knuckles, tidy nails | natural hands, slender fingers |
| Posture | Standing naturally, relaxed and open posture | natural posture, relaxed bearing |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Height | Set by the character sheet, default range 170-185cm | {height}cm tall |
| Head-to-body ratio | Seven and a half to eight and a half heads tall, strictly constraining full-body proportion | 7.5-8.5 heads tall proportion |
| Shoulders and neck | Natural shoulders, strong neck | natural shoulders, shoulder and neck line |
| Hands | Natural hand shape, moderate palm, normal knuckles | natural hands, slender fingers |
| Posture | Standing naturally, upright posture | upright bearing, natural posture |

---

## 5. Base hairstyle constraints

> Only naturally loose hair / simply tied hair is defined here; hair ornaments are added in the costume-and-makeup derivative stage.

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Natural hair color (black/deep brown), bleaching/dyeing forbidden | natural hair color, deep brown |
| Hair length | Shoulder-length/waist-length or longer, set by the character sheet | natural long hair, shoulder-length hair |
| Hair quality | Strands clearly defined, true texture | every hair strand distinct |
| Styling | Naturally loose, simple ponytail/half-up, no hair ornament | natural hairstyle, no hair ornament |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Natural hair color (black/deep brown), bleaching forbidden | natural hair color, black/deep brown |
| Hair length | Short/medium-long, set by the character sheet | short hair, shoulder-length medium hair |
| Hair quality | Strands clearly defined, true texture | every hair strand distinct |
| Styling | Naturally loose/simply tied, no hair ornament | natural hairstyle, no hair ornament |

---

## 6. Base outfit constraints

> The base outfit is the most natural everyday wear implied by the character description (identity/occupation/gender/setting), serving as that character's "everyday default state"; formal costume and special derivatives are added in the costume-and-makeup derivative stage. **Underwear as the base layer is forbidden.**

### Outfit selection principles

| Character identity | Default outfit direction |
|---|---|
| Student | Modern school uniform / academy wear |
| Office worker | Smart casual work wear (shirt + trousers/skirt, suit) |
| At home/leisure | Urban casual wear (hoodie/T-shirt + jeans/one-piece dress) |
| Fashion/date | Urban fashionable outfit |
| Special occupation | Outfit matching that identity (doctor/police officer/teacher, etc.) |
| Character description unclear | Urban everyday wear, low-saturation neutral tones |

### Outfit consistency rules

- The clothing style must match the urban realistic photography aesthetic (natural tones, realistic material)
- Low-saturation neutral colors, no complex patterns/ornament, so later derivative layers can be added easily
- The outfit design is exactly the same across the four views
- The base outfit is the "everyday default state"; the focus stays on the face and posture
- Underwear/revealing/sexualised base layers are strictly forbidden

---

## 7. Four-view character sheet specification

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| Far left | Portrait close-up | Front, eye level | Top of head to collarbone | Shown complete from the top of the head to the collarbone, face fills 60%+, features clear | portrait closeup, face detail, head to collarbone complete |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, arms natural, shown complete from the top of the head to the soles of the feet | front view, full body head to toe |
| Second from right | Side view | Right 90° | Full-body standing figure | Clean pure-profile silhouette, shown complete from the top of the head to the soles of the feet | side view, profile, full body head to toe |
| Far right | Back view | Rear 180° | Full-body standing figure | Back of the head/back/hair ends/feet clear, shown complete from the top of the head to the soles of the feet | back view, rear view, full body head to toe |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side, left to right, in one frame |
| Background | Clean neutral gray #E8E8E8 |
| Standing pose | Standing naturally, feet parallel and slightly apart, arms hanging naturally |
| Full-body display | The full-body standing figure must fit in frame complete from the top of the head to the soles of the feet; cropping is strictly forbidden |
| Close-up display | The portrait close-up must fit in frame complete from the top of the head to the collarbone; cropping the crown of the head is strictly forbidden |
| Expression | Neutral micro-expression, in keeping with the character's temperament |
| Light | Even soft light, key light from the front + fill from both sides, no hard shadows |
| Consistency | Skin tone/body type/hairstyle/face/base outfit are exactly the same across the four views |
| Aspect ratio | 4:1 or 3:1 recommended |

---

## 8. Prompt template

```
{gender} character four-view sheet，live-action realistic photography，urban realist documentary feel，strong contrast，extreme detail，
character design sheet，character turnaround，
{facial features implied by the character description - derived naturally from it}，{overall temperament}，natural state，
{skin tone}，natural skin，healthy skin，delicate skin，pores faintly visible，
{height description, e.g.: 170cm tall、tall slender woman}，{head-to-body ratio, e.g.: 7.5 heads tall proportion}，{figure description}，{posture description}，
{hair color}{hair length}，every hair strand distinct，{base styling}，no hair ornament，
{ordinary outfit matching the character's identity, e.g.: modern school uniform/smart casual work wear/urban casual wear}，low-saturation neutral color，no complex pattern，
side by side left to right in one frame: portrait close-up + front view + side view + back view，
the portrait close-up shown complete from the top of the head to the collarbone，crown not cropped，
the full-body standing figure shown complete from the top of the head to the soles of the feet，crown and feet not cropped，
standing naturally，clean neutral gray background，even soft light，no hard shadow，
four-view consistency，finely rendered face，finely rendered hair strands，true skin texture
no text of any kind in the image
```


---

## 9. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must be in a "natural state"|
| R2 | Must state a suitable everyday outfit as the base outfit based on the character description (e.g. student → school uniform, office worker → smart casual work wear, at home → urban casual wear); underwear as the base layer is forbidden |
| R3 | Must state "no hair ornament, no accessories" |
| R4 | Must specify "clean neutral gray background" |
| R5 | Must specify "four-view consistency" |
| R6 | The full-body standing figure must be shown complete from the top of the head to the soles of the feet; cropping is strictly forbidden |
| R7 | Must state the character's height and constrain full-body proportion by converting it into a head-to-body ratio |
| R8 | The portrait close-up must be shown complete from the top of the head to the collarbone; cropping the crown is strictly forbidden |
| R9 | Skin must keep its true texture and must not be over-smoothed |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Underwear/revealing/sexualised base layers; outfits clearly at odds with the character description; over-complex patterns/ornament that interfere with later costume-and-makeup overlays |
| X2 | Hard top light/bottom light/colored light |
| X3 | Over-whitening/over-smoothing until the texture is gone |
| X4 | Complex scene backgrounds (a plain gray ground is mandatory) |
| X5 | Exaggerated expressions/dynamic poses |
| X6 | Cropping the crown or the soles in the full-body standing figure — it must fit in frame complete from head to feet |
| X7 | Cropping the crown in the portrait close-up — it must fit in frame complete from the top of the head to the collarbone |
| X8 | Ignoring the height and head-to-body-ratio constraints |
