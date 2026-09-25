package com.seminar.mentalhealth.controller;

import com.seminar.mentalhealth.dto.request.MoodRecordCreateRequest;
import com.seminar.mentalhealth.dto.request.MoodRecordUpdateRequest;
import com.seminar.mentalhealth.dto.response.ApiResponse;
import com.seminar.mentalhealth.entity.MoodRecord;
import com.seminar.mentalhealth.entity.User;
import com.seminar.mentalhealth.service.MoodRecordService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mood-records")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MoodRecordController {
    MoodRecordService moodRecordService;

    @PostMapping
    public ResponseEntity<ApiResponse<MoodRecord>> checkInMood(@RequestBody MoodRecordCreateRequest request){
        MoodRecord moodRecord = moodRecordService.createMoodRecord(request);
        ApiResponse<MoodRecord> apiResponse = ApiResponse.<MoodRecord>builder()
                .success(true)
                .message("Cảm ơn bạn đã cập nhật cảm xúc!")
                .result(moodRecord)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<List<MoodRecord>>> getRecordByUser(@PathVariable User user){
        List<MoodRecord> history = moodRecordService.getMoodRecordByUser(user);
        ApiResponse<List<MoodRecord>> apiResponse = ApiResponse.<List<MoodRecord>>builder()
                .success(true)
                .result(history)
                .build();
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/{recordId}")
    public ResponseEntity<ApiResponse<MoodRecord>> getRecordById(@PathVariable Long recordId){
        MoodRecord record = moodRecordService.getMoodRecordById(recordId);
        ApiResponse<MoodRecord> apiResponse = ApiResponse.<MoodRecord>builder()
                .success(true)
                .result(record)
                .build();
        return ResponseEntity.ok(apiResponse);
    }

    @PutMapping("/{recordId}")
    public ResponseEntity<ApiResponse<MoodRecord>> updateMoodRecord(@PathVariable Long recordId, @RequestBody MoodRecordUpdateRequest request){
        MoodRecord updatedRecord = moodRecordService.updateMoodRecord(recordId, request);
        ApiResponse<MoodRecord> apiResponse = ApiResponse.<MoodRecord>builder()
                .success(true)
                .message("Đã cập nhật cảm xúc thành công!")
                .result(updatedRecord)
                .build();
        return ResponseEntity.ok(apiResponse);
    }
}
