export default function Field({ label, hint, ...inputProps }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      <input className="rounded-xl border border-[#e5e7e0] bg-white px-3.5 py-2.5 font-normal outline-none focus:border-[#3f6b3a] focus:ring-2 focus:ring-[#dbead6]" {...inputProps} />
      {hint && <span className="text-xs font-normal text-gray-500">{hint}</span>}
    </label>
  );
}
