import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import playlistApi from "../../api/playListApi";
import type { Playlist } from "../../interfaces/interface";

export default function PlaylistPage() {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("created_at");
  const [order] = useState("desc");

  const getCurrentUserId = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return user.id;
      } catch (e) {
        console.error("Lỗi parse user từ localStorage:", e);
      }
    }
    return null;
  };

  const loadPlaylists = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      Swal.fire("Notification", "Bạn cần đăng nhập để xem playlist!", "info").then(() => {
        navigate("/login");
      });
      return;
    }

    const res = await playlistApi.getAll(userId, {
      name_like: keyword,
      sorts: sort,
      orders: order,
    });
    setPlaylists(res.data);
  };

  useEffect(() => {
    loadPlaylists();
  }, [keyword, sort, order]);

  const createPlaylist = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      Swal.fire("Notification", "Bạn cần đăng nhập để tạo playlist!", "info").then(() => {
        navigate("/login");
      });
      return;
    }

    const { value: name } = await Swal.fire({
      title: "Tạo playlist mới",
      input: "text",
      inputLabel: "Tên playlist",
      inputPlaceholder: "Nhập tên playlist",
      showCancelButton: true,
      confirmButtonText: "Tạo",
      cancelButtonText: "Hủy",
      inputValidator: (v) => (!v ? "Không được để trống" : null),
    });

    if (!name) return;

    await playlistApi.create({
      name,
      user_id: userId,
      privacy: "private",
      created_at: new Date().toISOString(),
    });

    loadPlaylists();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-4xl font-bold ">
          Playlist của bạn
        </h2>

        <button
          onClick={createPlaylist}
          className="bg-cyan-500 px-6 py-2 rounded text-sm font-semibold transition hover:border hover:border-white"
        >
          Tạo playlist
        </button>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-4 mb-6">
        <input
          placeholder="Tìm playlist..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-1/3 px-4 py-2 border rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2 border rounded-lg
                     focus:outline-none focus:cyan-1 focus:bg-cyan-500"
        >
          <option value="created_at">Mới nhất</option>
          <option value="name">Tên A–Z</option>
        </select>
      </div>

      {/* Playlist list */}
      {playlists.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-lg">Bạn chưa có playlist nào</p>
          <p className="text-sm mt-1">
            Nhấn <span className="font-semibold">“Tạo playlist”</span> để bắt đầu
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {playlists.map((p) => (
            <Link
              key={p.id}
              to={`/dashboard/playlists/${p.id}`}
              className="p-4 border rounded-xl bg-white
                         hover:shadow-lg transition"
            >
              <div
                className="h-32 bg-gradient-to-br bg-cyan-500 rounded-lg flex items-center justify-center mb-3"
              >
                <span className="text-white text-2xl font-bold">
                  {p.name.charAt(0).toUpperCase()}
                </span>
              </div>

              <h3 className="font-semibold text-gray-800 truncate">
                {p.name}
              </h3>

              <p className="text-sm text-gray-500">
                Riêng tư
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
