import React, { useState } from 'react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = true,
  type = 'text',
  id,
  className = '',
  style,
  ...rest
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto', marginBottom: '16px' }} className="fin-input-group">
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: '#172B2A',
            marginBottom: '6px',
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              color: '#82918B',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          style={{
            width: '100%',
            height: '42px',
            paddingLeft: leftIcon ? '38px' : '14px',
            paddingRight: isPassword || rightIcon ? '40px' : '14px',
            backgroundColor: '#F9FBF9',
            border: `1px solid ${error ? '#dc2626' : '#E7ECE9'}`,
            borderRadius: '8px',
            fontSize: '14px',
            color: '#172B2A',
            outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            fontFamily: 'inherit',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? '#dc2626' : '#27845F';
            e.currentTarget.style.boxShadow = error
              ? '0 0 0 3px rgba(220, 38, 38, 0.12)'
              : '0 0 0 3px rgba(39, 132, 95, 0.12)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? '#dc2626' : '#E7ECE9';
            e.currentTarget.style.boxShadow = 'none';
          }}
          className={`fin-input ${error ? 'fin-input-error' : ''} ${className}`}
          {...rest}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              color: '#82918B',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        ) : rightIcon ? (
          <span
            style={{
              position: 'absolute',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              color: '#82918B',
            }}
          >
            {rightIcon}
          </span>
        ) : null}
      </div>

      {error ? (
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#dc2626' }}>{error}</p>
      ) : helperText ? (
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#82918B' }}>{helperText}</p>
      ) : null}
    </div>
  );
});

InputField.displayName = 'InputField';

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ label: string; value: string | number }>;
  fullWidth?: boolean;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(({
  label,
  error,
  helperText,
  options = [],
  children,
  fullWidth = true,
  id,
  className = '',
  style,
  ...rest
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ width: fullWidth ? '100%' : 'auto', marginBottom: '16px' }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: '#172B2A',
            marginBottom: '6px',
          }}
        >
          {label}
        </label>
      )}

      <select
        ref={ref}
        id={selectId}
        style={{
          width: '100%',
          height: '42px',
          padding: '0 14px',
          backgroundColor: '#F9FBF9',
          border: `1px solid ${error ? '#dc2626' : '#E7ECE9'}`,
          borderRadius: '8px',
          fontSize: '14px',
          color: '#172B2A',
          outline: 'none',
          fontFamily: 'inherit',
          cursor: 'pointer',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? '#dc2626' : '#27845F';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#dc2626' : '#E7ECE9';
        }}
        className={`fin-select ${className}`}
        {...rest}
      >
        {options.length > 0
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>

      {error ? (
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#dc2626' }}>{error}</p>
      ) : helperText ? (
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#82918B' }}>{helperText}</p>
      ) : null}
    </div>
  );
});

SelectField.displayName = 'SelectField';

