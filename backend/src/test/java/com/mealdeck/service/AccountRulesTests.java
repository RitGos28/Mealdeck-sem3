package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.Vendor;
import com.mealdeck.repository.VendorRepository;
import com.mealdeck.web.AdminUserRequests.CreateStudentRequest;
import com.mealdeck.web.AdminUserRequests.UpdateVendorRequest;
import com.mealdeck.web.MenuItemRequests.CreateStallRequest;
import com.mealdeck.web.StudentRequests.SignupRequest;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import com.mealdeck.RecordingCodeMailer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Who may hold which kind of account: students sign up with a Bennett
 * address, vendor logins are always @mealdeck.in. Rolls back per test. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class AccountRulesTests {

    @Autowired
    StudentService studentService;

    @Autowired
    AdminAccountService adminAccountService;

    @Autowired
    VendorRepository vendorRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    SignupCodeService signupCodeService;

    @Autowired
    RecordingCodeMailer mailer;

    private static void assertRejected(ThrowingCallable call, HttpStatus status) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode().value()).isEqualTo(status.value()));
    }

    /** Asks for a code for the address, then signs up with whatever code
     * was "emailed" (none for an address that already has an account). */
    private SignupRequest signup(String email, String password, String confirm, String name) {
        signupCodeService.requestCode(email);
        return new SignupRequest(email, mailer.lastCodeFor(email), password, confirm, name, null);
    }

    @BeforeEach
    void forgetSentCodes() {
        mailer.clear();
    }

    @Test
    void studentSignupStoresAHashedPassword() {
        var student = studentService.signup(signup("new@bennett.edu.in", "secret1", "secret1", "New Student"));

        assertThat(student.getId()).isNotNull();
        assertThat(student.getPasswordHash()).isNotEqualTo("secret1");
        assertThat(passwordEncoder.matches("secret1", student.getPasswordHash())).isTrue();
    }

    @Test
    void studentSignupRejectsNonBennettEmails() {
        // Turned away before any code is sent, and at signup too.
        assertRejected(() -> signupCodeService.requestCode("new@gmail.com"), HttpStatus.BAD_REQUEST);
        assertRejected(() -> signupCodeService.requestCode("new@mealdeck.in"), HttpStatus.BAD_REQUEST);
        assertRejected(() -> studentService.signup(new SignupRequest("new@gmail.com", "123456", "secret1", "secret1", "New", null)), HttpStatus.BAD_REQUEST);
        assertThat(mailer.sentTo("new@gmail.com")).isFalse();
    }

    @Test
    void studentSignupValidatesPasswordAndName() {
        SignupRequest valid = signup("new@bennett.edu.in", "secret1", "secret1", "New");
        String code = valid.code();
        assertRejected(() -> studentService.signup(new SignupRequest(valid.email(), code, "12345", "12345", "New", null)), HttpStatus.BAD_REQUEST);
        assertRejected(() -> studentService.signup(new SignupRequest(valid.email(), code, "secret1", "secret2", "New", null)), HttpStatus.BAD_REQUEST);
        assertRejected(() -> studentService.signup(new SignupRequest(valid.email(), code, "secret1", "secret1", "  ", null)), HttpStatus.BAD_REQUEST);
        // Field errors don't use up the code.
        assertThat(studentService.signup(valid).getId()).isNotNull();
    }

    @Test
    void studentSignupCantTakeAnEmailThatAlreadyHasAnAccount() {
        // Seeded by DemoDataSeeder. No code is ever sent to it, so signup
        // fails on the code (same as any wrong code) rather than saying the
        // account exists.
        SignupRequest request = signup("student@bennett.edu.in", "secret1", "secret1", "Dup");
        assertThat(mailer.sentTo("student@bennett.edu.in")).isFalse();
        assertRejected(() -> studentService.signup(new SignupRequest(request.email(), "123456", "secret1", "secret1", "Dup", null)), HttpStatus.BAD_REQUEST);
    }

    @Test
    void adminCreatedStudentsAlsoNeedABennettEmail() {
        assertRejected(() -> studentService.createByAdmin(new CreateStudentRequest("new@gmail.com", "secret1", "New", null)),
                HttpStatus.BAD_REQUEST);
    }

    @Test
    void vendorLoginsMustBeMealdeckAddresses() {
        assertRejected(() -> adminAccountService.createStallWithVendor(
                new CreateStallRequest("Chai Point", "chai@gmail.com", "secret1", null)), HttpStatus.BAD_REQUEST);

        Vendor vendor = adminAccountService.createStallWithVendor(
                new CreateStallRequest("Chai Point", "chai@mealdeck.in", "secret1", "owner@gmail.com"));
        assertThat(vendor.getStall().getName()).isEqualTo("Chai Point");

        assertRejected(() -> adminAccountService.updateVendor(vendor.getId(), new UpdateVendorRequest("chai@gmail.com", null, null)),
                HttpStatus.BAD_REQUEST);
    }

    @Test
    void vendorCantBeRenamedOntoAnotherVendorsEmail() {
        Vendor vendor = adminAccountService.createStallWithVendor(
                new CreateStallRequest("Chai Point", "chai@mealdeck.in", "secret1", null));

        assertRejected(() -> adminAccountService.updateVendor(vendor.getId(), new UpdateVendorRequest("bistro@mealdeck.in", null, null)),
                HttpStatus.CONFLICT);
    }
}
