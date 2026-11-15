package com.seminar.mentalhealth.repository;

import com.seminar.mentalhealth.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findBySession_SessionIdOrderByCreatedAtAsc(Long sessionId);
}
