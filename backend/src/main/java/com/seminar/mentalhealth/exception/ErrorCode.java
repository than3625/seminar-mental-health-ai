package com.seminar.mentalhealth.exception;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION("UNCATEGORIZED_EXCEPTION", "Lỗi hệ thống không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    JOURNAL_NOT_FOUND("JOURNAL_NOT_FOUND", "Không tìm thấy nhật ký T.T", HttpStatus.NOT_FOUND),
    MOOD_RECORD_NOT_FOUND("MOOD_RECORD_NOT_FOUND", "Người dùng chưa cập nhật cảm xúc T.T", HttpStatus.NOT_FOUND),
    USER_NOT_FOUND("USER_NOT_FOUND", "Không tìm thấy người dùng T.T", HttpStatus.NOT_FOUND);

    String code;
    String message;
    HttpStatus httpStatus;
}
