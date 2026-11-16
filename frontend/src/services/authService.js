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

    // Đăng xuất
    logout: async () => {
        const refreshToken =
            localStorage.getItem('refreshToken') ||
            sessionStorage.getItem('refreshToken');

        try {
            if (refreshToken) {
                await apiClient.post('/auth/logout', { refreshToken }, { skipToast: true });
            }
        } catch (error) {
            console.warn('Logout API error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            sessionStorage.removeItem('token');
            sessionStorage.removeItem('refreshToken');
            sessionStorage.removeItem('user');
        }
    }
};