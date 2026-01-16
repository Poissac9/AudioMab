"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Music2, CheckCircle, AlertCircle } from "lucide-react";
import styles from "./page.module.css";

function ShareTargetContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Processing shared link...");

    useEffect(() => {
        const processShare = async () => {
            const sharedUrl = searchParams.get("url") || searchParams.get("text") || "";

            if (!sharedUrl) {
                setStatus("error");
                setMessage("No URL found in shared content");
                setTimeout(() => router.push("/"), 2000);
                return;
            }

            // Check if it's an Apple Music playlist
            if (sharedUrl.includes("music.apple.com")) {
                setMessage("Apple Music link detected. Redirecting to import...");
                // Redirect to home with the shared URL for import
                router.push(`/?import=${encodeURIComponent(sharedUrl)}`);
                return;
            }

            // Check if it's a YouTube link
            if (sharedUrl.includes("youtube.com") || sharedUrl.includes("youtu.be")) {
                setMessage("YouTube link detected. Importing...");

                try {
                    const response = await fetch("/api/import", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: sharedUrl }),
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setStatus("success");
                        setMessage("Import successful! Redirecting...");
                        setTimeout(() => {
                            router.push(`/playlist/${data.data.id}?data=${encodeURIComponent(JSON.stringify(data.data))}`);
                        }, 1000);
                    } else {
                        throw new Error("Import failed");
                    }
                } catch (error) {
                    console.error("Import error:", error);
                    setStatus("error");
                    setMessage("Failed to import. Please try again.");
                    setTimeout(() => router.push("/"), 2000);
                }
                return;
            }

            // Unknown link type
            setStatus("error");
            setMessage("Unsupported link type");
            setTimeout(() => router.push("/"), 2000);
        };

        processShare();
    }, [searchParams, router]);

    return (
        <main className={styles.page}>
            <div className={styles.content}>
                <div className={styles.iconWrapper}>
                    {status === "loading" && <Loader2 size={48} className={styles.spinner} />}
                    {status === "success" && <CheckCircle size={48} className={styles.success} />}
                    {status === "error" && <AlertCircle size={48} className={styles.error} />}
                </div>
                <h1 className={styles.title}>
                    {status === "loading" && "Processing..."}
                    {status === "success" && "Success!"}
                    {status === "error" && "Error"}
                </h1>
                <p className={styles.message}>{message}</p>
            </div>
        </main>
    );
}

export default function ShareTargetPage() {
    return (
        <Suspense fallback={
            <main className={styles.page}>
                <div className={styles.content}>
                    <Loader2 size={48} className={styles.spinner} />
                    <h1 className={styles.title}>Loading...</h1>
                </div>
            </main>
        }>
            <ShareTargetContent />
        </Suspense>
    );
}
