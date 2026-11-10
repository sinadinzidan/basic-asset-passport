import { Button } from '@cognite/aura/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { IconDots } from '@tabler/icons-react';

import { TooltipTarget } from './TooltipTarget';

interface SeriesMoreMenuProps {
  seriesName: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canShowOnly: boolean;
  canShowAll: boolean;
  onMove: (offset: -1 | 1) => void;
  onShowOnly: () => void;
  onShowAll: () => void;
}

export function SeriesMoreMenu({
  seriesName,
  canMoveUp,
  canMoveDown,
  canShowOnly,
  canShowAll,
  onMove,
  onShowOnly,
  onShowAll,
}: SeriesMoreMenuProps) {
  const label = `More actions for ${seriesName}`;
  return (
    <DropdownMenu>
      <TooltipTarget text="More actions">
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={label} />}>
          <IconDots size={16} aria-hidden />
        </DropdownMenuTrigger>
      </TooltipTarget>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={!canMoveUp} onClick={() => onMove(-1)}>
          Move up
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canMoveDown} onClick={() => onMove(1)}>
          Move down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={!canShowOnly} onClick={onShowOnly}>
          Show only this series
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canShowAll} onClick={onShowAll}>
          Show all series
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
