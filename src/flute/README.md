# Sidebar / Descent

Open `http://localhost:3000/flute?flute-scene=sidebar-descent` while signed in
as a school administrator. The frontend and existing backend must be running.
The route remains development-only and retains the host authentication rules.

The recipe renders the actual `SchoolAdminDashboard`, with its original data
requests, branding, navigation and root layout. `DashboardPresentation` supplies
optional spatial wrappers; it is an identity wrapper on ordinary app routes.
Academics and Exams start expanded in the scene so every child link participates.

The 14-second shot holds an 18° / 32° / 14° camera orientation inspired by
`public/Screenshot.png`. A single matrix-derived camera rail follows 640 pixels
of the dashboard's local Y axis. Sixteen sidebar leaves start above the surface
and settle in order. The dashboard itself has no animated transform. Camera
focus stays at 395 scene units, with f/6.3, a 75-unit focal length and 5-unit blur
cap. Flute owns the clock, thin-lens blur, playback, seeking and capture.

`author-sidebar.mjs --animate` regenerates the recipe using the installed
`matrixFor`, `multiply` and `reviewAuthoring` APIs. Regeneration replaces the
recipe's cached snapshot; capture again afterward. `npx flute sync` is needed
only when adding or removing recipe/component pairs.

The stock snapshot CLI opens an isolated browser and cannot inherit a signed-in
session. `.flute/authenticated-capture.mjs` runs that same CLI after normal local
login, using `FLUTE_CAPTURE_IDENTIFIER` and `FLUTE_CAPTURE_PASSWORD` from its
process environment. Credentials and cookies remain in memory. For example:

```text
node .flute/authenticated-capture.mjs snapshot --scene sidebar-descent --url http://localhost:3000 --time 3000 --json
```

The recipe contains the generated thumbnail. `.flute/sidebar-descent.png` is a
standalone copy. Both are local rendered pixels, not a replacement for live UI.

Validation: TypeScript passed; authoring review passed without issues or advice;
browser checks covered opening, intermediate travel, final registration, playback
and ordinary navigation. The scene reports 20 unique surfaces, one capture
viewport, and no Flute diagnostics. The shared layout also initializes its
cookie-backed user state after hydration to avoid server/client logo mismatch.

## Analytics / In Motion

Open `http://localhost:3000/flute?flute-scene=analytics-reveal` for the second scene.
It uses `public/dash.png` as its perspective reference. A fixed 12° / 50° / 10°
orientation and a matrix-derived diagonal rail lead from the summary cards down
through trends, distributions, subject/class performance and exam results.
Presentation duration is 20 seconds. The camera stays close to the page while
each analytics panel fades in and settles from its own elevated position.

`AnalyticsPresentation` is a no-animation adapter on normal routes and in the
sidebar scene. The analytics recipe supplies small clock-aware number/chart
adapters, so the data-fetching dashboard does not rerender for every clock tick.
Values come from the original authenticated API requests, with no fixture data.
Each mount reuses its initial request through Strict Mode's effect replay.

Chart `progress` defaults to 1. Line paths reveal through a clip, horizontal bars
grow against their final scale, and donut segments sweep into place. Counts,
chart labels, legends and exam values use the same authored time as the camera.
Zero-valued datasets retain their existing empty state; a nonempty donut at
zero animation progress remains a ring instead of switching to an empty chart.

Run `node src/flute/author-analytics.mjs --animate` to regenerate this recipe.
Use the authenticated capture helper with `--scene analytics-reveal --time 8500`
to refresh the thumbnail. The helper waits for live data and valid scene
diagnostics before invoking Flute's capture seek.

Validation covered TypeScript, chart progress endpoints and intermediate values,
numeric clamping/rounding, empty data, default/final rendering equivalence and
unchanged source data. Browser seeking confirmed the average reaches 23.3%,
line reveal reaches full width, and bars/donuts reach their real totals. The
loaded scene registers 35 surfaces without Flute diagnostics.
