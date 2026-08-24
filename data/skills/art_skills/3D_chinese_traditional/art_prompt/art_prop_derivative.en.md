---
name: art_prop_derivative
description: Prop derived state generation · constraint manual
metaData: art_skills
---

# Prop Derived State Generation · Constraint Manual

---

## 1. Derivation principles

1. **Form anchoring** — the prop's core form/silhouette stays recognizable across every state
2. **Readable state** — the difference between states must be obvious at a glance, so the audience tells them apart immediately
3. **Serving the narrative** — every state variant serves a specific plot beat
4. **Progressive degradation** — damaged/aged states must follow a plausible physical logic
5. **The prop is shown alone** — only the prop itself may appear in frame; any person, hand or limb is strictly forbidden, the prop must not be in a held/worn/gripped state, and it must be presented on its own as a still-life display

---

## 2. State types

### 2.1 Use states

| State | Description | Applicable props | Prompt |
|---|---|---|---|
| Brand-new | Intact and undamaged, sheen like new | All props | brand-new、intact and undamaged、sheen like new |
| Everyday use | Slight wear, natural patina | Weapons/objects/jewelry | traces of everyday use、natural patina |
| Aged | A clear feel of years, dulled color | Objects/keepsakes/scrolls | old and mottled、feel of years、dulled color |

### 2.2 Damage states

| State | Description | Applicable props | Prompt |
|---|---|---|---|
| Slight damage | Small cracks/small chips/light wear | Porcelain/jade pendant/weapons | fine cracks、slight chipping |
| Broken | Clear cracks/fracture/shattering | Porcelain/jewelry/weapons | clear cracks、shattered、fractured |
| Fragment | Only part/a shard remains | Porcelain/jade pendant/keepsakes | fragment、shard、only half remaining |

### 2.3 Special states

| State | Description | Applicable props | Prompt |
|---|---|---|---|
| Bloodstained | Blood adhering | Weapons/clothing/keepsakes | mottled bloodstains、bloodstained |
| Waterlogged/damp | Water marks, damp reflection | Scrolls/keepsakes/clothing | waterlogged、damp paper、ink bleeding |
| Burnt/scorched | Charred edges, fire marks | Scrolls/keepsakes/wooden items | charred edges、fire marks |
| Glowing/activated | Inner energy, radiating light | Keepsakes/ritual objects/jade | faintly glowing、inner radiance |
| Wrapped/sealed away | Wrapped in cloth/a box | Keepsakes/jewelry/secret objects | wrapped in brocade、sealed in a wooden box |

---

## 3. Frame specification for state variants

### Single-state image

| Item | Constraint |
|---|---|
| Background | Plain gray solid color #B8B8B8 (same as the design sheet) |
| Light | Even illumination, no hard shadow |
| Angle | Same as the front view of the original design sheet |
| Proportion | The prop fills 70%+ of the frame |

### State comparison image

| Item | Constraint |
|---|---|
| Layout | 2-3 states shown side by side in one frame |
| Labeling | The state name labeled below each state |
| Consistency | Angle/light/background completely identical, only the state differs |

---

## 4. Rules for material state change

| Material | Brand-new → everyday | Everyday → aged | Damage expression |
|---|---|---|---|
| Metal | Bright sheen → slight patina | Patina → rust spots | Chipping/rolled edge/fracture |
| Jade | Translucent and warm → slight wear | Wear → fine surface cracks | Cracks/shattering/chipped corner |
| Wood | New wood grain → natural patina | Patina → dulled color | Splitting/fracture/worm holes |
| Porcelain | Glaze sheen → fine scratches | Scratches → dulled glaze | Cracks/shattering/chipping |
| Cloth/paper | Brand-new and flat → slight creases | Creases → yellowed and brittle | Tearing/scorching/ink bleeding |

---

## 5. Prompt template

### Single-state variant

Based on the design sheet of {prop name}，3D render style，high-precision modeling，PBR materials，Guofeng 3D，cinema-level lighting，
{prop type}，{material description}，
current state：{state name}，{visual description of the state}，
{description of the material surface change}，
prop-only still-life display，the prop displayed alone，held by no one，worn by no one，
a four-panel grid (2×2) in one frame：top left front view(front view)+top right side view(side view)+bottom left back view(back view)+bottom right detail close-up(detail closeup)，
plain gray solid-color background，even soft light，no hard shadow，
ultra-clear material grain，PBR material rendering，state detail identifiable
no text of any kind in the image，
no person、hand、finger or limb may appear in frame, and the prop must not be in a gripped or worn state

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The prop's core form/silhouette stays recognizable across every state |
| R2 | State change must follow physical logic |
| R3 | Must use the four-panel grid (2×2) layout: top left front view + top right side view + bottom left back view + bottom right detail close-up |
| R4 | Must specify "plain gray solid-color background", even soft light, no hard shadow |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | The prop becoming unrecognizable after the state change |
| X2 | Damage that violates physical logic (jade rusting and the like) |
| X3 | Excessively gory/horrific depiction of damage |
| X4 | Any human figure appearing, including full body, half body or a part (hand, finger, arm or other limb) |
| X5 | The prop being held, gripped, worn or in use |
| X6 | Elements implying a person's presence (grip marks, a wearer's viewpoint, a posture of use) |
