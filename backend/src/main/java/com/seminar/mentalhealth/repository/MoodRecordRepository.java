package com.seminar.mentalhealth.repository;

import com.seminar.mentalhealth.entity.MoodRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MoodRecordRepository extends JpaRepository<MoodRecord, String> {
}
