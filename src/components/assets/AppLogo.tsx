import { useState } from 'react';

type AppLogoProps = {
  source: string;
  alt: string;
  fallbackText: string;
};

export function AppLogo({ source, alt, fallbackText }: AppLogoProps) {
  const [hasFailed, setHasFailed] = useState(false);

  if (hasFailed) {
    return (
      <span className="shrink-0 text-base font-semibold text-base-foreground">
        {fallbackText}
      </span>
    );
  }

  return (
    <img
      alt={alt}
      className="h-6 w-24 shrink-0 object-contain object-left sm:h-7 sm:w-28"
      src={source}
      onError={() => setHasFailed(true)}
    />
  );
}
