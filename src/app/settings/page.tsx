"use client";

import { ChevronLeft, Moon, Sun, Monitor, Download, Trash2, Info, Github, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useLibrary } from "@/context/LibraryContext";
import styles from "./page.module.css";

// X (Twitter) icon component
const XIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

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

                    {/* Links */}
                    <div className={styles.linksSection}>
                        <a
                            href="https://github.com/Poissac9/AudioMab"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.linkButton}
                        >
                            <Github size={18} />
                            <span>View on GitHub</span>
                            <ExternalLink size={14} className={styles.externalIcon} />
                        </a>

                        <a
                            href="https://x.com/berlyoge"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.linkButton}
                        >
                            <XIcon size={18} />
                            <span>Follow @berlyoge</span>
                            <ExternalLink size={14} className={styles.externalIcon} />
                        </a>
                    </div>
                </div>
            </section>

            {/* Disclaimer Section */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Legal</h2>
                <div className={styles.card}>
                    <div className={styles.disclaimer}>
                        <p className={styles.disclaimerTitle}>⚠️ Disclaimer</p>
                        <p className={styles.disclaimerText}>
                            This app is for <strong>personal, educational use only</strong>.
                            Commercial use is prohibited as it may violate YouTube&apos;s Terms of Service
                            and Google&apos;s policies.
                        </p>
                        <p className={styles.disclaimerText}>
                            The author is not responsible for how you use this software.
                            Please respect content creators&apos; rights and applicable copyright laws.
                        </p>
                    </div>
                </div>
            </section>

            {/* Credits */}
            <footer className={styles.footer}>
                <p>Made with ❤️ by <a href="https://x.com/berlyoge" target="_blank" rel="noopener noreferrer">@berlyoge</a></p>
            </footer>
        </main>
    );
}
