import { Link } from "react-router";
import { motion } from "motion/react";

interface CioResult {
  value: string;
  data?: {
    id?: string;
    url?: string;
    image_url?: string;
    description?: string;
    tags?: string[] | string;
    author?: string;
    date?: string;
    [key: string]: any;
  };
  result_id?: string;
}

export function CioResultCard({
  result,
  onClick,
  index = 0,
}: {
  result: CioResult;
  onClick?: () => void;
  index?: number;
}) {
  const url = result.data?.url || (result.data?.id ? `/blog/${result.data.id}` : "/");
  const tags = Array.isArray(result.data?.tags)
    ? result.data.tags
    : typeof result.data?.tags === "string"
      ? result.data.tags.split(",").map((t: string) => t.trim())
      : [];
  const imageUrl = result.data?.image_url;
  const description = result.data?.description;
  const author = result.data?.author;
  const date = result.data?.date;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
    >
    <Link
      to={url}
      onClick={onClick}
      className="group flex flex-col bg-white border border-stone-200 rounded-xl overflow-hidden hover:border-stone-400 hover:shadow-md transition-all duration-300 h-full"
    >
      {/* Image */}
      <div className="aspect-[16/10] overflow-hidden bg-stone-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={result.value}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
            <svg className="w-10 h-10 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="text-[11px] font-medium uppercase tracking-wide px-2.5 py-0.5 bg-stone-100 text-stone-500 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="text-base font-semibold text-stone-900 mb-2 group-hover:text-stone-600 transition-colors line-clamp-2 leading-snug">
          {result.value}
        </h2>

        {/* Description */}
        {description && (
          <p className="text-sm text-stone-500 mb-4 line-clamp-2 flex-grow leading-relaxed">
            {description}
          </p>
        )}

        {/* Meta */}
        {(author || date) && (
          <div className="flex items-center gap-2 text-xs text-stone-400 mt-auto pt-2 border-t border-stone-100">
            {author && <span>{author}</span>}
            {author && date && <span className="text-stone-300">&middot;</span>}
            {date && (
              <span>
                {new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
    </motion.div>
  );
}
