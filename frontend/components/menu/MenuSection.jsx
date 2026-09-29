import MenuItemCard from "./MenuItemCard";

export default function MenuSection({ stall, demoMode, onAddToCart }) {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[#e3f2d9] text-base">🍽️</span><div><h2 className="font-display text-xl font-bold">{stall.name}</h2><p className="text-xs text-gray-500">{stall.items.length} dishes available</p></div></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stall.items.map((item) => <MenuItemCard key={item.id} item={item} demoMode={demoMode} onAddToCart={(item) => onAddToCart(item, stall)} />)}
      </div>
    </section>
  );
}
