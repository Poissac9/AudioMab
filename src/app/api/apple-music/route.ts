import { NextRequest, NextResponse } from "next/server";

const YTDLP_API_URL = process.env.YTDLP_API_URL;

interface Song {
    title: string;
    artist: string;
}

// Extract song info from Apple Music HTML using regex patterns
function extractSongsFromHtml(html: string): Song[] {
    const songs: Song[] = [];

    // Apple Music embeds song data in JSON-LD scripts
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);

    if (jsonLdMatch) {
        for (const match of jsonLdMatch) {
            try {
                const jsonContent = match.replace(/<script type="application\/ld\+json">/, "").replace(/<\/script>/, "");
                const data = JSON.parse(jsonContent);

                if (data["@type"] === "MusicPlaylist" && data.track) {
                    for (const track of data.track) {
                        if (track.name && track.byArtist) {
                            songs.push({
                                title: track.name,
                                artist: typeof track.byArtist === "string"
                                    ? track.byArtist
                                    : track.byArtist.name || "Unknown Artist",
                            });
                        }
                    }
                }
            } catch (e) {
                // Continue if JSON parse fails
            }
        }
    }

    // Fallback: Try to find song data in other patterns
    if (songs.length === 0) {
        // Look for meta tags with song info
        const metaMatches = html.matchAll(/data-testid="track-title"[^>]*>([^<]+)</g);
        for (const match of metaMatches) {
            songs.push({ title: match[1], artist: "Unknown Artist" });
        }
    }

    return songs;
}

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url || !url.includes("music.apple.com")) {
            return NextResponse.json(
                { error: "Invalid Apple Music URL" },
                { status: 400 }
            );
        }

        // Fetch the Apple Music page
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch Apple Music page");
        }

        const html = await response.text();

        // Extract playlist title from the page
        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        const playlistTitle = titleMatch
            ? titleMatch[1].replace(" - Apple Music", "").trim()
            : "Apple Music Playlist";

        // Extract songs from the HTML
        const songs = extractSongsFromHtml(html);

        if (songs.length === 0) {
            // Apple Music pages are heavily JS-rendered
            // Try alternative approach: look for song names in og:description or other meta
            const descMatch = html.match(/content="([^"]+)" property="og:description"/);
            if (descMatch) {
                // This usually contains artist names or playlist info
            }

            return NextResponse.json({
                error: "Could not extract songs from this Apple Music page. The page may require JavaScript.",
                hint: "Try entering song names manually or sharing individual songs.",
                playlistTitle,
            }, { status: 422 });
        }

        // Search for each song on YouTube using our backend
        if (!YTDLP_API_URL) {
            return NextResponse.json(
                { error: "Backend not configured" },
                { status: 503 }
            );
        }

        const tracks = [];
        for (const song of songs.slice(0, 50)) { // Limit to 50 songs
            try {
                const searchQuery = `${song.title} ${song.artist}`;
                const searchResponse = await fetch(
                    `${YTDLP_API_URL}/search?q=${encodeURIComponent(searchQuery)}&limit=1`
                );

                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    if (searchData.results && searchData.results.length > 0) {
                        const result = searchData.results[0];
                        tracks.push({
                            id: result.id,
                            videoId: result.id,
                            title: song.title,
                            artist: song.artist,
                            thumbnail: result.thumbnail || `https://i.ytimg.com/vi/${result.id}/mqdefault.jpg`,
                            duration: result.duration || 0,
                        });
                    }
                }
            } catch (e) {
                console.error("Search failed for:", song.title, e);
            }
        }

        // Generate a unique playlist ID
        const playlistId = `apple-${Date.now()}`;

        return NextResponse.json({
            data: {
                id: playlistId,
                title: playlistTitle,
                author: "Apple Music Import",
                thumbnail: tracks[0]?.thumbnail || "",
                tracks,
            },
            source: "apple-music",
            originalSongs: songs.length,
            matchedSongs: tracks.length,
        });
    } catch (error) {
        console.error("Apple Music import error:", error);
        return NextResponse.json(
            { error: "Failed to import Apple Music playlist" },
            { status: 500 }
        );
    }
}
