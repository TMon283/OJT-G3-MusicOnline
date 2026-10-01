import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { musicApi } from "../../api/musicApi";
import type { FavoriteItemResponse } from "../../api/musicApi";
import { Heart, Trash2 } from "lucide-react";
import { usePlayer } from "../../components/GlobalPlayer";
import { fetchFavorites, removeFavorite } from "../../redux/slices/favoriteSlice";
import type { RootState, AppDispatch } from "../../redux/store";
import Swal from "sweetalert2";

const FavouritePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { favorites, loading } = useSelector((state: RootState) => state.favorites);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number>(1);
  const { playTrack } = usePlayer();
  const [albumsData, setAlbumsData] = useState<any[]>([]);

  const sortedFavorites = useMemo(
    () => [...favorites].sort((a, b) => a.id - b.id),
    [favorites]
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
      dispatch(fetchFavorites(userId));
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

  useEffect(() => {
    const handleFavoritesUpdate = () => {
      if (userId) {
        dispatch(fetchFavorites(userId));
      }
    };

    window.addEventListener("favoritesUpdated", handleFavoritesUpdate);
    return () => {
      window.removeEventListener("favoritesUpdated", handleFavoritesUpdate);
    };
  }, [userId, dispatch]);

  const handleRemove = async (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!favorites.length) return;
    setRemovingId(id);
    try {
      await dispatch(removeFavorite({ id, userId })).unwrap();
      dispatch(fetchFavorites(userId));
    } catch (error) {
      console.error("Failed to remove favorite:", error);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold text-cyan-400">My Favorites</h3>
      <div className="space-y-12">
        <section className="bg-slate-900/30 rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center text-xs text-cyan-400 px-2 pb-2 border-b border-slate-700/60">
            <div className="w-8">#</div>
            <div className="flex-1">Song Title</div>
            <div className="flex-1">Album</div>
            <div className="w-20 text-right pr-4">Duration</div>
            <div className="w-28 text-center">Favorite</div>
            <div className="w-20 text-center">Remove</div>
          </div>
          <div className="divide-y divide-slate-800/80">
            {sortedFavorites.map((item, idx) => {
              let songData: any = null;
              for (const album of albumsData) {
                const song = album.songs?.find((s: any) => s.id === item.id);
                if (song) {
                  const artistName = album.artist || "";
                  songData = {
                    id: song.id,
                    title: song.title,
                    artist: artistName,
                    duration: song.duration || item.duration,
                    cover: album.cover_image || item.cover,
                    file_url: song.file_url,
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
                <div className="w-28 flex justify-center">
                  <button
                    disabled={!favorites.length}
                    onClick={(e) => handleRemove(item.id, e)}
                    className="disabled:opacity-50 cursor-pointer hover:scale-110 transition-transform"
                    title="Remove from favorites"
                  >
                    <Heart size={22} className="text-red-400 fill-red-400" />
                  </button>
                </div>
                <div className="w-20 text-center text-cyan-300">
                  <button
                    disabled={removingId === item.id || !favorites.length}
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
      </div>
    </div>
  );
};

export default FavouritePage;

