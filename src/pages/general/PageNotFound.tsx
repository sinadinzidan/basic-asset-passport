import { EmptyStateMessage } from '../../components/general/EmptyStateMessage';
import { PageHeader } from '../../components/general/PageHeader';
import { PageShell } from '../../components/general/PageShell';

export function PageNotFound() {
  return (
    <PageShell>
      <PageHeader kicker="404" title="Page not found" />
      <EmptyStateMessage
        title="This page does not exist"
        description="Check the address, or go back to the asset register."
      />
    </PageShell>
  );
}
