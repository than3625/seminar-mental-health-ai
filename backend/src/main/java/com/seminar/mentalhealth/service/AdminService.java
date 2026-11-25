package com.seminar.mentalhealth.service;

import com.seminar.mentalhealth.dto.response.AdminDashboardResponse;
import com.seminar.mentalhealth.dto.response.UserResponse;
import com.seminar.mentalhealth.entity.ChatSession;
import com.seminar.mentalhealth.entity.Journal;
import com.seminar.mentalhealth.entity.MoodRecord;
import com.seminar.mentalhealth.entity.User;
import com.seminar.mentalhealth.exception.AppException;
import com.seminar.mentalhealth.exception.ErrorCode;
import com.seminar.mentalhealth.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminService {
    UserRepository userRepository;
    JournalRepository journalRepository;
    MoodRecordRepository moodRecordRepository;
    ChatSessionRepository chatSessionRepository;
    ChatMessageRepository chatMessageRepository;

    public List<UserResponse> getAllUsers(){
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .toList();
    }

    public UserResponse getUserById(Long userId){
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse updateUserStatus(Long userId, Boolean active){
        User targetUser = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        preventSelfAction(targetUser);
        boolean newStatus = (active != null) ? active : !Boolean.TRUE.equals(targetUser.getActive());
        targetUser.setActive(newStatus);

        return mapToUserResponse(userRepository.save(targetUser));
    }

    @Transactional
    public void deleteUser(Long userId){
        User targetUser = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        preventSelfAction(targetUser);

        userRepository.delete(targetUser);
    }

    private void preventSelfAction(User targetUser){
        String currentAdminUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        if (targetUser.getUsername().equalsIgnoreCase(currentAdminUsername)){
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

    }
    private UserResponse mapToUserResponse(User user){
        return UserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .gender(user.getGender())
                .dateOfBirth(user.getDateOfBirth())
                .role(user.getRole().name())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public AdminDashboardResponse getDashboardOverview() {
        // Chỉ lấy danh sách tài khoản có role là ROLE_USER (bỏ qua ROLE_ADMIN)
        List<User> normalUsers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.ROLE_USER)
                .toList();
        List<Journal> allJournals = journalRepository.findAll();
        List<MoodRecord> allMoods = moodRecordRepository.findAll();
        List<ChatSession> allSessions = chatSessionRepository.findAll();
        long totalMessages = chatMessageRepository.count();

        long totalUsers = normalUsers.size();
        long activeUsers = normalUsers.stream()
                .filter(u -> Boolean.TRUE.equals(u.getActive()))
                .count();

        // 1. User Growth (6 tháng gần nhất — cũng dùng normalUsers để không dính tài khoản Admin)
        LocalDate now = LocalDate.now();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM", Locale.ENGLISH);
        List<AdminDashboardResponse.MonthlyGrowthDto> userGrowth = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.from(now.minusMonths(i));
            LocalDateTime endOfMonth = ym.atEndOfMonth().atTime(23, 59, 59);
            long cumulativeCount = normalUsers.stream()
                    .filter(u -> u.getCreatedAt() != null && !u.getCreatedAt().isAfter(endOfMonth))
                    .count();
            userGrowth.add(AdminDashboardResponse.MonthlyGrowthDto.builder()
                    .month(ym.format(monthFmt))
                    .count(cumulativeCount)
                    .build());
        }

        // 2. Mood Distribution (Phân bố tỷ lệ % cảm xúc)
        Map<String, Long> moodCounts = allMoods.stream()
                .collect(Collectors.groupingBy(
                        m -> (m.getMoodLabel() != null && !m.getMoodLabel().isBlank()) ? m.getMoodLabel().trim() : "Khác",
                        Collectors.counting()
                ));
        long totalMoodCount = allMoods.size();
        List<AdminDashboardResponse.MoodDistributionDto> moodDistribution = moodCounts.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(entry -> {
                    int pct = totalMoodCount > 0 ? (int) Math.round((entry.getValue() * 100.0) / totalMoodCount) : 0;
                    return AdminDashboardResponse.MoodDistributionDto.builder()
                            .label(entry.getKey())
                            .count(entry.getValue())
                            .percentage(pct)
                            .build();
                })
                .toList();

        // 3. Journal Activity (7 ngày gần nhất: Mon -> Sun)
        DateTimeFormatter dayFmt = DateTimeFormatter.ofPattern("EEE", Locale.ENGLISH);
        List<AdminDashboardResponse.DailyActivityDto> journalActivity = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate targetDate = now.minusDays(i);
            long count = allJournals.stream()
                    .filter(j -> j.getCreatedAt() != null && j.getCreatedAt().toLocalDate().equals(targetDate))
                    .count();
            journalActivity.add(AdminDashboardResponse.DailyActivityDto.builder()
                    .day(targetDate.format(dayFmt))
                    .count(count)
                    .build());
        }

        // 4. Recent Activity (Gộp 5 hoạt động mới nhất từ Journal, Mood, Chat)
        record RawEvent(LocalDateTime time, String name, String action) {}
        List<RawEvent> rawEvents = new ArrayList<>();

        allJournals.forEach(j -> {
            if (j.getCreatedAt() != null && j.getMoodRecord() != null && j.getMoodRecord().getUser() != null) {
                rawEvents.add(new RawEvent(j.getCreatedAt(), getDisplayName(j.getMoodRecord().getUser()), "created a new journal entry"));
            }
        });
        allMoods.forEach(m -> {
            if (m.getRecordedAt() != null && m.getUser() != null) {
                rawEvents.add(new RawEvent(m.getRecordedAt(), getDisplayName(m.getUser()), "logged a mood record"));
            }
        });
        allSessions.forEach(s -> {
            if (s.getStartedAt() != null && s.getUser() != null) {
                rawEvents.add(new RawEvent(s.getStartedAt(), getDisplayName(s.getUser()), "started an AI conversation"));
            }
        });

        List<AdminDashboardResponse.RecentActivityDto> recentActivities = rawEvents.stream()
                .sorted((a, b) -> b.time().compareTo(a.time()))
                .limit(5)
                .map(ev -> AdminDashboardResponse.RecentActivityDto.builder()
                        .initials(extractInitials(ev.name()))
                        .userName(ev.name())
                        .action(ev.action())
                        .timeAgo(formatTimeAgo(ev.time()))
                        .build())
                .toList();

        return AdminDashboardResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .journalEntries(allJournals.size())
                .aiConversations(allSessions.size())
                .moodRecords(totalMoodCount)
                .aiMessages(totalMessages)
                .userGrowth(userGrowth)
                .moodDistribution(moodDistribution)
                .journalActivity(journalActivity)
                .recentActivities(recentActivities)
                .build();
    }

    private String getDisplayName(User user) {
        return (user.getFullName() != null && !user.getFullName().isBlank()) ? user.getFullName() : user.getUsername();
    }

    private String extractInitials(String name) {
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 0) return "U";
        if (parts.length == 1) return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        return ("" + parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    private String formatTimeAgo(LocalDateTime time) {
        long minutes = java.time.Duration.between(time, LocalDateTime.now()).toMinutes();
        if (minutes < 1) return "Just now";
        if (minutes < 60) return minutes + " minutes ago";
        long hours = minutes / 60;
        if (hours < 24) return hours + (hours == 1 ? " hour ago" : " hours ago");
        long days = hours / 24;
        return days + (days == 1 ? " day ago" : " days ago");
    }
}
