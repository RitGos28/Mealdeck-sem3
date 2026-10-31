package com.mealdeck.web;

import java.util.List;

/** One required, single-pick choice on a dish, e.g. Bread: Butter Naan ×1
 * or Butter Roti ×2. Free choices: they never change the price (sizes are
 * separate menu items with their own prices). */
public record ChoiceGroup(String name, List<String> options) {
}
