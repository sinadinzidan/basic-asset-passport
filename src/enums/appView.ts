export enum AppView {
  ASSETS = 'ASSETS',
  THREE_D = 'THREE_D',
}

export const APP_VIEW_LABELS: Record<AppView, string> = {
  [AppView.ASSETS]: 'Assets',
  [AppView.THREE_D]: '3D',
};

export function isAppView(value: unknown): value is AppView {
  return value === AppView.ASSETS || value === AppView.THREE_D;
}
