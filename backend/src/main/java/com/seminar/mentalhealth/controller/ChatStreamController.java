package com.seminar.mentalhealth.controller;

import com.seminar.mentalhealth.dto.request.ChatStreamRequest;
import com.seminar.mentalhealth.entity.ChatSession;
import com.seminar.mentalhealth.service.ChatStreamService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatStreamController {
    ChatStreamService chatStreamService;

    @PostMapping("/sessions/{sessionId}/stream")
    public SseEmitter streamChat(@PathVariable Long sessionId, @Valid @RequestBody ChatStreamRequest request){
        return chatStreamService.streamChatResponse(sessionId, request.getMessage());
    }
}
