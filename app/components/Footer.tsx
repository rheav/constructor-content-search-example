import { Link } from "react-router";
import { CATEGORIES } from "~/lib/categories";

export function Footer() {
  return (
    <footer className="bg-stone-100 border-t border-stone-200 mt-auto py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div>
            <Link
              to="/"
              className="text-lg font-semibold text-stone-800 tracking-tight"
            >
              Beauty Blog
            </Link>
            <p className="text-sm text-stone-500 mt-2 max-w-xs">
              Tips, tutorials, and trends in makeup, skincare, and all things
              beauty — for every skill level and budget.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wider mb-3">
              Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.slice(0, 10).map((tag) => (
                <Link
                  key={tag}
                  to={`/blog/tag/${tag}`}
                  className="text-xs px-3 py-1 bg-white border border-stone-200 rounded-full text-stone-600 hover:border-stone-400 hover:text-stone-800 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-stone-200 mt-8 pt-6 text-center text-stone-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Beauty Blog. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
