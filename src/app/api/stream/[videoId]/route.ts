import { NextRequest, NextResponse } from "next/server";
import { runYtdlp } from "@/services/ytdlp";
import https from "https";
import http from "http";

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
            '-f', 'bestaudio[ext=m4a]/bestaudio',
            '--no-warnings',
            '--extractor-args', 'youtube:player_client=default,ios',
        ];

        let output;
        try {
            output = await runYtdlp(args);
        } catch (error) {
            console.error("External stream API failed:", error);
            return NextResponse.json(
                { error: "Stream request timed out or failed" },
                { status: 504 }
            );
        }

        const data = JSON.parse(output);
        const audioUrl = data.url;

        if (!audioUrl) {
            return NextResponse.json({ error: 'No audio URL found' }, { status: 500 });
        }

        // We use a Promise that resolves when headers are received from the YouTube video source,
        // and returns a ReadableStream created from the Node.js IncomingMessage.
        return new Promise<NextResponse>((resolve) => {
            const makeRequest = (url: string, attempt = 0) => {
                if (attempt > 5) {
                    resolve(NextResponse.json({ error: 'Too many redirects' }, { status: 500 }));
                    return;
                }

                const protocol = url.startsWith('https') ? https : http;
                const options: any = { headers: {} };

                const range = request.headers.get('range');
                if (range) {
                    options.headers['Range'] = range;
                }

                protocol.get(url, options, (proxyRes) => {
                    if (proxyRes.statusCode! >= 300 && proxyRes.statusCode! < 400 && proxyRes.headers.location) {
                        proxyRes.resume(); // consume response
                        makeRequest(proxyRes.headers.location, attempt + 1);
                        return;
                    }

                    if (proxyRes.statusCode! >= 400) {
                        console.error('Proxy received upstream error:', proxyRes.statusCode);
                        proxyRes.resume();
                        resolve(NextResponse.json({ error: `Upstream error ${proxyRes.statusCode}` }, { status: proxyRes.statusCode! }));
                        return;
                    }

                    const forwardHeaders = [
                        'content-type',
                        'content-length',
                        'accept-ranges',
                        'content-range',
                        'cache-control',
                        'last-modified'
                    ];

                    const headers = new Headers();
                    forwardHeaders.forEach(h => {
                        if (proxyRes.headers[h]) {
                            headers.set(h, proxyRes.headers[h] as string);
                        }
                    });

                    // Create a ReadableStream from the Node.js IncomingMessage
                    const readableStream = new ReadableStream({
                        start(controller) {
                            proxyRes.on('data', chunk => {
                                controller.enqueue(new Uint8Array(chunk));
                            });
                            proxyRes.on('end', () => {
                                controller.close();
                            });
                            proxyRes.on('error', err => {
                                console.error('Stream proxy connection error:', err);
                                controller.error(err);
                            });
                        },
                        cancel() {
                            proxyRes.destroy();
                        }
                    });

                    resolve(new NextResponse(readableStream, {
                        status: proxyRes.statusCode,
                        headers,
                    }));

                }).on('error', (err) => {
                    console.error('Stream connection failed:', err);
                    resolve(NextResponse.json({ error: 'Stream connection failed' }, { status: 500 }));
                });
            };

            makeRequest(audioUrl);
        });

    } catch (error) {
        console.error("Error streaming audio:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
