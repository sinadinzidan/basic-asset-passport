import { EmptyStateMessage } from '../../components/general/EmptyStateMessage';
import { PageHeader } from '../../components/general/PageHeader';
import { PageShell } from '../../components/general/PageShell';

export function NoPermission() {
  return (
    <PageShell>
      <PageHeader kicker="403" title="No permission" />
      <EmptyStateMessage
        title="You cannot view this page"
        description="Ask your project administrator for access to the data this page needs."
      />
    </PageShell>
  );
}
