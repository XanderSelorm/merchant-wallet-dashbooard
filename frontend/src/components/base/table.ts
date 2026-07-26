export interface Column<Row> {
  key: string
  label: string
  /** Right-align numeric columns. */
  align?: 'left' | 'right'
  /** Hide below the given breakpoint to keep small screens readable. */
  hideBelow?: 'sm' | 'md' | 'lg'
  /** Plain-text cell renderer; omit when using a `cell:<key>` slot. */
  cell?: (row: Row) => string
}
