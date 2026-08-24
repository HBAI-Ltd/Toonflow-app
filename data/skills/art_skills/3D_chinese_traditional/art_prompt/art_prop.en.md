---
name: art_prop
description: Prop image generation · constraint manual
metaData: art_skills
---

# Prop Image Generation · Constraint Manual

---

## 1. Prop design principles

1. **Readable function** — the prop's purpose is obvious at a glance; the form serves the function
2. **Texture to the maximum** — the material grain must be clearly identifiable (metal/jade/wood/cloth/paper)
3. **Period consistency** — every prop must fit the Guofeng-era world; modern elements are forbidden
4. **Explicit scale** — imply the prop's real size through a reference object or a marking
5. **The prop is shown alone** — only the prop itself may appear in frame; any person, hand or limb is strictly forbidden, the prop must not be in a held/worn/gripped state, and it must be presented on its own as a still-life display

---

## 2. Prop categories and aesthetic constraints

### 2.1 Weapons

| Item | Constraint | Prompt |
|---|---|---|
| Type | Sword/saber/bow/spear/fan | {weapon type}，Guofeng-era weapon |
| Material | Fine steel/dark iron + gemstone inlay + silk sword tassel | forged fine steel、gemstone inlay |
| Ornament | Carving on scabbard/hilt, tassels, hidden patterns | refined carving、hanging tassels |
| Sheen | Cool metal sheen, reflection along the edge | cool sheen、metal texture |
| Prompt | Guofeng-era {weapon}，forged fine steel，refined carving | — |

### 2.2 Jewelry

| Item | Constraint | Prompt |
|---|---|---|
| Type | Hairpin/hair stick/yingluo collar/jade pendant/bracelet/earring | {jewelry type}，Guofeng-era jewelry |
| Material | Gold/silver/jade/pearl/gemstone | woven gold filigree、translucent jade |
| Craft | Utterly fine, filigree/cloisonné/inlay | fine craft、finely carved and worked |
| Sheen | Pearl luster/jade warmth/metal sheen | lustrous pearl glow、metal sheen |
| Prompt | Guofeng-era {jewelry}，{material}，fine craft，finely carved and worked | — |

### 2.3 Everyday objects

| Item | Constraint | Prompt |
|---|---|---|
| Type | Tea set/wine set/incense burner/go board/scroll/lantern | {object type}，Guofeng-era object |
| Material | Porcelain/bronze/bamboo/wood/paper | warm celadon、rustic red copper |
| Texture | Glaze/wood grain/bamboo node clear | glaze sheen、clear wood grain |
| Style | Plain-elegant/opulent, switched to suit the scene | plain and rustic / opulent and refined |
| Prompt | Guofeng-era {object}，{material} texture，clear grain | — |

### 2.4 Tokens/key props

| Item | Constraint | Prompt |
|---|---|---|
| Type | Keepsake/token tablet/scroll/medicine bottle/jade seal | {prop type}，Guofeng-era prop |
| Distinctiveness | Must be recognizable and carry narrative symbolism | distinctive form、deep implied meaning |
| Aged feel | The feel of years may be added as the plot requires | old and mottled / brand-new and refined |
| Prompt | Guofeng-era {prop}，{material}，{state}，distinctive form | — |

---

## 3. Multi-angle sheet specification

### View definitions

| Position | View | Angle | Requirement | Prompt |
|---|---|---|---|---|
| Top left | Front view | Front 0° | The prop's complete front form | front view |
| Top right | Side view | Side 90° | Thickness/silhouette/structure clear | side view |
| Bottom left | Back view | Rear 180° | The prop's back structure/ornament | back view |
| Bottom right | Detail close-up | Local enlargement | Material grain/craft detail | detail closeup |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | A four-panel grid (2×2) in one frame, four angles in the four quadrants |
| Background | Plain gray solid color #B8B8B8 |
| Light | Even soft light, no hard shadow |
| Proportion | In each cell the prop fills 70%+ of the cell |
| Cast shadow | A slight natural ground shadow is allowed |
| Aspect ratio | 1:1 recommended |

---

## 4. Material rendering constraints

| Material | Rendering requirement | Prompt |
|---|---|---|
| Metal | Reflection/highlight/cool sheen, scratches faintly visible | metal texture、cool sheen、clear reflection |
| Jade | Internal light transmission, warm, faintly translucent | translucent jade、warm as fat jade |
| Wood | Clear wood grain, growth rings visible | clear wood grain、warm texture |
| Porcelain | Glaze sheen, even color | glaze sheen、warm porcelain body |
| Cloth/paper | Fibre texture, natural edges | cloth grain、rustic paper |
| Gemstone | Refraction/internal light, clear facets | brilliant gemstone、refracted light |

---

## 5. Prompt template

Guofeng-era prop sheet，3D render style，high-precision modeling，PBR materials，Guofeng 3D，cinema-level lighting，
{prop type}，{material description}，{craft/ornament description}，{state description}，
prop-only still-life display，the prop displayed alone，held by no one，worn by no one，
a four-panel grid (2×2) in one frame：top left front view + top right side view + bottom left back view + bottom right detail close-up，
plain gray solid-color background，even soft light，no hard shadow，
ultra-clear material grain，PBR material rendering，{material sheen description}
no text of any kind in the image，
no person、hand、finger or limb may appear in frame, and the prop must not be in a gripped or worn state

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must specify "plain gray solid-color background" |
| R2 | Must state the prop's material and craft |
| R3 | The prop's form must fit the Guofeng-era world |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Complex scene backgrounds |
| X2 | The prop and a person in the same frame (this stage is a prop-only image) |
| X3 | Any human figure appearing, including full body, half body or a part (hand, finger, arm or other limb) |
| X4 | The prop being held, gripped, worn or in use |
| X5 | Elements implying a person's presence (grip marks, a wearer's viewpoint, a posture of use) |
