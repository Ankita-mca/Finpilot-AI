import React from 'react';
import { InvoiceStatus } from '../types';

export interface StatusBadgeProps {
  status: InvoiceStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const raw = status || '';
  const normUnderscore = raw.toLowerCase().replace(/[\s-]+/g, '_');
  const normHyphen = raw.toLowerCase().replace(/[\s_]+/g, '-');

  return (
    <span className={`status ${normUnderscore} status-badge ${normHyphen}`}>
      {status}
    </span>
  );
};
