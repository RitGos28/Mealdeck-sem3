export const STATUS_LABELS = {
  PLACED: "Placed",
  ACCEPTED: "Accepted",
  READY: "Ready for pickup",
  COMPLETED: "Picked up",
  NO_SHOW: "No-show",
  CANCELLED: "Cancelled",
};

export const STATUS_STYLES = {
  PLACED: "bg-[#eef1ea] text-[#4a5445]",
  ACCEPTED: "bg-[#e3ecf7] text-[#2f5580]",
  READY: "bg-[#dbead6] text-[#3f6b3a]",
  COMPLETED: "bg-[#f0f0ee] text-gray-500",
  NO_SHOW: "bg-[#fbe9e7] text-[#9a4a3f]",
  CANCELLED: "bg-[#f0f0ee] text-gray-500",
};

export const FINAL_STATUSES = ["COMPLETED", "NO_SHOW", "CANCELLED"];

export function StatusBadge({ status }) {
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status] ?? status}</span>;
}
