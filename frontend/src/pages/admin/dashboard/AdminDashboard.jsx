import React, { useEffect, useState } from 'react';
import {
    FiUsers,
    FiActivity,
    FiBook,
    FiMessageCircle,
    FiHeart,
    FiMessageSquare
} from 'react-icons/fi';
import apiClient from '../../../services/api';

const MOOD_COLOR_MAP = {
    calm: 'var(--color-mood-calm)',
    happy: 'var(--color-mood-happy)',
    anxious: 'var(--color-mood-anxious)',
    sad: 'var(--color-mood-sad)',
    angry: 'var(--color-mood-angry)',
};

export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                // Bỏ dấu '/' ở đầu để tránh bị dính '//' với baseURL 'http://localhost:8080/api/'
                const res = await apiClient.get('admin/dashboard');

                // Vì api.js đã trả về response.data nên res chính là { success, result }
                const dashboardData = res?.result || res?.data?.result || res;
                setData(dashboardData);
            } catch (err) {
                console.error('Lỗi tải dữ liệu Admin Dashboard:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto py-12 text-center text-text-secondary">
                Loading admin overview...
            </div>
        );
    }

    if (!data || typeof data.totalUsers === 'undefined') {
        return (
            <div className="max-w-7xl mx-auto py-12 text-center text-danger">
                Không thể tải dữ liệu tổng quan hệ thống.
            </div>
        );
    }

    const kpiCards = [
        {
            label: 'Total Users',
            value: data.totalUsers ?? 0,
            icon: <FiUsers className="w-5 h-5 text-primary" />
        },
        {
            label: 'Active Users',
            value: data.activeUsers ?? 0,
            icon: <FiActivity className="w-5 h-5 text-primary" />
        },
        {
            label: 'Journal Entries',
            value: data.journalEntries ?? 0,
            icon: <FiBook className="w-5 h-5 text-primary" />
        },
        {
            label: 'AI Conversations',
            value: data.aiConversations ?? 0,
            icon: <FiMessageCircle className="w-5 h-5 text-primary" />
        },
        {
            label: 'Mood Records',
            value: data.moodRecords ?? 0,
            icon: <FiHeart className="w-5 h-5 text-primary" />
        },
        {
            label: 'AI Messages',
            value: data.aiMessages ?? 0,
            icon: <FiMessageSquare className="w-5 h-5 text-primary" />
        }
    ];

    // --- Tính toán tọa độ SVG cho User Growth (Line + Area Chart) ---
    const growthList = data.userGrowth || [];
    const maxGrowth = Math.max(...growthList.map((g) => g.count), 10);
    const chartW = 460;
    const chartH = 160;
    const padX = 28;
    const padTop = 28;
    const padBottom = 26;
    const plotW = chartW - padX * 2;
    const plotH = chartH - padTop - padBottom;

    const growthPoints = growthList.map((item, idx) => {
        const x = growthList.length > 1
            ? padX + (idx / (growthList.length - 1)) * plotW
            : chartW / 2;
        const y = padTop + plotH - (item.count / maxGrowth) * plotH;
        return { ...item, x, y };
    });

    const linePath = growthPoints
        .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ');
    const areaPath = growthPoints.length > 0
        ? `${linePath} L ${growthPoints[growthPoints.length - 1].x} ${padTop + plotH} L ${growthPoints[0].x} ${padTop + plotH} Z`
        : '';

    // --- Tính toán SVG Donut Chart cho Mood Distribution ---
    const moods = data.moodDistribution || [];
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercent = 0;

    // --- Tính toán Bar Chart cho Journal Activity ---
    const journalList = data.journalActivity || [];
    const maxJournal = Math.max(...journalList.map((j) => j.count), 5);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-8">
            {/* ================= HEADER ================= */}
            <div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-1.5">
                    Admin overview
                </h1>
                <p className="text-text-secondary text-base">
                    A snapshot of platform activity and wellbeing across MindContext.
                </p>
            </div>

            {/* ================= 6 THẺ KPI (3 CỘT x 2 HÀNG) ================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {kpiCards.map((card) => (
                    <div
                        key={card.label}
                        className="bg-surface rounded-card border border-border p-6 shadow-soft flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-surface-secondary flex items-center justify-center flex-shrink-0">
                            {card.icon}
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-text-primary leading-tight">
                                {card.value.toLocaleString()}
                            </div>
                            <div className="text-sm text-text-secondary mt-0.5">
                                {card.label}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ================= HÀNG BIỂU ĐỒ 1: USER GROWTH & MOOD DISTRIBUTION ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. User growth */}
                <div className="bg-surface rounded-card border border-border p-6 md:p-7 shadow-soft flex flex-col justify-between">
                    <div>
                        <h2 className="font-heading text-xl font-bold text-text-primary">
                            User growth
                        </h2>
                        <p className="text-sm text-text-secondary mt-0.5">
                            Total users over 6 months
                        </p>
                    </div>

                    <div className="mt-4 w-full">
                        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-48 overflow-visible">
                            <defs>
                                <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>

                            {areaPath && <path d={areaPath} fill="url(#userGrowthGrad)" />}
                            {linePath && (
                                <path
                                    d={linePath}
                                    fill="none"
                                    stroke="var(--color-primary)"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />
                            )}

                            {growthPoints.map((p) => (
                                <g key={p.month}>
                                    <text
                                        x={p.x}
                                        y={p.y - 10}
                                        textAnchor="middle"
                                        className="fill-text-secondary text-[10px] font-medium"
                                    >
                                        {p.count.toLocaleString()}
                                    </text>
                                    <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r="4"
                                        fill="var(--color-surface)"
                                        stroke="var(--color-primary)"
                                        strokeWidth="2.2"
                                    />
                                    <text
                                        x={p.x}
                                        y={chartH - 4}
                                        textAnchor="middle"
                                        className="fill-text-muted text-[11px]"
                                    >
                                        {p.month}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    </div>
                </div>

                {/* 2. Mood distribution */}
                <div className="bg-surface rounded-card border border-border p-6 md:p-7 shadow-soft flex flex-col justify-between">
                    <div>
                        <h2 className="font-heading text-xl font-bold text-text-primary">
                            Mood distribution
                        </h2>
                        <p className="text-sm text-text-secondary mt-0.5">
                            Across all logged moods
                        </p>
                    </div>

                    {moods.length === 0 ? (
                        <div className="h-44 flex items-center justify-center text-sm text-text-muted">
                            Chưa có dữ liệu cảm xúc
                        </div>
                    ) : (
                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-around gap-6">
                            {/* Donut SVG */}
                            <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
                                <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                                    {moods.map((m) => {
                                        const color = MOOD_COLOR_MAP[m.label?.toLowerCase()] || 'var(--color-primary)';
                                        const strokeDasharray = `${(m.percentage / 100) * circumference} ${circumference}`;
                                        const strokeDashoffset = -((cumulativePercent / 100) * circumference);
                                        cumulativePercent += m.percentage;

                                        return (
                                            <circle
                                                key={m.label}
                                                cx="80"
                                                cy="80"
                                                r={radius}
                                                fill="transparent"
                                                stroke={color}
                                                strokeWidth="22"
                                                strokeDasharray={strokeDasharray}
                                                strokeDashoffset={strokeDashoffset}
                                            />
                                        );
                                    })}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-bold text-text-primary leading-none">
                                        100
                                    </span>
                                    <span className="text-xs text-text-secondary mt-0.5">%</span>
                                </div>
                            </div>

                            {/* Legend bên phải */}
                            <div className="space-y-2.5 min-w-[140px]">
                                {moods.map((m) => {
                                    const color = MOOD_COLOR_MAP[m.label?.toLowerCase()] || 'var(--color-primary)';
                                    return (
                                        <div key={m.label} className="flex items-center gap-2.5 text-sm">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: color }}
                                            />
                                            <span className="text-text-primary font-medium capitalize">{m.label}</span>
                                            <span className="text-text-secondary ml-auto">{m.percentage}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ================= HÀNG BIỂU ĐỒ 2: JOURNAL ACTIVITY & RECENT ACTIVITY ================= */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 3. Journal activity */}
                <div className="bg-surface rounded-card border border-border p-6 md:p-7 shadow-soft flex flex-col justify-between">
                    <div>
                        <h2 className="font-heading text-xl font-bold text-text-primary">
                            Journal activity
                        </h2>
                        <p className="text-sm text-text-secondary mt-0.5">
                            Entries this week
                        </p>
                    </div>

                    <div className="mt-6 h-48 flex items-end justify-between gap-3 pt-6">
                        {journalList.map((item) => {
                            const heightPercent = Math.max((item.count / maxJournal) * 100, 6);
                            return (
                                <div key={item.day} className="flex-1 flex flex-col items-center h-full justify-end">
                                    <span className="text-xs font-medium text-text-secondary mb-1.5">
                                        {item.count}
                                    </span>
                                    <div
                                        className="w-full max-w-[44px] bg-accent rounded-t-xl transition-all duration-300"
                                        style={{ height: `${heightPercent}%` }}
                                    />
                                    <span className="text-xs text-text-muted mt-2.5">
                                        {item.day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 4. Recent activity */}
                <div className="bg-surface rounded-card border border-border p-6 md:p-7 shadow-soft">
                    <h2 className="font-heading text-xl font-bold text-text-primary mb-5">
                        Recent activity
                    </h2>

                    {(!data.recentActivities || data.recentActivities.length === 0) ? (
                        <div className="h-40 flex items-center justify-center text-sm text-text-muted">
                            Chưa có hoạt động nào gần đây
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.recentActivities.map((act, idx) => (
                                <div key={idx} className="flex items-start gap-3.5">
                                    <div className="w-9 h-9 rounded-full bg-surface-secondary text-text-secondary text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {act.initials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-text-primary leading-snug">
                                            <span className="font-semibold">{act.userName}</span>{' '}
                                            <span className="text-text-secondary">{act.action}</span>
                                        </p>
                                        <p className="text-xs text-text-muted mt-0.5">
                                            {act.timeAgo}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}