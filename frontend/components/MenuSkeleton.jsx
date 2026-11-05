// What shows while the menu page loads, so a phone never sees an empty
// green screen: the same green band and white sheet, with grey placeholder
// rows where the stalls will be.
export default function MenuSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-deck" aria-busy="true">
      <header className="mx-auto w-full max-w-6xl px-5 pt-4 pb-6 text-white sm:px-8">
        <span className="font-serif text-2xl">MealDeck</span>
        <div className="mt-6 h-8 w-56 animate-pulse rounded-lg bg-white/15" />
        <div className="mt-3 h-11 w-full max-w-xs animate-pulse rounded-xl bg-white/12" />
      </header>
      <main className="flex-1 rounded-t-3xl bg-white">
        <div role="status" className="mx-auto max-w-3xl space-y-4 px-5 pt-6 sm:px-8">
          <span className="sr-only">Loading the menu…</span>
          {[0, 1, 2, 3].map((row) => <div key={row} className="h-20 animate-pulse rounded-2xl bg-[#F1F4F0]" />)}
        </div>
      </main>
    </div>
  );
}
