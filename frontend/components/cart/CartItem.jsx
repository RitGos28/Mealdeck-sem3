import Stepper from "../student/Stepper";

export default function CartItem({ entry, changeQuantity }) {
  const { item, quantity } = entry;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-[15px] font-medium text-ink">{item.name}</p>
        <p className="text-sm text-muted">₹{item.price} each · <span className="font-medium text-ink">₹{item.price * quantity}</span></p>
      </div>
      <Stepper name={item.name} quantity={quantity} onChange={(delta) => changeQuantity(item.id, delta)} size="sm" />
    </div>
  );
}
