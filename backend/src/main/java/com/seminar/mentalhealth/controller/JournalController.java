package com.seminar.mentalhealth.controller;

import com.seminar.mentalhealth.dto.request.JournalCreateRequest;
import com.seminar.mentalhealth.dto.request.JournalUpdateRequest;
import com.seminar.mentalhealth.dto.response.ApiResponse;
import com.seminar.mentalhealth.entity.Journal;
import com.seminar.mentalhealth.service.JournalService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/journals")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class JournalController {
    JournalService journalService;

    @PostMapping
    public ResponseEntity<ApiResponse<Journal>> createJournal(@RequestBody JournalCreateRequest request){
        Journal createJournal = journalService.createJournal(request);
        ApiResponse<Journal> apiResponse = ApiResponse.<Journal>builder()
                .success(true)
                .message("Đã tạo nhật ký thành công ^^ yay")
                .result(createJournal)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(apiResponse);
    }

    @GetMapping("/{journalId}")
    public ResponseEntity<ApiResponse<Journal>> getJournalById(@PathVariable Long journalId){
        Journal journal = journalService.getJournalById(journalId);
        ApiResponse<Journal> apiResponse = ApiResponse.<Journal>builder()
                .success(true)
                .result(journal)
                .build();
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<List<Journal>>> getJournalByUser(@PathVariable Long userId){
        List<Journal> journals = journalService.getJournalByUser(userId);
        ApiResponse<List<Journal>> apiResponse = ApiResponse.<List<Journal>>builder()
                .success(true)
                .result(journals)
                .build();
        return ResponseEntity.ok(apiResponse);
    }

    @PutMapping("/{journalId}")
    public ResponseEntity<ApiResponse<Journal>> updateJournal(@PathVariable Long journalId, @RequestBody JournalUpdateRequest request){
        Journal updatedJournal = journalService.updateJournal(journalId, request);
        ApiResponse<Journal> apiResponse = ApiResponse.<Journal>builder()
                .success(true)
                .message("Đã cập nhật nhật ký thành công ^^ yay")
                .result(updatedJournal)
                .build();
        return ResponseEntity.ok(apiResponse);
    }

    @DeleteMapping("/{journalId}")
    public ResponseEntity<ApiResponse<Void>> deleteJournal(@PathVariable Long journalId){
        journalService.deleteJournal(journalId);
        ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                .message("Đã xóa nhật ký thành công!")
                .build();
        return ResponseEntity.ok(apiResponse);
    }
}
