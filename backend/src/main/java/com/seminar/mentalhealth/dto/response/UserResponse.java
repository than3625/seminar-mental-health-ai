package com.seminar.mentalhealth.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    Long userId;
    String username;
    String email;
    String fullName;
    String gender;
    LocalDate dateOfBirth;
    String role;
    Boolean active;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    String token;
    String refreshToken;
}
