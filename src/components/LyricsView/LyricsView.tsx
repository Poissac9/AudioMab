"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { formatDuration } from "@/services/invidious";
import styles from "./LyricsView.module.css";

interface LyricsLine {
    time: number;
    text: string;
    words?: { time: number; text: string }[];
}

interface LyricsViewProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LyricsView({ isOpen, onClose }: LyricsViewProps) {
    const { state, togglePlayPause, nextTrack, prevTrack, seek, setVolume } = usePlayer();
    const { currentTrack, currentTime, duration, isPlaying, volume } = state;
    const [lyrics, setLyrics] = useState<LyricsLine[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const activeLineRef = useRef<HTMLDivElement>(null);

    // Fetch lyrics when track changes
    useEffect(() => {
        if (!currentTrack || !isOpen) return;

        const fetchLyrics = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const searchQuery = `${currentTrack.title} ${currentTrack.artist}`;
                const response = await fetch(
                    `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`
                );

                if (!response.ok) throw new Error("Failed to fetch lyrics");

                const data = await response.json();

                if (data.length > 0 && data[0].syncedLyrics) {
                    const parsed = parseLRC(data[0].syncedLyrics);
                    setLyrics(parsed);
                } else if (data.length > 0 && data[0].plainLyrics) {
                    const lines = data[0].plainLyrics.split("\n").filter(Boolean);
                    const estimatedDuration = duration || 180;
                    const timePerLine = estimatedDuration / lines.length;
                    setLyrics(lines.map((text: string, i: number) => ({
                        time: i * timePerLine,
                        text,
                    })));
                } else {
                    setError("No lyrics found");
                    setLyrics([]);
                }
            } catch (err) {
                console.error("Lyrics fetch error:", err);
                setError("Could not load lyrics");
                setLyrics([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLyrics();
    }, [currentTrack?.id, isOpen]);

    // Parse LRC format
    const parseLRC = (lrc: string): LyricsLine[] => {
        const lines: LyricsLine[] = [];
        const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g;
        let match;

        while ((match = regex.exec(lrc)) !== null) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const ms = parseInt(match[3], 10);
            const text = match[4].trim();

            if (text) {
                lines.push({
                    time: minutes * 60 + seconds + ms / (match[3].length === 3 ? 1000 : 100),
                    text,
                });
            }
        }

        return lines.sort((a, b) => a.time - b.time);
    };

    // Find current line index
    const getCurrentLineIndex = (): number => {
        if (lyrics.length === 0) return -1;

        for (let i = lyrics.length - 1; i >= 0; i--) {
            if (currentTime >= lyrics[i].time) {
                return i;
            }
        }
        return 0;
    };

    const currentLineIndex = getCurrentLineIndex();

    // Calculate word progress for current line
    const getWordProgress = useMemo(() => {
        if (currentLineIndex < 0 || !lyrics[currentLineIndex]) return 0;

        const line = lyrics[currentLineIndex];
        const nextLine = lyrics[currentLineIndex + 1];
        const lineDuration = nextLine ? nextLine.time - line.time : 5;
        const lineProgress = currentTime - line.time;
        const words = line.text.split(" ");
        const charProgress = lineProgress / lineDuration;

        return Math.min(charProgress, 1);
    }, [currentTime, currentLineIndex, lyrics]);

    // Scroll to active line
    useEffect(() => {
        if (activeLineRef.current && containerRef.current) {
            activeLineRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [currentLineIndex]);

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (!currentTrack) return null;

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
                        {/* Header */}
                        <header className={styles.header}>
                            <div className={styles.trackInfo}>
                                <img
                                    src={currentTrack.thumbnail}
                                    alt={currentTrack.title}
                                    className={styles.artwork}
                                />
                                <div className={styles.trackDetails}>
                                    <p className={styles.trackTitle}>{currentTrack.title}</p>
                                    <p className={styles.trackArtist}>{currentTrack.artist}</p>
                                </div>
                            </div>
                            <button className={styles.closeButton} onClick={onClose}>
                                <X size={20} />
                            </button>
                        </header>

                        {/* Lyrics content */}
                        <div className={styles.lyricsContainer} ref={containerRef}>
                            {isLoading && (
                                <div className={styles.loading}>
                                    <Sparkles size={24} />
                                    <p>Loading lyrics...</p>
                                </div>
                            )}

                            {error && (
                                <div className={styles.error}>
                                    <p>{error}</p>
                                </div>
                            )}

                            {!isLoading && !error && lyrics.length > 0 && (
                                <div className={styles.lyrics}>
                                    {lyrics.map((line, index) => {
                                        const isActive = index === currentLineIndex;
                                        const isPast = index < currentLineIndex;
                                        const isNear = Math.abs(index - currentLineIndex) <= 3;

                                        return (
                                            <motion.div
                                                key={index}
                                                ref={isActive ? activeLineRef : undefined}
                                                className={`${styles.line} ${isActive ? styles.active : ""} ${isPast ? styles.past : ""}`}
                                                onClick={() => seek(line.time)}
                                                initial={false}
                                                animate={{
                                                    opacity: isActive ? 1 : isNear ? (isPast ? 0.3 : 0.5) : 0.15,
                                                    scale: isActive ? 1 : 0.92,
                                                    y: isActive ? 0 : isPast ? -5 : 5,
                                                }}
                                                transition={{ duration: 0.4, ease: "easeOut" }}
                                            >
                                                {isActive ? (
                                                    <span className={styles.activeLine}>
                                                        {line.text.split("").map((char, charIndex) => {
                                                            const charPercent = charIndex / line.text.length;
                                                            const isRevealed = charPercent <= getWordProgress;
                                                            return (
                                                                <span
                                                                    key={charIndex}
                                                                    className={isRevealed ? styles.revealed : styles.hidden}
                                                                >
                                                                    {char}
                                                                </span>
                                                            );
                                                        })}
                                                    </span>
                                                ) : (
                                                    line.text
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* AI button */}
                        <button className={styles.aiButton}>
                            <Sparkles size={18} />
                        </button>

                        {/* Progress Bar */}
                        <div className={styles.progressSection}>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className={styles.progressTimes}>
                                <span>{formatDuration(currentTime)}</span>
                                <span>-{formatDuration(Math.max(0, duration - currentTime))}</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className={styles.controls}>
                            <button className={styles.controlButton} onClick={prevTrack}>
                                <SkipBack size={28} fill="currentColor" />
                            </button>
                            <button className={styles.playButton} onClick={togglePlayPause}>
                                {isPlaying ? (
                                    <Pause size={32} fill="currentColor" />
                                ) : (
                                    <Play size={32} fill="currentColor" style={{ marginLeft: 3 }} />
                                )}
                            </button>
                            <button className={styles.controlButton} onClick={nextTrack}>
                                <SkipForward size={28} fill="currentColor" />
                            </button>
                        </div>

                        {/* Volume */}
                        <div className={styles.volumeSection}>
                            <Volume2 size={14} className={styles.volumeIcon} />
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className={styles.volumeSlider}
                            />
                            <Volume2 size={18} className={styles.volumeIcon} />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
