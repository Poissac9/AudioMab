"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, ArrowRight, Music2, Settings, X, Pencil, Loader2, Apple } from "lucide-react";
import Link from "next/link";
import { useLibrary } from "@/context/LibraryContext";
import styles from "./page.module.css";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { playlists, removePlaylist } = useLibrary();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [importStatus, setImportStatus] = useState("");

  // Handle shared URLs from PWA share target
  useEffect(() => {
    const sharedUrl = searchParams.get("share") || searchParams.get("import");
    if (sharedUrl) {
      setUrl(sharedUrl);
      // Auto-import if it's a valid URL
      if (sharedUrl.includes("youtube.com") || sharedUrl.includes("youtu.be") ||
        sharedUrl.includes("music.apple.com")) {
        handleImport(null, sharedUrl);
      }
    }
  }, [searchParams]);

  const handleImport = async (e: React.FormEvent | null, importUrl?: string) => {
    if (e) e.preventDefault();
    const targetUrl = importUrl || url;
    if (!targetUrl.trim()) return;

    setIsLoading(true);
    setError("");
    setImportStatus("Connecting...");

    try {
      // Check if it's an Apple Music link
      if (targetUrl.includes("music.apple.com")) {
        setImportStatus("Importing Apple Music playlist...");

        const response = await fetch("/api/apple-music", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to import");
        }

        if (data.matchedSongs > 0) {
          setImportStatus(`Found ${data.matchedSongs} of ${data.originalSongs} songs!`);
          setTimeout(() => {
            router.push(`/playlist/${data.data.id}?data=${encodeURIComponent(JSON.stringify(data.data))}`);
          }, 1000);
        } else {
          throw new Error("Could not match any songs. Try sharing individual songs instead.");
        }
      } else {
        // YouTube import
        setImportStatus("Importing from YouTube...");

        const response = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to import");
        }

        router.push(`/playlist/${data.data.id}?data=${encodeURIComponent(JSON.stringify(data.data))}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import");
    } finally {
      setIsLoading(false);
      setImportStatus("");
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this playlist?")) {
      removePlaylist(id);
    }
  };

  // Detect URL type for visual hint
  const urlType = url.includes("music.apple.com") ? "apple" :
    (url.includes("youtube.com") || url.includes("youtu.be")) ? "youtube" : null;

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
            {urlType === "apple" ? (
              <Apple size={20} className={styles.inputIcon} />
            ) : (
              <Link2 size={20} className={styles.inputIcon} />
            )}
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube or Apple Music URL..."
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
              <Loader2 size={18} className={styles.spinner} />
            ) : (
              <>
                Import
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        <AnimatePresence>
          {importStatus && (
            <motion.p
              className={styles.status}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {importStatus}
            </motion.p>
          )}
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
          Paste a YouTube video, playlist, or Apple Music playlist link
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
            Import your first playlist from YouTube or Apple Music
          </p>
        </section>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className={styles.page}>
        <div className={styles.loadingState}>
          <Loader2 size={32} className={styles.spinner} />
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
