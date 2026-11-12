export const ASSET_GRID_CLASS_NAME = [
  'rounded-none bg-muted-background/80',
  "[&_[data-slot='data-grid-header-row']]:border-t-0",
  "[&_[data-slot='data-grid-header-row']]:bg-muted-background/60",
  "[&_[data-slot='data-grid-row']]:cursor-pointer",
  "[&_[data-slot='data-grid-row']]:bg-transparent",
  "[&_[data-slot='data-grid-row']]:transition-colors",
  "[&_[data-slot='data-grid-column-header']:hover]:bg-brand/10",
  "[&_[data-slot='data-grid-row']:hover]:bg-brand/10",
  "[&_[data-slot='data-grid-header-row']_[aria-colindex='5']]:justify-center",
  "[&_[data-slot='data-grid-header-row']_[aria-colindex='5']]:text-center",
].join(' ');
