package com.seminar.mentalhealth.service;

import com.seminar.mentalhealth.entity.ChatMessage;
import com.seminar.mentalhealth.entity.ChatSession;
import com.seminar.mentalhealth.exception.AppException;
import com.seminar.mentalhealth.exception.ErrorCode;
import com.seminar.mentalhealth.repository.ChatMessageRepository;
import com.seminar.mentalhealth.repository.ChatSessionRepository;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.input.Prompt;
import dev.langchain4j.model.input.PromptTemplate;
import dev.langchain4j.store.embedding.EmbeddingMatch;
import dev.langchain4j.store.embedding.EmbeddingSearchRequest;
import dev.langchain4j.store.embedding.EmbeddingStore;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;

import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;

import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatStreamService {

    ChatMessageRepository chatMessageRepository;
    ChatSessionRepository chatSessionRepository;
    StreamingChatModel streamingChatModel;

    EmbeddingModel embeddingModel;
    EmbeddingStore<TextSegment> embeddingStore;

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

        long startTime = System.currentTimeMillis();

        // Tìm tài liệu
        log.info("Nhúng câu hỏi và tiìm kiếm tài liệu");
        // Lấy câu hỏi của user chuyển thành vector
        Embedding queryEmbedding = embeddingModel.embed(userPrompt).content();

        // Truy vấn tối đa 3 đoạn text giống nhất
        EmbeddingSearchRequest searchRequest = EmbeddingSearchRequest.builder()
                .queryEmbedding(queryEmbedding)
                .maxResults(3)
                .build();

        List<EmbeddingMatch<TextSegment>> matches = embeddingStore.search(searchRequest).matches();

//        String retrievedContext = matches.stream()
//                .map(match -> match.embedded().text())
//                .collect(Collectors.joining("\n\n---\n\n"));
//        log.info("Tìm thấy {} đoạn tài liệu liên quan", matches.size());

        StringBuilder contextBuilder = new StringBuilder();
        for (int i = 0; i < matches.size(); i++) {
            var match = matches.get(i);
            var metadata = match.embedded().metadata();

            String title = metadata.getString("title") != null ? metadata.getString("title") : "Tài liệu chuyên môn";
            String publisher = metadata.getString("publisher") != null ? metadata.getString("publisher") : "Nguồn uy tín";
            String url = metadata.getString("url") != null ? metadata.getString("url") : "";
            contextBuilder.append(String.format("[Tài liệu %d]\n", i + 1));
            contextBuilder.append(String.format("- Tiêu đề: %s\n", title));
            contextBuilder.append(String.format("- Tác giả/Tổ chức: %s\n", publisher));
            contextBuilder.append(String.format("- URL: %s\n", url));
            contextBuilder.append(String.format("- Nội dung: %s\n\n", match.embedded().text()));

            String text = match.embedded().text();
            String previewText = text.length() > 150 ? text.substring(0, 150) + "..." : text;
            log.info("--- TÀI LIỆU {} (Độ khớp: {}) ---", i + 1, match.score());
            log.info("Nguồn file: {}", metadata.getString("file_name"));
            log.info("Chủ đề: {}", metadata.getString("topic"));
            log.info("Trích đoạn: {}", previewText.replace("\n", " "));
        }
        String retrievedContext = contextBuilder.toString();

        String templateString =
                "Dựa vào các tài liệu chuyên môn sau đây:\n" +
                "{{context}}\n\n" +
                "Câu hỏi/Chia sẻ của người dùng: {{question}}\n\n" +
                "HƯỚNG DẪN TRẢ LỜI:\n" +
                "1. Hãy đóng vai một người bạn đồng cảm, đưa ra lời khuyên nhẹ nhàng, ấm áp dựa trên kiến thức từ tài liệu.\n" +
                "2. KHÔNG chèn tên file hay tên tài liệu trực tiếp vào trong thân bài viết.\n" +
                "3. Ở CUỐI CÙNG của câu trả lời, nếu có sử dụng kiến thức từ tài liệu trên, hãy tự động thêm một phần nhỏ liệt kê nguồn ngắn gọn theo định dạng sau:\n" +
                "   ---\n" +
                "   *Gợi ý dựa trên tài liệu tham khảo:* [Tên bài viết/Tiêu đề] - [Tác giả/Tổ chức]\n";
        PromptTemplate promptTemplate = PromptTemplate.from(templateString);
        Map<String, Object> variables = new HashMap<>();
        variables.put("context", retrievedContext.isEmpty() ? "Không tìm thấy tài liệu cụ thể" : retrievedContext);
        variables.put("question", userPrompt);

        Prompt augmentedPrompt = promptTemplate.apply(variables);
        String finalPromptToSend = augmentedPrompt.text();

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

        // Gom toàn bộ response của AI
        StringBuilder fullResponse = new StringBuilder();
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

        streamingChatModel.chat(
                List.of(
                        SystemMessage.from(systemPrompt),
                        UserMessage.from(finalPromptToSend)
                ),
                handler
        );
        emitter.onTimeout(emitter::complete);

        return emitter;
    }
}