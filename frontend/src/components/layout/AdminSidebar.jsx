import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FiGrid,
    FiUsers,
    FiBookOpen,
    FiBarChart2,
    FiLogOut,
    FiWind, FiSettings
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';

const AdminSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Danh sách menu quản trị khớp với thiết kế
    const menuItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <FiGrid className="w-5 h-5" /> },
        { name: 'User Management', path: '/admin/users', icon: <FiUsers className="w-5 h-5" /> },
        { name: 'Knowledge Base', path: '/admin/knowledge-base', icon: <FiBookOpen className="w-5 h-5" /> },
        { name: 'Reports', path: '/admin/reports', icon: <FiBarChart2 className="w-5 h-5" /> },
    ];

    const handleLogout = async () => {
        await authService.logout();
        toast.success('Đã đăng xuất!');
        navigate('/login', { replace: true });
    };

    return (
        <aside className="w-64 h-full bg-surface-secondary border-r border-border flex flex-col justify-between py-6">
            <div>
                {/* Logo MindContext */}
                <Link to="/admin/dashboard" className="flex items-center px-6 mb-5 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-text-inverse mr-3">
                        <FiWind className="w-6 h-6" />
                    </div>
                    <h1 className="font-heading text-2xl font-bold text-text-primary tracking-wide">
                        MindContext
                    </h1>
                </Link>

                {/* Danh sách menu chính */}
                <nav className="flex flex-col px-4 space-y-1.5">
                    {menuItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);

                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center px-4 py-3 rounded-full transition-colors duration-200 ${
                                    isActive
                                        ? 'bg-primary text-text-inverse shadow-sm'
                                        : 'text-text-primary hover:bg-surface-hover'
                                }`}
                            >
                                <span className="mr-3">{item.icon}</span>
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Khu vực dưới cùng: Switch to User View & Log out */}
            <div className="px-4">
                <div className="border-t border-border pt-4 space-y-2">
                    <Link
                        to="/user/settings"
                        className={`w-full flex items-center px-4 py-3 rounded-button transition-colors ${
                            location.pathname.startsWith('/user/settings')
                                ? 'bg-primary text-text-inverse shadow-sm'
                                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                        }`}
                    >
                        <FiSettings className="w-5 h-5 mr-3" />
                        <span className="font-medium">Settings</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 rounded-2xl text-text-secondary hover:bg-surface-hover hover:text-danger transition-colors cursor-pointer"
                    >
                        <FiLogOut className="w-5 h-5 mr-3" />
                        <span className="font-medium">Log out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;