import axios from 'axios';


const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api/',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Tự động gắn Token vào mọi request gửi đi
apiClient.interceptors.request.use(
    (config) => {
        // Lấy token từ localStorage
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

//Xử lý lỗi trả về
apiClient.interceptors.response.use(
    (response) => {
        return response.data; // Trả về luôn data, bỏ qua vỏ bọc response của axios
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Logic xử lý khi token hết hạn (tự động logout, chuyển về trang login)
            console.error("Hết hạn token hoặc chưa đăng nhập!");
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
