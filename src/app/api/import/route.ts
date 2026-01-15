import { NextRequest, NextResponse } from "next/server";
import { parseYouTubeUrl } from "@/services/invidious";

const USE_YTDLP = process.env.NODE_ENV === "development";
const YTDLP_API_URL = process.env.YTDLP_API_URL;

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        const parsed = parseYouTubeUrl(url);

        if (!parsed) {
            return NextResponse.json(
                { error: "Invalid YouTube URL" },
                { status: 400 }
            );
        }

        // Try yt-dlp locally (development)
        if (USE_YTDLP) {
            try {
                const { getVideoInfo, getPlaylistInfo } = await import("@/services/ytdlp");

                if (parsed.type === "video") {
                    const info = await getVideoInfo(parsed.id);
                    return NextResponse.json({
                        type: "video",
                        source: "yt-dlp",
                        data: {
                            id: info.id,
                            title: info.title,
                            author: info.uploader,
                            thumbnail: info.thumbnail,
                            tracks: [{
                                id: info.id,
                                title: info.title,
                                artist: info.uploader,
                                thumbnail: info.thumbnail,
                                duration: info.duration,
                                videoId: info.id,
                            }],
                        },
                    });
                }

                if (parsed.type === "playlist") {
                    const info = await getPlaylistInfo(parsed.id);
                    return NextResponse.json({
                        type: "playlist",
                        source: "yt-dlp",
                        data: {
                            id: info.id,
                            title: info.title,
                            author: info.uploader,
                            thumbnail: info.entries[0]?.thumbnail || "",
                            tracks: info.entries.map((e) => ({
                                id: e.id,
                                title: e.title,
                                artist: e.uploader,
                                thumbnail: e.thumbnail,
                                duration: e.duration,
                                videoId: e.id,
                            })),
                        },
                    });
                }
            } catch (error) {
                console.error("yt-dlp import failed:", error);
                return NextResponse.json(
                    { error: "Import failed. yt-dlp error." },
                    { status: 500 }
                );
            }
        }

        // Try external yt-dlp API (production)
        if (YTDLP_API_URL) {
            try {
                const response = await fetch(`${YTDLP_API_URL}/import`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url }),
                });
                if (response.ok) {
                    const data = await response.json();
                    return NextResponse.json({
                        ...data,
                        source: "external-ytdlp",
                    });
                }
            } catch (error) {
                console.error("External yt-dlp API failed:", error);
            }
        }

        // No backend available
        return NextResponse.json(
            { error: "No import backend configured. Set YTDLP_API_URL in production." },
            { status: 503 }
        );
    } catch (error) {
        console.error("Error importing:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
