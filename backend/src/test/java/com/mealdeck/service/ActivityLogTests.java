package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.RecordingCodeMailer;
import com.mealdeck.model.ActivityLog;
import com.mealdeck.model.ActivityLog.Type;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Student;
import com.mealdeck.repository.ActivityLogRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.web.ActivityDto;
import com.mealdeck.web.OrderRequests.CreateOrderRequest;
import com.mealdeck.web.OrderRequests.OrderItemRequest;
import com.mealdeck.web.StudentRequests.SignupRequest;
import java.time.Duration;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/** The activity trail: sign-up, out-of-stock report, preorder and the two
 * steps of an account deletion each leave one line, by id only; lines go
 * after a year or when an admin clears them. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class ActivityLogTests {

    private static final String PASSWORD = "trail123";

    @Autowired ActivityLogService activityLog;
    @Autowired ActivityLogRepository repository;
    @Autowired StudentService studentService;
    @Autowired SignupCodeService signupCodeService;
    @Autowired RecordingCodeMailer mailer;
    @Autowired MenuService menuService;
    @Autowired OrderService orderService;
    @Autowired AccountDeletionService accountDeletion;
    @Autowired StudentRepository studentRepository;
    @Autowired StallRepository stallRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private Student newStudent() {
        return studentRepository.save(new Student("trail" + System.nanoTime() + "@bennett.edu.in", passwordEncoder.encode(PASSWORD), "Trail Student", null));
    }

    private Stall bistro() {
        return stallRepository.findAllWithMenuItems().stream().filter(s -> s.getName().equals("Bistro / Kathi")).findFirst().orElseThrow();
    }

    private List<ActivityDto> trailOf(Student student) {
        return activityLog.forStudent(student.getId(), 50).stream().map(ActivityDto::from).toList();
    }

    @Test
    void signingUpLeavesALineWithTheIdAndNoPersonalDetails() {
        String email = "fresh@bennett.edu.in";
        signupCodeService.requestCode(email);
        Student student = studentService.signup(new SignupRequest(email, mailer.lastCodeFor(email), "secret1", "secret1", "Fresh Student", "9999999999"));

        var lines = trailOf(student);
        assertThat(lines).hasSize(1);
        assertThat(lines.getFirst().type()).isEqualTo("ACCOUNT_CREATED");
        assertThat(lines.getFirst().text()).isEqualTo("Student #" + student.getId() + " created an account");
        assertThat(lines.getFirst().text()).doesNotContain("Fresh").doesNotContain("bennett").doesNotContain("9999");
    }

    @Test
    void reportingOutOfStockNamesTheItemId() {
        Student student = newStudent();
        MenuItem item = bistro().getMenuItems().getFirst();

        menuService.reportOutOfStock(item.getId(), student.getId());

        var line = trailOf(student).getFirst();
        assertThat(line.type()).isEqualTo("OUT_OF_STOCK_REPORTED");
        assertThat(line.subjectId()).isEqualTo(item.getId());
        assertThat(line.text()).startsWith("Student #" + student.getId() + " reported item #" + item.getId());
    }

    @Test
    void aPreorderLogsTheItemsAndTheOrder() {
        Student student = newStudent();
        Stall stall = bistro();
        MenuItem item = stall.getMenuItems().getFirst();

        var order = orderService.checkout(student.getId(),
                new CreateOrderRequest(List.of(new OrderItemRequest(item.getId(), 2)), Map.of(stall.getId(), LocalTime.NOON))).getFirst();

        var line = trailOf(student).getFirst();
        assertThat(line.type()).isEqualTo("PREORDER_PLACED");
        assertThat(line.subjectId()).isEqualTo(order.getId());
        assertThat(line.text()).contains("preordered 2 x item #" + item.getId()).contains("stall #" + stall.getId());
    }

    @Test
    void anOrderThatIsRejectedLeavesNoLine() {
        Student student = newStudent();
        Stall stall = bistro();
        MenuItem item = stall.getMenuItems().getFirst();

        try {
            orderService.checkout(student.getId(), new CreateOrderRequest(List.of(new OrderItemRequest(item.getId(), 0)), Map.of(stall.getId(), LocalTime.NOON)));
        } catch (RuntimeException expected) {
            // quantity 0 is refused before anything is saved
        }
        assertThat(trailOf(student)).isEmpty();
    }

    @Test
    void deletingAnAccountLogsTheRequestAndLaterTheFinalDelete() {
        Student student = newStudent();
        Long id = student.getId();

        accountDeletion.request(id, PASSWORD);
        accountDeletion.cancel(id);
        accountDeletion.request(id, PASSWORD);
        student = studentRepository.findById(id).orElseThrow();
        student.setDeletionRequestedAt(FixedClockConfig.NOW.minus(Duration.ofHours(24)).minusSeconds(60));
        studentRepository.save(student);

        accountDeletion.deleteDueAccounts();

        assertThat(studentRepository.findById(id)).isEmpty();
        var types = activityLog.forStudent(id, 50).stream().map(l -> l.getType()).toList();
        assertThat(types).containsExactly(Type.ACCOUNT_DELETED, Type.DELETION_REQUESTED, Type.DELETION_CANCELLED, Type.DELETION_REQUESTED);
        var last = ActivityDto.from(activityLog.forStudent(id, 1).getFirst());
        assertThat(last.text()).isEqualTo("Student #" + id + " account permanently deleted (the 24 h grace period ended)");
    }

    @Test
    void linesAreKeptForAYearThenDropped() {
        Long studentId = 4242L;
        repository.save(new ActivityLog(FixedClockConfig.NOW.minus(Duration.ofDays(400)), Type.ACCOUNT_CREATED, studentId, null, "created an account"));
        repository.save(new ActivityLog(FixedClockConfig.NOW.minus(Duration.ofDays(300)), Type.ACCOUNT_CREATED, studentId, null, "created an account"));

        assertThat(activityLog.purgeExpired()).isEqualTo(1);

        assertThat(activityLog.forStudent(studentId, 10)).hasSize(1);
    }

    @Test
    void anAdminCanClearTheWholeTrail() {
        newStudent();
        activityLog.accountCreated(1L);
        activityLog.accountCreated(2L);

        assertThat(activityLog.clearAll()).isGreaterThanOrEqualTo(2);

        assertThat(activityLog.recent(10)).isEmpty();
    }
}
