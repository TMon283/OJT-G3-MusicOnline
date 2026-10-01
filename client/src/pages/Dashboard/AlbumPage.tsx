import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { musicApi } from "../../api/musicApi";
import type { WeeklyTopItemResponse, AlbumResponse } from "../../api/musicApi";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Artist {
  id: number;
  name: string;
  image: string;
}

const AlbumPage = () => {
  const navigate = useNavigate();
  const [top15Albums, setTop15Albums] = useState<WeeklyTopItemResponse[]>([]);
  const [albumsByArtists, setAlbumsByArtists] = useState<Artist[]>([]);
  const [allAlbums, setAllAlbums] = useState<AlbumResponse[]>([]);
  const artistsScrollRef = useRef<HTMLDivElement>(null);

  const scrollArtists = (direction: "left" | "right") => {
    if (artistsScrollRef.current) {
      const scrollAmount = 200; 
      const currentScroll = artistsScrollRef.current.scrollLeft;
      const newScroll =
        direction === "left"
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount;
      artistsScrollRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [topAlbums, allAlbumsData, featuredArtists] = await Promise.all([
          musicApi.getWeeklyTop("album"),
          musicApi.getAlbums(),
          musicApi.getFeaturedArtists(),
        ]);
        
        setAllAlbums(allAlbumsData);
        setTop15Albums(topAlbums.slice(0, 15));
        const artistsData = featuredArtists.map((artist) => ({
          id: artist.id,
          name: artist.name,
          image: artist.image,
        }));
        setAlbumsByArtists(artistsData);
      } catch (error) {
        console.error("Failed to load album data", error);
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <main className="ml-24 px-8 py-8">
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-cyan-400 mb-6">Top 15 Albums</h3>
          <div className="grid grid-cols-3 gap-4">
            {top15Albums.map((album, index) => (
              <div
                key={album.id}
                onClick={() => navigate(`/dashboard/album/${album.id}`)}
                className="flex items-center gap-4 bg-slate-800/30 rounded-lg p-3 hover:bg-slate-700/50 transition cursor-pointer"
              >
                <span className="text-2xl font-bold text-amber-50 w-10">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
                <img
                  src={album.cover || "/images/albums/default.jpg"}
                  alt={album.name || album.title}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">
                    {album.name || album.title}
                  </h4>
                  <p className="text-xs text-gray-400 truncate">
                    {album.artist}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Albums By Artists */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-cyan-400">Albums By Artists</h3>
            <button className="text-amber-50 hover:text-cyan-300 transition">
              View More
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => scrollArtists("left")}
              className="text-gray-400 hover:text-white transition shrink-0"
            >
              <ChevronLeft size={32} />
            </button>
            <div
              ref={artistsScrollRef}
              className="flex gap-4 overflow-x-auto flex-1 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {albumsByArtists.map((artist) => {
                const artistAlbum = allAlbums.find(
                  (album) => album.artist_id === artist.id
                );
                return (
                  <div
                    key={artist.id}
                    onClick={() => {
                      if (artistAlbum) {
                        navigate(`/dashboard/album/${artistAlbum.id}`);
                      }
                    }}
                    className="text-center cursor-pointer hover:opacity-80 transition shrink-0"
                  >
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-40 h-40 rounded-full object-cover mb-3 mx-auto"
                    />
                    <h4 className="font-semibold text-sm">{artist.name}</h4>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => scrollArtists("right")}
              className="text-gray-400 hover:text-white transition shrink-0"
            >
              <ChevronRight size={32} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AlbumPage;

