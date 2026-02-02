import { NextRequest, NextResponse } from "next/server";

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

        // Use external yt-dlp API (Railway backend)
        if (YTDLP_API_URL) {
            try {
                const response = await fetch(
                    `${YTDLP_API_URL}/audio/${videoId}`,
                    {
                        signal: AbortSignal.timeout(1200000), // 20 min timeout for streaming
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    return NextResponse.json({
                        audioUrl: data.audioUrl,
                        title: data.title,
                        artist: data.artist,
                        thumbnail: data.thumbnail,
                        duration: data.duration,
                        source: "external-ytdlp",
                    });
                } else {
                    const error = await response.json().catch(() => ({}));
                    console.error("External yt-dlp API error:", error);
                    return NextResponse.json(
                        { error: error.error || "Failed to fetch audio from backend" },
                        { status: response.status }
                    );
                }
            } catch (error) {
                console.error("External yt-dlp API failed:", error);
                return NextResponse.json(
                    { error: "Backend request timed out or failed" },
                    { status: 504 }
                );
            }
        }

        // No backend available
        return NextResponse.json(
            {
                error: "No audio backend configured. Please set YTDLP_API_URL environment variable.",
                help: "Deploy the ytdlp-api backend to Railway and add the URL to Vercel environment variables."
            },
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
