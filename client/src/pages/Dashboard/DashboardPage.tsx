import { useEffect, useState, useRef } from "react";
import { useNavigate, useOutlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { musicApi } from "../../api/musicApi";
import { fetchBanners } from "../../redux/slices/bannerSlice";
import type { RootState, AppDispatch } from "../../redux/store";
import { usePlayer } from "../../components/GlobalPlayer";
import { useSearchAndTrending } from "../../hooks/useSearchAndTrending";
import Swal from "sweetalert2";

import type {
  FeaturedArtistResponse,
  FeaturedGenreResponse,
  RecentlyPlayedResponse,
  WeeklyTopItemResponse,
} from "../../api/musicApi";
import {
  Heart,
  Download,
  History,
  Search,
  Home,
  LibraryBig,
  Mic,
  ListMusic,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { playTrack } = usePlayer();
  const {
    searchQuery,
    searchResults,
    showSearchDropdown,
    isSearching,
    weeklyTopSongs,
    handleSearchChange,
    handleSearch,
    handleSearchKeyPress,
    handlePlayFromSearch,
    handlePlayTrendingSong,
    handleSearchFocus,
    handleSearchBlur,
  } = useSearchAndTrending();
  const [user, setUser] = useState<{
    id?: number;
    first_name?: string;
    last_name?: string;
    profile_image?: string;
    email?: string;
  } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [featuredArtists, setFeaturedArtists] = useState<
    FeaturedArtistResponse[]
  >([]);
  const [genres, setGenres] = useState<FeaturedGenreResponse[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<
    RecentlyPlayedResponse[]
  >([]);
  const [displayedRecentlyPlayed, setDisplayedRecentlyPlayed] = useState<
    RecentlyPlayedResponse[]
  >([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const banners = useSelector((state: RootState) => state.banners.banners);
  const displayedBanners = banners.slice(0, 6);

  const [newReleases, setNewReleases] = useState<
    {
      id: number;
      title: string;
      artist?: string;
      duration?: string;
      image: string;
      file_url?: string;
      album_id?: number;
    }[]
  >([]);
  const [featuredAlbums, setFeaturedAlbums] = useState<
    {
      id: number;
      title: string;
      artist?: string;
      image: string;
    }[]
  >([]);
  const [albumsRes, setAlbumsRes] = useState<any[]>([]);
  const outlet = useOutlet();
  const featuredArtistsScrollRef = useRef<HTMLDivElement>(null);
  const featuredAlbumsScrollRef = useRef<HTMLDivElement>(null);
  const [topAlbum, setTopAlbum] = useState<{
    id: number;
    title: string;
    cover_image: string;
    songs: Array<{ title: string }>;
  } | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [genreSongs, setGenreSongs] = useState<WeeklyTopItemResponse[]>([]);

  const scrollFeaturedArtists = (direction: "left" | "right") => {
    if (featuredArtistsScrollRef.current) {
      const scrollAmount = 200;
      const currentScroll = featuredArtistsScrollRef.current.scrollLeft;
      const newScroll =
        direction === "left"
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount;
      featuredArtistsScrollRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });
    }
  };

  const scrollFeaturedAlbums = (direction: "left" | "right") => {
    if (featuredAlbumsScrollRef.current) {
      const scrollAmount = 200;
      const currentScroll = featuredAlbumsScrollRef.current.scrollLeft;
      const newScroll =
        direction === "left"
          ? currentScroll - scrollAmount
          : currentScroll + scrollAmount;
      featuredAlbumsScrollRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    dispatch(fetchBanners());
  }, [dispatch]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const userId = storedUser ? JSON.parse(storedUser).id : null;

        const [
          artistRes,
          genreRes,
          recentlyPlayedRes,
          albumsRes,
        ] = await Promise.all([
          musicApi.getFeaturedArtists(),
          musicApi.getFeaturedGenres(),
          musicApi.getRecentlyPlayed(userId),
          musicApi.getAlbums(),
        ]);

        setFeaturedArtists(artistRes);
        setGenres(genreRes);
        setRecentlyPlayed(recentlyPlayedRes);
        setAlbumsRes(albumsRes);

        let finalRecentlyPlayed = [...recentlyPlayedRes];
        
        if (finalRecentlyPlayed.length < 8 && weeklyTopSongs.length > 0) {
          const usedIds = new Set(finalRecentlyPlayed.map((item) => item.id));
          const additionalSongs = weeklyTopSongs
            .filter((song) => !usedIds.has(song.id))
            .slice(0, 8 - finalRecentlyPlayed.length)
            .map((song) => ({
              id: song.id,
              title: song.title ?? song.name ?? "",
              artist: song.artist || "Unknown Artist",
              cover: song.cover || "/images/albums/default.jpg",
              playedAt: new Date().toISOString(),
            }));
          finalRecentlyPlayed = [...finalRecentlyPlayed, ...additionalSongs];
        }
        
        if (finalRecentlyPlayed.length < 8) {
          const usedIds = new Set(finalRecentlyPlayed.map((item) => item.id));
          const allSongsFromAlbums: RecentlyPlayedResponse[] = [];
          
          albumsRes.forEach((album) => {
            if (album.songs && Array.isArray(album.songs)) {
              const artistName =
                artistRes.find((a) => a.id === album.artist_id)?.name ||
                album.artist ||
                "Unknown Artist";
              
              album.songs.forEach((song: any) => {
                if (!usedIds.has(song.id) && allSongsFromAlbums.length < 8 - finalRecentlyPlayed.length) {
                  allSongsFromAlbums.push({
                    id: song.id,
                    title: song.title,
                    artist: artistName,
                    cover: song.cover_image || album.cover_image || "/images/albums/default.jpg",
                    playedAt: new Date().toISOString(),
                  });
                  usedIds.add(song.id);
                }
              });
            }
          });
          
          finalRecentlyPlayed = [...finalRecentlyPlayed, ...allSongsFromAlbums];
        }
        
        setDisplayedRecentlyPlayed(finalRecentlyPlayed.slice(0, 8));

        const topAlbums = await musicApi.getWeeklyTop("album");
        const featuredAlbumsData = topAlbums.slice(0, 15).map((album) => ({
          id: album.id,
          title: album.name || album.title || "",
          artist: album.artist || "",
          image: album.cover || "/images/albums/default.jpg",
        }));
        setFeaturedAlbums(featuredAlbumsData);

        if (topAlbums.length > 0) {
          const topAlbumData = topAlbums[0]; 
          const albumDetail = albumsRes.find((a) => a.id === topAlbumData.id);
          if (albumDetail) {
            setTopAlbum({
              id: albumDetail.id,
              title: albumDetail.title,
              cover_image: albumDetail.cover_image || topAlbumData.cover || "/images/albums/default.jpg",
              songs: (albumDetail.songs || []).map((song: any) => ({
                title: song.title,
              })),
            });
          }
        }

        const allSongs: Array<{
          id: number;
          title: string;
          artist: string;
          duration: string;
          cover: string;
          file_url?: string;
          album_id?: number;
          release_date?: string;
        }> = [];

        albumsRes.forEach((album) => {
          if (album.songs && Array.isArray(album.songs)) {
            album.songs.forEach((song: any) => {
              const artistName =
                artistRes.find((a) => a.id === album.artist_id)?.name ||
                album.artist ||
                "";
              allSongs.push({
                id: song.id,
                title: song.title,
                artist: artistName,
                duration: song.duration || "0:00",
                cover: album.cover_image || "/images/albums/default.jpg",
                file_url: song.file_url,
                album_id: album.id,
                release_date: song.release_date || album.release_date,
              });
            });
          }
        });

        const sortedSongs = allSongs
          .filter((song) => song.release_date)
          .sort(
            (a, b) =>
              new Date(b.release_date || 0).getTime() -
              new Date(a.release_date || 0).getTime()
          )
          .slice(0, 5)
          .map((song) => ({
            id: song.id,
            title: song.title,
            artist: song.artist,
            duration: song.duration,
            image: song.cover,
            file_url: song.file_url,
            album_id: song.album_id,
          }));

        setNewReleases(sortedSongs);
      } catch (error) {
        console.error("Failed to load homepage data", error);
      }
    };

    loadData();
  }, [location.pathname]);

  useEffect(() => {
    if (albumsRes.length === 0) return;
    
    let finalRecentlyPlayed = [...recentlyPlayed];
    
    if (finalRecentlyPlayed.length < 8 && weeklyTopSongs.length > 0) {
      const usedIds = new Set(finalRecentlyPlayed.map((item) => item.id));
      const additionalSongs = weeklyTopSongs
        .filter((song) => !usedIds.has(song.id))
        .slice(0, 8 - finalRecentlyPlayed.length)
        .map((song) => ({
          id: song.id,
          title: song.title ?? song.name ?? "",
          artist: song.artist || "Unknown Artist",
          cover: song.cover || "/images/albums/default.jpg",
          playedAt: new Date().toISOString(),
        }));
      finalRecentlyPlayed = [...finalRecentlyPlayed, ...additionalSongs];
    }
    
    if (finalRecentlyPlayed.length < 8) {
      const usedIds = new Set(finalRecentlyPlayed.map((item) => item.id));
      const allSongsFromAlbums: RecentlyPlayedResponse[] = [];
      
      albumsRes.forEach((album) => {
        if (album.songs && Array.isArray(album.songs)) {
          const artistName =
            featuredArtists.find((a) => a.id === album.artist_id)?.name ||
            album.artist ||
            "Unknown Artist";
          
          album.songs.forEach((song: any) => {
            if (!usedIds.has(song.id) && allSongsFromAlbums.length < 8 - finalRecentlyPlayed.length) {
              allSongsFromAlbums.push({
                id: song.id,
                title: song.title,
                artist: artistName,
                cover: song.cover_image || album.cover_image || "/images/albums/default.jpg",
                playedAt: new Date().toISOString(),
              });
              usedIds.add(song.id);
            }
          });
        }
      });
      
      finalRecentlyPlayed = [...finalRecentlyPlayed, ...allSongsFromAlbums];
    }
    
    setDisplayedRecentlyPlayed(finalRecentlyPlayed.slice(0, 8));
  }, [recentlyPlayed, weeklyTopSongs, albumsRes, featuredArtists]);

  useEffect(() => {
    if (displayedBanners.length <= 1 || isHover) return;

    const timer = setInterval(() => {
      setBannerIndex((prev) =>
        prev === displayedBanners.length - 1 ? 0 : prev + 1
      );
    }, 3000);

    return () => clearInterval(timer);
  }, [displayedBanners, isHover]);


  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const isLoggedIn = sessionStorage.getItem("userLoggedIn") === "true";
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (
          isLoggedIn &&
          userData &&
          (userData.email || userData.first_name || userData.last_name)
        ) {
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [location.pathname]); 

  const getInitial = () => {
    if (!user) return "";
    if (user.first_name) return user.first_name.charAt(0).toUpperCase();
    if (user.last_name) return user.last_name.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return "?";
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("userLoggedIn");
    setUser(null);
    navigate("/dashboard");
  };


  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      <header className="flex items-center justify-between px-8 py-4 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center fixed left-25">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Music or Artist here"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="bg-blue-50 px-4 py-2 rounded-l-md w-64 text-sm text-black placeholder-black focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-slate-800 rounded-lg shadow-xl border border-slate-700 max-h-96 overflow-y-auto z-50">
                  <div className="p-2">
                    <div className="text-xs text-gray-400 mb-2 px-2">
                      {searchResults.length} kết quả
                    </div>
                    {searchResults.slice(0, 10).map((song, index) => (
                      <div
                        key={song.id}
                        onClick={() => handlePlayFromSearch(song, index)}
                        className="flex items-center gap-3 p-2 hover:bg-slate-700 rounded cursor-pointer transition"
                      >
                        <img
                          src={song.image}
                          alt={song.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate text-white">
                            {song.title}
                          </h4>
                          <p className="text-xs text-gray-400 truncate">
                            {song.artist}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {song.duration}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="bg-cyan-500 p-2 rounded-r-md hover:bg-cyan-600 transition"
            >
              <Search size={20} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-cyan-400">Trending Songs :</span>
          {weeklyTopSongs.length > 0 ? (
            <span
              onClick={() => handlePlayTrendingSong(weeklyTopSongs[0])}
              className="text-sm text-gray-400 hover:text-cyan-400 cursor-pointer transition truncate max-w-xs"
              title={`${weeklyTopSongs[0].title ?? weeklyTopSongs[0].name} - ${weeklyTopSongs[0].artist}`}
            >
              {weeklyTopSongs[0].title ?? weeklyTopSongs[0].name}
            </span>
          ) : (
            <span className="text-sm text-gray-400">Loading...</span>
          )}
          <button>Languages</button>

          {user ? (
            <div
              className="relative"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <div className="flex items-center gap-3 cursor-pointer">
                {user.profile_image &&
                user.profile_image.startsWith("data:image") ? (
                  <img
                    src={user.profile_image}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2 border-cyan-500"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-lg font-semibold border-2 border-cyan-400">
                    {getInitial()}
                  </div>
                )}
              </div>

              {showDropdown && (
                <>
                  <div
                    className="absolute right-0 top-10 w-48 h-3"
                    onMouseEnter={() => setShowDropdown(true)}
                    onMouseLeave={() => setShowDropdown(false)}
                  />

                  <div
                    className="absolute right-0 top-12 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-2 z-50"
                    onMouseEnter={() => setShowDropdown(true)}
                    onMouseLeave={() => setShowDropdown(false)}
                  >
                    <button
                      onClick={() => {
                        navigate("/dashboard/profile");
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 transition flex items-center gap-2"
                    >
                      <span>👤</span>
                      <span>Thông tin cá nhân</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-slate-700 transition flex items-center gap-2"
                    >
                      <span>🚪</span>
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate("/register")}
                className="bg-cyan-500 px-6 py-2 rounded-full text-sm font-semibold 
  transition
  hover:border hover:border-white hover:shadow-[0_0_12px_3px_rgba(255,255,255,0.6)]"
              >
                Register
              </button>

              <button
                onClick={() => navigate("/login")}
                className="bg-cyan-400 px-6 py-2 rounded-full text-sm font-semibold 
  transition
  hover:border hover:border-white hover:shadow-[0_0_12px_3px_rgba(255,255,255,0.6)]"
              >
                Login
              </button>
            </>
          )}
        </div>
      </header>
      <div className="group fixed left-2 top-10 z-50 w-16 hover:w-52 transition-all duration-200 flex flex-col gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl px-2 py-4 overflow-hidden">
        <div className="flex items-center gap-3 px-1 ">
          <img
            src="https://res.cloudinary.com/deytnetf9/image/upload/v1765521047/logoM_jcnu12.png"
            className="w-12 h-12 rounded-full object-cover transition duration-200"
          />
          <span className="text-sm font-semibold text-white opacity-0 group-hover:opacity-100 transition duration-200 transform -translate-x-2 group-hover:translate-x-0">
            The Miraculous
          </span>
        </div>

        <button
          aria-label="Discover"
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
            location.pathname === "/dashboard"
              ? "text-cyan-500 hover:text-cyan-400 bg-slate-800/40"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => navigate("/dashboard")}
        >
          <span className="transition duration-200">
            <Home size={22} />
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition duration-200 transform -translate-x-2 group-hover:translate-x-0">
            Home
          </span>
        </button>
        <button
          aria-label="Album Page"
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
            location.pathname === "/dashboard/album"
              ? "text-cyan-500 hover:text-cyan-400 bg-slate-800/40"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => navigate("/dashboard/album")}
        >
          <span className="transition duration-200">
            <LibraryBig size={22} />
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition duration-200 transform -translate-x-2 group-hover:translate-x-0">
            Albums
          </span>
        </button>

        <button
          aria-label="Playlists"
          onClick={() => navigate("/dashboard/playlists")}
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
            location.pathname === "/dashboard/list-music"
              ? "text-cyan-500 hover:text-cyan-400 bg-slate-800/40"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <span className="transition duration-200">
            <ListMusic size={22} />
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition duration-200 transform -translate-x-2 group-hover:translate-x-0">
            Playlists
          </span>
        </button>
        <button
          aria-label="Albums"
          onClick={() => navigate("/artist-album")}
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
            location.pathname === "/artist-album"
              ? "text-cyan-500 hover:text-cyan-400 bg-slate-800/40"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <span className="transition duration-200">
            <Mic size={22} />
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition duration-200 transform -translate-x-2 group-hover:translate-x-0">
            Artists
          </span>
        </button>

        <button
          aria-label="Downloads"
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
            location.pathname === "/dashboard/download"
              ? "text-cyan-500 hover:text-cyan-400 bg-slate-800/40"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => navigate("/dashboard/download")}
        >
          <span className="transition duration-200">
            <Download size={22} />
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition duration-200 transform -translate-x-2 group-hover:translate-x-0">
            Downloads
          </span>
        </button>

        <button
          aria-label="Favourites"
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
            location.pathname === "/dashboard/favourite"
              ? "text-cyan-500 hover:text-cyan-400 bg-slate-800/40"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => navigate("/dashboard/favourite")}
        >
          <span className="transition duration-200">
            <Heart size={22} />
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition duration-200 transform -translate-x-2 group-hover:translate-x-0">
            Favourites
          </span>
        </button>

        <button
          aria-label="History"
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
            location.pathname === "/dashboard/history"
              ? "text-cyan-500 hover:text-cyan-400 bg-slate-800/40"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => navigate("/dashboard/history")}
        >
          <span className="transition duration-200">
            <History size={22} />
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition duration-200 transform -translate-x-2 group-hover:translate-x-0">
            History
          </span>
        </button>
      </div>

      {/* Main Content */}
      <main className="ml-24 px-8 py-8">
        {outlet ? (
          outlet
        ) : isSearching && searchResults.length > 0 ? (
          <>
            {/* Search Results */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-cyan-400">
                  Kết quả tìm kiếm cho "{searchQuery}"
                </h2>
                <button
                  onClick={() => {
                  }}
                  className="text-amber-50 hover:text-cyan-300 transition"
                >
                  Xem tất cả
                </button>
              </div>
              <p className="text-gray-400 mb-6">
                Tìm thấy {searchResults.length} bài hát
              </p>
              <div className="grid grid-cols-1 gap-3">
                {searchResults.map((song, index) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      playTrack({
                        id: song.id,
                        title: song.title,
                        artist: song.artist || "",
                        duration: song.duration || "0:00",
                        cover: song.image,
                        file_url: song.file_url,
                        album_id: song.album_id ?? null,
                        views: 0,
                        totalViews: 0,
                        favoriteCount: 0,
                        rank: index + 1,
                      });
                    }}
                    className="flex items-center gap-4 bg-slate-800/50 rounded-lg p-4 hover:bg-slate-700/50 transition cursor-pointer"
                  >
                    <img
                      src={song.image}
                      alt={song.title}
                      className="w-16 h-16 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg truncate">
                        {song.title}
                      </h4>
                      <p className="text-sm text-gray-400 truncate">
                        {song.artist}
                      </p>
                    </div>
                    <span className="text-sm text-gray-400">
                      {song.duration}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="text-gray-400 hover:text-white transition"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : isSearching && searchResults.length === 0 ? (
          <>
            {/* No Results */}
            <div className="text-center py-20">
              <h2 className="text-3xl font-bold text-cyan-400 mb-4">
                Không tìm thấy kết quả
              </h2>
              <p className="text-gray-400 mb-6">
                Không có bài hát nào khớp với "{searchQuery}"
              </p>
              <button
                onClick={() => {
                }}
                className="bg-cyan-500 px-6 py-2 rounded-full text-sm font-semibold hover:bg-cyan-600 transition"
              >
                Quay lại trang chủ
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Hero Section */}
            <div className="relative bg-linear-to-r from-slate-800 to-slate-900 rounded-3xl overflow-hidden mb-12">
              <div className="flex items-center">
                <img
                  src={
                    topAlbum?.cover_image ??
                    banners[0]?.url ??
                    "https://res.cloudinary.com/deytnetf9/image/upload/v1765521048/banner_ehrpqh.png"
                  }
                  alt={topAlbum?.title || "Featured Album"}
                  className="w-96 h-96 object-cover"
                />
                <div className="flex-1 px-12">
                  <h1 className="text-5xl font-bold mb-2">This Month's</h1>
                  <h2 className="text-5xl font-bold text-cyan-400 mb-6">
                    Record Breaking Albums !
                  </h2>
                  {topAlbum && topAlbum.songs.length > 0 ? (
                    <>
                      <p className="text-gray-400 mb-2">
                        {topAlbum.songs.slice(0, 5).map((song, index) => (
                          <span key={`${song.title}-${index}`}>
                            {song.title}
                            {index < Math.min(4, topAlbum.songs.length - 1) ? ", " : ""}
                          </span>
                        ))}
                        {topAlbum.songs.length > 5 && ", "}
                      </p>
                      {topAlbum.songs.length > 5 && (
                        <>
                          <p className="text-gray-400 mb-2">
                            {topAlbum.songs.slice(5, 10).map((song, index) => (
                              <span key={`${song.title}-${index + 5}`}>
                                {song.title}
                                {index < Math.min(4, topAlbum.songs.length - 6) ? ", " : ""}
                              </span>
                            ))}
                            {topAlbum.songs.length > 10 && "..."}
                          </p>
                          {topAlbum.songs.length > 10 && (
                            <p className="text-gray-400 mb-8">
                              and many more...
                            </p>
                          )}
                          {topAlbum.songs.length <= 10 && (
                            <p className="text-gray-400 mb-8">
                              and many more...
                            </p>
                          )}
                        </>
                      )}
                      {topAlbum.songs.length <= 5 && (
                        <p className="text-gray-400 mb-8"></p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-gray-400 mb-2">
                        Dream your moments, Until I Met You, Groove Some Courage,
                        Dark Alley, One More Of A Stranger,
                      </p>
                      <p className="text-gray-400 mb-2">Endless...</p>
                      <p className="text-gray-400 mb-8">
                        Hapes, The Heartbreak Snaps, Walking Promises, Drizzled
                        Gomes and many more...
                      </p>
                    </>
                  )}
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        if (topAlbum) {
                          navigate(`/dashboard/album/${topAlbum.id}`);
                        }
                      }}
                      className="bg-cyan-500 px-8 py-3 rounded-full font-semibold 
  transition
  hover:border hover:border-white hover:shadow-[0_0_12px_3px_rgba(255,255,255,0.6)]"
                    >
                      Listen Now
                    </button>

                    <button
                      className="bg-cyan-400 px-8 py-3 rounded-full font-semibold 
  transition
  hover:border hover:border-white hover:shadow-[0_0_12px_3px_rgba(255,255,255,0.6)]"
                    >
                      Add To Queue
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recently Played */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-cyan-400">
                  Recently Played
                </h3>
                <button className="text-amber-50 hover:text-cyan-300 transition">
                  View More
                </button>
              </div>
              <div className="grid grid-cols-8 gap-4">
                {displayedRecentlyPlayed.map((item, index) => {
                  let songData: any = null;
                  for (const album of albumsRes) {
                    const song = album.songs?.find(
                      (s: any) => s.id === item.id
                    );
                    if (song) {
                      songData = {
                        id: song.id,
                        title: song.title,
                        artist: item.artist,
                        duration: song.duration,
                        cover: song.cover_image || album.cover_image || item.cover,
                        file_url: song.file_url,
                        album_id: album.id,
                      };
                      break;
                    }
                  }

                  return (
                    <div
                      key={item.id || index}
                      onClick={() => {
                        if (!songData) {
                          Swal.fire("Notification", "Audio file not found for this song.", "info");
                          return;
                        }
                        playTrack({
                          ...songData,
                          views: songData.views ?? 0,
                          totalViews: 0,
                          favoriteCount: 0,
                          rank: index + 1,
                        });
                      }}
                      className="bg-slate-800/50 rounded-lg p-3 hover:bg-slate-700/50 transition cursor-pointer"
                    >
                      <img
                        src={songData?.cover || item.cover}
                        alt={item.title}
                        className="w-full h-40 object-cover rounded-lg mb-3"
                      />
                      <h4 className="font-semibold text-sm mb-1 truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-400 truncate">
                        {item.artist}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly Top 15 */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-cyan-400 mb-6">
                Weekly Top 15
              </h3>

              <div className="grid grid-rows-5 grid-flow-col gap-4">
                {weeklyTopSongs.map((track, index) => {
                  let songCover = track.cover || "/images/albums/default.jpg";
                  if (track.album_id) {
                    const album = albumsRes.find((a) => a.id === track.album_id);
                    if (album) {
                      const song = album.songs?.find((s: any) => s.id === track.id);
                      songCover = song?.cover_image || album.cover_image || track.cover || "/images/albums/default.jpg";
                    }
                  }

                  return (
                  <div
                    key={index}
                    onClick={() => {
                      playTrack({
                        id: track.id,
                        title: track.title ?? track.name ?? "",
                        artist: track.artist || "",
                        duration: track.duration || "0:00",
                        cover: songCover,
                        file_url: track.file_url,
                        album_id: track.album_id ?? null,
                        views: track.views ?? 0,
                        totalViews: track.totalViews ?? 0,
                        favoriteCount: track.favoriteCount ?? 0,
                        rank: track.rank,
                      });
                    }}
                    className="flex items-center gap-4 bg-slate-800/30 rounded-lg p-3 hover:bg-slate-700/50 transition cursor-pointer"
                  >
                    <span className="text-2xl font-bold text-amber-50 w-10">
                      {track.rank.toString().padStart(2, "0")}
                    </span>

                    <img
                      src={songCover}
                      alt={track.title ?? track.name}
                      className="w-12 h-12 rounded object-cover"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {track.title ?? track.name}
                      </h4>
                      <p className="text-xs text-gray-400 truncate">
                        {track.artist}
                      </p>
                    </div>

                    <span className="text-sm text-gray-400">
                      {track.duration}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="text-gray-400 hover:text-white transition"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Featured Artists */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-cyan-400">
                  Featured Artists
                </h3>
                <button className="text-amber-50 hover:text-cyan-300 transition">
                  View More
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => scrollFeaturedArtists("left")}
                  className="text-gray-400 hover:text-white transition shrink-0"
                >
                  <ChevronLeft size={32} />
                </button>
                <div
                  ref={featuredArtistsScrollRef}
                  className="flex gap-4 overflow-x-auto flex-1 scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {featuredArtists.map((artist, index) => (
                    <div
                      key={index}
                      className="text-center cursor-pointer hover:opacity-80 transition shrink-0"
                      style={{ width: 'calc((100% - 1rem * 7) / 8)', minWidth: '150px' }}
                    >
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="w-40 h-40 rounded-full object-cover mb-3 mx-auto"
                      />
                      <h4 className="font-semibold text-sm">{artist.name}</h4>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => scrollFeaturedArtists("right")}
                  className="text-gray-400 hover:text-white transition shrink-0"
                >
                  <ChevronRight size={32} />
                </button>
              </div>
            </div>
            {/* Promotional Banner */}
            <div
              className="w-full flex justify-center mb-12"
              onMouseEnter={() => setIsHover(true)}
              onMouseLeave={() => setIsHover(false)}
            >
              <div className="relative w-[1200px] h-[148px] overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
                {displayedBanners.length === 0 ? (
                  <img
                    src="https://res.cloudinary.com/deytnetf9/image/upload/v1765521048/decan_pbqjc4.png"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full transition-transform duration-700 ease-in-out"
                    style={{
                      width: `${displayedBanners.length * 100}%`,
                      transform: `translateX(-${
                        bannerIndex * (100 / displayedBanners.length)
                      }%)`,
                    }}
                  >
                    {displayedBanners.map((banner) => (
                      <img
                        key={banner.id}
                        src={banner.url}
                        className="h-full object-cover"
                        style={{
                          width: `${100 / displayedBanners.length}%`,
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Dots */}
                {displayedBanners.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {displayedBanners.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setBannerIndex(idx)}
                        className={`h-2 w-2 rounded-full transition-all ${
                          idx === bannerIndex
                            ? "bg-cyan-400 scale-125"
                            : "bg-white/40 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* New Releases */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl text-cyan-400 font-bold">
                  New Releases
                </h3>
                <button className="text-amber-50 hover:text-cyan-300 transition">
                  View More
                </button>
              </div>
              <div className="grid grid-cols-5 gap-4">
                {newReleases.map((item, index) => {
                  let songCover = item.image;
                  if (item.album_id) {
                    const album = albumsRes.find((a) => a.id === item.album_id);
                    if (album) {
                      const song = album.songs?.find((s: any) => s.id === item.id);
                      songCover = song?.cover_image || album.cover_image || item.image;
                    }
                  }

                  return (
                  <div
                    key={item.id}
                    onClick={() => {
                      playTrack({
                        id: item.id,
                        title: item.title,
                        artist: item.artist || "",
                        duration: item.duration || "0:00",
                        cover: songCover,
                        file_url: item.file_url,
                        album_id: item.album_id ?? null,
                        views: 0,
                        totalViews: 0,
                        favoriteCount: 0,
                        rank: index + 1,
                      });
                    }}
                    className="bg-slate-800/30 rounded-lg p-3 hover:bg-slate-700/50 transition cursor-pointer"
                  >
                    <img
                      src={songCover}
                      alt={item.title}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                    <p className="text-xs font-semibold truncate">
                      {item.title} {item.duration}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {item.artist}
                    </p>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Featured Albums */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl text-cyan-400 font-bold">
                  Featured Albums
                </h3>
                <button className="text-amber-50 hover:text-cyan-300 transition">
                  View More
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => scrollFeaturedAlbums("left")}
                  className="text-gray-400 hover:text-white transition shrink-0"
                >
                  <ChevronLeft size={32} />
                </button>
                <div
                  ref={featuredAlbumsScrollRef}
                  className="flex gap-4 overflow-x-auto flex-1 scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {featuredAlbums.map((album) => (
                    <div
                      key={album.id}
                      onClick={() => navigate(`/dashboard/album/${album.id}`)}
                      className="bg-slate-900/50 overflow-hidden hover:bg-slate-900/50 transition cursor-pointer shrink-0"
                      style={{ width: 'calc((100% - 1rem * 7) / 8)', minWidth: '150px' }}
                    >
                      <img
                        src={album.image}
                        alt={album.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-3">
                        <h4 className="font-semibold text-sm mb-1 truncate">
                          {album.title}
                        </h4>
                        <p className="text-xs text-gray-400 truncate">
                          {album.artist}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => scrollFeaturedAlbums("right")}
                  className="text-gray-400 hover:text-white transition shrink-0"
                >
                  <ChevronRight size={32} />
                </button>
              </div>
            </div>

            {/* Top Genres */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl text-cyan-400 font-bold">Top Genres</h3>
                {selectedGenre && (
                  <button 
                    onClick={() => {
                      setSelectedGenre(null);
                      setGenreSongs([]);
                    }}
                    className="text-amber-50 hover:text-cyan-300 transition"
                  >
                    Quay lại
                  </button>
                )}
                {!selectedGenre && (
                  <button className="text-amber-50 hover:text-cyan-300 transition">
                    View More
                  </button>
                )}
              </div>
              {selectedGenre ? (
                <div>
                  <h4 className="text-xl font-semibold text-cyan-400 mb-4">
                    {genres.find(g => g.id === selectedGenre)?.name} - {genreSongs.length} bài hát
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {genreSongs.length > 0 ? (
                      genreSongs.map((song, index) => (
                        <div
                          key={song.id}
                          onClick={() => {
                            playTrack({
                              id: song.id,
                              title: song.title ?? "",
                              artist: song.artist || "",
                              duration: song.duration || "0:00",
                              cover: song.cover || "/images/albums/default.jpg",
                              file_url: song.file_url,
                              album_id: song.album_id ?? null,
                              views: song.views ?? 0,
                              totalViews: 0,
                              favoriteCount: 0,
                              rank: index + 1,
                            });
                          }}
                          className="flex items-center gap-4 bg-slate-800/50 rounded-lg p-3 hover:bg-slate-700/50 transition cursor-pointer"
                        >
                          <img
                            src={song.cover}
                            alt={song.title}
                            className="w-16 h-16 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-lg truncate">
                              {song.title}
                            </h4>
                            <p className="text-sm text-gray-400 truncate">
                              {song.artist}
                            </p>
                          </div>
                          <span className="text-sm text-gray-400">
                            {song.duration}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="text-gray-400 hover:text-white transition"
                          >
                            <MoreHorizontal size={20} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        Không có bài hát nào trong thể loại này
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {genres.map((genre, index) => (
                    <div
                      key={index}
                      onClick={async () => {
                        setSelectedGenre(genre.id);
                        try {
                          const songs = await musicApi.getSongsByGenre(genre.id);
                          setGenreSongs(songs);
                        } catch (error) {
                          console.error("Failed to load songs by genre", error);
                          setGenreSongs([]);
                        }
                      }}
                      className="relative rounded-lg overflow-hidden h-48 group cursor-pointer"
                    >
                      <img
                        src={genre.coverImage}
                        alt={genre.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent flex items-end p-4">
                        <h4 className="font-bold text-lg">{genre.name}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {location.pathname === "/dashboard" && (
              <footer className="relative bg-slate-900/50 p-12 mt-12 mx-0 overflow-hidden isolate">
                {/* Hoặc sử dụng img tag */}
                <img
                  src="https://res.cloudinary.com/deytnetf9/image/upload/v1765521049/footer_iyaogx.png"
                  alt="Footer background"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
                />

                <div className="relative z-10">
                  <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                      <img
                        src="https://res.cloudinary.com/deytnetf9/image/upload/v1765521047/logoM_jcnu12.png"
                        className="w-18 h-18 rounded-full object-cover"
                      />
                    </div>
                  </div>
                  <h3 className="text-center text-2xl font-bold mb-2">
                    The Miraculous
                  </h3>
                  <p className="text-center text-cyan-400 mb-8">Subscribe</p>

                  <div className="grid grid-cols-3 gap-8 mb-12">
                    <div>
                      <h4 className="text-cyan-400 font-semibold mb-4">
                        Miraculous Music Station
                      </h4>
                      <p className="text-sm text-gray-400">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                        sed do eiusmod tempor incididunt ut labore et dolore
                        magna aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco laboris nisi ut aliquip ex ea
                        commodo consequat.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-cyan-400 font-semibold mb-4">
                        Download Our App
                      </h4>
                      <p className="text-sm text-gray-400 mb-4">
                        Go Mobile with our app. Listen to your favorite music
                        from your mobile device. Download Now!
                      </p>
                      <div className="space-y-2">
                        <button className="w-full bg-white text-black px-4 py-2 rounded text-xs font-medium hover:bg-gray-200 transition">
                          App Store
                        </button>
                        <button className="w-full bg-white text-black px-4 py-2 rounded text-xs font-medium hover:bg-gray-200 transition">
                          Google Play
                        </button>
                        <button className="w-full bg-white text-black px-4 py-2 rounded text-xs font-medium hover:bg-gray-200 transition">
                          Windows Store
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-cyan-400 font-semibold mb-4">
                        Contact Us
                      </h4>
                      <p className="text-sm text-gray-400 mb-4">
                        Subscribe to our newsletter and get latest updates and
                        offers.
                      </p>
                      <input
                        type="text"
                        placeholder="Enter Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white text-black px-4 py-2 rounded mb-2 text-sm"
                      />
                      <input
                        type="email"
                        placeholder="Enter Your Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white text-black px-4 py-2 rounded mb-4 text-sm"
                      />
                      <button className="w-full bg-cyan-500 hover:bg-cyan-600 py-2 rounded font-medium">
                        Subscribe
                      </button>
                    </div>
                  </div>

                  <div className="text-center text-sm text-gray-400 mt-8">
                    <p>
                      Copyright © 2024. The MusicStation Music Template. All
                      Rights Reserved
                    </p>
                  </div>
                </div>
              </footer>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
