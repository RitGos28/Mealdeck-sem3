package com.mealdeck.repository;

import com.mealdeck.model.PageView;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PageViewRepository extends JpaRepository<PageView, Long> {

    Optional<PageView> findByDateAndPathAndSource(LocalDate date, String path, String source);

    List<PageView> findByDateGreaterThanEqual(LocalDate since);
}
