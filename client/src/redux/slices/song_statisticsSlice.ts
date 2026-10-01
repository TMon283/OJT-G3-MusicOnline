import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export interface Song {
  id: number;
  title: string;
  duration: string;
  file_url: string;
  views: number;
  release_date: string;
  album?: {
    id: number;
    title: string;
  };
}

interface SongStatsState {
  totalSongs: number;
  totalViews: number;
  songs: Song[];
  loading: boolean;
}

const initialState: SongStatsState = {
  totalSongs: 0,
  totalViews: 0,
  songs: [],
  loading: false,
};

export const getSongStats = createAsyncThunk<Song[]>(
  "songStats/get",
  async () => {
    const res = await axios.get("http://localhost:8080/users");

    const users = Array.isArray(res.data) ? res.data : [];
    const artists = users.filter(
      (u: any) => u.role === "ROLE_ARTIST"
    );
    const albums = artists.flatMap(
      (artist: any) => artist.albums || []
    );
    const songs: Song[] = albums.flatMap((album: any) =>
      (album.songs || []).map((song: any) => ({
        ...song,
        album: {
          id: album.id,
          title: album.title,
        },
      }))
    );

    return songs;
  }
);

const songStatsSlice = createSlice({
  name: "songStatistics",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSongStats.pending, (state) => {
        state.loading = true;
      })

      .addCase(getSongStats.fulfilled, (state, action) => {
        const songs = action.payload || [];

        state.songs = songs;
        state.totalSongs = songs.length;

        state.totalViews = songs.reduce(
          (sum, song) => sum + (song.views || 0),
          0
        );

        state.loading = false;
      })

      .addCase(getSongStats.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default songStatsSlice.reducer;
