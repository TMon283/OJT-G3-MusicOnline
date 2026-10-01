// src/api/playListSongApi.ts
import axios from "axios";
import type { PlaylistSong } from "../interfaces/type";

const API_URL = "http://localhost:8080/playlist_song";

const playlistSongApi = {
    getByPlaylist(playlistId: number) {
        return axios.get<PlaylistSong[]>(API_URL, {
            params: { playlist_id: playlistId },
        });
    },

    checkExist(playlistId: number, songId: number) {
        return axios.get<PlaylistSong[]>(API_URL, {
            params: { playlist_id: playlistId, song_id: songId },
        });
    },

    add(data: { playlist_id: number; song_id: number }) {
        return axios.post<PlaylistSong>(API_URL, {
            ...data,
            added_at: new Date().toISOString(), //BẮT BUỘC
        });
    },

    remove(id: number) {
        return axios.delete(`${API_URL}/${id}`);
    },
};

export default playlistSongApi;
