package com.seminar.mentalhealth.service;

import com.seminar.mentalhealth.config.JwtService;
import com.seminar.mentalhealth.dto.request.LoginRequest;
import com.seminar.mentalhealth.dto.request.RegisterRequest;
import com.seminar.mentalhealth.dto.response.AuthResponse;
import com.seminar.mentalhealth.exception.AppException;
import com.seminar.mentalhealth.exception.ErrorCode;
import com.seminar.mentalhealth.entity.User;
import com.seminar.mentalhealth.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthService {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    JwtService jwtService;
    AuthenticationManager authenticationManager;
    UserDetailsService userDetailsService;

    public User register(RegisterRequest request){
        if (userRepository.existsByUsername(request.getUsername())){
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        if (userRepository.existsByEmail(request.getEmail())){
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        if (request.getDateOfBirth().isAfter(LocalDate.now())){
            throw new AppException(ErrorCode.DATE_OF_BIRTH_IN_FUTURE);
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullName())
                .gender(request.getGender())
                .role(User.Role.ROLE_USER)
                .dateOfBirth(request.getDateOfBirth())
                .build();
        return userRepository.save(user);
    }

    public AuthResponse login(LoginRequest request){
        String loginIdentifier = request.getUsername().trim();

        // 1. Tìm User trong Database trước (hỗ trợ cả username hoặc email)
        User user = userRepository.findByUsernameOrEmail(loginIdentifier, loginIdentifier)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // 2. Xác thực bằng username chuẩn lưu trong Database
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            user.getUsername(),
                            request.getPassword()
                    )
            );
        } catch (Exception e){
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // 3. Load UserDetails theo đúng username chuẩn
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());

        // 4. Sinh Access Token (ngắn hạn)
        String jwtToken = jwtService.generateToken(userDetails);

        // 5. Tính thời gian hết hạn của Refresh Token dựa theo Remember Me
        boolean isRemember = Boolean.TRUE.equals(request.getRememberMe()); // Đảm bảo không bị NullPointerException nếu rememberMe gửi lên là null
        long refreshExpiration = isRemember
                ? 1000L * 60 * 60 * 24 * 30L // 30 ngày
                : 1000L * 60 * 60 * 24 * 1L;  // 1 ngày

        String refreshToken = jwtService.generateRefreshToken(userDetails, refreshExpiration);

        // 6. Trả về đầy đủ cả cặp Token và thông tin User
        return AuthResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse refreshToken(String refreshToken) {
        // 1. Kiểm tra refresh token có hợp lệ không
        String username = jwtService.extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        // 2. Sinh ra Access Token MỚI TINH
        String newAccessToken = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(newAccessToken)
                .refreshToken(refreshToken) // Trả kèm refresh token hiện tại để duy trì phiên
                .username(username)
                .build();
    }
}