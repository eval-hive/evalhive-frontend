interface ExamStatusBadgeProps {
  status: 'draft' | 'pending' | 'approved' | 'rejected';
}

const statusConfig = {
  draft: { label: 'Draft', bg: 'bg-background-alt', text: 'text-text-secondary', dot: 'bg-text-secondary' },
  pending: { label: 'Pending', bg: 'bg-brand-gold/10', text: 'text-brand-gold', dot: 'bg-brand-gold' },
  approved: { label: 'Approved', bg: 'bg-brand-emerald/10', text: 'text-brand-emerald', dot: 'bg-brand-emerald' },
  rejected: { label: 'Rejected', bg: 'bg-brand-red/10', text: 'text-brand-red', dot: 'bg-brand-red' },
};

export default function ExamStatusBadge({ status }: ExamStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={`inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-current/10 ${config.bg} ${config.text}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
