import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@cognite/aura/components/dialog';
import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

type GeneralDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'default' | 'large';
};

/**
 * A HUD-styled dialog split into a header, a body and a footer by full-width dividers. The
 * footer is left out when there are no actions. The close button takes the same pill look as
 * the app's other buttons.
 */
export function GeneralDialog({
  isOpen,
  onOpenChange,
  title,
  children,
  footer,
  size = 'default',
}: GeneralDialogProps) {
  const hasFooter = footer !== undefined && footer !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('hud-dialog gap-0', size === 'large' && 'hud-dialog--large')}
        closeButtonClassName="hud-button top-3.5 right-4 opacity-100"
      >
        <div className="hud-dialog__body">
          <DialogHeader className="border-b px-5 py-4 pb-4 pr-14">
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div
            className={cn(
              'text-muted-foreground px-5 py-4 text-base leading-5',
              hasFooter && 'border-b',
            )}
            data-slot="dialog-body"
          >
            {children}
          </div>
          {hasFooter ? (
            <div
              className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end"
              data-slot="dialog-footer"
            >
              {footer}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
