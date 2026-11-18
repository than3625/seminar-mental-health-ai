package com.seminar.mentalhealth.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateUserProfileRequest {
    String username;
    String fullName;
    String email;
    LocalDate dateOfBirth;
    String gender;
}
