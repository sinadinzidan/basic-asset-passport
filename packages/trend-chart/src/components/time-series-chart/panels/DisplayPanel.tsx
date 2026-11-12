import { SwitchField } from '../../general/forms/SwitchField';

import { PanelSection } from './PanelSection';

interface DisplayPanelProperties {
  shouldShowGridlines: boolean;
  shouldShowMinMax: boolean;
  isStacked: boolean;
  onGridlinesChange: (isOn: boolean) => void;
  onMinMaxChange: (isOn: boolean) => void;
  onStackedChange: (isOn: boolean) => void;
}

export function DisplayPanel({
  shouldShowGridlines,
  shouldShowMinMax,
  isStacked,
  onGridlinesChange,
  onMinMaxChange,
  onStackedChange,
}: DisplayPanelProperties) {
  return (
    <PanelSection title="Plot">
      <div className="flex flex-col gap-4">
        <SwitchField label="Gridlines" checked={shouldShowGridlines} onChange={onGridlinesChange} />
        <SwitchField
          label="Minimum and maximum"
          description="Marks the lowest and highest reading of each series in the visible range."
          checked={shouldShowMinMax}
          onChange={onMinMaxChange}
        />
        <SwitchField
          label="Stack the series in lanes"
          description="Gives each series its own lane and axis instead of overlaying them."
          checked={isStacked}
          onChange={onStackedChange}
        />
      </div>
    </PanelSection>
  );
}
