export default function CartItem({ entry, changeQuantity }) {
  const { item, quantity } = entry;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0"><p className="truncate text-sm font-semibold">{item.name}</p><p className="text-sm text-gray-500">₹{item.price} each · <span className="font-medium text-[#354438]">₹{item.price * quantity}</span></p></div>
      <div className="flex items-center gap-2 rounded-full border border-[#e5e7e0] px-2 py-1">
        <button className="size-5 rounded-full text-sm hover:bg-[#f4f6f2]" onClick={() => changeQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button>
        <span className="w-4 text-center text-sm font-semibold">{quantity}</span>
        <button className="size-5 rounded-full text-sm hover:bg-[#f4f6f2]" onClick={() => changeQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>+</button>
      </div>
    </div>
  );
}
