import { NextRequest, NextResponse } from "next/server";

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

    // Use external yt-dlp API (Railway backend)
    if (YTDLP_API_URL) {
        try {
            const response = await fetch(
                `${YTDLP_API_URL}/search?q=${encodeURIComponent(query)}`,
                { signal: AbortSignal.timeout(30000) }
            );

            if (response.ok) {
                const data = await response.json();
                return NextResponse.json({
                    results: data.results?.map((r: { uploader?: string; author?: string }) => ({
                        ...r,
                        author: r.uploader || r.author,
                    })),
                    source: "external-ytdlp",
                });
            } else {
                const error = await response.json().catch(() => ({}));
                console.error("External yt-dlp API error:", error);
            }
        } catch (error) {
            console.error("External yt-dlp API failed:", error);
        }
    }

    // No backend available
    return NextResponse.json(
        {
            error: "No search backend configured. Please set YTDLP_API_URL environment variable.",
            help: "Deploy the ytdlp-api backend to Railway and add the URL to Vercel environment variables."
        },
        { status: 503 }
    );
}
