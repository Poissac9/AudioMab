"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Play, Shuffle, Download, MoreHorizontal, Check, Loader2 } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { useLibrary } from "@/context/LibraryContext";
import { Playlist, Track } from "@/types";
import TrackItem from "@/components/TrackItem/TrackItem";
import styles from "./page.module.css";

interface PlaylistPageProps {
    params: Promise<{ id: string }>;
}

export default function PlaylistPage({ params }: PlaylistPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { playTrack, toggleShuffle, downloadTrack, isTrackCached } = usePlayer();
    const { getPlaylist, addPlaylist, isLoaded } = useLibrary();

    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [cachedTracks, setCachedTracks] = useState<Set<string>>(new Set());
    const initialized = useRef(false);

    useEffect(() => {
        // Prevent double initialization
        if (initialized.current) return;

        // First check URL params for data (from import)
        const dataParam = searchParams.get("data");
        if (dataParam) {
            try {
                const data = JSON.parse(decodeURIComponent(dataParam));
                const newPlaylist: Playlist = {
                    id: data.id,
                    title: data.title,
                    author: data.author,
                    thumbnail: data.thumbnail,
                    tracks: data.tracks,
                    updatedAt: new Date().toISOString(),
                };
                setPlaylist(newPlaylist);
                addPlaylist(newPlaylist);
                initialized.current = true;
                // Clean up URL
                router.replace(`/playlist/${id}`, { scroll: false });
                return;
            } catch (e) {
                console.error("Failed to parse playlist data:", e);
            }
        }

        // Wait for library to load before checking
        if (!isLoaded) return;

        // Try to get from library
        const savedPlaylist = getPlaylist(id);
        if (savedPlaylist) {
            setPlaylist(savedPlaylist);
            initialized.current = true;
        } else {
            // Playlist not found after library loaded
            setNotFound(true);
        }
    }, [id, searchParams, isLoaded, getPlaylist, addPlaylist, router]);


    // Check which tracks are cached
    useEffect(() => {
        if (!playlist) return;

        const checkCached = async () => {
            const cached = new Set<string>();
            for (const track of playlist.tracks) {
                if (await isTrackCached(track.videoId)) {
                    cached.add(track.videoId);
                }
            }
            setCachedTracks(cached);
        };

        checkCached();
    }, [playlist, isTrackCached]);

    const handlePlayAll = () => {
        if (!playlist || playlist.tracks.length === 0) return;
        playTrack(playlist.tracks[0], playlist.tracks, 0);
    };

    const handleShuffle = () => {
        if (!playlist || playlist.tracks.length === 0) return;
        toggleShuffle();
        const randomIndex = Math.floor(Math.random() * playlist.tracks.length);
        playTrack(playlist.tracks[randomIndex], playlist.tracks, randomIndex);
    };

    const handleDownloadAll = async () => {
        if (!playlist || isDownloading) return;

        setIsDownloading(true);
        setDownloadProgress(0);

        const tracksToDownload = playlist.tracks.filter(
            (t) => !cachedTracks.has(t.videoId)
        );

        let completed = 0;
        for (const track of tracksToDownload) {
            try {
                await downloadTrack(track);
                completed++;
                setDownloadProgress(Math.round((completed / tracksToDownload.length) * 100));
                setCachedTracks((prev) => new Set([...prev, track.videoId]));
            } catch (error) {
                console.error("Failed to download:", track.title, error);
            }
        }

        setIsDownloading(false);
    };

    const allCached = playlist && cachedTracks.size === playlist.tracks.length;

    // Show not found
    if (notFound) {
        return (
            <main className={styles.page}>
                <header className={styles.header}>
                    <button className={styles.backButton} onClick={() => router.back()}>
                        <ChevronLeft size={28} />
                    </button>
                </header>
                <div className={styles.loading}>
                    <p>Playlist not found</p>
                    <button
                        className={styles.backLink}
                        onClick={() => router.push("/library")}
                    >
                        Go to Library
                    </button>
                </div>
            </main>
        );
    }

    // Show loading while library loads or playlist not yet set
    if (!playlist) {
        return (
            <main className={styles.page}>
                <div className={styles.loading}>
                    <div className={styles.loader} />
                    <p>Loading playlist...</p>
                </div>
            </main>
        );
    }

    return (
        <main className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <button
                    className={styles.backButton}
                    onClick={() => router.back()}
                    aria-label="Go back"
                >
                    <ChevronLeft size={28} />
                </button>
                <button
                    className={`${styles.headerAction} ${allCached ? styles.cached : ""}`}
                    onClick={handleDownloadAll}
                    disabled={isDownloading || !!allCached}
                    aria-label={allCached ? "Downloaded" : "Download for offline"}
                >
                    {isDownloading ? (
                        <Loader2 size={22} className={styles.spinning} />
                    ) : allCached ? (
                        <Check size={22} />
                    ) : (
                        <Download size={22} />
                    )}
                </button>
                <button className={styles.headerAction} aria-label="More options">
                    <MoreHorizontal size={22} />
                </button>
            </header>

            {/* Download Progress */}
            <AnimatePresence>
                {isDownloading && (
                    <motion.div
                        className={styles.downloadProgress}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className={styles.downloadBar}>
                            <div
                                className={styles.downloadFill}
                                style={{ width: `${downloadProgress}%` }}
                            />
                        </div>
                        <p className={styles.downloadText}>
                            Downloading for offline... {downloadProgress}%
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Artwork */}
            <motion.div
                className={styles.artworkContainer}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 20 }}
            >
                <img
                    src={playlist.thumbnail}
                    alt={playlist.title}
                    className={styles.artwork}
                />
            </motion.div>

            {/* Info */}
            <div className={styles.info}>
                <h1 className={styles.title}>{playlist.title}</h1>
                <p className={styles.author}>{playlist.author}</p>
                <p className={styles.meta}>
                    {playlist.tracks.length} tracks
                    {cachedTracks.size > 0 && (
                        <span className={styles.cachedInfo}>
                            {" "}• {cachedTracks.size} downloaded
                        </span>
                    )}
                </p>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
                <motion.button
                    className={styles.playButton}
                    onClick={handlePlayAll}
                    whileTap={{ scale: 0.95 }}
                >
                    <Play size={20} fill="currentColor" />
                    Play
                </motion.button>

                <motion.button
                    className={styles.shuffleButton}
                    onClick={handleShuffle}
                    whileTap={{ scale: 0.95 }}
                >
                    <Shuffle size={20} />
                    Shuffle
                </motion.button>
            </div>

            {/* Track List */}
            <div className={styles.trackList}>
                {playlist.tracks.map((track, index) => (
                    <TrackItem
                        key={track.id}
                        track={track}
                        queue={playlist.tracks}
                        index={index}
                        isCached={cachedTracks.has(track.videoId)}
                    />
                ))}
            </div>
        </main>
    );
}
