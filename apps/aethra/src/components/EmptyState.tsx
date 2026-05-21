type EmptyStateProps = {
  title: string;
  message: string;
  nextAction?: string;
  detail?: string;
};

export function EmptyState({
  title,
  message,
  nextAction,
  detail,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{message}</p>
      {nextAction ? <p>{nextAction}</p> : null}
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}
