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

        // Use external yt-dlp API stream endpoint (Railway backend)
        if (YTDLP_API_URL) {
            try {
                const response = await fetch(
                    `${YTDLP_API_URL}/stream/${videoId}`,
                    {
                        signal: AbortSignal.timeout(1200000), // 20 min timeout for streaming
                    }
                );

                if (response.ok && response.body) {
                    // Stream the response through
                    const headers = new Headers();
                    headers.set("Content-Type", response.headers.get("Content-Type") || "audio/webm");
                    if (response.headers.get("Content-Length")) {
                        headers.set("Content-Length", response.headers.get("Content-Length")!);
                    }
                    headers.set("Accept-Ranges", "bytes");

                    return new NextResponse(response.body, {
                        status: 200,
                        headers,
                    });
                } else {
                    const error = await response.json().catch(() => ({}));
                    console.error("External stream API error:", error);
                    return NextResponse.json(
                        { error: error.error || "Failed to stream from backend" },
                        { status: response.status }
                    );
                }
            } catch (error) {
                console.error("External stream API failed:", error);
                return NextResponse.json(
                    { error: "Stream request timed out or failed" },
                    { status: 504 }
                );
            }
        }

        // No backend available
        return NextResponse.json(
            {
                error: "No stream backend configured. Please set YTDLP_API_URL environment variable."
            },
            { status: 503 }
        );
    } catch (error) {
        console.error("Error streaming audio:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
