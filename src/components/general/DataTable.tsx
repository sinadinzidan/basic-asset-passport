import { useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import type { ReactNode } from 'react';

import { revealMotion } from '../../lib/motion';

// Class names are written out in full so Tailwind can see them.
const HIDE_BELOW_CLASSES = { md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' } as const;

export type DataTableColumn<Row> = {
  id: string;
  header: string;
  cell: (row: Row) => ReactNode;
  /** Renders the cell as the row's header cell, so assistive tech announces it with the other cells. */
  isRowHeader?: boolean;
  /** Hides the column (and its header) below this breakpoint. */
  hideBelow?: keyof typeof HIDE_BELOW_CLASSES;
  /** Keeps the header for assistive tech but does not show it. */
  hideHeader?: boolean;
  className?: string;
  headerClassName?: string;
};

type DataTableProps<Row> = {
  caption: string;
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowId: (row: Row) => string;
  /** Makes whole rows clickable; give the primary cell a real button so keyboard users can act too. */
  onRowClick?: (row: Row) => void;
  /** Limits which rows react to clicks (all rows when omitted). */
  isRowClickable?: (row: Row) => boolean;
};

export function DataTable<Row>({ caption, columns, rows, getRowId, onRowClick, isRowClickable = () => true }: DataTableProps<Row>) {
  const reduceMotion = useReducedMotion();

  const cellClasses = (column: DataTableColumn<Row>, extra: string) =>
    [column.hideBelow && HIDE_BELOW_CLASSES[column.hideBelow], extra, column.className].filter(Boolean).join(' ');

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted-background text-xs text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column.id} scope="col" className={[column.hideBelow && HIDE_BELOW_CLASSES[column.hideBelow], 'px-4 py-3 font-medium', column.headerClassName].filter(Boolean).join(' ')}>
                {column.hideHeader ? <span className="sr-only">{column.header}</span> : column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, index) => {
            const isClickable = Boolean(onRowClick) && isRowClickable(row);
            return (
            <m.tr key={getRowId(row)} {...revealMotion(index, reduceMotion)}
              className={isClickable ? 'group cursor-pointer transition-colors hover:bg-muted-background' : undefined}
              onClick={isClickable ? () => onRowClick?.(row) : undefined}>
              {columns.map((column) => column.isRowHeader
                ? <th key={column.id} scope="row" className={cellClasses(column, 'px-4 py-3 font-normal')}>{column.cell(row)}</th>
                : <td key={column.id} className={cellClasses(column, 'px-4 py-3')}>{column.cell(row)}</td>)}
            </m.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
