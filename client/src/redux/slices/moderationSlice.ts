import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export type Status = "Active" | "Pending";

export interface Song {
  id: number;
  title: string;
  views: number;
  duration: string;
  status: Status;
}

export interface Album {
  id: number;
  title: string;
  release_date: string;
  type: string;
  status: Status;
  artistId: number;
  artistName: string;
  songs: Song[];
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  albums?: Album[];
}

interface ModerationState {
  albums: Album[];
  loading: boolean;
}

const API = "http://localhost:8080";

const buildModerationAlbums = (users: User[]): Album[] => {
  return users
    .filter(u => u.role === "ROLE_ARTIST")
    .flatMap(artist =>
      (artist.albums || []).map(album => ({
        ...album,
        artistId: artist.id,
        artistName: `${artist.first_name} ${artist.last_name}`.trim(),
        songs: (album.songs || []).map(s => ({
          ...s,
          status: s.status ?? "Pending",
        })),
      }))
    );
};

export const getModerationData = createAsyncThunk(
  "moderation/get",
  async () => {
    const res = await axios.get<User[]>(`${API}/users`);
    return buildModerationAlbums(res.data);
  }
);

export const deleteAlbumApi = createAsyncThunk(
  "moderation/deleteAlbum",
  async ({ artistId, albumId }: { artistId: number; albumId: number }) => {
    const userRes = await axios.get<User>(`${API}/users/${artistId}`);
    const artist = userRes.data;

    await axios.put(`${API}/users/${artistId}`, {
      ...artist,
      albums: (artist.albums || []).filter(a => a.id !== albumId),
    });

    return { artistId, albumId };
  }
);

export const deleteSongApi = createAsyncThunk(
  "moderation/deleteSong",
  async ({
    artistId,
    albumId,
    songId,
  }: {
    artistId: number;
    albumId: number;
    songId: number;
  }) => {
    const userRes = await axios.get<User>(`${API}/users/${artistId}`);
    const artist = userRes.data;

    await axios.put(`${API}/users/${artistId}`, {
      ...artist,
      albums: (artist.albums || []).map(album =>
        album.id === albumId
          ? {
              ...album,
              songs: album.songs.filter(s => s.id !== songId),
            }
          : album
      ),
    });

    return { albumId, songId };
  }
);

export const toggleAlbumStatusApi = createAsyncThunk(
  "moderation/toggleAlbumStatus",
  async ({
    artistId,
    albumId,
    status,
  }: {
    artistId: number;
    albumId: number;
    status: Status;
  }) => {
    const userRes = await axios.get<User>(`${API}/users/${artistId}`);
    const artist = userRes.data;

    await axios.put(`${API}/users/${artistId}`, {
      ...artist,
      albums: (artist.albums || []).map(a =>
        a.id === albumId ? { ...a, status } : a
      ),
    });

    return { albumId, status };
  }
);

export const toggleSongStatusApi = createAsyncThunk(
  "moderation/toggleSongStatus",
  async ({
    artistId,
    albumId,
    songId,
    status,
  }: {
    artistId: number;
    albumId: number;
    songId: number;
    status: Status;
  }) => {
    const userRes = await axios.get<User>(`${API}/users/${artistId}`);
    const artist = userRes.data;

    await axios.put(`${API}/users/${artistId}`, {
      ...artist,
      albums: (artist.albums || []).map(album =>
        album.id === albumId
          ? {
              ...album,
              songs: album.songs.map(s =>
                s.id === songId ? { ...s, status } : s
              ),
            }
          : album
      ),
    });

    return { albumId, songId, status };
  }
);

const initialState: ModerationState = {
  albums: [],
  loading: false,
};

const moderationSlice = createSlice({
  name: "moderation",
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getModerationData.pending, state => {
        state.loading = true;
      })
      .addCase(getModerationData.fulfilled, (state, action) => {
        state.albums = action.payload;
        state.loading = false;
      })

      .addCase(deleteAlbumApi.fulfilled, (state, action) => {
        state.albums = state.albums.filter(
          a => a.id !== action.payload.albumId
        );
      })
      .addCase(deleteSongApi.fulfilled, (state, action) => {
        const album = state.albums.find(
          a => a.id === action.payload.albumId
        );
        if (album)
          album.songs = album.songs.filter(
            s => s.id !== action.payload.songId
          );
      })

      .addCase(toggleAlbumStatusApi.fulfilled, (state, action) => {
        const album = state.albums.find(
          a => a.id === action.payload.albumId
        );
        if (album) album.status = action.payload.status;
      })
      .addCase(toggleSongStatusApi.fulfilled, (state, action) => {
        const album = state.albums.find(
          a => a.id === action.payload.albumId
        );
        const song = album?.songs.find(
          s => s.id === action.payload.songId
        );
        if (song) song.status = action.payload.status;
      });
  },
});

export default moderationSlice.reducer;
