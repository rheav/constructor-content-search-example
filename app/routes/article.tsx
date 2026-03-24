import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router";
import type { Route } from "./+types/article";
import { getCioClient, CIO_SECTION } from "~/lib/cio-client";
import { CioResultCard } from "~/components/CioResultCard";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `${params.slug || "Article"} | Beauty Blog` },
    { name: "description", content: "Read this article on Beauty Blog." },
  ];
}

interface CioItem {
  value: string;
  data?: {
    id?: string;
    url?: string;
    image_url?: string;
    description?: string;
    tags?: string[] | string;
    author?: string;
    date?: string;
    keywords?: string[];
    [key: string]: any;
  };
  result_id?: string;
}

export default function ArticlePage() {
  const { slug: slugParam } = useParams();
  const slug = slugParam!;

  const [article, setArticle] = useState<CioItem | null>(null);
  const [related, setRelated] = useState<CioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // Fetch article via CIO browse items
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
    setArticle(null);
    setRelated([]);

    cio.browse
      .getBrowseResultsForItemIds([slug], {
        section: CIO_SECTION,
      })
      .then((res) => {
        if (thisRequestId !== requestIdRef.current) return;

        const response = res.response as {
          results: CioItem[];
          total_num_results: number;
        };

        if (response.results.length === 0) {
          setError("Article not found.");
          setLoading(false);
          return;
        }

        const item = response.results[0];
        setArticle(item);

        // Track item detail load
        cio.tracker.trackItemDetailLoad({
          itemName: item.value,
          itemId: item.data?.id || slug,
          url: window.location.href,
        });

        // Fetch related articles by first tag
        const tags = Array.isArray(item.data?.tags)
          ? item.data.tags
          : typeof item.data?.tags === "string"
            ? item.data.tags.split(",").map((t: string) => t.trim())
            : [];

        if (tags.length > 0) {
          cio.browse
            .getBrowseResults("tags", tags[0], {
              section: CIO_SECTION,
              resultsPerPage: 4,
            })
            .then((relRes) => {
              // Discard if navigated away
              if (thisRequestId !== requestIdRef.current) return;
              const relResponse = relRes.response as {
                results: CioItem[];
              };
              const filtered = relResponse.results
                .filter((r) => r.data?.id !== slug && r.data?.id !== item.data?.id)
                .slice(0, 3);
              setRelated(filtered);
            })
            .catch(() => {
              // Silently fail for related — not critical
            });
        }

        setLoading(false);
      })
      .catch((err) => {
        if (thisRequestId !== requestIdRef.current) return;
        console.error("[CIO Browse Items Error]", err);
        setError(`Failed to load article: ${err.message || "Unknown error"}`);
        setLoading(false);
      });
  }, [slug]);

  const tags = article
    ? Array.isArray(article.data?.tags)
      ? article.data.tags
      : typeof article.data?.tags === "string"
        ? article.data.tags.split(",").map((t: string) => t.trim())
        : []
    : [];

  const author = article?.data?.author;
  const date = article?.data?.date;
  const imageUrl = article?.data?.image_url;
  const description = article?.data?.description;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-stone-400">
        <Link to="/" className="hover:text-stone-600 transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-stone-600">{article?.value || slug}</span>
      </nav>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="animate-pulse">
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-16 bg-stone-100 rounded-full" />
            <div className="h-6 w-20 bg-stone-100 rounded-full" />
          </div>
          <div className="h-10 w-3/4 bg-stone-100 rounded mb-4" />
          <div className="h-6 w-full bg-stone-100 rounded mb-6" />
          <div className="h-4 w-48 bg-stone-100 rounded mb-10" />
          <div className="h-64 bg-stone-100 rounded-2xl mb-10" />
          <div className="space-y-4">
            <div className="h-4 w-full bg-stone-100 rounded" />
            <div className="h-4 w-full bg-stone-100 rounded" />
            <div className="h-4 w-2/3 bg-stone-100 rounded" />
          </div>
        </div>
      )}

      {/* Article Content */}
      {!loading && article && (
        <article>
          {/* Header */}
          <header className="mb-10">
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag: string) => (
                  <Link
                    key={tag}
                    to={`/blog/tag/${tag}`}
                    className="text-xs px-3 py-1 bg-stone-100 text-stone-600 rounded-full hover:bg-stone-200 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
            <h1 className="text-3xl md:text-4xl font-semibold text-stone-900 mb-4 tracking-tight">
              {article.value}
            </h1>
            {description && (
              <p className="text-lg text-stone-500 mb-6">{description}</p>
            )}
            {(author || date) && (
              <div className="flex items-center gap-4 text-sm text-stone-400 border-b border-stone-200 pb-6">
                {author && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center text-stone-600 font-medium text-xs">
                      {author
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </div>
                    <span className="text-stone-600">{author}</span>
                  </div>
                )}
                {date && (
                  <span>
                    {new Date(date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            )}
          </header>

          {/* Cover Image */}
          {imageUrl && (
            <div className="rounded-2xl overflow-hidden mb-10 bg-stone-100">
              <img
                src={imageUrl}
                alt={article.value}
                className="w-full h-64 md:h-80 object-cover"
              />
            </div>
          )}

          {/* Body */}
          <div className="prose prose-stone max-w-none mb-16">
            {article.data?.article_content ? (
              article.data.article_content.split("\n\n").map((paragraph: string, i: number) => (
                <p key={i} className="text-stone-700 leading-relaxed mb-6">
                  {paragraph}
                </p>
              ))
            ) : description ? (
              <p className="text-stone-700 leading-relaxed mb-6 text-lg">
                {description}
              </p>
            ) : null}
            {article.data?.keywords && article.data.keywords.length > 0 && (
              <div className="mt-8 pt-6 border-t border-stone-200">
                <p className="text-sm text-stone-400 mb-3">Related topics</p>
                <div className="flex flex-wrap gap-2">
                  {article.data.keywords.map((kw: string) => (
                    <span
                      key={kw}
                      className="text-xs px-3 py-1 bg-stone-50 text-stone-500 rounded-full border border-stone-200"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Related Articles */}
          {related.length > 0 && (
            <section className="border-t border-stone-200 pt-10">
              <h2 className="text-xl font-medium text-stone-800 mb-6">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {related.map((r, i) => (
                  <CioResultCard
                    key={r.data?.id || r.value}
                    result={r}
                    index={i}
                  />
                ))}
              </div>
            </section>
          )}
        </article>
      )}

      {/* Not found */}
      {!loading && !error && !article && (
        <div className="text-center py-20">
          <p className="text-stone-400 text-lg mb-2">Article not found</p>
          <p className="text-stone-400 text-sm">
            This article may not be ingested yet.{" "}
            <Link to="/" className="text-stone-600 underline hover:text-stone-800">
              Go back home
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
