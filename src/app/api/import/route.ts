import { NextRequest, NextResponse } from "next/server";

const USE_YTDLP = process.env.NODE_ENV === "development";
const YTDLP_API_URL = process.env.YTDLP_API_URL;

// Invidious instances for production fallback
const INVIDIOUS_INSTANCES = [
    "https://vid.puffyan.us",
    "https://invidious.fdn.fr",
    "https://invidious.nerdvpn.de",
    "https://yt.artemislena.eu",
];

async function getPlaylistFromInvidious(playlistId: string) {
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            const response = await fetch(
                `${instance}/api/v1/playlists/${playlistId}`,
                {
                    headers: { "Accept": "application/json" },
                    signal: AbortSignal.timeout(15000),
                }
            );

            if (response.ok) {
                const data = await response.json();
                return {
                    id: data.playlistId,
                    title: data.title,
                    author: data.author,
                    thumbnail: data.playlistThumbnail ||
                        data.videos?.[0]?.videoThumbnails?.[0]?.url ||
                        `https://i.ytimg.com/vi/${data.videos?.[0]?.videoId}/mqdefault.jpg`,
                    tracks: data.videos?.map((video: {
                        videoId: string;
                        title: string;
                        author: string;
                        lengthSeconds: number;
                        videoThumbnails: { url: string }[];
                    }) => ({
                        id: video.videoId,
                        videoId: video.videoId,
                        title: video.title,
                        artist: video.author,
                        duration: video.lengthSeconds,
                        thumbnail: video.videoThumbnails?.[0]?.url ||
                            `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
                    })) || [],
                    source: "invidious",
                };
            }
        } catch (error) {
            console.log(`Invidious instance ${instance} failed:`, error);
            continue;
        }
    }
    return null;
}

async function getVideoFromInvidious(videoId: string) {
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            const response = await fetch(
                `${instance}/api/v1/videos/${videoId}`,
                {
                    headers: { "Accept": "application/json" },
                    signal: AbortSignal.timeout(10000),
                }
            );

            if (response.ok) {
                const data = await response.json();
                return {
                    id: data.videoId,
                    title: data.title,
                    author: data.author,
                    thumbnail: data.videoThumbnails?.[0]?.url ||
                        `https://i.ytimg.com/vi/${data.videoId}/mqdefault.jpg`,
                    tracks: [{
                        id: data.videoId,
                        videoId: data.videoId,
                        title: data.title,
                        artist: data.author,
                        duration: data.lengthSeconds,
                        thumbnail: data.videoThumbnails?.[0]?.url ||
                            `https://i.ytimg.com/vi/${data.videoId}/mqdefault.jpg`,
                    }],
                    source: "invidious",
                };
            }
        } catch (error) {
            console.log(`Invidious instance ${instance} failed:`, error);
            continue;
        }
    }
    return null;
}

function extractYouTubeId(url: string): { type: "video" | "playlist"; id: string } | null {
    try {
        const urlObj = new URL(url);

        // Playlist URLs
        const playlistId = urlObj.searchParams.get("list");
        if (playlistId) {
            return { type: "playlist", id: playlistId };
        }

        // Video URLs
        let videoId = urlObj.searchParams.get("v");

        // youtu.be short URLs
        if (urlObj.hostname === "youtu.be") {
            videoId = urlObj.pathname.slice(1);
        }

        // youtube.com/shorts/
        if (urlObj.pathname.startsWith("/shorts/")) {
            videoId = urlObj.pathname.replace("/shorts/", "");
        }

        if (videoId) {
            return { type: "video", id: videoId };
        }

        return null;
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        const parsed = extractYouTubeId(url);
        if (!parsed) {
            return NextResponse.json(
                { error: "Invalid YouTube URL" },
                { status: 400 }
            );
        }

        // Try yt-dlp locally (development)
        if (USE_YTDLP) {
            try {
                if (parsed.type === "playlist") {
                    const { getPlaylistInfo } = await import("@/services/ytdlp");
                    const data = await getPlaylistInfo(parsed.id);
                    return NextResponse.json({ data, source: "yt-dlp" });
                } else {
                    const { getVideoInfo } = await import("@/services/ytdlp");
                    const info = await getVideoInfo(parsed.id);
                    return NextResponse.json({
                        data: {
                            id: info.id,
                            title: info.title,
                            author: info.uploader,
                            thumbnail: info.thumbnail,
                            tracks: [{
                                id: info.id,
                                videoId: info.id,
                                title: info.title,
                                artist: info.uploader,
                                duration: info.duration,
                                thumbnail: info.thumbnail,
                            }],
                        },
                        source: "yt-dlp",
                    });
                }
            } catch (error) {
                console.error("yt-dlp import failed:", error);
                // Fall through to other methods
            }
        }

        // Try external yt-dlp API (if configured)
        if (YTDLP_API_URL) {
            try {
                const response = await fetch(`${YTDLP_API_URL}/import`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url }),
                });
                if (response.ok) {
                    const result = await response.json();
                    return NextResponse.json({ ...result, source: "external-ytdlp" });
                }
            } catch (error) {
                console.error("External yt-dlp API failed:", error);
            }
        }

        // Fallback to Invidious API (production)
        if (parsed.type === "playlist") {
            const data = await getPlaylistFromInvidious(parsed.id);
            if (data) {
                return NextResponse.json({ data });
            }
        } else {
            const data = await getVideoFromInvidious(parsed.id);
            if (data) {
                return NextResponse.json({ data });
            }
        }

        return NextResponse.json(
            { error: "Failed to import. All backends unavailable." },
            { status: 503 }
        );
    } catch (error) {
        console.error("Import error:", error);
        return NextResponse.json(
            { error: "Failed to process URL" },
            { status: 500 }
        );
    }
}
