const API_BASE = "http://localhost:8080";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Các kiểu dữ liệu thô đúng với db.json
type DbUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_image?: string;
  role?: string | null;
  history?: number[]; // danh sách song_id
};

type DbGenre = {
  id: number;
  genre_name: string;
  cover_image?: string;
};

type DbBanner = {
  id: number;
  url: string;
  position: string;
};

export const musicApi = {
  getAlbums: () => fetchJson<AlbumResponse[]>("/albums"),

  // Lấy danh sách nghệ sĩ từ bảng users (role = ROLE_ARTIST)
  getFeaturedArtists: async (): Promise<FeaturedArtistResponse[]> => {
    const users = await fetchJson<DbUser[]>("/users?role=ROLE_ARTIST");
    return users.map((u) => ({
      id: u.id,
      name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() ||
        u.email ||
        `Artist #${u.id}`,
      image: u.profile_image || "/images/artists/default.jpg",
    }));
  },

  // Lấy genres từ bảng genres và map sang FeaturedGenreResponse
  getFeaturedGenres: async (): Promise<FeaturedGenreResponse[]> => {
    const genres = await fetchJson<DbGenre[]>("/genres");
    return genres.map((g) => ({
      id: g.id,
      name: g.genre_name,
      coverImage: g.cover_image || `/images/genres/${g.id}.jpg`,
    }));
  },

  // Lấy danh sách bài hát theo genre_id
  getSongsByGenre: async (genreId: number): Promise<WeeklyTopItemResponse[]> => {
    const albums = await fetchJson<AlbumResponse[]>("/albums");
    const users = await fetchJson<DbUser[]>("/users");
    
    const allSongs: WeeklyTopItemResponse[] = [];
    
    albums.forEach((album) => {
      if (album.songs && Array.isArray(album.songs)) {
        const artistUser = users.find((u) => u.id === album.artist_id);
        const artistName = artistUser
          ? `${artistUser.first_name ?? ""} ${artistUser.last_name ?? ""}`.trim() || artistUser.email
          : album.artist || "Unknown Artist";

        album.songs.forEach((song) => {
          if (song.genre_id === genreId) {
            allSongs.push({
              id: song.id,
              title: song.title,
              artist: artistName,
              duration: song.duration || "0:00",
              cover: song.cover_image || album.cover_image || "/images/albums/default.jpg",
              file_url: song.file_url || null,
              album_id: album.id,
              views: song.views || 0,
              rank: 0,
            });
          }
        });
      }
    });

    return allSongs;
  },

  // Lấy banners từ bảng banners trong db.json
  getBanners: async (): Promise<BannerResponse[]> => {
    const banners = await fetchJson<DbBanner[]>("/banners");
    return banners.map((b) => ({
      id: b.id,
      title: "",
      subtitle: "",
      image: b.url, // DashboardPage đang dùng field image
      ctaLabel: undefined,
      ctaLink: undefined,
    }));
  },

  // Weekly top: tính từ views + lượt yêu thích của bài hát / album (server đã tính sẵn)
  getWeeklyTop: async (type: "album" | "artist" | "song"): Promise<WeeklyTopItemResponse[]> => {
    // type: "song" hoặc "album"
    const data = await fetchJson<WeeklyTopItemResponse[]>(`/weekly_top?type=${type}`);
    return data;
  },

  // Recently played: lấy từ trường history (danh sách song_id) của user, map sang bài hát từ albums
  getRecentlyPlayed: async (userId: number | string | null): Promise<RecentlyPlayedResponse[]> => {
    if (!userId) {
      // Nếu chưa đăng nhập: dùng guestHistory từ localStorage (id bài hát)
      try {
        const guestHistory = localStorage.getItem("guestHistory");
        const ids: number[] = guestHistory ? JSON.parse(guestHistory) : [];
        if (!ids.length) return [];

        const albums = await fetchJson<AlbumResponse[]>("/albums");
        const users = await fetchJson<DbUser[]>("/users");

        const songMap = new Map<number, RecentlyPlayedResponse>();
        albums.forEach((album) => {
          const artistUser = users.find((u) => u.id === album.artist_id);
          const artistName =
            (artistUser
              ? `${artistUser.first_name ?? ""} ${artistUser.last_name ?? ""}`.trim() ||
                artistUser.email
              : album.artist) || "Unknown Artist";

          (album.songs ?? []).forEach((song) => {
            if (ids.includes(song.id)) {
              songMap.set(song.id, {
                id: song.id,
                title: song.title,
                artist: artistName,
                // Ưu tiên song.cover_image, sau đó album.cover_image
                cover: song.cover_image || album.cover_image || "/images/albums/default.jpg",
                playedAt: new Date().toISOString(),
              });
            }
          });
        });

        return ids
          .slice(0, 5)
          .map((id) => songMap.get(id))
          .filter((s): s is RecentlyPlayedResponse => s !== undefined);
      } catch {
        return [];
      }
    }

    // Đã đăng nhập: lấy từ history của user (API đã map sang full info)
    const history = await fetchJson<HistoryItemResponse[]>(`/history?userId=${userId}`);

    // API đã sắp xếp theo playedAt giảm dần, chỉ cần lấy 5 bài đầu
    return history.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      artist: item.artist || "Unknown Artist",
      cover: item.cover || "/images/albums/default.jpg",
      playedAt: item.playedAt,
    }));
  },

  getDownloads: (userId: number | string) =>
    fetchJson<DownloadItemResponse[]>(`/downloads?userId=${userId}`),
  addDownload: (item: Omit<DownloadItemResponse, "id">) =>
    fetchJson<DownloadItemResponse>(`/downloads`, {
      method: "POST",
      body: JSON.stringify(item),
      headers: { "Content-Type": "application/json" },
    }),
  removeDownload: (id: number, userId: number | string) =>
    fetchJson<void>(`/downloads/${id}?userId=${userId}`, { method: "DELETE" }),
  updateDownload: (id: number, item: Partial<DownloadItemResponse>) =>
    fetchJson<DownloadItemResponse>(`/downloads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(item),
      headers: { "Content-Type": "application/json" },
    }),
  getFavorites: (userId: number | string) =>
    fetchJson<FavoriteItemResponse[]>(`/favorites?userId=${userId}`),
  removeFavorite: (id: number, userId: number | string) =>
    fetchJson<void>(`/favorites/${id}?userId=${userId}`, { method: "DELETE" }),
  getHistory: (userId: number | string) =>
    fetchJson<HistoryItemResponse[]>(`/history?userId=${userId}`),
  addHistory: (item: Omit<HistoryItemResponse, "id">) =>
    fetchJson<HistoryItemResponse>(`/history`, {
      method: "POST",
      body: JSON.stringify(item),
      headers: { "Content-Type": "application/json" },
    }),
  removeHistory: (id: number, userId: number | string) =>
    fetchJson<void>(`/history/${id}?userId=${userId}`, { method: "DELETE" }),
};

export type FeaturedArtistResponse = {
  id: number;
  name: string;
  image: string;
  followerCount?: number;
  topTrack?: string;
};

export type FeaturedGenreResponse = {
  id: number;
  name: string;
  coverImage: string;
};

export type BannerResponse = {
  id: number;
  title: string;
  subtitle?: string;
  image: string;
  ctaLabel?: string;
  ctaLink?: string;
};

export type WeeklyTopItemResponse = {
  id: number;
  title?: string;
  name?: string;
  artist?: string;
  duration?: string;
  cover?: string;
  file_url?: string;
  album_id?: number | null;
  // thống kê thêm
  views?: number;          // cho bài hát
  totalViews?: number;     // cho album
  favoriteCount?: number;  // số lượt yêu thích
  rank: number;
};

export type RecentlyPlayedResponse = {
  id: number;
  title: string;
  artist: string;
  cover: string;
  playedAt: string;
};

export type AlbumSong = {
  id: number;
  title: string;
  duration?: string;
  file_url?: string;
  release_date?: string;
  views?: number;
  genre_id?: number;
  created_at?: string;
  updated_at?: string;
};

export type AlbumResponse = {
  id: number;
  title: string;
  release_date: string;
  artist_id?: number;
  cover_image?: string;
  type?: string;
  status?: string;
  songs?: AlbumSong[];
  artist?: string;
};

export type DownloadItemResponse = {
  id: number;
  userId: number;
  title: string;
  album?: string;
  duration?: string;
  cover?: string;
  file_url?: string;
  favorite?: boolean;
};

export type FavoriteItemResponse = {
  id: number;
  userId: number;
  title: string;
  album?: string;
  duration?: string;
  cover?: string;
  file_url?: string;
  addedAt?: string;
};

export type HistoryItemResponse = {
  id: number;
  userId: number;
  title: string;
  artist?: string;
  album?: string;
  duration?: string;
  cover?: string;
  file_url?: string;
  playedAt: string;
};

