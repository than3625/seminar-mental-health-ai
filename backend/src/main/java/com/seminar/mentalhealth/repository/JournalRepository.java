package com.seminar.mentalhealth.repository;

import com.seminar.mentalhealth.entity.Journal;
import com.seminar.mentalhealth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JournalRepository extends JpaRepository<Journal, Long> {
    List<Journal> findByMoodRecord_User_UserIdOrderByCreatedAtDesc (Long userId);
}
