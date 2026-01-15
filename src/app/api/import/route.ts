import { NextRequest, NextResponse } from "next/server";

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

        // Use external yt-dlp API (Railway backend)
        if (YTDLP_API_URL) {
            try {
                const response = await fetch(`${YTDLP_API_URL}/import`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url }),
                    signal: AbortSignal.timeout(60000), // Longer timeout for playlists
                });

                if (response.ok) {
                    const result = await response.json();
                    return NextResponse.json({
                        data: result.data,
                        source: "external-ytdlp"
                    });
                } else {
                    const error = await response.json().catch(() => ({}));
                    console.error("External yt-dlp API error:", error);
                    return NextResponse.json(
                        { error: error.error || "Failed to import from backend" },
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
                error: "No import backend configured. Please set YTDLP_API_URL environment variable.",
                help: "Deploy the ytdlp-api backend to Railway and add the URL to Vercel environment variables."
            },
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
