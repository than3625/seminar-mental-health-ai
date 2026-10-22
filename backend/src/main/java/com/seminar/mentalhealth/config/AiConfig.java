package com.seminar.mentalhealth.config;

import com.seminar.mentalhealth.service.DocumentIngestionService;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.model.ollama.OllamaEmbeddingModel;
import dev.langchain4j.model.ollama.OllamaStreamingChatModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class AiConfig {
    @Value("${langchain4j.ollama.chat-model.base-url}")
    private String baseUrl;

    @Value("${langchain4j.ollama.chat-model.model-name}")
    private String modelName;

    @Value("${langchain4j.ollama.chat-model.temperature}")
    private Double temperature;

    @Value("${langchain4j.ollama.chat-model.timeout}")
    private Duration timeout;

    @Bean
    public ChatModel chatModel(){
        return OllamaChatModel.builder()
                .baseUrl(baseUrl)
                .modelName(modelName)
                .temperature(temperature)
                .think(false)
                .logRequests(true)
                .logResponses(true)
                .timeout(timeout)
                .build();

    }
    @Bean
    public StreamingChatModel streamingChatModel(){
        return OllamaStreamingChatModel.builder()
                .baseUrl(baseUrl)
                .modelName(modelName)
                .temperature(temperature)
                .think(false)
                .timeout(timeout)
                .build();

    }
    @Bean
    public EmbeddingStore<TextSegment> embeddingStore() {
        return PgVectorEmbeddingStore.builder()
                .host("localhost")
                .port(5433)
                .database("mentalhealth")
                .user("postgres")
                .password("123")
                .table("mental_health_documents")
                .dimension(1024)
                .createTable(true)
                .dropTableFirst(false)
                .build();
    }

    @Bean
    public CommandLineRunner testInternalIngestion(DocumentIngestionService ingestionService) {
        return args -> {
            System.out.println("\n === BẮT ĐẦU TEST NẠP TÀI LIỆU NỘI BỘ ===");
            try {
                ingestionService.ingestProcessedDocuments();
            } catch (Exception e) {
                System.err.println("Lỗi khi nạp: " + e.getMessage());
            }
            System.out.println("============================================\n");
        };
    }
}