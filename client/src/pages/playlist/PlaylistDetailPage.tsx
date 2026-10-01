import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import playlistSongApi from "../../api/playListSongApi";
import songApi from "../../api/songApi";
import { usePlayer } from "../../components/GlobalPlayer";
import type { PlaylistSong, Song } from "../../interfaces/interface";

export default function PlaylistDetailPage() {
    const { id } = useParams();
    const playlistId = Number(id);
    const navigate = useNavigate();
    const { playTrack } = usePlayer();

    const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);
    const [songId, setSongId] = useState<Record<number, Song>>({});
    const [loading, setLoading] = useState(false);

    const [allSongs, setAllSongs] = useState<Song[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [loadingAllSongs, setLoadingAllSongs] = useState(false);

    const loadSongs = async () => {
        if (!playlistId) return;

        try {
            setLoading(true);

            const ress = await playlistSongApi.getByPlaylist(playlistId);
            const lists: PlaylistSong[] = ress.data;
            setPlaylistSongs(lists);

            if (lists.length === 0) {
                setSongId({});
                return;
            }

            const songRequests = lists.map((s) => songApi.getById(s.song_id));
            const songResponses = await Promise.all(songRequests);

            const map: Record<number, Song> = {};
            songResponses.forEach((res) => {
                map[res.data.id] = res.data;
            });

            setSongId(map);
        } catch (error) {
            Swal.fire("Lỗi", "Không tải được danh sách bài hát", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadAllSongs = async (forceReload = false) => {
        try {
            setLoadingAllSongs(true);
            const res = await songApi.getAllFromUsers(forceReload);
            console.log("Loaded songs:", res.data);
            setAllSongs(res.data || []);
        } catch (error) {
            console.error("Error loading songs:", error);
            Swal.fire("Lỗi", "Không tải được danh sách bài hát", "error");
            setAllSongs([]);
        } finally {
            setLoadingAllSongs(false);
        }
    };

    useEffect(() => {
        loadAllSongs();
    }, []);

    useEffect(() => {
        loadSongs();
    }, [playlistId]);

    useEffect(() => {
        if (showAddModal && allSongs.length === 0 && !loadingAllSongs) {
            loadAllSongs();
        }
    }, [showAddModal]);

    const addSong = async (songId: number) => {
        if (!playlistId) return;

        try {
            const exist = await playlistSongApi.checkExist(playlistId, songId);
            if (exist.data.length > 0) {
                Swal.fire("Thông báo", "Bài hát đã tồn tại trong playlist", "info");
                return;
            }

            await playlistSongApi.add({ playlist_id: playlistId, song_id: songId });
            Swal.fire("Thành công", "Đã thêm bài hát vào playlist", "success");
            loadSongs();
        } catch (error) {
            Swal.fire("Lỗi", "Không thể thêm bài hát", "error");
        }
    };

    const removeSong = async (playlistSongId: number) => {
        const result = await Swal.fire({
            title: "Xóa bài hát?",
            text: "Bạn có chắc muốn xóa bài hát này khỏi playlist?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        });

        if (!result.isConfirmed) return;

        try {
            await playlistSongApi.remove(playlistSongId);
            Swal.fire("Đã xóa", "Bài hát đã được xóa khỏi playlist", "success");
            loadSongs();
        } catch (error) {
            Swal.fire("Lỗi", "Không thể xóa bài hát", "error");
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-4xl font-bold">Chi tiết playlist</h2>
                <button
                    onClick={() => {
                        setShowAddModal(true);
                        loadAllSongs(true);
                    }}
                    className="bg-cyan-500 px-6 py-2 rounded text-sm font-semibold transition hover:border hover:bg-cyan-500"
                >
                    Thêm bài hát
                </button>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-linear-to-b from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-900 text-white rounded-lg w-1/2 p-6 max-h-[70vh] overflow-y-auto border border-slate-700">
                        <h3 className="text-xl font-bold mb-4">Chọn bài hát thêm vào playlist</h3>

                        {loadingAllSongs ? (
                            <div className="text-center py-8 text-gray-500">Đang tải danh sách bài hát...</div>
                        ) : allSongs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>Không có bài hát nào trong hệ thống</p>
                                <button
                                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    onClick={() => loadAllSongs(true)}
                                >
                                    Tải lại
                                </button>
                            </div>
                        ) : (
                            <>
                                <ul className="space-y-2">
                                    {allSongs.map((song) => {
                                        const isAlreadyAdded = playlistSongs.some(s => s.song_id === song.id);
                                        return (
                                            <li key={song.id} className="flex justify-between items-center p-2 hover:bg-cyan-500 rounded">
                                                <span className="flex-1">{song.title || `Bài hát #${song.id}`}</span>
                                                <button
                                                    className={`px-3 py-1 rounded ${isAlreadyAdded
                                                        ? "bg-gray-400 text-white cursor-not-allowed"
                                                        : "bg-cyan-500 text-white hover:bg-cyan-500"
                                                        }`}
                                                    onClick={() => {
                                                        if (!isAlreadyAdded) {
                                                            addSong(song.id);
                                                            setShowAddModal(false);
                                                        }
                                                    }}
                                                    disabled={isAlreadyAdded}
                                                >
                                                    {isAlreadyAdded ? "Đã thêm" : "Thêm"}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </>
                        )}

                        <button
                            className="mt-4 px-4 py-2 bg-cyan-500 rounded hover:bg-cyan-500 w-full"
                            onClick={() => setShowAddModal(false)}
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center text-gray-500 mt-20">Đang tải dữ liệu...</div>
            ) : playlistSongs.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                    <p className="text-lg">Playlist chưa có bài hát nào</p>
                    <p className="text-sm mt-1">
                        Nhấn <span className="font-semibold">“Thêm bài hát”</span> để bắt đầu
                    </p>
                </div>
            ) : (
                <div className="bg-slate-900/30 rounded-2xl p-4 border border-slate-800">
                    <div className="flex items-center text-xs text-cyan-400 px-2 pb-2 border-b border-slate-700/60">
                        <div className="w-8">#</div>
                        <div className="flex-1">Tên bài hát</div>
                        <div className="w-24 text-center">Hành động</div>
                    </div>

                    <div className="divide-y divide-slate-800/80">
                        {playlistSongs.map((s, index) => {
                            const song = songId[s.song_id];
                            return (
                                <div
                                    key={s.id}
                                    onClick={() => {
                                        if (song?.file_url) {
                                            playTrack({
                                                id: song.id,
                                                title: song.title,
                                                artist: song.artist || "Unknown Artist",
                                                duration: "0:00",
                                                cover: song.cover || song.albumCover || "/images/albums/default.jpg",
                                                file_url: song.file_url,
                                                album_id: song.album_id,
                                                views: 0,
                                                totalViews: 0,
                                                favoriteCount: 0,
                                                rank: index + 1,
                                            });
                                        } else {
                                            Swal.fire("Errors", "Bài hát này chưa có file nhạc.", "error");
                                        }
                                    }}
                                    className="flex items-center text-sm text-gray-100 px-2 py-3 hover:bg-slate-800/50 transition cursor-pointer"
                                >
                                    <div className="w-8 text-cyan-400 font-semibold">
                                        {(index + 1).toString().padStart(2, "0")}
                                    </div>
                                    <div className="flex-1">
                                        {song?.title || "Không tìm thấy"}
                                    </div>
                                    <div className="w-24 text-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSong(s.id);
                                            }}
                                            className="text-red-400 hover:text-red-200 transition font-medium"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex justify-end mt-8">
                <button
                    onClick={() => navigate("/dashboard/playlists")}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                >
                    Quay lại Playlist
                </button>
            </div>
        </div>
    );
}
