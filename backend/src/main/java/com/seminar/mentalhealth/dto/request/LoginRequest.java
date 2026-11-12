package com.seminar.mentalhealth.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoginRequest {
    String username;
    String password;
    @Builder.Default
    Boolean rememberMe = false; // mặc định false nếu client không gửi
}
