package com.seminar.mentalhealth.service;

import com.seminar.mentalhealth.entity.ChatMessage;
import com.seminar.mentalhealth.entity.ChatSession;
import com.seminar.mentalhealth.repository.ChatMessageRepository;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatStreamService {

    ChatMessageRepository chatMessageRepository;

    StreamingChatModel streamingChatModel;

    public SseEmitter streamChatResponse(
            ChatSession session,
            String userPrompt
    ) {

        SseEmitter emitter = new SseEmitter(180_000L);

        // 1. Lưu message của USER
        ChatMessage userMessage = ChatMessage.builder()
                .session(session)
                .sender("USER")
                .content(userPrompt)
                .createdAt(LocalDateTime.now())
                .build();

        chatMessageRepository.save(userMessage);

        // 2. Gom toàn bộ response của AI
        StringBuilder fullResponse = new StringBuilder();

        // 3. Tạo callback handler
        StreamingChatResponseHandler handler =
                new StreamingChatResponseHandler() {

                    @Override
                    public void onPartialResponse(
                            String partialResponse
                    ) {
                        try {
                            // Gom chunk để cuối cùng lưu DB
                            fullResponse.append(partialResponse);

                            // Stream chunk về frontend
                            emitter.send(
                                    SseEmitter.event()
                                            .name("message")
                                            .data(partialResponse)
                            );

                        } catch (IOException e) {
                            emitter.completeWithError(e);
                        }
                    }

                    @Override
                    public void onCompleteResponse(
                            ChatResponse completeResponse
                    ) {

                        // 4. Lưu toàn bộ response của AI
                        ChatMessage assistantMessage =
                                ChatMessage.builder()
                                        .session(session)
                                        .sender("ASSISTANT")
                                        .content(fullResponse.toString())
                                        .createdAt(LocalDateTime.now())
                                        .build();

                        chatMessageRepository.save(assistantMessage);

                        // 5. Đóng SSE
                        emitter.complete();
                    }

                    @Override
                    public void onError(Throwable error) {
                        emitter.completeWithError(error);
                    }
                };

        // 6. Chỉ gửi current input → LLM
        streamingChatModel.chat(
                userPrompt,
                handler
        );

        // 7. Xử lý timeout
        emitter.onTimeout(emitter::complete);

        return emitter;
    }
}