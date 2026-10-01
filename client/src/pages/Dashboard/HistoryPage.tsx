import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { musicApi } from "../../api/musicApi";
import { Trash2 } from "lucide-react";
import { usePlayer } from "../../components/GlobalPlayer";
import { fetchHistory, removeHistory } from "../../redux/slices/historySlice";
import type { RootState, AppDispatch } from "../../redux/store";
import Swal from "sweetalert2";

const HistoryPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { history } = useSelector((state: RootState) => state.history);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number>(1);
  const { playTrack } = usePlayer();
  const [albumsData, setAlbumsData] = useState<any[]>([]);

  const sortedHistory = useMemo(
    () =>
      [...history].sort((a, b) =>
        (b.playedAt || "").localeCompare(a.playedAt || "")
      ),
    [history]
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
      dispatch(fetchHistory(userId));
    }
  }, [userId, dispatch]);

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

  const handleRemove = async (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setRemovingId(id);
    try {
      await dispatch(removeHistory({ id, userId })).unwrap();
      dispatch(fetchHistory(userId));
    } catch (error) {
      console.error("Failed to remove history:", error);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-cyan-400">Listening History</h3>
      <div className="space-y-12">
        <section className="bg-slate-900/30 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center text-xs text-cyan-400 px-2 pb-2 border-b border-slate-700/60">
            <div className="w-8">#</div>
            <div className="flex-1">Song Title</div>
            <div className="flex-1">Artist</div>
            <div className="flex-1">Album</div>
            <div className="w-24 text-right pr-4">Duration</div>
            <div className="w-40 text-right pr-4">Played At</div>
            <div className="w-20 text-center">Remove</div>
          </div>
          <div className="divide-y divide-slate-800/80">
            {sortedHistory.map((item, idx) => {
              let songData: any = null;
              for (const album of albumsData) {
                const song = album.songs?.find((s: any) => s.id === item.id);
                if (song) {
                  songData = {
                    id: song.id,
                    title: song.title,
                    artist: item.artist || "",
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
                      playTrack({
                        id: item.id,
                        title: item.title,
                        artist: item.artist || "",
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
                  <div className="flex-1 text-gray-300">{item.artist}</div>
                  <div className="flex-1 text-gray-300">{item.album}</div>
                  <div className="w-24 text-right pr-4 text-gray-400">
                    {item.duration}
                  </div>
                  <div className="w-40 text-right pr-4 text-gray-400 text-xs">
                    {new Date(item.playedAt).toLocaleString()}
                  </div>
                  <div className="w-20 text-center text-cyan-300">
                    <button
                      disabled={removingId === item.id}
                      onClick={(e) => handleRemove(item.id, e)}
                      className="w-28 flex justify-center text-gray-400 hover:text-white transition disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>
                </div>
              );
            })}
            {sortedHistory.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                You have no listening history yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HistoryPage;
