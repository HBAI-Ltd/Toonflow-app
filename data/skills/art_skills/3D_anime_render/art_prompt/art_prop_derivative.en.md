# 3D Anime Render Urban Prop Derivative State Generation · Constraint Manual

---

## 1. Derivation principles

1. **Form anchoring** — the prop's core form/silhouette stays recognisable in every state
2. **Readable state** — the difference between states must be obvious at a glance; the audience tells them apart immediately
3. **Serving the narrative** — every state variant serves a specific story beat
4. **Progressive degradation** — damaged/aged states should follow a plausible physical logic (rendered cel-shaded)
5. **The prop is shown alone** — only the prop itself may appear in frame; any person, hand or limb is strictly forbidden, the prop must not be held/worn/gripped, and it must be presented on its own as a still-life display

---

## 2. State types

### 2.1 Use states

| State | Description | Applicable props | Prompt |
|---|---|---|---|
| Brand new | Intact, sheen like new | All props | brand new, intact, sheen like new |
| Everyday use | Slight wear, natural marks of use (cel-shaded) | All props | everyday marks of use, slight wear |
| Aged | Clear sense of use, dulled color (cel-shaded) | Objects/accessories/electronics | marks of use, sense of age, dulled color |

### 2.2 Damage states

| State | Description | Applicable props | Prompt |
|---|---|---|---|
| Slightly damaged | Small crack/small chip/light wear (cel-shaded) | Glass/ceramic/electronic devices | fine crack, slight chip |
| Broken | Clear crack/fracture/shattering (cel-shaded) | Glass/ceramic/electronic devices | crack clearly visible, shattered, fractured |
| Fragment | Only a part/shards left (cel-shaded) | Glass/ceramic/electronic devices | fragment, shards, only half left |

### 2.3 Special states

| State | Description | Applicable props | Prompt |
|---|---|---|---|
| Charging/working | Screen lit/indicator light (cel-shaded) | Electronic devices | screen lit, working indicator light |
| Soaked/wet | Water marks, wet reflection (cel-shaded) | Electronic devices/paper | soaked, wet surface, reflection |
| Damaged screen | Screen cracks/display anomalies | Electronic devices | screen cracks, display anomaly |
| Battery flat | Indicator light off/battery icon | Electronic devices | battery flat, indicator light off |
| Stowed/carried | Pouch/storage case | Accessories/electronic devices | pouch, storage case |

---

## 3. Frame specification for state variants

### Single-state image

| Item | Constraint |
|---|---|
| Background | Clean neutral gray #E8E8E8 (same as the base sheet) |
| Light | Even illumination, no hard shadow |
| Angle | Same as the front view of the original sheet |
| Proportion | The prop fills 70%+ of the frame |

### State comparison image

| Item | Constraint |
|---|---|
| Layout | 2-3 states shown side by side in one frame |
| Labelling | The state name is labelled below each state |
| Consistency | Angle/light/background exactly identical, only the state differs |

---

## 4. Rules for material change by state

| Material | Brand new → everyday | Everyday → aged | Damage expression (cel-shaded) |
|---|---|---|---|
| Metal | Bright sheen → fine scratches | Scratches → dulled color | Chip/rolled edge/fracture (cel-shaded treatment) |
| Glass | Transparency → fine scratches | Scratches → surface wear | Crack/shattering/chipped corner (cel-shaded treatment) |
| Plastic | Smooth → light scratches | Scratches → dulled color | Splitting/fracture/wear (cel-shaded treatment) |
| Leather | Smooth → natural creases | Creases → dulled color | Wear/cracking/fading (cel-shaded treatment) |
| Paper | Flat → light creasing | Creasing → yellowing | Tearing/wear/ink bleeding (cel-shaded treatment) |

---

## 5. Prompt template

### Single-state variant

```
based on the {prop name} sheet，3D animation render，cinematic lighting，vivid cel-shaded texture，high-detail materials，joyful healing atmosphere，cartoon urban style，high-detail cartoon materials，moderate cartoon proportions，warm-toned color scheme，8K ultra HD，cinematic composition，soft light-and-shadow layering，bright cartoon render style，warm and healing，
anime style, cel-shaded, 3D animation render,
{prop type}，{material description}，
current state: {state name}，{visual description of the state}，
{description of the material-surface change}，(cel-shaded treatment)
prop-only still-life display，the prop displayed alone，held by no one，worn by no one，
a four-panel grid (2×2) in one frame: top left front view(front view) + top right side view(side view) + bottom left back view(back view) + bottom right detail close-up(detail closeup)，
clean neutral gray background，even soft light，no hard shadow，
clear material grain，cel-shaded rendering，state detail discernible，cel-shaded treatment，
8K ultra HD，cinematic composition，
no text of any kind in the image，
no person, hand, finger or limb may appear in frame, and the prop must not be in a gripped or worn state
```

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | The prop's core form/silhouette stays recognisable in every state |
| R2 | The state change must follow physical logic (cel-shaded) |
| R3 | Must use the four-panel grid (2×2) layout: top left front view + top right side view + bottom left back view + bottom right detail close-up |
| R4 | Must specify "clean neutral gray background", even soft light, no hard shadow |
| R5 | Must contain the 3D anime render keywords (cel-shaded, 3D animation render, anime style) |
| R6 | Must contain the 8K ultra HD and cinematic composition keywords |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | The prop becoming unrecognisable after the state change |
| X2 | Damage that violates physical logic (electronics rusting, etc.) |
| X3 | Excessively bloody/horrific depiction of damage (within the limits of cel shading) |
| X4 | Any human figure appearing, including full body, half body or a part (hand, finger, arm or other limb) |
| X5 | The prop being held, gripped, worn or in use |
| X6 | Elements implying a person's presence (grip marks, a wearer's viewpoint, a posture of use) |
| X7 | Using photographic realism terms (such as real photography, photorealistic, RAW photo, etc.) |
| X8 | Over-realistic damage grain that breaks the consistency of the cel-shaded style |
| X9 | Ancient/futuristic elements, anything outside the modern urban style |