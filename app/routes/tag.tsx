import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router";
import type { Route } from "./+types/tag";
import { CioResultCard } from "~/components/CioResultCard";
import { getCioClient, CIO_SECTION } from "~/lib/cio-client";
import { CATEGORIES } from "~/lib/categories";

export function meta({ params }: Route.MetaArgs) {
  const tag = params.tag;
  if (!tag) {
    return [{ title: "Tag Not Found" }];
  }
  return [
    { title: `${tag} Articles | Beauty Blog` },
    {
      name: "description",
      content: `Browse all articles tagged with ${tag}.`,
    },
  ];
}

interface CioResult {
  value: string;
  data?: Record<string, any>;
  result_id?: string;
}

export default function TagPage() {
  const { tag: tagParam } = useParams();
  const tag = tagParam!;
  const allTags = CATEGORIES;

  const [results, setResults] = useState<CioResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const cio = getCioClient();
    if (!cio) {
      setLoading(false);
      setError("Constructor.io client not available.");
      return;
    }

    const thisRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setResults([]);

    cio.browse
      .getBrowseResults("tags", tag, {
        section: CIO_SECTION,
        resultsPerPage: 20,
      })
      .then((res) => {
        if (thisRequestId !== requestIdRef.current) return;

        const response = res.response as {
          results: CioResult[];
          total_num_results: number;
        };

        cio.tracker.trackBrowseResultsLoaded({
          url: window.location.href,
          filterName: "tags",
          filterValue: tag,
          items: response.results.map((r) => ({
            itemName: r.value,
            itemId: r.data?.id,
          })),
          resultCount: response.total_num_results,
          resultPage: 1,
          resultId: res.result_id,
          section: CIO_SECTION,
        });

        setResults(response.results);
        setTotalCount(response.total_num_results);
        setLoading(false);
      })
      .catch((err) => {
        if (thisRequestId !== requestIdRef.current) return;
        console.error("[CIO Browse Error]", err);
        setLoading(false);
        setError(`Browse request failed: ${err.message || "Unknown error"}`);
      });
  }, [tag]);

  const handleResultClick = (result: CioResult) => {
    const cio = getCioClient();
    if (cio && result.data?.id) {
      cio.tracker.trackBrowseResultClick({
        filterName: "tags",
        filterValue: tag,
        itemId: result.data.id,
        itemName: result.value,
        resultId: result.result_id,
        section: CIO_SECTION,
      });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <nav className="mb-4 text-sm text-stone-400">
          <Link to="/" className="hover:text-stone-600 transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-stone-600">{tag}</span>
        </nav>
        <h1 className="text-3xl font-semibold text-stone-900 mb-2">
          <span className="text-stone-400 font-normal">Tagged: </span>
          {tag}
        </h1>
        {!loading && !error && (
          <p className="text-stone-500">
            {totalCount} article{totalCount !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Other Tags */}
      <div className="flex flex-wrap gap-2 mb-10">
        {allTags.map((t) => (
          <Link
            key={t}
            to={`/blog/tag/${t}`}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              t === tag
                ? "bg-stone-900 text-white border-stone-900"
                : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <svg
            className="animate-spin h-6 w-6 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result, i) => (
            <CioResultCard
              key={result.data?.id || result.value}
              result={result}
              onClick={() => handleResultClick(result)}
              index={i}
            />
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && !error && results.length === 0 && (
        <div className="text-center py-20">
          <p className="text-stone-400 text-lg mb-2">No results found</p>
          <p className="text-stone-400 text-sm">
            No articles found for this tag. Content may not be ingested yet.
          </p>
        </div>
      )}
    </div>
  );
}
