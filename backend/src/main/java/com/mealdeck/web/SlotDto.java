package com.mealdeck.web;

import java.time.LocalTime;

/** One pickup slot and how full it is, for the checkout picker and the
 * live queue. */
public record SlotDto(LocalTime time, long booked, int capacity, boolean full) {
}
