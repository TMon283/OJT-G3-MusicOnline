import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export interface Song {
  id: number;
  title: string;
  duration: string;
  file_url: string;
  views: number;
  release_date: string;
}

export interface Album {
  id: number;
  title: string;
  release_date: string;
  cover_image: string;
  type: "FREE" | "PREMIUM";
  status: string;
  songs: Song[];
  totalViews?: number; 
}

interface AlbumStatisticsState {
  albums: Album[];
  loading: boolean;
}

export const getAlbumStats = createAsyncThunk<Album[]>(
  "albumStatistics/get",
  async () => {
    const res = await axios.get("http://localhost:8080/users");

    const users = Array.isArray(res.data) ? res.data : [];

    const artists = users.filter(
      (u: any) => u.role === "ROLE_ARTIST"
    );

    const albums: Album[] = artists.flatMap(
      (artist: any) => artist.albums || []
    );

    return albums.map((album) => ({
      ...album,
      totalViews: album.songs?.reduce(
        (sum, s) => sum + (s.views || 0),
        0
      ),
    }));
  }
);

const initialState: AlbumStatisticsState = {
  albums: [],
  loading: false,
};

const albumStatisticsSlice = createSlice({
  name: "albumStatistics",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAlbumStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAlbumStats.fulfilled, (state, action) => {
        state.albums = action.payload;
        state.loading = false;
      })
      .addCase(getAlbumStats.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default albumStatisticsSlice.reducer;
