interface ExamStatusBadgeProps {
  status: 'draft' | 'pending' | 'approved' | 'rejected';
}

const statusConfig = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  pending: { label: 'Pending', bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  approved: { label: 'Approved', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400' },
  rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
};

export default function ExamStatusBadge({ status }: ExamStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={`inline-flex items-center gap-x-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
