import {
  Topbar,
  TopbarBreadcrumbs,
  TopbarLeft,
  TopbarRight,
} from '@cognite/aura/components/topbar';
import type { ReactNode } from 'react';

import { APP_LOGO_ALT_TEXT, APP_LOGO_SOURCE, APP_NAME } from '../../constants/branding';

import { AppLogo } from './AppLogo';
import { ThemeModeToggle } from './ThemeModeToggle';

type AppTopbarProps = {
  breadcrumb?: ReactNode;
};

export function AppTopbar({ breadcrumb }: AppTopbarProps) {
  return (
    <Topbar className="dark app-topbar sticky top-0 z-20 h-14 gap-4 rounded-none px-4 sm:px-6 lg:px-8">
      <TopbarLeft className="flex-1 gap-4 sm:gap-6">
        <AppLogo alt={APP_LOGO_ALT_TEXT} fallbackText={APP_NAME} source={APP_LOGO_SOURCE} />
        {breadcrumb ? (
          <TopbarBreadcrumbs
            aria-label="Breadcrumb"
            className="min-w-0 border-l border-default pl-4 sm:pl-6"
          >
            {breadcrumb}
          </TopbarBreadcrumbs>
        ) : null}
      </TopbarLeft>
      <TopbarRight className="flex-none">
        <ThemeModeToggle />
      </TopbarRight>
    </Topbar>
  );
}
