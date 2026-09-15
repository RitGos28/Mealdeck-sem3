import MenuItemCard from "./MenuItemCard";

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
  let error = null;

  try {
    stalls = await getStalls();
  } catch (err) {
    error = err.message;
  }

  return (
    <>
      <header className="header">
        <span className="logo-mark">M</span>
        <span className="brand">MealDeck</span>
      </header>
      <main>
        <h1 className="page-title">Today&apos;s Menu</h1>
        <p className="page-subtitle">Live availability, reported by students.</p>

        {error && <p className="status-line">Couldn&apos;t reach the server: {error}</p>}
        {!error && stalls.length === 0 && <p className="status-line">No stalls yet.</p>}

        {stalls.map((stall) => (
          <section className="stall-section" key={stall.id}>
            <h2 className="stall-name">{stall.name}</h2>
            <div className="item-grid">
              {stall.items.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
