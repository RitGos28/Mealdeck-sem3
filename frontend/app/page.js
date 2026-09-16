import MenuExperience from "../components/MealDeckApp";
import demoStalls from "../data/demoMenu";

// Server component: fetches the backend directly, same pattern
// mealdeck_deployed/frontend documents (BACKEND_INTERNAL_URL). No client
// fetch, no loading spinner needed for the initial page load.
const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080";

async function getStalls() {
  const res = await fetch(`${BACKEND_URL}/api/stalls`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Backend returned ${res.status}`);
  return res.json();
}

export default async function MenuPage() {
  let stalls = [];
  let demoMode = false;

  try {
    stalls = await getStalls();
  } catch {
    // Keep the UI usable when someone is working on the frontend without
    // starting the optional Java/MySQL service.
    stalls = demoStalls;
    demoMode = true;
  }

  return (
    <MenuExperience stalls={stalls} demoMode={demoMode} />
  );
}
