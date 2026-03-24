import { useState, useEffect, useRef } from "react";
import type { Route } from "./+types/home";
import { Link } from "react-router";
import { CioResultCard } from "~/components/CioResultCard";
import { CATEGORIES } from "~/lib/categories";
import { getCioClient, CIO_SECTION } from "~/lib/cio-client";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Beauty Blog | Makeup Tips, Tutorials & Trends" },
    {
      name: "description",
      content:
        "Tips, tutorials, and trends in makeup, skincare, and all things beauty — for every skill level and budget.",
    },
  ];
}

interface CioResult {
  value: string;
  data?: Record<string, any>;
  result_id?: string;
}

export default function Home() {
  const tags = CATEGORIES;

  const [results, setResults] = useState<CioResult[]>([]);
  const [featured, setFeatured] = useState<CioResult | null>(null);
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

    cio.recommendations
      .getRecommendations("popular-content", {
        numResults: 10,
        section: CIO_SECTION,
      })
      .then((res) => {
        if (thisRequestId !== requestIdRef.current) return;

        const response = res.response as {
          results: CioResult[];
          total_num_results: number;
          pod: { id: string; display_name: string };
        };

        if (response.results.length > 0) {
          setFeatured(response.results[0]);
          setResults(response.results.slice(1));
        }
        setLoading(false);
      })
      .catch((err) => {
        if (thisRequestId !== requestIdRef.current) return;
        console.error("[CIO Recommendations Error]", err);
        setLoading(false);
        setError(`Recommendations request failed: ${err.message || "Unknown error"}`);
      });
  }, []);

  return (
    <div>
      {/* Hero / Featured Article */}
      {featured && (
        <section className="relative bg-stone-900 rounded-3xl mb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-stone-800/50 to-transparent" />
          <div className="relative px-8 py-20 md:py-28 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-400 mb-4 font-light">
              Featured
            </p>
            <h1 className="text-3xl md:text-5xl font-light text-white mb-4 tracking-tight">
              {featured.value}
            </h1>
            {featured.data?.description && (
              <p className="text-lg text-stone-300 mb-8 max-w-2xl mx-auto font-light">
                {featured.data.description}
              </p>
            )}
            {featured.data?.tags && (
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {(Array.isArray(featured.data.tags)
                  ? featured.data.tags
                  : typeof featured.data.tags === "string"
                    ? featured.data.tags.split(",").map((t: string) => t.trim())
                    : []
                ).map((tag: string) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 border border-stone-600 text-stone-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <Link
              to={featured.data?.url || `/blog/${featured.data?.id}`}
              className="inline-block px-10 py-4 bg-white text-stone-900 font-medium tracking-wide hover:bg-stone-100 transition-all duration-300"
            >
              Read Article
            </Link>
          </div>
        </section>
      )}

      {/* Loading hero placeholder */}
      {loading && (
        <section className="bg-stone-900 rounded-3xl mb-12 overflow-hidden">
          <div className="px-8 py-20 md:py-28 flex items-center justify-center">
            <svg
              className="animate-spin h-8 w-8 text-stone-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        </section>
      )}

      {/* Browse by Topic */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-stone-800 tracking-wide">
            Browse by Topic
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              to={`/blog/tag/${tag}`}
              className="group relative bg-white border border-stone-200 rounded-full px-5 py-2 text-sm text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-all duration-300"
            >
              {tag}
            </Link>
          ))}
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Popular Articles Grid */}
      {!loading && results.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xl font-medium text-stone-800 tracking-wide mb-6">
            Popular Articles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, i) => (
              <CioResultCard
                key={result.data?.id || result.value}
                result={result}
                index={i}
              />
            ))}
          </div>
        </section>
      )}

      {/* Loading grid placeholder */}
      {loading && (
        <section className="mb-16">
          <h2 className="text-xl font-medium text-stone-800 tracking-wide mb-6">
            Popular Articles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-stone-100" />
                <div className="p-5 space-y-3">
                  <div className="flex gap-2">
                    <div className="h-4 w-16 bg-stone-100 rounded-full" />
                    <div className="h-4 w-12 bg-stone-100 rounded-full" />
                  </div>
                  <div className="h-5 w-3/4 bg-stone-100 rounded" />
                  <div className="h-4 w-full bg-stone-100 rounded" />
                  <div className="h-4 w-2/3 bg-stone-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* No results */}
      {!loading && !error && results.length === 0 && !featured && (
        <div className="text-center py-20">
          <p className="text-stone-400 text-lg mb-2">No articles found</p>
          <p className="text-stone-400 text-sm">
            Content may not be ingested yet.
          </p>
        </div>
      )}
    </div>
  );
}
