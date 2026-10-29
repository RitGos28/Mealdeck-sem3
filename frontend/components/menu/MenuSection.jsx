import MenuItemCard from "./MenuItemCard";

export default function MenuSection({ stall, demoMode, onAddToCart }) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[#e3f2d9] text-base">🍽️</span><div><h2 className="font-display text-xl font-bold">{stall.name}</h2><p className="text-xs text-gray-500">{stall.items.length} dishes available</p></div>{stall.closedToday ? <span className="ml-auto rounded-full bg-[#f0f0ee] px-2.5 py-1 text-xs font-semibold text-gray-500">Closed today</span> : stall.ordersPaused && <span className="ml-auto rounded-full bg-[#fbe9e7] px-2.5 py-1 text-xs font-semibold text-[#9a4a3f]">Pre-orders paused</span>}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stall.items.map((item) => <MenuItemCard key={item.id} item={item} demoMode={demoMode} onAddToCart={(item) => onAddToCart(item, stall)} />)}
      </div>
    </section>
  );
}
