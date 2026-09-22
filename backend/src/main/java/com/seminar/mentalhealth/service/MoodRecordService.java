package com.seminar.mentalhealth.service;

import com.seminar.mentalhealth.dto.request.MoodRecordCreateRequest;
import com.seminar.mentalhealth.dto.request.MoodRecordUpdateRequest;
import com.seminar.mentalhealth.entity.MoodRecord;
import com.seminar.mentalhealth.exception.AppException;
import com.seminar.mentalhealth.exception.ErrorCode;
import com.seminar.mentalhealth.repository.MoodRecordRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MoodRecordService {
    MoodRecordRepository moodRecordRepository;

    public MoodRecord createMoodRecord(MoodRecordCreateRequest request){
        MoodRecord moodRecord = MoodRecord.builder()
                .userId(request.getUserId())
                .moodLabel(request.getMoodLabel())
                .score(request.getScore())
                .recordedAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return moodRecordRepository.save(moodRecord);
    }

    public MoodRecord getMoodRecordById(Long recordId){
        return moodRecordRepository.findById(recordId)
                .orElseThrow(()-> new AppException(ErrorCode.MOOD_RECORD_NOT_FOUND));
    }

    public List<MoodRecord> getMoodRecordByUser(Long userId){
        return moodRecordRepository.findByUserIdOrderByRecordedAtDesc(userId);
    }

    public MoodRecord updateMoodRecord(Long recordId, MoodRecordUpdateRequest request){
        MoodRecord record = getMoodRecordById(recordId);
        record.setMoodLabel(request.getMoodLabel());
        record.setScore(request.getScore());
        return moodRecordRepository.save(record);
    }
}
