import apiClient from './api';

export const journalService = {
    // Lấy ds nhật ký của user
    getJournalsByUser: async (userId) => {
        return await apiClient.get(`/journals/users/${userId}`);
    },

    // Lấy chi tiết 1 bài nhật ký
    getJournalById: async (journalId) => {
        return await apiClient.get(`/journals/${journalId}`);
    },

    // Tạo mới nhật ký
    createJournal: async (data) => {
        return await apiClient.post('/journals', data);
    },

    // Cập nhật nhật ký
    updateJournal: async (journalId, data) => {
        return await apiClient.put(`/journals/${journalId}`, data);
    },

    // Xóa nhật ký
    deleteJournal: async (journalId) => {
        return await apiClient.delete(`/journals/${journalId}`);
    },

    createMoodRecord: async (data) => {
        return await apiClient.post('/mood-records', data);
    }
};