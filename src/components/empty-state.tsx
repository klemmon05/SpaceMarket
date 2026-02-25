interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-[#A0A6B0]">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
