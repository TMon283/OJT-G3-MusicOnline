import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { musicApi } from "../api/musicApi";
import type { AlbumResponse } from "../api/musicApi";
import {
  Play,
  Shuffle,
  Download,
  UserPlus,
  MoreHorizontal,
  Search,
  List,
  Clock,
} from "lucide-react";
import { usePlayer } from "./GlobalPlayer";

interface Song {
  id: number;
  title: string;
  duration?: string;
  file_url?: string;
  release_date?: string;
  cover_image?: string;
  views?: number;
  status?: "Active" | "Inactive";
  genre_id?: number;
}

const AlbumDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playTrack } = usePlayer();
  const [album, setAlbum] = useState<AlbumResponse | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [artistName, setArtistName] = useState<string>("");

  useEffect(() => {
    const loadAlbum = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const albums = await musicApi.getAlbums();
        const foundAlbum = albums.find((a) => a.id === parseInt(id));

        if (!foundAlbum) {
          navigate("/dashboard/album");
          return;
        }

        setAlbum(foundAlbum);
        setSongs(foundAlbum.songs || []);

        const artists = await musicApi.getFeaturedArtists();
        const artist = artists.find((a) => a.id === foundAlbum.artist_id);
        setArtistName(artist?.name || foundAlbum.artist || "Unknown Artist");
      } catch (error) {
        console.error("Failed to load album", error);
        navigate("/dashboard/album");
      } finally {
        setLoading(false);
      }
    };

    loadAlbum();
  }, [id, navigate]);

  const formatDuration = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const calculateTotalDuration = (): string => {
    let totalSeconds = 0;
    songs.forEach((song) => {
      const parts = song.duration?.split(":") || [];
      if (parts.length === 2) {
        totalSeconds += parseInt(parts[0]) * 60 + parseInt(parts[1]);
      } else if (parts.length === 3) {
        totalSeconds +=
          parseInt(parts[0]) * 3600 +
          parseInt(parts[1]) * 60 +
          parseInt(parts[2]);
      }
    });
    return formatDuration(totalSeconds);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const getDayOfWeek = (dateString?: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return days[date.getDay()];
    } catch {
      return "";
    }
  };

  const handlePlaySong = (song: Song, index: number) => {
    if (!album) return;

    playTrack({
      id: song.id,
      title: song.title,
      artist: artistName,
      duration: song.duration || "0:00",
      cover: song.cover_image || album.cover_image || "/images/albums/default.jpg",
      file_url: song.file_url,
      album_id: album.id,
      views: song.views || 0,
      totalViews: 0,
      favoriteCount: 0,
      rank: index + 1,
    });
  };

  const handlePlayAll = () => {
    if (songs.length === 0 || !album) return;
    handlePlaySong(songs[0], 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (!album) {
    return null;
  }

  const coverSongs = songs.slice(0, 4);
  const coverImages = coverSongs.map(
    () => album.cover_image || "/images/albums/default.jpg"
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <main className="ml-24 px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start gap-6 mb-6">
            {/* Album Cover Collage */}
            <div className="grid grid-cols-2 grid-rows-2 gap-1 w-64 h-64 shrink-0 overflow-hidden rounded-xl">
              {[0, 1, 2, 3].map((i) => {
                const img =
                  coverImages[i] ||
                  album.cover_image ||
                  "/images/albums/default.jpg";

                return (
                  <div
                    key={i}
                    className="w-full h-full overflow-hidden bg-slate-800"
                  >
                    <img
                      src={img}
                      alt={`Cover ${i + 1}`}
                      className="w-full h-full object-cover block"
                    />
                  </div>
                );
              })}
            </div>
            {/* Album Info */}
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-2">Public Playlist</div>
              <h1 className="text-6xl font-bold mb-4">{album.title}</h1>
              <div className="text-gray-400 mb-2">
                {getDayOfWeek(album.release_date)} • {songs.length} songs,{" "}
                {calculateTotalDuration()}
              </div>
            </div>
          </div>
        </div>

        {/* Songs List */}
        <div className="bg-slate-900/30 rounded-lg">
          {/* Table Header */}
          <div className="grid grid-cols-[50px_1fr_1fr_1fr_100px] gap-4 px-4 py-3 border-b border-slate-700/60 text-xs text-gray-400 uppercase">
            <div className="text-center">#</div>
            <div>Title</div>
            <div>Artist's name</div>
            <div>Date added</div>
            <div className="text-right pr-4">
              <Clock size={16} className="inline" />
            </div>
          </div>

          {/* Songs */}
          <div className="divide-y divide-slate-800/80">
            {songs.map((song, index) => (
              <div
                key={song.id}
                onClick={() => handlePlaySong(song, index)}
                className="grid grid-cols-[50px_1fr_1fr_1fr_100px] gap-4 px-4 py-3 hover:bg-slate-800/50 transition cursor-pointer group"
              >
                <div className="text-center text-gray-400 group-hover:text-white">
                  {index + 1}
                </div>
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={song.cover_image || album.cover_image || "/images/albums/default.jpg"}
                    alt={song.title}
                    className="w-10 h-10 rounded object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-white truncate">
                      {song.title}
                    </div>
                  </div>
                </div>
                <div className="text-gray-400 truncate flex items-center">
                  {artistName}
                </div>
                <div className="text-gray-400 text-sm flex items-center">
                  {formatDate(song.release_date || album.release_date)}
                </div>
                <div className="text-gray-400 text-sm text-right pr-4 flex items-center justify-end">
                  {song.duration || "0:00"}
                </div>
              </div>
            ))}
            {songs.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                No songs in this album
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AlbumDetailPage;
