package com.seminar.mentalhealth.service;

import com.seminar.mentalhealth.dto.request.ChangePasswordRequest;
import com.seminar.mentalhealth.dto.request.UpdateUserProfileRequest;
import com.seminar.mentalhealth.dto.response.UserResponse;
import com.seminar.mentalhealth.entity.User;
import com.seminar.mentalhealth.exception.AppException;
import com.seminar.mentalhealth.exception.ErrorCode;
import com.seminar.mentalhealth.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;

    // 1. Lấy thông tin chi tiết User
    public UserResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return mapToUserResponse(user);
    }

    // 2. Cập nhật thông tin hồ sơ
    public UserResponse updateProfile(Long userId, UpdateUserProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Kiểm tra email nếu người dùng có thay đổi sang email khác
        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new AppException(ErrorCode.EMAIL_EXISTED);
            }
            user.setEmail(request.getEmail().trim());
        }

        // Kiểm tra ngày sinh không được ở tương lai
        if (request.getDateOfBirth() != null) {
            if (request.getDateOfBirth().isAfter(LocalDate.now())) {
                throw new AppException(ErrorCode.DATE_OF_BIRTH_IN_FUTURE);
            }
            user.setDateOfBirth(request.getDateOfBirth());
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }

        User updatedUser = userRepository.save(user);
        return mapToUserResponse(updatedUser);
    }

    // 3. Đổi mật khẩu
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Kiểm tra mật khẩu hiện tại có khớp với mật khẩu đã mã hóa trong DB không
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }

        // Mã hóa mật khẩu mới và lưu lại
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // Hàm helper chuyển đổi Entity sang DTO Response
    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .gender(user.getGender())
                .dateOfBirth(user.getDateOfBirth())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}