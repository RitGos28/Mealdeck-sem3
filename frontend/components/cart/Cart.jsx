import Link from "next/link";
import CartItem from "./CartItem";

const primaryButton = "mt-4 flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-deck text-[15px] font-semibold text-white transition-colors hover:bg-deck-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-deck";

// Ordering needs a student login: logged-out visitors are sent to log in
// (the bag is kept, see MealDeckApp), vendors and admins are told why not.
function CheckoutButton({ user, demoMode, onCheckout }) {
  if (demoMode) {
    return <><button className={primaryButton} disabled>Choose pickup time</button><p className="mt-2 text-center text-xs text-muted">Checkout needs the backend running.</p></>;
  }
  if (user === undefined) {
    return <button className={primaryButton} disabled>Choose pickup time</button>;
  }
  if (user === null) {
    return <><Link href="/login?next=/" className={primaryButton}>Log in to order <span aria-hidden="true">→</span></Link><p className="mt-2 text-center text-xs text-muted">Your bag is kept while you log in or sign up.</p></>;
  }
  if (user.role !== "STUDENT") {
    return <><button className={primaryButton} disabled>Choose pickup time</button><p className="mt-2 text-center text-xs text-muted">Pre-orders need a student account.</p></>;
  }
  return <button className={primaryButton} onClick={onCheckout}>Choose pickup time <span aria-hidden="true">→</span></button>;
}

// Bordered card in the desktop bag column; flat inside the phone bottom
// sheet, which brings its own frame.
export default function Cart({ cartItems, itemCount, total, changeQuantity, onCheckout, demoMode, user }) {
  return (
    <aside aria-labelledby="bag-heading" className="h-fit bg-white text-ink lg:rounded-3xl lg:border lg:border-line lg:p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 id="bag-heading" className="font-serif text-[22px]">Your bag</h2>
        <span className="text-sm text-muted">{itemCount} item{itemCount === 1 ? "" : "s"}</span>
      </div>
      {cartItems.length === 0 ? (
        <p className="rounded-2xl bg-[#F4F6F3] px-4 py-6 text-center text-sm text-muted">Your bag is empty. Tap + on a dish to add it.</p>
      ) : (
        <div className="space-y-4">
          {cartItems.map((entry) => <CartItem key={entry.item.id} entry={entry} changeQuantity={changeQuantity} />)}
          <div className="border-t border-line pt-4">
            <div className="flex justify-between text-base font-semibold"><span>Total</span><span>₹{total}</span></div>
            <p className="mt-1 text-xs text-muted">Pay at the counter when you pick up.</p>
            <CheckoutButton user={user} demoMode={demoMode} onCheckout={onCheckout} />
          </div>
        </div>
      )}
    </aside>
  );
}
