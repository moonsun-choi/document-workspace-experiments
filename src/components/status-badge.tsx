export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "완료"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
      : status === "진행 중"
        ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${tone}`}>{status}</span>;
}
