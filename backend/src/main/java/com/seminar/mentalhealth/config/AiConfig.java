package com.seminar.mentalhealth.config;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.model.ollama.OllamaEmbeddingModel;
import dev.langchain4j.model.ollama.OllamaStreamingChatModel;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${langchain4j.ollama.embedding-model.base-url}")
    private String embeddingBaseUrl;

    @Value("${langchain4j.ollama.embedding-model.model-name}")
    private String embeddingModelName;

    @Value("${langchain4j.ollama.embedding-model.timeout")
    private Duration embeddingTimeout;

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
    public EmbeddingModel embeddingModel(){
        return OllamaEmbeddingModel.builder()
                .baseUrl(embeddingBaseUrl)
                .modelName(embeddingModelName)
                .timeout(embeddingTimeout)
                .build();
    }
}