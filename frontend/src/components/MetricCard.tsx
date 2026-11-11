import React from 'react';

export interface MetricCardProps {
  icon: React.ReactNode;
  iconColor?: 'blue' | 'rose' | 'amber' | 'green';
  title?: string;
  label?: string;
  value: string | number;
  note?: string;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onOptionsClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  iconColor = 'green',
  title,
  label,
  value,
  note,
  subtext,
  trend,
  onOptionsClick,
}) => {
  const displayTitle = title || label || '';
  const displayNote = note || subtext || '';

  return (
    <div className="metric">
      <div className="metric-top">
        <div className={`metric-icon ${iconColor}`}>{icon}</div>
        <button
          type="button"
          className="metric-menu"
          title="Options"
          onClick={onOptionsClick}
        >
          •••
        </button>
      </div>
      <div className="metric-title">{displayTitle}</div>
      <div className="metric-value">{value}</div>
      {displayNote && <div className="metric-note">{displayNote}</div>}
      {trend && (
        <div style={{ marginTop: '4px', fontSize: '11px', color: trend.isPositive ? '#27845F' : '#d97706', fontWeight: 600 }}>
          {trend.value}
        </div>
      )}
    </div>
  );
};
