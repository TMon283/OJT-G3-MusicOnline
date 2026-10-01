import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { musicApi } from "../../api/musicApi";
import type { DownloadItemResponse } from "../../api/musicApi";
import { Download, Trash2 } from "lucide-react";
import { usePlayer } from "../../components/GlobalPlayer";
import { fetchDownloads, removeDownload, updateDownload } from "../../redux/slices/downloadSlice";
import type { RootState, AppDispatch } from "../../redux/store";
import Swal from "sweetalert2";

const DownloadPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { downloads, loading } = useSelector((state: RootState) => state.downloads);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number>(1);
  const { playTrack } = usePlayer();
  const [albumsData, setAlbumsData] = useState<any[]>([]);

  const sortedDownloads = useMemo(
    () => [...downloads].sort((a, b) => a.id - b.id),
    [downloads]
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserId(userData.id || 1);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      dispatch(fetchDownloads(userId));
    }
  }, [userId, dispatch]);

  // Load albums để lấy file_url cho các bài hát
  useEffect(() => {
    const loadAlbums = async () => {
      try {
        const albums = await musicApi.getAlbums();
        setAlbumsData(albums);
      } catch (error) {
        console.error("Failed to load albums:", error);
      }
    };
    loadAlbums();
  }, []);

  // Lắng nghe sự kiện cập nhật downloads từ Playbar
  useEffect(() => {
    const handleDownloadsUpdate = () => {
      if (userId) {
        dispatch(fetchDownloads(userId));
      }
    };

    window.addEventListener("downloadsUpdated", handleDownloadsUpdate);
    return () => {
      window.removeEventListener("downloadsUpdated", handleDownloadsUpdate);
    };
  }, [userId, dispatch]);

  const handleAdd = async (item: DownloadItemResponse) => {
    setAddingId(item.title);
    try {
      const payload = {
        userId: userId,
        title: item.title,
        album: "Dream Your Moments",
        duration: "5:28",
        cover: item.cover, // Fix: use the 'cover' field present in DownloadItemResponse
        file_url: `/songs/${item.title.toLowerCase().replace(/\s+/g, "-")}.mp3`,
        favorite: false,
      };
      await musicApi.addDownload(payload);
      // Reload downloads after adding
      dispatch(fetchDownloads(userId));
    } catch (error) {
      console.error("Failed to add download:", error);
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = async (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setRemovingId(id);
    try {
      await dispatch(removeDownload({ id, userId })).unwrap();
      // Refetch để đảm bảo UI sync với server
      dispatch(fetchDownloads(userId));
    } catch (error) {
      console.error("Failed to remove download:", error);
    } finally {
      setRemovingId(null);
    }
  };

  const handleToggleFavorite = async (item: DownloadItemResponse) => {
    const nextFavorite = !item.favorite;
    try {
      await dispatch(updateDownload({ id: item.id, item: { favorite: nextFavorite } })).unwrap();
    } catch (error) {
      console.error("Failed to update favorite:", error);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-cyan-400">Free Download</h3>
      <div className="space-y-12">
        <section className="bg-slate-900/30 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center text-xs text-cyan-400 px-2 pb-2 border-b border-slate-700/60">
            <div className="w-8">#</div>
            <div className="flex-1">Song Title</div>
            <div className="flex-1">Album</div>
            <div className="w-20 text-right pr-4">Duration</div>
            <div className="w-28 text-center">Download</div>
            <div className="w-20 text-center">Remove</div>
          </div>
          <div className="divide-y divide-slate-800/80">
            {sortedDownloads.map((item, idx) => {
              // Tìm song từ albums để lấy file_url và artist
              let songData: any = null;
              for (const album of albumsData) {
                const song = album.songs?.find((s: any) => s.id === item.id);
                if (song) {
                  // Tìm artist từ album
                  const artistName = album.artist || "";
                  songData = {
                    id: song.id,
                    title: song.title,
                    artist: artistName,
                    duration: song.duration || item.duration,
                    cover: album.cover_image || item.cover,
                    file_url: song.file_url || item.file_url,
                    album_id: album.id,
                  };
                  break;
                }
              }

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (songData && songData.file_url) {
                      playTrack({
                        ...songData,
                        views: songData.views ?? 0,
                        totalViews: 0,
                        favoriteCount: 0,
                        rank: idx + 1,
                      });
                    } else if (item.file_url) {
                      // Tìm artist từ album nếu có
                      let artistName = "";
                      for (const album of albumsData) {
                        const song = album.songs?.find((s: any) => s.id === item.id);
                        if (song) {
                          artistName = album.artist || "";
                          break;
                        }
                      }
                      playTrack({
                        id: item.id,
                        title: item.title,
                        artist: artistName,
                        duration: item.duration || "0:00",
                        cover: item.cover || "/images/albums/default.jpg",
                        file_url: item.file_url,
                        views: 0,
                        totalViews: 0,
                        favoriteCount: 0,
                        rank: idx + 1,
                      });
                    } else {
                      Swal.fire("Notification", "This song does not have an audio file.", "info");
                    }
                  }}
                  className="flex items-center text-sm text-gray-100 px-2 py-3 hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <div className="w-8 text-cyan-400 font-semibold">
                    {(idx + 1).toString().padStart(2, "0")}
                  </div>
                  <div className="flex-1">{item.title}</div>
                <div className="flex-1 text-gray-300">{item.album}</div>
                <div className="w-20 text-right pr-4 text-gray-400">
                  {item.duration}
                </div>
                <div className="w-28 flex justify-center text-gray-400 hover:text-white transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(item);
                    }}
                    className="disabled:opacity-50"
                    aria-label="Mark as downloaded"
                  >
                    <Download
                      size={22}
                      className={item.favorite ? "text-cyan-400" : ""}
                    />
                  </button>
                </div>

                <div className="w-20 text-center text-cyan-300">
                  <button
                    disabled={removingId === item.id}
                    onClick={(e) => handleRemove(item.id, e)}
                    className="w-28 flex justify-center text-gray-400 hover:text-white transition disabled:opacity-50"
                  >
                  <Trash2 size={22} />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
          <div className="text-center mt-6">
            <button
              className="bg-cyan-500 px-4 py-2 rounded-full transition
  hover:border hover:border-white hover:shadow-[0_0_12px_3px_rgba(255,255,255,0.6)]"
            >
              View More
            </button>
          </div>
        </section>

        {/* Các section demo Download Now / Recently Played đã được bỏ để chỉ dùng dữ liệu thật từ API */}
      </div>
    </div>
  );
};

export default DownloadPage;
