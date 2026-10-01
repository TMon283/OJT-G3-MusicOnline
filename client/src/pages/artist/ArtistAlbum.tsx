import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Home,
  LibraryBig,
  Mic,
  Heart,
  Download,
  History,
  Plus,
  X,
  Upload,
  Music,
  Save,
  Image,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Edit3,
  CheckCircle,
  XCircle,
  Trash2,
  ListMusic,
} from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { musicApi, type WeeklyTopItemResponse } from "../../api/musicApi";
import { useSearchAndTrending } from "../../hooks/useSearchAndTrending";
import Swal from "sweetalert2";

const CLOUDINARY_CLOUD_NAME = 'dglknpibu';           
const CLOUDINARY_UPLOAD_PRESET = 'music_app_unsigned'; 

const getCurrentUser = () => {
  
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch {}
  }
  return null;
};
const getCurrentUserId = () => {
  const user = getCurrentUser();
  return user ? user.id : null;
};
export default function MusicStation() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<any>(null);

  const [genres, setGenres] = useState<any[]>([]);


useEffect(() => {
  fetch('http://localhost:8080/genres')
    .then(res => res.json())
    .then(data => setGenres(data))
    .catch(err => console.error("Lỗi tải genres:", err));
}, []);



const navigate = useNavigate();
  const [user, setUser] = useState<{
    id?: number;
    first_name?: string;
    last_name?: string;
    profile_image?: string;
    email?: string;
    role?: string | null;
  } | null>(null);

  const [showDropdown, setShowDropdown] = useState(false);

  const getInitial = () => {
    if (!user) return "?";
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

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const isLoggedIn = sessionStorage.getItem("userLoggedIn") === "true";
    if (storedUser && isLoggedIn) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch {
        setUser(null);
      }
    }
  }, []);

  // Sử dụng hook cho tìm kiếm bài hát và trending songs
  const {
    searchQuery,
    searchResults,
    showSearchDropdown,
    weeklyTopSongs,
    handleSearchChange,
    handleSearchKeyPress,
    handlePlayFromSearch,
    handlePlayTrendingSong,
    handleSearchFocus,
    handleSearchBlur,
  } = useSearchAndTrending();

  useEffect(() => {
    const loadFeaturedArtists = async () => {
      try {
        const artists = await musicApi.getFeaturedArtists();
        setFeaturedArtists(artists);
      } catch (error) {
        console.error("Failed to load featured artists:", error);
      }
    };
    loadFeaturedArtists();
  }, []);

useEffect(() => {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    Swal.fire("Notification", "You are not logged in!", "info").then(() => {
      navigate('/login');
    });
    return;
  }

  setUser(currentUser);
  fetchAlbums();
}, [navigate]);
  const [albumData, setAlbumData] = useState({
    title: '',
    artist: '',
    releaseDate: '',
    status: 'Pending'
  });
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageName, setCoverImageName] = useState('');
  const [imageError, setImageError] = useState('');

  const [realAlbums, setRealAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [currentPage, setCurrentPage] = useState(2);
  const itemsPerPage = 12;
  const [featuredArtists, setFeaturedArtists] = useState<any[]>([]);
  const featuredArtistsScrollRef = useRef<HTMLDivElement>(null);
  
  const isArtist = user?.role === "ROLE_ARTIST";

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

 const fetchAlbums = async () => {
  setLoading(true);
  try {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.albums) {
      setRealAlbums([]);
      setLoading(false);
      return;
    }

    const myAlbums = currentUser.albums.map((a: any) => ({
      ...a,
      artistName: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email,
      artistId: currentUser.id,
    }));

    let filtered = myAlbums;
    if (searchTerm) {
      const kw = searchTerm.toLowerCase();
      filtered = filtered.filter((a: any) => 
        a.title.toLowerCase().includes(kw) || 
        a.artistName.toLowerCase().includes(kw)
      );
    }

    if (sortBy === 'name') {
      filtered.sort((a: any, b: any) => a.title.localeCompare(b.title));
    } else {
      filtered.sort((a: any, b: any) => 
        new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      );
    }

    setRealAlbums(filtered);
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Failed to load albums!", "error");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchAlbums();
  }, [searchTerm, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  const handleSubmit = async () => {
  if (!albumData.title.trim()) {
    setSubmitStatus('error');
    setSubmitMessage('Tiêu đề album không được để trống');
    return;
  }

  const userId = getCurrentUserId();
  if (!userId) {
    Swal.fire("Notification", "You are not logged in!", "info").then(() => {
      navigate('/login');
    });
    return;
  }

  const newAlbum = {
    id: 0,
    title: albumData.title,
    release_date: albumData.releaseDate || new Date().toISOString().split('T')[0],
    cover_image: coverImage || 'https://images.unsplash.com/photo-1494232410401-ad00c545f5c6?w=400&h=400&fit=crop',
    type: 'FREE',
    status: 'Pending',
    songs: [],
  };

  try {
    const userRes = await fetch(`http://localhost:8080/users/${userId}`);
    const userData = await userRes.json();

    const updatedAlbums = [...(userData.albums || []), newAlbum];

    const patchRes = await fetch(`http://localhost:8080/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ albums: updatedAlbums }),
    });

         if (patchRes.ok) {
        Swal.fire("Success", `Album "${albumData.title}" created successfully! Waiting for approval (Pending)`, "success");
        setShowCreateForm(false);
        setAlbumData({ title: '', artist: '', releaseDate: '', status: 'Pending' });
        setCoverImage(null);
        setCoverImageName('');

        const updatedUserRes = await fetch(`http://localhost:8080/users/${getCurrentUserId()}`);
        const updatedUserData = await updatedUserRes.json();
        localStorage.setItem("user", JSON.stringify(updatedUserData));

        const refreshedAlbums =
          (updatedUserData.albums || []).map((a: any) => ({
            ...a,
            artistName:
              `${updatedUserData.first_name || ''} ${updatedUserData.last_name || ''}`.trim() ||
              updatedUserData.email,
            artistId: updatedUserData.id,
          }));

        setRealAlbums(refreshedAlbums);
      } else {
        Swal.fire("Error", "Failed to create album", "error");
      }
  } catch (err) {
    Swal.fire("Error", "Cannot connect to server. Please run:\n\nnpm run server in the server directory", "error");
  }
};
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAlbumData((prev) => ({ ...prev, [name]: value }));
  };

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    setImageError('Chỉ chấp nhận JPEG hoặc PNG');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    setImageError('Tối đa 5MB');
    return;
  }

  setImageError('');
  setSubmitStatus('loading');
  setSubmitMessage('Đang tải ảnh lên ...');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await res.json();

    if (data.secure_url) {
      setCoverImage(data.secure_url); 
      setCoverImageName(file.name);
      setSubmitStatus('idle');
      setSubmitMessage('');
      Swal.fire("Success", "Image uploaded successfully!", "success");
    } else {
      throw new Error('Upload failed');
    }
  } catch (err) {
    setImageError('Không thể upload ảnh lên ');
    setSubmitStatus('error');
    setSubmitMessage('Upload thất bại');
    console.error(err);
  }
};

const openEditForm = (album: any) => {
  setEditingAlbum(album);
  setAlbumData({
    title: album.title,
    artist: album.artist || '',
    releaseDate: album.release_date || '',
    status: album.status || 'Pending',
  });
  setCoverImage(album.cover_image || null);
  setCoverImageName('current-cover.jpg');
  setShowEditForm(true);
  setSubmitStatus('idle');
};

const handleUpdate = async () => {
  if (!editingAlbum) return;

  setSubmitStatus('loading');
  setSubmitMessage('Đang cập nhật album...');

  const updatedAlbum = {
    ...editingAlbum,
    title: albumData.title,
    release_date: albumData.releaseDate || editingAlbum.release_date,
    cover_image: coverImage || editingAlbum.cover_image,
    status: editingAlbum.status,
    songs: editingAlbum.songs || [],
  };

  try {
    const res = await fetch(`http://localhost:8080/users/${getCurrentUserId()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        albums: realAlbums.map(a => a.id === editingAlbum.id ? updatedAlbum : a),
      }),
    });

         if (res.ok) {
        setSubmitStatus('success');
        setSubmitMessage('Cập nhật album thành công!');

        const updatedAlbumWithArtist = {
          ...updatedAlbum,
          artistName: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email,
          artistId: user?.id,
        };
        setRealAlbums(prev => prev.map(a => a.id === updatedAlbum.id ? updatedAlbumWithArtist : a));

        const updatedUserRes = await fetch(`http://localhost:8080/users/${getCurrentUserId()}`);
        const updatedUserData = await updatedUserRes.json();
        localStorage.setItem("user", JSON.stringify(updatedUserData));

        setTimeout(() => {
          setShowEditForm(false);
          setSubmitStatus('idle');
        }, 1500);
      } else {
        throw new Error();
      }
  } catch (err) {
    setSubmitStatus('error');
    setSubmitMessage('Cập nhật thất bại');
  }
};
  const paginatedAlbums = realAlbums.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(realAlbums.length / itemsPerPage);

  const location = useLocation(); 
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white pb-32">
      <header className="flex items-center justify-between px-8 py-4 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center fixed left-25">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Music Here..."
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
            <button className="bg-cyan-500 p-2 rounded-r-md hover:bg-cyan-600 transition">
              <Search size={20} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-cyan-400">Trending Songs :</span>
          {weeklyTopSongs.length > 0 ? (
            <span
              onClick={() => handlePlayTrendingSong(weeklyTopSongs[0])}
              className="text-sm text-gray-400 cursor-pointer hover:text-cyan-400 transition truncate max-w-xs"
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
                {user.profile_image && user.profile_image.startsWith("data:image") ? (
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

      <main className="ml-24 px-8 py-8">
        {isArtist && (
          <div className="mb-8 flex justify-between items-center">
            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-800 px-5 py-2.5 rounded-lg text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="name">Sort Album Title</option>
                <option value="date">Sort by release date</option>
              </select>
            </div>

            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-6 py-3 rounded-full font-semibold transition flex items-center gap-2 shadow-lg"
            >
              <Plus size={20} /> Create New Album
            </button>
          </div>
        )}

        {isArtist && (
          <>
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin h-16 w-16 border-t-4 border-cyan-500 mx-auto"></div>
              </div>
            ) : realAlbums.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Music size={64} className="mx-auto mb-4" />
                <p className="text-xl">Chưa có album nào</p>
              </div>
            ) : (
              <>
                <div className="mb-16">
                  <h2 className="text-3xl font-bold text-cyan-400 mb-8">
                    My Albums ({realAlbums.length})
                  </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                
                {paginatedAlbums.map((album) => (
                  <Link
                    key={album.id}
                    to={`/artist-song?albumId=${album.id}`}
                    className="group cursor-pointer transform hover:scale-105 transition-all duration-300 relative block"
                  >
                    <div className="relative overflow-hidden rounded-xl mb-4 aspect-square shadow-2xl">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openEditForm(album);
                        }}
                        className="absolute top-3 right-3 bg-cyan-600 hover:bg-cyan-500 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition z-10 shadow-lg"
                      >
                        <Edit3 size={18} />
                      </button>

                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const result = await Swal.fire({
                            title: "Confirm Delete",
                            text: `Are you sure you want to delete album "${album.title}"?`,
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#d33",
                            cancelButtonColor: "#3085d6",
                            confirmButtonText: "Delete",
                            cancelButtonText: "Cancel",
                          });
                          if (result.isConfirmed) {
                            setAlbumToDelete(album);
                            setShowDeleteModal(true);
                          }
                        }}
                        className="absolute top-3 right-12 bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition z-10 shadow-lg"
                      >
                        <Trash2 size={18} />
                      </button>

                      <img
                        src={album.cover_image || 'https://images.unsplash.com/photo-1494232410401-ad00c545f5c6?w=400&h=400&fit=crop'}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1494232410401-ad00c545f5c6?w=400&h=400&fit=crop';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                      <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition">
                        <p className="font-bold text-lg">{album.title}</p>
                        <p className="text-cyan-300 text-sm">
                          {album.songs?.length || 0} songs • {album.status || 'Pending'}
                        </p>
                      </div>
                    </div>
                    <p className="text-center font-semibold truncate">{album.title}</p>
                    <p className="text-center text-sm text-gray-400">{album.artistName}</p>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-slate-800 disabled:opacity-50"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 rounded-lg ${currentPage === i + 1 ? 'bg-cyan-500 text-black' : 'bg-slate-800'}`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-slate-800 disabled:opacity-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
                </div>
              </>
            )}
          </>
        )}

        <div className="mb-12">
          <h2 className="text-xl font-semibold text-cyan-400 mb-6">Featured Artist</h2>
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
              {featuredArtists.length > 0 ? (
                featuredArtists.map((artist: any) => (
                  <div key={artist.id} className="group cursor-pointer shrink-0" style={{ width: 'calc((100% - 1rem * 5) / 6)', minWidth: '150px' }}>
                    <div className="relative overflow-hidden rounded-lg mb-3 aspect-square">
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-sm text-center text-gray-300 truncate">{artist.name}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">
                  Chưa có nghệ sĩ nổi bật.
                </p>
              )}
            </div>
            <button
              onClick={() => scrollFeaturedArtists("right")}
              className="text-gray-400 hover:text-white transition shrink-0"
            >
              <ChevronRight size={32} />
            </button>
          </div>
        </div>
      </main>

      <footer className="relative bg-slate-900/50 rounded-3xl p-12 mt-20 mx-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold">M</div>
          </div>
          <h3 className="text-center text-2xl font-bold mb-2">The Miraculous</h3>
          <p className="text-center text-cyan-400 mb-8">Subscribe</p>
          <div className="grid grid-cols-3 gap-8 mb-12">
            <div>
              <h4 className="text-cyan-400 font-semibold mb-4">Miraculous Music Station</h4>
              <p className="text-sm text-gray-400">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
            <div>
              <h4 className="text-cyan-400 font-semibold mb-4">Download Our App</h4>
              <p className="text-sm text-gray-400 mb-4">Go Mobile with our app. Listen to your favorite music from your mobile device.</p>
              <div className="space-y-2">
                <button className="w-full bg-white text-black px-4 py-2 rounded text-xs font-medium hover:bg-gray-200 transition">App Store</button>
                <button className="w-full bg-white text-black px-4 py-2 rounded text-xs font-medium hover:bg-gray-200 transition">Google Play</button>
                <button className="w-full bg-white text-black px-4 py-2 rounded text-xs font-medium hover:bg-gray-200 transition">Windows Store</button>
              </div>
            </div>
            <div>
              <h4 className="text-cyan-400 font-semibold mb-4">Contact Us</h4>
              <p className="text-sm text-gray-400 mb-4">Subscribe to our newsletter and get latest updates.</p>
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
              <button className="w-full bg-cyan-500 hover:bg-cyan-600 py-2 rounded font-medium transition">Subscribe</button>
            </div>
          </div>
          <div className="text-center text-sm text-gray-400 mt-8">
            <p>Copyright © 2025 The Miraculous Music Station. All Rights Reserved</p>
          </div>
        </div>
      </footer>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Create New Album
              </h2>
              <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-white transition">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-cyan-400" />
                      Album Status
                    </h3>
                    <p className="text-xs text-gray-400">Status can only be changed by Admin</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${albumData.status === 'Active' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {albumData.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Image className="w-4 h-4 text-cyan-400" />
                  Album Cover
                </h3>
                <div className="flex gap-4">
                  {coverImage ? (
                    <div className="relative group flex-shrink-0">
                      <img src={coverImage} alt="Cover" className="w-32 h-32 object-cover rounded-lg border-2 border-cyan-500/50" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                        <button
                          onClick={() => {
                            setCoverImage(null);
                            setCoverImageName('');
                          }}
                          className="bg-red-500 p-2 rounded-full"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate max-w-[128px]">{coverImageName}</p>
                    </div>
                  ) : (
                    <label className="w-32 h-32 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition">
                      <Upload className="w-8 h-8 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-400">Upload</span>
                      <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                  <div className="flex-1 text-xs text-gray-400">
                    <p className="mb-1">Requirements:</p>
                    <ul className="space-y-0.5">
                      <li>✓ JPEG or PNG only</li>
                      <li>✓ Square (1:1)</li>
                      <li>✓ Min 1400x1400px</li>
                      <li>✓ Max 5MB</li>
                    </ul>
                    {imageError && <p className="text-red-400 mt-2">{imageError}</p>}
                    {coverImage && !imageError && <p className="text-green-400 mt-2">Uploaded!</p>}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Music className="w-4 h-4 text-cyan-400" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="title"
                    value={albumData.title}
                    onChange={handleInputChange}
                    placeholder="Album Title *"
                    className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />

                  <input
                    type="text"
                    value={user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Unknown Artist' : 'Loading...'}
                    placeholder="Artist Name (auto)"
                    className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-300"
                    disabled
                  />

                  <input
                    type="date"
                    name="releaseDate"
                    value={albumData.releaseDate}
                    onChange={handleInputChange}
                    className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-6 py-2 rounded-lg transition flex items-center gap-2"
                >
                  <Save size={16} />
                  Create ({albumData.status})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        {showEditForm && editingAlbum && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 rounded-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex justify-between items-center z-10">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Edit Album: {editingAlbum.title}
                </h2>
                <button onClick={() => setShowEditForm(false)} className="text-gray-400 hover:text-white transition">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-1 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-cyan-400" />
                        Album Status
                      </h3>
                      <p className="text-xs text-gray-400">Set publishing status</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${albumData.status === 'Active' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {albumData.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Image className="w-4 h-4 text-cyan-400" />
                    Album Cover
                  </h3>
                  <div className="flex gap-4">
                    {coverImage ? (
                      <div className="relative group flex-shrink-0">
                        <img src={coverImage} alt="Cover" className="w-32 h-32 object-cover rounded-lg border-2 border-cyan-500/50" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => {
                              setCoverImage(null);
                              setCoverImageName('');
                            }}
                            className="bg-red-500 p-2 rounded-full"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 truncate max-w-[128px]">{coverImageName}</p>
                      </div>
                    ) : (
                      <label className="w-32 h-32 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 transition">
                        <Upload className="w-8 h-8 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-400">Upload New</span>
                        <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleImageUpload} className="hidden" />
                      </label>
                    )}
                    <div className="flex-1 text-xs text-gray-400">
                      <p className="mb-1">Requirements:</p>
                      <ul className="space-y-0.5">
                        <li>JPEG or PNG only</li>
                        <li>Square (1:1)</li>
                        <li>Min 1400x1400px</li>
                        <li>Max 5MB</li>
                      </ul>
                      {imageError && <p className="text-red-400 mt-2">{imageError}</p>}
                    </div>
                  </div>
                </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Music className="w-4 h-4 text-cyan-400" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="title"
                    value={albumData.title}
                    onChange={handleInputChange}
                    placeholder="Album Title"
                    className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />

                  <input
                    type="text"
                    value={user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : ''}
                    placeholder="Artist Name (cannot edit)"
                    className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-300"
                    disabled
                  />

                  <input
                    type="date"
                    name="releaseDate"
                    value={albumData.releaseDate}
                    onChange={handleInputChange}
                    className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Status can only be changed by Admin after review.
                </p>
              </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="bg-slate-700 hover:bg-slate-600 px-6 py-2.5 rounded-lg font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={submitStatus === 'loading'}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-8 py-2.5 rounded-lg font-semibold transition flex items-center gap-2 disabled:opacity-70"
                  >
                    {submitStatus === 'loading' ? (
                      <> <Loader2 className="w-5 h-5 animate-spin" /> Đang cập nhật... </>
                    ) : submitStatus === 'success' ? (
                      <> <CheckCircle className="w-5 h-5" /> Thành công! </>
                    ) : submitStatus === 'error' ? (
                      <> <XCircle className="w-5 h-5" /> Thất bại </>
                    ) : (
                      <> <Save size={16} /> Update Album </>
                    )}
                  </button>
                </div>

                {submitStatus !== 'idle' && (
                  <div className={`text-center py-3 rounded-lg font-medium ${
                    submitStatus === 'success' ? 'bg-green-900/50 text-green-400' : 
                    submitStatus === 'error' ? 'bg-red-900/50 text-red-400' : 
                    'bg-blue-900/50 text-blue-400'
                  }`}>
                    <p className="flex items-center justify-center gap-2">
                      {submitStatus === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
                      {submitStatus === 'success' && <CheckCircle className="w-5 h-5" />}
                      {submitStatus === 'error' && <XCircle className="w-5 h-5" />}
                      {submitMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
{showDeleteModal && albumToDelete && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-slate-900 rounded-2xl max-w-md w-full p-8 border border-slate-700">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-red-500/20 p-3 rounded-full">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Xóa album?</h3>
          <p className="text-sm text-gray-400">Hành động này không thể hoàn tác</p>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
        <p className="text-lg font-semibold text-cyan-400 truncate">{albumToDelete.title}</p>
        <p className="text-sm text-gray-400">{albumToDelete.songs?.length || 0} bài hát • {albumToDelete.artistName}</p>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => {
            setShowDeleteModal(false);
            setAlbumToDelete(null);
          }}
          className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition"
        >
          Hủy
        </button>
        <button
  onClick={async () => {
    setSubmitStatus('loading');
    setSubmitMessage('Đang xóa album...');
    setShowDeleteModal(false);

    try {
      const userRes = await fetch(`http://localhost:8080/users/${getCurrentUserId()}`);
      const userData = await userRes.json();

      const updatedAlbums = userData.albums.filter((a: any) => a.id !== albumToDelete.id);

      const patchRes = await fetch(`http://localhost:8080/users/${getCurrentUserId()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albums: updatedAlbums }),
      });

            if (patchRes.ok) {
        setSubmitStatus('success');
        setSubmitMessage(`Đã xóa album "${albumToDelete.title}" thành công!`);
        Swal.fire("Success", `Album "${albumToDelete.title}" deleted successfully!`, "success");

        setRealAlbums(prev => prev.filter(a => a.id !== albumToDelete.id));

        const updatedUserRes = await fetch(`http://localhost:8080/users/${getCurrentUserId()}`);
        const updatedUserData = await updatedUserRes.json();
        localStorage.setItem("user", JSON.stringify(updatedUserData));

        setTimeout(() => {
          setSubmitStatus('idle');
          setSubmitMessage('');
        }, 3000);
      } else {
        throw new Error();
      }
    } catch (err) {
      setSubmitStatus('error');
      setSubmitMessage('Xóa album thất bại');
      Swal.fire("Error", "Failed to delete album!", "error");
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setAlbumToDelete(null);
    }
  }}
  className="bg-red-600 hover:bg-red-500 px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
>
  <Trash2 size={18} />
  Xóa vĩnh viễn
</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
