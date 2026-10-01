import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { musicApi, type HistoryItemResponse } from "../../api/musicApi";

interface HistoryState {
  history: HistoryItemResponse[];
  loading: boolean;
  error: string | null;
}

const initialState: HistoryState = {
  history: [],
  loading: false,
  error: null,
};

export const fetchHistory = createAsyncThunk(
  "history/fetch",
  async (userId: number | string) => {
    const data = await musicApi.getHistory(userId);
    return data;
  }
);

export const addHistory = createAsyncThunk(
  "history/add",
  async (item: Omit<HistoryItemResponse, "id">) => {
    const data = await musicApi.addHistory(item);
    return data;
  }
);

export const removeHistory = createAsyncThunk(
  "history/remove",
  async ({ id, userId }: { id: number; userId: number | string }) => {
    await musicApi.removeHistory(id, userId);
    return { id, userId };
  }
);

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchHistory.fulfilled,
        (state, action: PayloadAction<HistoryItemResponse[]>) => {
          state.history = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch history";
      })
      .addCase(
        addHistory.fulfilled,
        (state, action: PayloadAction<HistoryItemResponse>) => {
          state.history.unshift(action.payload);
          if (state.history.length > 100) {
            state.history = state.history.slice(0, 100);
          }
        }
      )
      .addCase(
        removeHistory.fulfilled,
        (
          state,
          action: PayloadAction<{ id: number; userId: number | string }>
        ) => {
          state.history = state.history.filter(
            (h) => h.id !== action.payload.id
          );
        }
      );
  },
});

export default historySlice.reducer;
