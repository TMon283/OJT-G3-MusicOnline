// src/api/playlistApi.ts
import axios from "axios";
import type { Playlist } from "../interfaces/type";

const API_URL = "http://localhost:8080/playlists";

const playlistApi = {
    getAll(userId: number, params?: any) {
        return axios.get<Playlist[]>(API_URL, {
            params: {
                user_id: userId,
                ...params,
            },
        });
    },

    create(data: Playlist) {
        return axios.post(API_URL, data);
    }

};

export default playlistApi;
