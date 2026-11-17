import React, { useState, useRef, useEffect } from 'react';
import { FiPlus, FiSend, FiMessageSquare, FiTrash2, FiSquare } from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import toast from 'react-hot-toast';
import { chatService } from '../../../services/chatService.js';

const getAuthUser = () => {
    try {
        const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const getLocalSessionMeta = (sessionId) => {
    try {
        const raw = localStorage.getItem(`mindcontext_chat_${sessionId}`);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const saveLocalSessionMeta = (sessionId, data) => {
    try {
        localStorage.setItem(`mindcontext_chat_${sessionId}`, JSON.stringify(data));
    } catch {
        // Bỏ qua nếu đầy storage
    }
};

export default function AIChat() {
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [inputMessage, setInputMessage] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);

    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);

    const user = getAuthUser();
    const userId = user?.userId || user?.id;

    const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

    // 1. Tải danh sách phiên chat
    useEffect(() => {
        if (!userId) return;
        const loadSessions = async () => {
            try {
                const data = await chatService.getUserSessions(userId);
                const mapped = data.map((s) => {
                    const cached = getLocalSessionMeta(s.sessionId);
                    const backendMessages = (s.messages || []).map((m, idx) => ({
                        id: m.messageId || idx,
                        sender: m.sender,
                        content: m.content
                    }));
                    const messages = backendMessages.length > 0 ? backendMessages : (cached?.messages || []);
                    const firstUserMsg = messages.find((m) => m.sender === 'USER')?.content;

                    return {
                        id: s.sessionId,
                        title: firstUserMsg
                            ? (firstUserMsg.length > 30 ? firstUserMsg.slice(0, 30) + '...' : firstUserMsg)
                            : (cached?.title || `Conversation #${s.sessionId}`),
                        subtitle: s.updatedAt
                            ? new Date(s.updatedAt).toLocaleDateString('vi-VN')
                            : (s.startedAt ? new Date(s.startedAt).toLocaleDateString('vi-VN') : 'Recent'),
                        messages
                    };
                });
                setSessions(mapped);
            } catch (err) {
                console.error('Lỗi tải lịch sử chat:', err);
            }
        };
        loadSessions();
    }, [userId]);

    // Tự động cuộn xuống cuối khung chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeSession?.messages]);

    // Hủy stream nếu người dùng rời khỏi trang AIChat
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Dừng AI đang trả lời
    const handleStopStreaming = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsStreaming(false);
    };

    // 2. Tạo cuộc trò chuyện mới
    const handleNewChat = async () => {
        if (!userId || isStreaming) return null;
        try {
            const created = await chatService.createSession(userId);
            const newId = created?.sessionId;
            if (!newId) {
                toast.error('Không thể tạo phiên trò chuyện mới!');
                return null;
            }
            const newSession = {
                id: newId,
                title: 'New conversation',
                subtitle: 'Just now',
                messages: []
            };
            saveLocalSessionMeta(newId, newSession);
            setSessions((prev) => [newSession, ...prev]);
            setActiveSessionId(newId);
            return newId;
        } catch (err) {
            toast.error('Không thể tạo phiên trò chuyện mới!');
            return null;
        }
    };

    // 3. Chọn phiên chat
    const handleSelectSession = async (sessionId) => {
        if (isStreaming) return;
        setActiveSessionId(sessionId);
        try {
            const detail = await chatService.getSessionById(sessionId);
            if (detail?.messages && detail.messages.length > 0) {
                const formatted = detail.messages.map((m, idx) => ({
                    id: m.messageId || idx,
                    sender: m.sender,
                    content: m.content
                }));
                setSessions((prev) =>
                    prev.map((s) => (s.id === sessionId ? { ...s, messages: formatted } : s))
                );
            }
        } catch (err) {
            console.error('Lỗi tải chi tiết phiên chat:', err);
        }
    };

    // 4. Xóa phiên chat
    const handleDeleteSession = async (e, sessionId) => {
        e.stopPropagation();
        if (isStreaming) return;
        try {
            await chatService.deleteSession(sessionId);
            localStorage.removeItem(`mindcontext_chat_${sessionId}`);
            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            if (activeSessionId === sessionId) {
                setActiveSessionId(null);
            }
            toast.success('Đã xóa cuộc trò chuyện');
        } catch {
            toast.error('Xóa thất bại!');
        }
    };

    // 5. Gửi tin nhắn & nhận SSE
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const trimmed = inputMessage.trim();
        if (!trimmed || isStreaming) return;

        const userMsgId = Date.now();
        const assistantMsgId = Date.now() + 1;
        let targetSessionId = activeSessionId;

        setInputMessage('');
        setIsStreaming(true);

        try {
            if (!targetSessionId) {
                const created = await chatService.createSession(userId);
                targetSessionId = created?.sessionId;
                if (!targetSessionId) {
                    setIsStreaming(false);
                    toast.error('Không thể gửi tin nhắn!');
                    return;
                }

                const newSession = {
                    id: targetSessionId,
                    title: trimmed.length > 30 ? trimmed.slice(0, 30) + '...' : trimmed,
                    subtitle: 'Just now',
                    messages: [
                        { id: userMsgId, sender: 'USER', content: trimmed },
                        { id: assistantMsgId, sender: 'ASSISTANT', content: '' }
                    ]
                };

                saveLocalSessionMeta(targetSessionId, newSession);
                setSessions((prev) => [newSession, ...prev]);
                setActiveSessionId(targetSessionId);
            } else {
                setSessions((prev) =>
                    prev.map((session) => {
                        if (session.id === targetSessionId) {
                            const isFirstMsg = session.messages.length === 0;
                            const updated = {
                                ...session,
                                title: isFirstMsg
                                    ? (trimmed.length > 30 ? trimmed.slice(0, 30) + '...' : trimmed)
                                    : session.title,
                                subtitle: isFirstMsg ? 'Just now' : session.subtitle,
                                messages: [
                                    ...session.messages,
                                    { id: userMsgId, sender: 'USER', content: trimmed },
                                    { id: assistantMsgId, sender: 'ASSISTANT', content: '' }
                                ]
                            };
                            saveLocalSessionMeta(targetSessionId, updated);
                            return updated;
                        }
                        return session;
                    })
                );
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;

            await chatService.streamChat(targetSessionId, trimmed, {
                signal: controller.signal,
                onChunk: (token) => {
                    setSessions((prev) =>
                        prev.map((session) => {
                            if (session.id === targetSessionId) {
                                const updated = {
                                    ...session,
                                    messages: session.messages.map((msg) =>
                                        msg.id === assistantMsgId
                                            ? { ...msg, content: msg.content + token }
                                            : msg
                                    )
                                };
                                saveLocalSessionMeta(targetSessionId, updated);
                                return updated;
                            }
                            return session;
                        })
                    );
                },
                onDone: () => {
                    abortControllerRef.current = null;
                    setIsStreaming(false);
                },
                onError: (err) => {
                    abortControllerRef.current = null;
                    console.error('SSE Error:', err);
                    setIsStreaming(false);
                    toast.error('Kết nối AI bị gián đoạn. Hãy kiểm tra Ollama!');
                }
            });
        } catch (err) {
            abortControllerRef.current = null;
            console.error('Send message error:', err);
            setIsStreaming(false);
            toast.error('Không thể gửi tin nhắn!');
        }
    };

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
            {/* ================= HEADER ================= */}
            <div className="mb-6">
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-1.5">
                    AI Companion
                </h1>
                <p className="text-text-secondary text-base">
                    A calm, supportive space to talk things through.
                </p>
            </div>

            {/* ================= KHUNG CHÍNH 2 CỘT ================= */}
            <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
                {/* ---------- CỘT TRÁI: LỊCH SỬ CHAT ---------- */}
                <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-3">
                    <button
                        onClick={handleNewChat}
                        disabled={isStreaming}
                        className="w-full py-3 px-4 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium rounded-2xl flex items-center justify-center gap-2 shadow-soft transition-colors cursor-pointer"
                    >
                        <FiPlus className="w-5 h-5" />
                        <span>New chat</span>
                    </button>

                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                        {sessions.length === 0 ? (
                            <div className="h-40 rounded-2xl border border-dashed border-border/80 bg-surface/50 flex flex-col items-center justify-center p-4 text-center">
                                <FiMessageSquare className="w-5 h-5 text-text-muted/60 mb-1.5" />
                                <p className="text-xs text-text-muted">No conversations yet</p>
                            </div>
                        ) : (
                            sessions.map((session) => {
                                const isActive = session.id === activeSessionId;
                                return (
                                    <div
                                        key={session.id}
                                        onClick={() => handleSelectSession(session.id)}
                                        className={`group w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                            isActive
                                                ? 'bg-surface-secondary border-border-strong shadow-sm'
                                                : 'bg-surface border-border hover:bg-surface-hover'
                                        }`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-text-primary text-[15px] truncate">
                                                {session.title}
                                            </div>
                                            <div className="text-text-secondary text-xs mt-1 truncate">
                                                {session.subtitle}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteSession(e, session.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted hover:text-error rounded-lg transition-opacity"
                                            title="Delete session"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ---------- CỘT PHẢI: KHUNG HỘI THOẠI ---------- */}
                <div className="flex-1 bg-surface rounded-3xl border border-border shadow-soft flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
                        {!activeSession || activeSession.messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-text-muted max-w-md mx-auto">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                    <LuSparkles className="w-6 h-6 text-primary" />
                                </div>
                                <h2 className="font-heading text-xl font-semibold text-text-primary mb-2">
                                    How are you feeling today?
                                </h2>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    Share whatever is on your mind. Start typing below or click "New chat" to begin a conversation.
                                </p>
                            </div>
                        ) : (
                            activeSession.messages.map((msg) => {
                                const isUser = msg.sender === 'USER';
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {isUser ? (
                                            <div className="max-w-[75%] px-5 py-3 bg-primary text-white rounded-2xl rounded-br-sm text-[15px] leading-relaxed shadow-sm">
                                                {msg.content}
                                            </div>
                                        ) : (
                                            <div className="max-w-[80%] p-5 bg-surface-secondary text-text-primary rounded-2xl rounded-bl-sm">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-2">
                                                    <LuSparkles className="w-3.5 h-3.5 text-primary" />
                                                    <span>MindContext</span>
                                                </div>
                                                <p className="text-[15px] leading-relaxed whitespace-pre-line">
                                                    {msg.content || (
                                                        <span className="inline-flex gap-1 py-1">
                                                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                                                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.15s]" />
                                                            <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.3s]" />
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Thanh nhập tin nhắn */}
                    <div className="p-4 md:p-5 border-t border-border/60 bg-surface">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder={isStreaming ? 'MindContext is thinking... (Click stop to interrupt)' : 'Type your message...'}
                                className="flex-1 px-4 py-3 bg-background/60 border border-border rounded-2xl text-text-primary placeholder-text-muted text-[15px] outline-none focus:border-primary focus:bg-surface transition-colors"
                            />
                            {isStreaming ? (
                                <button
                                    type="button"
                                    onClick={handleStopStreaming}
                                    className="w-11 h-11 rounded-2xl bg-[#C87968] hover:bg-[#b56655] text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 shadow-sm"
                                    title="Stop generating"
                                >
                                    <FiSquare className="w-4 h-4 fill-current" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={!inputMessage.trim()}
                                    className="w-11 h-11 rounded-2xl bg-primary hover:bg-primary-dark disabled:bg-primary/40 text-white flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
                                    title="Send message"
                                >
                                    <FiSend className="w-4 h-4" />
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}