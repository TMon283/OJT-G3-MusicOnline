import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { musicApi, type FavoriteItemResponse } from "../../api/musicApi";

interface FavoriteState {
  favorites: FavoriteItemResponse[];
  loading: boolean;
  error: string | null;
}

const initialState: FavoriteState = {
  favorites: [],
  loading: false,
  error: null,
};

export const fetchFavorites = createAsyncThunk(
  "favorites/fetch",
  async (userId: number | string) => {
    const data = await musicApi.getFavorites(userId);
    return data;
  }
);

export const removeFavorite = createAsyncThunk(
  "favorites/remove",
  async ({ id, userId }: { id: number; userId: number | string }) => {
    await musicApi.removeFavorite(id, userId);
    return { id, userId };
  }
);

const favoriteSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchFavorites.fulfilled,
        (state, action: PayloadAction<FavoriteItemResponse[]>) => {
          state.favorites = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch favorites";
      })
      .addCase(
        removeFavorite.fulfilled,
        (
          state,
          action: PayloadAction<{ id: number; userId: number | string }>
        ) => {
          state.favorites = state.favorites.filter(
            (f) => f.id !== action.payload.id
          );
        }
      );
  },
});

export default favoriteSlice.reducer;
