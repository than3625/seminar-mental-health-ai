package com.seminar.mentalhealth.dto.response;

import java.time.LocalDateTime;

public record UserContextDto(
        LocalDateTime recordedAt,
        String moodLabel,
        Integer score,
        String journalTitle,
        String journalContent
) {
}
