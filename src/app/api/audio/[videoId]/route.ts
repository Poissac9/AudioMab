import { NextRequest, NextResponse } from "next/server";
import { runYtdlp } from "@/services/ytdlp";

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

        const args = [
            `https://www.youtube.com/watch?v=${videoId}`,
            '--dump-json',
            '-f', 'bestaudio',
            '--no-warnings',
            '--extractor-args', 'youtube:player_client=default,ios',
        ];

        const output = await runYtdlp(args);
        const data = JSON.parse(output);

        return NextResponse.json({
            audioUrl: data.url,
            title: data.title,
            artist: data.uploader || data.channel,
            thumbnail: data.thumbnail ||
                `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
            duration: data.duration,
            source: 'yt-dlp',
        });

    } catch (error: any) {
        console.error("Error fetching audio:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
