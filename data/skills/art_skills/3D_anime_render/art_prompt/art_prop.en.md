# 3D Anime Render Urban Prop Image Generation · Constraint Manual

---

## 1. Prop design principles

1. **Readable function** — the prop's purpose is obvious at a glance; the form serves the function
2. **Texture to the maximum** — the material texture must be clearly identifiable (metal/glass/plastic/wood/cloth), but moderately simplified by cel-shaded rendering
3. **Period consistency** — every prop must fit the modern urban world; ancient/futuristic elements are forbidden
4. **Explicit scale** — imply the prop's real size through a reference object or a marking
5. **The prop is shown alone** — only the prop itself may appear in frame; any person, hand or limb is strictly forbidden, the prop must not be held/worn/gripped, and it must be presented on its own as a still-life display

---

## 2. Prop categories and aesthetic constraints

### 2.1 Office supplies

| Item | Constraint | Prompt |
|---|---|---|
| Type | Notebook/pen/folder/calculator | {prop type}, urban office supply |
| Material | Plastic/metal/paper | modern material, urban texture |
| Ornament | Minimalist design, brand mark | minimalist design, urban style |
| Sheen | Moderate sheen, clear reflection | moderate sheen, clear reflection |
| Prompt | 3D anime render urban {prop}, modern material, minimalist design | — |

### 2.2 Everyday objects

| Item | Constraint | Prompt |
|---|---|---|
| Type | Coffee cup/water glass/tableware/lamp | {object type}, urban everyday object |
| Material | Glass/ceramic/metal/plastic | glass texture, modern design |
| Texture | Smooth surface, clear material | smooth surface, clear material |
| Style | Minimalist/modern, switched to suit the scene | minimalist modern / urban style |
| Prompt | 3D anime render urban {object}, {material} texture, clear grain | — |

### 2.3 Electronic devices

| Item | Constraint | Prompt |
|---|---|---|
| Type | Phone/tablet/headphones/camera | {device type}, urban electronic device |
| Material | Metal/glass/plastic | modern device material, smooth texture |
| Craft | Refined craft, brand design | refined craft, brand design |
| Sheen | Moderate reflection, glowing screen effect | moderate reflection, glowing screen |
| Prompt | 3D anime render urban {device}, modern material, glowing screen effect | — |

### 2.4 Clothing accessories

| Item | Constraint | Prompt |
|---|---|---|
| Type | Glasses/watch/bag/keychain | {accessory type}, urban clothing accessory |
| Material | Metal/leather/fabric/glass | leather texture, metal texture |
| Craft | Brand craft, refined design | brand craft, refined design |
| Sheen | Moderate sheen, clear brand mark | moderate sheen, clear brand mark |
| Prompt | 3D anime render urban {accessory}, {material}, brand design | — |

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
| Background | Clean neutral gray #E8E8E8 |
| Light | Even soft light, no hard shadow |
| Proportion | In each cell the prop fills 70%+ of the cell |
| Cast shadow | A slight natural ground shadow is allowed (cel-shaded treatment) |
| Aspect ratio | 1:1 recommended |

---

## 4. Material rendering constraints

| Material | Rendering requirement | Prompt |
|---|---|---|
| Metal | Reflection/highlight/cool sheen (cel-shaded treatment), scratches faintly visible | metal texture, cel-shaded sheen, clear reflection |
| Glass | Transparency/refraction/glow (simplified by cel shading) | glass texture, clear transparency |
| Plastic | Smooth surface/slight reflection | plastic texture, smooth surface |
| Leather | Clear grain/natural creases | leather texture, natural grain |
| Paper | Surface grain/slight creases | paper texture, surface grain |
| Fabric | Fibre texture/natural folds | fabric texture, natural grain |

---

## 5. Prompt template

```
3D animation render，cinematic lighting，vivid cel-shaded texture，high-detail materials，joyful healing atmosphere，cartoon urban style，high-detail cartoon materials，moderate cartoon proportions，warm-toned color scheme，8K ultra HD，cinematic composition，soft light-and-shadow layering，bright cartoon render style，warm and healing，prop sheet，
anime style, cel-shaded, 3D animation render,
{prop type}，{material description}，{craft/ornament description}，{state description}，
prop-only still-life display，the prop displayed alone，held by no one，worn by no one，
a four-panel grid (2×2) in one frame: top left front view + top right side view + bottom left back view + bottom right detail close-up，
clean neutral gray background，even soft light，no hard shadow，
clear material grain，cel-shaded rendering，{material sheen description}，modern cartoon urban style，
8K ultra HD，cinematic composition，
no text of any kind in the image，
no person, hand, finger or limb may appear in frame, and the prop must not be in a gripped or worn state
```

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must specify "clean neutral gray background" |
| R2 | Must state the prop's material and craft |
| R3 | The prop's form must fit the modern urban world |
| R4 | Must contain the 3D anime render keywords (cel-shaded, 3D animation render, anime style) |
| R5 | Must contain the 8K ultra HD and cinematic composition keywords |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Complex scene backgrounds |
| X2 | The prop and a person in the same frame (this stage is a prop-only image) |
| X3 | Any human figure appearing, including full body, half body or a part (hand, finger, arm or other limb) |
| X4 | The prop being held, gripped, worn or in use |
| X5 | Elements implying a person's presence (grip marks, a wearer's viewpoint, a posture of use) |
| X6 | Using photographic realism terms (such as real photography, photorealistic, RAW photo, etc.) |
| X7 | Over-realistic material grain that breaks the consistency of the cel-shaded style |
| X8 | Ancient/futuristic elements, anything outside the modern urban style |