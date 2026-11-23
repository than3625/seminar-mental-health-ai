package com.seminar.mentalhealth.config;

import com.seminar.mentalhealth.entity.User;
import com.seminar.mentalhealth.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminDataSeeder implements CommandLineRunner {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@mindcontext.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .fullName("System Administrator")
                    .role(User.Role.ROLE_ADMIN)
                    .active(true)
                    .build();

            userRepository.save(admin);
            log.info("Đã khởi tạo tài khoản Admin mặc định (admin / Admin@123)");
        }
    }
}
