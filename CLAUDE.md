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

## Recent significant changes

(Last updated 2026-05-22. Keep this short — a running 3–5 item list is fine.)

- **Create-from-URL (`/studio/create-from-url`)** got a major upgrade: step 4 now has an "Ad Format" sub-type picker (Image / Video / Interactive / Playable — last two disabled with "Coming soon…" tooltip); step 4's size/format fields swap based on sub-type; step 5 labels/icons mirror VideoAdsForm when sub-type is video; the scraped images from `/brands/import` populate the strip above the picker instead of the user's library; cropped images are now uploaded to `/image-gallery` before the generate call so the backend gets real URLs. Payload also now passes `adSubType` as `create_sub_type` and includes `brand_id`. See the dedicated section below.
- **`BrandImagesStrip` extended** with optional `images` prop (use instead of `useAuth().myImages`), optional `label`, src-dedupe, and a trim effect that keeps `externalCount + localSelected` ≤ `maxSelect` (prevents the old "6/5 selected" bug).
- **`MediaPickerModal`**: removed the "Upload File" tab entirely; added `maxSelectable` prop so the picker enforces the parent's remaining-slot count across images AND videos combined; fixed a React "setState during render" warning that was caused by toasting inside an updater function; renamed "Upload to Library" → "Upload from Library".
- **Image Gallery (`/image-gallery`)**: added a "Copy URL" button to the My Images popup (Download / Copy URL / Delete), switched `copyLink` to a `sonner` toast, and fixed cursor-shake on card hover by disabling `hover:scale-105` while the popup menu is open.
- **Creatives page (`/creatives`)**: removed the duplicate center "Instant Creation"/"Custom Creation" buttons in the empty state (kept the three buttons in the top-right). Added a `useEffect` guard so `loadDesigns` doesn't fire while `activeBrandId` is still hydrating (avoids the boot-race `fetchDesigns: no activeBrandId` log).

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
