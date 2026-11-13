import { useState, type ReactNode } from 'react';

import { GeneralButton } from './GeneralButton';
import { GeneralDialog } from './GeneralDialog';

type ConfirmDeleteDialogProps = {
  isOpen: boolean;
  title: string;
  confirmLabel: string;
  children: ReactNode;
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

export function ConfirmDeleteDialog({
  isOpen,
  title,
  confirmLabel,
  children,
  onConfirm,
  onClose,
}: ConfirmDeleteDialogProps) {
  const [isDeleteRunning, setIsDeleteRunning] = useState(false);

  async function runDelete(): Promise<void> {
    setIsDeleteRunning(true);

    try {
      await onConfirm();
    } finally {
      setIsDeleteRunning(false);
      onClose();
    }
  }
  function handleConfirmClick(): void {
    void runDelete();
  }
  function handleOpenChange(isNextOpen: boolean): void {
    if (!isNextOpen && !isDeleteRunning) onClose();
  }

  return (
    <GeneralDialog
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={title}
      footer={
        <>
          <GeneralButton disabled={isDeleteRunning} onClick={onClose} variant="outline">
            Cancel
          </GeneralButton>
          <GeneralButton
            disabled={isDeleteRunning}
            onClick={handleConfirmClick}
            variant="destructive"
          >
            {isDeleteRunning ? 'Deleting...' : confirmLabel}
          </GeneralButton>
        </>
      }
    >
      {children}
    </GeneralDialog>
  );
}
