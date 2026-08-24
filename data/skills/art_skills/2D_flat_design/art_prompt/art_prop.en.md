# Prop Image Generation · Flat Style Constraint Manual

---

## 1. Prop design principles

1. **Readable function** — the prop's purpose is obvious at a glance; the form serves the function
2. **Minimal color blocks** — material texture must be distinguished by color blocks; complex detail is forbidden
3. **Period consistency** — every prop must fit the ancient-style world; modern elements are forbidden
4. **Explicit scale** — imply the prop's real size through a reference object or a marking
5. **The prop is shown alone** — only the prop itself may appear in frame; any person, hand or limb is strictly forbidden, the prop must not be held/worn/gripped, and it must be presented on its own as a still-life display

---

## 2. Prop categories and aesthetic constraints

### 2.1 Weapons

| Item | Constraint | Prompt |
|---|---|---|
| Type | Sword/blade/bow/spear/fan | {weapon type}, flat ancient-style weapon |
| Material | Solid color blocks, line-drawn | flat sword, line-drawn weapon, solid color sword |
| Ornament | Line-drawn carving, color-block decoration | line-drawn decoration, flat carving |
| Sheen | No sheen, solid-color fill | no sheen, flat weapon, matte sword |
| Prompt | flat ancient-style {weapon}, solid-color weapon, line-drawn decoration | — |

### 2.2 Jewellery

| Item | Constraint | Prompt |
|---|---|---|
| Type | Hairpin/hair stick/beaded collar/jade pendant/bracelet/earring | {jewellery type}, flat ancient-style jewellery |
| Material | Solid color blocks, single-color fill | flat jewellery, color-block jewellery, solid color jewelry |
| Craft | Clean lines, minimalist craft | flat craft, line-drawn jewellery |
| Sheen | No sheen, no reflection | no sheen, flat jewellery, matte finish |
| Prompt | flat ancient-style {jewellery}, {material}, clean craft, line-drawn jewellery | — |

### 2.3 Everyday objects

| Item | Constraint | Prompt |
|---|---|---|
| Type | Tea set/wine set/incense burner/go board/scroll/lantern | {object type}, flat ancient-style object |
| Material | Solid color blocks, line-drawn | flat object, color-block object, solid color object |
| Texture | Distinguished by color blocks, no texture | flat texture feel, no texture, flat texture |
| Style | Plain or opulent, switched to suit the scene | flat and plain / flat and opulent |
| Prompt | flat ancient-style {object}, {material} color blocks, clear lines | — |

### 2.4 Tokens/key props

| Item | Constraint | Prompt |
|---|---|---|
| Type | Token of trust/tally/scroll/medicine bottle/jade seal | {prop type}, flat ancient-style prop |
| Distinctiveness | Flattened form, simple and recognisable | flat form, simple prop |
| State | A flat aged look may be added | flat aged object / flat new object |
| Prompt | flat ancient-style {prop}, {material} color blocks, flat state, simple form | — |

---

## 3. Multi-angle sheet specification

### View definitions

| Position | View | Angle | Requirement | Prompt |
|---|---|---|---|---|
| Top left | Front view | Front 0° | The prop's complete front form | front view |
| Top right | Side view | Side 90° | Thickness/silhouette/structure clear | side view |
| Bottom left | Back view | Rear 180° | The prop's back structure/ornament | back view |
| Bottom right | Detail close-up | Local enlargement | Line/color-block detail | detail closeup |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | A four-panel grid (2×2) in one frame, four angles in the four quadrants |
| Background | Clean neutral gray #E8E8E8 |
| Light | No light-and-shadow, purely flat-filled color blocks |
| Proportion | In each cell the prop fills 70%+ of the cell |
| Cast shadow | No cast shadow, purely flat |
| Aspect ratio | 1:1 recommended |

---

## 4. Material rendering constraints

| Material | Rendering requirement | Prompt |
|---|---|---|
| Metal | Solid-color fill, no reflection | flat metal, solid-color metal, solid metal |
| Jade | Solid-color fill, no translucency | flat jade, solid-color jade, solid jade |
| Wood | Solid-color fill, no wood grain | flat wood, solid-color wood, solid wood |
| Porcelain | Solid-color fill, no glaze | flat porcelain, solid-color porcelain, solid porcelain |
| Cloth/paper | Solid-color fill, no fibre | flat fabric, solid-color fabric, solid fabric |
| Gemstone | Solid-color fill, no refraction | flat gem, solid-color gem, solid gem |

---

## 5. Prompt template

```
flat ancient-style prop sheet，
2d flat design，vector art，flat illustration，
minimalist，clean lines，solid colors，
{prop type}，{material description}，{craft/ornament description}，{state description}，
prop-only still-life display，the prop displayed alone，held by no one，worn by no one，
a four-panel grid (2×2) in one frame: top left front view + top right side view + bottom left back view + bottom right detail close-up，
clean neutral gray background，no light-and-shadow，no gradient，
clear lines，distinct color blocks，{material sheen description}
no text of any kind in the image，
no person, hand, finger or limb may appear in frame, and the prop must not be in a gripped or worn state
```

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must specify "clean neutral gray background" |
| R2 | Must state the prop's material and craft (in flattened terms) |
| R3 | The prop's form must fit the ancient-style world |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Complex scene backgrounds |
| X2 | The prop and a person in the same frame (this stage is a prop-only image) |
| X3 | Any human figure appearing, including full body, half body or a part (hand, finger, arm or other limb) |
| X4 | The prop being held, gripped, worn or in use |
| X5 | Elements implying a person's presence (grip marks, a wearer's viewpoint, a posture of use) |
| X6 | Adding gradient/shadow/highlight/three-dimensionality effects |
| X7 | Material too complex, color blocks poorly distinguished |
| X8 | Modern elements, non-ancient-style design |
