interface StatusBadgeProps {
  status: 'urgent' | 'medium' | 'low' | 'completed' | 'pending' | 'active' | 'inactive' | 'sufficient' | 'critical';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    urgent: 'bg-red-50 text-red-700 border-red-200',
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-amber-50 text-amber-700 border-amber-200',
    sufficient: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-gray-50 text-gray-700 border-gray-200',
    pending: 'bg-blue-50 text-blue-700 border-blue-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  const text = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${styles[status] || styles.pending}`}>
      {text}
    </span>
  );
}
