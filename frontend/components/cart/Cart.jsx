import CartItem from "./CartItem";

export default function Cart({ cartItems, itemCount, total, changeQuantity, onCheckout, demoMode }) {
  return (
    <aside className="h-fit rounded-3xl border border-[#dce6d8] bg-white p-5 shadow-[0_18px_42px_-30px_rgba(21,55,33,.6)] lg:sticky lg:top-6">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Your bag</h2><span className="text-sm text-gray-500">{itemCount} items</span></div>
      {cartItems.length === 0 ? <p className="rounded-xl bg-[#f4f6f2] px-4 py-6 text-center text-sm text-gray-500">Your cart is empty. Add something delicious from the menu.</p> : <div className="space-y-4">
        {cartItems.map((entry) => <CartItem key={entry.item.id} entry={entry} changeQuantity={changeQuantity} />)}
        <div className="rounded-xl bg-[#f3f8f0] px-3 py-2.5 text-xs font-medium text-[#477355]">◷ Typical pickup is ready in 10–15 minutes</div>
        <div className="border-t border-[#e5e7e0] pt-4"><div className="mb-2 flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>₹{total}</span></div><div className="flex justify-between font-display text-lg font-bold"><span>Total</span><span>₹{total}</span></div><button className="mt-4 w-full rounded-xl bg-[#0f2419] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a3827] disabled:cursor-not-allowed disabled:opacity-50" disabled={demoMode} onClick={onCheckout}>Choose pickup time <span aria-hidden="true">→</span></button>{demoMode && <p className="mt-2 text-center text-xs text-gray-500">Checkout needs the backend running.</p>}</div>
      </div>}
    </aside>
  );
}
