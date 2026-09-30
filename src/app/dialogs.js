const OPEN = '[role="dialog"][aria-modal="true"]';

export const dialogOpen = () => !!document.querySelector(OPEN);

/** Closes the open dialog (picker, menu modal, confirmation) like Escape would. */
export function closeDialog() {
  const dialog = document.querySelector(OPEN);
  if (!dialog) return;
  const target = dialog.contains(document.activeElement) ? document.activeElement : dialog;
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
}
