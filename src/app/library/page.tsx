"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Music2, Heart, Clock, ChevronRight } from "lucide-react";
import { useLibrary } from "@/context/LibraryContext";
import styles from "./page.module.css";

export default function LibraryPage() {
    const router = useRouter();
    const { playlists, favorites, recentlyPlayed } = useLibrary();

    return (
        <main className={styles.page}>
            <h1 className="title-large">Library</h1>

            {/* Quick Access */}
            <section className={styles.quickAccess}>
                <motion.div
                    className={styles.quickCard}
                    onClick={() => router.push("/library/favorites")}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className={`${styles.quickIcon} ${styles.favorites}`}>
                        <Heart size={24} fill="currentColor" />
                    </div>
                    <div className={styles.quickInfo}>
                        <h3 className={styles.quickTitle}>Favorites</h3>
                        <p className={styles.quickMeta}>{favorites.length} songs</p>
                    </div>
                    <ChevronRight size={20} className={styles.quickArrow} />
                </motion.div>

                <motion.div
                    className={styles.quickCard}
                    onClick={() => router.push("/library/recent")}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className={`${styles.quickIcon} ${styles.recent}`}>
                        <Clock size={24} />
                    </div>
                    <div className={styles.quickInfo}>
                        <h3 className={styles.quickTitle}>Recently Played</h3>
                        <p className={styles.quickMeta}>{recentlyPlayed?.length || 0} songs</p>
                    </div>
                    <ChevronRight size={20} className={styles.quickArrow} />
                </motion.div>
            </section>

            {/* Playlists */}
            <section className={styles.section}>
                <h2 className="title">Playlists</h2>

                {playlists.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Music2 size={32} />
                        </div>
                        <p className={styles.emptyText}>No playlists yet</p>
                        <p className={styles.emptyHint}>
                            Import from YouTube to add playlists
                        </p>
                    </div>
                ) : (
                    <div className={styles.playlistList}>
                        {[...playlists].reverse().map((playlist, i) => (
                            <motion.div
                                key={playlist.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <Link href={`/playlist/${playlist.id}`} className={styles.playlistItem}>
                                    <div className={styles.playlistArtwork}>
                                        {playlist.thumbnail ? (
                                            <img src={playlist.thumbnail} alt={playlist.title} />
                                        ) : (
                                            <div className={styles.placeholderArtwork}>
                                                <Music2 size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.playlistInfo}>
                                        <p className={`${styles.playlistTitle} text-truncate`}>
                                            {playlist.title}
                                        </p>
                                        <p className={`${styles.playlistMeta} text-truncate`}>
                                            Playlist • {playlist.tracks.length} songs
                                        </p>
                                    </div>
                                    <ChevronRight size={20} className={styles.playlistArrow} />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
