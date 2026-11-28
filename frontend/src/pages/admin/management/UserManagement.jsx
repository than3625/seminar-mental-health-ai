import { useState, useEffect, useMemo } from 'react';
import {
    FiSearch,
    FiSlash,
    FiCheckCircle,
    FiTrash2,
    FiEye,
    FiX,
    FiAlertTriangle,
    FiUsers,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button.jsx';
import { adminService } from '../../../services/adminService.js';

const FILTER_TABS = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'ACTIVE', label: 'Hoạt động' },
    { id: 'BLOCKED', label: 'Đã khóa' },
];

const GENDER_LABELS = {
    MALE: 'Nam',
    FEMALE: 'Nữ',
    OTHER: 'Khác',
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // State cho Modal xem chi tiết & Modal xác nhận xóa
    const [selectedUser, setSelectedUser] = useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Lấy ID của Admin đang đăng nhập để chặn tự khóa/tự xóa chính mình
    const currentAdminId = useMemo(() => {
        try {
            const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
            return userStr ? JSON.parse(userStr).userId : null;
        } catch {
            return null;
        }
    }, []);

    // Tải danh sách người dùng
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await adminService.getAllUsers();
            const list = res?.result || res?.data || res || [];
            setUsers(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error('Lỗi tải danh sách người dùng:', error);
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Lọc danh sách theo từ khóa & trạng thái
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const isActive = Boolean(u.active);
            if (statusFilter === 'ACTIVE' && !isActive) return false;
            if (statusFilter === 'BLOCKED' && isActive) return false;

            if (!searchQuery.trim()) return true;
            const keyword = searchQuery.toLowerCase().trim();
            return (
                (u.fullName && u.fullName.toLowerCase().includes(keyword)) ||
                (u.email && u.email.toLowerCase().includes(keyword)) ||
                (u.username && u.username.toLowerCase().includes(keyword))
            );
        });
    }, [users, searchQuery, statusFilter]);

    // Lấy 2 chữ cái đầu làm Avatar
    const getInitials = (fullName, username) => {
        const source = (fullName || username || 'U').trim();
        const parts = source.split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return source.slice(0, 2).toUpperCase();
    };

    // Format ngày tháng tiếng Việt gọn gàng
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    // Xem chi tiết người dùng
    const handleViewDetail = async (userId) => {
        setIsLoadingDetail(true);
        try {
            const res = await adminService.getUserById(userId);
            const detail = res?.result || res?.data || res;
            setSelectedUser(detail);
        } catch (error) {
            console.error('Lỗi tải chi tiết người dùng:', error);
            toast.error('Không thể tải thông tin chi tiết');
        } finally {
            setIsLoadingDetail(false);
        }
    };

    // Khóa / Mở khóa tài khoản
    const handleToggleStatus = async (user) => {
        const nextStatus = !user.active;
        setActionLoadingId(user.userId);
        try {
            const res = await adminService.updateUserStatus(user.userId, nextStatus);
            const updatedUser = res?.result || res?.data || { ...user, active: nextStatus };

            setUsers((prev) =>
                prev.map((item) => (item.userId === user.userId ? { ...item, ...updatedUser } : item))
            );
            toast.success(
                res?.message || (nextStatus ? 'Mở khóa tài khoản thành công!' : 'Khóa tài khoản thành công!')
            );
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái:', error);
            toast.error('Thao tác thất bại, vui lòng thử lại');
        } finally {
            setActionLoadingId(null);
        }
    };

    // Xóa tài khoản
    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        setActionLoadingId(userToDelete.userId);
        try {
            const res = await adminService.deleteUser(userToDelete.userId);
            setUsers((prev) => prev.filter((item) => item.userId !== userToDelete.userId));
            toast.success(res?.message || 'Xóa tài khoản người dùng thành công!');
            setUserToDelete(null);
        } catch (error) {
            console.error('Lỗi xóa người dùng:', error);
            toast.error('Không thể xóa tài khoản này');
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-12">
            <div className="mb-8 mt-4">
                <h1 className="font-heading text-4xl font-bold text-text-primary mb-2">
                    Quản lý người dùng
                </h1>
                <p className="text-text-secondary text-lg">
                    Theo dõi và quản lý tài khoản thành viên đang sử dụng MindContext.
                </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <div className="relative flex-1">
                    <FiSearch className="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm theo họ tên, email hoặc tên đăng nhập..."
                        className="w-full pl-11 pr-4 py-2.5 bg-surface text-text-primary placeholder:text-text-muted border border-border rounded-full outline-none transition-colors duration-200 focus:border-primary focus:ring-1 focus:ring-primary shadow-soft"
                    />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {FILTER_TABS.map((tab) => {
                        const isSelected = statusFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setStatusFilter(tab.id)}
                                className={`px-4 py-2 rounded-full text-sm transition-all border ${
                                    isSelected
                                        ? 'bg-primary/12 border-primary text-text-primary font-semibold shadow-xs'
                                        : 'bg-surface border-border text-text-secondary hover:bg-surface-hover/60 font-medium'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-surface rounded-card border border-border shadow-soft overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-text-secondary">
                        Đang tải danh sách người dùng...
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-12 text-center">
                        <FiUsers className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-60" />
                        <p className="text-text-primary font-medium mb-1">
                            Không tìm thấy người dùng phù hợp
                        </p>
                        <p className="text-sm text-text-secondary">
                            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="border-b border-border bg-surface-secondary/50 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                                <th className="py-4 px-6">Người dùng</th>
                                <th className="py-4 px-4">Vai trò</th>
                                <th className="py-4 px-4">Ngày tham gia</th>
                                <th className="py-4 px-4">Trạng thái</th>
                                <th className="py-4 px-6 text-right">Thao tác</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-sm">
                            {filteredUsers.map((user) => {
                                const isSelf = user.userId === currentAdminId;
                                const isAdmin = user.role === 'ROLE_ADMIN';
                                const isRowBusy = actionLoadingId === user.userId;

                                return (
                                    <tr
                                        key={user.userId}
                                        className="hover:bg-surface-hover/40 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-10 h-10 rounded-full bg-surface-secondary border border-border flex items-center justify-center text-xs font-semibold text-text-secondary shrink-0">
                                                    {getInitials(user.fullName, user.username)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-text-primary truncate flex items-center gap-2">
                                                        <span>{user.fullName || user.username}</span>
                                                        {isSelf && (
                                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                                                                    Bạn
                                                                </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-text-secondary truncate">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-4 text-text-secondary">
                                            {isAdmin ? (
                                                <span className="font-medium text-primary">Admin</span>
                                            ) : (
                                                <span>User</span>
                                            )}
                                        </td>

                                        <td className="py-4 px-4 text-text-secondary whitespace-nowrap">
                                            {formatDate(user.createdAt)}
                                        </td>

                                        <td className="py-4 px-4 whitespace-nowrap">
                                            {user.active ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        Hoạt động
                                                    </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                        Đã khóa
                                                    </span>
                                            )}
                                        </td>

                                        <td className="py-4 px-6 text-right whitespace-nowrap">
                                            <div className="inline-flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewDetail(user.userId)}
                                                    title="Xem chi tiết"
                                                    className="p-2 rounded-full border border-border text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                                                >
                                                    <FiEye className="w-3.5 h-3.5" />
                                                </button>

                                                {!isSelf && (
                                                    <>
                                                        {user.active ? (
                                                            <button
                                                                type="button"
                                                                disabled={isRowBusy}
                                                                onClick={() => handleToggleStatus(user)}
                                                                className="inline-flex items-center justify-center gap-1.5 w-28 py-1.5 rounded-full text-xs font-medium border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                                                            >
                                                                <FiSlash className="w-3.5 h-3.5 shrink-0" />
                                                                Khóa
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                disabled={isRowBusy}
                                                                onClick={() => handleToggleStatus(user)}
                                                                className="inline-flex items-center justify-center gap-1.5 w-28 py-1.5 rounded-full text-xs font-medium border border-border text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
                                                            >
                                                                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                                Mở khóa
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            disabled={isRowBusy}
                                                            onClick={() => setUserToDelete(user)}
                                                            title="Xóa tài khoản"
                                                            className="p-2 rounded-full border border-border text-text-muted hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                                                        >
                                                            <FiTrash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal 1: Xem chi tiết người dùng */}
            {(selectedUser || isLoadingDetail) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                    <div className="bg-surface border border-border rounded-card max-w-md w-full p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-heading text-xl font-bold text-text-primary">
                                Chi tiết tài khoản
                            </h3>
                            <button
                                type="button"
                                onClick={() => setSelectedUser(null)}
                                className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-secondary"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {isLoadingDetail ? (
                            <div className="py-8 text-center text-text-secondary">
                                Đang tải thông tin...
                            </div>
                        ) : (
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3.5 pb-4 border-b border-border">
                                    <div className="w-12 h-12 rounded-full bg-surface-secondary border border-border flex items-center justify-center font-semibold text-text-primary">
                                        {getInitials(selectedUser.fullName, selectedUser.username)}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-base text-text-primary">
                                            {selectedUser.fullName || 'Chưa cập nhật'}
                                        </div>
                                        <div className="text-text-secondary">@{selectedUser.username}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 py-1.5">
                                    <span className="text-text-secondary">Email:</span>
                                    <span className="col-span-2 text-text-primary font-medium break-all">
                                        {selectedUser.email}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 py-1.5">
                                    <span className="text-text-secondary">Vai trò:</span>
                                    <span className="col-span-2 text-text-primary font-medium">
                                        {selectedUser.role === 'ROLE_ADMIN' ? 'Quản trị viên (Admin)' : 'Người dùng (User)'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 py-1.5">
                                    <span className="text-text-secondary">Giới tính:</span>
                                    <span className="col-span-2 text-text-primary">
                                        {GENDER_LABELS[selectedUser.gender] || 'Chưa cập nhật'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 py-1.5">
                                    <span className="text-text-secondary">Ngày sinh:</span>
                                    <span className="col-span-2 text-text-primary">
                                        {formatDate(selectedUser.dateOfBirth)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 py-1.5">
                                    <span className="text-text-secondary">Ngày tạo:</span>
                                    <span className="col-span-2 text-text-primary">
                                        {formatDate(selectedUser.createdAt)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 py-1.5">
                                    <span className="text-text-secondary">Trạng thái:</span>
                                    <span className="col-span-2">
                                        {selectedUser.active ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                                Đang hoạt động
                                            </span>
                                        ) : (
                                            <span className="text-rose-600 dark:text-rose-400 font-medium">
                                                Đã bị khóa
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => setSelectedUser(null)}
                            >
                                Đóng
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal 2: Xác nhận xóa vĩnh viễn */}
            {userToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                    <div className="bg-surface border border-border rounded-card max-w-md w-full p-6 shadow-xl">
                        <div className="flex items-start gap-3.5 mb-4">
                            <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-600 shrink-0">
                                <FiAlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-heading text-lg font-bold text-text-primary">
                                    Xác nhận xóa tài khoản
                                </h3>
                                <p className="text-sm text-text-secondary mt-1">
                                    Bạn có chắc chắn muốn xóa tài khoản{' '}
                                    <span className="font-semibold text-text-primary">
                                        {userToDelete.fullName || userToDelete.username}
                                    </span>
                                    ? Toàn bộ nhật ký và lịch sử trò chuyện của người dùng này sẽ bị xóa vĩnh viễn và không thể hoàn tác.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setUserToDelete(null)}
                                className="px-4 py-2 rounded-button text-sm font-medium border border-border text-text-secondary hover:bg-surface-secondary transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                disabled={actionLoadingId === userToDelete.userId}
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded-button text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
                            >
                                {actionLoadingId === userToDelete.userId ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;