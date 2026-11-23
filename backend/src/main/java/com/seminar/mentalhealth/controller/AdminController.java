package com.seminar.mentalhealth.controller;

import com.seminar.mentalhealth.dto.request.UpdateUserStatusRequest;
import com.seminar.mentalhealth.dto.response.ApiResponse;
import com.seminar.mentalhealth.dto.response.UserResponse;
import com.seminar.mentalhealth.service.AdminService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminController {
    AdminService adminService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers(){
        List<UserResponse> users = adminService.getAllUsers();

        ApiResponse<List<UserResponse>> response = ApiResponse.<List<UserResponse>>builder()
                .success(true)
                .result(users)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long userId){
        UserResponse user = adminService.getUserById(userId);

        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .success(true)
                .result(user)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{userId}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(@PathVariable Long userId, @RequestBody(required = false)UpdateUserStatusRequest request){
        Boolean active = (request != null) ? request.getActive() : null;
        UserResponse updateUser = adminService.updateUserStatus(userId, active);

        String statusMessage = Boolean.TRUE.equals(updateUser.getActive())
                ? "Mở khóa tài khoản thành công"
                : "Khóa tài khoản thành công";

        ApiResponse<UserResponse> response = ApiResponse.<UserResponse>builder()
                .success(true)
                .message(statusMessage)
                .result(updateUser)
                .build();
        return ResponseEntity.ok(response);

    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable Long userId){
        adminService.deleteUser(userId);

        ApiResponse<String> response = ApiResponse.<String>builder()
                .success(true)
                .message("Xóa tài khoản người dùng thành công")
                .build();
        return ResponseEntity.ok(response);
    }
}
