import CartItem from "./CartItem";

export default function Cart({ cartItems, itemCount, total, changeQuantity }) {
  return (
    <aside className="h-fit rounded-2xl border border-[#e5e7e0] bg-white p-5 shadow-sm lg:sticky lg:top-6">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Your cart</h2><span className="text-sm text-gray-500">{itemCount} items</span></div>
      {cartItems.length === 0 ? <p className="rounded-xl bg-[#f4f6f2] px-4 py-6 text-center text-sm text-gray-500">Your cart is empty. Add something delicious from the menu.</p> : <div className="space-y-4">
        {cartItems.map((entry) => <CartItem key={entry.item.id} entry={entry} changeQuantity={changeQuantity} />)}
        <div className="border-t border-[#e5e7e0] pt-4"><div className="flex justify-between font-bold"><span>Total</span><span>₹{total}</span></div><button className="mt-4 w-full rounded-xl bg-[#0f2419] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a3827]">Proceed to checkout</button></div>
      </div>}
    </aside>
  );
}
