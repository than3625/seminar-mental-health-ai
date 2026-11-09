import axios from 'axios';
import toast from 'react-hot-toast';

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
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
        return response.data;
    },
    (error) => {
        let errorMessage = "Đã xảy ra lỗi không xác định!";

        if (error.response) {
            errorMessage = error.response.data?.message || `(${error.response.status})`;
        } else if (error.request) {
            errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền!";
        } else {
            errorMessage = "Lỗi xử lý yêu cầu từ trình duyệt!";
        }

        // Bật Toast hiển thị thông báo lỗi ngay lập tức
        toast.error(errorMessage);

        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Logic xử lý khi token hết hạn (tự động logout, chuyển về trang login)
            console.error("Hết hạn token hoặc chưa đăng nhập!");
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
