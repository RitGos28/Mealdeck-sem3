# Mealdeck-sem3
MealDeck

Run with `./run.sh --demo` (in-memory H2, no MySQL/`.env` needed). It seeds a stall, a vendor login, an admin login, and a student login:

| Role    | Email                    | Password    |
|---------|---------------------------|-------------|
| Vendor  | bistro@mealdeck.in        | vendor123   |
| Admin   | admin@mealdeck.in         | admin123    |
| Student | student@bennett.edu.in    | student123  |

Vendor/admin logins use a `@mealdeck.in` identity (see `Vendor.realEmail` / `Admin.realEmail`, currently unused placeholders for future OTP delivery); student signup only accepts `@bennett.edu.in` addresses.
