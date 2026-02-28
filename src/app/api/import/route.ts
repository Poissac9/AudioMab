import { NextRequest, NextResponse } from "next/server";
import { runYtdlp } from "@/services/ytdlp";

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        // Check if it's a playlist
        const isPlaylist = url.includes('list=');

        if (isPlaylist) {
            // Get playlist info
            const args = [
                url,
                '--dump-json',
                '--flat-playlist',
                '--no-warnings',
                '--extractor-args', 'youtube:player_client=default,ios',
            ];

            const output = await runYtdlp(args);
            const lines = output.trim().split('\n').filter(line => line);

            // First line is playlist info, rest are videos
            const tracks = lines.map(line => {
                try {
                    const data = JSON.parse(line);
                    return {
                        id: data.id,
                        videoId: data.id,
                        title: data.title,
                        artist: data.uploader || data.channel || 'Unknown',
                        duration: data.duration || 0,
                        thumbnail: data.thumbnails?.[0]?.url ||
                            `https://i.ytimg.com/vi/${data.id}/mqdefault.jpg`,
                    };
                } catch {
                    return null;
                }
            }).filter(Boolean);

            // Get playlist metadata
            const playlistArgs = [
                url,
                '--dump-single-json',
                '--flat-playlist',
                '--no-warnings',
                '--extractor-args', 'youtube:player_client=default,ios',
            ];

            const playlistOutput = await runYtdlp(playlistArgs);
            const playlistData = JSON.parse(playlistOutput);

            return NextResponse.json({
                data: {
                    id: playlistData.id,
                    title: playlistData.title,
                    author: playlistData.uploader || playlistData.channel,
                    thumbnail: playlistData.thumbnails?.[0]?.url ||
                        tracks[0]?.thumbnail,
                    tracks,
                },
                source: 'yt-dlp',
            });
        } else {
            // Single video
            const args = [
                url,
                '--dump-json',
                '--no-warnings',
                '--extractor-args', 'youtube:player_client=default,ios',
            ];

            const output = await runYtdlp(args);
            const data = JSON.parse(output);

            return NextResponse.json({
                data: {
                    id: data.id,
                    title: data.title,
                    author: data.uploader || data.channel,
                    thumbnail: data.thumbnail ||
                        `https://i.ytimg.com/vi/${data.id}/mqdefault.jpg`,
                    tracks: [{
                        id: data.id,
                        videoId: data.id,
                        title: data.title,
                        artist: data.uploader || data.channel,
                        duration: data.duration,
                        thumbnail: data.thumbnail ||
                            `https://i.ytimg.com/vi/${data.id}/mqdefault.jpg`,
                    }],
                },
                source: 'yt-dlp',
            });
        }
    } catch (error: any) {
        console.error("Import error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process URL" },
            { status: 500 }
        );
    }
}
