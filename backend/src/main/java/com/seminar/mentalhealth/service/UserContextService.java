package com.seminar.mentalhealth.service;

import com.seminar.mentalhealth.dto.response.UserContextDto;
import com.seminar.mentalhealth.repository.MoodRecordRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserContextService {
    MoodRecordRepository moodRecordRepository;

    static final int MAX_RECORDS = 5;
    static final int RECENT_JOURNAL_MAX_CHARS = 750; // ~220-250 tokens cho bài mới nhất
    static final int OLDER_JOURNAL_MAX_CHARS = 550;  // ~170-200 tokens cho các bài cũ hơn
    static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public String buildRecentUserContext(Long userId) {
        List<UserContextDto> records = moodRecordRepository.findRecentMoodWithJournal(
                userId,
                PageRequest.of(0, MAX_RECORDS)
        );

        if (records.isEmpty()) {
            return "Người dùng chưa có dữ liệu ghi nhận tâm trạng và nhật ký trước đó.";
        }

        StringBuilder context = new StringBuilder();
        context.append(String.format("Lịch sử tâm trạng & nhật ký %d lần gần nhất của người dùng (thang điểm 1-10):\n", records.size()));

        double totalScore = 0;

        for (int i = 0; i < records.size(); i++) {
            UserContextDto item = records.get(i);
            totalScore += item.score();

            String dateStr = item.recordedAt() != null ? item.recordedAt().format(DATE_FORMATTER) : "Không rõ ngày";
            boolean isMostRecent = (i == 0);
            int charLimit = isMostRecent ? RECENT_JOURNAL_MAX_CHARS : OLDER_JOURNAL_MAX_CHARS;

            context.append(String.format("%d. [%s] Tâm trạng: %s (%d/10)",
                    i + 1, dateStr, item.moodLabel(), item.score()));

            // Kiểm tra mood record này có kèm nhật ký hay không
            boolean hasTitle = item.journalTitle() != null && !item.journalTitle().isBlank();
            boolean hasContent = item.journalContent() != null && !item.journalContent().isBlank();

            if (hasTitle || hasContent) {
                String titleStr = hasTitle ? item.journalTitle().trim() : "Không tiêu đề";
                String formattedContent = truncateHeadAndTail(item.journalContent(), charLimit);
                context.append(String.format(" | Nhật ký - \"%s\": %s\n", titleStr, formattedContent));
            } else {
                context.append(" | (Không ghi nhật ký)\n");
            }
        }

        Map<String, List<UserContextDto>> groupedByMood = records.stream()
                .collect(Collectors.groupingBy(
                        item -> (item.moodLabel() != null && !item.moodLabel().isBlank())
                                ? item.moodLabel().trim()
                                : "Khác",
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        String moodSummary = groupedByMood.entrySet().stream()
                .sorted((e1, e2) -> Integer.compare(e2.getValue().size(), e1.getValue().size()))
                .map(entry -> {
                    String label = entry.getKey();
                    List<UserContextDto> group = entry.getValue();
                    double avg = group.stream()
                            .map(UserContextDto::score)
                            .filter(Objects::nonNull)
                            .mapToInt(Integer::intValue)
                            .average()
                            .orElse(0.0);
                    return String.format("%s (%d lần, TB: %.1f/10)", label, group.size(), avg);
                })
                .collect(Collectors.joining(" | "));

        context.append(String.format("=> Thống kê theo từng trạng thái (%d lần gần nhất): %s.", records.size(), moodSummary));

        return context.toString();
    }

    private String truncateHeadAndTail(String content, int maxChars) {
        if (content == null || content.isBlank()) {
            return "(Trống)";
        }

        // Gom nhiều khoảng trắng/xuống dòng thành 1 dấu cách để tiết kiệm token
        String cleaned = content.trim().replaceAll("\\s+", " ");

        if (cleaned.length() <= maxChars) {
            return cleaned;
        }

        int headLength = (int) (maxChars * 0.4);
        int tailLength = maxChars - headLength;

        String head = cleaned.substring(0, headLength).trim();
        String tail = cleaned.substring(cleaned.length() - tailLength).trim();

        return head + " [...] " + tail;
    }
}
