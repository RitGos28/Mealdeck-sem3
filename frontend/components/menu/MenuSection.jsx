import MenuItemCard from "./MenuItemCard";

export default function MenuSection({ stall, demoMode, onAddToCart }) {
  return (
    <section className="mb-9">
      <h2 className="font-display mb-3 text-xl font-bold">{stall.name}</h2>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {stall.items.map((item) => <MenuItemCard key={item.id} item={item} demoMode={demoMode} onAddToCart={onAddToCart} />)}
      </div>
    </section>
  );
}
