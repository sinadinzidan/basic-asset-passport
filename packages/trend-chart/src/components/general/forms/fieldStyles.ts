/**
 * The field chrome, written out so each form component carries it itself instead of relying on
 * a global stylesheet to restyle Aura's inputs: 36px high, 0.375rem radius, a 1px ink border on a transparent face and a hard
 * 3px ledge underneath (no blur). Tokens: `input` is the field fill, `ring` the focus ring, `destructive` the error; the ink is
 * the foreground colour at 45% (30% in dark) and the ledge the same ink at 40% (22% in dark). A disabled field keeps its ledge:
 * `:read-only` also matches a disabled input, so the read-only look is applied to enabled fields only.
 */
const FIELD_CHROME =
  'rounded-md border border-foreground/45 bg-transparent shadow-[0_3px_0_0_color-mix(in_srgb,var(--foreground)_40%,transparent)] ' +
  'transition-[color,background-color,border-color,box-shadow,transform] outline-none ' +
  'hover:bg-muted-background/60 focus-visible:ring-2 focus-visible:ring-ring/40 ' +
  'enabled:read-only:cursor-default enabled:read-only:bg-input/20 enabled:read-only:shadow-none enabled:read-only:hover:bg-input/20 ' +
  'disabled:cursor-not-allowed disabled:bg-muted-background disabled:text-muted-foreground disabled:opacity-100 disabled:hover:bg-muted-background ' +
  'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 ' +
  'dark:border-foreground/30 dark:bg-input/30 dark:disabled:bg-foreground/10 dark:shadow-[0_3px_0_0_color-mix(in_srgb,var(--foreground)_22%,transparent)] dark:hover:bg-input/50';

export const FIELD_CONTROL_CLASSES =
  `${FIELD_CHROME} h-9 w-full min-w-0 px-2.5 py-1 text-sm font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground ` +
  'file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground';

export const TEXTAREA_CONTROL_CLASSES = `${FIELD_CHROME} field-sizing-content min-h-16 w-full min-w-0 resize-none px-2.5 py-2 text-sm font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground`;

/*
 * Aura's own select, checkbox, radio and switch bring base classes with hover, filled, open and checked states that twMerge
 * cannot override (arbitrary variants, data-state variants), so the properties that decide the look are marked important here.
 */

export const SELECT_TRIGGER_CLASSES =
  'h-9 min-w-0 max-w-none cursor-pointer gap-1.5 rounded-md py-2 pr-2 pl-2.5 text-sm font-semibold whitespace-nowrap ' +
  'border-foreground/45! bg-transparent! text-foreground! shadow-[0_3px_0_0_color-mix(in_srgb,var(--foreground)_40%,transparent)]! ' +
  'transition-[color,background-color,border-color,box-shadow,transform] ' +
  'hover:bg-muted-background/60! hover:border-foreground/45! focus-visible:border-foreground/45! focus-visible:bg-transparent! focus-visible:ring-2 focus-visible:ring-ring/40 ' +
  'data-popup-open:border-foreground/45! data-popup-open:bg-transparent! data-popup-open:ring-2 data-popup-open:ring-ring/40 ' +
  'active:translate-y-[2px] active:shadow-[0_1px_0_0_color-mix(in_srgb,var(--foreground)_40%,transparent)]! ' +
  'data-placeholder:font-normal data-placeholder:text-muted-foreground ' +
  'aria-invalid:border-destructive! aria-invalid:ring-2 aria-invalid:ring-destructive/20 ' +
  'disabled:cursor-not-allowed disabled:bg-muted-background! disabled:text-muted-foreground disabled:text-muted-foreground! disabled:**:text-muted-foreground! disabled:opacity-100! dark:disabled:bg-foreground/10! dark:disabled:text-muted-foreground! ' +
  'dark:border-foreground/30! dark:bg-input/30! dark:shadow-[0_3px_0_0_color-mix(in_srgb,var(--foreground)_22%,transparent)]! dark:hover:bg-input/50! dark:hover:border-foreground/30! ' +
  'dark:active:shadow-[0_1px_0_0_color-mix(in_srgb,var(--foreground)_22%,transparent)]! dark:aria-invalid:border-destructive!';

export const SELECT_CONTENT_CLASSES = 'rounded-lg border-0 bg-popover-background shadow-md ring-1 ring-foreground/10';

export const SELECT_ITEM_CLASSES = 'min-h-0 rounded-md py-1 pr-8 pl-1.5 text-sm focus:bg-accent-background';

export const CHECKBOX_CONTROL_CLASSES =
  'size-4 rounded-[4px] border! border-input! bg-transparent! shadow-none ' +
  'data-checked:border-primary! data-checked:bg-primary! data-indeterminate:border-primary! data-indeterminate:bg-primary! ' +
  'focus-visible:border-ring! focus-visible:ring-3 focus-visible:ring-ring/50 ' +
  'aria-invalid:border-destructive! aria-invalid:ring-3 aria-invalid:ring-destructive/20 ' +
  'dark:bg-input/30! dark:data-checked:bg-primary! dark:data-indeterminate:bg-primary!';

export const SWITCH_CLASSES =
  'h-[1.15rem] w-8 rounded-full! border border-transparent p-0 bg-[color-mix(in_srgb,var(--foreground)_30%,transparent)]! shadow-none ' +
  'data-checked:bg-primary! hover:bg-[color-mix(in_srgb,var(--foreground)_38%,transparent)]! data-checked:hover:bg-primary! ' +
  'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'dark:bg-[color-mix(in_srgb,var(--foreground)_35%,transparent)]! dark:data-checked:bg-primary! ' +
  '[&_[data-slot=switch-thumb]]:size-4 [&_[data-slot=switch-thumb]]:rounded-full [&_[data-slot=switch-thumb]]:bg-background [&_[data-slot=switch-thumb]]:translate-x-0 [&_[data-slot=switch-thumb][data-checked]]:translate-x-[14px]';
