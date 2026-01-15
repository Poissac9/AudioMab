"use client";

import { ChevronLeft, Moon, Sun, Monitor, Download, Trash2, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useLibrary } from "@/context/LibraryContext";
import styles from "./page.module.css";

export default function SettingsPage() {
    const router = useRouter();
    const { mode, setMode, isDark } = useTheme();
    const { playlists, favorites, clearAll } = useLibrary();

    const handleClearData = () => {
        if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
            clearAll();
        }
    };

    return (
        <main className={styles.page}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    <ChevronLeft size={28} />
                </button>
                <h1 className={styles.title}>Settings</h1>
                <div className={styles.spacer} />
            </header>

            {/* Appearance Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Appearance</h2>
                <div className={styles.card}>
                    <div className={styles.optionRow}>
                        <div className={styles.optionInfo}>
                            <div className={styles.optionIcon}>
                                {isDark ? <Moon size={20} /> : <Sun size={20} />}
                            </div>
                            <span>Theme</span>
                        </div>
                    </div>

                    <div className={styles.themeOptions}>
                        <button
                            className={`${styles.themeButton} ${mode === "light" ? styles.active : ""}`}
                            onClick={() => setMode("light")}
                        >
                            <Sun size={18} />
                            Light
                        </button>
                        <button
                            className={`${styles.themeButton} ${mode === "dark" ? styles.active : ""}`}
                            onClick={() => setMode("dark")}
                        >
                            <Moon size={18} />
                            Dark
                        </button>
                        <button
                            className={`${styles.themeButton} ${mode === "auto" ? styles.active : ""}`}
                            onClick={() => setMode("auto")}
                        >
                            <Monitor size={18} />
                            Auto
                        </button>
                    </div>
                </div>
            </section>

            {/* Data Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Data</h2>
                <div className={styles.card}>
                    <div className={styles.optionRow}>
                        <div className={styles.optionInfo}>
                            <div className={styles.optionIcon}>
                                <Download size={20} />
                            </div>
                            <div>
                                <span>Storage</span>
                                <p className={styles.optionMeta}>
                                    {playlists.length} playlists • {favorites.length} favorites
                                </p>
                            </div>
                        </div>
                    </div>

                    <button className={styles.dangerButton} onClick={handleClearData}>
                        <Trash2 size={18} />
                        Clear All Data
                    </button>
                </div>
            </section>

            {/* About Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>About</h2>
                <div className={styles.card}>
                    <div className={styles.optionRow}>
                        <div className={styles.optionInfo}>
                            <div className={styles.optionIcon}>
                                <Info size={20} />
                            </div>
                            <div>
                                <span>AudioMab</span>
                                <p className={styles.optionMeta}>Version 1.0.0</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
