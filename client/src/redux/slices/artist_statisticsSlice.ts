import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface Song {
  id: number;
}

interface Album {
  id: number;
  songs?: Song[];
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  role?: string;
  albums?: Album[];
}

export interface ArtistStat {
  id: number;
  name: string;
  totalAlbums: number;
  totalSongs: number;
}

interface ArtistStatisticsState {
  totalArtists: number;
  totalAlbums: number;
  totalSongs: number;
  artists: ArtistStat[];
}

export const getArtistStats = createAsyncThunk(
  "artistStatistics/get",
  async () => {
    const res = await axios.get<User[]>(
      "http://localhost:8080/users"
    );
    return res.data;
  }
);

const initialState: ArtistStatisticsState = {
  totalArtists: 0,
  totalAlbums: 0,
  totalSongs: 0,
  artists: [],
};

const artistStatisticsSlice = createSlice({
  name: "artistStatistics",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getArtistStats.fulfilled, (state, action) => {
      const users = Array.isArray(action.payload)
        ? action.payload
        : [];

      const artists = users.filter(
        (u) => u.role === "ROLE_ARTIST"
      );

      const artistStats: ArtistStat[] = artists.map(
        (artist) => {
          const albums = artist.albums || [];

          const totalAlbums = albums.length;
          const totalSongs = albums.reduce(
            (sum, album) =>
              sum + (album.songs?.length ?? 0),
            0
          );

          return {
            id: artist.id,
            name: `${artist.first_name} ${artist.last_name}`.trim(),
            totalAlbums,
            totalSongs,
          };
        }
      );

      state.artists = artistStats;
      state.totalArtists = artistStats.length;
      state.totalAlbums = artistStats.reduce(
        (sum, a) => sum + a.totalAlbums,
        0
      );
      state.totalSongs = artistStats.reduce(
        (sum, a) => sum + a.totalSongs,
        0
      );
    });
  },
});

export default artistStatisticsSlice.reducer;
