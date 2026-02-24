import { cn } from "@/lib/utils";

type Status = 
  | "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "MATCHED" | "READY_FOR_DEPOSIT"
  | "DEPOSIT_AUTHORIZED" | "RESERVED" | "LAUNCHED" | "COMPLETED" | "CANCELLED"
  | "PUBLISHED" | "PAUSED" | "CLOSED"
  | "AUTHORIZED" | "CAPTURED" | "VOIDED" | "REFUNDED" | "REQUIRES_ACTION"
  | "PENDING" | "VERIFIED";

const statusConfig: Record<Status, { label: string; class: string }> = {
  DRAFT: { label: "DRAFT", class: "border-white/20 text-[#A0A6B0]" },
  SUBMITTED: { label: "SUBMITTED", class: "border-blue-500/40 text-blue-400" },
  UNDER_REVIEW: { label: "UNDER REVIEW", class: "border-amber-500/40 text-amber-400" },
  MATCHED: { label: "MATCHED", class: "border-purple-500/40 text-purple-400" },
  READY_FOR_DEPOSIT: { label: "READY FOR DEPOSIT", class: "border-amber-500/40 text-amber-300" },
  DEPOSIT_AUTHORIZED: { label: "DEPOSIT AUTHORIZED", class: "border-emerald-500/40 text-emerald-400" },
  RESERVED: { label: "RESERVED", class: "border-emerald-500/40 text-emerald-300" },
  LAUNCHED: { label: "LAUNCHED", class: "border-green-500/40 text-green-400" },
  COMPLETED: { label: "COMPLETED", class: "border-green-500/40 text-green-300" },
  CANCELLED: { label: "CANCELLED", class: "border-red-500/30 text-red-400" },
  PUBLISHED: { label: "PUBLISHED", class: "border-emerald-500/40 text-emerald-400" },
  PAUSED: { label: "PAUSED", class: "border-amber-500/40 text-amber-400" },
  CLOSED: { label: "CLOSED", class: "border-white/20 text-[#A0A6B0]" },
  AUTHORIZED: { label: "AUTHORIZED", class: "border-emerald-500/40 text-emerald-400" },
  CAPTURED: { label: "CAPTURED", class: "border-green-500/40 text-green-400" },
  VOIDED: { label: "VOIDED", class: "border-white/20 text-[#A0A6B0]" },
  REFUNDED: { label: "REFUNDED", class: "border-amber-500/40 text-amber-400" },
  REQUIRES_ACTION: { label: "REQUIRES ACTION", class: "border-amber-500/40 text-amber-300" },
  PENDING: { label: "PENDING", class: "border-white/20 text-[#A0A6B0]" },
  VERIFIED: { label: "VERIFIED", class: "border-emerald-500/40 text-emerald-400" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as Status] ?? { label: status, class: "border-white/20 text-[#A0A6B0]" };
  return (
    <span className={cn(
      "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-medium tracking-wider",
      config.class
    )}>
      {config.label}
    </span>
  );
}
