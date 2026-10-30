import { BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@cognite/aura/components/breadcrumb';
import { Topbar, TopbarBreadcrumbs, TopbarIcon, TopbarLeft, TopbarMetadata, TopbarRight, TopbarThemeSwitcher } from '@cognite/aura/components/topbar';
import { IconId } from '@tabler/icons-react';

import { THEME_MODE_BY_TOPBAR_THEME, TOPBAR_THEME_BY_MODE } from '../../constants/theme';
import type { ThemeMode } from '../../enums/themeMode';

type AppTopbarProps = {
  assetName?: string;
  onHome: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
};

export function AppTopbar({ assetName, onHome, theme, onThemeChange }: AppTopbarProps) {
  return (
    <Topbar>
      <TopbarLeft>
        <TopbarIcon><IconId aria-hidden /></TopbarIcon>
        <TopbarBreadcrumbs aria-label="Breadcrumb" className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            <BreadcrumbItem>
              {assetName
                ? <BreadcrumbLink render={<button type="button" onClick={onHome} />}>Asset Passport</BreadcrumbLink>
                : <BreadcrumbPage>Asset Passport</BreadcrumbPage>}
            </BreadcrumbItem>
            {assetName && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem className="min-w-0"><BreadcrumbPage className="truncate">{assetName}</BreadcrumbPage></BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </TopbarBreadcrumbs>
        <TopbarMetadata className="hidden whitespace-nowrap sm:inline">Read-only</TopbarMetadata>
      </TopbarLeft>
      <TopbarRight>
        <TopbarThemeSwitcher theme={TOPBAR_THEME_BY_MODE[theme]} onThemeChange={(topbarTheme) => onThemeChange(THEME_MODE_BY_TOPBAR_THEME[topbarTheme])} />
      </TopbarRight>
    </Topbar>
  );
}
