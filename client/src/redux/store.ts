import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import userStatisticsReducer from "./slices/user_statisticsSlice"
import songStatisticsReducer from "./slices/song_statisticsSlice"
import albumStatisticsReducer from "./slices/album_statisticsSlice"
import genreStatisticsReducer from "./slices/genre_statisticsSlice"
import artistStatisticsReducer from "./slices/artist_statisticsSlice"
import moderationStatisticsReducer from "./slices/moderationSlice";
import bannerReducer from "./slices/bannerSlice";
import genreReducer from "./slices/genreSlice";
import downloadReducer from "./slices/downloadSlice";
import favoriteReducer from "./slices/favoriteSlice";
import historyReducer from "./slices/historySlice";


export const store = configureStore({
  reducer: {
    users: userReducer,
    userStatistics: userStatisticsReducer,
    songStatistics: songStatisticsReducer,
    albumStatistics: albumStatisticsReducer,
    genreStatistics: genreStatisticsReducer,
    artistStatistics: artistStatisticsReducer,
    moderationStatistics:moderationStatisticsReducer,
    genres: genreReducer,
    banners: bannerReducer,
    downloads: downloadReducer,
    favorites: favoriteReducer,
    history: historyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
