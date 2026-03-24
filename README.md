# Constructor Content Search Demo

A beauty blog demo showcasing [Constructor's](https://constructor.io/) **Content Search** capabilities. Every piece of content on this site — from the homepage recommendations to search results, tag browsing, and article pages — is powered entirely by Constructor's API. There is no local data; the app is a pure frontend that talks directly to Constructor.

[**Live Demo**](https://rheav.github.io/constructor-content-search-example/)

## What This Demonstrates

Constructor is known for product search and discovery, but its platform also supports **content search** — articles, blog posts, tutorials, guides, and any non-product content. This demo shows how to build a full content experience using Constructor's JavaScript Client SDK with a custom `"Content"` section.

> **Note:** Custom sections like `"Content"` are not self-service. They must be created by the Constructor team on your behalf. Contact your Constructor representative or support to have a content section provisioned before following the setup steps below.

### Constructor Features Used

| Feature | How It's Used |
|---|---|
| **Autocomplete** | Real-time search suggestions with article previews in a mini grid |
| **Search** | Full-text content search results with facets and result tracking |
| **Browse** | Tag-based content browsing (e.g. "Skincare", "Tutorials") |
| **Browse by Item ID** | Individual article detail pages |
| **Recommendations** | Homepage "Popular Content" pod with slotted items |
| **Behavioral Tracking** | Search submits, result clicks, browse loads, item detail views, input focus |

### How It Works

All data flows through the [`@constructor-io/constructorio-client-javascript`](https://www.npmjs.com/package/@constructor-io/constructorio-client-javascript) SDK. The app uses a single shared client instance configured with a `"Content"` section (instead of the default `"Products"` section), which tells Constructor to query the content catalog.

```
User types in search bar
  → cio.autocomplete.getAutocompleteResults()
  → Shows suggestions + article cards in animated dropdown

User submits search
  → cio.search.getSearchResults(query, { section: "Content" })
  → Renders results grid with facets

User clicks a tag
  → cio.browse.getBrowseResults("tags", tagName, { section: "Content" })
  → Renders filtered article grid

User opens an article
  → cio.browse.getBrowseResultsForItemIds([slug], { section: "Content" })
  → Renders full article with related content

Homepage loads
  → cio.recommendations.getRecommendations("popular-content", { section: "Content" })
  → Renders featured hero + article grid
```

Every interaction is tracked via `cio.tracker.*` methods, which feed back into Constructor's AI for ranking and personalization.

## Tech Stack

- **React Router 7** — SPA mode with client-side routing
- **[Constructor.io JS SDK](https://www.npmjs.com/package/@constructor-io/constructorio-client-javascript)** — All data fetching: autocomplete, search, browse, recommendations, tracking
- **Tailwind CSS v4** — Styling
- **Motion (Framer Motion)** — Page transitions and staggered card animations
- **TypeScript** — Full type safety

## Project Structure

```
app/
  components/
    SearchBar.tsx        # Autocomplete with animated mini grid dropdown
    CioResultCard.tsx    # Reusable article card with motion animations
    Navbar.tsx           # Navigation with integrated search
    Footer.tsx           # Footer with topic tags
    PageTransition.tsx   # Smooth page transitions
  lib/
    cio-client.ts        # Constructor.io client singleton
    categories.ts        # Shared category constants
  routes/
    home.tsx             # Homepage with recommendations
    search.tsx           # Search results page
    tag.tsx              # Tag browse page
    article.tsx          # Article detail page
catalog/
  items.jsonl            # 40 beauty articles for Constructor ingestion
  item_groups.jsonl      # 14 content groups (categories)
```

## Running Locally

```bash
npm install
npm run dev
```

The app uses a demo Constructor API key. To use your own:

1. Update the key in `app/lib/cio-client.ts`
2. **Have Constructor provision a `"Content"` section** on your account (this is not self-service)
3. Ingest the catalog files from `catalog/` into your Constructor dashboard under the `"Content"` section
4. Create a recommendations pod named `"popular-content"` and slot some articles
5. Configure field searchabilities using the API — see [Configuring Field Searchabilities](#configuring-field-searchabilities) below

## Configuring Field Searchabilities

After ingesting your catalog, you need to configure **searchabilities** so that Constructor knows which fields should be searchable, displayable, and facetable. This is a critical step — without it, the API responses won't include the metadata needed to render article cards, detail pages, or filter facets.

Use the [Create or Update Searchabilities](https://docs.constructor.com/reference/v1-searchabilities-create-or-update-searchabilities) endpoint to configure all fields at once.

### Authentication

The searchabilities endpoint requires authentication. You can use either:

- **HTTP Basic Auth:** Your API token as the username, with an empty password
- **Bearer Token:** A token with the `searchabilities(w)` scope

### Request

```
PATCH https://ac.cnstrc.com/v1/searchabilities?section=Content
```

> **Important:** Use `PATCH`, not `PUT`. And make sure to include `?section=Content` in the query string so the searchabilities are applied to the Content section, not the default Products section.

**Request body:**

```json
{
  "searchabilities": [
    {
      "name": "url",
      "fuzzy_searchable": false,
      "exact_searchable": false,
      "facetable": false,
      "displayable": true,
      "hidden": false
    },
    {
      "name": "image_url",
      "fuzzy_searchable": false,
      "exact_searchable": false,
      "facetable": false,
      "displayable": true,
      "hidden": false
    },
    {
      "name": "description",
      "fuzzy_searchable": false,
      "exact_searchable": false,
      "facetable": false,
      "displayable": true,
      "hidden": false
    },
    {
      "name": "author",
      "fuzzy_searchable": true,
      "exact_searchable": false,
      "facetable": true,
      "displayable": true,
      "hidden": false
    },
    {
      "name": "date",
      "fuzzy_searchable": false,
      "exact_searchable": false,
      "facetable": true,
      "displayable": true,
      "hidden": false
    },
    {
      "name": "tags",
      "fuzzy_searchable": true,
      "exact_searchable": false,
      "facetable": true,
      "displayable": true,
      "hidden": false
    },
    {
      "name": "keywords",
      "fuzzy_searchable": true,
      "exact_searchable": false,
      "facetable": true,
      "displayable": true,
      "hidden": false
    },
    {
      "name": "article_content",
      "fuzzy_searchable": false,
      "exact_searchable": false,
      "facetable": false,
      "displayable": true,
      "hidden": false
    }
  ]
}
```

> **Why is `description` not facetable?** Free-text fields like `description` produce extremely high-cardinality facets (every article has a unique description), which makes them useless as filters. Use structured fields like `tags`, `author`, or `date` for facets instead.

### What each setting does

| Setting | Purpose |
|---|---|
| **`displayable: true`** | The field is returned in API responses. Required for rendering any field on the frontend (images, descriptions, author names, etc.). Without this, the field is stored but never sent to the client. |
| **`facetable: true`** | The field can be used as a filter/facet in search and browse results. Enables filtering by author, tags, date, etc. Best for structured or low-cardinality fields. |
| **`fuzzy_searchable: true`** | The field's content is included in fuzzy text search. When a user searches for "skincare tips", Constructor will match against these fields even with typos. Best for human-readable text like `tags`, `keywords`, and `author`. |
| **`exact_searchable: true`** | The field is matched only on exact terms. Useful for structured identifiers. |
| **`hidden: false`** | The field is visible in the Constructor dashboard. Set to `true` for internal-only fields you don't want cluttering the UI. |

### Why this matters

By default, custom fields in your catalog are **not displayable and not searchable**. If you skip this step:

- Article cards will render without images, descriptions, or author names (the data simply won't be in the API response)
- Search won't match against tags or keywords, only the item name
- Browse filters and facets won't work
- Article detail pages will be mostly empty

This is a one-time setup per section. Once configured, all future catalog ingestions for the `Content` section will respect these settings.

> **Dashboard limitation:** Searchabilities for custom sections like `"Content"` can only be configured via the API. The Constructor dashboard UI currently only supports the default `"Products"` section for searchability management.

### Recommended Additional Metadata Fields

If you expand this demo, consider adding these fields to your catalog items, which are commonly used in Constructor content implementations:

| Field | Purpose |
|---|---|
| `content_type` | Categorize content (e.g. "article", "tutorial", "guide") |
| `headline` | Short headline for card/preview display |
| `subheadline` | Secondary headline or subtitle |
| `summary_description` | Brief summary for search result snippets |
| `publish_date` | Sortable publish date (enables sort-by-date) |
| `content_source` | Origin of the content (e.g. "blog", "help center") |

## Catalog Format

The `catalog/` directory contains JSONL files ready for ingestion into Constructor:

**items.jsonl** — Each line is an article with fields like:
```json
{
  "item_name": "How to Contour Like a Pro",
  "id": "how-to-contour-like-a-pro",
  "data": {
    "url": "/blog/how-to-contour-like-a-pro",
    "image_url": "https://images.unsplash.com/...",
    "description": "...",
    "tags": ["Tutorials", "Face"],
    "author": "Mia Chen",
    "date": "2024-11-15",
    "keywords": ["contour", "sculpt", "face shape"],
    "article_content": "...",
    "group_ids": ["beauty-blog", "tutorials", "face"]
  }
}
```

**item_groups.jsonl** — Category hierarchy:
```json
{"name": "Beauty Blog", "id": "beauty-blog", "data": {"parent_ids": []}}
{"name": "Tutorials", "id": "tutorials", "data": {"parent_ids": ["beauty-blog"]}}
```

## License

MIT
