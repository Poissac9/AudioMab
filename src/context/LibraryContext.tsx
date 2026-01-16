"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Playlist, Track } from "@/types";

interface LibraryContextType {
    playlists: Playlist[];
    favorites: Track[];
    recentlyPlayed: Track[];
    isLoaded: boolean; // Track if data has been loaded from localStorage
    addPlaylist: (playlist: Playlist) => void;
    removePlaylist: (id: string) => void;
    toggleFavorite: (track: Track) => void;
    isFavorite: (trackId: string) => boolean;
    getPlaylist: (id: string) => Playlist | undefined;
    addToRecentlyPlayed: (track: Track) => void;
    clearAll: () => void;
}

const LibraryContext = createContext<LibraryContextType | null>(null);

const STORAGE_KEY = "audiomab_library";
const FAVORITES_KEY = "audiomab_favorites";
const RECENT_KEY = "audiomab_recent";
const MAX_RECENT = 50; // Keep last 50 played tracks

export function LibraryProvider({ children }: { children: React.ReactNode }) {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [favorites, setFavorites] = useState<Track[]>([]);
    const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedPlaylists = localStorage.getItem(STORAGE_KEY);
            const savedFavorites = localStorage.getItem(FAVORITES_KEY);
            const savedRecent = localStorage.getItem(RECENT_KEY);

            if (savedPlaylists) {
                try {
                    setPlaylists(JSON.parse(savedPlaylists));
                } catch (e) {
                    console.error("Failed to parse playlists:", e);
                }
            }

            if (savedFavorites) {
                try {
                    setFavorites(JSON.parse(savedFavorites));
                } catch (e) {
                    console.error("Failed to parse favorites:", e);
                }
            }

            if (savedRecent) {
                try {
                    setRecentlyPlayed(JSON.parse(savedRecent));
                } catch (e) {
                    console.error("Failed to parse recent:", e);
                }
            }

            // Mark as loaded after processing localStorage
            setIsLoaded(true);
        }
    }, []);

    // Save to localStorage on changes
    useEffect(() => {
        if (typeof window !== "undefined" && isLoaded && playlists.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
        }
    }, [playlists, isLoaded]);

    useEffect(() => {
        if (typeof window !== "undefined" && isLoaded) {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        }
    }, [favorites, isLoaded]);

    useEffect(() => {
        if (typeof window !== "undefined" && isLoaded) {
            localStorage.setItem(RECENT_KEY, JSON.stringify(recentlyPlayed));
        }
    }, [recentlyPlayed, isLoaded]);

    const addPlaylist = useCallback((playlist: Playlist) => {
        setPlaylists((prev) => {
            const exists = prev.find((p) => p.id === playlist.id);
            if (exists) {
                return prev.map((p) => (p.id === playlist.id ? playlist : p));
            }
            return [...prev, playlist];
        });
    }, []);

    const removePlaylist = useCallback((id: string) => {
        setPlaylists((prev) => prev.filter((p) => p.id !== id));
    }, []);

    const toggleFavorite = useCallback((track: Track) => {
        setFavorites((prev) => {
            const exists = prev.find((t) => t.id === track.id);
            if (exists) {
                return prev.filter((t) => t.id !== track.id);
            }
            return [...prev, track];
        });
    }, []);

    const isFavorite = useCallback((trackId: string) => {
        return favorites.some((t) => t.id === trackId);
    }, [favorites]);

    const getPlaylist = useCallback((id: string) => {
        return playlists.find((p) => p.id === id);
    }, [playlists]);

    const addToRecentlyPlayed = useCallback((track: Track) => {
        setRecentlyPlayed((prev) => {
            // Remove if already exists (will be added to front)
            const filtered = prev.filter((t) => t.id !== track.id);
            // Add to front and limit to MAX_RECENT
            return [track, ...filtered].slice(0, MAX_RECENT);
        });
    }, []);

    const clearAll = useCallback(() => {
        setPlaylists([]);
        setFavorites([]);
        setRecentlyPlayed([]);
        if (typeof window !== "undefined") {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(FAVORITES_KEY);
            localStorage.removeItem(RECENT_KEY);
        }
    }, []);

    return (
        <LibraryContext.Provider
            value={{
                playlists,
                favorites,
                recentlyPlayed,
                isLoaded,
                addPlaylist,
                removePlaylist,
                toggleFavorite,
                isFavorite,
                getPlaylist,
                addToRecentlyPlayed,
                clearAll,
            }}
        >
            {children}
        </LibraryContext.Provider>
    );
}

export function useLibrary() {
    const context = useContext(LibraryContext);
    if (!context) {
        throw new Error("useLibrary must be used within a LibraryProvider");
    }
    return context;
}
