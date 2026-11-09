import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {FiAlertCircle, FiArrowLeft} from 'react-icons/fi';
import { LuSparkles } from "react-icons/lu";
import Button from '../../../components/ui/Button';
import toast from 'react-hot-toast';
import { journalService } from '../../../services/journalService';

const MOOD_OPTIONS = [
    { id: 'happy', label: 'Vui vẻ', emoji: '😊', color: 'bg-mood-happy' },
    { id: 'calm', label: 'Bình yên', emoji: '😌', color: 'bg-mood-calm' },
    { id: 'anxious', label: 'Lo lắng', emoji: '😰', color: 'bg-mood-anxious' },
    { id: 'sad', label: 'Buồn bã', emoji: '😔', color: 'bg-mood-sad' },
    { id: 'angry', label: 'Tức giận', emoji: '😡', color: 'bg-mood-angry' },
];

const JournalEditor = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    // States lưu trữ dữ liệu form
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedMood, setSelectedMood] = useState(null);
    const [intensity, setIntensity] = useState(6);
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const getAuthUser = () => {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    };

    useEffect(() => {
        const user = getAuthUser();
        if (!user) {
            navigate('/login');
            return;
        }
        if (id) {
            const fetchJournalDetail = async () => {
                setIsLoadingData(true);
                try {
                    const response = await journalService.getJournalById(id);
                    const data = response?.result || response?.data || response;
                    setTitle(data?.title || '');
                    setContent(data?.content || '');
                    // Backend cần trả về các trường này để bind vào UI
                    setSelectedMood(data.moodRecord?.moodLabel?.toLowerCase() || 'calm');
                    setTags(data.tags || []);
                } catch (error) {
                    console.error("Lỗi lấy chi tiết bài viết:", error);
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchJournalDetail();
        }
    }, [id]);

    // Xử lý thêm Tag khi nhấn Enter
    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim() !== '') {
            e.preventDefault(); // Ngăn form submit
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput('');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);

        const user = getAuthUser();
        if (!user) {
            toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            setIsSaving(false);
            setTimeout(() => navigate('/login'), 2000);
            return;
        }


        try {
            if (id) {
                const payload = {
                    title: title.trim(),
                    content: content.trim()
                };
                await journalService.updateJournal(id, payload);
            } else {
                const moodPayload = {
                    userId: user.userId,
                    moodLabel: selectedMood,
                    score: parseInt(intensity) // Chuyển chuỗi thành số nguyên
                };
                const moodResponse = await journalService.createMoodRecord(moodPayload);

                const recordId = moodResponse?.recordId || moodResponse?.result?.recordId || moodResponse?.data?.recordId;

                if (!recordId) {
                    throw new Error("Không thể lưu cảm xúc, máy chủ không trả về ID. Vui lòng thử lại!");
                }

                // Gọi API tạo Journal kèm theo recordId vừa lấy được
                const journalPayload = {
                    recordId: recordId,
                    title: title.trim(),
                    content: content.trim()
                };
                await journalService.createJournal(journalPayload);
            }
            toast.success("Đã lưu nhật ký thành công!");
            navigate('/user/journal');
        } catch (error) {
            console.error("Lỗi khi lưu nhật ký:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingData) {
        return <div className="text-center py-20 text-text-secondary">Đang tải dữ liệu bài viết...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col">
            {/* Nút Quay lại */}
            <button
                onClick={() => navigate('/user/journal')}
                className="flex items-center text-text-secondary hover:text-primary transition-colors mb-6 w-fit"
            >
                <FiArrowLeft className="mr-2" />
                <span>Quay lại</span>
            </button>

            {/* Bố cục 2 cột (Cột viết và Cột AI) */}
            <div className="flex flex-col lg:flex-row gap-8 flex-grow">

                {/* CỘT TRÁI: Khu vực soạn thảo chính */}
                <div className="flex-1 bg-surface rounded-card p-6 md:p-8 border border-border shadow-soft flex flex-col">

                    {/* Nhập Tiêu đề */}
                    <input
                        type="text"
                        placeholder="Đặt tiêu đề cho bài viết..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-3xl md:text-4xl font-heading font-bold text-text-primary placeholder-text-muted bg-transparent border-none outline-none mb-8"
                    />

                    {/* Chọn Cảm xúc */}
                    <div className="mb-6">
                        <h3 className="text-text-primary font-medium mb-3">Bạn cảm thấy thế nào?</h3>
                        <div className="flex flex-wrap gap-3">
                            {MOOD_OPTIONS.map((mood) => (
                                <button
                                    key={mood.id}
                                    onClick={() => setSelectedMood(mood.id)}
                                    className={`flex items-center px-4 py-2 rounded-full border transition-all ${
                                        selectedMood === mood.id
                                            ? `${mood.color} border-transparent shadow-sm ring-2 ring-offset-1 ring-primary/30`
                                            : 'bg-surface border-border text-text-secondary hover:bg-surface-hover'
                                    }`}
                                >
                                    <span className="mr-2 text-lg">{mood.emoji}</span>
                                    <span className={selectedMood === mood.id ? 'font-medium text-text-primary' : ''}>
                    {mood.label}
                  </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Thanh trượt Mức độ (Intensity) */}
                    <div className="mb-8 max-w-md">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-text-primary font-medium">Mức độ</span>
                            <span className="text-text-secondary text-sm">{intensity} / 10</span>
                        </div>
                        <input
                            type="range"
                            min="1" max="10"
                            value={intensity}
                            onChange={(e) => setIntensity(e.target.value)}
                            className="w-full accent-primary h-2 bg-surface-secondary rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Khung soạn thảo nội dung */}
                    <textarea
                        placeholder="Hãy viết tự do. Không gian này là của riêng bạn..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full flex-grow min-h-[250px] p-5 bg-surface-secondary text-text-primary placeholder-text-muted border border-border rounded-card outline-none focus:border-primary focus:bg-surface transition-colors resize-none mb-6"
                    ></textarea>

                    {/* Khung nhập Tags */}
                    <div className="mb-6">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map((tag, idx) => (
                                <span key={idx} className="px-3 py-1 bg-surface-secondary border border-border rounded-md text-sm text-text-secondary flex items-center">
                                    #{tag}
                                    <button onClick={() => setTags(tags.filter((_, i) => i !== idx))} className="ml-2 hover:text-danger">&times;</button>
                                </span>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Thêm thẻ (nhấn Enter để lưu)..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                            className="w-full md:w-1/2 px-4 py-2.5 bg-surface border border-border rounded-input text-text-primary focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Footer của form */}
                    <div className="flex items-center gap-4 mt-auto pt-4 border-t border-border">
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            isLoading={isSaving}
                            disabled={!content.trim()}
                        >
                            Lưu bài viết
                        </Button>
                        <span className="flex items-center text-sm text-text-muted">
                            <LuSparkles className="mr-1.5" /> Gợi ý AI sẽ cập nhật khi bạn viết
                        </span>
                    </div>

                </div>

                {/* CỘT PHẢI: AI Insights */}
                <div className="lg:w-80 flex-shrink-0">
                    <div className="bg-surface-secondary rounded-card p-6 border border-border sticky top-6">
                        <h3 className="flex items-center text-lg font-heading font-bold text-primary-dark mb-3">
                            <LuSparkles className="mr-2" /> Gợi ý từ AI
                        </h3>
                        {content.length > 50 ? (
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Đang phân tích... (Nơi này sẽ hiển thị phản hồi từ mô hình AI của bạn dựa trên nội dung bạn vừa viết).
                            </p>
                        ) : (
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Hãy bắt đầu viết và một vài lời suy ngẫm nhẹ nhàng sẽ xuất hiện ở đây để đồng hành cùng bạn.
                            </p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default JournalEditor;
