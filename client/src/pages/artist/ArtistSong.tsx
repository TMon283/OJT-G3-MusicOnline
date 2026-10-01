import React, { useState, useEffect } from 'react';
import {
  Search,
  Home,
  LibraryBig,
  Mic,
  Heart,
  Download,
  History,
  Play,
  Edit,
  Trash2,
  ArrowUpDown,
  Music,
  Calendar,
  Clock,
  Eye,
  ChevronLeft,
  Loader2,
  Plus,
  Upload,
  CheckCircle,
  AlertCircle,
  Save,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  HeartOff,
  Image,
  X,
  ListMusic,
} from "lucide-react";
import { Link , useSearchParams, useNavigate,useLocation} from 'react-router-dom';
import logoM from "../../assets/images/logoM.png";
import { usePlayer } from "../../components/GlobalPlayer";
import { musicApi, type WeeklyTopItemResponse } from "../../api/musicApi";
import { useSearchAndTrending } from "../../hooks/useSearchAndTrending";
import Swal from "sweetalert2";
export default function ArtistSong() {
const [user, setUser] = useState<{
  id?: number;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  email?: string;
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
      setUser(JSON.parse(storedUser));
    } catch {
      setUser(null);
    }
  }
}, []);

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

    const CLOUDINARY_CLOUD_NAME = 'dglknpibu';
    const CLOUDINARY_UPLOAD_PRESET = 'music_app_unsigned';

    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [sortBy, setSortBy] = useState('name'); 
    const [sortOrder, setSortOrder] = useState('asc'); 
    const [viewMode, setViewMode] = useState('home'); 

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { playTrack } = usePlayer();
    const albumId = searchParams.get("albumId");

    const [album, setAlbum] = useState<any>(null);
    const [songs, setSongs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const location = useLocation();
    const [showAddSongModal, setShowAddSongModal] = useState(false);
    const [songTitle, setSongTitle] = useState('');
    const [songDuration, setSongDuration] = useState('');
    const [songFile, setSongFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [uploadMessage, setUploadMessage] = useState('');
    const [songReleaseDate, setSongReleaseDate] = useState('');

    const [showDeleteSongModal, setShowDeleteSongModal] = useState(false);
    const [songToDelete, setSongToDelete] = useState<any>(null);

    const [showEditSongModal, setShowEditSongModal] = useState(false);
    const [editingSong, setEditingSong] = useState<any>(null);
    const [newSongFile, setNewSongFile] = useState<File | null>(null);

    const [songStatus, setSongStatus] = useState<'Pending' | 'Active'>('Pending');
    const [currentPlayingSong, setCurrentPlayingSong] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const audioRef = React.useRef<HTMLAudioElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);

    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [coverImageName, setCoverImageName] = useState('');
    const [songGenre, setSongGenre] = useState<number | ''>('');
    const [genres, setGenres] = useState<any[]>([]);

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
      fetch('http://localhost:8080/genres')
        .then(res => res.json())
        .then(data => setGenres(data))
        .catch(err => console.error("Lỗi tải genres:", err));
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    Swal.fire("Error", "Only JPEG or PNG files are allowed!", "error");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire("Error", "Maximum file size is 5MB!", "error");
    return;
  }

  setUploadStatus('uploading');
  setUploadMessage('Uploading cover image...');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    const data = await res.json();

    if (data.secure_url) {
      setCoverImage(data.secure_url);
      setCoverImageName(file.name);
      setUploadStatus('idle');
      Swal.fire("Success", "Image uploaded successfully!", "success");
    }
  } catch (err) {
    Swal.fire("Error", "Failed to upload image!", "error");
    setUploadStatus('error');
  }
};
    const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!albumId) {
        navigate("/artist");
        return;
        }

        const fetchAlbum = async () => {
        try {
            const res = await fetch("http://localhost:8080/users");
            const users = await res.json();

            let foundAlbum: any = null;
            for (const user of users) {
            const alb = user.albums?.find((a: any) => a.id === parseInt(albumId));
            if (alb) {
                foundAlbum = {
                ...alb,
                artistName: `${user.first_name} ${user.last_name}`
                };
                break;
            }
            }

            if (!foundAlbum) {
            Swal.fire("Error", "Album not found!", "error");
            navigate("/artist");
            return;
            }

            setAlbum(foundAlbum);
            setSongs(foundAlbum.songs || []);
        } catch (err) {
            Swal.fire("Error", "Failed to load album data", "error");
            navigate("/artist");
        } finally {
            setLoading(false);
        }
    };

    fetchAlbum();
  }, [albumId, navigate]);

  const sortSongs = (songsToSort: any[]) => {
  const sorted = [...songsToSort];
  sorted.sort((a, b) => {
    let compareValue = 0;

    if (sortBy === 'name') {
      const titleA = a.title || '';
      const titleB = b.title || '';
      compareValue = titleA.localeCompare(titleB);
    } else if (sortBy === 'releaseDate') {
      const dateA = new Date(a.release_date || a.releaseDate || 0).getTime();
      const dateB = new Date(b.release_date || b.releaseDate || 0).getTime();
      compareValue = dateA - dateB;
    }

    return sortOrder === 'asc' ? compareValue : -compareValue;
  });
  return sorted;
};
  const handleSort = (field:any) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleEditSong = (songId:any) => {

  };

  const formatNumber = (num:number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num;
  };

    const sortedSongs = songs.length > 0 ? sortSongs(songs) : [];
        if (loading) {
            return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-500"></div>
            </div>
            );
        }

        if (!album) return null;
        const handleUploadSong = async () => {
  if (!songTitle.trim()) {
    Swal.fire("Error", "Please enter song title", "error");
    return;
  }
  if (!songFile) {
    Swal.fire("Error", "Please select audio file", "error");
    return;
  }

  setUploadStatus('uploading');
  setUploadMessage('Đang upload bài hát...');

  const ensureDuration = async () => {
    if (songDuration) return songDuration;
    return await new Promise<string>((resolve, reject) => {
      const audio = new Audio(URL.createObjectURL(songFile));
      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        const mins = Math.floor(duration / 60);
        const secs = Math.floor(duration % 60);
        const value = `${mins}:${secs.toString().padStart(2, '0')}`;
        setSongDuration(value);
        resolve(value);
      });
      audio.addEventListener('error', () =>
        reject(new Error('Không đọc được thời lượng file audio'))
      );
    });
  };

  try {
    const finalDuration = await ensureDuration();

    // Upload file nhạc
    const audioFormData = new FormData();
    audioFormData.append('file', songFile);
    audioFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    audioFormData.append('resource_type', 'video');

    const audioRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      { method: 'POST', body: audioFormData }
    );
    const audioData = await audioRes.json();

    if (!audioData.secure_url) throw new Error("Upload audio failed");

    // Upload ảnh cover (nếu có)
    let coverUrl = null;
    if (coverImage) {
      coverUrl = coverImage; // đã có từ upload trước
    }

    // Tạo object bài hát mới
    // Để id = 0 để server tự gán song_id tăng dần từ 1
    const newSong = {
      id: 0,
      title: songTitle,
      duration: finalDuration || "00:00",
      release_date: songReleaseDate || new Date().toISOString().split('T')[0],
      file_url: audioData.secure_url,
      cover_image: coverUrl, // Ảnh riêng của bài hát
      genre_id: songGenre || null, // Genre của bài hát
      views: 0,
    };

    // Cập nhật vào db.json
    const userId = getCurrentUserId();
    if (!userId) {
      Swal.fire("Notification", "You are not logged in!", "info").then(() => {
        navigate("/login");
      });
      return;
    }

    const userRes = await fetch(`http://localhost:8080/users/${userId}`);
    const userData = await userRes.json();

    const updatedAlbums = userData.albums.map((alb: any) =>
      alb.id === album.id
        ? { ...alb, songs: [...(alb.songs || []), newSong] }
        : alb
    );

    const patchRes = await fetch(`http://localhost:8080/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ albums: updatedAlbums }),
    });

    if (!patchRes.ok) throw new Error("Lưu vào server thất bại");
    setUploadStatus('success');
    setUploadMessage('Thêm bài hát thành công!');
    Swal.fire("Success", "Song added successfully!", "success");

    // Reset form sau 2 giây
    setTimeout(() => {
      setShowAddSongModal(false);
      setSongTitle('');
      setSongDuration('');
      setSongReleaseDate('');
      setSongFile(null);
      setCoverImage(null);
      setCoverImageName('');
      setSongGenre('');
      setUploadStatus('idle');
    }, 2000);

    // Cập nhật localStorage + đồng bộ lại album/songs với id thật từ server
    const freshRes = await fetch(`http://localhost:8080/users/${userId}`);
    const freshData = await freshRes.json();
    localStorage.setItem("user", JSON.stringify(freshData));

    const freshAlbum = (freshData.albums || []).find((a: any) => a.id === album.id);
    if (freshAlbum) {
      setAlbum(freshAlbum);
      setSongs(freshAlbum.songs || []);
    }

  } catch (err) {
    console.error(err);
    setUploadStatus('error');
    setUploadMessage('Upload thất bại');
  }
};
        const handleDeleteSong = async () => {
  if (!songToDelete) return;

  try {
    // Bước 1: Lấy dữ liệu user hiện tại
    const userRes = await fetch(`http://localhost:8080/users/${getCurrentUserId()}`);
    if (!userRes.ok) throw new Error("Không thể lấy dữ liệu user");
    const userData = await userRes.json();

    // Bước 2: Tạo danh sách albums mới (xóa bài hát khỏi album hiện tại)
    const updatedAlbums = userData.albums.map((alb: any) =>
      alb.id === album.id
        ? { ...alb, songs: alb.songs.filter((s: any) => s.id !== songToDelete.id) }
        : alb
    );

    // Bước 3: Gửi PATCH cập nhật lên server
    const patchRes = await fetch(`http://localhost:8080/users/${getCurrentUserId()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ albums: updatedAlbums }),
    });

    if (!patchRes.ok) {
      throw new Error("Cập nhật server thất bại");
    }

    // Bước 4: Nếu thành công → cập nhật giao diện ngay
    setSongs(prev => prev.filter(s => s.id !== songToDelete.id));

    // Bước 5: Lấy dữ liệu MỚI NHẤT từ server để cập nhật localStorage
    const freshRes = await fetch(`http://localhost:8080/users/${getCurrentUserId()}`);
    if (!freshRes.ok) throw new Error("Không thể lấy dữ liệu mới nhất");

    const freshUserData = await freshRes.json();
    localStorage.setItem("user", JSON.stringify(freshUserData));

    // Đóng modal + thông báo thành công
    setShowDeleteSongModal(false);
    setSongToDelete(null);

  } catch (err) {
    console.error("Lỗi khi xóa bài hát:", err);
    Swal.fire("Error", "Failed to delete song! Please check your connection and try again.", "error");
  }
};
const handleUpdateSong = async () => {
  if (!songTitle.trim()) {
    Swal.fire("Error", "Please enter song title", "error");
    return;
  }

  try {
    let newFileUrl = editingSong.file_url;

    // Nếu có chọn file mới → upload lên Cloudinary
    if (newSongFile) {
      setUploadStatus('uploading');
      const formData = new FormData();
      formData.append('file', newSongFile);
      formData.append('upload_preset', 'music_app_unsigned');
      formData.append('resource_type', 'video');

      const res = await fetch(
        'https://api.cloudinary.com/v1_1/dglknpibu/upload',
        { method: 'POST', body: formData }
      );
      const data = await res.json();

      if (!data.secure_url) throw new Error("Upload failed");
      newFileUrl = data.secure_url;
    }

    const updatedSong = {
      ...editingSong,
      title: songTitle,
      duration: songDuration || "00:00",
      release_date: songReleaseDate || editingSong.release_date,
      file_url: newFileUrl,
      cover_image: coverImage || editingSong.cover_image || null,
      genre_id: songGenre || editingSong.genre_id || null,
    };

    // Cập nhật DB
    const res = await fetch(`http://localhost:8080/users/${getCurrentUserId()}`);
    const userData = await res.json();

    const updatedAlbums = userData.albums.map((alb: any) =>
      alb.id === album.id
        ? {
            ...alb,
            songs: alb.songs.map((s: any) =>
              s.id === editingSong.id ? updatedSong : s
            ),
          }
        : alb
    );

        const patchRes = await fetch(`http://localhost:8080/users/${getCurrentUserId()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ albums: updatedAlbums }),
    });

    if (!patchRes.ok) {
      throw new Error("Cập nhật server thất bại");
    }

    // CẬP NHẬT GIAO DIỆN NGAY
    setSongs(prev => prev.map(s => s.id === editingSong.id ? updatedSong : s));

    // CẬP NHẬT LOCALSTORAGE ĐỂ RELOAD VẪN ĐÚNG
    const freshRes = await fetch(`http://localhost:8080/users/${getCurrentUserId()}`);
    const freshUserData = await freshRes.json();
    localStorage.setItem("user", JSON.stringify(freshUserData));

    setShowEditSongModal(false);
    setEditingSong(null);
    setNewSongFile(null);
    setSongTitle('');
    setSongDuration('');
    setSongReleaseDate('');
    setSongGenre('');
    setCoverImage(null);
    setCoverImageName('');
    setUploadStatus('idle');
    
    Swal.fire("Success", "Song updated successfully!", "success");
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Update failed!", "error");
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white pb-32">
      <header className="flex items-center justify-between px-8 py-4 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
          {/* RIGHT: CHỈ HIỂN THỊ AVATAR KHI ĐÃ ĐĂNG NHẬP */}
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
                              onClick={() => {
                                if (!song.file_url) {
                                  Swal.fire("Notification", "This song does not have an audio file.", "info");
                                  return;
                                }
                                handlePlayFromSearch(song, index);
                              }}
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
                      {/* Luôn hiển thị avatar chữ cái đầu khi chưa có ảnh đại diện */}
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
                        {/* Bridge vô hình để kết nối avatar và dropdown - giúp di chuyển chuột không bị đóng */}
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
      {/* SIDEBAR – giống DashboardPage */}
      <div className="group fixed left-2 top-20 w-16 hover:w-52 transition-all duration-200 flex flex-col gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl px-2 py-4 overflow-hidden">
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
            Discover
          </span>
        </button>

        <button
          aria-label="Albums"
          onClick={() => navigate("/artist-album")}
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
            location.pathname.startsWith("/artist-album") ||
            location.pathname.startsWith("/artist-song")
              ? "text-cyan-500 hover:text-cyan-400 bg-slate-800/40"
              : "text-gray-400 hover:text-white"
          }`}
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
          onClick={() => navigate("/dashboard/list-music")}
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
          aria-label="Album Page"
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
            location.pathname === "/dashboard/album"
              ? "text-cyan-500 hover:text-cyan-400 bg-slate-800/40"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => navigate("/dashboard/album")}
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
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition text-lg font-medium">
          <ChevronLeft size={24} /> Back to Albums
        </button>
                <div className="my-8">
                <button
                    onClick={() => setShowAddSongModal(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 px-6 py-3 rounded-full font-semibold transition flex items-center gap-2 shadow-lg"
                >
                    <Plus size={20} /> Add New Song
                </button>
                </div>
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 mb-6 flex items-center gap-6 border border-slate-700">
            <img 
                src={album.cover_image || "https://images.unsplash.com/photo-1494232410401-ad00c545f5c6?w=400&h=400&fit=crop"} 
                alt={album.title} 
                className="w-40 h-40 rounded-lg object-cover shadow-xl" 
            />
            <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{album.title}</h1>
                <p className="text-lg text-gray-400 mb-3">{album.artistName}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                    <Music size={16} />
                    {songs.length} songs
                </span>
                <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    {album.release_date ? new Date(album.release_date).toLocaleDateString() : "Unknown"}
                </span>
                </div>
            </div>
            </div>

        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 flex items-center justify-between border border-slate-700">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Sort by:</span>
            <button
              onClick={() => handleSort('name')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                sortBy === 'name' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              <Music size={16} />
              Name
              {sortBy === 'name' && (
                <ArrowUpDown size={14} className={sortOrder === 'desc' ? 'rotate-180' : ''} />
              )}
            </button>
            <button
              onClick={() => handleSort('releaseDate')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                sortBy === 'releaseDate' ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              <Calendar size={16} />
              Release Date
              {sortBy === 'releaseDate' && (
                <ArrowUpDown size={14} className={sortOrder === 'desc' ? 'rotate-180' : ''} />
              )}
            </button>
          </div>
          <div className="text-sm text-gray-400">
            {sortedSongs.length} songs total
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-xl overflow-hidden border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/80">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-6 py-4 w-12">#</th>
                  <th className="px-6 py-4 w-20">Cover</th>
                  <th className="px-6 py-4">Song Name</th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      Duration
                    </div>
                  </th>
                  <th className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      Release Date
                    </div>
                  </th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {sortedSongs.map((song: any, index: number) => (
                  <tr
                    key={song.id}
                    className="hover:bg-slate-700/30 transition group cursor-pointer"
                    onClick={() => {
                      if (!song.file_url) {
                        Swal.fire("Notification", "This song does not have an audio file. Please upload an audio file in the Add/Edit Song section.", "info");
                        return;
                      }

                      playTrack({
                        id: song.id,
                        title: song.title,
                        artist:
                          album?.artistName ||
                          `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
                          user?.email ||
                          "",
                        duration: song.duration || "00:00",
                        cover:
                          song.cover_image ||
                          album?.cover_image ||
                          "https://images.unsplash.com/photo-1494232410401-ad00c545f5c6?w=80&h=80&fit=crop",
                        file_url: song.file_url,
                        album_id: album?.id ?? null,
                        views: song.views ?? 0,
                        favoriteCount: 0,
                        rank: index + 1,
                      });
                    }}
                  >
                    <td className="px-6 py-4 text-gray-400 font-semibold">{index + 1}</td>
                    
                    <td className="px-6 py-4">
                      <img
                        src={song.cover_image || album.cover_image || "https://images.unsplash.com/photo-1494232410401-ad00c545f5c6?w=80&h=80&fit=crop"}
                        alt={song.title}
                        className="w-12 h-12 rounded-md object-cover shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1494232410401-ad00c545f5c6?w=80&h=80&fit=crop";
                        }}
                      />
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          className="w-10 h-10 rounded-full flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 transition-all"
                        >
                          <Play size={16} fill="white" />
                        </button>
                        <span className="font-medium">{song.title}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-gray-400">{song.duration || "00:00"}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {song.release_date ? new Date(song.release_date).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        album.status === "Active" 
                          ? "bg-green-500/20 text-green-400 border border-green-500/50"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                      }`}>
                        {album.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSong(song);
                            setSongTitle(song.title || "");
                            setSongDuration(song.duration || "");
                            setSongReleaseDate(song.release_date || "");
                            setSongGenre(song.genre_id || '');
                            setCoverImage(song.cover_image || null);
                            setCoverImageName(song.cover_image ? 'current-cover.jpg' : '');
                            setNewSongFile(null);
                            setShowEditSongModal(true);
                          }}
                          className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/50 transition"
                          title="Sửa bài hát"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const result = await Swal.fire({
                              title: "Confirm Delete",
                              text: `Are you sure you want to delete song "${song.title}"?`,
                              icon: "warning",
                              showCancelButton: true,
                              confirmButtonColor: "#d33",
                              cancelButtonColor: "#3085d6",
                              confirmButtonText: "Delete",
                              cancelButtonText: "Cancel",
                            });
                            if (result.isConfirmed) {
                              setSongToDelete(song);
                              setShowDeleteSongModal(true);
                            }
                          }}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/50 transition"
                          title="Xóa bài hát"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
   
      </main>

      <footer className="relative bg-slate-900/50 rounded-3xl p-12 mt-12 mx-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold">
              M
            </div>
          </div>
          <h3 className="text-center text-2xl font-bold mb-2">The Miraculous</h3>
          <p className="text-center text-cyan-400 mb-8">Subscribe</p>
          <div className="grid grid-cols-3 gap-8 mb-12">
            <div>
              <h4 className="text-cyan-400 font-semibold mb-4">Miraculous Music Station</h4>
              <p className="text-sm text-gray-400">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
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
              <input type="text" placeholder="Enter Your Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white text-black px-4 py-2 rounded mb-2 text-sm" />
              <input type="email" placeholder="Enter Your Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white text-black px-4 py-2 rounded mb-4 text-sm" />
              <button className="w-full bg-cyan-500 hover:bg-cyan-600 py-2 rounded font-medium transition">Subscribe</button>
            </div>
          </div>
          <div className="text-center text-sm text-gray-400 mt-8">
            <p>Copyright © 2024. The MusicStation Music Template. All Rights Reserved</p>
          </div>
        </div>
      </footer>
      {showAddSongModal && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div className="bg-slate-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
      <h2 className="text-2xl font-bold mb-6 text-cyan-400">Add New Song</h2>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Image className="w-4 h-4 text-cyan-400" />
            Song Cover (optional)
          </h3>
          {coverImage ? (
            <div className="relative group">
              <img
                src={coverImage}
                alt="Song cover"
                className="w-full aspect-square object-cover rounded-lg border-2 border-cyan-500/50"
              />
              <button
                onClick={() => {
                  setCoverImage(null);
                  setCoverImageName('');
                }}
                className="absolute top-2 right-2 bg-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
              >
                <X size={16} />
              </button>
              <p className="text-xs text-gray-400 mt-2 truncate">{coverImageName}</p>
            </div>
          ) : (
            <label className="block border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-400 transition">
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-400">Click to upload image (JPEG/PNG)</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Song Title *</label>
            <input
              type="text"
              placeholder="Enter song title"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Duration</label>
            <input
              type="text"
              value={songDuration || "Auto detect after upload"}
              placeholder="Will be auto-filled"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-300"
              disabled
            />
            {songFile && !songDuration && (
              <p className="text-xs text-cyan-400 mt-1">Processing audio duration...</p>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Release Date</label>
            <input
              type="date"
              value={songReleaseDate}
              onChange={(e) => setSongReleaseDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Genre</label>
            <select
              value={songGenre}
              onChange={(e) => setSongGenre(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">Select genre</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.genre_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Audio File *</label>
            <label className="block border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-cyan-500 transition">
              <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-400">
                {songFile ? songFile.name : "Click to upload MP3, WAV... (max 50MB)"}
              </p>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setSongFile(e.target.files[0]);
                    const audio = new Audio(URL.createObjectURL(e.target.files[0]));
                    audio.addEventListener('loadedmetadata', () => {
                      const duration = audio.duration;
                      const mins = Math.floor(duration / 60);
                      const secs = Math.floor(duration % 60);
                      setSongDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
                    });
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {uploadStatus !== 'idle' && (
        <div className={`text-center py-3 rounded-lg mt-6 ${uploadStatus === 'success' ? 'bg-green-900/50 text-green-400' : uploadStatus === 'error' ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-blue-400'}`}>
          {uploadStatus === 'uploading' && <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />}
          <p className="font-medium">{uploadMessage}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end mt-8">
        <button
          onClick={() => {
            setShowAddSongModal(false);
            setSongTitle('');
            setSongDuration('');
            setSongReleaseDate('');
            setSongFile(null);
            setCoverImage(null);
            setCoverImageName('');
            setSongGenre('');
            setUploadStatus('idle');
          }}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition"
        >
          Cancel
        </button>
        <button
          onClick={handleUploadSong}
          disabled={uploadStatus === 'uploading' || !songTitle.trim() || !songFile}
          className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-semibold transition disabled:opacity-70 flex items-center gap-2"
        >
          {uploadStatus === 'uploading' ? (
            <> <Loader2 className="w-5 h-5 animate-spin" /> Uploading... </>
          ) : (
            <> <Save size={18} /> Add Song </>
          )}
        </button>
      </div>
    </div>
  </div>
)}
{showDeleteSongModal && songToDelete && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-700">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-red-500/20 p-3 rounded-full">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Delete song?</h3>
          <p className="text-sm text-gray-400">This action cannot be undone.</p>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-center">
        <p className="text-lg font-semibold text-cyan-300">{songToDelete.title}</p>
        <p className="text-sm text-gray-400 mt-1">
          {songToDelete.duration} • {songToDelete.release_date ? new Date(songToDelete.release_date).toLocaleDateString() : 'Unknown'}
        </p>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => {
            setShowDeleteSongModal(false);
            setSongToDelete(null);
          }}
          className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition"
        >
          cancel
        </button>
        <button
          onClick={handleDeleteSong}
          className="px-8 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition flex items-center gap-2"
        >
          <Trash2 size={18} />
          Remove permanently
        </button>
      </div>
    </div>
  </div>
)}
{showEditSongModal && editingSong && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div className="bg-slate-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
      <h2 className="text-2xl font-bold mb-6 text-cyan-400">Edit Song</h2>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Image className="w-4 h-4 text-cyan-400" />
            Song Cover (optional)
          </h3>
          {coverImage ? (
            <div className="relative group">
              <img
                src={coverImage}
                alt="Song cover"
                className="w-full aspect-square object-cover rounded-lg border-2 border-cyan-500/50"
              />
              <button
                onClick={() => {
                  setCoverImage(null);
                  setCoverImageName('');
                }}
                className="absolute top-2 right-2 bg-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
              >
                <X size={16} />
              </button>
              <p className="text-xs text-gray-400 mt-2 truncate">{coverImageName}</p>
            </div>
          ) : (
            <label className="block border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-400 transition">
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-400">Click to upload image (JPEG/PNG)</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Song Title *</label>
            <input
              type="text"
              placeholder="Enter song title"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Duration</label>
            <input
              type="text"
              placeholder="duration (vd: 3:45)"
              value={songDuration}
              onChange={(e) => setSongDuration(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Release Date</label>
            <input
              type="date"
              value={songReleaseDate}
              onChange={(e) => setSongReleaseDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1 block">Genre</label>
            <select
              value={songGenre}
              onChange={(e) => setSongGenre(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none"
            >
              <option value="">Select genre</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.genre_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
        <div className="mb-6">
        <p className="text-sm text-gray-400 mb-2">File:</p>
        <p className="text-cyan-300 text-sm truncate">
            {editingSong.file_url ? "The music file is available" : "There is no music file yet"}
        </p>
        
        <label className="block mt-4">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-cyan-500 transition">
            <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-400">
                {newSongFile ? newSongFile.name : "Choose a new music song (MP3, WAV...)"}
            </p>
            <input
                type="file"
                accept="audio/*"
                onChange={(e) => e.target.files && setNewSongFile(e.target.files[0])}
                className="hidden"
            />
            </div>
            {newSongFile && (
            <p className="text-xs text-green-400 mt-2 text-center">Ready to replace the old file</p>
            )}
        </label>
        </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => {
            setShowEditSongModal(false);
            setEditingSong(null);
            setSongTitle('');
            setSongDuration('');
            setSongReleaseDate('');
            setSongGenre('');
            setCoverImage(null);
            setCoverImageName('');
          }}
          className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition"
        >
          Close
        </button>
        <button
          onClick={handleUpdateSong}
          className="px-8 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-semibold transition flex items-center gap-2"
        >
          <Save size={18} /> Save
        </button>
      </div>
    </div>
  </div>


)}

{currentPlayingSong && (
  <audio
    key={currentPlayingSong.id} 
    ref={audioRef}
    src={currentPlayingSong.file_url}
    autoPlay
    onTimeUpdate={(e) => {
      const audio = e.currentTarget;
      setCurrentTime(audio.currentTime);
      setTotalDuration(audio.duration || 0);
    }}
    onLoadedMetadata={(e) => {
      const audio = e.currentTarget;
      setTotalDuration(audio.duration || 0);
    }}
    onEnded={() => {
      setIsPlaying(false);
      setCurrentPlayingSong(null);
      setCurrentTime(0);
    }}
    onError={() => {
      Swal.fire("Error", "Unable to play this file.", "error");
      setIsPlaying(false);
    }}
  />
)}

{currentPlayingSong && (
  <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 px-6 py-3 z-50">
    <div className="max-w-7xl mx-auto flex items-center justify-between">

      <div className="flex items-center gap-4 min-w-0">
        <img
          src={album.cover_image || "https://images.unsplash.com/photo-1494232410401-ad00c545f5c6?w=60&h=60&fit=crop"}
          alt="cover"
          className="w-14 h-14 rounded-md object-cover flex-shrink-0 shadow-lg"
        />
        <div className="min-w-0">
          <h4 className="font-semibold text-white truncate max-w-xs">
            {currentPlayingSong.title}
          </h4>
          <p className="text-sm text-gray-400 truncate max-w-xs">
            {album.artistName}
          </p>
        </div>
        <button className="ml-3 text-gray-400 hover:text-red-500 transition">
          <Heart size={20} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
      <div className="flex items-center gap-8">
          <button className="text-gray-400 hover:text-white transition">
            <SkipBack size={22} />
          </button>

          <button
            onClick={() => {
              if (!audioRef.current) return;
              if (isPlaying) {
                audioRef.current.pause();
              } else {
                audioRef.current.play();
              }
              setIsPlaying(!isPlaying);
            }}
            className="bg-white text-black rounded-full p-4 hover:scale-105 transition shadow-xl"
          >
            {isPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" className="ml-1" />}
          </button>

          <button className="text-gray-400 hover:text-white transition">
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
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = x / rect.width;
              const newTime = percentage * totalDuration;
              if (audioRef.current) {
                audioRef.current.currentTime = newTime;
                setCurrentTime(newTime);
              }
            }}
          >
            <div className="absolute inset-0 bg-slate-600 rounded-full h-1 top-1/2 -translate-y-1/2"></div>
            <div
              className="absolute inset-0 bg-cyan-500 rounded-full h-1 top-1/2 -translate-y-1/2 transition-all duration-150"
              style={{ width: `${(currentTime / totalDuration) * 100 || 0}%` }}
            ></div>
            <div
              className="absolute w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all top-1/2 -translate-y-1/2"
              style={{ left: `${(currentTime / totalDuration) * 100 || 0}%`, transform: 'translate(-50%, -50%)' }}
            ></div>
          </div>

          <span className="text-gray-300 w-12 font-medium">
            {formatTime(totalDuration)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button className="text-gray-300 hover:text-white transition">
          <Volume2 size={22} />
        </button>
        <button className="text-gray-300 hover:text-cyan-400 transition">
          <Download size={20} />
        </button>
      </div>

    </div>
  </div>
)}
    
    </div>
  );
}