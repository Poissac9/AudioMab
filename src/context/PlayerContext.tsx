"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from "react";
import { Track } from "@/types";

interface PlayerState {
    currentTrack: Track | null;
    queue: Track[];
    originalQueue: Track[];
    currentIndex: number;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    shuffle: boolean;
    repeat: "off" | "all" | "one";
    isNowPlayingOpen: boolean;
    isLoading: boolean;
    error: string | null;
}

type PlayerAction =
    | { type: "SET_TRACK"; payload: { track: Track; queue: Track[]; index: number } }
    | { type: "PLAY" }
    | { type: "PAUSE" }
    | { type: "SET_TIME"; payload: number }
    | { type: "SET_DURATION"; payload: number }
    | { type: "SET_VOLUME"; payload: number }
    | { type: "TOGGLE_SHUFFLE" }
    | { type: "CYCLE_REPEAT" }
    | { type: "NEXT_TRACK" }
    | { type: "PREV_TRACK" }
    | { type: "OPEN_NOW_PLAYING" }
    | { type: "CLOSE_NOW_PLAYING" }
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_ERROR"; payload: string | null }
    | { type: "SET_AUDIO_URL"; payload: string };

const initialState: PlayerState = {
    currentTrack: null,
    queue: [],
    originalQueue: [],
    currentIndex: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    shuffle: false,
    repeat: "off",
    isNowPlayingOpen: false,
    isLoading: false,
    error: null,
};

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
    switch (action.type) {
        case "SET_TRACK": {
            const { track, queue, index } = action.payload;
            return {
                ...state,
                currentTrack: track,
                queue: state.shuffle ? shuffleArray(queue) : queue,
                originalQueue: queue,
                currentIndex: index,
                isPlaying: false, // Don't auto-play until audio is loaded
                currentTime: 0,
                duration: 0,
                error: null,
                isLoading: true, // Start loading immediately
            };
        }
        case "PLAY":
            return { ...state, isPlaying: true };
        case "PAUSE":
            return { ...state, isPlaying: false };
        case "SET_TIME":
            return { ...state, currentTime: action.payload };
        case "SET_DURATION":
            return { ...state, duration: action.payload };
        case "SET_VOLUME":
            return { ...state, volume: action.payload };
        case "TOGGLE_SHUFFLE": {
            const newShuffle = !state.shuffle;
            return {
                ...state,
                shuffle: newShuffle,
                queue: newShuffle ? shuffleArray(state.originalQueue) : state.originalQueue,
            };
        }
        case "CYCLE_REPEAT": {
            const modes: ("off" | "all" | "one")[] = ["off", "all", "one"];
            const currentIdx = modes.indexOf(state.repeat);
            return { ...state, repeat: modes[(currentIdx + 1) % 3] };
        }
        case "NEXT_TRACK": {
            if (state.queue.length === 0) return state;
            let nextIndex = state.currentIndex + 1;
            if (nextIndex >= state.queue.length) {
                if (state.repeat === "all") nextIndex = 0;
                else return { ...state, isPlaying: false };
            }
            return {
                ...state,
                currentIndex: nextIndex,
                currentTrack: state.queue[nextIndex],
                currentTime: 0,
                duration: 0,
                isLoading: true,
            };
        }
        case "PREV_TRACK": {
            if (state.queue.length === 0) return state;
            if (state.currentTime > 3) {
                return { ...state, currentTime: 0 };
            }
            let prevIndex = state.currentIndex - 1;
            if (prevIndex < 0) prevIndex = state.queue.length - 1;
            return {
                ...state,
                currentIndex: prevIndex,
                currentTrack: state.queue[prevIndex],
                currentTime: 0,
                duration: 0,
                isLoading: true,
            };
        }
        case "OPEN_NOW_PLAYING":
            return { ...state, isNowPlayingOpen: true };
        case "CLOSE_NOW_PLAYING":
            return { ...state, isNowPlayingOpen: false };
        case "SET_LOADING":
            return { ...state, isLoading: action.payload };
        case "SET_ERROR":
            return { ...state, error: action.payload, isLoading: false };
        default:
            return state;
    }
}

interface PlayerContextType {
    state: PlayerState;
    playTrack: (track: Track, queue: Track[], index: number) => void;
    play: () => void;
    pause: () => void;
    togglePlayPause: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    nextTrack: () => void;
    prevTrack: () => void;
    toggleShuffle: () => void;
    cycleRepeat: () => void;
    openNowPlaying: () => void;
    closeNowPlaying: () => void;
    downloadTrack: (track: Track) => Promise<void>;
    isTrackCached: (videoId: string) => Promise<boolean>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

const CACHE_NAME = "audiomab-audio-cache-v1";

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(playerReducer, initialState);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioUrlRef = useRef<string | null>(null);
    const currentVideoIdRef = useRef<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Initialize audio element
    useEffect(() => {
        if (typeof window !== "undefined") {
            audioRef.current = new Audio();
            audioRef.current.volume = state.volume;

            audioRef.current.addEventListener("timeupdate", () => {
                dispatch({ type: "SET_TIME", payload: audioRef.current?.currentTime || 0 });
            });

            audioRef.current.addEventListener("loadedmetadata", () => {
                dispatch({ type: "SET_DURATION", payload: audioRef.current?.duration || 0 });
            });

            audioRef.current.addEventListener("canplay", () => {
                dispatch({ type: "SET_LOADING", payload: false });
                dispatch({ type: "PLAY" });
                audioRef.current?.play().catch(console.error);
            });

            audioRef.current.addEventListener("ended", () => {
                if (state.repeat === "one") {
                    audioRef.current!.currentTime = 0;
                    audioRef.current!.play();
                } else {
                    dispatch({ type: "NEXT_TRACK" });
                }
            });

            audioRef.current.addEventListener("error", () => {
                dispatch({ type: "SET_ERROR", payload: "Failed to load audio" });
            });
        }

        return () => {
            audioRef.current?.pause();
            audioRef.current = null;
        };
    }, []);

    // Handle track changes - STOP previous audio immediately
    useEffect(() => {
        if (!state.currentTrack) return;

        const videoId = state.currentTrack.videoId;

        // If same track, don't refetch
        if (currentVideoIdRef.current === videoId && audioUrlRef.current) {
            return;
        }

        // IMMEDIATELY stop previous audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current.load();
        }

        // Cancel any pending fetch
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        currentVideoIdRef.current = videoId;
        abortControllerRef.current = new AbortController();

        const fetchAudioUrl = async () => {
            try {
                // First check cache
                const cachedUrl = await getCachedAudioUrl(videoId);
                if (cachedUrl) {
                    console.log("Using cached audio for:", videoId);
                    if (audioRef.current && currentVideoIdRef.current === videoId) {
                        audioUrlRef.current = cachedUrl;
                        audioRef.current.src = cachedUrl;
                        audioRef.current.load();
                    }
                    return;
                }

                // Fetch from API
                const response = await fetch(`/api/audio/${videoId}`, {
                    signal: abortControllerRef.current?.signal,
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch audio");
                }

                // Check if this is still the current track
                if (currentVideoIdRef.current !== videoId) {
                    console.log("Track changed, ignoring response for:", videoId);
                    return;
                }

                if (audioRef.current && data.audioUrl) {
                    audioUrlRef.current = data.audioUrl;
                    audioRef.current.src = data.audioUrl;
                    audioRef.current.load();
                } else {
                    throw new Error("No audio URL in response");
                }
            } catch (error) {
                if ((error as Error).name === "AbortError") {
                    console.log("Fetch aborted for:", videoId);
                    return;
                }
                console.error("Error fetching audio:", error);
                dispatch({ type: "SET_ERROR", payload: "Failed to load audio stream" });
            }
        };

        fetchAudioUrl();
    }, [state.currentTrack?.videoId]);

    // Handle play/pause state
    useEffect(() => {
        if (!audioRef.current || !audioUrlRef.current || state.isLoading) return;

        if (state.isPlaying) {
            audioRef.current.play().catch(console.error);
        } else {
            audioRef.current.pause();
        }
    }, [state.isPlaying, state.isLoading]);

    // Media Session API for lock screen controls
    useEffect(() => {
        if (!state.currentTrack || !("mediaSession" in navigator)) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: state.currentTrack.title,
            artist: state.currentTrack.artist,
            artwork: [
                { src: state.currentTrack.thumbnail, sizes: "512x512", type: "image/jpeg" },
            ],
        });

        navigator.mediaSession.setActionHandler("play", () => dispatch({ type: "PLAY" }));
        navigator.mediaSession.setActionHandler("pause", () => dispatch({ type: "PAUSE" }));
        navigator.mediaSession.setActionHandler("previoustrack", () => dispatch({ type: "PREV_TRACK" }));
        navigator.mediaSession.setActionHandler("nexttrack", () => dispatch({ type: "NEXT_TRACK" }));
    }, [state.currentTrack]);

    // Get cached audio URL
    const getCachedAudioUrl = async (videoId: string): Promise<string | null> => {
        if (!("caches" in window)) return null;

        try {
            const cache = await caches.open(CACHE_NAME);
            const response = await cache.match(`/audio/${videoId}`);
            if (response) {
                const blob = await response.blob();
                return URL.createObjectURL(blob);
            }
        } catch (e) {
            console.error("Cache read error:", e);
        }
        return null;
    };

    // Download and cache track for offline
    const downloadTrack = useCallback(async (track: Track) => {
        if (!("caches" in window)) {
            console.warn("Cache API not supported");
            return;
        }

        try {
            // Use the stream proxy endpoint to bypass CORS
            const audioResponse = await fetch(`/api/stream/${track.videoId}`);
            if (!audioResponse.ok) {
                const errorData = await audioResponse.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to fetch audio stream");
            }

            const audioBlob = await audioResponse.blob();

            // Store in cache
            const cache = await caches.open(CACHE_NAME);
            const cacheResponse = new Response(audioBlob, {
                headers: {
                    "Content-Type": audioBlob.type || "audio/webm",
                    "X-Track-Title": encodeURIComponent(track.title),
                    "X-Track-Artist": encodeURIComponent(track.artist),
                },
            });

            await cache.put(`/audio/${track.videoId}`, cacheResponse);
            console.log("Cached audio for:", track.title);
        } catch (error) {
            console.error("Error downloading track:", error);
            throw error;
        }
    }, []);

    // Check if track is cached
    const isTrackCached = useCallback(async (videoId: string): Promise<boolean> => {
        if (!("caches" in window)) return false;

        try {
            const cache = await caches.open(CACHE_NAME);
            const response = await cache.match(`/audio/${videoId}`);
            return !!response;
        } catch {
            return false;
        }
    }, []);

    const playTrack = useCallback((track: Track, queue: Track[], index: number) => {
        // Stop current audio immediately
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        audioUrlRef.current = null;
        dispatch({ type: "SET_TRACK", payload: { track, queue, index } });
    }, []);

    const play = useCallback(() => dispatch({ type: "PLAY" }), []);
    const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
    const togglePlayPause = useCallback(() => {
        dispatch({ type: state.isPlaying ? "PAUSE" : "PLAY" });
    }, [state.isPlaying]);

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            dispatch({ type: "SET_TIME", payload: time });
        }
    }, []);

    const setVolume = useCallback((volume: number) => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
        dispatch({ type: "SET_VOLUME", payload: volume });
    }, []);

    const nextTrack = useCallback(() => dispatch({ type: "NEXT_TRACK" }), []);
    const prevTrack = useCallback(() => dispatch({ type: "PREV_TRACK" }), []);
    const toggleShuffle = useCallback(() => dispatch({ type: "TOGGLE_SHUFFLE" }), []);
    const cycleRepeat = useCallback(() => dispatch({ type: "CYCLE_REPEAT" }), []);
    const openNowPlaying = useCallback(() => dispatch({ type: "OPEN_NOW_PLAYING" }), []);
    const closeNowPlaying = useCallback(() => dispatch({ type: "CLOSE_NOW_PLAYING" }), []);

    return (
        <PlayerContext.Provider
            value={{
                state,
                playTrack,
                play,
                pause,
                togglePlayPause,
                seek,
                setVolume,
                nextTrack,
                prevTrack,
                toggleShuffle,
                cycleRepeat,
                openNowPlaying,
                closeNowPlaying,
                downloadTrack,
                isTrackCached,
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error("usePlayer must be used within a PlayerProvider");
    }
    return context;
}
