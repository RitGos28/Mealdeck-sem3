package com.mealdeck.repository;

import com.mealdeck.model.EmailCode;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailCodeRepository extends JpaRepository<EmailCode, Long> {

    Optional<EmailCode> findByEmail(String email);
}
