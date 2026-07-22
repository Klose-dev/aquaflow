function StatusBadge({ status }) {
  const styles = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    MAINTENANCE: 'bg-yellow-100 text-yellow-800',
    DECOMMISSIONED: 'bg-red-100 text-red-800',
    SUSPENDED: 'bg-red-100 text-red-800',
    UNREAD: 'bg-blue-100 text-blue-800',
    READ: 'bg-gray-100 text-gray-800',
    ARCHIVED: 'bg-gray-100 text-gray-500',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

export default StatusBadge;
