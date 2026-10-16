package com.seminar.mentalhealth.service;

import com.seminar.mentalhealth.entity.ChatMessage;
import com.seminar.mentalhealth.entity.ChatSession;
import com.seminar.mentalhealth.exception.AppException;
import com.seminar.mentalhealth.exception.ErrorCode;
import com.seminar.mentalhealth.repository.ChatMessageRepository;
import com.seminar.mentalhealth.repository.ChatSessionRepository;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatStreamService {

    ChatMessageRepository chatMessageRepository;
    ChatSessionRepository chatSessionRepository;
    StreamingChatModel streamingChatModel;

    public SseEmitter streamChatResponse(
            Long sessionId,
            String userPrompt
    ) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.CHAT_SESSION_NOT_FOUND));

        SseEmitter emitter = new SseEmitter(600_000L);

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

        long startTime = System.currentTimeMillis();
        AtomicBoolean isFirstToken = new AtomicBoolean(true);
        // 3. Tạo callback handler
        StreamingChatResponseHandler handler =
                new StreamingChatResponseHandler() {

                    @Override
                    public void onPartialResponse(
                            String partialResponse
                    ) {
                        try {
                            if (isFirstToken.compareAndSet(true, false)) {
                                long ttft = System.currentTimeMillis() - startTime;
                                log.info("Time to First Token (TTFT) cho session {}: {} ms", sessionId, ttft);
                            }
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

                        // --- ĐO TOKEN TỪ MODEL TRẢ VỀ ---
                        if (completeResponse.tokenUsage() != null) {
                            Integer inputTokens = completeResponse.tokenUsage().inputTokenCount();
                            Integer outputTokens = completeResponse.tokenUsage().outputTokenCount();
                            Integer totalTokens = completeResponse.tokenUsage().totalTokenCount();

                            log.info("\uD83D\uDCCA Token Usage cho session {} -> Input: {}, Output: {}, Total: {}",
                                    sessionId, inputTokens, outputTokens, totalTokens);

                            // (Tùy chọn) Nếu bà muốn gửi số token này về cho script Python để lưu Excel:
                             try {
                                 String tokenData = String.format("{\"input\": %d, \"output\": %d, \"total\": %d}",
                                                                 inputTokens, outputTokens, totalTokens);
                                 emitter.send(SseEmitter.event().name("usage").data(tokenData));
                             } catch (IOException e) {
                                 log.error("Không thể gửi token usage metadata", e);
                             }
                        }

                        // 5. Đóng SSE
                        emitter.complete();
                        log.info("Hoàn thành stream. Tổng độ trễ (Total Latency): {} ms",
                                System.currentTimeMillis() - startTime);
                    }

                    @Override
                    public void onError(Throwable error) {
                        emitter.completeWithError(error);
                    }
                };

//        String systemPrompt = "Bạn là một người bạn lắng nghe và hỗ trợ cảm xúc, tên là Mind Context. " +
//                "Quy tắc tuyệt đối: Bạn KHÔNG PHẢI là bác sĩ hay chuyên gia y tế. " +
//                "KHÔNG BAO GIỜ được phép chẩn đoán bệnh tâm lý, tâm thần hay kê đơn thuốc. " +
//                "Nếu người dùng có dấu hiệu tự hại, muốn tự tử hoặc cần can thiệp y tế, " +
//                "hãy khuyên họ tìm đến bác sĩ chuyên khoa hoặc gọi ngay đường dây nóng 111. " +
//                "Luôn trả lời bằng tiếng Việt, ngắn gọn, ấm áp và thể hiện sự đồng cảm sâu sắc.";

        String systemPrompt =
                "Bạn là một người bạn lắng nghe và hỗ trợ cảm xúc. "
                        + "Bạn không phải là bác sĩ hay chuyên gia y tế. "
                        + "Không được chẩn đoán bệnh tâm lý hoặc tâm thần và không được kê đơn thuốc. "

                        + "Hãy luôn bám sát nội dung người dùng vừa nói và không tự suy đoán "
                        + "cảm xúc, hoàn cảnh hoặc vấn đề của người dùng khi họ chưa đề cập. "

                        + "Nếu người dùng chia sẻ điều tích cực, hãy phản hồi phù hợp với điều tích cực đó. "
                        + "Nếu người dùng đang buồn, lo lắng hoặc gặp khó khăn, hãy lắng nghe, "
                        + "thể hiện sự đồng cảm và hỗ trợ phù hợp. "

                        + "Nếu người dùng chỉ muốn trò chuyện, hãy trò chuyện tự nhiên và không biến "
                        + "mọi cuộc trò chuyện thành tư vấn tâm lý. "

                        + "Nếu người dùng có dấu hiệu tự hại hoặc có ý định tự tử, hãy ưu tiên an toàn, "
                        + "khuyến khích họ tìm kiếm sự giúp đỡ từ người đáng tin cậy, chuyên gia y tế "
                        + "hoặc dịch vụ hỗ trợ khẩn cấp phù hợp. "

                        + "Luôn trả lời bằng tiếng Việt, ngắn gọn, tự nhiên và đồng cảm.";
        // 6. Chỉ gửi current input → LLM
        streamingChatModel.chat(
                //userPrompt,
                List.of(
                        SystemMessage.from(systemPrompt),
                        UserMessage.from(userPrompt)
                ),
                handler
        );

        // 7. Xử lý timeout
        emitter.onTimeout(emitter::complete);

        return emitter;
    }
}