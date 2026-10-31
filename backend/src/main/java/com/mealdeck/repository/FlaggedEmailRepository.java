package com.mealdeck.repository;

import com.mealdeck.model.FlaggedEmail;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FlaggedEmailRepository extends JpaRepository<FlaggedEmail, Long> {

    Optional<FlaggedEmail> findByEmailKey(String emailKey);

    List<FlaggedEmail> findAllByOrderByCreatedAtDesc();
}
