# Prop Derived State Generation · Constraint Manual

---

## 1. Derivation principles

1. **Form anchoring** — the prop's core form/outline stays recognizable in every state
2. **Readable state** — the difference between states must be obvious at a glance; the viewer can tell them apart immediately
3. **Serving the narrative** — every state variant serves a specific plot beat
4. **Progressive degradation** — damage/aging states must follow a sound physical logic
5. **Pure prop, shown on its own** — only the prop itself may appear in the frame; any character, hand or limb is strictly forbidden, the prop must not be held/worn/gripped, and it must be presented on its own as a still-life display

---

## 2. State types

### 2.1 Usage states

| State | Description | Suitable props | Prompt |
|---|---|---|---|
| Brand new | Intact and undamaged, sheen like new | All props | brand new、intact and undamaged、sheen like new |
| Everyday use | Slight wear, natural patina | Weapons/vessels/ornaments | traces of everyday use、natural patina |
| Old | Clear sense of age, dulled color | Vessels/tokens/scrolls | old and mottled、a sense of age、dull color |

### 2.2 Damage states

| State | Description | Suitable props | Prompt |
|---|---|---|---|
| Slightly damaged | Small cracks/small chips/light wear | Porcelain/jade pendants/weapons | fine cracks、slight chipping |
| Broken | Clear cracks/fractures/shattering | Porcelain/ornaments/weapons | clear cracks、shattered、fractured |
| Fragment | Only part/fragments left | Porcelain/jade pendants/tokens | fragment、shard、only half left |

### 2.3 Special states

| State | Description | Suitable props | Prompt |
|---|---|---|---|
| Bloodstained | Blood adhering | Weapons/clothing/tokens | mottled bloodstains、bloodstained |
| Soaked/wet | Water marks, wet reflections | Scrolls/tokens/clothing | soaked、paper wet、ink bleeding |
| Burnt/scorched | Charred edges, traces of fire | Scrolls/tokens/wooden items | charred edges、traces of fire |
| Glowing/activated | Inner energy, light radiating out | Tokens/magic items/jade | faintly glowing、light held within |
| Wrapped/sealed away | Wrapped in cloth/a box | Tokens/ornaments/secret items | wrapped in brocade、sealed in a wooden box |

---

## 3. Frame specification for state variants

### Single-state image

| Item | Constraint |
|---|---|
| Background | Clean neutral gray #E8E8E8 (matching the design sheet) |
| Light | Even illumination, no hard shadow |
| Angle | Matching the front view of the original design sheet |
| Proportion | The prop takes 70%+ of the frame |

### State comparison image

| Item | Constraint |
|---|---|
| Layout | 2-3 states shown side by side in one frame |
| Labels | The state name marked below each state |
| Consistency | Angle/light/background exactly the same, only the state differs |

---

## 4. Rules for material change by state

| Material | Brand new → everyday | Everyday → old | Damage expression |
|---|---|---|---|
| Metal | Bright sheen → slight patina | Patina → rust spots | Chipping/rolled edge/fracture |
| Jade | Translucent and smooth → slight wear | Wear → fine surface cracks | Cracks/shattering/chipped corner |
| Wood | Fresh wood grain → natural patina | Patina → dulled color | Splitting/fracture/worm holes |
| Porcelain | Glaze sheen → fine scratches | Scratches → dulled glaze | Cracks/shattering/chipping |
| Cloth/paper | Brand new and flat → light creases | Creases → yellowing and brittle | Tearing/scorching/ink bleeding |

---

## 5. Prompt template

### Single-state variant

```
Based on the design sheet of {prop name}，live-action realistic photography style，ancient-style realist documentary，high contrast，extreme detail，
{prop type}，{material description}，
current state: {state name}，{visual description of the state}，
{description of the material surface change}，
pure prop still-life display，the prop displayed on its own，held by no one，worn by no one，
a four-cell grid (2×2) in one frame: top-left front view(front view)+top-right side view(side view)+bottom-left back view(back view)+bottom-right detail close-up(detail closeup)，
clean neutral gray background，even soft light，no hard shadow，
ultra-crisp material texture，realistic texture，state detail identifiable
no text of any kind in the image，
no character, hand, finger or limb may appear in the frame, and the prop must not be gripped or worn
```

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The prop's core form/outline stays recognizable in every state |
| R2 | The state change must follow a sound physical logic |
| R3 | Must use the four-cell grid (2×2) layout: top-left front view+top-right side view+bottom-left back view+bottom-right detail close-up |
| R4 | Must specify "clean neutral gray background", even soft light, no hard shadow |

### Strictly forbidden

| No. | Forbidden |
|---|---|
| X1 | The prop becoming unrecognizable after the state change |
| X2 | Damage that violates physical logic (jade rusting and the like) |
| X3 | Excessively bloody/horrific depiction of damage |
| X4 | Any character figure appearing, including full body, half body or a part (hand, fingers, arm or other limb) |
| X5 | The prop being held, gripped, worn or in use |
| X6 | Elements implying a person is present (such as traces of being held, a wearer's viewpoint, a posture of use) |
