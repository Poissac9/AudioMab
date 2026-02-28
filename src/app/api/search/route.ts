import { NextRequest, NextResponse } from "next/server";
import { runYtdlp } from "@/services/ytdlp";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query) {
        return NextResponse.json(
            { error: "Query is required" },
            { status: 400 }
        );
    }

    try {
        const args = [
            `ytsearch${limit}:${query}`,
            '--dump-json',
            '--flat-playlist',
            '--no-warnings',
        ];

        const output = await runYtdlp(args);
        const results = output
            .trim()
            .split('\n')
            .filter(line => line)
            .map(line => {
                try {
                    const data = JSON.parse(line);
                    // Skip channels (IDs starting with UC) and playlists
                    if (!data.id || data.id.startsWith('UC') || data.id.startsWith('PL')) {
                        return null;
                    }
                    // Valid YouTube video IDs are 11 characters
                    if (data.id.length !== 11) {
                        return null;
                    }
                    return {
                        id: data.id,
                        videoId: data.id,
                        title: data.title,
                        author: data.uploader || data.channel,
                        duration: data.duration,
                        thumbnail: data.thumbnails?.[0]?.url ||
                            `https://i.ytimg.com/vi/${data.id}/mqdefault.jpg`,
                    };
                } catch {
                    return null;
                }
            })
            .filter(Boolean)
            .slice(0, 15); // Limit to 15 results

        return NextResponse.json({ results, source: 'yt-dlp' });
    } catch (error: any) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: error.message || "Failed to search" },
            { status: 500 }
        );
    }
}
