package com.seminar.mentalhealth.controller;


import com.seminar.mentalhealth.dto.request.LoginRequest;
import com.seminar.mentalhealth.dto.request.RegisterRequest;
import com.seminar.mentalhealth.dto.response.ApiResponse;
import com.seminar.mentalhealth.dto.response.AuthResponse;
import com.seminar.mentalhealth.entity.User;
import com.seminar.mentalhealth.service.AuthService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthController {
    AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> register(@RequestBody RegisterRequest request){
        User newUser = authService.register(request);

        ApiResponse<User> response = ApiResponse.<User>builder()
                .success(true)
                .message("Đăng ký tài khoản thành công!")
                .result(newUser)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest request){
        AuthResponse authResponse = authService.login(request);

        ApiResponse<AuthResponse> response = ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Đăng nhập thành công")
                .result(authResponse)
                .build();
        return ResponseEntity.ok(response);

    }

}
