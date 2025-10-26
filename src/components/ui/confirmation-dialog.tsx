'use client';

import { Button, Stack } from '@chakra-ui/react';
import { Dialog } from '@chakra-ui/react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger';
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning'
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner display="flex" alignItems="center" justifyContent="center">
        <Dialog.Content p={3}>
          <Dialog.Header>
            <Dialog.Title pt={3}>{title}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body py={3}>
            <p>{message}</p>
          </Dialog.Body>
          <Dialog.Footer>
            <Stack direction="row" gap="3">
              <Button p={3} variant="outline" onClick={onClose}>
                {cancelText}
              </Button>
              <Button
                p={3}
                colorPalette={variant === 'danger' ? 'red' : 'orange'}
                onClick={handleConfirm}
              >
                {confirmText}
              </Button>
            </Stack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
