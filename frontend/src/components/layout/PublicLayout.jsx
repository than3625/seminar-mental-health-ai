import { Outlet } from 'react-router-dom';

import Header from './Header';
import Footer from './Footer';

const PublicLayout = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />

            {/* Vùng chứa nội dung của từng trang con (Home, About...) */}
            <main className="flex-grow">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
};

export default PublicLayout;