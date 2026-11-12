package com.seminar.mentalhealth.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthResponse {
    String token;          // Access Token (dùng gọi API thông thường)
    String refreshToken;   // Refresh Token (dùng xin cấp lại Access Token khi hết hạn)
    Long userId;
    String username;
    String fullName;
    String role;
}
