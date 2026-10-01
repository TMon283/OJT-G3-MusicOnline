import { Outlet, useNavigate } from "react-router-dom";
import { LogoutOutlined } from "@ant-design/icons";
export default function Admin() {
  const navigate = useNavigate();
  const handleLogout = () => {
    window.location.href = 'http://localhost:5173/login';
  };
  return (
    <div className="bg-[#1B2039] text-[#eee] font-roboto min-h-screen flex flex-col">
      <header className="text-center py-5 text-white bg-[rgb(20,24,42)] shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
        <h1 className="text-3xl font-bold text-white">
          DASHBOARD STATISTIC MUSIC ONLINE{" "}
        </h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <nav className="bg-[rgb(20,24,42)] p-6 flex flex-col gap-6 min-w-[250px] h-[calc(100vh-72px)] shadow-[4px_0_8px_rgba(0,0,0,0.3)] overflow-y-auto">

          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wide">
              Statistic
            </h3>
            <div className="flex flex-col gap-2">
              <button
                id="btn-stat-user-list"
                onClick={() => navigate("/admin/user-list")}
                className="py-3 px-4 bg-[#2c3e50] rounded-lg text-white font-medium cursor-pointer hover:bg-[#3b4d65] transition-colors duration-200 flex items-center gap-3"
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  👥
                </span>
                User list
              </button>
              <button
                id="btn-stat-user-count"
                onClick={() => navigate("/admin/user_statistics")}
                className="py-3 px-4 bg-[#2c3e50] rounded-lg text-white font-medium cursor-pointer hover:bg-[#3b4d65] transition-colors duration-200 flex items-center gap-3"
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  📊
                </span>
                User statistics
              </button>
              <button
                id="btn-stat-song"
                onClick={() => navigate("/admin/song_statistics")}
                className="py-3 px-4 bg-[#2c3e50] rounded-lg text-white font-medium cursor-pointer hover:bg-[#3b4d65] transition-colors duration-200 flex items-center gap-3"
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  🎶
                </span>
                Song statistics
              </button>
              <button
                id="btn-stat-album"
                onClick={() => navigate("/admin/album-statistics")}
                className="py-3 px-4 bg-[#2c3e50] rounded-lg text-white font-medium cursor-pointer hover:bg-[#3b4d65] transition-colors duration-200 flex items-center gap-3"
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  💿
                </span>
                Album statistics
              </button>
              <button
                id="btn-stat-artist"
                onClick={() => navigate("/admin/artist_statistics")}
                className="py-3 px-4 bg-[#2c3e50] rounded-lg text-white font-medium cursor-pointer hover:bg-[#3b4d65] transition-colors duration-200 flex items-center gap-3"
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  🎤
                </span>
                Artist statistics
              </button>
              <button
                id="btn-stat-genre"
                onClick={() => navigate("/admin/genre_statistics")}
                className="py-3 px-4 bg-[#2c3e50] rounded-lg text-white font-medium cursor-pointer hover:bg-[#3b4d65] transition-colors duration-200 flex items-center gap-3"
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  💳
                </span>
                Genre statistics
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-400 uppercase tracking-wide">
              Manager
            </h3>
            <div className="flex flex-col gap-2">
              <button
                id="btn-manage-banner"
                onClick={() => navigate("/admin/banner-manager")}
                className="py-3 px-4 bg-[#2c3e50] rounded-lg text-white font-medium cursor-pointer hover:bg-[#3b4d65] transition-colors duration-200 flex items-center gap-3"
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  🖼️
                </span>
                Manage banner
              </button>
              <button
                id="btn-manage-genre"
                onClick={() => navigate("/admin/genre-manager")}
                className="py-3 px-4 bg-[#2c3e50] rounded-lg text-white font-medium cursor-pointer hover:bg-[#3b4d65] transition-colors duration-200 flex items-center gap-3"
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  🏷️
                </span>
                Manage genre
              </button>
              <button
                id="btn-moderation"
                 onClick={() => navigate("/admin/moderation")}
                className="py-3 px-4 bg-[#2c3e50] rounded-lg text-white font-medium cursor-pointer hover:bg-[#3b4d65] transition-colors duration-200 flex items-center gap-3"
              >
                <span className="w-5 h-5 flex items-center justify-center">
                  🛡️
                </span>
                Moderation (album & song)
              </button>
              <button
              onClick={handleLogout}
                className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
              >
                <LogoutOutlined />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </nav>

        <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto bg-[#1B2039]">
          <Outlet></Outlet>
        </main>
      </div>
    </div>
  );
}
