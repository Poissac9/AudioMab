"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, ArrowRight, Music2, Settings, Trash2, X, Pencil } from "lucide-react";
import Link from "next/link";
import { useLibrary } from "@/context/LibraryContext";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const { playlists, removePlaylist } = useLibrary();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import");
      }

      router.push(`/playlist/${data.data.id}?data=${encodeURIComponent(JSON.stringify(data.data))}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this playlist?")) {
      removePlaylist(id);
    }
  };

  // Sort by recently updated
  const recentPlaylists = [...playlists]
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
    .slice(0, 8);

  return (
    <main className={styles.page}>
      {/* Header with logo */}
      <header className={styles.header}>
        <div className={styles.logoRow}>
          <div className={styles.logo}>
            <Music2 size={28} />
          </div>
          <h1 className={styles.title}>AudioMab</h1>
        </div>
        <div className={styles.headerActions}>
          {playlists.length > 0 && (
            <button
              className={`${styles.editButton} ${editMode ? styles.active : ""}`}
              onClick={() => setEditMode(!editMode)}
              aria-label={editMode ? "Done editing" : "Edit playlists"}
            >
              {editMode ? <X size={20} /> : <Pencil size={20} />}
            </button>
          )}
          <Link href="/settings" className={styles.settingsButton}>
            <Settings size={22} />
          </Link>
        </div>
      </header>
      <p className={styles.subtitle}>Stream YouTube audio, your way</p>

      {/* Import Section */}
      <section className={styles.importSection}>
        <form onSubmit={handleImport} className={styles.importForm}>
          <div className={styles.inputWrapper}>
            <Link2 size={20} className={styles.inputIcon} />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL..."
              className={styles.input}
              disabled={isLoading}
            />
          </div>

          <motion.button
            type="submit"
            className={styles.importButton}
            disabled={isLoading || !url.trim()}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <div className={styles.loader} />
            ) : (
              <>
                Import
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        <AnimatePresence>
          {error && (
            <motion.p
              className={styles.error}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <p className={styles.hint}>
          Paste a YouTube video or playlist link
        </p>
      </section>

      {/* Recent Playlists */}
      {recentPlaylists.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className="title">Recently Played</h2>
            {editMode && (
              <span className={styles.editHint}>Tap ✕ to delete</span>
            )}
          </div>

          <div className={styles.playlistGrid}>
            {recentPlaylists.map((playlist, i) => (
              <motion.div
                key={playlist.id}
                className={`${styles.playlistCard} ${editMode ? styles.editMode : ""}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => !editMode && router.push(`/playlist/${playlist.id}`)}
              >
                {editMode && (
                  <motion.button
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(playlist.id);
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={14} />
                  </motion.button>
                )}
                <div className={styles.playlistArtwork}>
                  {playlist.thumbnail ? (
                    <img src={playlist.thumbnail} alt={playlist.title} />
                  ) : (
                    <div className={styles.placeholderArtwork}>
                      <Music2 size={32} />
                    </div>
                  )}
                </div>
                <p className={`${styles.playlistTitle} text-truncate`}>
                  {playlist.title}
                </p>
                <p className={`${styles.playlistMeta} text-truncate`}>
                  {playlist.tracks.length} tracks
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {playlists.length === 0 && (
        <section className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Music2 size={48} />
          </div>
          <h3 className={styles.emptyTitle}>No playlists yet</h3>
          <p className={styles.emptyText}>
            Import your first playlist from YouTube to get started
          </p>
        </section>
      )}
    </main>
  );
}
