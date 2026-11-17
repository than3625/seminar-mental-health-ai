package com.seminar.mentalhealth.controller;

import com.seminar.mentalhealth.dto.request.ChangePasswordRequest;
import com.seminar.mentalhealth.dto.request.UpdateUserProfileRequest;
import com.seminar.mentalhealth.dto.response.ApiResponse;
import com.seminar.mentalhealth.dto.response.UserResponse;
import com.seminar.mentalhealth.service.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {
    UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserProfile(@PathVariable Long userId) {
        UserResponse profile = userService.getUserProfile(userId);

        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .success(true)
                .result(profile)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @PathVariable Long userId,
            @RequestBody UpdateUserProfileRequest request
    ) {
        UserResponse updatedProfile = userService.updateProfile(userId, request);

        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .success(true)
                .message("Cập nhật thông tin cá nhân thành công!")
                .result(updatedProfile)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{userId}/password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @PathVariable Long userId,
            @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(userId, request);

        ApiResponse<String> response = ApiResponse.<String>builder()
                .success(true)
                .message("Đổi mật khẩu thành công!")
                .build();
        return ResponseEntity.ok(response);
    }
}
