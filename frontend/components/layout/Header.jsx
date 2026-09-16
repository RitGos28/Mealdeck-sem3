export default function Header({ itemCount }) {
  return (
    <header className="bg-[radial-gradient(circle_at_top_left,_#0f2419_0%,_#0a1810_100%)] px-6 py-5 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[10px] bg-[#a9c9a1] text-lg font-bold text-[#0a1810]">M</span>
          <span className="font-display text-xl font-bold">MealDeck</span>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold">Cart: {itemCount}</span>
      </div>
    </header>
  );
}
