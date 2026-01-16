"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Clock, Play, Shuffle } from "lucide-react";
import { useLibrary } from "@/context/LibraryContext";
import { usePlayer } from "@/context/PlayerContext";
import styles from "./page.module.css";

export default function RecentPage() {
    const router = useRouter();
    const { recentlyPlayed } = useLibrary();
    const { playTrack } = usePlayer();

    const tracks = recentlyPlayed || [];

    const handlePlayAll = () => {
        if (tracks.length > 0) {
            playTrack(tracks[0], tracks, 0);
        }
    };

    const handleShuffle = () => {
        if (tracks.length > 0) {
            const shuffled = [...tracks].sort(() => Math.random() - 0.5);
            playTrack(shuffled[0], shuffled, 0);
        }
    };

    const handleTrackClick = (track: typeof tracks[0], index: number) => {
        playTrack(track, tracks, index);
    };

    return (
        <main className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    <ChevronLeft size={28} />
                </button>
                <h1 className={styles.title}>Recently Played</h1>
            </header>

            {/* Hero */}
            <div className={styles.hero}>
                <div className={styles.heroIcon}>
                    <Clock size={48} />
                </div>
                <h2 className={styles.heroTitle}>Recently Played</h2>
                <p className={styles.heroMeta}>{tracks.length} songs</p>
            </div>

            {/* Actions */}
            {tracks.length > 0 && (
                <div className={styles.actions}>
                    <button className={styles.playButton} onClick={handlePlayAll}>
                        <Play size={20} fill="currentColor" />
                        <span>Play</span>
                    </button>
                    <button className={styles.shuffleButton} onClick={handleShuffle}>
                        <Shuffle size={20} />
                        <span>Shuffle</span>
                    </button>
                </div>
            )}

            {/* Track List */}
            {tracks.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No recently played songs</p>
                    <p className={styles.emptyHint}>Songs you play will appear here</p>
                </div>
            ) : (
                <div className={styles.trackList}>
                    {tracks.map((track, index) => (
                        <motion.div
                            key={`${track.id}-${index}`}
                            className={styles.trackItem}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            onClick={() => handleTrackClick(track, index)}
                        >
                            <div className={styles.trackArtwork}>
                                <img src={track.thumbnail} alt={track.title} />
                            </div>
                            <div className={styles.trackInfo}>
                                <p className={`${styles.trackTitle} text-truncate`}>{track.title}</p>
                                <p className={`${styles.trackArtist} text-truncate`}>{track.artist}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </main>
    );
}
