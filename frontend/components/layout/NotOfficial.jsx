// Shown at the foot of the main pages: MealDeck is student-built, and
// shouldn't look like a university service (no Bennett logo either).
export default function NotOfficial({ className = "" }) {
  return (
    <p className={`text-center text-xs leading-relaxed text-muted ${className}`}>
      MealDeck is an independent student project, not an official Bennett University service.
    </p>
  );
}
