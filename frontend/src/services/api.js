import axios from 'axios';
import toast from 'react-hot-toast';

const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api/',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// 1. Tự động gắn Token vào mọi request gửi đi
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. Xử lý phản hồi, Silent Refresh & Toast thông minh
apiClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        // --- LOGIC TỰ ĐỘNG REFRESH TOKEN (SILENT REFRESH) ---
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes('/auth/')
        ) {
            originalRequest._retry = true;

            try {
                const refreshToken =
                    localStorage.getItem('refreshToken') ||
                    sessionStorage.getItem('refreshToken');

                if (!refreshToken) {
                    throw new Error('Không có refresh token');
                }

                // Dùng axios thuần để gọi refresh, tránh lặp vô tận vào interceptor
                const res = await axios.post('http://localhost:8080/api/auth/refresh', {
                    refreshToken: refreshToken,
                });

                const newToken = res.data?.result?.token || res.data?.token;

                if (newToken) {
                    const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
                    storage.setItem('token', newToken);

                    // Gắn token mới và gửi lại request ban đầu ngầm (không hiện toast lỗi)
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshErr) {
                // Refresh token cũng hết hạn -> dọn sạch storage, báo 1 toast duy nhất và về /login
                localStorage.clear();
                sessionStorage.clear();

                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', {
                    id: 'session-expired', // Chống hiện trùng nhiều toast nếu nhiều API fail cùng lúc
                });

                window.location.href = '/login';
                return Promise.reject(refreshErr);
            }
        }

        // --- TỐI ƯU HIỂN THỊ TOAST LỖI ---
        // Bỏ qua toast toàn cục nếu request thuộc /auth/ (vì Login.jsx & Register.jsx đã tự toast rồi)
        // hoặc nếu nơi gọi chủ động truyền config { skipToast: true }
        const isAuthRoute = originalRequest?.url?.includes('/auth/');
        const skipToast = originalRequest?.skipToast;

        if (!isAuthRoute && !skipToast) {
            let errorMessage = 'Đã xảy ra lỗi không xác định!';
            let toastId = 'api-error';

            if (error.response) {
                const status = error.response.status;
                const serverMessage = error.response.data?.message;

                if (status === 403) {
                    errorMessage = serverMessage || 'Bạn không có quyền thực hiện thao tác này!';
                    toastId = 'forbidden-error';
                } else if (status === 404) {
                    errorMessage = serverMessage || 'Không tìm thấy dữ liệu yêu cầu!';
                } else if (status >= 500) {
                    errorMessage = serverMessage || 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau!';
                    toastId = 'server-error';
                } else {
                    errorMessage = serverMessage || `Lỗi yêu cầu (${status})`;
                }
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Kết nối quá hạn (Timeout). Vui lòng thử lại!';
                toastId = 'timeout-error';
            } else if (error.request) {
                errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng!';
                toastId = 'network-error';
            }

            // Dùng toastId để nếu 3 API lỗi cùng lúc thì chỉ cập nhật 1 Toast duy nhất, không spam màn hình
            toast.error(errorMessage, { id: toastId });
        }

        return Promise.reject(error);
    }
);

export default apiClient;