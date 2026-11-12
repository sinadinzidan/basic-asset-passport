import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import { IconChevronRight } from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';
import type { ReactNode } from 'react';

import { HeadingLevel } from '../../enums/headingLevel';
import { cn } from '../../lib/utils';

interface SectionCardProperties {
  title: string;
  icon?: Icon;
  aside?: ReactNode;
  actions?: ReactNode;
  /** What the figures are, as the first muted line of the content (never in the header, which stays one line). */
  description?: string;
  isFlush?: boolean;
  footer?: ReactNode;
  footerLabel?: string;
  onFooterClick?: () => void;
  titleAs?: HeadingLevel;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Exposed as `data-section`, so a page can find the card (the executive summary panels). */
  section?: string;
}

const HEADING_TAG_BY_LEVEL = {
  [HeadingLevel.H2]: 'h2',
  [HeadingLevel.H3]: 'h3',
} as const;

export function SectionCard({
  title,
  icon: Mark,
  aside,
  actions,
  description,
  isFlush = false,
  footer,
  footerLabel,
  onFooterClick,
  titleAs = HeadingLevel.H2,
  children,
  className,
  contentClassName,
  section,
}: SectionCardProperties) {
  const Heading = HEADING_TAG_BY_LEVEL[titleAs];
  const footerContent =
    footer ??
    (footerLabel && onFooterClick ? (
      <Button variant="ghost" size="sm" onClick={onFooterClick}>
        {footerLabel}
        <IconChevronRight size={16} aria-hidden />
      </Button>
    ) : null);
  return (
    <Card
      className={cn('chart-card flex min-w-0 flex-col gap-0 p-0', className)}
      data-section={section}
    >
      <div className="chart-card__header flex min-h-12 items-center justify-between gap-3 border-b border-border px-4 py-2">
        <Heading className="chart-card__title flex min-w-0 items-center gap-2 text-base font-semibold leading-6 tracking-tight text-foreground">
          {Mark ? <Mark size={16} aria-hidden className="shrink-0 text-muted-foreground" /> : null}
          <span className="truncate">{title}</span>
        </Heading>
        {aside || actions ? (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-2">
            {aside ? (
              <span className="tabular-nums text-xs text-muted-foreground">{aside}</span>
            ) : null}
            {actions}
          </div>
        ) : null}
      </div>
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-3',
          isFlush ? 'p-0' : 'p-4',
          contentClassName,
        )}
      >
        {description ? (
          <p className={cn('text-sm text-muted-foreground', isFlush && 'px-4 pt-3')}>
            {description}
          </p>
        ) : null}
        <div className="min-h-0 w-full min-w-0 flex-1">{children}</div>
      </div>
      {footerContent ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-b-xl border-t border-border bg-muted-background/30 px-4 py-3">
          {footerContent}
        </div>
      ) : null}
    </Card>
  );
}
