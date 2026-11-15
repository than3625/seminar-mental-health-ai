import apiClient from './api';

const API_BASE_URL = (apiClient.defaults?.baseURL || 'http://localhost:8080/api').replace(/\/+$/, '');

const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
};

export const chatService = {
    // 1. POST /api/chat-sessions/users/{userId}
    createSession: async (userId) => {
        const res = await apiClient.post(`/chat-sessions/users/${userId}`);
        const payload = res?.data !== undefined ? res.data : res;
        return payload?.result || payload;
    },

    // 2. GET /api/chat-sessions/users/{userId}
    getUserSessions: async (userId) => {
        const res = await apiClient.get(`/chat-sessions/users/${userId}`);
        const payload = res?.data !== undefined ? res.data : res;
        return payload?.result || payload || [];
    },

    // 3. GET /api/chat-sessions/{sessionId}
    getSessionById: async (sessionId) => {
        const res = await apiClient.get(`/chat-sessions/${sessionId}`);
        const payload = res?.data !== undefined ? res.data : res;
        return payload?.result || payload;
    },

    // 4. DELETE /api/chat-sessions/{sessionId}
    deleteSession: async (sessionId) => {
        const res = await apiClient.delete(`/chat-sessions/${sessionId}`);
        return res?.data !== undefined ? res.data : res;
    },

    // 5. POST /api/chat-sessions/{sessionId}/stream (SSE Streaming + Auto Refresh + Abort)
    streamChat: async (sessionId, message, { onChunk, onDone, onError, signal }) => {
        const doFetch = (token) => {
            return fetch(`${API_BASE_URL}/chat-sessions/${sessionId}/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ message }),
                signal
            });
        };

        try {
            let token = getAuthToken();
            let response = await doFetch(token);

            // Tự động refresh token nếu Access Token hết hạn (401)
            if (response.status === 401) {
                const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
                if (refreshToken) {
                    const refreshRes = await apiClient.post('/auth/refresh', { refreshToken });
                    const refreshPayload = refreshRes?.data !== undefined ? refreshRes.data : refreshRes;
                    const newToken = refreshPayload?.result?.token || refreshPayload?.token;
                    if (newToken) {
                        localStorage.setItem('token', newToken);
                        response = await doFetch(newToken);
                    }
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                const events = buffer.split('\n\n');
                buffer = events.pop() || '';

                for (const eventBlock of events) {
                    const lines = eventBlock.split('\n');
                    let eventName = 'message';

                    const dataLines = [];

                    for (const line of lines) {
                        if (line.startsWith('event:')) {
                            eventName = line.slice(6).trim();
                        } else if (line.startsWith('data:')) {
                            dataLines.push(line.slice(5));
                        }
                    }

                    if (eventName === 'message' && dataLines.length > 0 && onChunk) {
                        onChunk(dataLines.join('\n'));
                    }
                }
            }

            if (onDone) onDone();
        } catch (err) {
            if (err.name === 'AbortError') {
                if (onDone) onDone();
                return;
            }
            if (onError) onError(err);
        }
    }
};