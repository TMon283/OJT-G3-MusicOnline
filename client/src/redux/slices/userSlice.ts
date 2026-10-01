
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../store";
export interface UserType {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  created_at: string;
}

interface UserState {
  users: UserType[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk("users/fetch", async () => {
  const res = await fetch("http://localhost:8080/users");
  return await res.json();
});

export const toggleUserStatus = createAsyncThunk(
  "users/toggleStatus",
  async (userId: number, { getState }) => {
    const state = getState() as RootState;

    const user = state.users.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");

    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const res = await fetch(`http://localhost:8080/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    const updatedUser = await res.json();
    return updatedUser;
  }
);

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to load users";
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.users.findIndex((u) => u.id === updated.id);
        if (index !== -1) {
          state.users[index] = updated;
        }
      });
  },
});

export default userSlice.reducer;
