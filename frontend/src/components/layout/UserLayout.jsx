import { Outlet } from 'react-router-dom';

import Sidebar from './Sidebar';

const UserLayout = () => {
    return (
        <div className="flex h-screen bg-background overflow-hidden">

            <Sidebar />


            {/* Cột bên phải: Chứa Topbar và Nội dung chính */}
            <div className="flex flex-col flex-1 overflow-hidden">

                {/* Vùng nội dung chính, có thanh cuộn riêng */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>

            </div>
        </div>
    );
};

export default UserLayout;
