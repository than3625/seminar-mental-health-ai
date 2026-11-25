package com.seminar.mentalhealth.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminDashboardResponse {
    long totalUsers;
    long activeUsers;
    long journalEntries;
    long aiConversations;
    long moodRecords;
    long aiMessages;

    List<MonthlyGrowthDto> userGrowth;
    List<MoodDistributionDto> moodDistribution;
    List<DailyActivityDto> journalActivity;
    List<RecentActivityDto> recentActivities;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyGrowthDto {
        String month;
        long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MoodDistributionDto {
        String label;
        long count;
        int percentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyActivityDto {
        String day;
        long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivityDto {
        String initials;
        String userName;
        String action;
        String timeAgo;
    }
}
