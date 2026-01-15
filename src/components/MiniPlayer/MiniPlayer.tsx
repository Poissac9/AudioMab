"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import styles from "./MiniPlayer.module.css";

export default function MiniPlayer() {
    const { state, togglePlayPause, nextTrack, openNowPlaying } = usePlayer();
    const { currentTrack, isPlaying, isLoading } = state;

    if (!currentTrack) return null;

    const handleContainerClick = (e: React.MouseEvent) => {
        // Don't open if clicking on buttons
        if ((e.target as HTMLElement).closest("button")) return;
        openNowPlaying();
    };

    return (
        <AnimatePresence>
            <motion.div
                className={styles.container}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={handleContainerClick}
                layoutId="player-container"
            >
                <div className={styles.progressBar}>
                    <motion.div
                        className={styles.progress}
                        style={{
                            width: state.duration
                                ? `${(state.currentTime / state.duration) * 100}%`
                                : "0%",
                        }}
                    />
                </div>

                <div className={styles.content}>
                    <motion.div className={styles.artwork} layoutId="player-artwork">
                        <img
                            src={currentTrack.thumbnail}
                            alt={currentTrack.title}
                            className={styles.artworkImage}
                        />
                    </motion.div>

                    <div className={styles.info}>
                        <motion.p
                            className={`${styles.title} text-truncate`}
                            layoutId="player-title"
                        >
                            {currentTrack.title}
                        </motion.p>
                        <p className={`${styles.artist} text-truncate`}>
                            {currentTrack.artist}
                        </p>
                    </div>

                    <div className={styles.controls}>
                        <button
                            className={styles.controlButton}
                            onClick={togglePlayPause}
                            disabled={isLoading}
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isLoading ? (
                                <div className={styles.loader} />
                            ) : isPlaying ? (
                                <Pause size={22} fill="currentColor" />
                            ) : (
                                <Play size={22} fill="currentColor" />
                            )}
                        </button>

                        <button
                            className={styles.controlButton}
                            onClick={nextTrack}
                            aria-label="Next track"
                        >
                            <SkipForward size={22} fill="currentColor" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
