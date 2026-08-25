# Video Prompt · Visual Style Constraints

When generating video prompts, the following visual style tags must be injected:

| Mode | Style tags |
|------|-----------|
| **Universal multi-reference mode (EN)** | `medieval epic drama, live-action photorealistic, cinematic, natural and firelight illumination, desaturated color grade, ultra-fine detail` |
| **Universal first/last-frame mode (EN)** | `medieval epic drama, live-action photorealistic, cinematic, natural and firelight illumination, desaturated color grade, ultra-fine detail, shallow depth of field` |
| **Seedance 2.0 (ZH)** | `中世纪史诗实拍风格，电影感，自然光与火光照明，低饱和度调色，极致细节` |

## Voice and dialogue tags (inject whenever a shot carries dialogue or VO)

`British English dialogue — Received Pronunciation for nobility and guild officers; regional UK accents (Northern English, Scottish, West Country) for soldiers and commoners; low, measured delivery`

## Content-safety vocabulary (mandatory in all video prompts)

Video models reject prompts describing graphic harm. Always phrase action without graphic consequence:

| Never write | Write instead |
|---|---|
| blood, bleeding, gore, wound | battle-worn, aftermath, weathered |
| stab, slash, kill, execute | blades clash, strike toward off-screen, sparks on impact |
| brutal, graphic, realistic gore | grim, intense, unflinching |
| corpse, dead body, severed | fallen banner, riderless horse, empty helm, crows lifting |

Deaths are conveyed by the witness's face, a hand releasing a sword, or silence — never by explicit injury.
