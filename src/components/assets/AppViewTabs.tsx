import { Tabs, TabsList, TabsTrigger } from '@cognite/aura/components/tabs';

import { APP_VIEW_LABELS, AppView, isAppView } from '../../enums/appView';
import { useNavigationState } from '../../hooks/general/useNavigationState';

const APP_VIEWS: readonly AppView[] = [AppView.ASSETS, AppView.THREE_D];

export function AppViewTabs() {
  const activeView =
    useNavigationState((store) => store.navigationState.activeView) ?? AppView.ASSETS;
  const changeAppView = useNavigationState((store) => store.actions.changeAppView);

  function handleValueChange(value: string): void {
    if (isAppView(value)) {
      changeAppView(value);
    }
  }

  return (
    <div className="px-4 pt-4 sm:px-6 lg:px-8">
      <Tabs
        className="mx-auto w-full max-w-[1600px]"
        value={activeView}
        onValueChange={handleValueChange}
      >
        <TabsList aria-label="App views" className="hud-tabbar" size="default">
          {APP_VIEWS.map((view) => (
            <TabsTrigger key={view} value={view}>
              {APP_VIEW_LABELS[view]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
