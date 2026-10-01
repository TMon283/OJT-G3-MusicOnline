export interface RegisterType {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
};

export interface LoginType {
  email?: string;
  password?: string;
};
export interface ProlifePage {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  profile_image?: string;
};

export interface Playlist {
  id?: number;
  name: string;
  user_id: number;
  privacy: "private";
  created_at: string;
}

export interface PlaylistSong {
  id: number;
  playlist_id: number;
  song_id: number;
  added_at: string;
}

// Dữ liệu bài hát dùng chung
export interface Song {
  id: number;
  title: string;
  file_url: string;
  artist?: string;
  cover?: string;
  albumCover?: string;
  album_id?: number;
}

