import { NextRequest, NextResponse } from "next/server";

// Use yt-dlp locally in development
const USE_YTDLP = process.env.NODE_ENV === "development";
const YTDLP_API_URL = process.env.YTDLP_API_URL;

// Invidious/Piped instances for production fallback
const INVIDIOUS_INSTANCES = [
    "https://vid.puffyan.us",
    "https://invidious.fdn.fr",
    "https://invidious.nerdvpn.de",
    "https://yt.artemislena.eu",
];

const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.yt",
    "https://pipedapi.tokhmi.xyz",
];

async function getAudioFromInvidious(videoId: string) {
    for (const instance of INVIDIOUS_INSTANCES) {
        try {
            const response = await fetch(
                `${instance}/api/v1/videos/${videoId}`,
                {
                    headers: { "Accept": "application/json" },
                    signal: AbortSignal.timeout(10000),
                }
            );

            if (response.ok) {
                const data = await response.json();

                // Find best audio format
                const audioFormats = data.adaptiveFormats?.filter(
                    (f: { type: string }) => f.type?.startsWith("audio/")
                ) || [];

                // Sort by bitrate, prefer higher quality
                audioFormats.sort((a: { bitrate: number }, b: { bitrate: number }) =>
                    (b.bitrate || 0) - (a.bitrate || 0)
                );

                const audioFormat = audioFormats[0];

                if (audioFormat?.url) {
                    return {
                        audioUrl: audioFormat.url,
                        title: data.title,
                        artist: data.author,
                        thumbnail: data.videoThumbnails?.[0]?.url ||
                            `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                        duration: data.lengthSeconds,
                        source: "invidious",
                    };
                }
            }
        } catch (error) {
            console.log(`Invidious instance ${instance} failed:`, error);
            continue;
        }
    }
    return null;
}

async function getAudioFromPiped(videoId: string) {
    for (const instance of PIPED_INSTANCES) {
        try {
            const response = await fetch(
                `${instance}/streams/${videoId}`,
                {
                    headers: { "Accept": "application/json" },
                    signal: AbortSignal.timeout(10000),
                }
            );

            if (response.ok) {
                const data = await response.json();

                // Find best audio stream
                const audioStream = data.audioStreams?.sort(
                    (a: { bitrate: number }, b: { bitrate: number }) =>
                        (b.bitrate || 0) - (a.bitrate || 0)
                )?.[0];

                if (audioStream?.url) {
                    return {
                        audioUrl: audioStream.url,
                        title: data.title,
                        artist: data.uploader,
                        thumbnail: data.thumbnailUrl ||
                            `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                        duration: data.duration,
                        source: "piped",
                    };
                }
            }
        } catch (error) {
            console.log(`Piped instance ${instance} failed:`, error);
            continue;
        }
    }
    return null;
}

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
                // Fall through to other methods
            }
        }

        // Try external yt-dlp API (production with custom backend)
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

        // Try Invidious API (production fallback)
        const invidiousResult = await getAudioFromInvidious(videoId);
        if (invidiousResult) {
            return NextResponse.json(invidiousResult);
        }

        // Try Piped API (production fallback)
        const pipedResult = await getAudioFromPiped(videoId);
        if (pipedResult) {
            return NextResponse.json(pipedResult);
        }

        // All backends failed
        return NextResponse.json(
            { error: "Failed to fetch audio. All backends unavailable." },
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
