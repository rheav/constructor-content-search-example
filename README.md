# Constructor Content Search Demo

A beauty blog demo showcasing [Constructor's](https://constructor.io) **Content Search** capabilities. Every piece of content on this site — from the homepage recommendations to search results, tag browsing, and article pages — is powered entirely by Constructor's API. There is no local data; the app is a pure frontend that talks directly to Constructor.

**[Live Demo](https://rheav.github.io/constructor-content-search-example/)**

## What This Demonstrates

Constructor is known for product search and discovery, but its platform also supports **content search** — articles, blog posts, tutorials, guides, and any non-product content. This demo shows how to build a full content experience using Constructor's JavaScript Client SDK with a custom `"Content"` section.

### Constructor Features Used

| Feature | How It's Used |
|---|---|
| **Autocomplete** | Real-time search suggestions with article previews in a mini grid |
| **Search** | Full-text search results with facets and result tracking |
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
- **Constructor.io JS SDK** — All data fetching, autocomplete, search, browse, recommendations, tracking
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
2. Ingest the catalog files from `catalog/` into your Constructor dashboard under a `"Content"` section
3. Create a recommendations pod named `"popular-content"` and slot some articles
4. Make the following fields displayable and facetable: `url`, `image_url`, `description`, `author`, `date`, `tags`, `keywords`, `article_content`

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
