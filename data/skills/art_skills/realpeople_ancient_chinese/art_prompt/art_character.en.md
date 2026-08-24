# Base Character Likeness Generation · Constraint Manual


---

## 1. Base likeness principles

1. **The face is the soul** — the facial features are the character's only anchor, rendered finely down to the pores
2. **The character comes first** — the base outfit is decided by the character description (identity/occupation/gender/scene) as their everyday wear; later specific costume and makeup are overlay layers
3. **Four-view consistency** — face/body type/hairstyle/base outfit stay highly consistent across the views
4. **Cool beauty with feeling** — even bare-faced, the character's temperament must come through (cool and clear/gentle and warm/alluring)

---

## 2. Face constraints

> Facial-feature parameters are no longer fixed. The character description (gender/age/personality/temperament) drives the AI to generate the features freely, so that characters look different from one another.

### General requirements

| Item | Constraint |
|---|---|
| Features | Derived naturally from the character description; do not preset face shape/eye shape/brow shape/nose shape/lip shape |
| Style base | Ancient-style live-action realistic photography, pore-level fine rendering, natural lighting, physically based light and shadow |
| Temperament | Must distil the overall temperament keywords from the character description (such as cool and clear/gentle and warm/alluring/chivalrous) and write them into the prompt |
| Expression | Neutral micro-expression, in keeping with the character's temperament |

---

## 3. Skin constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Cool fair skin, even over the whole body, translucent fairness | cool fair skin、milky skin、milky white skin |
| Sheen | Dewy skin, light coming through from within, neither matte nor oily | dewy skin、luminous skin、dewy skin |
| Texture | Delicate, keeping a faint pore texture | delicate skin、pores faintly visible |
| Exposed skin | Face/neck/collarbone/hands | beautiful shoulder and neck lines、fair translucent skin |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Skin tone | Fair and translucent with a healthy look, even over the whole body | fair translucent skin tone、creamy skin |
| Sheen | Fresh dewy quality, natural sheen | dewy skin、translucent fresh skin |
| Texture | Clean and crisp, pores visible | delicate skin texture、cool clear face |

---

## 4. Body-type constraints

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Height | Specified by the character setting, default range 160-170cm; height is expressed through the head-to-body ratio conversion | {height}cm tall、{height description, e.g.: tall slender woman} |
| Head-to-body ratio | 7 to 8 heads tall; head-to-body ratio = height ÷ head length; strictly constrains the whole-body proportion | 7-8 heads tall proportion、slender figure |
| Height conversion | Head length = height ÷ head-to-body ratio (e.g. 165cm ÷ 7.5 = 22cm head length); use it to constrain the proportion of the head and each body section | well-balanced proportion、harmonious head-to-body ratio |
| Shoulders and neck | Swan neck, beautiful shoulder-neck line | swan neck、beautiful shoulders and neck |
| Hands | Slender and fair, distinct knuckles, five normal fingers | slender delicate hands、distinct knuckles |
| Bearing | Classical lady, reserved and dignified | dignified bearing、graceful posture |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Height | Specified by the character setting, default range 175-185cm; height is expressed through the head-to-body ratio conversion | {height}cm tall、{height description, e.g.: tall imposing man} |
| Head-to-body ratio | 7.5 to 8.5 heads tall; head-to-body ratio = height ÷ head length; strictly constrains the whole-body proportion | 7.5-8.5 heads tall proportion、tall figure |
| Height conversion | Head length = height ÷ head-to-body ratio (e.g. 180cm ÷ 8 = 22.5cm head length); use it to constrain the proportion of the head and each body section | well-balanced proportion、harmonious head-to-body ratio、broad shoulders narrow waist |
| Shoulders and neck | Broad shoulders, strong neck | broad shoulders narrow waist |
| Hands | Distinct knuckles, broad palms, five normal fingers | distinct finger knuckles |
| Bearing | Warrior/scholar bearing (per the character) | upright posture, composed bearing |

### Height–head-ratio conversion reference

| Height (cm) | Head-to-body ratio | Head length (cm) | Suitable description |
|---|---|---|---|
| 155-160 | 7.0 | ~22cm | Petite and dainty |
| 160-165 | 7.0-7.5 | ~22cm | Slim and slender |
| 165-170 | 7.5 | ~22cm | Tall and graceful (female default) |
| 170-175 | 7.5-8.0 | ~22cm | Slender and upright |
| 175-180 | 8.0 | ~22.5cm | Tall and handsome (male default) |
| 180-185 | 8.0-8.5 | ~22cm | Imposing and upright |
| 185-190 | 8.5 | ~22cm | Tall and powerful |

---

## 5. Base hairstyle constraints

> Defines only naturally loose hair/simply tied hair; hair ornaments are layered on in the costume-derivative step.

### Female

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Pure black; brown/highlights forbidden | black long hair、ink-black hair like a waterfall |
| Hair length | Waist-length or longer | waist-length long hair |
| Hair quality | Strands separated one by one, clear locks | hair strands separated one by one、delicate hair-strand rendering |
| Styling | Naturally loose, center/side part, no hair ornament | long hair falling naturally、black tresses like a waterfall |

### Male

| Item | Constraint | Prompt |
|---|---|---|
| Hair color | Pure black or ink-dark | ink-black hair、hair black as ink |
| Hair length | Medium-long to long | long hair、shoulder-length long hair |
| Hair quality | Strands separated one by one, clear texture | hair strands separated one by one、delicate hair-strand rendering |
| Styling | Naturally loose or half-tied, no hair crown | long hair falling naturally、half-tied long hair |

---

## 6. Base outfit constraints

> The base outfit is the most natural everyday wear implied by the character description (identity/dynasty/occupation/scene), serving as that character's "everyday default state"; formal robes/special derivatives are layered on in the costume-derivative step. **Underwear as a base layer is forbidden.**

### Outfit selection principles

| Character identity | Default outfit direction |
|---|---|
| Noble daughter/young lady | Plain-color ancient-style long dress (soft and flowing) |
| Young gentleman/scholar | Plain-color ancient-style long robe |
| Warrior/knight-errant | Light martial garb / casual battle robe |
| Commoner/townsfolk | Plain short garb / coarse-cloth clothes |
| Palace maid/servant girl | Simple palace dress / maidservant attire |
| Not specified in the character description | Plain-color ancient-style everyday wear (long dress/long robe matched to gender) |

### Outfit consistency rules

- The clothing style must match the ancient-style live-action realist aesthetic (traditional Chinese tonality, realistic materials)
- Low-saturation colors, no complex patterns/ornament, so later derivative layers can be added easily
- The outfit design is exactly the same across the four views
- The base outfit is the "everyday default state"; the focus is still the face and the bearing
- Underwear/exposed/sexualized base layers are strictly forbidden

---

## 7. Four-view design sheet specification

### View definitions

| Position | View | Angle | Shot size | Requirement | Prompt |
|---|---|---|---|---|---|
| First from left | Portrait close-up | Front, eye level | Top of head to collarbone | Shown complete from the top of the head to the collarbone without cropping, face taking 60%+, features clear | portrait closeup、face detail、head to collarbone complete、no crop |
| Second from left | Front view | Front 0° | Full-body standing figure | Facing the camera, arms natural, shown complete from the top of the head to the soles | front view、full body head to toe、height mark |
| Second from right | Side view | Right side 90° | Full-body standing figure | Pure profile outline clear, shown complete from the top of the head to the soles | side view、profile、full body head to toe、height mark |
| First from right | Back view | Rear 180° | Full-body standing figure | Back of the head/back/hair ends/feet clear, shown complete from the top of the head to the soles | back view、rear view、full body head to toe、height mark |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | Four views side by side from left to right in one frame |
| Background | Clean neutral gray #E8E8E8 |
| Stance | Standing naturally, feet parallel and slightly apart, arms hanging naturally or slightly out |
| Full-body display | The full-body standing figure must be fully in frame from the top of the head to the soles; cropping the crown or the feet is strictly forbidden |
| Close-up display | The portrait close-up must be fully in frame from the top of the head to the collarbone; cropping the crown is strictly forbidden, and hair, forehead and chin must all be complete |
| Expression | Neutral micro-expression, in keeping with the character's temperament |
| Light | Even soft light, key light from the front + fill on both sides, no hard shadow |
| Consistency | Skin tone/body type/hairstyle/face/base outfit are exactly the same across the four views |
| Frame ratio | 4:1 or 3:1 recommended |

---

## 8. Prompt template

```
{gender} character four-view design sheet，live-action realistic photography，ancient-style realist documentary，high contrast，extreme detail，
character design sheet，character turnaround，
{facial features implied by the character description - derived naturally from it}，{overall temperament}，bare face no makeup，
{skin tone}，dewy skin，translucent glowing skin，delicate skin，pores faintly visible，
{height description, e.g.: 170cm tall、tall slender woman}，{head-to-body ratio, e.g.: 7.5 heads tall proportion}，{figure description}，{bearing description}，
{hair color}{hair length}，hair strands separated one by one，{base styling}，no hair ornament，
{everyday ancient outfit matching the character's identity, e.g.: plain-color long dress/plain-color long robe/light martial garb/coarse-cloth short garb}，traditional Chinese low-saturation tonality，no complex patterns，
side by side left to right in one frame: portrait close-up+front view+side view+back view，
the portrait close-up shown complete from the top of the head to the collarbone, crown not cropped，head to collarbone complete，
the full-body standing figure shown complete from the top of the head to the soles, full body head to toe，crown and feet not cropped，
standing naturally，clean neutral gray background，even soft light，no hard shadow，
four-view consistency，delicate facial rendering，delicate hair-strand rendering
no text of any kind in the image
```

---

## 9. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must be in the "bare face, no makeup" state |
| R2 | Must state a suitable everyday ancient outfit as the base outfit, derived from the character description (e.g. noble daughter → plain-color long dress, scholar → plain-color long robe, warrior → light martial garb); underwear as a base layer is forbidden |
| R3 | Must state "no hair ornament, no accessories" |
| R4 | Must specify "clean neutral gray background" |
| R5 | Must specify "four-view consistency" |
| R6 | The full-body standing figure must be shown complete from the top of the head to the soles; cropping is strictly forbidden |
| R7 | Must state the character's height and constrain the whole-body proportion through the head-to-body ratio conversion (female default 160-170cm/7-8 heads, male default 175-185cm/7.5-8.5 heads) |
| R8 | The portrait close-up must be shown complete from the top of the head to the collarbone; cropping the crown is strictly forbidden |

### Strictly forbidden

| No. | Forbidden |
|---|---|
| X1 | Underwear/exposed/sexualized base layers; outfits that clearly contradict the character description; excessively complex patterns/ornament that interfere with later costume layers |
| X2 | Hard top light/bottom light/colored light |
| X3 | Whitening so far that the skin looks bloodless / skin tone turning gray |
| X4 | Complex scene backgrounds (a plain gray ground is required) |
| X5 | Exaggerated expressions/dynamic poses |
| X6 | Cropping the crown or the soles of the full-body standing figure — it must be fully in frame from head to toe |
| X7 | Cropping the crown of the portrait close-up — it must be fully in frame from the top of the head to the collarbone |
| X8 | Ignoring the height and head-to-body ratio constraints; the height must be stated explicitly and the whole-body proportion expressed through the head-to-body ratio conversion |
