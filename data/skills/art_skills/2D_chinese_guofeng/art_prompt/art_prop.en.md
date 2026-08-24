---
name: art_prop
description: Prop image generation · constraint manual
metaData: art_skills
---

# Prop Image Generation · Constraint Manual

---

## 1. Prop design principles

1. **Function is readable** — the prop's use is obvious at a glance; the form serves the function
2. **Texture taken to the limit** — the material's weave must be clearly identifiable (metal/jade/wood/cloth/paper/porcelain)
3. **Period consistency** — every prop must fit the ancient-style world; modern elements are forbidden
4. **Clear scale** — imply the prop's real size through a reference object or a marking
5. **Prop alone, shown independently** — only the prop itself may appear in frame. Any person, hand or limb is strictly forbidden; the prop must not be held/worn/gripped, and must be presented independently as a still-life display

---

## 2. Prop categories and aesthetic constraints

### 2.1 Weapons

| Item | Constraint | Prompt |
|---|---|---|
| Type | Sword/saber/bow/spear/fan | {weapon type}，ancient-style weapon |
| Material | Fine steel/dark iron + gemstone inlay + silk sword tassel | forged fine steel、gemstone inlay |
| Ornament | Carved scabbard/hilt, tassels, hidden patterning | refined carving、hanging tassels |
| Sheen | Cold metallic sheen, light off the blade edge | cold sheen、metallic texture |
| Style | Guofeng anime | new Guochao style、anime rendering |

### 2.2 Jewellery

| Item | Constraint | Prompt |
|---|---|---|
| Type | Hairpin/hair stick/yingluo beaded collar/jade pendant/bracelet/earring | {jewellery type}，ancient-style jewellery |
| Material | Gold/silver/jade/pearl/gemstone | woven gold filigree、translucent jade |
| Craft | Extremely fine, filigree/cloisonné/inlay | fine craft、meticulously carved |
| Sheen | Pearlescent/jade-mellow/metallic sheen | pearlescent glow、metallic sheen |
| Style | Guofeng anime | refined and ornate、new Guochao |

### 2.3 Everyday objects

| Item | Constraint | Prompt |
|---|---|---|
| Type | Tea set/wine set/incense burner/go board/scroll/lantern | {object type}，ancient-style object |
| Material | Porcelain/bronze/bamboo/wood/paper | mellow celadon、plain red copper |
| Texture | Clear glaze/wood grain/bamboo joints | glaze sheen、clear wood grain |
| Style | New Chinese style | plain and simple / opulent and refined |
| Rendering | Cel-shaded flat coloring | anime texture、delicate brushwork |

### 2.4 Tokens/key props

| Item | Constraint | Prompt |
|---|---|---|
| Type | Token of trust/tally/scroll/medicine bottle/jade seal | {prop type}，ancient-style prop |
| Distinctiveness | Must be recognisable and carry narrative symbolism | distinctive form、deep symbolic meaning |
| Aged feel | Age can be added as the plot needs | old and mottled / brand new and refined |
| Style | Guofeng anime | new Guochao style、anime feel |

### 2.5 The Four Treasures of the Study (new)

| Item | Constraint | Prompt |
|---|---|---|
| Type | Brush/ink/paper/inkstone | {study-treasure type}，four treasures of the study |
| Material | Bamboo/wood/jade/ceramic | bamboo brush shaft、porcelain inkstone |
| Texture | Clear wood grain/glaze/brush hairs | delicate brush hairs、mellow inkstone |
| Style | Scholarly refinement | ancient-style refined charm、delicate brushwork |

### 2.6 Festival props (new)

| Item | Constraint | Prompt |
|---|---|---|
| Type | Lantern/fireworks/spring couplets/fortune character (fu) | {festival type}，festival prop |
| Material | Paper/cloth/bamboo/silk satin | silk lantern、paper spring couplets |
| Texture | Clear paper grain/fabric weave | clear weave、delicate texture |
| Style | Festive and lively | bright colors、lively atmosphere |

---

## 3. Multi-angle sheet specification

### View definitions

| Position | View | Angle | Requirement | Prompt |
|---|---|---|---|---|
| Top left | Front view | Front 0° | The prop's complete front form | front view |
| Top right | Side view | Side 90° | Thickness/silhouette/structure clear | side view |
| Bottom left | Back view | Back 180° | The prop's rear structure/ornament | back view |
| Bottom right | Detail close-up | Local magnification | Material weave/craft detail | detail closeup |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | A four-panel grid (2×2) in one frame, four angles top, bottom, left and right |
| Background | Solid moon white #E8EAF5 |
| Light | Even soft light, no hard shadow |
| Proportion | In each panel the prop fills 70%+ of that panel |
| Cast shadow | A slight natural shadow on the ground is allowed |
| Aspect ratio | 1:1 recommended |

---

## 4. Material rendering constraints

| Material | Rendering requirement | Prompt |
|---|---|---|
| Metal | Reflection/highlight/cold sheen, scratches faintly visible | metallic texture、cold sheen、clear reflection |
| Jade | Inner glow, mellow, slightly translucent | translucent jade、mellow as fat jade |
| Wood | Clear wood grain, growth rings visible | clear wood grain、mellow texture |
| Porcelain | Glaze sheen, even coloring | glaze sheen、mellow porcelain |
| Cloth/paper | Fibre texture, natural edges | fabric weave、plain paper feel |
| Gemstone | Refraction/inner light, clear facets | brilliant gemstone、refracted light |
| Cel-shaded texture | Even flat coloring, clear lines | cel-shaded flat coloring、delicate brushwork |

---

## 5. Prompt template

Guofeng anime prop sheet，
Guofeng anime，new Guochao aesthetic，Japanese anime rendering，cel-shaded flat coloring，delicate brushwork，cinematic texture，
{prop type}，{material description}，{craft/ornament description}，{state description}，
prop-only still-life display，the prop displayed independently，held by no one，worn by no one，
a four-panel grid (2×2) in one frame：top left front view + top right side view + bottom left back view + bottom right detail close-up，
solid moon white background，even soft light，no hard shadow，
ultra clear material weave，delicate texture，{material sheen description}
Guofeng anime high-definition rendering，high detail，delicate lines，cel-shaded flat feel，
no subtitles、no watermark、no title overlay in the frame，
no person, hand, finger or limb may appear in the frame, and the prop must not be gripped or worn

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must specify "solid moon white background" |
| R2 | Must state the prop's material and craft clearly |
| R3 | The prop's form must fit the ancient-style world |
| R4 | Must use a "four-panel grid" layout: front + side + back + close-up |
| R5 | Must contain the keywords "Guofeng anime + cel-shaded flat coloring" |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Complex scene backgrounds |
| X2 | Prop and character in the same frame (this stage produces a prop-only image) |
| X3 | Any human figure appearing, including full body, half body or part (hand, fingers, arm and other limbs) |
| X4 | The prop being held, gripped, worn or in use |
| X5 | Elements implying a person's presence (traces of being held, a wearer's viewpoint, a using posture) |
| X6 | Modern elements appearing in an ancient-style prop |
