package com.seminar.mentalhealth.repository;

import com.seminar.mentalhealth.dto.response.UserContextDto;
import com.seminar.mentalhealth.entity.MoodRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MoodRecordRepository extends JpaRepository<MoodRecord, Long> {
    List<MoodRecord> findByUser_UserIdOrderByRecordedAtDesc(Long userId);

    @Query("""
        SELECT new com.seminar.mentalhealth.dto.response.UserContextDto(
            m.recordedAt,
            m.moodLabel,
            m.score,
            j.title,
            j.content
        )
        FROM MoodRecord m
        LEFT JOIN Journal j ON j.moodRecord = m
        WHERE m.user.userId = :userId
        ORDER BY m.recordedAt DESC
    """)
    List<UserContextDto> findRecentMoodWithJournal(
            @Param("userId") Long userId,
            Pageable pageable
    );
}
