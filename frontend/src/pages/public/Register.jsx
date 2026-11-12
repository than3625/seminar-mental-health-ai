import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import TextLink from '../../components/ui/TextLink';

export default function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        gender: '',
        dateOfBirth: '',
        password: '',
        confirmPassword: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Mật khẩu nhập lại không trùng khớp!');
            return;
        }

        // Nếu username bị rỗng hoặc chỉ có dấu cách -> lấy email làm username
        const finalUsername = formData.username?.trim() ? formData.username.trim() : formData.email;

        setLoading(true);
        try {
            await api.post('/auth/register', {
                fullName: formData.fullName,
                username: finalUsername,
                email: formData.email,
                gender: formData.gender || null,
                dateOfBirth: formData.dateOfBirth || null,
                password: formData.password,
            });

            toast.success('Tạo tài khoản thành công! Vui lòng đăng nhập.')
            navigate('/login');
        } catch (err) {
            console.error('Register error:', err);
            toast.error(
                err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background font-sans text-text-primary min-h-screen m-0 p-0 antialiased selection:bg-primary/20">
            <div className="min-h-screen w-full flex flex-col md:flex-row">

                {/* ================= CỘT TRÁI: FORM ĐĂNG KÝ ================= */}
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
                    <div className="max-w-[420px] w-full mx-auto my-auto py-8">
                        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mb-3">
                            Tạo tài khoản mới
                        </h1>
                        <p className="text-text-secondary text-base mb-6">
                            Chỉ vài bước đơn giản để bắt đầu không gian tĩnh lặng của bạn.
                        </p>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {/* Trường Username */}
                            <Input
                                id="username"
                                name="username"
                                label="Username (Để trống sẽ lấy Email)"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Nhập username của bạn vào đây nhé!"
                            />

                            {/* Trường Full name */}
                            <Input
                                id="fullName"
                                name="fullName"
                                label="Họ và tên"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Nhập họ tên của bạn vào đây nhé!"
                                required
                            />

                            {/* Trường Email */}
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                label="Email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required
                            />

                            {/* Hàng gồm Gender & Date of birth */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                                <div>
                                    <label className="block mb-1.5 text-sm font-medium text-text-primary">
                                        Giới tính
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 bg-surface text-text-primary border border-border rounded-input outline-none transition-colors duration-200 focus:border-primary focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="">Chọn giới tính</option>
                                        <option value="FEMALE">Nữ</option>
                                        <option value="MALE">Nam</option>
                                        <option value="OTHER">Khác</option>
                                    </select>
                                </div>

                                <Input
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    type="date"
                                    label="Ngày sinh"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Trường Password */}
                            <Input
                                id="password"
                                name="password"
                                label="Mật khẩu"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="text-text-muted hover:text-primary transition focus:outline-none"
                                        title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    >
                                        {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                    </button>
                                }
                            />

                            {/* Trường Confirm Password */}
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                label="Nhập lại mật khẩu"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                                        className="text-text-muted hover:text-primary transition focus:outline-none"
                                        title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    >
                                        {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                    </button>
                                }
                            />

                            {/* Nút Tạo tài khoản */}
                            <Button
                                type="submit"
                                isLoading={loading}
                                variant="primary"
                                size="md"
                                className="w-full mt-2"
                            >
                                Tạo tài khoản
                            </Button>
                        </form>

                        {/* Chuyển sang Log in */}
                        <p className="text-center text-sm text-text-secondary mt-7">
                            Bạn đã có tài khoản?
                            <TextLink to="/login" className="ml-1 font-semibold">
                                Đăng nhập
                            </TextLink>
                        </p>
                    </div>

                    {/* Footer note */}
                    <div className="text-xs text-text-muted hidden md:block">
                        © 2026 MindContext. All rights reserved.
                    </div>
                </div>

                {/* ================= CỘT PHẢI: QUOTE PANEL XANH RÊU ================= */}
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