// A heads-up, never a block: a student who set "I only eat veg" can still
// order non-veg (for a friend, say), but is told it's in the bag.
export function hasNonVeg(cartItems) {
  return cartItems.some((entry) => entry.item?.veg === false);
}

export default function NonVegNotice({ user, cartItems, className = "" }) {
  if (user?.vegOnly !== true || !hasNonVeg(cartItems)) return null;
  return (
    <p role="status" className={`rounded-xl bg-[#FFF6E5] px-3 py-2.5 text-sm text-[#8A5A12] ${className}`}>
      You have previously mentioned you only eat veg, but 1 or more items in your bag are non-veg. You can still order them.
    </p>
  );
}
