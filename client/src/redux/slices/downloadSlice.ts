import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { musicApi, type DownloadItemResponse } from "../../api/musicApi";

interface DownloadState {
  downloads: DownloadItemResponse[];
  loading: boolean;
  error: string | null;
}

const initialState: DownloadState = {
  downloads: [],
  loading: false,
  error: null,
};

export const fetchDownloads = createAsyncThunk(
  "downloads/fetch",
  async (userId: number | string) => {
    const data = await musicApi.getDownloads(userId);
    return data;
  }
);

export const addDownload = createAsyncThunk(
  "downloads/add",
  async (item: Omit<DownloadItemResponse, "id">) => {
    const data = await musicApi.addDownload(item);
    return data;
  }
);

export const removeDownload = createAsyncThunk(
  "downloads/remove",
  async ({ id, userId }: { id: number; userId: number | string }) => {
    await musicApi.removeDownload(id, userId);
    return { id, userId };
  }
);

export const updateDownload = createAsyncThunk(
  "downloads/update",
  async ({ id, item }: { id: number; item: Partial<DownloadItemResponse> }) => {
    const data = await musicApi.updateDownload(id, item);
    return data;
  }
);

const downloadSlice = createSlice({
  name: "downloads",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDownloads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchDownloads.fulfilled,
        (state, action: PayloadAction<DownloadItemResponse[]>) => {
          state.downloads = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchDownloads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch downloads";
      })
      .addCase(
        addDownload.fulfilled,
        (state, action: PayloadAction<DownloadItemResponse>) => {
          state.downloads.push(action.payload);
        }
      )
      .addCase(
        removeDownload.fulfilled,
        (
          state,
          action: PayloadAction<{ id: number; userId: number | string }>
        ) => {
          state.downloads = state.downloads.filter(
            (d) => d.id !== action.payload.id
          );
        }
      )
      .addCase(
        updateDownload.fulfilled,
        (state, action: PayloadAction<DownloadItemResponse>) => {
          const index = state.downloads.findIndex(
            (d) => d.id === action.payload.id
          );
          if (index !== -1) {
            state.downloads[index] = action.payload;
          }
        }
      );
  },
});

export default downloadSlice.reducer;
