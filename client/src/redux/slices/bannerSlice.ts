import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

export interface Banner {
  id: number;
  url: string;
  position: string;
}

interface BannerState {
  banners: Banner[];
  loading: boolean;
}

const initialState: BannerState = {
  banners: [],
  loading: false,
};

const API_URL = "http://localhost:8080/banenrs";

export const fetchBanners = createAsyncThunk(
  "banners/fetch",
  async () => {
    const res = await axios.get<Banner[]>(API_URL);
    return res.data;
  }
);

export const addBanner = createAsyncThunk(
  "banners/add",
  async (banner: Omit<Banner, "id">) => {
    const res = await axios.post<Banner>(API_URL, banner);
    return res.data;
  }
);

export const updateBanner = createAsyncThunk(
  "banners/update",
  async (banner: Banner) => {
    const res = await axios.put<Banner>(`${API_URL}/${banner.id}`, banner);
    return res.data;
  }
);

export const deleteBanner = createAsyncThunk(
  "banners/delete",
  async (id: number) => {
    await axios.delete(`${API_URL}/${id}`);
    return id;
  }
);

const bannerSlice = createSlice({
  name: "banners",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBanners.fulfilled, (state, action: PayloadAction<Banner[]>) => {
        state.banners = action.payload;
        state.loading = false;
      })
      .addCase(addBanner.fulfilled, (state, action: PayloadAction<Banner>) => {
        state.banners.push(action.payload);
      })
      .addCase(updateBanner.fulfilled, (state, action: PayloadAction<Banner>) => {
        const index = state.banners.findIndex(b => b.id === action.payload.id);
        if (index !== -1) state.banners[index] = action.payload;
      })
      .addCase(deleteBanner.fulfilled, (state, action: PayloadAction<number>) => {
        state.banners = state.banners.filter(b => b.id !== action.payload);
      });
  },
});

export default bannerSlice.reducer;
