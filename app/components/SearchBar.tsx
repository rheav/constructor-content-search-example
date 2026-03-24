import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { getCioClient, CIO_SECTION } from "~/lib/cio-client";

interface Suggestion {
  value: string;
  data?: {
    id?: string;
    url?: string;
    image_url?: string;
    description?: string;
    [key: string]: any;
  };
  result_id?: string;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{
    content: Suggestion[];
    searchSuggestions: Suggestion[];
  }>({ content: [], searchSuggestions: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const requestIdRef = useRef(0);
  const navigate = useNavigate();

  const allItems = [
    ...suggestions.searchSuggestions.map((s) => ({ type: "suggestion" as const, item: s })),
    ...suggestions.content.map((s) => ({ type: "content" as const, item: s })),
  ];

  const fetchSuggestions = useCallback((term: string) => {
    const cio = getCioClient();
    if (!cio || !term.trim()) {
      setSuggestions({ content: [], searchSuggestions: [] });
      setIsOpen(false);
      return;
    }

    const thisRequestId = ++requestIdRef.current;

    cio.autocomplete
      .getAutocompleteResults(term, {
        resultsPerSection: {
          [CIO_SECTION]: 5,
          "Search Suggestions": 4,
        },
      })
      .then((res) => {
        // Discard stale responses
        if (thisRequestId !== requestIdRef.current) return;

        const content = (res.sections?.[CIO_SECTION] || []) as Suggestion[];
        const searchSuggestions = (res.sections?.["Search Suggestions"] || []) as Suggestion[];
        setSuggestions({ content, searchSuggestions });
        setIsOpen(content.length > 0 || searchSuggestions.length > 0);
      })
      .catch(() => {
        if (thisRequestId !== requestIdRef.current) return;
        setSuggestions({ content: [], searchSuggestions: [] });
      });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const cio = getCioClient();
    if (cio) {
      cio.tracker.trackSearchSubmit(query, { originalQuery: query });
    }

    setIsOpen(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSuggestionClick = (type: "suggestion" | "content", suggestion: Suggestion) => {
    const cio = getCioClient();

    if (type === "suggestion") {
      if (cio) {
        cio.tracker.trackAutocompleteSelect(suggestion.value, {
          originalQuery: query,
          section: "Search Suggestions",
        });
      }
      setQuery(suggestion.value);
      setIsOpen(false);
      navigate(`/search?q=${encodeURIComponent(suggestion.value)}`);
    } else {
      if (cio && suggestion.data?.id) {
        cio.tracker.trackAutocompleteSelect(suggestion.value, {
          originalQuery: query,
          section: CIO_SECTION,
          itemId: suggestion.data.id,
        });
      }
      setIsOpen(false);
      if (suggestion.data?.url) {
        navigate(suggestion.data.url);
      } else if (suggestion.data?.id) {
        navigate(`/blog/${suggestion.data.id}`);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || allItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const selected = allItems[activeIndex];
      handleSuggestionClick(selected.type, selected.item);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleFocus = () => {
    const cio = getCioClient();
    if (cio) {
      cio.tracker.trackInputFocus();
    }
    if (allItems.length > 0) setIsOpen(true);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder="Search articles..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-stone-100 border border-stone-200 rounded-full text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-400 focus:bg-white transition-colors"
            autoComplete="off"
          />
        </div>
      </form>

      <AnimatePresence>
        {isOpen && allItems.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute top-full mt-2 right-0 min-w-[480px] bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* Search Suggestions */}
            {suggestions.searchSuggestions.length > 0 && (
              <div className="p-3">
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2 px-2">
                  Suggestions
                </p>
                {suggestions.searchSuggestions.map((s, i) => {
                  const globalIndex = i;
                  return (
                    <motion.button
                      key={`suggestion-${s.value}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15, delay: i * 0.03 }}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeIndex === globalIndex
                          ? "bg-stone-100 text-stone-900"
                          : "text-stone-600 hover:bg-stone-50"
                      }`}
                      onMouseEnter={() => setActiveIndex(globalIndex)}
                      onClick={() => handleSuggestionClick("suggestion", s)}
                    >
                      <svg
                        className="inline w-3.5 h-3.5 mr-2 text-stone-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                        />
                      </svg>
                      {s.value}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Article Results — Mini Grid */}
            {suggestions.content.length > 0 && (
              <div className={`p-3 ${suggestions.searchSuggestions.length > 0 ? "border-t border-stone-100" : ""}`}>
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2 px-2">
                  Articles
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.content.map((s, i) => {
                    const globalIndex = suggestions.searchSuggestions.length + i;
                    return (
                      <motion.button
                        key={`content-${s.data?.id || s.value}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.04 }}
                        type="button"
                        className={`text-left p-2 rounded-lg transition-colors flex flex-col gap-2 ${
                          activeIndex === globalIndex
                            ? "bg-stone-100"
                            : "hover:bg-stone-50"
                        }`}
                        onMouseEnter={() => setActiveIndex(globalIndex)}
                        onClick={() => handleSuggestionClick("content", s)}
                      >
                        <div className="w-full aspect-[16/10] rounded-lg overflow-hidden bg-stone-100">
                          {s.data?.image_url ? (
                            <img
                              src={s.data.image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-stone-800 leading-snug line-clamp-2">
                            {s.value}
                          </p>
                          {s.data?.description && (
                            <p className="text-xs text-stone-400 mt-1 line-clamp-1">
                              {s.data.description}
                            </p>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
