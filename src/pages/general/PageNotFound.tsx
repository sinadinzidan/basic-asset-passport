import { EmptyStateMessage } from '../../components/general/EmptyStateMessage';
import { PageHeader } from '../../components/general/PageHeader';
import { PageShell } from '../../components/general/PageShell';
import { PAGE_NOT_FOUND_DESCRIPTION, PAGE_NOT_FOUND_TITLE } from '../../constants/labels';

export function PageNotFound() {
  return (
    <PageShell>
      <PageHeader kicker="404" title="Page not found" />
      <EmptyStateMessage title={PAGE_NOT_FOUND_TITLE} description={PAGE_NOT_FOUND_DESCRIPTION} />
    </PageShell>
  );
}
