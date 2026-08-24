# Anime Prop Image Generation · Constraint Manual

---

## 1. Prop design principles

1. **Readable function** — the prop's use is obvious at a glance; the form serves the function
2. **Texture above all** — material texture must be clearly distinguishable (metal/plastic/wood/glass/fabric)
3. **Unified style** — every prop must fit the modern urban romance world; no jarring elements
4. **Explicit scale** — imply the prop's real size through a reference object or a marking
5. **Prop shown alone** — only the prop itself may appear in frame; any person, hand or limb is strictly forbidden, the prop may not be held/worn/gripped, and it must be presented on its own as a still-life display

---

## 2. Prop categories and aesthetic constraints

### 2.1 Office supplies

| Item | Constraint | Prompt |
|---|---|---|
| Type | Pen/notebook/folder/glasses | office {type}, modern office supplies |
| Material | Metal/plastic/leather/paper | metal pen clip, leather notebook |
| Decoration | Simple design, brand mark (optional) | simple design, refined brand mark |
| Sheen | Matte/faint sheen/metallic reflection | matte texture, metallic reflection |
| Prompt | modern {prop}, simple design, clear texture | — |

### 2.2 Drinkware

| Item | Constraint | Prompt |
|---|---|---|
| Type | Coffee cup/glass/thermos | coffee cup, glass, thermos |
| Material | Glass/ceramic/metal/plastic | clear glass, ceramic coffee cup |
| Decoration | Brand mark/pattern (optional) | simple brand mark, no pattern |
| Sheen | Glass reflection, ceramic glaze, metallic sheen | clear glass reflection, warm ceramic |
| Prompt | modern {prop}, clear material, cel-shaded feel | — |

### 2.3 Personal items

| Item | Constraint | Prompt |
|---|---|---|
| Type | Phone/watch/glasses/keys | modern {prop}, personal item |
| Material | Metal/glass/plastic/leather | glass screen, metal frame |
| Decoration | Simple design, brand mark (optional) | simple design, refined mark |
| Sheen | Glass reflection, metallic sheen | clear glass reflection, metallic texture |
| Prompt | modern {prop}, clear material, refined detail | — |

### 2.4 Household objects

| Item | Constraint | Prompt |
|---|---|---|
| Type | Books/decorative painting/scent diffuser/desk lamp | modern {prop}, household object |
| Material | Wood/glass/metal/fabric | wooden book cover, glass lampshade |
| Texture quality | Clear material grain, natural edges | clear wood grain, translucent glass |
| Style | Simple and modern/warm and homey | simple and modern, warm and homey |
| Prompt | modern {prop}, clear material, atmosphere in harmony | — |

---

## 3. Multi-angle character sheet specification

### View definitions

| Position | View | Angle | Requirement | Prompt |
|---|---|---|---|---|
| Top left | Front view | Front 0° | The prop's complete front form | front view |
| Top right | Side view | Side 90° | Thickness/silhouette/structure clear | side view |
| Bottom left | Back view | Back 180° | The prop's rear structure/decoration | back view |
| Bottom right | Detail close-up | Local magnification | Material texture/craft detail | detail closeup |

### Frame specification

| Item | Constraint |
|---|---|
| Layout | A 2×2 four-panel grid in one frame, four angles top, bottom, left and right |
| Background | Clean neutral gray `#E8E8E8` |
| Light | Even soft light, no hard shadows |
| Proportion | The prop fills 70%+ of each panel |
| Cast shadow | A slight natural ground shadow is allowed |
| Aspect ratio | 1:1 recommended |

---

## 4. Material rendering constraints

| Material | Rendering requirement | Prompt |
|---|---|---|
| Metal | Reflection/highlight/sheen, scratches faintly visible | metallic texture, clear reflection, scratches faintly visible |
| Glass | Translucent, reflective, refraction effect | translucent glass, clear reflection, natural refraction |
| Wood | Clear wood grain, growth rings visible | clear wood grain, natural texture |
| Ceramic | Glazed sheen, even color | smooth glaze, even color |
| Plastic | Matte/faint sheen, clear edges | plastic texture, clear edges |
| Fabric | Fibre texture, natural edges | fabric texture, natural fibres |
| Leather | Clear grain, soft sheen | leather grain, natural sheen |

---

## 5. Prompt template

anime prop design sheet，
anime style，cel shading，modern urban style，
cinematic composition，ultra detailed，8K，high quality，
shallow depth of field，image grain，lens vignette，
cel-shaded animation style，modern urban style，dramatic low-key lighting，
prop design sheet，item concept art，no people，no characters，no human figures，
{prop type}，{material description}，{craft/decoration description}，{state description}，
prop-only still-life display，the prop displayed on its own，held by no one，worn by no one，
a 2×2 four-panel grid in one frame: top-left front view + top-right side view + bottom-left back view + bottom-right detail close-up，
clean neutral gray background，even soft light，no hard shadows，
ultra-crisp material texture，cel-shaded feel，{material sheen description}
no text of any kind in the image，
no person, hand, finger or limb may appear in the frame, and the prop may not be in a gripped or worn state

---

## 6. Constraint rules

### Mandatory

| No. | Rule |
|---|---|
| R1 | Must specify "clean neutral gray background" |
| R2 | Must state the prop's material and craft explicitly |
| R3 | The prop's form must fit the modern urban romance world |
| R4 | Must include the "anime style" keywords (anime style / cel shading) |
| R5 | Must include a depth-of-field characteristic (at least one of shallow depth of field / vignette), keeping the cel-shaded animation style |

### Forbidden

| No. | Forbidden |
|---|---|
| X1 | Complex scene backgrounds |
| X2 | The prop and a character in the same frame (this stage is a prop-only image) |
| X3 | Any human figure appearing, including full body, half body or a part (hand, fingers, arm and other limbs) |
| X4 | The prop being in a held, gripped, worn or in-use state |
| X5 | Elements implying a person is present (marks of being held, a wearer's viewpoint, a posture of use) |
| X6 | Using live-action realism/photography/3D-rendering words |
| X7 | Highly saturated fluorescent colors/neon colors |
| X8 | Guofeng/fantasy/sci-fi and other elements that clash with the modern urban romance world |
