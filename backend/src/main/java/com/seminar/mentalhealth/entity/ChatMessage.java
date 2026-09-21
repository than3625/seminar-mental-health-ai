package com.seminar.mentalhealth.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "chatMessages")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long messageId;
//    @OneToOne (fetch = FetchType.LAZY)
//    @JoinColumn(name = "sessionId")
//    ChatSession chatSession;
    @Column(nullable = false)
    String sender;
    @Column(columnDefinition = "TEXT", nullable = false)
    String content;
    @Column(nullable = false)
    LocalDateTime createdAt;
}
