import { SwitchField } from '../../general/forms/SwitchField';

import { PanelSection } from './PanelSection';

interface DisplayPanelProps {
  showGridlines: boolean;
  showMinMax: boolean;
  isStacked: boolean;
  onGridlinesChange: (isOn: boolean) => void;
  onMinMaxChange: (isOn: boolean) => void;
  onStackedChange: (isOn: boolean) => void;
}

export function DisplayPanel({
  showGridlines,
  showMinMax,
  isStacked,
  onGridlinesChange,
  onMinMaxChange,
  onStackedChange,
}: DisplayPanelProps) {
  return (
    <PanelSection title="Plot">
      <div className="flex flex-col gap-4">
        <SwitchField label="Gridlines" checked={showGridlines} onChange={onGridlinesChange} />
        <SwitchField
          label="Minimum and maximum"
          description="Marks the lowest and highest reading of each series in the visible range."
          checked={showMinMax}
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
