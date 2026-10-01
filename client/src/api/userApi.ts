// src/api/userApi.ts
import axiosClient from "./axiosClient";

const userApi = {
    // Lấy toàn bộ users
    getUsers: async () => {
        const res = await axiosClient.get("/users");
        return res.data;
    },

    // Lấy user theo email
    getUserByEmail: async (email: string) => {
        const res = await axiosClient.get(`/users?email=${email}`);
        return res.data[0]; // json-server trả mảng => lấy phần tử đầu
    },

    // Lấy user theo id
    getUserById: async (id: number) => {
        const res = await axiosClient.get(`/users/${id}`);
        return res.data;
    },

    // Tạo user mới
    createUser: async (data: any) => {
        const res = await axiosClient.post("/users", data);
        return res.data;
    },

    // Update user
    updateUser: async (id: number, data: any) => {
        const res = await axiosClient.put(`/users/${id}`, data);
        return res.data;
    },
    //Update password
    updatePassword: async (id: number, password: string) => {
        const res = await axiosClient.patch(`/users/${id}`, { password });
        return res.data;
    },

    // Xóa user
    deleteUser: async (id: number) => {
        const res = await axiosClient.delete(`/users/${id}`);
        return res.data;
    },

    // Lấy role của user
    getUserRole: async (userId: number) => {
        try {
            // Lấy user và role trực tiếp từ user
            const userRes = await axiosClient.get(`/users/${userId}`);
            const user = userRes.data;
            
            return user?.role || null;
        } catch (error) {
            console.error("Error getting user role:", error);
            return null;
        }
    },
};

export default userApi;
