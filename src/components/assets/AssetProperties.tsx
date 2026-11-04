import type { AssetPropertyDisplay } from '../../types/asset';

type AssetPropertiesProps = {
  properties: AssetPropertyDisplay[];
};

export function AssetProperties({ properties }: AssetPropertiesProps) {
  return (
    <dl className="grid gap-x-8 border-t border-default md:grid-cols-2">
      {properties.map((property) => (
        <div
          key={property.identifier}
          className="grid min-w-0 gap-1 border-b border-default px-2 py-3 transition-colors hover:bg-muted-background/60 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4"
        >
          <dt className="break-words text-sm text-muted-foreground">
            {property.label}
          </dt>
          <dd className="min-w-0 break-words whitespace-pre-wrap text-sm font-medium text-base-foreground">
            {property.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
