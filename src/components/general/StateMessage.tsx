import { EmptyState, EmptyStateActions, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import type { ComponentProps, ReactNode } from 'react';

type StateMessageProps = {
  type: NonNullable<ComponentProps<typeof EmptyState>['type']>;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
};

export function StateMessage({ type, title, description, action, compact = false }: StateMessageProps) {
  const content = (
    <>
      <EmptyStateIcon />
      <EmptyStateTitle>{title}</EmptyStateTitle>
      {description && <EmptyStateDescription>{description}</EmptyStateDescription>}
      {action && <EmptyStateActions>{action}</EmptyStateActions>}
    </>
  );
  return compact
    ? <EmptyState role="status" variant="compact" type={type} className="mx-auto">{content}</EmptyState>
    : <EmptyState role="status" variant="full" type={type}>{content}</EmptyState>;
}
