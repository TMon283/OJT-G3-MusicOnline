import React from "react";
import { useLocation } from "react-router-dom";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, Download, Heart } from "lucide-react";
import { usePlayer } from "./GlobalPlayer";
import Swal from "sweetalert2";

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const Playbar: React.FC = () => {
  const { currentTrack, isPlaying, currentTime, totalDuration, togglePlay, isFavorite, audioRef, skipNext, skipPrevious } = usePlayer();
  const location = useLocation();

  const [volume, setVolume] = React.useState(1); 
  const [isMuted, setIsMuted] = React.useState(false);
  const lastVolumeRef = React.useRef(1);
  const [isVolumeVisible, setIsVolumeVisible] = React.useState(false);
  const hideVolumeTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (hideVolumeTimeout.current) {
        clearTimeout(hideVolumeTimeout.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current.muted = isMuted;
  }, [volume, isMuted, audioRef]);

  const authPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify"];
  const isAuthPage = authPaths.some((path) => location.pathname.startsWith(path));

  if (!currentTrack || isAuthPage) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 px-6 py-3 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <img
            src={currentTrack.cover || "/images/albums/default.jpg"}
            alt={currentTrack.title ?? currentTrack.name}
            className="w-14 h-14 rounded-md object-cover shrink-0 shadow-lg"
          />
          <div className="min-w-0">
            <h4 className="font-semibold text-white truncate max-w-xs">
              {currentTrack.title ?? currentTrack.name}
            </h4>
            <p className="text-sm text-gray-400 truncate max-w-xs">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
          <div className="flex items-center gap-8">
            <button 
              onClick={skipPrevious}
              className="text-gray-400 hover:text-white transition"
            >
              <SkipBack size={22} />
            </button>

            <button
              onClick={togglePlay}
              className="bg-white  text-black rounded-full p-3 hover:scale-105 transition shadow-xl"
            >
              {isPlaying ? (
                <Pause size={28} fill="black" />
              ) : (
                <Play size={28} fill="black"  />
              )}
            </button>

            <button 
              onClick={skipNext}
              className="text-gray-400 hover:text-white transition"
            >
              <SkipForward size={22} />
            </button>
          </div>

          <div className="w-full flex items-center gap-4 text-sm">
            <span className="text-gray-300 w-12 text-right font-medium">
              {formatTime(currentTime)}
            </span>

            <div
              className="flex-1 relative group cursor-pointer h-4"
              onClick={(e) => {
                if (!audioRef.current || !totalDuration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;
                const newTime = percentage * totalDuration;
                audioRef.current.currentTime = newTime;
              }}
            >
              <div className="absolute inset-0 bg-slate-600 rounded-full h-1 top-1/2 -translate-y-1/2"></div>
              <div
                className="absolute inset-0 bg-cyan-500 rounded-full h-1 top-1/2 -translate-y-1/2 transition-all duration-150"
                style={{ width: `${(currentTime / totalDuration) * 100 || 0}%` }}
              ></div>
              <div
                className="absolute w-3 h-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all top-1/2 -translate-y-1/2"
                style={{
                  left: `${(currentTime / totalDuration) * 100 || 0}%`,
                  transform: "translate(-50%, -50%)",
                }}
              ></div>
            </div>

            <span className="text-gray-300 w-12 font-medium">
              {formatTime(totalDuration)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative flex items-center">
            <div
              className={`absolute bottom-18 left-1/2 -translate-x-1/2 mb-2 transition-opacity duration-150 ${
                isVolumeVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const newVolume = Number(e.target.value);
                  setVolume(newVolume);
                  if (newVolume === 0) {
                    setIsMuted(true);
                  } else {
                    setIsMuted(false);
                    lastVolumeRef.current = newVolume;
                  }
                  if (hideVolumeTimeout.current) {
                    clearTimeout(hideVolumeTimeout.current);
                  }
                }}
                onMouseUp={() => {
                  if (hideVolumeTimeout.current) {
                    clearTimeout(hideVolumeTimeout.current);
                  }
                  hideVolumeTimeout.current = setTimeout(() => setIsVolumeVisible(false), 800);
                }}
                onTouchEnd={() => {
                  if (hideVolumeTimeout.current) {
                    clearTimeout(hideVolumeTimeout.current);
                  }
                  hideVolumeTimeout.current = setTimeout(() => setIsVolumeVisible(false), 800);
                }}
                onBlur={() => setIsVolumeVisible(false)}
                className="w-28 h-1 accent-cyan-500 cursor-pointer -rotate-90 origin-bottom bg-transparent"
              />
            </div>

            <button
              className="text-gray-300 hover:text-white transition"
              onClick={() => {
                if (!audioRef.current) return;
                setIsVolumeVisible((prev) => !prev);
                if (isMuted || volume === 0) {
                  const restoreVolume = lastVolumeRef.current || 1;
                  setIsMuted(false);
                  setVolume(restoreVolume);
                } else {
                  lastVolumeRef.current = volume || 1;
                  setIsMuted(true);
                }
              }}
            >
              {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
            </button>
          </div>
          <button
            className={`text-gray-300 hover:text-cyan-400 transition ${isFavorite ? "text-cyan-400 fill-cyan-400" : ""}`}
            onClick={async () => {
              if (!currentTrack) return;
              const storedUser = localStorage.getItem("user");
              if (!storedUser) {
                Swal.fire("Notification", "Please login to add to Favourites.", "info");
                return;
              }
              const user = JSON.parse(storedUser);
              const userId = user.id;
              if (!userId) {
                Swal.fire("Error", "User information not found.", "error");
                return;
              }

              try {
                if (isFavorite) {
                  await fetch(`http://localhost:8080/favorites/${currentTrack.id}?userId=${userId}`, {
                    method: "DELETE",
                  });
                  const updatedFavs = (user.favorites || []).filter((id: number) => id !== currentTrack.id);
                  user.favorites = updatedFavs;
                  localStorage.setItem("user", JSON.stringify(user));
                  window.dispatchEvent(new Event("favoritesUpdated"));
                } else {
                  await fetch(`http://localhost:8080/favorites`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, songId: currentTrack.id }),
                  });
                  const updatedFavs = Array.from(new Set([...(user.favorites || []), currentTrack.id]));
                  user.favorites = updatedFavs;
                  localStorage.setItem("user", JSON.stringify(user));
                  window.dispatchEvent(new Event("favoritesUpdated"));
                }
              } catch {
                Swal.fire("Error", "Unable to update Favourites. Please try again.", "error");
              }
            }}
          >
            <Heart size={20} className={isFavorite ? "fill-current" : ""} />
          </button>
          <button
            className="text-gray-300 hover:text-cyan-400 transition"
            onClick={async () => {
              if (!currentTrack) return;
              const storedUser = localStorage.getItem("user");
              if (!storedUser) {
                Swal.fire("Notification", "Please login to download song.", "info");
                return;
              }
              const user = JSON.parse(storedUser);
              const userId = user.id;
              if (!userId) {
                Swal.fire("Error", "User information not found.", "error");
                return;
              }

              try {
                await fetch(`http://localhost:8080/downloads`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId,
                    title: currentTrack.title || currentTrack.name,
                  }),
                });

                const downloads: number[] = user.downloads || [];
                if (!downloads.includes(currentTrack.id)) {
                  user.downloads = [...downloads, currentTrack.id];
                  localStorage.setItem("user", JSON.stringify(user));
                }
                Swal.fire("Success", "Added to Downloads list.", "success");
                window.dispatchEvent(new Event("downloadsUpdated"));
              } catch {
                Swal.fire("Error", "Unable to add to Downloads list. Please try again.", "error");
              }
            }}
          >
            <Download size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

