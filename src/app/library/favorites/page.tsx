"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, Heart, Play, Shuffle } from "lucide-react";
import { useLibrary } from "@/context/LibraryContext";
import { usePlayer } from "@/context/PlayerContext";
import styles from "./page.module.css";

export default function FavoritesPage() {
    const router = useRouter();
    const { favorites } = useLibrary();
    const { playTrack } = usePlayer();

    const handlePlayAll = () => {
        if (favorites.length > 0) {
            playTrack(favorites[0], favorites, 0);
        }
    };

    const handleShuffle = () => {
        if (favorites.length > 0) {
            const shuffled = [...favorites].sort(() => Math.random() - 0.5);
            playTrack(shuffled[0], shuffled, 0);
        }
    };

    const handleTrackClick = (track: typeof favorites[0], index: number) => {
        playTrack(track, favorites, index);
    };

    return (
        <main className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    <ChevronLeft size={28} />
                </button>
                <h1 className={styles.title}>Favorites</h1>
            </header>

            {/* Hero */}
            <div className={styles.hero}>
                <div className={styles.heroIcon}>
                    <Heart size={48} fill="currentColor" />
                </div>
                <h2 className={styles.heroTitle}>Favorite Songs</h2>
                <p className={styles.heroMeta}>{favorites.length} songs</p>
            </div>

            {/* Actions */}
            {favorites.length > 0 && (
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
            {favorites.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No favorites yet</p>
                    <p className={styles.emptyHint}>Tap the star on any song to add it here</p>
                </div>
            ) : (
                <div className={styles.trackList}>
                    {favorites.map((track, index) => (
                        <motion.div
                            key={track.id}
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
