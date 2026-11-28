import apiClient from './api.js';

export const adminService = {
    getAllUsers: async () => {
        return await apiClient.get(`/admin/users`);
    },

    getUserById: async (userId) => {
        return await apiClient.get(`/admin/users/${userId}`);
    },

    updateUserStatus: async (userId, active) => {
        return await apiClient.put(`/admin/users/${userId}/status`, { active });
    },

    deleteUser: async (userId) => {
        return await apiClient.delete(`/admin/users/${userId}`);
    },
};