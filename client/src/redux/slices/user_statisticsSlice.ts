import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export interface UserType {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status?: "ACTIVE" | "INACTIVE";
  role: "ROLE_ADMIN" | "ROLE_ARTIST" | "ROLE_USER";
  created_at: string;
}

interface UserStatisticsState {
  users: UserType[];
  loading: boolean;
  error: string | null;
}

const initialState: UserStatisticsState = {
  users: [],
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk<UserType[]>(
  "userStatistics/fetchUsers",
  async () => {
    const res = await fetch("http://localhost:8080/users");
    const data = await res.json();

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.users)) return data.users;
    if (Array.isArray(data.data)) return data.data;

    return [];
  }
);

const userStatisticsSlice = createSlice({
  name: "userStatistics",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to load users";
      });
  },
});

export default userStatisticsSlice.reducer;

export const selectTotalUsers = (state: RootState) =>
  state.userStatistics.users.length;


export const selectActiveUsers = (state: RootState) =>
  state.userStatistics.users.filter(
    (u) => u.status?.toUpperCase() === "ACTIVE"
  ).length;


export const selectUserTypeStats = (state: RootState) => {
  const users = state.userStatistics.users;

  return [
    {
      type: "Admin",
      value: users.filter((u) => u.role === "ROLE_ADMIN").length,
    },
    {
      type: "Artists",
      value: users.filter((u) => u.role === "ROLE_ARTIST").length,
    },
    {
      type: "Users",
      value: users.filter((u) => u.role === "ROLE_USER").length,
    },
  ];
};


export const selectUserLoading = (state: RootState) =>
  state.userStatistics.loading;

export const selectUserError = (state: RootState) =>
  state.userStatistics.error;
