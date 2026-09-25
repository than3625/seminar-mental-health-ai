package com.seminar.mentalhealth.repository;

import com.seminar.mentalhealth.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    List<ChatSession> findByUser_UserIdAndIsDeletedFalseOrderByUpdatedAtDesc(Long userId);
}
