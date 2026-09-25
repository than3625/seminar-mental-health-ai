package com.seminar.mentalhealth.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "moodRecords")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class MoodRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long recordId;
    @ManyToOne (fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    User user;
    @Column(nullable = false)
    String moodLabel;
    @Column(nullable = false)
    Integer score;
    @Column(nullable = false)
    LocalDateTime recordedAt;
    LocalDateTime updatedAt;
}
