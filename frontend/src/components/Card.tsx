import React from 'react';

export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  padding?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  children,
  footer,
  padding,
  className = '',
  style,
}) => {
  const hasHeader = Boolean(title || subtitle || actions);

  return (
    <div
      className={`panel ${className}`}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E7ECE9',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(18, 59, 60, 0.04)',
        padding: padding !== undefined ? padding : undefined,
        ...style,
      }}
    >
      {hasHeader && (
        <div
          className="panel-head"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            gap: '12px',
          }}
        >
          <div>
            {title && (
              <h3
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#172B2A',
                  letterSpacing: '-0.2px',
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: '12px',
                  color: '#82918B',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{actions}</div>}
        </div>
      )}

      <div className="panel-body">{children}</div>

      {footer && (
        <div
          className="panel-footer"
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #E7ECE9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

