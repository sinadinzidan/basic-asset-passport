import { Button } from '@cognite/aura/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { IconChevronDown } from '@tabler/icons-react';

import { ReadingKind } from '../../enums/timeSeriesChart';

interface MarkerReadingMenuProperties {
  isInterpolated: boolean;
  onChange: (isInterpolated: boolean) => void;
}

export function MarkerReadingMenu({ isInterpolated, onChange }: MarkerReadingMenuProperties) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            aria-label="Marker readings"
          />
        }
      >
        {isInterpolated ? 'Interpolated' : 'Nearest reading'}
        <IconChevronDown size={14} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuRadioGroup
          value={isInterpolated ? ReadingKind.INTERPOLATED : ReadingKind.NEAREST}
          onValueChange={(value) => onChange(value === ReadingKind.INTERPOLATED)}
        >
          <DropdownMenuRadioItem value={ReadingKind.NEAREST}>Nearest reading</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value={ReadingKind.INTERPOLATED}>
            Interpolated
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
