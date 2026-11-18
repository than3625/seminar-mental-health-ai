package com.seminar.mentalhealth.service;

import com.seminar.mentalhealth.config.JwtService;
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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    JwtService jwtService;
    UserDetailsService userDetailsService;

    // 1. Lấy thông tin chi tiết User
    public UserResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return mapToUserResponse(user, null, null);
    }

    // 2. Cập nhật thông tin hồ sơ
    public UserResponse updateProfile(Long userId, UpdateUserProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        String oldUsername = user.getUsername();
        // Kiểm tra email nếu người dùng có thay đổi sang email khác
        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new AppException(ErrorCode.EMAIL_EXISTED);
            }
            user.setEmail(request.getEmail().trim());
        }
        // Kiểm tra username nếu để trống thì gán email làm username
        String updateUsername = (request.getUsername() == null || request.getUsername().isBlank())
                ? user.getEmail()
                : request.getUsername().trim();

        boolean isUsernameChanged = !updateUsername.equals(oldUsername);

        if (isUsernameChanged) {
            if (!updateUsername.equalsIgnoreCase(oldUsername) && userRepository.existsByUsername(updateUsername)) {
                throw new AppException(ErrorCode.USER_EXISTED);
            }
            user.setUsername(updateUsername);
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

        String newAccessToken = null;
        String newRefreshToken = null;
        if (isUsernameChanged) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(updatedUser.getUsername());
            newAccessToken = jwtService.generateToken(userDetails);
            // Cấp lại refresh token mặc định 30 ngày
            long refreshExpiration = 1000L * 60 * 60 * 24 * 30L;
            newRefreshToken = jwtService.generateRefreshToken(userDetails, refreshExpiration);
        }
        return mapToUserResponse(updatedUser, newAccessToken, newRefreshToken);
    }

    // 3. Đổi mật khẩu
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // Kiểm tra mật khẩu hiện tại có khớp với mật khẩu đã mã hóa trong DB không
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }
        if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 6) {
            throw new AppException(ErrorCode.PASSWORD_TOO_SHORT);
        }

        // Mã hóa mật khẩu mới và lưu lại
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // Hàm helper chuyển đổi Entity sang DTO Response
    private UserResponse mapToUserResponse(User user, String token, String refreshToken) {
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
                .token(token)
                .refreshToken(refreshToken)
                .build();
    }
}