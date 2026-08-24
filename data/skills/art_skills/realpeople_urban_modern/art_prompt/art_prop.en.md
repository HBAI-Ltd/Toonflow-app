# Prop Image Generation · Urban Realism Constraint Manual

---

## 1. Prop design principles

1. **Readable function** — the prop's purpose is obvious at a glance; form serves function
2. **Extreme texture** — material texture must be clearly identifiable (metal/glass/plastic/leather/fabric)
3. **Consistent period** — every prop must fit the modern urban world; ancient elements are forbidden
4. **Clear scale** — imply the prop's real size through a reference object or a marking
5. **Prop only, shown on its own** — only the prop itself may appear in frame; any person, hand or limb is strictly forbidden, the prop must not be held/worn/gripped, and must be presented on its own as a still-life display

---

## 2. Prop categories and aesthetic constraints

### 2.1 Electronics

| Item | Constraint | Prompt |
|---|---|---|
| Type | Phone/laptop/tablet/headphones | {electronics type}, modern electronics |
| Material | Metal/glass/plastic + brand mark | metal texture, glass panel |
| Ornament | Ports/screen/button details clear | clear ports, screen reflection |
| Sheen | Modern industrial sheen, metal reflection | modern sheen, metal texture |
| Prompt | modern {electronic device}, {material}, industrial design, clear detail | — |

### 2.2 Personal accessories

| Item | Constraint | Prompt |
|---|---|---|
| Type | Watch/glasses/jewellery/belt | {accessory type}, modern accessory |
| Material | Metal/leather/glass/rubber | metal texture, leather grain |
| Craft | Modern craft, brand mark clear | modern craft, refined brand |
| Sheen | Metal sheen/glass reflection/leather sheen | metal sheen, glass reflection |
| Prompt | modern {accessory}, {material}, modern craft, clear detail | — |

### 2.3 Household goods

| Item | Constraint | Prompt |
|---|---|---|
| Type | Water glass/coffee cup/lamp/storage | {object type}, modern living |
| Material | Glass/metal/plastic/ceramic | translucent glass, metal texture |
| Texture | Modern design, clear surface craft | surface craft, design detail |
| Style | Modern minimalist/Nordic/industrial | modern minimalist, Nordic style |
| Prompt | modern {object}, {material} texture, design detail | — |

### 2.4 Office stationery

| Item | Constraint | Prompt |
|---|---|---|
| Type | Pen/notebook/folder/bookmark | {stationery type}, office stationery |
| Material | Metal/plastic/leather/paper | metal texture, leather grain |
| Texture | Brand mark/text clearly legible | clear text, brand mark |
| Condition | Traces of use may be added as the plot requires | traces of use / brand new |
| Prompt | modern {stationery}, {material}, {condition}, clear brand mark | — |

---

## 3. Multi-angle sheet specification

### View definitions

| Position | View | Angle | Requirement | Prompt |
|---|---|---|---|---|
| Top left | Front view | Front 0° | The prop's complete front form | front view |
| Top right | Side view | Side 90° | Thickness/silhouette/structure clear | side view |
| Bottom left | Back view | Rear 180° | The prop's back structure/ornament | back view |
| Bottom right | Detail close-up | Local enlargement | Material texture/craft detail | detail closeup |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | A four-panel grid (2×2) in one frame, four angles in the four quadrants |
| Background | Clean neutral gray #E8E8E8 |
| Light | Even soft light, no hard shadows |
| Proportion | In each cell the prop fills 70%+ of the cell |
| Cast shadow | A slight natural cast shadow on the ground is allowed |
| Aspect ratio | 1:1 recommended |

---

## 4. Material rendering constraints

| Material | Rendering requirement | Prompt |
|---|---|---|
| Metal | Reflection/highlight/cool sheen, scratches faintly visible | metal texture, cool sheen, clear reflection |
| Glass | Light transmission/reflection/refraction clear | translucent glass, clear reflection |
| Plastic | Delicate texture, even surface | plastic texture, delicate surface |
| Leather | Clear grain, natural sheen | leather grain, delicate texture |
| Ceramic | Glazed sheen, even color | glazed sheen, warm porcelain quality |
| Fabric | Fibre texture, natural edges | fabric weave, natural texture |
| Wood | Clear wood grain, smooth surface | clear wood grain, warm texture |

---

## 5. Prompt template

```
modern urban prop sheet，realistic photography style，urban realist documentary feel，strong contrast，extreme detail，
{prop type}，{material description}，{craft/ornament description}，{condition description}，
prop-only still-life display，the prop displayed on its own，held by no one，worn by no one，
a four-panel grid (2×2) in one frame: top left front view + top right side view + bottom left back view + bottom right detail close-up，
clean neutral gray background，even soft light，no hard shadow，
ultra-crisp material texture，realistic texture，{material sheen description}
no text of any kind in the image，
no person, hand, finger or limb may appear in frame; the prop must not be gripped or worn
```

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must specify "clean neutral gray background" |
| R2 | Must state the prop's material and craft |
| R3 | The prop's form must fit the modern urban world |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Complex scene backgrounds |
| X2 | Prop and character in the same frame (this stage is a prop-only image) |
| X3 | Any human figure appearing, including full body, half body or a part (hand, fingers, arms or other limbs) |
| X4 | The prop being held, gripped, worn or in use |
| X5 | Elements that imply a person is present (e.g. traces of being held, a wearer's point of view, a posture of use) |
