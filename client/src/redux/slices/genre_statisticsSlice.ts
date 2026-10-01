import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export interface Genre {
  id: number;
  genre_name: string;
}

export interface Song {
  id: number;
  genre_id: number;
}

export interface Album {
  id: number;
  songs?: Song[];
}

export interface GenreStat {
  id: number;
  name: string;
  songs: number;
}

interface GenreStatisticsState {
  totalGenres: number;
  totalSongs: number;
  genreStats: GenreStat[];
}

export const getGenreStats = createAsyncThunk(
  "genreStatistics/get",
  async () => {
    const [genresRes, albumsRes] = await Promise.all([
      axios.get<Genre[]>("http://localhost:8080/genres"),
      axios.get<Album[]>("http://localhost:8080/albums"),
    ]);

    return {
      genres: genresRes.data,
      albums: albumsRes.data,
    };
  }
);

const initialState: GenreStatisticsState = {
  totalGenres: 0,
  totalSongs: 0,
  genreStats: [],
};


const genreStatisticsSlice = createSlice({
  name: "genreStatistics",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getGenreStats.fulfilled, (state, action) => {
      const { genres, albums } = action.payload;

      const allSongs: Song[] = albums.flatMap(
        (album) => album.songs ?? []
      );

      state.totalGenres = genres.length;
      state.totalSongs = allSongs.length;

  
      state.genreStats = genres.map((genre) => ({
        id: genre.id,
        name: genre.genre_name,
        songs: allSongs.filter(
          (song) => song.genre_id === genre.id
        ).length,
      }));
    });
  },
});

export default genreStatisticsSlice.reducer;
