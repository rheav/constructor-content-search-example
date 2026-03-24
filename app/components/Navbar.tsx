import { Link, useLocation } from "react-router";
import { SearchBar } from "~/components/SearchBar";
import { NAV_CATEGORIES } from "~/lib/categories";

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link
            to="/"
            className="text-xl font-semibold text-stone-900 tracking-tight hover:text-stone-700 transition-colors flex-shrink-0"
          >
            Beauty Blog
          </Link>
          <div className="hidden md:flex items-center gap-6 flex-shrink-0">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                location.pathname === "/"
                  ? "text-stone-900"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              All Posts
            </Link>
            {NAV_CATEGORIES.map((tag) => (
              <Link
                key={tag}
                to={`/blog/tag/${tag}`}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === `/blog/tag/${tag}`
                    ? "text-stone-900"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {tag}
              </Link>
            ))}
          </div>
          <div className="hidden sm:block">
            <SearchBar />
          </div>
        </div>
        {/* Mobile search bar */}
        <div className="sm:hidden pb-3">
          <SearchBar />
        </div>
      </div>
    </nav>
  );
}
