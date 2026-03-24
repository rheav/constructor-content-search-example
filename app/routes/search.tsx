import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/search";
import { getCioClient, CIO_SECTION } from "~/lib/cio-client";
import { CioResultCard } from "~/components/CioResultCard";

export function meta({ location }: Route.MetaArgs) {
  return [
    { title: "Search | Beauty Blog" },
    { name: "description", content: "Search beauty articles, tutorials, and tips." },
  ];
}

interface CioResult {
  value: string;
  data?: {
    id?: string;
    url?: string;
    image_url?: string;
    description?: string;
    tags?: string[];
    author?: string;
    date?: string;
    [key: string]: any;
  };
  result_id?: string;
}

interface SearchState {
  results: CioResult[];
  totalResults: number;
  facets: any[];
  resultId: string | null;
  page: number;
  loading: boolean;
  error: string | null;
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const requestIdRef = useRef(0);

  const [state, setState] = useState<SearchState>({
    results: [],
    totalResults: 0,
    facets: [],
    resultId: null,
    page: 1,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!query.trim()) {
      setState((s) => ({ ...s, results: [], totalResults: 0, facets: [], loading: false, error: null }));
      return;
    }

    const cio = getCioClient();
    if (!cio) {
      setState((s) => ({ ...s, loading: false, error: "Constructor.io client not available." }));
      return;
    }

    const thisRequestId = ++requestIdRef.current;
    setState((s) => ({ ...s, loading: true, error: null }));

    cio.search
      .getSearchResults(query, {
        section: CIO_SECTION,
        resultsPerPage: 20,
        page: 1,
      })
      .then((res) => {
        // Discard stale responses
        if (thisRequestId !== requestIdRef.current) return;

        // Handle redirect rules
        if (res.response && "redirect" in res.response) {
          window.location.href = (res.response as any).redirect.data.url;
          return;
        }

        const response = res.response as {
          results: CioResult[];
          facets: any[];
          total_num_results: number;
        };

        // Track search results loaded
        cio.tracker.trackSearchResultsLoaded(query, {
          url: window.location.href,
          items: response.results.map((r) => ({
            itemName: r.value,
            itemId: r.data?.id,
          })),
          resultCount: response.total_num_results,
          resultPage: 1,
          resultId: res.result_id,
          section: CIO_SECTION,
        });

        setState({
          results: response.results,
          totalResults: response.total_num_results,
          facets: response.facets || [],
          resultId: res.result_id,
          page: 1,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (thisRequestId !== requestIdRef.current) return;
        console.error("[CIO Search Error]", err);
        setState((s) => ({
          ...s,
          results: [],
          totalResults: 0,
          loading: false,
          error: `Search request failed: ${err.message || "Unknown error"}`,
        }));
      });
  }, [query]);

  const handleResultClick = (result: CioResult) => {
    const cio = getCioClient();
    if (cio && result.data?.id) {
      cio.tracker.trackSearchResultClick(query, {
        itemName: result.value,
        itemId: result.data.id,
        resultId: result.result_id,
        section: CIO_SECTION,
      });
    }
  };

  const noResults = !state.loading && query.trim() && state.results.length === 0 && !state.error;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <nav className="mb-4 text-sm text-stone-400">
          <Link to="/" className="hover:text-stone-600 transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-stone-600">Search</span>
        </nav>
        {query ? (
          <h1 className="text-3xl font-semibold text-stone-900 mb-2">
            <span className="text-stone-400 font-normal">Results for </span>
            &ldquo;{query}&rdquo;
          </h1>
        ) : (
          <h1 className="text-3xl font-semibold text-stone-900 mb-2">Search</h1>
        )}
        {!state.loading && query && !state.error && (
          <p className="text-stone-500">
            {state.totalResults} result{state.totalResults !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* Error banner */}
      {state.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Loading */}
      {state.loading && (
        <div className="flex items-center justify-center py-20">
          <svg
            className="animate-spin h-8 w-8 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {/* Facets */}
      {!state.loading && state.facets.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {state.facets
            .filter((f: any) => f.options?.length > 0)
            .slice(0, 3)
            .map((facet: any) => (
              <div key={facet.name} className="flex flex-wrap gap-1.5">
                {facet.options.slice(0, 5).map((opt: any) => (
                  <span
                    key={opt.value}
                    className="text-xs px-3 py-1 bg-stone-100 text-stone-600 rounded-full"
                  >
                    {opt.display_name} ({opt.count})
                  </span>
                ))}
              </div>
            ))}
        </div>
      )}

      {/* Results */}
      {!state.loading && state.results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.results.map((result, i) => (
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
      {noResults && (
        <div className="text-center py-20">
          <p className="text-stone-400 text-lg mb-2">No results found</p>
          <p className="text-stone-400 text-sm">
            Try a different search term or{" "}
            <Link to="/" className="text-stone-600 underline hover:text-stone-800">
              browse all articles
            </Link>
          </p>
        </div>
      )}

      {/* Empty state */}
      {!query.trim() && !state.loading && (
        <div className="text-center py-20">
          <p className="text-stone-400 text-lg">
            Type a query to search beauty articles, tutorials, and tips
          </p>
        </div>
      )}
    </div>
  );
}
