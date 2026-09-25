package com.seminar.mentalhealth.repository;

import com.seminar.mentalhealth.entity.MoodRecord;
import com.seminar.mentalhealth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MoodRecordRepository extends JpaRepository<MoodRecord, Long> {
    List<MoodRecord> findByUserOrderByRecordedAtDesc(User user);
}
