import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface YtDlpVideoInfo {
    id: string;
    title: string;
    uploader: string;
    thumbnail: string;
    duration: number;
    audioUrl: string;
}

export interface YtDlpPlaylistInfo {
    id: string;
    title: string;
    uploader: string;
    entries: Array<{
        id: string;
        title: string;
        uploader: string;
        thumbnail: string;
        duration: number;
    }>;
}

/**
 * Get video info and audio URL using yt-dlp
 */
export async function getVideoInfo(videoId: string): Promise<YtDlpVideoInfo> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        // Get video metadata as JSON
        const { stdout: infoJson } = await execAsync(
            `python -m yt_dlp --dump-json --no-warnings "${url}"`,
            { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer for large playlists
        );

        const info = JSON.parse(infoJson);

        // Find best audio format
        const audioFormats = (info.formats || [])
            .filter((f: { acodec?: string; vcodec?: string }) =>
                f.acodec && f.acodec !== "none" && (!f.vcodec || f.vcodec === "none")
            )
            .sort((a: { abr?: number }, b: { abr?: number }) =>
                (b.abr || 0) - (a.abr || 0)
            );

        const audioUrl = audioFormats[0]?.url || info.url;

        return {
            id: info.id,
            title: info.title,
            uploader: info.uploader || info.channel || "Unknown",
            thumbnail: info.thumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            duration: info.duration || 0,
            audioUrl,
        };
    } catch (error) {
        console.error("yt-dlp getVideoInfo error:", error);
        throw new Error(`Failed to get video info: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Get audio URL only (faster, using -g flag)
 */
export async function getAudioUrl(videoId: string): Promise<string> {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        const { stdout } = await execAsync(
            `python -m yt_dlp -f bestaudio --get-url --no-warnings "${url}"`
        );

        return stdout.trim();
    } catch (error) {
        console.error("yt-dlp getAudioUrl error:", error);
        throw new Error(`Failed to get audio URL: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Get playlist info using yt-dlp
 */
export async function getPlaylistInfo(playlistId: string): Promise<YtDlpPlaylistInfo> {
    const url = `https://www.youtube.com/playlist?list=${playlistId}`;

    try {
        // Get playlist metadata with flat extraction (faster)
        const { stdout: infoJson } = await execAsync(
            `python -m yt_dlp --dump-json --flat-playlist --no-warnings "${url}"`,
            { maxBuffer: 50 * 1024 * 1024 } // 50MB buffer
        );

        // yt-dlp outputs one JSON per line for playlists
        const lines = infoJson.trim().split("\n");
        const entries = lines.map((line) => {
            const entry = JSON.parse(line);
            return {
                id: entry.id,
                title: entry.title,
                uploader: entry.uploader || entry.channel || "Unknown",
                thumbnail: entry.thumbnail || `https://i.ytimg.com/vi/${entry.id}/mqdefault.jpg`,
                duration: entry.duration || 0,
            };
        });

        // Get playlist metadata from first entry or make another call
        const firstEntry = entries[0];

        return {
            id: playlistId,
            title: `Playlist (${entries.length} videos)`,
            uploader: firstEntry?.uploader || "Unknown",
            entries,
        };
    } catch (error) {
        console.error("yt-dlp getPlaylistInfo error:", error);
        throw new Error(`Failed to get playlist info: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Search YouTube using yt-dlp
 */
export async function searchYouTube(query: string, limit: number = 10): Promise<Array<{
    id: string;
    title: string;
    uploader: string;
    thumbnail: string;
    duration: number;
    type: "video";
}>> {
    try {
        const { stdout: searchJson } = await execAsync(
            `python -m yt_dlp --dump-json --flat-playlist --no-warnings "ytsearch${limit}:${query}"`,
            { maxBuffer: 10 * 1024 * 1024 }
        );

        const lines = searchJson.trim().split("\n").filter(Boolean);

        return lines.map((line) => {
            const entry = JSON.parse(line);
            return {
                id: entry.id,
                title: entry.title,
                uploader: entry.uploader || entry.channel || "Unknown",
                thumbnail: entry.thumbnail || `https://i.ytimg.com/vi/${entry.id}/mqdefault.jpg`,
                duration: entry.duration || 0,
                type: "video" as const,
            };
        });
    } catch (error) {
        console.error("yt-dlp search error:", error);
        throw new Error(`Search failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Check if yt-dlp is available
 */
export async function isYtDlpAvailable(): Promise<boolean> {
    try {
        await execAsync("python -m yt_dlp --version");
        return true;
    } catch {
        return false;
    }
}
