import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import type { WeeklyTopItemResponse } from "../api/musicApi";
import { musicApi } from "../api/musicApi";
import type { AlbumResponse } from "../api/musicApi";
import Swal from "sweetalert2";

type Track = WeeklyTopItemResponse & { album_id?: number | null };

type PlayerContextValue = {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  isFavorite: boolean;
  isDownloading: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  skipNext: () => void;
  skipPrevious: () => void;
};


const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return ctx;
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [playlist, setPlaylist] = useState<Track[]>([]); 
  const [albumPlaylist, setAlbumPlaylist] = useState<Track[]>([]); 
  const [currentAlbumId, setCurrentAlbumId] = useState<number | null>(null);

  useEffect(() => {
    if (!currentTrack) {
      setIsFavorite(false);
      return;
    }
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        setIsFavorite(false);
        return;
      }
      const user = JSON.parse(storedUser);
      const favIds: number[] = user.favorites || [];
      setIsFavorite(favIds.includes(currentTrack.id));
    } catch {
      setIsFavorite(false);
    }
  }, [currentTrack]);

  useEffect(() => {
    const handleFavoritesUpdate = () => {
      if (!currentTrack) return;
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          setIsFavorite(false);
          return;
        }
        const user = JSON.parse(storedUser);
        const favIds: number[] = user.favorites || [];
        setIsFavorite(favIds.includes(currentTrack.id));
      } catch {
        setIsFavorite(false);
      }
    };

    window.addEventListener("favoritesUpdated", handleFavoritesUpdate);
    return () => {
      window.removeEventListener("favoritesUpdated", handleFavoritesUpdate);
    };
  }, [currentTrack]);

  const playTrack = async (track: Track) => {
    if (!track.file_url) {
      console.error("Track missing file_url:", track);
      Swal.fire("Notification", "This song does not have an audio file.", "info");
      return;
    }

    console.log("Playing track:", track); 
    
    if (track.album_id && track.album_id !== currentAlbumId) {
      try {
        const albums = await musicApi.getAlbums();
        const album = albums.find((a) => a.id === track.album_id);
        if (album && album.songs) {
          const artists = await musicApi.getFeaturedArtists();
          const artist = artists.find((a) => a.id === album.artist_id);
          const artistName = artist?.name || album.artist || "Unknown Artist";
          
          const albumTracks: Track[] = album.songs
            .filter((song) => song.file_url) 
            .map((song, index) => ({
              id: song.id,
              title: song.title,
              artist: artistName,
              duration: song.duration || "0:00",
              cover: album.cover_image || "/images/albums/default.jpg",
              file_url: song.file_url,
              album_id: album.id,
              views: song.views || 0,
              totalViews: 0,
              favoriteCount: 0,
              rank: index + 1,
            }));
          
          setAlbumPlaylist(albumTracks);
          setCurrentAlbumId(track.album_id);
        }
      } catch (error) {
        console.error("Failed to load album playlist:", error);
      }
    } else if (!track.album_id) {
      setPlaylist((prev) => {
        const exists = prev.find((t) => t.id === track.id);
        if (exists) {
          const filtered = prev.filter((t) => t.id !== track.id);
          return [track, ...filtered];
        }
        return [track, ...prev];
      });
      setCurrentAlbumId(null);
      setAlbumPlaylist([]);
    }
    
    setCurrentTrack(track);
    setCurrentTime(0);

    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        const userId = user.id;
        if (userId && track.id) {
          await fetch(`http://localhost:8080/history`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              songId: track.id,
            }),
          });
        }
      } else {
        const guestHistory = JSON.parse(localStorage.getItem("guestHistory") || "[]");
        if (track.id && !guestHistory.includes(track.id)) {
          guestHistory.unshift(track.id);
          const limitedHistory = guestHistory.slice(0, 100);
          localStorage.setItem("guestHistory", JSON.stringify(limitedHistory));
        } else if (track.id && guestHistory.includes(track.id)) {
          const filtered = guestHistory.filter((id: number) => id !== track.id);
          filtered.unshift(track.id);
          localStorage.setItem("guestHistory", JSON.stringify(filtered.slice(0, 100)));
        }
      }
    } catch (error) {
      console.error("Failed to save history:", error);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Error playing audio:", err);
        setIsPlaying(false);
      });
    }
  };

  const skipNext = () => {
    if (!currentTrack) return;
    
    if (currentAlbumId && albumPlaylist.length > 0) {
      const currentIndex = albumPlaylist.findIndex((t) => t.id === currentTrack.id);
      if (currentIndex !== -1 && currentIndex < albumPlaylist.length - 1) {
        const nextTrack = albumPlaylist[currentIndex + 1];
        playTrack(nextTrack);
      }
    } else if (playlist.length > 0) {
      const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
      if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
        const nextTrack = playlist[currentIndex + 1];
        playTrack(nextTrack);
      }
    }
  };

  const skipPrevious = () => {
    if (!currentTrack) return;
    if (currentAlbumId && albumPlaylist.length > 0) {
      const currentIndex = albumPlaylist.findIndex((t) => t.id === currentTrack.id);
      if (currentIndex > 0) {
        const prevTrack = albumPlaylist[currentIndex - 1];
        playTrack(prevTrack);
      } else if (currentIndex === 0) {
        playTrack(albumPlaylist[0]);
      }
    } else if (playlist.length > 0) {
      const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
      if (currentIndex > 0) {
        const prevTrack = playlist[currentIndex - 1];
        playTrack(prevTrack);
      } else if (currentIndex === 0) {
        playTrack(playlist[0]);
      }
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        totalDuration,
        playTrack,
        togglePlay,
        isFavorite,
        isDownloading,
        audioRef,
        skipNext,
        skipPrevious,
      }}
    >
      {children}
      {currentTrack?.file_url && (
        <audio
          key={`${currentTrack.id}-${currentTrack.file_url}`}
          ref={audioRef}
          src={currentTrack.file_url}
          autoPlay
          preload="auto"
          onPlay={() => {
            setIsPlaying(true);
          }}
          onPause={() => {
            setIsPlaying(false);
          }}
          onTimeUpdate={(e) => {
            const audio = e.currentTarget;
            setCurrentTime(audio.currentTime);
            setTotalDuration(audio.duration || 0);
          }}
          onLoadedMetadata={(e) => {
            const audio = e.currentTarget;
            setTotalDuration(audio.duration || 0);
          }}
          onCanPlay={() => {
            if (audioRef.current && audioRef.current.paused) {
              audioRef.current.play()
                .then(() => {
                  setIsPlaying(true);
                })
                .catch((err) => {
                  console.error("Error playing audio:", err);
                  setIsPlaying(false);
                });
            }
          }}
          onLoadedData={() => {
            if (audioRef.current && audioRef.current.paused) {
              audioRef.current.play()
                .then(() => {
                  setIsPlaying(true);
                })
                .catch((err) => {
                  console.error("Error playing audio:", err);
                  setIsPlaying(false);
                });
            }
          }}
          onEnded={async () => {
            setIsPlaying(false);
            setCurrentTime(0);

            try {
              if (currentTrack?.id) {
                await fetch(`http://localhost:8080/songs/${currentTrack.id}/view`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ album_id: currentTrack.album_id }),
                });
              }
            } catch {
            }

            skipNext();
          }}
          onError={(e) => {
            console.error("Audio error:", e);
            Swal.fire("Error", "Unable to play this audio file. Please check the file URL.", "error");
            setIsPlaying(false);
          }}
        />
      )}
    </PlayerContext.Provider>
  );
};

