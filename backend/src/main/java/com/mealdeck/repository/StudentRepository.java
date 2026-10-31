package com.mealdeck.repository;

import com.mealdeck.model.Student;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByEmail(String email);

    /** Accounts whose deletion was requested at or before `cutoff`. */
    List<Student> findByDeletionRequestedAtLessThanEqual(Instant cutoff);
}
