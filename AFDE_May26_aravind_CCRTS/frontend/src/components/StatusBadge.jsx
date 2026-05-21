const STATUS_STYLES = {
  open: 'bg-blue-100 text-blue-700 border-blue-200',
  assigned: 'bg-purple-100 text-purple-700 border-purple-200',
  in_progress: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  pending_customer: 'bg-orange-100 text-orange-700 border-orange-200',
  escalated: 'bg-red-100 text-red-700 border-red-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_LABELS = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  pending_customer: 'Pending Customer',
  escalated: 'Escalated',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
