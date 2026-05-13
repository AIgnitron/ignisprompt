type StatusBadgeProps = {
  tone: "ok" | "neutral" | "warning";
  children: React.ReactNode;
};

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return <span className={`status-badge status-badge-${tone}`}>{children}</span>;
}
