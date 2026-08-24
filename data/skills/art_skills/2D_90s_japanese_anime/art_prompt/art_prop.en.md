# 1990s Retro Japanese Anime Style - Prop Image Generation · Constraint Manual

---

## 1. Prop design principles

1. **Function is readable** — the prop's purpose is obvious at a glance; the form serves the function
2. **Texture above all** — material texture must be clearly identifiable (metal/jade/wood/fabric/paper)
3. **Period style** — every prop fits the 1990s world, with a unified style
4. **Explicit scale** — imply the prop's real size through a reference object or a marking
5. **The prop alone, shown on its own** — only the prop itself may appear in the frame; any person, hand or limb is strictly forbidden; the prop must not be in a held/worn/gripped state and must be presented on its own as a still-life display

---

## 2. Prop categories and aesthetic constraints

### 2.1 Weapons

| Item | Constraint | Prompt |
|---|---|---|
| Type | Sword/blade/bow/spear/scythe | {weapon type}, 1990s weapon |
| Material | Metal + gemstone ornament + ribbon | metallic sheen, gemstone ornament |
| Ornament | Carved motifs, tassels, retro patterns | finely carved, retro pattern |
| Sheen | Metallic sheen, gemstone reflection | metallic sheen, brilliant gemstone |
| Prompt | 1990s {weapon}, metal-forged, gemstone ornament | — |

### 2.2 Jewellery

| Item | Constraint | Prompt |
|---|---|---|
| Type | Hair ornament/necklace/bracelet/ring | {jewellery type}, 1990s jewellery |
| Material | Metal/gemstone/ribbon/pearl | metallic sheen, translucent gemstone |
| Craft | Hand-drawn texture, retro style | fine craft, 1990s style |
| Sheen | Gemstone sheen/metallic sheen | brilliant gemstone, metallic sheen |
| Prompt | 1990s {jewellery}, {material}, fine craft | — |

### 2.3 Everyday objects

| Item | Constraint | Prompt |
|---|---|---|
| Type | Tea set/books/musical instrument/stationery | {object type}, 1990s object |
| Material | Metal/wood/paper/ceramic | clear material texture |
| Quality | Fluid linework, soft color | fluid linework, clear texture |
| Style | Simple/ornate, switched by scene | simple and refined / ornate and refined |
| Prompt | 1990s {object}, {material} texture, fluid linework | — |

### 2.4 Tokens/key props

| Item | Constraint | Prompt |
|---|---|---|
| Type | Token/tally/scroll/medicine bottle/magic prop | {prop type}, 1990s prop |
| Distinctiveness | Must be recognisable and carry narrative symbolism | unique form, symbolic meaning |
| State | Signs of use may be added as the plot requires | aged / brand new |
| Prompt | 1990s {prop}, {material}, {state}, unique form | — |

---

## 3. Multi-angle sheet specification

### View definitions

| Position | View | Angle | Requirement | Prompt |
|---|---|---|---|---|
| Top left | Front view | Front 0° | The prop's complete front form | front view |
| Top right | Side view | Side 90° | Thickness/silhouette/structure clear | side view |
| Bottom left | Back view | Back 180° | The prop's back structure/ornament | back view |
| Bottom right | Detail close-up | Local enlargement | Material texture/craft detail | detail closeup |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | A four-cell grid (2×2) in one frame, four angles top/bottom/left/right |
| Background | Warm-toned off-white #F8F4E8 |
| Light | Soft cinematic light, even soft light, no hard shadow |
| Proportion | In each cell the prop fills 70%+ of the cell |
| Cast shadow | A slight natural shadow on the ground is allowed |
| Aspect ratio | 1:1 recommended |

---

## 4. Material rendering constraints

| Material | Rendering requirement | Prompt |
|---|---|---|
| Metal | Clear sheen, distinct lines | metallic texture, clear sheen |
| Jade | Translucency, a warm smooth feel | translucent jade, warm and smooth |
| Wood | Clear grain, distinct lines | clear wood grain, natural texture |
| Ceramic | Smooth surface, even sheen | ceramic sheen, smooth surface |
| Fabric/paper | Fibre texture, clear edges | fabric texture, clear paper quality |
| Gemstone | Translucency, refraction | translucent gemstone, refraction |

---

## 5. Prompt template
```
1990s retro Japanese anime style prop sheet，hand-drawn flat coloring，soft warm tones，fine fluid linework，cinematic light and shadow，
{prop type}，{material description}，{craft/ornament description}，{state description}，
the prop alone as a still life，the prop displayed on its own，held by no one，worn by no one，
a four-cell grid (2×2) in one frame: top-left front view + top-right side view + bottom-left back view + bottom-right detail close-up，
warm-toned off-white background，soft cinematic light，even soft light，no hard shadow，
ultra-clear material texture，hand-drawn texture，{material sheen description}
no text of any kind in the image，
no person, hand, finger or limb may appear in the frame, and the prop must not be in a gripped or worn state
```

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must specify "warm-toned off-white background #F8F4E8" |
| R2 | Must state the prop's material and craft explicitly |
| R3 | The prop's form must fit the 1990s world style |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Complex scene backgrounds |
| X2 | The prop and a person in the same frame |
| X3 | Any human figure appearing |
| X4 | The prop in a held, gripped, worn or in-use state |
| X5 | Any element implying the presence of a person |
