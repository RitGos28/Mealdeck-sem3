package com.mealdeck.repository;

import com.mealdeck.model.SurveyResponse;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, Long> {

    Optional<SurveyResponse> findByStudentId(Long studentId);

    List<SurveyResponse> findAllByOrderByUpdatedAtDesc();

    // Derived delete, deliberately without @Modifying(clearAutomatically).
    void deleteByStudentId(Long studentId);
}
