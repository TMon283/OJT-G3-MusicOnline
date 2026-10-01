import axios from "axios";
import type { Song } from "../interfaces/type";

const API_URL = "http://localhost:8080/users";

let allSongsCache: Song[] = [];

const songApi = {
    // Xóa cache để force reload
    clearCache() {
        allSongsCache = [];
    },

    // Load tất cả bài hát và cache
    async getAllFromUsers(forceReload = false): Promise<{ data: Song[] }> {
        if (!forceReload && allSongsCache.length > 0) return { data: allSongsCache };

        try {
            const res = await axios.get(API_URL);
            // Handle both direct array and wrapped object responses
            const users = Array.isArray(res.data) ? res.data : (res.data?.users || []);
            const songs: Song[] = [];

            for (const user of users) {
                if (user && user.albums && Array.isArray(user.albums)) {
                    for (const album of user.albums) {
                        if (album && album.songs && Array.isArray(album.songs)) {
                            // Lấy tên nghệ sĩ: ưu tiên tên đầy đủ, rồi tới email, rồi tới "Unknown Artist"
                            const artistName =
                                `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
                                album.artist ||
                                user.email ||
                                "Unknown Artist";

                            for (const song of album.songs) {
                                if (song && song.id && song.title) {
                                    songs.push({
                                        id: song.id,
                                        title: song.title,
                                        file_url: song.file_url || "",
                                        artist: artistName,
                                        // Ảnh riêng của bài hát (nếu có)
                                        cover: song.cover_image || undefined,
                                        // Fallback: ảnh album nếu bài hát không có cover
                                        albumCover: album.cover_image || "/images/albums/default.jpg",
                                        // Tham chiếu album cho player / thống kê
                                        album_id: album.id,
                                    });
                                }
                            }
                        }
                    }
                }
            }

            allSongsCache = songs;
            return { data: songs };
        } catch (error) {
            console.error("Error fetching songs:", error);
            throw error;
        }
    },

    // Lấy 1 bài theo id từ cache
    async getById(id: number): Promise<{ data: Song }> {
        if (allSongsCache.length === 0) await this.getAllFromUsers();
        const song = allSongsCache.find((s) => s.id === id);
        if (!song) return { data: { id: 0, title: "Không tìm thấy", file_url: "" } };
        return { data: song };
    },
};

export default songApi;
