import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { Text } from '@mantine/core';
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react';

/** Promise-based confirm dialog (replaces window.confirm). */
export function confirm({ title, message, confirmLabel = 'Confirmer', danger = false }) {
  return new Promise(resolve => {
    modals.openConfirmModal({
      title,
      centered: true,
      children: message ? <Text size="sm">{message}</Text> : null,
      labels: { confirm: confirmLabel, cancel: 'Annuler' },
      confirmProps: danger ? { color: 'red' } : {},
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
      onClose: () => resolve(false),
    });
  });
}

export function notifyError(message, title = 'Erreur') {
  notifications.show({ title, message, color: 'red', icon: <IconAlertTriangle size={18} /> });
}

export function notifySuccess(message) {
  notifications.show({ message, color: 'green', icon: <IconCheck size={18} />, autoClose: 2500 });
}
