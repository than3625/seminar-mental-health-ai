package com.seminar.mentalhealth.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatSessionResponse {
    Long sessionId;
    LocalDateTime startedAt;
    LocalDateTime updatedAt;
    List<ChatMessageResponse> messages;
}
