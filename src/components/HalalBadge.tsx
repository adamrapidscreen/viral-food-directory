'use client';

interface HalalBadgeProps {
  isHalal: boolean;
  certNumber?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function HalalBadge({
  isHalal,
  certNumber,
  size = 'md',
}: HalalBadgeProps) {
  if (!isHalal) {
    return null;
  }

  const badgeText = certNumber ? '✅ Halal Certified' : '✅ Halal';
  const tooltipText = certNumber ? `Cert: ${certNumber}` : undefined;

  // Size-based padding classes
  const paddingClasses = {
    sm: 'px-3 py-1',
    md: 'px-4 py-2',
    lg: 'px-5 py-3',
  };

  // Size-based text classes
  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full bg-green-100 font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300 ${paddingClasses[size]} ${textClasses[size]}`}
      title={tooltipText}
    >
      {badgeText}
    </span>
  );
}

