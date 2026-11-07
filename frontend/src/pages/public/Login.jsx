import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import TextLink from '../../components/ui/TextLink';

export default function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        usernameOrEmail: '',
        password: '',
        rememberMe: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');

        try {
            const res = await api.post('/auth/login', {
                username: formData.usernameOrEmail.trim(),
                password: formData.password,
            });

            // Backend trả về ApiResponse<AuthResponse>
            const authData = res.data?.result || res.result || res.data;

            if (authData?.token) {
                const storage = formData.rememberMe ? localStorage : sessionStorage;

                // 1. Lưu Token để các request sau tự đính kèm Bearer Token
                storage.setItem('token', authData.token);

                // 2. Lưu thông tin User (userId, fullName, role...)
                const userInfo = {
                    userId: authData.userId,
                    username: authData.username,
                    fullName: authData.fullName,
                    role: authData.role,
                };
                storage.setItem('user', JSON.stringify(userInfo));

                navigate('/');
            } else {
                setErrorMessage('Không nhận được mã xác thực từ máy chủ.');
            }
        } catch (err) {
            console.error('Login error:', err);
            // Hứng trực tiếp message từ ErrorCode.UNAUTHENTICATED hoặc USER_NOT_FOUND
            setErrorMessage(
                err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background font-sans text-text-primary min-h-screen m-0 p-0 antialiased selection:bg-primary/20">
            <div className="min-h-screen w-full flex flex-col md:flex-row">

                {/* ================= CỘT TRÁI: FORM ĐĂNG NHẬP ================= */}
                <div className="w-full md:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16">

                    {/* Nút quay về trang chủ */}
                    <div>
                        <TextLink
                            to="/"
                            className="inline-flex items-center gap-2.5 text-primary hover:opacity-80 transition group no-underline hover:no-underline"
                        >
                            <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-text-primary group-hover:text-primary group-hover:border-primary group-hover:-translate-x-1 transition shadow-soft">
                                <FiArrowLeft className="w-5 h-5" />
                            </div>
                            <span className="font-heading font-bold text-xl text-text-primary tracking-tight">
                                MindContext
                            </span>
                        </TextLink>
                    </div>

                    {/* Khung Form ở giữa */}
                    <div className="max-w-[420px] w-full mx-auto my-auto py-10">
                        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mb-3">
                            Welcome back
                        </h1>
                        <p className="text-text-secondary text-base mb-6">
                            Vui lòng đăng nhập để tiếp tục hành trình với chúng tôi nhé!
                        </p>

                        {/* Khung thông báo lỗi */}
                        {errorMessage && (
                            <div className="mb-5 p-3.5 rounded-button bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                                {errorMessage}
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {/* Trường Email / Username */}
                            <Input
                                id="usernameOrEmail"
                                name="usernameOrEmail"
                                type="text"
                                label="Email hoặc Username"
                                value={formData.usernameOrEmail}
                                onChange={handleChange}
                                required
                            />

                            {/* Trường Password */}
                            <div>
                                <label className="block mb-1.5 text-sm font-medium text-text-primary">
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-4 pr-11 py-2.5 bg-surface text-text-primary placeholder-text-muted border border-border rounded-input outline-none transition-colors duration-200 focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition focus:outline-none"
                                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    >
                                        {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember me & Quên mật khẩu */}
                            <div className="flex items-center justify-between text-sm pt-1 pb-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none text-text-secondary">
                                    <input
                                        type="checkbox"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleChange}
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-0 focus:ring-offset-0 accent-primary cursor-pointer"
                                    />
                                    <span>Remember me</span>
                                </label>

                                <TextLink to="/forgot-password">
                                    Quên mật khẩu?
                                </TextLink>
                            </div>

                            {/* Nút Log in */}
                            <Button
                                type="submit"
                                isLoading={loading}
                                variant="primary"
                                size="md"
                                className="w-full mt-2"
                            >
                                Log in
                            </Button>
                        </form>

                        {/* Chuyển sang Register */}
                        <p className="text-center text-sm text-text-secondary mt-8">
                            Nếu bạn chưa có tài khoản?
                            <TextLink to="/register" className="ml-1 font-semibold">
                                Tạo tài khoản
                            </TextLink>
                        </p>
                    </div>

                    <div className="text-xs text-text-muted hidden md:block">
                        © 2026 MindContext. All rights reserved.
                    </div>
                </div>

                {/* ================= CỘT PHẢI: QUOTE PANEL ================= */}
                <div className="w-full md:w-1/2 bg-primary hidden md:flex flex-col justify-between p-12 lg:p-20 text-text-inverse relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-primary-light/10 blur-3xl pointer-events-none"></div>
                    <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-primary-dark/20 blur-3xl pointer-events-none"></div>

                    <div></div>

                    <div className="max-w-xl z-10 my-auto">
                        <blockquote className="font-heading text-3xl lg:text-4xl leading-snug font-normal text-surface mb-6">
                            “Feelings are much like waves. We can't stop them from coming, but we can choose which ones to surf.”
                        </blockquote>
                        <p className="text-primary-light text-sm font-medium tracking-wide">
                            A gentle reminder from MindContext
                        </p>
                    </div>

                    <div className="text-primary-light text-sm z-10">
                        Your private, judgement-free space.
                    </div>
                </div>

            </div>
        </div>
    );
}