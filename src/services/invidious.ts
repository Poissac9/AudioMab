import { VideoInfo, PlaylistInfo } from "@/types";

// Public Invidious instances - will try in order
const INVIDIOUS_INSTANCES = [
    "https://invidious.nerdvpn.de",
    "https://invidious.jing.rocks",
    "https://invidious.einfachzocken.eu",
    "https://yt.artemislena.eu",
    "https://inv.nadeko.net",
];

// Piped instances as fallback
const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.r4fo.com",
    "https://pipedapi.adminforge.de",
    "https://api.piped.projectsegfau.lt",
];

async function fetchWithFallback<T>(
    endpoints: string[],
    pathFn: (base: string) => string
): Promise<T> {
    let lastError: Error | null = null;

    for (const base of endpoints) {
        try {
            const url = pathFn(base);
            const response = await fetch(url, {
                headers: {
                    "Accept": "application/json",
                },
                next: { revalidate: 3600 }, // Cache for 1 hour
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            lastError = error as Error;
            console.warn(`Failed to fetch from ${base}:`, error);
            continue;
        }
    }

    throw lastError || new Error("All instances failed");
}

export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
    // Try Invidious first
    try {
        const data = await fetchWithFallback<{
            videoId: string;
            title: string;
            author: string;
            videoThumbnails: Array<{ url: string; quality: string }>;
            lengthSeconds: number;
            adaptiveFormats: Array<{
                type: string;
                url: string;
                bitrate: string;
                audioQuality?: string;
            }>;
        }>(INVIDIOUS_INSTANCES, (base) => `${base}/api/v1/videos/${videoId}`);

        // Find best audio format
        const audioFormats = data.adaptiveFormats
            .filter((f) => f.type.startsWith("audio/"))
            .sort((a, b) => parseInt(b.bitrate) - parseInt(a.bitrate));

        const thumbnail = data.videoThumbnails.find((t) => t.quality === "maxres")?.url ||
            data.videoThumbnails[0]?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        return {
            videoId: data.videoId,
            title: data.title,
            author: data.author,
            thumbnail,
            duration: data.lengthSeconds,
            audioUrl: audioFormats[0]?.url,
        };
    } catch (error) {
        console.warn("Invidious failed, trying Piped:", error);
    }

    // Fallback to Piped
    const data = await fetchWithFallback<{
        title: string;
        uploader: string;
        thumbnailUrl: string;
        duration: number;
        audioStreams: Array<{
            url: string;
            bitrate: number;
            mimeType: string;
        }>;
    }>(PIPED_INSTANCES, (base) => `${base}/streams/${videoId}`);

    const audioStreams = data.audioStreams
        .filter((s) => s.mimeType.startsWith("audio/"))
        .sort((a, b) => b.bitrate - a.bitrate);

    return {
        videoId,
        title: data.title,
        author: data.uploader,
        thumbnail: data.thumbnailUrl,
        duration: data.duration,
        audioUrl: audioStreams[0]?.url,
    };
}

export async function getPlaylistInfo(playlistId: string): Promise<PlaylistInfo> {
    // Try Invidious first
    try {
        const data = await fetchWithFallback<{
            playlistId: string;
            title: string;
            author: string;
            playlistThumbnail: string;
            videos: Array<{
                videoId: string;
                title: string;
                author: string;
                videoThumbnails: Array<{ url: string; quality: string }>;
                lengthSeconds: number;
            }>;
        }>(INVIDIOUS_INSTANCES, (base) => `${base}/api/v1/playlists/${playlistId}`);

        return {
            playlistId: data.playlistId,
            title: data.title,
            author: data.author,
            thumbnail: data.playlistThumbnail || data.videos[0]?.videoThumbnails[0]?.url || "",
            videos: data.videos.map((v) => ({
                videoId: v.videoId,
                title: v.title,
                author: v.author,
                thumbnail: v.videoThumbnails.find((t) => t.quality === "medium")?.url ||
                    v.videoThumbnails[0]?.url ||
                    `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
                duration: v.lengthSeconds,
            })),
        };
    } catch (error) {
        console.warn("Invidious failed for playlist, trying Piped:", error);
    }

    // Fallback to Piped
    const data = await fetchWithFallback<{
        name: string;
        uploader: string;
        thumbnailUrl: string;
        relatedStreams: Array<{
            url: string;
            title: string;
            uploaderName: string;
            thumbnail: string;
            duration: number;
        }>;
    }>(PIPED_INSTANCES, (base) => `${base}/playlists/${playlistId}`);

    return {
        playlistId,
        title: data.name,
        author: data.uploader,
        thumbnail: data.thumbnailUrl,
        videos: data.relatedStreams.map((v) => {
            // Extract video ID from Piped URL format
            const videoId = v.url.replace("/watch?v=", "");
            return {
                videoId,
                title: v.title,
                author: v.uploaderName,
                thumbnail: v.thumbnail,
                duration: v.duration,
            };
        }),
    };
}

export function parseYouTubeUrl(url: string): { type: "video" | "playlist"; id: string } | null {
    try {
        const urlObj = new URL(url);

        // Handle youtu.be short links
        if (urlObj.hostname === "youtu.be") {
            const videoId = urlObj.pathname.slice(1);
            if (videoId) {
                return { type: "video", id: videoId };
            }
        }

        // Handle youtube.com links
        if (urlObj.hostname.includes("youtube.com")) {
            // Playlist
            const listParam = urlObj.searchParams.get("list");
            if (listParam) {
                return { type: "playlist", id: listParam };
            }

            // Video
            const videoParam = urlObj.searchParams.get("v");
            if (videoParam) {
                return { type: "video", id: videoParam };
            }

            // Handle /playlist?list= format
            if (urlObj.pathname === "/playlist") {
                const list = urlObj.searchParams.get("list");
                if (list) {
                    return { type: "playlist", id: list };
                }
            }
        }

        return null;
    } catch {
        return null;
    }
}

export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}
