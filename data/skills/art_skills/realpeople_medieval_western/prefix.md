# Global Aesthetic Foundation · Live-Action Medieval Epic

---
All style constraints and global rules below must be followed strictly and completely, and prompts must be generated strictly in the prompt template format; output only the prompt body — no explanations, notes, headings, or any extra text.

## 1. Style genes

| Dimension | Definition |
|---|---|
| **Primary style** | Live-Action Medieval Epic — a contemporary-camera photorealistic visual system set in a secular medieval Western European world |
| **Secondary style** | HBO-grade period drama cinematography · theatrical live-action image quality |
| **Visual bloodline** | The mud and candlelight of Game of Thrones, the shield-wall grit of The Last Kingdom, the exhausted realism of The King (2019), the practical-creature realism of The Witcher |
| **Emotional keynote** | Grim but not hopeless; restrained but not cold; an ember of warmth inside a cold world — loyalty, loss, and quiet dignity over spectacle |
| **Texture anchors** | Visible skin pores and wind-chapped cheeks, wool fibers and fur nap, hammered iron with rust at the rivets, mud-caked boots, breath fog in cold air, tallow-candle flicker on stone |

---

## 2. Global color palette (style baseline, not a hard lock)

> Goal: unify the aesthetic without strangling creation. Apart from the hard-constraint items, the palette below is the default preference and may shift within reason.

### Constraint tiers

| Tier | Strength | Notes |
|---|---|---|
| L1 hard | High | Grade direction only: desaturation 30–50%, cold base, warmth exclusively from fire sources; light must always have a motivated source |
| L2 soft | Medium | Scene, costume, and accent colors prefer the palette; may drift per shot and story needs |
| L3 exception | Low | Feasts, memories, and creature-moonlight moments may temporarily break local color, but must keep the overall cold/warm logic |

| No. | Name | Hex | Usage |
|---|---|---|---|
| C1 | Stone grey | #6E6A63 | Castle walls, dulled armor, overcast light |
| C2 | Cold steel | #4A5A68 | Blades, mail, night scenes, winter sky |
| C3 | Candle amber | #C08A3E | Candle, torch, hearth — the only warm source |
| C4 | Deep crimson | #6B1F1F | Banners, wine, sunset — never described as blood |
| C5 | Forest moss | #3E4A38 | Old forest, hunters' cloaks, moss on stone |
| C6 | Bone snow | #D9D4C9 | Snow, fog, linen, pale daylight |
| C7 | Worn leather | #5C4632 | Saddles, jerkins, belts, tavern wood |
| C8 | Ink night | #1C1B18 | Deep shadow, caves, moonless night |

### Skin and hair (deliberately unlocked)

> No fixed skin or hair hex. Character skin tone, hair color, and features are driven entirely by the character description to support a diverse cast. The constraint is textural, not chromatic: weathered, real, pore-visible, never plastic.

### Emotion palette (director alignment)

| Emotional segment | Dominant | Support | Light & contrast | Keywords |
|---|---|---|---|---|
| Betrayal / judgment | C2 cold steel | C8 ink night | Backlit, half the face in shadow, hard contrast | cold, ceremonial, irreversible |
| Pursuit / exile | C1 stone grey | C6 bone snow | Overcast flat light, fog swallowing the distance | hunted, weary, exposed |
| Bond / campfire | C3 candle amber | C7 worn leather | Single fire source, warm light on faces, black beyond | intimate, fragile warmth |
| Creature moonlight | C6 bone snow | C5 forest moss | Silver rim light, cool night, soft rim highlight | otherworldly, tender, still |
| Vindication / the kneeling | C6 bone snow | C3 candle amber | Low dawn light through dust, long shadows | earned, solemn, release |
| Quiet ending | C1 stone grey | C6 bone snow | Diffuse daylight, no warm source | desolate, at peace |

---

## 3. Camera grammar (this style speaks through the camera, not a render engine)

### 3.1 Format

| Parameter | Baseline | Aesthetic intent |
|---|---|---|
| Aspect | 2.0:1 or 16:9 | Epic horizontal space; the smallness of one figure against land and hall |
| Image format | 35mm film grain / large-format digital cinema | Shallow-focus capability, natural vignette falloff, fine irregular grain |
| Color science | ARRI Alexa 65-class cinema color | Natural skin under firelight, soft highlight rolloff, shadow detail preserved |

### 3.2 Lens character

| Focal range | Narrative character | Typical use |
|---|---|---|
| 24–28mm wide | The land swallows the figure; scale of walls and moors | Establishing shots, lone rider, army on the horizon |
| 35mm | Immersive, documentary presence | Following through camps, halls, forests |
| 50mm | Objective human gaze | Confrontations, council scenes, portraits |
| 85mm | Compressed intimacy, background melts | Close-ups by firelight, the bond's quiet moments |
| 135mm+ | Watcher's distance, isolation | The hunted seen from afar, sentries, longing across a courtyard |

### 3.3 Light sources (must be motivated)

Window daylight / overcast sky / candle / torch / hearth / moon. Every shot must answer: where does this light come from? Direction, color temperature, and softness must be self-consistent. Firelight flickers; moonlight is still.

---

## 4. Global rules

### 4.1 Photographic reality constraints (P — mandatory)

| No. | Rule |
|---|---|
| P1 | Anchor every image as "live-action photography / period-drama film still" — it must read as caught by a camera, never computed |
| P2 | Declare one concrete light logic per scene (window / fire / sky / moon), with self-consistent direction, temperature, and softness |
| P3 | Preserve real skin: pores, fine lines, wind-chapped texture, healed scars, dirt — never plastic smoothing or an AI mask |
| P4 | Hair must be natural: wind-tangled, rain-damp, braids fraying — never modeled helmet-hair |
| P5 | Costume must show being worn and traveled in: mud at hems, frayed cuffs, rust at armor joints, fur matted by rain — never showroom-new |
| P6 | Spaces must show use: scarred tabletops, smoke-darkened beams, straw on stone floors, wax drippings — never a clean set |
| P7 | Bodies must be natural: weight on one hip, tired shoulders, hands that have worked — never mannequin symmetry |
| P8 | Specify a concrete secular medieval Western European space — no generic fantasyland, no religious buildings, and grounding details (heraldry, guild boards, timber-framing) must read as medieval European |

### 4.2 Content-safety constraints (S — mandatory, protects generation from filter rejection)

> Character and asset images are reused as generation references for every later shot. One asset with fresh blood can poison every video generation that references it. Safety is therefore a hard asset-level rule, not a style preference.

| No. | Rule |
|---|---|
| S1 | Asset images (characters, props, scenes) carry zero fresh blood, open wounds, or gore — hardship reads through healed scars, dirt, fatigue, and worn gear |
| S2 | Weapons are always clean: oiled steel, notched edges, worn grips — never bloodstained |
| S3 | Violence in motion prompts is action-without-consequence: "blades clash, sparks on impact, cinematic slow motion", strikes directed off-screen — never impact wounds |
| S4 | Death happens off-frame: the witness's face, a hand releasing a sword, crows lifting from a field — never bodies in explicit detail |
| S5 | Battle aftermath speaks in metaphor: torn banners, broken shields, a riderless horse, smoke, grey snow — no corpses, no blood pools |
| S6 | Banned vocabulary in any prompt: blood, bleeding, gore, wound, stab, slash, execute, brutal, graphic, severed, corpse, dead body, kill, torture. Substitute: battle-worn, aftermath, clash, strike toward off-screen, grim, fallen banner, empty helm |

### 4.3 Photographic quality constraints (Q — mandatory)

| No. | Rule |
|---|---|
| Q1 | Declare one camera presence per shot: still witness / handheld breath / gliding movement / long-lens watch |
| Q2 | Depth of field must carry intent — shallow for intimacy, deep for scale, focus shifts to steer the eye |
| Q3 | Highlights never clip to dead white, shadows never crush to empty black — firelight rolloff and shadow detail are the soul of the look |
| Q4 | Declare grain character: 35mm film grain (fine, irregular) as default |
| Q5 | Color tone must match the emotional segment — warmth never spills, cold never turns lifeless grey, crimson stays fabric and wine |

### 4.4 Strictly forbidden (X — highest priority, cannot be overridden)

| No. | Forbidden |
|---|---|
| X1 | All CG terminology: 3D render / CGI / UE / Blender / PBR / volumetric pass / ambient occlusion — this style speaks with light and camera |
| X2 | All non-photographic media: 2D, illustration, anime, comic, painterly |
| X3 | All modern elements: modern clothing, eyewear, technology, dental-white smiles, styled modern hair |
| X4 | East Asian architecture, hanfu or other East Asian costume, guofeng aesthetics |
| X5 | Churches, cathedrals, temples, monks, priests, crosses, prayer, or any religious symbol, ritual, or institution |
| X6 | High-fantasy gloss: neon, fluorescent, glowing runes, rainbow magic, polished gold armor, pristine white cloaks |
| X7 | Gore vocabulary and imagery (see S6) — including on reference assets |
| X8 | Plastic skin, beauty-filter faces, waxwork symmetry, AI-mask uncanny |
| X9 | Anatomical errors: fused fingers, broken joints, extra limbs, uncanny faces |
| X10 | Low resolution, blur, noise explosion, heavy artifacts, cut-out edges |
| X11 | Sexualized, revealing, or exploitative content |
| X12 | Watermarks, text, signatures, logos, borders, UI elements |

### 4.5 Style-drift signals

> If a generated image shows any of the following, it has drifted off style:

| Drift signal | Correction |
|---|---|
| Skin looks like silicone | Over-smoothed — drop "flawless/perfect skin" words, restore pores and chapped texture |
| Light with no source | Bright but unmotivated — name the source (window/fire/moon), refuse uniform brightness |
| Armor looks factory-new | Add rust at joints, dents, strap wear, dulled edges |
| World looks religious | A chapel, robe, or cross slipped in — replace with guild hall, lord's court, secular banners |
| World looks high-fantasy | Glow, neon, or pristine gold appeared — return to iron, wool, mud, and firelight |
| Scene looks like a set | Too clean — add straw, smoke stain, wax drip, worn thresholds |
| Frame contains gore | Fresh blood or wounds appeared — regenerate with S-rule substitutions; the asset must stay reference-safe |
