import type { PropertyDisplay } from '../../types/property';

type PropertyGridProps = {
  properties: PropertyDisplay[];
};

export function PropertyGrid({ properties }: PropertyGridProps) {
  return (
    <dl className="property-grid">
      {properties.map((property) => (
        <div key={property.identifier} className="property-cell">
          <dt className="property-label break-words">{property.label}</dt>
          <dd className="mt-1 min-w-0 break-words whitespace-pre-wrap text-sm font-medium text-base-foreground">
            {property.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
