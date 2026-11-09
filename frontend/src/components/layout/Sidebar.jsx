import { Link, useLocation } from 'react-router-dom';
import {
    FiGrid,
    FiBook,
    FiMessageCircle,
    FiWind,
    FiSettings,
    FiLogOut
} from 'react-icons/fi';

const Sidebar = () => {
    // Lấy đường dẫn hiện tại từ trình duyệt
    const location = useLocation();

    // Danh sách các menu chính
    const menuItems = [
        { name: 'Dashboard', path: '/user/dashboard', icon: <FiGrid className="w-5 h-5" /> },
        { name: 'Journaling', path: '/user/journal', icon: <FiBook className="w-5 h-5" /> },
        { name: 'AI Chat', path: '/user/chat', icon: <FiMessageCircle className="w-5 h-5" /> },
        { name: 'Wellness Exercises', path: '/user/exercises', icon: <FiWind className="w-5 h-5" /> },
    ];

    return (
        <aside className="w-64 h-full bg-surface-secondary border-r border-border flex flex-col justify-between py-6">
            <div>
                <div className="flex items-center px-6 mb-8 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-text-inverse mr-3">
                        <FiWind className="w-6 h-6" />
                    </div>
                    <h1 className="font-heading text-2xl font-bold text-text-primary tracking-wide">
                        MindContext
                    </h1>
                </div>

                <nav className="flex flex-col px-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);

                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center px-4 py-3 rounded-button transition-colors duration-200 ${
                                    isActive
                                        ? 'bg-primary text-text-inverse shadow-sm' // Trạng thái đang chọn
                                        : 'text-text-primary hover:bg-surface-hover' // Trạng thái bình thường
                                }`}
                            >
                                <span className="mr-3">{item.icon}</span>
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

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

                    <button className="w-full flex items-center px-4 py-3 rounded-button text-text-secondary hover:bg-surface-hover hover:text-danger transition-colors">
                        <FiLogOut className="w-5 h-5 mr-3" />
                        <span className="font-medium">Log out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;