# Constructor mini beacon — design

**Date:** 2026-07-02
**Status:** implemented

## Problem

The app annotates its DOM with Constructor's `data-cnstrc-*` attributes on every
route (search, browse/tag, article/PDP, home recommendations, autosuggest). Those
attributes are the data-driven tracking contract, but nothing reads them:
`root.tsx` set `window.cnstrc.indexKey` and left a TODO to load the customer
beacon script. Result: zero behavioral events fired.

We want our own small, transparent beacon that reads those same attributes and
fires `cio.tracker.*` events, so the tracking is (a) working and (b) readable
code you can follow, rather than an opaque third-party script.

## Approach

Build our own data-driven beacon in-repo. A single mounted component scans the
DOM for `data-cnstrc-*` containers and items, maps them to the matching
`cio.tracker.*` call, and fires. Non-destructive: existing JSX attributes are
untouched; the beacon is the sole consumer of them.

Rejected alternatives:
- Load Constructor's opaque customer beacon script (not readable / not the ask).
- Per-component manual `tracker.*` calls in every route (invasive, duplicative,
  drifts from the attribute contract).

## Architecture

```
app/
  lib/
    cio-beacon.types.ts   # attr shapes + window.cnstrc.purchaseData type
    cio-beacon.ts         # scan attrs -> map -> tracker calls; dedupe; debug log
  components/
    CioBeacon.tsx         # mounts observer + one delegated click listener
```

- `CioBeacon` is mounted once in `root.tsx` (alongside the existing highlighter).
- **Load / view events**: a `MutationObserver` (debounced 250ms) plus a
  route-change effect re-scan the DOM. Each populated container fires its load
  event once, deduped by `kind + resultId + numResults + page`.
- **Click events**: one delegated `click` listener on `document` resolves the
  clicked element to a CTA button, an autosuggest item, or a result item inside
  a tracked container, and fires the matching click/select/conversion event.
- **Purchase**: if `window.cnstrc.purchaseData` is present, fire `trackPurchase`
  once. (No commerce in this blog; wired for completeness / demo.)
- **Debug**: set `localStorage['cnstrc-beacon-debug'] = 'true'` to log every
  event and its payload to the console.

## Event map

| Trigger (DOM) | tracker method |
|---|---|
| `data-cnstrc-search` container populated | `trackSearchResultsLoaded` |
| `data-cnstrc-browse` container populated | `trackBrowseResultsLoaded` |
| `data-cnstrc-recommendations` container populated | `trackRecommendationView` |
| `data-cnstrc-product-detail` present | `trackItemDetailLoad` |
| click item in search container | `trackSearchResultClick` |
| click item in browse container | `trackBrowseResultClick` |
| click item in recs container | `trackRecommendationClick` |
| click `[data-cnstrc-item-section]` in autosuggest | `trackAutocompleteSelect` |
| click `[data-cnstrc-btn]` | `trackConversion` (type = btn value) |
| `window.cnstrc.purchaseData` set | `trackPurchase` |

Method signatures verified against `@constructor-io/constructorio-client-javascript`
v2.77.0 (installed) and the tracker module docs.

## Deduplication

- Load/view events keyed by `kind:resultId:numResults:page`, tracked in a
  module-level `Set`. Cleared on route change (`resetBeaconDedup`) so a new
  page's results fire.
- Purchase fires at most once per page load.
- Containers only fire once they actually contain items (or are a confirmed
  `data-cnstrc-zero-result` page), avoiding mid-load firing.

## Testing / verification

Verified in-browser (Playwright, dev server). With the debug flag on, a real
search → click-through flow logged, in order and with correct payloads:
`trackSearchResultsLoaded` (15 results) → `trackSearchResultClick` (term +
resultId) → `trackItemDetailLoad` → `trackBrowseResultsLoaded` (related, 3,
section Content). Home logged `trackRecommendationView` (9 results).

Note on network sends: Constructor's client gates the outgoing `/behavior`
request behind a humanity check (`navigator.webdriver`, bot user-agents, and a
`_constructorio_is_human` session flag set only on a trusted human input event).
In an automated browser those requests are suppressed by the SDK, not by our
beacon. Our beacon's job ends at calling `cio.tracker.*`; transport and the
human/bot gate are owned by the client library. In a real browser session the
events send normally.
