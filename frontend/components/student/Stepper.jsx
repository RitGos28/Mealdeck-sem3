// The −/quantity/+ control, used on menu rows and in the bag.
export default function Stepper({ name, quantity, onChange, size = "md" }) {
  const button = size === "sm" ? "size-9 text-base" : "size-10 text-lg";
  return (
    <div className="flex shrink-0 items-center rounded-full border border-deck text-deck">
      <button type="button" className={`${button} rounded-full hover:bg-mint`} onClick={() => onChange(-1)} aria-label={`Remove one ${name}`}>−</button>
      <span className="min-w-5 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
      <button type="button" className={`${button} rounded-full hover:bg-mint`} onClick={() => onChange(1)} aria-label={`Add one ${name}`}>+</button>
    </div>
  );
}
