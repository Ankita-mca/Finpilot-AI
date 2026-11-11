import React from 'react';

export interface Column<T> {
  header: React.ReactNode;
  accessor?: keyof T | string;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No records found',
  emptyIcon,
  onRowClick,
  className = '',
}: TableProps<T>) {
  return (
    <div className={`table-wrap ${className}`} style={{ width: '100%', overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  textAlign: col.align || 'left',
                  width: col.width,
                  padding: '12px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: '#84908b',
                  borderBottom: '1px solid #E7ECE9',
                }}
                className={col.className}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '36px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#27845F', fontSize: '14px', fontWeight: 500 }}>
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid #27845F',
                      borderRightColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.75s linear infinite',
                    }}
                  />
                  <span>Loading data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '44px 20px',
                  textAlign: 'center',
                  color: '#82918B',
                }}
              >
                {emptyIcon && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px', color: '#C9D7CE' }}>
                    {emptyIcon}
                  </div>
                )}
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={keyExtractor(row, rowIdx)}
                onClick={() => onRowClick && onRowClick(row)}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  borderBottom: '1px solid #F0F4F2',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FBF9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {columns.map((col, colIdx) => {
                  let cellContent: React.ReactNode = null;
                  if (col.render) {
                    cellContent = col.render(row, rowIdx);
                  } else if (col.accessor) {
                    cellContent = (row as Record<string, unknown>)[col.accessor as string] as React.ReactNode;
                  }

                  return (
                    <td
                      key={colIdx}
                      style={{
                        textAlign: col.align || 'left',
                        padding: '13px 14px',
                        fontSize: '13.5px',
                        color: '#172B2A',
                      }}
                      className={col.className}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

