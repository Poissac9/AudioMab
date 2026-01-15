"use client";

import { motion } from "framer-motion";
import { MoreHorizontal, Download } from "lucide-react";
import { Track } from "@/types";
import { usePlayer } from "@/context/PlayerContext";
import { formatDuration } from "@/services/invidious";
import styles from "./TrackItem.module.css";

interface TrackItemProps {
    track: Track;
    queue: Track[];
    index: number;
    showIndex?: boolean;
    isCached?: boolean;
}

export default function TrackItem({ track, queue, index, showIndex, isCached }: TrackItemProps) {
    const { state, playTrack } = usePlayer();
    const isCurrentTrack = state.currentTrack?.id === track.id;
    const isPlaying = isCurrentTrack && state.isPlaying;

    const handleClick = () => {
        playTrack(track, queue, index);
    };

    return (
        <motion.div
            className={`${styles.container} ${isCurrentTrack ? styles.active : ""}`}
            onClick={handleClick}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.1 }}
        >
            {showIndex && (
                <div className={styles.index}>
                    {isCurrentTrack ? (
                        <div className={styles.equalizer}>
                            <span className={`${styles.bar} ${isPlaying ? styles.playing : ""}`} />
                            <span className={`${styles.bar} ${isPlaying ? styles.playing : ""}`} />
                            <span className={`${styles.bar} ${isPlaying ? styles.playing : ""}`} />
                        </div>
                    ) : (
                        <span className={styles.indexNumber}>{index + 1}</span>
                    )}
                </div>
            )}

            <div className={styles.artwork}>
                <img
                    src={track.thumbnail}
                    alt={track.title}
                    className={styles.artworkImage}
                    loading="lazy"
                />
                {isCurrentTrack && !showIndex && (
                    <div className={styles.playingOverlay}>
                        <div className={styles.equalizer}>
                            <span className={`${styles.bar} ${isPlaying ? styles.playing : ""}`} />
                            <span className={`${styles.bar} ${isPlaying ? styles.playing : ""}`} />
                            <span className={`${styles.bar} ${isPlaying ? styles.playing : ""}`} />
                        </div>
                    </div>
                )}
                {isCached && (
                    <div className={styles.cachedBadge}>
                        <Download size={10} />
                    </div>
                )}
            </div>

            <div className={styles.info}>
                <p className={`${styles.title} text-truncate`}>{track.title}</p>
                <p className={`${styles.artist} text-truncate`}>{track.artist}</p>
            </div>

            <div className={styles.meta}>
                {track.duration > 0 && (
                    <span className={styles.duration}>{formatDuration(track.duration)}</span>
                )}
                <button
                    className={styles.moreButton}
                    onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Open context menu
                    }}
                    aria-label="More options"
                >
                    <MoreHorizontal size={20} />
                </button>
            </div>
        </motion.div>
    );
}
