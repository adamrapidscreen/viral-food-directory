'use client';

interface HalalBadgeProps {
  isHalal: boolean;
  certNumber?: string;
  className?: string;
}

export default function HalalBadge({ isHalal, certNumber, className = '' }: HalalBadgeProps) {
  if (!isHalal) {
    return null;
  }

  const badgeText = certNumber ? '✅ Halal Certified' : '✅ Halal';
  const tooltipText = certNumber ? `Cert: ${certNumber}` : undefined;

  return (
    <span
      className={`inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300 ${className}`}
      title={tooltipText}
    >
      {badgeText}
    </span>
  );
}

