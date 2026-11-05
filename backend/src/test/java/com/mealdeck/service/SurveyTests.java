package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.Student;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.repository.SurveyResponseRepository;
import com.mealdeck.service.SurveyService.Request;
import java.util.List;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** The Account questionnaire: optional answers, editable, one per student,
 * totals and free text for admins without who wrote them, gone with the account. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class SurveyTests {

    @Autowired SurveyService survey;
    @Autowired SurveyResponseRepository repository;
    @Autowired StudentRepository studentRepository;
    @Autowired StudentService studentService;

    private Long student() {
        return studentRepository.save(new Student("survey" + System.nanoTime() + "@bennett.edu.in", "unused", "Survey Student", null)).getId();
    }

    private static void assertRejected(ThrowingCallable call, HttpStatus status) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode().value()).isEqualTo(status.value()));
    }

    @Test
    void nothingIsSavedUntilTheStudentAnswersAndAnswersCanBeChanged() {
        Long id = student();
        assertThat(survey.mine(id)).isNull();

        survey.save(id, new Request("friend", null, List.of("menus", "deal", "menus"), null, "Cheaper combos", "Few people report stock"));
        var first = survey.mine(id);
        assertThat(first.source()).isEqualTo("friend");
        assertThat(first.features()).containsExactly("menus", "deal");
        assertThat(first.wishes()).isEqualTo("Cheaper combos");

        survey.save(id, new Request("other", " Class group ", List.of("mess"), "The colours", "  ", null));
        var second = survey.mine(id);
        assertThat(second.source()).isEqualTo("other");
        assertThat(second.sourceOther()).isEqualTo("Class group");
        assertThat(second.features()).containsExactly("mess");
        assertThat(second.wishes()).isNull();
        assertThat(repository.count()).isEqualTo(1);
    }

    @Test
    void everyQuestionIsOptionalButAnswersAreChecked() {
        Long id = student();
        survey.save(id, new Request(null, null, null, null, null, null));
        assertThat(survey.mine(id).features()).isEmpty();

        assertRejected(() -> survey.save(id, new Request("a billboard", null, null, null, null, null)), HttpStatus.BAD_REQUEST);
        assertRejected(() -> survey.save(id, new Request(null, null, List.of("teleport"), null, null, null)), HttpStatus.BAD_REQUEST);
        assertRejected(() -> survey.save(id, new Request(null, null, null, null, "x".repeat(601), null)), HttpStatus.BAD_REQUEST);
        assertRejected(() -> survey.save(id, new Request("other", "x".repeat(121), null, null, null, null)), HttpStatus.BAD_REQUEST);
    }

    @Test
    void adminsSeeTotalsAndFreeTextWithoutWhoWroteIt() {
        survey.save(student(), new Request("friend", null, List.of("menus", "deal"), null, "More stalls", "Slow on my phone"));
        survey.save(student(), new Request("friend", null, List.of("menus"), null, null, null));
        survey.save(student(), new Request("poster", null, List.of("mess"), "Dark mode", null, null));

        var summary = survey.summary();

        assertThat(summary.responses()).isEqualTo(3);
        assertThat(summary.sources()).containsEntry("friend", 2L).containsEntry("poster", 1L).containsEntry("hatchery", 0L);
        assertThat(summary.features()).containsEntry("menus", 2L).containsEntry("deal", 1L).containsEntry("mess", 1L);
        assertThat(summary.comments()).extracting(SurveyService.Comment::text).contains("More stalls", "Slow on my phone", "Dark mode");
        // Comments carry a topic and a time, never a student.
        assertThat(SurveyService.Comment.class.getRecordComponents()).extracting(c -> c.getName()).containsExactly("about", "text", "at");
    }

    @Test
    void deletingTheStudentRemovesTheirAnswers() {
        Long leaving = student();
        Long staying = student();
        survey.save(leaving, new Request("friend", null, null, null, "Wish", null));
        survey.save(staying, new Request("friend", null, null, null, "Wish", null));

        studentService.delete(leaving, "test");

        assertThat(survey.mine(leaving)).isNull();
        assertThat(survey.mine(staying)).isNotNull();
    }
}
