import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {FiAlertCircle, FiPlus, FiSearch} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import { journalService } from '../../../services/journalService';


// Cấu hình Cảm xúc
const MOOD_CONFIG = {
    happy: { label: 'Vui vẻ', emoji: '😊', color: 'bg-mood-happy'},
    calm: { label: 'Bình yên', emoji: '😌', color: 'bg-mood-calm'},
    anxious: { label: 'Lo lắng', emoji: '😰', color: 'bg-mood-anxious'},
    sad: { label: 'Buồn bã', emoji: '😔', color: 'bg-mood-sad'},
    angry: { label: 'Tức giận', emoji: '😡', color: 'bg-mood-angry'},
};

const JournalList = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [journals, setJournals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchJournals = async () => {
            try {
                setIsLoading(true);

                const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
                if (!userStr) {
                    navigate('/login'); // Chưa đăng nhập thì đá về login
                    return;
                }
                const user = JSON.parse(userStr);

                const response = await journalService.getJournalsByUser(user.userId);

                const dataList = response?.result || response?.data || (Array.isArray(response) ? response : []);

                if (dataList && dataList.length > 0) {
                    const formattedData = dataList.map(j => ({
                        ...j,
                        mood: j.moodRecord?.moodLabel?.toLowerCase() || 'calm',
                        tags: j.tags || []
                    }));
                    setJournals(formattedData);
                } else {
                    setJournals([]);
                }
            } catch (error) {
                console.error("Lỗi gọi API Backend:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchJournals();
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Lọc nhật ký theo cảm xúc và từ khóa tìm kiếm
    const filteredJournals = journals.filter(journal => {
        const matchMood = activeFilter === 'all' || journal.mood === activeFilter;
        const matchSearch = journal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            journal.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchMood && matchSearch;
    });

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
                <div>
                    <h1 className="font-heading text-4xl font-bold text-text-primary mb-2">Nhật ký của bạn</h1>
                    <p className="text-text-secondary text-lg">Nơi lưu giữ những suy nghĩ và cảm xúc cá nhân.</p>
                </div>
                <Button
                    variant="primary"
                    className="mt-4 md:mt-0"
                    onClick={() => navigate('/user/journal/new')}
                >
                    <FiPlus className="w-5 h-5 mr-2" />
                    Bài viết mới
                </Button>
            </div>

            {/* Thanh công cụ: Tìm kiếm & Lọc */}
            <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-4 mb-8">
                {/* Ô tìm kiếm */}
                <div className="relative w-full lg:w-1/3">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm bài viết, thẻ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-surface border border-border rounded-full text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-sm"
                    />
                </div>

                {/* Bộ lọc cảm xúc (Pills) */}
                <div className="flex items-center space-x-2 overflow-x-auto w-full pb-2 lg:pb-0 hide-scrollbar">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-5 py-2 rounded-full whitespace-nowrap font-medium transition-colors border ${
                            activeFilter === 'all'
                                ? 'bg-surface-secondary border-border-strong text-text-primary'
                                : 'bg-surface border-border text-text-secondary hover:bg-surface-hover'
                        }`}
                    >
                        Tất cả
                    </button>

                    {Object.entries(MOOD_CONFIG).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={() => setActiveFilter(key)}
                            className={`flex items-center px-4 py-2 rounded-full whitespace-nowrap font-medium transition-transform border ${
                                activeFilter === key
                                    ? `${config.color} border-transparent shadow-sm scale-105`
                                    : 'bg-surface border-border text-text-secondary hover:bg-surface-hover'
                            }`}
                        >
                            <span className="mr-2 text-lg">{config.emoji}</span>
                            <span className={activeFilter === key ? config.textColor : ''}>{config.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Xử lý các trạng thái: Loading, Empty, Hiển thị */}
            {isLoading ? (
                <div className="text-center py-20 flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                    <p className="text-text-secondary">Đang tải nhật ký của bạn...</p>
                </div>
            ) : filteredJournals.length === 0 ? (
                <div className="text-center py-20 bg-surface rounded-card border border-border border-dashed">
                    <p className="text-text-muted text-lg mb-4">Chưa có bài nhật ký nào phù hợp.</p>
                    <Button variant="primary" onClick={() => navigate('/user/journal/new')}>
                        Viết bài đầu tiên ngay
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredJournals.map((journal) => {
                        const moodInfo = MOOD_CONFIG[journal.mood] || MOOD_CONFIG.calm;

                        return (
                            <div
                                key={journal.journalId}
                                onClick={() => navigate(`/user/journal/${journal.journalId}`)}
                                className="bg-surface rounded-card p-6 border border-border shadow-soft hover:shadow-card transition-shadow cursor-pointer flex flex-col"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center">
                                        <span className="text-xl mr-2">{moodInfo.emoji}</span>
                                        <span className="text-sm font-medium text-text-primary">{moodInfo.label}</span>
                                    </div>
                                    <span className="text-sm text-text-secondary">
                    {formatDate(journal.createdAt)}
                  </span>
                                </div>

                                <h3 className="font-heading text-xl font-bold text-text-primary mb-3">
                                    {journal.title}
                                </h3>
                                <p className="text-text-secondary line-clamp-3 mb-6 flex-grow">
                                    {journal.content}
                                </p>

                                <div className="flex flex-wrap gap-2 mt-auto">
                                    {journal.tags && journal.tags.map((tag, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-surface-secondary text-text-muted text-xs rounded-md">
                      #{tag}
                    </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default JournalList;