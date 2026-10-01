import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

export interface Genre {
  id: number;
  genre_name: string;
  cover_image?: string;
}

interface GenreState {
  genres: Genre[];
  loading: boolean;
}

const initialState: GenreState = {
  genres: [],
  loading: false,
};

const API_URL = "http://localhost:8080/genres";

export const fetchGenres = createAsyncThunk(
  "genres/fetch",
  async () => {
    const res = await axios.get<Genre[]>(API_URL);
    return res.data;
  }
);

export const addGenre = createAsyncThunk(
  "genres/add",
  async (genre: Omit<Genre, "id">) => {
    const res = await axios.post<Genre>(API_URL, genre);
    return res.data;
  }
);

export const updateGenre = createAsyncThunk(
  "genres/update",
  async (genre: Genre) => {
    const res = await axios.put<Genre>(
      `${API_URL}/${genre.id}`,
      genre
    );
    return res.data;
  }
);

export const deleteGenre = createAsyncThunk(
  "genres/delete",
  async (id: number) => {
    await axios.delete(`${API_URL}/${id}`);
    return id;
  }
);

const genreSlice = createSlice({
  name: "genres",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGenres.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchGenres.fulfilled,
        (state, action: PayloadAction<Genre[]>) => {
          state.genres = action.payload;
          state.loading = false;
        }
      )
      .addCase(
        addGenre.fulfilled,
        (state, action: PayloadAction<Genre>) => {
          state.genres.push(action.payload);
        }
      )
      .addCase(
        updateGenre.fulfilled,
        (state, action: PayloadAction<Genre>) => {
          const index = state.genres.findIndex(
            g => g.id === action.payload.id
          );
          if (index !== -1) {
            state.genres[index] = action.payload;
          }
        }
      )
      .addCase(
        deleteGenre.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.genres = state.genres.filter(
            g => g.id !== action.payload
          );
        }
      );
  },
});

export default genreSlice.reducer;
