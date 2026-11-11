import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  style,
  ...rest
}) => {
  // Base sizing
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '13px', borderRadius: '7px', height: '32px' },
    md: { padding: '9px 16px', fontSize: '14px', borderRadius: '8px', height: '40px' },
    lg: { padding: '12px 22px', fontSize: '15px', borderRadius: '10px', height: '48px' },
  };

  // Variants aligned with FinPilot AI palette: #27845F primary, #EAF4EE secondary
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#27845F',
      color: '#FFFFFF',
      border: '1px solid transparent',
      boxShadow: '0 1px 3px rgba(39, 132, 95, 0.2)',
    },
    secondary: {
      backgroundColor: '#EAF4EE',
      color: '#27845F',
      border: '1px solid #DCEBDD',
    },
    outline: {
      backgroundColor: '#FFFFFF',
      color: '#172B2A',
      border: '1px solid #C9D7CE',
    },
    danger: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      border: '1px solid #fecaca',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#526B5B',
      border: '1px solid transparent',
    },
    link: {
      backgroundColor: 'transparent',
      color: '#27845F',
      border: 'none',
      padding: 0,
      height: 'auto',
      textDecoration: 'none',
    },
  };

  const combinedStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.65 : 1,
    transition: 'all 0.18s ease-in-out',
    width: fullWidth ? '100%' : 'auto',
    fontFamily: 'inherit',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  return (
    <button
      className={`fin-btn fin-btn-${variant} ${className}`}
      style={combinedStyle}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.75s linear infinite',
          }}
        />
      )}
      {!loading && icon && iconPosition === 'left' && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
    </button>
  );
};

