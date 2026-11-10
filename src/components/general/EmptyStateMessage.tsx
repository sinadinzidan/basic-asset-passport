import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';

type EmptyStateMessageProps = {
  title: string;
  description: string;
};

export function EmptyStateMessage({
  title,
  description,
}: EmptyStateMessageProps) {
  return (
    <EmptyState
      className="w-full max-w-none py-12 [&_[data-slot='empty-state-icon']]:text-brand-strong"
      type="no-results"
    >
      <EmptyStateIcon />
      <EmptyStateTitle className="w-full max-w-none">{title}</EmptyStateTitle>
      <EmptyStateDescription className="w-full max-w-none">
        {description}
      </EmptyStateDescription>
    </EmptyState>
  );
}
