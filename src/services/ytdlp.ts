import { spawn } from 'child_process';

/**
 * Runs the yt-dlp binary with the given arguments.
 * @param args Array of arguments to pass to yt-dlp
 * @returns A promise that resolves to the stdout output of the process
 */
export function runYtdlp(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const ytdlp = spawn('yt-dlp', args);
        let stdout = '';
        let stderr = '';

        ytdlp.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        ytdlp.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        ytdlp.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(stderr || `yt-dlp exited with code ${code}`));
            }
        });

        ytdlp.on('error', (err) => {
            reject(err);
        });
    });
}
