"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, X, Loader2, Music, Disc } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import styles from "./page.module.css";

interface SearchResult {
    id: string;
    videoId?: string;
    title: string;
    author: string;
    uploader?: string;
    thumbnail: string;
    type?: "video" | "playlist";
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

const SEARCH_STORAGE_KEY = "audiomab_search_state";

export default function SearchPage() {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const { playTrack } = usePlayer();

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Restore search state from sessionStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = sessionStorage.getItem(SEARCH_STORAGE_KEY);
            if (saved) {
                try {
                    const state = JSON.parse(saved);
                    setQuery(state.query || "");
                    setResults(state.results || []);
                    setIsSearching(state.isSearching || false);
                    setHasSearched(state.hasSearched || false);
                } catch (e) {
                    console.error("Failed to restore search state:", e);
                }
            }
        }
    }, []);

    // Save search state to sessionStorage on changes
    useEffect(() => {
        if (typeof window !== "undefined" && hasSearched) {
            sessionStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify({
                query,
                results,
                isSearching,
                hasSearched,
            }));
        }
    }, [query, results, isSearching, hasSearched]);

    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setHasSearched(true);

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

    // Play directly without navigating to playlist page
    const handleResultClick = async (result: SearchResult) => {
        const videoId = result.videoId || result.id;

        // Create a track object and play directly
        const track = {
            id: videoId,
            videoId: videoId,
            title: result.title,
            artist: result.author || result.uploader || "Unknown Artist",
            thumbnail: result.thumbnail,
            duration: result.duration || 0,
        };

        setLoadingId(result.id);

        // Play the track directly
        playTrack(track, [track], 0);

        // Clear loading after a short delay (player will handle the rest)
        setTimeout(() => setLoadingId(null), 500);
    };

    const clearSearch = () => {
        setQuery("");
        setResults([]);
        setIsSearching(false);
        setHasSearched(false);
        sessionStorage.removeItem(SEARCH_STORAGE_KEY);
        inputRef.current?.blur();
    };

    // Format duration as MM:SS
    const formatDuration = (seconds?: number) => {
        if (!seconds) return "";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
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

                        {/* Only show "no results" after a search has been performed */}
                        {!isLoading && hasSearched && results.length === 0 && (
                            <div className={styles.emptyState}>
                                <p>No results found</p>
                            </div>
                        )}

                        {!isLoading && results.length > 0 && (
                            <div className={styles.resultsList}>
                                {results.map((result, i) => (
                                    <motion.div
                                        key={result.id}
                                        className={`${styles.resultItem} ${loadingId === result.id ? styles.loading : ""}`}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.02 }}
                                        onClick={() => !loadingId && handleResultClick(result)}
                                    >
                                        <div className={styles.resultArtwork}>
                                            <img src={result.thumbnail} alt={result.title} />
                                            {loadingId === result.id && (
                                                <div className={styles.resultLoading}>
                                                    <Loader2 size={24} className={styles.spinner} />
                                                </div>
                                            )}
                                            {/* Type indicator */}
                                            <div className={styles.typeIndicator}>
                                                {result.type === "playlist" ? (
                                                    <Disc size={12} />
                                                ) : (
                                                    <Music size={12} />
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.resultInfo}>
                                            <p className={`${styles.resultTitle} text-truncate`}>
                                                {result.title}
                                            </p>
                                            <p className={`${styles.resultMeta} text-truncate`}>
                                                {result.type === "playlist" ? "Album" : "Song"} • {result.author || result.uploader}
                                                {result.duration ? ` • ${formatDuration(result.duration)}` : ""}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Show hint when just started searching (no search yet) */}
                        {!isLoading && !hasSearched && (
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
