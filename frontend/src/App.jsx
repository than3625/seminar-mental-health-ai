import { Routes, Route } from 'react-router-dom'
// Import các pages vào đây:
// import Home from './pages/public/Home';
// import Dashboard from './pages/admin/Dashboard';

function App() {
    return (
        <div className="min-h-screen">
            {/* Nơi chứa cấu hình điều hướng */}
            <Routes>
                {/* Ví dụ các trang sẽ cấu hình ở đây */}

                {/* <Route path="/" element={<Home />} /> */}
                {/* <Route path="/admin/dashboard" element={<Dashboard />} /> */}

                {/* Trang tạm thời để test */}
                <Route path="/" element={
                                     <div className="flex flex-col items-center justify-center h-screen space-y-4">
                                        <h1 className="text-4xl font-heading text-primary font-bold">Mindcontext Setup OK!</h1>
                                        <p className="text-lg text-gray-600">Tailwind, React Router, Font chữ đã sẵn sàng.</p>
                                        <button className="bg-primary px-6 py-2 rounded text-white shadow hover:bg-primary.dark transition">
                                            Nút Test Màu Sắc
                                        </button>
                                    </div>
                                } />
            </Routes>
        </div>
    )
}

export default App
