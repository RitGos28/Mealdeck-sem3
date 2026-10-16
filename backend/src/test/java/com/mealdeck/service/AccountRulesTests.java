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

    private static void assertRejected(ThrowingCallable call, HttpStatus status) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode().value()).isEqualTo(status.value()));
    }

    private static SignupRequest signup(String email, String password, String confirm, String name) {
        return new SignupRequest(email, password, confirm, name, null);
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
        assertRejected(() -> studentService.signup(signup("new@gmail.com", "secret1", "secret1", "New")), HttpStatus.BAD_REQUEST);
        assertRejected(() -> studentService.signup(signup("new@mealdeck.in", "secret1", "secret1", "New")), HttpStatus.BAD_REQUEST);
    }

    @Test
    void studentSignupValidatesPasswordAndName() {
        assertRejected(() -> studentService.signup(signup("new@bennett.edu.in", "12345", "12345", "New")), HttpStatus.BAD_REQUEST);
        assertRejected(() -> studentService.signup(signup("new@bennett.edu.in", "secret1", "secret2", "New")), HttpStatus.BAD_REQUEST);
        assertRejected(() -> studentService.signup(signup("new@bennett.edu.in", "secret1", "secret1", "  ")), HttpStatus.BAD_REQUEST);
    }

    @Test
    void studentSignupRejectsAnEmailThatAlreadyHasAnAccount() {
        // Seeded by DemoDataSeeder.
        assertRejected(() -> studentService.signup(signup("student@bennett.edu.in", "secret1", "secret1", "Dup")), HttpStatus.CONFLICT);
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
