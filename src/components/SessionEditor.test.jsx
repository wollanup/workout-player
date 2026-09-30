// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Providers } from '../app/Providers.jsx';
import { SessionEditor } from './SessionEditor.jsx';
import { newMusic, newSession } from '../core/model.js';

const youtube = { playlistIds: vi.fn() };
const renderEditor = (session = newSession(), props = {}) => {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(<Providers><SessionEditor session={session} youtube={youtube} onSave={onSave} onClose={onClose} {...props} /></Providers>);
  return { onSave, onClose };
};

afterEach(cleanup);

describe('SessionEditor', () => {
  it('shows the total duration, updated live', async () => {
    renderEditor();
    expect(screen.getByTestId('total')).toHaveTextContent('0:05'); // lead only
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByTestId('total')).toHaveTextContent('0:25');

    const duration = screen.getByLabelText('Durée');
    await userEvent.clear(duration);
    await userEvent.type(duration, '1:00');
    fireEvent.blur(duration);
    expect(screen.getByTestId('total')).toHaveTextContent('1:05');
  });

  it('reports validation errors with a notification instead of alert()', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { onSave } = renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(await screen.findByText('Ajoute au moins une étape.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('saves a valid session', async () => {
    const session = { ...newSession(), name: 'Jambes', steps: [newMusic('yt', { videoId: 'dQw4w9WgXcQ' })] };
    const { onSave } = renderEditor(session);
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jambes' }));
  });

  it('asks for confirmation before leaving with unsaved changes', async () => {
    const { onClose } = renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await userEvent.click(screen.getByRole('button', { name: 'Retour' }));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(await screen.findByRole('button', { name: 'Quitter' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
