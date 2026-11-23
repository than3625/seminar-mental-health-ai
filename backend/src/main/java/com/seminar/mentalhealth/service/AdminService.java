package com.seminar.mentalhealth.service;

import com.seminar.mentalhealth.dto.response.UserResponse;
import com.seminar.mentalhealth.entity.User;
import com.seminar.mentalhealth.exception.AppException;
import com.seminar.mentalhealth.exception.ErrorCode;
import com.seminar.mentalhealth.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminService {
    UserRepository userRepository;

    public List<UserResponse> getAllUsers(){
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .toList();
    }

    public UserResponse getUserById(Long userId){
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse updateUserStatus(Long userId, Boolean active){
        User targetUser = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        preventSelfAction(targetUser);
        boolean newStatus = (active != null) ? active : !Boolean.TRUE.equals(targetUser.getActive());
        targetUser.setActive(newStatus);

        return mapToUserResponse(userRepository.save(targetUser));
    }

    @Transactional
    public void deleteUser(Long userId){
        User targetUser = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        preventSelfAction(targetUser);

        userRepository.delete(targetUser);
    }

    private void preventSelfAction(User targetUser){
        String currentAdminUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        if (targetUser.getUsername().equalsIgnoreCase(currentAdminUsername)){
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

    }
    private UserResponse mapToUserResponse(User user){
        return UserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .gender(user.getGender())
                .dateOfBirth(user.getDateOfBirth())
                .role(user.getRole().name())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

}
