package com.seminar.mentalhealth.service;

import com.seminar.mentalhealth.dto.request.JournalCreateRequest;
import com.seminar.mentalhealth.dto.request.JournalUpdateRequest;
import com.seminar.mentalhealth.entity.Journal;
import com.seminar.mentalhealth.entity.MoodRecord;
import com.seminar.mentalhealth.entity.User;
import com.seminar.mentalhealth.exception.AppException;
import com.seminar.mentalhealth.exception.ErrorCode;
import com.seminar.mentalhealth.repository.JournalRepository;
import com.seminar.mentalhealth.repository.MoodRecordRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class JournalService {
    JournalRepository journalRepository;
    MoodRecordRepository moodRecordRepository;

    public Journal createJournal (JournalCreateRequest request){
        MoodRecord moodRecord = moodRecordRepository.findById(request.getRecordId())
                .orElseThrow(() -> new AppException(ErrorCode.MOOD_RECORD_NOT_FOUND));

        // Đặt title mặc định nếu người dùng hong nhập
        LocalDateTime now = LocalDateTime.now();
        if(request.getTitle() == null||request.getTitle().trim().isEmpty()){
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            request.setTitle("Nhật ký ngày " + now.format(formatter));
        }

        Journal journal = Journal.builder()
                .moodRecord(moodRecord)
                .title(request.getTitle())
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return journalRepository.save(journal);
    }

    public Journal getJournalById(Long journalId){
        return journalRepository.findById(journalId)
                .orElseThrow(()-> new AppException(ErrorCode.JOURNAL_NOT_FOUND));
    }

    public List<Journal> getJournalByUser(Long userId){
        return journalRepository.findByMoodRecord_User_UserIdOrderByCreatedAtDesc(userId);
    }

    public Journal updateJournal(Long journalId, JournalUpdateRequest request){
        Journal journal = getJournalById(journalId);

        journal.setTitle(request.getTitle());
        journal.setContent(request.getContent());
        journal.setUpdatedAt(LocalDateTime.now());

        return journalRepository.save(journal);
    }

    public void deleteJournal(Long journalId){
        journalRepository.deleteById(journalId);
    }
}
