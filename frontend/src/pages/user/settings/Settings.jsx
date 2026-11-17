import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSun, FiMoon, FiMonitor, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button.jsx';
import Input from '../../../components/ui/Input.jsx';
import { userService } from '../../../services/userService.js';
import { getUserTheme, saveAndApplyUserTheme } from '../../../utils/themeManager.js';

const THEME_OPTIONS = [
    { id: 'light', label: 'Sáng', icon: FiSun },
    { id: 'dark', label: 'Tối', icon: FiMoon },
    { id: 'system', label: 'Hệ thống', icon: FiMonitor },
];

const Settings = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // 1. State Thông tin cá nhân
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        gender: '',
        dateOfBirth: '',
    });
    const [profileErrors, setProfileErrors] = useState({});
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // 2. State Đổi mật khẩu
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    // 3. State Giao diện (Theme)
    const [theme, setTheme] = useState('light');


    // Load dữ liệu hồ sơ từ API
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
                if (!userStr) {
                    navigate('/login');
                    return;
                }
                const currentUser = JSON.parse(userStr);
                setUserId(currentUser.userId);
                setTheme(getUserTheme(currentUser.userId));

                const res = await userService.getUserProfile(currentUser.userId);
                const data = res?.result || res?.data || res;

                setProfile({
                    fullName: data.fullName || '',
                    email: data.email || '',
                    gender: data.gender || '',
                    dateOfBirth: data.dateOfBirth || '',
                });
            } catch (error) {
                console.error('Lỗi tải thông tin cá nhân:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    // Xử lý khi người dùng chọn theme
    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        saveAndApplyUserTheme(userId, newTheme);
    };

    // Xử lý lưu thông tin cá nhân
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!profile.fullName.trim()) {
            errors.fullName = 'Vui lòng nhập tên hiển thị';
        }
        if (!profile.email.trim()) {
            errors.email = 'Vui lòng nhập email';
        }
        if (Object.keys(errors).length > 0) {
            setProfileErrors(errors);
            return;
        }
        setProfileErrors({});

        setIsSavingProfile(true);
        try {
            const payload = {
                fullName: profile.fullName.trim(),
                email: profile.email.trim(),
                gender: profile.gender || null,
                dateOfBirth: profile.dateOfBirth || null,
            };

            const res = await userService.updateProfile(userId, payload);
            const updatedData = res?.result || res?.data;

            // Cập nhật lại fullName trong storage để Dashboard hiển thị tên mới ngay lập tức
            const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
            const storedUser = JSON.parse(storage.getItem('user') || '{}');
            storage.setItem('user', JSON.stringify({
                ...storedUser,
                fullName: updatedData?.fullName || payload.fullName,
            }));

            toast.success('Cập nhật hồ sơ thành công!');
        } catch (error) {
            console.error('Lỗi cập nhật hồ sơ:', error);
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Xử lý đổi mật khẩu
    const handleChangePassword = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!passwords.currentPassword) {
            errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
        }
        if (!passwords.newPassword) {
            errors.newPassword = 'Vui lòng nhập mật khẩu mới';
        } else if (passwords.newPassword.length < 6) {
            errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
        }
        if (passwords.newPassword !== passwords.confirmPassword) {
            errors.confirmPassword = 'Xác nhận mật khẩu không khớp';
        }

        if (Object.keys(errors).length > 0) {
            setPasswordErrors(errors);
            return;
        }
        setPasswordErrors({});

        setIsSavingPassword(true);
        try {
            await userService.changePassword(userId, {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            });
            toast.success('Đổi mật khẩu thành công!');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error('Lỗi đổi mật khẩu:', error);
        } finally {
            setIsSavingPassword(false);
        }
    };

    const renderEyeButton = (fieldKey) => (
        <button
            type="button"
            onClick={() => setShowPwd((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }))}
            className="text-text-muted hover:text-text-primary transition-colors focus:outline-none"
            tabIndex={-1}
        >
            {showPwd[fieldKey] ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
        </button>
    );

    if (isLoading) {
        return <div className="p-10 text-center text-text-secondary">Đang tải cài đặt...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto pb-12">
            {/* Header */}
            <div className="mb-8 mt-4">
                <h1 className="font-heading text-4xl font-bold text-text-primary mb-2">
                    Cài đặt
                </h1>
                <p className="text-text-secondary text-lg">
                    Cá nhân hóa MindContext để phù hợp với không gian chiêm nghiệm của bạn.
                </p>
            </div>

            <div className="space-y-8">
                {/* Thông tin cá nhân */}
                <form
                    onSubmit={handleSaveProfile}
                    className="bg-surface rounded-card p-6 md:p-8 border border-border shadow-soft"
                >
                    <h2 className="font-heading text-xl font-bold text-text-primary mb-6">
                        Hồ sơ cá nhân
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-4">
                        <Input
                            id="fullName"
                            label="Tên hiển thị"
                            placeholder="Nhập họ và tên"
                            value={profile.fullName}
                            error={profileErrors.fullName}
                            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                            required
                        />

                        <Input
                            id="email"
                            type="email"
                            label="Email"
                            placeholder="example@email.com"
                            value={profile.email}
                            error={profileErrors.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            required
                        />

                        <div className="w-full mb-4">
                            <label
                                htmlFor="gender"
                                className="block mb-1.5 text-sm font-medium text-text-primary"
                            >
                                Giới tính
                            </label>
                            <select
                                id="gender"
                                value={profile.gender}
                                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                className="w-full px-4 py-2.5 bg-surface text-text-primary border border-border rounded-input outline-none transition-colors duration-200 focus:border-primary focus:ring-1 focus:ring-primary"
                            >
                                <option value="">Chọn giới tính</option>
                                <option value="MALE">Nam</option>
                                <option value="FEMALE">Nữ</option>
                                <option value="OTHER">Khác</option>
                            </select>
                        </div>

                        <Input
                            id="dateOfBirth"
                            type="date"
                            label="Ngày sinh"
                            value={profile.dateOfBirth}
                            onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                        />
                    </div>

                    <Button type="submit" variant="primary" isLoading={isSavingProfile}>
                        Lưu hồ sơ
                    </Button>
                </form>

                {/* Đổi mật khẩu*/}
                <form
                    onSubmit={handleChangePassword}
                    className="bg-surface rounded-card p-6 md:p-8 border border-border shadow-soft"
                >
                    <h2 className="font-heading text-xl font-bold text-text-primary mb-1">
                        Bảo mật & Mật khẩu
                    </h2>
                    <p className="text-sm text-text-secondary mb-6">
                        Đổi mật khẩu định kỳ để giữ an toàn cho nhật ký của bạn.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-2 mb-4">
                        <Input
                            id="currentPassword"
                            type={showPwd.current ? 'text' : 'password'}
                            label="Mật khẩu hiện tại"
                            placeholder="••••••••"
                            value={passwords.currentPassword}
                            error={passwordErrors.currentPassword}
                            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                            rightElement={renderEyeButton('current')}
                        />

                        <Input
                            id="newPassword"
                            type={showPwd.new ? 'text' : 'password'}
                            label="Mật khẩu mới"
                            placeholder="Tối thiểu 6 ký tự"
                            value={passwords.newPassword}
                            error={passwordErrors.newPassword}
                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                            rightElement={renderEyeButton('new')}
                        />

                        <Input
                            id="confirmPassword"
                            type={showPwd.confirm ? 'text' : 'password'}
                            label="Xác nhận mật khẩu mới"
                            placeholder="Nhập lại mật khẩu mới"
                            value={passwords.confirmPassword}
                            error={passwordErrors.confirmPassword}
                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                            rightElement={renderEyeButton('confirm')}
                        />
                    </div>

                    <Button type="submit" variant="primary" isLoading={isSavingPassword}>
                        Cập nhật mật khẩu
                    </Button>
                </form>

                {/* Giao diện */}
                <div className="bg-surface rounded-card p-6 md:p-8 border border-border shadow-soft">
                    <h2 className="font-heading text-xl font-bold text-text-primary mb-1">
                        Giao diện
                    </h2>
                    <p className="text-sm text-text-secondary mb-6">
                        Chọn chế độ hiển thị giúp đôi mắt bạn cảm thấy dễ chịu nhất.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {THEME_OPTIONS.map((item) => {
                            const Icon = item.icon;
                            const isSelected = theme === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleThemeChange(item.id)}
                                    className={`flex flex-col items-center justify-center py-6 px-4 rounded-2xl border transition-all ${
                                        isSelected
                                            ? 'bg-surface-secondary border-primary text-text-primary shadow-xs ring-1 ring-primary/30'
                                            : 'bg-surface border-border text-text-secondary hover:bg-surface-hover/50'
                                    }`}
                                >
                                    <Icon className={`w-6 h-6 mb-2.5 ${isSelected ? 'text-primary' : ''}`} />
                                    <span className={`text-sm ${isSelected ? 'font-semibold' : 'font-medium'}`}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;