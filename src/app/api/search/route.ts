import { NextRequest, NextResponse } from "next/server";

const USE_YTDLP = process.env.NODE_ENV === "development";
const YTDLP_API_URL = process.env.YTDLP_API_URL;

// Invidious instances for production fallback
const INVIDIOUS_INSTANCES = [
    "https://vid.puffyan.us",
    "https://invidious.fdn.fr",
    "https://invidious.nerdvpn.de",
    "https://yt.artemislena.eu",
    "https://invidious.privacyredirect.com",
];

async function searchInvidious(query: string) {
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            const response = await fetch(
                `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
                {
                    headers: { "Accept": "application/json" },
                    signal: AbortSignal.timeout(8000),
                }
            );

            if (response.ok) {
                const data = await response.json();
                return data
                    .filter((item: { type: string }) => item.type === "video")
                    .slice(0, 15)
                    .map((item: {
                        videoId: string;
                        title: string;
                        author: string;
                        lengthSeconds: number;
                        videoThumbnails: { url: string }[];
                    }) => ({
                        videoId: item.videoId,
                        id: item.videoId,
                        title: item.title,
                        uploader: item.author,
                        author: item.author,
                        duration: item.lengthSeconds,
                        thumbnail: item.videoThumbnails?.[0]?.url ||
                            `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg`,
                    }));
            }
        } catch (error) {
            console.log(`Invidious instance ${instance} failed:`, error);
            continue;
        }
    }
    throw new Error("All Invidious instances failed");
}

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
            // Fall through to other methods
        }
    }

    // Try external yt-dlp API (if configured)
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

    // Fallback to Invidious API (production)
    try {
        const results = await searchInvidious(query);
        return NextResponse.json({
            results,
            source: "invidious",
        });
    } catch (error) {
        console.error("Invidious search failed:", error);
        return NextResponse.json(
            { error: "Search failed. All backends unavailable." },
            { status: 503 }
        );
    }
}
