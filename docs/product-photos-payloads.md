# Product Studio — Tool Payload Spec (for Backend)

This document defines the **request payload** the front-end will send for each quick-action
tool on the Product Studio page. One endpoint per tool (or a single endpoint with a `tool`
discriminator — backend's choice; see "Endpoint shape" at the bottom).

## Context / how it works today

- All image tools currently do: `UploadFile(file) -> { file_url }`, then a **single generic**
  `GenerateImage({ prompt, existing_image_urls: [file_url] })` call. The prompt is a long prose
  string built on the client, and most UI selections (quality tier, aspect ratio, model, pose,
  background, brand style) are **either embedded in prose or dropped entirely**.
- The spec below replaces that with **structured fields** so the backend controls the actual
  model params (resolution, aspect ratio, etc.) instead of guessing from prose.
- The intended flow per the product brief: user first gets a preview/3D view handled on the
  front-end (e.g. Ghost Mannequin 3D view, quality/size selection). If not satisfied, they type a
  refinement `prompt` and we call the endpoint to generate. So `prompt` is **optional/refinement**,
  never the only source of truth.

## Common conventions

**Auth:** existing app auth (Bearer token / session cookie) — unchanged.

**File upload:** unchanged. Front-end uploads the image first and sends back the resulting
`image_url`(s). The generate endpoints receive **URLs, not raw files**.

**Shared fields present on every image tool:**

| Field               | Type                              | Required | Notes                                                                                              |
| ------------------- | --------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `tool`              | `string` (enum, see below)        | yes      | Discriminator: `virtual_model` \| `staging` \| `mannequin` \| `beautifier` \| `flatlay` \| `video` |
| `image_urls`        | `string[]`                        | yes      | Uploaded product photo URL(s). Currently always length 1; video may accept up to 4 angles.         |
| `quality`           | `"standard" \| "high" \| "ultra"` | yes      | Maps to resolution: `standard`=1K, `high`=2K, `ultra`=4K.                                          |
| `size`              | `string` (enum, see below)        | yes      | Output aspect ratio.                                                                               |
| `apply_brand_style` | `boolean`                         | yes      | If true, backend applies the user's saved brand style/kit.                                         |
| `prompt`            | `string`                          | no       | Optional free-text refinement from the user. May be empty.                                         |

**`quality` → resolution map**

```
standard -> 1K
high     -> 2K
ultra    -> 4K
```

**`size` enum** (aspect ratio id → ratio)

```
original         (as uploaded)
portrait_9_16    9:16
portrait_3_4     3:4
portrait_2_3     2:3
square           1:1
landscape_3_2    3:2
landscape_4_3    4:3
landscape_16_9   16:9
```

> Video uses a reduced set: `square`, `portrait_9_16`, `landscape_16_9` only.

---

## 1. Virtual Model — `tool: "virtual_model"`

Puts the uploaded garment on an AI model, with a chosen model, pose, and background.

**Extra fields**

| Field                  | Type     | Required    | Notes                                                                        |
| ---------------------- | -------- | ----------- | ---------------------------------------------------------------------------- |
| `model_id`             | `string` | yes         | Preset model id (see enum). Custom uploads → `"custom"` + `model_image_url`. |
| `pose_id`              | `string` | yes         | Preset pose id (see enum). `"random"` lets backend pick.                     |
| `background_id`        | `string` | yes         | Preset background id. `"custom"` → send `background_image_url`.              |
| `model_image_url`      | `string` | conditional | Required only when `model_id === "custom"`.                                  |
| `background_image_url` | `string` | conditional | Required only when `background_id === "custom"`.                             |

`model_id` enum: `avery, sam, taylor, kendall, jordan, casey, alex, maya, reece, lara, julia, custom`
(front-end also sends a human `model_description` string per model, e.g. _"Man, beige outfit"_ — optional, for logging/prompt help.)

`pose_id` enum: `random, standing, 3_4_turn, power_stance, walking, hand_pocket, crossed_arms, back, over_shoulder, seated, adjusting, playful`

`background_id` enum: `custom, random, street, bedroom, sunset, factory, studio, colored_studio, concrete_studio, beach, tropical, library, forest, business, countryside, flowers, golden_light, mountain, pool, latin_city, cafe, asian_city, night_lights, desert`

**Example payload**

```json
{
  "tool": "virtual_model",
  "image_urls": ["https://cdn.example.com/uploads/garment123.png"],
  "model_id": "jordan",
  "model_description": "Man, beige outfit",
  "pose_id": "3_4_turn",
  "background_id": "concrete_studio",
  "quality": "standard",
  "size": "portrait_2_3",
  "apply_brand_style": true,
  "prompt": ""
}
```

---

## 2. Product Staging — `tool: "staging"`

Places the product into a realistic lifestyle scene. Only the shared fields.

**Example payload**

```json
{
  "tool": "staging",
  "image_urls": ["https://cdn.example.com/uploads/bottle123.png"],
  "quality": "high",
  "size": "square",
  "apply_brand_style": false,
  "prompt": "on a wooden kitchen counter, morning light"
}
```

---

## 3. Ghost Mannequin — `tool: "mannequin"`

Displays a garment on an invisible 3D mannequin. Per the brief, the **3D preview/quality/size is
handled on the front-end first**; this endpoint is called only when the user wants an AI-generated
result (optionally with a refinement `prompt`). Only the shared fields.

**Example payload**

```json
{
  "tool": "mannequin",
  "image_urls": ["https://cdn.example.com/uploads/shirt123.png"],
  "quality": "ultra",
  "size": "portrait_3_4",
  "apply_brand_style": false,
  "prompt": "clean white studio background, front view"
}
```

---

## 4. Product Beautifier — `tool: "beautifier"`

Enhances lighting/focus/background of the product. Only the shared fields.

**Example payload**

```json
{
  "tool": "beautifier",
  "image_urls": ["https://cdn.example.com/uploads/watch123.png"],
  "quality": "high",
  "size": "original",
  "apply_brand_style": true,
  "prompt": ""
}
```

---

## 5. Flat Lay — `tool: "flatlay"`

Lays the product flat, top-down, on a clean surface. Only the shared fields.

**Example payload**

```json
{
  "tool": "flatlay",
  "image_urls": ["https://cdn.example.com/uploads/skincare123.png"],
  "quality": "standard",
  "size": "square",
  "apply_brand_style": false,
  "prompt": "neutral beige surface, minimal props"
}
```

---

## 6. Video Generator — `tool: "video"`

Generates a short product video. **Not implemented on the front-end yet** (currently stubbed).
Differs from the image tools: no `quality` tier, supports a `template_id`, up to 4 input images,
and a reduced `size` set. Async by nature — see response note.

**Fields**

| Field         | Type       | Required | Notes                                                                         |
| ------------- | ---------- | -------- | ----------------------------------------------------------------------------- |
| `tool`        | `"video"`  | yes      |                                                                               |
| `image_urls`  | `string[]` | yes      | 1–4 Product Studio (different angles improve fidelity).                       |
| `template_id` | `string`   | yes      | `"none"` for no template, otherwise a template id (e.g. `"Dresses-6780091"`). |
| `size`        | enum       | yes      | `square` \| `portrait_9_16` \| `landscape_16_9` only.                         |
| `prompt`      | `string`   | no       | Optional description of the desired motion/video.                             |

**Example payload**

```json
{
  "tool": "video",
  "image_urls": [
    "https://cdn.example.com/uploads/dress_front.png",
    "https://cdn.example.com/uploads/dress_back.png"
  ],
  "template_id": "Dresses-6780091",
  "size": "portrait_9_16",
  "prompt": "slow 360 rotation, soft studio lighting"
}
```

---

## Endpoint shape (backend's call)

Two equally fine options — pick one and tell the front-end:

**A. One endpoint, `tool` discriminator (recommended — matches these payloads 1:1)**

```
POST /api/product-studio/generate      -> images (tools 1–5)
POST /api/product-studio/generate-video -> video (tool 6, async)
```

**B. One endpoint per tool**

```
POST /api/product-studio/virtual-model
POST /api/product-studio/staging
POST /api/product-studio/mannequin
POST /api/product-studio/beautifier
POST /api/product-studio/flatlay
POST /api/product-studio/video
```

## Expected responses

**Image tools (1–5)** — synchronous is fine:

```json
{
  "url": "https://cdn.example.com/results/abc.png",
  "id": "gen_abc",
  "credits_used": 2
}
```

(Front-end currently reads `result.url`.)

**Video (6)** — likely async; return a job id to poll or a webhook/SSE:

```json
{ "job_id": "vid_abc", "status": "processing" }
```

## Errors

Keep the current convention the front-end already handles:

- **402 / "limit" / "credits"** in the message → front-end shows the "credits limit reached" toast.
- Any other error → generic "generation failed" toast.

Return a clear `message` field on errors for debugging.

Text to Image
{
"type": "text_to_image",
"style": "cinematic",
"ratio": "1:1",
"prompt" ""
}

Text to Video
{
"type": "text_to_video",
"style": "cinematic",
"ratio": "1:1",
"duration": "",
"prompt": ""
}

Image Variations
{
"type": "image_variation",
"style": "sketch",
"source_image": "",
}

Script to Voiceover
{
"type": "script_to_voiceover",
"style": "deep_male",
"narration_tone": "",
"speaking_pace": "",
"ratio": "",
"export_format": ""
"prompt": ""
}

Audio to Text
{
"type": "audio_to_text",
"audio_file": "",
"language": "",
"transcript_format": "",
"transcript_quality": "",
}

Text to Audio
{
"type": "text_to_audio",
"style": "cinematic",
"speaking_tone": "",
"speaking_speed": "",
"export_format": "",
"audio_quality": ""
"prompt": ""
}

Persona Generator
{
"type": "persona_generator",
"name": "",
"age": "",
"occupation": "",
"communication_tone": "",
"content_type": ""
"ratio": ""
}

Increase number,
