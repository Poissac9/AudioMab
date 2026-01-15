"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Shuffle, Repeat, Infinity, Disc3, GripVertical } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { formatDuration } from "@/services/invidious";
import styles from "./QueueView.module.css";

interface QueueViewProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function QueueView({ isOpen, onClose }: QueueViewProps) {
    const { state, toggleShuffle, cycleRepeat, playTrack } = usePlayer();
    const { currentTrack, queue, currentIndex, shuffle, repeat } = state;

    if (!currentTrack) return null;

    const upcomingTracks = queue.slice(currentIndex + 1);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Blurred background */}
                    <div
                        className={styles.background}
                        style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}
                    />
                    <div className={styles.backgroundOverlay} />

                    <motion.div
                        className={styles.container}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    >
                        {/* Header with current track */}
                        <header className={styles.header}>
                            <div className={styles.currentTrack}>
                                <img
                                    src={currentTrack.thumbnail}
                                    alt={currentTrack.title}
                                    className={styles.currentArtwork}
                                />
                                <div className={styles.currentInfo}>
                                    <p className={styles.currentTitle}>{currentTrack.title}</p>
                                    <p className={styles.currentArtist}>{currentTrack.artist}</p>
                                </div>
                                <button className={styles.starButton} aria-label="Favorite">
                                    <Disc3 size={20} />
                                </button>
                                <button className={styles.moreButton} aria-label="More">
                                    <X size={20} onClick={onClose} />
                                </button>
                            </div>
                        </header>

                        {/* Action buttons */}
                        <div className={styles.actions}>
                            <button
                                className={`${styles.actionButton} ${shuffle ? styles.active : ""}`}
                                onClick={toggleShuffle}
                            >
                                <Shuffle size={18} />
                            </button>
                            <button
                                className={`${styles.actionButton} ${repeat !== "off" ? styles.active : ""}`}
                                onClick={cycleRepeat}
                            >
                                <Repeat size={18} />
                                {repeat === "one" && <span className={styles.repeatOne}>1</span>}
                            </button>
                            <button className={styles.actionButton}>
                                <Infinity size={18} />
                            </button>
                            <button className={styles.actionButton}>
                                <Disc3 size={18} />
                            </button>
                        </div>

                        {/* Queue section */}
                        <div className={styles.queueSection}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Continue Playing</h2>
                                <p className={styles.sectionSubtitle}>AutoPlaying similar music</p>
                            </div>

                            <div className={styles.queueList}>
                                {upcomingTracks.length === 0 ? (
                                    <p className={styles.emptyQueue}>No more tracks in queue</p>
                                ) : (
                                    upcomingTracks.map((track, index) => (
                                        <div
                                            key={`${track.id}-${index}`}
                                            className={styles.queueItem}
                                            onClick={() => playTrack(track, queue, currentIndex + 1 + index)}
                                        >
                                            <div className={styles.queueArtwork}>
                                                <img src={track.thumbnail} alt={track.title} />
                                            </div>
                                            <div className={styles.queueInfo}>
                                                <p className={styles.queueTitle}>{track.title}</p>
                                                <p className={styles.queueArtist}>{track.artist}</p>
                                            </div>
                                            <GripVertical size={18} className={styles.dragHandle} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
