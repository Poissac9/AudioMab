"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
    ChevronDown,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Star,
    MoreHorizontal,
    MessageSquare,
    Airplay,
    ListMusic,
    Volume2,
} from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { useLibrary } from "@/context/LibraryContext";
import { formatDuration } from "@/services/invidious";
import QueueView from "@/components/QueueView/QueueView";
import LyricsView from "@/components/LyricsView/LyricsView";
import styles from "./NowPlaying.module.css";

export default function NowPlaying() {
    const {
        state,
        togglePlayPause,
        nextTrack,
        prevTrack,
        seek,
        setVolume,
        closeNowPlaying,
    } = usePlayer();
    const { isFavorite, toggleFavorite } = useLibrary();

    const [showQueue, setShowQueue] = useState(false);
    const [showLyrics, setShowLyrics] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragY, setDragY] = useState(0);
    const progressRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const { currentTrack, isPlaying, currentTime, duration, isNowPlayingOpen } = state;

    // Handle drag on entire container
    const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y > 0) {
            setDragY(info.offset.y);
        }
    };

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setDragY(0);
        if (info.offset.y > 150 || info.velocity.y > 500) {
            closeNowPlaying();
        }
    };

    // Handle progress bar interaction
    const handleProgressClick = (e: React.MouseEvent) => {
        if (!progressRef.current || !duration) return;
        const rect = progressRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        seek(percent * duration);
    };

    const handleProgressDrag = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !progressRef.current || !duration) return;
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const rect = progressRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        seek(percent * duration);
    };

    if (!currentTrack) return null;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const isLiked = isFavorite(currentTrack.id);
    const backgroundOpacity = Math.max(0.85, 1 - dragY / 500);

    return (
        <AnimatePresence>
            {isNowPlayingOpen && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Full-screen blurred background - SOLID, not transparent */}
                    <div
                        className={styles.background}
                        style={{
                            backgroundImage: `url(${currentTrack.thumbnail})`,
                            opacity: backgroundOpacity,
                        }}
                    />
                    <div className={styles.backgroundOverlay} />

                    {/* Main container - draggable */}
                    <motion.div
                        ref={containerRef}
                        className={styles.container}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDrag={handleDrag}
                        onDragEnd={handleDragEnd}
                    >
                        {/* Drag indicator */}
                        <div className={styles.dragIndicator} />

                        {/* Header */}
                        <header className={styles.header}>
                            <button
                                className={styles.headerButton}
                                onClick={closeNowPlaying}
                                aria-label="Close"
                            >
                                <ChevronDown size={28} />
                            </button>
                            <div className={styles.headerCenter}>
                                <span className={styles.playingFrom}>PLAYING FROM PLAYLIST</span>
                            </div>
                            <button className={styles.headerButton} aria-label="More options">
                                <MoreHorizontal size={24} />
                            </button>
                        </header>

                        {/* Content area - artwork display (also draggable) */}
                        <div className={styles.content}>
                            <motion.div
                                className={styles.artworkWrapper}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, type: "spring", damping: 20 }}
                            >
                                <img
                                    src={currentTrack.thumbnail}
                                    alt={currentTrack.title}
                                    className={styles.artwork}
                                    draggable={false}
                                />
                            </motion.div>
                        </div>

                        {/* Track Info */}
                        <div className={styles.trackInfo}>
                            <div className={styles.titleRow}>
                                <div className={styles.titles}>
                                    <h1 className={styles.trackTitle}>{currentTrack.title}</h1>
                                    <p className={styles.trackArtist}>{currentTrack.artist}</p>
                                </div>
                                <button
                                    className={`${styles.favoriteButton} ${isLiked ? styles.liked : ""}`}
                                    onClick={() => toggleFavorite(currentTrack)}
                                    aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
                                >
                                    <Star size={24} fill={isLiked ? "currentColor" : "none"} />
                                </button>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className={styles.progressSection}>
                            <div
                                ref={progressRef}
                                className={styles.progressBar}
                                onClick={handleProgressClick}
                                onMouseDown={() => setIsDragging(true)}
                                onMouseUp={() => setIsDragging(false)}
                                onMouseLeave={() => setIsDragging(false)}
                                onMouseMove={handleProgressDrag}
                            >
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${progress}%` }}
                                />
                                <div
                                    className={styles.progressKnob}
                                    style={{ left: `${progress}%` }}
                                />
                            </div>
                            <div className={styles.progressTimes}>
                                <span>{formatDuration(currentTime)}</span>
                                <span>-{formatDuration(Math.max(0, duration - currentTime))}</span>
                            </div>
                        </div>

                        {/* Main Controls */}
                        <div className={styles.controls}>
                            <button
                                className={styles.controlButton}
                                onClick={prevTrack}
                                aria-label="Previous"
                            >
                                <SkipBack size={36} fill="currentColor" />
                            </button>

                            <button
                                className={styles.playButton}
                                onClick={togglePlayPause}
                                aria-label={isPlaying ? "Pause" : "Play"}
                            >
                                {isPlaying ? (
                                    <Pause size={40} fill="currentColor" />
                                ) : (
                                    <Play size={40} fill="currentColor" style={{ marginLeft: 4 }} />
                                )}
                            </button>

                            <button
                                className={styles.controlButton}
                                onClick={nextTrack}
                                aria-label="Next"
                            >
                                <SkipForward size={36} fill="currentColor" />
                            </button>
                        </div>

                        {/* Volume Slider */}
                        <div className={styles.volumeSection}>
                            <Volume2 size={14} className={styles.volumeIcon} />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={state.volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className={styles.volumeSlider}
                                aria-label="Volume"
                            />
                            <Volume2 size={18} className={styles.volumeIcon} />
                        </div>

                        {/* Bottom Actions */}
                        <div className={styles.bottomActions}>
                            <button
                                className={`${styles.actionButton} ${showLyrics ? styles.active : ""}`}
                                onClick={() => setShowLyrics(true)}
                                aria-label="Lyrics"
                            >
                                <MessageSquare size={22} />
                            </button>
                            <button className={styles.actionButton} aria-label="AirPlay">
                                <Airplay size={22} />
                            </button>
                            <button
                                className={`${styles.actionButton} ${showQueue ? styles.active : ""}`}
                                onClick={() => setShowQueue(true)}
                                aria-label="Queue"
                            >
                                <ListMusic size={22} />
                            </button>
                        </div>
                    </motion.div>

                    {/* Queue View */}
                    <QueueView isOpen={showQueue} onClose={() => setShowQueue(false)} />

                    {/* Lyrics View */}
                    <LyricsView isOpen={showLyrics} onClose={() => setShowLyrics(false)} />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
