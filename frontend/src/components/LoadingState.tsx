import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  message?: string;
  centered?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = '#27845F',
  message,
  centered = false,
}) => {
  const pixelSizes = {
    sm: 16,
    md: 26,
    lg: 40,
  };

  const spinner = (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: `${pixelSizes[size]}px`,
          height: `${pixelSizes[size]}px`,
          border: `3px solid ${color}22`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite',
        }}
      />
      {message && (
        <span style={{ fontSize: '13px', color: '#82918B', fontWeight: 500 }}>
          {message}
        </span>
      )}
    </div>
  );

  if (centered) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          width: '100%',
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '18px',
  borderRadius = '6px',
  style,
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#EAF0EC',
        backgroundImage: 'linear-gradient(90deg, #EAF0EC 0px, #F4F7F5 50%, #EAF0EC 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
};

