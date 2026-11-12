import { EmptyStateMessage } from '../../components/general/EmptyStateMessage';
import { PageHeader } from '../../components/general/PageHeader';
import { PageShell } from '../../components/general/PageShell';
import { NO_PERMISSION_DESCRIPTION, NO_PERMISSION_TITLE } from '../../constants/labels';

export function NoPermission() {
  return (
    <PageShell>
      <PageHeader kicker="403" title="No permission" />
      <EmptyStateMessage title={NO_PERMISSION_TITLE} description={NO_PERMISSION_DESCRIPTION} />
    </PageShell>
  );
}
