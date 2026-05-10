# DocSearch Analytics Event Dictionary (GA4)

This document defines the event tracking contract implemented in `public/scripts/docsearch-analytics.js`. Payloads are aligned with **Google Analytics 4** (`gtag`) recommended naming where practical.

## Why parameters like `query` do not appear in GA reports

GA4 **collects** arbitrary event parameters, but **does not show most of them** in built‑in reports unless you register them.

To use parameters in Explorations, audiences, or reports:

1. GA4 Admin → **Data display** → **Custom definitions** → **Custom dimensions**
2. Create a dimension with **Scope: Event**
3. Set **Event parameter** to the exact name sent in code (e.g. `search_term`, `content_title`)

Until then, you can still verify raw delivery in **Admin → DebugView** (with debug mode) or **Realtime** (limited detail).

See Google’s documentation: [Custom dimensions and metrics](https://support.google.com/analytics/answer/10075209).

## Scope

- Tracking target: Starlight DocSearch (Typesense-backed UI)
- Transport:
  - Primary: `window.gtag("event", eventName, payload)`
  - Fallback (before `gtag` loads): `window.dataLayer.push({ event: eventName, ...payload })`

## Event List

### `docsearch_open`

Tracks opening intent or actual modal visibility.

**When it fires**

- User clicks the search trigger (`.DocSearch-Button`)
- User presses `Meta/Ctrl + K`
- Search modal mounts (`.DocSearch-Modal`)

**Payload fields**

- `method` (`string`)
  - `search_button`
  - `keyboard_shortcut`
  - `modal_visible`

**Example**

```json
{
  "method": "search_button"
}
```

---

### `search` (GA4 recommended)

Tracks the query typed in DocSearch. Uses the GA4 recommended **`search`** event with **`search_term`**.

**When it fires**

- User types in `#docsearch-input`
- Debounced by `500ms`
- Empty `search_term` after normalization is ignored

**Payload fields**

- `search_term` (`string`): normalized input (`trim`, max `64` chars)
- `query_length` (`number`): length of `search_term` (auxiliary; requires a custom dimension if you want it in reports)

**Example**

```json
{
  "search_term": "quickly",
  "query_length": 7
}
```

---

### `select_content` (GA4 recommended)

Tracks a click on a DocSearch result row link.

**When it fires**

- User clicks `.DocSearch-Hit a`

**Payload fields**

- `content_type` (`string`): always `docsearch_result`
- `content_id` (`string`): clicked URL (same as `href`)
- `search_term` (`string`): latest query in the current modal session (may be empty)
- `content_title` (`string`): visible title from `.DocSearch-Hit-title`
- `item_list_index` (`number`, optional): parsed from `docsearch-item-{n}` (0‑based)

**Example**

```json
{
  "content_type": "docsearch_result",
  "content_id": "https://word.lovejade.cn/words/quickly/#_top",
  "search_term": "quickly",
  "content_title": "Quickly",
  "item_list_index": 0
}
```

## Suggested GA4 custom dimensions

Register **event-scoped** custom dimensions for parameters you need in reporting:

| Event parameter    | Suggested dimension name   | Used in events                          |
| ------------------ | -------------------------- | --------------------------------------- |
| `method`           | DocSearch open method      | `docsearch_open`                        |
| `search_term`      | DocSearch term             | `search`, `select_content`              |
| `query_length`     | DocSearch term length      | `search`                                |
| `content_title`    | DocSearch result title     | `select_content`                        |
| `content_id`       | DocSearch result URL       | `select_content`                        |
| `item_list_index`  | DocSearch result position  | `select_content`                        |

## Data quality notes

- Search input is debounced to reduce noise.
- `search_term` is normalized and capped at 64 characters.
- When the modal closes, in-memory `latestQuery` is cleared.
- A global guard prevents duplicate listeners if the script loads twice.

## Maintenance checklist

- If DocSearch DOM/class names change, update selectors in code and this document.
- When renaming events or parameters, update GA4 custom definitions and any GTM triggers.
