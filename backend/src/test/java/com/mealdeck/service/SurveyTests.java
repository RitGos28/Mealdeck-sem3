package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.Student;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.repository.SurveyResponseRepository;
import java.util.List;
import java.util.Map;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** The Account questionnaire: optional answers checked against the questions,
 * editable, one per student, totals and free text for admins without who
 * wrote them, and gone with the account. */
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
    void theFormHasTheEightQuestionsInOrder() {
        assertThat(SurveyService.QUESTIONS).extracting(SurveyService.Question::id)
                .containsExactly("heard", "stay", "often", "used", "waited", "wouldOrder", "putOff", "change");
    }

    @Test
    void nothingIsSavedUntilTheStudentAnswersAndAnswersCanBeChanged() {
        Long id = student();
        assertThat(survey.mine(id)).isNull();

        survey.save(id, Map.of("heard", "friend", "used", List.of("menus", "deal", "menus"), "change", "Cheaper combos"));
        var first = survey.mine(id).answers();
        assertThat(first.get("heard")).isEqualTo("friend");
        assertThat(first.get("used")).isEqualTo(List.of("menus", "deal"));
        assertThat(first.get("change")).isEqualTo("Cheaper combos");

        survey.save(id, Map.of("heard", "other", "heardOther", " Class group ", "used", List.of("mess"), "change", "  "));
        var second = survey.mine(id).answers();
        assertThat(second.get("heard")).isEqualTo("other");
        assertThat(second.get("heardOther")).isEqualTo("Class group");
        assertThat(second.get("used")).isEqualTo(List.of("mess"));
        assertThat(second).doesNotContainKey("change");
        assertThat(repository.count()).isEqualTo(1);
    }

    @Test
    void everyQuestionIsOptionalButAnswersAreChecked() {
        Long id = student();
        survey.save(id, Map.of());
        assertThat(survey.mine(id).answers()).isEmpty();

        assertRejected(() -> survey.save(id, Map.of("heard", "a billboard")), HttpStatus.BAD_REQUEST);
        assertRejected(() -> survey.save(id, Map.of("used", List.of("teleport"))), HttpStatus.BAD_REQUEST);
        assertRejected(() -> survey.save(id, Map.of("used", "menus")), HttpStatus.BAD_REQUEST);
        assertRejected(() -> survey.save(id, Map.of("nonsense", "x")), HttpStatus.BAD_REQUEST);
        assertRejected(() -> survey.save(id, Map.of("change", "x".repeat(601))), HttpStatus.BAD_REQUEST);
        assertRejected(() -> survey.save(id, Map.of("heard", "other", "heardOther", "x".repeat(121))), HttpStatus.BAD_REQUEST);
        // Other text only counts when "other" is the choice.
        survey.save(id, Map.of("heard", "friend", "heardOther", "ignored"));
        assertThat(survey.mine(id).answers()).doesNotContainKey("heardOther");
    }

    @Test
    void adminsSeeTotalsPerOptionAndFreeTextWithoutWhoWroteIt() {
        survey.save(student(), Map.of("heard", "friend", "wouldOrder", "definitely", "putOff", List.of("late", "other"), "putOffOther", "Exams", "change", "More stalls"));
        survey.save(student(), Map.of("heard", "friend", "wouldOrder", "probably"));
        survey.save(student(), Map.of("heard", "poster", "wouldOrder", "definitely", "change", "Dark mode"));

        var summary = survey.summary();

        assertThat(summary.responses()).isEqualTo(3);
        var heard = summary.questions().stream().filter(q -> q.id().equals("heard")).findFirst().orElseThrow();
        assertThat(heard.counts()).filteredOn(c -> c.key().equals("friend")).extracting(SurveyService.OptionCount::count).containsExactly(2L);
        assertThat(heard.counts()).filteredOn(c -> c.key().equals("hatchery")).extracting(SurveyService.OptionCount::count).containsExactly(0L);
        var wouldOrder = summary.questions().stream().filter(q -> q.id().equals("wouldOrder")).findFirst().orElseThrow();
        assertThat(wouldOrder.counts()).filteredOn(c -> c.key().equals("definitely")).extracting(SurveyService.OptionCount::count).containsExactly(2L);
        assertThat(summary.questions()).extracting(SurveyService.QuestionSummary::id).doesNotContain("change");
        assertThat(summary.comments()).extracting(SurveyService.Comment::text).contains("More stalls", "Dark mode", "Exams");
        // A comment carries a topic and a time, never a student.
        assertThat(SurveyService.Comment.class.getRecordComponents()).extracting(c -> c.getName()).containsExactly("about", "text", "at");
    }

    @Test
    void deletingTheStudentRemovesTheirAnswers() {
        Long leaving = student();
        Long staying = student();
        survey.save(leaving, Map.of("heard", "friend", "change", "Wish"));
        survey.save(staying, Map.of("heard", "friend", "change", "Wish"));

        studentService.delete(leaving, "test");

        assertThat(survey.mine(leaving)).isNull();
        assertThat(survey.mine(staying)).isNotNull();
    }
}
