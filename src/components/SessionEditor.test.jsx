// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Providers } from '../app/Providers.jsx';
import { SessionEditor } from './SessionEditor.jsx';
import { newMusic, newSession } from '../core/model.js';

const youtube = { playlistIds: vi.fn(), probe: vi.fn(async () => null) };
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

    await userEvent.click(screen.getByRole('button', { name: 'Durée : 0:20' }));
    await userEvent.click(await screen.findByRole('button', { name: '1 min' }));
    expect(screen.getByTestId('total')).toHaveTextContent('0:25'); // not applied until validated
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(screen.getByTestId('total')).toHaveTextContent('1:05');
  });

  it('picks minutes and seconds (10 s steps) with wheels in a modal, cancel keeps the value', async () => {
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await userEvent.click(screen.getByRole('button', { name: 'Durée : 0:20' }));
    fireEvent.keyDown(await screen.findByRole('spinbutton', { name: 'Durée (minutes)' }), { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('spinbutton', { name: 'Durée (secondes)' }), { key: 'ArrowDown' });
    expect(screen.getByTestId('Durée-value')).toHaveTextContent('1:30');
    await userEvent.click(screen.getByText('50'));
    expect(screen.getByTestId('Durée-value')).toHaveTextContent('1:50');

    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByTestId('total')).toHaveTextContent('0:25');

    await userEvent.click(screen.getByRole('button', { name: 'Durée : 0:20' }));
    fireEvent.keyDown(await screen.findByRole('spinbutton', { name: 'Durée (minutes)' }), { key: 'ArrowDown' });
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(screen.getByTestId('total')).toHaveTextContent('1:25');
  });

  it('analyses a new video: "Artiste - Titre" label and track duration', async () => {
    youtube.probe.mockResolvedValueOnce({ title: 'Around the World (Official Video)', author: 'Daft Punk - Topic', duration: 150 });
    renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'YouTube' }));
    const url = screen.getByLabelText('Vidéo');
    await userEvent.type(url, 'https://youtu.be/dQw4w9WgXcQ');
    fireEvent.blur(url);
    expect(await screen.findByDisplayValue('Daft Punk - Around the World')).toBeInTheDocument();
    expect(screen.getByTitle('Durée du morceau')).toHaveTextContent('2:30');
    // Default step is 3:00 > 2:30 of track.
    expect(screen.getByText(/il reprendra au début/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ajuster la durée à 2:30' }));
    expect(screen.queryByText(/il reprendra au début/)).not.toBeInTheDocument();
  });

  it('fills missing track durations on open without marking the session dirty', async () => {
    youtube.probe.mockResolvedValueOnce({ title: 'T', author: 'A', duration: 200 });
    const session = { ...newSession(), steps: [newMusic('yt', { videoId: 'dQw4w9WgXcQ', label: 'Mon titre' })] };
    const { onClose, onSave } = renderEditor(session);
    expect(await screen.findByTitle('Durée du morceau')).toHaveTextContent('3:20');
    expect(screen.getByDisplayValue('Mon titre')).toBeInTheDocument();
    await new Promise(r => setTimeout(r, 600));
    expect(onSave).not.toHaveBeenCalled(); // background analysis is not a user edit
    await userEvent.click(screen.getByRole('button', { name: 'Retour' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('autosaves changes (debounced), without any save button', async () => {
    const { onSave } = renderEditor();
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.lastCall[0].steps).toHaveLength(2);
    expect(screen.getByLabelText('Enregistré')).toBeInTheDocument();
  });

  it('flushes a pending change when leaving', async () => {
    const { onSave } = renderEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    cleanup();
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ steps: [expect.any(Object)] }), { leaving: true });
  });

  it('does not save an untouched session', async () => {
    const { onSave } = renderEditor();
    await new Promise(r => setTimeout(r, 600));
    cleanup();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('launches the current draft', async () => {
    const onPlay = vi.fn();
    const session = { ...newSession(), name: 'Jambes', steps: [newMusic('yt', { videoId: 'dQw4w9WgXcQ' })] };
    renderEditor(session, { onPlay });
    await userEvent.click(screen.getByRole('button', { name: 'Lancer' }));
    expect(onPlay).toHaveBeenCalledWith(expect.objectContaining({ name: 'Jambes' }));
  });
});
