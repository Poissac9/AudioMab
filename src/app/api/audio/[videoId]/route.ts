import { NextRequest, NextResponse } from "next/server";

// Use yt-dlp locally in development
const USE_YTDLP = process.env.NODE_ENV === "development";
const YTDLP_API_URL = process.env.YTDLP_API_URL;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ videoId: string }> }
) {
    try {
        const { videoId } = await params;

        if (!videoId) {
            return NextResponse.json(
                { error: "Video ID is required" },
                { status: 400 }
            );
        }

        // Try yt-dlp locally (development)
        if (USE_YTDLP) {
            try {
                const { getVideoInfo } = await import("@/services/ytdlp");
                const info = await getVideoInfo(videoId);

                return NextResponse.json({
                    audioUrl: info.audioUrl,
                    title: info.title,
                    artist: info.uploader,
                    thumbnail: info.thumbnail,
                    duration: info.duration,
                    source: "yt-dlp",
                });
            } catch (error) {
                console.error("yt-dlp failed:", error);
                return NextResponse.json(
                    { error: "Failed to fetch audio. yt-dlp error." },
                    { status: 500 }
                );
            }
        }

        // Try external yt-dlp API (production)
        if (YTDLP_API_URL) {
            try {
                const response = await fetch(`${YTDLP_API_URL}/audio/${videoId}`);
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
            { error: "No audio backend configured. Set YTDLP_API_URL in production." },
            { status: 503 }
        );
    } catch (error) {
        console.error("Error fetching audio:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
