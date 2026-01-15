export interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration: number; // in seconds
    videoId: string;
}

export interface Playlist {
    id: string;
    title: string;
    author: string;
    thumbnail: string;
    tracks: Track[];
    updatedAt: string;
}

export interface VideoInfo {
    videoId: string;
    title: string;
    author: string;
    thumbnail: string;
    duration: number;
    audioUrl?: string;
}

export interface PlaylistInfo {
    playlistId: string;
    title: string;
    author: string;
    thumbnail: string;
    videos: VideoInfo[];
}
