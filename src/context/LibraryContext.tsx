"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Playlist, Track } from "@/types";

interface LibraryContextType {
    playlists: Playlist[];
    favorites: Track[];
    addPlaylist: (playlist: Playlist) => void;
    removePlaylist: (id: string) => void;
    toggleFavorite: (track: Track) => void;
    isFavorite: (trackId: string) => boolean;
    getPlaylist: (id: string) => Playlist | undefined;
    clearAll: () => void;
}

const LibraryContext = createContext<LibraryContextType | null>(null);

const STORAGE_KEY = "audiomab_library";
const FAVORITES_KEY = "audiomab_favorites";

export function LibraryProvider({ children }: { children: React.ReactNode }) {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [favorites, setFavorites] = useState<Track[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedPlaylists = localStorage.getItem(STORAGE_KEY);
            const savedFavorites = localStorage.getItem(FAVORITES_KEY);

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
        }
    }, []);

    // Save to localStorage on changes
    useEffect(() => {
        if (typeof window !== "undefined" && playlists.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
        }
    }, [playlists]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        }
    }, [favorites]);

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

    const clearAll = useCallback(() => {
        setPlaylists([]);
        setFavorites([]);
        if (typeof window !== "undefined") {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(FAVORITES_KEY);
        }
    }, []);

    return (
        <LibraryContext.Provider
            value={{
                playlists,
                favorites,
                addPlaylist,
                removePlaylist,
                toggleFavorite,
                isFavorite,
                getPlaylist,
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
