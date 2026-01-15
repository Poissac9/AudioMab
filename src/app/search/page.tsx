"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, X, Loader2 } from "lucide-react";
import styles from "./page.module.css";

interface SearchResult {
    id: string;
    title: string;
    author: string;
    thumbnail: string;
    type: "video" | "playlist";
    videoCount?: number;
    duration?: number;
}

// Music categories for browse
const CATEGORIES = [
    { id: "hits", name: "Hits", color: "#FFD60A", image: "https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg" },
    { id: "hip-hop", name: "Hip-Hop", color: "#30B0C7", image: "https://i.ytimg.com/vi/RgKAFK5djSk/maxresdefault.jpg" },
    { id: "pop", name: "Pop", color: "#FF375F", image: "https://i.ytimg.com/vi/CevxZvSJLk8/maxresdefault.jpg" },
    { id: "chill", name: "Chill", color: "#5E5CE6", image: "https://i.ytimg.com/vi/5qap5aO4i9A/maxresdefault.jpg" },
    { id: "workout", name: "Workout", color: "#FF9500", image: "https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg" },
    { id: "focus", name: "Focus", color: "#32D74B", image: "https://i.ytimg.com/vi/jfKfPfyJRdk/maxresdefault.jpg" },
    { id: "party", name: "Party", color: "#BF5AF2", image: "https://i.ytimg.com/vi/fRh_vgS2dFE/maxresdefault.jpg" },
    { id: "sleep", name: "Sleep", color: "#64D2FF", image: "https://i.ytimg.com/vi/lTRiuFIWV54/maxresdefault.jpg" },
];

export default function SearchPage() {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            if (!response.ok) throw new Error("Search failed");
            const data = await response.json();
            setResults(data.results || []);
        } catch (error) {
            console.error("Search error:", error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(query);
    };

    const handleCategoryClick = (category: typeof CATEGORIES[0]) => {
        setQuery(category.name);
        setIsSearching(true);
        handleSearch(category.name);
    };

    const handleResultClick = async (result: SearchResult) => {
        const url = result.type === "video"
            ? `https://youtube.com/watch?v=${result.id}`
            : `https://youtube.com/playlist?list=${result.id}`;

        try {
            const response = await fetch("/api/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();
            if (response.ok) {
                router.push(`/playlist/${data.data.id}?data=${encodeURIComponent(JSON.stringify(data.data))}`);
            }
        } catch (error) {
            console.error("Import error:", error);
        }
    };

    const clearSearch = () => {
        setQuery("");
        setResults([]);
        setIsSearching(false);
        inputRef.current?.blur();
    };

    return (
        <main className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <h1 className={styles.title}>Search</h1>
            </header>

            {/* Search Bar */}
            <form onSubmit={handleSubmit} className={styles.searchForm}>
                <div className={styles.searchBar}>
                    <SearchIcon size={18} className={styles.searchIcon} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsSearching(true)}
                        placeholder="Artists, Songs, Lyrics, and More"
                        className={styles.input}
                    />
                    {query && (
                        <button
                            type="button"
                            className={styles.clearButton}
                            onClick={clearSearch}
                            aria-label="Clear"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                {isSearching && (
                    <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={clearSearch}
                    >
                        Cancel
                    </button>
                )}
            </form>

            {/* Categories Grid - shown when not searching */}
            <AnimatePresence>
                {!isSearching && (
                    <motion.div
                        className={styles.categories}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <h2 className={styles.sectionTitle}>Browse Categories</h2>
                        <div className={styles.categoryGrid}>
                            {CATEGORIES.map((category, i) => (
                                <motion.button
                                    key={category.id}
                                    className={styles.categoryCard}
                                    style={{ backgroundColor: category.color }}
                                    onClick={() => handleCategoryClick(category)}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <span className={styles.categoryName}>{category.name}</span>
                                    <div
                                        className={styles.categoryImage}
                                        style={{ backgroundImage: `url(${category.image})` }}
                                    />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Results */}
            <AnimatePresence>
                {isSearching && (
                    <motion.div
                        className={styles.results}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {isLoading && (
                            <div className={styles.loadingState}>
                                <Loader2 size={28} className={styles.spinner} />
                            </div>
                        )}

                        {!isLoading && results.length === 0 && query && (
                            <div className={styles.emptyState}>
                                <p>No results found</p>
                            </div>
                        )}

                        {!isLoading && results.length > 0 && (
                            <div className={styles.resultsList}>
                                {results.map((result, i) => (
                                    <motion.div
                                        key={result.id}
                                        className={styles.resultItem}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.02 }}
                                        onClick={() => handleResultClick(result)}
                                    >
                                        <div className={styles.resultArtwork}>
                                            <img src={result.thumbnail} alt={result.title} />
                                        </div>
                                        <div className={styles.resultInfo}>
                                            <p className={`${styles.resultTitle} text-truncate`}>
                                                {result.title}
                                            </p>
                                            <p className={`${styles.resultMeta} text-truncate`}>
                                                {result.type === "playlist" ? "Playlist" : "Song"} • {result.author}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {!isLoading && results.length === 0 && !query && (
                            <div className={styles.emptyState}>
                                <p className={styles.emptyHint}>Search for songs, artists, or playlists</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
