# Creative Klux — Frontend

This document gives an AI coding assistant the context it needs to be productive in this repo from the first message. Keep it current; if you make architectural changes or learn something non-obvious, update the relevant section.

## What this app is

Creative Klux is an AI-powered creative/marketing platform for creators, managers, and brands. The product offers brand management, AI design generation (ads, social, designer, magic studio), image editing, social/ad publishing, analytics, and integrations.

This repo is **frontend only**. The backend is a separate Laravel service.

## Tech stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS 4
- **State:** React Context (no Redux/Zustand)
- **HTTP:** `fetch` (mostly) + `axios` (a little, in `src/app/api/axios.js`)
- **Toasts:** `sonner`
- **Charts:** `apexcharts` + `recharts` (both installed; both in use)
- **Animation:** `framer-motion`
- **Image tooling:** `react-image-crop`, `react-rnd` (canvas editor), `@imgly/background-removal`
- **Routing helper:** `react-router-dom` is installed but the app uses Next's `next/navigation`

No TypeScript. Files are `.js` / `.jsx`.

## Backend

- **Base URL:** `https://api.creativeklux.com/api/creativeklux-userend`
- **Hosted at:** `api.creativeklux.com` (separate Laravel project, not in this repo)
- **Auth:** Bearer token in `Authorization` header. Token stored in `localStorage` under `"token"`.
- **Laravel quirk:** PUT requests are sent as `POST` with `_method=PUT` in `FormData` (see `updateBrandById` in `AuthContext.jsx`).

## Architecture overview

### Route groups (Next App Router)

Folders in `()` are organizational — they don't appear in URLs.

```
src/app/
  layout.js              Root layout (server component, mounts providers + Toaster)
  globals.css
  (auth)/                Login, register, verify-email, forgot/change password
    layout.jsx           ← do NOT add an AuthProvider here (see "Provider duplication" below)
  (dashboard)/           Authenticated app
    layout.js            Sidebar + Header + ProtectedRoute + brand-picker modal
    (pages)/             Feature pages, grouped by domain:
      (analyze)/         brandPulse, creativeIQ
      (Predict)/         adGuard, rivalLens
      (ads-content)/     ads-analytics, ads-calendar, ads-publishing
      (social-content)/  social-analytics, social-calendar, social-publishing
      (settings)/        profile, billing, team, sessions-and-password, socials, ads, etc.
      brand/             create, edit, import, reuse (Brand Kits)
      studio/, magic-studio/, product-photos/, image-gallery/, …
  (components)/          Shared UI (~50 files): Sidebar, Header, Modal, ImageGallery, etc.
  api/                   BFF route handlers for OAuth + media proxy:
                         google, meta, linkedin, twitter, pinterest, pexels,
                         proxy-image, proxy-media
```

### Providers (root layout)

```
RootLayout
  └─ AuthProvider          ← src/context/AuthContext.jsx
       └─ BrandProvider    ← src/context/BrandContext.jsx (different from AuthContext.brands!)
            └─ ReusableFunctionsProvider
                 └─ children
  + <Toaster />            ← sonner, mounted in body
```

### Why "frontend with a tiny BFF"

This is a SPA that talks directly to `api.creativeklux.com` for almost everything. The only server-side Next routes are `src/app/api/*` — they exist for OAuth code/token exchanges (need server-side client secrets) and media proxying (CORS / hiding source URLs). Everything else is browser → Laravel.

## State / data — `AuthContext.jsx` is the heart

`src/context/AuthContext.jsx` is ~2,500 lines. It is BOTH the auth context AND the project's API client. It owns:

- `user`, `token`, `loading`
- `brands`, `brandsLoading`, `activeBrand`, `activeBrandId`
- `teams`, `teamsLoading`
- `myImages`, `myImagesLoading`
- `tutorialVideos`, `tutorialVideosLoading`, `tutorialVideosError`
- `socialAccounts`

And exposes ~30+ methods: `login`, `register`, `verifyEmail`, `resendVerificationCode`, `logout`, brand CRUD (`createBrand`, `createManualBrand`, `fetchBrands`, `fetchBrandById`, `updateBrandById`, `deleteBrandById`, `setActiveBrand`), team management, resells, social/ad account connect+disconnect, image gallery, design save/fetch/update/delete, `analyzeRival`, `getCompetitorInsights`, `checkCompliance`, `creativeScoring`, `creativeInsights`, `saveIntegration`, `runComparison`, `fetchDesignTemplates`, `creativeAiChat`, `generateCustomCreative`, etc.

### `authFetch` wrapper

All authenticated calls should go through `authFetch` (defined inside `AuthProvider`). It auto-logs the user out on 401 (clears `localStorage` + state, throws `"Unauthorized"`). If you call `fetch` directly with a Bearer token, you bypass that safety net.

### `BrandContext.jsx` (the *other* brands context)

There is a second context called `BrandContext` that ALSO tracks `brands` / `activeBrand` — but its data comes from a local IndexedDB-like store (`@/utils/localDb`), not the API. It uses `localStorage.getItem("activeBrand")` (different key from AuthContext's `"activeBrandId"`). The dashboard layout's modal logic uses `useAuth()`, not `useBrand()`. Treat `BrandContext` as legacy unless you find a place that needs it; new code should pull brand state from `AuthContext`.

## Auth flow

1. Tokens kept in `localStorage` (`token`, `user`, `activeBrandId`). Registration uses `sessionStorage` for `pendingUserId`, `pendingEmail`, `pendingName`.
2. `AuthProvider` mount effect reads `token` from `localStorage`. If present, restores it; a `[token]` effect then calls `fetchProfile` + `fetchBrands` + `fetchTeams` + `fetchMyImages` + `fetchTutorialVideos` in parallel.
3. Every authenticated call goes through `authFetch` → 401 forces logout.
4. `ProtectedRoute` (in `src/app/(components)/ProtectedRoutes.js`) gates `(dashboard)/*`. It also reads `localStorage` directly as a fallback, so the dashboard renders even before `user` state is hydrated.
5. After login, `(dashboard)/layout.js` shows a brand-picker modal if the user has brands but none is active (`brands.length > 0 && !activeBrand`).

### Provider duplication — fixed, don't reintroduce

There used to be **two `AuthProvider` instances** — one in the root layout and one in `(auth)/layout.jsx`. The login form mutated the inner one, which was destroyed on navigation to `/`, so the brand-picker modal didn't show until the user refreshed. The duplicate has been removed. **Do not re-add `<AuthProvider>` to any `(auth)` layout** — there must be exactly one `AuthProvider` in the tree, in the root layout.

## Conventions / patterns to follow

- **Client components** liberally — `"use client"` at top of any file using hooks/state.
- **Field naming:** backend uses snake_case (`primary_color`, `created_at`); we use those names directly in components. No mapping layer.
- **Status field:** the backend `brand.status` (0/1) does NOT mean "is the user's active brand". The active brand is tracked in `useAuth().activeBrandId`. On Brand Kits, the "Active" badge reflects `brand.id === activeBrandId`, not `status`.
- **Toaster:** use `import { toast } from "sonner"` for user-facing errors/success. The `<Toaster />` is mounted in the root layout (top-right, `richColors`).
- **Routing:** `useRouter()` from `next/navigation`, `router.push(...)` for navigation.
- **No TypeScript** — don't introduce `.ts`/`.tsx` files unless asked.
- **Don't bypass `authFetch`** — always use it for authenticated requests so 401 logout works.

## Create-from-URL flow specifics (`/studio/create-from-url`)

This page is now the most intricate generation flow. Worth a dedicated section.

### Steps

1. **URL** — user pastes a URL, clicks Import → `useAuth().sendUrl(url)` → `POST /brands/import`. Backend scrapes the site. Response shape:
   ```js
   { success, message, data: { name, description, logo, primary_color, secondary_color, images: [/* up to ~10 https URLs */] } }
   ```
   The frontend reads `name`, `description`, `primary_color`, `logo`, and **`images`** (sliced to 10, stored in `scrapedImages`).
2. **Type** — Ads vs Social. Sub-types come in step 4, not step 2 (user wanted to allow late switching).
3. **Brand Details** — auto-filled from import, editable.
4. **Size, Goals & Audience** — for **Ads**, this also contains the sub-type pill row: **Image / Video / Interactive / Playable**. Default is **Image**. Interactive and Playable are visible but `disabled` with native `title="Coming soon…"` tooltip. The size grid and format selector swap based on sub-type (Image uses `AD_SIZES` + `FILE_FORMATS`; Video uses `VIDEO_SIZES` + `VIDEO_FORMATS` MP4/MOV).
5. **Select Images / Background Media** — shows the scraped-image strip (`BrandImagesStrip` with `images={scrapedImages}`) above the media picker. Labels/icons change to "Background Media" when sub-type is Video.

### Selection cap (max 5)

Combined cap of 5 across both sources. Three add-paths enforce it:
- `handleBrandImageUse` — trims to remaining slots
- `handleBrandImageCrop` — trims to remaining slots, starts cropping batch
- `handleApplyFromPicker` — caps total images + media combined

`MediaPickerModal` receives `maxSelectable={MAX_IMAGES - croppedImages.length}` and enforces it on click (toggle handlers check the combined count and call `notify` before calling `setState`, never inside an updater).

### Generate payload

`handleGenerate` → `generateCustomCreative` → `POST /creatives/redesign`. The wire body looks like:

```js
{
  generation_data: {
    creative_type: "ads",          // or "social"
    create_sub_type: "image",      // adSubType for ads, "posts" for social — NOT hardcoded
    brand_id: 48,                  // from activeBrandId
    brandName, description, brandColor, logo, visualStyle, font, sourceUrl,
    size: "1080x1080",             // VIDEO_SIZES for video, AD_SIZES for image, SOCIAL_SIZES for social
    campaignGoal, audience,
    // Exactly one of:
    fileFormat: "PNG",             // for image/social
    videoFormat: "MP4",            // for video
    images: [/* https URLs only */],
    // social-only:
    tone, platforms,
    generatedAt,
  }
}
```

### Image URL resolution before generate

Before calling the endpoint, `handleGenerate` walks through `croppedImages` and resolves each item to a real URL:
- Has `sourceUrl` starting with `http` → use as-is (no upload).
- Is a `File` instance (cropped or dropped) → `await uploadImage(file)`, use the returned URL. **Runs in `Promise.all` so all uploads parallelize.**
- Only `blob:` `previewUrl` and nothing else → dropped (unreachable from backend).

There's currently a temporary `console.log('🔼 uploadImage response:', result)` to verify the upload's URL field name — remove once confirmed.

## Confirmed brand object shape (from the API)

```js
{
  id, user_id, name, description, tagline,
  logo,                    // full https URL
  primary_color,           // hex string
  secondary_color,         // hex string
  fonts,                   // string, e.g. "Inter"
  url,                     // brand website
  industry,                // string
  status,                  // 0 or 1 (backend-controlled; not the same as "currently active")
  created_at, updated_at,  // ISO strings
}
```

Wrapper response: `{ success, message, data: [ ...brands ] }`.

## Known quirks / things to watch

- `apexcharts` AND `recharts` are both installed. Different pages use different libraries.
- `react-router-dom` is in `package.json` but the app uses `next/navigation`. Probably leftover from migration.
- A backup file `src/app/(auth)/login/login.backup.jsx` exists alongside `page.jsx`. Don't import it.
- Several `.DS_Store` files are committed in `src/` — macOS noise.
- Some `useEffect`s in `AuthContext` use `[token]` deps; the mount effect uses `[]` and ONLY runs once on first render. Don't rely on it re-running.
- `BASE_URL` is hardcoded in `AuthContext` — no env var. If switching environments, edit it directly.
- **`/creatives/redesign` returns 500 with `"syntax error, unexpected identifier 'RULES'"`** — Laravel-side PHP parse error in the backend (likely a HEREDOC marker issue or unescaped quote in a prompt template). Frontend can't fix this; backend team needs to grep for `RULES` in the controller for `/creatives/redesign`. Until fixed, generation always fails — toast surfaces the message.
- **Local `toast` state shadows the sonner `toast` import.** Pages like `studio/create-from-url/page.jsx` have a local `[localToast, setLocalToast]` state that used to be named `toast` — that collided with `import { toast } from "sonner"` and caused `toast.error is not a function` crashes. If you introduce sonner in another file, **don't** name a local state variable `toast`.
- **`PEXELS_API_KEY` and other secrets live in `.env`** (gitignored). Without it, `/api/pexels` returns 500 and Search Media inside `MediaPickerModal` shows nothing. Next.js only reads `.env` at server startup — **restart `npm run dev` after editing `.env`**.
- **Blob URLs are not fetchable by the backend.** Cropped images live in browser memory with `blob:` URLs that only work in the user's tab. Always upload via `useAuth().uploadImage(file)` first and send the returned URL. Note the side effect: every upload persists to the user's Image Gallery — there's no temporary-upload endpoint yet.

## create-from-url has TWO generate backends (chosen by `?engine=` query param)

(Updated 2026-06-16.) `create-from-url/page.jsx` defines **two independent, live generate functions** and picks one in `handleGenerate` based on an `engine` flag read from the URL. Both stay live — nothing is commented out anymore.

```js
// engine is read once from the URL: ?engine=involk → 'involk', else 'redesign' (default)
const handleGenerate = async () => {
  if (!brandName.trim()) { toast.error('Please enter a brand name'); return; }
  if (engine === 'involk') await generateViaLLM();   // /design/generate-design/involk_llm
  else await generateViaRedesign();                  // Scraive → /creatives/redesign
};
```

**Two entry points on the My Creations page (`creatives/page.jsx`)** route to the same flow with different engines:
- **"Create from URL"** → `/studio/create-from-url` → `engine='redesign'` (default).
- **"Create using Involk"** (violet button) → `/studio/create-from-url?engine=involk` → `engine='involk'`.

The whole flow (import → type → brand details → size/goals → images → full-overlay loader) is identical; only the generation endpoint differs. `engine` is read in a mount `useEffect` via `new URLSearchParams(window.location.search)` (no `useSearchParams`/Suspense needed since the page is already a client component).

- **`generateViaLLM`** → `useAuth().createDesign(payload)` → **`POST /design/generate-design/involk_llm`**. Bypasses Scraive entirely. **One request → one design** (no template batching). Body: `{ generation_data: { brand_details: { creative_type, create_sub_type, ...rest }, generatedAt } }` — `templates` is stripped. An **adapter** maps the response: `{ variations:[...] }` used directly, or a single `{ design:{canvas,elements}, copy }` wrapped as one variation. ⚠️ Backend currently returns empty `{"variations":[]}`, so this engine produces no designs until the backend populates variations — frontend wiring is correct.
- **`generateViaRedesign`** → the standard Scraive recipe: `fetchDesignTemplates` → `generateCustomCreative` (`POST /creatives/redesign`, streamed batches of 2). Same recipe Custom Creation uses.
- **Shared helpers** keep the two from drifting: `resolveImageUrls()` (upload Files / drop blobs), `buildPayload()` (base payload, no templates), `prepare()` (size + images + base payload).

**`createDesign`** lives in `AuthContext.jsx` (right after `generateCustomCreative`, exported in the context value). Endpoint is `${BASE_URL}/design/generate-design/involk_llm`; it uses plain `fetch` with `credentials:"include"`. Currently **only create-from-url's `generateViaLLM` calls it.**

Two things unverified on a real run: (1) the URL spelling is `involk_llm` exactly as given — change the one line in `createDesign` if the backend route is `invoke_llm`; (2) the response shape — the adapter assumes `{ variations }` or `{ design, copy }`; the `console.log('🎨 createDesign output …')` prints the real body to adjust the adapter if needed.

## Generation flow & loaders (custom creation + create-from-url)

All AI design generation ultimately calls `useAuth().generateCustomCreative` → `POST /creatives/redesign`, which is **template-driven**: it pulls `templates` out of the payload, chunks them into **batches of 2**, and POSTs each batch (with an optional `onBatchResult` streaming callback). The correct, working **recipe** every generate handler must follow:

1. **Fetch Scraive templates first** — `fetchDesignTemplates({ type, category: <size label>, type_size })` (hits `api.scraive.com`). Bail if `!ok` or zero templates.
2. **Resolve image URLs** — real `https` `sourceUrl` → use as-is; `File` (cropped/dropped) → `await uploadImage(file)` and use the returned URL; `blob:` `previewUrl` only → **drop** (backend can't fetch blobs).
3. **Build payload** with `templates`, `brand_id` (`activeBrandId`), `category`, `type_size`, plus `creativeType` (`*_creative`) and `categoryType` (the sub-type).
4. **Stream batches** — `generateCustomCreative(payload, (batch) => …)`; first batch hides the overlay and calls `onResult({ type:'design', variations, assets, done:false })`, later batches `append`. Handle `!result.ok` and empty results.

**`creative_type` / `create_sub_type` are already sent.** `generateCustomCreative` maps `creativeType` (`ads_creative`/`social_creative`/`designer_creative`) → `brand_details.creative_type` (`ads`/`social`/`designer`) and `categoryType` → `create_sub_type`. No extra wiring needed for the type — just pass `creativeType`/`categoryType`.

### Architecture trap: custom-creation forms each reimplement the recipe

`create-from-url` has **one** `handleGenerate` branched by `isAds` (`creationType === 'ads'`), so ads & social ("content") share identical logic and can't drift. **Custom creation is different** — every type has its **own form component** (`ImageAdsForm`, `VideoAdsForm`, `PostForm`, `LogoForm`, …) each with its **own** `handleGenerate`. `PostForm` (social) had drifted (no template fetch, no upload, no `brand_id`) and failed at generate; it was fixed (2026-06-16) to mirror `ImageAdsForm`. **If you touch the generate recipe, update every form** — or better, extract a shared helper. Forms read `uploadImage`/`activeBrandId` from `useAuth()` directly; `fetchDesignTemplates`/`generateCustomCreative` come via `commonProps` from the studio page.

### Loaders

Three shared components live in `src/app/(components)/`:
- **`loaders/full-overlay-loader.jsx`** (`FullOverlayLoader`) — the **standard generating overlay** now used by create-from-url, `ImageAdsForm`, `VideoAdsForm`, `PostForm`. Dual counter-spinning rings + spark + cycling subtitle + bouncing dots on a light `#f5f5f5` surface. Props: `title`, `subtitle`, `embedded` (renders as an inline box instead of full-screen).
- **`loaders/inline-progress-loader.jsx`** (`InlineProgressLoader`) — small inline strip with a glowing icon + indeterminate violet→coral bar.
- **`GeneratingOverlay.jsx`** — the older spinning-logo + typewriter overlay (now superseded by `FullOverlayLoader` in the generate flows; kept for reference).

**Overlay offset (don't cover the chrome):** `FullOverlayLoader` (non-embedded) is `fixed` but uses `left: var(--ck-content-left)` and `top: var(--ck-content-top)`, both published by `(dashboard)/layout.js` on `<main>` (left = sidebar width `14rem`/`3.75rem`, top = header `4rem`). Vars fall back to `0`, so it's full-screen anywhere without the layout (e.g. `/logo-test`). This is why the loader masks only the design-preview area, leaving the sidebar + header usable.

All loader keyframes (`ck-spin`, `ck-bar-slide`, `ck-icon-glow`, `ck-dot-bounce`, `ck-text-cycle`, `caret-blink`) are in `globals.css`.

**Dev preview:** `/logo-test` (public, outside `ProtectedRoute`) renders the inline + full-overlay loaders for quick visual checks.

## Theming / dark mode (Tailwind v4)

Light + dark mode via **next-themes** + a **palette-variable override** in `globals.css`. The guiding rule: **light mode is left 100% untouched**; only dark is centralized.

- **Engine:** `ThemeProvider` (next-themes, `attribute="class"`, `defaultTheme="system"`) wraps everything in the **root** `layout.js`; `<html suppressHydrationWarning>`. Toggle UI: `src/app/(components)/ThemeSwitcher.jsx` (Light/System/Dark) lives at the bottom of the Sidebar. (The old hand-rolled `(components)/ThemeProvider.jsx` + `ThemeToggle.jsx` are dormant — use the **`@/context/ThemeProvider`** one.)
- **v4 hook:** `globals.css` has `@custom-variant dark (&:where(.dark, .dark *));` — the JS config's `darkMode:"class"` is ignored in v4.
- **How colors flip:** a single **`.dark { … }`** block in `globals.css` re-points Tailwind's palette vars (`--color-gray-50…950`). Because components use `gray-*` classes, every one flips automatically in dark. **To fix any dark shade, edit that one block** — it's the single source of truth for dark. Light isn't redeclared (uses Tailwind defaults).
- **Surface/page/canvas tokens** (registered in `@theme`, light value = the old hardcoded color, dark overridden in `.dark`): `bg-surface` (cards, was `bg-white`), `bg-page` (dashboard content bg, was `bg-[#f7f8fc]`), `bg-canvas` (editor/preview/loader bg — applied as **`dark:bg-canvas`** so light keeps its exact hex).
- **`white`/`black` are NOT flipped** (true white/black) so `text-white` on buttons and `bg-black/..` overlays stay correct. Surfaces flip via `bg-surface`, not by remapping white.
- **Gotchas:**
  - A "dark neutral button" (`bg-gray-900 text-white`) breaks in dark (gray-900→light, white text invisible). Fix: `text-white` → **`text-gray-50`** so text inverts opposite to the bg (an *inverting* button). Watch for more of these.
  - **Arbitrary hex** (`bg-[#…]`, inline `style`) doesn't flip — convert to a token or add `dark:bg-[#…]`. Charts (apexcharts/recharts) carry own colors.
  - `/designs/*` poster pages were **excluded** from theming (static art) — their surfaces stay white but their `gray-*` will flip; force-light that route if it matters.

## Product Photos — Photo Editor (`(components)/product-photos/PhotoEditor.jsx`)

"Edit a photo" is a **layered editor** (~1500 lines). The base product image is the bottom layer; everything else is an **overlay layer** (`layers[]` of `{id,type,x,y,w,h,rotation,...}`, types: `image | text | shape | path | badge | emoji`). Layers drag/resize/select/delete/duplicate/Front-Back; **Delete key** removes (ignored while typing). Full **undo/redo** history (debounced snapshot of all edit state incl. layers, canvasBg, canvasSize).

- **Export is canvas-composited** — `renderFrameToCanvas()` paints canvasBg → base image (with filters/transform/shadow) → each layer, at `canvasSize × EXPORT_SCALE(2)`; `renderToCanvas()` is the tight product-crop fallback; `exportBlob()` picks frame vs crop. **Download** saves a file; **Save** uploads the PNG to the Image Gallery (`uploadImage`).
- **Top tools wired:** Insert (category browser: Classics/Blobs/Arrows/Lines/Speech Bubbles/Emojis/Reactions/Indexes/Promotions/Sizes + Upload + Recent uploads), Add text (inline contentEditable + toolbar: bold/size/align/color), Backgrounds (none/solid/gradient/Pexels image → `canvasBg`), Resize (`canvasSize` presets), Brand it (add `activeBrand.logo` + brand colors), Templates (preset layer sets), AI Shadows (opens Shadows panel). Edit Cutout = real **eraser brush** overlay (destination-out → re-bakes `processedUrl`).
- **All shapes are SVG/Path2D** via the shared `VisualSVG` component (preview + canvas) and `drawLayer` (export) — no licensed art; **brand logos deliberately omitted** (trademarked).
- **⚠️ AI tools are dead** — see below.

## Product Photos AI is a dead end (base44 removed)

`src/(lib)/ai-helpers.jsx` (`generateImage` / `uploadFile`) calls **base44** (`base44.integrations.Core.*`), but the SDK is **uninstalled**, no `base44Client`, no appId/key in `.env`. So every AI-generation feature throws/does nothing:
- **Affected:** Virtual Model, Product Staging, Product Tool (Beautifier/Flat Lay/Ghost Mannequin), Background Remover's "Generate AI background", Video Generator upload, PhotoEditor Retouch/Light On/AI-prompt (PhotoEditor's now show graceful "coming soon" toasts).
- **Working without AI:** Background Remover's *core* removal (local `@imgly` WASM), all PhotoEditor non-AI editing.
- **Fix is centralized:** repoint `generateImage`/`uploadFile` to a real **image-in → image-out** service and all the modals revive at once. `redesign`/`involk_llm` are **design/template** generators (brand_details → canvas JSON), **not** image-from-photo — they can't power these.

## Recent significant changes

(Last updated 2026-06-17. Keep this short — a running 3–5 item list is fine.)

- **Dark mode added** (whole app) — next-themes + palette-variable override in `globals.css`; light untouched. See "Theming / dark mode".
- **Photo Editor fully built out** — layer system + Insert browser + Add text + Backgrounds + Resize + Brand it + Templates + Edit Cutout eraser; canvas-composited export. See "Product Photos — Photo Editor".
- **"Create using Involk" button** on My Creations → `/studio/create-from-url?engine=involk` (vs default `redesign`). See create-from-url backends section.
- **Product Photos → Background Remover + Batch** — `BackgroundRemoverModal` (core removal via `@imgly` Web Worker pool, `isnet_fp16`); `/product-photos/batch` opens selected images in batch mode. Image-background library expanded to 8 categories.

## Where the bodies are buried

- **Sidebar entries** (the canonical list of feature routes) — `src/app/(components)/Sidebar.jsx`
- **Modal that forces brand selection** — `src/app/(dashboard)/layout.js` (renders `ModalPage` based on `useAuth()`)
- **Brand-picker modal component** — `src/app/(components)/ModalPage.jsx`
- **OAuth helpers** — `src/(lib)/oauth.js`, `src/(lib)/oauth/page.jsx`, `src/(lib)/integrations/platformResolvers.js`
- **Mock data** still around — `src/data/mockBrands.js`, `mockProducts.js`, `assetsData.js`. Some pages may still use these; prefer real API.
- **Create-from-URL flow** — `src/app/(dashboard)/(pages)/studio/create-from-url/page.jsx`. Big file (~1100 lines). Holds the sub-type picker, the cropping queue with `cropBatchStart`, and `handleGenerate` (which uploads cropped files and calls `generateCustomCreative`).
- **Generate endpoint** — `POST /creatives/redesign` (via `useAuth().generateCustomCreative`, defined around `AuthContext.jsx:1498`). Note it uses plain `fetch` with `credentials: "include"`, not `authFetch`.
- **Cropping coordinator state** lives on the create-from-url page: `imageSrc` (queue currently being cropped, resets per batch), `imageSrcMeta` (parallel original URLs), `croppedImages` (master list, never reset), `cropBatchStart` (where each cropper batch begins). Save/skip write to `croppedImages[cropBatchStart + currentCropIndex]`. Cancel rolls back only the current batch via `prev.slice(0, cropBatchStart)`.
- **The scraped images strip** — `src/app/(components)/BrandImagesStrip.jsx`. Accepts an optional `images` prop. When provided, the strip uses it instead of `useAuth().myImages` and skips the library fetch.
- **Generating overlay** — `src/app/(components)/loaders/full-overlay-loader.jsx` (`FullOverlayLoader`). Offset by `--ck-content-left` / `--ck-content-top` vars set on `<main>` in `(dashboard)/layout.js`. Inline variant: `inline-progress-loader.jsx`. Dev preview at `/logo-test`.
- **Custom-creation forms** — `src/app/(dashboard)/(pages)/studio/forms/*` (one per type; each has its own `handleGenerate`). Routed by `studio/page.jsx` on `selectedCreative` + `selectedCategory`. `ImageAdsForm`/`PostForm` are the reference implementations of the generate recipe.
- **Background-removal worker** — `src/app/(components)/product-photos/bgRemoval.worker.js` (pool managed inside `BackgroundRemoverModal.jsx`). `/product-photos/batch` page feeds files into it.
- **`createDesign`** (the Scraive-bypass endpoint `POST /creatives/createdesign`) — defined in `AuthContext.jsx` right after `generateCustomCreative`, exported but **dormant**; one design per call, no templates. Re-enable steps in the "createdesign test override" section above.

## Running locally

```
npm run dev      # next dev
npm run build    # next build
npm run start    # next start
npm run lint     # next lint
```

There is no `.env.example`. The `BASE_URL` and other backend endpoints are hardcoded in `AuthContext.jsx`. But a `.env` IS required for a working setup — it holds third-party API keys consumed by `src/app/api/*` routes. Known keys:

- `PEXELS_API_KEY` — required for Search Media inside `MediaPickerModal`. Without it, `/api/pexels` returns 500.
- `NEXT_PUBLIC_FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
- `NEXT_PUBLIC_LINKEDIN_CLIENT_ID`, `LINKEDIN_REDIRECT_URI`, `LINKEDIN_CLIENT_SECRET`
- `NEXT_PUBLIC_TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`
- `NEXT_PUBLIC_PINTEREST_CLIENT_ID`, `NEXT_PUBLIC_PINTEREST_ACCESS_TOKEN`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_ADS_DEVELOPER_TOKEN`
- `NEXT_PUBLIC_YOUTUBE_CLIENT_KEY`, `YOUTUBE_CLIENT_SECRET`
- `NEXT_PUBLIC_TIKTOK_CLIENT_KEY`

Next.js only reads `.env` at server startup — **restart `npm run dev` after editing it**. The file is gitignored; new contributors need to get it from a teammate (and rotate any leaked keys before sharing).
