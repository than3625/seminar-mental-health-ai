package com.seminar.mentalhealth.dto.request;

import com.seminar.mentalhealth.entity.User;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MoodRecordCreateRequest {
    Long userId;
    String moodLabel;
    Integer score;
}
