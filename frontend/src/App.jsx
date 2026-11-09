import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast';
// Import các pages vào đây:
import Login from './pages/public/Login';
import Register from './pages/public/Register';

import PublicLayout from './components/layout/PublicLayout';
import UserLayout from './components/layout/UserLayout';
import JournalList from './pages/user/journal/JournalList';
import JournalEditor from './pages/user/journal/JournalEditor';

function App() {
    return (
        <div className="min-h-screen">
            {/* THÊM CẤU HÌNH TOASTER Ở ĐÂY */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#FFFCF6', // bg-surface
                        color: '#3D352B', // text-primary
                        border: '1px solid #E5D9C5',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(61, 53, 43, 0.06)',
                    },
                    success: {
                        iconTheme: { primary: '#78936D', secondary: '#FFFCF6' },
                    },
                    error: {
                        iconTheme: { primary: '#C87968', secondary: '#FFFCF6' },
                    },
                }}
            />
            {/* Nơi chứa cấu hình điều hướng */}
            <Routes>
                <Route path="/" element={<PublicLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Route>


                <Route path="/user" element={<UserLayout />}>

                    <Route path="journal" element={<JournalList />} />
                    <Route path="journal/new" element={<JournalEditor />} />
                    <Route path="journal/:id" element={<JournalEditor />} />
                </Route>
            </Routes>
        </div>
    )
}

export default App
