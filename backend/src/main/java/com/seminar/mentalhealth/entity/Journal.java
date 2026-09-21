package com.seminar.mentalhealth.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "journals")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class Journal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long journalId;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recordId", nullable = false, unique = true)
    MoodRecord moodRecord;
    @Column(nullable = false)
    String title;
    @Column(columnDefinition = "TEXT", nullable = false)
    String content;
    @Column(nullable = false)
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
