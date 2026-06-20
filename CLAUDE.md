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
- **Publish (My Creations → `PublishModal`) — rebuilt 2026-06-18, two-view + category-aware.** The Publish button opens `src/app/(components)/PublishModal.jsx`. **View 1 (picker):** a tile grid of platforms with live connection status from `fetchIntegrations()`, grouped Connected / Not connected, plus "Connect More Platforms" + empty state → both route to `/integrations`. Tiles are **category-driven**: ads creatives (`creative.category === "ads"`) show ad platforms (`meta_ads`, `google_ads`, …); everything else shows socials (`facebook`, `instagram`, `tiktok`, …). **View 2 (compose):** clicking a connected tile opens a **platform-native, edit-in-place preview** — Facebook/Instagram/generic post mockups where the caption is typed *inside* the post (`EditableCaption`, auto-growing). The post renders the **real creative**: `creative.image` if present, else the canvas+elements via a local `DesignCanvas` (same draw logic as the My Creations cards / `renderDesignToFile`). **Publishing posts directly browser → `graph.facebook.com`** using the integration's `int_token`/`int_id`. **Only Facebook & Instagram actually publish** (`publishToFacebook`/`publishToInstagram` in `src/(lib)/integration.js`); every other platform is a `sleep(1200)` stub with a "Preview only" badge. **Canvas designs (no `image_url`) are made publishable on the fly:** `handlePublish` renders the design to a PNG (`renderDesignToFile`), uploads it via `uploadImage()` (→ public URL, also lands in the Image Gallery), then publishes that URL — platforms can't fetch `blob:`/canvas. Watch for **tainted-canvas** failures if a design embeds a non-CORS image — mitigated: `DesignCanvas`/`renderDesignToFile` route `http(s)` image-element sources through **`/api/proxy-image`** (`proxiedSrc`) so they load same-origin/CORS-safe (leaves `data:`/`blob:` alone). Extra modal bits: the **caption editor** splits the first paragraph (headline) into its own field rendered **UPPERCASE** — and `captionForPublish` actually `.toUpperCase()`s it in the published string (CSS alone wouldn't reach Facebook); the **post preview** is wrapped in a `max-h:52vh` `overflow-y-auto` box so long posts scroll like the real platforms; `AutoTextarea` has a `minHeight` floor (the IG caption sits below the image and would otherwise auto-grow to 0 and vanish); `Avatar` falls back to the brand initial if `activeBrand.logo` is missing/broken; a `busyAction` state drives separate spinners on Publish-Now vs the Schedule button.

## Social scheduling, publishing & calendar data flow

(Added 2026-06-18.) Publishing is **browser → `graph.facebook.com`** (no backend posts table). The historical record lived in **`localStorage` `creativeklux_published_posts`** (`getPublishedPosts`/`savePublishedPost` in `src/(lib)/integration.js`) — treated as a cache, not source of truth.

- **Scheduling (Facebook only, frontend-only).** `PublishModal` Schedule button → inline `datetime-local` picker (validated **10 min–6 months** ahead) → `handlePublish(scheduledUnix)` → `publishToFacebook({…, scheduled_publish_time})`. With a time set it sends `published:false` + the unix timestamp; **Facebook holds and auto-publishes it** — no cron/backend needed. The My-Creations side-panel **Schedule** button opens `PublishModal` with `startInSchedule` (auto-jumps into the FB compose + picker). **Instagram/others can't self-schedule** (IG has no `scheduled_publish_time`) — Schedule is FB-only; IG scheduling needs a backend scheduler.
- **Live-authoritative status (the fix).** `fetchLivePostsFromConnectedAccounts(integrations)` fetches FB `/posts` (published) **and** `/scheduled_posts` (scheduled, `scheduled_publish_time`→ISO), plus IG `/media`. Both the **Calendar** (`social-calendar`) and **Publishing** (`social-publishing`) pages now: pass real `integrations`, treat **live FB as authoritative** for status, keep a local post only if FB no longer reports it, **never trust a local `scheduled`** (it would shadow a now-published post), dedupe by id preferring published, and **persist published only** (scheduled stays live-only). This fixed the "scheduled post never flips to published" bug and self-cleans the old localStorage pollution.
- **Status wording:** Publishing-page `StatusBadge` future-scheduled = **"Scheduled"** (was "Pending"), past-due = "Publishing…".
- **Caveats / not yet done:** localStorage is **per-device**, only the last ~20 published are live-fetched, and it's **not real-time** (refresh re-syncs). The real fix is a **backend posts table** (cross-device, full history, IG scheduling) — flagged for backend, not urgent.

## Facebook / Instagram OAuth + publishing gotchas

- **Two OAuth files** — `src/(lib)/oauth.js` (dormant) and **`src/(lib)/oauth/page.jsx` (ACTIVE — what `integrations/page.jsx` imports)**. Edit the active one. The Meta scope lists differ between them; the active IG case was missing `instagram_content_publish` (fixed).
- **`REDIRECT_URI` is hardcoded to `https://app.creativeklux.com/oauth-callback`** ([oauth/page.jsx]) and `/api/meta/exchange` matches it. So Meta OAuth **only completes on prod**, not localhost (the popup redirects to prod; integrations then show everywhere since same backend). Frontend scope edits don't take effect until **deployed to prod**, then **reconnect**.
- **IG publishing model:** IG Business account **linked to a Facebook Page**; publish via Graph API using the **Page** token (`int_token`) + IG user id (`int_id`); 2-step container→publish; **image must be a public URL** (our upload provides it). Connect filters the page-picker to IG-linked Pages.
- **Error decoding** (`publishToInstagram` logs the full Graph error): `code 25 / subcode 2207050` = **account restricted** (account-status, not code — use an established Business account); a permission/scope error looks different (`code 200`); `2207050`≠image error.
- **App Review gate:** `instagram_content_publish` (+ FB page perms) must be at **Advanced Access** for non-role users; Standard Access works only for app-role accounts. Needs `FACEBOOK_APP_SECRET` in `.env`.

## Meta Ads publishing

(Added 2026-06-19.) `publishToMetaAds` (`src/(lib)/integration.js`) creates a **real, live ad** entirely from the browser — Graph API ad endpoints (`act_<id>/campaigns|adsets|adcreatives|ads`) work client-side, no backend. The chain:

1. **Campaign** — `objective` from the goal (`awareness`→`OUTCOME_AWARENESS`/REACH, `traffic`→`OUTCOME_TRAFFIC`/LINK_CLICKS, `engagement`→`OUTCOME_ENGAGEMENT`/POST_ENGAGEMENT), `status: ACTIVE`, `special_ad_categories: []`, **`is_adset_budget_sharing_enabled: false`** (required when budget is on the ad set, not the campaign).
2. **Ad set** — `daily_budget` in currency **minor units (×100)**, `start_time` now, `end_time` now+days, `targeting: { geo_locations.countries: [country], age_min 18, age_max 65 }`, `bid_strategy: LOWEST_COST_WITHOUT_CAP`, `billing_event: IMPRESSIONS`, `status: ACTIVE`.
3. **Ad creative** — `object_story_spec.link_data` with **`picture` = the public image URL** (NOT an `/adimages` upload — that was unreliable), `message`, `link` (= brand `url`), `call_to_action: LEARN_MORE`. Runs **as a Facebook Page** → `page_id` resolved from the connected `facebook` integration.
4. **Ad** — ties creative→ad set, `status: ACTIVE`.

UI: `PublishModal` shows the **minimal ad form** (Goal/Daily budget/Run-days/Country) when `meta_ads` is selected — form first, full preview below, whole modal scrolls. `meta_ads` is `real:true`. **Goes live immediately and spends real money.** Button disabled until the form is complete; **`MIN_AD_BUDGET = 2000`** floor (currency-naïve — fine for NGN, too low/high for others). The `meta_ads` OAuth scope now includes `ads_management` (+ `pages_show_list`) — was only `ads_read`.

- **Field-by-field validation:** the Ads API rejects with clear Graph errors (e.g. `code 100/4834011` budget-sharing field; `code 100/1885272` budget below the per-currency minimum). `publishToMetaAds`'s `post()` helper logs HTTP status + full body and surfaces `error_user_msg`.
- **Partial failures auto-clean up** (2026-06-19): steps 2–4 (ad set/creative/ad) run inside a try/catch; if any throws, `publishToMetaAds` deletes the campaign (a campaign delete cascades to its ad set/ad) before rethrowing, so no orphan ACTIVE campaign is left in Ads Manager. Cleanup is best-effort (a failed delete is logged, not thrown).
- **Prereqs:** ad account with a **payment method**, `ads_management` at **Advanced Access**, a connected FB Page, and (per the prod-only `REDIRECT_URI`) connect on prod.
- **Verified working (2026-06-19):** tested against a real ad account — the full chain published a live ad and it showed up on the ads calendar via `fetchLivePostsFromConnectedAccounts`. Partial-failure cleanup is now in place (campaign auto-deleted if a later step fails — see the field-by-field note below).

## YouTube integration

(Added 2026-06-19. Built, **untested** — wiring only.) YouTube is fully frontend-wired: **connect + publish + live-fetch**.

- **Connect** (`integrations/page.jsx` → `resolveYouTubeIntegration`). YouTube uses Google's **code flow** (popup returns a `code`, not a token). Was broken — it fell through to `resolveGenericIntegration`, which read `oauthResult.access_token` (undefined) and never exchanged the code. Now it **exchanges the code via `/api/google/exchange`** (the same route `google_ads` uses), then calls YouTube Data API `channels?mine=true` to resolve `int_id` (channel id) + `int_name` (channel title). No page picker — grabs the default channel; throws a friendly error if the Google account has no channel. The dead `case "youtube"` in `resolveGenericIntegration` was removed.
- **Env gotcha:** the exchange route hardcodes `client_id: NEXT_PUBLIC_GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`, but the auth URL uses `NEXT_PUBLIC_YOUTUBE_CLIENT_ID || NEXT_PUBLIC_GOOGLE_CLIENT_ID` (`oauth/page.jsx` `CLIENT_IDS.youtube`). **Leave `NEXT_PUBLIC_YOUTUBE_CLIENT_ID` unset** (or equal to the Google one) — a different client id → token-exchange client mismatch. In Google Cloud: enable **YouTube Data API v3** + add the `youtube`/`youtube.upload` scopes to that same client's consent screen. Connect only completes on **prod** (the prod-only `REDIRECT_URI`).
- **Publish — the image→video bridge** (`src/(lib)/integration.js`). YouTube **only accepts video** — there is no image post. Our creatives are images/canvas, so `imageUrlToVideoBlob(imageUrl, {durationSec=5})` turns a still into a short video **in-browser**: loads the image through `/api/proxy-image` (CORS-safe so the canvas isn't tainted — a tainted canvas can't be captured), draws it on a canvas, `canvas.captureStream()` + `MediaRecorder` records ~5s → a `.webm` Blob. No ffmpeg/backend. Then `publishToYouTube({access_token, title, description, image_url, video?, privacyStatus, publishAt?})` runs YouTube's **resumable upload**: POST to open a session (reads the upload URL from the `Location` header) → PUT the bytes → returns `{video_id, url}`. Pass a real `video` Blob to skip the conversion (when the app eventually makes real `.mp4`s). `publishAt` (ISO) schedules — YouTube forces `privacyStatus:'private'` for scheduled videos.
- **PublishModal:** `youtube` is now `real:true`; its branch resolves the image (existing `creative.image` **or** rendered-canvas→`uploadImage` URL, same path as FB/IG), uses the caption's first line as the video title + full caption as description, publishes `public`.
- **Scheduling is wired (2026-06-20):** the modal's schedule date-picker now allows **Facebook + YouTube** (`SCHEDULABLE = ["facebook","youtube"]` in `toggleSchedule`; 10 min–6 months). For YouTube, the scheduled time is passed as `publishAt` (ISO) → `publishToYouTube` uploads the video **private** until then. Scheduled videos surface as `scheduled` on the calendar via the live-fetch (`privacyStatus:'private'` + `publishAt`). **IG/X are excluded** (no native API scheduling).
- **Live-fetch** (`fetchLivePostsFromConnectedAccounts`): YouTube branch resolves the channel's **uploads playlist** (`channels?mine=true` → `relatedPlaylists.uploads`) → `playlistItems` (recent 20) → one `videos?part=status` call to split **scheduled** (`privacyStatus:'private'` + `publishAt`) from **published**. Mapped as `type:'social'` so they appear on the social Calendar/Publishing pages. `buildAccountsMap` got a `youtube` case (`channel_id`).
- **Caveats (test later):** the published video is a **~5-second static-image clip** (only way to put an image creative on YouTube); an **unverified** Google OAuth app may lock uploads to **private** until app verification; each upload costs ~1600 of the default 10k/day **quota** (~6/day). The resumable upload relies on Google exposing the `Location` header via CORS (it does).

## X (Twitter) integration

(Added 2026-06-20. Built, **untested** — wiring only.) X is fully wired: **connect (already worked) + publish + live-fetch**.

- **The key difference from FB/IG: X has NO browser CORS.** `api.twitter.com` / `api.x.com` block cross-origin browser requests, so — unlike Facebook/Instagram/Meta Ads, which post client-side — **both posting AND reading tweets MUST run server-side**. Two BFF routes: **`/api/twitter/post`** (publish) and **`/api/twitter/posts`** (read recent tweets for the calendar); `publishToTwitter` + the Twitter branch in `fetchLivePostsFromConnectedAccounts` (`integration.js`) just call them.
- **Live-fetch:** the X branch in `fetchLivePostsFromConnectedAccounts` uses the **raw integration record** (needs `id` + `int_id` + refresh token, not the `buildAccountsMap` shape) → POSTs to `/api/twitter/posts` → maps tweets to `type:'social'` posts (all `published`; X v2 has no API scheduling) so they show on the social Calendar/Publishing pages. Each read **refreshes + rotates** the token (persisted back to localStorage).
- **Connect** (`resolveTwitterIntegration` + `/api/twitter/exchange`) was already built and correct — OAuth 2.0 + **PKCE**, exchange returns `access_token` + `refresh_token` + `@username`. The only change: it now **returns the `refresh_token`** (was discarded).
- **Token model:** X access tokens last **~2h**; the **refresh token rotates on every use** (each refresh invalidates the old one). So the publish route **always refreshes first**, then returns the **new** refresh token, and the caller must persist it.
- **Where the refresh token lives (stopgap):** `setStoredXRefresh/getStoredXRefresh` keep it in **localStorage** keyed by integration id (`ck_x_refresh_<id>`). Also sent to the backend as **`int_refresh_token`** in `saveIntegration` — but the backend must **add an `int_refresh_token` column + allow it on create + return it on read** to actually persist it (told backend; until then localStorage is authoritative, so it's **per-device** — connecting on one device won't let another post). `publishToTwitter` prefers `integration.int_refresh_token` (backend) and falls back to localStorage, overwriting the stored value with the route's rotated token after every post.
- **The publish route** (`/api/twitter/post`): (1) refresh the token; (2) if `image_url`, download it server-side and upload to **X v2 media** (`api.x.com/2/media/upload`, needs the **`media.write`** scope) → `media_id`; (3) create the tweet (v2 `/tweets`, text capped 280, attaching the media). Added `media.write` to the Twitter OAuth scope (`oauth/page.jsx`) — **so users must reconnect on prod** for image tweets; text-only works without it.
- **PublishModal:** `twitter` is now `real:true`; its branch passes `integration.id` + `int_refresh_token` + caption + resolved image (same image-resolution path as FB/IG) to `publishToTwitter`.
- **Caveats (test later):** the **prod-only `REDIRECT_URI`** means connect only completes on `app.creativeklux.com`; the **v2 media upload endpoint/contract is unverified** (if it rejects, text-only still posts); `media.write` requires a **reconnect**; localStorage refresh token is **per-device** until the backend column lands. Env: `NEXT_PUBLIC_TWITTER_CLIENT_ID` + `TWITTER_CLIENT_SECRET` (already listed).

## Pinterest integration

(Added 2026-06-20. Built, **untested** — wiring only.) Pinterest is fully wired: **connect (already worked) + publish + live-fetch**. The cleanest of the social integrations — **image-native**, no video bridge, no multi-step upload.

- **Connect** was already built (`resolvePinterestIntegration` + `/api/pinterest/exchange`) and the OAuth scope **already includes `pins:write`** — posting permission is granted at connect. The exchange immediately refreshes to a long-lived token (30-day access + 1-year refresh). **Env-name fix:** the exchange route read `PINTEREST_ACCESS_TOKEN` but the env has `NEXT_PUBLIC_PINTEREST_ACCESS_TOKEN` — the route now tolerates **either** (`PINTEREST_ACCESS_TOKEN || NEXT_PUBLIC_PINTEREST_ACCESS_TOKEN`), else connect failed with `Basic base64(client_id:undefined)`.
- **No browser CORS** → all calls go through server routes: **`/api/pinterest/pin`** (create), **`/api/pinterest/boards`** (picker), **`/api/pinterest/pins`** (live-fetch list).
- **Publish** (`publishToPinterest`): a pin is an **image on a board**, so a `board_id` is required. Pinterest is image-native — we pass `media_source:{source_type:"image_url", url}` and **Pinterest fetches the public URL itself** (no upload step). `link` = brand url, title = caption's first line (≤100), description = full caption (≤800). **A pin requires an image** — text-only isn't possible.
- **PublishModal:** `pinterest` is `real:true`. When selected, an effect calls `fetchPinterestBoards(int_token)` → populates a **board dropdown** (defaults to the first board); `pinterestIncomplete` disables Publish until a board is chosen. Image resolved via the same path as FB/IG (existing image or rendered-canvas→upload).
- **Live-fetch:** Pinterest branch lists recent pins (`/v5/pins`, `pins:read` already granted) → `type:'social'` so they show on the social Calendar/Publishing pages (all `published` — Pinterest has no API scheduling). `buildAccountsMap` default case already exposes `accounts.pinterest.access_token`.
- **Caveats (test later):** **Trial access** apps can only pin to the **app owner's own account** — full multi-user rollout needs Pinterest **Standard access** (their review), but you can test on your own account now without review; prod-only `REDIRECT_URI`.

## LinkedIn integration

(Added 2026-06-20. **Code-complete but DORMANT behind a flag** — LinkedIn must approve posting first.) The full publish path is written, but **gated by a single const** so it stays off until LinkedIn grants posting access.

- **The one switch: `LINKEDIN_POSTING_ENABLED`** in **`src/(lib)/linkedinConfig.js`** (currently `false`). It controls everything: the OAuth scope, the Publish-modal `real` flag, and (transitively) whether `publishToLinkedIn` is ever reached. **Flip to `true` only after** (1) LinkedIn approves the **"Share on LinkedIn"** product (`w_member_social`) on the app, (2) deploy to prod, (3) users **reconnect** LinkedIn. No other code changes needed.
- **Why the gate:** requesting `w_member_social` in the OAuth scope **before** LinkedIn approves it makes the *connect* itself fail. So `oauth/page.jsx` only appends the scope when the flag is on (`['openid','profile','email']` + optional `w_member_social`). Connect already worked for sign-in (returns `int_id = profile.sub` = the member id) — unchanged.
- **No browser CORS** (like X): posting runs server-side in **`/api/linkedin/post`**. `publishToLinkedIn` (`integration.js`) just calls it. Token is the integration's `int_token` (LinkedIn tokens last ~60 days — no refresh dance like X); author = `urn:li:person:<int_id>`.
- **The route** uses the **REST Posts API** (`api.linkedin.com/rest/posts`, `LinkedIn-Version` from `linkedinConfig.js`, `X-Restli-Protocol-Version: 2.0.0`). Image posts are 3 steps: `images?action=initializeUpload` → PUT the bytes → create post with the image URN. Text-only skips the upload. Returns the post URN from the `x-restli-id` header.
- **PublishModal:** `linkedin.real` is tied to `LINKEDIN_POSTING_ENABLED`, so while the flag is off LinkedIn is just a preview stub (never routes to the publisher). When on, its branch passes `int_token` + `int_id` + caption + resolved image to `publishToLinkedIn`.
- **Caveats (when enabled):** **only posts to a person's own feed** — Company Pages need a *separate* approved product (`w_organization_social` + Community Management API), not built; prod-only `REDIRECT_URI`; the REST Posts API version may need bumping. **Not added to live-fetch** yet (no calendar surfacing).

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

(Heavily expanded 2026-06-17 — Photoroom-style. Now ~2,600 lines.) "Edit a photo" is a **layered editor**. The base product image is the bottom layer; everything else is an **overlay layer** (`layers[]` of `{id,type,x,y,w,h,rotation,hidden,...}`, types: `image | text | shape | path | badge | emoji`). Full **undo/redo** history (debounced snapshot of all edit state). The top tool bar is: **Insert · Brand Kit · Add text · Templates · Backgrounds · Layers · AI Shadows · Resize** (`topTools` array). Each opens a panel in the right rail keyed by `activeTool`.

### Base image is a box model (`imgW`/`imgH`), not a CSS scale
The base product image used to be intrinsic-sized + a CSS `scale()` transform. It is now an **explicit box** in preview px: `imgW`, `imgH` state, positioned absolutely at `canvasSize/2 + posX/posY`, centered before load. `onImageLoad` fits the natural image into ~70% of the canvas and seeds `imgFitRef` (used by the Scale slider, which now uniform-scales the box via `setBaseScale`). A new image (upload/replace) resets `imgW/imgH=null` so it refits. `imgHidden` hides it (Layers panel). **Export reads `imgW/imgH` directly** (no more `imgRef.offsetWidth*scale`).

### 8-direction drag-resize (base image + every layer)
Both the base image and overlay layers render **8 handles** (4 corners + 4 edge midpoints; `HANDLES` array, `handleCursor()`). Shared geometry: **`geomResize(k, dx, dy, start, lockAspect)`** — corners keep aspect when `lockAspect`, edges stretch a single axis, the opposite edge/corner stays anchored. Base image: `onImgResizeDown/Move/Up` (always aspect-locked; syncs `scale` on uniform drags). Layers: `onResizePointerDown(e, layer, k)` (aspect-locked for image/emoji/badge/path; free for text/shape; **text scales `fontSize`** on a corner drag). The old decorative round handle was removed.

### Export
- `renderFrameToCanvas()` paints (optional circular clip `canvasRound`) → canvasBg → base image (box dims, filters/rotate/flip/shadow) → each non-hidden layer. Scale factor `sc = exportSize ? exportSize.w/canvasSize.w : EXPORT_SCALE(2)` — so a **Resize** target produces exact output pixels.
- `renderToCanvas()` is the high-res tight product-crop fallback; `exportBlob()` routes to the frame compositor whenever there are layers / a bg / `canvasRound` / `exportSize` / a non-default canvas size / an **edge-stretched (distorted) base image**, else the crop path.
- **Download** saves a file; **Save** uploads the PNG to the Image Gallery (`uploadImage`).

### The five rebuilt panels (all Photoroom-style)
- **Brand Kit** (`activeTool==='brandit'`, top-tool labelled "Brand Kit") — sections **Import your brand** (URL → `useAuth().sendUrl` → populates logos/colors), **Logos** (click → add as layer; + upload), **Colors** (palettes; click → bg or selected-layer color), **Fonts** (searchable curated `BRAND_FONTS`; add to kit; apply to selected **text** layer). The kit (`kit` state: `{logos, palettes, fonts}`) is **seeded from `activeBrand`** (logo + primary/secondary + fonts) and **persisted to `localStorage` per brand** (`ck_brandkit_<id>`) — backend stores only a single logo/2 colors/font string, so extras are local-only. Fonts load via injected Google Fonts `<link>` (`loadWebFont`/`googleFontHref`); text layers carry **`fontFamily`** (rendered in DOM + canvas export) and an optional **`bgColor`** pill.
- **Add text** (`activeTool==='addtext'`) — "Add text" + searchable **text-style presets** (`TEXT_STYLES`) + brand fonts. Inline contentEditable editing; floating toolbar (bold/size/align/color).
- **Templates** (`activeTool==='templates'`) — searchable, **grouped** (`TEMPLATE_GROUPS`: Classics/Studio/Backgrounds/Filters/Sizes/Profile Pics/Marketplaces) with **rich thumbnails that preview your actual product** on each template. Each item applies a bundle: `bg` / `size` / `round` / filters / layers. **Profile Pics** uses `canvasRound` (circular export clip).
- **Backgrounds** (`activeTool==='backgrounds'`) — **Color tab** (custom `<input type=color>` picker, **brand-kit palettes** from `kit`, curated `NEUTRAL_TONES`/`SOFT_PASTELS`/`VIBRANT_COLORS`, `BG_GRADIENTS`) + **Image tab** (upload→object URL, **Recent uploads** from `myImages`, **Pexels search** via `/api/pexels`, and `BG_LIBRARY` — the **47 verified Pexels IDs in 8 categories** shared with the bg-remover). Quick row: Transparent + Remove bg. All flow through `canvasBg` `{type:'none'|'color'|'gradient'|'image'}`.
- **Resize** (`activeTool==='resize'`) — searchable, **grouped real target sizes** (`RESIZE_GROUPS`: Standard / Social Media / Marketplace), **Custom size**, **Recent** (localStorage `ck_resize_recent`, with clear). **Pick-then-apply**: a row sets `pendingResize` (highlight); the footer **Resize** button commits via `applyResize` → fits the ratio into the preview (`fitPreview`) **and** sets `exportSize` to the true dims (so export is exactly e.g. 1080×1920). Cancel closes.

### Layers panel (`activeTool==='layers'`)
Lists every overlay (front-first) plus the **Product image** at the bottom. Per row: **show/hide** (`toggleLayerHidden` / `imgHidden`), **select**, **bring forward / send backward** (`moveLayer`), **duplicate**, **delete**; the base row has **Replace**. Hidden items (`layer.hidden` / `imgHidden`) are skipped in both preview and export.

- **All shapes are SVG/Path2D** via the shared `VisualSVG` component (preview + canvas) and `drawLayer` (export) — no licensed art; **brand logos deliberately omitted** (trademarked).
- **⚠️ AI tools are dead** — see below.

## Product Photos AI is a dead end (base44 removed)

`src/(lib)/ai-helpers.jsx` (`generateImage` / `uploadFile`) calls **base44** (`base44.integrations.Core.*`), but the SDK is **uninstalled**, no `base44Client`, no appId/key in `.env`. So every AI-generation feature throws/does nothing:
- **Affected:** Virtual Model, Product Staging, Product Tool (Beautifier/Flat Lay/Ghost Mannequin), Background Remover's "Generate AI background", Video Generator upload, PhotoEditor Retouch/Light On/AI-prompt (PhotoEditor's now show graceful "coming soon" toasts).
- **Working without AI:** Background Remover's *core* removal (local `@imgly` WASM), all PhotoEditor non-AI editing.
- **Fix is centralized:** repoint `generateImage`/`uploadFile` to a real **image-in → image-out** service and all the modals revive at once. `redesign`/`involk_llm` are **design/template** generators (brand_details → canvas JSON), **not** image-from-photo — they can't power these.

## Recent significant changes

(Last updated 2026-06-19. Keep this short — a running 3–5 item list is fine.)

- **Pinterest publishing wired (untested)** — the cleanest social integration: **image-native**, no video bridge / no upload step. Connect already worked (scope already had `pins:write`). Added server routes `/api/pinterest/{pin,boards,pins}` (no browser CORS), `publishToPinterest` + `fetchPinterestBoards`, a **board picker** in the Publish modal (pins require a board), `pinterest` is `real:true`, and a live-fetch branch (pins on the social calendar). Fixed the `PINTEREST_ACCESS_TOKEN` vs `NEXT_PUBLIC_PINTEREST_ACCESS_TOKEN` env-name mismatch (route tolerates both). Caveat: **Trial access** pins only to the owner's own account; multi-user needs Pinterest **Standard access** review. See "Pinterest integration".
- **LinkedIn publishing code-complete but DORMANT (flag-gated)** — full path written (OAuth scope, `/api/linkedin/post` server route using the REST Posts API + 3-step image upload, `publishToLinkedIn`, modal branch) but **off behind one const** `LINKEDIN_POSTING_ENABLED` in `src/(lib)/linkedinConfig.js`. LinkedIn requires its **"Share on LinkedIn" (`w_member_social`)** product to be **approved on the app** before the posting scope can even be requested — that's an application/review on LinkedIn's side, not code. Flip the const to `true` after approval + deploy + reconnect; nothing else changes. Person-feed only (Company Pages need a separate approved product). See "LinkedIn integration".
- **YouTube scheduling wired** — the Publish modal's date-picker now allows **Facebook + YouTube** (`SCHEDULABLE`); YouTube scheduled time → `publishAt` (ISO) → `publishToYouTube` uploads the video **private** until then, and it surfaces as `scheduled` on the calendar. IG/X have no native API scheduling.
- **X (Twitter) publishing wired (untested)** — connect already worked; added the publish path. **X has no browser CORS**, so posting runs **server-side** via the new BFF route `/api/twitter/post` (refresh 2h token → optional v2 media upload → create tweet), called by `publishToTwitter`; `twitter` is now `real:true`. X **rotates the refresh token** every refresh, kept in **localStorage** (`ck_x_refresh_<id>`) as a stopgap + sent to backend as `int_refresh_token` (backend must add the column to persist — told backend; localStorage is per-device until then). Image tweets need the new **`media.write`** scope → **reconnect on prod**. See "X (Twitter) integration".
- **YouTube integration wired (connect + publish + live-fetch, untested)** — fixed the broken connect (Google **code flow** wasn't exchanged — now goes through `/api/google/exchange` like google_ads, resolves the channel). Publish bridges the image-vs-video gap: `imageUrlToVideoBlob` turns a still into a ~5s `.webm` in-browser (canvas + `MediaRecorder`), then `publishToYouTube` does YouTube's resumable upload; `youtube` is now `real:true`. `fetchLivePostsFromConnectedAccounts` lists the channel's uploads (scheduled vs published). See "YouTube integration" — env gotcha: don't set a separate `NEXT_PUBLIC_YOUTUBE_CLIENT_ID`.
- **Meta Ads publishing built (real, frontend-only)** — `publishToMetaAds` now runs the full chain **campaign → ad set → creative → ad**, all from the browser (Graph API ad endpoints work client-side — no backend needed, surprisingly). `PublishModal` shows a **minimal ad form** (Goal / Daily budget / Run-days / Country) when `meta_ads` is picked; `meta_ads` is now `real:true`. Ad **goes live immediately** (status ACTIVE — spends real money). Key details: uses `link_data.picture` (the public image URL) instead of `/adimages` upload; campaign sends `is_adset_budget_sharing_enabled:false`; resolves the **FB Page id from the connected `facebook` integration** (ads run as a Page); budget floor `MIN_AD_BUDGET=2000` (clears NGN min, but currency-naïve). Added `ads_management`+`pages_show_list` to the `meta_ads` OAuth scope (was only `ads_read` — can't create). See "Meta Ads publishing".
- **Ads calendar/publishing fixed + both publishing pages sort newest→oldest** — `ads-calendar` was fully broken (`const { integrations } = useAuth()` — AuthContext never exposes `integrations`, only `socialAccounts` — so it always passed `[]` → no live ads). Now fetches via `fetchIntegrations()`. Both ads pages got the same live-authoritative merge as the social pages; paused Meta campaigns now use `created_time` as `scheduled_at` so they appear on the calendar. Social + ads Publishing lists now sort by date descending.
- **Facebook scheduling (frontend-only) + socials data-flow rewrite** — `PublishModal` Schedule button opens an inline date/time picker (10 min–6 months); `publishToFacebook` now takes optional `scheduled_publish_time` (adds `published:false` → FB holds & posts it, no backend). Calendar + Publishing pages now treat **live Facebook as authoritative** for status (scheduled posts come live-only from `/scheduled_posts`, never cached) — fixed stale "scheduled-never-flips-to-published". See "Social scheduling, publishing & calendar data flow". **Instagram can't schedule** (no native API — needs a backend).
- **Instagram publishing wired end-to-end** — `instagram_content_publish` scope was **missing** from the *active* OAuth file (`oauth/page.jsx`; the dormant `oauth.js` had it — two-file trap), now added. IG connect page-picker filtered to IG-linked Pages, saves `@username` as `int_name`. Publish path (`publishToInstagram`, container→publish) is correct. ⚠️ OAuth `REDIRECT_URI` is **hardcoded to prod** so connect only completes on `app.creativeklux.com`; and a restricted/new IG account returns Graph error **`code 25 / subcode 2207050` "The Instagram account is restricted"** (account-status issue, not code).
- **Publish modal rebuilt + made real for canvas designs** — two-view, category-aware flow (tile picker → edit-in-place platform-native preview). Renders the real creative (image or canvas via `DesignCanvas`/`renderDesignToFile`), snapshots canvas designs to PNG → `uploadImage` → publishes the URL. Headline caption renders UPPERCASE (real `.toUpperCase()` at publish, not just CSS). External design images routed through `/api/proxy-image` so canvas export isn't CORS-tainted. See the "Publish (My Creations → `PublishModal`)" quirk.
- **Creative category badges fixed** — `saveDesign(brandId, variations, creativeType)` was hardcoded `"ads"` from all save surfaces. Now threads the real type (`isAds?'ads':'social'` / `selectedCreative` / `?creative=`). **Existing rows stay mis-tagged** — only new saves correct.
- **Quota / rate-limit errors surfaced cleanly** — `classifyResult` detects 429/quota (incl. OpenAI-429-wrapped-in-500) → friendly message. Custom `Toast` pauses auto-close on hover.

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
