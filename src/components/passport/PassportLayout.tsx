import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@cognite/aura/components/tabs';
import type { ReactNode } from 'react';

import { PASSPORT_TAB_LABELS } from '../../constants/labels';
import { PassportTab } from '../../enums/passportTab';
import { isEnumValue } from '../../lib/enumGuards';

type PassportLayoutProps = {
  hero: ReactNode;
  tabsLabel: string;
  /** The number on the Documents tab; none while it is not known yet. */
  documentsCount?: number;
  activeTab: PassportTab;
  onTabChange: (tab: PassportTab) => void;
  /** A side column beside the tabs; without one the tabs take the full width. */
  aside?: ReactNode;
  directoryNote: string;
  children: ReactNode;
};

/**
 * The frame of every asset page, with or without equipment, so they line up: hero, then the Overview and Documents
 * tabs (optionally beside a summary column), then the footnote.
 */
export function PassportLayout({ hero, tabsLabel, documentsCount, activeTab, onTabChange, aside, directoryNote, children }: PassportLayoutProps) {
  function handleTabChange(value: unknown): void {
    if (isEnumValue(PassportTab, value)) onTabChange(value);
  }

  return (
    <div className="space-y-6">
      {hero}
      <div className={aside ? 'grid gap-6 lg:grid-cols-3' : undefined}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className={aside ? 'min-w-0 space-y-4 lg:col-span-2' : 'min-w-0 space-y-4'}>
          <TabsList aria-label={tabsLabel}>
            <TabsTrigger value={PassportTab.OVERVIEW}>{PASSPORT_TAB_LABELS[PassportTab.OVERVIEW]}</TabsTrigger>
            <TabsTrigger value={PassportTab.DOCUMENTS} badge={documentsCount}>{PASSPORT_TAB_LABELS[PassportTab.DOCUMENTS]}</TabsTrigger>
          </TabsList>
          <TabsPanel value={activeTab} className="space-y-6">{children}</TabsPanel>
        </Tabs>
        {aside && <aside aria-label="Equipment summary" className="min-w-0 space-y-6">{aside}</aside>}
      </div>
      <footer className="text-xs text-muted-foreground">{directoryNote} Read-only view of CDF data · Not an operational or safety system.</footer>
    </div>
  );
}
