package com.seminar.mentalhealth.service;

import com.seminar.mentalhealth.dto.response.ChatSessionResponse;
import com.seminar.mentalhealth.entity.ChatSession;
import com.seminar.mentalhealth.entity.User;
import com.seminar.mentalhealth.exception.AppException;
import com.seminar.mentalhealth.exception.ErrorCode;
import com.seminar.mentalhealth.repository.ChatSessionRepository;
import com.seminar.mentalhealth.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatSessionService {
    ChatSessionRepository chatSessionRepository;
    UserRepository userRepository;

    public ChatSessionResponse createSession(Long userId){
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        ChatSession newSession = ChatSession.builder()
                .user(user)
                .build();

        ChatSession savedSession = chatSessionRepository.save(newSession);

        return mapToResponse(savedSession);

    }
    public List<ChatSessionResponse> getUserSessions(Long userId){
        List<ChatSession> sessions = chatSessionRepository.findByUser_UserIdAndIsDeletedFalseOrderByUpdatedAtDesc(userId);
        return sessions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    public ChatSessionResponse getSessionById(Long sessionId, String currentUsername){
        ChatSession session = chatSessionRepository.findById(sessionId).orElseThrow(() -> new AppException(ErrorCode.CHAT_SESSION_NOT_FOUND));
        if (session.isDeleted()){
            throw new AppException(ErrorCode.CHAT_SESSION_NOT_FOUND);
        }
        if (!session.getUser().getUsername().equals(currentUsername)){
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return mapToResponse(session);
    }
    public void deleteSession(Long sessionId){
            ChatSession session = chatSessionRepository.findById(sessionId).orElseThrow(() -> new AppException(ErrorCode.CHAT_SESSION_NOT_FOUND));
            session.setDeleted(true);
        chatSessionRepository.save(session);
    }
    private ChatSessionResponse mapToResponse(ChatSession session){
        return ChatSessionResponse.builder()
                .sessionId(session.getSessionId())
                .startedAt(session.getStartedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }
}
