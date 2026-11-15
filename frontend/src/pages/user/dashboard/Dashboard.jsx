import {useState, useEffect, useCallback} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiBook, FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import Button from '../../../components/ui/Button';
import { journalService } from '../../../services/journalService';

const MOOD_OPTIONS = [
    { id: 'happy', label: 'Vui vẻ', emoji: '😊', color: 'bg-mood-happy', chartColor: 'var(--color-mood-happy)' },
    { id: 'calm', label: 'Bình yên', emoji: '😌', color: 'bg-mood-calm', chartColor: 'var(--color-mood-calm)' },
    { id: 'anxious', label: 'Lo lắng', emoji: '😰', color: 'bg-mood-anxious', chartColor: 'var(--color-mood-anxious)' },
    { id: 'sad', label: 'Buồn bã', emoji: '😔', color: 'bg-mood-sad', chartColor: 'var(--color-mood-sad)' },
    { id: 'angry', label: 'Tức giận', emoji: '😡', color: 'bg-mood-angry', chartColor: 'var(--color-mood-angry)' },
];

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ fullName: 'Khách', userId: null });

    // States cho Check-in Cảm xúc nhanh
    const [selectedMood, setSelectedMood] = useState(null);
    const [intensity, setIntensity] = useState(5);
    const [isSavingMood, setIsSavingMood] = useState(false);

    // States lưu trữ dữ liệu API
    const [recentJournals, setRecentJournals] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Tính toán lời chào theo giờ
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    const processMoodDataForCharts = (records) => {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            last7Days.push({
                dateString: dateString,
                displayDay: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
            });
        }

        // Gom dữ liệu theo từng ngày (YYYY-MM-DD)
        const grouped = (records || []).reduce((acc, record) => {
            if (!record.recordedAt) return acc;
            const dateKey = record.recordedAt.split('T')[0];
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(record);
            return acc;
        }, {});

        return last7Days.map(dayInfo => {
            const dayRecords = grouped[dayInfo.dateString] || [];
            const result = {
                day: dayInfo.displayDay,
                happy: null,
                calm: null,
                anxious: null,
                sad: null,
                angry: null,
                balance: null,
            };

            if (dayRecords.length === 0) return result;

            // Gom nhóm điểm số theo từng loại mood trong ngày
            const moodBuckets = { happy: [], calm: [], anxious: [], sad: [], angry: [] };
            const signedScores = [];

            dayRecords.forEach(r => {
                const mood = r.moodLabel?.toLowerCase();
                const score = Number(r.score) || 0;

                if (moodBuckets[mood]) {
                    moodBuckets[mood].push(score);
                }

                // Tính điểm có dấu V_i cho biểu đồ Positivity
                if (mood === 'happy' || mood === 'calm') {
                    signedScores.push(+score);
                } else if (mood === 'anxious' || mood === 'sad' || mood === 'angry') {
                    signedScores.push(-score);
                }
            });

            // Biểu đồ 1 (Mood Trends): Trung bình cộng từng mood trong ngày
            Object.keys(moodBuckets).forEach(mood => {
                const scores = moodBuckets[mood];
                if (scores.length > 0) {
                    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                    result[mood] = Math.round(avg * 10) / 10;
                }
            });

            // Biểu đồ 2 (Mood Balance): V_day -> Quy đổi thang 0-100
            if (signedScores.length > 0) {
                const vDay = signedScores.reduce((a, b) => a + b, 0) / signedScores.length;
                const positivity = 50 + (vDay / 10) * 50;
                result.balance = Math.round(positivity * 10) / 10;
            }

            return result;
        });
    };

    const fetchDashboardData = useCallback(async (userId) => {
        try {
            const [journalRes, moodRes] = await Promise.all([
                journalService.getJournalsByUser(userId).catch(() => []),
                journalService.getMoodRecordsByUser(userId).catch(() => [])
            ]);

            // Xử lý dữ liệu nhật ký (Lấy 2 bài mới nhất)
            const journalsData = journalRes?.result || journalRes?.data || (Array.isArray(journalRes) ? journalRes : []);
            const formattedJournals = journalsData
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 2)
                .map(j => ({
                    ...j,
                    mood: j.moodRecord?.moodLabel?.toLowerCase() || 'calm'
                }));
            setRecentJournals(formattedJournals);

            // Xử lý dữ liệu 2 biểu đồ
            const moodsData = moodRes?.result || moodRes?.data || (Array.isArray(moodRes) ? moodRes : []);
            setChartData(processMoodDataForCharts(moodsData));

        } catch (error) {
            console.error("Lỗi tải dữ liệu Dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (!userStr) {
            navigate('/login');
            return;
        }
        const currentUser = JSON.parse(userStr);
        setUser(currentUser);
        fetchDashboardData(currentUser.userId);
    }, [navigate, fetchDashboardData]);

    const handleSaveMood = async () => {
        if (!selectedMood) return;
        setIsSavingMood(true);
        try {
            const payload = {
                userId: user.userId,
                moodLabel: selectedMood,
                score: parseInt(intensity)
            };
            await journalService.createMoodRecord(payload);
            toast.success("Đã ghi nhận cảm xúc của bạn hôm nay!");
            setSelectedMood(null);
            setIntensity(5);

            await fetchDashboardData(user.userId);
        } catch (error) {
            console.error("Lỗi lưu cảm xúc:", error);
        } finally {
            setIsSavingMood(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const MoodTrendsTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            // Chỉ lọc ra những mood có dữ liệu trong ngày đó
            const validItems = payload.filter(item => item.value !== null && item.value !== undefined);
            if (validItems.length === 0) return null;

            return (
                <div className="bg-surface p-3.5 rounded-card shadow-elevated border border-border">
                    <p className="font-heading font-bold text-text-primary mb-2">{label}</p>
                    <div className="space-y-1.5">
                        {validItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-4 text-sm">
                                <span className="flex items-center text-text-secondary">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full mr-2"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    {item.name}
                                </span>
                                <span className="font-medium text-text-primary">{item.value} / 10</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Custom Tooltip cho biểu đồ 2 (Positivity Balance)
    const PositivityTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const val = payload[0].value;
            if (val === null || val === undefined) return null;

            let statusText = 'Tương đối cân bằng';
            if (val <= 20) statusText = 'Rất tiêu cực';
            else if (val <= 40) statusText = 'Tiêu cực';
            else if (val <= 60) statusText = 'Tương đối cân bằng';
            else if (val <= 80) statusText = 'Tích cực';
            else statusText = 'Rất tích cực';

            return (
                <div className="bg-surface p-3.5 rounded-card shadow-elevated border border-border">
                    <p className="font-heading font-bold text-text-primary mb-1">{label}</p>
                    <p className="text-sm text-text-secondary flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                        Chỉ số: <span className="font-bold text-text-primary">{val} / 100</span>
                    </p>
                    <p className="text-xs text-primary-dark font-medium mt-1">({statusText})</p>
                </div>
            );
        }
        return null;
    };


    if (isLoading) {
        return <div className="p-10 text-center text-text-secondary">Đang tải bảng điều khiển...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto pb-12">

            {/* Header Lời chào */}
            <div className="mb-8 mt-4">
                <h1 className="font-heading text-4xl font-bold text-text-primary mb-2">
                    {getGreeting()}, {user.fullName.split(' ')[0] || 'bạn'}.
                </h1>
                <p className="text-text-secondary text-lg">
                    Hãy dành một chút thời gian để lắng nghe bản thân hôm nay nhé.
                </p>
            </div>

            {/* Thẻ Check-in Cảm xúc */}
            <div className="bg-surface rounded-card p-6 md:p-8 border border-border shadow-soft mb-6">
                <h2 className="font-heading text-xl font-bold text-text-primary mb-5">Hôm nay bạn cảm thấy thế nào?</h2>

                <div className="flex flex-wrap gap-4 mb-8">
                    {MOOD_OPTIONS.map((mood) => (
                        <button
                            key={mood.id}
                            onClick={() => setSelectedMood(mood.id)}
                            className={`flex flex-col items-center justify-center w-20 h-24 rounded-2xl border transition-all ${
                                selectedMood === mood.id
                                    ? `${mood.color} border-transparent shadow-sm ring-2 ring-offset-2 ring-primary/40`
                                    : 'bg-surface-secondary border-transparent text-text-secondary hover:bg-surface-hover hover:border-border'
                            }`}
                        >
                            <span className="text-3xl mb-1">{mood.emoji}</span>
                            <span className={`text-sm ${selectedMood === mood.id ? 'font-medium text-text-primary' : ''}`}>
                                {mood.label}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="max-w-md mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-text-primary font-medium">Mức độ cảm xúc</span>
                        <span className="text-text-secondary text-sm">{intensity} / 10</span>
                    </div>
                    <input
                        type="range"
                        min="1" max="10"
                        value={intensity}
                        onChange={(e) => setIntensity(e.target.value)}
                        className="w-full accent-primary h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, var(--color-primary) ${((intensity - 1) / 9) * 100}%, var(--color-surface-secondary) ${((intensity - 1) / 9) * 100}%)`
                        }}
                    />
                </div>

                <Button
                    variant="primary"
                    onClick={handleSaveMood}
                    isLoading={isSavingMood}
                    disabled={!selectedMood}
                >
                    Lưu cảm xúc
                </Button>
            </div>

            {/* Các nút Hành động Nhanh  */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Link to="/user/journal/new" className="bg-surface rounded-card p-6 border border-border shadow-soft hover:shadow-card transition-shadow flex items-center group">
                    <div className="w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center text-primary border border-border mr-4 group-hover:scale-105 transition-transform">
                        <FiBook className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-heading font-bold text-lg text-text-primary mb-1">Viết bài nhật ký mới</h3>
                        <p className="text-text-secondary text-sm">Ghi lại những gì đang diễn ra trong tâm trí</p>
                    </div>
                </Link>

                <Link to="/user/ai-chat" className="bg-surface rounded-card p-6 border border-border shadow-soft hover:shadow-card transition-shadow flex items-center group">
                    <div className="w-14 h-14 rounded-2xl bg-[#EBCBB8]/30 flex items-center justify-center text-[#C87968] border border-[#EBCBB8] mr-4 group-hover:scale-105 transition-transform">
                        <FiMessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-heading font-bold text-lg text-text-primary mb-1">Trò chuyện với AI</h3>
                        <p className="text-text-secondary text-sm">Tâm sự mọi điều một cách nhẹ nhàng</p>
                    </div>
                </Link>
            </div>
            {/* Bieu do 1: weekly mood trends */}
            <div className="bg-surface rounded-card p-6 md:p-8 border border-border shadow-soft mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="font-heading text-xl font-bold text-text-primary">Weekly Mood Trends</h2>
                        <p className="text-text-secondary text-sm mt-0.5">Sự thay đổi cường độ của từng loại cảm xúc</p>
                    </div>
                    <span className="text-text-secondary text-sm">7 ngày qua</span>
                </div>

                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 15, right: 20, left: -20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DFD1" />
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#82786B', fontSize: 13 }}
                                dy={10}
                            />
                            <YAxis
                                domain={[0, 10]}
                                ticks={[0, 2.5, 5, 7.5, 10]}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#82786B', fontSize: 12 }}
                            />
                            <Tooltip content={<MoodTrendsTooltip />} />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{ paddingTop: '20px', fontSize: '13px', color: '#5A5248' }}
                            />

                            {MOOD_OPTIONS.map((m) => (
                                <Line
                                    key={m.id}
                                    type="monotone"
                                    name={m.label}
                                    dataKey={m.id}
                                    stroke="transparent"
                                    dot={{ r: 5, fill: m.chartColor, strokeWidth: 0 }}
                                    activeDot={{ r: 7, fill: m.chartColor, stroke: '#FFFCF6', strokeWidth: 2 }}
                                    connectNulls={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <p className="text-xs text-text-muted mt-4">
                    Mỗi màu đại diện cho một mood (trung bình cộng nếu check-in nhiều lần/ngày). Ngày không có dữ liệu được để trống, không tự động gán score = 0.
                </p>
                <div className="flex justify-between items-center text-xs text-text-muted mt-4 pt-3 border-t border-border/60">
                    <span><span className="w-2.5 h-2.5 rounded-full bg-mood-happy inline-block" /> Vui vẻ</span>
                    <span><span className="w-2.5 h-2.5 rounded-full bg-mood-calm inline-block" /> Bình yên</span>
                    <span><span className="w-2.5 h-2.5 rounded-full bg-mood-anxious inline-block" /> Lo lắng</span>
                    <span><span className="w-2.5 h-2.5 rounded-full bg-mood-sad inline-block" /> Buồn bã</span>
                    <span><span className="w-2.5 h-2.5 rounded-full bg-mood-angry inline-block" /> Tức giận</span>
                </div>
            </div>

            {/* Biểu đồ 2: Weekly Positivity Trends (Mood Balance 0 - 100) */}
            <div className="bg-surface rounded-card p-6 md:p-8 border border-border shadow-soft mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="font-heading text-xl font-bold text-text-primary">Weekly Positivity Trends</h2>
                        <p className="text-text-secondary text-sm mt-0.5">Chỉ số cân bằng cảm xúc tích cực – tiêu cực trong tuần</p>
                    </div>
                    <span className="text-text-secondary text-sm">Thang 0 – 100</span>
                </div>

                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DFD1" />
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#82786B', fontSize: 13 }}
                                dy={10}
                            />
                            <YAxis
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                tickFormatter={(val) => `${val}/100`}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#82786B', fontSize: 12 }}
                            />
                            <Tooltip content={<PositivityTooltip />} />
                            <Line
                                type="monotone"
                                name="Mood Balance"
                                dataKey="balance"
                                stroke="#829B75"
                                strokeWidth={2.5}
                                dot={{ r: 5, fill: '#829B75', stroke: '#FFFCF6', strokeWidth: 2 }}
                                activeDot={{ r: 7, fill: '#69805D', stroke: '#FFFCF6', strokeWidth: 2 }}
                                connectNulls={true}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex justify-between items-center text-xs text-text-muted mt-4 pt-3 border-t border-border/60">
                    <span>0 · Tiêu cực</span>
                    <span>50 · Cân bằng</span>
                    <span>100 · Tích cực</span>
                </div>
            </div>

            {/* Nhật ký gần đây (Recent Journals) */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-heading text-xl font-bold text-text-primary">Nhật ký gần đây</h2>
                    <Link to="/user/journal" className="text-primary hover:text-primary-dark font-medium text-sm transition-colors">
                        Xem tất cả
                    </Link>
                </div>

                {recentJournals.length === 0 ? (
                    <div className="bg-surface rounded-card p-10 text-center border border-border border-dashed">
                        <p className="text-text-secondary">Bạn chưa có bài nhật ký nào.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {recentJournals.map((journal) => {
                            const moodInfo = MOOD_OPTIONS.find(m => m.id === journal.mood) || MOOD_OPTIONS[1];
                            return (
                                <div
                                    key={journal.journalId}
                                    onClick={() => navigate(`/user/journal/${journal.journalId}`)}
                                    className="bg-surface rounded-card p-6 border border-border shadow-soft hover:shadow-card transition-shadow cursor-pointer flex flex-col"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-2xl">{moodInfo.emoji}</span>
                                        <span className="text-sm text-text-secondary">{formatDate(journal.createdAt)}</span>
                                    </div>
                                    <h3 className="font-heading text-lg font-bold text-text-primary mb-2">
                                        {journal.title}
                                    </h3>
                                    <p className="text-text-secondary text-sm line-clamp-3">
                                        {journal.content}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
};

export default Dashboard;