package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class EmailDomainsTests {

    @Test
    void studentsNeedABennettAddressInAnyCase() {
        assertThat(EmailDomains.isStudentEmail("asha@bennett.edu.in")).isTrue();
        assertThat(EmailDomains.isStudentEmail("Asha@BENNETT.EDU.IN")).isTrue();

        assertThat(EmailDomains.isStudentEmail("asha@gmail.com")).isFalse();
        assertThat(EmailDomains.isStudentEmail("asha@mealdeck.in")).isFalse();
        // Lookalike domains: the check must anchor on "@", not just the suffix.
        assertThat(EmailDomains.isStudentEmail("asha@notbennett.edu.in")).isFalse();
        assertThat(EmailDomains.isStudentEmail("asha@bennett.edu.in.evil.com")).isFalse();
        assertThat(EmailDomains.isStudentEmail(null)).isFalse();
    }

    @Test
    void staffNeedAMealdeckAddress() {
        assertThat(EmailDomains.isStaffEmail("bistro@mealdeck.in")).isTrue();
        assertThat(EmailDomains.isStaffEmail("Bistro@MealDeck.in")).isTrue();

        assertThat(EmailDomains.isStaffEmail("bistro@gmail.com")).isFalse();
        assertThat(EmailDomains.isStaffEmail("bistro@bennett.edu.in")).isFalse();
        assertThat(EmailDomains.isStaffEmail("bistro@fakemealdeck.in")).isFalse();
        assertThat(EmailDomains.isStaffEmail(null)).isFalse();
    }
}
