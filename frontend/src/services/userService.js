import apiClient from './api';

export const userService = {
    // Lấy thong tin của user
    getUserProfile: async (userId) => {
        return await apiClient.get(`/users/${userId}`);
    },

    // Cap nhat thong tin
    updateProfile: async (userId, data) => {
        return await apiClient.put(`/users/${userId}`, data);
    },

    // Doi mat khau
    changePassword: async (userId, data) => {
        return await apiClient.put(`/users/${userId}/password`, data);
    },

};