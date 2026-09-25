package com.seminar.mentalhealth.controller;

import com.seminar.mentalhealth.dto.response.ApiResponse;
import com.seminar.mentalhealth.dto.response.ChatSessionResponse;
import com.seminar.mentalhealth.service.ChatSessionService;
import dev.langchain4j.service.V;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat-sessions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatSessionController {
    ChatSessionService chatSessionService;

    @PostMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<ChatSessionResponse>> createSession(
            @PathVariable Long userId,
            @RequestBody(required = false) String requestBody){
        ChatSessionResponse session = chatSessionService.createSession(userId);
        ApiResponse<ChatSessionResponse> response = ApiResponse.<ChatSessionResponse>builder()
                .success(true)
                .message("Tạo phiên trò chuyện thành công")
                .result(session)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);

    }
    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<List<ChatSessionResponse>>> getUserSessions(@PathVariable Long userId){
        List<ChatSessionResponse> sessions = chatSessionService.getUserSessions(userId);
        ApiResponse<List<ChatSessionResponse>> response = ApiResponse.<List<ChatSessionResponse>>builder()
                .success(true)
                .result(sessions)
                .build();
        return ResponseEntity.ok(response);
    }
    @GetMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<ChatSessionResponse>> getSessionById(
            @PathVariable Long sessionId,
            java.security.Principal principal){
        ChatSessionResponse session = chatSessionService.getSessionById(sessionId, principal.getName());
        ApiResponse<ChatSessionResponse> response = ApiResponse.<ChatSessionResponse>builder()
                .success(true)
                .result(session)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(@PathVariable Long sessionId){
        chatSessionService.deleteSession(sessionId);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Đã xóa phiên trò chuyện")
                .build();
        return ResponseEntity.ok(response);
    }

}
