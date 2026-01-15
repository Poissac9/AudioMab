import { NextRequest, NextResponse } from "next/server";

const USE_YTDLP = process.env.NODE_ENV === "development";
const YTDLP_API_URL = process.env.YTDLP_API_URL;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
        return NextResponse.json(
            { error: "Query is required" },
            { status: 400 }
        );
    }

    // Try yt-dlp locally (development)
    if (USE_YTDLP) {
        try {
            const { searchYouTube } = await import("@/services/ytdlp");
            const results = await searchYouTube(query, 15);

            return NextResponse.json({
                results: results.map(r => ({
                    ...r,
                    author: r.uploader,
                })),
                source: "yt-dlp",
            });
        } catch (error) {
            console.error("yt-dlp search failed:", error);
            return NextResponse.json(
                { error: "Search failed. yt-dlp error." },
                { status: 500 }
            );
        }
    }

    // Try external yt-dlp API (production)
    if (YTDLP_API_URL) {
        try {
            const response = await fetch(`${YTDLP_API_URL}/search?q=${encodeURIComponent(query)}`);
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
        { error: "No search backend configured. Set YTDLP_API_URL in production." },
        { status: 503 }
    );
}
