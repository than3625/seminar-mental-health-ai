import apiClient from './api';

export const authService = {
    // Đăng nhập
    login: async (credentials) => {
        return await apiClient.post('/auth/login', credentials);
    },

    // Đăng ký
    register: async (userData) => {
        return await apiClient.post('/auth/register', userData);
    },

};